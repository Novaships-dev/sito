// L'adaptateur Supabase du service « atelier » : les tables (PostgREST) et le
// stockage, derrière une seule porte.
//
// Pourquoi un adaptateur : le service ne parle à Supabase que par ici. Les
// essais le remplacent par un faux serveur HTTP local (scripts/essai-service.mjs),
// donc ils tournent sans réseau et sans clé — la CI n'en a pas.
//
// Règles tenues ici (app/specs/02-TRD.md §1 et §7, .claude/skills/sito-service) :
//   - la clé secrète voyage dans l'en-tête `apikey`, **jamais** en
//     `Authorization: Bearer` (doc Supabase des clés `sb_secret_`) ;
//   - rien qui ressemble à une clé n'est écrit ni renvoyé, même dans une
//     erreur : le message d'erreur ne porte que la méthode, le chemin, le code
//     HTTP et ce que Supabase a répondu ;
//   - une réponse HTTP ≥ 300 lève `ErreurSupabase` ; aucun appel ne rend
//     silencieusement une liste vide ;
//   - une écriture rejouée n'écrit pas deux fois (`poser`, `insererSiAbsent`).
//
// Usage :
//   import { supabase, depuisEnv } from '../atelier/supabase.mjs';
//   const sb = depuisEnv();                       // lit le .env (code 3 si absent)
//   const sb = supabase({ url, cle, fetch });     // pour les essais
import { exiger } from '../scripts/env.mjs';

export class ErreurSupabase extends Error {
  constructor({ methode, chemin, statut, reponse }) {
    super(`Supabase ${methode} ${chemin} : HTTP ${statut}${reponse ? ` — ${reponse}` : ''}`);
    this.name = 'ErreurSupabase';
    this.statut = statut;
  }
}

// Les filtres PostgREST acceptés, écrits en clair pour qu'un appel se relise :
//   { siren: ['eq', '480423623'], etat: ['in', ['recue', 'prete']] }
const OPERATEURS = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'not.is', 'in']);

function requete({ select, filtres = {}, ordre, limite }) {
  const p = new URLSearchParams();
  if (select) p.set('select', select);
  for (const [colonne, [op, valeur]] of Object.entries(filtres)) {
    if (!OPERATEURS.has(op)) throw new Error(`filtre inconnu : ${op}`);
    p.append(colonne, op === 'in' ? `in.(${valeur.map((v) => `"${v}"`).join(',')})` : `${op}.${valeur}`);
  }
  if (ordre) p.set('order', ordre);
  if (limite !== undefined) p.set('limit', String(limite));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function supabase({ url, cle, fetch: f = fetch }) {
  if (!url || !cle) throw new Error('adaptateur Supabase : url et clé sont obligatoires');
  const base = url.replace(/\/$/, '');

  // Le seul endroit qui pose les en-têtes. `apikey` et rien d'autre.
  async function appel(methode, chemin, { corps, type, prefer, entetes: ajouts, brut = false } = {}) {
    const entetes = { apikey: cle };
    if (ajouts) Object.assign(entetes, ajouts);
    if (prefer) entetes.prefer = prefer;
    if (corps !== undefined) entetes['content-type'] = type || 'application/json';
    const r = await f(base + chemin, {
      method: methode,
      headers: entetes,
      body: corps === undefined ? undefined : (Buffer.isBuffer(corps) || typeof corps === 'string' ? corps : JSON.stringify(corps)),
    });
    if (!r.ok) {
      // Ce que Supabase a répondu, borné : un corps d'erreur n'est pas un roman.
      const texte = (await r.text().catch(() => '')).slice(0, 300);
      throw new ErreurSupabase({ methode, chemin, statut: r.status, reponse: texte });
    }
    if (brut) return Buffer.from(await r.arrayBuffer());
    const texte = await r.text();
    if (!texte) return null;
    try { return JSON.parse(texte); } catch { return texte; }
  }

  const table = (nom) => {
    if (!/^[a-z_][a-z0-9_]*$/.test(nom)) throw new Error(`nom de table invalide : ${nom}`);
    return `/rest/v1/${nom}`;
  };

  return {
    // -------------------------------------------------------------- tables
    // Les lignes demandées, toujours un tableau.
    async lire(nom, options = {}) {
      const lignes = await appel('GET', table(nom) + requete(options));
      return Array.isArray(lignes) ? lignes : (lignes ? [lignes] : []);
    },

    // Une ligne, ou null. Deux lignes trouvées : c'est une faute, pas un choix.
    async lireUne(nom, options = {}) {
      const lignes = await appel('GET', table(nom) + requete({ ...options, limite: 2 }));
      if (lignes.length > 1) throw new Error(`lireUne(${nom}) : ${lignes.length} lignes correspondent`);
      return lignes[0] ?? null;
    },

    // Insère et rend les lignes écrites (avec leurs valeurs par défaut).
    async inserer(nom, lignes) {
      const ecrites = await appel('POST', table(nom) + '?select=*', { corps: lignes, prefer: 'return=representation' });
      return Array.isArray(ecrites) ? ecrites : [ecrites];
    },

    // Rejeu : une ligne déjà présente (même clé) ne lève rien et n'écrit rien.
    // Pour les webhooks (`evenements_stripe`) et tout ce qui peut repasser.
    async insererSiAbsent(nom, lignes) {
      await appel('POST', table(nom), { corps: lignes, prefer: 'resolution=ignore-duplicates,return=minimal' });
    },

    // Upsert : écrit ou met à jour selon les colonnes de `surConflit`.
    async poser(nom, lignes, { surConflit }) {
      if (!surConflit) throw new Error('poser() : surConflit est obligatoire (quelles colonnes font la clé)');
      await appel('POST', `${table(nom)}?on_conflict=${encodeURIComponent(surConflit)}`, {
        corps: lignes, prefer: 'resolution=merge-duplicates,return=minimal',
      });
    },

    // Met à jour les lignes qui passent les filtres, et rend celles écrites :
    // zéro ligne rendue est une information, pas une réussite silencieuse.
    async majorer(nom, filtres, champs) {
      if (!Object.keys(filtres).length) throw new Error('majorer() : au moins un filtre (jamais toute la table)');
      const ecrites = await appel('PATCH', table(nom) + requete({ filtres, select: '*' }), {
        corps: champs, prefer: 'return=representation',
      });
      return Array.isArray(ecrites) ? ecrites : (ecrites ? [ecrites] : []);
    },

    // Efface les lignes qui passent les filtres et rend celles effacées. Comme
    // majorer(), jamais sans filtre (T12).
    async effacer(nom, filtres) {
      if (!Object.keys(filtres).length) throw new Error('effacer() : au moins un filtre (jamais toute la table)');
      const parties = await appel('DELETE', table(nom) + requete({ filtres, select: '*' }), { prefer: 'return=representation' });
      return Array.isArray(parties) ? parties : (parties ? [parties] : []);
    },

    // Les comptes (API d'administration de Supabase Auth, clé de service).
    auth: {
      // Efface un compte. Supabase efface avec lui ce qui s'y rattache
      // (`membres`, `suppressions`, `invitations` : ON DELETE CASCADE).
      // Un compte déjà effacé (404) n'est pas une faute : une reprise repasse.
      async supprimer(id) {
        if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error(`identifiant de compte invalide : ${id}`);
        try { await appel('DELETE', `/auth/v1/admin/users/${id}`); return true; }
        catch (e) { if (e.statut === 404) return false; throw e; }
      },
    },

    // Une fonction SQL (prive.jour_paris, par exemple).
    async fonction(nom, args = {}) {
      return appel('POST', `/rest/v1/rpc/${encodeURIComponent(nom)}`, { corps: args });
    },

    // ------------------------------------------------------------ stockage
    stockage(espace) {
      if (!/^[a-z0-9-]+$/.test(espace)) throw new Error(`espace de stockage invalide : ${espace}`);
      const objet = (chemin) => `/storage/v1/object/${espace}/${chemin.split('/').map(encodeURIComponent).join('/')}`;
      return {
        // Les octets du fichier, tels quels.
        lire: (chemin) => appel('GET', objet(chemin), { brut: true }),

        // Écrit. `remplacer: false` (défaut) : un fichier déjà là n'est pas
        // écrasé, Supabase répond 409 et l'erreur le dit. `remplacer: true`
        // passe par `x-upsert`, qui écrit que le fichier existe ou non — un
        // PUT sur un chemin neuf, lui, serait refusé.
        async ecrire(chemin, octets, { type = 'application/octet-stream', remplacer = false } = {}) {
          await appel('POST', objet(chemin), { corps: octets, type, entetes: remplacer ? { 'x-upsert': 'true' } : undefined });
        },

        supprimer: (chemins) => appel('DELETE', `/storage/v1/object/${espace}`, { corps: { prefixes: chemins } }),

        // Tous les fichiers sous un dossier, sous-dossiers compris. L'API de
        // Supabase ne liste qu'un niveau à la fois : une entrée sans `id` est
        // un dossier, qu'on parcourt à son tour (T12).
        async lister(dossier) {
          const trouves = [];
          const parcourir = async (d) => {
            for (let debut = 0; ; debut += 1000) {
              const r = await appel('POST', `/storage/v1/object/list/${espace}`, { corps: { prefix: d, limit: 1000, offset: debut } }) || [];
              for (const e of r) {
                const chemin = d ? `${d.replace(/\/$/, '')}/${e.name}` : e.name;
                if (e.id) trouves.push(chemin); else await parcourir(chemin);
              }
              if (r.length < 1000) break;
            }
          };
          await parcourir(dossier);
          return trouves;
        },

        // Une adresse signée, pour montrer un fichier sans ouvrir l'espace.
        async urlSignee(chemin, secondes = 3600) {
          const r = await appel('POST', `/storage/v1/object/sign/${espace}/${chemin.split('/').map(encodeURIComponent).join('/')}`, { corps: { expiresIn: secondes } });
          return base + (r?.signedURL || r?.signedUrl || '');
        },
      };
    },
  };
}

// Le service en vrai : les valeurs viennent du .env, jamais d'un défaut inventé.
export function depuisEnv() {
  const e = exiger(['SUPABASE_URL', 'SUPABASE_CLE_SERVICE'], 'parler à la base depuis le service atelier');
  return supabase({ url: e.SUPABASE_URL, cle: e.SUPABASE_CLE_SERVICE });
}

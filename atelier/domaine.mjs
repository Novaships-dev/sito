#!/usr/bin/env node
// Le nom de domaine d'un artisan, par une commande de Fabrice (T63, décision
// du 5 nov. 2026 : « les nom de domaine faut les garder c'est important mais
// pareil faut faire au plus simple »). Plus d'écran dans l'app : Fabrice
// cherche, achète ou branche, puis vérifie, depuis son PC.
//
//   node atelier/domaine.mjs --siren 480423623 --chercher facades-martin.fr
//   node atelier/domaine.mjs --siren 480423623 --acheter facades-martin.fr --prenom Jeanne --nom Martin
//   node atelier/domaine.mjs --siren 480423623 --brancher mon-ancien-site.fr
//   node atelier/domaine.mjs --siren 480423623 --verifier facades-martin.fr
//
// Les règles restent celles du service (`supabase/functions/_shared/domaines.mjs`,
// essayées par `scripts/essai-domaines.mjs`) : .fr ou .com, acheté au nom de
// l'artisan (prénom et nom de la personne qui représente l'entreprise),
// seulement quand l'abonnement est payé (`actif`, jamais pendant les mois
// offerts : Q9), un seul domaine acheté par site ; l'adresse servie est
// www.<domaine>, le domaine nu y est redirigé.
//
// Il faut, dans .env : SUPABASE_URL, SUPABASE_CLE_SERVICE, GANDI_JETON,
// GANDI_BAC_A_SABLE (« false » pour un vrai achat), CLOUDFLARE_ZONE_ID,
// CLOUDFLARE_JETON_API, SITO_CIBLE_CNAME. Un achat réel coûte : action F8.
import { pathToFileURL } from 'node:url';
import { traiter } from '../supabase/functions/_shared/domaines.mjs';
import { clientGandi } from '../supabase/functions/_shared/gandi.mjs';
import { clientSaas } from '../supabase/functions/_shared/cloudflare-saas.mjs';

// Le dépôt de `traiter`, sur la table `adresses` (clé de service).
export function depotSupabase(sb) {
  return {
    adresses: (siteId) => sb.lire('adresses', { select: 'hote,genre,principale,etat,motif,cloudflare_id', filtres: { site_id: ['eq', siteId] } }),
    async hoteAilleurs(hote, siteId) {
      const l = await sb.lire('adresses', { select: 'site_id', filtres: { hote: ['eq', hote], site_id: ['neq', siteId], etat: ['neq', 'retiree'] }, limite: 1 });
      return l.length > 0;
    },
    ajouter: (ligne) => sb.inserer('adresses', [ligne]),
    maj: (siteId, hote, colonnes) => sb.majorer('adresses', { site_id: ['eq', siteId], hote: ['eq', hote] }, colonnes),
  };
}

// Ce que `traiter` doit savoir de l'entreprise, lu dans la base.
export async function contexte(sb, siren) {
  if (!/^\d{9}$/.test(String(siren || ''))) throw new Error('Le SIREN fait neuf chiffres.');
  const f = { siren: ['eq', siren] };
  const [sites, abonnement, entreprise, profil, membre] = await Promise.all([
    sb.lire('sites', { select: 'id', filtres: f, ordre: 'cree_le.asc', limite: 1 }),
    sb.lireUne('abonnements', { select: 'etat', filtres: f }),
    sb.lireUne('entreprises', { select: 'siren,denomination,forme_juridique,adresse,code_postal,commune', filtres: f }),
    sb.lireUne('profils', { select: 'telephone,courriel', filtres: f }),
    sb.lire('membres', { select: 'user_id', filtres: f, limite: 1 }),
  ]);
  if (!entreprise) throw new Error(`Entreprise ${siren} absente de la base : créer d'abord son compte (atelier/comptes.mjs).`);
  // L'achat garde une trace de qui l'a confirmé : ici, Fabrice, pour le compte
  // de l'artisan titulaire de l'entreprise.
  return { userId: `fabrice-pour-${membre[0]?.user_id || siren}`, courriel: profil?.courriel || null, site: sites[0] || null, abonnement, entreprise, profil };
}

export async function lancer({ sb, siren, action, nom, representant, gandi, saas, cible }) {
  const ctx = await contexte(sb, siren);
  return traiter({ action, nom, representant, ctx, depot: depotSupabase(sb), gandi, saas, reglages: { cible } });
}

export function dire(action, r) {
  if (!r.ok) return `Refusé : ${r.erreur}`;
  if (action === 'chercher') return r.disponible ? `${r.hote} est libre.` : `${r.hote} : ${r.motif}`;
  const a = r.adresse;
  const lignes = [`${a.hote} : ${a.etat === 'active' ? 'active' : a.etat === 'echec' ? 'en échec' : 'en cours de mise en place'}${a.motif ? ` (${a.motif})` : ''}`];
  if (r.cname) lignes.push(`À poser chez le registraire de l'artisan : un enregistrement CNAME « ${r.cname.nom} » vers « ${r.cname.valeur} ».`);
  return lignes.join('\n');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { depuisEnv } = await import('./supabase.mjs');
  const { exiger } = await import('../scripts/env.mjs');
  const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };
  const action = ['chercher', 'acheter', 'brancher', 'verifier'].find((a) => process.argv.includes(`--${a}`));
  try {
    if (!action) throw new Error('usage : node atelier/domaine.mjs --siren <SIREN> --chercher|--acheter|--brancher|--verifier <domaine> [--prenom P --nom N]');
    const e = exiger(['GANDI_JETON', 'CLOUDFLARE_ZONE_ID', 'CLOUDFLARE_JETON_API', 'SITO_CIBLE_CNAME'], 'chercher, acheter ou brancher un domaine');
    const r = await lancer({
      sb: depuisEnv(), siren: arg('siren'), action, nom: arg(action),
      representant: { prenom: arg('prenom'), nom: arg('nom') },
      gandi: clientGandi({ jeton: e.GANDI_JETON, bacASable: process.env.GANDI_BAC_A_SABLE !== 'false' }),
      saas: clientSaas({ zone: e.CLOUDFLARE_ZONE_ID, jeton: e.CLOUDFLARE_JETON_API }),
      cible: e.SITO_CIBLE_CNAME,
    });
    console.log(dire(action, r));
    if (!r.ok) process.exitCode = 1;
  } catch (err) {
    console.error(`Échec : ${err.message}`);
    process.exitCode = 1;
  }
}

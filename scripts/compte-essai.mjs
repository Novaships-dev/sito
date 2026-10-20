#!/usr/bin/env node
// Crée (ou remet d'aplomb) le compte d'essai de Sitô dans la vraie base, pour
// les essais de bout en bout. Idempotent : le relancer ne crée rien en double.
//
//   node scripts/compte-essai.mjs            crée ou complète
//   node scripts/compte-essai.mjs --verifier ne fait que lire et dire ce qui manque
//
// Il faut, dans le .env racine : SUPABASE_URL, SUPABASE_CLE_SERVICE,
// SITO_COMPTE_ESSAI_COURRIEL. Description du compte : memoire/comptes-essai.md.
//
// Ce que le compte contient (une entreprise inventée, jamais un vrai artisan) :
//   - un utilisateur, e-mail confirmé, sans mot de passe (connexion par code) ;
//   - l'entreprise ESSAI, SIREN 000000000 (aucune entreprise réelle n'a ce numéro) ;
//   - le lien membres et le profil (le site viendra du générateur, tâche du plan).
// Les clés passent dans l'en-tête apikey, jamais en Bearer (doc Supabase des
// clés sb_secret_). Rien n'est affiché qui ressemble à une clé.
import { exiger } from './env.mjs';

export const SIREN_ESSAI = '000000000';
const VERIFIER = process.argv.includes('--verifier');

export function client({ url, cle, fetch: f = fetch }) {
  const base = url.replace(/\/$/, '');
  return async function appel(chemin, { methode = 'GET', corps, prefer } = {}) {
    const r = await f(base + chemin, {
      method: methode,
      headers: { apikey: cle, 'content-type': 'application/json', ...(prefer ? { prefer } : {}) },
      body: corps ? JSON.stringify(corps) : undefined,
    });
    const texte = await r.text();
    let donnees = null;
    try { donnees = texte ? JSON.parse(texte) : null; } catch { donnees = texte; }
    return { statut: r.status, donnees };
  };
}

export async function assurerCompte(appel, courriel, { verifier = false, dire = console.log } = {}) {
  const manque = [];

  // 1. l'utilisateur
  let id = null;
  const liste = await appel('/auth/v1/admin/users?page=1&per_page=1000');
  if (liste.statut !== 200) throw new Error(`lecture des utilisateurs : HTTP ${liste.statut}`);
  const trouve = (liste.donnees?.users || []).find((u) => (u.email || '').toLowerCase() === courriel.toLowerCase());
  if (trouve) { id = trouve.id; dire('utilisateur : présent'); }
  else if (verifier) manque.push('utilisateur');
  else {
    const c = await appel('/auth/v1/admin/users', { methode: 'POST', corps: { email: courriel, email_confirm: true, user_metadata: { essai: true } } });
    if (c.statut >= 300) throw new Error(`création de l'utilisateur : HTTP ${c.statut}`);
    id = c.donnees.id; dire('utilisateur : créé');
  }

  // 2. l'entreprise, le profil, le lien membre
  const lignes = [
    ['entreprises', 'siren', { siren: SIREN_ESSAI, denomination: 'ESSAI SITO', nom_affiche: 'Entreprise d’essai Sitô', commune: 'Marseille', code_postal: '13001', departement: '13' }],
    ['profils', 'siren', { siren: SIREN_ESSAI, telephone: '0600000000', prix_affiches: false }],
  ];
  if (id) lignes.push(['membres', 'user_id,siren', { user_id: id, siren: SIREN_ESSAI, role: 'titulaire' }]);
  for (const [table, conflit, ligne] of lignes) {
    const filtre = conflit.split(',').map((k) => `${k}=eq.${encodeURIComponent(ligne[k])}`).join('&');
    const lu = await appel(`/rest/v1/${table}?${filtre}&select=${conflit.split(',')[0]}`);
    if (lu.statut !== 200) throw new Error(`lecture ${table} : HTTP ${lu.statut}`);
    if (lu.donnees.length) { dire(`${table} : présent`); continue; }
    if (verifier) { manque.push(table); continue; }
    const e = await appel(`/rest/v1/${table}?on_conflict=${conflit}`, { methode: 'POST', corps: ligne, prefer: 'resolution=merge-duplicates,return=minimal' });
    if (e.statut >= 300) throw new Error(`écriture ${table} : HTTP ${e.statut} ${JSON.stringify(e.donnees).slice(0, 200)}`);
    dire(`${table} : créé`);
  }
  return { id, manque };
}

// Sortie : process.exitCode, jamais process.exit(). Sur Windows (Node 24),
// process.exit() juste apres un fetch tue le processus pendant que libuv ferme
// ses poignees : Assertion failed: !(handle->flags & UV_HANDLE_CLOSING),
// async.c ligne 94, et le code de sortie devient 3221226505 au lieu de 1.
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/compte-essai.mjs')) {
  const env = exiger(['SUPABASE_URL', 'SUPABASE_CLE_SERVICE', 'SITO_COMPTE_ESSAI_COURRIEL'], 'créer le compte d’essai dans la vraie base');
  const appel = client({ url: env.SUPABASE_URL, cle: env.SUPABASE_CLE_SERVICE });
  assurerCompte(appel, env.SITO_COMPTE_ESSAI_COURRIEL, { verifier: VERIFIER })
    .then(({ manque }) => {
      if (manque.length) { console.log(`Manque : ${manque.join(', ')}. Relancer sans --verifier pour créer.`); process.exitCode = 1; return; }
      console.log('Compte d’essai prêt. Connexion dans l’app avec le code reçu à cette adresse.');
    })
    .catch((e) => { console.error(`Échec : ${e.message}`); process.exitCode = 1; });
}

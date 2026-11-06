// Les avis Google de chaque nuit (T24) : pour chaque fiche reliée
// (`connexions_google.etat = connectee`), les avis récupérés pour le site.
// Plus aucune réponse publiée (T64, décision du 5 nov. 2026). La logique est dans
// `supabase/functions/_shared/avis-google.mjs` ; ici, le dépôt sur la base
// (clé de service) et la boucle.
//
//   node atelier/avis.mjs
//
// Lancé par `.github/workflows/google.yml`. Il faut GOOGLE_CLIENT_ID,
// GOOGLE_CLIENT_SECRET et GOOGLE_CLE_CHIFFREMENT : sans eux, code 3.
import { pathToFileURL } from 'node:url';
import { synchroniser } from '../supabase/functions/_shared/avis-google.mjs';

// Le dépôt de `avis-google.mjs` sur l'adaptateur Supabase du service.
export function depotBase(sb) {
  return {
    async lireJeton(siren) { const r = await sb.fonction('lire_jeton_google', { p_siren: siren }); return Array.isArray(r) && r[0] ? r[0] : null; },
    async poserJeton(siren, chiffre, portee) { await sb.fonction('poser_jeton_google', { p_siren: siren, p_jeton: chiffre, p_portee: portee }); },
    async oublierJeton(siren) { await sb.fonction('oublier_jeton_google', { p_siren: siren }); },
    async connexion(siren, colonnes) { await sb.poser('connexions_google', [{ siren, ...colonnes }], { surConflit: 'siren' }); },
    async poserAvis(lignes) { await sb.poser('avis', lignes, { surConflit: 'source,ref_externe' }); },
  };
}

export async function tout({ sb, google, cle }) {
  const reliees = await sb.lire('connexions_google', { select: 'siren', filtres: { etat: ['eq', 'connectee'] } });
  const depot = depotBase(sb);
  const resultats = [];
  for (const { siren } of reliees) {
    try { resultats.push(await synchroniser({ siren, depot, google, cle })); }
    catch (e) {
      resultats.push({ siren, etat: 'erreur', fautes: [String(e.message).slice(0, 200)] });
      await depot.connexion(siren, { etat: 'erreur', motif: 'La lecture des avis a échoué cette nuit ; nouvel essai la nuit prochaine.' }).catch(() => {});
    }
  }
  return resultats;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exiger } = await import('../scripts/env.mjs');
  const { depuisEnv } = await import('./supabase.mjs');
  const { clientGoogle } = await import('../supabase/functions/_shared/google.mjs');
  const e = exiger(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CLE_CHIFFREMENT'], 'lire les avis Google des fiches reliées (F13)');
  const r = await tout({ sb: depuisEnv(), google: clientGoogle({ clientId: e.GOOGLE_CLIENT_ID, secret: e.GOOGLE_CLIENT_SECRET }), cle: e.GOOGLE_CLE_CHIFFREMENT });
  for (const x of r) console.log(`${x.siren} : ${x.etat}, ${x.avis ?? 0} avis${x.fautes?.length ? ` ; ${x.fautes.join(' ; ')}` : ''}`);
  if (!r.length) console.log('Aucune fiche Google reliée.');
  process.exitCode = r.some((x) => x.etat === 'erreur') ? 1 : 0;
}

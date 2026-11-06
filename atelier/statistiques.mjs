// L'import de la nuit (T22) : pour chaque site d'abonné qui a son site Umami
// (`sites.umami_id`), les visites et les touches « Appeler » d'un jour de
// Paris, rangées dans `statistiques` (une ligne par entreprise et par jour,
// page « / », source « tout »).
//
// Les demandes du même jour ne sont pas touchées : la base les compte quand
// elles arrivaient (`deposer_demande`, T10 ; formulaire retiré le 6 nov., Q10), dans la même ligne. L'écriture est
// un « upsert » sur les seules colonnes visites et appels : rejouer un jour
// remplace ses chiffres, ne les double pas.
//
//   node atelier/statistiques.mjs              (hier, à Paris)
//   node atelier/statistiques.mjs --jour 2026-11-04
//
// Lancé chaque nuit par `.github/workflows/statistiques.yml`. Il faut, en
// plus de Supabase, UMAMI_JETON (et UMAMI_URL si Umami n'est pas Umami Cloud) :
// sans eux, il s'arrête avec le code 3 et le dit.
import { pathToFileURL } from 'node:url';
import { bornesJourParis, hierParis, clientUmami, BASE_CLOUD } from './umami.mjs';

// Avant l'import : chaque site d'abonné qui a une adresse principale et pas
// encore de site Umami en reçoit un, et son identifiant est rangé dans
// `sites.umami_id`. La mesure arrive dans les pages à la refabrication
// suivante (le générateur lit l'identifiant), rien n'est compté avant.
export async function brancherMesure({ sb, umami }) {
  const sites = await sb.lire('sites', { select: 'id,siren,metier,statut', filtres: { umami_id: ['is', 'null'], statut: ['in', ['abonne', 'publie']] } });
  const faits = [], fautes = [];
  for (const s of sites) {
    const a = await sb.lireUne('adresses', { filtres: { site_id: ['eq', s.id], principale: ['eq', true] } });
    if (!a?.hote || a.etat === 'retiree') continue;
    try {
      const id = await umami.creerSite({ nom: `${s.siren}-${s.metier}`, domaine: a.hote });
      await sb.majorer('sites', { id: ['eq', s.id] }, { umami_id: id });
      faits.push(s.id);
    } catch (e) { fautes.push(`${s.siren} : ${e.message}`); }
  }
  return { faits, fautes };
}

export async function importerJour({ sb, umami, jour }) {
  const { debut, fin } = bornesJourParis(jour);
  const sites = await sb.lire('sites', { select: 'siren,umami_id', filtres: { umami_id: ['not.is', 'null'] } });
  // Deux sites d'une même entreprise (deux métiers) : une seule ligne par jour,
  // la somme des deux.
  const parSiren = new Map();
  const fautes = [];
  for (const s of sites) {
    try {
      const [visites, appels] = await Promise.all([umami.visites(s.umami_id, debut, fin), umami.appels(s.umami_id, debut, fin)]);
      const t = parSiren.get(s.siren) || { visites: 0, appels: 0 };
      parSiren.set(s.siren, { visites: t.visites + visites, appels: t.appels + appels });
    } catch (e) {
      // Un site en panne n'empêche pas les autres ; il n'écrit rien (pas de
      // zéro inventé), et le résumé le dit.
      fautes.push(`${s.siren} : ${e.message}`);
      parSiren.set(s.siren, null);
    }
  }
  const lignes = [...parSiren].filter(([, v]) => v).map(([siren, v]) => ({ siren, jour, page: '/', source: 'tout', ...v }));
  if (lignes.length) await sb.poser('statistiques', lignes, { surConflit: 'siren,jour,page,source' });
  return { jour, sites: sites.length, ecrites: lignes.length, fautes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { exiger } = await import('../scripts/env.mjs');
  const { depuisEnv } = await import('./supabase.mjs');
  const e = exiger(['UMAMI_JETON'], 'lire les visites et les appels chez Umami (action F9)');
  const i = process.argv.indexOf('--jour');
  const jour = i > -1 ? process.argv[i + 1] : hierParis();
  const sb = depuisEnv(), umami = clientUmami({ cle: e.UMAMI_JETON, base: process.env.UMAMI_URL || BASE_CLOUD });
  const m = await brancherMesure({ sb, umami });
  if (m.faits.length) console.log(`Mesure branchée sur ${m.faits.length} nouveau(x) site(s) (visible à leur prochaine refabrication).`);
  const r = await importerJour({ sb, umami, jour });
  console.log(`Statistiques du ${r.jour} : ${r.sites} site(s) mesuré(s), ${r.ecrites} ligne(s) écrite(s).`);
  for (const f of [...m.fautes, ...r.fautes]) console.log(`  panne : ${f}`);
  process.exitCode = m.fautes.length || r.fautes.length ? 1 : 0;
}

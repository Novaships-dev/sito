#!/usr/bin/env node
// Le nom et la commune d'un artisan tels qu'un site peut les écrire.
//
// Ce que l'API des entreprises donne, et qui faisait des sites faux (lot du
// 28 oct. 2026, signalé par Cowork) :
//   - `nom_complet` vaut « RAISON SOCIALE (NOM COMMERCIAL) » : quand le nom
//     commercial répète la raison sociale, le site affichait
//     « Sasu Bmav Maconnerie (sasu Bmav Maconnerie) » ;
//   - la forme juridique est souvent dans la raison sociale (« SASU … ») ;
//   - `libelle_commune` est en majuscules sans accents, et Marseille porte
//     son arrondissement (« MARSEILLE 13EME », « SEPTEMES-LES-VALLONS »).
//
// Le nom : l'enseigne si elle existe, sinon le nom commercial, sinon la
// raison sociale, sans forme juridique. La commune : le nom officiel, lu par
// son code INSEE dans `prospection/communes-<département>.json` (tiré de
// geo.api.gouv.fr, versionné ; Marseille n'a qu'un nom, les codes
// d'arrondissement 13201 à 13216 y mènent par le code postal).
//
//   node scripts/prospection/noms.mjs --telecharger 13
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../env.mjs';

// Formes juridiques, en mot entier, où qu'elles soient dans le nom.
export const FORMES = ['sasu', 'sas', 'sarlu', 'sarl', 'eurl', 'earl', 'sci', 'snc', 'sa', 'ei', 'eirl', 'scop', 'selarl'];
const RE_FORME = new RegExp(`(^|[\\s.,-])(${FORMES.join('|')})(?=$|[\\s.,-])`, 'gi');

const propre = (t) => String(t || '').replace(/\s+/g, ' ').trim();
const sansForme = (t) => propre(String(t || '').replace(RE_FORME, ' ').replace(/^[\s.,-]+|[\s.,-]+$/g, ''));
const pareil = (a, b) => sansForme(a).toUpperCase() === sansForme(b).toUpperCase();

// Rend le nom à écrire sur le site, sans forme juridique ni doublon. `e` est
// une entreprise telle que l'API la rend.
export function nomAffiche(e) {
  const s = e.siege || {};
  const enseigne = (s.liste_enseignes || []).map(propre).find(Boolean) || propre(s.nom_commercial);
  let raison = propre(e.nom_raison_sociale);
  // Un entrepreneur individuel n'a pas de raison sociale : « PRÉNOM NOM
  // (ENSEIGNE) ». La parenthèse finale est alors l'enseigne.
  const complet = propre(e.nom_complet);
  const paren = complet.match(/^(.*?)\s*\(([^()]*)\)(?:\s*\([^()]*\))*$/);
  if (!raison) raison = paren ? propre(paren[1]) : complet;
  const choisi = enseigne || (paren && !pareil(paren[2], raison) ? propre(paren[2]) : '') || raison;
  return sansForme(choisi) || sansForme(raison) || complet;
}

// ------------------------------------------------------------------ communes
export const fichierCommunes = (departement) => join(RACINE, 'prospection', `communes-${departement}.json`);

export function chargerCommunes(departement, fichier = fichierCommunes(departement)) {
  if (!existsSync(fichier)) return null;
  return JSON.parse(readFileSync(fichier, 'utf8'));
}

// `siege` : { commune (code INSEE), code_postal, libelle_commune }. Rend le
// nom officiel, ou `null` si la table ne le connaît pas : jamais deviné.
export function communeOfficielle(siege = {}, table) {
  const liste = table?.communes || [];
  const parCode = liste.find((c) => c.code === siege.commune);
  if (parCode) return parCode.nom;
  // Un arrondissement (13213) n'est pas une commune : son code postal l'est.
  const parCp = liste.filter((c) => (c.codesPostaux || []).includes(siege.code_postal));
  if (parCp.length === 1) return parCp[0].nom;
  return null;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const i = process.argv.indexOf('--telecharger');
  const dep = i > -1 ? process.argv[i + 1] : null;
  if (!/^\d[\dAB]$/.test(dep || '')) { console.error('usage : node scripts/prospection/noms.mjs --telecharger <département>'); process.exit(2); }
  const r = await fetch(`https://geo.api.gouv.fr/departements/${dep}/communes?fields=nom,code,codesPostaux`);
  if (!r.ok) { console.error(`geo.api.gouv.fr a répondu ${r.status}`); process.exit(1); }
  const communes = (await r.json()).map(({ nom, code, codesPostaux }) => ({ nom, code, codesPostaux }));
  const sortie = { source: 'geo.api.gouv.fr (Code officiel géographique)', prelevee_le: new Date().toISOString().slice(0, 10), departement: dep, communes };
  writeFileSync(fichierCommunes(dep), JSON.stringify(sortie, null, 1) + '\n', 'utf8');
  console.log(`${communes.length} communes écrites dans ${fichierCommunes(dep)}`);
}

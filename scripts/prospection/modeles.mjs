#!/usr/bin/env node
// Les modèles de prospection (tâche T57, docs/specs/S-MODELES.md, décision de
// Fabrice du 4 novembre 2026 : « une dixaine de template de site différent
// niveau couleur et architecture », « 10 par métier »).
//
// Un modèle est une apparence complète figée : archétype, charte et clé de
// tirage (textes, paramètres, photos). Le lot du jour remplit un modèle libre
// avec l'entreprise appelée ; seul le site accepté devient unique (T59).
//
// Le fichier `prospection/modeles/<métier>.json` (petit, versionné) :
//   { metier, modeles: [{ id, etat: 'libre' | 'pris', siren, pris_le,
//                         cree_le, archetype, charte, fiche }] }
//
//   node scripts/prospection/modeles.mjs --metier ravalement      complète à 10 libres
//   node scripts/prospection/modeles.mjs --metier ravalement --verifier
//        sort 1 si deux modèles (libres ou pris) se ressemblent trop, ou s'il
//        manque des modèles libres
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../env.mjs';
import { tirerSite } from '../../generateur/tirage.mjs';
import { comparer } from '../../generateur/unicite.mjs';
import { images } from '../plan-images.mjs';

export const LIBRES = 10;
export const fichierModeles = (metier, dossier = join(RACINE, 'prospection', 'modeles')) => join(dossier, `${metier}.json`);

export function lire(metier, dossier) {
  const f = fichierModeles(metier, dossier);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { metier, modeles: [] };
}
export function ecrire(etat, dossier) {
  const f = fichierModeles(etat.metier, dossier);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(etat, null, 2) + '\n');
}

// Les noms des photos du métier (plan de la banque) : le tirage de la main de
// photos n'a besoin que des noms. Le même plan sert à la fabrication.
function sourcesDu(metier) {
  const s = {};
  for (const im of images(metier, { jeu: 'demarrage' })) if (im.dossier === 'sources') s[im.nom] = im.fichier;
  return s;
}

// Un modèle comparé aux autres comme un voisin de la même commune (poids 5) :
// le plus exigeant des voisinages du générateur.
const commeVoisin = (m) => ({ ...m.fiche, poids: 5 });

// Tire un modèle nouveau, différent de tous ceux du fichier (libres et pris).
export function tirerModele(etat, { base, cree_le }) {
  const n = etat.modeles.length + 1;
  const id = `modele-${etat.metier}-${String(n).padStart(2, '0')}`;
  const d = tirerSite({ siren: id, metier: etat.metier, base, sources: sourcesDu(etat.metier),
    voisins: etat.modeles.map(commeVoisin), e: { commune: 'modele', departement: 'modele' }, graine: id });
  return { id, etat: 'libre', siren: null, pris_le: null, cree_le, archetype: d.archetype, charte: d.ch, fiche: d.fiche };
}

// Complète jusqu'à LIBRES modèles libres. Rend les modèles ajoutés.
export function completer(etat, { base, jour }) {
  const ajoutes = [];
  while (etat.modeles.filter((m) => m.etat === 'libre').length < LIBRES) {
    const m = tirerModele(etat, { base, cree_le: jour });
    etat.modeles.push(m);
    ajoutes.push(m);
  }
  return ajoutes;
}

// Les paires de modèles que les règles d'unicité jugent trop proches.
export function jumeaux(etat) {
  const out = [];
  const l = etat.modeles;
  for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) {
    const c = comparer(l[i].fiche, { ...l[j].fiche, poids: 5 });
    if (c.length) out.push({ a: l[i].id, b: l[j].id, regles: c.map((x) => `${x.num} (${x.detail})`).join(' ; ') });
  }
  return out;
}

// Le fichier `--charte` que le générateur lit pour un modèle.
export const charteDe = (m) => ({ archetype: m.archetype, charte: m.charte });

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const val = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
  const metier = val('metier');
  if (!metier) { console.error('usage : node scripts/prospection/modeles.mjs --metier <clé> [--verifier] [--dossier <d>]'); process.exit(2); }
  const dossier = val('dossier') || undefined;
  const fBase = join(RACINE, 'generateur', 'metiers', `${metier}.json`);
  if (!existsSync(fBase)) { console.error(`métier inconnu ou sans textes : ${metier}`); process.exit(2); }
  const base = JSON.parse(readFileSync(fBase, 'utf8'));
  const etat = lire(metier, dossier);
  if (process.argv.includes('--verifier')) {
    const j = jumeaux(etat);
    const libres = etat.modeles.filter((m) => m.etat === 'libre').length;
    console.log(`${metier} : ${etat.modeles.length} modèle(s), ${libres} libre(s), ${j.length} paire(s) trop proche(s)`);
    for (const x of j.slice(0, 10)) console.log(`  ${x.a} et ${x.b} : ${x.regles}`);
    process.exit(j.length || libres < LIBRES ? 1 : 0);
  }
  const ajoutes = completer(etat, { base, jour: new Date().toISOString().slice(0, 10) });
  ecrire(etat, dossier);
  console.log(`${metier} : ${ajoutes.length} modèle(s) ajouté(s), ${etat.modeles.filter((m) => m.etat === 'libre').length} libre(s)`);
  for (const m of ajoutes) console.log(`  ${m.id} : ${m.archetype}, ${m.fiche.famille}, ${m.fiche.polices}, ${m.fiche.geometrie}`);
}

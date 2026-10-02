#!/usr/bin/env node
// Combien de sites d un meme metier le generateur sait-il rendre differents
// dans un meme departement ?
//
// Decision de Fabrice, 2 octobre 2026 : « different dans commune et
// departement, tres important ». Dans les Bouches-du-Rhone, l API publique des
// entreprises compte, le 2 octobre 2026, 4 047 entreprises actives sous le seul
// code 43.34Z. Trois sites de demonstration ne prouvent rien a cette echelle :
// on simule.
//
// La simulation utilise le vrai tirage (generateur/tirage.mjs) et les vraies
// regles (generateur/unicite.mjs), sans fabriquer d image. Les SIREN sont
// fictifs et deterministes ; les photos sont celles du metier, par leur nom.
//
//   node scripts/capacite-unicite.mjs [--metier ravalement] [--images dossier]
//        [--tailles 3,10,25,50,100,200] [--communes une|departement]
//
// --photos plan           projection : les photos prevues par le plan d images
//                         (generateur/banque/plan-images.json) au lieu de
//                         celles du dossier, pour mesurer avant de les generer
// --communes une          tous dans la meme commune (Marseille, le pire cas)
// --communes departement  40 % dans la grande ville, le reste sur 40 communes
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tirerSite, voisinsDe } from '../generateur/tirage.mjs';
import { comparer } from '../generateur/unicite.mjs';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const metier = arg('metier', 'ravalement');
const dossier = arg('images', join(racine, 'images', metier, 'sources'));
const tailles = arg('tailles', '3,10,25,50,100,200').split(',').map(Number);
const mode = arg('communes', 'departement');

const base = JSON.parse(readFileSync(join(racine, 'generateur', 'metiers', metier + '.json'), 'utf8'));
const projection = arg('photos', 'dossier') === 'plan';
const sources = {};
if (projection) {
  // Les noms que scripts/liste-images.mjs donne aux images du plan.
  const plan = JSON.parse(readFileSync(join(racine, 'generateur', 'banque', 'plan-images.json'), 'utf8'))
    .metiers.find(m => m.cle === metier);
  if (!plan) { console.error('metier absent du plan d images : ' + metier); process.exit(2); }
  plan.hero.forEach((_, i) => { sources[i ? 'hero-variante-' + (i + 1) : 'hero'] = 'plan'; });
  plan.paires.forEach((_, i) => { const k = String(i + 1).padStart(2, '0'); sources['avant-' + k] = sources['apres-' + k] = 'plan'; });
  plan.chantier.forEach((_, i) => { sources[i ? 'chantier-' + (i + 1) : 'chantier'] = 'plan'; });
  plan.geste.forEach((_, i) => { sources[i ? 'geste-' + (i + 1) : 'geste'] = 'plan'; });
  sources[plan.detail] = 'plan';
} else {
  if (!existsSync(dossier)) { console.error('photos introuvables : ' + dossier); process.exit(2); }
  for (const f of readdirSync(dossier)) { const m = f.match(/^([a-z0-9-]+)\.(png|jpe?g|webp|avif)$/i); if (m) sources[m[1]] = f; }
}

// Un SIREN fictif mais valide de forme (cle de Luhn), deterministe.
function siren(i) {
  const corps = String(100000000 + ((i * 7919 + 12345) % 800000000)).slice(0, 8);
  for (let c = 0; c <= 9; c++) {
    const n = corps + c;
    const s = [...n].reverse().reduce((a, d, k) => { let v = +d * (k % 2 ? 2 : 1); if (v > 9) v -= 9; return a + v; }, 0);
    if (s % 10 === 0) return n;
  }
  return corps + '0';
}
const commune = (i) => mode === 'une' ? 'Marseille'
  : (i % 5 < 2 ? 'Marseille' : 'Commune ' + String(1 + (i * 37) % 40).padStart(2, '0'));

// Les intitules de section (« Prendre contact. ») sont comptes a part : ils
// font deux a cinq mots, et leur reserve ne peut pas atteindre cent variantes
// sans devenir absurde. Les phrases se comptent aussi une par une, parce qu un
// texte de geste assemble deux phrases et qu une meme phrase peut revenir.
const decouper = (texte) => texte.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);

function simuler(n) {
  const registre = [];
  for (let i = 0; i < n; i++) {
    const e = { siren: siren(i), metier, commune: commune(i), departement: '13' };
    const voisins = voisinsDe(registre, e);
    const { t, fiche } = tirerSite({ siren: e.siren, metier, base, sources, voisins, e, prix: false });
    const intitules = new Set([t.rub.gestes, t.rub.verifiable, t.rub.contact, t.rub.chantier]);
    const longues = fiche.phrases.filter(x => !intitules.has(x));
    registre.push({ ...fiche, longues, intitules: fiche.phrases.filter(x => intitules.has(x)),
      unites: new Set(longues.flatMap(decouper)) });
  }
  const compte = { U1: 0, U2: 0, U3: 0, U4: 0 };
  const parEchelle = { 'meme commune': 0, 'meme departement': 0 };
  const texte = { longues: 0, intitules: 0, phrasesCommune: [], phrasesDep: [] };
  let paires = 0, heroCommun = 0, paireCommune = 0;
  const touches = new Set();
  for (let i = 0; i < registre.length; i++) for (let j = i + 1; j < registre.length; j++) {
    const a = registre[i], b = registre[j];
    paires++;
    if (a.main.hero === b.main.hero) heroCommun++;
    if (a.main.paire1 === b.main.paire1) paireCommune++;
    const c = comparer(a, b);
    for (const x of c) { compte[x.num]++; parEchelle[x.echelle]++; }
    if (c.length) { touches.add(i); touches.add(j); }
    if (a.longues.some(x => b.longues.includes(x))) texte.longues++;
    if (a.intitules.some(x => b.intitules.includes(x))) texte.intitules++;
    let communes = 0; for (const u of a.unites) if (b.unites.has(u)) communes++;
    (a.commune === b.commune ? texte.phrasesCommune : texte.phrasesDep).push(communes);
  }
  return { n, paires, compte, parEchelle, heroCommun, paireCommune, touches: touches.size, texte };
}

const c = Object.keys(sources);
console.log(`Metier ${metier}, ${c.length} photos sources${projection ? ' (PROJECTION : celles prevues par le plan, pas encore generees)' : ''}, mode ${mode === 'une' ? 'une seule commune' : 'departement (40 % grande ville, 40 communes)'}.`);
console.log('Paires de sites voisins en defaut, par regle (U1 trop proches, U2 meme titre, U3 texte commun, U4 meme comparateur) :\n');
console.log('  sites   paires   U1     U2     U3     U4    sites touches   meme facade coupee   meme avant/apres du 1er ecran');
let capacite = 0;
const details = [];
for (const n of tailles) {
  const r = simuler(n);
  const zero = !r.compte.U1 && !r.compte.U2 && !r.compte.U3 && !r.compte.U4;
  if (zero) capacite = n;
  const pc = (x) => (100 * x / r.paires).toFixed(0).padStart(3) + ' %';
  console.log(`  ${String(n).padStart(5)} ${String(r.paires).padStart(8)} ${[r.compte.U1, r.compte.U2, r.compte.U3, r.compte.U4].map(x => String(x).padStart(6)).join(' ')}   ${String(r.touches).padStart(5)} / ${String(n).padEnd(5)}      ${pc(r.heroCommun)}                 ${pc(r.paireCommune)}`);
  details.push(r);
}
console.log('\nLes textes en detail (U3 decompose) :\n');
console.log('  sites   paires avec un texte long commun   paires avec un intitule commun   phrases communes par paire : meme commune (moy / max), departement (moy / max)');
const moy = (l) => l.length ? (l.reduce((a, x) => a + x, 0) / l.length).toFixed(2) : '-';
const max = (l) => l.length ? Math.max(...l) : '-';
for (const r of details)
  console.log(`  ${String(r.n).padStart(5)}   ${String(r.texte.longues).padStart(10)} (${(100 * r.texte.longues / r.paires).toFixed(1)} %)            ${String(r.texte.intitules).padStart(10)} (${(100 * r.texte.intitules / r.paires).toFixed(1)} %)          ${moy(r.texte.phrasesCommune)} / ${max(r.texte.phrasesCommune)}            ${moy(r.texte.phrasesDep)} / ${max(r.texte.phrasesDep)}`);
console.log(`\nPlus grande taille essayee sans aucun defaut : ${capacite || 'aucune'}.`);

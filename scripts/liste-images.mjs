// Rend la liste de production des images, metier par metier, image par image :
// nom de fichier, cadrage, sujet exact. La source est generateur/banque/plan-images.json.
//
//   node scripts/liste-images.mjs            > toute la liste
//   node scripts/liste-images.mjs ravalement > un seul metier
//   node scripts/liste-images.mjs --csv      > un tableau a cocher
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(ici, '..', 'generateur', 'banque', 'plan-images.json'), 'utf8'));
const args = process.argv.slice(2);
const csv = args.includes('--csv');
const filtre = args.find(a => !a.startsWith('--'));
const metiers = plan.metiers.filter(m => !filtre || m.cle === filtre);
if (!metiers.length) { console.error('metier inconnu. Connus : ' + plan.metiers.map(m => m.cle).join(', ')); process.exit(2); }

const F = {
  hero: { dossier: 'sources', rapport: '16/9', large: 1600 },
  paire: { dossier: 'sources', rapport: '4/3', large: 1400 },
  chantier: { dossier: 'sources', rapport: '4/3', large: 1300 },
  geste: { dossier: 'sources', rapport: '4/3', large: 1300 },
  detail: { dossier: 'sources', rapport: '4/3', large: 1400 },
  matiere: { dossier: 'banque/matiere', rapport: '4/3', large: 1400 },
  ambiance: { dossier: 'banque/ambiance', rapport: '3/2', large: 1600 },
  signes: { dossier: 'banque/signes', rapport: '1/1', large: 1400 },
};

const lignes = [];
const pousser = (m, n, fichier, type, sujet) =>
  lignes.push({ metier: m.nom, cle: m.cle, n, fichier, rapport: F[type].rapport, large: F[type].large, sujet });

for (const m of metiers) {
  let n = 0;
  // 1. les huit fichiers que le generateur exige, jeu numero 1
  m.hero.forEach((s, i) => pousser(m, ++n, i === 0 ? 'hero.jpg' : `hero-variante-${i + 1}.jpg`, 'hero', s));
  m.paires.forEach((paire, i) => {
    const k = String(i + 1).padStart(2, '0');
    pousser(m, ++n, `avant-${k}.jpg`, 'paire', paire[0]);
    pousser(m, ++n, `apres-${k}.jpg`, 'paire', paire[1] + '  [MEME bâtiment, MEME cadrage que avant-' + k + ']');
  });
  m.chantier.forEach((s, i) => pousser(m, ++n, i === 0 ? 'chantier.jpg' : `chantier-${i + 1}.jpg`, 'chantier', s));
  m.geste.forEach((s, i) => pousser(m, ++n, i === 0 ? 'geste.jpg' : `geste-${i + 1}.jpg`, 'geste', s));
  m.matiere.forEach((s, i) => {
    const nom = i === 0 ? `${m.detail}.jpg` : `matiere-${String(i + 1).padStart(2, '0')}.jpg`;
    pousser(m, ++n, nom, i === 0 ? 'detail' : 'matiere', s + (i === 0 ? '  [sert au mot geant, au WebGL et au prelevement de la palette]' : ''));
  });
  m.ambiance.forEach((s, i) => pousser(m, ++n, `ambiance-${String(i + 1).padStart(2, '0')}.jpg`, 'ambiance', s));
  m.signes.forEach((s, i) => pousser(m, ++n, `signe-${String(i + 1).padStart(2, '0')}.jpg`, 'signes', s));
}

if (csv) {
  console.log('fait;metier;n;fichier;rapport;largeur mini;sujet a demander');
  for (const l of lignes) console.log(`[ ];${l.metier};${l.n};${l.fichier};${l.rapport};${l.large};${l.sujet}`);
} else {
  let courant = '';
  for (const l of lignes) {
    if (l.metier !== courant) {
      courant = l.metier;
      const m = metiers.find(x => x.nom === courant);
      console.log(`\n\n## ${m.nom}  (${m.cle})`);
      console.log(`Codes APE : ${m.codes.join(', ')}   Mot geant : ${m.mot}   Matiere : ${m.matiere_nom}`);
      console.log(`Dossier : sources-${m.cle}/ et banque/${m.cle}/\n`);
      console.log('| # | fichier | cadrage | largeur mini | sujet a demander a l IA |');
      console.log('|---|---|---|---|---|');
    }
    console.log(`| ${l.n} | \`${l.fichier}\` | ${l.rapport} | ${l.large} px | ${l.sujet} |`);
  }
  console.log(`\n\n${lignes.length} images au total.`);
}

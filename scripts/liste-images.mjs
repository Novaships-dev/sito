// Rend la liste de production des images, metier par metier, image par image :
// nom de fichier, dossier, cadrage, largeur minimale, sujet exact.
//
// La table des dossiers, des cadrages et des largeurs n'est plus ici : elle est
// dans `scripts/plan-images.mjs`, avec `verifier-images.mjs`. Les deux doivent
// repondre la meme chose, sinon la liste demande une image que le controle
// refuse (c'est arrive : 1 300 px annonces, 1 400 px encodes).
//
//   node scripts/liste-images.mjs              toute la liste, 54 images par metier
//   node scripts/liste-images.mjs ravalement   un seul metier
//   node scripts/liste-images.mjs --demarrage  le premier jeu, 32 images par metier
//   node scripts/liste-images.mjs --csv        un tableau a cocher
import { plan, images, cadrage } from './plan-images.mjs';

const args = process.argv.slice(2);
const csv = args.includes('--csv');
const jeu = args.includes('--demarrage') ? 'demarrage' : 'complet';
const filtre = args.find(a => !a.startsWith('--'));
const p = plan();
const metiers = p.metiers.filter(m => !filtre || m.cle === filtre);
if (!metiers.length) { console.error('metier inconnu. Connus : ' + p.metiers.map(m => m.cle).join(', ')); process.exit(2); }

const lignes = metiers.flatMap(m => images(m.cle, { jeu, plan: p }).map(im => ({ metier: m.nom, ...im })));

if (csv) {
  console.log('fait;metier;n;dossier;fichier;cadrage;largeur mini;sujet a demander');
  for (const l of lignes) console.log(`[ ];${l.metier};${l.n};${l.dossier};${l.fichier};${cadrage(l.rapport)};${l.large};${l.sujet}`);
} else {
  let courant = '';
  for (const l of lignes) {
    if (l.metier !== courant) {
      courant = l.metier;
      const m = metiers.find(x => x.nom === courant);
      console.log(`\n\n## ${m.nom}  (${m.cle})`);
      console.log(`Codes APE : ${m.codes.join(', ')}   Mot geant : ${m.mot}   Matiere : ${m.matiere_nom}`);
      console.log(`Dossiers : images/${m.cle}/sources/ et images/${m.cle}/banque/\n`);
      console.log('| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |');
      console.log('|---|---|---|---|---|---|');
    }
    console.log(`| ${l.n} | ${l.dossier} | \`${l.fichier}\` | ${cadrage(l.rapport)} | ${l.large} px | ${l.sujet} |`);
  }
  console.log(`\n\n${lignes.length} images au total (jeu « ${jeu} »).`);
}

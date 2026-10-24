#!/usr/bin/env node
// Les images d'un métier sont-elles là, et bonnes, avant de fabriquer ?
//
// Les images ne sont pas dans Git (décision de Fabrice : pas de Git LFS) :
// elles vivent dans `images/<metier>/`, générées dans ChatGPT une par une
// d'après `banque/prompts/<metier>.md`. Trente-deux fichiers nommés à la main,
// c'est trente-deux occasions de se tromper : un nom au pluriel, un
// téléchargement à la taille par défaut, un « avant » qui ne cadre pas comme
// son « après ». Ce script mesure, il ne juge pas.
//
// Ce qui est BLOQUANT (`images/<metier>/sources/`, le seul dossier que
// `generateur/composer.mjs` lit) :
//   - le fichier existe, sous l'un des formats que le générateur accepte ;
//   - sa largeur atteint la plus grande rendition que le générateur fabriquera
//     à partir de lui : 1 600 px pour un hero, 1 400 px pour le reste. En
//     dessous, le site afficherait un agrandissement ;
//   - son cadrage est celui du plan, à 3 % près ;
//   - **les paires sont alignées** : `avant-NN` et `apres-NN` ont exactement
//     les mêmes dimensions, sinon la couture du comparateur ne tombe pas au
//     même endroit sur les deux images ;
//   - le minimum jouable du générateur est réuni (`main-photos.mjs`).
//
// Ce qui est une REMARQUE : la largeur des trois dossiers de `banque/`
// (matière, ambiance, signes). Leur présence est exigée — le plan les demande
// — mais **aucun code ne les lit aujourd'hui** : ce sont les couches
// d'habillage prévues par `main-photos.mjs`, pas encore branchées. Exiger une
// largeur que rien n'utilise serait inventer une règle ; la remarque dit ce
// qu'il faudra le jour où elles seront affichées.
//
//   node scripts/verifier-images.mjs <metier> [--complet] [--racine <dossier>]
//   node scripts/verifier-images.mjs --contre-essai
//     abîme exprès une copie des images du ravalement (une trop petite, une
//     absente, une paire désalignée, un cadrage faux) et exige que chaque
//     faute soit attrapée.
import { existsSync, readdirSync, mkdirSync, cpSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { RACINE } from './env.mjs';
import { images, cadrage, EXTENSIONS, plan } from './plan-images.mjs';
import { manquants } from '../generateur/main-photos.mjs';

const TOLERANCE = 0.03; // 3 % sur le rapport : un recadrage d'un pixel ou deux

// Le fichier d'un rôle, quelle que soit son extension (le générateur fait
// pareil : le nom fait foi).
function trouver(dossier, nom) {
  if (!existsSync(dossier)) return null;
  for (const f of readdirSync(dossier)) {
    const m = f.match(/^([a-z0-9-]+)\.([a-z0-9]+)$/i);
    if (m && m[1].toLowerCase() === nom.toLowerCase() && EXTENSIONS.includes(m[2].toLowerCase())) return join(dossier, f);
  }
  return null;
}

export async function verifier(cle, { racine = join(RACINE, 'images'), jeu = 'demarrage', dire = console.log } = {}) {
  const dossierMetier = join(racine, cle);
  const liste = images(cle, { jeu });
  const fautes = [];
  const remarques = [];
  const mesures = new Map();
  const presents = {};

  dire(`\nImages de « ${cle} » dans ${dossierMetier} — jeu « ${jeu} », ${liste.length} fichiers attendus`);
  if (!existsSync(dossierMetier)) {
    fautes.push(`le dossier ${dossierMetier} n existe pas : aucune image de ce métier n a encore été générée (voir banque/prompts/${cle}.md)`);
    return { fautes, remarques, liste, mesures };
  }

  let rangCourant = null;
  for (const im of liste) {
    if (im.dossier !== rangCourant) {
      rangCourant = im.dossier;
      dire(`\n  ${im.dossier}/${im.lu ? '  (lu par le générateur)' : '  (couche d habillage, pas encore lue par le générateur)'}`);
    }
    const chemin = trouver(join(dossierMetier, im.dossier), im.nom);
    if (!chemin) {
      fautes.push(`${im.dossier}/${im.fichier} manque`);
      dire(`  FAUTE ${im.fichier.padEnd(24)} absent`);
      continue;
    }
    let meta;
    try { meta = await sharp(chemin).metadata(); }
    catch (e) {
      fautes.push(`${im.dossier}/${im.fichier} ne se décode pas : ${e.message.split('\n')[0]}`);
      dire(`  FAUTE ${im.fichier.padEnd(24)} illisible`);
      continue;
    }
    mesures.set(im.nom, { largeur: meta.width, hauteur: meta.height, chemin, format: meta.format });
    if (im.dossier === 'sources') presents[im.nom] = chemin;

    const dits = [];
    const rapport = meta.width / meta.height;
    const voulu = im.rapport[0] / im.rapport[1];
    if (Math.abs(rapport - voulu) / voulu > TOLERANCE) {
      dits.push(`cadrage ${rapport.toFixed(3)} au lieu de ${cadrage(im.rapport)} (${voulu.toFixed(3)})`);
      fautes.push(`${im.dossier}/${im.fichier} : ${dits[dits.length - 1]}`);
    }
    if (meta.width < im.large) {
      const quoi = `${meta.width} px de large, il en faut ${im.large}`;
      if (im.lu) { dits.push(quoi); fautes.push(`${im.dossier}/${im.fichier} : ${quoi} — le site l agrandirait`); }
      else { dits.push(`${quoi} (remarque)`); remarques.push(`${im.dossier}/${im.fichier} : ${quoi} le jour où les couches d habillage seront branchées`); }
    }
    const niveau = fautes.some((f) => f.startsWith(`${im.dossier}/${im.fichier}`)) ? 'FAUTE' : dits.length ? 'note ' : 'ok   ';
    dire(`  ${niveau} ${im.fichier.padEnd(24)} ${meta.width}×${meta.height}  ${cadrage(im.rapport)}  ${im.large} px demandés${dits.length ? `  — ${dits.join(' ; ')}` : ''}`);
  }

  // Les paires : mêmes dimensions au pixel près, sinon la couture du
  // comparateur ne tombe pas au même endroit sur les deux images.
  dire('\n  Les paires avant/après');
  const paires = [...new Set(liste.filter((im) => im.paire).map((im) => im.paire))];
  for (const k of paires) {
    const a = mesures.get(`avant-${k}`), b = mesures.get(`apres-${k}`);
    if (!a || !b) { dire(`  (paire ${k} : un des deux fichiers manque, déjà compté)`); continue; }
    if (a.largeur !== b.largeur || a.hauteur !== b.hauteur) {
      fautes.push(`la paire ${k} n est pas alignée : avant ${a.largeur}×${a.hauteur}, après ${b.largeur}×${b.hauteur} — la couture du comparateur ne tomberait pas au même endroit`);
      dire(`  FAUTE paire ${k} : ${a.largeur}×${a.hauteur} contre ${b.largeur}×${b.hauteur}`);
    } else dire(`  ok    paire ${k} : ${a.largeur}×${a.hauteur} des deux côtés`);
  }

  // Le minimum que le générateur exige pour qu'un métier soit jouable : la
  // même fonction que le générateur appelle, pas une liste recopiée.
  const trous = manquants(presents);
  dire('\n  Le minimum jouable (generateur/main-photos.mjs)');
  if (trous.length) { fautes.push(`le générateur refuserait ce métier : ${trous.join(', ')}`); dire(`  FAUTE ${trous.join(', ')}`); }
  else dire('  ok    le générateur a de quoi fabriquer un site');

  // Les fichiers hors plan : une remarque, pas une faute. `SOURCE-ILLUSTRATION`
  // est un marqueur, pas une image.
  const attendus = new Set(liste.map((im) => im.nom.toLowerCase()));
  for (const d of [...new Set(liste.map((im) => im.dossier))]) {
    const chemin = join(dossierMetier, d);
    if (!existsSync(chemin)) continue;
    for (const f of readdirSync(chemin)) {
      const m = f.match(/^([a-z0-9-]+)\.([a-z0-9]+)$/i);
      if (!m || !EXTENSIONS.includes(m[2].toLowerCase())) continue;
      if (!attendus.has(m[1].toLowerCase())) remarques.push(`${d}/${f} n est pas au plan du jeu « ${jeu} » (image en plus, ou nom mal écrit)`);
    }
  }

  return { fautes, remarques, liste, mesures };
}

// ----------------------------------------------------------------- contre-essai
// Une copie des images du ravalement, abîmée d'une façon à la fois, hors du
// dépôt. Chaque faute doit être attrapée **seule** : une copie cassée qui
// rougit pour une autre raison ne prouve rien.
const CASSURES = [
  { nom: 'une image trop petite (le site l agrandirait)',
    faire: async (d) => { const c = join(d, 'ravalement', 'sources', 'geste.jpg'); await sharp(c).resize({ width: 900 }).toFile(c + '.tmp'); cpSync(c + '.tmp', c); rmSync(c + '.tmp'); },
    attendu: /geste\.jpg : 900 px/ },
  { nom: 'une image absente',
    faire: (d) => rmSync(join(d, 'ravalement', 'sources', 'chantier-2.jpg')),
    attendu: /chantier-2\.jpg manque/ },
  { nom: 'une paire désalignée',
    faire: async (d) => { const c = join(d, 'ravalement', 'sources', 'apres-01.jpg'); await sharp(c).resize({ width: 1400, height: 1050 }).toFile(c + '.tmp'); cpSync(c + '.tmp', c); rmSync(c + '.tmp'); },
    attendu: /paire 01 n est pas alignée/ },
  { nom: 'un cadrage faux',
    faire: async (d) => { const c = join(d, 'ravalement', 'sources', 'hero.jpg'); await sharp(c).resize({ width: 1672, height: 1672, fit: 'fill' }).toFile(c + '.tmp'); cpSync(c + '.tmp', c); rmSync(c + '.tmp'); },
    attendu: /hero\.jpg : cadrage/ },
  { nom: 'le minimum jouable manque (plus aucun hero)',
    faire: (d) => { for (const f of readdirSync(join(d, 'ravalement', 'sources'))) if (f.startsWith('hero')) rmSync(join(d, 'ravalement', 'sources', f)); },
    attendu: /le générateur refuserait ce métier/ },
];

async function contreEssai(source) {
  let ratees = 0;
  for (const c of CASSURES) {
    const d = join(tmpdir(), `sito-images-casse-${Math.random().toString(36).slice(2, 10)}`);
    mkdirSync(d, { recursive: true });
    cpSync(join(source, 'ravalement'), join(d, 'ravalement'), { recursive: true });
    await c.faire(d);
    const r = await verifier('ravalement', { racine: d, dire: () => {} });
    const attrapee = r.fautes.some((f) => c.attendu.test(f));
    if (!attrapee) ratees++;
    console.log(`${attrapee ? 'ok   ' : 'RATÉ '} ${c.nom}\n        ${r.fautes.length} faute(s) : ${r.fautes.slice(0, 2).join(' | ') || 'aucune'}`);
    rmSync(d, { recursive: true, force: true });
  }
  console.log(`\n${CASSURES.length} cassure(s) posée(s) une par une, ${ratees} non attrapée(s).`);
  console.log(ratees ? 'CONTRE-ESSAI RATÉ : une copie abîmée passe.' : 'Contre-essai réussi : chaque copie abîmée est attrapée.');
  return ratees;
}

// ------------------------------------------------- la feuille de prompts (--prompts)
// Les images ne sont pas dans Git, mais les feuilles de prompts le sont : c'est
// le seul des deux contrôles qui peut tourner dans un clone neuf et dans la CI.
// Il mesure l'accord entre `banque/prompts/<metier>.md` et le plan. Un nom de
// fichier mal écrit dans la feuille, c'est une image générée sous un nom que le
// générateur ne lira jamais ; une largeur périmée dans la feuille (elles l'ont
// été : 1 300 px annoncés, 1 400 px encodés), c'est une image à regénérer.
const TITRE_FICHIER = /^#{2,4}.*`([a-z0-9-]+)\.([a-z0-9]+)`/i;

export function verifierPrompts(cle, { dossier = join(RACINE, 'banque', 'prompts'), jeu = 'demarrage', dire = console.log } = {}) {
  const fichier = join(dossier, `${cle}.md`);
  const fautes = [];
  const attendues = images(cle, { jeu });
  // Les images du jeu complet ne sont pas exigées, mais elles sont connues :
  // un titre qui porte un de leurs noms n'est pas une faute de frappe.
  const connues = new Set(images(cle, { jeu: 'complet' }).map((im) => im.nom.toLowerCase()));

  dire(`\nFeuille de prompts de « ${cle} » : ${fichier} — jeu « ${jeu} », ${attendues.length} images exigées`);
  if (!existsSync(fichier)) {
    fautes.push(`banque/prompts/${cle}.md manque : aucun texte à coller dans ChatGPT pour ce métier`);
    return { fautes, titres: new Map() };
  }

  // Un titre par image : « ### 9 — `chantier.jpg` · 4/3 · 1400 px »
  const titres = new Map();
  readFileSync(fichier, 'utf8').split('\n').forEach((ligne, i) => {
    const m = ligne.match(TITRE_FICHIER);
    if (!m) return;
    const nom = m[1].toLowerCase();
    if (!EXTENSIONS.includes(m[2].toLowerCase())) return;
    if (!titres.has(nom)) titres.set(nom, []);
    titres.get(nom).push({ ligne: i + 1, texte: ligne });
  });

  for (const im of attendues) {
    const vus = titres.get(im.nom.toLowerCase()) || [];
    if (!vus.length) { fautes.push(`${cle}.md : aucun prompt pour \`${im.fichier}\``); dire(`  FAUTE ${im.fichier.padEnd(24)} aucun prompt`); continue; }
    if (vus.length > 1) { fautes.push(`${cle}.md : ${vus.length} prompts portent \`${im.fichier}\` (lignes ${vus.map((v) => v.ligne).join(', ')})`); dire(`  FAUTE ${im.fichier.padEnd(24)} ${vus.length} prompts`); continue; }
    const { texte, ligne } = vus[0];
    const dits = [];
    if (!texte.includes(cadrage(im.rapport))) dits.push(`le cadrage ${cadrage(im.rapport)} n est pas annoncé`);
    if (!new RegExp(`${im.large}\\s*px`).test(texte)) dits.push(`la largeur ${im.large} px n est pas annoncée (le générateur encode jusque-là)`);
    for (const d of dits) fautes.push(`${cle}.md ligne ${ligne}, \`${im.fichier}\` : ${d}`);
    dire(`  ${dits.length ? 'FAUTE' : 'ok   '} ${im.fichier.padEnd(24)} ligne ${String(ligne).padEnd(4)}${dits.length ? dits.join(' ; ') : `${cadrage(im.rapport)}, ${im.large} px`}`);
  }

  // Un nom qui ne figure dans aucun jeu : faute de frappe dans la feuille.
  for (const nom of titres.keys()) {
    if (!connues.has(nom)) fautes.push(`${cle}.md ligne ${titres.get(nom)[0].ligne} : \`${nom}\` n est pas au plan de ce métier (nom mal écrit, ou image sans but)`);
  }

  // La méthode des paires : l'APRÈS se génère d'abord, l'AVANT est une
  // dégradation de cette image même. Deux images séparées donnent deux
  // bâtiments différents et le comparateur du site n'a plus de sens.
  dire('\n  L après avant l avant, pour chaque paire');
  for (const k of [...new Set(attendues.filter((im) => im.paire).map((im) => im.paire))]) {
    const a = titres.get(`avant-${k}`)?.[0], b = titres.get(`apres-${k}`)?.[0];
    if (!a || !b) { dire(`  (paire ${k} : un des deux prompts manque, déjà compté)`); continue; }
    if (b.ligne > a.ligne) { fautes.push(`${cle}.md : la paire ${k} demande \`avant-${k}\` (ligne ${a.ligne}) avant \`apres-${k}\` (ligne ${b.ligne}) — l après se génère d abord, l avant est une dégradation de cette image même`); dire(`  FAUTE paire ${k} : l avant est demandé en premier`); }
    else dire(`  ok    paire ${k} : apres-${k} ligne ${b.ligne}, puis avant-${k} ligne ${a.ligne}`);
  }

  return { fautes, titres };
}

// Les cassures de la feuille de prompts : un texte, une faute à la fois.
const CASSURES_PROMPTS = [
  { nom: 'une largeur périmée (1 300 px au lieu de 1 400)',
    faire: (t) => t.replace('`chantier.jpg` · 4/3 · 1400 px', '`chantier.jpg` · 4/3 · 1300 px'),
    attendu: /chantier\.jpg` : la largeur 1400 px n est pas annoncée/ },
  { nom: 'un prompt absent',
    faire: (t) => t.replace('`geste-3.jpg` · 4/3 · 1400 px', 'un geste de plus'),
    attendu: /aucun prompt pour `geste-3\.jpg`/ },
  { nom: 'un nom de fichier mal écrit',
    faire: (t) => t.replace('`signe-01.jpg`', '`signes-01.jpg`'),
    attendu: /`signes-01` n est pas au plan/ },
  { nom: 'une paire demandée dans le mauvais ordre',
    faire: (t) => t.replace(/(### 4 — `apres-01[\s\S]*?)(\n### 3 — `avant-01[\s\S]*?)(\n### 6 — `apres-02)/, '$2$1$3'),
    attendu: /la paire 01 demande `avant-01`/ },
  { nom: 'un cadrage faux',
    faire: (t) => t.replace('`hero.jpg` · 16/9 · 1600 px', '`hero.jpg` · 3/2 · 1600 px'),
    attendu: /hero\.jpg` : le cadrage 16\/9 n est pas annoncé/ },
];

function contreEssaiPrompts(cle, dossier) {
  const source = readFileSync(join(dossier, `${cle}.md`), 'utf8');
  let ratees = 0;
  for (const c of CASSURES_PROMPTS) {
    const abime = c.faire(source);
    if (abime === source) { ratees++; console.log(`RATÉ  ${c.nom}\n        la cassure n a rien changé au texte : le contre-essai ne prouve rien`); continue; }
    const d = join(tmpdir(), `sito-prompts-casse-${Math.random().toString(36).slice(2, 10)}`);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, `${cle}.md`), abime);
    const r = verifierPrompts(cle, { dossier: d, dire: () => {} });
    const attrapee = r.fautes.some((f) => c.attendu.test(f));
    if (!attrapee) ratees++;
    console.log(`${attrapee ? 'ok   ' : 'RATÉ '} ${c.nom}\n        ${r.fautes.length} faute(s) : ${r.fautes.slice(0, 2).join(' | ') || 'aucune'}`);
    rmSync(d, { recursive: true, force: true });
  }
  console.log(`\n${CASSURES_PROMPTS.length} cassure(s) posée(s) une par une sur ${cle}.md, ${ratees} non attrapée(s).`);
  console.log(ratees ? 'CONTRE-ESSAI RATÉ : une feuille abîmée passe.' : 'Contre-essai réussi : chaque feuille abîmée est attrapée.');
  return ratees;
}

// --------------------------------------------------------------------- en ligne
const USAGE = `usage :
  node scripts/verifier-images.mjs <metier> [--complet] [--racine <dossier>]
      les fichiers d images sur le disque (hors de Git)
  node scripts/verifier-images.mjs --prompts [<metier>]
      les feuilles banque/prompts/*.md contre le plan (tourne dans un clone neuf)
  node scripts/verifier-images.mjs --contre-essai
  node scripts/verifier-images.mjs --contre-essai-prompts`;

const args = process.argv.slice(2);
const iRacine = args.indexOf('--racine');
const racine = iRacine >= 0 ? resolve(args[iRacine + 1]) : join(RACINE, 'images');
const prompts = join(RACINE, 'banque', 'prompts');
// Le métier est le seul argument libre : la valeur de --racine n'en est pas un.
const cleDemandee = args.find((a, i) => !a.startsWith('--') && !(iRacine >= 0 && i === iRacine + 1));
const jeu = args.includes('--complet') ? 'complet' : 'demarrage';

if (args.includes('--contre-essai-prompts')) {
  process.exitCode = contreEssaiPrompts('ravalement', prompts) ? 1 : 0;
} else if (args.includes('--contre-essai')) {
  if (!existsSync(join(racine, 'ravalement', 'sources'))) {
    console.error(`contre-essai impossible : ${join(racine, 'ravalement', 'sources')} n existe pas (les images ne sont pas dans Git).`);
    process.exit(2);
  }
  process.exitCode = (await contreEssai(racine)) ? 1 : 0;
} else if (args.includes('--prompts')) {
  // Sans métier : toutes les feuilles présentes, pour que la CI voie d un coup
  // celle qui a divergé du plan.
  const cles = cleDemandee ? [cleDemandee]
    : readdirSync(prompts).map((f) => f.match(/^([a-z0-9-]+)\.md$/)?.[1]).filter((c) => c && plan().metiers.some((m) => m.cle === c));
  const fautes = cles.flatMap((cle) => verifierPrompts(cle, { dossier: prompts, jeu }).fautes);
  console.log(`\n${cles.length} feuille(s) de prompts (${cles.join(', ')}), ${fautes.length} faute(s).`);
  for (const f of fautes) console.log(`  FAUTE ${f}`);
  process.exitCode = fautes.length ? 1 : 0;
} else {
  if (!cleDemandee) { console.error(USAGE); process.exit(2); }
  const { fautes, remarques, liste } = await verifier(cleDemandee, { racine, jeu });
  if (remarques.length) {
    console.log('\n  Remarques (rien ne bloque)');
    for (const r of remarques) console.log(`  note  ${r}`);
  }
  console.log(`\n${liste.length} images attendues, ${fautes.length} faute(s), ${remarques.length} remarque(s).`);
  for (const f of fautes) console.log(`  FAUTE ${f}`);
  process.exitCode = fautes.length ? 1 : 0;
}

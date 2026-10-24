#!/usr/bin/env node
// Essai de `atelier/preparer-recues.mjs` : les photos que l'app a envoyées
// deviennent des images propres, ou des refus motivés, et rien d'autre.
//
// Le faux Supabase de `scripts/faux-supabase.mjs` tient la base et le
// stockage : aucun réseau, aucune clé. Les fichiers d'essai sont fabriqués
// ici (JPEG d'iPhone avec orientation et position GPS, HEIC par libheif, PDF
// renommé .jpg, vidéo, JPEG coupé).
//
// Ce qu'il mesure, jamais ce que le code dit de lui-même :
//   - l'état et les colonnes écrites, relus dans la base ;
//   - les octets réellement posés dans le stockage : ils se décodent, leur
//     taille est celle annoncée par la ligne, et exiftool n'y trouve plus ni
//     position GPS ni modèle de téléphone ;
//   - ce que le passage NE touche pas : `octets` (la taille du fichier reçu),
//     les lignes déjà « prete » ou « illisible » ;
//   - l'invariant : aucune ligne « prete » sans son image dans le stockage.
//
//   node scripts/essai-preparation.mjs [chemin du module]
//   node scripts/essai-preparation.mjs --contre-essai
//     trois fautes posées une par une, dans trois copies hors du dépôt ;
//     l'essai entier est rejoué sur chacune et doit rougir à chaque fois.
//
// Outils demandés sur la machine : exiftool, ffmpeg, et un Python avec Pillow
// et pillow-heif (pour fabriquer les fichiers d'essai seulement).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { RACINE } from './env.mjs';
import { fauxSupabase } from './faux-supabase.mjs';
import { supabase } from '../atelier/supabase.mjs';
import { pythonAvecHeif } from './python.mjs';

const CONTRE = process.argv.includes('--contre-essai');
const CLE = 'cle-de-test-du-faux-supabase';
const ESPACE = 'photos-chantiers';
const SIREN = '480423623';
const CHANTIER = '3b8f2c10';

// ------------------------------------------------------------------- outillage
const PYTHON = pythonAvecHeif();
const absent = (outil, args) => spawnSync(outil, args, { stdio: 'ignore' }).status !== 0;
const manque = [!PYTHON && 'python + Pillow + pillow-heif', absent('exiftool', ['-ver']) && 'exiftool',
  absent('ffmpeg', ['-version']) && 'ffmpeg'].filter(Boolean);
if (manque.length) {
  console.error(`outils absents de la machine (${manque.join(', ')}) : les fichiers d essai ne peuvent pas etre fabriques.`);
  process.exit(2);
}

// ---------------------------------------- les copies cassées du contre-essai
// Chaque faute est posée SEULE, dans sa copie, et l'essai entier est rejoué
// dessus : une faute qui ne rougit pas à elle seule n'est pas gardée ici. Une
// cassure qui fait *planter* l'essai au lieu d'être mesurée ne compte pas non
// plus — un essai interrompu ne prouve rien.
//
// Les copies vivent hors du dépôt (piège du 21 octobre : une copie d'essai
// laissée dedans part sur GitHub). Leur import de `./photos.mjs` est repointé
// sur le vrai module du dépôt, sinon `sharp` ne se résout pas depuis /tmp.
const CASSURES = [
  { nom: 'ligne déclarée « prete » sans que son image soit écrite',
    de: '      await stockage.ecrire(chemin, resultat.image,',
    a: '      if (false) await stockage.ecrire(chemin, resultat.image,' },
  { nom: 'HEIC sans convertisseur marqué « illisible » au lieu de rester « recue »',
    de: "{ motif: borne(resultat.motif) });",
    a: "{ etat: 'illisible', motif: borne(resultat.motif) });" },
  { nom: 'octets (taille du fichier reçu) écrasé par celle de l image propre',
    de: "      etat: 'prete',",
    a: "      octets: resultat.octets,\n      etat: 'prete'," },
];

function copieCassee(c) {
  const d = mkdtempSync(join(tmpdir(), 'sito-preparation-casse-'));
  mkdirSync(join(d, 'atelier'));
  let src = readFileSync(join(RACINE, 'atelier', 'preparer-recues.mjs'), 'utf8');
  const avant = src;
  src = src.replace(c.de, c.a);
  if (src === avant) { console.error(`la cassure « ${c.nom} » n a rien changé : le module a changé de forme.`); process.exit(2); }
  // En motif, pas en texte : écrit en clair, ce chemin relatif ferait croire à
  // `verifier-depot` que cet essai importe un module voisin de lui.
  src = src.replace(/from '\.\/photos\.mjs'/, `from ${JSON.stringify(pathToFileURL(join(RACINE, 'atelier', 'photos.mjs')).href)}`);
  writeFileSync(join(d, 'atelier', 'preparer-recues.mjs'), src);
  return d;
}

if (CONTRE) {
  let ratees = 0;
  for (const c of CASSURES) {
    const d = copieCassee(c);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), join(d, 'atelier', 'preparer-recues.mjs')],
      { encoding: 'utf8', cwd: RACINE, maxBuffer: 64 * 1024 * 1024 });
    const sortie = (r.stdout || '') + (r.stderr || '');
    const bilan = sortie.match(/(\d+) contrôles, (\d+) faute/);
    const fautes = bilan ? Number(bilan[2]) : 0;
    const plante = /essai interrompu/.test(sortie);
    const attrapee = r.status === 1 && fautes > 0 && !plante;
    if (!attrapee) ratees++;
    console.log(`${attrapee ? 'ok   ' : 'RATÉ '} ${c.nom}\n        ${fautes} faute(s), sortie ${r.status}${plante ? ', essai interrompu : la cassure fait planter au lieu d être mesurée' : ''}`);
    if (attrapee) console.log(sortie.split('\n').filter((l) => l.includes('FAUTE')).slice(0, 3).map((l) => '       ' + l.trim()).join('\n'));
    rmSync(d, { recursive: true, force: true });
  }
  console.log(`\n${CASSURES.length} cassure(s) posée(s) une par une, ${ratees} non attrapée(s).`);
  console.log(ratees ? 'CONTRE-ESSAI RATÉ : une copie cassée passe.' : 'Contre-essai réussi : chaque copie cassée est attrapée.');
  process.exit(ratees ? 1 : 0);
}

const D = mkdtempSync(join(tmpdir(), 'essai-preparation-'));
const f = (n) => join(D, n);
const py = (code) => execFileSync(PYTHON, ['-c', code], { stdio: ['ignore', 'pipe', 'inherit'] });
const exif = (...a) => execFileSync('exiftool', a, { encoding: 'utf8' });

const CHEMIN = resolve(process.argv.find((a, i) => i >= 2 && !a.startsWith('--')) || join(RACINE, 'atelier', 'preparer-recues.mjs'));
const { preparerRecues } = await import(pathToFileURL(CHEMIN).href);

// --------------------------------------------------------- les fichiers d'essai
// Une image 800 x 600 : fond bleu, carré ROUGE en haut à gauche. Après
// redressement, le rouge doit être là où l'œil l'attend.
const rouge = await sharp({ create: { width: 200, height: 150, channels: 3, background: '#ff0000' } }).png().toBuffer();
const mire = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#2050c0' } })
  .composite([{ input: rouge, left: 0, top: 0 }]).png().toBuffer();
writeFileSync(f('mire.png'), mire);

// Où est le rouge dans l'image rendue ? (coin dont le pixel est le plus rouge)
async function coinRouge(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * info.channels; return data[i] - data[i + 2]; };
  const m = 10, W = info.width - 1 - m, H = info.height - 1 - m;
  const coins = { 'haut-gauche': px(m, m), 'haut-droite': px(W, m), 'bas-gauche': px(m, H), 'bas-droite': px(W, H) };
  return Object.entries(coins).sort((a, b) => b[1] - a[1])[0][0];
}

// 1. JPEG d'iPhone tenu en portrait : orientation 6, position GPS, modèle.
await sharp(mire).jpeg().toFile(f('p1.jpg'));
exif('-q', '-overwrite_original', '-Make=Apple', '-Model=iPhone 16 Pro', '-Orientation#=6',
  '-DateTimeOriginal=2026:10:24 09:12:00', '-GPSLatitude=43.2965', '-GPSLatitudeRef=N',
  '-GPSLongitude=5.3698', '-GPSLongitudeRef=E', f('p1.jpg'));
const entree = exif('-s', '-n', '-Orientation', '-GPSLatitude', f('p1.jpg'));
if (!/Orientation\s+:\s+6/.test(entree) || !/GPSLatitude/.test(entree)) {
  console.error('Fichier d essai mal fabriqué : pas d orientation 6 ou pas de GPS.\n' + entree); process.exit(2);
}
const P1 = readFileSync(f('p1.jpg'));

// 2. L'original en pleine résolution est arrivé : il doit être préféré à la
//    version réduite (décision du 9 octobre).
const P2_REDUITE = await sharp(mire).resize(400, 300).jpeg().toBuffer();
const P2_SOURCE = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#808080' } }).jpeg().toBuffer();
// 3. L'original est annoncé mais n'est pas (encore) dans le stockage.
const P3 = await sharp(mire).jpeg().toBuffer();
// 4 et 5. HEIC d'iPhone, fabriqué par libheif.
py(`import pillow_heif; from PIL import Image; pillow_heif.register_heif_opener()
im = Image.open(${JSON.stringify(f('mire.png'))}).convert('RGB'); im.save(${JSON.stringify(f('p4.HEIC'))}, quality=90)`);
const HEIC = readFileSync(f('p4.HEIC'));
// 6. PDF renommé .jpg. 7. JPEG coupé en plein envoi. 8. Vidéo.
const PDF = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n');
const COUPEE = P1.subarray(0, Math.floor(P1.length / 3));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=green:s=160x120:d=1', '-pix_fmt', 'yuv420p', f('p8.mp4')]);
const MP4 = readFileSync(f('p8.mp4'));
// 13. Un nom de fichier interminable : le motif doit tenir dans la colonne.
const NOM_LONG = 'facture-de-chantier-'.repeat(20) + 'fin';

// ------------------------------------------------------------------ la base
const ch = (n) => `${SIREN}/${CHANTIER}/${n}`;
const propre = (cle) => `${SIREN}/${CHANTIER}/${cle}-propre.jpg`;

const objets = new Map([
  [`${ESPACE}/${ch('p1.jpg')}`, P1],
  [`${ESPACE}/${ch('p2.jpg')}`, P2_REDUITE],
  [`${ESPACE}/${ch('p2-original.jpg')}`, P2_SOURCE],
  [`${ESPACE}/${ch('p3.jpg')}`, P3],
  [`${ESPACE}/${ch('p4.HEIC')}`, HEIC],
  [`${ESPACE}/${ch('p5.HEIC')}`, HEIC],
  [`${ESPACE}/${ch('p6.jpg')}`, PDF],
  [`${ESPACE}/${ch('p7.jpg')}`, COUPEE],
  [`${ESPACE}/${ch('p8.mp4')}`, MP4],
  [`${ESPACE}/${ch(NOM_LONG + '.jpg')}`, PDF],
  [`${ESPACE}/${ch('p14.jpg')}`, P3],
  // p11 est déjà prête : son image est dans le stockage depuis un passage
  // précédent, et doit y rester telle quelle.
  [`${ESPACE}/${ch('p11-propre.jpg')}`, P3],
  // p14 : un passage interrompu a déjà posé une image à ce chemin. Le passage
  // suivant doit la remplacer, pas buter sur un 409.
  [`${ESPACE}/${propre('p14')}`, Buffer.from('restes d un passage interrompu')],
]);

const r = (id, etat, champs) => ({ id, siren: SIREN, chantier_id: CHANTIER, role: 'chantier', paire: null,
  origine: 'entreprise', etat, cree_le: `2026-10-24T10:${String(champs.rang).padStart(2, '0')}:00Z`,
  chemin: null, largeur: null, hauteur: null, motif: null, chemin_source: null, octets_source: null, ...champs });

const lignes = {
  photos: [
    r('p1', 'recue', { rang: 1, chemin_original: ch('p1.jpg'), format_origine: 'jpeg', octets: P1.length }),
    r('p2', 'recue', { rang: 2, chemin_original: ch('p2.jpg'), chemin_source: ch('p2-original.jpg'), format_origine: 'jpeg', octets: P2_REDUITE.length, octets_source: P2_SOURCE.length }),
    r('p3', 'recue', { rang: 3, chemin_original: ch('p3.jpg'), chemin_source: ch('p3-original.jpg'), format_origine: 'jpeg', octets: P3.length }),
    r('p4', 'recue', { rang: 4, chemin_original: ch('p4.HEIC'), format_origine: 'heic', octets: HEIC.length }),
    r('p5', 'recue', { rang: 5, chemin_original: ch('p5.HEIC'), format_origine: 'HEIC', octets: HEIC.length }),
    r('p6', 'recue', { rang: 6, chemin_original: ch('p6.jpg'), format_origine: 'jpeg', octets: PDF.length }),
    r('p7', 'recue', { rang: 7, chemin_original: ch('p7.jpg'), format_origine: 'jpeg', octets: COUPEE.length }),
    r('p8', 'recue', { rang: 8, chemin_original: ch('p8.mp4'), format_origine: 'mp4', octets: MP4.length }),
    // Aucun fichier nommé : impossible en base (contrainte photos_a_un_fichier),
    // mais le passage doit le dire plutôt que planter.
    r('p9', 'recue', { rang: 9, chemin_original: null, octets: 10 }),
    // Annoncée, pas encore dans le stockage : elle reste « reçue ».
    r('p10', 'recue', { rang: 10, chemin_original: ch('p10.jpg'), format_origine: 'jpeg', octets: 1000 }),
    // Déjà traitées : le passage ne doit pas y toucher.
    r('p11', 'prete', { rang: 11, chemin_original: ch('p11.jpg'), chemin: ch('p11-propre.jpg'), largeur: 1200, hauteur: 800, format_origine: 'jpeg', octets: 500 }),
    r('p12', 'illisible', { rang: 12, chemin_original: ch('p12.pdf'), motif: 'motif d origine', format_origine: 'pdf', octets: 600 }),
    r('p13', 'recue', { rang: 13, chemin_original: ch(NOM_LONG + '.jpg'), format_origine: 'jpeg', octets: PDF.length }),
    r('p14', 'recue', { rang: 14, chemin_original: ch('p14.jpg'), format_origine: 'jpeg', octets: P3.length }),
  ],
};
const RECUES = lignes.photos.filter((l) => l.etat === 'recue').length;

const faux = await fauxSupabase({ cle: CLE, base: lignes, cles: { photos: ['id'] }, objets });
const sb = supabase({ url: faux.url, cle: CLE });

// Un convertisseur HEIC d'essai (libheif local). Il ne prouve pas la
// conversion par Supabase (atelier/heic.mjs, offre Pro) ; il prouve que la
// suite de la chaîne traite ce qu'un convertisseur rend.
const convertirHeic = async (b) => {
  const e = f('h-in.heic'), s = f('h-out.png');
  writeFileSync(e, b);
  py(`import pillow_heif; from PIL import Image; pillow_heif.register_heif_opener(); Image.open(${JSON.stringify(e)}).save(${JSON.stringify(s)})`);
  return readFileSync(s);
};

// -------------------------------------------------------------------- mesure
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const ligne = (id) => faux.base.photos.find((l) => l.id === id);
const fichier = (chemin) => faux.objets.get(`${ESPACE}/${chemin}`) || null;

// Mesure l'image réellement posée dans le stockage, pas celle que la ligne
// raconte : elle se décode, ses pixels sont au bon format et à la bonne
// taille, et exiftool n'y trouve plus rien de privé.
async function imagePosee(id, { largeur, hauteur, coin }) {
  const l = ligne(id);
  const attendu = propre(id);
  if (!ok(l.etat === 'prete', `${id} : état « prete »`, `état ${l.etat}, motif ${JSON.stringify(l.motif)}`)) return;
  ok(l.chemin === attendu, `${id} : chemin de l image propre`, `${l.chemin} au lieu de ${attendu}`);
  ok(l.motif === null, `${id} : aucun motif sur une photo prête`, JSON.stringify(l.motif));
  const octets = fichier(l.chemin);
  if (!ok(octets, `${id} : l image propre est dans le stockage`, 'rien à ce chemin')) return;
  const m = await sharp(octets).metadata().catch((e) => ({ erreur: e.message }));
  ok(m.format === 'jpeg', `${id} : le fichier posé est un JPEG`, m.erreur || `format ${m.format}`);
  ok(m.width === largeur && m.height === hauteur, `${id} : ${largeur}×${hauteur} mesurés sur le fichier posé`, `${m.width}×${m.height}`);
  ok(l.largeur === m.width && l.hauteur === m.height, `${id} : la ligne annonce la taille du fichier posé`, `ligne ${l.largeur}×${l.hauteur}, fichier ${m.width}×${m.height}`);
  // Chaque mesure se rattrape : un fichier posé qui n'est pas une image ne
  // doit pas interrompre l'essai, il doit faire rougir le contrôle qui le
  // mesure (piège du 24 octobre).
  if (coin) {
    const c = await coinRouge(octets).catch((e) => `illisible : ${e.message}`);
    ok(c === coin, `${id} : photo dans le bon sens`, `rouge en ${c}, attendu en ${coin}`);
  }
  const chemin = f(`pose-${id}.jpg`);
  writeFileSync(chemin, octets);
  let prive;
  try { prive = exif('-s', '-a', '-G1', '-GPS*', '-Make', '-Model', '-Orientation', '-DateTimeOriginal', chemin).trim(); }
  catch (e) { prive = `exiftool refuse le fichier posé : ${e.message.split('\n')[0]}`; }
  ok(!prive, `${id} : plus de position GPS ni de modèle dans le fichier posé`, prive.replace(/\s+/g, ' '));
}

try {
  // ---------------------------------------------- premier passage, sans convertisseur
  console.log('\nPremier passage (sans convertisseur HEIC)');
  const dit = [];
  const b1 = await preparerRecues({ sb, espace: ESPACE, dire: (m) => dit.push(m) });
  ok(b1.prises === RECUES && b1.pretes === 4 && b1.illisibles === 4 && b1.attente === 2
     && b1.sansFichier === 2 && b1.refusees === 0, `bilan chiffré : ${RECUES} prises = 4 prêtes + 4 illisibles + 2 en attente + 2 sans fichier`, JSON.stringify(b1));
  ok(b1.pannes.length === 2 && b1.pannes.every((p) => /aucun fichier|absent du stockage/.test(p.quoi)),
    'les deux photos laissées de côté sont nommées, avec pourquoi', JSON.stringify(b1.pannes));

  // La requête réellement envoyée : les reçues seulement, dans l'ordre d'arrivée, bornée.
  const q = faux.vues.find((v) => v.methode === 'GET' && v.chemin === '/rest/v1/photos')?.requete || '';
  ok(/etat=eq\.recue/.test(q) && /order=cree_le/.test(q) && /limit=\d+/.test(q),
    'la base n’est interrogée que sur les photos reçues, dans l’ordre, bornée', q);

  console.log('\nLes photos devenues prêtes');
  await imagePosee('p1', { largeur: 600, hauteur: 800, coin: 'haut-droite' }); // orientation 6 : redressée
  await imagePosee('p2', { largeur: 3200, hauteur: 2400 });                   // l'original, pas la réduite
  await imagePosee('p3', { largeur: 800, hauteur: 600, coin: 'haut-gauche' }); // original annoncé absent : la réduite suffit
  await imagePosee('p14', { largeur: 800, hauteur: 600, coin: 'haut-gauche' });
  ok(fichier(propre('p14'))?.toString('latin1').startsWith('restes') === false,
    'p14 : l image d un passage interrompu est remplacée, pas un 409');
  ok(ligne('p2').largeur === 3200, 'p2 : la source en pleine résolution est préférée à la version réduite', `largeur ${ligne('p2').largeur}`);
  ok(ligne('p3').format_origine === 'jpeg', 'p3 : format_origine corrigé d après les premiers octets', String(ligne('p3').format_origine));

  console.log('\nCe que le passage ne touche pas');
  // `octets` est la taille du fichier que l'app a envoyé : la préparation ne
  // l'écrase pas avec celle de l'image propre.
  for (const [id, taille] of [['p1', P1.length], ['p2', P2_REDUITE.length], ['p3', P3.length], ['p14', P3.length]])
    ok(ligne(id).octets === taille, `${id} : octets reste la taille du fichier reçu`, `${ligne(id).octets} au lieu de ${taille}`);
  ok(ligne('p2').octets_source === P2_SOURCE.length, 'p2 : octets_source reste la taille de l original', String(ligne('p2').octets_source));
  const p11 = ligne('p11');
  ok(p11.etat === 'prete' && p11.chemin === ch('p11-propre.jpg') && p11.largeur === 1200, 'une photo déjà prête n’est pas repassée', JSON.stringify(p11.chemin));
  ok(ligne('p12').motif === 'motif d origine', 'une photo déjà illisible garde son motif', String(ligne('p12').motif));
  ok(ligne('p10').etat === 'recue' && ligne('p10').motif === null, 'fichier pas encore dans le stockage : la photo reste « reçue », jamais illisible', JSON.stringify(ligne('p10')));
  ok(ligne('p9').etat === 'recue', 'ligne sans aucun fichier nommé : laissée de côté sans planter', ligne('p9').etat);

  console.log('\nLes refus, motivés pour l’artisan');
  for (const [id, nom, attendu] of [['p6', 'p6.jpg', /PDF/], ['p7', 'p7.jpg', /abîmée|incomplète/], ['p8', 'p8.mp4', /vidéo/]]) {
    const l = ligne(id);
    ok(l.etat === 'illisible' && attendu.test(l.motif || '') && (l.motif || '').includes(nom),
      `${id} : illisible, motif qui nomme le fichier`, `${l.etat} / ${JSON.stringify(l.motif)}`);
    ok(l.chemin === null && fichier(propre(id)) === null, `${id} : aucune image propre écrite pour un refus`, String(l.chemin));
  }
  const p13 = ligne('p13');
  ok(p13.etat === 'illisible' && p13.motif.length <= 280 && p13.motif.endsWith('…'),
    'nom de fichier interminable : le motif tient dans la colonne (280 caractères)', `${p13.motif?.length} caractères`);

  console.log('\nHEIC : en attente tant qu’il n’y a pas de convertisseur');
  for (const id of ['p4', 'p5']) {
    const l = ligne(id);
    ok(l.etat === 'recue' && /HEIC/.test(l.motif || '') && l.chemin === null,
      `${id} : reste « reçue » avec un motif d’attente, aucune image écrite`, `${l.etat} / ${JSON.stringify(l.motif)}`);
    ok(fichier(propre(id)) === null, `${id} : rien de posé dans le stockage`);
  }
  ok(dit.some((m) => /p10.*absent du stockage/.test(m)), 'le journal nomme le fichier absent', dit.join(' | '));

  // ------------------------------------------- deuxième passage, avec convertisseur
  console.log('\nDeuxième passage (convertisseur HEIC d’essai)');
  const b2 = await preparerRecues({ sb, espace: ESPACE, convertirHeic });
  ok(b2.prises === 4 && b2.pretes === 2 && b2.attente === 0 && b2.sansFichier === 2,
    'reprise : les deux HEIC en attente deviennent prêtes, les deux sans fichier restent', JSON.stringify(b2));
  await imagePosee('p4', { largeur: 800, hauteur: 600, coin: 'haut-gauche' });
  ok(ligne('p4').format_origine === 'heic', 'p4 : format_origine « heic »', String(ligne('p4').format_origine));

  // --------------------------------------------------- troisième passage : plus rien
  console.log('\nTroisième passage : plus rien à faire');
  const avant = JSON.stringify(faux.base.photos);
  const b3 = await preparerRecues({ sb, espace: ESPACE, convertirHeic });
  ok(b3.prises === 2 && b3.pretes === 0 && b3.illisibles === 0,
    'un passage de plus ne retouche aucune photo déjà traitée', JSON.stringify(b3));
  ok(JSON.stringify(faux.base.photos) === avant, 'aucune ligne n’a changé');

  // ------------------------------------------------------------- l'invariant
  console.log('\nL’invariant');
  const pretesSansImage = faux.base.photos.filter((l) => l.etat === 'prete' && !fichier(l.chemin));
  ok(pretesSansImage.length === 0, 'aucune ligne « prete » sans son image dans le stockage',
    pretesSansImage.map((l) => `${l.id} → ${l.chemin}`).join(', '));
  const horsSiren = faux.base.photos.filter((l) => l.chemin && !l.chemin.startsWith(`${SIREN}/`));
  ok(horsSiren.length === 0, 'toute image propre est rangée sous le SIREN de l’entreprise', horsSiren.map((l) => l.chemin).join(', '));
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  faux.arreter();
}

console.log(`\n${essais} contrôles, ${fautes} faute(s). Dossier : ${D}`);
process.exitCode = fautes ? 1 : 0;

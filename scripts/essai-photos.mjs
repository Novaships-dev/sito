// Essai de atelier/photos.mjs sur un fichier de chaque sorte.
//
// Décision de Fabrice, 3 octobre 2026 : « Tout doit être accepté, iPhone etc.,
// la totale. » Cet essai fabrique les fichiers, les passe dans le module et
// MESURE le résultat : les pixels de l'image rendue (sens, taille, couleur),
// et les métadonnées relues par exiftool. Il ne lit jamais ce que le module
// dit avoir fait.
//
//   node scripts/essai-photos.mjs [chemin du module]   (défaut : atelier/photos.mjs)
//
// Outils demandés sur la machine : exiftool, ffmpeg, et un Python avec Pillow
// et pillow-heif (pour fabriquer les fichiers d'essai seulement). Le nom de
// l'interprète est cherché par scripts/python.mjs : il change selon le poste.
//
// Fabriqués ici, pas venus d'un vrai appareil : le HEIC (pillow-heif), le DNG
// (TIFF marqué DNG avec un aperçu). Les vrais fichiers d'iPhone et d'Android
// restent à passer : voir PLAN-APP.md, section 5.4.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { pythonAvecHeif } from './python.mjs';

const module = await import(pathToFileURL(resolve(process.argv[2] || 'atelier/photos.mjs')).href);
const { preparerPhoto, Illisible, COTE_MAX } = module;

const D = mkdtempSync(join(tmpdir(), 'essai-photos-'));
const f = (n) => join(D, n);
const PYTHON = pythonAvecHeif();
if (!PYTHON) { console.error('python avec Pillow et pillow-heif introuvable : les fichiers d essai ne peuvent pas etre fabriques.'); process.exit(2); }
const py = (code) => execFileSync(PYTHON, ['-c', code], { stdio: ['ignore', 'pipe', 'inherit'] });
const exif = (...a) => execFileSync('exiftool', a, { encoding: 'utf8' });

// Une image 800 x 600 : fond bleu, carré ROUGE en haut à gauche. Après
// redressement, le rouge doit être là où l'œil l'attend.
async function mire() {
  const rouge = await sharp({ create: { width: 200, height: 150, channels: 3, background: '#ff0000' } }).png().toBuffer();
  return sharp({ create: { width: 800, height: 600, channels: 3, background: '#2050c0' } })
    .composite([{ input: rouge, left: 0, top: 0 }]).png().toBuffer();
}

// Où est le rouge dans l'image rendue ? (coin dont le pixel est le plus rouge)
async function coinRouge(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * info.channels; return data[i] - data[i + 2]; };
  const m = 10, W = info.width - 1 - m, H = info.height - 1 - m;
  const coins = { 'haut-gauche': px(m, m), 'haut-droite': px(W, m), 'bas-gauche': px(m, H), 'bas-droite': px(W, H) };
  return Object.entries(coins).sort((a, b) => b[1] - a[1])[0][0];
}

const essais = [];
const essai = (nom, fichier, attendu) => essais.push({ nom, fichier, attendu });

const base = await mire();
// 1. JPEG d'iPhone tenu en portrait : orientation 6, position GPS, modèle.
await sharp(base).jpeg().toFile(f('IMG_0001.JPG'));
exif('-q', '-overwrite_original', '-Make=Apple', '-Model=iPhone 16 Pro', '-Orientation#=6',
  '-DateTimeOriginal=2026:10:05 09:12:00', '-GPSLatitude=43.2965', '-GPSLatitudeRef=N',
  '-GPSLongitude=5.3698', '-GPSLongitudeRef=E', f('IMG_0001.JPG'));
// L'essai vérifie d'abord que la photo d'entrée porte bien ce qu'on veut voir disparaître.
const entreeMeta = exif('-s', '-n', '-Orientation', '-GPSLatitude', f('IMG_0001.JPG'));
if (!/Orientation\s+:\s+6/.test(entreeMeta) || !/GPSLatitude/.test(entreeMeta)) {
  console.error('Fichier d essai mal fabriqué : pas d orientation 6 ou pas de GPS.\n' + entreeMeta); process.exit(2);
}
essai('JPEG portrait avec GPS', 'IMG_0001.JPG', { image: true, coin: 'haut-droite', l: 600, h: 800 });
// 2. Formats courants.
await sharp(base).png().toFile(f('capture.png'));            essai('PNG (capture)', 'capture.png', { image: true, coin: 'haut-gauche' });
await sharp(base).webp().toFile(f('photo.webp'));            essai('WebP', 'photo.webp', { image: true, coin: 'haut-gauche' });
await sharp(base).avif().toFile(f('photo.avif'));            essai('AVIF (Android)', 'photo.avif', { image: true, coin: 'haut-gauche' });
await sharp(base).tiff().toFile(f('scan.tif'));              essai('TIFF', 'scan.tif', { image: true, coin: 'haut-gauche' });
await sharp(base).gif().toFile(f('anim.gif'));               essai('GIF', 'anim.gif', { image: true, coin: 'haut-gauche' });
writeFileSync(f('mire.png'), base);
py(`from PIL import Image; Image.open(${JSON.stringify(f('mire.png'))}).save(${JSON.stringify(f('vieux.bmp'))})`);
essai('BMP', 'vieux.bmp', { image: true, coin: 'haut-gauche' });
// 3. Très grande photo : ramenée à 3 200 px.
await sharp({ create: { width: 8064, height: 6048, channels: 3, background: '#808080' } }).jpeg().toFile(f('48mpx.jpg'));
essai('JPEG 48 Mpx', '48mpx.jpg', { image: true, l: COTE_MAX, h: 2400 });
// 4. HEIC d'iPhone (fabriqué par libheif), orientation dans le conteneur.
py(`import pillow_heif; from PIL import Image; pillow_heif.register_heif_opener()
im = Image.open(${JSON.stringify(f('mire.png'))}).convert('RGB'); im.save(${JSON.stringify(f('IMG_0002.HEIC'))}, quality=90)`);
essai('HEIC sans convertisseur', 'IMG_0002.HEIC', { attente: true });
// Convertisseur d'essai (libheif local) : ne prouve pas la conversion Supabase,
// mais prouve que la suite de la chaîne traite ce qu'elle rend.
const heicEssai = async (b) => { const e = f('h-in.heic'), s = f('h-out.png'); writeFileSync(e, b);
  py(`import pillow_heif; from PIL import Image; pillow_heif.register_heif_opener(); Image.open(${JSON.stringify(e)}).save(${JSON.stringify(s)})`);
  return readFileSync(s); };
essai('HEIC, convertisseur d essai', 'IMG_0002.HEIC', { image: true, coin: 'haut-gauche', l: 800, h: 600, convertirHeic: heicEssai });
// 5. RAW : DNG avec aperçu JPEG, orientation 6 portée par le RAW.
await sharp({ create: { width: 600, height: 400, channels: 3, background: '#336699' } }).tiff().toFile(f('capteur.tif'));
writeFileSync(f('apercu.jpg'), await sharp(base).jpeg().toBuffer());
execFileSync('cp', [f('capteur.tif'), f('IMG_0003.DNG')]);
exif('-q', '-overwrite_original', '-DNGVersion=1 4 0 0', '-UniqueCameraModel=iPhone 16 Pro', '-Orientation#=6', '-GPSLatitude=43.28', '-GPSLatitudeRef=N', f('IMG_0003.DNG'));
exif('-q', '-overwrite_original', '-PreviewImage<=' + f('apercu.jpg'), f('IMG_0003.DNG'));
essai('DNG (ProRAW) avec aperçu', 'IMG_0003.DNG', { image: true, coin: 'haut-droite', l: 600, h: 800 });
execFileSync('cp', [f('capteur.tif'), f('sans-apercu.dng')]);
exif('-q', '-overwrite_original', '-DNGVersion=1 4 0 0', f('sans-apercu.dng'));
essai('DNG sans aperçu', 'sans-apercu.dng', { illisible: /RAW sans aperçu/ });
// 6. Motion Photo Android : JPEG suivi d'une vidéo collée à la fin.
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=green:s=160x120:d=1', '-pix_fmt', 'yuv420p', f('clip.mp4')]);
writeFileSync(f('MVIMG_0004.jpg'), Buffer.concat([await sharp(base).jpeg().toBuffer(), readFileSync(f('clip.mp4'))]));
essai('Motion Photo (JPEG + vidéo)', 'MVIMG_0004.jpg', { image: true, coin: 'haut-gauche' });
// 7. Vidéo (partie vidéo d'une Live Photo, ou film de chantier).
essai('Vidéo MP4', 'clip.mp4', { video: true });
// 8. Ce qui doit être refusé, avec un motif qui nomme le fichier.
writeFileSync(f('facture.jpg'), Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n'));
essai('PDF renommé .jpg', 'facture.jpg', { illisible: /PDF/ });
const entier = readFileSync(f('IMG_0001.JPG'));
writeFileSync(f('coupee.jpg'), entier.subarray(0, Math.floor(entier.length / 3)));
essai('JPEG coupé en plein envoi', 'coupee.jpg', { illisible: /abîmée|incomplète/ });
writeFileSync(f('vide.jpg'), Buffer.alloc(0));
essai('Fichier vide', 'vide.jpg', { illisible: /vide/ });
writeFileSync(f('notes.txt.jpg'), Buffer.from('Ceci est un texte, pas une photo du tout.'));
essai('Texte renommé .jpg', 'notes.txt.jpg', { illisible: /pas une photo/ });

// ---------------------------------------------------------------- mesure
let fautes = 0;
for (const e of essais) {
  const buf = readFileSync(f(e.fichier));
  const constat = [];
  let r, err;
  try { r = await preparerPhoto(buf, { nom: e.fichier, convertirHeic: e.attendu.convertirHeic || null }); } catch (x) { err = x; }
  const a = e.attendu;
  if (a.illisible) {
    if (!(err instanceof Illisible)) constat.push('devait être refusé avec un motif, ' + (err ? 'a planté : ' + err.message : 'a été accepté'));
    else if (!a.illisible.test(err.motif)) constat.push('motif inattendu : ' + err.motif);
    else if (!err.motif.includes(e.fichier)) constat.push('le motif ne nomme pas le fichier : ' + err.motif);
  } else if (err) {
    constat.push('refusé à tort : ' + err.message);
  } else if (a.video) {
    if (!r.video) constat.push('vidéo non reconnue');
  } else if (a.attente) {
    if (!r.attente) constat.push('HEIC sans convertisseur : devait rester en attente');
  } else {
    const sortie = join(D, 'sortie-' + e.fichier + '.jpg');
    writeFileSync(sortie, r.image);
    const m = await sharp(r.image).metadata();
    if (m.format !== 'jpeg') constat.push('sortie en ' + m.format + ', pas en JPEG');
    if (a.l && (m.width !== a.l || m.height !== a.h)) constat.push(`taille ${m.width}x${m.height}, attendu ${a.l}x${a.h}`);
    if (Math.max(m.width, m.height) > COTE_MAX) constat.push('dépasse ' + COTE_MAX + ' px');
    if (a.coin) { const c = await coinRouge(r.image); if (c !== a.coin) constat.push(`photo dans le mauvais sens : rouge en ${c}, attendu en ${a.coin}`); }
    const meta = exif('-s', '-a', '-G1', '-GPS*', '-Make', '-Model', '-Orientation', '-DateTimeOriginal', sortie).trim();
    if (meta) constat.push('métadonnées restées dans l image : ' + meta.replace(/\s+/g, ' '));
  }
  if (constat.length) fautes++;
  console.log(`${constat.length ? 'FAUTE' : 'ok   '}  ${e.nom.padEnd(30)} ${constat.join(' ; ')}`);
}
console.log(`\n${essais.length} fichiers, ${fautes} faute(s). Dossier : ${D}`);
process.exit(fautes ? 1 : 0);

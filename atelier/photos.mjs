// Préparer une photo envoyée par l'artisan, quel que soit son format.
//
// Décision de Fabrice, 3 octobre 2026 : « Tout doit être accepté, iPhone etc.,
// la totale. » Ce module reçoit le fichier tel que l'appareil l'a produit et
// rend une image maîtresse propre, que le générateur découpe ensuite pour le
// site (generateur/composer.mjs) :
//   - JPEG, sRGB, 3 200 px au plus sur le grand côté ;
//   - redressée selon l'orientation EXIF ;
//   - SANS aucune métadonnée : ni position GPS (la maison du client), ni
//     modèle de téléphone, ni date.
//
// Le format se reconnaît aux premiers octets du fichier, jamais à son nom :
// un iPhone appelle .JPG un fichier HEIC, et un PDF renommé .jpg existe.
//
// Ce qui n'est pas une image lisible ne passe pas en silence : `Illisible`
// porte un motif en français, écrit pour l'artisan, qui nomme le fichier.

import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const executer = promisify(execFile);

export const COTE_MAX = 3200;
export const QUALITE = 88;

export class Illisible extends Error {
  constructor(motif) { super(motif); this.name = 'Illisible'; this.motif = motif; }
}

// ---------------------------------------------------------------- reconnaître
const ascii = (b, debut, fin) => b.subarray(debut, fin).toString('latin1');

// Rend { famille, format } : famille = image | raw | video | autre.
export function reconnaitre(b) {
  if (!b || b.length < 12) return { famille: 'autre', format: 'vide' };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { famille: 'image', format: 'jpeg' };
  if (ascii(b, 1, 4) === 'PNG') return { famille: 'image', format: 'png' };
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return { famille: 'image', format: 'webp' };
  if (ascii(b, 0, 3) === 'GIF') return { famille: 'image', format: 'gif' };
  if (ascii(b, 0, 2) === 'BM') return { famille: 'image', format: 'bmp' };
  if (ascii(b, 0, 5) === '%PDF-') return { famille: 'autre', format: 'pdf' };
  if (ascii(b, 0, 64).includes('<svg') || ascii(b, 0, 5) === '<?xml') return { famille: 'image', format: 'svg' };
  if (ascii(b, 4, 8) === 'ftyp') {
    const marque = ascii(b, 8, 12);
    const compat = ascii(b, 8, Math.min(b.length, 64));
    if (/^(heic|heix|heim|heis|hevc|hevx|mif1|msf1)$/.test(marque) && !/avif/.test(marque)) {
      if (marque === 'mif1' && compat.includes('avif')) return { famille: 'image', format: 'avif' };
      return { famille: 'image', format: 'heic' };
    }
    if (marque === 'avif' || marque === 'avis') return { famille: 'image', format: 'avif' };
    if (/^(qt  |isom|iso2|mp41|mp42|M4V |3gp|avc1|dash)/.test(marque)) return { famille: 'video', format: marque === 'qt  ' ? 'mov' : 'mp4' };
    return { famille: 'autre', format: 'iso-' + marque.trim() };
  }
  // TIFF et formats RAW bâtis sur TIFF (DNG, NEF, CR2, ARW...) : II*\0 ou MM\0*
  const tiff = (b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0)
            || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 0x2a);
  if (tiff) return { famille: 'tiff', format: 'tiff' }; // tranché par exiftool : RAW ou image
  if (ascii(b, 0, 12) === 'FUJIFILMCCD-') return { famille: 'raw', format: 'raf' };
  if (b[0] === 0x49 && b[1] === 0x49 && ascii(b, 8, 10) === 'CR') return { famille: 'raw', format: 'cr3' };
  return { famille: 'autre', format: 'inconnu' };
}

// ---------------------------------------------------------------- outils système
// exiftool : extraire l'aperçu JPEG d'un RAW et dire si un TIFF est un RAW.
async function exiftool(args) {
  try {
    const { stdout } = await executer('exiftool', args, { encoding: 'buffer', maxBuffer: 256 * 1024 * 1024 });
    return stdout;
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error('exiftool absent du serveur : impossible de lire un fichier RAW');
    throw e;
  }
}

async function avecFichier(buffer, ext, fn) {
  const dossier = await mkdtemp(join(tmpdir(), 'sito-photo-'));
  const chemin = join(dossier, 'entree.' + ext);
  try { await writeFile(chemin, buffer); return await fn(chemin, dossier); }
  finally { await rm(dossier, { recursive: true, force: true }); }
}

// Le plus grand aperçu JPEG valide caché dans un RAW (DNG Apple ProRAW,
// Samsung, Nikon...). Les DNG en JPEG XL ont parfois un « PreviewJXL » qui
// contient les données du capteur : on ne prend que de vrais JPEG.
async function apercuRaw(buffer) {
  return avecFichier(buffer, 'dng', async (chemin) => {
    let meilleur = null;
    for (const balise of ['JpgFromRaw', 'PreviewImage', 'OtherImage', 'ThumbnailImage']) {
      const sortie = await exiftool(['-b', '-' + balise, chemin]).catch(() => Buffer.alloc(0));
      if (sortie.length < 1000 || sortie[0] !== 0xff || sortie[1] !== 0xd8) continue;
      // Un DNG range ses données de capteur en « JPEG sans perte » : elles
      // commencent comme un JPEG mais ne sont pas une image. On ne garde
      // qu'un aperçu qui se décode vraiment, d'au moins 320 px.
      const m = await sharp(sortie, { failOn: 'error' }).resize(64).toBuffer({ resolveWithObject: true })
        .then(() => sharp(sortie).metadata()).catch(() => null);
      if (!m || Math.max(m.width || 0, m.height || 0) < 320) continue;
      if (!meilleur || m.width * m.height > meilleur.px) meilleur = { image: sortie, px: m.width * m.height };
    }
    if (!meilleur) throw new Illisible('fichier RAW sans aperçu exploitable');
    // L'orientation du RAW s'applique à l'aperçu.
    const orient = (await exiftool(['-s3', '-n', '-Orientation', chemin])).toString().trim();
    return { image: meilleur.image, orientation: Number(orient) || 1 };
  });
}

async function estRaw(buffer) {
  return avecFichier(buffer, 'tif', async (chemin) => {
    const type = (await exiftool(['-s3', '-FileType', chemin])).toString().trim();
    return type && type !== 'TIFF' && type !== 'BTF' ? type.toLowerCase() : null;
  });
}

// ffmpeg : BMP et ce que sharp ne lit pas, converti en PNG sans perte.
async function versPng(buffer, ext) {
  return avecFichier(buffer, ext, async (chemin, dossier) => {
    const sortie = join(dossier, 'sortie.png');
    try { await executer('ffmpeg', ['-v', 'error', '-y', '-i', chemin, '-frames:v', '1', sortie]); }
    catch (e) {
      if (e.code === 'ENOENT') throw new Error('ffmpeg absent du serveur');
      throw new Illisible('image ' + ext.toUpperCase() + ' abîmée ou incomplète');
    }
    return readFile(sortie);
  });
}

// ---------------------------------------------------------------- préparer
// `options.convertirHeic(buffer)` rend un JPEG ou un PNG. En production, c'est
// la transformation d'images de Supabase (voir atelier/heic.mjs) : Sitô ne
// décode jamais lui-même le HEVC. Sans convertisseur, le HEIC n'est pas
// refusé : il reste « reçu » et le motif le dit.
export async function preparerPhoto(buffer, { nom = 'photo', chemin = null, convertirHeic = null } = {}) {
  const { famille, format } = reconnaitre(buffer);
  const refus = (pourquoi) => { throw new Illisible(`« ${nom} » : ${pourquoi}`); };

  if (format === 'vide') refus('le fichier est vide ou coupé');
  if (format === 'pdf') refus("c'est un document PDF, pas une photo");
  if (famille === 'video') return { video: true, format };

  let entree = buffer, orientationForcee = null, formatReel = format;
  try {
    if (famille === 'tiff') {
      const raw = await estRaw(buffer);
      if (raw) {
        formatReel = raw;
        const a = await apercuRaw(buffer);
        entree = a.image; orientationForcee = a.orientation;
      }
    } else if (famille === 'raw') {
      const a = await apercuRaw(buffer);
      entree = a.image; orientationForcee = a.orientation;
    } else if (format === 'heic') {
      if (!convertirHeic) return { attente: true, format, motif: 'photo HEIC reçue, conversion en attente' };
      entree = await convertirHeic(buffer, { chemin });
    } else if (format === 'bmp') {
      entree = await versPng(buffer, 'bmp');
    } else if (famille === 'autre') {
      refus("ce fichier n'est pas une photo reconnue");
    }
  } catch (e) {
    if (e instanceof Illisible) throw new Illisible(e.motif.startsWith('«') ? e.motif : `« ${nom} » : ${e.motif}`);
    throw e;
  }

  let image = sharp(entree, { failOn: 'error', animated: false, limitInputPixels: 300e6 });
  let meta;
  try { meta = await image.metadata(); }
  catch { refus('image abîmée ou incomplète'); }

  // Orientation : celle du RAW quand l'aperçu n'en porte pas, sinon l'EXIF.
  if (orientationForcee && orientationForcee !== 1 && !meta.orientation) {
    const angles = { 3: 180, 6: 90, 8: 270 };
    image = image.rotate(angles[orientationForcee] || 0);
  } else {
    image = image.rotate();
  }

  let sortie;
  try {
    sortie = await image
      .resize({ width: COTE_MAX, height: COTE_MAX, fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: QUALITE, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
  } catch { refus('image abîmée ou incomplète'); }

  return {
    format: formatReel,
    image: sortie.data,
    largeur: sortie.info.width,
    hauteur: sortie.info.height,
    octets: sortie.data.length,
  };
}

// Préparer une photo sur l'appareil, avant l'envoi.
//
// Décision du 3 octobre : « Tout doit être accepté, iPhone etc., la totale. »
//   - Ce que le navigateur sait lire (JPEG, PNG, WebP, GIF, AVIF, BMP, et HEIC
//     sur iPhone) est redressé, réduit à 3 200 px au plus et réencodé en JPEG :
//     le fichier qui part ne contient plus aucune métadonnée (ni GPS, ni
//     appareil). Moins lourd à envoyer sur un chantier en 4G.
//     Décision du 9 octobre : le fichier d'origine en pleine résolution part
//     ensuite (photos.chemin_source) ; le site se met à jour avec la version
//     réduite sans l'attendre. T44 (pas de serveur, 29 octobre) : l'original
//     part lui aussi sans métadonnées (nettoyer.ts), et seulement pour JPEG
//     et PNG, qu'on sait nettoyer sans toucher à l'image.
//   - RAW, DNG, TIFF : l'aperçu JPEG rangé dedans par l'appareil part à la
//     place (apercu-brut.ts), préparé comme une photo.
//   - Ce qui ne se lit pas (HEIC hors iPhone, RAW sans aperçu) ne part
//     pas : aucun serveur ne le convertirait, et il porterait sa position
//     GPS. L'artisan lit pourquoi et comment l'envoyer ; la photo reste sur
//     son téléphone.
//   - Une vidéo part telle quelle, rangée avec les vidéos.
//   - Le reste (PDF, document…) est refusé avec une phrase claire.
// La nature du fichier se lit dans ses premiers octets, pas dans son nom.

import { sansMetadonnees } from './nettoyer';
import { apercuIntegre } from './apercu-brut';
import { retirerPosition } from './video';

export const COTE_MAX = 3200;
export const QUALITE = 0.88;
export const POIDS_MAX = 50 * 1024 * 1024; // plafond actuel du stockage (offre à 150 Mo plus tard)

export type Nature =
  | { genre: 'image'; format: string; lisible: boolean } // lisible : un navigateur peut la décoder
  | { genre: 'brut'; format: string }                    // RAW / TIFF : jamais décodé ici
  | { genre: 'video'; format: string }
  | { genre: 'refuse'; format: string; raison: string };

const ascii = (o: Uint8Array, debut: number, fin: number) => String.fromCharCode(...o.slice(debut, fin));

export function reconnaitre(o: Uint8Array, nom = ''): Nature {
  const ext = (nom.split('.').pop() || '').toLowerCase();
  if (o.length < 12) return { genre: 'refuse', format: 'inconnu', raison: 'Fichier vide ou incomplet.' };
  if (o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff) return { genre: 'image', format: 'jpeg', lisible: true };
  if (o[0] === 0x89 && ascii(o, 1, 4) === 'PNG') return { genre: 'image', format: 'png', lisible: true };
  if (ascii(o, 0, 4) === 'GIF8') return { genre: 'image', format: 'gif', lisible: true };
  if (ascii(o, 0, 4) === 'RIFF' && ascii(o, 8, 12) === 'WEBP') return { genre: 'image', format: 'webp', lisible: true };
  if (ascii(o, 0, 2) === 'BM') return { genre: 'image', format: 'bmp', lisible: true };
  if (ascii(o, 0, 4) === '%PDF') return { genre: 'refuse', format: 'pdf', raison: 'Un PDF n’est pas une photo. Envoyez la photo elle-même.' };
  if (o[0] === 0x1a && o[1] === 0x45 && o[2] === 0xdf && o[3] === 0xa3) return { genre: 'video', format: 'webm' };
  // TIFF et la plupart des RAW (DNG, NEF, ARW, CR2…) commencent comme un TIFF
  if ((ascii(o, 0, 4) === 'II*\0') || (ascii(o, 0, 4) === 'MM\0*')) {
    const format = ['dng', 'nef', 'arw', 'cr2', 'orf', 'rw2', 'pef', 'srw', 'raf'].includes(ext) ? ext : (ext === 'tif' || ext === 'tiff' ? 'tiff' : 'raw');
    return { genre: 'brut', format };
  }
  if (ascii(o, 0, 4) === 'IIRO' || ascii(o, 0, 4) === 'IIU\0') return { genre: 'brut', format: ext || 'raw' }; // ORF, RW2
  if (ascii(o, 0, 8) === 'FUJIFILM') return { genre: 'brut', format: 'raf' };
  if (ascii(o, 4, 8) === 'ftyp') {
    const marque = ascii(o, 8, 12);
    if (['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'].includes(marque)) return { genre: 'image', format: 'heic', lisible: true };
    if (marque === 'avif' || marque === 'avis') return { genre: 'image', format: 'avif', lisible: true };
    if (marque === 'crx ') return { genre: 'brut', format: 'cr3' };
    if (marque === 'qt  ') return { genre: 'video', format: 'mov' };
    if (marque.startsWith('3g')) return { genre: 'video', format: '3gp' };
    return { genre: 'video', format: 'mp4' }; // isom, mp41, mp42, avc1, M4V…
  }
  return { genre: 'refuse', format: ext || 'inconnu', raison: 'Ce fichier n’est ni une photo ni une vidéo.' };
}

export type Preparee =
  // original : le fichier d'origine, à envoyer après la version réduite (si elle a été réduite ici)
  | { genre: 'photo'; fichier: Blob; format: string; prepareeIci: boolean; largeur?: number; hauteur?: number; original?: Blob }
  | { genre: 'video'; fichier: Blob; format: string }
  | { genre: 'refuse'; raison: string };

// Le type que porte le fichier envoyé, pour chaque format que « reconnaitre » sait nommer.
// Il fait autorité sur ce que le navigateur annonce : celui-ci lit le registre du système,
// qui change d'un poste à l'autre (sur Windows, un .DNG est annoncé « image/DNG »).
// Ce type devient le Content-Type de l'objet dans le stockage : il ne doit dépendre
// que du format reconnu, jamais de l'appareil qui envoie.
const TYPES: Record<string, string> = {
  heic: 'image/heic', avif: 'image/avif', tiff: 'image/tiff',
  dng: 'image/x-adobe-dng', nef: 'image/x-nikon-nef', arw: 'image/x-sony-arw',
  cr2: 'image/x-canon-cr2', cr3: 'image/x-canon-cr3', orf: 'image/x-olympus-orf',
  rw2: 'image/x-panasonic-rw2', pef: 'image/x-pentax-pef', srw: 'image/x-samsung-srw',
  raf: 'image/x-fuji-raf',
  mov: 'video/quicktime', mp4: 'video/mp4', webm: 'video/webm', '3gp': 'video/3gpp',
};

// Ce qui ne se lit pas sur ce téléphone : dit, avec le moyen de l'envoyer quand même.
function illisible(format: string): string {
  const f = format.toUpperCase();
  if (format === 'heic') return 'Ce téléphone ne sait pas lire les photos HEIC. Elle reste sur votre téléphone, rien n’est perdu : sur iPhone, Réglages > Appareil photo > Formats > « Le plus compatible », ou envoyez-la depuis l’iPhone.';
  return `Ce téléphone ne sait pas lire les photos ${f}. Elle reste sur votre appareil, rien n’est perdu : envoyez sa version JPEG.`;
}

export async function preparer(fichier: File): Promise<Preparee> {
  if (fichier.size === 0) return { genre: 'refuse', raison: 'Fichier vide.' };
  const tete = new Uint8Array(await fichier.slice(0, 64).arrayBuffer());
  const nature = reconnaitre(tete, fichier.name);
  if (nature.genre === 'refuse') return { genre: 'refuse', raison: nature.raison };

  if (nature.genre === 'video') {
    if (fichier.size > POIDS_MAX) return { genre: 'refuse', raison: `Vidéo trop lourde (${mo(fichier.size)}). Maximum ${mo(POIDS_MAX)} pour l’instant : envoyez un extrait plus court.` };
    // La position GPS du tournage part avant l'envoi, sans réencoder (T46).
    if (nature.format === 'mp4' || nature.format === 'mov' || nature.format === '3gp') {
      const octets = new Uint8Array(await fichier.arrayBuffer());
      if (retirerPosition(octets) > 0) return { genre: 'video', fichier: new Blob([octets], { type: TYPES[nature.format] }), format: nature.format };
    }
    return { genre: 'video', fichier: avecType(fichier, nature.format), format: nature.format };
  }

  if (nature.genre === 'image' && nature.lisible) {
    const jpeg = await reencoder(fichier);
    if (jpeg) {
      // L'original suit, sans métadonnées, s'il tient dans la limite du stockage ;
      // sinon, ou s'il ne se nettoie pas, la version réduite suffit.
      const nettoye = fichier.size <= POIDS_MAX ? await sansMetadonnees(fichier, nature.format) : null;
      const original = nettoye ? avecType(new File([nettoye], fichier.name), nature.format) : undefined;
      return { genre: 'photo', fichier: jpeg.blob, format: nature.format, prepareeIci: true, largeur: jpeg.largeur, hauteur: jpeg.hauteur, original };
    }
  }
  // RAW, DNG, TIFF : l'aperçu JPEG que l'appareil a rangé dedans, s'il y en a un.
  if (nature.genre === 'brut' && fichier.size <= POIDS_MAX) {
    const apercu = await apercuIntegre(fichier);
    const jpeg = apercu ? await reencoder(apercu) : null;
    if (jpeg) return { genre: 'photo', fichier: jpeg.blob, format: nature.format, prepareeIci: true, largeur: jpeg.largeur, hauteur: jpeg.hauteur };
  }
  return { genre: 'refuse', raison: illisible(nature.format) };
}

function avecType(f: File, format: string): Blob {
  // Formats hors du tableau (jpeg, png, gif, webp, bmp) : le navigateur les annonce
  // partout pareil, on garde ce qu'il dit.
  const type = TYPES[format] || f.type || 'application/octet-stream';
  return f.type === type ? f : new Blob([f], { type });
}

const mo = (o: number) => `${Math.round(o / 1024 / 1024)} Mo`;

// L'image décodée, redressée selon son EXIF. D'abord createImageBitmap avec
// l'option d'orientation ; si le navigateur la refuse (WebKit, essai de T49,
// 3 nov. 2026 : la photo d'un iPhone n'était jamais envoyée), une balise <img>,
// que Safari, Chrome et Firefox redressent d'eux-mêmes (image-orientation:
// from-image, valeur par défaut). Rend null si rien ne la lit.
type Decodee = { largeur: number; hauteur: number; dessiner: (ctx: CanvasRenderingContext2D, l: number, h: number) => void; fermer: () => void };
async function decoder(fichier: Blob): Promise<Decodee | null> {
  try {
    const b = await createImageBitmap(fichier, { imageOrientation: 'from-image' });
    return { largeur: b.width, hauteur: b.height, dessiner: (ctx, l, h) => ctx.drawImage(b, 0, 0, l, h), fermer: () => b.close() };
  } catch { /* option refusée ou format non lu : on essaie une balise <img> */ }
  const url = URL.createObjectURL(fichier);
  try {
    const im = new Image();
    im.decoding = 'async';
    im.src = url;
    await im.decode();
    return { largeur: im.naturalWidth, hauteur: im.naturalHeight, dessiner: (ctx, l, h) => ctx.drawImage(im, 0, 0, l, h),
      fermer: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    return null; // HEIC hors Safari, image abîmée…
  }
}

async function reencoder(fichier: Blob): Promise<{ blob: Blob; largeur: number; hauteur: number } | null> {
  const image = await decoder(fichier);
  if (!image) return null;
  try {
    if (image.largeur < 1 || image.hauteur < 1) return null;
    const echelle = Math.min(1, COTE_MAX / Math.max(image.largeur, image.hauteur));
    const largeur = Math.max(1, Math.round(image.largeur * echelle));
    const hauteur = Math.max(1, Math.round(image.hauteur * echelle));
    const toile = document.createElement('canvas');
    toile.width = largeur; toile.height = hauteur;
    const ctx = toile.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff'; // un PNG transparent ne devient pas noir
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    image.dessiner(ctx, largeur, hauteur);
    const blob = await new Promise<Blob | null>((ok) => toile.toBlob(ok, 'image/jpeg', QUALITE));
    toile.width = toile.height = 0; // libère la mémoire tout de suite (iPhone)
    return blob && blob.size > 0 ? { blob, largeur, hauteur } : null;
  } finally {
    image.fermer();
  }
}

// Le nom envoyé : celui de l'appareil, extension mise à jour si la photo a été réencodée.
export function nomEnvoye(nom: string, p: Extract<Preparee, { genre: 'photo' }>): string {
  const base = (nom.replace(/\.[^.]*$/, '') || 'photo').slice(0, 80);
  return p.prepareeIci ? `${base}.jpg` : nom.slice(0, 100);
}

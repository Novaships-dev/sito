// Préparer une photo sur l'appareil, avant l'envoi.
//
// Décision du 3 octobre : « Tout doit être accepté, iPhone etc., la totale. »
//   - Ce que le navigateur sait lire (JPEG, PNG, WebP, GIF, AVIF, BMP, et HEIC
//     sur iPhone) est redressé, réduit à 3 200 px au plus et réencodé en JPEG :
//     le fichier qui part ne contient plus aucune métadonnée (ni GPS, ni
//     appareil). Moins lourd à envoyer sur un chantier en 4G.
//     Décision du 9 octobre : le fichier d'origine en pleine résolution part
//     ensuite (photos.chemin_source) ; le site se met à jour avec la version
//     réduite sans l'attendre.
//   - Ce qu'il ne sait pas lire (RAW, DNG, HEIC hors iPhone, TIFF) part tel
//     quel ; le service le convertit (atelier/photos.mjs).
//   - Une vidéo part telle quelle, rangée avec les vidéos.
//   - Le reste (PDF, document…) est refusé avec une phrase claire.
// La nature du fichier se lit dans ses premiers octets, pas dans son nom.

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

const TYPES: Record<string, string> = {
  heic: 'image/heic', avif: 'image/avif', dng: 'image/x-adobe-dng', tiff: 'image/tiff', cr3: 'image/x-canon-cr3',
  mov: 'video/quicktime', mp4: 'video/mp4', webm: 'video/webm', '3gp': 'video/3gpp',
};

export async function preparer(fichier: File): Promise<Preparee> {
  if (fichier.size === 0) return { genre: 'refuse', raison: 'Fichier vide.' };
  const tete = new Uint8Array(await fichier.slice(0, 64).arrayBuffer());
  const nature = reconnaitre(tete, fichier.name);
  if (nature.genre === 'refuse') return { genre: 'refuse', raison: nature.raison };

  if (nature.genre === 'video') {
    if (fichier.size > POIDS_MAX) return { genre: 'refuse', raison: `Vidéo trop lourde (${mo(fichier.size)}). Maximum ${mo(POIDS_MAX)} pour l’instant : envoyez un extrait plus court.` };
    return { genre: 'video', fichier: avecType(fichier, nature.format), format: nature.format };
  }

  if (nature.genre === 'image' && nature.lisible) {
    const jpeg = await reencoder(fichier);
    // L'original suit s'il tient dans la limite du stockage ; sinon la version réduite suffit.
    const original = fichier.size <= POIDS_MAX ? avecType(fichier, nature.format) : undefined;
    if (jpeg) return { genre: 'photo', fichier: jpeg.blob, format: nature.format, prepareeIci: true, largeur: jpeg.largeur, hauteur: jpeg.hauteur, original };
  }
  // Non décodable ici : part tel quel, le service s'en charge.
  if (fichier.size > POIDS_MAX) return { genre: 'refuse', raison: `Photo trop lourde (${mo(fichier.size)}). Maximum ${mo(POIDS_MAX)} pour l’instant.` };
  return { genre: 'photo', fichier: avecType(fichier, nature.format), format: nature.format, prepareeIci: false };
}

function avecType(f: File, format: string): Blob {
  const type = f.type || TYPES[format] || 'application/octet-stream';
  return f.type === type ? f : new Blob([f], { type });
}

const mo = (o: number) => `${Math.round(o / 1024 / 1024)} Mo`;

async function reencoder(fichier: Blob): Promise<{ blob: Blob; largeur: number; hauteur: number } | null> {
  let image: ImageBitmap;
  try {
    image = await createImageBitmap(fichier, { imageOrientation: 'from-image' });
  } catch {
    return null; // HEIC hors Safari, image abîmée…
  }
  try {
    if (image.width < 1 || image.height < 1) return null;
    const echelle = Math.min(1, COTE_MAX / Math.max(image.width, image.height));
    const largeur = Math.max(1, Math.round(image.width * echelle));
    const hauteur = Math.max(1, Math.round(image.height * echelle));
    const toile = document.createElement('canvas');
    toile.width = largeur; toile.height = hauteur;
    const ctx = toile.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff'; // un PNG transparent ne devient pas noir
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, largeur, hauteur);
    const blob = await new Promise<Blob | null>((ok) => toile.toBlob(ok, 'image/jpeg', QUALITE));
    toile.width = toile.height = 0; // libère la mémoire tout de suite (iPhone)
    return blob && blob.size > 0 ? { blob, largeur, hauteur } : null;
  } finally {
    image.close();
  }
}

// Le nom envoyé : celui de l'appareil, extension mise à jour si la photo a été réencodée.
export function nomEnvoye(nom: string, p: Extract<Preparee, { genre: 'photo' }>): string {
  const base = (nom.replace(/\.[^.]*$/, '') || 'photo').slice(0, 80);
  return p.prepareeIci ? `${base}.jpg` : nom.slice(0, 100);
}

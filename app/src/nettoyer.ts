// Retirer les métadonnées d'un original sans toucher à l'image (tâche T44,
// décision du 29 octobre 2026 : pas de serveur, les photos sont préparées sur
// le téléphone). L'original en pleine résolution suit la version réduite
// (décision du 9 octobre) : il part sans position GPS, sans marque ni numéro
// d'appareil, sans date de prise de vue, sans texte caché.
//
//   JPEG : on recopie les segments utiles (JFIF, profil de couleur ICC, Adobe,
//          tables, image) et on jette Exif, XMP, IPTC, commentaires. Seule
//          l'orientation est remise, dans un Exif minimal, pour que l'original
//          reste à l'endroit. Les octets de l'image sont recopiés tels quels.
//   PNG  : on garde les blocs de l'image et de la couleur, on jette eXIf,
//          tEXt, zTXt, iTXt, tIME.
// Tout autre format : null, l'original ne part pas (la version réduite, en
// JPEG sans métadonnées, suffit au site).

export async function sansMetadonnees(fichier: Blob, format: string): Promise<Blob | null> {
  const o = new Uint8Array(await fichier.arrayBuffer());
  if (format === 'jpeg') return jpeg(o);
  if (format === 'png') return png(o);
  return null;
}

// ------------------------------------------------------------------- JPEG

// APP0 JFIF, APP2 ICC_PROFILE, APP14 Adobe gardés ; tout autre APPn et COM partent.
const GARDES_APP: Record<number, string> = { 0xe0: 'JFIF', 0xe2: 'ICC_PROFILE', 0xee: 'Adobe' };

export function jpeg(o: Uint8Array, imposee?: number): Blob | null {
  if (o[0] !== 0xff || o[1] !== 0xd8) return null;
  // 1. les segments jusqu'au début de l'image (SOS) ; l'orientation au passage
  const gardes: Uint8Array[] = [];
  let orientation = 1;
  let i = 2;
  let image: Uint8Array | null = null;
  while (i + 4 <= o.length) {
    if (o[i] !== 0xff) return null; // fichier abîmé : rien plutôt qu'un fichier douteux
    const marque = o[i + 1];
    if (marque === 0xff) { i++; continue; } // octets de remplissage
    if (marque === 0x01 || (marque >= 0xd0 && marque <= 0xd8)) { i += 2; continue; } // marques sans longueur
    const longueur = (o[i + 2] << 8) | o[i + 3];
    if (longueur < 2 || i + 2 + longueur > o.length) return null;
    const fin = i + 2 + longueur;
    const donnees = o.subarray(i + 4, fin);
    if (marque === 0xda) { image = o.subarray(i); break; } // le reste est l'image, recopiée telle quelle
    if (marque === 0xe1) {
      if (commence(donnees, 'Exif\0\0')) orientation = lireOrientation(donnees.subarray(6)) ?? orientation;
    } else if (marque >= 0xe0 && marque <= 0xef) {
      if (GARDES_APP[marque] && commence(donnees, GARDES_APP[marque])) gardes.push(o.subarray(i, fin));
    } else if (marque !== 0xfe) {
      gardes.push(o.subarray(i, fin)); // tables (DQT, DHT, SOF, DRI…) ; 0xFE, commentaire, part
    }
    i = fin;
  }
  if (!image) return null;
  if (imposee) orientation = imposee;
  // 2. SOI, JFIF s'il y en a un, l'Exif minimal, le reste
  const jfif = gardes.length && gardes[0][1] === 0xe0 ? [gardes.shift() as Uint8Array] : [];
  const exif = orientation !== 1 ? [exifOrientation(orientation)] : [];
  return new Blob([o.subarray(0, 2), ...jfif, ...exif, ...gardes, image] as BlobPart[], { type: 'image/jpeg' });
}

const commence = (o: Uint8Array, texte: string) => o.length >= texte.length && [...texte].every((c, k) => o[k] === c.charCodeAt(0));

// L'orientation (étiquette 0x0112) dans le premier répertoire d'un en-tête TIFF.
export function lireOrientation(t: Uint8Array): number | null {
  if (t.length < 8) return null;
  const petit = t[0] === 0x49 && t[1] === 0x49; // « II » : petit-boutiste
  if (!petit && !(t[0] === 0x4d && t[1] === 0x4d)) return null;
  const u16 = (k: number) => (k + 2 > t.length ? -1 : petit ? t[k] | (t[k + 1] << 8) : (t[k] << 8) | t[k + 1]);
  const u32 = (k: number) => (k + 4 > t.length ? -1 : petit ? (t[k] | (t[k + 1] << 8) | (t[k + 2] << 16)) + t[k + 3] * 2 ** 24 : t[k] * 2 ** 24 + ((t[k + 1] << 16) | (t[k + 2] << 8) | t[k + 3]));
  const ifd = u32(4);
  const n = u16(ifd);
  if (ifd < 8 || n < 0) return null;
  for (let e = 0; e < n; e++) {
    const k = ifd + 2 + e * 12;
    if (u16(k) === 0x0112) { const v = u16(k + 8); return v >= 1 && v <= 8 ? v : null; }
  }
  return null;
}

// Un segment APP1 Exif qui ne dit qu'une chose : l'orientation.
function exifOrientation(v: number): Uint8Array {
  const corps = [
    ...'Exif\0\0'.split('').map((c) => c.charCodeAt(0)),
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // TIFF gros-boutiste, répertoire à l'octet 8
    0x00, 0x01, // une seule étiquette
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, v, 0x00, 0x00, // Orientation, SHORT, 1 valeur
    0x00, 0x00, 0x00, 0x00, // pas de répertoire suivant
  ];
  const longueur = corps.length + 2;
  return new Uint8Array([0xff, 0xe1, longueur >> 8, longueur & 0xff, ...corps]);
}

// ------------------------------------------------------------------- PNG

const SIGNATURE_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const BLOCS_GARDES = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'sBIT', 'pHYs', 'bKGD', 'acTL', 'fcTL', 'fdAT']);

function png(o: Uint8Array): Blob | null {
  if (!SIGNATURE_PNG.every((b, k) => o[k] === b)) return null;
  const morceaux: Uint8Array[] = [o.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= o.length) {
    const longueur = ((o[i] << 24) >>> 0) + ((o[i + 1] << 16) | (o[i + 2] << 8) | o[i + 3]);
    const fin = i + 12 + longueur;
    if (fin > o.length) return null;
    const type = String.fromCharCode(o[i + 4], o[i + 5], o[i + 6], o[i + 7]);
    if (BLOCS_GARDES.has(type)) morceaux.push(o.subarray(i, fin)); // bloc recopié avec sa somme de contrôle
    i = fin;
    if (type === 'IEND') return new Blob(morceaux as BlobPart[], { type: 'image/png' });
  }
  return null;
}

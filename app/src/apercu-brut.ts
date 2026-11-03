// Une photo RAW (DNG, NEF, CR2, ARW…) ne se décode pas dans un navigateur. Mais
// presque toutes portent, à l'intérieur, un aperçu JPEG fait par l'appareil,
// souvent en pleine taille. Sans serveur pour convertir le RAW (décision du
// 29 octobre 2026), c'est cet aperçu qui part, réduit et sans métadonnées
// comme toute photo (décision du 3 octobre : « tout doit être accepté »).
//
// Rend l'aperçu le plus grand, nettoyé (nettoyer.ts), avec l'orientation du
// RAW, ou null s'il n'y en a pas : la photo est alors dite illisible.
import { jpeg, lireOrientation } from './nettoyer';

const COTE_MIN = 1000; // grand côté en pixels : en dessous, c'est une vignette, pas une photo
const ESSAIS = 4;             // aperçus décodés au plus, du plus lourd au plus léger

// La fin d'un JPEG qui commence en d : on saute ses segments jusqu'à l'image
// (SOS), puis on cherche FF D9 ; dans l'image, FF n'est suivi que de 00 ou
// d'une marque de reprise (D0 à D7). Une vignette nichée dans l'Exif d'un
// aperçu est ainsi sautée avec son segment, au lieu de couper l'aperçu.
function finJpeg(o: Uint8Array, d: number): number | null {
  let i = d + 2;
  while (i + 4 <= o.length && o[i] === 0xff) {
    const marque = o[i + 1];
    if (marque === 0xff) { i++; continue; }
    const longueur = (o[i + 2] << 8) | o[i + 3];
    if (longueur < 2) return null;
    i += 2 + longueur;
    if (marque === 0xda) {
      for (; i + 1 < o.length; i++) {
        if (o[i] === 0xff && o[i + 1] === 0xd9) return i + 2;
      }
      return null;
    }
  }
  return null;
}

export async function apercuIntegre(fichier: Blob): Promise<Blob | null> {
  const o = new Uint8Array(await fichier.arrayBuffer());
  const apercus: { d: number; f: number }[] = [];
  for (let i = 8; i + 3 < o.length; i++) {
    if (o[i] !== 0xff || o[i + 1] !== 0xd8 || o[i + 2] !== 0xff) continue;
    const f = finJpeg(o, i);
    if (f === null) continue;
    apercus.push({ d: i, f });
    i = f - 1; // ce qui est dedans (vignette) n'est pas un aperçu à part
  }
  const candidats = apercus.sort((a, b) => (b.f - b.d) - (a.f - a.d)).slice(0, ESSAIS);
  if (!candidats.length) return null;
  const orientation = lireOrientation(o.subarray(0, Math.min(o.length, 65536))) ?? undefined;
  let meilleur: { blob: Blob; aire: number } | null = null;
  for (const a of candidats) {
    const propre = jpeg(o.subarray(a.d, a.f), orientation);
    if (!propre) continue;
    try {
      const b = await createImageBitmap(propre);
      const aire = Math.max(b.width, b.height) >= COTE_MIN ? b.width * b.height : 0;
      b.close();
      if (aire && (!meilleur || aire > meilleur.aire)) meilleur = { blob: propre, aire };
    } catch { /* aperçu qui ne se décode pas : le suivant */ }
  }
  return meilleur?.blob ?? null;
}

// Detection de la coupure dans une photo avant/apres : l endroit ou la facade
// passe du support fatigue au parement neuf. Mesure de chaleur colorimetrique.
import sharp from 'sharp';

export async function trouverCoupure(fichier) {
  const { data, info } = await sharp(fichier).resize(240, null).removeAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const y0 = Math.floor(h * 0.35), y1 = Math.floor(h * 0.85);
  const chaleur = new Array(w).fill(0);
  // Verdeur : un filet de chantier est vert, et il couvre exactement le cote
  // non termine. Quand il est present, c est le signal le plus sur.
  const verdeur = new Array(w).fill(0);
  for (let x = 0; x < w; x++) {
    let s = 0, v = 0, n = 0;
    for (let y = y0; y < y1; y++) {
      const i = (y * w + x) * c;
      s += data[i] - data[i + 2];
      v += data[i + 1] - (data[i] + data[i + 2]) / 2;
      n++;
    }
    chaleur[x] = s / n;
    verdeur[x] = v / n;
  }
  // Lissage : une descente d eau ou un volet ne doit pas passer pour la coupure.
  const L = Math.max(2, Math.round(w * 0.03));
  const lisse = chaleur.map((_, x) => {
    let s = 0, n = 0;
    for (let k = Math.max(0, x - L); k <= Math.min(w - 1, x + L); k++) { s += chaleur[k]; n++; }
    return s / n;
  });

  // Saut LOCAL, pas global : on compare une fenetre a gauche et une fenetre a
  // droite du point candidat. La moyenne sur toute la largeur se laissait
  // tromper par un filet de chantier vert au bord de l image ; le 15 septembre
  // 2026 elle a place la couture a 33 % alors que l oeil la voit a 51 %.
  const F = Math.max(4, Math.round(w * 0.15));
  let best = { x: 0.5, ecart: 0 };
  for (let x = Math.floor(w * 0.18); x < Math.floor(w * 0.82); x++) {
    let g = 0, ng = 0, d = 0, nd = 0;
    for (let k = Math.max(0, x - F); k < x; k++) { g += lisse[k]; ng++; }
    for (let k = x; k < Math.min(w, x + F); k++) { d += lisse[k]; nd++; }
    if (!ng || !nd) continue;
    const ecart = d / nd - g / ng;
    if (ecart > best.ecart) best = { x: x / w, ecart };
  }
  // Si un filet vert couvre un cote, la coupure est la ou il s arrete : on
  // prend le dernier point ou la verdeur tient encore la moitie de son palier.
  const lisseV = verdeur.map((_, x) => {
    let s = 0, n = 0;
    for (let k = Math.max(0, x - L); k <= Math.min(w - 1, x + L); k++) { s += verdeur[k]; n++; }
    return s / n;
  });
  const palier = Math.max(...lisseV.slice(Math.floor(w * 0.05), Math.floor(w * 0.5)));
  if (palier > 5) {
    let fin = 0;
    for (let x = Math.floor(w * 0.15); x < Math.floor(w * 0.85); x++)
      if (lisseV[x] > palier * 0.32) fin = x;
    if (fin > w * 0.15) return { fraction: fin / w, ecart: palier, fiable: true, par: 'filet' };
  }
  return { fraction: best.x, ecart: best.ecart, fiable: best.ecart > 4, par: 'chaleur' };
}

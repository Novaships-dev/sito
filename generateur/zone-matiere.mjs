// Trouve dans une photo la fenetre d enduit la plus propre et la plus chaude :
// celle qui servira a remplir les lettres du titre. Aucune main humaine, la
// zone se mesure. Elle change d un artisan a l autre, donc le titre aussi.
import sharp from 'sharp';

export async function zoneMatiere(fichier, sortie, nom, tailles = [700, 1100, 1500]) {
  const W = 480;
  const { data, info } = await sharp(fichier).resize({ width: W }).removeAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, c = info.channels;
  const at = (x, y, k) => data[(y * w + x) * c + k];
  const bw = Math.round(w * 0.34), bh = Math.round(h * 0.20);
  let mieux = null;
  for (let y = 0; y + bh < h; y += 6) {
    for (let x = 0; x + bw < w; x += 6) {
      let n = 0, sr = 0, sg = 0, sb = 0, e = 0;
      for (let j = y; j < y + bh; j += 3) for (let i = x; i < x + bw; i += 3) {
        const r = at(i, j, 0), g = at(i, j, 1), b = at(i, j, 2);
        sr += r; sg += g; sb += b; n++;
        e += Math.abs(r - at(Math.min(i + 3, w - 1), j, 0)) + Math.abs(r - at(i, Math.min(j + 3, h - 1), 0));
      }
      const mr = sr / n, mg = sg / n, mb = sb / n;
      const chaleur = mr - mb, clair = (mr + mg + mb) / 3, bruit = e / n;
      if (clair < 118 || chaleur < 10) continue;
      const note = chaleur * 1.4 + clair * 0.5 - bruit * 1.8;
      if (!mieux || note > mieux.note) mieux = { x, y, note, bruit, chaleur, clair };
    }
  }
  if (!mieux) mieux = { x: Math.round(w * 0.2), y: Math.round(h * 0.1), bruit: 0, chaleur: 0, clair: 0 };
  const meta = await sharp(fichier).metadata();
  const k = meta.width / w;
  const zone = {
    left: Math.round(mieux.x * k), top: Math.round(mieux.y * k),
    width: Math.round(bw * k), height: Math.round(bh * k),
  };
  const faits = [];
  for (const t of tailles) {
    const base = sharp(fichier).extract(zone).resize({ width: t });
    await base.clone().avif({ quality: 62, effort: 4 }).toFile(`${sortie}/${nom}-${t}.avif`);
    await base.clone().webp({ quality: 80, effort: 4 }).toFile(`${sortie}/${nom}-${t}.webp`);
    faits.push(t);
  }
  return { tailles: faits, zone, bruit: +mieux.bruit.toFixed(1), chaleur: +mieux.chaleur.toFixed(1) };
}

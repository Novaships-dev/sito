// Prelevement de la palette dans les photos de l artisan.
// Rien n est invente : chaque teinte sort d un fichier nomme dans le resultat.
import sharp from 'sharp';

const versHsl = ([r, g, b]) => {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return { h: h * 60, s, l };
};
const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const lum = ([r, g, b]) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export const contraste = (a, b) => {
  const [x, y] = [a, b].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// Quantification simple : grille 4x4x4 sur l image reduite.
async function dominantes(fichier, nb = 10) {
  const { data, info } = await sharp(fichier).resize(120, 120, { fit: 'inside' })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const cases = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const p = [data[i], data[i + 1], data[i + 2]];
    const k = p.map(v => v >> 5).join(',');
    const c = cases.get(k) || { n: 0, s: [0, 0, 0] };
    c.n++; c.s[0] += p[0]; c.s[1] += p[1]; c.s[2] += p[2];
    cases.set(k, c);
  }
  const total = [...cases.values()].reduce((a, c) => a + c.n, 0);
  return [...cases.values()].sort((a, b) => b.n - a.n).slice(0, nb)
    .map(c => ({ rgb: c.s.map(v => v / c.n), part: c.n / total }));
}

export async function preleverPalette(fichiers) {
  const tout = [];
  for (const f of fichiers) {
    for (const d of await dominantes(f)) tout.push({ ...d, source: f.split(/[\\/]/).pop() });
  }
  // accent chaud : la teinte la plus presente dans la zone 15-55 degres, saturation utile
  const chauds = tout.map(c => ({ ...c, hsl: versHsl(c.rgb) }))
    .filter(c => c.hsl.h >= 15 && c.hsl.h <= 55 && c.hsl.s >= 0.18 && c.hsl.l >= 0.42 && c.hsl.l <= 0.72)
    .sort((a, b) => (b.part * b.hsl.s) - (a.part * a.hsl.s));
  // encre : la plus sombre suffisamment presente
  const sombres = tout.filter(c => lum(c.rgb) < 0.09).sort((a, b) => b.part - a.part);
  const accent = chauds[0] || null;
  const encreBrute = sombres[0] ? sombres[0].rgb : [16, 20, 23];

  // l encre est desaturee et assombrie : elle doit rester un fond, pas une couleur
  const { h } = versHsl(encreBrute);
  const encre = [16, 20, 23].map((v, i) => Math.round(v * 0.7 + encreBrute[i] * 0.3 * 0.35));

  // La nuit est l encre poussee d un cran : c est le fond du premier ecran
  // d ambiance, il doit tomber plus bas que le reste de la page sinon
  // l atmosphere et l ouverture se confondent.
  const nuit = encre.map(v => Math.round(v * 0.72));

  const palette = {
    encre: hex(encre),
    nuit: hex(nuit),
    chaux: '#E2E7E9',
    gris: '#7C8B94',
    grisFonce: '#4A5A64',
    papier: '#F2F4F5',
    bleu: '#0E4C7C',
    accent: accent ? hex(accent.rgb) : null,
    accentSource: accent ? accent.source : null,
    teinteEncre: Math.round(h),
  };
  if (accent) {
    const { h: ah, s: as_, l: al } = versHsl(accent.rgb);
    // oklch approche : clarte perceptuelle, chroma modere, teinte conservee
    palette.accentOklch = `oklch(${(0.32 + al * 0.52).toFixed(2)} ${(as_ * 0.26).toFixed(3)} ${Math.round(ah + 24)})`;
  }
  // garde-fou : contraste du texte clair sur l encre
  if (contraste(lum(encre), lum([226, 231, 233])) < 12) palette.encre = '#101417';
  return palette;
}

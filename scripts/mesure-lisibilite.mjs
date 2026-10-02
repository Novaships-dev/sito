// OUTIL DE REPERAGE, PAS DE JUGEMENT.
// Il photographie la boite de chaque texte et compare la luminance des pixels
// extremes a la mediane du fond. Sur du texte fin, l anti-crenelage fausse la
// mesure vers le bas : ce script signale plus large que la realite. Il sert a
// pointer les endroits a regarder, jamais a declarer une page bonne ou mauvaise.
// Le plancher opposable reste A7 dans verifier-site.mjs, qui lit les couleurs
// declarees. Voir rules/web/composition.md, section « Le texte se lit ».
//
//   node scripts/mesure-lisibilite.mjs <page.html> [tel]
// Contraste reellement rendu : on photographie la boite de chaque texte et on
// compare la couleur des lettres a la couleur dominante du fond derriere elles.
// Les calculs sur la feuille de style ne voient pas une photo, un degrade ni
// un calque de grain. L oeil, si.
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { readFileSync } from 'node:fs';

let b=null; for (const o of [{channel:'chrome'},{},{channel:'msedge'}]) { try { b = await chromium.launch(o); break; } catch {} }
const fichier = process.argv[2] || '/tmp/site.html';
const large = process.argv[3] === 'tel' ? 390 : 1440;
const p = await b.newPage({ viewport:{width:large,height:900}, deviceScaleFactor:1,
  isMobile: large < 500, hasTouch: large < 500 });
await p.goto('file://' + fichier, {waitUntil:'load'});
await p.waitForTimeout(3200);
await p.evaluate(async()=>{ await new Promise(r=>{ let y=0; const s=()=>{ window.scrollTo(0,y); y+=700;
  if (y<document.body.scrollHeight+900) setTimeout(s,50); else { window.scrollTo(0,0); setTimeout(r,600);} }; s(); }); });

const cibles = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('body *').forEach(e => {
    if (e.children.length) return;
    const t = (e.textContent || '').trim();
    if (t.length < 2) return;
    const r = e.getBoundingClientRect();
    if (r.width < 8 || r.height < 6) return;
    const s = getComputedStyle(e);
    if (s.visibility === 'hidden' || s.opacity === '0' || s.display === 'none') return;
    out.push({ texte: t.slice(0, 44), x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY),
      w: Math.round(r.width), h: Math.round(r.height),
      taille: Math.round(parseFloat(s.fontSize)), gras: parseInt(s.fontWeight, 10) || 400,
      couleur: s.color, ou: e.tagName.toLowerCase() + '.' + (e.className || '').toString().trim().split(/\s+/)[0] });
  });
  return out;
});

const lum = (r, g, bl) => { const f = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(bl); };
const rapport = (a, b2) => { const [h, l] = a > b2 ? [a, b2] : [b2, a]; return (h + 0.05) / (l + 0.05); };

const constats = [];
for (const c of cibles) {
  if (c.w > 900 || c.h > 300) continue;
  await p.evaluate(v => window.scrollTo(0, v), Math.max(0, c.y - 300));
  await p.waitForTimeout(90);
  const haut = await p.evaluate(() => window.scrollY);
  const clip = { x: c.x, y: c.y - haut, width: Math.min(c.w, 700), height: Math.min(c.h, 90) };
  if (clip.y < 0 || clip.y + clip.height > 900) continue;
  let png;
  try { png = PNG.sync.read(await p.screenshot({ clip })); } catch { continue; }
  // Fond : la luminance mediane de la boite. Lettres : le centile oppose, en
  // moyennant les pixels extremes. Regrouper par couleur ratait le texte fin,
  // dont les pixels se repartissent sur plusieurs teintes voisines.
  const lums = [], pix = [];
  for (let i = 0; i < png.data.length; i += 4) {
    const L = lum(png.data[i], png.data[i+1], png.data[i+2]);
    lums.push(L); pix.push([png.data[i], png.data[i+1], png.data[i+2]]);
  }
  if (lums.length < 40) continue;
  const ordre = lums.map((L, i) => [L, i]).sort((a, b2) => a[0] - b2[0]);
  const med = ordre[Math.floor(ordre.length * 0.5)][0];
  const bas = ordre.slice(0, Math.max(4, Math.floor(ordre.length * 0.04)));
  const sommet = ordre.slice(-Math.max(4, Math.floor(ordre.length * 0.04)));
  const moyenne = (arr) => arr.reduce((a, x) => a + x[0], 0) / arr.length;
  const lBas = moyenne(bas), lHaut = moyenne(sommet);
  const lf = med;
  const lLettres = Math.abs(lBas - med) > Math.abs(lHaut - med) ? lBas : lHaut;
  const lettres = 1;
  if (!lettres) continue;
  const r = rapport(lLettres, lf);
  const grand = c.taille >= 24 || (c.taille >= 18.66 && c.gras >= 700);
  const plancher = grand ? 3 : 4.5;
  if (r < plancher) constats.push({ ...c, rapport: +r.toFixed(2), plancher });
}
console.log(JSON.stringify(constats, null, 1));
await b.close();

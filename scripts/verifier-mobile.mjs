#!/usr/bin/env node
// Verification du site tel qu il s affiche sur un telephone, pas tel qu il est
// ecrit. La plupart des artisans ouvriront la page sur leur telephone : ce
// controle est aussi obligatoire que celui du texte.
//
// usage : node scripts/verifier-mobile.mjs <dossier ou index.html>
// Sortie 1 s il reste un constat bloquant, 3 si aucun navigateur n est trouve.

import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mesurer as mesurerContraste } from './contraste-rendu.mjs';

const cible = process.argv[2];
if (!cible) { console.error('usage: node scripts/verifier-mobile.mjs <chemin>'); process.exit(2); }
const fichier = statSync(cible).isDirectory() ? join(cible, 'index.html') : cible;
if (!existsSync(fichier)) { console.error('introuvable : ' + fichier); process.exit(2); }

// Playwright pilote un vrai navigateur. Sur Windows il utilise le Chrome deja
// installe (canal chrome), donc rien a telecharger.
// Le moteur : chromium par défaut, `--navigateur webkit` (Safari) ou
// SITO_NAVIGATEUR=webkit (tâche T49, constat S-007).
const iNav = process.argv.indexOf('--navigateur');
const MOTEUR = (iNav > -1 ? process.argv[iNav + 1] : process.env.SITO_NAVIGATEUR) || 'chromium';
if (!['chromium', 'webkit', 'firefox'].includes(MOTEUR)) { console.error('navigateur inconnu : ' + MOTEUR); process.exit(2); }
let chromium;
for (const source of ['playwright', 'playwright-core',
  process.env.ATELIER_PLAYWRIGHT || '']) {
  if (!source) continue;
  try { const m = await import(source); chromium = (m.default || m)[MOTEUR]; if (chromium) break; } catch { /* suivant */ }
}
if (!chromium) { console.log('playwright absent, controle mobile non execute. npm install playwright'); process.exit(3); }

const FORMATS = [
  { nom: 'telephone courant', l: 390, h: 844 },
  { nom: 'petit telephone', l: 360, h: 740 },
  { nom: 'grand telephone', l: 430, h: 932 },
];

// Planchers, voir rules/web/composition.md, section « Le telephone ».
const M = { titre: 40, titrePart: 0.14, titreLarge: 0.86, imagePart: 0.22, texte: 12, doigt: 44, poidsPremier: 420_000 };

let navigateur = null;
// SITO_CHROMIUM : un navigateur deja installe, quand Playwright n a pas
// telecharge le sien (espace de travail de Claude). Sur Windows, Chrome suffit.
const essais = MOTEUR === 'chromium' ? [{ channel: 'chrome' }, {}, { channel: 'msedge' }] : [{}];
if (process.env.SITO_CHROMIUM && MOTEUR === 'chromium') essais.unshift({ executablePath: process.env.SITO_CHROMIUM });
for (const opts of essais) {
  try { navigateur = await chromium.launch(opts); break; } catch { /* suivant */ }
}
if (!navigateur) { console.log(`aucun navigateur utilisable (${MOTEUR}), controle mobile non execute.`); process.exit(3); }
console.log(`moteur : ${MOTEUR}`);

const constats = [];
const nonEssayes = new Set();
for (const f of FORMATS) {
  const page = await navigateur.newPage({
    viewport: { width: f.l, height: f.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  let octets = 0, premier = true;
  page.on('response', async r => { try { if (premier) octets += (await r.body()).length; } catch { /* ignore */ } });
  await page.goto(pathToFileURL(resolve(fichier)).href, { waitUntil: 'networkidle' });
  // Attendre que l ecran d entree soit parti et que les arrivees soient finies.
  // Mesurer pendant l animation donnait des cibles tactiles fantomes : le
  // controle M5 tombait une fois sur six, ce qui est pire que pas de controle.
  await page.waitForFunction(() => {
    const e = document.querySelector('.entree');
    if (e && e.getBoundingClientRect().height > window.innerHeight * 0.4) return false;
    return document.getAnimations().every(a => a.playState !== 'running'
      || (a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity));
  }, null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(350);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  premier = false;

  const d = await page.evaluate((seuils) => {
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    // Un debordement rattrape par un ancetre qui coupe ne se voit pas et ne
    // fait pas defiler : on ne compte que ce qui sort vraiment.
    const coupe = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const o = getComputedStyle(p);
        if (/hidden|clip|auto|scroll/.test(o.overflowX)) return true;
      }
      return false;
    };
    const debord = [];
    document.querySelectorAll('body *').forEach(el => {
      const b = el.getBoundingClientRect();
      if (b.width > 0 && b.left > -1 && b.right > vw + 1 && !coupe(el)) debord.push(el.tagName.toLowerCase());
    });
    const h1 = document.querySelector('h1');
    const bh = h1 ? h1.getBoundingClientRect() : null;
    const images = [...document.querySelectorAll('img')].map(i => i.getBoundingClientRect())
      .filter(b => b.top < vh && b.bottom > 0);
    const surface = images.reduce((a, b) =>
      a + Math.max(0, Math.min(b.bottom, vh) - Math.max(b.top, 0)) * Math.min(b.width, vw), 0);
    const petites = [...document.querySelectorAll('p,dd,dt,td,th,figcaption,span,a,li')]
      .filter(e => e.textContent.trim() && e.getBoundingClientRect().width > 0)
      .map(e => ({ px: parseFloat(getComputedStyle(e).fontSize), t: e.textContent.trim().slice(0, 24) }))
      .sort((a, b) => a.px - b.px);
    // Les affordances clavier volontairement hors champ, comme le lien
    // d evitement, ne sont pas des cibles tactiles.
    // WCAG 2.5.8 : un lien pose au fil d une phrase n est pas une cible a
    // dimensionner. Une commande, si.
    const auFilDuTexte = (e) => e.tagName === 'A'
      && getComputedStyle(e).display === 'inline'
      && /^(P|LI|TD|TH|DD|FIGCAPTION|SPAN)$/.test(e.parentElement ? e.parentElement.tagName : '');
    const petits = [...document.querySelectorAll('a,button,input,select')]
      .filter(e => getComputedStyle(e).pointerEvents !== 'none' && !auFilDuTexte(e))
      .map(e => ({ e, b: e.getBoundingClientRect() }))
      .filter(({ b }) => b.width > 0 && b.left > -1000 && Math.min(b.width, b.height) < seuils.doigt);
    const petitsControles = petits.length;
    // Lesquels : sans leur nom, un constat M5 ne se corrige pas (T49, WebKit).
    const petitsNoms = petits.slice(0, 4).map(({ e, b }) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''} ${Math.round(b.width)}x${Math.round(b.height)}`).join(', ');
    return {
      debordement: debord.length, scroll: document.documentElement.scrollWidth > vw + 1,
      titrePx: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : 0,
      titrePart: bh ? +(Math.max(0, Math.min(bh.bottom, vh) - Math.max(bh.top, 0)) / vh).toFixed(3) : 0,
      titreLarge: bh ? +(bh.width / vw).toFixed(3) : 0,
      imagePart: +(surface / (vw * vh)).toFixed(3),
      plusPetit: petites.length ? Math.round(petites[0].px) : 99,
      plusPetitTexte: petites.length ? petites[0].t : '',
      petitsControles, petitsNoms,
    };
  }, M);

  const dire = (num, ok, libelle, detail, remede) => {
    if (!ok) constats.push({ num, format: f.nom, libelle, detail, remede });
  };
  dire('M0', !d.scroll && d.debordement === 0, 'la page deborde en largeur',
    d.debordement + ' element(s), largeur ' + f.l, 'aucun defilement horizontal sur telephone');
  dire('M1', d.titrePx >= M.titre, 'titre trop petit sur telephone',
    d.titrePx + ' px contre ' + M.titre + ' exiges', 'plancher mobile separe, pas une formule en vw');
  // Un titre d un seul mot ne peut pas occuper 14 % de la hauteur sans devenir
  // illisible. S il barre l ecran d un bord a l autre, il tient sa place.
  dire('M2', d.titrePart >= M.titrePart || d.titreLarge >= M.titreLarge, 'le titre ne tient pas sa place',
    (d.titrePart * 100).toFixed(1) + ' % de la hauteur et ' + (d.titreLarge * 100).toFixed(0) + ' % de la largeur, il faut '
    + (M.titrePart * 100) + ' % de hauteur ou ' + (M.titreLarge * 100) + ' % de largeur', 'voir composition.md');
  dire('M3', d.imagePart >= M.imagePart, 'aucune image sur le premier ecran',
    (d.imagePart * 100).toFixed(1) + ' % contre ' + (M.imagePart * 100) + ' %',
    'sur telephone l image passe au-dessus du titre');
  dire('M4', d.plusPetit >= M.texte, 'texte sous le plancher de lisibilite',
    d.plusPetit + ' px, « ' + d.plusPetitTexte + ' »', 'rien sous ' + M.texte + ' px sur telephone');
  // M12 : chaque texte se lit sur ce qui est reellement derriere lui.
  const ct = await page.evaluate(mesurerContraste, 5);
  dire('M12', ct.total === 0, 'texte illisible sur son fond',
    ct.total + ' texte(s) sous le seuil : '
      + ct.fautes.map(x => x.ou + ' « ' + x.texte + ' » ' + x.ratio + ':1').join(' ; '),
    'chaque surface a ses couleurs de texte, voir generateur/charte.mjs, CONTEXTES');
  dire('M5', d.petitsControles === 0, 'cible tactile trop petite',
    d.petitsControles + ' controle(s) sous ' + M.doigt + ' px : ' + d.petitsNoms, 'un doigt fait 44 px');
  // M7 et M8 : un comparateur peut avoir la bonne taille et ne pas fonctionner
  // au doigt. On l essaie vraiment, en haut et en bas de l image, puis on
  // verifie que le defilement vertical reste possible par-dessus.
  // M11 : le comparateur se manipule par un controle natif, assez large pour
  // etre attrape. Une couche de saisie maison peut passer tous les essais ici
  // et mourir sur un vrai telephone ; un input range, non.
  const cadres = await page.$$('.cadre');
  if (cadres.length) {
    const geo = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.cadre').forEach(c => {
        const g = c.querySelector('input[type=range]');
        const rc = c.getBoundingClientRect();
        out.push(g ? { l: g.getBoundingClientRect().width / rc.width, h: g.getBoundingClientRect().height,
          cache: getComputedStyle(g).pointerEvents === 'none' } : null);
      });
      return out;
    });
    const mauvais = geo.filter(g => !g || g.cache || g.l < 0.8 || g.h < M.doigt).length;
    dire('M11', mauvais === 0, 'comparateur sans controle natif attrapable',
      mauvais + ' cadre(s) sans input range large et haut d au moins ' + M.doigt + ' px',
      'voir rules/web/mouvement.md, V4');
  }
  // Les gestes au doigt passent par le protocole de Chromium (CDP). WebKit ne
  // l a pas : M7, M8 et M9 ne s y essaient pas, et le rapport le dit (T49).
  if (cadres.length && MOTEUR !== 'chromium') { nonEssayes.add('M7, M8, M9 (gestes au doigt : protocole CDP, propre a Chromium)'); }
  else if (cadres.length) try {
    const cdp = await page.context().newCDPSession(page);
    const b = await page.evaluate(() => {
      const c = document.querySelector('.cadre');
      // defilement instantane : un defilement doux fausse toutes les mesures
      window.scrollTo({ top: window.scrollY + c.getBoundingClientRect().top - 120, behavior: 'instant' });
      const r = c.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    });
    await page.waitForTimeout(350);
    const glisser = async (fy, x1, x2) => {
      const y = b.y + b.h * fy;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.w * x1, y }] });
      for (let k = 1; k <= 8; k++)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove',
          touchPoints: [{ x: b.x + b.w * (x1 + (x2 - x1) * k / 8), y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      return page.evaluate(() => (() => {
        // On mesure la couture a l ecran, en pixels, jamais la variable :
        // le 14 septembre 2026, --p changeait sur le cadre sans que rien ne
        // bouge, et tous les controles la declaraient bonne. Voir V4.
        const c = document.querySelector('.cadre');
        const co = c.querySelector('.couture');
        const r = c.getBoundingClientRect();
        if (!co || !r.width) return NaN;
        const x = co.getBoundingClientRect().x + co.getBoundingClientRect().width / 2 - r.x;
        return x / r.width * 100;
      })());
    };
    const haut = await glisser(0.10, 0.50, 0.15);
    const bas = await glisser(0.88, 0.15, 0.85);
    dire('M7', Math.abs(haut - 15) < 6 && Math.abs(bas - 85) < 6,
      'le comparateur ne suit pas le doigt',
      'haut de l image ' + haut.toFixed(0) + ' % pour 15 attendus, bas ' + bas.toFixed(0) + ' % pour 85',
      'toute l image doit etre saisissable, pas une bande au milieu');

    // M9 : une simple touche suffit. Un glissement peut etre vole par le
    // systeme ; une touche, jamais.
    await page.evaluate(() => { const s = document.querySelector('.cadre .glissiere'); s.value = 50; s.dispatchEvent(new Event('input')); });
    const cdp2 = cdp;
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.w * 0.25, y: b.y + b.h * 0.25 }] });
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const touche = await page.evaluate(() => (() => {
        // On mesure la couture a l ecran, en pixels, jamais la variable :
        // le 14 septembre 2026, --p changeait sur le cadre sans que rien ne
        // bouge, et tous les controles la declaraient bonne. Voir V4.
        const c = document.querySelector('.cadre');
        const co = c.querySelector('.couture');
        const r = c.getBoundingClientRect();
        if (!co || !r.width) return NaN;
        const x = co.getBoundingClientRect().x + co.getBoundingClientRect().width / 2 - r.x;
        return x / r.width * 100;
      })());
    dire('M9', Math.abs(touche - 25) < 6, 'une simple touche ne fait rien',
      'touche a 25 % de la largeur, obtenu ' + touche.toFixed(0) + ' %',
      'la touche simple est le seul geste qu aucun systeme ne vole');

    // M10 : il existe des commandes explicites, qui ne dependent d aucun geste.
    const boutons = await page.$$('.bascule .vers');
    let bougent = false;
    if (boutons.length >= 2) {
      await boutons[0].click();
      const a0 = await page.evaluate(() => (() => {
        // On mesure la couture a l ecran, en pixels, jamais la variable :
        // le 14 septembre 2026, --p changeait sur le cadre sans que rien ne
        // bouge, et tous les controles la declaraient bonne. Voir V4.
        const c = document.querySelector('.cadre');
        const co = c.querySelector('.couture');
        const r = c.getBoundingClientRect();
        if (!co || !r.width) return NaN;
        const x = co.getBoundingClientRect().x + co.getBoundingClientRect().width / 2 - r.x;
        return x / r.width * 100;
      })());
      await boutons[1].click();
      const a1 = await page.evaluate(() => (() => {
        // On mesure la couture a l ecran, en pixels, jamais la variable :
        // le 14 septembre 2026, --p changeait sur le cadre sans que rien ne
        // bouge, et tous les controles la declaraient bonne. Voir V4.
        const c = document.querySelector('.cadre');
        const co = c.querySelector('.couture');
        const r = c.getBoundingClientRect();
        if (!co || !r.width) return NaN;
        const x = co.getBoundingClientRect().x + co.getBoundingClientRect().width / 2 - r.x;
        return x / r.width * 100;
      })());
      bougent = a0 < 5 && a1 > 95;
    }
    dire('M10', bougent, 'aucune commande explicite qui fonctionne',
      boutons.length + ' bouton(s) trouve(s)',
      'deux boutons, voir l avant et voir l apres, toujours presents');

    const avant = await page.evaluate(() => window.scrollY);
    const x = b.x + b.w * 0.5;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: b.y + b.h * 0.7 }] });
    for (let k = 1; k <= 8; k++)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: b.y + b.h * 0.7 - k * 18 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(250);
    const apres = await page.evaluate(() => window.scrollY);
    dire('M8', apres > avant + 20, 'le comparateur bloque le defilement de la page',
      'la page n a pas bouge sous un glissement vertical',
      'glissement vertical : la page defile ; horizontal : la couture bouge');
  } catch (err) {
    dire('M7', false, 'le comparateur n a pas pu etre essaye au doigt',
      String(err.message).split('\n')[0], 'la page recharge ou casse pendant le glissement');
  }

  // M13 : la barre d appel tient en bas de l ecran du debut a la fin de la
  // page, rien ne la recouvre, et elle ne cache pas la fin du contenu.
  {
    const positions = ['haut', 'milieu', 'bas'];
    const fautes = [];
    for (const ou of positions) {
      await page.evaluate((ou) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: ou === 'haut' ? 0 : ou === 'milieu' ? max / 2 : max, behavior: 'instant' });
      }, ou);
      await page.waitForTimeout(250);
      const r = await page.evaluate(() => {
        const vh = window.innerHeight;
        const b = document.querySelector('.barre-appel');
        if (!b || getComputedStyle(b).display === 'none') return 'aucune barre d appel';
        const rb = b.getBoundingClientRect();
        if (Math.abs(rb.bottom - vh) > 2) return 'la barre n est pas collee en bas (' + Math.round(rb.bottom) + ' pour ' + vh + ')';
        const a = b.querySelector('[data-appel]');
        if (!a) return 'barre sans bouton ni emplacement';
        const ra = a.getBoundingClientRect();
        if (Math.min(ra.width, ra.height) < 44) return 'bouton d appel de ' + Math.round(ra.height) + ' px';
        const href = a.getAttribute('href');
        if (href !== null && !/^tel:\+33[1-9]\d{8}$/.test(href)) return 'lien d appel faux : ' + href;
        if (!a.textContent.trim()) return 'bouton d appel muet';
        const dessus = document.elementFromPoint(ra.left + ra.width / 2, ra.top + ra.height / 2);
        if (!dessus || !b.contains(dessus)) return 'la barre est recouverte par ' + (dessus ? dessus.className || dessus.tagName : 'rien');
        return '';
      });
      if (r) fautes.push(ou + ' : ' + r);
    }
    // en bas de page, la derniere ligne du pied de page passe au-dessus de la barre
    const cache = await page.evaluate(() => {
      const b = document.querySelector('.barre-appel');
      const pied = document.querySelector('footer') || document.body.lastElementChild;
      if (!b || !pied) return '';
      const yb = b.getBoundingClientRect().top, yp = pied.getBoundingClientRect().bottom;
      return yp > yb + 1 ? 'la fin de la page passe sous la barre (' + Math.round(yp - yb) + ' px)' : '';
    });
    if (cache) fautes.push(cache);
    dire('M13', fautes.length === 0, 'la barre d appel ne tient pas', fautes.join(' ; '),
      'rules/web/client.md : une barre d appel fixe en bas sur telephone');
  }

  if (f.l === 390) dire('M6', octets <= M.poidsPremier, 'premier ecran trop lourd sur telephone',
    Math.round(octets / 1024) + ' Ko contre ' + Math.round(M.poidsPremier / 1024) + ' Ko', 'voir performance.md');

  console.log(`  ${f.nom.padEnd(18)} titre ${String(d.titrePx).padStart(3)} px, ${(d.titrePart * 100).toFixed(0).padStart(2)} % de l ecran, image ${(d.imagePart * 100).toFixed(0).padStart(2)} %, plus petit texte ${d.plusPetit} px`);
  await page.close();
}
await navigateur.close();

for (const n of nonEssayes) console.log(`NON ESSAYE sous ${MOTEUR} : ${n}`);
if (!constats.length) {
  console.log('Aucun constat. La page tient sur un telephone.');
  process.exit(0);
}
for (const c of constats) console.log(`\n[BLOQUANT] ${c.num} ${c.libelle} (${c.format})\n  ${c.detail}\n  remede: ${c.remede}`);
console.log('\n' + constats.length + ' bloquant(s) sur telephone.');
process.exit(1);

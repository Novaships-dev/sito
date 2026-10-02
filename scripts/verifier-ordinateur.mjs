// Controle de rendu sur ordinateur. Le pendant de verifier-mobile.mjs : meme
// exigence, autre appareil. Une page doit fonctionner sur les deux, et les
// deux doivent se prouver sans qu on ait a y penser.
//
// Raison d etre : le comparateur a ete corrige pour le doigt, puis casse pour
// la souris, puis l inverse, parce qu un seul des deux etait verifie.
//
//   node scripts/verifier-ordinateur.mjs <dossier ou fichier.html>
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const arg = process.argv[2];
if (!arg) { console.error('usage: node scripts/verifier-ordinateur.mjs <chemin>'); process.exit(2); }
const cible = resolve(arg);
const fichier = existsSync(cible) && statSync(cible).isDirectory() ? join(cible, 'index.html') : cible;
if (!existsSync(fichier)) { console.error('introuvable : ' + fichier); process.exit(2); }

let chromium;
for (const source of ['playwright', 'playwright-core', process.env.ATELIER_PLAYWRIGHT || '']) {
  if (!source) continue;
  try { const m = await import(source); chromium = (m.default || m).chromium; if (chromium) break; } catch { /* suivant */ }
}
if (!chromium) { console.log('playwright absent, controle ordinateur non execute. npm install playwright'); process.exit(3); }

let navigateur = null;
for (const opts of [{ channel: 'chrome' }, {}, { channel: 'msedge' }]) {
  try { navigateur = await chromium.launch(opts); break; } catch { /* suivant */ }
}
if (!navigateur) { console.log('aucun navigateur utilisable, controle ordinateur non execute.'); process.exit(3); }

const ECRANS = [{ nom: 'grand ecran', l: 1440, h: 900 }, { nom: 'portable', l: 1280, h: 800 }];
const constats = [];

for (const e of ECRANS) {
  const page = await navigateur.newPage({ viewport: { width: e.l, height: e.h } });
  const erreurs = [];
  page.on('pageerror', x => erreurs.push(String(x).slice(0, 120)));
  const dire = (num, ok, libelle, detail, remede) => {
    if (!ok) constats.push({ num, libelle: libelle + ' (' + e.nom + ')', detail, remede });
  };
  const urlDepart = 'file://' + fichier;
  await page.goto(urlDepart, { waitUntil: 'load' });

  // O1 : l ecran d entree part tout seul, meme si le script casse
  await page.waitForTimeout(2900);
  const entreeVisible = await page.evaluate(() => {
    const el = document.querySelector('.entree');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.height > window.innerHeight * 0.5 && getComputedStyle(el).opacity !== '0';
  });
  dire('O1', !entreeVisible, 'l ecran d entree ne part pas',
    'encore plein ecran apres 2,9 s', 'voir rules/web/mouvement.md, V3');

  // Le premier cadre muni d un controle, amene dans l ecran : sur certains
  // archetypes il est sous la ligne de flottaison, et une souris ne peut pas
  // cliquer ce qu elle ne voit pas.
  const cadre = await page.$('.cadre:has(.glissiere)') || await page.$('.cadre');
  if (cadre) {
    await cadre.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const b = await cadre.boundingBox();
    const id = await cadre.evaluate(el => { el.dataset.essai = '1'; return 1; });
    const lire = () => page.evaluate(() => (() => {
        // On mesure la couture a l ecran, en pixels, jamais la variable :
        // le 14 septembre 2026, --p changeait sur le cadre sans que rien ne
        // bouge, et tous les controles la declaraient bonne. Voir V4.
        const c = document.querySelector('[data-essai]');
        const co = c.querySelector('.couture');
        const r = c.getBoundingClientRect();
        if (!co || !r.width) return NaN;
        const x = co.getBoundingClientRect().x + co.getBoundingClientRect().width / 2 - r.x;
        return x / r.width * 100;
      })());
    const poser = (v) => page.evaluate(v => { const s = document.querySelector('[data-essai] .glissiere'); s.value = v; s.dispatchEvent(new Event('input')); }, v);

    // O2 : la souris entraine la couture
    await poser(50);
    await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) { await page.mouse.move(b.x + b.width * (0.5 + i * 0.05), b.y + b.height * 0.5); await page.waitForTimeout(25); }
    await page.mouse.up();
    const apresGlissement = await lire();
    dire('O2', Math.abs(apresGlissement - 80) < 6, 'le comparateur ne suit pas la souris',
      'attendu 80 %, obtenu ' + Math.round(apresGlissement) + ' %', 'voir rules/web/mouvement.md, V4');

    // O3 : un clic pose la couture la ou on clique
    await poser(50);
    await page.mouse.click(b.x + b.width * 0.25, b.y + b.height * 0.5);
    await page.waitForTimeout(150);
    const apresClic = await lire();
    dire('O3', Math.abs(apresClic - 25) < 6, 'un clic ne pose pas la couture',
      'clic a 25 %, obtenu ' + Math.round(apresClic) + ' %', 'voir rules/web/mouvement.md, V4');

    // O4 : le clavier, seul chemin garanti
    await poser(50);
    const g = await page.$('[data-essai] .glissiere');
    await g.focus();
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    const apresClavier = await lire();
    dire('O4', apresClavier > 55, 'le comparateur ne repond pas au clavier',
      'dix fleches droite, obtenu ' + Math.round(apresClavier) + ' %', 'WCAG 2.1.1, non negociable');

    // O5 : les boutons explicites
    await poser(50);
    // Les boutons de CE comparateur, pas ceux d un autre plus bas dans la page.
    await page.evaluate(() => {
      const c = document.querySelector('[data-essai]');
      const bloc = c && (c.closest('.comparateur') || c.parentNode);
      if (bloc) bloc.querySelectorAll('.vers').forEach(b => b.dataset.essaiBouton = '1');
    });
    const boutons = await page.$$('[data-essai-bouton]');
    if (boutons.length) {
      await boutons[boutons.length - 1].click();
      await page.waitForTimeout(200);
      const apresBouton = await lire();
      dire('O5', apresBouton > 90, 'les boutons avant et apres ne font rien',
        'obtenu ' + Math.round(apresBouton) + ' %', 'voir rules/web/mouvement.md, V4');
    }

    // O6 : aucun glissement ne doit changer de page
    dire('O6', page.url() === urlDepart, 'la page a navigue pendant la manipulation',
      page.url().slice(-60), 'overscroll-behavior-x:none, voir mouvement.md, V4');
  }

  // O7 : l anneau du pointeur reste colle a la fleche
  if (await page.$('.pointeur')) {
    await page.mouse.move(700, 420); await page.waitForTimeout(300);
    await page.mouse.move(420, 640, { steps: 4 }); await page.waitForTimeout(140);
    const ecart = await page.evaluate(() => {
      const r = document.querySelector('.pointeur').getBoundingClientRect();
      return Math.round(Math.hypot(r.x + r.width / 2 - 420, r.y + r.height / 2 - 640));
    });
    dire('O7', ecart < 70, 'le pointeur dessine traine derriere la fleche',
      ecart + ' px d ecart apres 140 ms', 'voir rules/web/mouvement.md, V6');
  }

  // O8 : le nuancier teinte la moitie apres
  const teintes = await page.$$('.nuancier .teinte');
  if (teintes.length > 1) {
    await teintes[1].click(); await page.waitForTimeout(400);
    const pose = await page.evaluate(() => getComputedStyle(document.querySelector('[data-essai]') || document.querySelector('.cadre')).getPropertyValue('--teinte').trim());
    dire('O8', !!pose, 'le nuancier ne teinte rien', 'variable --teinte vide', 'voir mouvement.md, V4');
  }

  // O9 : l estimateur recalcule
  const estim = await page.$('#estim');
  if (estim) {
    const avant = await page.evaluate(() => [...document.querySelectorAll("#estim [data-sortie=bas], #estim [data-sortie=haut]")].map(e=>e.textContent).join("-"));
    await page.evaluate(() => {
      const s = document.querySelector('#estim input[type=range]');
      if (s) { s.value = Math.min(+s.max, +s.value + 80); s.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.waitForTimeout(700);
    const apres = await page.evaluate(() => [...document.querySelectorAll("#estim [data-sortie=bas], #estim [data-sortie=haut]")].map(e=>e.textContent).join("-"));
    dire('O9', avant !== apres, 'l estimateur ne recalcule pas',
      'meme montant avant et apres : ' + (apres || 'vide'), 'voir mouvement.md, V4');
  }

  // O10 : aucune erreur de script
  dire('O10', erreurs.length === 0, 'erreur de script', erreurs.join(' | ').slice(0, 160),
    'une page qui jette une erreur a des morceaux morts');

  await page.close();
}

// O12 : le texte s affiche dans les polices declarees.
// Le 1er octobre 2026, une variable de police se referencait elle-meme
// (--texte-police:var(--texte-police)). Le navigateur l invalide sans bruit
// et retombe sur sa police par defaut, a empattements. Les cinq controles
// passaient ; la page, elle, avait change de voix.
{
  const page = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + fichier, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const r = await page.evaluate(async () => {
    await document.fonts.ready;
    const declarees = new Set();
    for (const f of document.fonts) declarees.add(f.family.replace(/["']/g, ''));
    const fautes = [];
    for (const sel of ['body', 'h1', 'p', '.enseigne', '.note']) {
      const n = document.querySelector(sel); if (!n) continue;
      const premiere = getComputedStyle(n).fontFamily.split(',')[0].trim().replace(/["']/g, '');
      if (!declarees.has(premiere)) fautes.push(sel + ' en ' + premiere);
    }
    return { fautes, declarees: [...declarees] };
  });
  if (r.fautes.length) constats.push({
    num: 'O12', libelle: 'texte hors des polices declarees',
    detail: r.fautes.join(', ') + ' ; declarees : ' + r.declarees.join(', '),
    remede: "une variable de police vide ou circulaire retombe sur la police du navigateur ; voir generateur/charte.mjs" });
  await page.close();
}

// O11 : sans JavaScript, le contenu reste lisible.
// Une arrivee animee ne doit jamais etre une condition d affichage : si la
// classe attendue n arrive pas, le premier ecran doit rester visible.
// Le 16 septembre 2026, un iPhone n a affiche qu un degrade vide.
{
  const page = await navigateur.newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  await page.goto('file://' + fichier, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const caches = await page.evaluate(() => {
    const sel = 'h1, h2, p, figure, section, .nuancier, .photo, .phrase-atmo';
    const sortie = [];
    for (const n of document.querySelectorAll(sel)) {
      const r = n.getBoundingClientRect();
      if (r.width < 40 || r.height < 12) continue;
      const st = getComputedStyle(n);
      if (st.display === 'none') continue;
      if (st.visibility === 'hidden' || parseFloat(st.opacity) < 0.2) {
        sortie.push((n.tagName + '.' + (n.className || '')).slice(0, 48));
        if (sortie.length > 7) break;
      }
    }
    return sortie;
  });
  if (caches.length) {
    constats.push({
      num: 'O11', libelle: 'contenu invisible sans JavaScript',
      detail: caches.length + ' bloc(s) a opacite nulle : ' + caches.join(', '),
      remede: "l arrivee se demande par une classe posee par le script (body.anime), jamais l inverse ; voir mouvement.md, V1"
    });
  }
  await page.close();
}

await navigateur.close();

if (constats.length === 0) {
  console.log('Aucun constat. La page fonctionne a la souris et au clavier.');
  process.exit(0);
}
for (const c of constats) {
  console.log('\n[BLOQUANT] ' + c.num + ' ' + c.libelle);
  console.log('  ' + c.detail);
  console.log('  remede: ' + c.remede);
}
console.log('\n' + constats.length + ' bloquant(s) sur ordinateur.');
process.exit(1);

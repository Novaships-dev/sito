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
import { pathToFileURL } from 'node:url';
import { mesurer as mesurerContraste } from './contraste-rendu.mjs';

const arg = process.argv[2];
if (!arg) { console.error('usage: node scripts/verifier-ordinateur.mjs <chemin>'); process.exit(2); }
const cible = resolve(arg);
const fichier = existsSync(cible) && statSync(cible).isDirectory() ? join(cible, 'index.html') : cible;
if (!existsSync(fichier)) { console.error('introuvable : ' + fichier); process.exit(2); }

// Le moteur : chromium par défaut, `--navigateur webkit` (Safari) ou
// SITO_NAVIGATEUR=webkit (tâche T49, constat S-007).
const iNav = process.argv.indexOf('--navigateur');
const MOTEUR = (iNav > -1 ? process.argv[iNav + 1] : process.env.SITO_NAVIGATEUR) || 'chromium';
if (!['chromium', 'webkit', 'firefox'].includes(MOTEUR)) { console.error('navigateur inconnu : ' + MOTEUR); process.exit(2); }
let chromium;
for (const source of ['playwright', 'playwright-core', process.env.ATELIER_PLAYWRIGHT || '']) {
  if (!source) continue;
  try { const m = await import(source); chromium = (m.default || m)[MOTEUR]; if (chromium) break; } catch { /* suivant */ }
}
if (!chromium) { console.log('playwright absent, controle ordinateur non execute. npm install playwright'); process.exit(3); }

let navigateur = null;
// SITO_CHROMIUM : un navigateur deja installe, quand Playwright n a pas
// telecharge le sien (espace de travail de Claude). Sur Windows, Chrome suffit.
const essais = MOTEUR === 'chromium' ? [{ channel: 'chrome' }, {}, { channel: 'msedge' }] : [{}];
if (process.env.SITO_CHROMIUM && MOTEUR === 'chromium') essais.unshift({ executablePath: process.env.SITO_CHROMIUM });
for (const opts of essais) {
  try { navigateur = await chromium.launch(opts); break; } catch { /* suivant */ }
}
if (!navigateur) { console.log(`aucun navigateur utilisable (${MOTEUR}), controle ordinateur non execute.`); process.exit(3); }
console.log(`moteur : ${MOTEUR}`);

const ECRANS = [{ nom: 'grand ecran', l: 1440, h: 900 }, { nom: 'portable', l: 1280, h: 800 }];
const constats = [];

for (const e of ECRANS) {
  const page = await navigateur.newPage({ viewport: { width: e.l, height: e.h } });
  const erreurs = [];
  page.on('pageerror', x => erreurs.push(String(x).slice(0, 120)));
  const dire = (num, ok, libelle, detail, remede) => {
    if (!ok) constats.push({ num, libelle: libelle + ' (' + e.nom + ')', detail, remede });
  };
  // L adresse se demande a Node, elle ne se fabrique pas : sous Windows,
  // 'file://' + 'C:\…\index.html' n est pas ce que le navigateur rend
  // ensuite ('file:///C:/…/index.html'), et O6 croyait voir une navigation.
  const urlDepart = pathToFileURL(fichier).href;
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
      // Un bouton recouvert par un autre bloc ne prend pas le clic : sans ce
      // filet, l attente de Playwright finissait en plantage au lieu d un
      // constat (panneau, 3 novembre 2026, T49).
      let clique = true;
      try { await boutons[boutons.length - 1].click({ timeout: 5000 }); }
      catch (err) {
        clique = false;
        dire('O5', false, 'un bouton du comparateur est recouvert et ne prend pas le clic',
          (err.message.match(/<[^>]+>[^<]*<\/[a-z]+> from [^\n]*intercepts/) || [err.message.split('\n')[0]])[0].slice(0, 140),
          'aucun bloc ne se pose sur un autre, voir generateur/sections/atmosphere.mjs');
      }
      if (clique) {
        await page.waitForTimeout(200);
        const apresBouton = await lire();
        dire('O5', apresBouton > 90, 'les boutons avant et apres ne font rien',
          'obtenu ' + Math.round(apresBouton) + ' %', 'voir rules/web/mouvement.md, V4');
      }
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

  // O14 : sur le premier ecran, sans defiler, on voit comment appeler.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const ap = await page.evaluate(() => {
    const vh = window.innerHeight, vw = window.innerWidth;
    for (const el of document.querySelectorAll('[data-appel]')) {
      const r = el.getBoundingClientRect(), st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility !== 'visible' || r.width < 1) continue;
      if (r.top < 0 || r.bottom > vh || r.left < 0 || r.right > vw) continue;
      const dessus = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!dessus || !(el === dessus || el.contains(dessus))) continue;
      const href = el.getAttribute('href');
      return { ok: true, lien: href, bon: href === null || /^tel:\+33[1-9]\d{8}$/.test(href) };
    }
    return { ok: false };
  });
  dire('O14', ap.ok && ap.bon, 'aucun moyen d appeler sur le premier ecran',
    ap.ok ? 'lien ' + ap.lien : 'ni bouton ni emplacement visible sans defiler',
    'le bouton d appel est dans la pastille du haut, voir generateur/sections/appel.mjs');

  // O15 : la pastille du haut flotte sur le premier ecran ; elle ne touche
  // aucun texte. Le 2 octobre 2026, le bouton d appel l a grandie de quelques
  // pixels et elle est venue coller le nom de l entreprise sur deux
  // compositions, sans qu aucun controle le voie.
  const chevauche = await page.evaluate(() => {
    const p = document.querySelector('.etat.flottante');
    if (!p || getComputedStyle(p).position !== 'absolute') return [];
    const rp = p.getBoundingClientRect(), marge = 4;
    const out = [];
    for (const el of document.querySelectorAll('.atmo h1, .atmo p, .atmo .nom-atmo, .atmo .dit, .atmo .nuancier, .atmo .photo')) {
      if (p.contains(el) || el.closest('[aria-hidden="true"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.left < rp.right && r.right > rp.left && r.top < rp.bottom + marge && r.bottom > rp.top - marge)
        out.push((el.className || el.tagName).toString().slice(0, 30) + ' a ' + Math.round(r.top - rp.bottom) + ' px');
    }
    return out;
  });
  dire('O15', chevauche.length === 0, 'la pastille du haut touche un texte',
    chevauche.join(', '), 'le premier ecran laisse sous la pastille la place de sa hauteur reelle');

  // O13 : chaque texte se lit sur ce qui est reellement derriere lui.
  // Mesure dans le navigateur, apres l arrivee : voir contraste-rendu.mjs.
  const ct = await page.evaluate(mesurerContraste, 5);
  dire('O13', ct.total === 0, 'texte illisible sur son fond',
    ct.total + ' texte(s) sous le seuil sur ' + ct.mesures + ' mesure(s) : '
      + ct.fautes.map(f => f.ou + ' « ' + f.texte + ' » ' + f.ratio + ':1').join(' ; '),
    'chaque surface a ses couleurs de texte, voir generateur/charte.mjs, CONTEXTES');

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
  await page.goto(pathToFileURL(fichier).href, { waitUntil: 'load' });
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
  await page.goto(pathToFileURL(fichier).href, { waitUntil: 'load' });
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

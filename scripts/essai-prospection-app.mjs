// Essai de l'espace de prospection de Fabrice (T70), dans l'app construite, en
// démonstration, au doigt (iPhone 390 px) et à la souris (ordinateur 1280 px).
//
// Ce qu'il mesure dans la page, jamais ce que l'app dit d'elle-même :
//   - la liste du jour : rappels à heure fixe devant, tous les artisans du jour ;
//   - la fiche : bouton d'appel vers le bon numéro, angle, points forts et faibles ;
//   - un résultat enregistré : statut changé, fiche sortie ou gardée dans la
//     liste selon la règle, numéro effacé quand l'appel n'est plus du jour,
//     historique écrit, compteur du jour à jour ;
//   - l'ajout à la main : la fiche apparaît, son numéro est gardé ;
//   - le rendu : pas de débordement, cibles de 44 px, champs nommés, console propre.
// Contre-essai (--contre-essai) : sur une copie de l'app où le numéro n'est
// jamais effacé (SITO_APP_DIST), l'essai doit rougir.
//
// Avant : cd app && npm run build.
import { createServer } from 'node:http';
import { readFile, mkdtemp, cp, readdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { RACINE } from './env.mjs';

const CONTRE = process.argv.includes('--contre-essai');
const DIST0 = process.env.SITO_APP_DIST || join(RACINE, 'app', 'dist');
if (!existsSync(join(DIST0, 'index.html'))) { console.error('app/dist absent : lancer « npm run build » dans app/ avant.'); process.exit(2); }

if (CONTRE) {
  // Une copie où appliquerResultat garde toujours le numéro : l'essai doit trouver la faute.
  const copie = await mkdtemp(join(tmpdir(), 'sito-pros-casse-'));
  await cp(DIST0, copie, { recursive: true });
  let casse = 0;
  for (const f of await readdir(join(copie, 'assets'))) {
    if (!f.endsWith('.js')) continue;
    const chemin = join(copie, 'assets', f);
    const t = await readFile(chemin, 'utf8');
    const u = t.replace(/\.telephone=null/g, '.__numero_garde=null');
    if (u !== t) { await writeFile(chemin, u); casse++; }
  }
  const r = spawnSync(process.execPath, [process.argv[1]], { env: { ...process.env, SITO_APP_DIST: copie }, encoding: 'utf8' });
  await rm(copie, { recursive: true, force: true });
  const rouge = r.status !== 0 && /FAUTE/.test(r.stdout);
  console.log(`contre-essai : ${casse} fichier(s) cassé(s), l'essai ${rouge ? 'rougit (juste)' : 'reste vert (FAUTE)'}`);
  process.exit(casse && rouge ? 0 : 1);
}

let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` : ${detail}` : ''}`); } return cond; };

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const serveur = createServer(async (req, res) => {
  const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = join(DIST0, chemin === '/' ? 'index.html' : chemin);
  if (!f.startsWith(DIST0)) { res.writeHead(400).end(); return; }
  try { res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }).end(await readFile(f)); }
  catch { res.writeHead(404).end('absent'); }
});
await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${serveur.address().port}/`;

async function lancer() {
  for (const c of [process.env.SITO_CHROMIUM, undefined, '/usr/bin/chromium', '/usr/bin/google-chrome']) {
    if (c !== undefined && (!c || !existsSync(c))) continue;
    try { return await chromium.launch(c ? { executablePath: c } : {}); } catch { /* suivant */ }
  }
  throw new Error('aucun Chromium');
}
const navigateur = await lancer();

async function rendu(p, nom) {
  const m = await p.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; };
    const cibles = [...document.querySelectorAll('main a, main button, main input:not([type=checkbox]), main textarea')].filter(vis);
    return {
      deborde: document.documentElement.scrollWidth - innerWidth,
      petites: cibles.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).map((e) => (e.textContent || e.id || e.tagName).trim().slice(0, 40)),
      sansNom: [...document.querySelectorAll('main input, main textarea')].filter(vis).filter((e) => !(e.id && document.querySelector(`label[for="${e.id}"]`)) && !e.getAttribute('aria-label')).length,
    };
  });
  ok(m.deborde <= 0, `${nom} : rien ne dépasse à droite`, `${m.deborde} px`);
  ok(!m.petites.length, `${nom} : toutes les cibles font 44 px au moins`, m.petites.join(' | '));
  ok(!m.sansNom, `${nom} : chaque champ a un libellé`, `${m.sansNom}`);
}

try {
  for (const app of [{ nom: 'iPhone 390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, { nom: 'ordinateur 1280', viewport: { width: 1280, height: 800 } }]) {
    console.log(`\n${app.nom}`);
    const c = await navigateur.newContext({ viewport: app.viewport, isMobile: app.isMobile, hasTouch: app.hasTouch, locale: 'fr-FR', timezoneId: 'Europe/Paris' });
    const p = await c.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await p.goto(`${BASE}?demo#/connexion`);
    await p.fill('#courriel', 'artisan@exemple.fr');
    await p.fill('#mot-de-passe', 'chantier13');
    await p.click('button:has-text("Me connecter")');
    await p.waitForTimeout(400);
    await p.evaluate(() => { location.hash = '#/prospection'; });
    await p.waitForSelector('.p-carte');

    const titre = await p.textContent('h1');
    ok(/^Appels du /.test(titre || ''), 'le titre dit les appels du jour', titre);
    const noms = await p.$$eval('.p-carte strong', (e) => e.map((x) => x.textContent));
    ok(noms.length === 7, 'les 7 artisans du jour sont listés', `${noms.length}`);
    ok(noms[0] === 'Façades du Garlaban', 'le rappel à heure fixe passe en premier', noms[0]);
    ok((await p.textContent('.p-objectif strong')) === '0', 'compteur du jour à 0 au départ');
    await rendu(p, 'liste');

    // une fiche nouvelle : appel, angle, diagnostic
    await p.click('.p-carte:has-text("Toitures Provence Azur")');
    await p.waitForSelector('.p-fiche');
    const tel = await p.getAttribute('.p-bouton--appel', 'href');
    ok(tel === 'tel:0639980002', 'le bouton appelle le numéro du jour', tel);
    ok(/2017/.test(await p.textContent('.p-angle')), 'l’angle d’appel est affiché');
    ok((await p.$$('.p-diag-col--faible li')).length === 3, 'les 3 points faibles sont listés');
    ok((await p.$$('.p-diag-col--fort li')).length === 1, 'le point fort est listé');
    await rendu(p, 'fiche');

    // refus : sort de la liste, numéro effacé, historique écrit
    await p.click('.p-choix-btn:has-text("Refusé")');
    await p.fill('#p-raison', 'Déjà un prestataire');
    await p.click('button:has-text("Enregistrer le résultat")');
    await p.waitForSelector('.p-histo li');
    ok(/Refusé/.test(await p.textContent('.p-fiche-tete')), 'la fiche dit « Refusé »');
    ok(!(await p.$('.p-bouton--appel')), 'le numéro d’un refusé est effacé');
    ok(/Déjà un prestataire/.test(await p.textContent('.p-faits')), 'la raison du refus est gardée');
    ok((await p.$$('.p-histo li')).length === 1, 'l’historique compte l’appel');
    await p.evaluate(() => { location.hash = '#/prospection'; });
    await p.waitForTimeout(300);
    const noms2 = await p.$$eval('.p-carte strong', (e) => e.map((x) => x.textContent));
    ok(!noms2.includes('Toitures Provence Azur'), 'un refusé sort de la liste du jour');
    ok((await p.textContent('.p-objectif strong')) === '1', 'compteur du jour à 1');

    // rappel demain : reste visible au pipeline, numéro effacé (fiche de la soirée)
    await p.click('.p-carte:has-text("Atelier Couleurs Sud")');
    await p.click('.p-choix-btn:has-text("À rappeler")');
    ok(!!(await p.$('#p-rappel-le')), 'un rappel demande sa date');
    await p.fill('#p-rappel-heure', '14:30');
    await p.click('button:has-text("Enregistrer le résultat")');
    await p.waitForSelector('.p-histo li');
    ok(!(await p.$('.p-bouton--appel')), 'rappel un autre jour : le numéro n’est plus gardé');
    ok(/14:30/.test(await p.textContent('.p-faits')), 'l’heure du rappel est gardée');

    // ne plus appeler : avertissement visible avant d'enregistrer
    await p.evaluate(() => { location.hash = '#/prospection'; });
    await p.click('.p-carte:has-text("SB Rénovation Façade")');
    await p.click('.p-choix-btn:has-text("Ne plus appeler")');
    ok(/retirée le soir même/.test(await p.textContent('.p-alerte')), '« ne plus appeler » prévient du retrait');

    // ajout à la main : la fiche existe, son numéro est gardé
    await p.evaluate(() => { location.hash = '#/prospection'; });
    await p.click('.p-onglets-ajout');
    await p.fill('#pa-nom', 'Maçonnerie Essai');
    await p.fill('#pa-metier', 'Maçon');
    await p.fill('#pa-tel', '06 39 98 00 99');
    await rendu(p, 'ajout');
    await p.click('.p-ajout button:has-text("Ajouter")');
    await p.waitForSelector('.p-fiche h2:has-text("Maçonnerie Essai")');
    ok((await p.getAttribute('.p-bouton--appel', 'href')) === 'tel:0639980099', 'l’ajout à la main garde son numéro');

    // pipeline et bilan
    await p.evaluate(() => { location.hash = '#/prospection'; });
    await p.click('.p-onglets button:has-text("Pipeline")');
    const perdus = await p.textContent('.p-pipe-col:has(h2:has-text("Perdus"))');
    ok(/Toitures Provence Azur/.test(perdus || ''), 'le refusé est dans la colonne « Perdus »');
    const rappeler = await p.textContent('.p-pipe-col:has(h2:has-text("À rappeler"))');
    ok(/Atelier Couleurs Sud/.test(rappeler || ''), 'le rappel est dans la colonne « À rappeler »');
    await rendu(p, 'pipeline');
    await p.click('.p-onglets button:has-text("Bilan")');
    const appels = await p.textContent('.p-tuiles div:first-child dd');
    ok(appels === '2', 'le bilan compte les 2 appels enregistrés', appels);
    await rendu(p, 'bilan');

    ok(errs.length === 0, 'aucune erreur dans la console', errs.join(' | '));
    await c.close();
  }
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu : ${e.message.split('\n')[0]}`);
} finally {
  await navigateur.close();
  serveur.close();
}
console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
process.exit(fautes ? 1 : 0);

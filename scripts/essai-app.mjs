// Essai de l'app de l'artisan (app/), en mode démonstration, dans un vrai
// navigateur, au doigt (iPhone 390 px, petit Android 360 px) et à la souris
// (ordinateur 1280 px).
//
// Ce qu'il mesure, jamais ce que l'app dit d'elle-même :
//   - le fichier réellement produit par l'app pour l'envoi (pixels lus par
//     sharp, métadonnées relues par exiftool, empreinte des octets) ;
//   - le rendu : débordement horizontal, taille des cibles tactiles, champs
//     sans libellé, chiffres affichés contre le tableau affiché.
// Contre-essai (--contre-essai) : les mêmes contrôles sur des entrées cassées
// exprès doivent tous échouer.
//
// Avant : cd app && npm run build. Outils : exiftool, ffmpeg.
// Usage : node scripts/essai-app.mjs [--contre-essai]
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { chromium, webkit } from 'playwright';
import { RACINE } from './env.mjs';

const DIST = process.env.SITO_APP_DIST || join(RACINE, 'app', 'dist'); // autre dossier : essai d'une copie cassée
const CONTRE = process.argv.includes('--contre-essai');
if (!existsSync(join(DIST, 'index.html'))) { console.error('app/dist absent : lancer « npm run build » dans app/ avant.'); process.exit(2); }

let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const sha = (b) => createHash('sha256').update(b).digest('hex');
const exif = (f) => JSON.parse(execFileSync('exiftool', ['-j', '-n', '-a', '-G1', f], { encoding: 'utf8' }))[0];
const aGps = (m) => Object.keys(m).some((k) => /GPS/i.test(k) && !/^File/.test(k));

// Le Chromium de Playwright, sinon celui de la machine (SITO_CHROMIUM, ou les
// emplacements connus) : une version de Playwright plus récente que le
// navigateur installé ne doit pas empêcher l'essai.
// `--navigateur webkit` (ou SITO_NAVIGATEUR=webkit) : le moteur de Safari
// (tâche T49, constat S-007). Sans lui sur la machine : sortie 3.
const iNav = process.argv.indexOf('--navigateur');
const MOTEUR = (iNav > -1 ? process.argv[iNav + 1] : process.env.SITO_NAVIGATEUR) || 'chromium';
if (!['chromium', 'webkit'].includes(MOTEUR)) { console.error('navigateur inconnu : ' + MOTEUR); process.exit(2); }
async function lancer() {
  if (MOTEUR === 'webkit') {
    try { return await webkit.launch(); } catch (e) { console.log('WebKit absent : npx playwright install webkit. ' + e.message.split('\n')[0]); process.exit(3); }
  }
  const chemins = [process.env.SITO_CHROMIUM, undefined, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'];
  let derniere;
  for (const c of chemins) {
    if (c !== undefined && (!c || !existsSync(c))) continue;
    try { return await chromium.launch(c ? { executablePath: c } : {}); } catch (e) { derniere = e; }
  }
  throw derniere;
}

// ---------------------------------------------------------------- fichiers d'essai
const tmp = await mkdtemp(join(tmpdir(), 'sito-app-'));
const F = (n) => join(tmp, n);

// JPEG 4000 × 3000 stocké couché, orientation 6 (à tourner de 90°), avec GPS.
// Coin rouge en haut à gauche du stockage : une fois redressée, il est en haut à droite.
await sharp({ create: { width: 4000, height: 3000, channels: 3, background: { r: 30, g: 60, b: 200 } } })
  .composite([{ input: await sharp({ create: { width: 400, height: 300, channels: 3, background: { r: 230, g: 20, b: 20 } } }).png().toBuffer(), left: 0, top: 0 }])
  .jpeg({ quality: 90 }).toFile(F('chantier.jpg'));
execFileSync('exiftool', ['-q', '-overwrite_original', '-n', '-Orientation=6', '-GPSLatitude=43.2965', '-GPSLatitudeRef=N', '-GPSLongitude=5.3698', '-GPSLongitudeRef=E', '-Make=Apple', '-Model=iPhone 15', F('chantier.jpg')]);
// PNG transparent, carré noir au milieu.
await sharp({ create: { width: 800, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: await sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } }).png().toBuffer(), left: 300, top: 200 }])
  .png().toFile(F('capture.png'));
// La capture porte aussi une position et un texte (blocs eXIf et tEXt du PNG).
execFileSync('exiftool', ['-q', '-overwrite_original', '-n', '-GPSLatitude=43.2965', '-GPSLatitudeRef=N', '-GPSLongitude=5.3698', '-GPSLongitudeRef=E', '-PNG:Comment=Chantier rue des Essais', F('capture.png')]);
// DNG avec aperçu : en-tête TIFF (orientation 6) puis l'aperçu JPEG 2000 × 1500
// rangé par l'appareil, qui porte GPS, marque, et sa propre vignette nichée.
await sharp({ create: { width: 2000, height: 1500, channels: 3, background: { r: 40, g: 160, b: 60 } } })
  .composite([{ input: await sharp({ create: { width: 200, height: 150, channels: 3, background: { r: 230, g: 20, b: 20 } } }).png().toBuffer(), left: 0, top: 0 }])
  .jpeg({ quality: 85 }).toFile(F('apercu.jpg'));
await sharp({ create: { width: 160, height: 120, channels: 3, background: { r: 250, g: 250, b: 0 } } }).jpeg().toFile(F('vignette.jpg'));
execFileSync('exiftool', ['-q', '-overwrite_original', '-n', '-GPSLatitude=43.2965', '-GPSLatitudeRef=N', '-GPSLongitude=5.3698', '-GPSLongitudeRef=E', '-Make=Apple', '-Model=iPhone 15 Pro', '-ThumbnailImage<=' + F('vignette.jpg'), F('apercu.jpg')]);
const enteteTiff = Buffer.from([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0]);
const dngApercu = Buffer.concat([enteteTiff, Buffer.alloc(3000, 9), await readFile(F('apercu.jpg')), Buffer.alloc(9000, 5)]);
await writeFile(F('IMG_0003.DNG'), dngApercu);
// HEIC (en-tête seul, illisible par Chromium), DNG (en-tête TIFF), PDF, vidéo.
const heic = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic'), Buffer.from([0, 0, 0, 0]), Buffer.from('mif1heic'), Buffer.alloc(4000, 7)]);
await writeFile(F('IMG_0001.HEIC'), heic);
const dng = Buffer.concat([Buffer.from('II*\0'), Buffer.from([8, 0, 0, 0]), Buffer.alloc(6000, 3)]);
await writeFile(F('IMG_0002.DNG'), dng);
await writeFile(F('devis.pdf'), Buffer.from('%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n'));
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=10', '-pix_fmt', 'yuv420p', F('video.mp4')]);
// Vidéos avec la position du tournage (T46) : MOV d'iPhone (clé QuickTime) et MP4.
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=10', '-pix_fmt', 'yuv420p',
  '-movflags', 'use_metadata_tags', '-metadata', 'com.apple.quicktime.location.ISO6709=+43.2965+005.3698+010.000/', F('IMG_0010.MOV')]);
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=10', '-pix_fmt', 'yuv420p',
  '-metadata', 'location=+43.2965+005.3698/', F('VID_0011.mp4')]);

// ---------------------------------------------------------------- contrôles (réutilisés par le contre-essai)
async function controlerJpegPrepare(buf, nom) {
  const f = F(`sortie-${nom}.jpg`); await writeFile(f, buf);
  const meta = await sharp(buf).metadata();
  const m = exif(f);
  const r = [];
  r.push(['format JPEG', meta.format === 'jpeg', meta.format]);
  r.push(['3 200 px au plus', Math.max(meta.width, meta.height) <= 3200, `${meta.width}×${meta.height}`]);
  r.push(['redressée (portrait 2400×3200)', meta.width === 2400 && meta.height === 3200, `${meta.width}×${meta.height}`]);
  r.push(['aucune position GPS', !aGps(m), Object.keys(m).filter((k) => /GPS/.test(k)).join(', ')]);
  r.push(['aucun appareil (Make/Model)', !Object.keys(m).some((k) => /:(Make|Model)$/.test(k)), '']);
  r.push(['aucune orientation à appliquer', !m['IFD0:Orientation'] || m['IFD0:Orientation'] === 1, String(m['IFD0:Orientation'])]);
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
  const rouge = ([r, g, b]) => r > 180 && g < 80 && b < 80;
  r.push(['coin rouge en haut à droite (sens mesuré aux pixels)', rouge(px(info.width - 60, 60)) && !rouge(px(60, 60)), `${px(info.width - 60, 60)} / ${px(60, 60)}`]);
  return r;
}

// Un original nettoyé : plus de GPS, d'appareil ni de texte, et l'image
// elle-même intacte (mêmes pixels décodés, même orientation).
async function controlerOriginal(buf, source, ext, orientation) {
  const f = F(`original-nettoye.${ext}`); await writeFile(f, buf);
  const m = exif(f);
  const r = [];
  r.push(['aucune position GPS', !aGps(m), Object.keys(m).filter((k) => /GPS/.test(k)).join(', ')]);
  r.push(['aucun appareil (Make/Model)', !Object.keys(m).some((k) => /:(Make|Model)$/.test(k)), '']);
  r.push(['aucun commentaire', !Object.keys(m).some((k) => /Comment/i.test(k)), Object.keys(m).filter((k) => /Comment/i.test(k)).join(', ')]);
  if (orientation) r.push([`orientation gardée (${orientation})`, m['IFD0:Orientation'] === orientation, String(m['IFD0:Orientation'])]);
  const [a, b] = await Promise.all([sharp(buf).raw().toBuffer(), sharp(source).raw().toBuffer()]);
  r.push(['mêmes pixels que l’original (aucune perte)', sha(a) === sha(b), `${a.length} / ${b.length}`]);
  r.push(['plus léger ou égal', buf.length <= source.length, `${buf.length} / ${source.length}`]);
  return r;
}
async function controlerApercu(buf) {
  const f = F('apercu-envoye.jpg'); await writeFile(f, buf);
  const meta = await sharp(buf).metadata();
  const m = exif(f);
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
  const rouge = ([r, g, b]) => r > 180 && g < 80 && b < 80;
  return [
    ['l’aperçu entier, pas la vignette (redressé : 1500 × 2000)', meta.width === 1500 && meta.height === 2000, `${meta.width}×${meta.height}`],
    ['tourné comme le dit le DNG (coin rouge en haut à droite)', rouge(px(info.width - 40, 40)) && !rouge(px(40, 40)), `${px(info.width - 40, 40)} / ${px(40, 40)}`],
    ['aucune position GPS', !aGps(m), Object.keys(m).filter((k) => /GPS/.test(k)).join(', ')],
    ['aucun appareil (Make/Model)', !Object.keys(m).some((k) => /:(Make|Model)$/.test(k)), ''],
  ];
}

async function mesurerRendu(page) {
  return page.evaluate(() => {
    const visibles = (sel) => [...document.querySelectorAll(sel)].filter((e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; });
    const debord = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const petites = visibles('main a, main button, main label.bouton, main input:not([type=checkbox]):not(.invisible), main textarea, main summary, nav a')
      .filter((e) => !e.closest('.aller-contenu'))
      .map((e) => ({ e, b: e.getBoundingClientRect() }))
      .filter(({ b }) => b.height < 44 || b.width < 44)
      .map(({ e, b }) => `${e.tagName.toLowerCase()} « ${(e.textContent || e.getAttribute('aria-label') || e.id).trim().slice(0, 30)} » ${Math.round(b.width)}×${Math.round(b.height)}`);
    const sansLibelle = [...document.querySelectorAll('input, textarea, select')]
      .filter((e) => !(e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) && !e.getAttribute('aria-label') && !e.closest('label'))
      .map((e) => e.id || e.name || e.type);
    const titres = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => Number(h.tagName[1]));
    const sauts = titres.some((n, i) => i > 0 && n > titres[i - 1] + 1) || (titres.length > 0 && titres[0] !== 1);
    return { debord, petites, sansLibelle, h1: titres.filter((n) => n === 1).length, sauts };
  });
}
const renduBon = (r) => r.debord <= 0 && r.petites.length === 0 && r.sansLibelle.length === 0 && r.h1 === 1 && !r.sauts;

// ---------------------------------------------------------------- contre-essai
if (CONTRE) {
  console.log('Contre-essai : chaque contrôle doit échouer sur une entrée cassée exprès.');
  const brut = await readFile(F('chantier.jpg'));
  const res = await controlerJpegPrepare(brut, 'original'); // l'original, non préparé
  for (const [quoi, bon] of res) ok(!bon || quoi === 'format JPEG', `détecte l'original non préparé : ${quoi}`);
  const navigateur = await lancer();
  const page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
  await page.setContent(`<main><h1>T</h1><h3>saut</h3><button style="height:20px">petit</button><input id="x"><div style="width:900px">large</div></main>`);
  const r = await mesurerRendu(page);
  ok(r.debord > 0, 'détecte un débordement horizontal', String(r.debord));
  ok(r.petites.length > 0, 'détecte une cible tactile trop petite');
  ok(r.sansLibelle.length > 0, 'détecte un champ sans libellé');
  ok(r.sauts, 'détecte un niveau de titre sauté');
  ok(!renduBon(r), 'le rendu cassé est refusé');
  await navigateur.close();
  await rm(tmp, { recursive: true, force: true });
  console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
  process.exit(fautes ? 1 : 0);
}

// ---------------------------------------------------------------- serveur de l'app construite
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const serveur = createServer(async (req, res) => {
  const chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = join(DIST, chemin === '/' ? 'index.html' : chemin);
  if (!f.startsWith(DIST)) { res.writeHead(400).end(); return; }
  try { const b = await readFile(f); res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }).end(b); }
  catch { res.writeHead(404).end('absent'); }
});
await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${serveur.address().port}/`;

const navigateur = await lancer();
const appareils = [
  { nom: 'iPhone 390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  { nom: 'Android 360', viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  { nom: 'ordinateur 1280', viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];
const ECRANS = ['', 'chantiers', 'site', 'avis', 'plus', 'adresse', 'google', 'abonnement', 'compte', 'installer'];

async function nouvellePage(appareil, extra = '') {
  const ctx = await navigateur.newContext({ ...appareil, locale: 'fr-FR', timezoneId: 'Europe/Paris', serviceWorkers: 'block', acceptDownloads: true });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  await page.goto(`${BASE}?demo${extra}#/connexion`);
  return { ctx, page, erreurs };
}
// Compte de démonstration (app/src/donnees/demo.ts, COMPTE_DEMO).
const DEMO = { courriel: 'artisan@exemple.fr', mdp: 'chantier13' };
const visible = (loc, ms = 3000) => loc.first().waitFor({ state: 'visible', timeout: ms }).then(() => true, () => false);
async function connecter(page, { courriel = DEMO.courriel, mdp = DEMO.mdp } = {}) {
  await page.getByLabel('Votre adresse e-mail').fill(courriel);
  await page.getByLabel('Votre mot de passe').fill(mdp + '-faux');
  await page.getByRole('button', { name: 'Me connecter' }).click();
  const refus = await visible(page.getByText('Adresse e-mail ou mot de passe incorrect.'));
  await page.getByLabel('Votre mot de passe').fill(mdp);
  await page.getByRole('button', { name: 'Me connecter' }).click();
  await page.getByRole('navigation', { name: 'Navigation principale' }).waitFor();
  return refus;
}
const connecte = (page) => visible(page.getByRole('navigation', { name: 'Navigation principale' }), 5000);
const envois = (page) => page.evaluate(() => window.__sitoDemo.envois.length);
// 30 secondes, pas 10 : la préparation d'une photo de 12 Mpx dans le navigateur
// est plus lente quand la machine fait autre chose en même temps (panne du
// 21 octobre 2026 : l'essai s'arrêtait au premier envoi sur un poste occupé).
async function attendreEnvois(page, n) {
  for (let i = 0; i < 300; i++) { if (await envois(page) >= n) return true; await page.waitForTimeout(100); }
  return false;
}
async function lireEnvoi(page, i) {
  const b64 = await page.evaluate(async (i) => {
    const e = window.__sitoDemo.envois[i];
    if (!e) throw new Error(`envoi ${i} absent : ${window.__sitoDemo.envois.length} envoi(s) seulement`);
    const o = new Uint8Array(await e.fichier.arrayBuffer());
    let s = ''; for (let k = 0; k < o.length; k += 0x8000) s += String.fromCharCode(...o.subarray(k, k + 0x8000));
    return { b: btoa(s), genre: e.genre, nom: e.nom, format: e.format, type: e.type, role: e.role, paire: e.paire, cle: e.cle };
  }, i);
  return { ...b64, buf: Buffer.from(b64.b, 'base64') };
}

try {
  // ------------------------------------------------ parcours complet, au doigt
  console.log('\nParcours (iPhone 390)');
  const { ctx, page, erreurs } = await nouvellePage(appareils[0]);
  ok(await connecter(page), 'un mauvais mot de passe est refusé avec un message');
  ok(await page.getByRole('heading', { level: 1 }).textContent() === 'Façades Exemple', 'connecté : accueil au nom de l’entreprise');

  // chiffres de la semaine = somme des 7 jours les plus récents du tableau affiché
  await page.getByText('Voir les chiffres').click();
  const lignes = await page.locator('.courbe tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => Number(td.textContent))));
  const somme = (k) => lignes.slice(0, 7).reduce((s, l) => s + l[k], 0);
  const affiche = async (m) => Number(await page.locator(`[data-mesure="${m}"]`).textContent());
  ok(lignes.length === 28, '28 jours dans le tableau', String(lignes.length));
  ok(await affiche('visites') === somme(0) && await affiche('appels') === somme(1) && await affiche('demandes') === somme(2), 'les chiffres de la semaine égalent le tableau affiché');

  const avantLue = await page.locator('.non-lue').count();
  await page.getByRole('button', { name: 'Marquer comme lue' }).first().click();
  await page.waitForTimeout(200);
  ok(await page.locator('.non-lue').count() === avantLue - 1, 'marquer une demande comme lue', `${avantLue} → ${await page.locator('.non-lue').count()}`);
  ok(await page.locator('a[href^="tel:"]').first().getAttribute('href') === 'tel:0612345678', 'bouton « Appeler » avec le bon numéro');

  // Mon site : téléphone, prix, tarifs
  await page.goto(`${BASE}?demo#/site`);
  await page.getByLabel('Téléphone affiché sur le site').fill('12 34');
  ok(await page.getByText('Numéro invalide').isVisible(), 'téléphone invalide : message près du champ');
  ok(await page.getByRole('button', { name: 'Enregistrer' }).first().isDisabled(), 'téléphone invalide : enregistrement bloqué');
  await page.getByLabel('Téléphone affiché sur le site').fill('06 98 76 54 32');
  await page.getByLabel('Afficher mes prix sur le site').check();
  await page.getByRole('button', { name: 'Enregistrer' }).first().click();
  ok(await page.getByText('Enregistré. Le site sera mis à jour.').waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false), 'téléphone et case « prix » enregistrés');
  ok(await page.getByRole('heading', { name: 'Mes tarifs' }).isVisible(), 'la case cochée fait apparaître les tarifs');
  await page.getByRole('button', { name: 'Ajouter un tarif' }).click();
  await page.locator('#poste-nouveau').fill('Enduit à la chaux');
  await page.locator('#bas-nouveau').fill('60');
  await page.locator('#haut-nouveau').fill('40');
  ok(await page.getByText('Le prix haut doit être supérieur').isVisible(), 'prix haut < prix bas : refusé');
  await page.locator('#haut-nouveau').fill('85,50');
  await page.locator('form:has(#poste-nouveau)').getByRole('button', { name: 'Enregistrer' }).click();
  ok(await page.getByText('Enduit à la chaux').waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false), 'tarif ajouté et affiché');
  ok(/60\s€ à 85,50\s€/.test(await page.locator('.tarif', { hasText: 'Enduit à la chaux' }).textContent()), 'tarif affiché en euros français');

  // Chantier et photos
  await page.goto(`${BASE}?demo#/chantiers`);
  await page.getByLabel('Ce qui a été fait').fill('Ravalement rue des Essais');
  await page.getByLabel('Commune').fill('Cassis');
  await page.getByRole('button', { name: 'Créer et ajouter des photos' }).click();
  await page.getByRole('heading', { name: 'Ravalement rue des Essais' }).waitFor();
  ok(true, 'chantier créé, écran du chantier ouvert');

  await page.getByLabel('Photo avant').first().setInputFiles(F('chantier.jpg'));
  ok(await attendreEnvois(page, 2), 'photo JPEG (iPhone, GPS, orientation 6) envoyée, puis son original',
    // ce que la page dit quand rien n'est parti (T49, WebKit)
    `${await envois(page)} envoi(s) ; page : ${(await page.locator('.erreur, .envois-erreur, [role=alert], [role=status]').allTextContents()).join(' | ').slice(0, 200)} ; console : ${erreurs.join(' | ').slice(0, 200)} ; `
    + JSON.stringify(await page.evaluate(() => ({ securise: window.isSecureContext, enLigne: navigator.onLine,
      uuid: typeof crypto.randomUUID, idb: typeof indexedDB }))));
  const e1 = await lireEnvoi(page, 0);
  ok(e1.genre === 'photo' && e1.role === 'avant' && e1.paire === 1, 'rangée en « avant », paire 1', `${e1.role} ${e1.paire}`);
  ok(e1.nom === 'chantier.jpg' && e1.type === 'image/jpeg', 'nom et type du fichier envoyé', `${e1.nom} ${e1.type}`);
  for (const [quoi, bon, detail] of await controlerJpegPrepare(e1.buf, 'jpeg')) ok(bon, `photo préparée : ${quoi}`, detail);
  ok(e1.buf.length < (await readFile(F('chantier.jpg'))).length * 2, 'poids raisonnable', `${e1.buf.length} octets`);
  // Décision du 9 octobre : l'original en pleine résolution suit, après la version réduite.
  const o1 = await lireEnvoi(page, 1);
  ok(o1.genre === 'original' && o1.cle === e1.cle, 'l’original suit la photo réduite, relié par sa clé', `${o1.genre} ${o1.cle === e1.cle}`);
  for (const [quoi, bon, detail] of await controlerOriginal(o1.buf, await readFile(F('chantier.jpg')), 'jpg', 6)) ok(bon, `original JPEG : ${quoi}`, detail);

  await page.getByLabel('Photo après').first().setInputFiles(F('capture.png'));
  ok(await attendreEnvois(page, 4), 'PNG transparent envoyé, puis son original');
  const e2 = await lireEnvoi(page, 2);
  const o2 = await lireEnvoi(page, 3);
  ok(o2.genre === 'original' && o2.cle === e2.cle, 'l’original du PNG suit, relié par sa clé');
  for (const [quoi, bon, detail] of await controlerOriginal(o2.buf, await readFile(F('capture.png')), 'png', null)) ok(bon, `original PNG : ${quoi}`, detail);
  const { data: pxPng, info: iPng } = await sharp(e2.buf).raw().toBuffer({ resolveWithObject: true });
  const coin = [pxPng[0], pxPng[1], pxPng[2]];
  const centre = (() => { const i = (300 * iPng.width + 400) * iPng.channels; return [pxPng[i], pxPng[i + 1], pxPng[i + 2]]; })();
  ok(e2.type === 'image/jpeg' && e2.role === 'apres' && e2.paire === 1, 'PNG → JPEG, rangé en « après », paire 1', `${e2.type} ${e2.role} ${e2.paire}`);
  ok(coin.every((v) => v > 240) && centre.every((v) => v < 30), 'transparence rendue en blanc, contenu intact', `${coin} / ${centre}`);
  await page.waitForTimeout(300);
  ok(await page.locator('.paire').first().locator('img').count() === 2, 'la paire avant / après s’affiche avec ses deux images');

  await page.getByLabel('Ajouter des photos ou vidéos').setInputFiles([F('IMG_0001.HEIC'), F('IMG_0002.DNG'), F('IMG_0003.DNG'), F('video.mp4'), F('devis.pdf')]);
  ok(await attendreEnvois(page, 6), 'DNG avec aperçu et vidéo envoyés');
  ok(await page.getByText('Un PDF n’est pas une photo').isVisible(), 'PDF refusé avec une phrase claire');
  ok(await page.getByText('IMG_0001.HEIC : Ce téléphone ne sait pas lire les photos HEIC').isVisible(), 'HEIC illisible ici : dit à l’artisan, avec le moyen de l’envoyer');
  ok(await page.getByText('IMG_0002.DNG : Ce téléphone ne sait pas lire les photos DNG').isVisible(), 'DNG sans aperçu : dit à l’artisan');
  ok(await page.getByText(/rien n’est perdu/).count() === 2, 'les deux messages disent que la photo reste sur l’appareil');
  const e3 = await lireEnvoi(page, 4), e4 = await lireEnvoi(page, 5);
  ok(e3.genre === 'photo' && e3.format === 'dng' && e3.type === 'image/jpeg' && e3.nom === 'IMG_0003.jpg', 'DNG avec aperçu : l’aperçu part, en JPEG', `${e3.genre} ${e3.format} ${e3.type} ${e3.nom}`);
  for (const [quoi, bon, detail] of await controlerApercu(e3.buf)) ok(bon, `aperçu du DNG : ${quoi}`, detail);
  ok(e4.genre === 'video' && e4.format === 'mp4' && sha(e4.buf) === sha(await readFile(F('video.mp4'))), 'vidéo rangée avec les vidéos, intacte', `${e4.genre} ${e4.format}`);
  ok(await envois(page) === 6, 'ni le PDF, ni le HEIC, ni le DNG sans aperçu ne sont partis, et aucun original d’un RAW', String(await envois(page)));
  const partis = await page.evaluate(() => window.__sitoDemo.envois.map((e) => e.nom));
  ok(!partis.includes('IMG_0001.HEIC') && !partis.includes('IMG_0002.DNG'), 'aucun fichier illisible envoyé avec sa position', partis.join(', '));

  // Vidéos avec position (T46) : elles partent sans, et se lisent encore.
  await page.getByLabel('Ajouter des photos ou vidéos').setInputFiles([F('IMG_0010.MOV'), F('VID_0011.mp4')]);
  ok(await attendreEnvois(page, 8), 'deux vidéos avec position envoyées');
  for (const [i, nom] of [[6, 'IMG_0010.MOV'], [7, 'VID_0011.mp4']]) {
    const e = await lireEnvoi(page, i);
    await writeFile(F('recu-' + nom), e.buf);
    const m = exif(F('recu-' + nom));
    ok(e.genre === 'video' && !aGps(m) && !e.buf.includes('43.2965'), `${nom} : partie sans position (exiftool)`, Object.keys(m).filter((k) => /GPS|Location/i.test(k)).join(', '));
    ok(e.buf.length === (await readFile(F(nom))).length && spawnSync('ffprobe', ['-v', 'error', F('recu-' + nom)]).status === 0, `${nom} : même taille, se lit encore (ffprobe)`);
  }

  // Avis : la réponse préparée n'est publiée qu'après validation
  await page.goto(`${BASE}?demo#/avis`);
  const zone = page.getByLabel('Votre réponse').first();
  ok((await zone.inputValue()).startsWith('Merci Jean-Pierre'), 'la réponse préparée est proposée, modifiable');
  await zone.fill('Merci beaucoup Jean-Pierre, à bientôt.');
  await page.getByRole('button', { name: 'Valider et publier' }).click();
  ok(await page.getByText('Validée, en cours de publication').waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false), 'réponse validée par l’artisan');

  // Compte : export et suppression
  await page.goto(`${BASE}?demo#/compte`);
  await page.getByLabel('Numéro de TVA intracommunautaire').fill('FR12');
  ok(await page.getByText('Format attendu : FR suivi').isVisible(), 'TVA mal formée : message près du champ');
  await page.getByLabel('Numéro de TVA intracommunautaire').fill('FR 40 123456789');
  await page.getByLabel('Assureur décennale').fill('Assureur Exemple');
  await page.locator('form:has(#tva_intra)').getByRole('button', { name: 'Enregistrer' }).click();
  ok(await page.getByText('Les mentions légales du site seront mises à jour').waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false), 'mentions légales enregistrées');
  const [telechargement] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Télécharger mes données' }).click()]);
  const exporte = JSON.parse(await readFile(await telechargement.path(), 'utf8'));
  ok(exporte.profil.tva_intra === 'FR40123456789' && exporte.profil.telephone === '0698765432', 'l’export contient les réglages enregistrés', `${exporte.profil.tva_intra} ${exporte.profil.telephone}`);
  ok(exporte.chantiers.some((c) => c.titre === 'Ravalement rue des Essais' && c.photos.length === 3), 'l’export contient le chantier et ses photos');
  const boutonSuppr = page.getByRole('button', { name: 'Demander la suppression' });
  ok(await boutonSuppr.isDisabled(), 'suppression bloquée tant que SUPPRIMER n’est pas écrit');
  await page.getByLabel('Pour confirmer, écrivez SUPPRIMER').fill('supprimer');
  await boutonSuppr.click();
  ok(await page.getByText(/seront supprimés le/).waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false), 'suppression demandée, date affichée');
  await page.getByRole('button', { name: 'Annuler la suppression' }).click();
  ok(await page.getByRole('button', { name: 'Demander la suppression' }).waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false), 'suppression annulée');
  ok(erreurs.length === 0, 'aucune erreur dans la console', erreurs.join(' | '));
  await page.getByRole('button', { name: 'Me déconnecter' }).click();
  ok(await page.getByLabel('Votre adresse e-mail').waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false), 'déconnexion : retour à l’écran de connexion');
  await ctx.close();

  // ------------------------------------------------ page de Sitô (offre du 5 nov. 2026)
  for (const appareil of appareils) {
    console.log(`\nPage de Sitô (${appareil.nom})`);
    const { ctx: c, page: p, erreurs: errs } = await nouvellePage(appareil);
    await p.goto(`${BASE}?demo#/`);
    ok(await visible(p.getByRole('heading', { level: 1, name: 'Un beau site internet qui vous ramène des chantiers' }), 8000), 'la page de Sitô s ouvre à l adresse de l app');
    // la police change la hauteur des blocs : on mesure une fois chargée (machine occupée : 6 nov.)
    await p.evaluate(() => document.fonts.ready);
    const r = await mesurerRendu(p);
    ok(renduBon(r), 'rendu de la page', JSON.stringify(r));
    const texte = await p.locator('body').innerText();
    ok(/80\s€ par mois/.test(texte) && /720\s€/.test(texte) && /60\s€ par mois/.test(texte), 'les prix de l offre : 80 € par mois, 720 € l année (60 € par mois)');
    ok(/1 mois offert/.test(texte) && /Engagement 12 mois/.test(texte) && /3 mois offerts/.test(texte), 'mois offert, engagement, artisans vitrines');
    ok(!/39\s€/.test(texte), 'plus aucun ancien prix (39 €)');
    const bouton = p.getByRole('link', { name: 'Recevoir ma maquette gratuite' }).first();
    const vu = await bouton.boundingBox();
    ok(vu && vu.y + vu.height <= appareil.viewport.height, 'le bouton de la maquette est visible sans faire défiler', JSON.stringify(vu));
    const href = await bouton.getAttribute('href');
    ok(href === '#contact' || /^https:\/\/wa\.me\/\d{8,15}\?text=/.test(href), 'le bouton mène à WhatsApp (ou à Contact tant que le numéro manque)', href);
    const polices = await p.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /font|woff/.test(n)));
    ok(polices.length > 0 && polices.every((n) => n.startsWith(new URL(BASE).origin)), 'la police est servie par le site, rien chez Google', polices.join(' '));
    await p.getByRole('link', { name: 'Espace artisan' }).first().click();
    ok(await visible(p.getByLabel('Votre adresse e-mail')), '« Espace artisan » ouvre la connexion');
    ok(errs.length === 0, 'aucune erreur dans la console', errs.join(' | '));
    await c.close();
  }
  {
    // installée sur l'écran d'accueil : droit à la connexion, sans la page de Sitô
    const ctx = await navigateur.newContext({ ...appareils[0], locale: 'fr-FR', serviceWorkers: 'block' });
    await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });
    const p = await ctx.newPage();
    await p.goto(`${BASE}?demo#/`);
    ok(await visible(p.getByLabel('Votre adresse e-mail'), 8000) && !(await p.getByRole('heading', { name: 'Un beau site internet qui vous ramène des chantiers' }).count()), 'app installée : elle s ouvre sur la connexion');
    await ctx.close();
  }

  // ------------------------------------------------ compte donné par Sitô (décision du 5 nov. 2026)
  console.log('\nCompte donné par Sitô (iPhone 390)');
  {
    const { ctx: c, page: p, erreurs: errs } = await nouvellePage(appareils[0]);
    await p.locator('h1').first().waitFor();
    ok(await visible(p.getByText('MonSiteArtisan vous donne votre identifiant et votre mot de passe')), 'la connexion dit d où vient le compte');
    ok(!(await p.getByText(/inscription|lien d.inscription/i).count()), 'aucune inscription proposée');
    await p.getByRole('button', { name: 'Mot de passe oublié ?' }).click();
    ok(await visible(p.getByText('Demandez-en un nouveau à MonSiteArtisan')), 'mot de passe oublié : la marche à suivre est dite');
    // un ancien lien d'inscription n'ouvre plus rien d'autre que la connexion
    await p.goto(`${BASE}?demo#/inscription/demo-inscription`); await p.reload();
    ok(await visible(p.getByLabel('Votre adresse e-mail')) && !(await p.getByRole('heading', { name: 'Créer votre compte' }).count()), 'un ancien lien d inscription ouvre la connexion');
    await p.goto(`${BASE}?demo#/connexion`);
    ok(await connecter(p), 'connexion avec l identifiant et le mot de passe donnés ; un faux mot de passe est refusé');
    await p.close();
    const p2 = await c.newPage();
    p2.on('pageerror', (e) => errs.push(e.message));
    await p2.goto(`${BASE}?demo#/`);
    ok(await connecte(p2), 'app fermée puis rouverte : toujours connecté, sans rien retaper');
    ok(errs.length === 0, 'aucune erreur dans la console', errs.join(' | '));
    await c.close();
  }

  // ------------------------------------------------ chaque écran, sur chaque appareil
  for (const appareil of appareils) {
    console.log(`\nRendu (${appareil.nom})`);
    const { ctx: c, page: p, erreurs: errs } = await nouvellePage(appareil);
    await p.locator('h1').first().waitFor();
    const r0 = await mesurerRendu(p);
    ok(renduBon(r0), 'connexion', JSON.stringify(r0));
    await connecter(p);
    for (const e of ECRANS) {
      await p.goto(`${BASE}?demo#/${e}`);
      await p.waitForTimeout(400);
      const r = await mesurerRendu(p);
      ok(renduBon(r), `#/${e || ''}`, JSON.stringify(r));
    }
    await p.goto(`${BASE}?demo#/chantiers/demo-c1`); await p.waitForTimeout(400);
    const rc = await mesurerRendu(p);
    ok(renduBon(rc), '#/chantiers/demo-c1', JSON.stringify(rc));
    const nav = await p.getByRole('navigation', { name: 'Navigation principale' }).boundingBox();
    if (appareil.isMobile) ok(nav && nav.y + nav.height >= appareil.viewport.height - 1 && nav.width === appareil.viewport.width, 'navigation en bas de l’écran, pleine largeur', JSON.stringify(nav));
    else ok(nav && nav.x === 0 && nav.height >= appareil.viewport.height - 1 && await p.getByRole('link', { name: 'Abonnement' }).isVisible(), 'navigation à gauche, tous les écrans visibles', JSON.stringify(nav));
    if (!appareil.isMobile) {
      // page rechargée : le premier Tab d'une visite, pas celui d'après une navigation
      await p.goto(`${BASE}?demo#/`); await p.reload(); await p.locator('h1').first().waitFor(); await p.waitForTimeout(300);
      await p.keyboard.press('Tab');
      const focus = await p.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return { texte: e.textContent, contour: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 }; });
      ok(focus.texte === 'Aller au contenu' && focus.contour, 'clavier : premier arrêt « Aller au contenu », focus visible', JSON.stringify(focus));
    }
    ok(errs.length === 0, 'aucune erreur dans la console', errs.join(' | '));
    await c.close();
  }

  // ------------------------------------------------ Mon adresse (T20) : chercher, réserver, brancher, vérifier
  console.log('\nMon adresse (T20)');
  {
    const { ctx: c, page: p, erreurs: errsA } = await nouvellePage(appareils[0]);
    await connecter(p);
    await p.goto(`${BASE}?demo#/adresse`); await p.getByLabel('Le nom voulu').waitFor();
    const chercher = async (nom) => {
      await p.getByLabel('Le nom voulu').fill(nom);
      await p.getByRole('button', { name: 'Vérifier s’il est libre' }).click();
      await p.waitForTimeout(450);
      return p.locator('section[aria-labelledby="t-domaine"]').textContent();
    };
    ok(/finit en \.fr ou \.com/.test(await chercher('facades-martin.de')), 'une autre extension : refusée, avec la raison');
    ok(/déjà pris/.test(await chercher('deja-pris.fr')), 'un nom pris : dit pris');
    const libre = await chercher('https://www.Facades-Martin.fr/');
    ok(/facades-martin\.fr est libre/.test(libre), 'une adresse tapée avec https et www est lue comme le nom de domaine', libre.slice(0, 160));
    ok(!/€/.test(libre), 'aucun prix : le domaine est compris dans l abonnement');
    await p.getByLabel('Prénom').fill('Jeanne');
    await p.getByLabel('Nom', { exact: true }).fill('Martin');
    await p.getByRole('button', { name: 'Réserver facades-martin.fr' }).click(); await p.waitForTimeout(600);
    const apres = await p.locator('main').textContent();
    ok(/réservé à votre nom/.test(apres) && /www\.facades-martin\.fr/.test(apres) && /Mon domaine,\s*En cours de mise en place/.test(apres),
      'réservé : l adresse www apparaît, en cours de mise en place', apres.slice(0, 300));
    await chercher('un-second.fr');
    await p.getByLabel('Prénom').fill('Jeanne'); await p.getByLabel('Nom', { exact: true }).fill('Martin');
    await p.getByRole('button', { name: 'Réserver un-second.fr' }).click(); await p.waitForTimeout(500);
    ok(/déjà réservé/.test(await p.locator('main').textContent()), 'un second domaine est refusé');

    await p.getByLabel('Votre nom de domaine').fill('mon-ancien-site.com');
    await p.getByRole('button', { name: 'Brancher mon domaine' }).click(); await p.waitForTimeout(600);
    const dns = await p.locator('table.dns').textContent().catch(() => '');
    ok(/CNAME/.test(dns) && /www/.test(dns) && /sites\.domaine-sito\.fr/.test(dns), 'domaine existant : le CNAME à poser est donné (type, nom, valeur)', dns);
    const carte = p.locator('li.carte', { hasText: 'www.mon-ancien-site.com' });
    ok(/En cours de mise en place/.test(await carte.textContent()), 'le domaine branché apparaît, en attente');
    await carte.getByRole('button', { name: 'Vérifier maintenant' }).click(); await p.waitForTimeout(600);
    ok(/Active/.test(await p.locator('li.carte', { hasText: 'www.mon-ancien-site.com' }).textContent()), 'vérifié : l adresse passe active');
    ok(errsA.length === 0, 'Mon adresse : aucune erreur dans la console', errsA.join(' | '));
    await c.close();
  }

  // ------------------------------------------------ Ma fiche Google (T24) : relier
  console.log('\nMa fiche Google (T24)');
  {
    const { ctx: c, page: p, erreurs: errsG } = await nouvellePage(appareils[0]);
    await connecter(p);
    await p.goto(`${BASE}?demo#/google`); await p.getByRole('button', { name: 'Relier ma fiche Google' }).waitFor();
    ok(/Pas encore reliée/.test(await p.locator('main').textContent()), 'avant : pas encore reliée, avec le bouton pour relier');
    await p.getByRole('button', { name: 'Relier ma fiche Google' }).click(); await p.waitForTimeout(600);
    const t = await p.locator('main').textContent();
    ok(/Reliée/.test(t) && /Façades Exemple/.test(t) && /Démonstration/.test(t) && /#\/google/.test(p.url()), 'relier : retour sur l écran, fiche reliée et nommée', t.slice(0, 200));
    ok(await p.getByRole('button', { name: /Relier/ }).count() === 0, 'une fiche reliée n affiche plus le bouton');
    ok(errsG.length === 0, 'Ma fiche Google : aucune erreur dans la console', errsG.join(' | '));
    await c.close();
  }

  // ------------------------------------------------ Abonnement sur le web (T17)
  console.log('\nAbonnement');
  {
    const { ctx: c2, page: p2 } = await nouvellePage(appareils[0]);
    await connecter(p2);
    await p2.goto(`${BASE}?demo#/abonnement`); await p2.waitForTimeout(400);
    ok(/39\s€ HT par mois/.test(await p2.locator('main').textContent()), 'sur le web, le prix est affiché');
    // T17 : sur le web, l'abonnement en cours ouvre le portail Stripe ; en
    // démonstration, on revient sur l'écran avec le signe du portail.
    const portail = p2.getByRole('button', { name: /Carte, factures, formule, résiliation/ });
    ok(await portail.isVisible(), 'sur le web, le bouton du portail Stripe est là (abonnement en cours)');
    await portail.click(); await p2.waitForTimeout(600);
    ok(/portail Stripe/.test(await p2.locator('main').textContent()) && /#\/abonnement/.test(p2.url()), 'le bouton ouvre l adresse rendue par les données (démonstration : retour avec le signe)', p2.url());
    await c2.close();
  }
} catch (e) {
  // Une erreur au milieu du parcours est une faute comme une autre : elle se
  // compte et se nomme, sinon le résumé de scripts/essais.mjs n'affiche qu'un
  // message de Playwright sans dire quel contrôle s'est arrêté.
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  await navigateur.close();
  serveur.close();
  await rm(tmp, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
process.exit(fautes ? 1 : 0);

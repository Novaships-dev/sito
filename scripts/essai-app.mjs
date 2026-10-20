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
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { chromium } from 'playwright';
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
async function lancer() {
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
// HEIC (en-tête seul, illisible par Chromium), DNG (en-tête TIFF), PDF, vidéo.
const heic = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic'), Buffer.from([0, 0, 0, 0]), Buffer.from('mif1heic'), Buffer.alloc(4000, 7)]);
await writeFile(F('IMG_0001.HEIC'), heic);
const dng = Buffer.concat([Buffer.from('II*\0'), Buffer.from([8, 0, 0, 0]), Buffer.alloc(6000, 3)]);
await writeFile(F('IMG_0002.DNG'), dng);
await writeFile(F('devis.pdf'), Buffer.from('%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n'));
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=10', '-pix_fmt', 'yuv420p', F('video.mp4')]);

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
  await page.goto(`${BASE}?demo${extra}#/`);
  return { ctx, page, erreurs };
}
async function connecter(page) {
  await page.getByLabel('Votre adresse e-mail').fill('artisan@exemple.fr');
  await page.getByRole('button', { name: 'Recevoir mon code' }).click();
  await page.getByLabel('Code reçu par e-mail').fill('000000');
  await page.getByRole('button', { name: 'Me connecter' }).click();
  const refus = await page.getByText('Code incorrect').waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false);
  await page.getByLabel('Code reçu par e-mail').fill('123456');
  await page.getByRole('button', { name: 'Me connecter' }).click();
  await page.getByRole('navigation', { name: 'Navigation principale' }).waitFor();
  return refus;
}
const envois = (page) => page.evaluate(() => window.__sitoDemo.envois.length);
async function attendreEnvois(page, n) {
  for (let i = 0; i < 100; i++) { if (await envois(page) >= n) return true; await page.waitForTimeout(100); }
  return false;
}
async function lireEnvoi(page, i) {
  const b64 = await page.evaluate(async (i) => {
    const e = window.__sitoDemo.envois[i];
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
  ok(await connecter(page), 'un code faux est refusé avec un message');
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
  ok(await attendreEnvois(page, 2), 'photo JPEG (iPhone, GPS, orientation 6) envoyée, puis son original');
  const e1 = await lireEnvoi(page, 0);
  ok(e1.genre === 'photo' && e1.role === 'avant' && e1.paire === 1, 'rangée en « avant », paire 1', `${e1.role} ${e1.paire}`);
  ok(e1.nom === 'chantier.jpg' && e1.type === 'image/jpeg', 'nom et type du fichier envoyé', `${e1.nom} ${e1.type}`);
  for (const [quoi, bon, detail] of await controlerJpegPrepare(e1.buf, 'jpeg')) ok(bon, `photo préparée : ${quoi}`, detail);
  ok(e1.buf.length < (await readFile(F('chantier.jpg'))).length * 2, 'poids raisonnable', `${e1.buf.length} octets`);
  // Décision du 9 octobre : l'original en pleine résolution suit, après la version réduite.
  const o1 = await lireEnvoi(page, 1);
  ok(o1.genre === 'original' && o1.cle === e1.cle && sha(o1.buf) === sha(await readFile(F('chantier.jpg'))), 'l’original suit la photo réduite, octet pour octet, relié par sa clé', `${o1.genre} ${o1.cle === e1.cle}`);

  await page.getByLabel('Photo après').first().setInputFiles(F('capture.png'));
  ok(await attendreEnvois(page, 4), 'PNG transparent envoyé, puis son original');
  const e2 = await lireEnvoi(page, 2);
  const o2 = await lireEnvoi(page, 3);
  ok(o2.genre === 'original' && o2.cle === e2.cle && sha(o2.buf) === sha(await readFile(F('capture.png'))), 'original du PNG envoyé intact');
  const { data: pxPng, info: iPng } = await sharp(e2.buf).raw().toBuffer({ resolveWithObject: true });
  const coin = [pxPng[0], pxPng[1], pxPng[2]];
  const centre = (() => { const i = (300 * iPng.width + 400) * iPng.channels; return [pxPng[i], pxPng[i + 1], pxPng[i + 2]]; })();
  ok(e2.type === 'image/jpeg' && e2.role === 'apres' && e2.paire === 1, 'PNG → JPEG, rangé en « après », paire 1', `${e2.type} ${e2.role} ${e2.paire}`);
  ok(coin.every((v) => v > 240) && centre.every((v) => v < 30), 'transparence rendue en blanc, contenu intact', `${coin} / ${centre}`);
  await page.waitForTimeout(300);
  ok(await page.locator('.paire').first().locator('img').count() === 2, 'la paire avant / après s’affiche avec ses deux images');

  await page.getByLabel('Ajouter des photos ou vidéos').setInputFiles([F('IMG_0001.HEIC'), F('IMG_0002.DNG'), F('video.mp4'), F('devis.pdf')]);
  ok(await attendreEnvois(page, 7), 'HEIC, DNG et vidéo envoyés');
  ok(await page.getByText('Un PDF n’est pas une photo').isVisible(), 'PDF refusé avec une phrase claire');
  const e3 = await lireEnvoi(page, 4), e4 = await lireEnvoi(page, 5), e5 = await lireEnvoi(page, 6);
  ok(e3.format === 'heic' && sha(e3.buf) === sha(heic) && e3.type === 'image/heic', 'HEIC illisible ici : envoyé tel quel, octet pour octet', `${e3.format} ${e3.type}`);
  ok(e4.format === 'dng' && sha(e4.buf) === sha(dng) && e4.type === 'image/x-adobe-dng', 'DNG : envoyé tel quel, octet pour octet', `${e4.format} ${e4.type}`);
  ok(e5.genre === 'video' && e5.format === 'mp4' && sha(e5.buf) === sha(await readFile(F('video.mp4'))), 'vidéo rangée avec les vidéos, intacte', `${e5.genre} ${e5.format}`);
  ok(await envois(page) === 7, 'le PDF n’est jamais parti, et aucun « original » pour un fichier déjà envoyé tel quel', String(await envois(page)));
  await page.waitForTimeout(300);
  ok(await page.getByText('Reçue, en préparation').count() === 2, 'HEIC et DNG affichés « reçue, en préparation »');

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
  ok(exporte.chantiers.some((c) => c.titre === 'Ravalement rue des Essais' && c.photos.length === 4), 'l’export contient le chantier et ses photos');
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

  // ------------------------------------------------ app Android (Play Store) : aucun prix, aucun achat
  console.log('\nApp Android (Play Store)');
  {
    const { ctx: c, page: p } = await nouvellePage(appareils[1], '&source=android');
    await connecter(p);
    await p.goto(`${BASE}?demo#/abonnement`); await p.waitForTimeout(400);
    const texte = await p.locator('main').textContent();
    ok(!/€|HT|prix|payer|paiement en ligne/i.test(texte), 'aucun prix ni paiement affiché', texte.slice(0, 200));
    ok(/Formule mensuel/.test(texte), 'l’état de l’abonnement reste affiché');
    await p.goto(`${BASE}?demo#/abonnement`); await p.waitForTimeout(300);
    ok(!/€/.test(await p.locator('main').textContent()), 'reste en mode Android sans le paramètre (mémorisé)');
    await c.close();
    const { ctx: c2, page: p2 } = await nouvellePage(appareils[0]);
    await connecter(p2);
    await p2.goto(`${BASE}?demo#/abonnement`); await p2.waitForTimeout(400);
    ok(/39\s€ HT par mois/.test(await p2.locator('main').textContent()), 'sur le web, le prix est affiché');
    await c2.close();
  }
} finally {
  await navigateur.close();
  serveur.close();
  await rm(tmp, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
process.exit(fautes ? 1 : 0);

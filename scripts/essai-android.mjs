#!/usr/bin/env node
// Essai de la préparation de l'app Android (T28) : `scripts/android.mjs`
// (twa-manifest.json, assetlinks.json) et le Worker qui sert la preuve
// (`worker/routeur.js`), publiée par `atelier/publier.mjs`. Sans réseau.
//
// Ce qu'il mesure :
//   - les noms de paquet : ceux que Bubblewrap accepte passent, les autres
//     non (une seule partie, chiffre en tête, tiret, mot réservé de Java) ;
//   - l'empreinte : 32 octets en hexadécimal majuscule, séparés par « : » ;
//   - assetlinks.json : exactement le texte de Bubblewrap
//     (`DigitalAssetLinks.generateAssetLinks`), relu comme JSON ;
//   - twa-manifest.json : l'app s'ouvre sur `/?source=android` ; nom, nom
//     court et couleurs sont ceux de `app/vite.config.ts` ; icônes et
//     manifeste sur l'adresse de l'app ; repli en Custom Tab ;
//   - le Worker : la preuve est publiée avec la version, servie en JSON,
//     gardée une heure ; tout autre fichier caché reste refusé.
//
//   node scripts/essai-android.mjs
//   node scripts/essai-android.mjs --contre-essai   (copies cassées)
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from './env.mjs';

const EMPREINTE = Array.from({ length: 32 }, (_, i) => (i * 7 + 16).toString(16).toUpperCase().padStart(2, '0').slice(-2)).join(':');

// Le texte de Bubblewrap (DigitalAssetLinks.js, @bubblewrap/core 1.27.0).
const bubblewrap = (applicationId, ...sha256Fingerprints) => `[{
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "${applicationId}",
        "sha256_cert_fingerprints": ["${sha256Fingerprints.join('", "')}"]
      }
    }]\n`;

async function scenario(android, worker) {
  let fautes = 0, essais = 0;
  const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

  for (const bon of ['fr.sito.app', 'fr.sito_app.twa', 'com.exemple.App2'])
    ok(android.fautePaquet(bon) === null, `paquet accepté : ${bon}`, android.fautePaquet(bon));
  for (const mauvais of ['sito', 'fr.1sito', 'fr.si-to', 'fr.new.app', 'fr..app', ''])
    ok(android.fautePaquet(mauvais) !== null, `paquet refusé : « ${mauvais} »`);

  ok(android.empreinteValide(EMPREINTE), 'une empreinte SHA-256 complète est acceptée', EMPREINTE);
  ok(!android.empreinteValide(EMPREINTE.toLowerCase()) && !android.empreinteValide(EMPREINTE.slice(3)), 'minuscules ou empreinte courte refusées');

  const al = android.assetlinks({ paquet: 'fr.sito.app', empreintes: [EMPREINTE] });
  ok(JSON.stringify(al) === JSON.stringify(JSON.parse(bubblewrap('fr.sito.app', EMPREINTE))), 'assetlinks.json : le texte de Bubblewrap', JSON.stringify(al));
  let refuse = null;
  try { android.assetlinks({ paquet: 'fr.sito.app', empreintes: [] }); } catch (e) { refuse = e; }
  ok(Boolean(refuse), 'assetlinks sans empreinte : refusé');

  const vite = readFileSync(join(RACINE, 'app', 'vite.config.ts'), 'utf8');
  const tw = android.twaManifeste({ hote: 'app.sito-essai.fr', paquet: 'fr.sito.app' });
  ok(tw.startUrl === '/?source=android', 'l app Android s ouvre sur /?source=android (sans prix)', tw.startUrl);
  ok(vite.includes(`name: '${tw.name}'`) && vite.includes(`short_name: '${tw.launcherName}'`), 'nom et nom court : ceux de l app web', `${tw.name} / ${tw.launcherName}`);
  ok(vite.includes(`theme_color: '${tw.themeColor}'`) && vite.includes(`background_color: '${tw.backgroundColor}'`), 'couleurs : celles de l app web');
  ok(tw.host === 'app.sito-essai.fr' && tw.iconUrl === 'https://app.sito-essai.fr/icone-512.png' && tw.webManifestUrl === 'https://app.sito-essai.fr/manifest.webmanifest',
    'icônes et manifeste sur l adresse de l app');
  ok(tw.fallbackType === 'customtabs' && tw.packageId === 'fr.sito.app' && tw.display === 'standalone', 'paquet, plein écran, repli en Custom Tab');
  for (const ic of ['icone-512.png', 'icone-masque-512.png'])
    ok(vite.includes(`src: '${ic}'`), `l icône ${ic} est bien dans le manifeste de l app`);

  // Le Worker, avec la publication par versions, comme essai-publication.
  const pub = await import(pathToFileURL(join(RACINE, 'atelier', 'publier.mjs')).href);
  const D = mkdtempSync(join(tmpdir(), 'essai-android-'));
  try {
    const src = join(D, 'app');
    mkdirSync(join(src, '.well-known'), { recursive: true });
    writeFileSync(join(src, 'index.html'), '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Sitô</title></head><body>app</body></html>');
    writeFileSync(join(src, '.well-known', 'assetlinks.json'), JSON.stringify(al));
    writeFileSync(join(src, '.well-known', 'autre.json'), '{}');
    const stockage = pub.stockageDossier(join(D, 'r2'));
    const adresses = pub.adressesFichier(join(D, 'kv.json'));
    const env = pub.liaisonsEssai(stockage, adresses);
    const r = await pub.publierVersion({ site: 'app', dossier: src, stockage, adresses, hotes: ['app.sito-essai.fr'], verifier: async () => ({ ok: true }) });
    ok(r.publie, 'l app publiée avec sa preuve', JSON.stringify(r));
    const appeler = (chemin) => worker.fetch(new Request(`https://app.sito-essai.fr${chemin}`), env, { waitUntil() {} });
    const rep = await appeler('/.well-known/assetlinks.json');
    const corps = await rep.text();
    let lu = null; try { lu = JSON.parse(corps); } catch { /* pas du JSON */ }
    ok(rep.status === 200 && JSON.stringify(lu) === JSON.stringify(al), 'le Worker sert assetlinks.json tel qu il a été publié', `statut ${rep.status}`);
    ok((rep.headers.get('content-type') || '').startsWith('application/json'), 'servi en application/json', rep.headers.get('content-type'));
    ok(rep.headers.get('cache-control') === 'public, max-age=3600', 'gardé une heure, pas un an', rep.headers.get('cache-control'));
    ok((await appeler('/.well-known/autre.json')).status === 400, 'un autre fichier de .well-known reste refusé');
    ok((await appeler('/.manifeste.json')).status === 400, 'le manifeste caché de la publication reste refusé');
  } finally { rmSync(D, { recursive: true, force: true }); }
  return { fautes, essais };
}

async function essayer(a, w) {
  try { return await scenario(a, w); } catch (e) { console.log(`  FAUTE l essai s arrête : ${e.message}`); return { fautes: 1, essais: 1 }; }
}

const href = (...p) => pathToFileURL(join(RACINE, ...p)).href;
if (!process.argv.includes('--contre-essai')) {
  const { fautes, essais } = await essayer(await import(href('scripts', 'android.mjs')), (await import(href('worker', 'routeur.js'))).default);
  console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
  process.exitCode = fautes ? 1 : 0;
} else {
  const casses = [
    ['scripts/android.mjs', 'l app ne s ouvre plus en mode Android', (s) => s.replace("startUrl: '/?source=android',", "startUrl: '/',")],
    ['scripts/android.mjs', 'les mots réservés de Java passent', (s) => s.replace('if (MOTS_JAVA.has(p))', 'if (false)')],
    ['scripts/android.mjs', 'la relation de la preuve est fausse', (s) => s.replace("relation: ['delegate_permission/common.handle_all_urls']", "relation: ['delegate_permission/common.get_login_creds']")],
    ['worker/routeur.js', 'le Worker refuse la preuve', (s) => s.replace('if (p === ASSETLINKS) return', 'if (false) return')],
    ['worker/routeur.js', 'le Worker sert tous les fichiers cachés', (s) => s.replace("m === '.' || m.startsWith('.')", "m === '.'")],
  ];
  const d = mkdtempSync(join(tmpdir(), 'sito-android-casse-'));
  let justes = 0;
  try {
    for (const [i, [fichier, quoi, casser]] of casses.entries()) {
      const source = readFileSync(join(RACINE, fichier), 'utf8').replace(/from '(\.\.?\/[^']+)'/g, (_, rel) => `from '${pathToFileURL(join(RACINE, fichier, '..', rel)).href}'`);
      const cassee = casser(source);
      if (cassee === source) { console.log(`  FAUTE la cassure « ${quoi} » ne s applique pas`); continue; }
      const f = join(d, `casse-${i}.mjs`);
      writeFileSync(f, cassee.replace("const RACINE = join(fileURLToPath(import.meta.url), '..', '..');", `const RACINE = ${JSON.stringify(RACINE)};`));
      console.log(`\n--- copie cassée (${fichier}) : ${quoi}`);
      const a = fichier === 'scripts/android.mjs' ? await import(pathToFileURL(f).href) : await import(href('scripts', 'android.mjs'));
      const w = fichier === 'worker/routeur.js' ? (await import(pathToFileURL(f).href)).default : (await import(href('worker', 'routeur.js'))).default;
      const { fautes } = await essayer(a, w);
      console.log(fautes ? '  => rouge, juste' : '  => VERT : l essai n attrape pas cette cassure');
      if (fautes) justes++;
    }
  } finally { rmSync(d, { recursive: true, force: true }); }
  console.log(`\nContre-essai : ${justes} cassure(s) sur ${casses.length} attrapée(s).`);
  process.exitCode = justes === casses.length ? 0 : 1;
}

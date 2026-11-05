#!/usr/bin/env node
// L'app Android de Sitô (T28) : une « Trusted Web Activity » qui ouvre l'app
// web en plein écran, construite par Bubblewrap (T29). Ce script prépare les
// deux fichiers qu'il faut, et rien d'autre :
//
//   - `twa-manifest.json`, que `bubblewrap build` lit (forme : l'interface
//     `TwaManifestJson` de `@bubblewrap/core` 1.27.0, relevée le 5 nov. 2026) ;
//   - `.well-known/assetlinks.json`, que l'app web sert pour prouver que
//     l'app Android est bien la sienne. Sans lui, Android ouvre l'app avec
//     une barre d'adresse (Custom Tab) au lieu du plein écran. Même texte que
//     `DigitalAssetLinks.generateAssetLinks` de Bubblewrap.
//
// L'app s'ouvre sur `/?source=android` : l'app web s'en souvient et cache
// tout prix et tout lien d'achat (décision du 5 oct., règle de Google Play ;
// `app/src/donnees/index.ts`).
//
// Ce qui manque pour de vrai, et que ce script ne devine pas : l'adresse de
// l'app (le domaine de Sitô, F6, puis T27), le nom du paquet (définitif une
// fois publié sur Google Play) et l'empreinte SHA-256 de la clé de signature
// (créée avec le compte Google Play, F12). Avec eux :
//
//   node scripts/android.mjs --hote app.exemple.fr --paquet fr.exemple.app \
//        --empreinte AA:BB:…:FF [--sortie android]
//
// écrit `android/twa-manifest.json` et `app/public/.well-known/assetlinks.json`
// (le second part avec l'app à la construction suivante).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(fileURLToPath(import.meta.url), '..', '..');

// Règles de `validatePackageId` (`@bubblewrap/core`, util.js) : au moins deux
// parties séparées par des points, chacune commence par une lettre, puis
// lettres, chiffres ou « _ », et aucun mot réservé de Java.
const SEGMENT = /^[a-zA-Z][A-Za-z0-9_]*$/;
const MOTS_JAVA = new Set(['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
  'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
  'volatile', 'while']);

export function fautePaquet(id) {
  if (typeof id !== 'string' || !id) return 'nom de paquet vide';
  const parts = id.split('.');
  if (parts.length < 2) return 'il faut au moins deux parties séparées par des points';
  for (const p of parts) {
    if (MOTS_JAVA.has(p)) return `« ${p} » est un mot réservé de Java`;
    if (!SEGMENT.test(p)) return `« ${p} » : lettres, chiffres et « _ » seulement, en commençant par une lettre`;
  }
  return null;
}

// L'empreinte telle que Google Play la montre : 32 octets en hexadécimal
// majuscule, séparés par « : ».
export const empreinteValide = (e) => typeof e === 'string' && /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(e);

const HOTE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function assetlinks({ paquet, empreintes }) {
  const faute = fautePaquet(paquet);
  if (faute) throw new Error(`paquet refusé : ${faute}`);
  if (!Array.isArray(empreintes) || !empreintes.length) throw new Error('il faut au moins une empreinte SHA-256');
  for (const e of empreintes) if (!empreinteValide(e)) throw new Error(`empreinte refusée : ${e}`);
  return [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: paquet, sha256_cert_fingerprints: empreintes },
  }];
}

// Les valeurs de l'app web, lues dans sa seule source (`app/vite.config.ts`),
// pour que l'app Android ne dise jamais autre chose que l'app.
export function manifesteWeb(racine = RACINE) {
  const t = readFileSync(join(racine, 'app', 'vite.config.ts'), 'utf8');
  const lire = (cle) => (t.match(new RegExp(`\\b${cle}:\\s*'([^']*)'`)) || [])[1];
  const m = { nom: lire('name'), court: lire('short_name'), theme: lire('theme_color'), fond: lire('background_color') };
  for (const [k, v] of Object.entries(m)) if (!v) throw new Error(`app/vite.config.ts : ${k} introuvable`);
  return m;
}

export function twaManifeste({ hote, paquet, web = manifesteWeb() }) {
  if (!HOTE.test(hote || '')) throw new Error(`adresse de l'app refusée : ${hote}`);
  const faute = fautePaquet(paquet);
  if (faute) throw new Error(`paquet refusé : ${faute}`);
  const base = `https://${hote}`;
  return {
    packageId: paquet,
    host: hote,
    name: web.nom,
    launcherName: web.court,
    display: 'standalone',
    orientation: 'portrait',
    themeColor: web.theme,
    navigationColor: web.theme,
    backgroundColor: web.fond,
    enableNotifications: false,
    startUrl: '/?source=android',
    iconUrl: `${base}/icone-512.png`,
    maskableIconUrl: `${base}/icone-masque-512.png`,
    splashScreenFadeOutDuration: 300,
    signingKey: { path: './android.keystore', alias: 'android' },
    appVersionCode: 1,
    appVersion: '1',
    generatorApp: 'bubblewrap-cli',
    webManifestUrl: `${base}/manifest.webmanifest`,
    fallbackType: 'customtabs',
    fullScopeUrl: `${base}/`,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };
  const hote = arg('hote'), paquet = arg('paquet'), empreinte = arg('empreinte');
  if (!hote || !paquet || !empreinte) {
    console.error('Il faut --hote, --paquet et --empreinte (domaine de Sitô : F6 ; clé de signature : F12).');
    process.exit(3);
  }
  const sortie = join(RACINE, arg('sortie') || 'android');
  mkdirSync(sortie, { recursive: true });
  writeFileSync(join(sortie, 'twa-manifest.json'), JSON.stringify(twaManifeste({ hote, paquet }), null, 2) + '\n');
  const wk = join(RACINE, 'app', 'public', '.well-known');
  mkdirSync(wk, { recursive: true });
  writeFileSync(join(wk, 'assetlinks.json'), JSON.stringify(assetlinks({ paquet, empreintes: [empreinte] }), null, 2) + '\n');
  console.log(`Écrits : ${join(sortie, 'twa-manifest.json')} et app/public/.well-known/assetlinks.json`);
}

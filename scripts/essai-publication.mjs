// Essai de la publication par versions (atelier/publier.mjs) et du Worker qui
// sert les sites (worker/routeur.js), sans Cloudflare : le stockage est un
// dossier, la table des adresses un fichier JSON, et le Worker est appelé
// comme Cloudflare l'appellerait. On mesure ce que le visiteur reçoit.
//
//   node scripts/essai-publication.mjs [module de publication] [module du Worker]
//
// Ce que l'essai ne prouve pas : le comportement réel de R2, de KV (délai de
// 60 s) et du cache de Cloudflare. À refaire sur Cloudflare dès que le compte
// existe (PLAN-APP.md, section 9, étape 1).

import { mkdtempSync, cpSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const pub = await import(pathToFileURL(resolve(process.argv[2] || 'atelier/publier.mjs')).href);
const worker = (await import(pathToFileURL(resolve(process.argv[3] || 'worker/routeur.js')).href)).default;

const D = mkdtempSync(join(tmpdir(), 'essai-publication-'));
const stockage = pub.stockageDossier(join(D, 'r2'));
const adresses = pub.adressesFichier(join(D, 'kv.json'));
const env = pub.liaisonsEssai(stockage, adresses);
const appeler = (url, methode = 'GET') => worker.fetch(new Request(url, { method: methode }), env, { waitUntil() {} });
const texte = async (r) => Buffer.from(await r.arrayBuffer()).toString('utf8');

// Le site de démonstration quand il existe (fabriqué avec les vraies images,
// qui ne sont pas dans Git). Sinon, dans la CI ou un clone neuf, un petit site
// d'essai fabriqué ici : la publication ne dépend pas du contenu des pages.
let source = 'sites/480423623';
if (!existsSync(join(source, 'index.html'))) {
  source = join(D, 'site-essai');
  const { mkdirSync } = await import('node:fs');
  mkdirSync(join(source, 'images'), { recursive: true });
  writeFileSync(join(source, 'index.html'), '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Essai</title></head><body><h1>Essai</h1><img src="images/facade.webp" alt="Façade"><a href="le-travail">Le travail</a></body></html>');
  writeFileSync(join(source, 'le-travail.html'), '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Le travail</title></head><body><h1>Le travail</h1></body></html>');
  writeFileSync(join(source, 'donnees.json'), '{"essai":true}');
  // une vraie image WebP (en-tête RIFF/WEBP valide, 1 × 1 pixel)
  writeFileSync(join(source, 'images', 'facade.webp'), Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64'));
  console.log('Site de démonstration absent (images hors de Git) : essai sur un petit site fabriqué ici.');
}

let fautes = 0;
const constat = (nom, ok, detail = '') => { if (!ok) fautes++; console.log(`${ok ? 'ok   ' : 'FAUTE'}  ${nom}${detail ? ' : ' + detail : ''}`); };
const accepte = async () => ({ ok: true });
const refuse = async () => ({ ok: false, bloquants: ['T1 lien d appel vide (essai)'] });
const hotes = ['sud-ravalement.sito-essai.fr', 'www.sud-ravalement-facades.fr'];

// --- version 1
const v1dir = join(D, 'v1'); cpSync(source, v1dir, { recursive: true });
const r1 = await pub.publierVersion({ site: 'sud-ravalement', dossier: v1dir, stockage, adresses, hotes, verifier: accepte });
constat('version 1 publiée', r1.publie && r1.version === 1, JSON.stringify(r1));
const page1 = await appeler('https://sud-ravalement.sito-essai.fr/');
const html1 = await texte(page1);
constat('l adresse offerte sert la page d accueil', page1.status === 200 && html1.includes('<html'), 'statut ' + page1.status);
constat('type html', (page1.headers.get('content-type') || '').startsWith('text/html'));
constat('le visiteur ne reçoit pas donnees.json', (await appeler('https://sud-ravalement.sito-essai.fr/donnees.json')).status === 404);
const dom = await appeler('https://WWW.Sud-Ravalement-Facades.fr./');
constat('le domaine propre sert le même site (majuscules, point final)', dom.status === 200 && (await texte(dom)) === html1);
const img = (html1.match(/(?:src|href)="(images\/[^"]+\.(?:avif|webp|jpg))"/) || [])[1];
const rImg = img ? await appeler('https://sud-ravalement.sito-essai.fr/' + img) : null;
constat('une image de la page est servie avec son type et un cache long', !!rImg && rImg.status === 200
  && /^image\//.test(rImg.headers.get('content-type')) && /immutable/.test(rImg.headers.get('cache-control')), img || 'aucune image trouvée');
if (existsSync(join(source, 'le-travail.html'))) {
  constat('une adresse sans .html sert la page', (await appeler('https://sud-ravalement.sito-essai.fr/le-travail')).status === 200);
}
constat('adresse inconnue : 404 propre', (await appeler('https://inconnu.sito-essai.fr/')).status === 404);
constat('remontée de dossier refusée', [400, 404].includes((await appeler('https://sud-ravalement.sito-essai.fr/%2e%2e/%2e%2e/kv.json')).status));
constat('le manifeste interne n est pas servi', [400, 404].includes((await appeler('https://sud-ravalement.sito-essai.fr/.manifeste.json')).status));
constat('écriture refusée (POST)', (await appeler('https://sud-ravalement.sito-essai.fr/', 'POST')).status === 405);
constat('en-tête de sécurité présent', page1.headers.get('x-content-type-options') === 'nosniff');

// --- version 2 : une seule page change ; les images sont recopiées, pas renvoyées
const v2dir = join(D, 'v2'); cpSync(source, v2dir, { recursive: true });
writeFileSync(join(v2dir, 'index.html'), readFileSync(join(v2dir, 'index.html'), 'utf8').replace('</body>', '<!-- v2 --></body>'));
const r2 = await pub.publierVersion({ site: 'sud-ravalement', dossier: v2dir, stockage, adresses, hotes, verifier: accepte });
constat('version 2 : seul le fichier changé repart', r2.publie && r2.envoyes === 1 && r2.recopies === r1.fichiers - 1, `envoyés ${r2.envoyes}, recopiés ${r2.recopies}`);
const page2 = await appeler('https://sud-ravalement.sito-essai.fr/');
constat('le visiteur voit la version 2', (await texte(page2)).includes('<!-- v2 -->') && page2.headers.get('x-sito-version') === '2');

// --- une version refusée par les vérificateurs ne remplace rien
const v3dir = join(D, 'v3'); cpSync(source, v3dir, { recursive: true });
writeFileSync(join(v3dir, 'index.html'), '<html><body>site cassé</body></html>');
const r3 = await pub.publierVersion({ site: 'sud-ravalement', dossier: v3dir, stockage, adresses, hotes, verifier: refuse });
const page3 = await appeler('https://sud-ravalement.sito-essai.fr/');
constat('version refusée : rien n est publié', !r3.publie && r3.bloquants.length === 1);
constat('version refusée : la version 2 reste en ligne', (await texte(page3)).includes('<!-- v2 -->'));

// --- versions 3 et 4 : on n'en garde que deux ; retour en arrière possible
const v4dir = join(D, 'v4'); cpSync(source, v4dir, { recursive: true });
writeFileSync(join(v4dir, 'index.html'), readFileSync(join(v4dir, 'index.html'), 'utf8').replace('</body>', '<!-- v3 --></body>'));
await pub.publierVersion({ site: 'sud-ravalement', dossier: v4dir, stockage, adresses, hotes, verifier: accepte });
const gardees = await pub.versionsDe(stockage, 'sud-ravalement');
constat('deux versions gardées', JSON.stringify(gardees) === '[2,3]', JSON.stringify(gardees));
await pub.revenir({ site: 'sud-ravalement', version: 2, stockage, adresses, hotes });
constat('retour à la version 2', (await texte(await appeler('https://www.sud-ravalement-facades.fr/'))).includes('<!-- v2 -->'));
let refusVieille = false;
try { await pub.revenir({ site: 'sud-ravalement', version: 1, stockage, adresses, hotes }); } catch { refusVieille = true; }
constat('retour à une version effacée refusé', refusVieille);

// Le dossier pèse environ 50 Mo : gardé seulement pour lire une faute.
if (!fautes) rmSync(D, { recursive: true, force: true });
console.log(`\n${fautes} faute(s). ${fautes ? `Dossier gardé : ${D}` : 'Dossier effacé.'}`);
process.exit(fautes ? 1 : 0);

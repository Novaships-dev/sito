#!/usr/bin/env node
// Met les sites du lot en ligne, privés, sur Cloudflare Pages.
//
// Spécification : `app/specs/08-PROSPECTION.md`. En amont, `fabriquer-lot.mjs`
// a fabriqué les sites et tiré les slugs ; en aval, la page d'appels (T39)
// donne les liens à Fabrice.
//
// Quatre choses à savoir avant de lire le code.
//
// 1. **Un seul projet, `sito-demo`, redéployé en entier.** Pages ne publie pas
//    un site à la fois : un dépôt porte le plan complet du projet. Publier le
//    lot du jour, c'est donc redéployer **tous les sites encore vivants**, le
//    lot du jour compris. Un site retiré n'est pas effacé : il n'entre plus
//    dans le manifeste, et son adresse rend 404.
//
// 2. **Le manifeste n'a besoin que d'empreintes, pas de fichiers.** Les
//    fichiers restent dans le magasin du projet d'un dépôt au suivant. C'est
//    pourquoi `prospection/en-ligne.json` garde, pour chaque slug, son plan
//    chemin → empreinte : les sites des jours précédents se redéploient sans
//    que leurs dossiers soient encore sur le disque, et sans rien renvoyer.
//    Ce fichier est versionné, comme le registre : la publication doit
//    survivre à un changement de machine.
//
// 3. **Les images communes ne montent qu'une fois.** L'empreinte Cloudflare ne
//    dépend que du contenu et de l'extension : les trente sites partagent les
//    mêmes images de banque, donc les mêmes empreintes, et `check-missing` ne
//    réclame que ce qui manque vraiment.
//
// 4. **Rien n'est indexable.** `_headers` pose `X-Robots-Tag: noindex` sur
//    tout le projet, `robots.txt` interdit tout, et il n'y a **aucune page
//    d'accueil** : la racine rend 404. Le slug de 16 caractères est le seul
//    secret de l'adresse (cadre légal, 08-PROSPECTION.md).
//
//   node scripts/prospection/publier.mjs --lot sites/prospection/<jour>/lot.json
//   node scripts/prospection/publier.mjs --retirer          (seulement le ménage)
//   node scripts/prospection/publier.mjs --sec              (dit, ne fait pas)
//
//   --lot <fichier>       le lot écrit par fabriquer-lot.mjs
//   --jour <AAAA-MM-JJ>   défaut : aujourd'hui, heure de Paris
//   --projet <nom>        défaut sito-demo
//   --en-ligne <fichier>  défaut prospection/en-ligne.json
//   --appels <fichier>    registre des artisans (défaut prospection/registre.json)
//   --sec                 ne publie rien : dit ce qui serait publié et retiré
//
// `extra` (appelé par `preparer-appels.mjs`, pas par la ligne de commande) :
// des fichiers fixes du projet, hors du cycle de vie des sites d'artisan —
// `_worker.js` (la fonction Pages) et la page d'appels sous son slug privé.
// Ils entrent au manifeste à chaque publication, jamais retirés par `plan()`
// puisqu'aucun artisan ne les porte.
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, sep, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../env.mjs';
import { clientCloudflare, empreinte, typeDe, PROJET } from './cloudflare-pages.mjs';
import * as registreAppels from './registre.mjs';

// Combien de temps un site non signé reste en ligne (08-PROSPECTION.md).
export const JOURS = 30;
export const EN_LIGNE = join(RACINE, 'prospection', 'en-ligne.json');

// Un artisan qui a signé garde son site : c'est devenu le sien.
const SIGNES = new Set(['abonne-mois', 'abonne-annee']);

export const ROBOTS = 'User-agent: *\nDisallow: /\n';

// `X-Robots-Tag` plutôt qu'une balise dans chaque page : il couvre aussi les
// images et les fichiers, et il ne peut pas être oublié sur une page.
export const ENTETES = `/*\n  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet\n  X-Frame-Options: DENY\n`;

// Ce qui ne part jamais en ligne : les données internes du générateur, et tout
// fichier caché (même règle que `atelier/publier.mjs`).
const EXCLUS = [/^donnees\.json$/, /(^|\/)\./, /\.log$/, /^sirene\.json$/, /^lot\.json$/];

// Une date de site, telle que le registre l'écrit (`registre.mjs`, JOUR).
// Le format se vérifie **avant** de calculer : `Date.parse` est si tolérant
// qu'il lit « le 3 mars » comme mars 2001, et un âge de 9 367 jours a l'air
// d'un vrai nombre. Une date mal formée doit se voir comme illisible, pas se
// transformer en un âge plausible (piège du 25 octobre).
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const jours = (a, b) => {
  if (!DATE.test(a) || !DATE.test(b)) return NaN;
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
};

export const jourDeParis = (d = new Date()) =>
  new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', dateStyle: 'short' }).format(d);

// --------------------------------------------------------------------- le plan
// Qui reste en ligne, qui part, et pourquoi. Fonction pure : c'est la décision,
// elle se mesure sans réseau et sans disque.
export function plan(registre, { jour = jourDeParis(), jours: duree = JOURS } = {}) {
  const gardes = [], retires = [];
  for (const [siren, f] of Object.entries(registre?.fiches || {})) {
    if (!f?.slug || !f?.site_le) continue; // aucun site montré : rien à publier
    const age = jours(f.site_le, jour);
    if (f.statut === 'ne-plus-appeler') retires.push({ siren, ...f, motif: 'retrait demandé (« ne plus appeler ») : le jour même' });
    else if (SIGNES.has(f.statut)) gardes.push({ siren, ...f, motif: 'abonné : le site est le sien' });
    // Une date illisible fait **retirer**, pas garder : `registre.ecrire()`
    // refuse d'écrire une date mal formée, donc celle-ci vient d'une retouche
    // à la main. Un site qu'on ne sait pas dater ne peut pas tenir la promesse
    // des 30 jours ; il sort, et son motif le dit.
    else if (!Number.isFinite(age)) retires.push({ siren, ...f, motif: `date de site illisible (« ${f.site_le} ») : retiré par précaution` });
    else if (age > duree) retires.push({ siren, ...f, motif: `${age} jours en ligne, la limite est ${duree}` });
    else gardes.push({ siren, ...f, motif: `${age} jour(s) en ligne` });
  }
  return { gardes, retires };
}

// ------------------------------------------------------- le plan d'un dossier
function fichiersDe(dossier) {
  const out = [];
  (function parcourir(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) parcourir(p);
      else if (e.isFile()) {
        const rel = relative(dossier, p).split(sep).join('/');
        if (!EXCLUS.some((re) => re.test(rel))) out.push(rel);
      }
    }
  })(dossier);
  return out.sort();
}

// Le plan d'un site : chemin en ligne → empreinte, et les contenus à envoyer.
// Les chemins sont préfixés du slug : c'est là que vit le site.
export async function planDuSite(slug, dossier) {
  if (!existsSync(join(dossier, 'index.html'))) throw new Error(`${dossier} n a pas d index.html : rien à publier`);
  const manifeste = {}, fichiers = new Map();
  for (const rel of fichiersDe(dossier)) {
    const contenu = readFileSync(join(dossier, rel));
    const cle = await empreinte(contenu, rel);
    manifeste[`${slug}/${rel}`] = cle;
    fichiers.set(cle, { cle, contenu, chemin: rel });
  }
  return { manifeste, fichiers };
}

// ------------------------------------------------------------------- publier
export async function publier({
  lot = [], registre = null, jour = jourDeParis(), projet = PROJET,
  client, enLigne = EN_LIGNE, sec = false, dire = console.log, jours: duree = JOURS,
  extra = [],
} = {}) {
  const memoire = existsSync(enLigne) ? JSON.parse(readFileSync(enLigne, 'utf8')) : { version: 1, sites: {} };
  const reg = registre || registreAppels.lire();
  const { gardes, retires } = plan(reg, { jour, jours: duree });

  const gardesSlugs = new Set(gardes.map((g) => g.slug));

  // Les sites du jour : leur plan se calcule depuis le disque. Les autres se
  // relisent dans la mémoire de ce qui est en ligne.
  //
  // **C'est le registre qui décide, jamais le lot.** Un site peut très bien
  // être dans le lot du jour et déjà retiré par le registre : l'artisan a dit
  // « ne plus appeler » entre la fabrication et la publication. Le publier
  // quand même, parce qu'il est sur le disque, serait mettre en ligne un site
  // dont le retrait est demandé (cadre légal, 08-PROSPECTION.md).
  const parSlug = new Map();
  const aEnvoyer = new Map();
  const ecartes = [];
  for (const s of lot) {
    if (!gardesSlugs.has(s.slug)) { ecartes.push(s); continue; }
    const dossier = resolve(RACINE, s.dossier);
    const { manifeste, fichiers } = await planDuSite(s.slug, dossier);
    parSlug.set(s.slug, manifeste);
    for (const [cle, f] of fichiers) aEnvoyer.set(cle, f);
  }
  const sansPlan = [];
  for (const g of gardes) {
    if (parSlug.has(g.slug)) continue;
    const vieux = memoire.sites?.[g.slug];
    if (vieux?.manifeste) parSlug.set(g.slug, vieux.manifeste);
    else sansPlan.push(g);
  }

  dire(`Publication du ${jour} sur « ${projet} » : ${parSlug.size} site(s) en ligne, ${retires.length} retiré(s)`);
  for (const r of retires) dire(`  retiré   ${r.siren} ${r.slug}  ${r.motif}`);
  for (const s of ecartes) dire(`  écarté   ${s.siren} ${s.slug}  fabriqué, mais le registre ne le garde pas : il ne part pas en ligne`);
  for (const s of sansPlan) dire(`  SAUTÉ    ${s.siren} ${s.slug}  son plan n est ni dans le lot ni dans ${relative(RACINE, enLigne)} : il ne peut pas être redéployé`);

  // Le manifeste du projet entier. `robots.txt` en fait partie ; il n'y a
  // aucune page d'accueil, et c'est voulu : la racine doit rendre 404.
  const manifeste = {};
  for (const [, m] of parSlug) Object.assign(manifeste, m);
  const robots = Buffer.from(ROBOTS, 'utf8');
  const cleRobots = await empreinte(robots, 'robots.txt');
  manifeste['robots.txt'] = cleRobots;
  aEnvoyer.set(cleRobots, { cle: cleRobots, contenu: robots, chemin: 'robots.txt' });

  for (const x of extra) {
    const contenu = Buffer.isBuffer(x.contenu) ? x.contenu : Buffer.from(x.contenu, 'utf8');
    const cle = await empreinte(contenu, x.chemin);
    manifeste[x.chemin] = cle;
    aEnvoyer.set(cle, { cle, contenu, chemin: x.chemin });
  }

  const bilan = {
    jour, projet, slugs: [...parSlug.keys()], retires, sansPlan, ecartes,
    extra: extra.map((x) => x.chemin),
    fichiers: Object.keys(manifeste).length, envoyes: 0, url: null, publie: false,
  };

  if (sec) {
    dire(`\n(--sec) ${bilan.fichiers} chemin(s) au manifeste, ${aEnvoyer.size} fichier(s) prêts à monter. Rien n a été envoyé.`);
    return bilan;
  }

  // Le projet doit exister. Fabrice n'a pas à le créer à la main.
  if (!(await client.projet(projet))) {
    dire(`  le projet « ${projet} » n existe pas encore : création`);
    await client.creerProjet(projet);
  }

  const jwt = await client.jetonTeleversement(projet);
  const toutes = [...new Set(Object.values(manifeste))];
  const manquants = await client.manquants(jwt, toutes);
  dire(`  ${toutes.length} empreinte(s) distinctes, ${manquants.length} à monter`);

  // Une empreinte manquante dont on n'a pas le contenu : le dépôt serait
  // refusé (le manifeste désignerait un fichier absent). Mieux vaut le dire
  // ici, avec le nom du site, que de lire l'erreur de Cloudflare.
  const introuvables = manquants.filter((h) => !aEnvoyer.has(h));
  if (introuvables.length) {
    const ou = Object.entries(manifeste).find(([, h]) => h === introuvables[0])?.[0];
    throw new Error(`${introuvables.length} fichier(s) manquent au magasin et ne sont pas sur le disque (${ou}) : refabriquer le site avant de publier`);
  }

  bilan.envoyes = await client.televerser(jwt, manquants.map((h) => aEnvoyer.get(h)));
  await client.confirmerEmpreintes(jwt, manquants);

  const { id, url } = await client.deployer(projet, { manifeste, entetes: ENTETES });
  bilan.url = url; bilan.id = id; bilan.publie = true;

  // La mémoire de ce qui est en ligne : les plans gardés, les retirés enlevés.
  const sites = {};
  for (const [slug, m] of parSlug) {
    const fiche = gardes.find((g) => g.slug === slug);
    sites[slug] = { siren: fiche?.siren ?? memoire.sites?.[slug]?.siren ?? null, publie_le: jour, manifeste: m };
  }
  mkdirSync(dirname(enLigne), { recursive: true });
  writeFileSync(enLigne, JSON.stringify({ version: 1, jour, projet, sites }, null, 2) + '\n', 'utf8');

  dire(`\n${bilan.envoyes} fichier(s) montés, ${bilan.fichiers} chemin(s) déployés.`);
  dire(`  dépôt ${id} : ${url}`);
  dire(`  les adresses privées : ${bilan.slugs.slice(0, 3).map((s) => `${url}/${s}/`).join('  ')}${bilan.slugs.length > 3 ? ` … (${bilan.slugs.length} en tout)` : ''}`);
  if (!gardesSlugs.size) dire('  aucun site gardé : le projet est vide, la racine rend 404.');
  return bilan;
}

// ------------------------------------------------------------------- en ligne
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2);
  const val = (nom, defaut = null) => { const i = args.indexOf('--' + nom); return i > -1 ? args[i + 1] : defaut; };
  const { chargerEnv, exiger } = await import('../env.mjs');
  chargerEnv();
  const sec = args.includes('--sec');

  let lot = [];
  const fichier = val('lot');
  if (fichier) {
    const j = JSON.parse(readFileSync(resolve(fichier), 'utf8'));
    lot = (Array.isArray(j) ? j : j.sites || []).filter((s) => s.slug && s.dossier);
  } else if (!args.includes('--retirer')) {
    console.error('usage : node scripts/prospection/publier.mjs --lot <lot.json> | --retirer [--sec]');
    process.exit(2);
  }

  let client = null;
  if (!sec) {
    exiger(['CLOUDFLARE_COMPTE_ID', 'CLOUDFLARE_JETON_API'],
      'publier les sites de prospection (double-clic sur lanceurs\\CLE_CLOUDFLARE.bat, action F5)');
    client = clientCloudflare({ compte: process.env.CLOUDFLARE_COMPTE_ID, jeton: process.env.CLOUDFLARE_JETON_API });
  }

  const bilan = await publier({
    lot, jour: val('jour', jourDeParis()), projet: val('projet', PROJET), client, sec,
    enLigne: val('en-ligne') ? resolve(val('en-ligne')) : EN_LIGNE,
    registre: registreAppels.lire(val('appels', registreAppels.CHEMIN)),
  });
  process.exitCode = bilan.publie || sec ? 0 : 1;
}

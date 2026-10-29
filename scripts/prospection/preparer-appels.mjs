#!/usr/bin/env node
// La soirée de bout en bout : extraire, qualifier, fabriquer le lot, publier,
// et produire la page d'appels du lendemain. Deux phases, parce que « la
// présence d'un site ne se devine pas » (`qualifier.mjs`) : une recherche web
// ne se scripte pas, elle se fait une fois par Claude Code au moment de
// préparer le lot.
//
//   1. lister
//      node scripts/prospection/preparer-appels.mjs --lister
//      Extrait (réseau, API publique) et qualifie une première fois, le site
//      de chaque candidat valant « inconnu » : écrit `prospection/a-verifier.json`
//      (hors de Git, un fichier de travail du soir), qui porte deux choses par
//      métier : le réservoir des candidats éligibles (pour requalifier sans
//      réseau à l'étape 2) et les `--verifier` premiers d'entre eux, triés,
//      dont Claude Code doit chercher le site sur le web.
//
//   2. préparer
//      node scripts/prospection/preparer-appels.mjs --sites <fichier.json>
//      `<fichier.json>` : { "<siren>": "aucun" | "reseau-social" | "annuaire"
//      | "ancien" | "recent-prestataire", ... } — ce que la recherche web a
//      trouvé pour tout ou partie des candidats de l'étape 1. Un SIREN absent
//      reste « inconnu ». Pour un candidat `metier_a_prouver` (ravalement au
//      nom muet), la valeur est un objet : { "site": "aucun", "metier": "oui"
//      | "non", "vu": "ce qui le montre" } ; sans « oui », il n'entre pas au lot. Qualifie une seconde fois avec cette information,
//      choisit les `--combien` meilleurs de chaque métier, fabrique (comme
//      `fabriquer-lot.mjs`), publie (comme `publier.mjs`, sauf `--sec`), et
//      écrit la page d'appels et `_worker.js` dans le même dépôt Cloudflare.
//
// Options communes : --jour (défaut aujourd'hui, heure de Paris), --metiers
// a,b (sous-ensemble), --entrees <fichier> (défaut prospection/a-verifier.json).
// Propres à --lister : --verifier <n> (défaut 20), --pages <n> (défaut 6).
// Propres à --sites   : --combien <n> (défaut 10), --sortie, --images,
//   --registre (unicité des sites), --appels (registre des artisans),
//   --projet, --en-ligne, --mobile, --sans-mobile, --sec.
//
// Jamais de lecture automatisée de Google (conditions d'utilisation,
// 08-PROSPECTION.md) : la recherche web de l'étape 1 est faite par Claude Code
// lui-même, pas par ce script.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { RACINE } from '../env.mjs';
import * as ex from './extraire.mjs';
import { qualifier, lot as prendreLot } from './qualifier.mjs';
import * as registreAppels from './registre.mjs';
import { fabriquerLot, jourDeParis } from './fabriquer-lot.mjs';
import { page, SMS, verifier as verifierPage } from './page-appels.mjs';
import { publier, EN_LIGNE } from './publier.mjs';
import { PROJET as PROJET_DEFAUT } from './cloudflare-pages.mjs';

export const A_VERIFIER = join(RACINE, 'prospection', 'a-verifier.json');
export const APPELS_FICHIER = join(RACINE, 'prospection', 'appels.json');
export const WORKER = join(RACINE, 'worker', 'appels.js');

// ------------------------------------------------------------------- lister
// Extrait et qualifie une première fois (site « inconnu » pour tout le monde,
// `qualifier.mjs` le note à 8 points), pour ordonner les candidats et choisir
// qui vérifier sur le web. Rend des données, n'écrit rien : c'est l'appelant
// qui décide où (fichier réel pour la soirée, dossier temporaire pour l'essai).
export async function lister({
  fiche = ex.metiers(), metiers: filtre = null, pages = 6, aujourdhui = new Date(),
  fetch: f = fetch, appels = registreAppels.CHEMIN, verifier = 20, dire = console.log,
} = {}) {
  const reg = registreAppels.lire(appels);
  const jour = jourDeParis(aujourdhui);
  const metiersSortie = {};

  for (const m of fiche.metiers) {
    if (filtre && !filtre.includes(m.nom)) continue;
    dire(`extraction : ${m.nom}`);
    const { entreprises, bilan } = await ex.extraire({ metier: m.nom, fiche, pages, aujourdhui, fetch: f, dire: (d) => dire('  ' + d) });
    // Sans exiger la preuve du métier : les noms muets doivent apparaître ici,
    // c'est la recherche web qui les fera entrer ou non dans le lot.
    const preliminaire = qualifier(entreprises, { registre: reg, aujourdhui, exigerPreuve: false }).retenus;
    dire(`  ${entreprises.length} éligible(s), ${preliminaire.length} appelable(s) aujourd'hui`);
    metiersSortie[m.nom] = {
      entreprises,
      bilan,
      a_verifier: preliminaire.slice(0, verifier).map((e) => ({
        siren: e.siren, nom: e.nom, commune: e.commune, note_sans_site: e.note,
        ...(e.preuveExigee ? { metier_a_prouver: true } : {}),
      })),
    };
  }
  return { jour, verifier, metiers: metiersSortie };
}

// ------------------------------------------------------------------- slug
// Le slug de la page d'appels est **stable** : c'est Fabrice qui la garde en
// favori sur son iPhone, elle n'est pas envoyée à des artisans comme celle
// d'un site (eux reçoivent un slug neuf à chaque fabrication). Un seul
// tirage, gardé dans `prospection/appels.json` (versionné, sans secret
// d'artisan : juste un chemin de routage).
export function appelsSlug({ fichier = APPELS_FICHIER, longueur = 16 } = {}) {
  if (existsSync(fichier)) {
    const j = JSON.parse(readFileSync(fichier, 'utf8'));
    if (j?.slug && /^[a-z0-9]+$/.test(j.slug)) return j.slug;
  }
  const slug = randomBytes(longueur).toString('base64url').replace(/[-_]/g, '').slice(0, longueur).toLowerCase();
  mkdirSync(dirname(fichier), { recursive: true });
  writeFileSync(fichier, JSON.stringify({ slug }, null, 1) + '\n');
  return slug;
}

// ------------------------------------------------------------------ préparer
// La seconde phase : qualifie avec ce que le web a dit, fabrique, publie,
// écrit la page d'appels. `entrees` est ce que `lister()` a rendu (ou son
// double relu depuis le disque) : jamais de nouvel appel réseau à l'API des
// entreprises ici.
export async function preparer({
  entrees, sites = {}, combien = 10, jour = entrees.jour,
  sortie = null, images = join(RACINE, 'images'),
  registre = join(RACINE, 'prospection', 'registre-sites.json'),
  appels = registreAppels.CHEMIN, mobile = 1, sec = false,
  projet = PROJET_DEFAUT, enLigne = EN_LIGNE, client = null,
  slugAppels = null, worker = WORKER, dire = console.log,
} = {}) {
  const reg = registreAppels.lire(appels);
  const parMetier = {};
  for (const [m, d] of Object.entries(entrees.metiers)) {
    parMetier[m] = qualifier(d.entreprises, { registre: reg, sites }).retenus;
  }
  const lot = prendreLot(parMetier, combien);
  dire(`Lot qualifié avec le web : ${lot.length} candidat(s) — ${Object.entries(parMetier).map(([m, r]) => `${m} ${Math.min(r.length, combien)}/${r.length}`).join(', ')}`);

  const bilanLot = await fabriquerLot({ lot, jour, sortie, images, registre, appels, mobile, sec, dire });

  const dossier = bilanLot.dossier;
  const slug = slugAppels || appelsSlug();
  const registrePost = registreAppels.lire(appels);
  const html = page(registrePost, { jour, lot: bilanLot.fabriques, base: '', gabaritSms: SMS, api: `/${slug}/api/resultat`, vus: null });
  const fautesPage = verifierPage(html);
  if (fautesPage.length) throw new Error(`page d appels refusée, rien n est publié :\n  - ${fautesPage.join('\n  - ')}`);

  let cheminPage = null;
  const extra = [];
  if (existsSync(worker)) extra.push({ chemin: '_worker.js', contenu: readFileSync(worker) });
  else dire(`  ATTENTION : ${worker} introuvable, le projet partirait sans sa fonction d appels`);
  if (!sec) {
    cheminPage = join(dossier, '_appels', 'index.html');
    mkdirSync(dirname(cheminPage), { recursive: true });
    writeFileSync(cheminPage, html, 'utf8');
  }
  extra.push({ chemin: `${slug}/index.html`, contenu: html });

  const bilanPub = await publier({
    lot: bilanLot.fabriques, registre: registrePost, jour, projet, client, enLigne, sec, dire, extra,
  });

  dire(`\nPage d appels : ${sec ? '(--sec, non écrite sur disque)' : cheminPage}, slug ${slug}`);
  if (bilanPub.publie) dire(`  en ligne : ${bilanPub.url}/${slug}/`);

  return { jour, lot: bilanLot, page: { slug, chemin: cheminPage, html }, publication: bilanPub };
}

// ------------------------------------------------------------------- en ligne
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2);
  const val = (nom, defaut = null) => { const i = args.indexOf('--' + nom); return i > -1 ? args[i + 1] : defaut; };
  const filtre = val('metiers')?.split(',').map((x) => x.trim()).filter(Boolean) || null;
  const fichierEntrees = val('entrees') ? resolve(val('entrees')) : A_VERIFIER;

  if (args.includes('--lister')) {
    const sortie = await lister({
      metiers: filtre, pages: Number(val('pages', 6)), verifier: Number(val('verifier', 20)),
      appels: val('appels') ? resolve(val('appels')) : registreAppels.CHEMIN,
    });
    mkdirSync(dirname(fichierEntrees), { recursive: true });
    writeFileSync(fichierEntrees, JSON.stringify(sortie, null, 1) + '\n', 'utf8');
    console.log(`\nÉcrit : ${fichierEntrees}`);
    for (const [m, d] of Object.entries(sortie.metiers)) {
      const aProuver = d.a_verifier.filter((x) => x.metier_a_prouver).length;
      console.log(`  ${m} : ${d.a_verifier.length} candidat(s) à vérifier sur le web${aProuver ? `, dont ${aProuver} dont le métier est à prouver` : ''}`);
    }
    console.log('\nÀ faire ensuite : chercher chaque candidat sur le web (nom + commune), écrire');
    console.log('le résultat dans un fichier { "<siren>": "aucun" | "reseau-social" | "annuaire"');
    console.log('| "ancien" | "recent-prestataire" }. Pour un candidat « metier_a_prouver », la valeur est');
    console.log('{ "site": "…", "metier": "oui" | "non", "vu": "ce qui le montre" } : sans « oui », pas de site. Puis :');
    console.log(`  node scripts/prospection/preparer-appels.mjs --sites <fichier> --entrees ${fichierEntrees}`);
  } else if (val('sites')) {
    const sites = JSON.parse(readFileSync(resolve(val('sites')), 'utf8'));
    if (!existsSync(fichierEntrees)) { console.error(`${fichierEntrees} introuvable : lancer d abord --lister.`); process.exit(2); }
    const entrees = JSON.parse(readFileSync(fichierEntrees, 'utf8'));
    const sec = args.includes('--sec');

    let client = null;
    if (!sec) {
      const { chargerEnv, exiger } = await import('../env.mjs');
      chargerEnv();
      const env = exiger(['CLOUDFLARE_COMPTE_ID', 'CLOUDFLARE_JETON_API'],
        'publier les sites et la page d appels (double-clic sur lanceurs\\CLE_CLOUDFLARE.bat, action F5)');
      const { clientCloudflare } = await import('./cloudflare-pages.mjs');
      client = clientCloudflare({ compte: env.CLOUDFLARE_COMPTE_ID, jeton: env.CLOUDFLARE_JETON_API });
    }

    const resultat = await preparer({
      entrees, sites, combien: Number(val('combien', 10)), jour: val('jour', entrees.jour),
      sortie: val('sortie') ? resolve(val('sortie')) : null,
      images: val('images') ? resolve(val('images')) : join(RACINE, 'images'),
      registre: val('registre') ? resolve(val('registre')) : join(RACINE, 'prospection', 'registre-sites.json'),
      appels: val('appels') ? resolve(val('appels')) : registreAppels.CHEMIN,
      mobile: args.includes('--sans-mobile') ? 0 : Number(val('mobile', 1)),
      projet: val('projet', PROJET_DEFAUT), enLigne: val('en-ligne') ? resolve(val('en-ligne')) : EN_LIGNE,
      sec, client,
    });
    process.exitCode = resultat.lot.echecs.length || (!sec && !resultat.publication.publie) ? 1 : 0;
  } else {
    console.error('usage : node scripts/prospection/preparer-appels.mjs --lister | --sites <fichier.json>');
    process.exit(2);
  }
}

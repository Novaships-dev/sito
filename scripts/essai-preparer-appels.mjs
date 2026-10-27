#!/usr/bin/env node
// Essai de la soirée de bout en bout (`scripts/prospection/preparer-appels.mjs`) :
// lister, qualifier avec ce que le web a dit, fabriquer, publier, produire la
// page d'appels. Tout tourne sans réseau et sans compte Cloudflare :
//
//   - l'extraction rejoue la population RÉELLE enregistrée une fois
//     (`prospection/essais/recherche-entreprises.json`, comme `essai-lot.mjs`) ;
//   - la publication passe par `scripts/faux-cloudflare.mjs` (un `fetch`
//     passé au **vrai** client, comme `essai-publication-prospection.mjs`).
//
// Deux choses que cet essai prouve séparément, pour rester honnête :
//
//   1. **La chaîne réelle** (`preparer()` avec `fabriquerLot`) : sans les
//      images des artisans (hors de Git), les 30 candidats qualifiés sont
//      comptés comme sautés, pas fabriqués — et la page se produit quand
//      même. C'est ce qui tourne dans un clone neuf et dans la CI.
//   2. **« 30 sites et la page produits »** : avec trente dossiers de site
//      minimaux (comme `essai-publication-prospection.mjs`, pas le vrai
//      générateur — les images ne sont pas dans Git), la page les montre
//      tous les trente et la publication les dépose tous, avec le worker et
//      la page d'appels, sur le faux Cloudflare.
//
//   node scripts/essai-preparer-appels.mjs
//   node scripts/essai-preparer-appels.mjs --contre-essai
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { RACINE } from './env.mjs';
import { fauxRecherche } from './faux-recherche-entreprises.mjs';
import { fauxCloudflare } from './faux-cloudflare.mjs';
import { clientCloudflare } from './prospection/cloudflare-pages.mjs';
import * as ex from './prospection/extraire.mjs';
import * as reg from './prospection/registre.mjs';
import { lister, appelsSlug, preparer } from './prospection/preparer-appels.mjs';
import { page, verifier as verifierPage } from './prospection/page-appels.mjs';
import { publier } from './prospection/publier.mjs';

const FICHE = ex.metiers();
const POPULATION = JSON.parse(readFileSync(join(RACINE, 'prospection', 'essais', 'recherche-entreprises.json'), 'utf8')).entreprises;
const AUJOURDHUI = new Date('2026-10-24T12:00:00Z');
const JOUR = '2026-10-24';

let controles = 0, fautes = 0;
function ok(condition, nom, detail = '') {
  controles++;
  if (condition) return true;
  fautes++;
  console.log(`  FAUTE ${nom}${detail ? ` — ${detail}` : ''}`);
  return false;
}
const ARANGER = [];
const temp = (quoi) => {
  const d = join(tmpdir(), `sito-appels-${quoi}-${Math.random().toString(36).slice(2, 10)}`);
  mkdirSync(d, { recursive: true });
  ARANGER.push(d);
  return d;
};
process.on('exit', () => { for (const d of ARANGER) { try { rmSync(d, { recursive: true, force: true }); } catch { /* parti */ } } });

console.log('Préparation des appels, de bout en bout\n');

// ------------------------------------------------------------------- lister
console.log('Lister : extraction et qualification préliminaire (sans réseau)');
const sortieListe = await lister({
  fiche: FICHE, pages: 6, aujourdhui: AUJOURDHUI, fetch: fauxRecherche(POPULATION),
  appels: join(temp('liste-appels'), 'registre.json'), verifier: 5,
});
ok(sortieListe.jour === JOUR, 'le jour est celui demandé', sortieListe.jour);
ok(Object.keys(sortieListe.metiers).sort().join(',') === 'couverture,peinture,ravalement',
  'les trois métiers du jour sont listés', Object.keys(sortieListe.metiers).join(','));
for (const [m, d] of Object.entries(sortieListe.metiers)) {
  ok(d.a_verifier.length <= 5, `${m} : au plus 5 candidats à vérifier (--verifier 5)`, String(d.a_verifier.length));
  ok(d.entreprises.length >= d.a_verifier.length, `${m} : le réservoir contient au moins les candidats à vérifier`);
  const notes = d.a_verifier.map((c) => c.note_sans_site);
  ok(notes.every((n, i) => i === 0 || notes[i - 1] >= n), `${m} : les candidats à vérifier sont triés, meilleure note d abord`, notes.join(','));
  ok(d.a_verifier.every((c) => c.siren && c.nom && c.commune), `${m} : chaque candidat à vérifier porte son SIREN, son nom et sa commune`);
}

// ------------------------------------------------------------------- slug
console.log('\nLe slug de la page d appels (stable, jamais deviné)');
const fichierSlug = join(temp('slug'), 'appels.json');
const s1 = appelsSlug({ fichier: fichierSlug });
ok(/^[a-z0-9]{16}$/.test(s1), 'le premier tirage fait 16 caractères, lettres et chiffres', s1);
const s2 = appelsSlug({ fichier: fichierSlug });
ok(s1 === s2, 'un second appel relit le même slug, il n en tire pas un autre', `${s1} / ${s2}`);
writeFileSync(fichierSlug, JSON.stringify({ slug: 'PAS-VALIDE!!' }));
const s3 = appelsSlug({ fichier: fichierSlug });
ok(s3 !== 'PAS-VALIDE!!' && /^[a-z0-9]{16}$/.test(s3), 'un fichier abîmé ne bloque pas : un nouveau slug valide est tiré', s3);

// -------------------------------------------- préparer, sans aucune image
console.log('\nPréparer, sans aucune image (ce qui tourne dans un clone neuf)');

function entreprise(siren, nom, metier, { annees = 10, rge = false } = {}) {
  return {
    siren, nom, metier, commune: 'MARSEILLE', codePostal: '13001', codeApe: '43.34Z',
    dateCreation: '2010-01-01', annees, effectif: '01', rge, nomDitLeMetier: true,
  };
}
const METIERS3 = ['ravalement', 'couverture', 'peinture'];
let compteur = 100000001;
const entrees = { jour: JOUR, verifier: 20, metiers: {} };
const sitesMap = {};
for (const m of METIERS3) {
  const liste = [];
  for (let i = 0; i <= 10; i++) {
    const siren = String(compteur++);
    const top = i === 0; // la meilleure fiche possible, mais « site récent, prestataire » : doit être écartée
    liste.push(entreprise(siren, `ARTISAN ${m.toUpperCase()} ${i}`, m, { annees: top ? 30 : 10 + i, rge: top }));
    if (top) sitesMap[siren] = 'recent-prestataire';
  }
  entrees.metiers[m] = { entreprises: liste, bilan: {} };
}

const fauxCF = fauxCloudflare({ projets: [] });
const clientCF = clientCloudflare({ compte: fauxCF.compte, jeton: fauxCF.jeton, fetch: fauxCF.fetch });
const dits = [];
const resultat = await preparer({
  entrees, sites: sitesMap, combien: 10, jour: JOUR,
  sortie: temp('sortie-sans-images'), images: temp('images-vides'),
  registre: join(temp('reg-sites'), 'sites.json'), appels: join(temp('reg-appels'), 'registre.json'),
  mobile: 0, sec: false, projet: 'essai', enLigne: join(temp('en-ligne'), 'en-ligne.json'),
  client: clientCF, slugAppels: appelsSlug({ fichier: join(temp('slug-prepa'), 'appels.json') }),
  dire: (d) => dits.push(d),
});
const sortieTexte = dits.join('\n');

ok(resultat.lot.fabriques.length === 0, 'aucune image sur la machine : aucun site réellement fabriqué', String(resultat.lot.fabriques.length));
ok(resultat.lot.sautes.length === 30, 'les 30 candidats retenus (10 par métier) sont comptés comme sautés, pas perdus', String(resultat.lot.sautes.length));
ok(!resultat.lot.sautes.some((s) => sitesMap[s.siren] === 'recent-prestataire'),
  'le candidat « site récent, fait par un prestataire » n est jamais dans le lot : la recherche web l a écarté avant même le choix des dix');
ok(/SAUTÉ/.test(sortieTexte), 'le message dit SAUTÉ pour chaque métier sans images');
ok(resultat.page.html.length > 0, 'la page d appels est produite même sans aucun site réellement fabriqué');
ok(verifierPage(resultat.page.html).length === 0, 'la page produite ne porte aucune faute (relue avant publication)');
ok(resultat.publication.publie === true, 'la publication a eu lieu sur le faux Cloudflare');
ok((resultat.publication.extra || []).includes('_worker.js'), 'le worker fait partie du voyage');
ok((resultat.publication.extra || []).includes(`${resultat.page.slug}/index.html`), 'la page d appels fait partie du voyage, sous son slug');

const servWorker = fauxCF.servir('_worker.js');
ok(servWorker.statut === 200, 'le worker se récupère à la racine du projet', String(servWorker.statut));
ok(servWorker.corps?.toString('utf8') === readFileSync(join(RACINE, 'worker', 'appels.js'), 'utf8'),
  'le contenu déployé du worker est bien celui du dépôt');
const servPage = fauxCF.servir('/' + resultat.page.slug + '/');
ok(servPage.statut === 200, 'la page d appels se récupère sous son slug privé', String(servPage.statut));
ok((servPage.entetes['Content-Type'] || '').includes('html'), 'la page d appels est servie en HTML');
ok(servPage.corps?.toString('utf8') === resultat.page.html, 'le contenu servi est bien la page produite');

// --------------------------------------- « 30 sites et la page produits »
console.log('\n30 sites (fixture minimale, comme essai-publication-prospection.mjs) : la page les montre tous');
const IMAGE = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
function fabriquerSiteMini(racine, siren, nom) {
  const d = join(racine, siren);
  mkdirSync(join(d, 'images'), { recursive: true });
  writeFileSync(join(d, 'index.html'),
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${nom}</title></head><body><h1>${nom}</h1><img src="images/facade.webp" alt="Façade"></body></html>`);
  writeFileSync(join(d, 'images', 'facade.webp'), IMAGE);
  return d;
}
const racine30 = temp('sites-30');
const registre30 = reg.vide();
const lot30 = [];
let n = 200000001;
for (const m of METIERS3) {
  for (let i = 0; i < 10; i++) {
    const siren = String(n++);
    const slug = (m[0] + String(i).padStart(2, '0') + 'x'.repeat(16)).slice(0, 16);
    const nom = `ARTISAN ${m.toUpperCase()} ${i}`;
    const dossier = fabriquerSiteMini(racine30, siren, nom);
    reg.inscrire(registre30, { siren, nom, commune: 'MARSEILLE', metier: m, note: 90 - i }, { jour: JOUR, slug });
    lot30.push({ siren, nom, commune: 'MARSEILLE', metier: m, note: 90 - i, slug, dossier, pourquoi: [] });
  }
}
ok(new Set(lot30.map((s) => s.slug)).size === 30, 'les trente sites ont trente slugs distincts', String(new Set(lot30.map((s) => s.slug)).size));
ok(reg.valider(registre30).length === 0, 'le registre des trente artisans est valide');

const htmlPage30 = page(registre30, { jour: JOUR, lot: lot30, base: '', api: '/xxx/api/resultat' });
ok(verifierPage(htmlPage30).length === 0, 'la page des trente sites ne porte aucune faute');
ok(lot30.every((s) => htmlPage30.includes(s.nom)), 'les trente noms d artisan apparaissent sur la page');
ok(/Les appels du jour\s*<span class="compte">30<\/span>/.test(htmlPage30), 'la page affiche 30 appels du jour');

const fauxCF30 = fauxCloudflare({ projets: [] });
const clientCF30 = clientCloudflare({ compte: fauxCF30.compte, jeton: fauxCF30.jeton, fetch: fauxCF30.fetch });
const slugAppels30 = 'a'.repeat(16);
const bilan30 = await publier({
  lot: lot30, registre: registre30, jour: JOUR, projet: 'essai-30', client: clientCF30,
  enLigne: join(temp('en-ligne-30'), 'en-ligne.json'),
  extra: [
    { chemin: '_worker.js', contenu: readFileSync(join(RACINE, 'worker', 'appels.js')) },
    { chemin: `${slugAppels30}/index.html`, contenu: htmlPage30 },
  ],
});
ok(bilan30.publie === true, 'les trente sites sont publiés');
ok(bilan30.slugs.length === 30, 'trente slugs en ligne', String(bilan30.slugs.length));
ok(bilan30.extra.length === 2 && bilan30.extra.includes('_worker.js') && bilan30.extra.includes(`${slugAppels30}/index.html`),
  'le bilan nomme le worker et la page d appels parmi les fichiers fixes');
// 30 pages distinctes + 1 image partagée par les trente + le worker + la page
// d appels + robots.txt : l image commune ne doit compter qu une fois.
ok(fauxCF30.magasin.size === 34, 'trente-quatre contenus distincts montés : l image partagée par les trente sites ne compte qu une fois',
  String(fauxCF30.magasin.size));

const servPage30 = fauxCF30.servir('/' + slugAppels30 + '/');
ok(servPage30.statut === 200 && servPage30.corps?.toString('utf8') === htmlPage30, 'la page des trente sites se récupère sous son slug');
ok(fauxCF30.servir('_worker.js').statut === 200, 'le worker se récupère aussi dans ce second dépôt');
ok(fauxCF30.servir('/' + lot30[0].slug + '/').statut === 200, 'un site du lot se récupère sous son slug');

console.log(`\n${controles} contrôles, ${fautes} faute(s).`);

// --------------------------------------------------------------- contre-essai
const CASSURES = [
  { nom: 'un slug déjà tiré n est plus relu (toujours un nouveau)',
    de: "if (existsSync(fichier)) {", a: 'if (false) {',
    attendu: /relit le même slug/ },
  { nom: 'le worker n est plus envoyé avec le dépôt',
    de: "if (existsSync(worker)) extra.push({ chemin: '_worker.js', contenu: readFileSync(worker) });",
    a: "if (false) extra.push({ chemin: '_worker.js', contenu: readFileSync(worker) });",
    attendu: /worker fait partie du voyage|le worker se récupère/ },
  { nom: 'la recherche web n est plus transmise à la qualification',
    de: 'parMetier[m] = qualifier(d.entreprises, { registre: reg, sites }).retenus;',
    a: 'parMetier[m] = qualifier(d.entreprises, { registre: reg }).retenus;',
    attendu: /n est jamais dans le lot/ },
];

if (process.argv.includes('--contre-essai')) {
  console.log('\nContre-essai : chaque cassure doit faire rougir cet essai');
  let ratees = 0;
  const source = readFileSync(join(RACINE, 'scripts', 'prospection', 'preparer-appels.mjs'), 'utf8');
  for (const c of CASSURES) {
    if (!source.includes(c.de)) { ratees++; console.log(`RATÉ  ${c.nom}\n        le texte visé n existe plus : la cassure ne prouve rien`); continue; }
    const d = temp('casse');
    cpSync(join(RACINE, 'scripts'), join(d, 'scripts'), { recursive: true });
    cpSync(join(RACINE, 'prospection'), join(d, 'prospection'), { recursive: true });
    cpSync(join(RACINE, 'worker'), join(d, 'worker'), { recursive: true });
    cpSync(join(RACINE, 'generateur'), join(d, 'generateur'), { recursive: true });
    for (const f of ['package.json', 'package-lock.json']) if (existsSync(join(RACINE, f))) cpSync(join(RACINE, f), join(d, f));
    if (existsSync(join(RACINE, 'node_modules'))) {
      try { cpSync(join(RACINE, 'node_modules'), join(d, 'node_modules'), { recursive: true, dereference: false }); } catch { /* lien suffisant */ }
    }
    const cible = join(d, 'scripts', 'prospection', 'preparer-appels.mjs');
    writeFileSync(cible, readFileSync(cible, 'utf8').replace(c.de, c.a));
    const r = spawnSync(process.execPath, [join(d, 'scripts', 'essai-preparer-appels.mjs')],
      { cwd: d, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const sortie = (r.stdout || '') + (r.stderr || '');
    const attrapee = r.status === 1 && c.attendu.test(sortie);
    const ligne = sortie.split('\n').filter((l) => l.includes('FAUTE')).slice(0, 1)[0] || sortie.trim().split('\n').slice(-1)[0];
    if (!attrapee) ratees++;
    console.log(`${attrapee ? 'ok   ' : 'RATÉ '} ${c.nom}\n        sortie ${r.status} : ${ligne.trim().slice(0, 150)}`);
    rmSync(d, { recursive: true, force: true });
  }
  console.log(`\n${CASSURES.length} cassure(s) posée(s) une par une, ${ratees} non attrapée(s).`);
  console.log(ratees ? 'CONTRE-ESSAI RATÉ : une copie cassée passe.' : 'Contre-essai réussi : chaque copie cassée est attrapée.');
  process.exit(ratees ? 1 : 0);
}

process.exit(fautes ? 1 : 0);

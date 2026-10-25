#!/usr/bin/env node
// Essai de la fabrication du lot du jour (`scripts/prospection/fabriquer-lot.mjs`).
//
// Deux moitiés, parce que les images ne sont pas dans Git (décision de
// Fabrice : pas de Git LFS) :
//
//   node scripts/essai-lot.mjs              ce qui ne demande aucune image :
//                                           le lot se construit sans réseau, un
//                                           métier sans images est sauté avec
//                                           son message, les données du
//                                           générateur n'inventent rien, les
//                                           slugs ne se répètent pas, le
//                                           registre refuse un numéro de
//                                           téléphone ;
//   node scripts/essai-lot.mjs --complet    + la fabrication réelle de deux
//                                           sites de ravalement, leurs
//                                           contrôles et leur registre. Demande
//                                           `images/ravalement/sources`.
//   node scripts/essai-lot.mjs --contre-essai
//                                           trois cassures posées une par une
//                                           dans une copie du module, hors du
//                                           dépôt ; chacune doit être attrapée.
//
// Le lot d'essai est construit avec les 693 entreprises RÉELLES enregistrées
// une fois dans `prospection/essais/recherche-entreprises.json`, servies par
// `scripts/faux-recherche-entreprises.mjs` : aucun appel réseau.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { RACINE } from './env.mjs';
import { fauxRecherche } from './faux-recherche-entreprises.mjs';
import * as ex from './prospection/extraire.mjs';
import { qualifier, lot as prendreLot } from './prospection/qualifier.mjs';
import * as reg from './prospection/registre.mjs';
import { fabriquerLot, donneesSirene, slug, imagesPretes, jourDeParis } from './prospection/fabriquer-lot.mjs';

const COMPLET = process.argv.includes('--complet');
const AUJOURDHUI = new Date('2026-10-24T12:00:00Z');
const JOUR = '2026-10-24';
const POPULATION = JSON.parse(readFileSync(join(RACINE, 'prospection', 'essais', 'recherche-entreprises.json'), 'utf8')).entreprises;
const FICHE = ex.metiers();
const IMAGES_RAVALEMENT = join(RACINE, 'images', 'ravalement', 'sources');

let controles = 0, fautes = 0, nonEssayes = 0;
function ok(condition, nom, detail = '') {
  controles++;
  if (condition) return true;
  fautes++;
  console.log(`  FAUTE ${nom}${detail ? ` — ${detail}` : ''}`);
  return false;
}
// Les dossiers d'essai se rangent après le passage : sans cela, chaque
// lancement laissait cinq dossiers derrière lui dans le dossier temporaire
// (soixante après une journée de contre-essais).
const ARANGER = [];
const temp = (quoi) => {
  const d = join(tmpdir(), `sito-lot-${quoi}-${Math.random().toString(36).slice(2, 10)}`);
  mkdirSync(d, { recursive: true });
  ARANGER.push(d);
  return d;
};
function ranger() {
  for (const d of ARANGER) { try { rmSync(d, { recursive: true, force: true }); } catch { /* déjà parti */ } }
  ARANGER.length = 0;
}
process.on('exit', ranger);

// ------------------------------------------------- le lot, sans réseau
async function construireLot() {
  const parMetier = {};
  for (const m of FICHE.metiers) {
    const { entreprises } = await ex.extraire({ metier: m.nom, fiche: FICHE, pages: 6,
      aujourdhui: AUJOURDHUI, fetch: fauxRecherche(POPULATION) });
    parMetier[m.nom] = qualifier(entreprises, { aujourdhui: AUJOURDHUI }).retenus;
  }
  return prendreLot(parMetier, 10);
}

console.log('Fabrication du lot du jour\n');
const lot = await construireLot();
ok(lot.length > 0, 'le lot d essai se construit sans réseau', `${lot.length} entreprises`);
ok(new Set(lot.map((e) => e.siren)).size === lot.length, 'aucun SIREN deux fois dans le lot');
ok(lot.every((e) => e.metier && e.note >= 0), 'chaque ligne du lot porte son métier et sa note');
console.log(`  ${lot.length} entreprises dans le lot d essai : ${Object.entries(lot.reduce((a, e) => ({ ...a, [e.metier]: (a[e.metier] || 0) + 1 }), {})).map(([m, n]) => `${m} ${n}`).join(', ')}`);

// --------------------------------- les données du générateur n inventent rien
console.log('\nLes données passées au générateur');
const sansAdresse = donneesSirene({ siren: '123456789', nom: 'ESSAI', dateCreation: '2010-01-01', codeApe: '43.34Z', effectif: 'NN', commune: 'Marseille', codePostal: '13001' });
ok(sansAdresse.siege.adresse === null, 'une adresse absente de l extraction reste absente (rien n est inventé)');
ok(sansAdresse.siege.siret === null, 'un SIRET absent reste absent');
ok(sansAdresse.nature_juridique === null, 'une forme juridique absente reste absente');
ok(sansAdresse.nom_complet === 'ESSAI' && sansAdresse.nom_raison_sociale === 'ESSAI', 'le nom est celui de l extraction');
ok(sansAdresse.complements.est_rge === false, 'RGE absent vaut faux, jamais vrai par défaut');
const avec = donneesSirene({ siren: '1', nom: 'A', siret: '12345678900011', adresse: '1 RUE X 13001 MARSEILLE', natureJuridique: '5499', rge: true });
ok(avec.siege.adresse === '1 RUE X 13001 MARSEILLE' && avec.nature_juridique === '5499' && avec.complements.est_rge === true,
  'ce que l extraction donne arrive tel quel au générateur');

// ------------------------------------------------------------------ les slugs
console.log('\nLes adresses privées (slugs)');
const slugs = Array.from({ length: 500 }, () => slug());
ok(slugs.every((s) => /^[a-z0-9]{16}$/.test(s)), 'un slug fait 16 caractères, lettres et chiffres');
ok(new Set(slugs).size === 500, '500 slugs tirés, aucun deux fois', `${new Set(slugs).size} distincts`);

// ----------------------------------------- un métier sans images est sauté
console.log('\nUn métier sans images est sauté, avec son message');
const racineVide = temp('images-vides');
const etat = await imagesPretes('couverture', { racine: racineVide });
ok(etat.pretes === false, 'un métier sans aucune image n est pas déclaré prêt');
ok(etat.fautes.length > 0 && /n existe pas/.test(etat.fautes[0]), 'la première faute dit que le dossier n existe pas', etat.fautes[0]);

const dit = [];
const bilanSaute = await fabriquerLot({
  lot: lot.filter((e) => e.metier === 'couverture').slice(0, 3),
  jour: JOUR, sortie: temp('sortie-saute'), images: racineVide,
  registre: join(temp('reg'), 'sites.json'), appels: join(temp('appels'), 'registre.json'),
  mobile: 0, dire: (d) => dit.push(d),
});
const message = dit.join('\n');
ok(bilanSaute.fabriques.length === 0, 'aucun site fabriqué pour un métier sans images');
ok(bilanSaute.sautes.length === 3, 'les trois entreprises du métier sont comptées comme sautées', `${bilanSaute.sautes.length}`);
ok(bilanSaute.echecs.length === 0, 'un métier sauté n est pas un échec : ce qui bloque ne doit pas être bloquant');
ok(/SAUTÉ/.test(message), 'le message dit « SAUTÉ »');
ok(/F18/.test(message), 'le message nomme l action de Fabrice (F18)');
ok(/banque\/prompts\/couverture\.md/.test(message), 'le message nomme la feuille de prompts du métier');
ok(/verifier-images\.mjs couverture/.test(message), 'le message donne la commande qui mesure les images');

// ------------------------- le marqueur d illustration manquant arrête aussi
console.log('\nSans le marqueur SOURCE-ILLUSTRATION, le métier est sauté');
if (existsSync(IMAGES_RAVALEMENT)) {
  const r = temp('images-sans-marqueur');
  cpSync(join(RACINE, 'images', 'ravalement'), join(r, 'ravalement'), { recursive: true });
  rmSync(join(r, 'ravalement', 'sources', 'SOURCE-ILLUSTRATION'), { force: true });
  const e = await imagesPretes('ravalement', { racine: r });
  ok(e.pretes === false, 'des images sans marqueur ne sont pas prêtes pour la prospection');
  ok(e.fautes.some((f) => /SOURCE-ILLUSTRATION/.test(f)), 'la faute nomme le marqueur manquant', e.fautes[0]);
  const avecMarqueur = await imagesPretes('ravalement', { racine: join(RACINE, 'images') });
  ok(avecMarqueur.pretes === true, 'les images du ravalement, marqueur compris, sont prêtes', avecMarqueur.fautes[0] || '');
  rmSync(r, { recursive: true, force: true });
} else {
  nonEssayes++;
  console.log('  NON ESSAYÉ : le marqueur (images/ravalement/sources absent, hors de Git)');
}

// ----------------------------------- le registre refuse un numéro de téléphone
console.log('\nLe registre des artisans refuse un numéro de téléphone');
const dossierAppels = temp('appels-refus');
const fichierAppels = join(dossierAppels, 'registre.json');
const registre = reg.vide();
reg.inscrire(registre, { siren: '480423623', nom: 'ESSAI 06 12 34 56 78', metier: 'ravalement', commune: 'Marseille', note: 70 }, { jour: JOUR, slug: slug() });
ok(reg.valider(registre).length > 0, 'un numéro dans le nom est refusé par le registre');
ok(!existsSync(fichierAppels), 'un registre refusé n est pas écrit sur le disque');

// --------------------------------------------- la fabrication réelle (--complet)
if (COMPLET && existsSync(IMAGES_RAVALEMENT)) {
  console.log('\nFabrication réelle de deux sites de ravalement');
  const sortie = temp('sortie-reelle');
  const appels = join(temp('appels-reels'), 'registre.json');
  const registreSites = join(temp('reg-sites'), 'sites.json');
  const deux = lot.filter((e) => e.metier === 'ravalement').slice(0, 2);
  const bilan = await fabriquerLot({ lot: deux, jour: JOUR, sortie, images: join(RACINE, 'images'),
    registre: registreSites, appels, mobile: 0, dire: (d) => console.log('   ' + d) });

  ok(bilan.fabriques.length === 2, 'les deux sites sont fabriqués', `${bilan.fabriques.length}`);
  ok(bilan.echecs.length === 0, 'aucun échec', bilan.echecs.map((x) => x.motif).join(', '));
  ok(bilan.unicite === true, 'les deux sites passent le contrôle d unicité');
  for (const f of bilan.fabriques) {
    const page = join(f.dossier, 'index.html');
    ok(existsSync(page), `${f.siren} : la page est écrite`);
    const html = existsSync(page) ? readFileSync(page, 'utf8') : '';
    ok(/images d’illustration/.test(html), `${f.siren} : la page porte la mention « images d’illustration »`);
    ok(/<meta name="atelier-images" content="illustration">/.test(html), `${f.siren} : l en-tête dit que les photos sont des illustrations`);
    ok(html.includes(f.siren), `${f.siren} : la page porte le SIREN de l entreprise`);
    ok(existsSync(join(f.dossier, 'donnees.json')), `${f.siren} : la fiche du site est écrite (lue par le contrôle d unicité)`);
    ok(/^[a-z0-9]{16}$/.test(f.slug), `${f.siren} : son slug fait 16 caractères`);
  }
  ok(new Set(bilan.fabriques.map((f) => f.slug)).size === 2, 'deux sites, deux slugs différents');

  const relu = reg.lire(appels);
  ok(Object.keys(relu.fiches).length === 2, 'les deux artisans sont inscrits au registre', `${Object.keys(relu.fiches).length}`);
  ok(reg.valider(relu).length === 0, 'le registre écrit est valide (aucun numéro de téléphone)');
  const premier = relu.fiches[bilan.fabriques[0].siren];
  ok(premier && premier.site_le === JOUR, 'la fiche porte le jour du site');
  ok(premier && premier.statut === 'a-appeler', 'la fiche part au statut « a-appeler »', premier?.statut);
  ok(premier && premier.slug === bilan.fabriques[0].slug, 'la fiche porte le slug du site');
  ok(!JSON.stringify(relu).includes('telephone'), 'le registre ne porte aucun champ de téléphone');

  const lotJson = JSON.parse(readFileSync(join(sortie, 'lot.json'), 'utf8'));
  ok(lotJson.sites.length === 2, 'le lot écrit sur le disque liste les deux sites');
  ok(lotJson.sites.every((s) => s.slug && s.dossier && s.metier === 'ravalement'), 'chaque ligne du lot porte son slug, son dossier et son métier');
  ok(lotJson.jour === JOUR, 'le lot porte le jour');

  // Deux sites voisins du même métier dans la même ville ne doivent pas se
  // ressembler : c'est tout l'objet du registre d'unicité, séparé de celui de
  // la démonstration.
  const fiches = bilan.fabriques.map((f) => JSON.parse(readFileSync(join(f.dossier, 'donnees.json'), 'utf8')));
  ok(fiches[0].titre !== fiches[1].titre, 'les deux sites n ont pas le même titre');
  ok(JSON.stringify(fiches[0].photos) !== JSON.stringify(fiches[1].photos), 'les deux sites ne montrent pas les mêmes photos');
  ok(existsSync(registreSites), 'le registre d unicité des sites de prospection est écrit');
  ok(!readFileSync(join(RACINE, 'generateur', 'registre.json'), 'utf8').includes(bilan.fabriques[0].siren + '"'),
    'le registre de la démonstration n a pas été touché');

  rmSync(sortie, { recursive: true, force: true });
} else if (COMPLET) {
  nonEssayes++;
  console.log('\nNON ESSAYÉ : la fabrication réelle demande images/ravalement/sources (hors de Git).');
}

// --------------------------------------------------------------- contre-essai
// Trois cassures, une par une, dans une copie du module hors du dépôt. Une
// cassure qui ne change rien au texte est refusée : elle ne prouverait rien.
const CASSURES = [
  { nom: 'le marqueur SOURCE-ILLUSTRATION n est plus exigé',
    de: "!existsSync(join(sources, 'SOURCE-ILLUSTRATION'))", a: 'false',
    attendu: /marqueur manquant|sans marqueur/ },
  { nom: 'le slug devient devinable (toujours le même)',
    de: "return randomBytes(longueur).toString('base64url')", a: "return 'a'.repeat(longueur) + ('')",
    attendu: /aucun deux fois|slugs différents/ },
  { nom: 'un métier sans images est fabriqué quand même',
    de: 'if (!etat.pretes) {', a: 'if (false) {',
    attendu: /SAUTÉ|sautées|aucun site fabriqué/ },
];

if (process.argv.includes('--contre-essai')) {
  console.log('\nContre-essai : chaque cassure doit faire rougir cet essai');
  let ratees = 0;
  const source = readFileSync(join(RACINE, 'scripts', 'prospection', 'fabriquer-lot.mjs'), 'utf8');
  for (const c of CASSURES) {
    if (!source.includes(c.de)) { ratees++; console.log(`RATÉ  ${c.nom}\n        le texte visé n existe plus dans fabriquer-lot.mjs : la cassure ne prouve rien`); continue; }
    const d = temp('casse');
    cpSync(join(RACINE, 'scripts'), join(d, 'scripts'), { recursive: true });
    cpSync(join(RACINE, 'generateur'), join(d, 'generateur'), { recursive: true });
    cpSync(join(RACINE, 'prospection'), join(d, 'prospection'), { recursive: true });
    for (const f of ['package.json', 'package-lock.json']) if (existsSync(join(RACINE, f))) cpSync(join(RACINE, f), join(d, f));
    if (existsSync(join(RACINE, 'node_modules'))) {
      try { cpSync(join(RACINE, 'node_modules'), join(d, 'node_modules'), { recursive: true, dereference: false }); } catch { /* lien suffisant */ }
    }
    if (existsSync(join(RACINE, 'images'))) cpSync(join(RACINE, 'images'), join(d, 'images'), { recursive: true });
    const cible = join(d, 'scripts', 'prospection', 'fabriquer-lot.mjs');
    writeFileSync(cible, readFileSync(cible, 'utf8').replace(c.de, c.a));
    const r = spawnSync(process.execPath, [join(d, 'scripts', 'essai-lot.mjs'), ...(COMPLET ? ['--complet'] : [])],
      { cwd: d, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const sortie = (r.stdout || '') + (r.stderr || '');
    const attrapee = r.status === 1 && c.attendu.test(sortie);
    if (!attrapee) ratees++;
    const ligne = sortie.split('\n').filter((l) => l.includes('FAUTE')).slice(0, 1)[0] || sortie.trim().split('\n').slice(-1)[0];
    console.log(`${attrapee ? 'ok   ' : 'RATÉ '} ${c.nom}\n        sortie ${r.status} : ${ligne.trim().slice(0, 150)}`);
    rmSync(d, { recursive: true, force: true });
  }
  console.log(`\n${CASSURES.length} cassure(s) posée(s) une par une, ${ratees} non attrapée(s).`);
  console.log(ratees ? 'CONTRE-ESSAI RATÉ : une copie cassée passe.' : 'Contre-essai réussi : chaque copie cassée est attrapée.');
  process.exit(ratees ? 1 : 0);
}

console.log(`\n${controles} contrôles, ${fautes} faute(s)${nonEssayes ? `, ${nonEssayes} partie(s) NON ESSAYÉE(S) (images hors de Git)` : ''}.`);
if (!COMPLET) console.log('La fabrication réelle de deux sites s essaie avec --complet (demande les images du ravalement).');
process.exit(fautes ? 1 : 0);

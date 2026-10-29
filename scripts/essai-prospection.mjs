#!/usr/bin/env node
// Essai de la chaîne de prospection : `scripts/prospection/extraire.mjs`,
// `qualifier.mjs` et `registre.mjs`.
//
// Il tourne **sans réseau**. Les entreprises sont réelles (décision de Fabrice
// du 24 octobre : « Je veux des artisans réels ») mais prélevées une fois dans
// `recherche-entreprises.api.gouv.fr` et rangées dans
// `prospection/essais/recherche-entreprises.json` ; le faux serveur de
// `scripts/faux-recherche-entreprises.mjs` les sert avec la sémantique
// mesurée de la vraie API, pièges compris.
//
// Ce qu'il mesure, jamais ce que le code dit de lui-même :
//   - l'adresse réellement envoyée (paramètres, plafonds refusés avant tout
//     appel) ;
//   - chaque entreprise retenue, relue une par une : siège dans le
//     département, active, assez ancienne, effectif dans la cible, code APE du
//     métier, et aucun mot d'un autre métier dans sa raison sociale ;
//   - que le garde-fou du paramètre ignoré **refuse** de travailler avec une
//     API qui ne filtre pas ;
//   - la note : bornée à 100, toujours accompagnée de ses raisons, et le même
//     ordre deux fois de suite ;
//   - le registre : aucun numéro de téléphone ne peut y entrer, « ne plus
//     appeler » est définitif, et un refus n'écrit rien.
//
// La date du jour est **figée** au 24 octobre 2026 : l'âge des entreprises de
// la population ne doit pas changer les résultats de l'essai avec le temps.
//
//   node scripts/essai-prospection.mjs [dossier des modules]
//   node scripts/essai-prospection.mjs --contre-essai
//     les fautes posées une par une, dans des copies hors du dépôt ; l'essai
//     entier est rejoué sur chacune et doit rougir à chaque fois.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { RACINE } from './env.mjs';
import { fauxRecherche } from './faux-recherche-entreprises.mjs';

const CONTRE = process.argv.includes('--contre-essai');
const MODULES = join(RACINE, 'scripts', 'prospection');
const AUJOURDHUI = new Date('2026-10-24T12:00:00Z');
const JOUR = '2026-10-24';

// ------------------------------------------- les copies cassées du contre-essai
// Une faute à la fois, dans sa copie hors du dépôt, l'essai entier rejoué
// dessus. Une faute qui ne rougit pas seule n'est pas gardée ici ; une faute
// qui fait planter l'essai au lieu d'être mesurée ne compte pas non plus.
const CASSURES = [
  { fichier: 'extraire.mjs', nom: 'le nom du paramètre de département est faux (le piège de la spec)',
    de: "p.set('departement', departement);", a: "p.set('departement_siege', departement);" },
  { fichier: 'extraire.mjs', nom: 'on fait confiance à l API pour le département du siège',
    de: "  if (siege.departement !== departement) return non(", a: "  if (false) return non(" },
  { fichier: 'extraire.mjs', nom: 'les entreprises de moins de deux ans ne sont plus écartées',
    de: "  if (annees < ancienneteMin) return non(", a: "  if (false) return non(" },
  { fichier: 'extraire.mjs', nom: 'les mots du métier sont cherchés par morceaux (« ite » dans ETANCHEITE)',
    de: "const contient = (nom, mots) => mots.find((m) => motif(m).test(nom));",
    a: "const contient = (nom, mots) => mots.find((m) => nom.includes(normaliser(m)));" },
  { fichier: 'extraire.mjs', nom: 'les pluriels ne répondent plus (CHARPENTES ne dit plus charpente)',
    de: "const motif = (m) => new RegExp(`(?:^| )${normaliser(m)}s?(?: |$)`);",
    a: "const motif = (m) => new RegExp(`(?:^| )${normaliser(m)}(?: |$)`);" },
  { fichier: 'qualifier.mjs', nom: 'un site récent fait par un prestataire rapporte des points au lieu d écarter',
    de: "'recent-prestataire': { points: 0, ecarte:", a: "'recent-prestataire': { points: 22, dit: 'un site récent', pasEcarte:" },
  { fichier: 'extraire.mjs', nom: 'un mot d un métier voisin (maçonnerie, isolation, cheminée) ne compte plus',
    de: "  if (autre) return { metier: false, mot: autre };", a: "  if (false) return { metier: false, mot: autre };" },
  { fichier: 'qualifier.mjs', nom: 'un nom muet du ravalement entre au lot sans preuve du web',
    de: "    if (exigerPreuve && e.preuveExigee && web.metier !== 'oui') {", a: "    if (false) {" },
  { fichier: 'qualifier.mjs', nom: 'un « non » du web sur le métier est ignoré',
    de: "    if (web.metier === 'non') {", a: "    if (false) {" },
  { fichier: 'noms.mjs', nom: 'le nom reprend nom_complet, parenthèse et forme juridique comprises',
    de: "  return sansForme(choisi) || sansForme(raison) || complet;", a: "  return complet;" },
  { fichier: 'noms.mjs', nom: 'la commune n est plus lue dans la table officielle',
    de: "  if (parCode) return parCode.nom;", a: "  if (false) return parCode.nom;" },
  { fichier: 'registre.mjs', nom: 'le registre accepte un numéro de téléphone',
    de: '  if (trouve) fautes.push(', a: '  if (false) fautes.push(' },
];

function copieCassee(c) {
  const d = mkdtempSync(join(tmpdir(), 'sito-prospection-casse-'));
  mkdirSync(join(d, 'prospection'), { recursive: true });
  const envUrl = JSON.stringify(pathToFileURL(join(RACINE, 'scripts', 'env.mjs')).href);
  let casse = false;
  for (const nom of ['extraire.mjs', 'qualifier.mjs', 'registre.mjs', 'noms.mjs']) {
    let src = readFileSync(join(MODULES, nom), 'utf8');
    if (nom === c.fichier) {
      const avant = src;
      src = src.replace(c.de, c.a);
      casse = src !== avant;
    }
    // L'import de `scripts/env.mjs` est repointé sur le vrai, hors du dépôt
    // `RACINE` serait le dossier temporaire. En motif, pas en texte, pour que
    // `verifier-depot` ne croie pas que cet essai importe un module voisin.
    src = src.replace(/from '\.\.\/env\.mjs'/, `from ${envUrl}`);
    writeFileSync(join(d, 'prospection', nom), src);
  }
  if (!casse) { console.error(`la cassure « ${c.nom} » n a rien changé dans ${c.fichier} : le module a changé de forme.`); process.exit(2); }
  return d;
}

if (CONTRE) {
  let ratees = 0;
  for (const c of CASSURES) {
    const d = copieCassee(c);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), join(d, 'prospection')],
      { encoding: 'utf8', cwd: RACINE, maxBuffer: 64 * 1024 * 1024 });
    const sortie = (r.stdout || '') + (r.stderr || '');
    const bilan = sortie.match(/(\d+) contrôles, (\d+) faute/);
    const fautes = bilan ? Number(bilan[2]) : 0;
    const plante = /essai interrompu/.test(sortie);
    const attrapee = r.status === 1 && fautes > 0 && !plante;
    if (!attrapee) ratees++;
    console.log(`${attrapee ? 'ok   ' : 'RATÉ '} ${c.fichier} : ${c.nom}\n        ${fautes} faute(s), sortie ${r.status}${plante ? ', essai interrompu : la cassure fait planter au lieu d être mesurée' : ''}`);
    if (attrapee) console.log(sortie.split('\n').filter((l) => l.includes('FAUTE')).slice(0, 2).map((l) => '       ' + l.trim()).join('\n'));
    rmSync(d, { recursive: true, force: true });
  }
  console.log(`\n${CASSURES.length} cassure(s) posée(s) une par une, ${ratees} non attrapée(s).`);
  console.log(ratees ? 'CONTRE-ESSAI RATÉ : une copie cassée passe.' : 'Contre-essai réussi : chaque copie cassée est attrapée.');
  process.exit(ratees ? 1 : 0);
}

// ------------------------------------------------------------- les modules essayés
const DOSSIER = resolve(process.argv.find((a, i) => i >= 2 && !a.startsWith('--')) || MODULES);
const ex = await import(pathToFileURL(join(DOSSIER, 'extraire.mjs')).href);
const qu = await import(pathToFileURL(join(DOSSIER, 'qualifier.mjs')).href);
const re = await import(pathToFileURL(join(DOSSIER, 'registre.mjs')).href);

const FICHE = JSON.parse(readFileSync(join(RACINE, 'prospection', 'metiers.json'), 'utf8'));
const CORPUS = JSON.parse(readFileSync(join(RACINE, 'prospection', 'essais', 'recherche-entreprises.json'), 'utf8'));
const POPULATION = CORPUS.entreprises;

let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const leve = async (f) => { try { await f(); return null; } catch (e) { return e; } };
const parSiren = new Map(POPULATION.map((e) => [e.siren, e]));

try {
  // --------------------------------------------------------------- la population
  console.log('\nLa population d essai (entreprises réelles, prélevées une fois)');
  ok(POPULATION.length > 300, `${POPULATION.length} entreprises enregistrées`, String(POPULATION.length));
  ok(/^\d{4}-\d{2}-\d{2}$/.test(CORPUS.prelevee_le || ''), 'la population dit quand elle a été prélevée', String(CORPUS.prelevee_le));
  ok(!/(?:\+33|\b0)\s*[1-9](?:[\s.\-]*\d{2}){4}\b/.test(JSON.stringify(POPULATION)), 'aucun numéro de téléphone dans la population');
  const dedans = (f) => POPULATION.filter(f).length;
  ok(dedans((e) => e.siege.departement === '13') > 100
     && dedans((e) => e.siege.departement !== '13' && e.departements_etablissements.includes('13')) > 10
     && dedans((e) => !['NN', '00', '01', '02', '03'].includes(e.tranche_effectif_salarie)) > 10
     && dedans((e) => e.date_creation > '2024-10-24') > 10
     && dedans((e) => e.complements.est_rge) > 10,
    'elle contient de quoi faire travailler chaque filtre (hors département, trop grande, trop jeune, RGE)',
    `13:${dedans((e) => e.siege.departement === '13')} hors-13-avec-étab:${dedans((e) => e.siege.departement !== '13' && e.departements_etablissements.includes('13'))} grosses:${dedans((e) => !['NN', '00', '01', '02', '03'].includes(e.tranche_effectif_salarie))} jeunes:${dedans((e) => e.date_creation > '2024-10-24')} RGE:${dedans((e) => e.complements.est_rge)}`);

  // -------------------------------------------------------------------- l'adresse
  console.log('\nL adresse envoyée à l API');
  const url = new URL(ex.adresse({ codeApe: '43.34Z', departement: '13', page: 2, perPage: 25 }));
  const p = url.searchParams;
  ok(url.origin + url.pathname === ex.API, 'l adresse pointe sur recherche-entreprises', url.origin + url.pathname);
  ok(p.get('activite_principale') === '43.34Z', 'le code APE part sous sa forme pointée (43.34Z, pas 4334Z)', String(p.get('activite_principale')));
  ok(p.get('departement') === '13', 'le département part sous le nom « departement »', [...p.keys()].join(','));
  ok(p.get('etat_administratif') === 'A', 'seules les entreprises actives sont demandées', String(p.get('etat_administratif')));
  ok(p.get('tranche_effectif_salarie') === 'NN,00,01,02,03', 'l effectif non renseigné (NN) est demandé avec les petits', String(p.get('tranche_effectif_salarie')));
  for (const [quoi, args] of [
    ['un code APE sans point est refusé avant tout appel', { codeApe: '4334Z', departement: '13' }],
    ['un département fantaisiste est refusé', { codeApe: '43.34Z', departement: 'Bouches-du-Rhône' }],
    ['per_page au-delà de 25 est refusé (plafond de l API)', { codeApe: '43.34Z', departement: '13', perPage: 26 }],
    ['page × per_page au-delà de 10 000 est refusé', { codeApe: '43.34Z', departement: '13', page: 401, perPage: 25 }],
  ]) {
    const e = await leve(() => ex.adresse(args));
    ok(e instanceof Error, quoi, e ? e.message.slice(0, 80) : 'aucune erreur levée');
  }

  // ------------------------------------------- le faux serveur est fidèle au vrai
  console.log('\nLe faux serveur reproduit ce que la vraie API fait (mesuré le 24 oct.)');
  const faux = fauxRecherche(POPULATION);
  const total = async (u) => (await faux(u)).json().then((j) => j.total_results);
  const avecDep = await total(ex.adresse({ codeApe: '43.34Z', departement: '13' }));
  const malEcrit = await total(`${ex.API}?activite_principale=43.34Z&etat_administratif=A&departement_siege=13&per_page=1`);
  ok(avecDep < malEcrit, 'un nom de paramètre inconnu est ignoré en silence : le nombre de résultats ne bouge pas', `${avecDep} avec « departement », ${malEcrit} avec « departement_siege »`);
  const horsDep = POPULATION.find((e) => e.siege.departement !== '13' && e.departements_etablissements.includes('13'));
  const page13 = await (await faux(`${ex.API}?departement=13&per_page=25&page=1`)).json();
  ok(Boolean(horsDep), 'la population a une entreprise au siège hors du 13 avec un établissement dedans', horsDep?.siren);
  ok((await (await faux(`${ex.API}?per_page=26`)).json()).erreur?.includes('per_page'), 'per_page au-delà de 25 : HTTP 400, comme le vrai');
  ok((await faux(`${ex.API}?activite_principale=4334Z&per_page=1`)).status === 400, 'activite_principale sans point : HTTP 400, comme le vrai');
  ok(page13.results.every((e) => e.departements_etablissements.includes('13')), 'departement=13 garde tout établissement du 13, siège ailleurs compris');

  // -------------------------------------------------------------------- extraire
  console.log('\nL extraction, relue entreprise par entreprise');
  // Une extraction refusée ne doit pas arrêter l'essai : elle doit faire
  // rougir son contrôle et nommer la raison (leçon du 24 octobre).
  const lots = {};
  for (const m of FICHE.metiers) {
    try {
      lots[m.nom] = await ex.extraire({ metier: m.nom, fiche: FICHE, pages: 6, aujourdhui: AUJOURDHUI, fetch: fauxRecherche(POPULATION) });
    } catch (e) {
      lots[m.nom] = { entreprises: [], bilan: null, erreur: e };
    }
  }
  for (const m of FICHE.metiers) {
    const { entreprises, bilan, erreur } = lots[m.nom];
    const nom = m.nom.padEnd(11);
    if (!ok(!erreur, `${nom} : l extraction aboutit`, erreur?.message?.slice(0, 150))) continue;
    ok(entreprises.length > 0, `${nom} : des entreprises retenues`, `${entreprises.length} sur ${bilan.lus} lues`);
    const mauvais = [];
    for (const e of entreprises) {
      const brut = parSiren.get(e.siren);
      if (!brut) { mauvais.push(`${e.siren} n est pas dans la population`); continue; }
      if (brut.siege.departement !== '13') mauvais.push(`${e.siren} siège en ${brut.siege.departement}`);
      if (brut.etat_administratif !== 'A') mauvais.push(`${e.siren} fermée`);
      if (!['NN', '00', '01', '02', '03'].includes(brut.tranche_effectif_salarie)) mauvais.push(`${e.siren} effectif ${brut.tranche_effectif_salarie}`);
      if (brut.date_creation > '2024-10-24') mauvais.push(`${e.siren} créée le ${brut.date_creation}`);
      if (!m.codesApe.includes(brut.activite_principale)) mauvais.push(`${e.siren} APE ${brut.activite_principale}`);
      const n = ex.normaliser(e.nom);
      const exclu = (m.motsExclus || []).find((x) => ` ${n} `.includes(` ${ex.normaliser(x)} `));
      if (exclu) mauvais.push(`${e.siren} « ${e.nom} » porte le mot « ${exclu} »`);
      if (e.annees < 2) mauvais.push(`${e.siren} ${e.annees} ans`);
    }
    ok(mauvais.length === 0, `${nom} : chaque retenue passe tous les filtres, relus sur la population`, mauvais.slice(0, 3).join(' ; '));
    ok(new Set(entreprises.map((e) => e.siren)).size === entreprises.length, `${nom} : aucun SIREN deux fois`);
    const somme = bilan.retenus + bilan.doublons + Object.values(bilan.ecartes).reduce((a, v) => a + v.combien, 0);
    ok(somme === bilan.lus, `${nom} : le compte est juste (lues = retenues + doublons + écartées)`, `${bilan.lus} lues, ${somme} comptées`);
    // Le motif est une catégorie, pas une phrase par entreprise : un bilan où
    // chaque écartée aurait son propre motif ne se lirait pas.
    ok(Object.keys(bilan.ecartes).length > 0 && Object.keys(bilan.ecartes).length <= 8,
      `${nom} : les écartées sont rangées en quelques motifs, avec des exemples`,
      Object.entries(bilan.ecartes).map(([k, v]) => `${k} : ${v.combien}`).join(' | '));
    ok(Object.values(bilan.ecartes).every((v) => v.exemples.length > 0 && v.exemples.length <= 3),
      `${nom} : chaque motif porte un à trois exemples, pas la liste entière`);
  }
  const toutes = Object.values(lots).flatMap((l) => l.entreprises);
  ok(!toutes.some((e) => e.siren === horsDep.siren), `le siège hors du 13 est écarté malgré son établissement marseillais (${horsDep.siren})`, horsDep.nom_complet);
  const miroitier = POPULATION.find((e) => /MIROITERIE/i.test(e.nom_complet || '') && e.siege.departement === '13');
  ok(miroitier && !toutes.some((e) => e.siren === miroitier.siren), `un miroitier en 43.34Z n est ni peintre ni ravaleur (${miroitier?.siren})`, miroitier?.nom_complet);
  const ravaleur = lots.ravalement.entreprises.find((e) => /FACADES?/i.test(e.nom));
  ok(ravaleur?.nomDitLeMetier === true, 'un nom qui dit le métier est signalé comme tel', `${ravaleur?.nom} → ${ravaleur?.nomDitLeMetier}`);

  // La règle du mot : entier, pluriel compris. Les quatre noms ci-dessous sont
  // de vraies raisons sociales de la population, et chacun épingle la règle
  // d'un côté : par morceaux « ite » attraperait ATS ETANCHEITE, et en mot
  // strictement entier « charpente » raterait CHARPENTES et « couverture »
  // raterait COUVERTURES — qui serait alors appelée comme peintre.
  for (const [nom, metierNom, attendu, pourquoi] of [
    ['ATS ETANCHEITE', 'ravalement', null, '« ite » n est pas un mot de ATS ETANCHEITE (pas de recherche par morceaux)'],
    ['SOCIETE MURPROTEC', 'ravalement', null, 'un nom qui ne dit aucun métier ne rapporte rien'],
    ['SARL MIDI CHARPENTES', 'couverture', true, 'un pluriel dit le métier : CHARPENTES répond à charpente'],
    ['LES COUVERTURES LOPEZ', 'peinture', false, 'un pluriel exclut aussi : LES COUVERTURES LOPEZ n est pas peintre'],
  ]) {
    const r = ex.nomDitLeMetier(nom, ex.metier(metierNom, FICHE));
    ok(r.metier === attendu, `${pourquoi}`, `${nom} → ${JSON.stringify(r)}`);
  }
  ok(Boolean((await leve(() => ex.metier('plombier', FICHE))) instanceof Error), 'un métier inconnu est refusé, pas deviné');

  // -------------------------------------------------- le garde-fou du paramètre ignoré
  console.log('\nLe garde-fou : une API qui ne filtre pas fait refuser l extraction');
  const sourd = fauxRecherche(POPULATION, { ignorer: ['departement'] });
  const refus = await leve(() => ex.extraire({ metier: 'ravalement', fiche: FICHE, pages: 1, aujourdhui: AUJOURDHUI, fetch: sourd }));
  ok(refus instanceof Error && /departement/.test(refus.message), 'un filtre « departement » sans effet arrête tout, avec les deux nombres', refus?.message?.slice(0, 120));
  const sourdEff = fauxRecherche(POPULATION, { ignorer: ['tranche_effectif_salarie'] });
  const refus2 = await leve(() => ex.extraire({ metier: 'ravalement', fiche: FICHE, pages: 1, aujourdhui: AUJOURDHUI, fetch: sourdEff }));
  ok(refus2 instanceof Error && /effectif/.test(refus2.message), 'un filtre d effectif sans effet arrête tout aussi', refus2?.message?.slice(0, 120));
  const v = await ex.verifierFiltres({ codeApe: '43.34Z', departement: '13', fetch: fauxRecherche(POPULATION) });
  ok(v.fautes.length === 0 && Object.entries(v.mesures).every(([, m]) => m.impossible < m.sans),
    'sur une API qui filtre, le contrôle passe : la valeur impossible fait s effondrer le total', JSON.stringify(v));
  // Le signal est une valeur impossible, pas « avec » contre « sans » : un code
  // APE dont toutes les entreprises passent déjà le filtre donnerait deux
  // totaux égaux sans qu aucun paramètre soit ignoré (vu sur 43.99D).
  const serre = await ex.verifierFiltres({ codeApe: '43.99D', departement: '13', fetch: fauxRecherche(POPULATION) });
  ok(serre.fautes.length === 0, 'un code APE où le filtre n écarte rien ne fait pas crier au loup', JSON.stringify(serre.mesures));

  // --------------------------------------------------------------------- la note
  console.log('\nLa note, de 0 à 100, avec ses raisons');
  const parfait = { siren: '000000001', annees: 8, effectif: '01', rge: true, nomDitLeMetier: true };
  const nParfait = qu.noter(parfait, { site: 'aucun' });
  ok(nParfait.note === 100, 'le meilleur profil possible fait exactement 100', String(nParfait.note));
  ok(nParfait.pourquoi.length === 5, 'les cinq raisons sont écrites', nParfait.pourquoi.join(' | '));
  const maigre = qu.noter({ siren: '000000002', annees: 2, effectif: 'NN', rge: false, nomDitLeMetier: false }, {});
  ok(maigre.note === 33 && maigre.pourquoi.length === 3, 'le profil le plus maigre fait 33, et dit pourquoi', `${maigre.note} : ${maigre.pourquoi.join(' | ')}`);
  ok(qu.noter(parfait, { site: 'recent-prestataire' }).ecarte?.includes('prestataire'), 'un site récent fait par un prestataire écarte, quel que soit le reste', JSON.stringify(qu.noter(parfait, { site: 'recent-prestataire' })));
  ok((await leve(() => qu.noter(parfait, { site: 'peut-etre' }))) instanceof Error, 'un état de site inventé est refusé, pas noté à zéro en silence');
  const horsBornes = toutes.map((e) => qu.noter(e, {})).filter((n) => n.note < 0 || n.note > qu.NOTE_MAX);
  ok(horsBornes.length === 0, `aucune note hors de 0 à ${qu.NOTE_MAX} sur les ${toutes.length} entreprises extraites`, String(horsBornes.length));
  ok(toutes.every((e) => qu.noter(e, {}).pourquoi.length > 0), 'aucune note sans raison écrite');

  // ------------------------------------------------------------------ qualifier
  console.log('\nLe tri, et ce que le registre interdit');
  const candidats = lots.ravalement.entreprises;
  // Sans candidats, le tri ne s'essaie pas : on le dit, on ne plante pas et on
  // ne saute pas en silence (une extraction cassée a déjà rougi plus haut).
  const assez = ok(FICHE.metiers.every((m) => lots[m.nom].entreprises.length >= 10),
    'chaque métier donne au moins dix candidats, de quoi faire un lot du jour',
    FICHE.metiers.map((m) => `${m.nom}:${lots[m.nom].entreprises.length}`).join(' '));
  if (assez) {
  const registre = { version: 1, fiches: {} };
  const [a, b, c, d] = candidats;
  registre.fiches[a.siren] = { metier: 'ravalement', nom: a.nom, commune: a.commune, site_le: '2026-10-01', slug: 'x', statut: 'ne-plus-appeler', appele_le: '2026-10-01', relance_le: null, note: 50 };
  registre.fiches[b.siren] = { metier: 'ravalement', nom: b.nom, commune: b.commune, site_le: '2026-10-24', slug: 'y', statut: 'pas-de-reponse', appele_le: JOUR, relance_le: null, note: 50 };
  registre.fiches[c.siren] = { metier: 'ravalement', nom: c.nom, commune: c.commune, site_le: '2026-10-20', slug: 'z', statut: 'a-rappeler', appele_le: '2026-10-20', relance_le: '2026-10-30', note: 50 };
  registre.fiches[d.siren] = { metier: 'ravalement', nom: d.nom, commune: d.commune, site_le: '2026-09-01', slug: 'w', statut: 'abonne-annee', appele_le: '2026-09-01', relance_le: null, note: 90 };
  // Ce qui suit essaie le registre et le tri, pas la preuve du métier : la
  // recherche web simulée dit « oui » au métier de chaque nom muet.
  const prouve = (liste) => Object.fromEntries(liste.filter((e) => e.preuveExigee).map((e) => [e.siren, { metier: 'oui' }]));
  const sitesTri = { ...prouve(candidats), [candidats[4].siren]: { site: 'aucun', metier: 'oui' }, [candidats[5].siren]: { site: 'recent-prestataire', metier: 'oui' } };
  const q = qu.qualifier(candidats, { registre, aujourdhui: AUJOURDHUI, sites: sitesTri });
  const motif = (siren) => q.ecartes.find((e) => e.siren === siren)?.motif;
  ok(motif(a.siren)?.includes('ne plus être appelé'), '« ne plus appeler » est définitif', motif(a.siren));
  ok(motif(b.siren)?.includes('aujourd hui'), 'un artisan déjà appelé aujourd hui ne ressort pas', motif(b.siren));
  ok(motif(c.siren)?.includes('2026-10-30'), 'une relance promise plus tard met l artisan de côté jusque-là', motif(c.siren));
  ok(motif(d.siren)?.includes('abonné'), 'un abonné n est plus un prospect', motif(d.siren));
  ok(motif(candidats[5].siren)?.includes('prestataire'), 'le site récent d un prestataire écarte au tri aussi', motif(candidats[5].siren));
  ok(q.retenus.length === candidats.length - 5, 'les cinq écartés manquent, et eux seuls', `${q.retenus.length} retenus sur ${candidats.length}`);
  const trie = q.retenus.every((e, i) => i === 0 || q.retenus[i - 1].note > e.note || (q.retenus[i - 1].note === e.note && q.retenus[i - 1].siren < e.siren));
  ok(trie, 'trié par note décroissante, puis par SIREN : deux préparations donnent la même liste');
  const q2 = qu.qualifier(candidats, { registre, aujourdhui: AUJOURDHUI, sites: sitesTri });
  ok(JSON.stringify(q2.retenus) === JSON.stringify(q.retenus), 'deux passages donnent exactement la même liste');
  ok(q.retenus.find((e) => e.siren === candidats[4].siren)?.pourquoi.some((x) => /aucun site/.test(x)), 'la recherche web se retrouve dans les raisons');

  const parMetier = Object.fromEntries(FICHE.metiers.map((m) => [m.nom, qu.qualifier(lots[m.nom].entreprises, { aujourdhui: AUJOURDHUI, sites: prouve(lots[m.nom].entreprises) }).retenus]));
  const lot = qu.lot(parMetier, 10);
  ok(lot.length === 30, '30 artisans par jour, 10 par métier (décision du 23 octobre)', String(lot.length));
  ok(new Set(lot.map((e) => e.siren)).size === 30, 'aucun SIREN deux fois dans le lot, même quand deux métiers partagent un code APE');
  ok(FICHE.metiers.every((m) => lot.filter((e) => e.metier === m.nom).length === 10), 'dix par métier, exactement', FICHE.metiers.map((m) => `${m.nom}:${lot.filter((e) => e.metier === m.nom).length}`).join(' '));
  }

  // ------------------------------------------- ravalement : façadiers seulement
  // Décision de Fabrice du 29 oct. 2026 : « Ravalement de façade c'est des
  // façadiers ». Les quatre cas du lot du 28 oct., avec leurs vrais noms.
  console.log('\nRavalement : façadiers seulement (décision du 29 octobre)');
  const R = FICHE.metiers.find((m) => m.nom === 'ravalement');
  const fausse = (siren, nom_complet, ape, siege = {}) => ({
    siren, nom_complet, nom_raison_sociale: nom_complet.replace(/\s*\(.*$/, ''), activite_principale: ape,
    date_creation: '2015-03-01', etat_administratif: 'A', tranche_effectif_salarie: '01', complements: { est_rge: false },
    siege: { departement: '13', etat_administratif: 'A', libelle_commune: 'MARSEILLE', code_postal: '13008', commune: '13208', ...siege },
  });
  const communes = (await import(pathToFileURL(join(DOSSIER, 'noms.mjs')).href)).chargerCommunes('13');
  const garde = (e) => ex.retenir(e, { m: R, departement: '13', aujourdhui: AUJOURDHUI, communes });
  for (const [nom, ape] of [['SASU BMAV MACONNERIE (SASU BMAV MACONNERIE)', '43.99C'], ['SMILE ISOL (SMILE ISOL)', '43.29A'],
    ['MISOL ENERGIE', '43.29A'], ['CHEMINEES CONCEPTION', '43.99D']]) {
    const r = garde(fausse('900000001', nom, ape));
    ok(!r.garde && /autre métier/.test(r.motif), `« ${nom} » n entre pas au ravalement`, r.garde ? 'gardé' : r.motif);
  }
  const mixte = garde(fausse('900000002', 'FACADES ET MACONNERIE DU SUD', '43.99C'));
  ok(mixte.garde && mixte.entreprise.nomDitLeMetier && !mixte.entreprise.preuveExigee, 'un nom qui dit la façade reste façadier, même avec « maçonnerie »');
  const muet = garde(fausse('900000003', 'NICOLAS FERMAUD', '43.99C'));
  ok(muet.garde && muet.entreprise.preuveExigee, 'un nom muet est gardé, mais sa preuve est exigée');
  if (muet.garde && mixte.garde) {
    const sansWeb = qu.qualifier([muet.entreprise], { aujourdhui: AUJOURDHUI });
    ok(sansWeb.retenus.length === 0 && /pas prouvé/.test(sansWeb.ecartes[0]?.motif || ''), 'sans recherche web, un nom muet n entre pas au lot', sansWeb.ecartes[0]?.motif);
    const siteSeul = qu.qualifier([muet.entreprise], { aujourdhui: AUJOURDHUI, sites: { 900000003: 'aucun' } });
    ok(siteSeul.retenus.length === 0, 'savoir qu il n a pas de site ne prouve pas son métier');
    const nonWeb = qu.qualifier([mixte.entreprise], { aujourdhui: AUJOURDHUI, sites: { 900000002: { site: 'aucun', metier: 'non', vu: 'site : maçonnerie générale' } } });
    ok(nonWeb.retenus.length === 0 && /maçonnerie générale/.test(nonWeb.ecartes[0]?.motif || ''), 'un « non » du web écarte, avec ce qui a été vu', nonWeb.ecartes[0]?.motif);
    const ouiWeb = qu.qualifier([muet.entreprise], { aujourdhui: AUJOURDHUI, sites: { 900000003: { site: 'annuaire', metier: 'oui', vu: 'fiche : ravalement' } } });
    ok(ouiWeb.retenus.length === 1 && ouiWeb.retenus[0].site === 'annuaire', 'un « oui » du web fait entrer le nom muet, avec l état de son site');
    const avant = qu.qualifier([muet.entreprise], { aujourdhui: AUJOURDHUI, exigerPreuve: false });
    ok(avant.retenus.length === 1, 'la première liste du soir montre le nom muet, pour qu il soit vérifié');
  }
  const sansPreuve = qu.qualifier(lots.ravalement.entreprises, { aujourdhui: AUJOURDHUI }).retenus;
  ok(sansPreuve.length > 0 && sansPreuve.every((e) => e.nomDitLeMetier), 'sur la population réelle, sans web, seuls les noms qui disent la façade restent',
    `${sansPreuve.length} retenus ; muets : ${sansPreuve.filter((e) => !e.nomDitLeMetier).map((e) => e.nom).slice(0, 3).join(', ')}`);

  // ------------------------------------------------------- noms et communes
  console.log('\nLe nom et la commune que le site écrit');
  const no = await import(pathToFileURL(join(DOSSIER, 'noms.mjs')).href);
  const { normaliser: lireSirene } = await import(pathToFileURL(join(RACINE, 'generateur', 'sirene.mjs')).href);
  ok(communes?.communes?.length === 119, 'la table officielle des communes du 13 est là', String(communes?.communes?.length));
  const cas = [
    [fausse('900000004', 'SASU BMAV MACONNERIE (SASU BMAV MACONNERIE)', '43.99C', { commune: '13030', code_postal: '13780', libelle_commune: 'CUGES-LES-PINS', nom_commercial: 'SASU BMAV MACONNERIE' }), 'BMAV MACONNERIE', 'Cuges-les-Pins', 'Bmav Maçonnerie'],
    [fausse('900000005', 'SMILE ISOL (SMILE ISOL)', '43.29A', { commune: '13213', code_postal: '13013', libelle_commune: 'MARSEILLE 13EME' }), 'SMILE ISOL', 'Marseille', 'Smile Isol'],
    [fausse('900000006', 'SCULPTURE FACADE', '43.99C', { commune: '13106', code_postal: '13240', libelle_commune: 'SEPTEMES-LES-VALLONS' }), 'SCULPTURE FACADE', 'Septèmes-les-Vallons', 'Sculpture Façade'],
    [{ ...fausse('900000007', 'LUCAS VOLLEKINDT (HW ETANCHEITE)', '43.99C', { commune: '13103', code_postal: '13300', libelle_commune: 'SALON-DE-PROVENCE' }), nom_raison_sociale: null }, 'HW ETANCHEITE', 'Salon-de-Provence', 'Hw Étanchéité'],
  ];
  for (const [e, nom, commune, affiche] of cas) {
    ok(no.nomAffiche(e) === nom, `« ${e.nom_complet} » s écrit « ${nom} »`, no.nomAffiche(e));
    ok(no.communeOfficielle(e.siege, communes) === commune, `${e.siege.libelle_commune} s écrit « ${commune} »`, String(no.communeOfficielle(e.siege, communes)));
    const page = lireSirene({ siren: e.siren, nom_complet: no.nomAffiche(e), siege: { libelle_commune: no.communeOfficielle(e.siege, communes) } });
    ok(page.nomLisible === affiche && page.commune === commune, `le site affiche « ${affiche} », à ${commune}`, `${page.nomLisible} | ${page.commune}`);
  }
  // 13103 est partagé par deux communes : seul le code INSEE tranche.
  ok(no.communeOfficielle({ commune: '13094', code_postal: '13103', libelle_commune: 'ST ETIENNE DU GRES' }, communes) === 'Saint-Étienne-du-Grès',
    'un code postal partagé : la commune se lit par son code INSEE');
  ok(no.communeOfficielle({ commune: '99999', code_postal: '13103' }, communes) === null, 'une commune inconnue ne se devine pas : null');
  // Le générateur se défend seul aussi : un nom brut de l'API (sites refaits
  // depuis la base) ne doit plus donner « Sasu Bmav Maconnerie (sasu …) ».
  const brut = lireSirene({ siren: '900000004', nom_complet: 'SASU BMAV MACONNERIE (SASU BMAV MACONNERIE)', siege: { libelle_commune: 'MARSEILLE 13EME' } });
  ok(brut.nomLisible === 'Bmav Maçonnerie' && brut.commune === 'Marseille', 'le générateur nettoie aussi un nom brut et un arrondissement', `${brut.nomLisible} | ${brut.commune}`);
  const facadier = garde(cas[2][0]);
  ok(facadier.garde && facadier.entreprise.nom === 'SCULPTURE FACADE' && facadier.entreprise.commune === 'Septèmes-les-Vallons',
    'l extraction rend le nom propre et la commune officielle', `${facadier.entreprise?.nom} | ${facadier.entreprise?.commune}`);

  // -------------------------------------------------------------------- registre
  console.log('\nLe registre : ce qui ne doit jamais y entrer');
  const dossier = mkdtempSync(join(tmpdir(), 'essai-registre-'));
  const chemin = join(dossier, 'registre.json');
  ok(JSON.stringify(re.lire(join(dossier, 'absent.json'))) === JSON.stringify(re.vide()), 'un registre absent est un registre vide, pas une erreur');
  for (const [quoi, ecrit] of [
    ['06 12 34 56 78', '06 12 34 56 78'],
    ['06.12.34.56.78', '06.12.34.56.78'],
    ['0612345678', '0612345678'],
    ['+33 6 12 34 56 78', '+33 6 12 34 56 78'],
  ]) {
    const sale = { version: 1, fiches: { 480423623: { metier: 'ravalement', nom: `DUPONT ${ecrit}`, commune: 'MARSEILLE', site_le: JOUR, slug: 'a', statut: 'a-appeler', appele_le: null, relance_le: null, note: 50 } } };
    const f = re.valider(sale);
    ok(f.some((x) => /numéro de téléphone/.test(x)), `un numéro écrit « ${quoi} » est refusé`, f.join(' | ') || 'aucune faute relevée');
  }
  const bonne = { version: 1, fiches: {} };
  re.inscrire(bonne, { siren: '480423623', metier: 'ravalement', nom: 'BRIZZI FACADES', commune: 'MARSEILLE', note: 78 }, { jour: JOUR, slug: 'abcdef0123456789' });
  re.inscrire(bonne, { siren: '101661908', metier: 'ravalement', nom: 'RENOVA FACADES', commune: 'MARSEILLE', note: 61 }, { jour: JOUR, slug: '9876543210fedcba' });
  ok(re.valider(bonne).length === 0, 'un registre propre passe', re.valider(bonne).join(' | '));
  ok(re.ecrire(bonne, chemin) === 2, 'écrit, deux fiches');
  ok(Object.keys(re.lire(chemin).fiches).join(',') === '101661908,480423623', 'relu trié par SIREN (diff lisible dans Git)', Object.keys(re.lire(chemin).fiches).join(','));
  for (const [quoi, abime] of [
    ['un statut inventé', (r) => { r.fiches['480423623'].statut = 'peut-etre'; }],
    ['un SIREN à 8 chiffres', (r) => { r.fiches['48042362'] = { ...r.fiches['480423623'] }; }],
    ['une date à l envers', (r) => { r.fiches['480423623'].site_le = '24/10/2026'; }],
    ['une note à 140', (r) => { r.fiches['480423623'].note = 140; }],
  ]) {
    const r = JSON.parse(JSON.stringify(bonne));
    abime(r);
    ok(re.valider(r).length > 0, `${quoi} est refusé`, re.valider(r).join(' | ') || 'aucune faute relevée');
    const avant = readFileSync(chemin, 'utf8');
    const e = await leve(() => re.ecrire(r, chemin));
    ok(e instanceof Error && readFileSync(chemin, 'utf8') === avant, `${quoi} : rien n est écrit sur le disque`, e ? '' : 'aucune erreur levée');
  }
  const jamais = re.resultat(bonne, '480423623', { statut: 'ne-plus-appeler', jour: JOUR });
  ok(jamais.statut === 'ne-plus-appeler' && re.appelable(jamais, '2027-01-01').oui === false, '« ne plus appeler » tient encore en janvier');
  const rappel = re.resultat(bonne, '101661908', { statut: 'a-rappeler', jour: JOUR, relance_le: '2026-10-27' });
  ok(re.appelable(rappel, '2026-10-26').oui === false && re.appelable(rappel, '2026-10-27').oui === true, 'la relance s ouvre le jour promis, pas avant');
  ok(re.relancesDues(bonne, '2026-10-27').map((f) => f.siren).join(',') === '101661908', 'les relances dues du jour sortent, les plus anciennes d abord', JSON.stringify(re.relancesDues(bonne, '2026-10-27').map((f) => f.siren)));
  ok((await leve(() => re.resultat(bonne, '101661908', { statut: 'a-rappeler', jour: JOUR }))) instanceof Error
     && bonne.fiches['101661908'].relance_le === '2026-10-27', '« à rappeler » sans date est refusé, et ne change rien', JSON.stringify(bonne.fiches['101661908']));
  ok((await leve(() => re.resultat(bonne, '000000000', { statut: 'interesse', jour: JOUR }))) instanceof Error, 'un résultat pour un SIREN inconnu est refusé, pas inventé');
  rmSync(dossier, { recursive: true, force: true });

  console.log('\nLe registre du dépôt');
  const vrai = re.lire(join(RACINE, 'prospection', 'registre.json'));
  ok(re.valider(vrai).length === 0, 'prospection/registre.json est valide', re.valider(vrai).join(' | '));
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
process.exitCode = fautes ? 1 : 0;

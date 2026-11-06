#!/usr/bin/env node
// Essai de la fabrication d'un site depuis la base (atelier/fabriquer.mjs),
// contre un faux Supabase local : aucun réseau, aucune clé, donc il tourne
// aussi dans la CI.
//
// Ce qu'il mesure, jamais ce que le code dit de lui-même :
//   - entreprise, profil, tarifs et photos prêtes deviennent l'entrée du
//     générateur (au lieu de donnees/), et le site produit passe
//     `verifier-site` ;
//   - `sites.charte` s'écrit une seule fois (première fabrication) ;
//   - une deuxième fabrication (une photo de plus, et un concurrent apparu
//     entre temps avec exactement la même apparence) garde l'archétype et la
//     charte identiques, et ne réécrit pas `sites.charte` ;
//   - sans photos prêtes qui couvrent les quatre rôles attendus, rien n'est
//     fabriqué ni écrit, et le motif le dit.
//
//   node scripts/essai-fabrication-base.mjs [chemin du module]
//   node scripts/essai-fabrication-base.mjs --contre-essai
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { RACINE } from './env.mjs';
import { fauxSupabase } from './faux-supabase.mjs';
import { supabase } from '../atelier/supabase.mjs';

const CONTRE = process.argv.includes('--contre-essai');
const CLE = 'cle-de-test-fabrication-base';

let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

// ------------------------------------------------- la copie cassée du contre-essai
// Hors du dépôt (piège du 21 octobre). La cassure qui compte : une charte déjà
// figée n'est plus jamais relue, donc une refabrication la retire, même sans
// aucune raison de le faire. `scripts/env.mjs` est remplacé par un fichier qui
// pointe RACINE sur le vrai dépôt : le générateur et ses dépendances (sharp,
// les polices) restent ceux du dépôt, seule la logique de l'adaptateur change.
function copieCassee() {
  const d = mkdtempSync(join(tmpdir(), 'sito-fabrication-casse-'));
  mkdirSync(join(d, 'atelier'));
  mkdirSync(join(d, 'scripts'));
  let src = readFileSync(join(RACINE, 'atelier', 'fabriquer.mjs'), 'utf8');
  const avant = src;
  src = src.replace('if (siteExistant?.charte) {', 'if (false && siteExistant?.charte) {');
  if (src === avant) { console.error('la copie cassée n a rien cassé : le module a changé de forme.'); process.exit(2); }
  writeFileSync(join(d, 'atelier', 'fabriquer.mjs'), src);
  writeFileSync(join(d, 'scripts', 'env.mjs'),
    `export const RACINE = ${JSON.stringify(RACINE)};\nexport function chargerEnv(){ return false; }\nexport function exiger(){ throw new Error('non utilisé dans ce contre-essai'); }\n`);
  return { dossier: d, module: join(d, 'atelier', 'fabriquer.mjs') };
}

const casse = CONTRE ? copieCassee() : null;
const CHEMIN = resolve(process.argv.find((a, i) => i >= 2 && !a.startsWith('--')) || casse?.module || join(RACINE, 'atelier', 'fabriquer.mjs'));
const { fabriquerDepuisBase } = await import(pathToFileURL(CHEMIN).href);

// ------------------------------------------------------------- le faux Supabase
const SIREN = '480423623';
const SIREN_SANS_PHOTOS = '111111118';

const image = (couleur) => sharp({ create: { width: 640, height: 480, channels: 3, background: couleur } }).jpeg().toBuffer();
const objets = new Map();
const poser = async (chemin, couleur) => objets.set(`photos-chantiers/${chemin}`, await image(couleur));
await poser(`${SIREN}/c1/avant1.jpg`, { r: 120, g: 110, b: 100 });
await poser(`${SIREN}/c1/apres1.jpg`, { r: 230, g: 225, b: 210 });
await poser(`${SIREN}/c1/chantier.jpg`, { r: 140, g: 90, b: 60 });
await poser(`${SIREN}/c1/geste.jpg`, { r: 90, g: 90, b: 90 });
await poser(`${SIREN}/c1/detail.jpg`, { r: 200, g: 180, b: 150 });

const sireneBrut = (commune, codePostal) => ({
  nom_raison_sociale: 'Façades Essai', nom_complet: 'Façades Essai',
  date_creation: '2015-04-01', activite_principale: '43.99D', nature_juridique: '5710',
  tranche_effectif_salarie: '03', complements: { est_rge: true },
  siege: { siret: '48042362300017', adresse: '10 rue du Test', libelle_commune: commune, code_postal: codePostal },
});

const lignes = {
  entreprises: [
    { siren: SIREN, denomination: 'Façades Essai', nom_affiche: 'Façades Essai',
      commune: 'Marseille', code_postal: '13001', departement: '13', code_ape: '43.99D',
      sirene: sireneBrut('Marseille', '13001') },
    { siren: SIREN_SANS_PHOTOS, denomination: 'Sans Photos SARL', nom_affiche: 'Sans Photos',
      commune: 'Lyon', code_postal: '69001', departement: '69', code_ape: '43.99D',
      sirene: sireneBrut('Lyon', '69001') },
  ],
  profils: [{ siren: SIREN, telephone: '0491234567', courriel: 'contact@facades-essai.fr', directeur_publication: 'Jeanne Essai', capital_social: '10 000 €', mediateur_nom: 'Médiateur Essai', mediateur_adresse: '1 rue de la Médiation, 75001 Paris', mediateur_site: 'https://mediateur.example', prix_affiches: true, prix_mention: 'Hors fournitures.' }],
  tarifs: [{ id: 1, siren: SIREN, poste: 'Ravalement enduit', bas: 60, haut: 90, unite: '€/m²', note: '', rang: 0 }],
  photos: [
    { id: 1, siren: SIREN, chantier_id: 'c1', role: 'avant', paire: 1, chemin: `${SIREN}/c1/avant1.jpg`, etat: 'prete' },
    { id: 2, siren: SIREN, chantier_id: 'c1', role: 'apres', paire: 1, chemin: `${SIREN}/c1/apres1.jpg`, etat: 'prete' },
    { id: 3, siren: SIREN, chantier_id: 'c1', role: 'chantier', paire: null, chemin: `${SIREN}/c1/chantier.jpg`, etat: 'prete' },
    { id: 4, siren: SIREN, chantier_id: 'c1', role: 'geste', paire: null, chemin: `${SIREN}/c1/geste.jpg`, etat: 'prete' },
    { id: 5, siren: SIREN, chantier_id: 'c1', role: 'detail', paire: null, chemin: `${SIREN}/c1/detail.jpg`, etat: 'prete' },
  ],
  sites: [],
  adresses: [],
  avis: [],
};

const faux = await fauxSupabase({ cle: CLE, base: lignes, objets, cles: { sites: ['siren', 'metier'] } });
const sb = supabase({ url: faux.url, cle: CLE });

let dossier1 = null, dossier2 = null, dossierRegistre = null;
try {
  console.log('\nPremière fabrication');
  dossierRegistre = mkdtempSync(join(tmpdir(), 'sito-registre-'));
  const registre = join(dossierRegistre, 'registre.json');
  dossier1 = mkdtempSync(join(tmpdir(), 'sito-site1-'));

  // Première fabrication sans clé publique : pas de formulaire (T11).
  delete process.env.SUPABASE_CLE_PUBLIQUE;
  const r1 = await fabriquerDepuisBase({ sb, siren: SIREN, metier: 'ravalement', sortie: dossier1, registre });
  if (!ok(r1.ok === true, 'fabrication depuis entreprise + profil + tarifs + photos prêtes', JSON.stringify(r1).slice(0, 300))) throw new Error('fabrication 1 refusée');
  ok(existsSync(join(dossier1, 'index.html')), 'un index.html est écrit');
  ok(existsSync(join(dossier1, 'mentions-legales.html')), 'site d abonné : la page des mentions légales est écrite (T50)');
  ok(!/exemple|Proposition de site/i.test(readFileSync(join(dossier1, 'index.html'), 'utf8').replace(/<head>[\s\S]*?<\/head>/, '')),
    'site d abonné fabriqué depuis la base : ni « exemple » ni « proposition » (T54)');

  const v1 = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), dossier1], { encoding: 'utf8' });
  ok(v1.status === 0, 'le site produit passe verifier-site', (v1.stdout || v1.stderr || '').trim().split('\n').slice(-3).join(' | '));

  const site1 = await sb.lireUne('sites', { filtres: { siren: ['eq', SIREN], metier: ['eq', 'ravalement'] } });
  ok(!!site1?.charte, 'sites.charte écrite après la première fabrication');
  ok(site1?.archetype === r1.archetype, 'sites.archetype correspond à ce que la fabrication a choisi');

  console.log('\nDeuxième fabrication (photo de plus, concurrent jumeau apparu)');
  // Le concurrent copie exactement l apparence du site deja fabrique : si la
  // charte n etait pas figee, la retirer pour s en distinguer serait le choix
  // le moins fautif, et elle changerait presque surement.
  const concurrent = {
    siren: '999999999', nom: 'Concurrent Jumeau', metier: 'ravalement',
    commune: 'Marseille', departement: '13',
    archetype: r1.archetype, famille: r1.charte.famille, sol: r1.charte.sol,
    polices: r1.charte.polices, geometrie: r1.charte.geometrie, mot: r1.charte.mot,
    titre: 'Un concurrent qui copie tout', structure: r1.charte.structure.ordre.join(' > '),
    structureDetail: r1.charte.structure, comparateur: r1.charte.comparateur,
  };
  writeFileSync(registre, JSON.stringify({ sites: [concurrent] }, null, 2));
  await poser(`${SIREN}/c2/detail2.jpg`, { r: 50, g: 60, b: 70 });
  lignes.photos.push({ id: 6, siren: SIREN, chantier_id: 'c2', role: 'detail', paire: null, chemin: `${SIREN}/c2/detail2.jpg`, etat: 'prete' });

  // L'adresse offerte posée entre les deux fabrications (T51) : la deuxième
  // porte l'URL canonique et le plan du site.
  lignes.adresses.push({ id: 'a1', site_id: site1.id, hote: 'facades-essai.example.fr', genre: 'offerte', principale: true, etat: 'active' });
  dossier2 = mkdtempSync(join(tmpdir(), 'sito-site2-'));
  ok(!/<form\b/.test(readFileSync(join(dossier1, 'index.html'), 'utf8')), 'pas de formulaire de demande (décision du 6 nov., Q10)');
  // Deuxième fabrication, même avec l'adresse et la clé publique de Supabase : toujours pas de formulaire.
  process.env.SUPABASE_URL = 'https://essai.supabase.co';
  process.env.SUPABASE_CLE_PUBLIQUE = 'sb_publishable_essai';
  const r2 = await fabriquerDepuisBase({ sb, siren: SIREN, metier: 'ravalement', sortie: dossier2, registre });
  if (!ok(r2.ok === true, 'deuxième fabrication : réussie', JSON.stringify(r2).slice(0, 300))) throw new Error('fabrication 2 refusée');
  ok(r2.archetype === r1.archetype, 'archétype gardé malgré le concurrent jumeau', `${r1.archetype} puis ${r2.archetype}`);
  ok(JSON.stringify(r2.charte) === JSON.stringify(r1.charte), 'charte gardée identique malgré le concurrent jumeau');

  const site2 = await sb.lireUne('sites', { filtres: { siren: ['eq', SIREN], metier: ['eq', 'ravalement'] } });
  ok(JSON.stringify(site2?.charte) === JSON.stringify(site1?.charte), 'sites.charte jamais réécrite après la création');

  ok(readFileSync(join(dossier2, 'index.html'), 'utf8').includes('<link rel="canonical" href="https://facades-essai.example.fr/">')
    && existsSync(join(dossier2, 'sitemap.xml')), 'deuxième fabrication : URL canonique et plan du site depuis l adresse principale (T51)');
  const v2 = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), dossier2], { encoding: 'utf8' });
  ok(!/<form\b/.test(readFileSync(join(dossier2, 'index.html'), 'utf8')), 'même avec SUPABASE_URL et SUPABASE_CLE_PUBLIQUE : aucun formulaire (Q10)');
  ok(v2.status === 0, 'le site de la deuxième fabrication passe aussi verifier-site', (v2.stdout || v2.stderr || '').trim().split('\n').slice(-3).join(' | '));

  console.log('\nSans aucune photo prête');
  const r3 = await fabriquerDepuisBase({ sb, siren: SIREN_SANS_PHOTOS, metier: 'ravalement', sortie: join(tmpdir(), 'sito-jamais-fabrique'), registre });
  ok(r3.ok === false && Array.isArray(r3.manquants) && r3.manquants.length === 4, 'refusée, les 4 manques nommés', JSON.stringify(r3));
  ok(!(await sb.lireUne('sites', { filtres: { siren: ['eq', SIREN_SANS_PHOTOS], metier: ['eq', 'ravalement'] } })), 'aucune ligne sites écrite sans photos');
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  faux.arreter();
  if (dossier1) rmSync(dossier1, { recursive: true, force: true });
  if (dossier2) rmSync(dossier2, { recursive: true, force: true });
  if (dossierRegistre) rmSync(dossierRegistre, { recursive: true, force: true });
  if (casse) rmSync(casse.dossier, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
if (CONTRE) {
  console.log(fautes ? 'Contre-essai réussi : la copie cassée est attrapée.' : 'CONTRE-ESSAI RATÉ : la copie cassée passe.');
  process.exitCode = fautes ? 0 : 1;
} else process.exitCode = fautes ? 1 : 0;

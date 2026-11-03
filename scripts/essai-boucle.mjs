#!/usr/bin/env node
// Essai de la boucle du service (`atelier/boucle.mjs`, T09), de bout en bout,
// sans réseau : un faux Supabase (`faux-supabase.mjs`), le vrai générateur, le
// vrai vérificateur de site, et un dossier qui joue le stockage des versions
// (`atelier/publier.mjs`, `stockageDossier`).
//
// Ce qu'il mesure, dans l'ordre d'une vie de site :
//   1. un site jamais fabriqué est refait et publié en version 1 ; la base
//      note la fabrication réussie, la version en ligne, `sites.version` ;
//   2. un second tour sans changement ne refait rien ;
//   3. une photo ajoutée se retrouve dans la version 2, et une seule version
//      reste `en_ligne` ;
//   4. une version refusée par le vérificateur ne remplace rien (stockage,
//      adresse, `sites.version`, `versions_site`) et ne se retente pas tant
//      que rien ne change ;
//   5. un site sans photos prêtes est noté en erreur, avec ses manques.
//
//   node scripts/essai-boucle.mjs [chemin de boucle.mjs]
//   node scripts/essai-boucle.mjs --contre-essai
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { RACINE } from './env.mjs';
import { fauxSupabase } from './faux-supabase.mjs';
import { supabase } from '../atelier/supabase.mjs';
import { stockageDossier, adressesFichier } from '../atelier/publier.mjs';

const CLE = 'cle-de-test-boucle';
const MODULE = join(RACINE, 'atelier', 'boucle.mjs');

// ---------------------------------------------------------- contre-essai
// Une cassure à la fois, dans une copie hors du dépôt ; ses imports pointent
// sur les vrais modules. L'essai entier est rejoué et doit rougir.
const CASSURES = [
  { nom: 'tout site est refait à chaque tour, changé ou non',
    de: '.filter(([, t]) => t > derniere)', a: '.filter(() => true)' },
  { nom: 'l ancienne version reste en_ligne',
    de: "    await sb.majorer('versions_site', { site_id: ['eq', site.id], en_ligne: ['eq', 'true'] }, { en_ligne: false });\n", a: '' },
  { nom: 'le verdict du vérificateur est ignoré',
    de: 'const verifierEtGarder = async (d) => (verdict = await verifier(d));',
    a: 'const verifierEtGarder = async () => (verdict = { ok: true, bloquants: [], constats: [] });' },
  { nom: 'sites.version n est plus mis à jour',
    de: "{ version: pub.version, publie_le: fin, adresse_en_ligne: hotes[0] }", a: "{ publie_le: fin, adresse_en_ligne: hotes[0] }" },
];

if (process.argv.includes('--contre-essai')) {
  let ratees = 0;
  for (const c of CASSURES) {
    const d = mkdtempSync(join(tmpdir(), 'sito-boucle-casse-'));
    let src = readFileSync(MODULE, 'utf8').replace(/\r\n/g, '\n');
    const avant = src;
    src = src.replace(c.de, c.a);
    if (src === avant) { console.error(`la cassure « ${c.nom} » n a rien changé : le module a changé de forme.`); process.exit(2); }
    for (const [rel, vrai] of [['../scripts/env.mjs', 'scripts/env.mjs'], ['./fabriquer.mjs', 'atelier/fabriquer.mjs'], ['./publier.mjs', 'atelier/publier.mjs']]) {
      src = src.replace(`from '${rel}'`, `from ${JSON.stringify(pathToFileURL(join(RACINE, vrai)).href)}`);
    }
    writeFileSync(join(d, 'boucle.mjs'), src);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), join(d, 'boucle.mjs')], { encoding: 'utf8', cwd: RACINE, maxBuffer: 64 * 1024 * 1024 });
    const sortie = (r.stdout || '') + (r.stderr || '');
    const attrapee = r.status === 1 && /\d+ contrôles, [1-9]\d* faute/.test(sortie) && !/essai interrompu/.test(sortie);
    if (!attrapee) ratees++;
    console.log(`${attrapee ? 'ok   ' : 'RATÉ '} ${c.nom}`);
    if (!attrapee) console.log(`        sortie ${r.status} : ${sortie.trim().split('\n').filter((l) => /interrompu|contrôles|Error/.test(l)).slice(0, 3).join(' | ')}`);
    console.log(sortie.split('\n').filter((l) => l.includes('FAUTE')).slice(0, 2).map((l) => '       ' + l.trim()).join('\n'));
    rmSync(d, { recursive: true, force: true });
  }
  console.log(`\n${CASSURES.length} cassure(s) posée(s) une par une, ${ratees} non attrapée(s).`);
  console.log(ratees ? 'CONTRE-ESSAI RATÉ : une copie cassée passe.' : 'Contre-essai réussi : chaque copie cassée est attrapée.');
  process.exit(ratees ? 1 : 0);
}

const CHEMIN = resolve(process.argv.find((a, i) => i >= 2 && !a.startsWith('--')) || MODULE);
const { tour } = await import(pathToFileURL(CHEMIN).href);

let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

// ------------------------------------------------------------ le faux Supabase
const SIREN = '480423623';
const SIREN_SANS_PHOTOS = '111111118';
const image = (couleur) => sharp({ create: { width: 640, height: 480, channels: 3, background: couleur } }).jpeg().toBuffer();
const objets = new Map();
const poserImage = async (chemin, couleur) => objets.set(`photos-chantiers/${chemin}`, await image(couleur));
await poserImage(`${SIREN}/c1/avant1.jpg`, { r: 120, g: 110, b: 100 });
await poserImage(`${SIREN}/c1/apres1.jpg`, { r: 230, g: 225, b: 210 });
await poserImage(`${SIREN}/c1/chantier.jpg`, { r: 140, g: 90, b: 60 });
await poserImage(`${SIREN}/c1/geste.jpg`, { r: 90, g: 90, b: 90 });
await poserImage(`${SIREN}/c1/detail.jpg`, { r: 200, g: 180, b: 150 });

const T0 = '2026-10-20T08:00:00Z';
const sireneBrut = (commune, codePostal) => ({
  nom_raison_sociale: 'Façades Essai', nom_complet: 'Façades Essai',
  date_creation: '2015-04-01', activite_principale: '43.99D', nature_juridique: '5710',
  tranche_effectif_salarie: '03', complements: { est_rge: true },
  siege: { siret: '48042362300017', adresse: '10 rue du Test', libelle_commune: commune, code_postal: codePostal },
});
const photo = (id, role, paire, chemin, quand = T0) => ({ id, siren: SIREN, chantier_id: 'c1', role, paire, chemin, etat: 'prete', cree_le: quand, mis_a_jour_le: quand });
const lignes = {
  entreprises: [
    { siren: SIREN, denomination: 'Façades Essai', nom_affiche: 'Façades Essai', commune: 'Marseille', code_postal: '13001',
      departement: '13', code_ape: '43.99D', sirene: sireneBrut('Marseille', '13001'), mis_a_jour_le: T0 },
    { siren: SIREN_SANS_PHOTOS, denomination: 'Sans Photos SARL', nom_affiche: 'Sans Photos', commune: 'Lyon', code_postal: '69001',
      departement: '69', code_ape: '43.99D', sirene: sireneBrut('Lyon', '69001'), mis_a_jour_le: T0 },
  ],
  profils: [{ siren: SIREN, telephone: '0491234567', courriel: 'contact@facades-essai.fr', directeur_publication: 'Jeanne Essai', capital_social: '10 000 €', mediateur_nom: 'Médiateur Essai', mediateur_adresse: '1 rue de la Médiation, 75001 Paris', mediateur_site: 'https://mediateur.example', prix_affiches: true, prix_mention: 'Hors fournitures.', mis_a_jour_le: T0 }],
  tarifs: [{ id: 1, siren: SIREN, poste: 'Ravalement enduit', bas: 60, haut: 90, unite: '€/m²', note: '', rang: 0, mis_a_jour_le: T0 }],
  photos: [
    photo(1, 'avant', 1, `${SIREN}/c1/avant1.jpg`), photo(2, 'apres', 1, `${SIREN}/c1/apres1.jpg`),
    photo(3, 'chantier', null, `${SIREN}/c1/chantier.jpg`), photo(4, 'geste', null, `${SIREN}/c1/geste.jpg`),
    photo(5, 'detail', null, `${SIREN}/c1/detail.jpg`),
  ],
  // Deux sites inscrits, pas encore fabriqués : la charte viendra au premier.
  sites: [
    { id: 'site-a', siren: SIREN, metier: 'ravalement', charte: null, archetype: null, version: null },
    { id: 'site-b', siren: SIREN_SANS_PHOTOS, metier: 'ravalement', charte: null, archetype: null, version: null },
  ],
  fabrications: [],
  versions_site: [],
  adresses: [],
};

const faux = await fauxSupabase({ cle: CLE, base: lignes, objets, cles: { sites: ['siren', 'metier'] } });
const sb = supabase({ url: faux.url, cle: CLE });
const D = mkdtempSync(join(tmpdir(), 'sito-essai-boucle-'));
const stockage = stockageDossier(join(D, 'r2'));
const adresses = adressesFichier(join(D, 'adresses.json'));
const registre = join(D, 'registre.json');
const HOTE = 'facades-essai.sito.example';
const hotesDe = (s) => [s.id === 'site-a' ? HOTE : 'sans-photos.sito.example'];

// L'horloge avance d'une minute à chaque lecture : les dates se suivent.
let horloge = new Date('2026-10-29T10:00:00Z').getTime();
const maintenant = () => new Date((horloge += 60000));
const refuse = async () => ({ ok: false, bloquants: [{ gravite: 'bloquant', libelle: 'refus posé par l essai' }], constats: [] });
const lancer = (extra = {}) => tour({ sb, hotesDe, registre, stockage, adresses, maintenant, ...extra });
const fabs = (id) => lignes.fabrications.filter((f) => f.site_id === id);
const versions = (id) => lignes.versions_site.filter((v) => v.site_id === id);
const siteA = () => lignes.sites.find((s) => s.id === 'site-a');
const manifeste = async (n) => JSON.parse((await stockage.lire(`sites/site-a/${n}/.manifeste.json`)).toString());

try {
  console.log('\nPremier tour : deux sites jamais fabriqués');
  const b1 = await lancer();
  const a1 = b1.find((x) => x.site === 'site-a');
  if (!ok(a1?.publie === true && a1.version === 1, 'le site A est publié en version 1', JSON.stringify(a1).slice(0, 300))) throw new Error('premier tour raté');
  ok(fabs('site-a').length === 1 && fabs('site-a')[0].statut === 'reussie' && fabs('site-a')[0].version === 1, 'fabrications : une ligne, réussie, version 1');
  ok(fabs('site-a')[0].verifications?.ok === true, 'le verdict du vérificateur réel est noté');
  ok(versions('site-a').length === 1 && versions('site-a')[0].en_ligne === true && versions('site-a')[0].numero === 1, 'versions_site : la version 1, en ligne');
  ok(siteA().version === 1 && siteA().adresse_en_ligne === HOTE && !!siteA().publie_le, 'sites : version 1, adresse et date de publication');
  ok(!!siteA().charte, 'la charte est écrite au premier passage d un site inscrit sans charte');
  // Lu tout de suite : seules les deux dernières versions sont gardées.
  const m1 = await manifeste(1);
  ok((await adresses.lire(HOTE))?.version === 1, 'l adresse pointe sur la version 1');
  const b = b1.find((x) => x.site === 'site-b');
  ok(b?.publie === false && b.statut === 'erreur' && b.manquants?.length === 4, 'le site sans photos : erreur, ses 4 manques nommés', JSON.stringify(b));
  ok(fabs('site-b').length === 1 && fabs('site-b')[0].statut === 'erreur', 'sa fabrication ratée est notée');
  ok(versions('site-b').length === 0, 'aucune version pour le site sans photos');

  console.log('\nDeuxième tour : rien n a changé');
  const b2 = await lancer();
  ok(b2.every((x) => x.saute), 'aucun site n est refait', JSON.stringify(b2));
  ok(fabs('site-a').length === 1 && fabs('site-b').length === 1, 'aucune fabrication de plus');

  // Une seconde paire avant/après : le générateur la montre toujours quand
  // elle existe (`main-photos.mjs`, paire2), ce qui rend la preuve sûre. Un
  // second « geste » ne l'est pas : un seul est tiré parmi les candidats.
  console.log('\nTroisième tour : une paire avant/après de plus');
  await poserImage(`${SIREN}/c1/avant2.jpg`, { r: 60, g: 70, b: 80 });
  await poserImage(`${SIREN}/c1/apres2.jpg`, { r: 210, g: 200, b: 190 });
  const plusTard = new Date(horloge + 1000).toISOString();
  lignes.photos.push(photo(6, 'avant', 2, `${SIREN}/c1/avant2.jpg`, plusTard), photo(7, 'apres', 2, `${SIREN}/c1/apres2.jpg`, plusTard));
  const b3 = await lancer();
  const a3 = b3.find((x) => x.site === 'site-a');
  ok(a3?.publie === true && a3.version === 2 && /photos/.test(a3.raison), 'le site A est refait pour sa photo, version 2', JSON.stringify(a3));
  ok(b3.find((x) => x.site === 'site-b')?.saute, 'le site B, lui, n est pas retenté');
  const m2 = (await stockage.existe('sites/site-a/2/.manifeste.json')) ? await manifeste(2) : {};
  const secondePaire = (m) => Object.keys(m).filter((k) => /avant-02|apres-02/.test(k)).length;
  ok(secondePaire(m1) === 0 && secondePaire(m2) > 0, 'la paire ajoutée est dans la version 2, pas dans la 1', `${secondePaire(m1)} fichier(s) puis ${secondePaire(m2)}`);
  ok(versions('site-a').filter((v) => v.en_ligne).length === 1 && versions('site-a').find((v) => v.en_ligne).numero === 2, 'une seule version en ligne : la 2');
  ok(siteA().version === 2 && (await adresses.lire(HOTE))?.version === 2, 'sites.version et l adresse passent à 2');

  console.log('\nQuatrième tour : le profil change, le vérificateur refuse');
  lignes.profils[0].telephone = '0491234568';
  lignes.profils[0].mis_a_jour_le = new Date(horloge + 1000).toISOString();
  const b4 = await lancer({ verifier: refuse });
  const a4 = b4.find((x) => x.site === 'site-a');
  ok(a4?.publie === false && a4.statut === 'refusee', 'la version est refusée', JSON.stringify(a4));
  ok(fabs('site-a').at(-1)?.statut === 'refusee' && fabs('site-a').at(-1)?.verifications?.bloquants?.length === 1, 'la fabrication refusée est notée avec son bloquant');
  ok(siteA().version === 2 && (await adresses.lire(HOTE))?.version === 2, 'rien ne bascule : sites.version et l adresse restent à 2');
  ok(versions('site-a').length === 2 && versions('site-a').find((v) => v.en_ligne).numero === 2, 'versions_site ne bouge pas');
  ok(!(await stockage.existe('sites/site-a/3/.manifeste.json')), 'aucune version 3 dans le stockage');

  console.log('\nCinquième tour : rien de neuf depuis le refus');
  const b5 = await lancer();
  ok(b5.every((x) => x.saute), 'le site refusé n est pas retenté tant que rien ne change', JSON.stringify(b5));
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  faux.arreter();
  rmSync(D, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
process.exitCode = fautes ? 1 : 0;

#!/usr/bin/env node
// Essai de la refabrication par GitHub Actions (tâche T45) : ce que lance
// `.github/workflows/refaire-site.yml`, contre un faux Supabase et un faux
// Cloudflare Pages. Aucun réseau, aucune clé.
//
// Ce qu'il mesure :
//   - un site d'abonné jamais fabriqué : fabriqué, vérifié, déployé sur son
//     projet Pages (`sito-<siren>-<métier>`), sans noindex ; `sites.version`,
//     `versions_site` (une seule en ligne) et `fabrications` notés ;
//   - rien de changé : aucun nouveau dépôt ;
//   - un profil changé : un nouveau dépôt, version 2, une seule en ligne ;
//   - un site sans photos prêtes : rien n'est déployé, c'est noté ;
//   - le vérificateur refuse : rien ne part chez Cloudflare ;
//   - le workflow existe, se déclenche sur `repository_dispatch` et à la main,
//     ne lance qu'un tour à la fois par site, et ne cite aucun secret en clair.
//
//   node scripts/essai-refaire-site.mjs
//   node scripts/essai-refaire-site.mjs --contre-essai   (publication qui ne
//        demande pas le vérificateur : doit rougir)
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { RACINE } from './env.mjs';
import { fauxSupabase } from './faux-supabase.mjs';
import { fauxCloudflare } from './faux-cloudflare.mjs';
import { supabase } from '../atelier/supabase.mjs';
import { clientCloudflare } from './prospection/cloudflare-pages.mjs';
import { refaire } from './refaire-site.mjs';

const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const travail = mkdtempSync(join(tmpdir(), 'sito-refaire-essai-'));

let publierPages;
if (CONTRE) {
  mkdirSync(join(travail, 'a'));
  let src = readFileSync(join(RACINE, 'atelier', 'publier-pages.mjs'), 'utf8');
  const avant = src;
  src = src.replace("  if (!verdict.ok) return { publie: false, motif: 'vérificateur', bloquants: verdict.bloquants || [] };\n", '')
    .replace(/from '(\.\.?\/[^']+)'/g, (_, rel) => `from ${JSON.stringify(pathToFileURL(join(RACINE, 'atelier', rel)).href)}`);
  if (src === avant || src.includes('if (!verdict.ok)')) { console.error('la copie cassée n a rien cassé'); process.exit(2); }
  writeFileSync(join(travail, 'a', 'publier-pages.mjs'), src);
  ({ publierPages } = await import(pathToFileURL(join(travail, 'a', 'publier-pages.mjs')).href));
} else ({ publierPages } = await import('../atelier/publier-pages.mjs'));

const CLE = 'cle-de-test-refaire';
const SIREN = '480423623', SANS = '111111118';
const T0 = '2026-10-20T08:00:00Z';
const objets = new Map();
const image = (c) => sharp({ create: { width: 640, height: 480, channels: 3, background: c } }).jpeg().toBuffer();
for (const [n, c] of [['avant1', { r: 120, g: 110, b: 100 }], ['apres1', { r: 230, g: 225, b: 210 }], ['chantier', { r: 140, g: 90, b: 60 }], ['geste', { r: 90, g: 90, b: 90 }], ['detail', { r: 200, g: 180, b: 150 }]])
  objets.set(`photos-chantiers/${SIREN}/c1/${n}.jpg`, await image(c));
const sirene = (commune, cp) => ({ nom_raison_sociale: 'Façades Essai', nom_complet: 'Façades Essai', date_creation: '2015-04-01', activite_principale: '43.99D',
  nature_juridique: '5710', siege: { siret: '48042362300017', adresse: '10 rue du Test', libelle_commune: commune, code_postal: cp } });
const photo = (id, role, paire, n) => ({ id, siren: SIREN, chantier_id: 'c1', role, paire, chemin: `${SIREN}/c1/${n}.jpg`, etat: 'prete', cree_le: T0, mis_a_jour_le: T0 });
const lignes = {
  entreprises: [
    { siren: SIREN, denomination: 'Façades Essai', nom_affiche: 'Façades Essai', commune: 'Marseille', code_postal: '13001', departement: '13', sirene: sirene('Marseille', '13001'), mis_a_jour_le: T0 },
    { siren: SANS, denomination: 'Sans Photos', nom_affiche: 'Sans Photos', commune: 'Lyon', code_postal: '69001', departement: '69', sirene: sirene('Lyon', '69001'), mis_a_jour_le: T0 },
  ],
  profils: [{ siren: SIREN, telephone: '0491234567', courriel: 'contact@facades-essai.fr', directeur_publication: 'Jeanne Essai', prix_affiches: false, mis_a_jour_le: T0 }],
  tarifs: [],
  photos: [photo(1, 'avant', 1, 'avant1'), photo(2, 'apres', 1, 'apres1'), photo(3, 'chantier', null, 'chantier'), photo(4, 'geste', null, 'geste'), photo(5, 'detail', null, 'detail')],
  sites: [{ id: 'site-a', siren: SIREN, metier: 'ravalement', charte: null, archetype: null, version: null },
    { id: 'site-b', siren: SANS, metier: 'ravalement', charte: null, archetype: null, version: null }],
  fabrications: [], versions_site: [], adresses: [], avis: [],
};
const faux = await fauxSupabase({ cle: CLE, base: lignes, objets, cles: { sites: ['siren', 'metier'] } });
const sb = supabase({ url: faux.url, cle: CLE });
const cf = fauxCloudflare({ projets: [] });
const client = clientCloudflare({ compte: cf.compte, jeton: cf.jeton, fetch: cf.fetch });
const PROJET = `sito-${SIREN}-ravalement`;

try {
  console.log('\nPremier tour');
  const b1 = await refaire({ sb, client, siren: SIREN, dire: () => {} });
  ok(b1.length === 1 && b1[0].publie === true && b1[0].version === 1, 'site fabriqué, vérifié, publié en version 1', JSON.stringify(b1[0]).slice(0, 200));
  ok(cf.deploiements.length === 1 && cf.dernier.projet === PROJET, `un dépôt sur le projet ${PROJET}`, cf.deploiements.map((d) => d.projet).join(','));
  const page = cf.servir('/');
  const html = page.corps ? Buffer.from(page.corps).toString('utf8') : '';
  ok(page.statut === 200 && html.includes('Façades Essai') && !/noindex/i.test(html + JSON.stringify(page.entetes)), 'la page est servie, sans noindex', `statut ${page.statut}`);
  ok(cf.servir('/mentions-legales').statut === 200 && cf.servir('/robots.txt').statut === 200, 'mentions légales et robots.txt en ligne');
  ok(!cf.dernier.manifeste['/donnees.json'], 'les fichiers de travail ne partent pas (donnees.json)');
  const s1 = await sb.lireUne('sites', { filtres: { id: ['eq', 'site-a'] } });
  const v1 = await sb.lire('versions_site', { filtres: { site_id: ['eq', 'site-a'] } });
  ok(s1.version === 1 && /pages\.dev/.test(s1.adresse_en_ligne || '') && v1.length === 1 && v1[0].en_ligne, 'sites.version, adresse en ligne et versions_site notés', JSON.stringify({ v: s1.version, a: s1.adresse_en_ligne }));

  console.log('\nRien de changé');
  const b2 = await refaire({ sb, client, siren: SIREN, dire: () => {} });
  ok(b2[0].saute && cf.deploiements.length === 1, 'aucun nouveau dépôt', JSON.stringify(b2[0]));

  console.log('\nProfil changé');
  lignes.profils[0].telephone = '0491000000';
  lignes.profils[0].mis_a_jour_le = new Date(Date.now() + 60_000).toISOString();
  const b3 = await refaire({ sb, client, siren: SIREN, dire: () => {} });
  const v3 = await sb.lire('versions_site', { filtres: { site_id: ['eq', 'site-a'] } });
  ok(b3[0].publie && b3[0].version === 2 && cf.deploiements.length === 2, 'un nouveau dépôt, version 2', JSON.stringify(b3[0]).slice(0, 160));
  ok(v3.filter((v) => v.en_ligne).length === 1 && v3.find((v) => v.en_ligne).numero === 2, 'une seule version en ligne, la 2');
  ok(Buffer.from(cf.servir('/').corps).toString('utf8').includes('04 91 00 00 00'), 'le nouveau numéro est en ligne');

  console.log('\nSans photos prêtes');
  const b4 = await refaire({ sb, client, siren: SANS, dire: () => {} });
  ok(b4[0].publie === false && b4[0].statut === 'erreur' && cf.deploiements.every((d) => d.projet !== `sito-${SANS}-ravalement`), 'rien n est déployé, c est noté', JSON.stringify(b4[0]).slice(0, 160));

  console.log('\nLe vérificateur refuse');
  const avant = cf.deploiements.length;
  const site = await sb.lireUne('sites', { filtres: { id: ['eq', 'site-a'] } });
  const dossier = join(travail, 'site-refuse'); mkdirSync(dossier); writeFileSync(join(dossier, 'index.html'), '<!doctype html><title>x</title>');
  const r = await publierPages({ client, site, dossier, verifier: async () => ({ ok: false, bloquants: [{ num: 'A4' }] }) });
  ok(r.publie === false && cf.deploiements.length === avant, 'rien ne part chez Cloudflare', JSON.stringify(r).slice(0, 120));

  console.log('\nLe workflow');
  const w = readFileSync(join(RACINE, '.github', 'workflows', 'refaire-site.yml'), 'utf8');
  ok(/repository_dispatch:\s*\n\s*types:\s*\[refaire-site\]/.test(w) && /workflow_dispatch:/.test(w), 'déclenché par la base (repository_dispatch) et à la main');
  ok(/concurrency:[\s\S]*cancel-in-progress:\s*false/.test(w), 'un seul tour à la fois par site, sans en couper un en route');
  ok(/secrets\.SUPABASE_CLE_SERVICE/.test(w) && !/sb_secret_|eyJhbGci/.test(w), 'les clés viennent des secrets du dépôt, aucune en clair');
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  faux.arreter();
  rmSync(travail, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
if (CONTRE) {
  console.log(fautes ? 'Contre-essai réussi : la copie cassée est attrapée.' : 'CONTRE-ESSAI RATÉ : la copie cassée passe.');
  process.exitCode = fautes ? 0 : 1;
} else process.exitCode = fautes ? 1 : 0;

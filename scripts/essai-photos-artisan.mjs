#!/usr/bin/env node
// Essai des photos reçues par mail ou WhatsApp (tâche T60,
// docs/specs/S-MODELES.md MO7, procédure docs/PROCEDURE-PHOTOS.md).
//
// Ce qu'il mesure, dans des dossiers temporaires :
//   - dépôt public : aucune photo n'entre dans `clients/` ;
//   - un dossier en vrac (JPEG d'iPhone avec GPS, PNG, HEIC, PDF, vidéo) :
//     les photos sont préparées (sans GPS ni appareil), le HEIC, le PDF et la
//     vidéo sont refusés avec leur raison ;
//   - sans paire avant / après ou sans geste : rien n'est fabriqué, et c'est dit ;
//   - modèle pas encore réservé : rien n'est fabriqué, et c'est dit ;
//   - rôles écrits et modèle réservé : site d'abonné refait sur le modèle de
//     l'artisan, avec ses photos, sans « exemple », `verifier-site` à 0.
//
//   node scripts/essai-photos-artisan.mjs
//   node scripts/essai-photos-artisan.mjs --contre-essai   (copie sans la
//        garde du dépôt public : doit rougir)
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { RACINE } from './env.mjs';
import * as reg from './prospection/registre.mjs';
import { lire as lireModeles } from './prospection/modeles.mjs';
import { accepter } from './prospection/accepter.mjs';

const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const travail = mkdtempSync(join(tmpdir(), 'sito-photos-artisan-'));

let module = join(RACINE, 'scripts', 'prospection', 'photos-artisan.mjs');
if (CONTRE) {
  mkdirSync(join(travail, 'p'));
  let src = readFileSync(module, 'utf8');
  const avant = src;
  src = src.replace(/  if \(!prive\(\)\) throw new Error\([^\n]*\n/, '')
    .replace(/from '(\.\.?\/[^']+)'/g, (_, rel) => `from ${JSON.stringify(pathToFileURL(join(RACINE, 'scripts', 'prospection', rel)).href)}`);
  if (src.includes('if (!prive())') || src === avant) { console.error('la copie cassée n a rien cassé'); process.exit(2); }
  module = join(travail, 'p', 'photos-artisan.mjs');
  writeFileSync(module, src);
}
const { ranger, fabriquer, manquants } = await import(pathToFileURL(module).href);

const SIREN = '480423623';
try {
  const clients = join(travail, 'clients');
  const source = join(travail, 'recues');
  mkdirSync(source);
  // Un JPEG d'iPhone avec GPS et appareil, couché (orientation 6).
  const jpeg = (r, g, b, w = 1600, h = 1200) => sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } });
  await jpeg(120, 110, 100).withExif({ IFD0: { Make: 'Apple', Model: 'iPhone 15' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '43/1 17/1 0/1' } }).withMetadata({ orientation: 6 })
    .jpeg().toFile(join(source, 'IMG_0001.JPG'));
  await jpeg(230, 225, 210).jpeg().toFile(join(source, 'IMG_0002.JPG'));
  await jpeg(140, 90, 60).jpeg().toFile(join(source, 'WhatsApp Image 2026-11-04 at 10.12.31.jpeg'));
  await jpeg(90, 90, 90).png().toFile(join(source, 'capture.png'));
  await jpeg(200, 180, 150).jpeg().toFile(join(source, 'IMG_0005.JPG'));
  writeFileSync(join(source, 'IMG_0006.HEIC'), Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic'), Buffer.alloc(40)]));
  writeFileSync(join(source, 'devis.pdf'), Buffer.from('%PDF-1.4\n%essai\n'));

  console.log('\nDépôt public');
  let refuse = null;
  try { await ranger({ siren: SIREN, source, clients, prive: () => false }); } catch (e) { refuse = e.message; }
  ok(/encore public/.test(refuse || '') && !existsSync(join(clients, SIREN, 'photos')), 'aucune photo n entre, et la raison est dite', refuse || 'rien refusé');

  console.log('\nDépôt privé : les photos en vrac');
  const { manifeste, refus } = await ranger({ siren: SIREN, source, clients, prive: () => true });
  ok(manifeste.photos.length === 5, '5 photos préparées (JPEG, PNG, nom WhatsApp)', String(manifeste.photos.length));
  ok(refus.length === 2 && refus.some((r) => /HEIC/.test(r.motif)) && refus.some((r) => /PDF/.test(r.motif)), 'HEIC et PDF refusés avec leur raison', refus.map((r) => r.motif).join(' | '));
  const s1 = await sharp(join(source, 'IMG_0001.JPG')).metadata();
  ok(s1.orientation === 6 && s1.exif.toString('latin1').includes('iPhone'), 'la photo reçue porte bien orientation, appareil et GPS (essai valable)');
  const m1 = await sharp(join(clients, SIREN, 'photos', '01.jpg')).metadata();
  ok(!m1.exif && m1.width === 1200 && m1.height === 1600, 'la photo d iPhone est redressée, sans GPS ni appareil', `${m1.width}×${m1.height} exif ${!!m1.exif}`);
  const relance = await ranger({ siren: SIREN, source, clients, prive: () => true });
  ok(relance.manifeste.photos.length === 5, 'relancé : rien en double');

  console.log('\nRôles incomplets');
  const fm = join(clients, SIREN, 'photos.json');
  const roles = [['avant', 1], ['apres', 1], ['chantier', null], ['geste', null], ['detail', null]];
  const ecrire = (n) => { const j = JSON.parse(readFileSync(fm, 'utf8')); j.photos.forEach((p, i) => { if (i < n) [p.role, p.paire] = roles[i]; }); writeFileSync(fm, JSON.stringify(j)); };
  ecrire(3);
  const trous = manquants(JSON.parse(readFileSync(fm, 'utf8')));
  ok(trous.some((t) => /sans rôle/.test(t)) && trous.some((t) => /geste/.test(t)) && trous.some((t) => /detail/.test(t)), 'ce qui manque est nommé', trous.join(' | '));

  console.log('\nModèle et fabrication');
  ecrire(5);
  const modeles = join(travail, 'modeles');
  cpSync(join(RACINE, 'prospection', 'modeles'), modeles, { recursive: true });
  const appels = join(travail, 'registre.json');
  const r = reg.vide();
  const modele = lireModeles('ravalement', modeles).modeles.find((m) => m.etat === 'libre');
  reg.inscrire(r, { siren: SIREN, nom: 'Façades Durand', metier: 'ravalement', commune: 'Marseille', note: 80 }, { jour: '2026-11-04', slug: 'b'.repeat(16), modele: modele.id });
  reg.ecrire(r, appels);
  writeFileSync(join(clients, SIREN, 'entreprise.json'), JSON.stringify({ siren: SIREN, nom_raison_sociale: 'Façades Durand', date_creation: '2012-03-01', nature_juridique: '5499',
    siege: { siret: SIREN + '00017', adresse: '3 rue des Essais', libelle_commune: 'Marseille', code_postal: '13004' },
    telephone: '0491234567', mentions: { courriel: 'contact@facades-durand.fr', directeur_publication: 'Paul Durand' } }));
  const sortie = join(travail, 'site');
  const avantReserve = fabriquer({ siren: SIREN, clients, appels, modeles, sortie, dire: () => {} });
  ok(!avantReserve.ok && /pas encore réservé/.test((avantReserve.manquants || []).join(' ')), 'modèle pas encore réservé : rien n est fabriqué, et c est dit');
  const r2 = reg.lire(appels); r2.fiches[SIREN].statut = 'essai-lance';
  accepter(r2, SIREN, { jour: '2026-11-04', modeles }); reg.ecrire(r2, appels);
  const fait = fabriquer({ siren: SIREN, clients, appels, modeles, sortie, dire: () => {} });
  ok(fait.ok && fait.modele === modele.id, `site refait sur le modèle de l artisan (${modele.id}), verifier-site à 0`, JSON.stringify(fait.manquants || fait.verifier));
  if (fait.ok) {
    const d = JSON.parse(readFileSync(join(sortie, 'donnees.json'), 'utf8'));
    ok(d.archetype === modele.archetype && JSON.stringify(d.charte.famille) === JSON.stringify(modele.fiche.famille), 'l apparence est celle du modèle montré');
    const html = readFileSync(join(sortie, 'index.html'), 'utf8').replace(/<head>[\s\S]*?<\/head>/, '');
    ok(!/exemple|Proposition de site/i.test(html) && html.includes('Façades Durand') && existsSync(join(sortie, 'mentions-legales.html')), 'site d abonné : ni « exemple » ni « proposition », mentions légales');
    ok(readdirSync(join(sortie, 'images')).some((f) => f.startsWith('apres-01')), 'les photos de l artisan sont sur la page');
  }
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  rmSync(travail, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
if (CONTRE) {
  console.log(fautes ? 'Contre-essai réussi : la copie cassée est attrapée.' : 'CONTRE-ESSAI RATÉ : la copie cassée passe.');
  process.exitCode = fautes ? 0 : 1;
} else process.exitCode = fautes ? 1 : 0;

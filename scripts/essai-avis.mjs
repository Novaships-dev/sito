#!/usr/bin/env node
// Essai de la section des avis (tâche T56, constat S-024).
//
// Ce qu'il mesure, sur des sites dont la charte porte la section « avis » :
//   - site d'abonné sans avis : pas de section, pas d'emplacement vide ;
//   - site d'abonné avec deux avis : deux cartes, textes exacts (échappés),
//     note du client seulement si elle existe, jamais inventée ;
//   - site de prospection : l'emplacement vide qui le dit reste permis ;
//   - le contrôle R-AVIS de `verifier-site` rougit sur un site d'abonné où
//     l'emplacement vide est remis.
//
//   node scripts/essai-avis.mjs
//   node scripts/essai-avis.mjs --contre-essai   (générateur copié qui garde
//        l'emplacement vide sur un site d'abonné : doit rougir)
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { RACINE } from './env.mjs';

const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const travail = mkdtempSync(join(tmpdir(), 'sito-avis-'));
let GEN = join(RACINE, 'generateur');
if (CONTRE) {
  GEN = join(travail, 'generateur');
  cpSync(join(RACINE, 'generateur'), GEN, { recursive: true });
  symlinkSync(join(RACINE, 'node_modules'), join(travail, 'node_modules'), 'dir');
  const f = join(GEN, 'sections', 'avis.mjs');
  const avant = readFileSync(f, 'utf8');
  const apres = avant.replace('if (!reels.length) return \'\';', 'if (!reels.length) return bloc();');
  if (apres === avant) { console.error('la copie cassée n a rien cassé'); process.exit(2); }
  writeFileSync(f, apres);
}

const images = join(travail, 'images');
mkdirSync(images);
for (const [nom, c] of Object.entries({ hero: [200, 190, 170], 'avant-01': [120, 110, 100], 'apres-01': [230, 225, 210],
  chantier: [140, 90, 60], geste: [90, 90, 90], 'detail-enduit': [200, 180, 150] }))
  writeFileSync(join(images, `${nom}.jpg`), await sharp({ create: { width: 900, height: 620, channels: 3, background: { r: c[0], g: c[1], b: c[2] } } }).jpeg().toBuffer());

const AVIS = [
  { auteur: 'Sophie R.', texte: 'Travail soigné, chantier propre & rendu "impeccable".', note: 5, ecrit_le: '2026-09-12' },
  { auteur: 'Marc', texte: 'Délais tenus.', note: null, ecrit_le: '2025-06-02' },
];
let n = 0;
const fabriquer = (siren, { publication = true, avis = [] } = {}) => {
  const sortie = join(travail, `s-${++n}`), fd = join(travail, `d-${n}.json`);
  writeFileSync(fd, JSON.stringify({ siren, nom_raison_sociale: 'Façades Essai', date_creation: '2015-04-01', nature_juridique: '5710',
    siege: { siret: siren + '00017', adresse: '10 rue du Test', libelle_commune: 'Marseille', code_postal: '13001' },
    telephone: '0491234567', mentions: { courriel: 'a@essai.fr', directeur_publication: 'Jeanne Essai' }, avis }));
  const args = [join(GEN, 'composer.mjs'), '--siren', siren, '--metier', 'ravalement', '--images', images,
    '--sortie', sortie, '--donnees', fd, '--registre', join(travail, `r-${n}.json`)];
  if (publication) args.push('--publication');
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', cwd: RACINE });
  if (r.status !== 0) throw new Error('fabrication : ' + (r.stderr || '').trim().split('\n').slice(-1)[0]);
  return { sortie, html: readFileSync(join(sortie, 'index.html'), 'utf8'), d: JSON.parse(readFileSync(join(sortie, 'donnees.json'), 'utf8')) };
};
const verifier = (d) => spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), d], { encoding: 'utf8' });

try {
  // Des SIREN dont la charte porte la section « avis », sur deux archétypes au moins.
  const avecAvis = [];
  for (const siren of ['480423623', '732829320', '443061841', '350000105', '552100554', '378901946', '642050199', '316300182', '409785512', '820043784']) {
    const x = fabriquer(siren, { avis: AVIS });
    if (x.d.charte.structure.ordre.includes('avis')) avecAvis.push({ siren, archetype: x.d.archetype, avec: x });
    if (new Set(avecAvis.map((a) => a.archetype)).size >= 2 && avecAvis.length >= 2) break;
  }
  ok(avecAvis.length >= 2, 'deux sites dont la charte porte les avis', avecAvis.map((a) => `${a.siren} ${a.archetype}`).join(', '));
  for (const { siren, archetype, avec } of avecAvis.slice(0, 2)) {
    console.log(`\n${siren} (${archetype})`);
    const cartes = avec.html.match(/<div class="carte" data-avis>/g) || [];
    ok(cartes.length === 2, 'avec deux avis : deux cartes', String(cartes.length));
    ok(avec.html.includes('Travail soigné, chantier propre &amp; rendu &quot;impeccable&quot;.') && avec.html.includes('Délais tenus.'), 'les textes exacts, échappés');
    ok(avec.html.includes('aria-label="Note : 5 sur 5">★★★★★') && (avec.html.match(/aria-label="Note :/g) || []).length === 1, 'une note seulement là où le client l a donnée');
    ok(avec.html.includes('Sophie R., 2026') && !/Les avis viennent ici/.test(avec.html), 'auteur et année ; aucun emplacement vide');
    ok(verifier(avec.sortie).status === 0, 'verifier-site à 0');
    const sans = fabriquer(siren);
    ok(!/class="avis"/.test(sans.html), 'sans avis : aucune section d avis');
    ok(verifier(sans.sortie).status === 0, 'sans avis : verifier-site à 0');
    const prospection = fabriquer(siren, { publication: false });
    ok(/Les avis viennent ici/.test(prospection.html), 'prospection : l emplacement vide qui le dit reste');
  }
  console.log('\nLe contrôle R-AVIS');
  const s = avecAvis[0].avec.sortie;
  const casse = join(travail, 'casse');
  cpSync(s, casse, { recursive: true });
  writeFileSync(join(casse, 'index.html'), readFileSync(join(casse, 'index.html'), 'utf8').replace('<div class="carte" data-avis>', '<div class="carte vide"><p>Les avis viennent ici.</p></div><div class="carte" data-avis>'));
  const v = verifier(casse);
  ok(v.status === 1 && /\[BLOQUANT\] R-AVIS/.test(v.stdout), 'emplacement vide sur un site d abonné : R-AVIS rouge');
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

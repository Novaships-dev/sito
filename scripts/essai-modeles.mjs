#!/usr/bin/env node
// Essai des modèles de prospection (tâche T57, docs/specs/S-MODELES.md).
//
// Ce qu'il mesure :
//   - `modeles.mjs` tire 10 modèles libres du ravalement, aucune paire jugée
//     trop proche par generateur/unicite.mjs, et `--verifier` sort 0 ;
//   - deux modèles jumeaux font sortir `--verifier` en 1 ;
//   - deux entreprises fabriquées sur le même modèle ont le même archétype, la
//     même charte, les mêmes textes, paramètres et photos ; seules les données
//     de l'entreprise diffèrent ; sur deux modèles différents, l'apparence
//     diffère ;
//   - le tirage d'un modèle est stable : le même fichier redonne le même site.
//
//   node scripts/essai-modeles.mjs
//   node scripts/essai-modeles.mjs --contre-essai   (fabrique sans --graine :
//        les deux entreprises divergent, l'essai doit rougir)
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { RACINE } from './env.mjs';
import { lire, ecrire, charteDe } from './prospection/modeles.mjs';

const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const travail = mkdtempSync(join(tmpdir(), 'sito-modeles-'));
const dossierModeles = join(travail, 'modeles');
const lancer = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', cwd: RACINE });

try {
  console.log('\nLes modèles du ravalement');
  const r = lancer([join(RACINE, 'scripts', 'prospection', 'modeles.mjs'), '--metier', 'ravalement', '--dossier', dossierModeles]);
  ok(r.status === 0, 'modeles.mjs complète le fichier', (r.stderr || '').trim());
  const etat = lire('ravalement', dossierModeles);
  ok(etat.modeles.length === 10 && etat.modeles.every((m) => m.etat === 'libre'), '10 modèles libres', String(etat.modeles.length));
  ok(new Set(etat.modeles.map((m) => m.id)).size === 10, 'identifiants tous différents');
  const v = lancer([join(RACINE, 'scripts', 'prospection', 'modeles.mjs'), '--metier', 'ravalement', '--dossier', dossierModeles, '--verifier']);
  ok(v.status === 0, 'aucune paire trop proche (U1 à U4)', v.stdout.trim());
  const r2 = lancer([join(RACINE, 'scripts', 'prospection', 'modeles.mjs'), '--metier', 'ravalement', '--dossier', dossierModeles]);
  ok(r2.status === 0 && lire('ravalement', dossierModeles).modeles.length === 10, 'relancé : rien d ajouté quand il y a déjà 10 libres');

  // Deux modèles jumeaux : le contrôle doit rougir.
  const jumeau = join(travail, 'jumeaux');
  ecrire({ ...etat, modeles: [...etat.modeles, { ...etat.modeles[0], id: 'modele-ravalement-99' }] }, jumeau);
  const vj = lancer([join(RACINE, 'scripts', 'prospection', 'modeles.mjs'), '--metier', 'ravalement', '--dossier', jumeau, '--verifier']);
  ok(vj.status === 1 && /modele-ravalement-01 et modele-ravalement-99/.test(vj.stdout), 'deux modèles jumeaux : --verifier sort 1 et les nomme', vj.stdout.trim().split('\n')[0]);

  console.log('\nLes modèles du dépôt (prospection/modeles/)');
  for (const f of (await import('node:fs')).readdirSync(join(RACINE, 'prospection', 'modeles')).filter((x) => x.endsWith('.json'))) {
    const metier = f.replace(/\.json$/, '');
    const x = lancer([join(RACINE, 'scripts', 'prospection', 'modeles.mjs'), '--metier', metier, '--verifier']);
    ok(x.status === 0, `${metier} : 10 libres, aucune paire trop proche`, x.stdout.trim().split('\n')[0]);
  }

  console.log('\nDeux entreprises sur le même modèle');
  const images = join(travail, 'images');
  mkdirSync(images);
  const im = (a) => sharp({ create: { width: 900, height: 620, channels: 3, background: a } }).jpeg().toBuffer();
  for (const [nom, c] of Object.entries({ hero: { r: 200, g: 190, b: 170 }, 'avant-01': { r: 120, g: 110, b: 100 }, 'apres-01': { r: 230, g: 225, b: 210 },
    chantier: { r: 140, g: 90, b: 60 }, geste: { r: 90, g: 90, b: 90 }, 'detail-enduit': { r: 200, g: 180, b: 150 } }))
    writeFileSync(join(images, `${nom}.jpg`), await im(c));
  writeFileSync(join(images, 'SOURCE-ILLUSTRATION'), '');
  const entreprise = (siren, nom, commune, cp) => ({ siren, nom_raison_sociale: nom, nom_complet: nom, date_creation: '2012-03-01',
    activite_principale: '43.99D', nature_juridique: '5499', siege: { siret: siren + '00011', adresse: '3 rue des Essais', libelle_commune: commune, code_postal: cp } });
  const fabriquer = (modele, brut) => {
    const sortie = join(travail, `site-${brut.siren}-${modele.id}`);
    const fd = join(travail, `d-${brut.siren}.json`), fc = join(travail, `c-${modele.id}.json`);
    writeFileSync(fd, JSON.stringify(brut)); writeFileSync(fc, JSON.stringify(charteDe(modele)));
    const args = [join(RACINE, 'generateur', 'composer.mjs'), '--siren', brut.siren, '--metier', 'ravalement', '--images', images,
      '--sortie', sortie, '--donnees', fd, '--registre', join(travail, `reg-${brut.siren}-${modele.id}.json`), '--charte', fc];
    if (!CONTRE) args.push('--graine', modele.id);
    const x = lancer(args);
    if (x.status !== 0) throw new Error('fabrication : ' + (x.stderr || '').trim().split('\n').slice(-1)[0]);
    return { sortie, d: JSON.parse(readFileSync(join(sortie, 'donnees.json'), 'utf8')), html: readFileSync(join(sortie, 'index.html'), 'utf8') };
  };
  const A = entreprise('480423623', 'Façades Durand', 'Marseille', '13004');
  const B = entreprise('732829320', 'Ravalement Martin', 'Aubagne', '13400');
  const m1 = etat.modeles[0], m2 = etat.modeles[1];
  const a1 = fabriquer(m1, A), b1 = fabriquer(m1, B);
  const meme = (k) => JSON.stringify(a1.d[k]) === JSON.stringify(b1.d[k]);
  ok(a1.d.archetype === m1.archetype && b1.d.archetype === m1.archetype, `même archétype, celui du modèle (${m1.archetype})`);
  ok(meme('charte'), 'même charte (famille, sol, polices, géométrie, mot, structure, nuancier, comparateur)');
  ok(meme('titre') && meme('phrases'), 'mêmes textes', `${a1.d.titre} / ${b1.d.titre}`);
  ok(meme('parametres'), 'mêmes paramètres de mise en page');
  ok(meme('main') && meme('photos'), 'mêmes photos aux mêmes places');
  ok(a1.d.entreprise.siren !== b1.d.entreprise.siren && a1.html.includes('Façades Durand') && b1.html.includes('Ravalement Martin')
    && !b1.html.includes('Façades Durand') && b1.html.includes('Aubagne'), 'seules les données de l entreprise diffèrent');
  const a2 = fabriquer(m2, A);
  ok(a2.d.archetype !== a1.d.archetype || JSON.stringify(a2.d.charte) !== JSON.stringify(a1.d.charte), 'un autre modèle : une autre apparence');
  const a1bis = fabriquer(m1, A);
  ok(JSON.stringify({ ...a1bis.d, produitLe: 0 }) === JSON.stringify({ ...a1.d, produitLe: 0 }), 'stable : le même modèle redonne le même site');
  ok(spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), b1.sortie], { encoding: 'utf8' }).status === 0, 'le site sur modèle passe verifier-site');
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  rmSync(travail, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
if (CONTRE) {
  console.log(fautes ? 'Contre-essai réussi : sans la graine du modèle, les sites divergent.' : 'CONTRE-ESSAI RATÉ : la graine ne sert à rien.');
  process.exitCode = fautes ? 0 : 1;
} else process.exitCode = fautes ? 1 : 0;

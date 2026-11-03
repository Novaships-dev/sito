#!/usr/bin/env node
// Tous les essais du dépôt, dans l'ordre, avec un résumé écrit dans
// memoire/essais/derniers.txt (versionné : la preuve voyage avec le code).
//
//   node scripts/essais.mjs            l'ensemble courant (quelques minutes)
//   node scripts/essais.mjs --complet  + les contre-essais et la refabrication
//                                      des sites de démonstration (si les images sont là)
//
// Sortie : 0 tout est vert ; 1 au moins une faute ; 4 aucune faute mais un
// essai n'a pas pu tourner (outil absent) : ce n'est PAS une réussite, le
// résumé dit lequel et pourquoi. La CI (.github/workflows/essais.yml) installe
// tous les outils : là, 4 n'arrive pas.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './env.mjs';
import { pythonAvecHeif } from './python.mjs';

const COMPLET = process.argv.includes('--complet');
const WIN = process.platform === 'win32';

const present = (outil, args = ['--version']) => {
  const r = spawnSync(outil, args, { stdio: 'ignore', shell: WIN });
  return r.status === 0;
};

// Les deux essais qui fabriquent de vrais fichiers de photo demandent les
// mêmes outils système : une seule réponse, pour qu'ils ne divergent jamais.
const outilsPhotos = () => [!present('exiftool', ['-ver']) && 'exiftool',
  !present('ffmpeg', ['-version']) && 'ffmpeg',
  !pythonAvecHeif() && 'python + Pillow + pillow-heif'].filter(Boolean);
// L'essai de l'app fabrique ses photos d'essai avec exiftool et ffmpeg (pas
// de Python) : sans eux il plantait (« spawnSync exiftool ENOENT ») au lieu de
// dire « NON LANCÉ ». Constat S-005, tâche T47.
const outilsApp = () => [!present('exiftool', ['-ver']) && 'exiftool',
  !present('ffmpeg', ['-version']) && 'ffmpeg'].filter(Boolean);

// Les images ne sont pas dans Git (décision de Fabrice : pas de Git LFS) :
// hors de la machine de Fabrice, les essais qui les lisent ne peuvent pas
// tourner, et le disent.
const imagesRavalement = () => (existsSync(join(RACINE, 'images', 'ravalement', 'sources')) ? [] : ['images/ravalement/sources (hors de Git)']);

const ETAPES = [
  { nom: 'dépôt complet', cmd: ['node', 'scripts/verifier-depot.mjs', '.'] },
  { nom: 'règles de rédaction (sites et app)', cmd: ['node', 'scripts/verifier-textes.mjs', '.'] },
  { nom: 'aucun secret', cmd: ['node', 'scripts/verifier-secrets.mjs', '.'] },
  { nom: 'outillage de Claude Code', cmd: ['node', 'scripts/essai-outillage.mjs'] },
  { nom: 'app : types et construction', cmd: ['npm', '--prefix', 'app', 'run', 'build'], avant: () => {
    if (!existsSync(join(RACINE, 'app', 'node_modules'))) spawnSync('npm', ['--prefix', 'app', 'ci'], { cwd: RACINE, stdio: 'inherit', shell: WIN });
  } },
  { nom: 'app : parcours et rendu (navigateur)', cmd: ['node', 'scripts/essai-app.mjs'], manque: outilsApp },
  { nom: 'photos (service)', cmd: ['node', 'scripts/essai-photos.mjs'], manque: outilsPhotos },
  { nom: 'service : adaptateur Supabase', cmd: ['node', 'scripts/essai-service.mjs'] },
  // L'inscription par lien (fonction Edge) sur un faux dépôt : jamais le réseau.
  { nom: 'inscription par lien (fonction Edge)', cmd: ['node', 'scripts/essai-inscription.mjs'] },
  { nom: 'service : préparation des photos reçues', cmd: ['node', 'scripts/essai-preparation.mjs'], manque: outilsPhotos },
  { nom: 'service : fabrication depuis la base', cmd: ['node', 'scripts/essai-fabrication-base.mjs'] },
  { nom: 'générateur : échappement des textes de l artisan (navigateur)', cmd: ['node', 'scripts/essai-echappement.mjs'] },
  { nom: 'générateur : mentions légales d un site d abonné', cmd: ['node', 'scripts/essai-mentions.mjs'] },
  { nom: 'service : boucle (refaire, vérifier, publier par version)', cmd: ['node', 'scripts/essai-boucle.mjs'] },
  { nom: 'prospection : extraction, note, registre', cmd: ['node', 'scripts/essai-prospection.mjs'] },
  // La fabrication du lot sans aucune image : un métier sans images est sauté,
  // les données du générateur n'inventent rien, les slugs ne se répètent pas.
  // La fabrication réelle demande les images : elle est plus bas.
  { nom: 'prospection : fabrication du lot', cmd: ['node', 'scripts/essai-lot.mjs'] },
  // La publication privée contre un faux Cloudflare : aucun compte, aucun
  // réseau. La première publication réelle attend l'action F5.
  { nom: 'prospection : publication privée', cmd: ['node', 'scripts/essai-publication-prospection.mjs'] },
  // La page d'appels : le Worker avec un faux KV, et la page au doigt sur
  // 390 px dans un vrai navigateur.
  { nom: 'prospection : page d appels du jour', cmd: ['node', 'scripts/essai-appels.mjs'] },
  // La soirée de bout en bout : lister, qualifier avec le web, fabriquer,
  // publier, produire la page — sur un faux Cloudflare, sans aucune image.
  { nom: 'prospection : préparation de la soirée, de bout en bout', cmd: ['node', 'scripts/essai-preparer-appels.mjs'] },
  // Les feuilles de prompts sont dans Git, les images non : ce contrôle tourne
  // partout, celui des fichiers (plus bas) seulement là où les images sont.
  { nom: 'feuilles de prompts contre le plan d images', cmd: ['node', 'scripts/verifier-images.mjs', '--prompts'] },
  { nom: 'publication par versions et Worker', cmd: ['node', 'scripts/essai-publication.mjs'] },
  // L'audit de fin de séance sur un clone : un doublon, un fichier mort et des
  // temporaires posés exprès, trouvés puis corrigés. L'audit du vrai dépôt,
  // qui efface, se lance à part (/fin-de-seance).
  { nom: 'audit du dépôt (sur un clone cassé exprès)', cmd: ['node', 'scripts/audit-depot.mjs', '--contre-essai'] },
];
if (COMPLET) {
  ETAPES.push(
    { nom: 'contre-essai : secrets', cmd: ['node', 'scripts/verifier-secrets.mjs', '--contre-essai'] },
    { nom: 'contre-essai : outillage', cmd: ['node', 'scripts/essai-outillage.mjs', '--contre-essai'] },
    { nom: 'contre-essai : app', cmd: ['node', 'scripts/essai-app.mjs', '--contre-essai'], manque: outilsApp },
    { nom: 'contre-essai : service', cmd: ['node', 'scripts/essai-service.mjs', '--contre-essai'] },
    { nom: 'contre-essai : inscription par lien', cmd: ['node', 'scripts/essai-inscription.mjs', '--contre-essai'] },
    { nom: 'contre-essai : préparation des photos', cmd: ['node', 'scripts/essai-preparation.mjs', '--contre-essai'], manque: outilsPhotos },
    { nom: 'contre-essai : fabrication depuis la base', cmd: ['node', 'scripts/essai-fabrication-base.mjs', '--contre-essai'] },
    { nom: 'contre-essai : échappement', cmd: ['node', 'scripts/essai-echappement.mjs', '--contre-essai'] },
    { nom: 'contre-essai : mentions légales', cmd: ['node', 'scripts/essai-mentions.mjs', '--contre-essai'] },
    { nom: 'contre-essai : boucle du service', cmd: ['node', 'scripts/essai-boucle.mjs', '--contre-essai'] },
    { nom: 'contre-essai : prospection', cmd: ['node', 'scripts/essai-prospection.mjs', '--contre-essai'] },
    { nom: 'contre-essai : fabrication du lot', cmd: ['node', 'scripts/essai-lot.mjs', '--contre-essai'] },
    { nom: 'contre-essai : publication privée', cmd: ['node', 'scripts/essai-publication-prospection.mjs', '--contre-essai'] },
    { nom: 'contre-essai : page d appels', cmd: ['node', 'scripts/essai-appels.mjs', '--contre-essai'] },
    { nom: 'contre-essai : préparation de la soirée', cmd: ['node', 'scripts/essai-preparer-appels.mjs', '--contre-essai'] },
    { nom: 'contre-essai : feuilles de prompts', cmd: ['node', 'scripts/verifier-images.mjs', '--contre-essai-prompts'] },
    { nom: 'images du ravalement sur le disque', cmd: ['node', 'scripts/verifier-images.mjs', 'ravalement'], manque: imagesRavalement },
    { nom: 'contre-essai : images sur le disque', cmd: ['node', 'scripts/verifier-images.mjs', '--contre-essai'], manque: imagesRavalement },
    { nom: 'lot de prospection : deux sites fabriqués pour de vrai', cmd: ['node', 'scripts/essai-lot.mjs', '--complet'], manque: imagesRavalement },
    { nom: 'sites de démonstration (5 vérificateurs)', cmd: ['node', 'scripts/fabriquer-demo.mjs'], manque: imagesRavalement },
  );
}

const lignes = [];
let fautes = 0, absents = 0;
for (const e of ETAPES) {
  const manque = e.manque ? e.manque() : [];
  if (manque.length) {
    absents++;
    lignes.push(`NON LANCÉ  ${e.nom} : manque ${manque.join(', ')}`);
    console.log(`\n=== ${e.nom} : NON LANCÉ (manque ${manque.join(', ')})`);
    continue;
  }
  console.log(`\n=== ${e.nom}`);
  e.avant?.();
  const debut = Date.now();
  const r = spawnSync(e.cmd[0], e.cmd.slice(1), { cwd: RACINE, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', shell: WIN && e.cmd[0] === 'npm', maxBuffer: 64 * 1024 * 1024 });
  const sortie = (r.stdout || '') + (r.stderr || '');
  process.stdout.write(sortie.split('\n').slice(-25).join('\n') + '\n');
  const duree = Math.round((Date.now() - debut) / 1000);
  const bilan = sortie.trim().split('\n').filter((l) => /contr[ôo]les?|faute|Aucun|complet|fichiers|built|erreur|error/i.test(l)).slice(-1)[0] || '';
  if (r.status === 0) lignes.push(`OK         ${e.nom} (${duree} s) ${bilan.trim()}`);
  else { fautes++; lignes.push(`FAUTE      ${e.nom} (${duree} s, sortie ${r.status}) ${bilan.trim()}`); }
}

const date = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'full', timeStyle: 'short' }).format(new Date());
let commit = '';
try { commit = spawnSync('git', ['-C', RACINE, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).stdout.trim(); } catch { /* sans git */ }
const verdict = fautes ? `${fautes} FAUTE(S)` : absents ? `aucune faute, mais ${absents} essai(s) NON LANCÉ(S) : pas une réussite complète` : 'TOUT EST VERT';
const resume = `Essais du ${date} (heure de Paris), ${process.platform}, commit ${commit || '?'}${COMPLET ? ', mode complet' : ''}\n\n${lignes.join('\n')}\n\nVerdict : ${verdict}\n`;
mkdirSync(join(RACINE, 'memoire', 'essais'), { recursive: true });
writeFileSync(join(RACINE, 'memoire', 'essais', 'derniers.txt'), resume);
console.log('\n' + resume + '\n(écrit dans memoire/essais/derniers.txt)');
process.exit(fautes ? 1 : absents ? 4 : 0);

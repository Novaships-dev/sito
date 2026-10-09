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

const COMPLET = process.argv.includes('--complet');
const WIN = process.platform === 'win32';

const present = (outil, args = ['--version']) => {
  const r = spawnSync(outil, args, { stdio: 'ignore', shell: WIN });
  return r.status === 0;
};
const pythonHeif = () => {
  for (const py of WIN ? ['python', 'py'] : ['python3']) {
    if (spawnSync(py, ['-c', 'import PIL, pillow_heif'], { stdio: 'ignore', shell: WIN }).status === 0) return true;
  }
  return false;
};

const ETAPES = [
  { nom: 'dépôt complet', cmd: ['node', 'scripts/verifier-depot.mjs', '.'] },
  { nom: 'règles de rédaction (sites et app)', cmd: ['node', 'scripts/verifier-textes.mjs', '.'] },
  { nom: 'aucun secret', cmd: ['node', 'scripts/verifier-secrets.mjs', '.'] },
  { nom: 'outillage de Claude Code', cmd: ['node', 'scripts/essai-outillage.mjs'] },
  { nom: 'app : types et construction', cmd: ['npm', '--prefix', 'app', 'run', 'build'], avant: () => {
    if (!existsSync(join(RACINE, 'app', 'node_modules'))) spawnSync('npm', ['--prefix', 'app', 'ci'], { cwd: RACINE, stdio: 'inherit', shell: WIN });
  } },
  { nom: 'app : parcours et rendu (navigateur)', cmd: ['node', 'scripts/essai-app.mjs'] },
  { nom: 'photos (service)', cmd: ['node', 'scripts/essai-photos.mjs'],
    manque: () => [!present('exiftool', ['-ver']) && 'exiftool', !present('ffmpeg', ['-version']) && 'ffmpeg', !pythonHeif() && 'python + Pillow + pillow-heif'].filter(Boolean) },
  { nom: 'publication par versions et Worker', cmd: ['node', 'scripts/essai-publication.mjs'] },
];
if (COMPLET) {
  ETAPES.push(
    { nom: 'contre-essai : secrets', cmd: ['node', 'scripts/verifier-secrets.mjs', '--contre-essai'] },
    { nom: 'contre-essai : outillage', cmd: ['node', 'scripts/essai-outillage.mjs', '--contre-essai'] },
    { nom: 'contre-essai : app', cmd: ['node', 'scripts/essai-app.mjs', '--contre-essai'] },
    { nom: 'sites de démonstration (5 vérificateurs)', cmd: ['node', 'scripts/fabriquer-demo.mjs'],
      manque: () => (existsSync(join(RACINE, 'images', 'ravalement', 'sources')) ? [] : ['images/ravalement/sources (hors de Git)']) },
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

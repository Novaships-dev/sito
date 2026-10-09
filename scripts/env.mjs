// Lit le fichier .env à la racine du dépôt (jamais versionné) et remplit
// process.env sans écraser ce qui existe déjà. Aucune dépendance.
// Les noms attendus sont listés dans .env.example. Un script qui a besoin d'une
// variable absente s'arrête en disant laquelle, et pourquoi : jamais de valeur
// inventée, jamais de valeur affichée.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

export function chargerEnv(fichier = join(RACINE, '.env')) {
  if (!existsSync(fichier)) return false;
  for (const ligne of readFileSync(fichier, 'utf8').split(/\r?\n/)) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || ligne.trim().startsWith('#')) continue;
    const valeur = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined && valeur !== '') process.env[m[1]] = valeur;
  }
  return true;
}

// Rend les variables demandées, ou s'arrête (code 3 = configuration manquante)
// en disant quoi faire. Le message ne montre jamais une valeur.
export function exiger(noms, pourquoi) {
  chargerEnv();
  const manquent = noms.filter((n) => !process.env[n]);
  if (manquent.length) {
    console.error(`Configuration manquante : ${manquent.join(', ')}.`);
    console.error(`Pour : ${pourquoi}.`);
    console.error('À mettre dans le fichier .env à la racine (modèle : .env.example). Voir memoire/actions-fabrice.md.');
    process.exit(3);
  }
  return Object.fromEntries(noms.map((n) => [n, process.env[n]]));
}

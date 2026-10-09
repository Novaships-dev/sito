// Ce que les crochets de Claude Code partagent. Écrits en Node, pas en bash :
// ils tournent pareil sous Windows (Git Bash ou non), Linux et dans la CI.
// Lancés en forme « exec » depuis .claude/settings.json :
//   "command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/<nom>.mjs"]
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = resolve(process.env.CLAUDE_PROJECT_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', '..'));

export function lireEntree() {
  try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

// Chemin relatif à la racine, en barres obliques (Windows compris).
export function rel(chemin) {
  if (!chemin) return '';
  return relative(RACINE, resolve(RACINE, chemin)).replace(/\\/g, '/');
}

export function lire(cheminRel) {
  const p = join(RACINE, cheminRel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

// Refus : le message part vers Claude (sortie 2).
export function refuser(message) {
  process.stderr.write(message + '\n');
  process.exit(2);
}

// La liste de tâches (app/specs/07-TACHES.md) : une ligne de tableau par tâche,
// | Txx | titre | état | ... |. États : à faire, en cours, fait, bloqué.
export function taches() {
  const t = lire('app/specs/07-TACHES.md');
  if (!t) return [];
  return t.split('\n')
    .filter((l) => /^\|\s*T\d+\s*\|/.test(l))
    .map((l) => {
      const c = l.split('|').slice(1, -1).map((x) => x.trim());
      return { id: c[0], titre: c[1], etat: (c[2] || '').toLowerCase(), preuve: c[3] || '', depend: c[4] || '', bloque: c[5] || '' };
    });
}

export const restantes = (liste) => liste.filter((t) => t.etat.startsWith('à faire') || t.etat.startsWith('en cours'));

// Les tâches qu'on peut prendre maintenant : « en cours » d'abord, puis les
// « à faire » dont toutes les dépendances (T01, T02…) sont « fait ».
export function eligibles(liste) {
  const etat = Object.fromEntries(liste.map((t) => [t.id, t.etat]));
  const pretes = (t) => (t.depend.match(/T\d+/g) || []).every((d) => (etat[d] || '').startsWith('fait'));
  return [
    ...liste.filter((t) => t.etat.startsWith('en cours')),
    ...liste.filter((t) => t.etat.startsWith('à faire') && pretes(t)),
  ];
}

// Ce que les crochets de Claude Code partagent. Écrits en Node, pas en bash :
// ils tournent pareil sous Windows (Git Bash ou non), Linux et dans la CI.
// Lancés en forme « exec » depuis .claude/settings.json :
//   "command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/<nom>.mjs"]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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

// Change l'état (et la colonne « Bloqué par ») d'une tâche dans le tableau.
// Utilisé par le crochet de fin (budget de panne dépassé) et par
// scripts/autonome.mjs (nouvelle tentative le lendemain). Renvoie vrai si la
// ligne a été trouvée.
export function changerEtat(id, etat, bloquePar) {
  const p = join(RACINE, 'app/specs/07-TACHES.md');
  if (!existsSync(p)) return false;
  let trouve = false;
  const texte = readFileSync(p, 'utf8').split('\n').map((l) => {
    if (!new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l)) return l;
    const c = l.split('|');
    // c[0] vide, c[1] N°, c[2] tâche, c[3] état, c[4] preuve, c[5] dépend, c[6] bloqué par, c[7] vide
    if (c.length < 8) return l;
    trouve = true;
    c[3] = ` ${etat} `;
    if (bloquePar !== undefined) c[6] = bloquePar ? ` ${bloquePar} ` : ' ';
    return c.join('|');
  }).join('\n');
  if (trouve) writeFileSync(p, texte);
  return trouve;
}

// Fichiers verrouillés : les garde-fous (décision de Fabrice du 10 oct. 2026).
// Claude Code ne les modifie jamais ; seul Fabrice le fait, hors de Claude Code.
export const VERROUILLES = [
  /^\.claude\/settings(\.local)?\.json$/,
  /^\.claude\/hooks\//,
  /^scripts\/verifier-secrets\.mjs$/,
  /^scripts\/essai-outillage\.mjs$/,
  /^scripts\/autonome\.mjs$/,
  /^git-hooks\//,
  /^lanceurs\/CLAUDE_AUTONOME\.bat$/,
  /^memoire\/decisions\.md$/,
];
export const estVerrouille = (cheminRel) => VERROUILLES.some((re) => re.test(cheminRel));

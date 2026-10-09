// Stop : avant que Claude rende la main.
//  1. Aucun secret dans les fichiers qui partiraient sur GitHub : sinon Claude
//     reprend la main pour le retirer (une fois ; ensuite il le signale).
//  2. Boucle autonome : si .claude/boucle.json est actif et qu'il reste des
//     tâches « à faire » ou « en cours » dans app/specs/07-TACHES.md, Claude
//     ne s'arrête pas et passe à la suivante. Garde-fous : un nombre maximal
//     de tours, et l'arrêt si trois tours de suite ne changent rien (ni
//     commit, ni état d'une tâche) : c'est qu'il est bloqué, il l'a écrit
//     dans memoire/questions.md.
// Même principe que l'extension officielle « ralph-wiggum » de Claude Code
// (un crochet Stop qui relance), mais pilotée par la liste de tâches du dépôt.
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { RACINE, lireEntree, taches, restantes, eligibles } from './commun.mjs';
import { chercher } from '../../scripts/verifier-secrets.mjs';

const e = lireEntree();

const secrets = chercher(RACINE);
if (secrets.length && !e.stop_hook_active) {
  process.stderr.write(`Avant de t'arrêter : secret probable dans ${secrets.map((s) => `${s.fichier}:${s.ligne} (${s.id})`).join(', ')}. Le retirer (le .env local seulement), puis continuer.\n`);
  process.exit(2);
}

const fBoucle = join(RACINE, '.claude', 'boucle.json');
if (!existsSync(fBoucle)) process.exit(0);
let b;
try { b = JSON.parse(readFileSync(fBoucle, 'utf8')); } catch { process.exit(0); }
if (!b.actif) process.exit(0);

const liste = taches();
const reste = restantes(liste);
let tete = '';
try { tete = execFileSync('git', ['-C', RACINE, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* pas de git */ }
const signature = tete + '|' + liste.map((t) => t.id + ':' + t.etat).join(',');
b.stagnation = signature === b.signature ? (b.stagnation || 0) + 1 : 0;
b.signature = signature;
b.tours = (b.tours || 0) + 1;
const max = b.max || 300;

const arreter = (raison) => {
  b.actif = false; b.fin = new Date().toISOString(); b.raison = raison;
  writeFileSync(fBoucle, JSON.stringify(b, null, 2));
  try {
    appendFileSync(join(RACINE, 'memoire', 'journal.md'), `\n- ${new Date().toISOString().slice(0, 16)} : boucle autonome arrêtée après ${b.tours} tours : ${raison}.\n`);
  } catch { /* le journal manque : on s'arrête quand même */ }
  process.stdout.write(`Boucle autonome arrêtée : ${raison}.\n`);
  process.exit(0);
};

if (!reste.length) arreter('plus aucune tâche à faire (les bloquées attendent Fabrice : memoire/actions-fabrice.md)');
if (b.tours > max) arreter(`nombre maximal de tours atteint (${max})`);
if (b.stagnation >= 3) arreter('trois tours sans aucun changement (ni commit, ni état de tâche) : blocage à lire dans memoire/questions.md');
const prenables = eligibles(liste);
if (!prenables.length) arreter(`les ${reste.length} tâche(s) restante(s) attendent des tâches bloquées (memoire/actions-fabrice.md)`);

writeFileSync(fBoucle, JSON.stringify(b, null, 2));
const suivante = prenables[0];
process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: `Boucle autonome, tour ${b.tours}/${max}. Ne t'arrête pas. Tâche suivante : ${suivante.id} ${suivante.titre}. `
    + 'Suivre CLAUDE.md, section « Travailler seul » : lire la tâche dans app/specs/07-TACHES.md, la faire, prouver avec sa commande, '
    + 'mettre à jour son état, lancer node scripts/essais.mjs, enregistrer et pousser (git add, commit, push). '
    + 'Si elle dépend de Fabrice : la marquer « bloqué », écrire le besoin dans memoire/actions-fabrice.md, passer à la suivante.'
    + (b.stagnation ? ` Attention : ${b.stagnation} tour(s) sans changement ; au troisième la boucle s'arrête.` : ''),
}));
process.exit(0);

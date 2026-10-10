// Stop : avant que Claude rende la main.
//  1. Aucun secret dans les fichiers qui partiraient sur GitHub : sinon Claude
//     reprend la main pour le retirer (une fois ; ensuite il le signale).
//  2. Boucle autonome : si .claude/boucle.json est actif et qu'il reste des
//     tâches « à faire » ou « en cours » dans app/specs/07-TACHES.md, Claude
//     ne s'arrête pas et passe à la suivante. Garde-fous : un nombre maximal
//     de tours, et l'arrêt si trois tours de suite ne changent rien (ni
//     commit, ni état d'une tâche) : c'est qu'il est bloqué, il l'a écrit
//     dans memoire/questions.md.
//  3. Budget de panne (décision de Fabrice du 10 oct. 2026 : 3 approches ou
//     45 minutes) : une même tâche « en cours » depuis plus de 45 minutes reçoit
//     un avertissement ; à 60 minutes, le crochet la passe lui-même « bloqué »,
//     « Bloqué par » = panne, l'écrit au journal, et la boucle passe à la
//     suivante. scripts/autonome.mjs la rouvre le lendemain (3 fois au plus).
// Même principe que l'extension officielle « ralph-wiggum » de Claude Code
// (un crochet Stop qui relance), mais pilotée par la liste de tâches du dépôt.
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { RACINE, lireEntree, taches, restantes, eligibles, changerEtat } from './commun.mjs';
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

// Budget de panne
const BUDGET_MIN = Number(process.env.SITO_BUDGET_MINUTES || 45);
const maintenant = Date.now();
const enCours = liste.find((t) => t.etat.startsWith('en cours'));
// Suivi à part de .claude/boucle.json (que /travailler réécrit à chaque lancement).
const fBudget = join(RACINE, '.claude', 'budget.json');
let bu = {};
try { bu = JSON.parse(readFileSync(fBudget, 'utf8')); } catch { /* premier tour */ }
let avis = '';
if (enCours) {
  if (bu.tache !== enCours.id) { bu.tache = enCours.id; bu.debutTache = maintenant; bu.avertie = false; }
  const minutes = (maintenant - (bu.debutTache || maintenant)) / 60000;
  if (minutes >= BUDGET_MIN * 4 / 3) {
    changerEtat(enCours.id, 'bloqué', 'panne');
    try {
      appendFileSync(join(RACINE, 'memoire', 'journal.md'), `\n- ${new Date().toISOString().slice(0, 16)} : ${enCours.id} passée « bloqué » (panne) par le crochet de fin : budget de ${BUDGET_MIN} minutes dépassé. Le diagnostic doit être écrit au-dessus ; nouvelle tentative le lendemain (scripts/autonome.mjs).\n`);
    } catch { /* journal absent */ }
    avis = `${enCours.id} a dépassé le budget de panne : elle est passée « bloqué » (panne). Écrire maintenant son diagnostic dans memoire/journal.md et memoire/pieges.md (ajout seul), annuler par git revert ce qui casse les essais s'il y en a, enregistrer et pousser, puis prendre la suivante. `;
    bu.tache = null; bu.avertie = false;
  } else if (minutes >= BUDGET_MIN && !bu.avertie) {
    bu.avertie = true;
    avis = `${enCours.id} est « en cours » depuis ${Math.round(minutes)} minutes (budget : ${BUDGET_MIN}). Appliquer la fin de .claude/skills/depanner/SKILL.md : si la panne n'est pas réglée dans les minutes qui viennent, passer ${enCours.id} « bloqué » avec « panne », écrire le diagnostic, et passer à la suivante. `;
  }
} else { bu.tache = null; bu.avertie = false; }
try { writeFileSync(fBudget, JSON.stringify(bu)); } catch { /* lecture seule */ }
const listeApres = avis ? taches() : liste;

if (!restantes(listeApres).length) arreter('plus aucune tâche à faire (les bloquées attendent Fabrice : memoire/actions-fabrice.md)');
if (b.tours > max) arreter(`nombre maximal de tours atteint (${max})`);
if (b.stagnation >= 3) arreter('trois tours sans aucun changement (ni commit, ni état de tâche) : blocage à lire dans memoire/questions.md');
const prenables = eligibles(listeApres);
if (!prenables.length) arreter(`les ${reste.length} tâche(s) restante(s) attendent des tâches bloquées (memoire/actions-fabrice.md)`);

writeFileSync(fBoucle, JSON.stringify(b, null, 2));
const suivante = prenables[0];
process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: `Boucle autonome, tour ${b.tours}/${max}. ${avis}Ne t'arrête pas. Tâche suivante : ${suivante.id} ${suivante.titre}. `
    + 'Suivre CLAUDE.md, section « Travailler seul » : lire la tâche dans app/specs/07-TACHES.md, la faire, prouver avec sa commande, '
    + 'mettre à jour son état, lancer node scripts/essais.mjs, enregistrer et pousser (git add, commit, push). '
    + 'Une panne (essai rouge, commande en échec, erreur inconnue) : .claude/skills/depanner/SKILL.md. '
    + 'Si elle dépend de Fabrice : la marquer « bloqué », écrire le besoin dans memoire/actions-fabrice.md, passer à la suivante.'
    + (b.stagnation ? ` Attention : ${b.stagnation} tour(s) sans changement ; au troisième la boucle s'arrête.` : ''),
}));
process.exit(0);

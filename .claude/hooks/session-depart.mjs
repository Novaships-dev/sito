// SessionStart : ce que Claude doit savoir avant toute chose. Le texte écrit
// ici entre dans son contexte.
import { lire, taches, restantes, eligibles } from './commun.mjs';

const morceaux = [];
const maintenant = lire('memoire/maintenant.md');
if (maintenant) morceaux.push(maintenant.trim());

const pieges = lire('memoire/pieges.md');
if (pieges) morceaux.push('## Pièges connus (extrait, le fichier entier est memoire/pieges.md)\n' + pieges.split('\n').slice(0, 60).join('\n'));

const liste = taches();
const reste = restantes(liste);
if (liste.length) {
  const bloquees = liste.filter((t) => t.etat.startsWith('bloqué'));
  morceaux.push(`## Tâches (app/specs/07-TACHES.md)\n${liste.filter((t) => t.etat.startsWith('fait')).length} faites, ${reste.length} à faire ou en cours, ${bloquees.length} bloquées.\n`
    + 'Prenables maintenant : ' + (eligibles(liste).slice(0, 5).map((t) => `${t.id} ${t.titre.slice(0, 90)}`).join(' ; ') || 'aucune'));
}

const questions = lire('memoire/questions.md');
if (questions) {
  const ouvertes = (questions.match(/^## Q\d+.*\(ouverte\)/gm) || []).length;
  if (ouvertes) morceaux.push(`## Questions ouvertes pour Fabrice : ${ouvertes} (memoire/questions.md). Ne pas attendre la réponse : passer à une tâche non bloquée.`);
}

const boucle = lire('.claude/boucle.json');
if (boucle) morceaux.push('## Boucle autonome active (.claude/boucle.json) : enchaîner les tâches selon CLAUDE.md, section « Travailler seul ».');

process.stdout.write(morceaux.join('\n\n') + '\n');
process.exit(0);

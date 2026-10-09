// PreCompact : le compactage efface du contexte. On note l'état avant.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { RACINE, taches, restantes } from './commun.mjs';

const d = new Date();
const paris = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' }).format(d).replace(' ', '-').replace(':', 'h');
let statut = '';
try { statut = execFileSync('git', ['-C', RACINE, 'status', '--short'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { statut = '(git indisponible)'; }
const reste = restantes(taches());
const dossier = join(RACINE, 'memoire', 'sessions');
mkdirSync(dossier, { recursive: true });
const f = join(dossier, `${paris}-avant-compactage.md`);
writeFileSync(f, `# Avant compactage, ${paris} (heure de Paris)

## Tâches restantes
${reste.slice(0, 10).map((t) => `- ${t.id} ${t.titre} (${t.etat})`).join('\n') || '- aucune'}

## Fichiers modifiés, non enregistrés
\`\`\`
${statut.trim() || 'rien'}
\`\`\`

## Ce qui a marché / ce qui a été tenté sans succès / ce qui reste
(à compléter par Claude juste après le compactage)
`);
process.stdout.write(`État noté dans memoire/sessions/${paris}-avant-compactage.md. Après le compactage : relire CLAUDE.md, la tâche en cours dans app/specs/07-TACHES.md, et compléter ce fichier.\n`);
process.exit(0);

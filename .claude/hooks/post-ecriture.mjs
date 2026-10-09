// PostToolUse après Write/Edit : contrôle immédiat du fichier écrit.
// Sortie 2 = le message est montré à Claude, qui corrige tout de suite.
//   - secrets : aucun, nulle part ;
//   - textes publiés et textes de l'app : règles FR (scripts/verifier-textes.mjs).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { RACINE, lireEntree, rel } from './commun.mjs';
import { secretsDansTexte } from '../../scripts/verifier-secrets.mjs';

const e = lireEntree();
const chemin = (e.tool_input || {}).file_path || '';
if (!chemin) process.exit(0);
const r = rel(chemin);
const p = join(RACINE, r);
if (!existsSync(p)) process.exit(0);

const problemes = [];
let texte = '';
try { texte = readFileSync(p, 'utf8'); } catch { process.exit(0); }

if (!/^\.env/.test(r.split('/').pop())) {
  const ids = secretsDansTexte(texte);
  if (ids.length) problemes.push(`Secret probable dans ${r} (${ids.join(', ')}). Le retirer : les secrets vivent dans le .env local seulement.`);
}

// Même portée que scripts/verifier-textes.mjs : la documentation interne est exclue.
const DOC = /^(docs|memoire|rules|banque|app\/specs|\.claude)\/|^app\/(README|PLAN-APP)\.md$|references\//;
if (/\.(html|md|astro|jsx|tsx|ts|vue|liquid|txt)$/.test(r) && !DOC.test(r) && !r.startsWith('scripts/')) {
  const v = spawnSync(process.execPath, [join(RACINE, 'scripts/verifier-textes.mjs'), p], { encoding: 'utf8' });
  if (v.status === 1) problemes.push(`Règles de rédaction (rules/common/redaction-fr.md) :\n${v.stdout.trim()}`);
}

if (problemes.length) { process.stderr.write(problemes.join('\n\n') + '\n'); process.exit(2); }
process.exit(0);

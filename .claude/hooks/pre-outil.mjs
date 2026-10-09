// PreToolUse : refuse (sortie 2) ce qui ne doit jamais arriver, quel que soit
// le mode de permission. Le message de refus est lu par Claude.
//   - lire ou écrire un .env (sauf .env.example) : les secrets ne passent pas par l'agent ;
//   - réécrire le passé de decisions.md, pieges.md, journal.md, questions.md (ajout seul) ;
//   - modifier une migration déjà écrite (on en écrit une nouvelle) ;
//   - créer un nouveau .md à la racine.
import { existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { RACINE, lireEntree, rel, refuser } from './commun.mjs';

const e = lireEntree();
const outil = e.tool_name || '';
const ti = e.tool_input || {};

const estEnv = (nom) => /^\.env(\..+)?$/.test(nom) && nom !== '.env.example';

if (outil === 'Bash' || outil === 'PowerShell') {
  const cmd = String(ti.command || '');
  // cat .env, type .env, Get-Content .env, source .env… : un .env ne s'affiche pas.
  if (/(^|[\s'"=/\\])\.env(\.(?!example)[\w.-]+)?(?=$|[\s'";|&>)])/.test(cmd)) {
    refuser('Commande refusée : elle touche un fichier .env. Les secrets ne passent jamais par l’agent ; les scripts les lisent eux-mêmes (scripts/env.mjs).');
  }
  process.exit(0);
}

const chemin = ti.file_path || ti.notebook_path || ti.path || '';
if (!chemin) process.exit(0);
const r = rel(chemin);
const nom = basename(r);

if (estEnv(nom)) refuser(`${r} : refusé. Les secrets ne passent jamais par l’agent. Ce qu’il faut y mettre est dans .env.example ; c’est Fabrice qui remplit (memoire/actions-fabrice.md).`);

if (outil === 'Read' || outil === 'Glob' || outil === 'Grep') process.exit(0);

// Ajout seul
const AJOUT_SEUL = ['memoire/decisions.md', 'memoire/pieges.md', 'memoire/journal.md', 'memoire/questions.md'];
if (AJOUT_SEUL.includes(r)) {
  const p = join(RACINE, r);
  const avant = existsSync(p) ? readFileSync(p, 'utf8') : '';
  if (outil === 'Write') {
    const apres = String(ti.content || '');
    if (avant && !apres.replace(/\r\n/g, '\n').startsWith(avant.replace(/\r\n/g, '\n').trimEnd())) {
      refuser(`${r} est en ajout seul : le nouveau contenu doit commencer par l’ancien, intact. Ajouter une entrée datée à la fin.`);
    }
  } else if (outil === 'Edit' || outil === 'MultiEdit') {
    const edits = outil === 'MultiEdit' ? (ti.edits || []) : [ti];
    for (const ed of edits) {
      if (!String(ed.new_string || '').includes(String(ed.old_string || ''))) {
        refuser(`${r} est en ajout seul : une modification doit garder le texte existant (old_string) et seulement ajouter. Pour corriger une entrée, en ajouter une nouvelle qui la remplace.`);
      }
    }
  }
}

// Une migration qui existe déjà ne se modifie pas.
if (/^supabase\/migrations\/[^/]+\.sql$/.test(r) && existsSync(join(RACINE, r))) {
  refuser(`${r} existe déjà : une migration appliquée ne se modifie jamais. Écrire une nouvelle migration (voir .claude/skills/sito-base/SKILL.md).`);
}

// Pas de nouveau .md à la racine.
if (!r.includes('/') && nom.endsWith('.md') && !existsSync(join(RACINE, r))) {
  const PERMIS = ['README.md', 'CLAUDE.md', 'AGENTS.md', 'SECURITY.md', 'CHANGELOG.md'];
  if (!PERMIS.includes(nom)) refuser(`Pas de nouveau .md à la racine (${nom}). Ranger dans docs/ ou memoire/.`);
}

process.exit(0);

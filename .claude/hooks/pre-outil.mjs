// PreToolUse : refuse (sortie 2) ce qui ne doit jamais arriver. La doc de
// Claude Code : ce crochet tourne avant toute vérification d'autorisation, dans
// tous les modes (auto, sans autorisation compris). Le message de refus est lu
// par Claude, qui doit trouver une autre voie.
//
//   - lire ou écrire un .env (sauf .env.example) : les secrets ne passent pas par l'agent ;
//   - modifier un garde-fou verrouillé (commun.mjs, VERROUILLES) : décision de Fabrice du 10 oct. 2026 ;
//   - réécrire le passé de pieges.md, journal.md, questions.md (ajout seul) ;
//   - modifier une migration déjà écrite (on en écrit une nouvelle) ;
//   - créer un nouveau .md à la racine ;
//   - commandes destructrices ou dangereuses : push forcé, historique réécrit,
//     suppression hors du dépôt, droits d'administrateur, script téléchargé
//     puis exécuté, clés de paiement réelles ;
//   - outils MCP : seulement Supabase (sans destruction de données) et Playwright.
import { existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { RACINE, lireEntree, rel, refuser, estVerrouille } from './commun.mjs';

const e = lireEntree();
const outil = e.tool_name || '';
const ti = e.tool_input || {};

const estEnv = (nom) => /^\.env(\..+)?$/.test(nom) && nom !== '.env.example';
const VERROU = (r) => `${r} est un garde-fou verrouillé (décision de Fabrice du 10 octobre 2026) : Claude Code ne le modifie pas. Si ce garde-fou empêche un travail légitime, l'écrire dans memoire/questions.md avec la modification proposée, passer la tâche « bloqué » et continuer avec la suivante.`;

// ---------------------------------------------------------------- outils MCP
if (outil.startsWith('mcp__')) {
  if (!/^mcp__(claude_ai_)?(supabase|playwright)__/i.test(outil)) {
    refuser(`${outil} : refusé. Dans ce dépôt, Claude Code n'utilise que Supabase et Playwright. Les autres connecteurs (e-mail, agenda, achats de domaines, déploiements…) agissent au nom de Fabrice : c'est à lui.`);
  }
  if (/supabase/i.test(outil)) {
    if (/__(create|delete|pause|restore|merge|reset|rebase)_(project|branch)$|__confirm_cost$/i.test(outil)) {
      refuser(`${outil} : refusé (projet, branche ou coût Supabase : action de Fabrice, memoire/actions-fabrice.md).`);
    }
    const sql = String(ti.query || ti.sql || '');
    const DESTRUCTION = /\b(drop\s+(table|schema|database|owned)|truncate\b)|\bdelete\s+from\s+[\w."]+\s*(;|$)|\bdelete\s+from\s+auth\./i;
    if (sql && DESTRUCTION.test(sql.replace(/--[^\n]*/g, ''))) {
      refuser(`${outil} : refusé, la requête supprime des données de la vraie base (DROP TABLE, TRUNCATE, DELETE sans WHERE). Écrire une migration qui garde les données, ou essayer sur une copie (faux Supabase, données de démonstration).`);
    }
  }
  process.exit(0);
}

// ---------------------------------------------------------------- commandes
if (outil === 'Bash' || outil === 'PowerShell') {
  const cmd = String(ti.command || '');

  // cat .env, type .env, Get-Content .env, source .env… : un .env ne s'affiche pas.
  if (/(^|[\s'"=/\\])\.env(\.(?!example)[\w.-]+)?(?=$|[\s'";|&>)])/.test(cmd)) {
    refuser('Commande refusée : elle touche un fichier .env. Les secrets ne passent jamais par l’agent ; les scripts les lisent eux-mêmes (scripts/env.mjs).');
  }

  const INTERDITS = [
    [/\bgit\b[^;&|\n]*\bpush\b[^;&|\n]*(\s--force(-with-lease)?\b|\s-f\b|\s\+[\w/]|\s--delete\b|\s:[\w/])/i, 'push forcé ou suppression de branche distante : l’historique de GitHub ne se réécrit pas'],
    [/\bgit\b[^;&|\n]*\b(reset\s+--hard|clean\s+-\w*f|filter-branch|filter-repo|rebase\b|branch\s+-D\b|update-ref\s+-d|reflog\s+expire|gc\b[^;&|\n]*--prune)/i, 'réécriture ou effacement de l’historique Git : pour annuler un changement, `git revert <commit>`'],
    [/\bgit\s+lfs\b/i, 'Git LFS est exclu (décision de Fabrice)'],
    [/\b(sudo|runas|doas)\b|-Verb\s+RunAs|Set-ExecutionPolicy|\breg(\.exe)?\s+(add|delete|import)\b|HKLM:|\b(bcdedit|diskpart|netsh|shutdown|format\.com)\b/i, 'droits d’administrateur ou réglage du système : installer sans droits d’administrateur (npm, pip --user, winget --scope user), sinon action de Fabrice'],
    [/\b(curl|wget|irm|iwr|Invoke-RestMethod|Invoke-WebRequest)\b[^|\n]*\|\s*(sudo\s+)?(sh|bash|zsh|iex|Invoke-Expression|python3?|node|pwsh|powershell)\b|\biex\s*\(|Invoke-Expression/i, 'script téléchargé puis exécuté sans être lu : télécharger dans un fichier, le lire, puis installer par le gestionnaire de paquets'],
    [/\b[sr]k_live_|\bpk_live_|\s--live\b/i, 'clé ou mode de paiement réel : seul le mode test est permis (paiement réel = action de Fabrice)'],
    [/\bsupabase\s+(db\s+reset|projects\s+(delete|create)|orgs\s+create|link)\b/i, 'opération Supabase réservée à Fabrice (réinitialisation, projet, liaison)'],
    [/\bnpm\s+(publish|unpublish|deprecate)\b/i, 'publication d’un paquet npm'],
    [/\bapi\.gandi\.net\b(?![^\n]*sandbox)[^\n]*(-X\s*(POST|PUT|PATCH|DELETE)|--data|\s-d\s)/i, 'écriture sur l’API Gandi réelle (achat de domaine) : utiliser le bac à sable (api.sandbox.gandi.net)'],
  ];
  for (const [re, pourquoi] of INTERDITS) if (re.test(cmd)) refuser(`Commande refusée : ${pourquoi}.`);

  // Suppressions larges hors du dépôt ou de .git.
  if (/\brm\b[^;&|\n]*\s-\w*r/i.test(cmd) || /Remove-Item\b[^;&|\n]*-Recurse/i.test(cmd) || /\brmdir\b[^;&|\n]*\/s/i.test(cmd)) {
    const cibles = cmd.split(/\s+/).map((t) => t.replace(/^['"]|['"]$/g, ''));
    const dangereuse = cibles.some((t) => /^(\/|~|\$HOME|%USERPROFILE%|[A-Za-z]:[\\/]?$|\.\.([\\/]|$)|\*$)/.test(t) && !t.startsWith('/tmp/')
      || /(^|[\\/])\.git([\\/]|$)/.test(t));
    if (dangereuse) refuser('Commande refusée : suppression récursive hors du dépôt, de tout le disque ou de .git. Supprimer seulement des fichiers du dépôt, nommés, ou un dossier temporaire.');
  }

  // Écriture d'un garde-fou verrouillé par une commande.
  const segments = cmd.split(/&&|\|\||;|\n|\|/);
  for (const seg of segments) {
    const jetons = seg.trim().split(/\s+/).map((t) => t.replace(/^['"(]+|['")]+$/g, '')).filter(Boolean);
    if (!jetons.length) continue;
    const verrouille = (t) => !t.startsWith('-') && estVerrouille(rel(t));
    const premier = jetons[0].toLowerCase();
    const sansOptions = jetons.filter((t) => !t.startsWith('-'));
    let touche = false;
    if (['cp', 'mv', 'install', 'rsync', 'copy-item', 'move-item', 'copy', 'move', 'ln'].includes(premier)) touche = verrouille(sansOptions[sansOptions.length - 1] || '');
    else if (['rm', 'unlink', 'truncate', 'chmod', 'remove-item', 'rename-item', 'del', 'erase', 'tee', 'set-content', 'add-content', 'out-file', 'new-item', 'clear-content'].includes(premier)) touche = jetons.slice(1).some(verrouille);
    else if (/^(sed|perl)$/.test(premier) && jetons.some((t) => /^-\w*i/.test(t))) touche = jetons.slice(1).some(verrouille);
    else if (premier === 'git' && /^(checkout|restore|rm|mv|apply)$/.test(jetons[1] || '')) touche = jetons.slice(2).some(verrouille);
    else if (/writeFile|appendFile|open\s*\(|\.write_text|\.write\(|Set-Content|Out-File/.test(seg)) touche = jetons.some(verrouille) || /['"][^'"]*(\.claude[\\/](hooks|settings)|verifier-secrets|essai-outillage|autonome\.mjs|git-hooks|decisions\.md)/.test(seg);
    const redir = seg.match(/>{1,2}\s*["']?([^\s"'|;&]+)/g) || [];
    if (redir.some((r) => verrouille(r.replace(/^>{1,2}\s*["']?/, '')))) touche = true;
    if (touche) refuser(VERROU('un fichier verrouillé (' + jetons.filter(verrouille).concat(redir).join(', ') + ')'));
  }
  process.exit(0);
}

// ---------------------------------------------------------------- fichiers
const chemin = ti.file_path || ti.notebook_path || ti.path || '';
if (!chemin) process.exit(0);
const r = rel(chemin);
const nom = basename(r);

if (estEnv(nom)) refuser(`${r} : refusé. Les secrets ne passent jamais par l’agent. Ce qu’il faut y mettre est dans .env.example ; c’est Fabrice qui remplit (memoire/actions-fabrice.md).`);

if (outil === 'Read' || outil === 'Glob' || outil === 'Grep') process.exit(0);

if (estVerrouille(r)) refuser(VERROU(r));

// Ajout seul
const AJOUT_SEUL = ['memoire/pieges.md', 'memoire/journal.md', 'memoire/questions.md'];
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

#!/usr/bin/env node
// Travail autonome de Claude Code sur Sitô, sans personne devant l'écran.
// Lancé par lanceurs\CLAUDE_AUTONOME.bat. Garde-fou verrouillé : Claude Code
// ne modifie pas ce fichier (.claude/hooks/commun.mjs, VERROUILLES).
//
// Pourquoi « sans fenêtre » (claude -p) : en session ouverte, le mode auto se
// remet à demander l'autorisation après 3 refus de suite ou 20 en tout (doc
// officielle, permission-modes) ; personne ne répondrait. Ici, une action
// refusée est sautée et Claude cherche une autre voie (--permission-prompts none).
//
// Décisions de Fabrice du 10 octobre 2026 : mode auto ; 20 lancements par jour
// au plus ; une tâche en panne est rouverte le lendemain.
//
// Boucle :
//   - tant qu'il reste une tâche prenable (app/specs/07-TACHES.md) ;
//   - au plus 20 lancements par jour de Paris ;
//   - arrêt après 3 lancements de suite sans aucun changement (ni commit, ni état) ;
//   - limite d'usage de l'abonnement atteinte : attente, sans compter le lancement ;
//   - chaque nouveau jour : les tâches « bloqué » par « panne » repassent « à faire »
//     (3 nouvelles tentatives au plus par tâche).
// Tout est écrit dans claude-autonome.log (racine, ignoré par Git) et l'état
// dans .claude/autonome.json (ignoré par Git).
//
// Variables pour les essais (scripts/essai-outillage.mjs) : SITO_CLAUDE_CMD
// (un faux claude, fichier .mjs), SITO_AUTONOME_PAUSE et SITO_AUTONOME_ATTENTE_LIMITE
// (secondes), SITO_AUTONOME_JOUR (forcer la date), SITO_AUTONOME_MAX_JOUR et
// SITO_AUTONOME_TOURS (un essai réel court : `/travailler <tours>`).
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE, taches, eligibles, changerEtat } from '../.claude/hooks/commun.mjs';

const WIN = process.platform === 'win32';
const MAX_JOUR = Number(process.env.SITO_AUTONOME_MAX_JOUR || 20);
const MAX_RELANCES_PANNE = 3;
const PAUSE = Number(process.env.SITO_AUTONOME_PAUSE ?? 30);
const ATTENTE_LIMITE = Number(process.env.SITO_AUTONOME_ATTENTE_LIMITE ?? 30 * 60);
const FICHIER_ETAT = join(RACINE, '.claude', 'autonome.json');
const JOURNAL = join(RACINE, 'claude-autonome.log');

const heure = () => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
const jourParis = () => process.env.SITO_AUTONOME_JOUR || new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
const noter = (texte) => { const l = `[${heure()}] ${texte}`; console.log(l); appendFileSync(JOURNAL, l + '\n'); };
const dormir = (s) => new Promise((r) => setTimeout(r, s * 1000));

const lireEtat = () => { try { return JSON.parse(readFileSync(FICHIER_ETAT, 'utf8')); } catch { return {}; } };
const ecrireEtat = (e) => writeFileSync(FICHIER_ETAT, JSON.stringify(e, null, 2));

function signature() {
  let tete = '';
  try { tete = execFileSync('git', ['-C', RACINE, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* pas de git */ }
  return tete + '|' + taches().map((t) => t.id + ':' + t.etat).join(',');
}

// Un lancement de Claude Code. Le flux JSON est résumé dans le journal :
// les outils appelés, le texte de Claude, le bilan de fin.
function lancer() {
  const tours = process.env.SITO_AUTONOME_TOURS;
  const args = ['-p', tours ? `/travailler ${tours}` : '/travailler', '--permission-mode', 'auto', '--permission-prompts', 'none', '--output-format', 'stream-json', '--verbose'];
  const faux = process.env.SITO_CLAUDE_CMD;
  const [cmd, liste, shell] = faux ? [process.execPath, [faux, ...args], false] : ['claude', args, WIN];
  return new Promise((fin) => {
    const p = spawn(cmd, liste, { cwd: RACINE, shell, stdio: ['ignore', 'pipe', 'pipe'] });
    let reste = '', texteFin = '', erreur = '';
    const ligne = (l) => {
      if (!l.trim()) return;
      let m;
      try { m = JSON.parse(l); } catch { appendFileSync(JOURNAL, '  ' + l.slice(0, 400) + '\n'); texteFin += l + '\n'; return; }
      if (m.type === 'system' && m.subtype === 'init') {
        noter(`  Claude Code ${m.claude_code_version || ''}, mode ${m.permissionMode || '?'}, modèle ${m.model || '?'}`);
      } else if (m.type === 'assistant') {
        for (const c of m.message?.content || []) {
          if (c.type === 'text' && c.text.trim()) appendFileSync(JOURNAL, '  Claude : ' + c.text.trim().replace(/\s+/g, ' ').slice(0, 300) + '\n');
          if (c.type === 'tool_use') appendFileSync(JOURNAL, `  outil ${c.name} ${JSON.stringify(c.input).slice(0, 160)}\n`);
        }
      } else if (m.type === 'result') {
        texteFin += String(m.result || '') + ' ' + String(m.subtype || '');
        noter(`  fin du lancement : ${m.subtype || '?'}, ${m.num_turns ?? '?'} tours${m.is_error ? ', ERREUR' : ''}`);
      }
    };
    p.stdout.on('data', (d) => { reste += d; const ls = reste.split('\n'); reste = ls.pop(); ls.forEach(ligne); });
    p.stderr.on('data', (d) => { erreur += d; appendFileSync(JOURNAL, '  ! ' + String(d).trim().slice(0, 400) + '\n'); });
    p.on('error', (e) => { erreur += e.message; fin({ code: -1, texte: e.message }); });
    p.on('close', (code) => { ligne(reste); fin({ code, texte: texteFin + ' ' + erreur }); });
  });
}

const LIMITE = /usage limit|rate.?limit|limit (will )?reset|quota|overloaded|\b429\b|\b529\b/i;

let etat = lireEtat();
noter('=== Travail autonome : début');
let attentesLimite = 0;
for (;;) {
  const jour = jourParis();
  if (etat.jour !== jour) {
    etat = { jour, lancements: 0, sansChangement: 0, relances: etat.relances || {} };
    for (const t of taches()) {
      if (t.etat.startsWith('bloqué') && /^panne/i.test(t.bloque) && (etat.relances[t.id] || 0) < MAX_RELANCES_PANNE) {
        changerEtat(t.id, 'à faire', '');
        etat.relances[t.id] = (etat.relances[t.id] || 0) + 1;
        noter(`${t.id} était en panne : nouvelle tentative (${etat.relances[t.id]}/${MAX_RELANCES_PANNE})`);
      }
    }
    ecrireEtat(etat);
  }
  if (etat.lancements >= MAX_JOUR) { noter(`Arrêt : ${MAX_JOUR} lancements aujourd'hui (décision de Fabrice). Reprise au prochain lancement, demain.`); break; }
  if (etat.sansChangement >= 3) { noter('Arrêt : 3 lancements de suite sans aucun changement. Le blocage est écrit dans memoire/questions.md ou memoire/journal.md.'); break; }
  const prenables = eligibles(taches());
  if (!prenables.length) { noter('Arrêt : plus aucune tâche faisable sans Fabrice (memoire/actions-fabrice.md).'); break; }

  etat.lancements++;
  ecrireEtat(etat);
  const avant = signature();
  noter(`Lancement ${etat.lancements}/${MAX_JOUR} : tâche prévue ${prenables[0].id} ${prenables[0].titre.slice(0, 80)}`);
  const r = await lancer();
  const apres = signature();

  if (r.code !== 0 && LIMITE.test(r.texte) && attentesLimite < MAX_JOUR) {
    attentesLimite++;
    etat.lancements--;
    ecrireEtat(etat);
    noter(`Limite d'usage de l'abonnement atteinte : attente de ${Math.round(ATTENTE_LIMITE / 60)} minutes (ce lancement ne compte pas).`);
    await dormir(ATTENTE_LIMITE);
    continue;
  }
  if (r.code !== 0) noter(`  Claude Code est sorti avec le code ${r.code}.`);
  etat.sansChangement = apres === avant ? (etat.sansChangement || 0) + 1 : 0;
  ecrireEtat(etat);
  noter(apres === avant ? `  aucun changement (${etat.sansChangement}/3)` : '  du travail a été enregistré');
  await dormir(PAUSE);
}
noter('=== Travail autonome : fin. Où il en est : memoire/maintenant.md');

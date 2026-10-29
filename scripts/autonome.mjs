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
//   - Internet coupé : attente sans limite (5 min, puis 15 min après une heure),
//     sans compter le lancement ni la stagnation ;
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

// Panne du 24 oct. : « You've hit your session limit · resets 5:10am » n'était
// pas reconnu ; trois lancements perdus, puis arrêt pour toute la journée.
const LIMITE = /usage limit|session limit|weekly limit|hit your [\w\s]*limit|rate.?limit|limit (will )?reset|resets? (at )?\d{1,2}(:\d{2})?\s*(am|pm)|quota|overloaded|\b429\b|\b529\b/i;

// Attente jusqu'à l'heure de reprise annoncée (« resets 5:10am », heure de
// Paris), plus 2 minutes ; sinon 30 minutes. Jamais plus de 6 heures d'un coup.
function attenteLimite(texte) {
  if (process.env.SITO_AUTONOME_ATTENTE_LIMITE !== undefined) return ATTENTE_LIMITE;
  const m = String(texte).match(/resets?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m) return ATTENTE_LIMITE;
  let h = Number(m[1]) % 12; if (m[3].toLowerCase() === 'pm') h += 12;
  const min = Number(m[2] || 0);
  const ici = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const cible = new Date(ici); cible.setHours(h, min + 2, 0, 0);
  if (cible <= ici) cible.setDate(cible.getDate() + 1);
  return Math.min(6 * 3600, Math.max(60, Math.round((cible - ici) / 1000)));
}

const RESEAU = /can't reach the api server|ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ECONNREFUSED|network error|socket hang up/i;
const ATTENTE_RESEAU = Number(process.env.SITO_AUTONOME_ATTENTE_RESEAU ?? 5 * 60);
const ATTENTE_RESEAU_LONGUE = Number(process.env.SITO_AUTONOME_ATTENTE_RESEAU ?? 15 * 60);
const CONNEXION = /failed to authenticate|oauth session expired|not logged in|please run \/login|invalid api key|authentication_error/i;

let etat = lireEtat();
// Un nouveau lancement par Fabrice repart de zéro pour la stagnation (le
// compteur de lancements du jour, lui, est gardé).
etat.sansChangement = 0;
noter('=== Travail autonome : début');
let attentesLimite = 0;
let attentesReseau = 0;
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

  if (CONNEXION.test(r.texte)) {
    etat.lancements--;
    ecrireEtat(etat);
    noter('Arrêt : Claude Code n\'est plus connecté au compte Claude de Fabrice. Action : lanceurs\\PREMIER_LANCEMENT.bat, se connecter (/login), puis relancer CLAUDE_AUTONOME.bat.');
    break;
  }
  // Panne du 21 oct. : Internet coupé sur le PC (ENOTFOUND), trois lancements
  // perdus puis arrêt. Une coupure réseau n'est pas un blocage : on attend et
  // on reprend, sans compter le lancement ni la stagnation.
  // Panne du 29 oct. : coupure de plus de 2 h (0 h 30 à 2 h 45) ; l'ancienne
  // limite de 24 attentes a compté les essais suivants comme « sans changement »
  // et tout arrêté à 1 h 52, onze heures perdues. Plus de limite : on attend
  // le retour d'Internet, 5 minutes entre deux essais, puis 15 après une heure.
  if (r.code !== 0 && RESEAU.test(r.texte)) {
    attentesReseau++;
    etat.lancements--;
    ecrireEtat(etat);
    const attente = attentesReseau <= 12 ? ATTENTE_RESEAU : ATTENTE_RESEAU_LONGUE;
    noter(`Internet coupé (Claude Code ne joint pas son serveur) : nouvel essai dans ${Math.round(attente / 60)} minutes (essai ${attentesReseau}, ce lancement ne compte pas).`);
    await dormir(attente);
    continue;
  }
  if (r.code === 0 || !RESEAU.test(r.texte)) attentesReseau = 0;
  if (r.code !== 0 && LIMITE.test(r.texte) && attentesLimite < MAX_JOUR) {
    attentesLimite++;
    etat.lancements--;
    ecrireEtat(etat);
    const attente = attenteLimite(r.texte);
    noter(`Limite d'usage de l'abonnement atteinte : reprise dans ${Math.round(attente / 60)} minutes (ce lancement ne compte pas).`);
    await dormir(attente);
    continue;
  }
  if (r.code !== 0) noter(`  Claude Code est sorti avec le code ${r.code}.`);
  etat.sansChangement = apres === avant ? (etat.sansChangement || 0) + 1 : 0;
  ecrireEtat(etat);
  noter(apres === avant ? `  aucun changement (${etat.sansChangement}/3)` : '  du travail a été enregistré');
  await dormir(PAUSE);
}
noter('=== Travail autonome : fin. Où il en est : memoire/maintenant.md');

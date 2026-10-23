// L'état de la CI GitHub (.github/workflows/essais.yml) vu depuis la machine.
//
// Pourquoi ce script : « une tâche n'est finie que si elle est verte dans la CI »
// (CLAUDE.md §4). Le dépôt est privé : l'API de GitHub refuse une demande sans
// jeton, et `gh` n'est pas installé. Ce script va chercher le jeton lui-même et
// ne l'affiche jamais — comme pour toutes les clés de Sitô, l'agent ne lit pas
// de secret (CLAUDE.md, Jamais 3).
//
// D'où vient le jeton, dans cet ordre :
//   1. GITHUB_JETON du .env (modèle : .env.example) ;
//   2. le gestionnaire d'identifiants de Git (`git credential fill`), celui qui
//      sert déjà à `git push` sur ce poste. Rien à installer, rien à coller.
//
//   node scripts/ci-github.mjs              le dernier passage sur main
//   node scripts/ci-github.mjs --tous       les cinq derniers passages
//   node scripts/ci-github.mjs --journal    + le journal des étapes en échec
//   node scripts/ci-github.mjs --ecrire     + la ligne du verdict ajoutée à
//                                           memoire/essais/derniers.txt (à
//                                           lancer après scripts/essais.mjs,
//                                           qui réécrit ce fichier)
//
// Sorties : 0 dernier passage vert, 1 rouge, 2 en cours ou jamais lancé,
// 3 pas de jeton (dit quoi faire), 4 l'API a refusé.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { chargerEnv, RACINE } from './env.mjs';

const TOUS = process.argv.includes('--tous');
const JOURNAL = process.argv.includes('--journal');
const ECRIRE = process.argv.includes('--ecrire');

// --------------------------------------------------------------- dépôt et jeton
function depot() {
  const r = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
  const m = (r.stdout || '').match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?\s*$/);
  if (!m) { console.error('Dépôt distant GitHub introuvable (git remote get-url origin).'); process.exit(3); }
  return { proprietaire: m[1], nom: m[2] };
}

// Jamais affiché, jamais écrit : la valeur ne sort pas de cette fonction.
function jeton() {
  chargerEnv();
  if (process.env.GITHUB_JETON) return { valeur: process.env.GITHUB_JETON, source: '.env (GITHUB_JETON)' };
  const r = spawnSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' });
  const m = (r.stdout || '').match(/^password=(.+)$/m);
  if (m) return { valeur: m[1], source: 'gestionnaire d’identifiants de Git' };
  console.error('Aucun jeton GitHub : ni GITHUB_JETON dans .env, ni identifiant enregistré pour github.com.');
  console.error('Pour : lire l’état de la CI d’un dépôt privé.');
  console.error('À faire : soit un `git push` une fois (le gestionnaire enregistre l’identifiant),');
  console.error('soit un jeton à portée fine (Actions : lecture seule) dans .env (modèle : .env.example).');
  process.exit(3);
}

const { proprietaire, nom } = depot();
const JETON = jeton();

// Une erreur d'API s'annonce et fixe le code de sortie ; on ne coupe jamais le
// processus au milieu d'un appel réseau. `process.exit()` pendant qu'une
// connexion se ferme fait mourir Node sous Windows sur une assertion de libuv
// (« UV_HANDLE_CLOSING », code 127) : le verdict serait perdu.
class Refus extends Error {}

// SITO_CI_API : une autre adresse d'API (faux GitHub local) pour essayer le
// verdict rouge sans attendre une vraie panne de la CI.
const API = process.env.SITO_CI_API || 'https://api.github.com';

async function api(chemin, brut = false) {
  const r = await fetch(`${API}/repos/${proprietaire}/${nom}${chemin}`, {
    headers: {
      Accept: brut ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      Authorization: `Bearer ${JETON.valeur}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'sito-ci',
    },
    redirect: 'follow',
  });
  if (!r.ok) {
    console.error(`GitHub a refusé : ${r.status} ${r.statusText} (${chemin}).`);
    if (r.status === 401 || r.status === 403) console.error('Le jeton n’a pas le droit « Actions : lecture » sur ce dépôt.');
    throw new Refus(`${r.status} ${chemin}`);
  }
  return brut ? r.text() : r.json();
}

// ------------------------------------------------------------------- affichage
const heure = (iso) => new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
const etat = (r) => (r.status === 'completed' ? r.conclusion : r.status);

async function verdict() {
  console.log(`CI de ${proprietaire}/${nom}, workflow essais.yml (jeton : ${JETON.source})`);

  const { workflow_runs: passages = [] } = await api('/actions/workflows/essais.yml/runs?per_page=5');
  if (!passages.length) { console.log('Aucun passage : le workflow ne s’est jamais lancé.'); return 2; }

  for (const r of TOUS ? passages : passages.slice(0, 1)) {
    console.log(`  #${r.run_number}  ${etat(r).padEnd(12)} ${r.head_sha.slice(0, 7)}  ${r.event}  ${heure(r.created_at)}`);
    console.log(`      ${r.head_commit?.message.split('\n')[0] ?? ''}`);
    console.log(`      ${r.html_url}`);
  }

  const dernier = passages[0];

  if (JOURNAL && etat(dernier) !== 'success') {
    const { jobs = [] } = await api(`/actions/runs/${dernier.id}/jobs`);
    for (const j of jobs) {
      console.log(`\n  tâche « ${j.name} » : ${etat(j)}`);
      for (const e of j.steps || []) if (etat(e) !== 'success' && etat(e) !== 'skipped') console.log(`    étape « ${e.name} » : ${etat(e)}`);
      if (j.conclusion !== 'success') {
        const texte = await api(`/actions/jobs/${j.id}/logs`, true).catch(() => '');
        const lignes = texte.split('\n').filter((l) => l.trim());
        console.log(`\n  --- fin du journal de « ${j.name} » (${lignes.length} lignes en tout) ---`);
        for (const l of lignes.slice(-120)) console.log(`  ${l}`);
      }
    }
  }

  const resume = `CI GitHub (essais.yml) : passage #${dernier.run_number}, ${etat(dernier).toUpperCase()}, commit ${dernier.head_sha.slice(0, 7)}, ${heure(dernier.created_at)} — ${dernier.html_url}`;
  if (ECRIRE) {
    const f = join(RACINE, 'memoire', 'essais', 'derniers.txt');
    if (existsSync(f)) { appendFileSync(f, `\n${resume}\n`); console.log(`\n(ajouté à memoire/essais/derniers.txt)`); }
    else console.error('\nmemoire/essais/derniers.txt absent : lancer node scripts/essais.mjs avant --ecrire.');
  }

  if (etat(dernier) === 'success') { console.log('\nDernier passage : VERT.'); return 0; }
  if (dernier.status !== 'completed') { console.log(`\nDernier passage : ${dernier.status} (pas encore de verdict).`); return 2; }
  console.log(`\nDernier passage : ${dernier.conclusion.toUpperCase()}.`);
  return 1;
}

try {
  process.exitCode = await verdict();
} catch (e) {
  process.exitCode = e instanceof Refus ? 4 : 1;
  if (!(e instanceof Refus)) console.error(`Panne : ${e.message}`);
}

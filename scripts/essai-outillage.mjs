#!/usr/bin/env node
// Essai de l'outillage de Claude Code (.claude/) et des scripts qui l'entourent.
// Il ne lit pas ce que les crochets disent d'eux-mêmes : il leur envoie de
// vraies entrées (le JSON que Claude Code leur passe) et mesure leur sortie.
//
//   node scripts/essai-outillage.mjs                 tous les essais
//   node scripts/essai-outillage.mjs --contre-essai  les mêmes essais sur une copie
//                                                    cassée exprès : ils doivent rougir
//
// Leçon de StructorAI : trois crochets n'ont jamais tourné (clé inventée) et
// un contrôle visait un dossier inexistant (faux vert permanent).
import { mkdtempSync, cpSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (c, quoi, detail = '') => { essais++; if (c) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` : ${detail}` : ''}`); } };

// ---------------------------------------------------------------- une copie de travail
const tmp = mkdtempSync(join(tmpdir(), 'sito-outillage-'));
for (const d of ['.claude/hooks', 'scripts', 'memoire']) cpSync(join(RACINE, d), join(tmp, d), { recursive: true });
cpSync(join(RACINE, '.claude/settings.json'), join(tmp, '.claude/settings.json'));
mkdirSync(join(tmp, 'app/specs'), { recursive: true });
mkdirSync(join(tmp, 'app/src'), { recursive: true });
mkdirSync(join(tmp, 'supabase/migrations'), { recursive: true });
writeFileSync(join(tmp, 'supabase/migrations/20260101000000_ancienne.sql'), 'select 1;\n');
writeFileSync(join(tmp, 'README.md'), '# essai\n');
writeFileSync(join(tmp, 'memoire/pieges.md'), '# Pièges\n\n| a | b |\n');
writeFileSync(join(tmp, 'memoire/questions.md'), '# Questions\n');
const TACHES = (e1, e2) => `# Tâches\n\n| N° | Tâche | État | Preuve | Dépend | Bloqué par |\n|---|---|---|---|---|---|\n| T01 | Première | ${e1} | x | | |\n| T02 | Deuxième | ${e2} | x | | |\n| T03 | Troisième | bloqué | x | | F2 |\n`;
writeFileSync(join(tmp, 'app/specs/07-TACHES.md'), TACHES('fait', 'à faire'));

if (CONTRE) {
  // Copie cassée : le crochet de refus ne refuse plus rien, la boucle ne relance plus.
  writeFileSync(join(tmp, '.claude/hooks/pre-outil.mjs'), 'process.exit(0);\n');
  writeFileSync(join(tmp, '.claude/hooks/fin.mjs'), 'process.exit(0);\n');
  console.log('Contre-essai : crochets remplacés par des crochets vides. Les essais doivent rougir.');
}

function crochet(nom, entree, env = {}) {
  const r = spawnSync(process.execPath, [join(tmp, '.claude/hooks', nom)], {
    input: JSON.stringify(entree), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: tmp, ...env }, cwd: tmp,
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const ecrire = (chemin, contenu) => ({ tool_name: 'Write', tool_input: { file_path: join(tmp, chemin), content: contenu } });

// ---------------------------------------------------------------- réglages
console.log('\nRéglages (.claude/settings.json)');
const reglages = JSON.parse(readFileSync(join(RACINE, '.claude/settings.json'), 'utf8'));
const CONNUES = ['$schema', 'permissions', 'hooks', 'env', 'model', 'enabledMcpjsonServers', 'enableAllProjectMcpServers'];
ok(Object.keys(reglages).every((k) => CONNUES.includes(k)), 'aucune clé inventée (seulement des clés du schéma officiel)', Object.keys(reglages).join(','));
const scripts = [];
for (const groupes of Object.values(reglages.hooks || {})) for (const g of groupes) for (const h of g.hooks) scripts.push((h.args || [])[0] || h.command);
ok(scripts.length >= 5 && scripts.every((s) => existsSync(join(RACINE, s.replace('${CLAUDE_PROJECT_DIR}/', '')))), 'chaque crochet branché existe dans le dépôt', scripts.join(', '));
ok(['SessionStart', 'PreToolUse', 'PostToolUse', 'PreCompact', 'Stop'].every((e) => reglages.hooks?.[e]), 'les cinq moments sont branchés');
ok((reglages.permissions?.deny || []).includes('Read(./.env)'), 'lecture du .env refusée par les permissions aussi');

// ---------------------------------------------------------------- avant un outil
console.log('\nAvant un outil (pre-outil.mjs)');
ok(crochet('pre-outil.mjs', ecrire('.env', 'X=1')).code === 2, 'écrire .env : refusé');
ok(crochet('pre-outil.mjs', { tool_name: 'Read', tool_input: { file_path: join(tmp, '.env') } }).code === 2, 'lire .env : refusé');
ok(crochet('pre-outil.mjs', { tool_name: 'Read', tool_input: { file_path: join(tmp, '.env.example') } }).code === 0, 'lire .env.example : permis');
ok(crochet('pre-outil.mjs', { tool_name: 'Bash', tool_input: { command: 'cat .env' } }).code === 2, '« cat .env » : refusé');
ok(crochet('pre-outil.mjs', { tool_name: 'PowerShell', tool_input: { command: 'Get-Content .env' } }).code === 2, '« Get-Content .env » (PowerShell) : refusé');
ok(crochet('pre-outil.mjs', { tool_name: 'Bash', tool_input: { command: 'node scripts/env.mjs && cat .env.example' } }).code === 0, 'scripts/env.mjs et .env.example : permis');
ok(crochet('pre-outil.mjs', ecrire('memoire/pieges.md', '# tout réécrit\n')).code === 2, 'réécrire pieges.md : refusé');
ok(crochet('pre-outil.mjs', ecrire('memoire/pieges.md', '# Pièges\n\n| a | b |\n| c | d |\n')).code === 0, 'ajouter à la fin de pieges.md : permis');
ok(crochet('pre-outil.mjs', { tool_name: 'Edit', tool_input: { file_path: join(tmp, 'memoire/pieges.md'), old_string: '| a | b |', new_string: '| a | changé |' } }).code === 2, 'modifier une ligne de pieges.md : refusé');
ok(crochet('pre-outil.mjs', { tool_name: 'Edit', tool_input: { file_path: join(tmp, 'memoire/pieges.md'), old_string: '| a | b |', new_string: '| a | b |\n| e | f |' } }).code === 0, 'insérer après une ligne de pieges.md : permis');
ok(crochet('pre-outil.mjs', { tool_name: 'Edit', tool_input: { file_path: join(tmp, 'supabase/migrations/20260101000000_ancienne.sql'), old_string: '1', new_string: '2' } }).code === 2, 'modifier une migration existante : refusé');
ok(crochet('pre-outil.mjs', ecrire('supabase/migrations/20261010000000_nouvelle.sql', 'select 2;')).code === 0, 'écrire une nouvelle migration : permis');
ok(crochet('pre-outil.mjs', ecrire('NOTES.md', 'x')).code === 2, 'nouveau .md à la racine : refusé');
ok(crochet('pre-outil.mjs', { tool_name: 'Edit', tool_input: { file_path: join(tmp, 'README.md'), old_string: 'essai', new_string: 'essai 2' } }).code === 0, 'modifier README.md : permis');

// ---------------------------------------------------------------- après écriture
console.log('\nAprès écriture (post-ecriture.mjs)');
const apres = (chemin, contenu) => { writeFileSync(join(tmp, chemin), contenu); return crochet('post-ecriture.mjs', ecrire(chemin, contenu)); };
const faux = 'sk_' + 'live_' + 'x'.repeat(24);
ok(apres('app/src/a.ts', `const k = '${faux}';\n`).code === 2, 'secret écrit dans le code : signalé à Claude');
ok(apres('app/src/b.tsx', "const t = 'Accueil · Sitô';\n").code === 2, 'point médian dans un texte de l’app : signalé');
ok(apres('app/src/c.tsx', "const t = 'Accueil, Sitô';\n").code === 0, 'texte propre : rien à dire');
ok(apres('app/specs/d.md', 'Catalogue : « · » est interdit.\n').code === 0, 'documentation interne : pas de faux refus');
rmSync(join(tmp, 'app/src/a.ts')); // le faux secret ne doit pas fausser la suite

// ---------------------------------------------------------------- début de séance
console.log('\nDébut de séance (session-depart.mjs)');
const dep = crochet('session-depart.mjs', { hook_event_name: 'SessionStart' });
ok(dep.code === 0 && /T02 Deuxième/.test(dep.out) && /Pièges/.test(dep.out), 'donne l’état, les pièges et la prochaine tâche', dep.out.slice(0, 120));

// ---------------------------------------------------------------- fin de tour et boucle
console.log('\nFin de tour (fin.mjs) et boucle autonome');
const boucle = join(tmp, '.claude/boucle.json');
const fin = (extra = {}) => crochet('fin.mjs', { hook_event_name: 'Stop', stop_hook_active: false, ...extra });
ok(fin().code === 0 && !fin().out.includes('block'), 'sans boucle : Claude peut s’arrêter');
writeFileSync(boucle, JSON.stringify({ actif: true, max: 10 }));
const f1 = fin();
ok(f1.code === 0 && /"decision":"block"/.test(f1.out) && /T02/.test(f1.out), 'boucle active, tâche restante : Claude continue sur T02', f1.out.slice(0, 160));
fin(); const f3 = fin(); const f4 = fin();
ok(/trois tours sans aucun changement/.test(f3.out + f4.out) && !JSON.parse(readFileSync(boucle, 'utf8')).actif, 'trois tours sans changement : la boucle s’arrête');
writeFileSync(boucle, JSON.stringify({ actif: true, max: 10 }));
writeFileSync(join(tmp, 'app/specs/07-TACHES.md'), TACHES('fait', 'fait'));
const f5 = fin();
ok(/plus aucune tâche/.test(f5.out) && !f5.out.includes('"block"'), 'tout est fait (le reste est bloqué) : la boucle s’arrête', f5.out.slice(0, 120));
writeFileSync(boucle, JSON.stringify({ actif: true, max: 10 }));
writeFileSync(join(tmp, 'app/specs/07-TACHES.md'), TACHES('fait', 'à faire').replace('| T02 | Deuxième | à faire | x | | |', '| T02 | Deuxième | à faire | x | T03 | |'));
const f7 = fin();
ok(/attendent des tâches bloquées/.test(f7.out) && !f7.out.includes('"block"'), 'tâche restante qui dépend d’une tâche bloquée : la boucle s’arrête au lieu de tourner à vide', f7.out.slice(0, 140));
writeFileSync(join(tmp, 'secret.md'), faux + '\n');
const f6 = fin();
ok(f6.code === 2 && /secret probable/.test(f6.err), 'secret dans un fichier : Claude doit le retirer avant de s’arrêter');
rmSync(join(tmp, 'secret.md'));

// ---------------------------------------------------------------- scripts autour
console.log('\nScripts (env.mjs, compte-essai.mjs)');
const sansEnv = spawnSync(process.execPath, ['-e', "import('./scripts/env.mjs').then(m=>m.exiger(['SITO_N_EXISTE_PAS'],'essai'))"], { cwd: tmp, encoding: 'utf8' });
ok(sansEnv.status === 3 && /SITO_N_EXISTE_PAS/.test(sansEnv.stderr) && /actions-fabrice/.test(sansEnv.stderr), 'variable absente : arrêt (code 3) qui dit quoi faire');

// Compte d'essai contre un faux Supabase local : on compte les écritures.
const base = { users: [], tables: { entreprises: [], profils: [], membres: [] } };
const ecritures = [];
const serveur = createServer((req, res) => {
  let corps = '';
  req.on('data', (c) => { corps += c; });
  req.on('end', () => {
    const u = new URL(req.url, 'http://x');
    const repondre = (s, d) => { res.writeHead(s, { 'content-type': 'application/json' }); res.end(d === undefined ? '' : JSON.stringify(d)); };
    if (req.headers.apikey !== 'cle-de-test' || req.headers.authorization) return repondre(401, { msg: 'en-têtes' });
    if (u.pathname === '/auth/v1/admin/users' && req.method === 'GET') return repondre(200, { users: base.users });
    if (u.pathname === '/auth/v1/admin/users' && req.method === 'POST') {
      const b = JSON.parse(corps); const user = { id: 'u-1', email: b.email }; base.users.push(user); ecritures.push('user'); return repondre(200, user);
    }
    const m = u.pathname.match(/^\/rest\/v1\/(\w+)$/);
    if (m && req.method === 'GET') {
      const filtres = [...u.searchParams].filter(([k]) => k !== 'select');
      return repondre(200, base.tables[m[1]].filter((l) => filtres.every(([k, v]) => String(l[k]) === v.replace(/^eq\./, ''))));
    }
    if (m && req.method === 'POST') { base.tables[m[1]].push(JSON.parse(corps)); ecritures.push(m[1]); return repondre(201); }
    repondre(404, {});
  });
});
await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${serveur.address().port}`;
const lancer = (args = []) => new Promise((r) => {
  const p = spawn(process.execPath, [join(tmp, 'scripts/compte-essai.mjs'), ...args], { cwd: tmp, env: { ...process.env, SUPABASE_URL: url, SUPABASE_CLE_SERVICE: 'cle-de-test', SITO_COMPTE_ESSAI_COURRIEL: 'essai@exemple.test' } });
  let out = ''; p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
  p.on('close', (code) => r({ code, out }));
});
const v0 = await lancer(['--verifier']);
ok(v0.code === 1 && /Manque/.test(v0.out) && ecritures.length === 0, '--verifier sur une base vide : dit ce qui manque, n’écrit rien', v0.out.trim().slice(0, 120));
const c1 = await lancer();
ok(c1.code === 0 && ecritures.join(',') === 'user,entreprises,profils,membres', 'première fois : crée l’utilisateur, l’entreprise, le profil, le lien', ecritures.join(','));
const c2 = await lancer();
ok(c2.code === 0 && ecritures.length === 4, 'deuxième fois : ne crée rien en double', ecritures.join(','));
ok(base.tables.entreprises[0]?.siren === '000000000' && base.tables.membres[0]?.user_id === 'u-1', 'entreprise inventée (SIREN 000000000), reliée au bon utilisateur');
serveur.close();

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
if (CONTRE) { console.log(fautes ? 'Contre-essai réussi : la copie cassée est attrapée.' : 'CONTRE-ESSAI RATÉ : la copie cassée passe.'); process.exit(fautes ? 0 : 1); }
process.exit(fautes ? 1 : 0);

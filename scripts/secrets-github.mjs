#!/usr/bin/env node
// Pose dans les secrets du dépôt GitHub les clés dont le workflow
// `refaire-site.yml` a besoin (tâche T45), lues dans le .env de cet
// ordinateur. Lancé par `lanceurs/SECRETS_GITHUB.bat` (action F21).
//
// Aucune valeur n'est affichée : chaque clé passe par l'entrée standard de
// `gh secret set`, jamais par la ligne de commande. Claude ne lance pas ce
// script (CLAUDE.md, « Jamais », règle 3) : c'est Fabrice, sur son PC.
import { spawnSync } from 'node:child_process';
import { chargerEnv } from './env.mjs';

export const NOMS = ['SUPABASE_URL', 'SUPABASE_CLE_SERVICE', 'CLOUDFLARE_COMPTE_ID', 'CLOUDFLARE_JETON_API'];
const DEPOT = 'Novaships-dev/sito';

chargerEnv();
const manquent = NOMS.filter((n) => !process.env[n]);
if (manquent.length) {
  console.error(`Il manque dans .env : ${manquent.join(', ')}. Lancer d'abord CLE_SUPABASE.bat et CLE_CLOUDFLARE.bat.`);
  process.exit(3);
}
if (spawnSync('gh', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' }).status !== 0) {
  console.error('L outil gh (GitHub CLI) manque : winget install --id GitHub.cli --scope user, puis gh auth login.');
  process.exit(3);
}
let fautes = 0;
for (const n of NOMS) {
  const r = spawnSync('gh', ['secret', 'set', n, '--repo', DEPOT], { input: process.env[n], stdio: ['pipe', 'ignore', 'pipe'], shell: process.platform === 'win32' });
  if (r.status === 0) console.log(`  ${n} : posé`);
  else { fautes++; console.log(`  ${n} : REFUSÉ (${String(r.stderr || '').trim().split('\n')[0].slice(0, 120)})`); }
}
process.exit(fautes ? 1 : 0);

#!/usr/bin/env node
// Aucun secret dans le dépôt (CLAUDE.md, règle absolue 3).
// Cherche les formes connues de clés et de mots de passe dans les fichiers qui
// partent sur GitHub. Sortie 1 si un secret est trouvé, 0 sinon.
//
//   node scripts/verifier-secrets.mjs [racine]
//   node scripts/verifier-secrets.mjs --contre-essai   prouve que chaque motif attrape
//
// Les fichiers ignorés par Git (.env, .env.local…) ne sont pas lus : ils ne
// partent pas. Dans un dépôt Git, la liste vient de « git ls-files » (plus les
// fichiers nouveaux non ignorés) ; sinon on parcourt le dossier.
// Leçon de StructorAI (9 oct. 2026) : un mot de passe de compte de démo était
// écrit en clair dans deux fichiers de reprise.
import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

// Les motifs sont écrits en morceaux pour que ce fichier ne se signale pas lui-même.
const MOTIFS = [
  { id: 'supabase-secret', motif: new RegExp('sb_' + 'secret_[A-Za-z0-9_-]{10,}') },
  { id: 'jwt', motif: new RegExp('ey' + 'J[A-Za-z0-9_-]{10,}\\.ey' + 'J[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}') },
  { id: 'stripe-secret', motif: new RegExp('(sk|rk)_' + '(live|test)_[A-Za-z0-9]{10,}') },
  { id: 'stripe-webhook', motif: new RegExp('wh' + 'sec_[A-Za-z0-9]{10,}') },
  { id: 'github', motif: new RegExp('(gh' + 'p_[A-Za-z0-9]{30,}|github' + '_pat_[A-Za-z0-9_]{20,})') },
  { id: 'google-api', motif: new RegExp('AI' + 'za[0-9A-Za-z_-]{35}') },
  { id: 'anthropic', motif: new RegExp('sk-' + 'ant-[A-Za-z0-9_-]{20,}') },
  { id: 'cle-privee', motif: new RegExp('-----BEGIN (RSA |EC |OPENSSH |)PRIVATE' + ' KEY-----') },
  { id: 'mot-de-passe', motif: /(mot de passe|password|passwd|pwd)\s*[:=]\s*["']?[^\s"'`<>{}$]{8,}/i },
];
const IGNORE = new Set(['node_modules', '.git', 'images', 'sites', 'dist', 'flotte', 'sortie']);
const BINAIRES = /\.(png|jpe?g|webp|gif|avif|woff2?|ico|zip|pdf|mp4|heic|dng)$/i;

function parcourir(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    if (IGNORE.has(n)) continue;
    if (n.startsWith('.env') && n !== '.env.example') continue; // jamais versionnés
    const p = join(dir, n);
    if (statSync(p).isDirectory()) parcourir(p, acc); else acc.push(p);
  }
  return acc;
}

function liste(racine) {
  if (existsSync(join(racine, '.git'))) {
    try {
      const sortie = execFileSync('git', ['-C', racine, 'ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' });
      return sortie.split('\n').filter(Boolean).map((f) => join(racine, f)).filter(existsSync);
    } catch { /* git absent : parcours */ }
  }
  return parcourir(racine);
}

// Pour un texte isolé (crochet après écriture) : la liste des motifs trouvés.
export function secretsDansTexte(texte) {
  const ids = [];
  for (const ligne of texte.split('\n')) {
    if (ligne.includes('secret-ignore')) continue;
    for (const m of MOTIFS) if (m.motif.test(ligne) && !ids.includes(m.id)) ids.push(m.id);
  }
  return ids;
}

export function chercher(racine) {
  const constats = [];
  for (const f of liste(racine)) {
    if (BINAIRES.test(f)) continue;
    let t;
    try { t = readFileSync(f, 'utf8'); } catch { continue; }
    t.split('\n').forEach((ligne, i) => {
      if (ligne.includes('secret-ignore')) return;
      for (const m of MOTIFS) if (m.motif.test(ligne)) constats.push({ fichier: relative(racine, f), ligne: i + 1, id: m.id });
    });
  }
  return constats;
}

const LANCE = (process.argv[1] || '').replace(/\\/g, '/').endsWith('scripts/verifier-secrets.mjs');

if (LANCE && process.argv.includes('--contre-essai')) {
  // Un faux secret de chaque forme, fabriqué ici, doit être attrapé.
  const d = mkdtempSync(join(tmpdir(), 'secrets-'));
  const faux = {
    'supabase-secret': 'cle = "sb_' + 'secret_' + 'A'.repeat(30) + '"',
    jwt: 'ey' + 'J' + 'a'.repeat(20) + '.ey' + 'J' + 'b'.repeat(20) + '.' + 'c'.repeat(20),
    'stripe-secret': 'sk_' + 'live_' + 'x'.repeat(24),
    'stripe-webhook': 'wh' + 'sec_' + 'y'.repeat(24),
    github: 'gh' + 'p_' + 'z'.repeat(36),
    'google-api': 'AI' + 'za' + 'q'.repeat(35),
    anthropic: 'sk-' + 'ant-' + 'w'.repeat(30),
    'cle-privee': '-----BEGIN ' + 'PRIVATE' + ' KEY-----',
    'mot-de-passe': 'Démo : demo@exemple.test / mot de passe' + ' : DemoSecret2026!',
  };
  for (const [id, texte] of Object.entries(faux)) writeFileSync(join(d, id + '.md'), texte + '\n');
  writeFileSync(join(d, '.env'), 'sk_' + 'live_' + 'x'.repeat(24) + '\n'); // ignoré : ne part pas
  writeFileSync(join(d, 'propre.md'), 'clé publique : sb_publishable_abc ; rien de secret ici.\n');
  const vus = new Set(chercher(d).map((c) => c.fichier.replace(/\.md$/, '')));
  let fautes = 0;
  for (const id of Object.keys(faux)) { const ok = vus.has(id); if (!ok) fautes++; console.log(`  ${ok ? 'ok   ' : 'FAUTE'} ${id} attrapé`); }
  const propre = !vus.has('propre') && !vus.has('.env');
  if (!propre) fautes++;
  console.log(`  ${propre ? 'ok   ' : 'FAUTE'} ni faux positif sur une clé publique, ni lecture de .env`);
  rmSync(d, { recursive: true, force: true });
  console.log(fautes ? `${fautes} faute(s).` : 'Contre-essai : tous les motifs attrapent.');
  process.exit(fautes ? 1 : 0);
}

if (LANCE && !process.argv.includes('--contre-essai')) {
  const racine = resolve(process.argv[2] || '.');
  const constats = chercher(racine);
  if (!constats.length) { console.log('Aucun secret trouvé.'); process.exit(0); }
  for (const c of constats) console.log(`[BLOQUANT] ${c.id} : ${c.fichier}:${c.ligne}`);
  console.log(`\n${constats.length} secret(s) probable(s). Retirer la valeur (le .env local seulement), ou ajouter « secret-ignore » sur la ligne si c'est un faux positif vérifié.`);
  process.exit(1);
}

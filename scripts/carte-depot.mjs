#!/usr/bin/env node
// La carte du dépôt : chaque fichier suivi, rangé par zone, compté.
//
// Modèle : OPS/AUDIT/CARTE-TERRITOIRE.md du dépôt StructorAI (on compte et on
// classe, on ne juge rien). La carte sert de périmètre aux audits : un audit
// qui ne couvre pas toute la carte le dit. Elle est générée, jamais écrite à
// la main ; elle ne porte pas de date, pour que deux passages sur le même
// dépôt donnent le même fichier.
//
//   node scripts/carte-depot.mjs             affiche la carte
//   node scripts/carte-depot.mjs --ecrire    réécrit docs/audit/CARTE.md
//   node scripts/carte-depot.mjs --verifier  sort 1 si docs/audit/CARTE.md n'est plus à jour
//   node scripts/carte-depot.mjs --contre-essai  prouve que --verifier rougit sur une carte périmée
//
// Fichiers suivis : `git ls-files` s'il y a un dépôt Git, sinon le dossier
// entier moins ce que .gitignore exclut d'habitude (node_modules, images,
// sites, sortie, flotte, app/dist*). Pas de Git LFS (décision de Fabrice).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, cpSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const SORTIE_REL = 'docs/audit/CARTE.md';

// Zones : premier motif qui correspond, dans l'ordre.
export const ZONES = [
  ['Z01 Pilotage de l agent', /^(CLAUDE\.md|AGENTS\.md|README\.md|\.claude\/|\.mcp\.json$)/],
  ['Z02 Mémoire du projet', /^memoire\//],
  ['Z03 Spécifications', /^app\/specs\/|^app\/PLAN-APP\.md$|^app\/README\.md$/],
  ['Z04 Documentation de travail', /^(docs\/(?!lecture-structorai\/|historique\/)|CHANGELOG\.md$|SECURITY\.md$)/],
  ['Z05 Archives (ne pas lire pour une tâche)', /^docs\/(lecture-structorai|historique)\//],
  ['Z06 Générateur de sites', /^generateur\//],
  ['Z07 Règles', /^rules\//],
  ['Z08 App de l artisan', /^app\//],
  ['Z09 Service atelier et Worker', /^(atelier|worker)\//],
  ['Z10 Base Supabase', /^supabase\//],
  ['Z11 Essais et vérificateurs', /^scripts\/(essai-|verifier-|faux-|contraste-|mesure-|capacite-|essais\.mjs)/],
  ['Z12 Prospection', /^(scripts\/prospection\/|prospection\/)/],
  ['Z13 Autres scripts', /^scripts\//],
  ['Z14 Banque d images', /^banque\//],
  ['Z15 Données de démonstration', /^donnees\//],
  ['Z16 Lanceurs Windows et crochets Git', /^(lanceurs|git-hooks)\//],
  ['Z17 Configuration', /^(\.github\/|\.gitignore$|\.env\.example$|\.tool-versions$|package(-lock)?\.json$)/],
];

const IGNORES = new Set(['node_modules', '.git', 'images', 'sites', 'sortie', 'flotte', '_installation', '.playwright-mcp']);

function parcourir(racine, dir = racine, acc = []) {
  for (const n of readdirSync(dir)) {
    if (IGNORES.has(n) || /^dist(-|$)/.test(n) || n === '.env' || /\.log$/.test(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) parcourir(racine, p, acc);
    else acc.push(relative(racine, p).replace(/\\/g, '/'));
  }
  return acc;
}

export function fichiersSuivis(racine) {
  if (existsSync(join(racine, '.git'))) {
    // suivis + nouveaux non ignorés : un fichier pas encore ajouté compte déjà.
    const r = spawnSync('git', ['-C', racine, 'ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' });
    if (r.status === 0) return [...new Set(r.stdout.split('\n').filter(Boolean))].sort();
  }
  return parcourir(racine).sort();
}

const lignesDe = (p) => {
  const b = readFileSync(p);
  if (b.includes(0)) return null; // binaire
  const t = b.toString('utf8');
  return t.length ? t.split('\n').length - (t.endsWith('\n') ? 1 : 0) : 0;
};

export function carte(racine) {
  // La carte ne se compte pas elle-même : sinon chaque réécriture la rendrait périmée.
  const fichiers = fichiersSuivis(racine).filter((f) => f !== SORTIE_REL && existsSync(join(racine, f)));
  const zones = ZONES.map(([nom]) => ({ nom, fichiers: [], lignes: 0, binaires: 0 }));
  const horsZone = [];
  for (const f of fichiers) {
    const i = ZONES.findIndex(([, re]) => re.test(f));
    if (i < 0) { horsZone.push(f); continue; }
    const n = lignesDe(join(racine, f));
    zones[i].fichiers.push({ f, n });
    if (n === null) zones[i].binaires++; else zones[i].lignes += n;
  }
  return { fichiers, zones, horsZone };
}

export function rendre({ fichiers, zones, horsZone }) {
  const total = zones.reduce((s, z) => s + z.lignes, 0);
  const md = fichiers.filter((f) => f.endsWith('.md')).length;
  const out = [
    '# Carte du dépôt',
    '',
    'Générée par `node scripts/carte-depot.mjs --ecrire`. **Ne pas modifier à la main** : relancer le script.',
    '`node scripts/carte-depot.mjs --verifier` sort 1 si cette carte n\'est plus à jour.',
    '',
    'Elle compte et classe, elle ne juge rien. Le jugement vit dans `docs/audit/REGISTRE.md`.',
    'Un audit qui ne couvre pas toutes les zones le dit.',
    '',
    `**${fichiers.length} fichiers suivis, dont ${md} .md ; ${total} lignes de texte.** Hors zone : ${horsZone.length}.`,
    '',
    '| Zone | Fichiers | Lignes de texte | Fichiers binaires |',
    '|---|---|---|---|',
    ...zones.map((z) => `| ${z.nom} | ${z.fichiers.length} | ${z.lignes} | ${z.binaires} |`),
    '',
  ];
  if (horsZone.length) out.push('## Hors zone (à ranger dans une zone de `scripts/carte-depot.mjs`)', '', ...horsZone.map((f) => `- \`${f}\``), '');
  for (const z of zones) {
    if (!z.fichiers.length) continue;
    out.push(`## ${z.nom}`, '', '| Fichier | Lignes |', '|---|---|');
    for (const { f, n } of z.fichiers) out.push(`| \`${f}\` | ${n === null ? 'binaire' : n} |`);
    out.push('');
  }
  return out.join('\n');
}

function principal(racine, mode) {
  const texte = rendre(carte(racine));
  const cible = join(racine, SORTIE_REL);
  if (mode === '--ecrire') {
    mkdirSync(dirname(cible), { recursive: true });
    writeFileSync(cible, texte + '\n');
    console.log(`Carte écrite : ${SORTIE_REL}`);
    return 0;
  }
  if (mode === '--verifier') {
    const avant = existsSync(cible) ? readFileSync(cible, 'utf8').replace(/\r\n/g, '\n') : '';
    // La carte se compte elle-même : on compare après réécriture virtuelle.
    if (avant.trimEnd() === texte.trimEnd()) { console.log('Carte à jour.'); return 0; }
    console.log(`Carte périmée : relancer node scripts/carte-depot.mjs --ecrire (${SORTIE_REL}).`);
    return 1;
  }
  console.log(texte);
  return 0;
}

function contreEssai() {
  const racine = resolve(ICI, '..');
  const tmp = mkdtempSync(join(tmpdir(), 'sito-carte-'));
  let fautes = 0;
  const ok = (v, quoi) => { console.log(`${v ? 'ok   ' : 'FAUTE'}  ${quoi}`); if (!v) fautes++; };
  try {
    for (const f of fichiersSuivis(racine)) {
      if (!existsSync(join(racine, f))) continue;
      mkdirSync(dirname(join(tmp, f)), { recursive: true });
      cpSync(join(racine, f), join(tmp, f));
    }
    ok(principal(tmp, '--ecrire') === 0, 'la carte s écrit');
    ok(principal(tmp, '--verifier') === 0, 'une carte qu on vient d écrire est à jour');
    writeFileSync(join(tmp, 'scripts', 'nouveau-fichier-essai.mjs'), '// essai\n');
    ok(principal(tmp, '--verifier') === 1, 'un fichier ajouté rend la carte périmée');
    principal(tmp, '--ecrire');
    ok(readFileSync(join(tmp, SORTIE_REL), 'utf8').includes('nouveau-fichier-essai.mjs'), 'le fichier ajouté apparaît après réécriture');
    writeFileSync(join(tmp, 'fichier-sans-zone.xyz'), 'x\n');
    principal(tmp, '--ecrire');
    ok(readFileSync(join(tmp, SORTIE_REL), 'utf8').includes('Hors zone : 1'), 'un fichier hors zone est signalé, pas perdu');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`\n${fautes ? fautes + ' faute(s)' : '5 contrôles, 0 faute(s)'}. Dossier effacé.`);
  return fautes ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  process.exitCode = mode === '--contre-essai' ? contreEssai() : principal(resolve(ICI, '..'), mode);
}

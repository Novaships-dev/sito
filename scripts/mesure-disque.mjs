#!/usr/bin/env node
// Ce qui prend la place sur le disque du PC, en lecture seule (demande de
// Fabrice du 29 octobre 2026, par Cowork : « qu'est-ce qui prend toute cette
// mémoire ? »). Rien n'est effacé ici : le ménage permis est celui de
// scripts/audit-depot.mjs ; le reste devient une action de Fabrice.
//
//   node scripts/mesure-disque.mjs [--racine C:\]   écrit memoire/essais/disque.txt
//
// Parcourt le disque une fois (plusieurs minutes), sans suivre les liens ni
// les jonctions de Windows, et additionne la taille de chaque dossier jusqu'à
// la profondeur 3. Un dossier illisible (droits) est compté pour ce qu'on a pu
// lire, et le rapport le dit.
import { spawnSync } from 'node:child_process';
import { lstatSync, mkdirSync, readdirSync, statfsSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, parse } from 'node:path';
import { RACINE } from './env.mjs';

const args = process.argv.slice(2);
const i = args.indexOf('--racine');
const DISQUE = i >= 0 ? args[i + 1] : parse(RACINE).root;
const PROFONDEUR = 3;
const MAISON = homedir();
const LOCAL = process.env.LOCALAPPDATA || join(MAISON, 'AppData', 'Local');
const ROAMING = process.env.APPDATA || join(MAISON, 'AppData', 'Roaming');

// Ce qu'on sait de chaque emplacement : à qui il est, et si on peut le vider.
const CONNUS = [
  [join(DISQUE, 'pagefile.sys'), 'Windows (mémoire virtuelle)', 'non : Windows le gère ; se réduit dans Paramètres > Système > Informations > Paramètres avancés > Performances > Mémoire virtuelle'],
  [join(DISQUE, 'hiberfil.sys'), 'Windows (veille prolongée, démarrage rapide)', 'oui, par Fabrice : `powercfg /hibernate off` dans un terminal administrateur (perd le démarrage rapide)'],
  [join(DISQUE, 'swapfile.sys'), 'Windows (applis du Store)', 'non'],
  [tmpdir(), 'tous les programmes (fichiers temporaires)', 'en partie : les dossiers d essai de Sitô sont effacés par audit-depot ; le reste par Fabrice, Paramètres > Système > Stockage > Fichiers temporaires'],
  [join(MAISON, '.claude'), 'Claude Code (journaux des séances, réglages)', 'en partie : les vieux journaux de séance (projects/) se suppriment sans risque pour le dépôt, mais on perd l historique des conversations'],
  [join(LOCAL, 'npm-cache'), 'npm (copies des paquets téléchargés)', 'oui : `npm cache clean --force`, tout se retélécharge au besoin'],
  [join(LOCAL, 'pip'), 'pip (copies des paquets Python)', 'oui : `pip cache purge`'],
  [join(LOCAL, 'ms-playwright'), 'Playwright (navigateurs des essais de Sitô)', 'non : les essais de l app en ont besoin'],
  [join(LOCAL, 'ms-playwright-mcp'), 'Playwright MCP (navigateur de Claude Code)', 'non tant que Claude Code s en sert'],
  [join(LOCAL, 'claude-cli-nodejs'), 'Claude Code (programme et caches)', 'non'],
  [join(LOCAL, 'AnthropicClaude'), 'l application Claude (Cowork)', 'non : désinstaller l app la retire'],
  [join(LOCAL, 'Claude'), 'l application Claude', 'non'],
  [join(ROAMING, 'Claude'), 'l application Claude (données)', 'non'],
  [join(LOCAL, 'Programs'), 'programmes installés pour l utilisateur', 'par Fabrice : Paramètres > Applications'],
  [join(LOCAL, 'Packages'), 'applis du Microsoft Store', 'par Fabrice : Paramètres > Applications'],
  [join(LOCAL, 'Google'), 'Google Chrome (profil et cache)', 'le cache, par Fabrice : Chrome > Paramètres > Confidentialité > Effacer les données'],
  [join(LOCAL, 'Microsoft'), 'Windows, Edge, Teams, OneDrive (programme)', 'non en bloc'],
  [join(MAISON, 'OneDrive'), 'OneDrive (fichiers de Fabrice, dont le dépôt sito)', 'par Fabrice : clic droit > « Libérer de l espace » garde les fichiers dans le nuage'],
  [join(MAISON, 'Downloads'), 'Téléchargements de Fabrice', 'par Fabrice'],
  [join(RACINE, 'node_modules'), 'Sitô : paquets npm du dépôt', 'oui, se refait par `npm ci`, mais les essais en ont besoin'],
  [join(RACINE, 'app', 'node_modules'), 'Sitô : paquets npm de l app', 'oui, se refait par `npm ci`, mais la construction en a besoin'],
  [join(RACINE, '.git'), 'Sitô : historique Git', 'non'],
  [join(RACINE, 'images'), 'Sitô : images de banque (hors Git)', 'non (décision : jamais)'],
  [join(RACINE, 'sites'), 'Sitô : sites fabriqués', 'oui, se refabriquent'],
  [join(DISQUE, 'Windows', 'SoftwareDistribution', 'Download'), 'Windows Update (mises à jour déjà téléchargées)', 'oui, par Fabrice : Paramètres > Système > Stockage > Fichiers temporaires, cocher « Nettoyage de Windows Update »'],
  [join(DISQUE, 'Users', 'Public', 'Downloads'), 'Téléchargements partagés (installateurs)', 'par Fabrice, après avoir regardé ce qu il y a'],
  [join(DISQUE, 'Windows'), 'Windows','non ; « Nettoyage de disque » > « Nettoyer les fichiers système » par Fabrice'],
  [join(DISQUE, 'Program Files'), 'programmes installés', 'par Fabrice : Paramètres > Applications'],
  [join(DISQUE, 'Program Files (x86)'), 'programmes installés (32 bits)', 'par Fabrice : Paramètres > Applications'],
  [join(DISQUE, 'ProgramData'), 'données des programmes', 'non en bloc'],
];

const cle = (p) => p.toLowerCase().replace(/[\\/]+$/, '');
const tailles = new Map(); // dossier (profondeur ≤ 3) → octets
let illisibles = 0;

const nommes = new Set(CONNUS.map((c) => cle(c[0])));

function parcourir(dossier, profondeur) {
  let entrees;
  try { entrees = readdirSync(dossier, { withFileTypes: true }); } catch { illisibles++; return 0; }
  let total = 0;
  for (const e of entrees) {
    const p = join(dossier, e.name);
    if (e.isSymbolicLink()) continue; // jonctions de Windows (« Application Data »…) : déjà comptées ailleurs
    if (e.isDirectory()) total += parcourir(p, profondeur + 1);
    else try { total += lstatSync(p).size; } catch { illisibles++; }
  }
  // Les dossiers jusqu'à la profondeur 3, plus les emplacements nommés, où qu'ils soient.
  if (profondeur <= PROFONDEUR || nommes.has(cle(dossier))) tailles.set(cle(dossier), total);
  return total;
}

// Les fichiers de la racine : pagefile.sys et hiberfil.sys refusent lstat
// (EPERM) ; « dir » de Windows, lui, donne leur taille.
const debut = Date.now();
const fichiersRacine = new Map();
for (const e of readdirSync(DISQUE, { withFileTypes: true })) {
  if (!e.isFile()) continue;
  try { fichiersRacine.set(cle(join(DISQUE, e.name)), lstatSync(join(DISQUE, e.name)).size); } catch { /* lu par dir, plus bas */ }
}
if (process.platform === 'win32') {
  const dir = spawnSync('cmd', ['/c', 'dir', '/a', '/-c', join(DISQUE, '*.sys')], { encoding: 'latin1' });
  for (const m of (dir.stdout || '').matchAll(/\s(\d+)\s+(\S+\.sys)\s*$/gm)) fichiersRacine.set(cle(join(DISQUE, m[2])), Number(m[1]));
}
const total = parcourir(DISQUE, 0) + [...fichiersRacine.values()].reduce((a, b) => a + b, 0);
const go = (n) => `${(n / 1024 ** 3).toFixed(2).replace('.', ',')} Go`;
const taille = (p) => fichiersRacine.get(cle(p)) ?? tailles.get(cle(p));

const s = statfsSync(DISQUE);
const l = [];
const quand = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' });
l.push(`Ce qui prend la place sur ${DISQUE}, ${quand} (lecture seule, ${Math.round((Date.now() - debut) / 1000)} s)`);
l.push(`Disque : ${go(s.blocks * s.bsize)}, utilisé ${go((s.blocks - s.bfree) * s.bsize)}, libre ${go(s.bavail * s.bsize)} ; lu ${go(total)}`);
// L'écart entre « utilisé » et « lu » : ce que seul un administrateur lit
// (points de restauration dans « System Volume Information », dossiers
// d'autres comptes).
if (illisibles) l.push(`${illisibles} dossier(s) ou fichier(s) illisible(s) sans droits d administrateur, non comptés : c est l écart entre « utilisé » et « lu »`);
l.push('', '| Emplacement | Taille | À qui | Sûr à supprimer ? |', '|---|---|---|---|');
const mesures = CONNUS.map(([p, qui, sur]) => ({ p, qui, sur, n: taille(p) })).filter((m) => m.n !== undefined);
for (const { p, qui, sur, n } of mesures.sort((a, b) => b.n - a.n)) l.push(`| \`${p}\` | ${go(n)} | ${qui} | ${sur} |`);
l.push('', `Les 25 plus gros dossiers à la profondeur ${PROFONDEUR} :`);
const profondeur = (k) => k.slice(cle(DISQUE).length).split(/[\\/]/).filter(Boolean).length;
for (const [k, n] of [...tailles].filter(([k]) => profondeur(k) === PROFONDEUR).sort((a, b) => b[1] - a[1]).slice(0, 25))
  l.push(`  ${go(n).padStart(9)}  ${k}`);
const texte = l.join('\n') + '\n';
mkdirSync(join(RACINE, 'memoire', 'essais'), { recursive: true });
writeFileSync(join(RACINE, 'memoire', 'essais', 'disque.txt'), texte);
process.stdout.write(texte);

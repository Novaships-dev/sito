#!/usr/bin/env node
// Une tâche « fait » a laissé sa trace (T53, constat S-017 ;
// `docs/REGLE-TRACABILITE.md`, définition de « fini ») :
//
//   - une ligne datée de `CHANGELOG.md` (« | 4 nov. | … Txx … ») ;
//   - une section de `memoire/journal.md` du même jour (« ## 4 nov. 2026 »),
//     dont le titre cite Txx et qui contient une ligne « TRACAGE : … ».
//
// Les tâches finies avant la règle (3 novembre 2026) n'ont pas de section de
// journal à leur nom : elles sont listées ici, une fois pour toutes. La liste
// ne grandit jamais : une tâche finie après le 3 novembre suit la règle.
//
//   node scripts/verifier-tracabilite.mjs [racine]
//   node scripts/verifier-tracabilite.mjs --contre-essai
//
// Sortie 0 : chaque tâche « fait » a sa trace. Sortie 1 : la liste de celles
// qui n'en ont pas, et ce qui manque.
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = join(dirname(fileURLToPath(import.meta.url)), '..');

// Faites avant `docs/REGLE-TRACABILITE.md` : CHANGELOG reconstruit le
// 3 novembre, journal sans section par tâche. Ne pas allonger.
export const AVANT_LA_REGLE = new Set(['T00', 'T01', 'T02', 'T05', 'T06', 'T07', 'T08', 'T09',
  'T34', 'T35', 'T36', 'T37', 'T38', 'T39', 'T40', 'T42', 'T43', 'T44']);

const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function tachesFaites(taches) {
  return taches.split('\n')
    .filter((l) => /^\| T\d+ \|/.test(l))
    .map((l) => l.split('|').map((c) => c.trim()))
    .filter((c) => c[3] === 'fait')
    .map((c) => c[1]);
}

export function manques({ taches, changelog, journal }) {
  const sections = journal.split(/\n(?=## )/);
  const fautes = [];
  for (const t of tachesFaites(taches)) {
    if (AVANT_LA_REGLE.has(t)) continue;
    const mot = new RegExp(`\\b${echapper(t)}\\b`);
    // Les jours de ses lignes de CHANGELOG (« 4 nov. »).
    const jours = changelog.split('\n')
      .map((l) => l.match(/^\| (\d{1,2} [a-zéû]+\.?) \|/))
      .filter((m, i, tout) => m && mot.test(changelog.split('\n')[i]))
      .map((m) => m[1]);
    const sectionsT = sections.filter((s) => mot.test(s.split('\n')[0]) && /^TRACAGE : \S/m.test(s));
    const memeJour = sectionsT.some((s) => jours.some((j) => s.startsWith(`## ${j} `)));
    const quoi = [];
    if (!jours.length) quoi.push('aucune ligne datée dans CHANGELOG.md');
    if (!sectionsT.length) quoi.push('aucune section du journal à son nom avec une ligne TRACAGE');
    else if (jours.length && !memeJour) quoi.push(`section du journal d’un autre jour que la ligne de CHANGELOG (${jours.join(', ')})`);
    if (quoi.length) fautes.push(`${t} : ${quoi.join(' ; ')}`);
  }
  return fautes;
}

function lire(racine) {
  return {
    taches: readFileSync(join(racine, 'app', 'specs', '07-TACHES.md'), 'utf8'),
    changelog: readFileSync(join(racine, 'CHANGELOG.md'), 'utf8'),
    journal: readFileSync(join(racine, 'memoire', 'journal.md'), 'utf8'),
  };
}

function contreEssai() {
  // Un clone d'essai : les trois fichiers du dépôt, plus une tâche T99 passée
  // « fait ». Sans trace : rouge. Avec ses deux traces : vert. Avec l'une des
  // deux seulement : rouge.
  const vrai = lire(ICI);
  const d = mkdtempSync(join(tmpdir(), 'sito-tracabilite-'));
  let fautes = 0;
  const ok = (cond, quoi) => { console.log(`  ${cond ? 'ok   ' : 'FAUTE'} ${quoi}`); if (!cond) fautes++; };
  try {
    mkdirSync(join(d, 'app', 'specs'), { recursive: true });
    mkdirSync(join(d, 'memoire'));
    const poser = ({ taches, changelog, journal }) => {
      writeFileSync(join(d, 'app', 'specs', '07-TACHES.md'), taches);
      writeFileSync(join(d, 'CHANGELOG.md'), changelog);
      writeFileSync(join(d, 'memoire', 'journal.md'), journal);
      return manques(lire(d));
    };
    ok(poser(vrai).length === 0, 'le dépôt tel quel : vert');
    const taches = vrai.taches + '\n| T99 | Essai de traçabilité | fait | essai | | |\n';
    const ligne = '| 4 nov. | T99 : essai. |\n';
    const changelog = vrai.changelog.replace('| Date | Changement |\n|---|---|\n', (m) => m + ligne);
    const section = '\n## 4 nov. 2026 — T99 (essai)\n\nPlan : essai.\nTRACAGE : CHANGELOG.md\n';
    ok(changelog !== vrai.changelog, 'la ligne d’essai entre dans CHANGELOG.md');
    ok(poser({ ...vrai, taches }).some((f) => f.startsWith('T99')), 'T99 « fait » sans trace : rouge');
    ok(poser({ ...vrai, taches, changelog }).some((f) => f.startsWith('T99')), 'T99 avec CHANGELOG, sans journal : rouge');
    ok(poser({ ...vrai, taches, journal: vrai.journal + section }).some((f) => f.startsWith('T99')), 'T99 avec journal, sans CHANGELOG : rouge');
    ok(poser({ ...vrai, taches, journal: vrai.journal + section.replace('TRACAGE : CHANGELOG.md\n', '') , changelog })
      .some((f) => f.startsWith('T99')), 'T99 avec une section sans ligne TRACAGE : rouge');
    ok(poser({ taches, changelog, journal: vrai.journal + section.replace('## 4 nov.', '## 2 nov.') })
      .some((f) => f.startsWith('T99')), 'T99 avec un journal d’un autre jour : rouge');
    ok(poser({ taches, changelog, journal: vrai.journal + section }).length === 0, 'T99 avec ses deux traces du même jour : vert');
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
  console.log(`\n${fautes ? 'ROUGE' : 'Contre-essai juste'} : ${fautes} faute(s).`);
  process.exitCode = fautes ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--contre-essai')) contreEssai();
  else {
    const racine = process.argv.slice(2).find((a) => !a.startsWith('--')) || ICI;
    const f = manques(lire(racine));
    if (f.length) { console.log(`Traçabilité : ${f.length} tâche(s) « fait » sans trace\n  ` + f.join('\n  ')); process.exitCode = 1; }
    else console.log(`Traçabilité : ${tachesFaites(lire(racine).taches).length} tâches « fait », chacune avec sa trace (${AVANT_LA_REGLE.size} d’avant la règle).`);
  }
}

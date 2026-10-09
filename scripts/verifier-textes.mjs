#!/usr/bin/env node
// Détection déterministe des signatures textuelles françaises.
// Usage : node scripts/verifier-textes.mjs <chemin> [--json] [--exclude=a,b]
// Sortie 1 si une signature bloquante est trouvée, 0 sinon.
//
// Portée : le CONTENU PUBLIÉ, pas la documentation interne. Un catalogue de
// signatures contient forcément les signatures qu'il interdit. Les dossiers
// docs/, references/, memoire/ et banque/ sont exclus par défaut, ainsi que la
// documentation de l'app (app/specs/, app/PLAN-APP.md, app/README.md).
// Depuis le 9 octobre, les textes de l'app (app/src/, .ts et .tsx) sont
// contrôlés : l'artisan les lit, ils suivent les mêmes règles.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const EXT = new Set(['.html', '.md', '.astro', '.jsx', '.tsx', '.ts', '.vue', '.liquid', '.txt']);

const REGLES = [
  { id: 'FR01', gravite: 'bloquant', libelle: 'tiret cadratin',
    motif: /\u2014/g, remede: 'trait d\'union, ou reformuler' },
  { id: 'FR02', gravite: 'bloquant', libelle: 'point median separateur',
    motif: /\s\u00B7\s/g, remede: 'virgule' },
  { id: 'FR03', gravite: 'avertissement', libelle: 'lexique mort',
    motif: /\b(savoir-faire|fort de|à votre écoute|n['’]hésitez pas|sur-mesure|passion du métier|professionnels qualifiés|à taille humaine|dans les règles de l['’]art|clé en main|votre satisfaction est notre priorité|équipe dynamique|large éventail|tradition et modernité)\b/gi,
    remede: 'remplacer par un fait' },
  { id: 'FR04', gravite: 'avertissement', libelle: 'ce n\'est pas X c\'est Y',
    motif: /\bce n['’]est pas\b[^.?!]{3,60}\bc['’]est\b/gi, remede: 'phrase declarative' },
  { id: 'FR05', gravite: 'avertissement', libelle: 'fleche dans un lien',
    motif: /(\u2192|-&gt;|->)\s*<\/(a|button)>/gi, remede: 'retirer la fleche' },
  { id: 'FR06', gravite: 'avertissement', libelle: 'devis gratuit sans engagement',
    motif: /devis gratuit et sans engagement/gi, remede: 'dire ce que couvre le devis' },
];

// memoire/ et banque/ sont de la documentation interne du depot sito,
// au meme titre que docs/ : ils citent les signatures qu ils decrivent.
// images/ et sites/ ne sont pas versionnes.
const EXCLUS_DEFAUT = ['node_modules', 'docs', 'references', 'rules', 'dist', 'build', '.git',
  'memoire', 'banque', 'images', 'sites', 'specs', 'PLAN-APP.md', 'public'];
// Documentation de l'app, exclue par son chemin (le nom seul serait trop large).
const CHEMINS_EXCLUS = ['app/README.md'];

const argExclude = process.argv.find(a => a.startsWith('--exclude='));
const EXCLUS = argExclude
  ? argExclude.slice(10).split(',').map(x => x.trim()).filter(Boolean)
  : EXCLUS_DEFAUT;

function fichiers(chemin) {
  const s = statSync(chemin);
  if (s.isFile()) return EXT.has(extname(chemin)) ? [chemin] : [];
  return readdirSync(chemin).flatMap(n => {
    const p = join(chemin, n);
    const rel = p.replace(/\\/g, '/');
    if (EXCLUS.includes(n) || n.startsWith('.') || CHEMINS_EXCLUS.some(c => rel.endsWith(c))) return [];
    return fichiers(p);
  });
}

const cible = process.argv[2];
if (!cible) { console.error('usage: node verifier-textes.mjs <chemin> [--json]'); process.exit(2); }

const constats = [];
for (const f of fichiers(cible)) {
  const lignes = readFileSync(f, 'utf8').split('\n');
  lignes.forEach((ligne, i) => {
    if (ligne.includes('verif-ignore')) return;
    for (const r of REGLES) {
      r.motif.lastIndex = 0;
      let m;
      while ((m = r.motif.exec(ligne)) !== null) {
        constats.push({ fichier: f, ligne: i + 1, id: r.id, gravite: r.gravite,
                        libelle: r.libelle, extrait: m[0].trim().slice(0, 60), remede: r.remede });
      }
    }
  });
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ constats }, null, 2));
} else if (constats.length === 0) {
  console.log('Aucune signature textuelle detectee.');
} else {
  const groupes = {};
  for (const c of constats) (groupes[c.id] ??= []).push(c);
  for (const [id, list] of Object.entries(groupes)) {
    const p = list[0];
    console.log(`\n[${p.gravite.toUpperCase()}] ${id} ${p.libelle} (${list.length})`);
    console.log(`  remede: ${p.remede}`);
    for (const c of list.slice(0, 6)) console.log(`  ${c.fichier}:${c.ligne}  "${c.extrait}"`);
    if (list.length > 6) console.log(`  ... et ${list.length - 6} autres`);
  }
  console.log('\nSupprimer un faux positif : ajouter verif-ignore en commentaire sur la ligne.');
  console.log(`Dossiers exclus : ${EXCLUS.join(', ')}. Modifier avec --exclude=a,b`);
}

process.exit(constats.some(c => c.gravite === 'bloquant') ? 1 : 0);

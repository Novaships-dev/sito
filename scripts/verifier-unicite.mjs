// Controle d unicite. Le seul des cinq qui ne regarde pas une page, mais la
// distance entre deux pages.
//
// Raison d etre : le 23 septembre 2026, trois ravaleurs de Marseille ont recu
// trois sites que Fabrice a juges identiques. Les quatre autres verificateurs
// les declaraient tous bons, et ils avaient raison : chacun respectait le
// plancher. Aucun ne mesurait ce qui compte ici, la distance entre eux.
//
// Depuis le 2 octobre 2026, la regle vaut dans la commune ET dans le
// departement (decision de Fabrice). Les regles elles-memes sont dans
// generateur/unicite.mjs, partagees avec le tirage et la mesure de capacite.
//
//   node scripts/verifier-unicite.mjs <dossier de sites | registre.json>
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AXES, PLAFOND, TOTAL, comparer } from '../generateur/unicite.mjs';

const arg = process.argv[2] || 'generateur/registre.json';
const cible = resolve(arg);
if (!existsSync(cible)) { console.error('introuvable : ' + cible); process.exit(2); }

function sites() {
  if (statSync(cible).isFile()) return JSON.parse(readFileSync(cible, 'utf8')).sites || [];
  const out = [];
  for (const d of readdirSync(cible)) {
    const f = join(cible, d, 'donnees.json');
    if (!existsSync(f)) continue;
    const j = JSON.parse(readFileSync(f, 'utf8'));
    out.push({ siren: j.entreprise.siren, nom: j.entreprise.denomination,
      commune: j.entreprise.commune, departement: j.entreprise.departement,
      metier: j.metier, archetype: j.archetype,
      titre: j.titre, accent: j.palette && j.palette.accent,
      photos: j.photos ? Object.values(j.photos).join(',') : undefined,
      phrases: j.phrases, intitules: j.intitules,
      ...(j.charte || {}),
      structure: j.charte && j.charte.structure && j.charte.structure.ordre
        ? j.charte.structure.ordre.join(' > ') : undefined });
  }
  return out;
}

const liste = sites();
if (liste.length < 2) {
  console.log(`${liste.length} site(s) : rien a comparer.`);
  process.exit(0);
}

const constats = [];
for (let i = 0; i < liste.length; i++) for (let j = i + 1; j < liste.length; j++)
  for (const c of comparer(liste[i], liste[j])) constats.push({ ...c, a: liste[i], b: liste[j] });

console.log(`${liste.length} site(s) compare(s), ${AXES.length} axes, plafond ${PLAFOND} sur ${TOTAL}, commune et departement.`);
for (const s of liste)
  console.log(`  ${String(s.nom || s.siren).slice(0, 28).padEnd(30)} ${AXES.map(x => String(s[x.cle] ?? '?').slice(0, 22)).join(' / ')}`);

if (!constats.length) { console.log('\nAucun constat. Deux voisins ne se ressemblent pas.'); process.exit(0); }
for (const c of constats) {
  console.log(`\n[BLOQUANT] ${c.num} deux sites voisins se ressemblent`);
  console.log(`  ${c.a.nom} (${c.a.commune}) et ${c.b.nom} (${c.b.commune}), ${c.echelle}, ${c.a.metier}`);
  console.log(`  ${c.detail}`);
  console.log(`  remede: voir generateur/tirage.mjs et generateur/charte.mjs`);
}
console.log(`\n${constats.length} bloquant(s) d unicite.`);
process.exit(1);

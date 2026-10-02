// Controle d unicite. Le seul des cinq qui ne regarde pas une page, mais la
// distance entre deux pages.
//
// Raison d etre : le 23 septembre 2026, trois ravaleurs de Marseille ont recu
// trois sites que Fabrice a juges identiques. Les quatre autres verificateurs
// les declaraient tous bons, et ils avaient raison : chacun respectait le
// plancher. Aucun ne mesurait ce qui compte ici, la distance entre eux.
//
// La regle est celle de skills/_partage/references/tells-design.md :
// « si le meme brief, reformule, produirait le meme resultat, c est un defaut ».
// Elle demandait un jugement. Elle se mesure maintenant.
//
//   node scripts/verifier-unicite.mjs <dossier de sites | registre.json>
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const arg = process.argv[2] || 'generateur/registre.json';
const cible = resolve(arg);
if (!existsSync(cible)) { console.error('introuvable : ' + cible); process.exit(2); }

// Les axes compares, dans l ordre de ce que l oeil remarque. Le poids dit
// combien un axe partage rapproche deux sites.
const AXES = [
  { cle: 'photos', nom: 'la main de photos', poids: 4 },
  { cle: 'famille', nom: 'famille de couleurs', poids: 3 },
  { cle: 'sol', nom: 'sol clair ou nuit', poids: 3 },
  { cle: 'structure', nom: 'ordre et presence des sections', poids: 3 },
  { cle: 'polices', nom: 'appariement de polices', poids: 2 },
  { cle: 'archetype', nom: 'archetype', poids: 2 },
  { cle: 'mot', nom: 'contenu du mot geant', poids: 1 },
  { cle: 'geometrie', nom: 'geometrie', poids: 1 },
];
// Somme des poids : 19. Deux sites qui partagent plus de la moitie de cette
// somme se ressemblent, quoi qu en dise la grille. La main de photos pese le
// plus : la photo est la premiere chose qu on regarde, et deux artisans
// voisins qui montrent la meme facade se voient immediatement.
const PLAFOND = 9;

function sites() {
  if (statSync(cible).isFile()) return JSON.parse(readFileSync(cible, 'utf8')).sites || [];
  const out = [];
  for (const d of readdirSync(cible)) {
    const f = join(cible, d, 'donnees.json');
    if (!existsSync(f)) continue;
    const j = JSON.parse(readFileSync(f, 'utf8'));
    out.push({ siren: j.entreprise.siren, nom: j.entreprise.denomination,
      commune: j.entreprise.commune, metier: j.metier, archetype: j.archetype,
      titre: j.titre, accent: j.palette && j.palette.accent,
      photos: j.photos ? Object.values(j.photos).join(',') : undefined,
      structure: j.charte && j.charte.structure && j.charte.structure.ordre ? j.charte.structure.ordre.join('>') : (typeof j.structure === 'string' ? j.structure : undefined),
      phrases: j.phrases, comparateur: j.charte && j.charte.comparateur,
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
for (let i = 0; i < liste.length; i++) for (let j = i + 1; j < liste.length; j++) {
  const a = liste[i], b = liste[j];
  // Deux sites qui ne se rencontrent jamais n ont pas a differer : la regle
  // vise les voisins, meme metier et meme commune.
  if (a.metier !== b.metier || a.commune !== b.commune) continue;
  const communs = AXES.filter(x => a[x.cle] !== undefined && a[x.cle] === b[x.cle]);
  const score = communs.reduce((s, x) => s + x.poids, 0);
  if (score > PLAFOND) constats.push({
    num: 'U1', a, b, score,
    detail: communs.map(x => x.nom + ' : ' + a[x.cle]).join(' | '),
  });
  if (a.titre && a.titre === b.titre) constats.push({
    num: 'U2', a, b, score: 0, detail: 'meme titre : ' + a.titre,
  });
  // U3 : aucune phrase en commun. Deux voisins qui lisent la meme phrase sur
  // leur site le remarquent, et leurs clients aussi.
  if (Array.isArray(a.phrases) && Array.isArray(b.phrases)) {
    const communes = a.phrases.filter(x => b.phrases.includes(x));
    if (communes.length) constats.push({ num: 'U3', a, b, score: 0,
      detail: communes.length + ' phrase(s) commune(s) : ' + communes.slice(0, 2).join(' / ') });
  }
  // U4 : jamais la meme poignee ET la meme invitation sur le comparateur.
  if (a.comparateur && b.comparateur && a.comparateur.prise === b.comparateur.prise
      && a.comparateur.indice === b.comparateur.indice) constats.push({ num: 'U4', a, b, score: 0,
      detail: 'meme comparateur : ' + a.comparateur.prise + ', « ' + a.comparateur.indice + ' »' });
}

const TOTAL = AXES.reduce((s, x) => s + x.poids, 0);
console.log(`${liste.length} site(s) compare(s), ${AXES.length} axes, plafond ${PLAFOND} sur ${TOTAL}.`);
for (const s of liste)
  console.log(`  ${String(s.nom || s.siren).slice(0, 28).padEnd(30)} ${AXES.map(x => String(s[x.cle] ?? '?').slice(0, 22)).join(' / ')}`);

if (!constats.length) { console.log('\nAucun constat. Deux voisins ne se ressemblent pas.'); process.exit(0); }
for (const c of constats) {
  console.log(`\n[BLOQUANT] ${c.num} deux sites voisins se ressemblent`);
  console.log(`  ${c.a.nom} et ${c.b.nom}, ${c.a.commune}, ${c.a.metier}`);
  console.log(`  ${c.detail}`);
  console.log(`  remede: la rotation des sept familles, voir generateur/charte.mjs et palettes.md`);
}
console.log(`\n${constats.length} bloquant(s) d unicite.`);
process.exit(1);

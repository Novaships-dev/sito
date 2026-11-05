// Le depot doit etre complet. Ce controle ne juge rien : il ouvre chaque
// fichier, suit chaque import, chaque chemin de police, chaque regle citee,
// et refuse si une seule piece manque.
//
// Raison d etre : le 14 septembre 2026, une livraison a ete faite en
// choisissant les fichiers a la main. zone-matiere.mjs, methode.md,
// client.md et facture.md sont restes en arriere. Le generateur a casse au
// premier lancement et le site livre etait l ancien. Une liste ecrite a la
// main est une faute qui se repete ; ce script la rend impossible.
//
//   node scripts/verifier-depot.mjs [racine]
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const racine = resolve(process.argv[2] || '.');
// images/ et sites/ ne sont pas versionnes : photos lourdes et sites fabriques.
const ignore = new Set(['node_modules', '.git', 'flotte', 'sortie', 'images', 'sites']);

function fichiers(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    if (ignore.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) fichiers(p, acc); else acc.push(p);
  }
  return acc;
}

const tous = fichiers(racine);
const manques = [];
const dire = (ou, quoi, pourquoi) => manques.push({ ou: relative(racine, ou), quoi, pourquoi });

for (const f of tous) {
  const ext = f.slice(f.lastIndexOf('.'));
  if (!['.mjs', '.js', '.json', '.md', '.sh'].includes(ext)) continue;
  let t;
  try { t = readFileSync(f, 'utf8'); } catch { continue; }

  // imports relatifs
  if (ext === '.mjs' || ext === '.js')
    for (const m of t.matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g)) {
      const cible = resolve(dirname(f), m[1]);
      if (!existsSync(cible)) dire(f, m[1], 'import introuvable');
    }

  // fichiers lus en dur par le code : polices, metiers, archetypes
  if (ext === '.mjs')
    for (const m of t.matchAll(/['"]([\w./-]+\.(?:woff2|json))['"]/g)) {
      const n = m[1];
      if (n.startsWith('.') || n.includes('/')) continue;
      const candidats = ['generateur/polices', 'generateur/metiers'].map(d => join(racine, d, n));
      if (n.endsWith('.woff2') && !candidats.some(existsSync)) dire(f, n, 'police absente du depot');
    }

  // Regles et scripts cites. On ne controle que le code et les regles :
  // docs/ et memoire/ racontent l historique et peuvent citer un etat passe ;
  // app/specs/ decrit aussi ce qui reste a construire (07-TACHES.md cite les
  // scripts que les taches doivent creer).
  const rel = relative(racine, f).replace(/\\/g, '/');
  const narratif = rel.startsWith('docs/') || rel.startsWith('memoire/') || rel.startsWith('app/specs/');
  if (narratif) continue;
  for (const m of t.matchAll(/rules\/[\w/-]+\.md/g)) {
    const cible = join(racine, m[0]);
    if (!existsSync(cible)) dire(f, m[0], 'regle citee mais absente');
  }
  for (const m of t.matchAll(/scripts\/[\w-]+\.mjs/g)) {
    const cible = join(racine, m[0]);
    if (!existsSync(cible)) dire(f, m[0], 'script cite mais absent');
  }
}

// les metiers connus doivent avoir leur fiche
const dmet = join(racine, 'generateur/metiers');
if (!existsSync(dmet) || !readdirSync(dmet).some(n => n.endsWith('.json')))
  dire(dmet, 'generateur/metiers/*.json', 'aucune fiche metier');

// Les codes APE d un metier ont une seule source : prospection/metiers.json,
// celle que l extraction interroge. La fiche du generateur et le plan d images
// recopient la meme liste (T31, D-10 : 5, 3 et 4 codes dans trois fichiers).
const fProspection = join(racine, 'prospection/metiers.json');
if (existsSync(fProspection)) {
  const lireJson = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };
  const fPlan = join(racine, 'generateur/banque/plan-images.json');
  const plan = existsSync(fPlan) ? lireJson(fPlan) : null;
  for (const m of lireJson(fProspection)?.metiers || []) {
    const attendu = [...m.codesApe].sort().join(',');
    const fiche = join(dmet, `${m.nom}.json`);
    const codesFiche = existsSync(fiche) ? lireJson(fiche)?.codesApe : null;
    if (codesFiche && [...codesFiche].sort().join(',') !== attendu)
      dire(fiche, `codesApe ${codesFiche.join(', ')}`, `differe de prospection/metiers.json (${m.codesApe.join(', ')})`);
    const ligne = plan?.metiers?.find((x) => x.cle === m.nom);
    if (ligne && [...ligne.codes].sort().join(',') !== attendu)
      dire(fPlan, `codes de ${m.nom} : ${ligne.codes.join(', ')}`, `differe de prospection/metiers.json (${m.codesApe.join(', ')})`);
  }
}

// Chaque code APE d une fiche metier a son libelle dans generateur/sirene.mjs :
// sinon la page affiche « Activité déclarée 43.12A » sans dire ce que c est
// (constaté le 5 nov. sur sept codes).
const fSirene = join(racine, 'generateur/sirene.mjs');
if (existsSync(fSirene) && existsSync(dmet)) {
  const texte = readFileSync(fSirene, 'utf8');
  const debut = texte.indexOf('const APE = {');
  const bloc = debut > -1 ? texte.slice(debut, texte.indexOf('};', debut)) : '';
  const connus = new Set([...bloc.matchAll(/'(\d{2}\.\d{2}[A-Z])'\s*:/g)].map((m) => m[1]));
  for (const n of readdirSync(dmet).filter((x) => x.endsWith('.json'))) {
    let codes = [];
    try { codes = JSON.parse(readFileSync(join(dmet, n), 'utf8')).codesApe || []; } catch { continue; }
    for (const c of codes) if (!connus.has(c))
      dire(join(dmet, n), `code APE ${c}`, 'sans libelle dans generateur/sirene.mjs (APE)');
  }
}

if (manques.length === 0) {
  console.log('Depot complet. ' + tous.length + ' fichiers, aucune piece manquante.');
  process.exit(0);
}
const vus = new Set();
for (const m of manques) {
  const cle = m.ou + '|' + m.quoi;
  if (vus.has(cle)) continue; vus.add(cle);
  console.log('[BLOQUANT] ' + m.quoi + ' : ' + m.pourquoi + '  (cite dans ' + m.ou + ')');
}
console.log('\n' + vus.size + ' piece(s) manquante(s). Le depot ne peut pas fonctionner en l etat.');
console.log('Remede : livrer le depot entier, jamais une selection de fichiers. Voir rules/methode.md.');
process.exit(1);

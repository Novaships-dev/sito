#!/usr/bin/env node
// Audit du dépôt et du PC, à chaque fin de séance (décision de Fabrice du
// 29 octobre 2026 : « éviter les fichiers doublons, faire des audits,
// supprimer et rectifier »). Rapport dans memoire/essais/audit.txt, place
// libre du disque écrite en tête de memoire/maintenant.md.
//
//   node scripts/audit-depot.mjs                cherche et corrige
//   node scripts/audit-depot.mjs --lecture      cherche seulement
//   node scripts/audit-depot.mjs --contre-essai un clone avec un doublon, un
//                                               fichier mort et un temporaire
//                                               posés exprès : les 3 trouvés,
//                                               puis corrigés
//   --racine <dossier>  --temp <dossier>        pour l'essai
//
// Ce qui est cherché, et ce qui est fait :
//   - fichier suivi en double (même empreinte SHA-256) : un seul gardé (le
//     plus cité), les liens vers l'autre réécrits, l'autre retiré par `git rm`
//     (récupérable dans l'historique), raison au journal ;
//   - fichier suivi que rien ne cite (ni chemin, ni nom) : `git rm` ;
//   - temporaire oublié : dossier d'essai de plus de deux heures dans %TEMP%
//     (`sito-*`, `essai-*`), copie de contre-essai `app/dist-*`, sortie de
//     Playwright (`.playwright-mcp/`), lot de prospection plus ancien que le
//     dernier : supprimé ;
//   - dossier vide : supprimé ;
//   - images/ : seul un doublon exact dans un même dossier est supprimé ;
//     ailleurs, il est signalé.
// Jamais touchés : memoire/, prospection/registre*.json, .env, les
// garde-fous verrouillés (CLAUDE.md, Jamais 10).
//
// Sortie : 0 rien ne reste à corriger ; 1 il reste quelque chose (dit lequel).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  rmSync, rmdirSync, statfsSync, statSync, utimesSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = fileURLToPath(import.meta.url);
const args = process.argv.slice(2);
const option = (nom) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : undefined; };

// Un essai qui tourne garde son dossier : seul ce qui a plus de deux heures
// est un oubli.
const AGE_TEMPORAIRE = 2 * 3600 * 1000;
const PREFIXES_TEMP = ['sito-', 'essai-'];
const PETIT = 32; // deux fichiers presque vides identiques ne sont pas un doublon
const HORS_PARCOURS = new Set(['.git', 'node_modules']);

const VERROUILLES = ['.claude/settings.json', '.claude/hooks/', 'scripts/verifier-secrets.mjs',
  'scripts/essai-outillage.mjs', 'scripts/autonome.mjs', 'git-hooks/', 'lanceurs/CLAUDE_AUTONOME.bat',
  'memoire/decisions.md'];
const intouchable = (f) => f.startsWith('memoire/') || /^prospection\/registre.*\.json$/.test(f)
  || f === '.env' || VERROUILLES.some((v) => (v.endsWith('/') ? f.startsWith(v) : f === v));

// Ce que des outils trouvent seuls, sans que rien ne l'écrive : fichiers de
// réglage, migrations (lues par ordre de nom), skills et crochets de Claude
// Code, fichiers servis tels quels par l'app.
const ENTREES_NOMS = /^(package(-lock)?\.json|tsconfig.*\.json|.*\.config\.(m?js|ts)|\.gitignore|\.gitattributes|\.env\.example|\.mcp\.json|README\.md|CLAUDE\.md|LICENSE.*|index\.html|SKILL\.md)$/;
const ENTREES_DOSSIERS = ['.github/', 'supabase/migrations/', '.claude/', 'app/public/'];
const estEntree = (f) => ENTREES_NOMS.test(basename(f)) || ENTREES_DOSSIERS.some((d) => f.startsWith(d));
// docs/ : rapports datés écrits par Claude (CLAUDE.md §1), gardés comme
// archive ; ceux que rien ne cite sont listés, pas retirés.
const estArchive = (f) => f.startsWith('docs/');

const git = (racine, ...a) => {
  const r = spawnSync('git', a, { cwd: racine, encoding: 'utf8', maxBuffer: 1e8 });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')} : ${r.stderr.trim()}`);
  return r.stdout;
};
const empreinte = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const posix = (p) => p.split(sep).join('/');
const mo = (n) => `${(n / 1048576).toFixed(1).replace('.', ',')} Mo`;

function parcourir(dossier, acc = { fichiers: [], dossiers: [] }) {
  let entrees;
  try { entrees = readdirSync(dossier, { withFileTypes: true }); } catch { return acc; }
  for (const e of entrees) {
    if (HORS_PARCOURS.has(e.name)) continue;
    const p = join(dossier, e.name);
    if (e.isDirectory()) { acc.dossiers.push(p); parcourir(p, acc); } else if (e.isFile()) acc.fichiers.push(p);
  }
  return acc;
}

export function auditer({ racine, temp, corriger, maintenant = new Date() }) {
  const r = {
    doublons: [], morts: [], temporaires: [], vides: [], imagesSignalees: [], archive: [],
    corrige: [], restes: [], gros: [], partages: { fichiers: 0, octets: 0 }, libre: null,
  };
  const suivis = git(racine, 'ls-files', '-z').split('\0').filter(Boolean)
    .filter((f) => existsSync(join(racine, f)));
  const textes = new Map();
  for (const f of suivis) {
    const b = readFileSync(join(racine, f));
    if (!b.includes(0)) textes.set(f, b.toString('utf8'));
  }
  const retires = new Set();
  const copies = new Set(); // copies d'un doublon : déjà comptées, pas mortes en plus
  const retirer = (f, pourquoi) => {
    git(racine, 'rm', '-q', '--', f);
    retires.add(f);
    r.corrige.push(`git rm ${f} : ${pourquoi}`);
  };

  // Combien de fichiers citent f (son chemin, son nom, ou son nom sans
  // extension, comme dans un import). Large exprès : mieux vaut garder un
  // fichier mort que retirer un fichier vivant.
  const citations = (f) => {
    const nom = basename(f), sans = nom.slice(0, nom.length - extname(nom).length);
    let n = 0;
    for (const [g, t] of textes) {
      if (g === f || retires.has(g)) continue;
      if (t.includes(f) || t.includes(nom) || (sans.length >= 4 && t.includes(sans))) n++;
    }
    return n;
  };

  // 1. Doublons parmi les fichiers suivis.
  const parEmpreinte = new Map();
  for (const f of suivis) {
    if (statSync(join(racine, f)).size < PETIT) continue;
    const h = empreinte(join(racine, f));
    parEmpreinte.set(h, [...(parEmpreinte.get(h) || []), f]);
  }
  for (const liste of parEmpreinte.values()) {
    if (liste.length < 2) continue;
    const classes = liste.map((f) => ({ f, n: citations(f) }))
      .sort((a, b) => b.n - a.n || a.f.length - b.f.length || a.f.localeCompare(b.f));
    const garde = classes[0].f;
    for (const { f } of classes.slice(1)) {
      r.doublons.push(`${f} = ${garde}`);
      copies.add(f);
      if (!corriger) continue;
      if (intouchable(f)) { r.restes.push(`doublon intouchable : ${f} = ${garde}`); continue; }
      // Les liens vers la copie retirée pointent maintenant vers celle gardée.
      for (const [g, t] of textes) {
        if (g === f || intouchable(g) || g.startsWith('docs/historique/') || !t.includes(f)) continue;
        const nouveau = t.split(f).join(garde);
        writeFileSync(join(racine, g), nouveau);
        textes.set(g, nouveau);
        r.corrige.push(`liens de ${g} : ${f} → ${garde}`);
      }
      retirer(f, `copie exacte de ${garde}`);
    }
  }

  // 2. Fichiers suivis que rien ne cite.
  for (const f of suivis) {
    if (retires.has(f) || copies.has(f) || estEntree(f) || intouchable(f)) continue;
    if (citations(f) > 0) continue;
    if (estArchive(f)) { r.archive.push(f); continue; }
    r.morts.push(f);
    if (corriger) retirer(f, 'cité nulle part (ni chemin, ni nom)');
  }

  // 3. Temporaires oubliés.
  const effacer = (p, quoi) => {
    r.temporaires.push(quoi);
    if (!corriger) return;
    try { rmSync(p, { recursive: true, force: true }); r.corrige.push(`supprimé : ${quoi}`); } catch (e) { r.restes.push(`${quoi} : ${e.message}`); }
  };
  if (temp && existsSync(temp)) {
    for (const nom of readdirSync(temp)) {
      if (!PREFIXES_TEMP.some((p) => nom.startsWith(p))) continue;
      const p = join(temp, nom);
      let s; try { s = statSync(p); } catch { continue; }
      if (maintenant - s.mtimeMs > AGE_TEMPORAIRE) effacer(p, `%TEMP%/${nom}`);
    }
  }
  const app = join(racine, 'app');
  if (existsSync(app)) for (const nom of readdirSync(app)) if (/^dist-/.test(nom)) effacer(join(app, nom), `app/${nom}/`);
  if (existsSync(join(racine, '.playwright-mcp'))) effacer(join(racine, '.playwright-mcp'), '.playwright-mcp/');
  // Décision du 29 oct. : jamais plus que le lot du jour sur le PC.
  const lots = join(racine, 'sites', 'prospection');
  if (existsSync(lots)) {
    const dates = readdirSync(lots).filter((n) => /^\d{4}-\d{2}-\d{2}$/.test(n)).sort();
    for (const d of dates.slice(0, -1)) effacer(join(lots, d), `sites/prospection/${d}/ (lot ancien)`);
  }

  // 4. Doublons hors de Git. images/ : seul un doublon dans un même dossier
  // part. sites/ : chaque site est publié seul et porte ses images ; une
  // image commune à deux sites est voulue, comptée à part.
  const images = join(racine, 'images');
  if (existsSync(images)) {
    const par = new Map();
    for (const p of parcourir(images).fichiers) {
      if (statSync(p).size < PETIT) continue;
      const h = empreinte(p);
      par.set(h, [...(par.get(h) || []), p]);
    }
    for (const liste of par.values()) {
      if (liste.length < 2) continue;
      liste.sort((a, b) => a.length - b.length || a.localeCompare(b));
      for (const p of liste.slice(1)) {
        const rel = posix(relative(racine, p)), garde = posix(relative(racine, liste[0]));
        if (dirname(p) === dirname(liste[0])) {
          r.doublons.push(`${rel} = ${garde}`);
          if (corriger) { rmSync(p); r.corrige.push(`supprimé : ${rel} (copie de ${garde})`); }
        } else {
          r.imagesSignalees.push(`${rel} = ${garde}`);
        }
      }
    }
  }
  const sites = join(racine, 'sites');
  if (existsSync(sites)) {
    const vus = new Map();
    for (const p of parcourir(sites).fichiers) {
      const s = statSync(p).size;
      if (s < PETIT) continue;
      const h = empreinte(p);
      if (vus.has(h)) { r.partages.fichiers++; r.partages.octets += s; } else vus.set(h, p);
    }
  }

  // 5. Dossiers vides (images/ jamais : RANGER_IMAGES attend ses dossiers).
  const tout = parcourir(racine);
  for (const d of tout.dossiers.sort((a, b) => b.length - a.length)) {
    const rel = posix(relative(racine, d));
    if (rel === 'images' || rel.startsWith('images/') || intouchable(rel + '/')) continue;
    if (!existsSync(d) || readdirSync(d).length) continue;
    r.vides.push(rel + '/');
    if (corriger) { rmdirSync(d); r.corrige.push(`supprimé : ${rel}/ (vide)`); }
  }

  // 6. Les plus gros fichiers, et la place libre.
  r.gros = parcourir(racine).fichiers.map((p) => ({ p: posix(relative(racine, p)), s: statSync(p).size }))
    .sort((a, b) => b.s - a.s).slice(0, 20);
  try { const s = statfsSync(racine); r.libre = s.bavail * s.bsize; } catch { r.libre = null; }

  if (!corriger) r.restes.push(...r.doublons.map((d) => `doublon : ${d}`), ...r.morts.map((m) => `mort : ${m}`),
    ...r.temporaires.map((t) => `temporaire : ${t}`), ...r.vides.map((v) => `vide : ${v}`));
  r.restes.push(...r.imagesSignalees.map((i) => `images/ en double dans deux dossiers (à regarder) : ${i}`));
  return r;
}

function rapport(r, quand) {
  const l = [];
  l.push(`Audit du dépôt et du PC, ${quand}`);
  l.push(`Place libre du disque : ${r.libre === null ? 'inconnue' : mo(r.libre)}${r.libre !== null && r.libre < 1024 ** 3 ? ' — SOUS 1 Go : plus aucune fabrication (décision du 29 oct.)' : ''}`);
  l.push('');
  l.push(`${r.doublons.length} doublon(s), ${r.morts.length} fichier(s) mort(s), ${r.temporaires.length} temporaire(s) oublié(s), ${r.vides.length} dossier(s) vide(s)`);
  for (const [titre, liste] of [['Doublons', r.doublons], ['Fichiers morts', r.morts], ['Temporaires', r.temporaires], ['Dossiers vides', r.vides]])
    if (liste.length) { l.push('', `${titre} :`); for (const x of liste) l.push(`  ${x}`); }
  if (r.corrige.length) { l.push('', 'Corrigé :'); for (const x of r.corrige) l.push(`  ${x}`); }
  if (r.restes.length) { l.push('', 'Reste à corriger :'); for (const x of r.restes) l.push(`  ${x}`); }
  if (r.archive.length) { l.push('', 'docs/ que rien ne cite (archive écrite par Claude, gardée) :'); for (const x of r.archive) l.push(`  ${x}`); }
  l.push('', `sites/ : ${r.partages.fichiers} image(s) commune(s) à plusieurs sites (${mo(r.partages.octets)}), voulu : chaque site est publié seul`);
  l.push('', 'Les 20 plus gros fichiers (hors .git et node_modules) :');
  for (const { p, s } of r.gros) l.push(`  ${mo(s).padStart(9)}  ${p}`);
  return l.join('\n') + '\n';
}

const quandParis = (d = new Date()) => d.toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' });

function ecrireMemoire(racine, r, quand) {
  const essais = join(racine, 'memoire', 'essais');
  mkdirSync(essais, { recursive: true });
  writeFileSync(join(essais, 'audit.txt'), rapport(r, quand));
  const fm = join(racine, 'memoire', 'maintenant.md');
  if (existsSync(fm) && r.libre !== null) {
    const ligne = `Place libre du disque : **${mo(r.libre)}** (audit du ${quand}${r.libre < 1024 ** 3 ? ', sous 1 Go : plus aucune fabrication' : ''}).`;
    const t = readFileSync(fm, 'utf8');
    const nouveau = /^Place libre du disque : .*$/m.test(t)
      ? t.replace(/^Place libre du disque : .*$/m, ligne)
      : t.replace(/^(# .*\r?\n)/, `$1\n${ligne}\n`);
    writeFileSync(fm, nouveau);
  }
  const retraits = r.corrige.filter((c) => c.startsWith('git rm '));
  if (retraits.length) appendFileSync(join(racine, 'memoire', 'journal.md'),
    `\n## ${quand} — audit du dépôt (scripts/audit-depot.mjs)\n\n${retraits.map((c) => `- ${c.slice(7)}`).join('\n')}\n`);
}

// Contre-essai : un clone du dépôt, un doublon, un fichier mort et des
// temporaires posés exprès. Les trois doivent être trouvés (sortie 1 en
// lecture), puis corrigés, et rien d'autre ne doit bouger.
function contreEssai() {
  const racine = resolve(dirname(ICI), '..');
  const base = mkdtempSync(join(tmpdir(), 'sito-audit-contre-essai-'));
  const copie = join(base, 'depot'), temp = join(base, 'temp');
  let fautes = 0, n = 0;
  const ok = (cond, quoi) => { n++; if (!cond) fautes++; console.log(`${cond ? 'ok   ' : 'FAUTE'}  ${quoi}`); };
  try {
    git(base, 'clone', '-q', '--no-hardlinks', racine, copie);
    // Les deux fichiers posés n'existent que dans le clone : leurs chemins
    // sont composés, pour que verifier-depot ne les cherche pas dans le dépôt.
    const COPIE = ['scripts', 'env-copie.mjs'].join('/'), MORT = ['scripts', 'vieil-outil-oublie.mjs'].join('/');
    // Le doublon, le mort, et les temporaires.
    cpSync(join(copie, 'scripts', 'env.mjs'), join(copie, COPIE));
    writeFileSync(join(copie, MORT), '// outil que plus rien n appelle\nconsole.log(42);\n');
    git(copie, 'add', COPIE, MORT);
    git(copie, '-c', 'user.name=essai', '-c', 'user.email=essai@essai.invalid', 'commit', '-q', '--no-verify', '-m', 'essai : doublon et fichier mort');
    mkdirSync(join(copie, 'app', 'dist-casse'), { recursive: true });
    writeFileSync(join(copie, 'app', 'dist-casse', 'index.html'), '<p>copie cassée</p>');
    mkdirSync(join(temp, 'sito-essai-vieux-AbC123'), { recursive: true });
    writeFileSync(join(temp, 'sito-essai-vieux-AbC123', 'gros.bin'), Buffer.alloc(4096));
    const hier = new Date(Date.now() - 26 * 3600 * 1000);
    utimesSync(join(temp, 'sito-essai-vieux-AbC123'), hier, hier);
    mkdirSync(join(temp, 'sito-essai-en-cours-XyZ789'));          // un essai qui tourne : gardé
    mkdirSync(join(temp, 'autre-programme'));                     // pas à nous : gardé
    utimesSync(join(temp, 'autre-programme'), hier, hier);
    mkdirSync(join(copie, 'images', 'ravalement'), { recursive: true });
    writeFileSync(join(copie, 'images', 'ravalement', 'seule.png'), Buffer.alloc(2048, 7)); // jamais touchée
    const registre = readFileSync(join(copie, 'prospection', 'registre.json'), 'utf8');

    const lecture = auditer({ racine: copie, temp, corriger: false });
    ok(lecture.restes.length > 0, 'en lecture, la copie cassée rougit');
    ok(lecture.doublons.some((d) => d.startsWith(`${COPIE} = scripts/env.mjs`)), 'doublon trouvé, et c est la copie qui part (env.mjs gardé, plus cité)');
    ok(lecture.morts.includes(MORT), 'fichier mort trouvé');
    ok(!lecture.morts.includes(COPIE) && lecture.doublons.length === 1, 'le doublon n est pas compté deux fois');
    ok(lecture.temporaires.includes('%TEMP%/sito-essai-vieux-AbC123'), 'temporaire de %TEMP% trouvé');
    ok(lecture.temporaires.includes('app/dist-casse/'), 'copie de contre-essai app/dist-casse trouvée');
    ok(!lecture.temporaires.some((t) => t.includes('en-cours')), 'un essai de moins de deux heures n est pas un oubli');
    ok(existsSync(join(copie, COPIE)) && existsSync(join(copie, 'app', 'dist-casse')), 'en lecture, rien n est effacé');

    const correction = auditer({ racine: copie, temp, corriger: true });
    ok(correction.restes.length === 0, `après correction, rien ne reste (${correction.restes.join(' ; ') || 'rien'})`);
    ok(!existsSync(join(copie, COPIE)) && existsSync(join(copie, 'scripts', 'env.mjs')), 'doublon retiré, original gardé');
    ok(!existsSync(join(copie, MORT)), 'fichier mort retiré');
    const statut = git(copie, 'status', '--porcelain');
    ok(statut.split('\n').includes(`D  ${COPIE}`) && statut.split('\n').includes(`D  ${MORT}`),
      'les deux retraits sont passés par git rm (récupérables dans l historique)');
    ok(!existsSync(join(temp, 'sito-essai-vieux-AbC123')) && !existsSync(join(copie, 'app', 'dist-casse')), 'temporaires supprimés');
    ok(existsSync(join(temp, 'sito-essai-en-cours-XyZ789')) && existsSync(join(temp, 'autre-programme')), 'essai en cours et dossier d un autre programme gardés');
    ok(existsSync(join(copie, 'images', 'ravalement', 'seule.png')), 'images/ intact');
    ok(readFileSync(join(copie, 'prospection', 'registre.json'), 'utf8') === registre, 'registre intact');
    ok(git(copie, 'ls-files', 'scripts/env.mjs', 'scripts/essais.mjs', 'CLAUDE.md').trim().split('\n').length === 3, 'aucun fichier vivant retiré');

    const encore = auditer({ racine: copie, temp, corriger: false });
    ok(encore.doublons.length === 0 && encore.morts.length === 0 && encore.temporaires.length === 0, 'un second passage ne trouve plus rien');
  } catch (e) {
    fautes++; console.log(`FAUTE  essai interrompu : ${e.message}`);
  }
  if (fautes) console.log(`(copie gardée pour lecture : ${base})`); else rmSync(base, { recursive: true, force: true });
  console.log(`\n${n} contrôles, ${fautes} faute(s).${fautes ? '' : ' Dossier effacé.'}`);
  process.exit(fautes ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === ICI) {
  if (args.includes('--contre-essai')) contreEssai();
  const racine = resolve(option('--racine') || join(dirname(ICI), '..'));
  const temp = option('--temp') || tmpdir();
  const corriger = !args.includes('--lecture');
  const r = auditer({ racine, temp, corriger });
  const quand = quandParis();
  if (corriger) ecrireMemoire(racine, r, quand);
  process.stdout.write(rapport(r, quand));
  console.log(r.restes.length ? `\n${r.restes.length} chose(s) restent.` : '\nRien ne reste à corriger.');
  process.exit(r.restes.length ? 1 : 0);
}

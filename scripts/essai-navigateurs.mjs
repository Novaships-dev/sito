#!/usr/bin/env node
// Le rendu des sites dans un moteur de navigateur donné (tâche T49, constat
// S-007 : rien n'était essayé sur Safari).
//
// Fabrique un site d'abonné sur chacun des quatre archétypes, à partir de
// photos de synthèse (les vraies images ne sont pas dans Git : la CI n'en a
// pas), et lance dessus `verifier-mobile.mjs` et `verifier-ordinateur.mjs`
// avec le moteur demandé. Chaque vérificateur doit sortir 0.
//
//   node scripts/essai-navigateurs.mjs                       (Chromium)
//   node scripts/essai-navigateurs.mjs --navigateur webkit   (Safari)
//
// Sortie 3 si le moteur n'est pas installé (`npx playwright install webkit`) :
// la suite le dit « NON LANCÉ », jamais « vert ».
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { RACINE } from './env.mjs';

const iNav = process.argv.indexOf('--navigateur');
const MOTEUR = (iNav > -1 ? process.argv[iNav + 1] : process.env.SITO_NAVIGATEUR) || 'chromium';
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

const travail = mkdtempSync(join(tmpdir(), 'sito-navigateurs-'));
const dossierImages = join(travail, 'images');
mkdirSync(dossierImages);
// Des photos qui ont du relief (un dégradé), pas un aplat : la coupure avant /
// après et la palette se mesurent dessus.
const image = async (a, b) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1600" height="1100" fill="url(#g)"/></svg>`)).jpeg({ quality: 85 }).toBuffer();
for (const [nom, a, b] of [['hero', '#8a7b6a', '#e4ddd0'], ['avant-01', '#6d655c', '#8f877d'], ['apres-01', '#e9e3d6', '#d5cbb8'],
  ['chantier', '#7a5638', '#b89a7a'], ['geste', '#4f4f4f', '#8a8a8a'], ['detail-enduit', '#c8b494', '#e8dcc4']])
  writeFileSync(join(dossierImages, `${nom}.jpg`), await image(a, b));

const brut = (siren) => ({
  siren, nom_raison_sociale: 'Façades Essai', nom_complet: 'Façades Essai',
  date_creation: '2015-04-01', activite_principale: '43.99D', nature_juridique: '5710',
  siege: { siret: siren + '00017', adresse: '10 rue du Test', libelle_commune: 'Marseille', code_postal: '13001' },
  telephone: '0491234567', mentions: { courriel: 'contact@facades-essai.fr', directeur_publication: 'Jeanne Essai' },
  prix: { affiches: true, mention: 'Hors fournitures.', postes: [{ poste: 'Ravalement enduit', bas: 60, haut: 90, unite: '€/m²', note: '' }] },
});

let sortieFinale = 0;
try {
  console.log(`\nMoteur : ${MOTEUR}`);
  // Un site par archétype, deuxième page comprise (T52) : ces SIREN donnent
  // les quatre archétypes avec `le-travail.html` (tirage du 4 nov.).
  const vus = new Set();
  for (const siren of ['400000000', '400039595', '400047514', '400079190', '480423623', '732829320', '443061841', '350000105', '552100554', '378901946', '642050199']) {
    if (vus.size === 4) break;
    const sortie = join(travail, `site-${siren}`);
    const donnees = join(travail, `donnees-${siren}.json`);
    writeFileSync(donnees, JSON.stringify(brut(siren)));
    const r = spawnSync(process.execPath, [join(RACINE, 'generateur', 'composer.mjs'), '--siren', siren, '--metier', 'ravalement',
      '--images', dossierImages, '--sortie', sortie, '--donnees', donnees, '--registre', join(travail, `registre-${siren}.json`),
      '--publication', '--adresse', 'https://facades-essai.example.fr/'], { encoding: 'utf8', cwd: RACINE });
    if (!ok(r.status === 0, `fabrication ${siren}`, (r.stderr || '').trim().split('\n').slice(-1)[0])) continue;
    const arch = JSON.parse(readFileSync(join(sortie, 'donnees.json'), 'utf8')).archetype;
    if (vus.has(arch) || !existsSync(join(sortie, 'le-travail.html'))) continue;
    vus.add(arch);
    for (const v of ['verifier-mobile.mjs', 'verifier-ordinateur.mjs']) {
      // `verifier-mobile` juge un premier écran (titre, image, M1 à M3) :
      // l'accueil et la deuxième page, qui porte son propre titre (T52,
      // constat S-025 : elle rougissait M2 sur matiere). `verifier-ordinateur`
      // juge aussi la page des mentions (appel sur le premier écran, clavier).
      const pages = v === 'verifier-mobile.mjs' ? ['index.html', 'le-travail.html'] : ['index.html', 'le-travail.html', 'mentions-legales.html'];
      for (const p of pages) {
        const x = spawnSync(process.execPath, [join(RACINE, 'scripts', v), join(sortie, p), '--navigateur', MOTEUR], { encoding: 'utf8', cwd: RACINE });
        if (x.status === 3) { console.log(`  NON LANCÉ : ${MOTEUR} n est pas installé (npx playwright install ${MOTEUR})`); sortieFinale = 3; throw new Error('moteur absent'); }
        const sortieV = (x.stdout || x.stderr || '').trim();
        // Les constats en entier (le titre et le détail) : sans eux, une faute
        // de la CI ne se corrige pas.
        const constatsV = sortieV.split('\n\n').filter((b) => /\[BLOQUANT\]/.test(b)).map((b) => b.replace(/\s+/g, ' ').trim());
        ok(x.status === 0, `${arch} ${p} : ${v.replace('.mjs', '')} sous ${MOTEUR}`,
          constatsV.length ? constatsV.join(' || ') : sortieV.split('\n').slice(-3).join(' | '));
        for (const l of sortieV.split('\n').filter((l) => l.startsWith('NON ESSAYE'))) console.log(`  (${arch} ${p} : ${l})`);
      }
    }
  }
  ok(vus.size === 4, 'les quatre archétypes essayés, deuxième page comprise', [...vus].join(', '));
} catch (e) {
  if (sortieFinale !== 3) { fautes++; console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`); }
} finally {
  rmSync(travail, { recursive: true, force: true });
}

if (sortieFinale === 3) process.exit(3);
console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
process.exitCode = fautes ? 1 : 0;

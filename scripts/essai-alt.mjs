#!/usr/bin/env node
// Essai des textes alternatifs et des légendes des photos (tâche T55,
// constat S-023).
//
// Ce qu'il mesure, pour la couverture et la peinture, sur les quatre
// archétypes :
//   - chaque texte alternatif d'image vient du champ `alt` du fichier du
//     métier ; aucun ne parle de façade, d'enduit, d'échafaudage ni de taloche
//     si le fichier du métier ne le dit pas ;
//   - aucune légende du ravalement (« grattage à la lame », « filet ») ;
//   - `verifier-site` à 0, et son contrôle R-ALT rouge sur une copie où un
//     texte alternatif de façade est remis.
//
//   node scripts/essai-alt.mjs
//   node scripts/essai-alt.mjs --contre-essai   (générateur copié qui écrit
//        les anciens textes de façade : doit rougir)
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, cpSync, symlinkSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { RACINE } from './env.mjs';

const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const travail = mkdtempSync(join(tmpdir(), 'sito-alt-'));
let GEN = join(RACINE, 'generateur');
if (CONTRE) {
  GEN = join(travail, 'generateur');
  cpSync(join(RACINE, 'generateur'), GEN, { recursive: true });
  symlinkSync(join(RACINE, 'node_modules'), join(travail, 'node_modules'), 'dir');
  const f = join(GEN, 'composer.mjs');
  const avant = readFileSync(f, 'utf8');
  const apres = avant.replace("img(im.chantier, A('chantier'))", "img(im.chantier, 'échafaudage monté sur une façade')");
  if (apres === avant) { console.error('la copie cassée n a rien cassé'); process.exit(2); }
  writeFileSync(f, apres);
}

const images = join(travail, 'images');
mkdirSync(images);
for (const [nom, c] of Object.entries({ hero: [200, 190, 170], 'avant-01': [120, 110, 100], 'apres-01': [230, 225, 210],
  'avant-02': [110, 100, 95], 'apres-02': [225, 220, 205], chantier: [140, 90, 60], geste: [90, 90, 90], 'detail-matiere': [200, 180, 150] }))
  writeFileSync(join(images, `${nom}.jpg`), await sharp({ create: { width: 900, height: 620, channels: 3, background: { r: c[0], g: c[1], b: c[2] } } }).jpeg().toBuffer());
const decode = (x) => x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const MOTS = /façade|enduit|échafaudage|taloche/i;
const LEGENDES_RAVALEMENT = ['grattage à la lame', 'protection des menuiseries'];

try {
  for (const metier of ['couverture', 'peinture']) {
    console.log(`\n${metier}`);
    const alt = JSON.parse(readFileSync(join(RACINE, 'generateur', 'metiers', `${metier}.json`), 'utf8')).alt;
    const permis = new Set(Object.values(alt).map((x) => x.toLowerCase()));
    const vus = new Set();
    for (const siren of ['480423623', '732829320', '443061841', '350000105', '552100554', '378901946', '642050199', '316300182',
      '409785512', '820043784', '512345671', '799088410', '301234567', '423456789', '534567891', '645678912']) {
      if (vus.size === 4) break;
      const sortie = join(travail, `${metier}-${siren}`), fd = join(travail, `d-${siren}.json`);
      writeFileSync(fd, JSON.stringify({ siren, nom_raison_sociale: 'Essai Bâtiment', date_creation: '2015-04-01', nature_juridique: '5710',
        siege: { siret: siren + '00017', adresse: '10 rue du Test', libelle_commune: 'Marseille', code_postal: '13001' },
        telephone: '0491234567', mentions: { courriel: 'a@essai.fr', directeur_publication: 'Jeanne Essai' } }));
      const r = spawnSync(process.execPath, [join(GEN, 'composer.mjs'), '--siren', siren, '--metier', metier, '--images', images,
        '--sortie', sortie, '--donnees', fd, '--registre', join(travail, `r-${metier}-${siren}.json`), '--publication'], { encoding: 'utf8', cwd: RACINE });
      if (!ok(r.status === 0, `fabrication ${siren}`, (r.stderr || '').trim().split('\n').slice(-1)[0])) continue;
      const arch = JSON.parse(readFileSync(join(sortie, 'donnees.json'), 'utf8')).archetype;
      if (vus.has(arch)) continue;
      vus.add(arch);
      const pages = readdirSync(sortie).filter((f) => f.endsWith('.html'));
      const alts = pages.flatMap((p) => [...readFileSync(join(sortie, p), 'utf8').matchAll(/<img\b[^>]*\balt="([^"]*)"/g)].map((m) => decode(m[1])));
      const etrangers = [...new Set(alts.filter((a) => a && !permis.has(a.toLowerCase())))];
      ok(etrangers.length === 0, `${arch} : chaque texte alternatif vient du fichier du métier (${alts.length})`, etrangers.slice(0, 2).join(' ; '));
      const facade = [...new Set(alts.filter((a) => MOTS.test(a) && !permis.has(a.toLowerCase())))];
      ok(facade.length === 0, `${arch} : aucune façade, aucun enduit qui ne soit pas du métier`, facade.join(' ; '));
      const texte = pages.map((p) => readFileSync(join(sortie, p), 'utf8')).join('');
      ok(!LEGENDES_RAVALEMENT.some((l) => texte.includes(l)), `${arch} : aucune légende du ravalement`);
      const v = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), sortie], { encoding: 'utf8' });
      ok(v.status === 0, `${arch} : verifier-site à 0`, (v.stdout || '').split('\n').filter((l) => /BLOQUANT|^  \S/.test(l)).slice(0, 2).join(' | '));
      if (metier === 'couverture' && vus.size === 1) {
        const casse = join(travail, 'casse');
        cpSync(sortie, casse, { recursive: true });
        writeFileSync(join(casse, 'index.html'), readFileSync(join(casse, 'index.html'), 'utf8').replace(/(<img\b[^>]*\balt=")[^"]*"/, '$1échafaudage monté sur une façade"'));
        const vc = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), casse], { encoding: 'utf8' });
        ok(vc.status === 1 && /\[BLOQUANT\] R-ALT/.test(vc.stdout), 'copie avec un texte de façade : R-ALT rouge');
      }
    }
    ok(vus.size === 4, `${metier} : les quatre archétypes`, [...vus].join(', '));
  }
  console.log('\nUn métier sans texte alternatif');
  const sansAlt = join(travail, 'gen-sans-alt');
  if (!CONTRE) {
    cpSync(join(RACINE, 'generateur'), sansAlt, { recursive: true });
    const fm = join(sansAlt, 'metiers', 'peinture.json');
    const j = JSON.parse(readFileSync(fm, 'utf8')); delete j.alt.geste; writeFileSync(fm, JSON.stringify(j));
    if (!existsSync(join(travail, 'node_modules'))) symlinkSync(join(RACINE, 'node_modules'), join(travail, 'node_modules'), 'dir');
    const r = spawnSync(process.execPath, [join(sansAlt, 'composer.mjs'), '--siren', '480423623', '--metier', 'peinture', '--images', images,
      '--sortie', join(travail, 'sans-alt'), '--donnees', join(travail, 'd-480423623.json'), '--registre', join(travail, 'r-sans.json')], { encoding: 'utf8', cwd: RACINE });
    ok(r.status === 2 && /alt\.geste/.test(r.stderr), 'une clé absente arrête la fabrication et se nomme', `sortie ${r.status} ${(r.stderr || '').trim().slice(0, 100)}`);
  }
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  rmSync(travail, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
if (CONTRE) {
  console.log(fautes ? 'Contre-essai réussi : la copie cassée est attrapée.' : 'CONTRE-ESSAI RATÉ : la copie cassée passe.');
  process.exitCode = fautes ? 0 : 1;
} else process.exitCode = fautes ? 1 : 0;

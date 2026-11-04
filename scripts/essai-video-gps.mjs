#!/usr/bin/env node
// Essai du retrait de la position GPS des vidéos (tâche T46,
// `app/src/video.ts`), hors navigateur : le module de l'app est transpilé tel
// quel par TypeScript (celui de l'app), puis essayé sur des vidéos fabriquées
// par ffmpeg. Le parcours dans le navigateur est dans `essai-app.mjs`.
//
// Ce qu'il mesure :
//   - une MP4 avec `loci`, une MOV avec `©xyz` (Android) et une MOV avec la clé QuickTime
//     `com.apple.quicktime.location.ISO6709` (iPhone) perdent leur position
//     (ffprobe ne la lit plus, la chaîne n'est plus dans le fichier) ;
//   - les autres étiquettes restent (`com.apple.quicktime.make`) ;
//   - la taille ne change pas, la vidéo se décode encore entièrement (ffmpeg) ;
//   - une vidéo sans position reste identique, octet pour octet.
//
//   node scripts/essai-video-gps.mjs
//   node scripts/essai-video-gps.mjs --contre-essai   (copie qui n'efface que
//        `©xyz` : la MOV d'iPhone garde sa position, doit rougir)
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { RACINE } from './env.mjs';

const CONTRE = process.argv.includes('--contre-essai');
const present = (o) => spawnSync(o, ['-version'], { stdio: 'ignore' }).status === 0;
if (!present('ffmpeg') || !present('ffprobe')) { console.log('NON LANCÉ : ffmpeg ou ffprobe manque'); process.exit(4); }
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
const travail = mkdtempSync(join(tmpdir(), 'sito-video-gps-'));

try {
  const ts = createRequire(join(RACINE, 'app', 'package.json'))('typescript');
  let src = readFileSync(join(RACINE, 'app', 'src', 'video.ts'), 'utf8');
  if (CONTRE) {
    const avant = src;
    src = src.replace("if (visees.has(v.getUint32(item.debut + 4))) { effacer(octets, item); effacees++; }", '');
    if (src === avant) { console.error('la copie cassée n a rien cassé'); process.exit(2); }
  }
  writeFileSync(join(travail, 'video.mjs'), ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
  const { retirerPosition } = await import(pathToFileURL(join(travail, 'video.mjs')).href);

  const F = (n) => join(travail, n);
  const base = ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=160x120:rate=10', '-pix_fmt', 'yuv420p'];
  execFileSync('ffmpeg', [...base, '-metadata', 'location=+43.2965+005.3698/', F('android.mp4')]);
  execFileSync('ffmpeg', [...base, '-movflags', 'use_metadata_tags', '-metadata', 'com.apple.quicktime.location.ISO6709=+43.2965+005.3698+010.000/',
    '-metadata', 'com.apple.quicktime.make=Apple', F('iphone.mov')]);
  execFileSync('ffmpeg', [...base, '-metadata', 'location=+43.2965+005.3698/', F('xyz.mov')]);
  execFileSync('ffmpeg', [...base, F('sans.mp4')]);
  const etiquettes = (f) => execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', f], { encoding: 'utf8' });
  const decode = (f) => spawnSync('ffmpeg', ['-v', 'error', '-i', f, '-f', 'null', '-'], { encoding: 'utf8' });

  for (const [nom, attendu] of [['android.mp4', 1], ['xyz.mov', 1], ['iphone.mov', 1]]) {
    console.log(`\n${nom}`);
    const avant = readFileSync(F(nom));
    ok(/43\.2965/.test(etiquettes(F(nom))), 'la vidéo fabriquée porte bien une position (essai valable)');
    const octets = new Uint8Array(avant);
    const n = retirerPosition(octets);
    writeFileSync(F('net-' + nom), octets);
    ok(n >= attendu, `${n} boîte(s) effacée(s)`);
    ok(!/43\.2965/.test(etiquettes(F('net-' + nom))) && !Buffer.from(octets).includes('43.2965'), 'plus aucune position, ni pour ffprobe ni dans les octets');
    ok(octets.length === avant.length, 'même taille');
    const d = decode(F('net-' + nom));
    ok(d.status === 0 && !d.stderr.trim(), 'la vidéo se décode entièrement', d.stderr.trim().slice(0, 120));
    if (nom === 'iphone.mov') ok(/com\.apple\.quicktime\.make/.test(etiquettes(F('net-' + nom))), 'les autres étiquettes restent');
  }
  console.log('\nsans.mp4');
  const s = readFileSync(F('sans.mp4'));
  const o = new Uint8Array(s);
  ok(retirerPosition(o) === 0 && createHash('sha256').update(o).digest('hex') === createHash('sha256').update(s).digest('hex'), 'sans position : identique, octet pour octet');
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

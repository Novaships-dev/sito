#!/usr/bin/env node
// Essai de l'échappement du générateur (constat S-006, tâche T48).
//
// Ce qu'il mesure, dans le HTML tel que le navigateur le lit :
//   - `html()` et `jsonDansPage()` (generateur/echapper.mjs) ne laissent
//     passer aucun caractère qui ferme une balise, un attribut ou un bloc
//     <script>, et rendent le texte d'origine une fois décodés ;
//   - un site fabriqué avec un nom d'entreprise, une commune, un poste de
//     tarif, sa note et la mention des tarifs qui contiennent `"`, `'`,
//     `"><script>` et `</script>` : aucune balise ni aucun attribut injecté,
//     aucun script exécuté, le texte affiché tel quel, `verifier-site` à 0 ;
//   - un téléphone qui contient la même charge arrête la fabrication.
//
// Les sites sont fabriqués pour plusieurs SIREN, jusqu'à en avoir un dont le
// mot géant est l'enseigne : c'est là que le nom passe dans un attribut
// (`data-mot`), l'endroit que l'ancienne fonction laissait ouvert.
//
//   node scripts/essai-echappement.mjs
//   node scripts/essai-echappement.mjs --contre-essai   (générateur copié avec
//        l'ancienne fonction, qui n'échappait que & et < : doit rougir)
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, cpSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { RACINE } from './env.mjs';

const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

// ------------------------------------------------------ le générateur essayé
// Contre-essai : une copie du générateur, hors du dépôt (piège du 21 octobre),
// dont `echapper.mjs` reprend l'ancienne fonction. `node_modules` est un lien
// vers celui du dépôt, pour que sharp se charge.
const travail = mkdtempSync(join(tmpdir(), 'sito-echappement-'));
let GEN = join(RACINE, 'generateur');
if (CONTRE) {
  GEN = join(travail, 'generateur');
  cpSync(join(RACINE, 'generateur'), GEN, { recursive: true });
  symlinkSync(join(RACINE, 'node_modules'), join(travail, 'node_modules'), 'dir');
  const f = join(GEN, 'echapper.mjs');
  const avant = readFileSync(f, 'utf8');
  const apres = avant.replace(/export function html\(t\) \{[\s\S]*?\n\}/,
    "export function html(t) {\n  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');\n}");
  if (apres === avant) { console.error('la copie cassée n a rien cassé : echapper.mjs a changé de forme.'); process.exit(2); }
  writeFileSync(f, apres);
}
const { html, jsonDansPage } = await import(pathToFileURL(join(GEN, 'echapper.mjs')).href);

// La charge : ferme un attribut (", '), ouvre une balise, ferme un script.
const CHARGE = `" data-injecte="1 '><script>window.__injecte=1</script><img src=x onerror="window.__injecte=2"></script>`;

const decoder = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

console.log('\nLes deux fonctions');
const h = html(CHARGE);
ok(!/[<>"']/.test(h), 'html() : aucun < > " \' ne reste', h.slice(0, 80));
ok(decoder(h) === CHARGE, 'html() : le texte se retrouve une fois décodé');
ok(html('Façades & Fils') === 'Façades &amp; Fils', 'html() : & devient &amp;');
const objet = { name: CHARGE, note: '<!-- commentaire', ligne: 'a\u2028b' };
const j = jsonDansPage(objet);
ok(!/<\/script/i.test(j) && !j.includes('<!--') && !j.includes('<'), 'jsonDansPage() : ni </script>, ni <!--, ni <', j.slice(0, 80));
ok(!j.includes('\u2028'), 'jsonDansPage() : U+2028 échappé');
ok(JSON.stringify(JSON.parse(j)) === JSON.stringify(objet), 'jsonDansPage() : se relit à l identique');

// ------------------------------------------------------ les sites fabriqués
const image = (r, g, b) => sharp({ create: { width: 640, height: 480, channels: 3, background: { r, g, b } } }).jpeg().toBuffer();
const dossierImages = join(travail, 'images');
mkdirSync(dossierImages);
for (const [nom, c] of Object.entries({ hero: [200, 190, 170], 'avant-01': [120, 110, 100], 'apres-01': [230, 225, 210],
  chantier: [140, 90, 60], geste: [90, 90, 90], 'detail-enduit': [200, 180, 150] }))
  writeFileSync(join(dossierImages, `${nom}.jpg`), await image(...c));

// Le premier mot du nom devient le mot géant (attribut `data-mot`) : il porte
// une charge sans espace, pour qu'elle reste entière dans ce mot.
const CHARGE_MOT = `"data-injecte="1'><script>window.__injecte=1</script>`;
const NOM = `Façades${CHARGE_MOT} ${CHARGE} Essai`;
const brut = (siren, telephone = '0491234567') => ({
  siren, nom_raison_sociale: NOM, nom_complet: NOM,
  date_creation: '2015-04-01', activite_principale: '43.99D', nature_juridique: '5710',
  tranche_effectif_salarie: '03', complements: { est_rge: true },
  siege: { siret: siren + '00017', adresse: '10 rue du Test', libelle_commune: `Marseille${CHARGE}`, code_postal: '13001' },
  telephone,
  prix: { affiches: true, mention: `Hors fournitures${CHARGE}`, postes: [
    { poste: `Enduit${CHARGE}`, bas: 60, haut: 90, unite: '€/m²', note: `Note${CHARGE}` },
    { poste: 'Déplacement', bas: 80, haut: null, unite: '€', note: '' }] },
});

const fabriquer = (siren, telephone) => {
  const sortie = join(travail, `site-${siren}`);
  const donnees = join(travail, `donnees-${siren}.json`);
  writeFileSync(donnees, JSON.stringify(brut(siren, telephone)));
  const r = spawnSync(process.execPath, [join(GEN, 'composer.mjs'), '--siren', siren, '--metier', 'ravalement',
    '--images', dossierImages, '--sortie', sortie, '--donnees', donnees, '--registre', join(travail, `registre-${siren}.json`)],
    { encoding: 'utf8', cwd: RACINE });
  return { r, sortie };
};

const navigateur = await chromium.launch();
try {
  const SIRENS = ['480423623', '552100554', '732829320', '443061841', '378901946', '642050199', '316300182', '409785512',
    '820043784', '350000105', '512345671', '799088410', '301234567', '423456789', '534567891', '645678912',
    '756789123', '867891234', '978912345', '389123456'];
  let vusEnseigne = 0, sites = 0;
  const archetypes = new Set();
  for (const siren of SIRENS) {
    const { r, sortie } = fabriquer(siren);
    if (!ok(r.status === 0, `fabrication ${siren}`, (r.stderr || r.stdout || '').trim().split('\n').slice(-2).join(' | '))) continue;
    sites++;
    const d = JSON.parse(readFileSync(join(sortie, 'donnees.json'), 'utf8'));
    archetypes.add(d.archetype);
    const enseigne = d.charte.mot === 'enseigne';
    if (enseigne) vusEnseigne++;
    const pages = ['index.html', 'le-travail.html'].filter((p) => existsSync(join(sortie, p)));
    for (const p of pages) {
      const page = await navigateur.newPage();
      const erreurs = [];
      page.on('pageerror', (e) => erreurs.push(e.message));
      await page.goto(pathToFileURL(join(sortie, p)).href, { waitUntil: 'load' });
      const m = await page.evaluate(() => {
        const tous = [...document.querySelectorAll('*')];
        return {
          injecte: window.__injecte ?? null,
          scripts: document.querySelectorAll('script').length,
          attrInjecte: tous.filter((el) => el.hasAttribute('data-injecte')).length,
          gestionnaires: tous.flatMap((el) => [...el.attributes].filter((a) => /^on/i.test(a.name)).map((a) => `${el.tagName}.${a.name}`)),
          imagesX: document.querySelectorAll('img[src="x"]').length,
          texte: document.body.innerText,
          titre: document.title,
          mot: document.querySelector('[data-mot]')?.getAttribute('data-mot') ?? null,
        };
      });
      const quoi = `${siren} ${d.archetype}${enseigne ? ' (mot géant : enseigne)' : ''} ${p}`;
      ok(m.injecte === null, `${quoi} : aucun script injecté n a tourné`, String(m.injecte));
      ok(m.scripts === 1, `${quoi} : un seul <script>, celui du générateur`, `${m.scripts} balises script`);
      ok(m.attrInjecte === 0 && m.imagesX === 0 && m.gestionnaires.length === 0,
        `${quoi} : aucun attribut ni balise injectés`, `data-injecte ${m.attrInjecte}, img ${m.imagesX}, ${m.gestionnaires.join(' ')}`);
      ok(m.titre.includes('<script>window.__injecte=1</script>'), `${quoi} : le nom s affiche tel quel dans le titre`, m.titre.slice(0, 80));
      if (p === 'index.html' && d.charte.structure?.prix)
        ok(m.texte.includes(`Enduit${CHARGE}`.split('\n')[0].slice(0, 40)), `${quoi} : le poste de tarif s affiche tel quel`);
      if (m.mot !== null && enseigne)
        ok(m.mot.includes('"DATA-INJECTE="1\'><SCRIPT>'), `${quoi} : data-mot garde la charge comme texte`, m.mot.slice(0, 60));
      ok(erreurs.length === 0, `${quoi} : aucune erreur JavaScript`, erreurs.join(' | '));
      await page.close();
    }
    const v = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), sortie], { encoding: 'utf8' });
    ok(v.status === 0, `${siren} : verifier-site à 0`, (v.stdout || v.stderr || '').trim().split('\n').slice(-3).join(' | '));
    if (vusEnseigne >= 1 && archetypes.size === 4) break;
  }
  ok(archetypes.size === 4, 'les quatre archétypes essayés', [...archetypes].join(', '));
  ok(vusEnseigne >= 1, 'au moins un site dont le mot géant est l enseigne (le nom dans un attribut)', `${sites} sites, archétypes ${[...archetypes].join(', ')}`);
  console.log(`  (${sites} sites fabriqués, archétypes : ${[...archetypes].join(', ')})`);

  console.log('\nLe téléphone');
  const { r: rt } = fabriquer('480423623', `04 91${CHARGE}`);
  ok(rt.status === 2 && /numero de telephone invalide/.test(rt.stderr), 'un téléphone qui porte la charge arrête la fabrication', `sortie ${rt.status}`);
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  await navigateur.close();
  rmSync(travail, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
if (CONTRE) {
  console.log(fautes ? 'Contre-essai réussi : l ancienne fonction est attrapée.' : 'CONTRE-ESSAI RATÉ : l ancienne fonction passe.');
  process.exitCode = fautes ? 0 : 1;
} else process.exitCode = fautes ? 1 : 0;

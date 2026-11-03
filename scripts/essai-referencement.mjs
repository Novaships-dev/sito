#!/usr/bin/env node
// Essai du référencement (tâche T51, constat S-003, docs/specs/S-REFERENCEMENT.md).
//
// Ce qu'il mesure :
//   - un site d'abonné avec son adresse, sur les quatre archétypes : pas de
//     noindex, URL canonique par page, Open Graph complet avec une image de
//     1 200 × 630 qui existe, données structurées lisibles tirées des données
//     (nom, adresse, téléphone, type du métier), aucune note ni avis,
//     robots.txt qui autorise, plan du site avec chaque page, icônes ;
//     `verifier-site` à 0 ;
//   - le type schema.org vient du fichier métier (couverture : RoofingContractor) ;
//   - un site d'abonné sans adresse : rien d'absolu inventé, et un avertissement ;
//   - un site de prospection : noindex, aucune donnée structurée, ni robots.txt
//     ni plan du site ;
//   - les contrôles R-REGIME, R-OG, R-JSONLD, R-SITE rougissent chacun sur une
//     copie cassée.
//
//   node scripts/essai-referencement.mjs
//   node scripts/essai-referencement.mjs --contre-essai   (générateur copié qui
//        met noindex partout : doit rougir)
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, cpSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { RACINE } from './env.mjs';

const CONTRE = process.argv.includes('--contre-essai');
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

const travail = mkdtempSync(join(tmpdir(), 'sito-referencement-'));
let GEN = join(RACINE, 'generateur');
if (CONTRE) {
  GEN = join(travail, 'generateur');
  cpSync(join(RACINE, 'generateur'), GEN, { recursive: true });
  symlinkSync(join(RACINE, 'node_modules'), join(travail, 'node_modules'), 'dir');
  const f = join(GEN, 'sections', 'referencement.mjs');
  const avant = readFileSync(f, 'utf8');
  const apres = avant.replace("abonne ? '' : '<meta name=\"robots\" content=\"noindex, nofollow\">'", "'<meta name=\"robots\" content=\"noindex, nofollow\">'");
  if (apres === avant) { console.error('la copie cassée n a rien cassé : referencement.mjs a changé de forme.'); process.exit(2); }
  writeFileSync(f, apres);
}

const image = (r, g, b) => sharp({ create: { width: 1600, height: 1000, channels: 3, background: { r, g, b } } }).jpeg().toBuffer();
const dossierImages = join(travail, 'images');
mkdirSync(dossierImages);
for (const [nom, c] of Object.entries({ hero: [200, 190, 170], 'avant-01': [120, 110, 100], 'apres-01': [230, 225, 210],
  chantier: [140, 90, 60], geste: [90, 90, 90], 'detail-enduit': [200, 180, 150] }))
  writeFileSync(join(dossierImages, `${nom}.jpg`), await image(...c));

const brut = (siren) => ({
  siren, nom_raison_sociale: 'Façades Essai', nom_complet: 'Façades Essai',
  date_creation: '2015-04-01', activite_principale: '43.99D', nature_juridique: '5710',
  siege: { siret: siren + '00017', adresse: '10 rue du Test', libelle_commune: 'Marseille', code_postal: '13001' },
  telephone: '0491234567', mentions: { courriel: 'contact@facades-essai.fr', directeur_publication: 'Jeanne Essai' },
});
let n = 0;
const fabriquer = (siren, { publication = true, adresse = 'https://facades-essai.example.fr/', metier = 'ravalement' } = {}) => {
  const sortie = join(travail, `site-${++n}`);
  const fichier = join(travail, `donnees-${n}.json`);
  writeFileSync(fichier, JSON.stringify(brut(siren)));
  const args = [join(GEN, 'composer.mjs'), '--siren', siren, '--metier', metier, '--images', dossierImages,
    '--sortie', sortie, '--donnees', fichier, '--registre', join(travail, `registre-${n}.json`)];
  if (publication) args.push('--publication');
  if (adresse) args.push('--adresse', adresse);
  return { r: spawnSync(process.execPath, args, { encoding: 'utf8', cwd: RACINE }), sortie };
};
const verifier = (d) => spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), d], { encoding: 'utf8' });
const lire = (d, f) => readFileSync(join(d, f), 'utf8');
const meta = (t, nom) => (t.match(new RegExp(`<meta (?:name|property)="${nom}" content="([^"]*)"`)) || [])[1];
const jsonld = (t) => [...t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const A = 'https://facades-essai.example.fr/';

try {
  console.log('\nSites d abonné avec adresse, les quatre archétypes');
  const SIRENS = ['480423623', '732829320', '443061841', '350000105', '552100554', '378901946', '642050199', '316300182'];
  const vus = new Map();
  for (const siren of SIRENS) {
    if (vus.size === 4) break;
    const { r, sortie } = fabriquer(siren);
    if (!ok(r.status === 0, `fabrication ${siren}`, (r.stderr || '').trim().split('\n').slice(-1)[0])) continue;
    const arch = JSON.parse(lire(sortie, 'donnees.json')).archetype;
    if (vus.has(arch)) continue;
    vus.set(arch, sortie);
    const pages = ['index.html', 'le-travail.html', 'mentions-legales.html'].filter((p) => existsSync(join(sortie, p)));
    for (const p of pages) {
      const t = lire(sortie, p);
      const url = A + (p === 'index.html' ? '' : p.replace(/\.html$/, ''));
      ok(!/name="robots"/.test(t), `${arch} ${p} : pas de noindex`);
      ok(t.includes(`<link rel="canonical" href="${url}">`) && meta(t, 'og:url') === url, `${arch} ${p} : URL canonique et og:url = ${url}`);
      ok(meta(t, 'og:title') && meta(t, 'og:description') && meta(t, 'og:image') === A + 'images/partage.jpg', `${arch} ${p} : og:title, og:description, og:image`);
      ok(jsonld(t).length === (p === 'index.html' ? 1 : 0), `${arch} ${p} : JSON-LD sur l accueil seulement`);
    }
    const d = JSON.parse(jsonld(lire(sortie, 'index.html'))[0]);
    ok(d['@type'] === 'HomeAndConstructionBusiness' && d.name === 'Façades Essai' && d.telephone === '+33491234567' && d.url === A,
      `${arch} : JSON-LD tiré des données (type, nom, téléphone, url)`, JSON.stringify(d).slice(0, 120));
    ok(d.address?.streetAddress === '10 rue du Test' && d.address.postalCode === '13001' && d.address.addressLocality === 'Marseille',
      `${arch} : adresse complète depuis Sirene`);
    ok(!('aggregateRating' in d) && !('review' in d) && !('priceRange' in d) && !('openingHoursSpecification' in d),
      `${arch} : ni note, ni avis, ni prix, ni horaires inventés`);
    const og = await sharp(join(sortie, 'images', 'partage.jpg')).metadata();
    ok(og.width === 1200 && og.height === 630 && og.format === 'jpeg', `${arch} : image de partage 1200 × 630 JPEG`, `${og.width}×${og.height} ${og.format}`);
    const ico = readFileSync(join(sortie, 'favicon.ico'));
    ok(ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) === 1 && ico.subarray(22, 26).toString('latin1') === '\x89PNG'
      && (await sharp(join(sortie, 'icone-180.png')).metadata()).width === 180, `${arch} : favicon.ico (PNG 32 px) et icône 180 px`);
    const robots = lire(sortie, 'robots.txt'), plan = lire(sortie, 'sitemap.xml');
    ok(/^Allow: \/$/m.test(robots) && robots.includes(`Sitemap: ${A}sitemap.xml`), `${arch} : robots.txt autorise et cite le plan`);
    ok(pages.every((p) => plan.includes(`<loc>${A}${p === 'index.html' ? '' : p.replace(/\.html$/, '')}</loc>`)), `${arch} : plan du site avec les ${pages.length} pages`);
    const v = verifier(sortie);
    ok(v.status === 0, `${arch} : verifier-site à 0`, (v.stdout || '').trim().split('\n').slice(-3).join(' | '));
  }
  ok(vus.size === 4, 'les quatre archétypes essayés', [...vus.keys()].join(', '));

  console.log('\nLe type du métier');
  const { r: rc, sortie: sc } = fabriquer('480423623', { metier: 'couverture' });
  ok(rc.status === 0 && JSON.parse(jsonld(lire(sc, 'index.html'))[0])['@type'] === 'RoofingContractor', 'couverture : RoofingContractor');

  console.log('\nSite d abonné sans adresse');
  const { r: rs, sortie: ss } = fabriquer('480423623', { adresse: null });
  if (ok(rs.status === 0, 'fabriqué')) {
    const t = lire(ss, 'index.html');
    ok(!t.includes('rel="canonical"') && !meta(t, 'og:url') && !existsSync(join(ss, 'sitemap.xml')) && meta(t, 'og:image') === 'images/partage.jpg',
      'ni URL canonique, ni og:url, ni plan du site ; og:image relative');
    ok(!('url' in JSON.parse(jsonld(t)[0])), 'JSON-LD sans url inventée');
    const v = verifier(ss);
    ok(v.status === 0 && /R-ADRESSE/.test(v.stdout), 'verifier-site à 0, avec l avertissement R-ADRESSE');
  }
  const { r: rx } = fabriquer('480423623', { adresse: 'http://pas-https.example.fr' });
  ok(rx.status === 2 && /adresse publique invalide/.test(rx.stderr), 'adresse sans https : fabrication arrêtée');

  console.log('\nSite de prospection');
  const { r: rp, sortie: sp } = fabriquer('480423623', { publication: false, adresse: null });
  if (ok(rp.status === 0, 'fabriqué')) {
    const t = lire(sp, 'index.html');
    ok(/<meta name="robots" content="noindex, nofollow">/.test(t), 'noindex présent');
    ok(jsonld(t).length === 0 && !existsSync(join(sp, 'robots.txt')) && !existsSync(join(sp, 'sitemap.xml')), 'ni JSON-LD, ni robots.txt, ni plan du site');
    ok(meta(t, 'og:title') && meta(t, 'og:image'), 'aperçu de partage présent (le lien part par SMS)');
    ok(verifier(sp).status === 0, 'verifier-site à 0');
  }

  console.log('\nLes contrôles de verifier-site, sur des copies cassées');
  const sain = vus.get('matiere') || [...vus.values()][0];
  if (sain) {
    const cas = [
      ['abonné en noindex', 'R-REGIME', (d) => writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace('<!-- referencement -->', '<!-- referencement -->\n<meta name="robots" content="noindex">'))],
      ['og:image absent', 'R-OG', (d) => writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace(/<meta property="og:image"[^>]*>/, ''))],
      ['og:image vers un fichier absent', 'R-OG', (d) => rmSync(join(d, 'images', 'partage.jpg'))],
      ['JSON-LD illisible', 'R-JSONLD', (d) => writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace('{"@context"', '{"@context"{'))],
      ['JSON-LD sans adresse', 'R-JSONLD', (d) => writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace('"streetAddress":"10 rue du Test",', ''))],
      ['téléphone inventé', 'R-JSONLD', (d) => writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace('"telephone":"+33491234567"', '"telephone":"+33600000000"'))],
      ['note sur soi-même', 'R-JSONLD', (d) => writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace('"areaServed"', '"aggregateRating":{"ratingValue":5},"areaServed"'))],
      ['robots.txt qui interdit', 'R-SITE', (d) => writeFileSync(join(d, 'robots.txt'), 'User-agent: *\nDisallow: /\n')],
      ['plan du site sans une page', 'R-SITE', (d) => writeFileSync(join(d, 'sitemap.xml'), lire(d, 'sitemap.xml').replace(/<url><loc>[^<]*mentions-legales<\/loc>[^\n]*\n/, ''))],
    ];
    for (const [quoi, num, casser] of cas) {
      const d = join(travail, `casse-${quoi.replace(/\W+/g, '-')}`);
      cpSync(sain, d, { recursive: true }); casser(d);
      const v = verifier(d);
      ok(v.status === 1 && v.stdout.includes(`[BLOQUANT] ${num}`), `${quoi} : ${num} rouge`, `sortie ${v.status}`);
    }
    if (existsSync(join(travail, 'site-' + 1)) && sp) {
      const d = join(travail, 'casse-prospection');
      cpSync(sp, d, { recursive: true });
      writeFileSync(join(d, 'index.html'), lire(d, 'index.html').replace('<meta name="robots" content="noindex, nofollow">', ''));
      const v = verifier(d);
      ok(v.status === 1 && v.stdout.includes('[BLOQUANT] R-REGIME'), 'prospection sans noindex : R-REGIME rouge');
    }
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

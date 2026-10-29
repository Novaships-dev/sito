#!/usr/bin/env node
// Essai de la publication privée des sites de prospection
// (`scripts/prospection/publier.mjs`), sans compte Cloudflare.
//
//   node scripts/essai-publication-prospection.mjs
//   node scripts/essai-publication-prospection.mjs --contre-essai
//
// Le faux Cloudflare (`scripts/faux-cloudflare.mjs`) est un `fetch` passé au
// **vrai** client : c'est le code qui partira en ligne qui est mesuré. Ce que
// l'essai ne prouve pas : la première publication réelle (action **F5**).
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { RACINE } from './env.mjs';
import { fauxCloudflare } from './faux-cloudflare.mjs';
import { clientCloudflare, empreinte } from './prospection/cloudflare-pages.mjs';
import { publier, plan, ENTETES, ROBOTS, JOURS } from './prospection/publier.mjs';

const JOUR = '2026-10-25';
let controles = 0, fautes = 0;
function ok(condition, nom, detail = '') {
  controles++;
  if (condition) return true;
  fautes++;
  console.log(`  FAUTE ${nom}${detail ? ` — ${detail}` : ''}`);
  return false;
}
const ARANGER = [];
const temp = (quoi) => {
  const d = join(tmpdir(), `sito-pub-${quoi}-${Math.random().toString(36).slice(2, 10)}`);
  mkdirSync(d, { recursive: true });
  ARANGER.push(d);
  return d;
};
process.on('exit', () => { for (const d of ARANGER) { try { rmSync(d, { recursive: true, force: true }); } catch { /* parti */ } } });

// Trois petits sites, avec une image que les trois partagent : c'est elle qui
// doit ne monter qu'une fois.
const IMAGE = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
function fabriquerSite(racine, siren, slug, { propre = 'commune' } = {}) {
  const d = join(racine, siren);
  mkdirSync(join(d, 'images'), { recursive: true });
  writeFileSync(join(d, 'index.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${siren}</title></head><body><h1>${siren}</h1><img src="images/facade.webp" alt="Façade"><a href="le-travail">Le travail</a></body></html>`);
  writeFileSync(join(d, 'le-travail.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Le travail</title></head><body><h1>${siren}</h1></body></html>`);
  // Ce qui ne doit JAMAIS partir en ligne.
  writeFileSync(join(d, 'donnees.json'), '{"interne":true}');
  writeFileSync(join(d, 'sirene.json'), '{"siren":"' + siren + '"}');
  writeFileSync(join(d, '.cache'), 'rien');
  // L'image partagée, identique dans les trois sites ; et une image propre.
  writeFileSync(join(d, 'images', 'facade.webp'), IMAGE);
  writeFileSync(join(d, 'images', 'propre.webp'), Buffer.concat([IMAGE, Buffer.from(propre)]));
  return { siren, slug, dossier: d, metier: 'ravalement' };
}

const SIRENS = [['749892089', 'aaaaaaaaaaaaaaa1'], ['839830775', 'bbbbbbbbbbbbbbb2'], ['978759389', 'ccccccccccccccc3']];
const racineSites = temp('sites');
const lot = SIRENS.map(([siren, slug], i) => fabriquerSite(racineSites, siren, slug, { propre: 'p' + i }));

const registre = {
  version: 1,
  fiches: Object.fromEntries(SIRENS.map(([siren, slug]) => [siren,
    { metier: 'ravalement', nom: 'ESSAI ' + siren, commune: 'MARSEILLE', site_le: JOUR, slug, statut: 'a-appeler', appele_le: null, relance_le: null, note: 70 }])),
};

const faux = fauxCloudflare({ projets: [] });
const client = clientCloudflare({ compte: faux.compte, jeton: faux.jeton, fetch: faux.fetch });

console.log('Publication privée des sites de prospection\n');

// ------------------------------------------------- l empreinte, contre des témoins
// Ces empreintes-là sont écrites en dur **exprès**. Les calculer avec la
// fonction qu'on essaie ne prouverait rien : le jour où elle changerait
// d'algorithme, l'attente changerait avec elle et l'essai resterait vert (c'est
// arrivé, premier contre-essai du 25 octobre). Elles valent donc témoin :
//   blake3(base64(contenu) + extension sans le point), hexadécimal, 32 signes,
// c'est-à-dire ce que fait `hashFile` de `@cloudflare/deploy-helpers`, le code
// dont wrangler se sert. Le blake3 de `hash-wasm` a été recoupé avec les
// vecteurs officiels (chaîne vide et « abc »).
console.log('L empreinte est bien celle que Cloudflare attend');
ok(await empreinte(IMAGE, 'images/facade.webp') === 'cc8f7890c60026ae26fc9086b1a5fbef',
  'l empreinte d un .webp connu est celle attendue', await empreinte(IMAGE, 'images/facade.webp'));
ok(await empreinte(Buffer.from('bonjour'), 'a/b.txt') === '090d3e384055175b02a095802a36cc3b',
  'l empreinte d un .txt connu est celle attendue', await empreinte(Buffer.from('bonjour'), 'a/b.txt'));
// L'extension entre dans l'empreinte : un même contenu rangé sous deux
// extensions donne deux empreintes. Un algorithme qui n'en tiendrait pas
// compte (un SHA du seul contenu, par exemple) tomberait ici.
ok(await empreinte(Buffer.from('bonjour'), 'b.html') === '9644668cd9cf979fa41b9b7bb53bdfb6',
  'le même contenu en .html donne une autre empreinte');
ok(await empreinte(Buffer.from('bonjour'), 'b.txt') !== await empreinte(Buffer.from('bonjour'), 'b.html'),
  'l extension compte dans l empreinte');
ok((await empreinte(IMAGE, 'x.webp')).length === 32 && /^[0-9a-f]+$/.test(await empreinte(IMAGE, 'x.webp')),
  'une empreinte fait 32 signes hexadécimaux');

// --------------------------------------------------------- le plan, sans réseau
console.log('Qui reste en ligne, qui part');
const vieux = {
  version: 1,
  fiches: {
    111111111: { slug: 'd'.repeat(16), site_le: '2026-09-01', statut: 'a-appeler' },        // 54 jours
    222222222: { slug: 'e'.repeat(16), site_le: '2026-09-01', statut: 'abonne-mois' },      // signé
    333333333: { slug: 'f'.repeat(16), site_le: JOUR, statut: 'ne-plus-appeler' },          // retrait le jour même
    444444444: { slug: 'g'.repeat(16), site_le: '2026-09-25', statut: 'a-appeler' },        // 30 jours pile
    555555555: { slug: null, site_le: null, statut: 'a-appeler' },                          // aucun site
    // Deux dates mal formées, et la seconde est la plus traîtresse : « le 3
    // mars » n'est pas NaN pour `Date.parse`, qui y lit mars 2001 et donne un
    // âge de 9 367 jours. Les deux doivent être vues comme illisibles.
    666666666: { slug: 'h'.repeat(16), site_le: 'jamais-une-date', statut: 'a-appeler' },
    777777777: { slug: 'i'.repeat(16), site_le: 'le 3 mars', statut: 'a-appeler' },
    888888888: { slug: 'j'.repeat(16), site_le: '2026-13-45', statut: 'a-appeler' },
  },
};
const p = plan(vieux, { jour: JOUR });
const garde = (s) => p.gardes.some((g) => g.slug === s);
const retire = (s) => p.retires.some((g) => g.slug === s);
ok(retire('d'.repeat(16)), 'un site non signé de 54 jours est retiré');
ok(garde('e'.repeat(16)), 'un abonné garde son site, quel que soit son âge');
ok(retire('f'.repeat(16)), '« ne plus appeler » retire le site le jour même');
ok(garde('g'.repeat(16)), `un site de ${JOURS} jours pile reste (la limite est « plus de ${JOURS} »)`);
ok(retire('h'.repeat(16)), 'une date de site illisible fait retirer, pas garder (on ne garde pas ce qu on ne sait pas dater)');
// Celle-ci est la vraie leçon : `Date.parse('le 3 mars')` ne rend pas NaN.
ok(retire('i'.repeat(16)), 'une date que Date.parse lit de travers (« le 3 mars ») est vue comme illisible');
ok(p.retires.find((r) => r.slug === 'i'.repeat(16))?.motif.includes('illisible'),
  'et son motif dit « illisible », pas un âge inventé de 9 367 jours',
  p.retires.find((r) => r.slug === 'i'.repeat(16))?.motif);
ok(retire('j'.repeat(16)), 'un jour impossible (2026-13-45) est illisible aussi');
ok(p.gardes.length + p.retires.length === 7, 'une fiche sans slug n est ni gardée ni retirée', `${p.gardes.length}+${p.retires.length}`);
ok(p.retires.every((r) => r.motif), 'chaque retrait dit son motif');

// ------------------------------------------------------------- la publication
console.log('\nLa publication');
const enLigne = join(temp('memoire'), 'en-ligne.json');
const bilan = await publier({ lot, registre, jour: JOUR, client, enLigne, dire: () => {} });

ok(bilan.publie === true, 'le lot est publié');
ok(bilan.slugs.length === 3, 'les trois sites sont en ligne', `${bilan.slugs.length}`);
ok(/^https:\/\/[0-9a-f]+\.sito-demo\.pages\.dev$/.test(bilan.url || ''), 'Cloudflare rend une adresse de dépôt', bilan.url || '(aucune)');
ok(faux.dernier?.branche === 'main', 'le dépôt part sur la branche de production');

const m = faux.dernier.manifeste;
ok(Object.keys(m).every((c) => c === '/robots.txt' || SIRENS.some(([, s]) => c.startsWith('/' + s + '/'))),
  'chaque chemin du manifeste vit sous son slug, sauf robots.txt, et commence par « / » (sans elle, Cloudflare rend 404)');

// ------------------------------------------------- rien d indexable, aucun index
console.log('\nRien d indexable, aucune page d accueil');
const racine = faux.servir('/');
ok(racine.statut === 404, 'la racine du projet rend 404 : aucune page d index', `${racine.statut}`);
ok(!m['index.html'] && !m['/index.html'], 'le manifeste ne porte aucune page d accueil à la racine');

const page = faux.servir(`/${SIRENS[0][1]}/`);
ok(page.statut === 200, 'le site se sert sous son slug', `${page.statut}`);
ok(/noindex/.test(page.entetes['X-Robots-Tag'] || ''), 'la page porte X-Robots-Tag: noindex', page.entetes['X-Robots-Tag'] || '(aucun)');
const image = faux.servir(`/${SIRENS[0][1]}/images/facade.webp`);
ok(image.statut === 200 && /noindex/.test(image.entetes['X-Robots-Tag'] || ''), 'les images aussi portent noindex');
ok(image.entetes['Content-Type'] === 'image/webp', 'une image webp est annoncée comme telle', image.entetes['Content-Type']);
const interne = faux.servir(`/${SIRENS[0][1]}/le-travail`);
ok(interne.statut === 200, 'une page interne se sert sans son extension', `${interne.statut}`);

const robots = faux.servir('/robots.txt');
ok(robots.statut === 200 && /Disallow: \/$/m.test(robots.corps.toString()), 'robots.txt interdit tout', robots.corps?.toString().trim());
ok(/noindex/.test(ENTETES) && /^\/\*$/m.test(ENTETES), '_headers couvre tout le projet (/*)');

// --------------------------------------- ce qui ne part jamais en ligne
console.log('\nCe qui ne part jamais en ligne');
for (const interdit of ['donnees.json', 'sirene.json', '.cache']) {
  ok(!Object.keys(m).some((c) => c.endsWith('/' + interdit)), `${interdit} n est pas publié`);
  ok(faux.servir(`/${SIRENS[0][1]}/${interdit}`).statut === 404, `${interdit} rend 404`);
}

// ---------------------------------------------- les images communes, une fois
console.log('\nLes images communes ne montent qu une fois');
const cleImage = await empreinte(IMAGE, 'images/facade.webp');
const cheminsDeLImage = Object.entries(m).filter(([, h]) => h === cleImage).map(([c]) => c);
ok(cheminsDeLImage.length === 3, 'les trois sites désignent la même empreinte pour l image partagée', `${cheminsDeLImage.length} chemins`);
ok(faux.magasin.has(cleImage), 'l image partagée est bien dans le magasin');
const corpsParHash = new Set([...faux.magasin.keys()]);
ok(corpsParHash.size === bilan.envoyes, 'le magasin contient exactement ce qui a été envoyé', `${corpsParHash.size} / ${bilan.envoyes}`);
// 3 index + 3 pages internes + 1 image partagée + 3 images propres + robots.txt
ok(bilan.envoyes === 11, 'onze contenus distincts montés pour trois sites (l image partagée comptée une fois)', `${bilan.envoyes}`);
ok(Object.keys(m).length === 3 * 4 + 1, 'treize chemins au manifeste (quatre par site, plus robots.txt)', `${Object.keys(m).length}`);

// ------------------------------------- un second dépôt ne renvoie rien pour rien
console.log('\nUn second dépôt ne renvoie que ce qui a changé');
const avant = faux.envois();
const bilan2 = await publier({ lot, registre, jour: JOUR, client, enLigne, dire: () => {} });
ok(bilan2.envoyes === 0, 'rien à renvoyer : tout est déjà dans le magasin', `${bilan2.envoyes} envoyé(s)`);
ok(faux.envois() === avant, 'aucun appel d envoi n a été fait', `${faux.envois() - avant} appel(s)`);
ok(faux.deploiements.length === 2, 'un second dépôt a bien eu lieu', `${faux.deploiements.length}`);

// ------------------------------- un site retiré disparaît, sans etre refabrique
console.log('\nUn retrait enlève le site du projet');
const avecRetrait = JSON.parse(JSON.stringify(registre));
avecRetrait.fiches[SIRENS[1][0]].statut = 'ne-plus-appeler';
// Sans lot : les deux sites gardés se redéploient depuis en-ligne.json, leurs
// dossiers n'étant plus nécessaires.
rmSync(racineSites, { recursive: true, force: true });
const bilan3 = await publier({ lot: [], registre: avecRetrait, jour: JOUR, client, enLigne, dire: () => {} });
ok(bilan3.publie === true, 'le projet se redéploie sans aucun dossier de site sur le disque');
ok(bilan3.envoyes === 0, 'et sans renvoyer un seul fichier', `${bilan3.envoyes}`);
ok(bilan3.slugs.length === 2, 'il ne reste que deux sites', `${bilan3.slugs.length}`);
ok(!bilan3.slugs.includes(SIRENS[1][1]), 'le slug retiré n est plus au manifeste');
ok(faux.servir(`/${SIRENS[1][1]}/`).statut === 404, 'son adresse rend 404');
ok(faux.servir(`/${SIRENS[0][1]}/`).statut === 200, 'les autres sites répondent toujours');
ok(bilan3.sansPlan.length === 0, 'aucun site gardé n a perdu son plan', bilan3.sansPlan.map((s) => s.slug).join(', '));

const memoire = JSON.parse(readFileSync(enLigne, 'utf8'));
ok(Object.keys(memoire.sites).length === 2, 'en-ligne.json ne garde que les deux sites restants', `${Object.keys(memoire.sites).length}`);
ok(!JSON.stringify(memoire).includes(faux.jeton), 'en-ligne.json ne porte aucun jeton');

// ------------------- un site fabriqué mais retiré ne part pas en ligne
// C'est le registre qui décide, pas le dossier sur le disque : l'artisan a pu
// dire « ne plus appeler » entre la fabrication du lot et sa publication.
console.log('\nUn site du lot que le registre ne garde pas ne part pas en ligne');
const faux4 = fauxCloudflare({ projets: ['sito-demo'] });
const client4 = clientCloudflare({ compte: faux4.compte, jeton: faux4.jeton, fetch: faux4.fetch });
const racine4 = temp('sites-retrait');
const lot4 = SIRENS.map(([siren, slug], i) => fabriquerSite(racine4, siren, slug, { propre: 'q' + i }));
const regRetrait = JSON.parse(JSON.stringify(registre));
regRetrait.fiches[SIRENS[2][0]].statut = 'ne-plus-appeler';
const bilan4 = await publier({ lot: lot4, registre: regRetrait, jour: JOUR, client: client4, enLigne: join(temp('m4'), 'en-ligne.json'), dire: () => {} });
ok(!bilan4.slugs.includes(SIRENS[2][1]), 'le site retiré n est pas publié, même s il est dans le lot et sur le disque');
ok(bilan4.slugs.length === 2, 'seuls les deux autres sont en ligne', `${bilan4.slugs.length}`);
ok(bilan4.ecartes.length === 1 && bilan4.ecartes[0].slug === SIRENS[2][1], 'le bilan dit qu il a été écarté');
ok(faux4.servir(`/${SIRENS[2][1]}/`).statut === 404, 'son adresse rend 404');
ok(!Object.keys(faux4.dernier.manifeste).some((c) => c.startsWith(SIRENS[2][1] + '/')), 'aucun de ses fichiers n est au manifeste');
// Et ses fichiers n'ont même pas été envoyés : rien de lui n'est chez Cloudflare.
const sienne = await empreinte(Buffer.concat([IMAGE, Buffer.from('q2')]), 'images/propre.webp');
ok(!faux4.magasin.has(sienne), 'son image propre n a même pas été montée');

// ----------------------------------------------- les deux signatures de l API
console.log('\nLes deux signatures de l API Cloudflare');
const avecMauvaisJeton = clientCloudflare({ compte: faux.compte, jeton: 'mauvais-jeton-mais-assez-long', fetch: faux.fetch });
let refus = null;
try { await avecMauvaisJeton.jetonTeleversement('sito-demo'); } catch (e) { refus = e.message; }
ok(refus !== null, 'un jeton de compte faux est refusé');
ok(refus && !/mauvais-jeton/.test(refus), 'le message de refus ne recopie pas le jeton', refus || '');
// Les trois appels de fichiers n'acceptent que le JWT : le vrai client s'en
// sert, et c'est ce que le faux vérifie. Un client qui enverrait le jeton du
// compte échouerait ici.
ok(faux.journal.some((l) => l.includes('check-missing')), 'check-missing a bien été appelé');
ok(faux.journal.some((l) => l.includes('upload-token')), 'le jeton d envoi a bien été demandé');

// ------------------------------- un manifeste trouÃ© est refusé par Cloudflare
console.log('\nUn manifeste qui désigne un fichier absent est refusé');
const faux2 = fauxCloudflare({ projets: ['sito-demo'] });
const client2 = clientCloudflare({ compte: faux2.compte, jeton: faux2.jeton, fetch: faux2.fetch });
let refuse = null;
try {
  const jwt = await client2.jetonTeleversement('sito-demo');
  await client2.manquants(jwt, ['0'.repeat(32)]);
  await client2.deployer('sito-demo', { manifeste: { 'x/index.html': '0'.repeat(32) }, entetes: ENTETES });
} catch (e) { refuse = e.message; }
ok(refuse !== null, 'Cloudflare refuse un dépôt dont le manifeste désigne un fichier jamais envoyé', refuse || '(accepté)');

// -------------------------------------------------- le projet se crée tout seul
console.log('\nLe projet se crée s il n existe pas');
ok(faux.deploiements.length > 0 && (await client.projet('sito-demo')) !== null,
  'le projet sito-demo existe après la première publication (il a été créé)');

// ------------------------------------------------------------- le mode --sec
console.log('\nLe mode --sec ne publie rien');
const faux3 = fauxCloudflare({ projets: ['sito-demo'] });
const client3 = clientCloudflare({ compte: faux3.compte, jeton: faux3.jeton, fetch: faux3.fetch });
const racine3 = temp('sites-sec');
const lot3 = [fabriquerSite(racine3, '749892089', 'h'.repeat(16))];
const sec = await publier({ lot: lot3, registre, jour: JOUR, client: client3, enLigne: join(temp('m3'), 'en-ligne.json'), sec: true, dire: () => {} });
ok(sec.publie === false, '--sec ne publie pas');
ok(faux3.deploiements.length === 0, 'aucun dépôt n a eu lieu');
ok(faux3.journal.length === 0, 'aucun appel à Cloudflare', faux3.journal.join(', '));
ok(sec.fichiers > 0, 'mais --sec dit combien de chemins seraient déployés', `${sec.fichiers}`);

// --------------------------------------------------------------- contre-essai
// Chaque cassure doit faire rougir cet essai. Une cassure qui ne trouve plus
// son texte compte comme ratée (piège du 24 octobre).
const CASSURES = [
  { fichier: 'scripts/prospection/publier.mjs', nom: 'le noindex est retiré de _headers',
    de: "  X-Robots-Tag: noindex, nofollow, noarchive, nosnippet\\n", a: '',
    attendu: /X-Robots-Tag|noindex/ },
  { fichier: 'scripts/prospection/publier.mjs', nom: 'robots.txt n interdit plus rien',
    de: "'User-agent: *\\nDisallow: /\\n'", a: "'User-agent: *\\nAllow: /\\n'",
    attendu: /robots\.txt interdit tout/ },
  { fichier: 'scripts/prospection/publier.mjs', nom: 'une page d accueil apparaît à la racine',
    de: "manifeste['/robots.txt'] = cleRobots;", a: "manifeste['/robots.txt'] = cleRobots; manifeste['/index.html'] = cleRobots;",
    attendu: /racine|page d accueil/ },
  { fichier: 'scripts/prospection/publier.mjs', nom: 'les chemins du manifeste perdent leur barre de tête (Cloudflare rendrait 404)',
    de: 'manifeste[`/${slug}/${rel}`] = cle;', a: 'manifeste[`${slug}/${rel}`] = cle;',
    attendu: /commence par|rend 404|200/ },
  { fichier: 'scripts/prospection/publier.mjs', nom: 'les donnees internes du generateur partent en ligne',
    de: "const EXCLUS = [/^donnees\\.json$/,", a: 'const EXCLUS = [',
    attendu: /donnees\.json/ },
  { fichier: 'scripts/prospection/publier.mjs', nom: 'un site de plus de 30 jours reste en ligne',
    de: 'else if (age > duree) retires.push(', a: 'else if (false) retires.push(',
    attendu: /54 jours|retiré/ },
  { fichier: 'scripts/prospection/publier.mjs', nom: '« ne plus appeler » ne retire plus le site',
    de: "if (f.statut === 'ne-plus-appeler') retires.push(", a: "if (false) retires.push(",
    attendu: /ne plus appeler|404/ },
  { fichier: 'scripts/prospection/publier.mjs', nom: 'une date illisible fait garder le site au lieu de le retirer',
    de: 'else if (!Number.isFinite(age)) retires.push(', a: 'else if (!Number.isFinite(age)) gardes.push(',
    attendu: /illisible/ },
  // Celle-ci est la cassure qui compte : sans le contrôle de forme, « le 3
  // mars » redevient un âge plausible et le site part pour la mauvaise raison.
  { fichier: 'scripts/prospection/publier.mjs', nom: 'la forme de la date n est plus vérifiée (Date.parse decide)',
    de: '  if (!DATE.test(a) || !DATE.test(b)) return NaN;\n', a: '',
    attendu: /illisible|9 367|Date\.parse/ },
  { fichier: 'scripts/prospection/publier.mjs', nom: 'le lot publie un site que le registre ne garde pas',
    de: "if (!gardesSlugs.has(s.slug)) { ecartes.push(s); continue; }", a: 'if (false) { ecartes.push(s); continue; }',
    attendu: /écarté|retiré n est pas publié|seuls les deux autres/ },
  { fichier: 'scripts/prospection/cloudflare-pages.mjs', nom: 'l empreinte devient un SHA-256 (les images remontent toutes)',
    de: "return (await blake3(b64 + extname(chemin).slice(1))).slice(0, 32);",
    a: "return (await import('node:crypto')).createHash('sha256').update(b64).digest('hex').slice(0, 32);",
    attendu: /empreinte|image partagée|onze contenus/ },
];

if (process.argv.includes('--contre-essai')) {
  console.log('\nContre-essai : chaque cassure doit faire rougir cet essai');
  let ratees = 0;
  for (const c of CASSURES) {
    const source = readFileSync(join(RACINE, c.fichier), 'utf8');
    if (!source.includes(c.de)) {
      ratees++;
      console.log(`RATÉ  ${c.nom}\n        le texte visé n existe plus dans ${c.fichier} : la cassure ne prouve rien`);
      continue;
    }
    const d = temp('casse');
    for (const dossier of ['scripts']) cpSync(join(RACINE, dossier), join(d, dossier), { recursive: true });
    for (const f of ['package.json']) if (existsSync(join(RACINE, f))) cpSync(join(RACINE, f), join(d, f));
    if (existsSync(join(RACINE, 'node_modules'))) {
      try { cpSync(join(RACINE, 'node_modules'), join(d, 'node_modules'), { recursive: true }); } catch { /* suffisant */ }
    }
    const cible = join(d, c.fichier);
    writeFileSync(cible, readFileSync(cible, 'utf8').replace(c.de, c.a));
    const r = spawnSync(process.execPath, [join(d, 'scripts', 'essai-publication-prospection.mjs')],
      { cwd: d, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const sortie = (r.stdout || '') + (r.stderr || '');
    const attrapee = r.status === 1 && c.attendu.test(sortie);
    if (!attrapee) ratees++;
    const ligne = sortie.split('\n').filter((l) => l.includes('FAUTE')).slice(0, 1)[0] || sortie.trim().split('\n').slice(-1)[0] || '';
    console.log(`${attrapee ? 'ok   ' : 'RATÉ '} ${c.nom}\n        sortie ${r.status} : ${ligne.trim().slice(0, 150)}`);
    rmSync(d, { recursive: true, force: true });
  }
  console.log(`\n${CASSURES.length} cassure(s) posée(s) une par une, ${ratees} non attrapée(s).`);
  console.log(ratees ? 'CONTRE-ESSAI RATÉ : une copie cassée passe.' : 'Contre-essai réussi : chaque copie cassée est attrapée.');
  process.exit(ratees ? 1 : 0);
}

console.log(`\n${controles} contrôles, ${fautes} faute(s).`);
console.log('La première publication réelle reste à faire : elle demande le compte Cloudflare (action F5).');
process.exit(fautes ? 1 : 0);

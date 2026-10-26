#!/usr/bin/env node
// Essai de la page d'appels du jour et de l'enregistrement des résultats.
//
//   node scripts/essai-appels.mjs                  tout, navigateur compris
//   node scripts/essai-appels.mjs --sans-navigateur  seulement ce qui se mesure sans Chromium
//   node scripts/essai-appels.mjs --contre-essai     les cassures, une par une
//
// Le KV de Cloudflare est remplacé par une boîte en mémoire qui a les mêmes
// deux verbes (`get`, `put`) ; le Worker (`worker/appels.js`) est appelé comme
// Cloudflare l'appellerait, et la page est servie par un petit serveur local
// pour que Playwright la touche vraiment, à 390 px.
//
// Ce que l'essai ne prouve pas : le KV réel (sa latence), et la page servie
// par Cloudflare. Il faut pour cela le compte (action **F5**).
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { RACINE } from './env.mjs';
import { STATUTS as STATUTS_REGISTRE, resultat, vide } from './prospection/registre.mjs';
import { page, verifier, semaine, appelsDuJour, RESULTATS, lienFiche, sms } from './prospection/page-appels.mjs';
import worker, { STATUTS as STATUTS_WORKER, enregistrer, lire, lireVues, compterVue, jourDeParis } from '../worker/appels.js';

const JOUR = '2026-10-25';
const SLUG_PAGE = 'p'.repeat(16);
let controles = 0, fautes = 0, nonEssayes = 0;
function ok(condition, nom, detail = '') {
  controles++;
  if (condition) return true;
  fautes++;
  console.log(`  FAUTE ${nom}${detail ? ` — ${detail}` : ''}`);
  return false;
}
const ARANGER = [];
const temp = (quoi) => {
  const d = join(tmpdir(), `sito-appels-${quoi}-${Math.random().toString(36).slice(2, 10)}`);
  mkdirSync(d, { recursive: true });
  ARANGER.push(d);
  return d;
};
process.on('exit', () => { for (const d of ARANGER) { try { rmSync(d, { recursive: true, force: true }); } catch { /* parti */ } } });

// Le KV de Cloudflare, en mémoire : `get` rend une chaîne ou null, `put`
// écrase. Rien de plus, pour que le code ne puisse pas s'appuyer sur autre chose.
function fauxKV() {
  const boite = new Map();
  return {
    async get(cle) { return boite.has(cle) ? boite.get(cle) : null; },
    async put(cle, valeur) { boite.set(cle, String(valeur)); },
    get taille() { return boite.size; },
    get clefs() { return [...boite.keys()]; },
  };
}

const registreDessai = () => ({
  version: 1,
  fiches: {
    749892089: { metier: 'ravalement', nom: 'MACONNERIE DU SUD', commune: 'MARSEILLE', site_le: JOUR, slug: 'a'.repeat(16), statut: 'a-appeler', appele_le: null, relance_le: null, note: 83 },
    839830775: { metier: 'ravalement', nom: 'BRIZZI FACADES', commune: 'ROQUEVAIRE', site_le: JOUR, slug: 'b'.repeat(16), statut: 'a-appeler', appele_le: null, relance_le: null, note: 77 },
    // une relance due aujourd'hui : elle doit passer devant
    978759389: { metier: 'ravalement', nom: 'ARCO FACADE', commune: 'SEPTEMES', site_le: '2026-10-20', slug: 'c'.repeat(16), statut: 'a-rappeler', appele_le: '2026-10-20', relance_le: JOUR, note: 73 },
    // déjà appelé aujourd'hui : écarté
    493598965: { metier: 'ravalement', nom: 'LA FACADE PROVENCALE', commune: 'MARSEILLE', site_le: JOUR, slug: 'd'.repeat(16), statut: 'pas-de-reponse', appele_le: JOUR, relance_le: null, note: 72 },
    // ne plus appeler : écarté
    751774894: { metier: 'ravalement', nom: 'JSF SIMONELLI', commune: 'MOLLEGES', site_le: '2026-10-01', slug: 'e'.repeat(16), statut: 'ne-plus-appeler', appele_le: '2026-10-02', relance_le: null, note: 68 },
    // abonné : écarté des appels, compté à la semaine. Appelé le 19, c'est-à-dire
    // le premier jour de la fenêtre de sept jours : il doit compter.
    788515963: { metier: 'ravalement', nom: 'SARL C O B', commune: 'CARRY', site_le: '2026-10-05', slug: 'f'.repeat(16), statut: 'abonne-mois', appele_le: '2026-10-19', relance_le: null, note: 68 },
    // appelé le 18 : un jour avant la fenêtre, il ne doit PAS compter. C'est le
    // bord qui compte dans un décompte de semaine, pas le milieu.
    999999999: { metier: 'ravalement', nom: 'HORS FENETRE', commune: 'AIX', site_le: '2026-10-01', slug: 'g'.repeat(16), statut: 'pas-interesse', appele_le: '2026-10-18', relance_le: null, note: 50 },
  },
});
const LOT = [
  { siren: '749892089', nom: 'MACONNERIE DU SUD', commune: 'MARSEILLE', metier: 'ravalement', note: 83, slug: 'a'.repeat(16), pourquoi: ['aucun site', '14 ans'] },
  { siren: '839830775', nom: 'BRIZZI FACADES', commune: 'ROQUEVAIRE', metier: 'ravalement', note: 77, slug: 'b'.repeat(16), pourquoi: ['aucun site'] },
  { siren: '493598965', nom: 'LA FACADE PROVENCALE', commune: 'MARSEILLE', metier: 'ravalement', note: 72, slug: 'd'.repeat(16), pourquoi: [] },
  { siren: '751774894', nom: 'JSF SIMONELLI', commune: 'MOLLEGES', metier: 'ravalement', note: 68, slug: 'e'.repeat(16), pourquoi: [] },
  { siren: '788515963', nom: 'SARL C O B', commune: 'CARRY', metier: 'ravalement', note: 68, slug: 'f'.repeat(16), pourquoi: [] },
];

console.log('Page d appels du jour et enregistrement des résultats\n');

// ------------------------------------------- les deux listes de statuts
console.log('Le Worker et le registre parlent des mêmes statuts');
ok(JSON.stringify(STATUTS_WORKER) === JSON.stringify(STATUTS_REGISTRE),
  'la liste des statuts du Worker est celle du registre (recopiée : le Worker part seul chez Cloudflare)',
  `${STATUTS_WORKER.length} contre ${STATUTS_REGISTRE.length}`);
ok(RESULTATS.every((r) => STATUTS_REGISTRE.includes(r.statut)),
  'chaque bouton de la page porte un statut que le registre connaît');
ok(!RESULTATS.some((r) => r.statut === 'a-appeler'),
  '« à appeler » n est pas un bouton : c est l état de départ, pas un résultat');

// --------------------------------------------------- qui est appelé, dans quel ordre
console.log('\nLes relances passent devant, les écartés sortent');
const reg = registreDessai();
const { relances, nouveaux, ecartes } = appelsDuJour(reg, { jour: JOUR, lot: LOT });
ok(relances.length === 1 && relances[0].siren === '978759389', 'la relance due aujourd hui est là', `${relances.length}`);
ok(nouveaux.map((f) => f.siren).join(',') === '749892089,839830775', 'les nouveaux sont les deux appelables, mieux notés devant', nouveaux.map((f) => `${f.siren}:${f.note}`).join(' '));
const motif = (s) => ecartes.find((f) => f.siren === s)?.motif;
ok(/déjà appelé/.test(motif('493598965') || ''), 'celui déjà appelé aujourd hui est écarté, avec sa raison', motif('493598965'));
ok(/ne plus/.test(motif('751774894') || ''), '« ne plus appeler » est écarté', motif('751774894'));
ok(/abonné/.test(motif('788515963') || ''), 'un abonné est écarté', motif('788515963'));
ok(!nouveaux.some((f) => f.siren === '978759389'), 'la relance n est pas comptée deux fois');

// ------------------------------------------------------- le point de la semaine
console.log('\nLe point de la semaine compte ce que le registre sait');
const s = semaine(reg, JOUR);
ok(s.appels === 3, 'trois appels dans les sept derniers jours', `${s.appels}`);
ok(s.conversations === 2, 'deux conversations (l absence de réponse n en est pas une)', `${s.conversations}`);
ok(s.abonnes === 1, 'un abonné', `${s.abonnes}`);
ok(s.sites === 7, 'sept sites montrés en tout', `${s.sites}`);
ok(s.depuis === '2026-10-19', 'la semaine commence sept jours avant, aujourd hui compris', s.depuis);
// Les deux bords de la fenêtre, parce que c'est là qu'un décompte se trompe :
// le 19 compte, le 18 non.
ok(Object.values(reg.fiches).some((f) => f.appele_le === '2026-10-19') && s.appels === 3,
  'un appel du premier jour de la fenêtre (le 19) compte');
ok(Object.values(reg.fiches).some((f) => f.appele_le === '2026-10-18'),
  'le jeu d essai contient bien un appel du 18, hors fenêtre');
ok(semaine(reg, JOUR, { jours: 6 }).appels === 2,
  'en resserrant la fenêtre à six jours, l appel du 19 en sort', `${semaine(reg, JOUR, { jours: 6 }).appels}`);
const vide7 = semaine(vide(), JOUR);
ok(vide7.appels === 0 && vide7.abonnes === 0, 'un registre vide donne des zéros, pas des absences');

// ------------------------------------------------- « liens ouverts »
// Le seul chiffre qui ne vient pas du registre : il se passe chez le visiteur.
console.log('\nLes liens ouverts se comptent chez le visiteur');
const kvVues = fauxKV();
const envVues = { APPELS: kvVues, SLUG_APPELS: SLUG_PAGE, ASSETS: { fetch: async () => new Response('page', { status: 200 }) } };
const voir = (chemin, methode = 'GET') => worker.fetch(new Request('https://x' + chemin, { method: methode }), envVues, {});

await voir('/' + 'a'.repeat(16) + '/');
ok(Number(await kvVues.get('vu:' + 'a'.repeat(16))) === 1, 'ouvrir la page d un site compte une vue');
await voir('/' + 'a'.repeat(16) + '/index.html');
ok(Number(await kvVues.get('vu:' + 'a'.repeat(16))) === 2, 'index.html compte comme la même page');
// Une image ne vaut pas une visite : sinon un site de 70 fichiers en vaudrait 70.
await voir('/' + 'a'.repeat(16) + '/images/facade.webp');
ok(Number(await kvVues.get('vu:' + 'a'.repeat(16))) === 2, 'une image rangée dans un sous-dossier ne compte pas une vue de plus');
// Et un fichier posé juste sous le slug non plus : une deuxième page du site
// (« Le travail ») n'est pas un deuxième lien ouvert. C'est la racine du site
// qu'on envoie à l'artisan, c'est elle seule qui se compte.
await voir('/' + 'a'.repeat(16) + '/le-travail.html');
ok(Number(await kvVues.get('vu:' + 'a'.repeat(16))) === 2, 'une autre page du même site ne compte pas une vue de plus', String(await kvVues.get('vu:' + 'a'.repeat(16))));
// Le compte s'arrête à deux morceaux de chemin. Sans cette seconde garde,
// une adresse tordue comme `/<slug>/index.html/n-importe-quoi` compterait
// autant de vues qu'on la demande : un compteur qu'on peut gonfler depuis
// l'extérieur ne dit plus rien.
await voir('/' + 'a'.repeat(16) + '/index.html/encore');
ok(Number(await kvVues.get('vu:' + 'a'.repeat(16))) === 2, 'une adresse tordue sous index.html ne gonfle pas le compteur', String(await kvVues.get('vu:' + 'a'.repeat(16))));
// La page d'appels est celle de Fabrice : elle ne se compte pas.
await voir('/' + SLUG_PAGE + '/');
ok(await kvVues.get('vu:' + SLUG_PAGE) === null, 'la page d appels de Fabrice ne se compte pas comme un lien ouvert');
await voir('/pas-un-slug/');
ok(kvVues.clefs.filter((c) => c.startsWith('vu:')).length === 1, 'un chemin qui n est pas un slug ne crée pas de compteur', kvVues.clefs.join(','));

const vus = await lireVues(envVues, ['a'.repeat(16), 'b'.repeat(16)]);
ok(vus['a'.repeat(16)] === 2 && vus['b'.repeat(16)] === 0, 'les vues se relisent par slug, zéro pour les autres', JSON.stringify(vus));
const avecVues = semaine(reg, JOUR, { vus });
ok(avecVues.liens_ouverts === 1, 'un artisan a ouvert son lien', `${avecVues.liens_ouverts}`);
ok(semaine(reg, JOUR).liens_ouverts === null, 'sans les vues, « liens ouverts » vaut null (pas zéro)');
ok(/<dt>Liens ouverts<\/dt><dd>\?<\/dd>/.test(page(reg, { jour: JOUR, lot: LOT })),
  'et la page écrit « ? », parce qu un chiffre qu on n a pas n est pas un zéro');
ok(/<dt>Liens ouverts<\/dt><dd>1<\/dd>/.test(page(reg, { jour: JOUR, lot: LOT, vus })),
  'avec les vues, la page écrit le compte');

// ------------------------------------------------------------------- la page
console.log('\nLa page, et ce qu elle ne porte pas');
const html = page(reg, { jour: JOUR, lot: LOT, base: 'https://sito-demo.pages.dev', api: `/${SLUG_PAGE}/api/resultat` });
ok(verifier(html).length === 0, 'la page passe son propre contrôle', verifier(html).join(' ; '));
ok(!/0[1-9](?:[\s.\-]*\d{2}){4}/.test(html), 'aucun numéro de téléphone dans la page');
ok(/name="robots" content="noindex/.test(html), 'la page est en noindex');
ok(html.indexOf('À rappeler d abord') < html.indexOf('Les appels du jour'), 'les relances sont écrites avant les nouveaux');
ok((html.match(/class="fiche"/g) || []).length === 3, 'trois fiches : une relance et deux nouveaux', `${(html.match(/class="fiche"/g) || []).length}`);
ok(html.includes('data-relance="1"'), 'la relance est marquée comme telle');
for (const r of RESULTATS) ok(html.includes(`data-statut="${r.statut}"`), `le bouton « ${r.mot} » est là`);
ok(html.includes('google.com/maps/search'), 'le bouton Fiche Google est un lien de recherche Google Maps');
ok(lienFiche('A & B', 'Aix') === 'https://www.google.com/maps/search/?api=1&query=A%20%26%20B%20Aix', 'le lien Google échappe le nom', lienFiche('A & B', 'Aix'));
ok(html.includes('https://sito-demo.pages.dev/' + 'a'.repeat(16) + '/'), 'le lien vers le site de l artisan est celui de son slug');
ok(/data-sms="[^"]*sito-demo/.test(html), 'le SMS porte le lien du site');
// Une injection par le nom d'une entreprise ne doit pas casser la page.
const regMechant = vide();
regMechant.fiches['749892089'] = { metier: 'r', nom: '<script>alert(1)</script>', commune: '"><b>', site_le: JOUR, slug: 'a'.repeat(16), statut: 'a-appeler', appele_le: null, relance_le: null, note: 1 };
const htmlMechant = page(regMechant, { jour: JOUR, lot: [{ siren: '749892089', nom: '<script>alert(1)</script>', commune: '"><b>', metier: 'r', note: 1, slug: 'a'.repeat(16) }] });
ok(!htmlMechant.includes('<script>alert(1)</script>'), 'un nom d entreprise ne peut pas injecter de script');
ok(htmlMechant.includes('&lt;script&gt;'), 'il est échappé');
// Une note absente s'affiche « — », pas 0 : rien ne s invente.
const regSansNote = vide();
regSansNote.fiches['749892089'] = { metier: 'r', nom: 'SANS NOTE', commune: 'AIX', site_le: JOUR, slug: 'a'.repeat(16), statut: 'a-appeler', appele_le: null, relance_le: null, note: null };
ok(/note <b>—<\/b>/.test(page(regSansNote, { jour: JOUR, lot: [{ siren: '749892089', nom: 'SANS NOTE', commune: 'AIX', metier: 'r', note: null, slug: 'a'.repeat(16) }] })),
  'une note absente s affiche « — », pas zéro');

// --------------------------------------------------- l enregistrement (le Worker)
console.log('\nL enregistrement d un résultat');
const kv = fauxKV();
const env = { APPELS: kv, SLUG_APPELS: SLUG_PAGE };
const poster = (corps, chemin = `/${SLUG_PAGE}/api/resultat`) => worker.fetch(
  new Request('https://sito-demo.pages.dev' + chemin, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) }), env, {});

let r = await poster({ siren: '749892089', statut: 'interesse' });
let j = await r.json();
ok(r.status === 200 && j.ok === true, 'un résultat valide est enregistré', JSON.stringify(j).slice(0, 120));
const relu = await lire(env, '749892089');
ok(relu && relu.statut === 'interesse', 'et il se relit dans KV', JSON.stringify(relu));
ok(relu.jour === jourDeParis(), 'il porte le jour de Paris', relu.jour);
ok(relu.relance_le === null, 'sans relance, la date reste nulle');

r = await poster({ siren: '978759389', statut: 'a-rappeler', relance_le: '2026-10-28' });
j = await r.json();
ok(j.ok === true && /28/.test(j.dit), 'un rappel noté dit la date', j.dit);
ok((await lire(env, '978759389')).relance_le === '2026-10-28', 'la date de relance est gardée');

// Les refus, tous avant la moindre écriture.
const avant = kv.taille;
for (const [corps, nom] of [
  [{ siren: '749892089', statut: 'inconnu' }, 'un statut inconnu est refusé'],
  [{ siren: '12', statut: 'interesse' }, 'un SIREN qui n a pas neuf chiffres est refusé'],
  [{ siren: '749892089', statut: 'a-rappeler' }, '« à rappeler » sans date est refusé'],
  [{ siren: '749892089', statut: 'a-rappeler', relance_le: 'demain' }, 'une date de relance mal écrite est refusée'],
  [{ siren: '749892089', statut: 'interesse', note: 'rappeler au 06 12 34 56 78' }, 'un numéro de téléphone dans le corps est refusé'],
]) {
  const rr = await poster(corps);
  const jj = await rr.json();
  ok(rr.status >= 400 && jj.ok === false && jj.faute, nom, JSON.stringify(jj).slice(0, 100));
}
ok(kv.taille === avant, 'aucun refus n a rien écrit dans KV', `${kv.taille} au lieu de ${avant}`);

// Le slug est le laissez-passer.
let rrr = await poster({ siren: '749892089', statut: 'interesse' }, '/' + 'z'.repeat(16) + '/api/resultat');
ok(rrr.status === 404, 'un POST sous un slug inconnu est refusé', `${rrr.status}`);
rrr = await worker.fetch(new Request(`https://x/${SLUG_PAGE}/api/resultat`), env, {});
ok(rrr.status === 405, 'un GET sur l API est refusé', `${rrr.status}`);
const sansKv = await worker.fetch(new Request(`https://x/${SLUG_PAGE}/api/resultat`, { method: 'POST', body: '{"siren":"749892089","statut":"interesse"}' }), { SLUG_APPELS: SLUG_PAGE }, {});
ok(sansKv.status === 500, 'sans KV branché, le Worker le dit au lieu de faire semblant', `${sansKv.status}`);

// Le report du soir : KV → registre versionné.
console.log('\nLe report du soir dans le registre');
const regSoir = registreDessai();
const depuisKv = await lire(env, '749892089');
resultat(regSoir, depuisKv.siren, { statut: depuisKv.statut, jour: depuisKv.jour, relance_le: depuisKv.relance_le });
ok(regSoir.fiches['749892089'].statut === 'interesse', 'le résultat de KV se reporte dans le registre');
ok(regSoir.fiches['749892089'].appele_le === depuisKv.jour, 'avec le jour de l appel');

// ------------------------------------------------------------- le navigateur
if (!process.argv.includes('--sans-navigateur')) {
  let chromium = null;
  try { ({ chromium } = await import('playwright')); } catch { /* absent */ }
  if (!chromium) {
    nonEssayes++;
    console.log('\nNON ESSAYÉ : Playwright absent (le doigt sur 390 px).');
  } else {
    console.log('\nAu doigt, sur iPhone 390 px');
    const kv2 = fauxKV();
    const env2 = { APPELS: kv2, SLUG_APPELS: SLUG_PAGE };
    const htmlServi = page(registreDessai(), { jour: JOUR, lot: LOT, base: 'https://sito-demo.pages.dev', api: `/${SLUG_PAGE}/api/resultat` });

    // Le serveur local sert la page et passe l'API au vrai Worker.
    const serveur = createServer(async (req, rep) => {
      if (req.url === `/${SLUG_PAGE}/` || req.url === `/${SLUG_PAGE}`) {
        rep.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return void rep.end(htmlServi);
      }
      const morceaux = [];
      for await (const m of req) morceaux.push(m);
      const reponse = await worker.fetch(new Request('http://local' + req.url, {
        method: req.method, headers: { 'Content-Type': 'application/json' },
        body: morceaux.length ? Buffer.concat(morceaux) : undefined,
      }), env2, {});
      rep.writeHead(reponse.status, { 'Content-Type': 'application/json' });
      rep.end(Buffer.from(await reponse.arrayBuffer()));
    });
    await new Promise((res) => serveur.listen(0, '127.0.0.1', res));
    const base = `http://127.0.0.1:${serveur.address().port}`;

    const nav = await chromium.launch();
    const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const p = await ctx.newPage();
    const plaintes = [];
    p.on('console', (m) => { if (m.type() === 'error') plaintes.push(m.text()); });
    p.on('pageerror', (err) => plaintes.push(String(err)));
    await p.goto(`${base}/${SLUG_PAGE}/`, { waitUntil: 'load' });

    ok(plaintes.length === 0, 'la page se charge sans erreur de script', plaintes.join(' | '));
    const largeur = await p.evaluate(() => document.documentElement.scrollWidth);
    ok(largeur <= 390, 'rien ne dépasse à droite sur 390 px', `${largeur} px`);

    // Tous les boutons se touchent : 44 px de haut au moins.
    const petits = await p.evaluate(() => [...document.querySelectorAll('button, a.bouton')]
      .map((b) => ({ t: b.textContent.trim().slice(0, 20), h: Math.round(b.getBoundingClientRect().height) }))
      .filter((b) => b.h < 44));
    ok(petits.length === 0, 'aucun bouton sous 44 px de haut', JSON.stringify(petits).slice(0, 160));

    const premiere = p.locator('.fiche').first();
    ok(await premiere.getAttribute('data-relance') === '1', 'la première fiche est la relance');

    // Le geste réel : toucher « Intéressé » sur la deuxième fiche.
    const fiche = p.locator('.fiche[data-siren="749892089"]');
    await fiche.locator('.resultat[data-statut="interesse"]').tap();
    await p.waitForFunction(() => {
      const f = document.querySelector('.fiche[data-siren="749892089"] .etat');
      return f && f.textContent && !f.textContent.includes('Enregistrement');
    }, null, { timeout: 10000 });

    const dit = await fiche.locator('.etat').textContent();
    ok(dit.trim() === 'Enregistré.', 'la fiche dit que c est enregistré', dit.trim());
    ok(await fiche.locator('.resultat[data-statut="interesse"]').getAttribute('aria-pressed') === 'true',
      'le bouton touché reste allumé');
    const dansKv = await lire(env2, '749892089');
    ok(dansKv && dansKv.statut === 'interesse', 'et le résultat est bien dans KV, relu après coup', JSON.stringify(dansKv));

    // Rechargée, la page d'un autre jour ne doit plus proposer cet artisan :
    // le report du soir le sort de la liste (déjà appelé).
    const regApres = registreDessai();
    resultat(regApres, '749892089', { statut: dansKv.statut, jour: JOUR, relance_le: null });
    const apres = appelsDuJour(regApres, { jour: JOUR, lot: LOT });
    ok(!apres.nouveaux.some((f) => f.siren === '749892089'), 'une fois le résultat reporté, il ne revient pas dans la liste du jour');
    ok(/déjà appelé/.test(apres.ecartes.find((f) => f.siren === '749892089')?.motif || ''), 'et la page dit pourquoi');

    // Un enregistrement qui échoue ne doit pas allumer le bouton.
    await p.route('**/api/resultat', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"faute":"panne"}' }));
    const fiche2 = p.locator('.fiche[data-siren="839830775"]');
    await fiche2.locator('.resultat[data-statut="pas-de-reponse"]').tap();
    await p.waitForFunction(() => {
      const f = document.querySelector('.fiche[data-siren="839830775"] .etat');
      return f && f.textContent.includes('refaire');
    }, null, { timeout: 10000 });
    ok(await fiche2.locator('.resultat[data-statut="pas-de-reponse"]').getAttribute('aria-pressed') !== 'true',
      'un enregistrement refusé ne laisse pas le bouton allumé (mieux vaut refaire l appel que croire un faux résultat)');
    ok(/À refaire/.test(await fiche2.locator('.etat').textContent()), 'et la fiche dit de le refaire');

    await nav.close();
    await new Promise((res) => serveur.close(res));
  }
} else {
  nonEssayes++;
  console.log('\nNON ESSAYÉ : le navigateur (--sans-navigateur).');
}

// --------------------------------------------------------------- contre-essai
const CASSURES = [
  { fichier: 'worker/appels.js', nom: 'un statut inconnu est accepté',
    de: 'if (!STATUTS.includes(statut)) return refus(', a: 'if (false) return refus(',
    attendu: /statut inconnu est refusé/ },
  { fichier: 'worker/appels.js', nom: 'un numéro de téléphone passe dans KV',
    de: 'if (numero) return refus(', a: 'if (false) return refus(',
    attendu: /numéro de téléphone dans le corps/ },
  { fichier: 'worker/appels.js', nom: 'le slug n est plus le laissez-passer',
    de: "if (bouts[0] !== env.SLUG_APPELS) return refus('page inconnue', 404);", a: '',
    attendu: /slug inconnu/ },
  { fichier: 'worker/appels.js', nom: '« à rappeler » sans date est accepté',
    de: "if (statut === 'a-rappeler' && !relance_le) return refus(", a: 'if (false) return refus(',
    attendu: /sans date est refusé/ },
  { fichier: 'worker/appels.js', nom: 'toute page du site compte une vue de plus',
    de: "&& (bouts.length === 1 || bouts[1] === 'index.html')\n", a: '',
    attendu: /ne compte pas une vue de plus/ },
  { fichier: 'worker/appels.js', nom: 'le compteur se gonfle par une adresse tordue',
    de: '&& bouts.length >= 1 && bouts.length <= 2', a: '&& bouts.length >= 1',
    attendu: /adresse tordue/ },
  { fichier: 'worker/appels.js', nom: 'la page d appels de Fabrice se compte comme un lien ouvert',
    de: '&& bouts[0] !== env?.SLUG_APPELS\n', a: '',
    attendu: /page d appels de Fabrice ne se compte pas/ },
  { fichier: 'scripts/prospection/page-appels.mjs', nom: 'un « liens ouverts » inconnu s affiche comme zéro',
    de: "liens_ouverts: vus ? fiches.filter((f) => f.slug && (vus[f.slug] || 0) > 0).length : null,",
    a: 'liens_ouverts: fiches.filter((f) => f.slug && ((vus || {})[f.slug] || 0) > 0).length,',
    attendu: /vaut null|n est pas un zéro/ },
  { fichier: 'scripts/prospection/page-appels.mjs', nom: 'les relances ne passent plus devant',
    de: 'return { relances, nouveaux, ecartes, total: relances.length + nouveaux.length };',
    a: 'return { relances: [], nouveaux: [...relances, ...nouveaux], ecartes, total: relances.length + nouveaux.length };',
    attendu: /relance due aujourd hui est là|première fiche est la relance|écrites avant/ },
  { fichier: 'scripts/prospection/page-appels.mjs', nom: 'un artisan « ne plus appeler » revient dans la liste',
    de: 'if (!peut.oui) { ecartes.push({ ...ligne, motif: peut.motif }); continue; }', a: '',
    attendu: /ne plus appeler|déjà appelé|trois fiches/ },
  { fichier: 'scripts/prospection/page-appels.mjs', nom: 'un nom d entreprise n est plus échappé',
    de: "export const e = (v) => String(v ?? '').replace(/[&<>\"']/g, (c) => ECHAPPER[c]);",
    a: "export const e = (v) => String(v ?? '');",
    attendu: /injecter de script|échappé/ },
  { fichier: 'scripts/prospection/page-appels.mjs', nom: 'une note absente devient zéro',
    de: "const note = f.note == null ? '—' : String(f.note);", a: 'const note = String(f.note ?? 0);',
    attendu: /note absente/ },
  { fichier: 'scripts/prospection/page-appels.mjs', nom: 'les boutons passent sous 44 px',
    de: '.resultat { min-height:44px;', a: '.resultat { min-height:20px;',
    attendu: /sous 44 px/ },
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
    for (const dossier of ['scripts', 'worker']) cpSync(join(RACINE, dossier), join(d, dossier), { recursive: true });
    if (existsSync(join(RACINE, 'package.json'))) cpSync(join(RACINE, 'package.json'), join(d, 'package.json'));
    if (existsSync(join(RACINE, 'node_modules'))) {
      try { cpSync(join(RACINE, 'node_modules'), join(d, 'node_modules'), { recursive: true }); } catch { /* suffisant */ }
    }
    const cible = join(d, c.fichier);
    writeFileSync(cible, readFileSync(cible, 'utf8').replace(c.de, c.a));
    const r = spawnSync(process.execPath, [join(d, 'scripts', 'essai-appels.mjs')],
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

console.log(`\n${controles} contrôles, ${fautes} faute(s)${nonEssayes ? `, ${nonEssayes} partie(s) NON ESSAYÉE(S)` : ''}.`);
console.log('Le KV réel et la page servie par Cloudflare restent à essayer : il faut le compte (action F5).');
process.exit(fautes ? 1 : 0);

#!/usr/bin/env node
// Essai du formulaire de demande des sites d'abonnés (T11), dans un vrai
// navigateur, contre un faux Supabase qui imite `rpc/deposer_demande` (T10).
// Aucun réseau, aucune clé réelle.
//
// Ce qu'il mesure :
//   - un site d'abonné de chaque archétype porte le formulaire ; un site de
//     prospection et un site d'abonné sans clé publique n'en ont pas ;
//   - remplir et envoyer : la base reçoit le SIREN, le message, la page, la clé
//     publique dans `apikey`, et jamais le champ piège ; le message de réussite
//     s'affiche et le formulaire se vide ;
//   - « trop » et une panne du serveur : un message clair, rien n'est perdu ;
//   - sans téléphone ni adresse : rien ne part ;
//   - le champ piège est hors de l'écran et hors du clavier ;
//   - les mentions légales disent ce que le formulaire recueille ;
//   - `verifier-site` passe (et R-FORM refuse une copie sans champ piège ou
//     avec une clé secrète : `--contre-essai`).
//
//   node scripts/essai-formulaire.mjs [--contre-essai]
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { RACINE } from './env.mjs';

const CONTRE = process.argv.includes('--contre-essai');
const CLE = 'sb_publishable_essai_formulaire';
let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

const travail = mkdtempSync(join(tmpdir(), 'sito-formulaire-'));
const images = join(travail, 'images');
mkdirSync(images);
const image = (a, b) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1600" height="1100" fill="url(#g)"/></svg>`)).jpeg({ quality: 85 }).toBuffer();
for (const [n, a, b] of [['hero', '#8a7b6a', '#e4ddd0'], ['avant-01', '#6d655c', '#8f877d'], ['apres-01', '#e9e3d6', '#d5cbb8'],
  ['chantier', '#7a5638', '#b89a7a'], ['geste', '#4f4f4f', '#8a8a8a'], ['detail-enduit', '#c8b494', '#e8dcc4']])
  writeFileSync(join(images, `${n}.jpg`), await image(a, b));

// Le faux Supabase : ce que la vraie fonction rend, selon le message.
const recues = [];
let reponse = 'recue', statut = 200;
const serveur = createServer((req, res) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  let corps = '';
  req.on('data', (c) => { corps += c; });
  req.on('end', () => {
    if (req.url !== '/rest/v1/rpc/deposer_demande' || req.method !== 'POST') { res.writeHead(404, cors); return res.end(); }
    recues.push({ apikey: req.headers.apikey, corps: JSON.parse(corps || '{}') });
    res.writeHead(statut, { ...cors, 'Content-Type': 'application/json' });
    res.end(statut === 200 ? JSON.stringify(reponse) : '{"message":"panne"}');
  });
});
await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
const URL_SB = `http://127.0.0.1:${serveur.address().port}`;

const brut = (siren) => ({
  siren, nom_raison_sociale: 'Façades Essai', nom_complet: 'Façades Essai', date_creation: '2015-04-01',
  activite_principale: '43.99D', nature_juridique: '5710',
  siege: { siret: siren + '00017', adresse: '10 rue du Test', libelle_commune: 'Marseille', code_postal: '13001' },
  telephone: '0491234567', mentions: { courriel: 'contact@facades-essai.fr', directeur_publication: 'Jeanne Essai' },
});
function fabriquer(siren, { abonne = true, cle = CLE } = {}) {
  const sortie = join(travail, `site-${siren}-${abonne ? 'a' : 'p'}-${cle ? 'c' : 'n'}`);
  const donnees = join(travail, `d-${siren}.json`);
  writeFileSync(donnees, JSON.stringify(brut(siren)));
  const args = [join(RACINE, 'generateur', 'composer.mjs'), '--siren', siren, '--metier', 'ravalement', '--images', images,
    '--sortie', sortie, '--donnees', donnees, '--registre', join(travail, `r-${siren}.json`)];
  if (abonne) args.push('--publication', '--adresse', 'https://facades-essai.example.fr/');
  if (cle) args.push('--formulaire-url', URL_SB, '--formulaire-cle', cle);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', cwd: RACINE });
  if (r.status !== 0) throw new Error(`fabrication ${siren} : ${(r.stderr || r.stdout).trim().split('\n').slice(-2).join(' ')}`);
  return sortie;
}
const verifier = (dossier) => spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), dossier], { encoding: 'utf8', cwd: RACINE });

let sortieFinale = 0;
try {
  if (CONTRE) {
    // R-FORM doit refuser un formulaire sans champ piège, et une clé secrète.
    const d = fabriquer('400047514');
    const page = join(d, 'index.html');
    const propre = readFileSync(page, 'utf8');
    writeFileSync(page, propre.replace(/<div class="piege"[\s\S]*?<\/div>/, ''));
    const sansPiege = verifier(d);
    ok(sansPiege.status !== 0 && /R-FORM/.test(sansPiege.stdout), 'formulaire sans champ piège : R-FORM rouge', sansPiege.stdout.split('\n').slice(-3).join(' | '));
    writeFileSync(page, propre.replace(CLE, 'sb_secret_' + 'x'.repeat(20))); // secret-ignore (faux, pour l'essai)
    const secret = verifier(d);
    ok(secret.status !== 0 && /R-FORM/.test(secret.stdout), 'clé secrète dans la page : R-FORM rouge');
    writeFileSync(page, propre.replace('<label>Votre nom <input', '<input'));
    const sansEtiquette = verifier(d);
    ok(sansEtiquette.status !== 0 && /R-FORM/.test(sansEtiquette.stdout), 'champ sans étiquette : R-FORM rouge');
  } else {
    // Les quatre archétypes portent le formulaire.
    const vus = new Map();
    for (const s of ['400000000', '400039595', '400047514', '400079190']) {
      const d = fabriquer(s);
      const arch = JSON.parse(readFileSync(join(d, 'donnees.json'), 'utf8')).archetype;
      vus.set(arch, d);
      const page = readFileSync(join(d, 'index.html'), 'utf8');
      ok(page.includes('data-formulaire') && page.includes('rpc/deposer_demande'), `${arch} : formulaire présent sur l accueil`);
      const v = verifier(d);
      ok(v.status === 0, `${arch} : verifier-site passe`, v.stdout.split('\n').filter((l) => /BLOQUANT/.test(l)).join(' | '));
      const ml = readFileSync(join(d, 'mentions-legales.html'), 'utf8');
      ok(/Le formulaire de demande recueille/.test(ml) && !/n’a ni formulaire/.test(ml), `${arch} : mentions légales à jour (données du formulaire)`);
    }
    ok(vus.size === 4, 'quatre archétypes', [...vus.keys()].join(', '));
    // Le formulaire ne casse ni le rendu au doigt ni le clavier (contrastes,
    // tailles, ordre de tabulation) : les deux vérificateurs sur deux archétypes.
    for (const arch of ['matiere', 'planche']) {
      for (const v of ['verifier-mobile.mjs', 'verifier-ordinateur.mjs']) {
        const x = spawnSync(process.execPath, [join(RACINE, 'scripts', v), join(vus.get(arch), 'index.html')], { encoding: 'utf8', cwd: RACINE });
        ok(x.status === 0, `${arch} : ${v.replace('.mjs', '')} passe avec le formulaire`, (x.stdout || '').split('\n').filter((l) => /BLOQUANT/.test(l)).join(' | '));
      }
    }
    const pros = readFileSync(join(fabriquer('400047514', { abonne: false }), 'index.html'), 'utf8');
    ok(!pros.includes('data-formulaire'), 'site de prospection : pas de formulaire');
    const sansCle = readFileSync(join(fabriquer('400047514', { cle: null }), 'index.html'), 'utf8');
    ok(!sansCle.includes('data-formulaire'), 'site d abonné sans clé publique : pas de formulaire');
    let refus = false;
    try { fabriquer('400047514', { cle: 'sb_secret_' + 'y'.repeat(20) }); } catch { refus = true; } // secret-ignore
    ok(refus, 'clé secrète donnée au générateur : fabrication refusée');

    // Dans un navigateur.
    let chromium;
    try { ({ chromium } = await import('playwright')); } catch { console.log('  NON LANCÉ : Playwright absent'); sortieFinale = 3; throw new Error('playwright'); }
    const nav = await chromium.launch();
    try {
      const d = vus.get('panneau') || [...vus.values()][0];
      const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
      const p = await ctx.newPage();
      await p.goto('file://' + join(d, 'index.html'));
      const f = p.locator('[data-formulaire]');
      await f.scrollIntoViewIfNeeded();
      const piege = await p.locator('input[name=site_web]').evaluate((el) => {
        const r = el.getBoundingClientRect(); return { x: r.right, tab: el.tabIndex, cache: el.closest('[aria-hidden=true]') !== null };
      });
      ok(piege.x < 0 && piege.tab === -1 && piege.cache, 'champ piège hors écran, hors clavier, caché aux lecteurs d écran', JSON.stringify(piege));
      // Sans téléphone ni adresse : rien ne part.
      await f.getByLabel('Votre demande').fill('Bonjour');
      await f.getByRole('button', { name: 'Envoyer la demande' }).click();
      await p.waitForTimeout(300);
      ok(recues.length === 0 && /au moins|laissez un téléphone/i.test(await f.locator('.retour').textContent()), 'sans téléphone ni adresse : rien ne part, message dit', await f.locator('.retour').textContent());
      // Envoi normal.
      await f.getByLabel('Votre nom').fill('Jean Visiteur');
      await f.getByLabel('Téléphone').fill('06 12 34 56 78');
      await f.getByLabel('Votre demande').fill('Façade de 120 m² à reprendre, maison de 1965.');
      await f.getByRole('button', { name: 'Envoyer la demande' }).click();
      await p.waitForFunction(() => /envoyée/.test(document.querySelector('.formulaire .retour').textContent), null, { timeout: 5000 }).catch(() => {});
      const derniere = recues.at(-1);
      ok(derniere?.apikey === CLE, 'la clé publique part dans apikey');
      ok(derniere?.corps.p_siren === '400047514' || /^\d{9}$/.test(derniere?.corps.p_siren || ''), 'le SIREN du site part', JSON.stringify(derniere?.corps));
      ok(derniere?.corps.p_message?.startsWith('Façade de 120') && derniere.corps.p_telephone === '06 12 34 56 78' && derniere.corps.p_nom === 'Jean Visiteur', 'message, téléphone et nom partent tels quels');
      ok(derniere?.corps.p_piege === null && /index\.html$/.test(derniere?.corps.p_page || ''), 'champ piège vide, page notée', JSON.stringify(derniere?.corps));
      ok(/Demande envoyée/.test(await f.locator('.retour').textContent()) && (await f.getByLabel('Votre demande').inputValue()) === '', 'réussite dite, formulaire vidé');
      // « trop » : message clair, la saisie reste.
      reponse = 'trop';
      await f.getByLabel('Téléphone').fill('0612345678');
      await f.getByLabel('Votre demande').fill('Deuxième demande');
      await f.getByRole('button', { name: 'Envoyer la demande' }).click();
      await p.waitForTimeout(600);
      ok(/Trop de demandes/.test(await f.locator('.retour').textContent()) && (await f.getByLabel('Votre demande').inputValue()) === 'Deuxième demande', '« trop » : message dit, saisie gardée');
      // Panne : message clair, saisie gardée, bouton rendu.
      statut = 500;
      await f.getByRole('button', { name: 'Envoyer la demande' }).click();
      await p.waitForTimeout(600);
      ok(/n’a pas marché/.test(await f.locator('.retour').textContent()) && await f.getByRole('button', { name: 'Envoyer la demande' }).isEnabled(), 'panne : message dit, bouton rendu');
      // Un robot qui remplit le champ piège : la base le reçoit rempli (elle l'écarte).
      statut = 200; reponse = 'recue';
      await p.locator('input[name=site_web]').evaluate((el) => { el.value = 'http://spam.example'; });
      await f.getByRole('button', { name: 'Envoyer la demande' }).click();
      await p.waitForTimeout(600);
      ok(recues.at(-1)?.corps.p_piege === 'http://spam.example', 'champ piège rempli : transmis à la base, qui l écarte (T10)');
      const champs = await f.locator('input:not([name=site_web]), textarea').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
      ok(champs.every((h) => h >= 44), 'champs assez grands pour le doigt (44 px au moins)', champs.join(', '));
      await ctx.close();
    } finally { await nav.close(); }
  }
} catch (e) {
  if (sortieFinale !== 3) { fautes++; console.log(`  FAUTE essai interrompu — ${e.message}`); }
} finally {
  serveur.close();
  rmSync(travail, { recursive: true, force: true });
}
if (sortieFinale === 3) process.exit(3);
console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
process.exitCode = fautes ? 1 : 0;

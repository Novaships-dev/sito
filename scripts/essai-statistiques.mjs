#!/usr/bin/env node
// Essai des statistiques (T22), sans réseau ni clé : client Umami
// (`atelier/umami.mjs`) contre `faux-umami.mjs`, import de la nuit
// (`atelier/statistiques.mjs`) contre le faux Supabase, chiffres de l'accueil
// (la somme que fait l'app, `app/src/jour.ts`), et mesure dans les pages
// (`generateur/sections/mesure.mjs`, contrôle R-MESURE de `verifier-site`).
//
// Ce qu'il mesure :
//   - les bornes d'un jour de Paris : 24 h un jour normal, 23 h et 25 h aux
//     changements d'heure ; « hier » vu de Paris, pas d'UTC ;
//   - une visite à 23 h 59 heure de Paris compte pour ce jour, une visite à
//     minuit pour le suivant ; les « Appeler » seuls comptent comme appels ;
//   - l'import écrit visites et appels, garde les demandes déjà comptées, ne
//     double rien quand il repasse, additionne deux sites d'une entreprise,
//     n'écrit rien (pas de zéro inventé) pour un site en panne ;
//   - l'accueil affiche, pour ce jour de Paris, ce que la source a compté ;
//   - une page d'abonné avec identifiant porte le script, chaque lien d'appel
//     est compté, les mentions le disent, et `verifier-site` passe ; une page
//     de prospection ne mesure rien ; une page qui mesure sans le dire est
//     refusée par `verifier-site`.
//
//   node scripts/essai-statistiques.mjs
//   node scripts/essai-statistiques.mjs --contre-essai   (copies cassées)
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { RACINE } from './env.mjs';
import { fauxUmami } from './faux-umami.mjs';
import { fauxSupabase } from './faux-supabase.mjs';
import { supabase } from '../atelier/supabase.mjs';
import { sommeParJour } from '../app/src/jour.ts';

const CLE_SB = 'cle-de-test-statistiques';
const ID_A = '0000aaaa-0000-4000-8000-0000000000aa', ID_A2 = '0000aaaa-0000-4000-8000-0000000000a2';
const ID_B = '0000bbbb-0000-4000-8000-0000000000bb', ID_C = '0000cccc-0000-4000-8000-0000000000cc';
const H = 3600_000, ms = (iso) => Date.parse(iso);

async function scenario({ umamiMod, statsMod, mesureMod, travail }) {
  let fautes = 0, essais = 0;
  const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

  console.log('Jour de Paris');
  const b = umamiMod.bornesJourParis('2026-11-04');
  ok(b.debut === ms('2026-11-03T23:00:00Z') && b.fin - b.debut === 24 * H, '4 nov. (heure d hiver) : de 23 h UTC la veille, 24 h', new Date(b.debut).toISOString());
  const e = umamiMod.bornesJourParis('2026-07-01');
  ok(e.debut === ms('2026-06-30T22:00:00Z') && e.fin - e.debut === 24 * H, '1er juillet (heure d été) : de 22 h UTC la veille', new Date(e.debut).toISOString());
  const p = umamiMod.bornesJourParis('2026-03-29'), a = umamiMod.bornesJourParis('2026-10-25');
  ok(p.fin - p.debut === 23 * H && a.fin - a.debut === 25 * H, 'jours de changement d heure : 23 h et 25 h', `${(p.fin - p.debut) / H} h, ${(a.fin - a.debut) / H} h`);
  ok(umamiMod.hierParis(new Date('2026-11-05T23:30:00Z')) === '2026-11-05', 'à 0 h 30 à Paris le 6, « hier » est le 5');

  console.log('Import de la nuit');
  const fu = fauxUmami({
    enPanne: [ID_C],
    sites: {
      [ID_A]: {
        visites: [ms('2026-11-03T22:59:59Z'), ms('2026-11-03T23:00:00Z'), ms('2026-11-04T12:00:00Z'), ms('2026-11-04T22:59:59Z'), ms('2026-11-04T23:00:00Z')],
        evenements: [{ t: ms('2026-11-04T09:00:00Z'), nom: 'Appeler' }, { t: ms('2026-11-04T10:00:00Z'), nom: 'Appeler' },
          { t: ms('2026-11-04T10:30:00Z'), nom: 'Autre' }, { t: ms('2026-11-04T23:00:00Z'), nom: 'Appeler' }],
      },
      [ID_A2]: { visites: [ms('2026-11-04T08:00:00Z')], evenements: [{ t: ms('2026-11-04T08:01:00Z'), nom: 'Appeler' }] },
      [ID_B]: { visites: [], evenements: [] },
      [ID_C]: { visites: [ms('2026-11-04T08:00:00Z')], evenements: [] },
    },
  });
  const umami = umamiMod.clientUmami({ cle: fu.cle, fetch: fu.fetch });
  ok(await umami.visites(ID_A, b.debut, b.fin) === 3, 'visites du 4 : 23 h 59 la veille et minuit le lendemain exclus', String(await umami.visites(ID_A, b.debut, b.fin)));
  ok(await umami.appels(ID_A, b.debut, b.fin) === 2, 'appels du 4 : les seuls « Appeler » du jour');
  let refus = null;
  try { await umamiMod.clientUmami({ cle: 'mauvaise', fetch: fu.fetch }).visites(ID_A, b.debut, b.fin); } catch (x) { refus = x; }
  ok(refus?.statut === 401, 'une mauvaise clé est refusée');

  const base = {
    sites: [
      { id: 's1', siren: '111111111', metier: 'ravalement', umami_id: ID_A },
      { id: 's2', siren: '111111111', metier: 'peinture', umami_id: ID_A2 },
      { id: 's3', siren: '222222222', metier: 'couverture', umami_id: ID_B },
      { id: 's4', siren: '333333333', metier: 'plomberie', umami_id: null },
      { id: 's5', siren: '444444444', metier: 'carrelage', umami_id: ID_C },
      { id: 's6', siren: '555555555', metier: 'peinture', statut: 'abonne', umami_id: null },
      { id: 's7', siren: '666666666', metier: 'peinture', statut: 'prospection', umami_id: null },
    ],
    adresses: [{ site_id: 's6', hote: 'www.peinture-nouvelle.fr', principale: true, etat: 'en_attente' },
      { site_id: 's7', hote: 'x.sito-essai.fr', principale: true, etat: 'active' }],
    statistiques: [{ siren: '111111111', jour: '2026-11-04', page: '/', source: 'tout', visites: 0, appels: 0, demandes: 2 }],
  };
  const faux = await fauxSupabase({ cle: CLE_SB, base, cles: { statistiques: ['siren', 'jour', 'page', 'source'] } });
  try {
    const sb = supabase({ url: faux.url, cle: CLE_SB });
    const m = await statsMod.brancherMesure({ sb, umami });
    const s6 = faux.base.sites.find((x) => x.id === 's6'), s7 = faux.base.sites.find((x) => x.id === 's7');
    ok(m.faits.length === 1 && fu.sites[s6.umami_id]?.domaine === 'www.peinture-nouvelle.fr', 'un abonné sans mesure reçoit son site Umami, à son adresse', JSON.stringify(m));
    ok(s7.umami_id === null, 'un site de prospection n en reçoit pas');
    ok((await statsMod.brancherMesure({ sb, umami })).faits.length === 0, 'repasser ne crée pas un second site Umami');
    const r1 = await statsMod.importerJour({ sb, umami, jour: '2026-11-04' });
    const ligne = (s) => faux.base.statistiques.filter((l) => l.siren === s && l.jour === '2026-11-04');
    const l1 = ligne('111111111');
    ok(l1.length === 1 && l1[0].visites === 4 && l1[0].appels === 3, 'deux sites d une entreprise : une ligne, la somme', JSON.stringify(l1));
    ok(l1[0]?.demandes === 2, 'les demandes déjà comptées restent', JSON.stringify(l1[0]));
    ok(ligne('222222222')[0]?.visites === 0, 'un site sans visite : une ligne à zéro (la source a dit zéro)');
    ok(ligne('333333333').length === 0, 'un site sans identifiant Umami : rien');
    ok(ligne('444444444').length === 0 && r1.fautes.length === 1 && /444444444/.test(r1.fautes[0]), 'un site en panne : rien d écrit, la panne est dite', JSON.stringify(r1.fautes));
    await statsMod.importerJour({ sb, umami, jour: '2026-11-04' });
    const l1b = ligne('111111111');
    ok(l1b.length === 1 && l1b[0].visites === 4 && l1b[0].appels === 3 && l1b[0].demandes === 2, 'repasser le même jour ne double rien', JSON.stringify(l1b));

    // L'accueil de l'app : la somme par jour de Paris, sur ce que la base rend.
    const lignes = faux.base.statistiques.filter((l) => l.siren === '111111111');
    const jour4 = sommeParJour(lignes, '2026-11-03', 3).find((j) => j.jour === '2026-11-04');
    const source = { visites: 3 + 1, appels: 2 + 1 };
    ok(jour4?.visites === source.visites && jour4?.appels === source.appels && jour4?.demandes === 2,
      'l accueil affiche pour le 4 ce que la source a compté ce jour de Paris', JSON.stringify(jour4));
  } finally { faux.arreter(); }

  console.log('Mesure dans les pages');
  const r = mesureMod.reglage({ abonne: true, id: ID_A });
  ok(mesureMod.reglage({ abonne: false, id: ID_A }) === null, 'un site de prospection ne mesure rien');
  let mal = null; try { mesureMod.reglage({ abonne: true, id: 'pas-un-id' }); } catch (x) { mal = x; }
  ok(Boolean(mal), 'un identifiant mal formé arrête la fabrication');
  const marque = mesureMod.marquerAppels('<a href="tel:+33491234567" data-appel="numero">Appeler</a><a data-appel="numero">x</a>', r);
  ok((marque.match(/data-umami-event="Appeler"/g) || []).length === 2, 'chaque lien d appel porte l événement « Appeler »');
  ok(/Umami/.test(mesureMod.mention(r)) && !/aucun traceur/.test(mesureMod.mention(r)) && /aucun traceur/.test(mesureMod.mention(null)), 'la mention dit la mesure, et seulement quand il y en a une');

  // Une vraie page d'abonné, fabriquée et vérifiée.
  if (travail) {
    const site = join(travail.dossier, 'site-abonne');
    const fab = (sortie, extra) => spawnSync(process.execPath, [join(RACINE, 'generateur', 'composer.mjs'), '--siren', '480423623', '--metier', 'ravalement',
      '--images', travail.images, '--sortie', sortie, '--donnees', travail.donnees, '--registre', join(travail.dossier, `r-${Math.random()}.json`), ...extra], { encoding: 'utf8', cwd: RACINE });
    const f = fab(site, ['--publication', '--adresse', 'https://facades-essai.example.fr/', '--umami-id', ID_A]);
    ok(f.status === 0, 'page d abonné fabriquée avec la mesure', (f.stderr || '').slice(-200));
    if (f.status === 0) {
      const pages = readdirSync(site).filter((n) => n.endsWith('.html'));
      ok(pages.every((n) => readFileSync(join(site, n), 'utf8').includes(`data-website-id="${ID_A}"`)), 'chaque page porte le script de mesure', pages.join(', '));
      const idx = readFileSync(join(site, 'index.html'), 'utf8');
      const liens = idx.match(/<a\b[^>]*data-appel="numero"[^>]*>/g) || [];
      ok(liens.length > 0 && liens.every((x) => /data-umami-event="Appeler"/.test(x)), 'chaque lien d appel de l accueil est compté', String(liens.length));
      ok(/Umami/.test(readFileSync(join(site, 'mentions-legales.html'), 'utf8')), 'les mentions légales disent la mesure');
      const v = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), site], { encoding: 'utf8', cwd: RACINE });
      ok(v.status === 0 && !/R-MESURE/.test(v.stdout), 'verifier-site : la page d abonné qui mesure passe', v.stdout.split('\n').filter((l) => /BLOQUANT/.test(l)).slice(0, 2).join(' | '));
      // La même page, mentions remises à l'ancienne phrase : refusée.
      const casse = join(travail.dossier, 'site-casse');
      mkdirSync(casse);
      for (const n of readdirSync(site)) if (n.endsWith('.html')) writeFileSync(join(casse, n), readFileSync(join(site, n), 'utf8')
        .replace(/data-ml="ML12">[^<]*</, 'data-ml="ML12">Ce site ne dépose aucun cookie ni aucun traceur.<'));
      const vc = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), casse], { encoding: 'utf8', cwd: RACINE });
      ok(vc.status !== 0 && /R-MESURE/.test(vc.stdout), 'verifier-site : une page qui mesure sans le dire est refusée');
      writeFileSync(join(casse, 'index.html'), idx.replace('</head>', '<script src="https://traceur.example.com/t.js"></script></head>'));
      const vt = spawnSync(process.execPath, [join(RACINE, 'scripts', 'verifier-site.mjs'), casse], { encoding: 'utf8', cwd: RACINE });
      ok(/script tiers/.test(vt.stdout), 'verifier-site : un script tiers est refusé');
    }
    const pro = join(travail.dossier, 'site-prospection');
    const fp = fab(pro, ['--umami-id', ID_A]);
    ok(fp.status === 0 && !readFileSync(join(pro, 'index.html'), 'utf8').includes('data-website-id'), 'une page de prospection, même avec un identifiant, ne mesure rien');
  }
  return { fautes, essais };
}

async function essayer(m) {
  try { return await scenario(m); } catch (x) { console.log(`  FAUTE l essai s arrête : ${x.message}`); return { fautes: 1, essais: 1 }; }
}

async function preparer() {
  const dossier = mkdtempSync(join(tmpdir(), 'sito-statistiques-'));
  const images = join(dossier, 'images');
  mkdirSync(images);
  const image = (c1, c2) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="1600" height="1100" fill="url(#g)"/></svg>`)).jpeg({ quality: 85 }).toBuffer();
  for (const [n, c1, c2] of [['hero', '#8a7b6a', '#e4ddd0'], ['avant-01', '#6d655c', '#8f877d'], ['apres-01', '#e9e3d6', '#d5cbb8'],
    ['chantier', '#7a5638', '#b89a7a'], ['geste', '#4f4f4f', '#8a8a8a'], ['detail-enduit', '#c8b494', '#e8dcc4']])
    writeFileSync(join(images, `${n}.jpg`), await image(c1, c2));
  const donnees = join(dossier, 'd.json');
  writeFileSync(donnees, JSON.stringify({ siren: '480423623', nom_raison_sociale: 'Façades Essai', date_creation: '2015-04-01',
    activite_principale: '43.99D', nature_juridique: '5710',
    siege: { siret: '48042362300017', adresse: '10 rue du Test', libelle_commune: 'Marseille', code_postal: '13001' },
    telephone: '0491234567', mentions: { courriel: 'contact@facades-essai.fr', directeur_publication: 'Jeanne Essai' } }));
  return { dossier, images, donnees };
}

const href = (...p) => pathToFileURL(join(RACINE, ...p)).href;
const modules = async (rempl = {}) => ({
  umamiMod: rempl.umami || await import(href('atelier', 'umami.mjs')),
  statsMod: rempl.stats || await import(href('atelier', 'statistiques.mjs')),
  mesureMod: rempl.mesure || await import(href('generateur', 'sections', 'mesure.mjs')),
});

if (!process.argv.includes('--contre-essai')) {
  const travail = await preparer();
  try {
    const { fautes, essais } = await essayer({ ...(await modules()), travail });
    console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
    process.exitCode = fautes ? 1 : 0;
  } finally { rmSync(travail.dossier, { recursive: true, force: true }); }
} else {
  const casses = [
    ['atelier/umami.mjs', 'umami', 'un jour compte toujours 24 h', (s) => s.replace('return { debut: minuit(jour), fin: minuit(lendemain) };', 'return { debut: minuit(jour), fin: minuit(jour) + 86400000 };')],
    ['atelier/umami.mjs', 'umami', 'la fin du jour est incluse', (s) => s.replace("{ startAt: debut, endAt: fin - 1 });\n      const v", "{ startAt: debut, endAt: fin });\n      const v")],
    ['atelier/umami.mjs', 'umami', 'tous les événements comptent comme appels', (s) => s.replace("const l = (Array.isArray(lignes) ? lignes : []).find((x) => x.x === EVENEMENT_APPEL);\n      return l ? Number(l.y) || 0 : 0;", "return (Array.isArray(lignes) ? lignes : []).reduce((n, x) => n + x.y, 0);")],
    ['atelier/statistiques.mjs', 'stats', 'les demandes sont remises à zéro', (s) => s.replace("({ siren, jour, page: '/', source: 'tout', ...v })", "({ siren, jour, page: '/', source: 'tout', demandes: 0, ...v })")],
    ['atelier/statistiques.mjs', 'stats', 'la mesure se branche sur les sites de prospection', (s) => s.replace("statut: ['in', ['abonne', 'publie']] }", '}')],
    ['atelier/statistiques.mjs', 'stats', 'un site en panne écrit zéro', (s) => s.replace("parSiren.set(s.siren, null);", "parSiren.set(s.siren, { visites: 0, appels: 0 });")],
    ['generateur/sections/mesure.mjs', 'mesure', 'les liens d appel ne sont pas comptés', (s) => s.replace("return html.replace(/data-appel=\"numero\"/g, 'data-appel=\"numero\" data-umami-event=\"Appeler\"');", 'return html;')],
  ];
  const d = mkdtempSync(join(tmpdir(), 'sito-statistiques-casse-'));
  let justes = 0;
  try {
    for (const [i, [fichier, cle, quoi, casser]] of casses.entries()) {
      const source = readFileSync(join(RACINE, fichier), 'utf8').replace(/from '(\.\.?\/[^']+)'/g, (_, rel) => `from '${pathToFileURL(join(RACINE, fichier, '..', rel)).href}'`);
      const cassee = casser(source);
      if (cassee === source) { console.log(`  FAUTE la cassure « ${quoi} » ne s applique pas`); continue; }
      const f = join(d, `casse-${i}.mjs`);
      writeFileSync(f, cassee);
      console.log(`\n--- copie cassée (${fichier}) : ${quoi}`);
      const { fautes } = await essayer({ ...(await modules({ [cle]: await import(pathToFileURL(f).href) })), travail: null });
      console.log(fautes ? '  => rouge, juste' : '  => VERT : l essai n attrape pas cette cassure');
      if (fautes) justes++;
    }
  } finally { rmSync(d, { recursive: true, force: true }); }
  console.log(`\nContre-essai : ${justes} cassure(s) sur ${casses.length} attrapée(s).`);
  process.exitCode = justes === casses.length ? 0 : 1;
}

#!/usr/bin/env node
// Essai de l'adaptateur Supabase du service « atelier » contre un faux
// Supabase local : aucun réseau, aucune clé, donc il tourne aussi dans la CI.
//
// Ce qu'il mesure, jamais ce que le code dit de lui-même :
//   - les en-têtes réellement envoyés (la clé dans `apikey`, jamais un
//     `Authorization: Bearer`) ;
//   - les octets réellement écrits et relus dans le stockage ;
//   - ce qui se passe quand Supabase refuse (401, 404, 409) : une erreur qui
//     nomme l'appel, sans jamais montrer la clé ;
//   - un rejeu : la même écriture deux fois n'écrit qu'une ligne.
//
//   node scripts/essai-service.mjs [chemin du module]   (défaut : atelier/supabase.mjs)
//   node scripts/essai-service.mjs --contre-essai       (copie cassée exprès, hors du dépôt)
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { RACINE } from './env.mjs';
import { fauxSupabase } from './faux-supabase.mjs';

const CONTRE = process.argv.includes('--contre-essai');
const CLE = 'cle-de-test-du-faux-supabase';

let fautes = 0, essais = 0;
const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };

// ------------------------------------------------- la copie cassée du contre-essai
// Hors du dépôt (piège du 21 octobre : une copie d'essai laissée dedans part
// sur GitHub). Deux fautes posées exprès, celles qui comptent le plus :
// la clé en `Bearer`, et un refus de Supabase avalé en silence.
function copieCassee() {
  const d = mkdtempSync(join(tmpdir(), 'sito-service-casse-'));
  mkdirSync(join(d, 'atelier')); mkdirSync(join(d, 'scripts'));
  let src = readFileSync(join(RACINE, 'atelier', 'supabase.mjs'), 'utf8');
  const avant = src;
  src = src.replace('const entetes = { apikey: cle };', "const entetes = { authorization: `Bearer ${cle}` };");
  src = src.replace('    if (!r.ok) {', '    if (false) {');
  if (src === avant) { console.error('la copie cassée n a rien cassé : le module a changé de forme.'); process.exit(2); }
  writeFileSync(join(d, 'atelier', 'supabase.mjs'), src);
  writeFileSync(join(d, 'scripts', 'env.mjs'), readFileSync(join(RACINE, 'scripts', 'env.mjs')));
  return { dossier: d, module: join(d, 'atelier', 'supabase.mjs') };
}

const casse = CONTRE ? copieCassee() : null;
const CHEMIN = resolve(process.argv.find((a, i) => i >= 2 && !a.startsWith('--')) || casse?.module || join(RACINE, 'atelier', 'supabase.mjs'));
const { supabase, ErreurSupabase } = await import(pathToFileURL(CHEMIN).href);

// ------------------------------------------------------------- le faux Supabase
// Le faux serveur vit dans scripts/faux-supabase.mjs : le même pour cet essai
// et pour celui de la préparation des photos.
const lignes = {
  photos: [
    { id: 1, siren: '480423623', etat: 'recue', chemin_original: '480423623/c1/a.jpg', rang: 2 },
    { id: 2, siren: '480423623', etat: 'prete', chemin_original: '480423623/c1/b.jpg', rang: 1 },
    { id: 3, siren: '849891528', etat: 'recue', chemin_original: '849891528/c9/z.jpg', rang: 3 },
  ],
  profils: [{ siren: '480423623', telephone: '0491234567' }],
  evenements_stripe: [],
  statistiques: [],
  fabrications: [],
};
const faux = await fauxSupabase({
  cle: CLE,
  base: lignes,
  cles: { evenements_stripe: ['id_stripe'], statistiques: ['siren', 'jour'], profils: ['siren'] },
});
const base = faux.base, vues = faux.vues;
const URL_FAUSSE = faux.url;

const sb = supabase({ url: URL_FAUSSE, cle: CLE });
const photos = sb.stockage('photos');
const leve = async (f) => { try { await f(); return null; } catch (e) { return e; } };

try {
  // ------------------------------------------------------------ les tables
  console.log('\nTables (PostgREST)');
  const recues = await sb.lire('photos', { select: 'id,siren,etat', filtres: { etat: ['eq', 'recue'] }, ordre: 'rang.desc' });
  ok(recues.length === 2 && recues[0].id === 3 && recues[1].id === 1, 'lire : filtre, ordre et sélection', JSON.stringify(recues));
  ok(await sb.lire('photos', { filtres: { etat: ['eq', 'inconnu'] } }).then((l) => Array.isArray(l) && l.length === 0), 'lire : aucune ligne rend un tableau vide, pas une erreur');
  const deux = await sb.lire('photos', { filtres: { id: ['in', [1, 3]] } });
  ok(deux.length === 2, 'lire : filtre « in »', String(deux.length));
  ok((await sb.lireUne('profils', { filtres: { siren: ['eq', '480423623'] } }))?.telephone === '0491234567', 'lireUne : la ligne demandée');
  ok((await sb.lireUne('profils', { filtres: { siren: ['eq', '000000000'] } })) === null, 'lireUne : rien trouvé rend null');
  const ambigu = await leve(() => sb.lireUne('photos', { filtres: { siren: ['eq', '480423623'] } }));
  ok(ambigu && /2 lignes/.test(ambigu.message), 'lireUne : deux lignes correspondent, c’est une faute', ambigu?.message);

  const [fab] = await sb.inserer('fabrications', { siren: '480423623', motif: 'photo prête' });
  ok(fab?.id && fab.cree_le === '2026-10-24T00:00:00Z', 'inserer : rend la ligne écrite avec ses valeurs par défaut', JSON.stringify(fab));

  await sb.insererSiAbsent('evenements_stripe', { id_stripe: 'evt_1', genre: 'invoice.paid' });
  await sb.insererSiAbsent('evenements_stripe', { id_stripe: 'evt_1', genre: 'invoice.paid' });
  ok(base.evenements_stripe.length === 1, 'rejeu : le même événement deux fois n’écrit qu’une ligne', String(base.evenements_stripe.length));

  await sb.poser('statistiques', { siren: '480423623', jour: '2026-10-23', visites: 10 }, { surConflit: 'siren,jour' });
  await sb.poser('statistiques', { siren: '480423623', jour: '2026-10-23', visites: 14 }, { surConflit: 'siren,jour' });
  ok(base.statistiques.length === 1 && base.statistiques[0].visites === 14, 'poser : écrit puis met à jour la même ligne (jour de Paris)', JSON.stringify(base.statistiques));

  const majorees = await sb.majorer('photos', { id: ['eq', 1] }, { etat: 'prete', chemin: '480423623/c1/a.webp' });
  ok(majorees.length === 1 && majorees[0].etat === 'prete', 'majorer : rend les lignes écrites', JSON.stringify(majorees));
  ok((await sb.majorer('photos', { id: ['eq', 9999] }, { etat: 'prete' })).length === 0, 'majorer : aucune ligne touchée se voit (zéro ligne rendue)');
  const sansFiltre = await leve(() => sb.majorer('photos', {}, { etat: 'prete' }));
  ok(sansFiltre && /au moins un filtre/.test(sansFiltre.message), 'majorer : jamais toute la table sans filtre', sansFiltre?.message);

  ok(await sb.fonction('jour_paris', { quand: '2026-10-05T23:30:00Z' }) === '2026-10-06', 'fonction SQL : le jour de Paris pour 23 h 30 UTC');

  // ------------------------------------------------------------ le stockage
  console.log('\nStockage');
  const octets = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x7f, 0x80, 0x0a, 0x0d]);
  await photos.ecrire('480423623/c1/a.jpg', octets, { type: 'image/jpeg' });
  const relus = await photos.lire('480423623/c1/a.jpg');
  ok(Buffer.compare(relus, octets) === 0, 'écrit puis relu, octet pour octet', `${relus.length} octets`);
  const dejaLa = await leve(() => photos.ecrire('480423623/c1/a.jpg', Buffer.from('autre'), { type: 'image/jpeg' }));
  ok(dejaLa instanceof ErreurSupabase && dejaLa.statut === 409, 'un fichier déjà là n’est pas écrasé sans le dire (409)', dejaLa?.message);
  await photos.ecrire('480423623/c1/a.jpg', Buffer.from('remplace'), { type: 'image/jpeg', remplacer: true });
  ok((await photos.lire('480423623/c1/a.jpg')).toString() === 'remplace', 'remplacer: true écrase bien');
  await photos.ecrire('480423623/c1/neuf.jpg', Buffer.from('neuf'), { type: 'image/jpeg', remplacer: true });
  ok((await photos.lire('480423623/c1/neuf.jpg')).toString() === 'neuf', 'remplacer: true écrit aussi un chemin neuf (x-upsert, pas un PUT)');
  ok((await photos.urlSignee('480423623/c1/a.jpg', 60)).startsWith(`${URL_FAUSSE}/storage/v1/object/sign/photos/`), 'adresse signée complète');
  await photos.supprimer(['480423623/c1/a.jpg']);
  const parti = await leve(() => photos.lire('480423623/c1/a.jpg'));
  ok(parti instanceof ErreurSupabase && parti.statut === 404, 'supprimé : la lecture suivante dit 404', parti?.message);
  const espaceFaux = await leve(() => sb.stockage('Photos Privées'));
  ok(espaceFaux && /espace de stockage invalide/.test(espaceFaux.message), 'nom d’espace invalide refusé avant tout appel');

  // ------------------------------------------------------- en-têtes et refus
  console.log('\nEn-têtes et refus');
  // L'invariant, quel que soit l'ordre des contrôles : chaque appel porte une
  // clé dans `apikey`, et aucun ne porte d'`Authorization`.
  ok(vues.length > 0 && vues.every((v) => typeof v.entetes.apikey === 'string' && v.entetes.apikey.length > 0), 'la clé voyage dans « apikey » à chaque appel', `${vues.length} appels`);
  ok(vues.every((v) => !v.entetes.authorization), 'aucun appel ne pose « Authorization: Bearer »');

  const mauvaise = supabase({ url: URL_FAUSSE, cle: 'mauvaise-cle' });
  const refus = await leve(() => mauvaise.lire('photos'));
  ok(refus instanceof ErreurSupabase && refus.statut === 401, 'clé refusée : erreur qui porte le code 401', refus?.message);
  ok(refus && !refus.message.includes('mauvaise-cle'), 'le message d’erreur ne montre jamais la clé', refus?.message);
  const inconnue = await leve(() => sb.lire('table_qui_nexiste_pas'));
  ok(inconnue instanceof ErreurSupabase && inconnue.statut === 404 && /rest\/v1\/table_qui_nexiste_pas/.test(inconnue.message), 'table inconnue : l’erreur nomme l’appel', inconnue?.message);
  const nomFaux = await leve(() => sb.lire('Photos; drop table'));
  ok(nomFaux && /nom de table invalide/.test(nomFaux.message), 'nom de table invalide refusé avant tout appel', nomFaux?.message);
  const sansCle = await leve(async () => supabase({ url: URL_FAUSSE, cle: '' }));
  ok(sansCle && /obligatoires/.test(sansCle.message), 'adaptateur sans clé : refus immédiat, jamais de valeur inventée');

  // Le service en vrai lit le .env, et s'arrête (code 3) si la clé manque.
  const parEnv = spawnSync(process.execPath, ['-e', `import(${JSON.stringify(pathToFileURL(CHEMIN).href)}).then(m=>m.depuisEnv())`],
    { encoding: 'utf8', env: { ...process.env, SUPABASE_URL: '', SUPABASE_CLE_SERVICE: '' }, cwd: tmpdir() });
  ok(parEnv.status === 3 && /SUPABASE_CLE_SERVICE/.test(parEnv.stderr), 'depuisEnv sans .env : arrêt (code 3) qui dit quoi faire', (parEnv.stderr || '').trim().slice(0, 100));
} catch (e) {
  fautes++;
  console.log(`  FAUTE essai interrompu — ${e.message.split('\n')[0]}`);
} finally {
  faux.arreter();
  if (casse) rmSync(casse.dossier, { recursive: true, force: true });
}

console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
if (CONTRE) {
  console.log(fautes ? 'Contre-essai réussi : la copie cassée est attrapée.' : 'CONTRE-ESSAI RATÉ : la copie cassée passe.');
  process.exitCode = fautes ? 0 : 1;
} else process.exitCode = fautes ? 1 : 0;

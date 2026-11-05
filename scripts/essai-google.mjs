#!/usr/bin/env node
// Essai de Google (T24), sans réseau ni clé : chiffrement et état signé
// (`_shared/chiffre.mjs`), client Google (`_shared/google.mjs`) contre
// `faux-google.mjs`, liaison et passage de la nuit (`_shared/avis-google.mjs`,
// dépôt `atelier/avis.mjs`) contre le faux Supabase.
//
// Ce qu'il mesure (la preuve de T24 : « avis importés, réponse validée
// publiée, jeton jamais en clair ») :
//   - le jeton rangé en base n'est jamais le jeton en clair, ni en base64 ; il
//     ne se déchiffre pas avec une autre clé ni pour une autre entreprise ;
//   - l'état du consentement est signé, expire, et ne se falsifie pas ;
//   - la liaison range compte et fiche, l'écran dit « Reliée » ;
//   - tous les avis sont importés, toutes pages lues ; notes et réponses
//     existantes sont lues ; un second passage ne double rien et n'écrase pas
//     le brouillon de l'artisan ;
//   - une réponse validée est publiée chez Google puis marquée publiée ; une
//     réponse préparée mais non validée ne part pas ;
//   - un accès retiré chez Google : la fiche passe « Accès retiré », le jeton
//     est oublié.
//
//   node scripts/essai-google.mjs
//   node scripts/essai-google.mjs --contre-essai   (copies cassées)
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from './env.mjs';
import { fauxGoogle } from './faux-google.mjs';
import { fauxSupabase } from './faux-supabase.mjs';
import { supabase } from '../atelier/supabase.mjs';

const CLE = Buffer.alloc(32, 7).toString('base64');
const AUTRE_CLE = Buffer.alloc(32, 9).toString('base64');
const CLE_SB = 'cle-de-test-google';
const SIREN = '480423623';
const ETOILES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];

async function scenario({ chiffre, google: gMod, avisGoogle, avisNode }) {
  let fautes = 0, essais = 0;
  const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
  const refuse = async (f) => { try { await f(); return false; } catch { return true; } };

  console.log('Chiffrement et état signé');
  const c1 = await chiffre.chiffrer('secret-clair', CLE, SIREN), c2 = await chiffre.chiffrer('secret-clair', CLE, SIREN);
  ok(await chiffre.dechiffrer(c1, CLE, SIREN) === 'secret-clair' && c1 !== c2, 'aller-retour, et deux chiffrés différents du même texte');
  ok(await refuse(() => chiffre.dechiffrer(c1, AUTRE_CLE, SIREN)), 'une autre clé ne déchiffre pas');
  ok(await refuse(() => chiffre.dechiffrer(c1, CLE, '849891528')), 'recopié sur une autre entreprise, il ne se déchiffre pas');
  ok(await refuse(() => chiffre.chiffrer('x', 'trop-courte', SIREN)), 'une clé qui n a pas 32 octets est refusée');
  const etat = await chiffre.signer({ siren: SIREN, user: 'u-1', retour: 'https://app.essai/#/google' }, CLE, { maintenant: 1_000_000 });
  ok((await chiffre.lireSigne(etat, CLE, { maintenant: 1_000_000 + 60_000 }))?.siren === SIREN, 'état signé relu');
  ok(await chiffre.lireSigne(etat, CLE, { maintenant: 1_000_000 + 16 * 60_000 }) === null, 'état expiré après 15 minutes');
  const [corps, sig] = etat.split('.');
  const faux = Buffer.from(JSON.stringify({ siren: '849891528', user: 'u-1', retour: 'x', exp: 9e9 })).toString('base64url');
  ok(await chiffre.lireSigne(`${faux}.${sig}`, CLE) === null && await chiffre.lireSigne(`${corps}.${sig}`, AUTRE_CLE, { maintenant: 1_000_000 }) === null, 'un état falsifié ou signé d une autre clé est refusé');

  console.log('Liaison');
  const avis = Array.from({ length: 60 }, (_, i) => ({ reviewId: `r${i + 1}`, reviewer: { displayName: `Client ${i + 1}`, isAnonymous: i === 1 },
    starRating: ETOILES[i % 5], comment: `Avis ${i + 1}`, createTime: '2026-10-01T10:00:00Z',
    ...(i === 2 ? { reviewReply: { comment: 'Merci, déjà répondu', updateTime: '2026-10-02T10:00:00Z' } } : {}) }));
  const fg = fauxGoogle({ avis });
  const lien = new URL(gMod.lienConsentement({ clientId: fg.clientId, redirection: fg.redirection, etat }));
  ok(lien.searchParams.get('scope') === gMod.PORTEE && lien.searchParams.get('access_type') === 'offline' && lien.searchParams.get('prompt') === 'consent' && lien.searchParams.get('state') === etat,
    'le lien de consentement demande business.manage, un accès durable, et porte l état');
  const g = gMod.clientGoogle({ clientId: fg.clientId, secret: fg.secret, fetch: fg.fetch });
  const coffre = new Map();
  const base = { avis: [], connexions_google: [] };
  const fs = await fauxSupabase({ cle: CLE_SB, base, cles: { avis: ['source', 'ref_externe'], connexions_google: ['siren'] }, fonctions: {
    poser_jeton_google: (a) => { coffre.set(a.p_siren, { jeton: a.p_jeton, portee: a.p_portee }); return null; },
    lire_jeton_google: (a) => (coffre.has(a.p_siren) ? [coffre.get(a.p_siren)] : []),
    oublier_jeton_google: (a) => { coffre.delete(a.p_siren); return null; },
  } });
  try {
    const sb = supabase({ url: fs.url, cle: CLE_SB });
    const depot = avisNode.depotBase(sb);
    const r = await avisGoogle.relier({ siren: SIREN, code: fg.accord(), redirection: fg.redirection, depot, google: g, cle: CLE });
    const range = coffre.get(SIREN)?.jeton || '';
    const clair = 'rafraichir-1-tres-secret';
    ok(r.ok && range.length > 0, 'la liaison range un jeton', JSON.stringify(r));
    ok(!range.includes(clair) && !Buffer.from(range, 'base64').toString('latin1').includes(clair) && !JSON.stringify(base).includes(clair),
      'le jeton n est jamais en clair, ni en base64, ni dans les tables');
    const cx = base.connexions_google.find((x) => x.siren === SIREN);
    ok(cx?.etat === 'connectee' && cx?.fiche === 'Façades Essai', 'la fiche est reliée, avec son nom', JSON.stringify(cx));
    ok(await refuse(() => avisGoogle.relier({ siren: SIREN, code: 'code-inconnu', redirection: fg.redirection, depot, google: g, cle: CLE })), 'un code inconnu ou déjà servi est refusé');

    console.log('Passage de la nuit');
    const s1 = await avisGoogle.synchroniser({ siren: SIREN, depot, google: g, cle: CLE });
    ok(s1.avis === 60 && base.avis.length === 60, 'les 60 avis sont importés (deux pages)', `${s1.avis} / ${base.avis.length}`);
    const a1 = base.avis.find((x) => x.ref_externe === 'r1'), a2 = base.avis.find((x) => x.ref_externe === 'r2'), a3 = base.avis.find((x) => x.ref_externe === 'r3');
    ok(a1?.note === 1 && base.avis.find((x) => x.ref_externe === 'r5')?.note === 5 && a2?.auteur === 'Anonyme', 'notes et auteurs lus (un avis anonyme reste anonyme)');
    ok(a3?.reponse === 'Merci, déjà répondu', 'une réponse déjà publiée chez Google est lue');
    // L'artisan prépare deux réponses, n'en valide qu'une.
    Object.assign(base.avis.find((x) => x.ref_externe === 'r4'), { brouillon: 'Merci Client 4 !', valide_le: '2026-11-05T09:00:00Z', valide_par: 'u-1' });
    Object.assign(base.avis.find((x) => x.ref_externe === 'r5'), { brouillon: 'Brouillon pas encore validé' });
    const s2 = await avisGoogle.synchroniser({ siren: SIREN, depot, google: g, cle: CLE });
    const g4 = fg.reviews.find((x) => x.reviewId === 'r4'), g5 = fg.reviews.find((x) => x.reviewId === 'r5');
    ok(s2.publiees === 1 && g4.reviewReply?.comment === 'Merci Client 4 !', 'la réponse validée est publiée chez Google', JSON.stringify(s2));
    ok(base.avis.find((x) => x.ref_externe === 'r4')?.reponse === 'Merci Client 4 !', 'puis marquée publiée dans l app');
    ok(!g5.reviewReply, 'une réponse préparée mais non validée ne part pas');
    ok(base.avis.length === 60 && base.avis.find((x) => x.ref_externe === 'r5')?.brouillon === 'Brouillon pas encore validé', 'un nouveau passage ne double rien et garde le brouillon');
    const s3 = await avisGoogle.synchroniser({ siren: SIREN, depot, google: g, cle: CLE });
    ok(s3.publiees === 0, 'une réponse publiée ne repart pas');
    ok(base.connexions_google.find((x) => x.siren === SIREN)?.derniere_synchro, 'la dernière mise à jour est datée');

    fg.retirer();
    const s4 = await avisGoogle.synchroniser({ siren: SIREN, depot, google: g, cle: CLE });
    ok(s4.etat === 'revoquee' && base.connexions_google.find((x) => x.siren === SIREN)?.etat === 'revoquee' && !coffre.has(SIREN),
      'accès retiré chez Google : « Accès retiré », et le jeton est oublié', JSON.stringify(s4));
    const s5 = await avisGoogle.synchroniser({ siren: '849891528', depot, google: g, cle: CLE });
    ok(s5.etat === 'a_connecter', 'une entreprise sans fiche reliée : rien à faire');
  } finally { fs.arreter(); }
  return { fautes, essais };
}

async function essayer(m) {
  try { return await scenario(m); } catch (x) { console.log(`  FAUTE l essai s arrête : ${x.message}`); return { fautes: 1, essais: 1 }; }
}
const href = (...p) => pathToFileURL(join(RACINE, ...p)).href;
const PART = ['supabase', 'functions', '_shared'];
const modules = async (r = {}) => ({
  chiffre: r.chiffre || await import(href(...PART, 'chiffre.mjs')),
  google: r.google || await import(href(...PART, 'google.mjs')),
  avisGoogle: r.avisGoogle || await import(href(...PART, 'avis-google.mjs')),
  avisNode: r.avisNode || await import(href('atelier', 'avis.mjs')),
});

if (!process.argv.includes('--contre-essai')) {
  const { fautes, essais } = await essayer(await modules());
  console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
  process.exitCode = fautes ? 1 : 0;
} else {
  const casses = [
    ['supabase/functions/_shared/chiffre.mjs', 'chiffre', 'le SIREN n est plus lié au chiffré', (s) => s.replaceAll(', additionalData: enc.encode(contexte)', '')],
    ['supabase/functions/_shared/chiffre.mjs', 'chiffre', 'l état n expire jamais', (s) => s.replace('if (!d?.exp || d.exp * 1000 < maintenant) return null;', 'if (!d) return null;')],
    ['supabase/functions/_shared/google.mjs', 'google', 'seule la première page d avis est lue', (s) => s.replace("        if (!j.nextPageToken) break;\n", '        break;\n')],
    ['supabase/functions/_shared/avis-google.mjs', 'avisGoogle', 'le jeton est rangé en clair', (s) => s.replace('await chiffrer(secret, cle, siren)', 'btoa(secret)')],
    ['supabase/functions/_shared/avis-google.mjs', 'avisGoogle', 'un accès retiré garde son jeton', (s) => s.replace('      await depot.oublierJeton(siren);\n', '')],
    ['atelier/avis.mjs', 'avisNode', 'une réponse non validée est publiée', (s) => s.replace(" valide_le: ['not.is', 'null'],", '')],
  ];
  const d = mkdtempSync(join(tmpdir(), 'sito-google-casse-'));
  let justes = 0;
  try {
    for (const [i, [fichier, cle, quoi, casser]] of casses.entries()) {
      const source = readFileSync(join(RACINE, fichier), 'utf8').replace(/from '(\.\.?\/[^']+)'/g, (_, rel) => `from '${pathToFileURL(join(RACINE, fichier, '..', rel)).href}'`);
      const cassee = casser(source);
      if (cassee === source) { console.log(`  FAUTE la cassure « ${quoi} » ne s applique pas`); continue; }
      const f = join(d, `casse-${i}.mjs`);
      writeFileSync(f, cassee);
      console.log(`\n--- copie cassée (${fichier}) : ${quoi}`);
      const { fautes } = await essayer(await modules({ [cle]: await import(pathToFileURL(f).href) }));
      console.log(fautes ? '  => rouge, juste' : '  => VERT : l essai n attrape pas cette cassure');
      if (fautes) justes++;
    }
  } finally { rmSync(d, { recursive: true, force: true }); }
  console.log(`\nContre-essai : ${justes} cassure(s) sur ${casses.length} attrapée(s).`);
  process.exitCode = justes === casses.length ? 0 : 1;
}

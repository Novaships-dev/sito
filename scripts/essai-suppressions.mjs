#!/usr/bin/env node
// Essai de la suppression des comptes à l'échéance (T12, `atelier/supprimer-comptes.mjs`),
// contre un faux Supabase et un faux Cloudflare. Aucun réseau, aucune clé.
//
// Ce qu'il mesure :
//   - une demande échue, non annulée : site retiré de Pages, fichiers du
//     stockage effacés, entreprise et données effacées, compte effacé ;
//   - une demande annulée, une demande pas encore échue : rien ne bouge ;
//   - une entreprise à deux membres : seul le compte part, les données restent ;
//   - un abonnement Stripe en cours sans Stripe branché : rien n'est effacé ;
//     avec Stripe : résilié, puis effacé ;
//   - un second tour : rien de plus, rien ne casse ;
//   - une panne au milieu : la demande reste, le tour suivant finit le travail.
//
//   node scripts/essai-suppressions.mjs
//   node scripts/essai-suppressions.mjs --contre-essai   (trois copies cassées
//        du module : chacune doit faire rougir l'essai)
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from './env.mjs';
import { fauxSupabase } from './faux-supabase.mjs';
import { fauxCloudflare } from './faux-cloudflare.mjs';
import { supabase } from '../atelier/supabase.mjs';
import { clientCloudflare } from './prospection/cloudflare-pages.mjs';

const CLE = 'cle-de-test-suppressions';
const U = (n) => `0000000${n}-0000-4000-8000-000000000000`;
const HIER = '2026-11-01T00:00:00Z', DEMAIN = '2099-01-01T00:00:00Z';

async function scenario(supprimerEchus) {
  let fautes = 0, essais = 0;
  const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
  const ent = (siren) => ({ siren, denomination: 'E' + siren });
  const base = {
    suppressions: [
      { user_id: U(1), effective_le: HIER, annulee_le: null },          // échue : effacée
      { user_id: U(2), effective_le: HIER, annulee_le: '2026-10-20T00:00:00Z' }, // annulée
      { user_id: U(3), effective_le: DEMAIN, annulee_le: null },        // pas échue
      { user_id: U(4), effective_le: HIER, annulee_le: null },          // entreprise à deux
      { user_id: U(6), effective_le: HIER, annulee_le: null },          // abonné Stripe
    ],
    membres: [
      { user_id: U(1), siren: '111111111' }, { user_id: U(2), siren: '222222222' },
      { user_id: U(3), siren: '333333333' }, { user_id: U(4), siren: '444444444' },
      { user_id: U(5), siren: '444444444' }, { user_id: U(6), siren: '666666666' },
    ],
    entreprises: ['111111111', '222222222', '333333333', '444444444', '666666666'].map(ent),
    sites: [
      { siren: '111111111', metier: 'ravalement', statut: 'publie' },
      { siren: '222222222', metier: 'peinture', statut: 'publie' },
      { siren: '444444444', metier: 'couverture', statut: 'publie' },
      { siren: '666666666', metier: 'ravalement', statut: 'publie' },
    ],
    profils: ['111111111', '222222222', '444444444', '666666666'].map((siren) => ({ siren, telephone: '0491000000' })),
    demandes: [{ id: 1, siren: '111111111', message: 'Bonjour' }, { id: 2, siren: '222222222', message: 'Bonjour' }],
    abonnements: [
      { siren: '111111111', etat: 'resilie', stripe_abonnement: 'sub_ancien' },
      { siren: '666666666', etat: 'actif', stripe_abonnement: 'sub_actif' },
    ],
  };
  const cles = { suppressions: ['user_id'], membres: ['user_id', 'siren'], entreprises: ['siren'], sites: ['siren', 'metier'], profils: ['siren'], abonnements: ['siren'] };
  const objets = new Map();
  for (const [s, n] of [['111111111', 3], ['222222222', 2], ['444444444', 2], ['666666666', 1]])
    for (let i = 0; i < n; i++) objets.set(`photos-chantiers/${s}/chantier-${i % 2}/photo-${i}.jpg`, Buffer.from('x'));
  objets.set('banque/111111111-ne-pas-toucher.jpg', Buffer.from('x'));
  const comptes = new Set([1, 2, 3, 4, 5, 6].map(U));
  const faux = await fauxSupabase({ cle: CLE, base, cles, objets, comptes });
  const cf = fauxCloudflare({ projets: ['sito-111111111-ravalement', 'sito-222222222-peinture', 'sito-444444444-couverture', 'sito-666666666-ravalement', 'sito-demo'] });
  const sb = supabase({ url: faux.url, cle: CLE });
  const cloudflare = clientCloudflare({ compte: cf.compte, jeton: cf.jeton, fetch: cf.fetch });
  const a = (t, s) => faux.base[t].some((l) => l.siren === s);
  const fichiers = (s) => [...faux.objets.keys()].filter((k) => k.startsWith(`photos-chantiers/${s}/`)).length;

  try {
    // Un tour, sans Stripe branché.
    let r = await supprimerEchus({ sb, cloudflare, stripe: null, maintenant: new Date('2026-11-04T12:00:00Z') });
    const de = (n) => r.find((x) => x.user_id === U(n));
    ok(r.length === 3, 'trois demandes échues et non annulées (pas l annulée, pas la future)', r.map((x) => x.user_id.slice(0, 8)).join(', '));
    ok(de(1)?.efface === true, 'compte 1 : effacé', de(1)?.motif);
    ok(!cf.projetFiche('sito-111111111-ravalement'), 'compte 1 : site retiré de Pages');
    ok(fichiers('111111111') === 0, 'compte 1 : ses 3 fichiers effacés du stockage', `${fichiers('111111111')} restent`);
    ok(faux.objets.has('banque/111111111-ne-pas-toucher.jpg'), 'la banque d images n est pas touchée');
    ok(!a('entreprises', '111111111') && !a('profils', '111111111') && !a('demandes', '111111111') && !a('sites', '111111111'), 'compte 1 : entreprise, profil, site et demandes effacés');
    ok(!faux.comptes.has(U(1)) && !faux.base.suppressions.some((x) => x.user_id === U(1)), 'compte 1 : compte et demande effacés');

    ok(faux.comptes.has(U(2)) && a('entreprises', '222222222') && fichiers('222222222') === 2 && cf.projetFiche('sito-222222222-peinture'), 'compte 2 (annulé) : intact');
    ok(faux.comptes.has(U(3)) && a('entreprises', '333333333'), 'compte 3 (pas échu) : intact');

    ok(de(4)?.efface === true && !faux.comptes.has(U(4)), 'compte 4 : effacé', de(4)?.motif);
    ok(a('entreprises', '444444444') && fichiers('444444444') === 2 && cf.projetFiche('sito-444444444-couverture') && faux.base.membres.some((m) => m.user_id === U(5)),
      'compte 4 : l entreprise a un autre membre, ses données et son site restent');

    ok(de(6)?.efface === false && /Stripe/.test(de(6)?.motif || ''), 'compte 6 (abonné, Stripe pas branché) : pas effacé, motif dit', de(6)?.motif);
    ok(faux.comptes.has(U(6)) && a('entreprises', '666666666') && fichiers('666666666') === 1 && cf.projetFiche('sito-666666666-ravalement'), 'compte 6 : rien n a bougé');
    ok(cf.projetFiche('sito-demo'), 'le projet de démonstration n est pas touché');

    // Second tour : rien de plus.
    const avant = JSON.stringify(faux.base) + faux.objets.size;
    r = await supprimerEchus({ sb, cloudflare, stripe: null, maintenant: new Date('2026-11-04T12:00:00Z') });
    ok(r.length === 1 && JSON.stringify(faux.base) + faux.objets.size === avant, 'second tour : rien ne change (seul le compte 6 attend)');

    // Stripe branché : résilié, puis effacé.
    const resilies = [];
    r = await supprimerEchus({ sb, cloudflare, stripe: { resilier: async (id) => { resilies.push(id); } }, maintenant: new Date('2026-11-04T12:00:00Z') });
    ok(resilies.join() === 'sub_actif', 'compte 6 : l abonnement en cours est résilié chez Stripe, une fois', resilies.join());
    ok(!faux.comptes.has(U(6)) && !a('entreprises', '666666666') && fichiers('666666666') === 0 && !cf.projetFiche('sito-666666666-ravalement'), 'compte 6 : puis effacé');

    // Une panne au milieu : le stockage refuse. La demande reste, et le tour
    // suivant finit.
    faux.base.suppressions.push({ user_id: U(2), effective_le: HIER, annulee_le: null });
    faux.base.suppressions = faux.base.suppressions.filter((x) => !(x.user_id === U(2) && x.annulee_le));
    let casse = true;
    const sbCasse = { ...sb, stockage: (e) => ({ ...sb.stockage(e), supprimer: async (c) => { if (casse) throw new Error('stockage indisponible'); return sb.stockage(e).supprimer(c); } }) };
    r = await supprimerEchus({ sb: sbCasse, cloudflare, maintenant: new Date('2026-11-04T12:00:00Z') });
    ok(r[0]?.efface === false && /panne/.test(r[0]?.motif || '') && faux.comptes.has(U(2)) && a('entreprises', '222222222'), 'panne du stockage : compte 2 pas effacé, motif dit, données en place', r[0]?.motif);
    casse = false;
    r = await supprimerEchus({ sb: sbCasse, cloudflare, maintenant: new Date('2026-11-04T12:00:00Z') });
    ok(r[0]?.efface === true && !faux.comptes.has(U(2)) && fichiers('222222222') === 0 && !a('entreprises', '222222222'), 'tour suivant : compte 2 effacé jusqu au bout', r[0]?.motif);
  } catch (e) {
    fautes++; console.log(`  FAUTE essai interrompu — ${e.message}`);
  } finally {
    faux.arreter();
  }
  return { fautes, essais };
}

const module = pathToFileURL(join(RACINE, 'atelier', 'supprimer-comptes.mjs')).href;
if (!process.argv.includes('--contre-essai')) {
  const { supprimerEchus } = await import(module);
  const { fautes, essais } = await scenario(supprimerEchus);
  console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
  process.exitCode = fautes ? 1 : 0;
} else {
  // Trois copies cassées, chacune hors du dépôt : l'essai doit rougir sur chacune.
  const source = readFileSync(join(RACINE, 'atelier', 'supprimer-comptes.mjs'), 'utf8')
    .replace(/from '(\.\.?\/[^']+)'/g, (_, rel) => `from '${pathToFileURL(join(RACINE, 'atelier', rel)).href}'`);
  const casses = [
    ['les demandes annulées ne sont pas écartées', (s) => s.replace(", annulee_le: ['is', 'null']", '')],
    ['le stockage n est pas vidé', (s) => s.replace('await st.supprimer(chemins.slice(i, i + 100))', 'void 0')],
    ['un abonné en cours est effacé sans Stripe', (s) => s.replace('if (abonnes.length && !stripe) {', 'if (false) {')],
  ];
  const d = mkdtempSync(join(tmpdir(), 'sito-suppressions-casse-'));
  let justes = 0;
  try {
    for (const [i, [quoi, casser]] of casses.entries()) {
      const s = casser(source);
      if (s === source) { console.log(`  FAUTE la cassure « ${quoi} » ne s applique pas`); continue; }
      const f = join(d, `casse-${i}.mjs`);
      writeFileSync(f, s);
      console.log(`\n--- copie cassée : ${quoi}`);
      const { fautes } = await scenario((await import(pathToFileURL(f).href)).supprimerEchus);
      console.log(fautes ? `  => rouge, juste` : `  => VERT : l essai n attrape pas cette cassure`);
      if (fautes) justes++;
    }
  } finally { rmSync(d, { recursive: true, force: true }); }
  console.log(`\nContre-essai : ${justes} cassure(s) sur ${casses.length} attrapée(s).`);
  process.exitCode = justes === casses.length ? 0 : 1;
}

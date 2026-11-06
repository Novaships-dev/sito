#!/usr/bin/env node
// Essai de Stripe (T16, `supabase/functions/_shared/stripe.ts`) contre un faux
// Stripe et un faux dépôt. Aucun réseau, aucune clé, aucun compte Stripe.
//
// Ce qu'il mesure (02-TRD.md X12) :
//   - un paiement simulé (checkout.session.completed) : l'abonnement est relu
//     chez Stripe et écrit « actif », avec la formule, la fin de période ;
//   - le même événement rejoué : rien n'est écrit ;
//   - une signature fausse, absente, ou trop vieille : 400, rien n'est écrit ;
//   - un type d'événement inconnu : noté, aucun accès donné ;
//   - un abonnement « incomplete » ou sans SIREN : jamais « actif » ;
//   - impayé, résiliation prévue, résilié : l'état suit Stripe, quel que soit
//     l'ordre d'arrivée des événements ;
//   - une panne de la base à l'écriture : l'événement n'est pas noté, le
//     renvoi de Stripe l'écrit ;
//   - lien de paiement (T62) : le SIREN arrive dans `client_reference_id` de
//     la session payée ; il est écrit dans l'abonnement chez Stripe, et
//     l'abonnement est rattaché à cette entreprise ; un SIREN mal formé ne
//     rattache rien ; `atelier/lien-paiement.mjs` fabrique le lien à envoyer.
//
//   node scripts/essai-stripe.mjs
//   node scripts/essai-stripe.mjs --contre-essai   (trois copies cassées)
import { createHmac } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RACINE } from './env.mjs';

const SOURCE = join(RACINE, 'supabase', 'functions', '_shared', 'stripe.ts');
const SECRET = 'whsec_essai_' + 'x'.repeat(8); // secret-ignore (valeur d'essai)
const PRIX = { mensuel: 'price_mensuel', annuel: 'price_annuel' };
const MAINTENANT = 1_800_000_000;

function fauxStripe() {
  const abonnements = new Map();
  const appels = [];
  const f = async (url, { method = 'GET', headers = {}, body } = {}) => {
    const u = new URL(url);
    appels.push({ methode: method, chemin: u.pathname, auth: headers.Authorization, champs: body ? Object.fromEntries(new URLSearchParams(body)) : null });
    const rep = (statut, j) => new Response(JSON.stringify(j), { status: statut, headers: { 'content-type': 'application/json' } });
    if (headers.Authorization !== 'Bearer sk_test_essai') return rep(401, { error: { message: 'Invalid API Key' } });
    const m = u.pathname.match(/^\/v1\/subscriptions\/(.+)$/);
    if (m && method === 'GET') return abonnements.has(m[1]) ? rep(200, abonnements.get(m[1])) : rep(404, { error: { message: 'No such subscription' } });
    if (m && method === 'DELETE') { const a = abonnements.get(m[1]); if (!a) return rep(404, {}); a.status = 'canceled'; return rep(200, a); }
    if (m && method === 'POST') {
      const a = abonnements.get(m[1]); if (!a) return rep(404, { error: { message: 'No such subscription' } });
      for (const [k, v] of new URLSearchParams(body)) { const mm = k.match(/^metadata\[(.+)\]$/); if (mm) a.metadata = { ...(a.metadata || {}), [mm[1]]: v }; }
      return rep(200, a);
    }
    return rep(404, { error: { message: 'route inconnue' } });
  };
  return { fetch: f, abonnements, appels };
}

function fauxDepot() {
  const evenements = new Map();
  const abonnements = new Map();
  let ecritures = 0, panne = false;
  return {
    evenements, abonnements, get ecritures() { return ecritures; }, set panne(v) { panne = v; },
    async dejaRecu(id) { return evenements.has(id); },
    async noterEvenement(id, type) { if (!evenements.has(id)) evenements.set(id, type); },
    async ecrireAbonnement(l) { if (panne) throw new Error('base indisponible'); ecritures++; abonnements.set(l.siren, { ...l }); },
  };
}

const signer = (corps, t = MAINTENANT, secret = SECRET) =>
  `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${corps}`).digest('hex')}`;
const evenement = (id, type, objet) => JSON.stringify({ id, type, data: { object: objet } });

async function scenario(mod) {
  let fautes = 0, essais = 0;
  const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
  const st = fauxStripe();
  const depot = fauxDepot();
  const reglages = { cle: 'sk_test_essai', secretWebhook: SECRET, prix: PRIX, api: 'https://stripe.essai', fetch: st.fetch };
  const envoyer = (corps, signature = signer(corps), t = MAINTENANT) => mod.webhook({ corps, signature, reglages, depot, maintenantS: t });
  const abo = (id, status, extra = {}) => st.abonnements.set(id, { id, status, customer: 'cus_1', metadata: { siren: '111111111' },
    current_period_end: MAINTENANT + 30 * 86400, cancel_at_period_end: false, items: { data: [{ price: { id: PRIX.mensuel } }] }, ...extra });

  try {
    // Paiement simulé.
    abo('sub_1', 'active');
    const paye = evenement('evt_1', 'checkout.session.completed', { mode: 'subscription', subscription: 'sub_1', client_reference_id: '111111111' });
    let r = await envoyer(paye);
    const a = depot.abonnements.get('111111111');
    ok(r.statut === 200 && a?.etat === 'actif' && a.formule === 'mensuel' && a.stripe_client === 'cus_1' && a.stripe_abonnement === 'sub_1', 'paiement : abonnement relu chez Stripe, écrit actif, formule mensuelle', JSON.stringify(a));
    ok(a?.fin_periode === new Date((MAINTENANT + 30 * 86400) * 1000).toISOString(), 'fin de période écrite');
    r = await envoyer(paye);
    ok(r.statut === 200 && depot.ecritures === 1, 'même événement rejoué : rien n est écrit', `${depot.ecritures} écriture(s)`);

    // Signatures.
    const autre = evenement('evt_2', 'customer.subscription.updated', { id: 'sub_1' });
    ok((await envoyer(autre, signer(autre, MAINTENANT, 'whsec_autre'))).statut === 400, 'signature d un autre secret : 400');
    ok((await envoyer(autre, null)).statut === 400, 'signature absente : 400');
    ok((await envoyer(autre, signer(autre, MAINTENANT - 600))).statut === 400, 'signature de plus de 5 minutes : 400');
    ok((await envoyer(autre.replace('sub_1', 'sub_9'), signer(autre))).statut === 400, 'corps changé après signature : 400');
    ok(depot.ecritures === 1 && !depot.evenements.has('evt_2'), 'rien d écrit ni de noté sur une signature refusée');

    // Type inconnu.
    r = await envoyer(evenement('evt_3', 'customer.created', { id: 'cus_2', metadata: { siren: '222222222' } }));
    ok(r.statut === 200 && depot.evenements.has('evt_3') && !depot.abonnements.has('222222222'), 'événement inconnu : noté, aucun accès donné');

    // Paiement inachevé, et abonnement sans SIREN.
    st.abonnements.set('sub_2', { id: 'sub_2', status: 'incomplete', customer: 'cus_2', metadata: { siren: '222222222' }, items: { data: [{ price: { id: PRIX.annuel } }] } });
    await envoyer(evenement('evt_4', 'customer.subscription.created', { id: 'sub_2' }));
    ok(!depot.abonnements.has('222222222'), 'abonnement « incomplete » : rien d écrit, jamais actif');
    st.abonnements.set('sub_3', { id: 'sub_3', status: 'active', customer: 'cus_3', metadata: {}, items: { data: [{ price: { id: PRIX.annuel } }] } });
    await envoyer(evenement('evt_5', 'customer.subscription.created', { id: 'sub_3' }));
    ok(depot.ecritures === 1, 'abonnement actif sans SIREN : rien d écrit');

    // L'état suit Stripe, quel que soit l'ordre des événements.
    abo('sub_1', 'past_due');
    await envoyer(evenement('evt_6', 'invoice.payment_failed', { subscription: 'sub_1' }));
    ok(depot.abonnements.get('111111111')?.etat === 'impaye', 'paiement échoué : impayé');
    abo('sub_1', 'active', { cancel_at_period_end: true, items: { data: [{ price: { id: PRIX.annuel } }] } });
    // Un vieil événement « created » arrive en retard : l'état relu reste le bon.
    await envoyer(evenement('evt_7', 'customer.subscription.created', { id: 'sub_1', status: 'trialing' }));
    const b = depot.abonnements.get('111111111');
    ok(b?.etat === 'actif' && b.resiliation_prevue === true && b.formule === 'annuel', 'événement en retard : l état vient de Stripe, pas de l événement', JSON.stringify(b));
    abo('sub_1', 'canceled');
    await envoyer(evenement('evt_8', 'customer.subscription.deleted', { id: 'sub_1' }));
    ok(depot.abonnements.get('111111111')?.etat === 'resilie', 'abonnement supprimé : résilié');

    // Panne de la base à l'écriture : pas noté, le renvoi écrit.
    abo('sub_1', 'active');
    const reprise = evenement('evt_9', 'customer.subscription.updated', { id: 'sub_1' });
    depot.panne = true;
    let leve = false;
    try { await envoyer(reprise); } catch { leve = true; }
    ok(leve && !depot.evenements.has('evt_9'), 'panne de la base : l événement n est pas noté (Stripe le renverra)');
    depot.panne = false;
    await envoyer(reprise);
    ok(depot.evenements.has('evt_9') && depot.abonnements.get('111111111')?.etat === 'actif', 'renvoi de Stripe : écrit');

    // Lien de paiement (T62) : l'abonnement naît sans SIREN, il arrive par la session.
    st.abonnements.set('sub_4', { id: 'sub_4', status: 'trialing', customer: 'cus_4', metadata: {}, current_period_end: MAINTENANT + 90 * 86400, items: { data: [{ price: { id: PRIX.mensuel } }] } });
    await envoyer(evenement('evt_10', 'checkout.session.completed', { mode: 'subscription', subscription: 'sub_4', client_reference_id: '444444444' }));
    const c = depot.abonnements.get('444444444');
    ok(c?.etat === 'essai' && c.formule === 'mensuel' && c.stripe_abonnement === 'sub_4', 'lien de paiement : rattaché à l entreprise du client_reference_id, en période offerte', JSON.stringify(c));
    ok(st.abonnements.get('sub_4').metadata?.siren === '444444444', 'le SIREN est écrit dans l abonnement chez Stripe (les événements suivants le lisent)');
    st.abonnements.get('sub_4').status = 'active';
    await envoyer(evenement('evt_11', 'invoice.paid', { subscription: 'sub_4' }));
    ok(depot.abonnements.get('444444444')?.etat === 'actif', 'premier paiement après les jours offerts : actif, sans client_reference_id');
    st.abonnements.set('sub_5', { id: 'sub_5', status: 'active', customer: 'cus_5', metadata: {}, items: { data: [{ price: { id: PRIX.annuel } }] } });
    const avant = depot.ecritures;
    await envoyer(evenement('evt_12', 'checkout.session.completed', { mode: 'subscription', subscription: 'sub_5', client_reference_id: '12345' }));
    ok(depot.ecritures === avant && !st.abonnements.get('sub_5').metadata?.siren, 'SIREN mal formé : rien n est rattaché');

    await mod.resilier('sub_1', reglages);
    ok(st.abonnements.get('sub_1').status === 'canceled', 'résilier (suppression d un compte) : l abonnement est arrêté chez Stripe');
    ok(st.appels.every((x) => x.auth === 'Bearer sk_test_essai'), 'chaque appel à Stripe porte la clé');
  } catch (e) {
    fautes++; console.log(`  FAUTE essai interrompu — ${e.message}`);
  }
  return { fautes, essais };
}

// Le lien à envoyer à l'artisan (T62, atelier/lien-paiement.mjs).
async function liens() {
  let fautes = 0, essais = 0;
  const ok = (cond, quoi, detail = '') => { essais++; if (cond) console.log(`  ok    ${quoi}`); else { fautes++; console.log(`  FAUTE ${quoi}${detail ? ` — ${detail}` : ''}`); } return cond; };
  const { lien } = await import(pathToFileURL(join(RACINE, 'atelier', 'lien-paiement.mjs')).href);
  const env = { STRIPE_LIEN_MENSUEL: 'https://buy.stripe.com/test_mois', STRIPE_LIEN_VITRINE: 'https://buy.stripe.com/test_vitrine', STRIPE_LIEN_ANNUEL: 'https://buy.stripe.com/test_an' };
  const refus = (args) => { try { lien({ env, ...args }); return null; } catch (e) { return e.message; } };
  console.log('\nLien de paiement');
  const m = lien({ siren: '480 423 623', formule: 'mensuel', courriel: ' Artisan@Exemple.FR ', env });
  const u = new URL(m.url);
  ok(u.origin + u.pathname === env.STRIPE_LIEN_MENSUEL && u.searchParams.get('client_reference_id') === '480423623', 'le SIREN (espaces retirés) part dans client_reference_id', m.url);
  ok(u.searchParams.get('prefilled_email') === 'artisan@exemple.fr', 'l adresse de l artisan est préremplie, en minuscules');
  ok(/80\s€ par mois/.test(m.dit) && /1 mois offert/.test(m.dit) && /12 mois/.test(m.dit), 'ce qui est dit vient de l offre (80 €, 1 mois offert, 12 mois)', m.dit);
  ok(/3 mois offerts/.test(lien({ siren: '480423623', formule: 'vitrine', env }).dit) && /720\s€ par an/.test(lien({ siren: '480423623', formule: 'annuel', env }).dit), 'vitrine : 3 mois offerts ; annuel : 720 € par an');
  ok(/neuf chiffres/.test(refus({ siren: '1234', formule: 'mensuel' }) || ''), 'SIREN mal formé : refusé');
  ok(/inconnue/.test(refus({ siren: '480423623', formule: 'gratuit' }) || ''), 'formule inconnue : refusée');
  ok(/manque dans \.env/.test(refus({ siren: '480423623', formule: 'mensuel', env: {} }) || '') , 'lien pas encore fait chez Stripe : dit, avec l action F7');
  ok(/pas un lien de paiement Stripe/.test(refus({ siren: '480423623', formule: 'mensuel', env: { STRIPE_LIEN_MENSUEL: 'https://exemple.fr/payer' } }) || ''), 'adresse qui n est pas un lien Stripe : refusée');
  return { fautes, essais };
}

if (!process.argv.includes('--contre-essai')) {
  const a = await scenario(await import(pathToFileURL(SOURCE).href));
  const b = await liens();
  const fautes = a.fautes + b.fautes, essais = a.essais + b.essais;
  console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
  process.exitCode = fautes ? 1 : 0;
} else {
  const source = readFileSync(SOURCE, 'utf8');
  const casses = [
    ['la signature n est pas vérifiée', (s) => s.replace("return { statut: 400, corps: 'signature refusée' };", '{ /* casse */ }')],
    ['un rejeu réécrit', (s) => s.replace("if (await depot.dejaRecu(ev.id)) return { statut: 200, corps: 'déjà reçu' };", '')],
    ['le SIREN de la session n est pas écrit dans l abonnement', (s) => s.replace("abonnement = await stripe.appel('POST', chemin, { 'metadata[siren]': ref });", '{ /* casse */ }')],
    ['un statut inachevé donne actif', (s) => s.replace("trialing: 'essai', active: 'actif',", "trialing: 'essai', active: 'actif', incomplete: 'actif',")],
  ];
  const d = mkdtempSync(join(tmpdir(), 'sito-stripe-casse-'));
  let justes = 0;
  try {
    for (const [i, [quoi, casser]] of casses.entries()) {
      const s = casser(source);
      if (s === source) { console.log(`  FAUTE la cassure « ${quoi} » ne s applique pas`); continue; }
      const f = join(d, `casse-${i}.ts`);
      writeFileSync(f, s);
      console.log(`\n--- copie cassée : ${quoi}`);
      const { fautes } = await scenario(await import(pathToFileURL(f).href));
      console.log(fautes ? '  => rouge, juste' : '  => VERT : l essai n attrape pas cette cassure');
      if (fautes) justes++;
    }
  } finally { rmSync(d, { recursive: true, force: true }); }
  console.log(`\nContre-essai : ${justes} cassure(s) sur ${casses.length} attrapée(s).`);
  process.exitCode = justes === casses.length ? 0 : 1;
}

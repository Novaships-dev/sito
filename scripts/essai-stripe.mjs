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
//   - l'ouverture du paiement et du portail envoie ce qu'il faut à Stripe.
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
    if (u.pathname === '/v1/checkout/sessions' && method === 'POST') return rep(200, { id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' });
    if (u.pathname === '/v1/billing_portal/sessions' && method === 'POST') return rep(200, { id: 'bps_1', url: 'https://billing.stripe.com/p/bps_1' });
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

    // Ouverture du paiement et du portail.
    const url = await mod.ouvrirPaiement({ siren: '333333333', formule: 'annuel', courriel: 'a@b.fr', retour: 'https://app.sito.example/abonnement', reglages });
    const s = st.appels.find((x) => x.chemin === '/v1/checkout/sessions')?.champs || {};
    ok(url.startsWith('https://checkout.stripe.com/') && s.mode === 'subscription' && s['line_items[0][price]'] === PRIX.annuel
      && s['subscription_data[metadata][siren]'] === '333333333' && s.client_reference_id === '333333333', 'paiement ouvert : formule, SIREN dans l abonnement', JSON.stringify(s));
    let refus = false;
    try { await mod.ouvrirPaiement({ siren: '333333333', formule: 'gratuit', retour: 'x', reglages }); } catch { refus = true; }
    ok(refus, 'formule inconnue : refusée');
    const portail = await mod.ouvrirPortail({ stripeClient: 'cus_1', retour: 'https://app.sito.example/abonnement', reglages });
    ok(portail.startsWith('https://billing.stripe.com/'), 'portail ouvert');
    refus = false;
    try { await mod.ouvrirPortail({ stripeClient: null, retour: 'x', reglages }); } catch { refus = true; }
    ok(refus, 'portail sans abonnement : refusé');
    await mod.resilier('sub_1', reglages);
    ok(st.abonnements.get('sub_1').status === 'canceled', 'résilier (suppression d un compte) : l abonnement est arrêté chez Stripe');
    ok(st.appels.every((x) => x.auth === 'Bearer sk_test_essai'), 'chaque appel à Stripe porte la clé');
  } catch (e) {
    fautes++; console.log(`  FAUTE essai interrompu — ${e.message}`);
  }
  return { fautes, essais };
}

if (!process.argv.includes('--contre-essai')) {
  const { fautes, essais } = await scenario(await import(pathToFileURL(SOURCE).href));
  console.log(`\n${essais} contrôles, ${fautes} faute(s).`);
  process.exitCode = fautes ? 1 : 0;
} else {
  const source = readFileSync(SOURCE, 'utf8');
  const casses = [
    ['la signature n est pas vérifiée', (s) => s.replace("return { statut: 400, corps: 'signature refusée' };", '{ /* casse */ }')],
    ['un rejeu réécrit', (s) => s.replace("if (await depot.dejaRecu(ev.id)) return { statut: 200, corps: 'déjà reçu' };", '')],
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

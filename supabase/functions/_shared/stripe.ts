// Stripe pour Sitô (T16) : la logique, sans Deno ni réseau, pour que
// `scripts/essai-stripe.mjs` l'essaie sous Node contre un faux Stripe.
// Branchée par deux fonctions Edge : `stripe-webhook` (Stripe nous écrit) et
// `stripe-session` (l'artisan connecté ouvre le paiement ou son portail).
//
// Décision de Fabrice du 29 oct. 2026 : « Stripe on va attendre qu'elle
// fonctionne ». Ce code n'ouvre aucun compte : il attend les clés de test
// (action F7) et n'est pas déployé avant.
//
// Règles tenues ici (02-TRD.md X12, 05-SCHEMA-BACKEND.md 3.16 et 3.17) :
//   - signature vérifiée (HMAC-SHA256 de « t.corps », en-tête Stripe-Signature,
//     5 minutes de tolérance, comparaison à temps constant) ; sinon 400, rien
//     n'est lu ;
//   - un événement déjà reçu (même id) n'écrit rien ;
//   - l'état de l'abonnement n'est jamais lu dans l'événement : il est relu
//     chez Stripe (`GET /v1/subscriptions/<id>`), ce qui rend l'ordre
//     d'arrivée sans effet ;
//   - un statut inconnu ou un paiement inachevé ne donne jamais « actif » ;
//   - une seule fonction écrit `abonnements` : `Depot.ecrireAbonnement`.

export type Etat = 'essai' | 'actif' | 'impaye' | 'resilie';
export type Formule = 'mensuel' | 'annuel';

export interface LigneAbonnement {
  siren: string;
  formule: Formule | null;
  etat: Etat;
  stripe_client: string;
  stripe_abonnement: string;
  fin_periode: string | null;
  resiliation_prevue: boolean;
}

export interface Depot {
  dejaRecu(id: string): Promise<boolean>;
  // Note l'événement (un rejeu concurrent ne lève rien : ignore-duplicates).
  noterEvenement(id: string, type: string): Promise<void>;
  ecrireAbonnement(ligne: LigneAbonnement): Promise<void>;
}

export interface Reglages {
  cle: string;                 // STRIPE_CLE_SECRETE
  secretWebhook: string;       // STRIPE_SECRET_WEBHOOK
  prix: Record<Formule, string>; // STRIPE_PRIX_MENSUEL, STRIPE_PRIX_ANNUEL
  api?: string;
  fetch?: typeof fetch;
}

const API = 'https://api.stripe.com';
const TOLERANCE_S = 300;

// ------------------------------------------------------------------ signature
async function hmac(secret: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(message));
  return [...new Uint8Array(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function egaux(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function signatureValide(corps: string, entete: string | null, secret: string, maintenantS = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!entete || !secret) return false;
  const parts = entete.split(',').map((p) => p.trim().split('='));
  const t = Number(parts.find(([k]) => k === 't')?.[1]);
  const v1 = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!Number.isFinite(t) || !v1.length || Math.abs(maintenantS - t) > TOLERANCE_S) return false;
  const attendu = await hmac(secret, `${t}.${corps}`);
  return v1.some((v) => egaux(v, attendu));
}

// ------------------------------------------------------------------ Stripe
function client(r: Reglages) {
  const aller = r.fetch || fetch;
  const base = r.api || API;
  async function appel(methode: string, chemin: string, champs?: Record<string, string>) {
    const res = await aller(base + chemin, {
      method: methode,
      headers: { Authorization: `Bearer ${r.cle}`, ...(champs ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
      body: champs ? new URLSearchParams(champs).toString() : undefined,
    });
    const j = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`Stripe ${methode} ${chemin} : ${res.status} ${j?.error?.message || ''}`.trim());
    return j;
  }
  return { appel };
}

// Le statut de Stripe, traduit. Ce qui n'est pas dans la table ne donne rien.
const ETATS: Record<string, Etat> = {
  trialing: 'essai', active: 'actif', past_due: 'impaye', unpaid: 'impaye',
  canceled: 'resilie', incomplete_expired: 'resilie',
};

export function ligneDepuis(abonnement: any, prix: Record<Formule, string>): LigneAbonnement | null {
  const etat = ETATS[abonnement?.status];
  const siren = abonnement?.metadata?.siren;
  if (!etat || !/^\d{9}$/.test(siren || '')) return null;
  const idPrix = abonnement.items?.data?.[0]?.price?.id;
  const formule = (Object.keys(prix) as Formule[]).find((f) => prix[f] === idPrix) || null;
  const fin = abonnement.current_period_end ?? abonnement.items?.data?.[0]?.current_period_end;
  return {
    siren, formule, etat,
    stripe_client: typeof abonnement.customer === 'string' ? abonnement.customer : abonnement.customer?.id,
    stripe_abonnement: abonnement.id,
    fin_periode: fin ? new Date(fin * 1000).toISOString() : null,
    resiliation_prevue: !!abonnement.cancel_at_period_end,
  };
}

// Les événements qui disent qu'un abonnement a pu changer, et où lire son id.
const ABONNEMENT_DE: Record<string, (o: any) => string | undefined> = {
  'checkout.session.completed': (o) => (o.mode === 'subscription' ? o.subscription : undefined),
  'customer.subscription.created': (o) => o.id,
  'customer.subscription.updated': (o) => o.id,
  'customer.subscription.deleted': (o) => o.id,
  'customer.subscription.paused': (o) => o.id,
  'customer.subscription.resumed': (o) => o.id,
  'invoice.paid': (o) => o.subscription ?? o.parent?.subscription_details?.subscription,
  'invoice.payment_failed': (o) => o.subscription ?? o.parent?.subscription_details?.subscription,
};

export interface Reponse { statut: number; corps: string }

export async function webhook({ corps, signature, reglages, depot, maintenantS }:
  { corps: string; signature: string | null; reglages: Reglages; depot: Depot; maintenantS?: number }): Promise<Reponse> {
  if (!(await signatureValide(corps, signature, reglages.secretWebhook, maintenantS))) return { statut: 400, corps: 'signature refusée' };
  let ev: any;
  try { ev = JSON.parse(corps); } catch { return { statut: 400, corps: 'corps illisible' }; }
  if (typeof ev?.id !== 'string' || typeof ev?.type !== 'string') return { statut: 400, corps: 'événement incomplet' };

  if (await depot.dejaRecu(ev.id)) return { statut: 200, corps: 'déjà reçu' };
  const lire = ABONNEMENT_DE[ev.type];
  const idAbonnement = lire ? lire(ev.data?.object || {}) : undefined;
  let dit = 'ignoré';
  if (idAbonnement) {
    // Relu chez Stripe : l'événement ne fait que prévenir.
    const abonnement = await client(reglages).appel('GET', `/v1/subscriptions/${encodeURIComponent(idAbonnement)}`);
    const ligne = ligneDepuis(abonnement, reglages.prix);
    if (ligne) await depot.ecrireAbonnement(ligne);
    dit = ligne ? `abonnement ${ligne.etat}` : 'statut sans effet';
  }
  // Noté APRÈS l'écriture : une panne avant laisse Stripe renvoyer l'événement,
  // qui sera alors traité ; une fois noté, il n'écrit plus rien.
  await depot.noterEvenement(ev.id, ev.type);
  return { statut: 200, corps: dit };
}

// ------------------------------------------------------------------ sessions
// L'artisan (membre de l'entreprise, vérifié par la fonction Edge) ouvre le
// paiement ou son portail. Rend l'adresse vers laquelle l'envoyer.
export async function ouvrirPaiement({ siren, formule, courriel, retour, reglages }:
  { siren: string; formule: Formule; courriel?: string; retour: string; reglages: Reglages }): Promise<string> {
  if (!/^\d{9}$/.test(siren)) throw new Error('SIREN invalide');
  const prix = reglages.prix[formule];
  if (!prix) throw new Error(`formule inconnue : ${formule}`);
  const champs: Record<string, string> = {
    mode: 'subscription',
    client_reference_id: siren,
    'line_items[0][price]': prix,
    'line_items[0][quantity]': '1',
    'subscription_data[metadata][siren]': siren,
    success_url: `${retour}?paiement=ok`,
    cancel_url: `${retour}?paiement=annule`,
    locale: 'fr',
  };
  if (courriel) champs.customer_email = courriel;
  const s = await client(reglages).appel('POST', '/v1/checkout/sessions', champs);
  if (!s?.url) throw new Error('Stripe n a pas rendu d adresse de paiement');
  return s.url;
}

export async function ouvrirPortail({ stripeClient, retour, reglages }:
  { stripeClient: string | null; retour: string; reglages: Reglages }): Promise<string> {
  if (!stripeClient) throw new Error('aucun abonnement Stripe pour cette entreprise');
  const s = await client(reglages).appel('POST', '/v1/billing_portal/sessions', { customer: stripeClient, return_url: retour });
  if (!s?.url) throw new Error('Stripe n a pas rendu d adresse de portail');
  return s.url;
}

// Résilier (suppression d'un compte, T12) : fin immédiate.
export async function resilier(idAbonnement: string, reglages: Reglages): Promise<void> {
  await client(reglages).appel('DELETE', `/v1/subscriptions/${encodeURIComponent(idAbonnement)}`);
}

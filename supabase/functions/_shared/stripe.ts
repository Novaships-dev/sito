// Stripe pour Sitô (T16) : la logique, sans Deno ni réseau, pour que
// `scripts/essai-stripe.mjs` l'essaie sous Node contre un faux Stripe.
// Branchée par la fonction Edge `stripe-webhook` (Stripe nous écrit).
//
// Paiement simple (T62, décision de Fabrice du 5 nov. 2026 : « trouver un
// moyen simple pour encaisser des one shot ou du mensuel ») : trois liens de
// paiement Stripe, faits une fois dans le tableau de bord (80 € par mois avec
// 30 jours offerts ; le même avec 90 jours pour les artisans vitrines ; 720 €
// par an). Fabrice envoie à l'artisan le lien suivi de son SIREN
// (`atelier/lien-paiement.mjs`) : Stripe le rend dans `client_reference_id`,
// et ce code l'écrit dans l'abonnement, où les événements suivants le lisent.
// Plus de page de paiement ni de portail dans l'app.
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
  'checkout.session.completed': (o) => (o.mode === 'subscription' ? (typeof o.subscription === 'string' ? o.subscription : o.subscription?.id) : undefined),
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
    const stripe = client(reglages);
    const chemin = `/v1/subscriptions/${encodeURIComponent(idAbonnement)}`;
    // Relu chez Stripe : l'événement ne fait que prévenir.
    let abonnement = await stripe.appel('GET', chemin);
    // Un lien de paiement ne sait pas à quelle entreprise il sert : le SIREN
    // arrive dans `client_reference_id` de la session payée. On l'écrit dans
    // l'abonnement (une fois), pour que les événements suivants le lisent.
    const ref = ev.type === 'checkout.session.completed' ? ev.data?.object?.client_reference_id : undefined;
    if (/^\d{9}$/.test(ref || '') && !abonnement?.metadata?.siren)
      abonnement = await stripe.appel('POST', chemin, { 'metadata[siren]': ref });
    const ligne = ligneDepuis(abonnement, reglages.prix);
    if (ligne) await depot.ecrireAbonnement(ligne);
    dit = ligne ? `abonnement ${ligne.etat}` : 'statut sans effet';
  }
  // Noté APRÈS l'écriture : une panne avant laisse Stripe renvoyer l'événement,
  // qui sera alors traité ; une fois noté, il n'écrit plus rien.
  await depot.noterEvenement(ev.id, ev.type);
  return { statut: 200, corps: dit };
}

// Résilier (suppression d'un compte, T12) : fin immédiate.
export async function resilier(idAbonnement: string, reglages: Reglages): Promise<void> {
  await client(reglages).appel('DELETE', `/v1/subscriptions/${encodeURIComponent(idAbonnement)}`);
}

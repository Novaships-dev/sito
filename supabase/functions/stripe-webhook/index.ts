// Fonction Edge « stripe-webhook » (T16, T62) : Stripe y envoie ses événements,
// dont le paiement d'un lien (le SIREN arrive dans `client_reference_id`).
// Déployée sans contrôle de jeton de session (`verify_jwt` faux) : c'est la
// signature Stripe qui authentifie (logique dans ../_shared/stripe.ts).
// Secrets de la fonction (posés par Fabrice, action F7) : STRIPE_CLE_SECRETE,
// STRIPE_SECRET_WEBHOOK, STRIPE_PRIX_MENSUEL, STRIPE_PRIX_ANNUEL.
// La clé de service est donnée par Supabase (SUPABASE_SERVICE_ROLE_KEY).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { webhook, type Depot, type Reglages } from '../_shared/stripe.ts';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const reglages: Reglages = {
  cle: Deno.env.get('STRIPE_CLE_SECRETE') || '',
  secretWebhook: Deno.env.get('STRIPE_SECRET_WEBHOOK') || '',
  prix: { mensuel: Deno.env.get('STRIPE_PRIX_MENSUEL') || '', annuel: Deno.env.get('STRIPE_PRIX_ANNUEL') || '' },
};

const depot: Depot = {
  async dejaRecu(id) {
    const { data, error } = await sb.from('evenements_stripe').select('id').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return !!data;
  },
  async noterEvenement(id, type) {
    const { error } = await sb.from('evenements_stripe').upsert({ id, type }, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  },
  // La seule écriture de `abonnements` (05-SCHEMA-BACKEND.md 3.16).
  async ecrireAbonnement(ligne) {
    const { error } = await sb.from('abonnements').upsert(ligne, { onConflict: 'siren' });
    if (error) throw new Error(error.message);
  },
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST seulement', { status: 405 });
  try {
    // Le corps brut : la signature porte sur les octets reçus, pas sur un JSON relu.
    const r = await webhook({ corps: await req.text(), signature: req.headers.get('stripe-signature'), reglages, depot });
    return new Response(r.corps, { status: r.statut });
  } catch (e) {
    // 500 : Stripe renverra l'événement plus tard.
    console.error('stripe-webhook :', e instanceof Error ? e.message : e);
    return new Response('erreur', { status: 500 });
  }
});

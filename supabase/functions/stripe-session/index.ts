// Fonction Edge « stripe-session » (T16) : l'artisan connecté ouvre le
// paiement de sa formule ou le portail Stripe (changer de carte, résilier).
// Déployée AVEC contrôle du jeton de session : seul un membre de l'entreprise
// passe (T17).
// Corps : { siren, action: 'paiement' | 'portail', formule?, retour }.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { ouvrirPaiement, ouvrirPortail, type Formule, type Reglages } from '../_shared/stripe.ts';

const URL_SB = Deno.env.get('SUPABASE_URL')!;
const service = createClient(URL_SB, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const reglages: Reglages = {
  cle: Deno.env.get('STRIPE_CLE_SECRETE') || '',
  secretWebhook: '',
  prix: { mensuel: Deno.env.get('STRIPE_PRIX_MENSUEL') || '', annuel: Deno.env.get('STRIPE_PRIX_ANNUEL') || '' },
};
// Les adresses de retour autorisées : celles de l'app, rien d'autre.
const RETOURS = (Deno.env.get('SITO_RETOURS_PAIEMENT') || '').split(',').map((s) => s.trim()).filter(Boolean);

const ENTETES = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};
const repondre = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: ENTETES });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: ENTETES });
  if (req.method !== 'POST') return repondre(405, { ok: false, erreur: 'POST seulement.' });
  try {
    const jeton = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: qui } = await service.auth.getUser(jeton);
    if (!qui?.user) return repondre(401, { ok: false, erreur: 'Connectez-vous.' });
    const { siren, action, formule, retour } = await req.json().catch(() => ({}));
    if (!RETOURS.some((r) => typeof retour === 'string' && retour.startsWith(r))) return repondre(400, { ok: false, erreur: 'Adresse de retour refusée.' });
    const { data: membre } = await service.from('membres').select('siren').eq('user_id', qui.user.id).eq('siren', siren).maybeSingle();
    if (!membre) return repondre(403, { ok: false, erreur: 'Cette entreprise n’est pas la vôtre.' });
    if (action === 'portail') {
      const { data: ab } = await service.from('abonnements').select('stripe_client').eq('siren', siren).maybeSingle();
      return repondre(200, { ok: true, url: await ouvrirPortail({ stripeClient: ab?.stripe_client ?? null, retour, reglages }) });
    }
    if (action === 'paiement') {
      return repondre(200, { ok: true, url: await ouvrirPaiement({ siren, formule: formule as Formule, courriel: qui.user.email, retour, reglages }) });
    }
    return repondre(400, { ok: false, erreur: 'Action inconnue.' });
  } catch (e) {
    console.error('stripe-session :', e instanceof Error ? e.message : e);
    return repondre(500, { ok: false, erreur: 'Le paiement ne répond pas. Réessayez dans un moment.' });
  }
});

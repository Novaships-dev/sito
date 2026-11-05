// Fonction Edge « google-lien » (T24) : l'artisan connecté demande l'adresse
// du consentement Google pour relier sa fiche. Déployée AVEC contrôle du jeton
// de session ; seul un membre de l'entreprise passe.
// Corps : { siren, retour }, où `retour` : l'écran de l'app où revenir, parmi
// les adresses permises (SITO_RETOURS_PAIEMENT, les mêmes que le paiement).
// L'« état » envoyé à Google est signé (15 minutes) : le retour ne peut relier
// la fiche qu'à cette entreprise.
//
// Secrets : GOOGLE_CLIENT_ID, GOOGLE_CLE_CHIFFREMENT, SITO_RETOUR_GOOGLE
// (l'adresse de la fonction `google-retour`, déclarée chez Google).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { lienConsentement } from '../_shared/google.mjs';
import { signer } from '../_shared/chiffre.mjs';

const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const env = (n: string) => Deno.env.get(n) || '';
const RETOURS = env('SITO_RETOURS_PAIEMENT').split(',').map((s) => s.trim()).filter(Boolean);
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
    const { siren, retour } = await req.json().catch(() => ({}));
    if (!RETOURS.some((r) => typeof retour === 'string' && retour.startsWith(r))) return repondre(400, { ok: false, erreur: 'Adresse de retour refusée.' });
    const { data: membre } = await service.from('membres').select('siren').eq('user_id', qui.user.id).eq('siren', siren).maybeSingle();
    if (!membre) return repondre(403, { ok: false, erreur: 'Cette entreprise n’est pas la vôtre.' });
    if (!env('GOOGLE_CLIENT_ID') || !env('GOOGLE_CLE_CHIFFREMENT') || !env('SITO_RETOUR_GOOGLE'))
      return repondre(503, { ok: false, erreur: 'La liaison avec Google n’est pas encore ouverte.' });
    const etat = await signer({ siren, user: qui.user.id, retour }, env('GOOGLE_CLE_CHIFFREMENT'));
    return repondre(200, { ok: true, url: lienConsentement({ clientId: env('GOOGLE_CLIENT_ID'), redirection: env('SITO_RETOUR_GOOGLE'), etat }) });
  } catch (e) {
    console.error('google-lien :', e instanceof Error ? e.message : e);
    return repondre(500, { ok: false, erreur: 'Google ne répond pas. Réessayez dans un moment.' });
  }
});

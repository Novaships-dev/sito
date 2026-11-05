// Fonction Edge « domaines » (T20) : l'écran Mon adresse cherche, réserve ou
// branche un domaine, et en demande l'état. Déployée AVEC contrôle du jeton de
// session : seul un membre de l'entreprise passe. La logique est dans
// `_shared/domaines.mjs` (essayée par `scripts/essai-domaines.mjs`) ; ici,
// seulement qui appelle, ce qu'on lit dans la base, et les clés.
// Corps : { siren, action: 'chercher' | 'acheter' | 'brancher' | 'verifier', nom, representant? }.
//
// Secrets (Supabase > Edge Functions > Secrets) : GANDI_JETON,
// GANDI_BAC_A_SABLE (« false » pour le réel, rien d'autre), CLOUDFLARE_ZONE_ID,
// CLOUDFLARE_JETON_API, SITO_CIBLE_CNAME (l'hôte de la zone de Sitô vers
// lequel pointe `www`). Sans eux, la fonction répond 503 et le dit.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { traiter } from '../_shared/domaines.mjs';
import { clientGandi } from '../_shared/gandi.mjs';
import { clientSaas } from '../_shared/cloudflare-saas.mjs';

const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const env = (n: string) => Deno.env.get(n) || '';

const ENTETES = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};
const repondre = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: ENTETES });

// Le dépôt de `traiter`, sur la table `adresses` (clé de service : l'app ne
// l'écrit pas, 05-SCHEMA §3.9).
const depot = {
  async adresses(siteId: string) {
    const { data, error } = await service.from('adresses').select('hote, genre, principale, etat, motif, cloudflare_id').eq('site_id', siteId);
    if (error) throw new Error(error.message);
    return data;
  },
  async hoteAilleurs(hote: string, siteId: string) {
    const { data, error } = await service.from('adresses').select('site_id').eq('hote', hote).neq('site_id', siteId).neq('etat', 'retiree').limit(1);
    if (error) throw new Error(error.message);
    return (data || []).length > 0;
  },
  async ajouter(ligne: Record<string, unknown>) {
    const { error } = await service.from('adresses').insert(ligne);
    if (error) throw new Error(error.message);
  },
  async maj(siteId: string, hote: string, colonnes: Record<string, unknown>) {
    const { error } = await service.from('adresses').update(colonnes).eq('site_id', siteId).eq('hote', hote);
    if (error) throw new Error(error.message);
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: ENTETES });
  if (req.method !== 'POST') return repondre(405, { ok: false, erreur: 'POST seulement.' });
  try {
    const jeton = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: qui } = await service.auth.getUser(jeton);
    if (!qui?.user) return repondre(401, { ok: false, erreur: 'Connectez-vous.' });
    const { siren, action, nom, representant } = await req.json().catch(() => ({}));
    const { data: membre } = await service.from('membres').select('siren').eq('user_id', qui.user.id).eq('siren', siren).maybeSingle();
    if (!membre) return repondre(403, { ok: false, erreur: 'Cette entreprise n’est pas la vôtre.' });

    if (!env('GANDI_JETON') || !env('CLOUDFLARE_ZONE_ID') || !env('CLOUDFLARE_JETON_API') || !env('SITO_CIBLE_CNAME'))
      return repondre(503, { ok: false, erreur: 'Les domaines ne sont pas encore ouverts. Écrivez-nous le nom voulu : nous nous en occupons.' });

    const [site, abonnement, entreprise, profil] = await Promise.all([
      service.from('sites').select('id').eq('siren', siren).order('cree_le', { ascending: true }).limit(1).maybeSingle(),
      service.from('abonnements').select('etat').eq('siren', siren).maybeSingle(),
      service.from('entreprises').select('siren, denomination, forme_juridique, adresse, code_postal, commune').eq('siren', siren).maybeSingle(),
      service.from('profils').select('telephone, courriel').eq('siren', siren).maybeSingle(),
    ]);
    const r = await traiter({
      action, nom, representant,
      ctx: { userId: qui.user.id, courriel: qui.user.email, site: site.data, abonnement: abonnement.data, entreprise: entreprise.data, profil: profil.data },
      depot,
      gandi: clientGandi({ jeton: env('GANDI_JETON'), bacASable: env('GANDI_BAC_A_SABLE') !== 'false' }),
      saas: clientSaas({ zone: env('CLOUDFLARE_ZONE_ID'), jeton: env('CLOUDFLARE_JETON_API') }),
      reglages: { cible: env('SITO_CIBLE_CNAME') },
    });
    const { statut, ...corps } = r as { statut?: number };
    return repondre(r.ok ? 200 : (statut || 400), corps);
  } catch (e) {
    console.error('domaines :', e instanceof Error ? e.message : e);
    return repondre(500, { ok: false, erreur: 'Le service des domaines ne répond pas. Réessayez dans un moment.' });
  }
});

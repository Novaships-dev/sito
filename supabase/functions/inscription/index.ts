// Fonction Edge « inscription » (Supabase, offre gratuite) : branche la
// logique (logique.ts) sur la base et sur les comptes. La clé de service est
// donnée par Supabase à la fonction (SUPABASE_SERVICE_ROLE_KEY) : personne ne
// la pose, elle ne quitte jamais Supabase. Déployée sans contrôle de jeton de
// session (`verify_jwt` faux) : l'artisan n'a pas encore de compte, le jeton
// d'invitation (256 bits, un seul usage, 14 jours) fait office de clé.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { traiter, type Depot, type Invitation } from './logique.ts';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const depot: Depot = {
  async lire(jeton) {
    const { data, error } = await sb.from('invitations')
      .select('siren, genre, user_id, expire_le, utilisee_le, entreprises(nom_affiche)').eq('jeton', jeton).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const { entreprises, ...inv } = data as unknown as Omit<Invitation, 'nom_affiche'> & { entreprises: { nom_affiche: string } };
    return { ...inv, nom_affiche: entreprises.nom_affiche };
  },
  async reserver(jeton) {
    const { data, error } = await sb.from('invitations').update({ utilisee_le: new Date().toISOString() })
      .eq('jeton', jeton).is('utilisee_le', null).select('jeton');
    if (error) throw new Error(error.message);
    return (data || []).length === 1;
  },
  async liberer(jeton) {
    await sb.from('invitations').update({ utilisee_le: null }).eq('jeton', jeton);
  },
  async creerCompte(courriel, mdp) {
    const { data, error } = await sb.auth.admin.createUser({ email: courriel, password: mdp, email_confirm: true });
    if (error) {
      if (error.code === 'email_exists' || /already been registered/i.test(error.message)) return { existe: true };
      throw new Error(error.message);
    }
    return { id: data.user.id };
  },
  async changerMotDePasse(userId, mdp) {
    const { data, error } = await sb.auth.admin.updateUserById(userId, { password: mdp });
    if (error) throw new Error(error.message);
    return { courriel: data.user.email || '' };
  },
  async courrielDe(userId) {
    const { data } = await sb.auth.admin.getUserById(userId);
    return data.user?.email || null;
  },
  async rattacher(userId, siren, jeton) {
    const m = await sb.from('membres').insert({ user_id: userId, siren, role: 'titulaire' });
    if (m.error) {
      // Un compte sans entreprise ne servirait à rien : il est retiré.
      await sb.auth.admin.deleteUser(userId);
      throw new Error(m.error.message);
    }
    await sb.from('invitations').update({ user_id: userId }).eq('jeton', jeton);
  },
};

// L'app est servie depuis une autre adresse que Supabase.
const ENTETES = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: ENTETES });
  if (req.method !== 'POST') return new Response(JSON.stringify({ ok: false, erreur: 'POST seulement.' }), { status: 405, headers: ENTETES });
  try {
    const corps = await req.json().catch(() => null);
    const r = await traiter(corps, depot);
    return new Response(JSON.stringify(r.corps), { status: r.statut, headers: ENTETES });
  } catch (e) {
    console.error('inscription :', e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ ok: false, erreur: 'Sitô ne répond pas. Réessayez dans un moment.' }), { status: 500, headers: ENTETES });
  }
});

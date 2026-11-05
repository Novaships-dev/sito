// Fonction Edge « google-retour » (T24) : Google y renvoie l'artisan après
// son accord, avec `code` et `state`. Déployée SANS contrôle du jeton de
// session (Google ne le porte pas) : c'est l'état signé par `google-lien`
// (15 minutes, entreprise et compte dedans) qui authentifie. Le code devient
// un jeton, chiffré (`_shared/chiffre.mjs`) avant d'être rangé ; puis
// l'artisan revient sur l'écran de l'app, avec `google=ok` ou `google=erreur`.
//
// Secrets : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CLE_CHIFFREMENT,
// SITO_RETOUR_GOOGLE (l'adresse de cette fonction, identique chez Google).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { clientGoogle } from '../_shared/google.mjs';
import { lireSigne } from '../_shared/chiffre.mjs';
import { relier } from '../_shared/avis-google.mjs';

const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const env = (n: string) => Deno.env.get(n) || '';

const page = (texte: string) => new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sitô</title><body style="font:18px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem"><p>${texte}</p></body></html>`,
  { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
const revenir = (retour: string, resultat: 'ok' | 'erreur') => Response.redirect(`${retour}${retour.includes('?') ? '&' : '?'}google=${resultat}`, 302);

const depot = {
  async poserJeton(siren: string, chiffre: string, portee: string) {
    const { error } = await service.rpc('poser_jeton_google', { p_siren: siren, p_jeton: chiffre, p_portee: portee });
    if (error) throw new Error(error.message);
  },
  async connexion(siren: string, colonnes: Record<string, unknown>) {
    const { error } = await service.from('connexions_google').upsert({ siren, ...colonnes }, { onConflict: 'siren' });
    if (error) throw new Error(error.message);
  },
};

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const etat = await lireSigne(u.searchParams.get('state'), env('GOOGLE_CLE_CHIFFREMENT'));
  if (!etat) return page('Ce lien a expiré ou n’est pas valable. Revenez dans l’app Sitô et recommencez la liaison avec Google.');
  // L'artisan a refusé chez Google, ou Google a renvoyé une erreur.
  if (u.searchParams.get('error') || !u.searchParams.get('code')) return revenir(etat.retour, 'erreur');
  try {
    const google = clientGoogle({ clientId: env('GOOGLE_CLIENT_ID'), secret: env('GOOGLE_CLIENT_SECRET') });
    const r = await relier({ siren: etat.siren, code: u.searchParams.get('code'), redirection: env('SITO_RETOUR_GOOGLE'), depot, google, cle: env('GOOGLE_CLE_CHIFFREMENT') });
    return revenir(etat.retour, r.ok ? 'ok' : 'erreur');
  } catch (e) {
    console.error('google-retour :', e instanceof Error ? e.message : e);
    await depot.connexion(etat.siren, { etat: 'erreur', motif: 'La liaison avec Google a échoué. Recommencez dans un moment.' }).catch(() => {});
    return revenir(etat.retour, 'erreur');
  }
});

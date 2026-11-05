#!/usr/bin/env node
// Un faux Google (T24) : OAuth, comptes, fiches, avis et réponses. Un `fetch`
// passé au vrai client (`supabase/functions/_shared/google.mjs`).
//
// Les règles refaites ici :
//   1. **un code ne sert qu'une fois**, et seulement avec la même adresse de
//      redirection que celle du consentement ;
//   2. **le jeton d'accès en `Authorization: Bearer`** ; un jeton inconnu : 401 ;
//   3. **un jeton de rafraîchissement retiré** (l'artisan a coupé l'accès chez
//      Google) : `400 invalid_grant` ;
//   4. **les avis viennent par pages** (pageSize ≤ 50, nextPageToken) : un
//      client qui ne lit que la première page perd des avis ;
//   5. **une réponse est un PUT sur …/reviews/<id>/reply**, `{ comment }` ;
//      elle remplace la précédente.
// Ce que le faux ne prouve pas : la vérification de la fiche par Google,
// les quotas, et l'accès à l'API, qui se demande (F13).

const JSONR = (corps, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });

export function fauxGoogle({ clientId = 'client-essai', secret = 'secret-essai', redirection = 'https://retour.essai/google',
  compte = 'accounts/111', fiches = [{ name: 'locations/222', title: 'Façades Essai' }], avis = [] } = {}) {
  const codes = new Map(), rafraichissements = new Set(), acces = new Set(), appels = [];
  let n = 0;
  const reviews = avis.map((a) => ({ ...a }));
  return {
    clientId, secret, redirection, compte, reviews, appels,
    // Ce que fait l'artisan chez Google : il donne son accord, Google rend un code.
    accord() { const c = `code-${++n}`; codes.set(c, `rafraichir-${n}-tres-secret`); return c; },
    retirer() { rafraichissements.clear(); },
    async fetch(url, init = {}) {
      const u = new URL(url);
      const methode = (init.method || 'GET').toUpperCase();
      const h = Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
      appels.push(`${methode} ${u.host}${u.pathname}`);
      if (u.host === 'oauth2.googleapis.com' && u.pathname === '/token') {
        const p = new URLSearchParams(init.body);
        if (p.get('client_id') !== clientId || p.get('client_secret') !== secret) return JSONR({ error: 'invalid_client' }, 401);
        if (p.get('grant_type') === 'authorization_code') {
          const r = codes.get(p.get('code'));
          if (!r || p.get('redirect_uri') !== redirection) return JSONR({ error: 'invalid_grant' }, 400);
          codes.delete(p.get('code'));
          rafraichissements.add(r);
          const a = `acces-${++n}`; acces.add(a);
          return JSONR({ access_token: a, refresh_token: r, expires_in: 3599, scope: 'https://www.googleapis.com/auth/business.manage', token_type: 'Bearer' });
        }
        if (p.get('grant_type') === 'refresh_token') {
          if (!rafraichissements.has(p.get('refresh_token'))) return JSONR({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }, 400);
          const a = `acces-${++n}`; acces.add(a);
          return JSONR({ access_token: a, expires_in: 3599, token_type: 'Bearer' });
        }
        return JSONR({ error: 'unsupported_grant_type' }, 400);
      }
      const jeton = (h.authorization || '').replace(/^Bearer /, '');
      if (!acces.has(jeton)) return JSONR({ error: { code: 401, status: 'UNAUTHENTICATED' } }, 401);
      if (u.host === 'mybusinessaccountmanagement.googleapis.com' && u.pathname === '/v1/accounts')
        return JSONR({ accounts: [{ name: compte, accountName: 'Jeanne Essai', type: 'PERSONAL' }] });
      if (u.host === 'mybusinessbusinessinformation.googleapis.com' && u.pathname === '/v1/accounts/-/locations') {
        if (!u.searchParams.get('readMask')) return JSONR({ error: { code: 400, status: 'INVALID_ARGUMENT' } }, 400);
        return JSONR({ locations: fiches });
      }
      const m = u.pathname.match(/^\/v4\/(accounts\/[^/]+)\/(locations\/[^/]+)\/reviews(?:\/([^/]+)\/reply)?$/);
      if (u.host === 'mybusiness.googleapis.com' && m) {
        if (m[1] !== compte || !fiches.some((f) => f.name === m[2])) return JSONR({ error: { code: 404, status: 'NOT_FOUND' } }, 404);
        if (!m[3] && methode === 'GET') {
          const taille = Math.min(Number(u.searchParams.get('pageSize') || 10), 50);
          const debut = Number(u.searchParams.get('pageToken') || 0);
          const page = reviews.slice(debut, debut + taille).map((r) => ({ ...r, name: `${m[1]}/${m[2]}/reviews/${r.reviewId}` }));
          return JSONR({ reviews: page, totalReviewCount: reviews.length, ...(debut + taille < reviews.length ? { nextPageToken: String(debut + taille) } : {}) });
        }
        if (m[3] && methode === 'PUT') {
          const r = reviews.find((x) => x.reviewId === m[3]);
          if (!r) return JSONR({ error: { code: 404, status: 'NOT_FOUND' } }, 404);
          const c = JSON.parse(init.body || '{}').comment;
          if (!c) return JSONR({ error: { code: 400, status: 'INVALID_ARGUMENT' } }, 400);
          r.reviewReply = { comment: c, updateTime: '2026-11-05T12:00:00Z' };
          return JSONR(r.reviewReply);
        }
      }
      return JSONR({ error: { code: 404, status: 'NOT_FOUND' } }, 404);
    },
  };
}

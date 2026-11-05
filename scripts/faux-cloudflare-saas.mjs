#!/usr/bin/env node
// Un faux Cloudflare for SaaS (custom hostnames), pour essayer
// `atelier/cloudflare-saas.mjs` sans compte : un `fetch` passé au vrai client.
//
// Les règles refaites ici :
//
//   1. **le jeton en `Authorization: Bearer`, et la bonne zone** ; une autre
//      zone répond 404 comme Cloudflare ;
//   2. **un hôte n'existe qu'une fois** sur la zone : en recréer un second
//      est refusé (409). Un client qui recrée sans chercher d'abord bute ;
//   3. **un hostname naît `pending` / `pending_validation`** et ne passe
//      `active` que lorsque l'artisan a posé son CNAME (`valider()` ici) ;
//   4. **au bout de 7 jours sans validation, il disparaît** (`expirer()`
//      ici) : un GET répond 404, et la liste ne le montre plus ;
//   5. **l'enveloppe** `{ success, errors, messages, result }` partout.
//
// Ce que le faux ne prouve pas : la validation réelle par HTTP ou TXT, les
// délais d'émission du certificat, les plafonds de l'offre (100 hostnames
// inclus). Le premier appel réel attend la zone de Sitô (F6, F5).

const JSONR = (corps, statut = 200) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });
const bon = (result, statut = 200) => JSONR({ success: true, errors: [], messages: [], result }, statut);
const mauvais = (code, message, statut = 400) => JSONR({ success: false, errors: [{ code, message }], messages: [], result: null }, statut);

export function fauxCloudflareSaas({ zone = 'zone-de-test', jeton = 'jeton-de-test-cloudflare' } = {}) {
  const hotes = new Map(); // id -> hostname
  const appels = [];
  let n = 0;

  async function fetch(url, init = {}) {
    const u = new URL(url);
    const methode = (init.method || 'GET').toUpperCase();
    const h = Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const corps = init.body ? JSON.parse(init.body) : null;
    appels.push({ methode, chemin: u.pathname + u.search, corps });
    if (h.authorization !== `Bearer ${jeton}`) return mauvais(10000, 'Authentication error', 403);
    const m = u.pathname.match(/^\/client\/v4\/zones\/([^/]+)\/custom_hostnames(?:\/([^/]+))?$/);
    if (!m || m[1] !== zone) return mauvais(7003, 'Could not route to this zone', 404);
    const id = m[2] ? decodeURIComponent(m[2]) : null;

    if (!id && methode === 'POST') {
      if (!corps?.hostname) return mauvais(1409, 'hostname required');
      if ([...hotes.values()].some((x) => x.hostname === corps.hostname)) return mauvais(1406, 'Duplicate custom hostname found.', 409);
      const nouvel = `ch-${++n}`;
      const ch = { id: nouvel, hostname: corps.hostname, status: 'pending',
        ssl: { status: 'pending_validation', method: corps.ssl?.method, type: corps.ssl?.type, validation_errors: [] },
        ownership_verification: { type: 'txt', name: `_cf-custom-hostname.${corps.hostname}`, value: `preuve-${nouvel}` },
        verification_errors: [], created_at: '2026-11-05T00:00:00Z' };
      hotes.set(nouvel, ch);
      return bon(ch, 201);
    }
    if (!id && methode === 'GET') {
      const filtre = u.searchParams.get('hostname');
      return bon([...hotes.values()].filter((x) => !filtre || x.hostname === filtre));
    }
    const ch = id && hotes.get(id);
    if (!ch) return mauvais(1436, 'The custom hostname was not found.', 404);
    if (methode === 'GET') return bon(ch);
    if (methode === 'PATCH') { if (corps?.ssl) Object.assign(ch.ssl, { method: corps.ssl.method, type: corps.ssl.type }); return bon(ch); }
    if (methode === 'DELETE') { hotes.delete(id); return bon({ id }); }
    return mauvais(10405, 'Method not allowed', 405);
  }

  const parHote = (hote) => [...hotes.values()].find((x) => x.hostname === hote);
  return {
    fetch, appels, hotes, zone, jeton,
    // L'artisan a posé son CNAME : Cloudflare valide et émet le certificat.
    valider(hote, { certificat = true } = {}) { const c = parHote(hote); c.status = 'active'; c.ssl.status = certificat ? 'active' : 'pending_issuance'; },
    // 7 jours sans validation : Cloudflare efface le hostname.
    expirer(hote) { const c = parHote(hote); if (c) hotes.delete(c.id); },
    // La validation du certificat a échoué pour de bon.
    echouer(hote, message) { const c = parHote(hote); c.ssl.status = 'validation_timed_out'; c.ssl.validation_errors = [{ message }]; },
  };
}

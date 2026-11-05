#!/usr/bin/env node
// Un faux Umami (T22), pour essayer `atelier/umami.mjs` et l'import de la
// nuit sans compte : un `fetch` passé au vrai client.
//
// Les règles refaites ici :
//   1. **la clé en `x-umami-api-key`** (Umami Cloud) ; sans elle, 401 ;
//   2. **un site inconnu répond 404** ;
//   3. **les bornes sont incluses** (`startAt` et `endAt`, en millisecondes) :
//      un client qui envoie la fin du jour telle quelle compte deux fois
//      l'instant de minuit, et l'essai le voit ;
//   4. **`metrics?type=event`** rend `[{ x: nom, y: nombre }]`, tous les
//      événements du site, pas seulement « Appeler ».
// Ce que le faux ne prouve pas : la façon exacte dont Umami compte une
// « visite » (plusieurs pages vues en une demi-heure : une visite).

const JSONR = (corps, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });

// sites : { <id>: { visites: [ms...], evenements: [{ t: ms, nom }] } }
export function fauxUmami({ cle = 'cle-de-test-umami', sites = {}, enPanne = [] } = {}) {
  const appels = [];
  async function fetch(url, init = {}) {
    const u = new URL(url);
    const h = Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    appels.push(u.pathname + u.search);
    if (h['x-umami-api-key'] !== cle) return JSONR({ error: 'Unauthorized' }, 401);
    if (u.pathname === '/v1/websites' && (init.method || 'GET') === 'POST') {
      const c = JSON.parse(init.body || '{}');
      if (!c.name || !c.domain) return JSONR({ error: 'Bad request' }, 400);
      const id = `0000${String(Object.keys(sites).length + 1).padStart(4, '0')}-0000-4000-8000-${'0'.repeat(12)}`;
      sites[id] = { visites: [], evenements: [], nom: c.name, domaine: c.domain };
      return JSONR({ id, name: c.name, domain: c.domain });
    }
    const m = u.pathname.match(/^\/v1\/websites\/([^/]+)\/(stats|metrics)$/);
    if (!m) return JSONR({ error: 'Not found' }, 404);
    if (enPanne.includes(m[1])) return JSONR({ error: 'Internal error' }, 500);
    const site = sites[m[1]];
    if (!site) return JSONR({ error: 'Not found' }, 404);
    const debut = Number(u.searchParams.get('startAt')), fin = Number(u.searchParams.get('endAt'));
    if (!Number.isFinite(debut) || !Number.isFinite(fin) || fin < debut) return JSONR({ error: 'Bad request' }, 400);
    const dans = (t) => t >= debut && t <= fin;
    if (m[2] === 'stats') {
      const v = site.visites.filter(dans).length;
      return JSONR({ pageviews: v * 2, visitors: v, visits: v, bounces: 0, totaltime: v * 60,
        comparison: { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 } });
    }
    if (u.searchParams.get('type') !== 'event') return JSONR({ error: 'Bad request' }, 400);
    const parNom = new Map();
    for (const e of site.evenements.filter((x) => dans(x.t))) parNom.set(e.nom, (parNom.get(e.nom) || 0) + 1);
    return JSONR([...parNom].map(([x, y]) => ({ x, y })));
  }
  return { fetch, appels, cle, sites };
}

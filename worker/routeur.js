// Le Worker Cloudflare qui sert TOUS les sites Sitô.
//
// Pourquoi un seul : Cloudflare Pages plafonne à 100 projets par compte, les
// Workers à 500. Ce Worker reçoit toutes les requêtes (route « */* » de la
// zone Sitô, y compris les domaines des artisans branchés par Cloudflare for
// SaaS), lit le nom demandé et sert les fichiers du bon site depuis R2.
// Schéma documenté par Cloudflare : « Worker as origin » (juin 2026).
//
//   ADRESSES (Workers KV) : hôte -> {"site": "<id>", "version": 7}
//   SITES    (R2)         : sites/<id>/<version>/index.html, images/..., polices/...
//
// Une nouvelle version s'écrit à côté de l'ancienne, puis le pointeur change :
// un visiteur voit une version entière, jamais un mélange. Le cache est rangé
// sous une clé qui contient la version : aucune purge n'est nécessaire.
// Voir app/PLAN-APP.md, section 3.

const TYPES = {
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8',
  json: 'application/json', svg: 'image/svg+xml', avif: 'image/avif', webp: 'image/webp',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', ico: 'image/x-icon',
  woff2: 'font/woff2', woff: 'font/woff', txt: 'text/plain; charset=utf-8', xml: 'application/xml',
  webmanifest: 'application/manifest+json', mp4: 'video/mp4',
};

// En-têtes de sécurité communs : un site d'artisan n'a pas de script tiers.
const SECURITE = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const page = (statut, titre, texte) => new Response(
  `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<title>${titre}</title><body style="font:18px/1.5 system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem;color:#222">`
  + `<h1 style="font-size:1.4rem">${titre}</h1><p>${texte}</p></body></html>`,
  { status: statut, headers: { 'content-type': TYPES.html, 'cache-control': 'no-store', ...SECURITE } });

const ASSETLINKS = '/.well-known/assetlinks.json';

// Chemin demandé -> clé R2, ou null si le chemin est refusé.
export function cleFichier(site, version, chemin) {
  let p;
  try { p = decodeURIComponent(chemin); } catch { return null; }
  if (p.includes('\0') || p.includes('\\')) return null;
  // La seule exception aux fichiers cachés : la preuve que l'app Android est
  // celle de Sitô (Digital Asset Links, T28). Ce chemin exact, rien d'autre.
  if (p === ASSETLINKS) return `sites/${site}/${version}${ASSETLINKS}`;
  const morceaux = p.split('/').filter(Boolean);
  if (morceaux.some(m => m === '..' || m === '.' || m.startsWith('.'))) return null;
  if (!morceaux.length || p.endsWith('/')) morceaux.push('index.html');
  else if (!/\.[a-z0-9]+$/i.test(morceaux[morceaux.length - 1])) morceaux[morceaux.length - 1] += '.html';
  return `sites/${site}/${version}/${morceaux.join('/')}`;
}

export default {
  async fetch(requete, env, ctx) {
    if (requete.method !== 'GET' && requete.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', ...SECURITE } });
    }
    const url = new URL(requete.url);
    const hote = url.hostname.toLowerCase().replace(/\.$/, '');

    const entree = await env.ADRESSES.get(hote, { type: 'json', cacheTtl: 60 });
    if (!entree || !entree.site || !entree.version) {
      return page(404, 'Site introuvable', "Aucun site n'est publié à cette adresse.");
    }
    if (entree.redirection) {
      return Response.redirect(`https://${entree.redirection}${url.pathname}${url.search}`, 301);
    }

    const cle = cleFichier(entree.site, entree.version, url.pathname);
    if (!cle) return page(400, 'Adresse refusée', "Cette adresse n'est pas valide.");

    // Cache local du centre de données, sous une clé qui porte la version.
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const cleCache = new Request(`https://cache.sito.invalid/${cle}`);
    if (cache && requete.method === 'GET') {
      const r = await cache.match(cleCache);
      if (r) return r;
    }

    const objet = await env.SITES.get(cle);
    if (!objet) {
      // Page absente : la 404 du site s'il en a une, sinon la nôtre.
      const p404 = await env.SITES.get(`sites/${entree.site}/${entree.version}/404.html`);
      if (p404) return new Response(p404.body, { status: 404, headers: { 'content-type': TYPES.html, 'cache-control': 'no-store', ...SECURITE } });
      return page(404, 'Page introuvable', "Cette page n'existe pas sur ce site.");
    }

    const ext = (cle.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';
    const html = ext === 'html';
    const entetes = new Headers({
      'content-type': TYPES[ext] || 'application/octet-stream',
      // Les fichiers d'une version ne changent jamais ; le HTML se relit vite
      // pour qu'une nouvelle version arrive en une minute au plus.
      // assetlinks.json : une heure, pour qu'un changement de clé de
      // signature soit vu sans attendre un an.
      'cache-control': html ? 'public, max-age=60'
        : cle.endsWith(ASSETLINKS) ? 'public, max-age=3600' : 'public, max-age=31536000, immutable',
      etag: objet.httpEtag || objet.etag || '',
      'x-sito-version': String(entree.version),
      ...SECURITE,
    });
    const reponse = new Response(requete.method === 'HEAD' ? null : objet.body, { status: 200, headers: entetes });
    if (cache && requete.method === 'GET' && ctx && ctx.waitUntil) ctx.waitUntil(cache.put(cleCache, reponse.clone()));
    return reponse;
  },
};

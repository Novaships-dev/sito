#!/usr/bin/env node
// Ce que voit vraiment un visiteur de `sito-demo.pages.dev`, relu sur le
// réseau après une publication : la preuve que la publication privée tient
// ailleurs que sur le faux Cloudflare.
//
// Pour chaque site de `prospection/en-ligne.json` et pour la page d'appels :
//   - la page répond 200 et porte `X-Robots-Tag: noindex` ;
//   - une image du site répond 200, avec son type, et porte le noindex ;
// et pour le projet :
//   - la racine rend 404 (aucune page d'accueil, rien à indexer) ;
//   - `robots.txt` interdit tout ;
//   - l'API d'appels sous un faux slug rend 404 ; sous le vrai slug, un
//     statut inconnu est refusé par le Worker avec sa raison (preuve que
//     `SLUG_APPELS` est posé, sans rien écrire) ;
//   - la vue comptée par le Worker sur le premier site se relit dans KV
//     (preuve que la liaison `APPELS` marche), puis la clé est effacée pour
//     ne pas fausser « liens ouverts ».
//
//   node scripts/prospection/verifier-en-ligne.mjs [--base https://sito-demo.pages.dev]
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { EN_LIGNE } from './publier.mjs';
import { PROJET } from './cloudflare-pages.mjs';
import { appelsSlug } from './preparer-appels.mjs';
import { TITRE_KV } from './reglages-cloudflare.mjs';

const NOINDEX = /noindex/i;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

export async function verifierEnLigne({ base, enLigne, slugAppels, client = null, aller = fetch, dire = console.log }) {
  const fautes = [];
  let controles = 0;
  const ok = (c, nom) => { controles++; if (!c) { fautes.push(nom); dire(`  FAUTE ${nom}`); } return c; };
  const get = (chemin, init = {}) => aller(base + chemin, { redirect: 'manual', ...init });

  const racine = await get('/');
  ok(racine.status === 404, `la racine rend ${racine.status}, 404 attendu`);
  const robots = await get('/robots.txt');
  ok(robots.status === 200 && /Disallow:\s*\/\s*$/m.test(await robots.text()), 'robots.txt interdit tout');

  const slugs = Object.keys(enLigne.sites || {});
  for (const slug of slugs) {
    const r = await get(`/${slug}/`);
    const html = r.status === 200 ? await r.text() : '';
    ok(r.status === 200, `${slug} : la page rend ${r.status}`);
    ok(NOINDEX.test(r.headers.get('x-robots-tag') || ''), `${slug} : la page ne porte pas X-Robots-Tag noindex`);
    const image = Object.keys(enLigne.sites[slug].manifeste || {}).find((c) => /\.(webp|jpe?g|png)$/i.test(c));
    if (ok(!!image, `${slug} : aucune image au manifeste`)) {
      const ri = await get('/' + image.replace(/^\//, ''));
      ok(ri.status === 200 && /^image\//.test(ri.headers.get('content-type') || ''), `${slug} : l image ${image} rend ${ri.status} ${ri.headers.get('content-type')}`);
      ok(NOINDEX.test(ri.headers.get('x-robots-tag') || ''), `${slug} : l image ne porte pas X-Robots-Tag noindex`);
      await ri.arrayBuffer().catch(() => {});
    }
    ok(html.length > 1000, `${slug} : page vide ou trop courte`);
  }

  const pa = await get(`/${slugAppels}/`);
  const htmlPa = pa.status === 200 ? await pa.text() : '';
  ok(pa.status === 200, `page d appels : rend ${pa.status}`);
  ok(NOINDEX.test(pa.headers.get('x-robots-tag') || ''), 'page d appels : pas de X-Robots-Tag noindex');
  for (const slug of slugs) ok(htmlPa.includes(`/${slug}/`), `page d appels : le lien vers ${slug} manque`);

  const corps = JSON.stringify({ siren: '000000000', statut: 'essai-inconnu' });
  const faux = await get('/zzzzzzzzzzzzzzzz/api/resultat', { method: 'POST', body: corps, headers: { 'Content-Type': 'application/json' } });
  ok(faux.status === 404, `API sous un faux slug : rend ${faux.status}, 404 attendu`);
  const vrai = await get(`/${slugAppels}/api/resultat`, { method: 'POST', body: corps, headers: { 'Content-Type': 'application/json' } });
  const dit = await vrai.text();
  ok(vrai.status === 400 && /statut inconnu/.test(dit), `API sous le vrai slug : ${vrai.status} ${dit.slice(0, 120)} (400 « statut inconnu » attendu)`);

  if (client && slugs.length) {
    const espace = (await client.espacesKv()).find((e) => e.title === TITRE_KV);
    if (ok(!!espace, `espace KV ${TITRE_KV} introuvable`)) {
      const cle = `vu:${slugs[0]}`;
      let vu = null;
      for (let i = 0; i < 6 && vu == null; i++) { await attendre(5000); vu = await client.lireKv(espace.id, cle); }
      ok(vu != null && Number(vu) >= 1, `la vue de ${slugs[0]} ne se relit pas dans KV (${vu}) : la liaison APPELS ne marche pas`);
      if (vu != null) await client.effacerKv(espace.id, cle);
    }
  }
  return { controles, fautes, slugs };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--base');
  const base = (i > -1 ? args[i + 1] : `https://${PROJET}.pages.dev`).replace(/\/$/, '');
  const { exiger } = await import('../env.mjs');
  const env = exiger(['CLOUDFLARE_COMPTE_ID', 'CLOUDFLARE_JETON_API'], 'relire KV après la publication (action F5)');
  const { clientCloudflare } = await import('./cloudflare-pages.mjs');
  const client = clientCloudflare({ compte: env.CLOUDFLARE_COMPTE_ID, jeton: env.CLOUDFLARE_JETON_API });
  const enLigne = JSON.parse(readFileSync(EN_LIGNE, 'utf8'));
  const { controles, fautes, slugs } = await verifierEnLigne({ base, enLigne, slugAppels: appelsSlug(), client });
  console.log(`\n${base} : ${slugs.length} site(s) et la page d appels, ${controles} contrôles, ${fautes.length} faute(s).`);
  process.exitCode = fautes.length ? 1 : 0;
}

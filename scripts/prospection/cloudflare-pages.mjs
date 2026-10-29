#!/usr/bin/env node
// Le dialogue avec Cloudflare Pages, et rien d'autre : pas de décision de
// publication ici (c'est `publier.mjs`), seulement les quatre appels de
// l'« envoi direct » (direct upload) et l'empreinte que Cloudflare attend.
//
// Spécification : `app/specs/08-PROSPECTION.md`. Offre gratuite, **un seul
// projet** (`sito-demo`) qui porte tous les sites de prospection, chacun sous
// son slug.
//
// La suite d'appels, telle que la documentation la décrit (octobre 2026) :
//
//   1. `GET  /accounts/<compte>/pages/projects/<projet>/upload-token`
//      rend un JWT valable une heure, qui signe les trois appels suivants
//      (ceux-là n'acceptent *que* ce JWT, pas le jeton du compte) ;
//   2. `POST /pages/assets/check-missing`  { hashes: [...] }
//      rend dans `result` les seules empreintes que le magasin n'a pas :
//      c'est cela qui fait que **les images communes ne montent qu'une fois**,
//      même si trente sites les affichent ;
//   3. `POST /pages/assets/upload`  [{ key, value, base64, metadata }]
//      envoie les fichiers manquants, chacun désigné par son empreinte ;
//   4. `POST /pages/assets/upsert-hashes`  { hashes: [...] }
//      déclare les empreintes comme fraîchement montées ;
//   5. `POST /accounts/<compte>/pages/projects/<projet>/deployments`
//      en `multipart/form-data`, avec le champ `manifest` : le plan du site,
//      chemin → empreinte. Le dépôt répond l'adresse en ligne (`result.url`).
//
// **L'empreinte n'est pas un SHA.** Cloudflare attend
// `blake3(base64(contenu) + extension sans le point)`, en hexadécimal, coupé à
// 32 caractères (source : `hashFile` de `@cloudflare/deploy-helpers`, le code
// que `wrangler` utilise). Un SHA-256 ferait tout remonter à chaque fois, et
// `check-missing` ne servirait plus à rien. Node ne sait pas faire blake3
// (seulement blake2b512 et blake2s256) : d'où `hash-wasm`, le paquet que
// wrangler utilise lui aussi depuis 2026.
//
// **Ce que ce fichier ne prouve pas.** Aucun appel réel n'a encore eu lieu :
// le compte Cloudflare est l'action **F5** de Fabrice. L'essai tourne contre
// `scripts/faux-cloudflare.mjs`, qui refait ces règles-là. Le jour où F5 est
// faite, la première vraie publication se fait avec `--pour-de-vrai` et peut
// très bien buter sur un détail que la documentation ne dit pas : tant qu'elle
// n'a pas eu lieu, « publication Cloudflare » n'est pas une chose prouvée.
import { extname } from 'node:path';
import { blake3 } from 'hash-wasm';

export const API = 'https://api.cloudflare.com/client/v4';
export const PROJET = 'sito-demo';

// Les types que Cloudflare doit annoncer au visiteur. Un `.webp` servi en
// `application/octet-stream` se télécharge au lieu de s'afficher.
const TYPES = {
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8', json: 'application/json',
  txt: 'text/plain; charset=utf-8', webp: 'image/webp', jpg: 'image/jpeg',
  jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml',
  woff2: 'font/woff2', woff: 'font/woff', ico: 'image/x-icon',
};
export const typeDe = (chemin) => TYPES[extname(chemin).slice(1).toLowerCase()] || 'application/octet-stream';

// L'empreinte d'un fichier, telle que Cloudflare la calcule. `chemin` ne sert
// qu'à son extension : deux fichiers de même contenu et même extension ont la
// même empreinte, où qu'ils soient rangés — c'est le partage des images.
export async function empreinte(contenu, chemin) {
  const b64 = Buffer.from(contenu).toString('base64');
  return (await blake3(b64 + extname(chemin).slice(1))).slice(0, 32);
}

// Cloudflare groupe les envois ; au-delà d'une certaine taille l'appel est
// refusé. Des lots de 50 fichiers, plafonnés en octets, passent partout.
const LOT_FICHIERS = 50;
const LOT_OCTETS = 20 * 1024 * 1024;

export function lots(fichiers) {
  const out = [];
  let courant = [], octets = 0;
  for (const f of fichiers) {
    const taille = f.contenu.length * 1.37; // le base64 gonfle d'un tiers
    if (courant.length && (courant.length >= LOT_FICHIERS || octets + taille > LOT_OCTETS)) {
      out.push(courant); courant = []; octets = 0;
    }
    courant.push(f); octets += taille;
  }
  if (courant.length) out.push(courant);
  return out;
}

export function clientCloudflare({ compte, jeton, fetch: aller = globalThis.fetch, api = API }) {
  if (!compte || !jeton) throw new Error('clientCloudflare : il manque le compte ou le jeton (voir lanceurs\\CLE_CLOUDFLARE.bat, action F5)');

  // Un seul endroit qui lit la réponse de Cloudflare : son enveloppe
  // (`success`, `errors`) est la même partout, et une erreur doit se nommer,
  // jamais se deviner. Le jeton ne paraît dans aucun message.
  async function appeler(chemin, { methode = 'GET', corps = null, signature = jeton, type = 'application/json' } = {}) {
    const entetes = { Authorization: `Bearer ${signature}` };
    if (corps != null && type) entetes['Content-Type'] = type;
    const r = await aller(`${api}${chemin}`, { method: methode, headers: entetes, body: corps });
    const texte = await r.text();
    let j = null;
    try { j = texte ? JSON.parse(texte) : null; } catch { /* Cloudflare a répondu autre chose que du JSON */ }
    if (!r.ok || !j || j.success === false) {
      const dit = (j?.errors || []).map((e) => `${e.code} ${e.message}`).join(' ; ')
        || (texte ? texte.slice(0, 200) : `sortie ${r.status}`);
      throw new Error(`Cloudflare a refusé ${methode} ${chemin} : ${dit}`);
    }
    return j.result;
  }

  return {
    // Le JWT d'envoi. Les trois appels de fichiers n'acceptent que lui.
    async jetonTeleversement(projet = PROJET) {
      const r = await appeler(`/accounts/${compte}/pages/projects/${projet}/upload-token`);
      if (!r?.jwt) throw new Error('Cloudflare n a pas rendu de jeton d envoi');
      return r.jwt;
    },

    // Celles que le magasin n'a pas. Rend un tableau, même vide.
    async manquants(jwt, empreintes) {
      const r = await appeler('/pages/assets/check-missing', {
        methode: 'POST', signature: jwt, corps: JSON.stringify({ hashes: empreintes }),
      });
      return Array.isArray(r) ? r : [];
    },

    // `fichiers` : [{ cle, contenu, chemin }]. Le contenu part en base64.
    async televerser(jwt, fichiers) {
      let montes = 0;
      for (const lot of lots(fichiers)) {
        await appeler('/pages/assets/upload', {
          methode: 'POST', signature: jwt,
          corps: JSON.stringify(lot.map((f) => ({
            key: f.cle, base64: true,
            value: Buffer.from(f.contenu).toString('base64'),
            metadata: { contentType: typeDe(f.chemin) },
          }))),
        });
        montes += lot.length;
      }
      return montes;
    },

    async confirmerEmpreintes(jwt, empreintes) {
      if (!empreintes.length) return 0;
      await appeler('/pages/assets/upsert-hashes', {
        methode: 'POST', signature: jwt, corps: JSON.stringify({ hashes: empreintes }),
      });
      return empreintes.length;
    },

    // Le dépôt : le manifeste (chemin → empreinte) et les fichiers de réglage
    // que Pages ne traite pas comme des pages (`_headers`, `_redirects`).
    // C'est `_headers` qui porte le `X-Robots-Tag: noindex`.
    // `worker` : le contenu de `_worker.js`, dans son propre champ — c'est
    // ainsi seulement que Pages l'exécute (module ES, liaisons du projet).
    async deployer(projet = PROJET, { manifeste, entetes = null, worker = null, branche = 'main' } = {}) {
      const form = new FormData();
      form.set('manifest', JSON.stringify(manifeste));
      form.set('branch', branche);
      if (entetes) form.set('_headers', new Blob([entetes], { type: 'text/plain' }), '_headers');
      if (worker) form.set('_worker.js', new Blob([worker], { type: 'application/javascript+module' }), '_worker.js');
      // `type: null` : c'est FormData qui pose son Content-Type et sa frontière.
      const r = await appeler(`/accounts/${compte}/pages/projects/${projet}/deployments`, {
        methode: 'POST', corps: form, type: null,
      });
      return { id: r?.id ?? null, url: r?.url ?? null };
    },

    // Le projet existe-t-il ? Fabrice n'a pas à le créer à la main.
    async projet(nom = PROJET) {
      try { return await appeler(`/accounts/${compte}/pages/projects/${nom}`); }
      catch (e) { if (/\b8000007\b|not found|introuvable/i.test(e.message)) return null; throw e; }
    },

    async creerProjet(nom = PROJET, branche = 'main') {
      return appeler(`/accounts/${compte}/pages/projects`, {
        methode: 'POST', corps: JSON.stringify({ name: nom, production_branch: branche }),
      });
    },

    // Les espaces KV du compte (la page d'appels range ses résultats dans un).
    async espacesKv() {
      const r = await appeler(`/accounts/${compte}/storage/kv/namespaces?per_page=100`);
      return Array.isArray(r) ? r : [];
    },

    async creerEspaceKv(titre) {
      return appeler(`/accounts/${compte}/storage/kv/namespaces`, {
        methode: 'POST', corps: JSON.stringify({ title: titre }),
      });
    },

    // Une clé d'un espace KV : sa valeur brute, ou null si elle n'existe pas.
    // Cette route rend la valeur nue, pas l'enveloppe JSON habituelle.
    async lireKv(espace, cle) {
      const r = await aller(`${api}/accounts/${compte}/storage/kv/namespaces/${espace}/values/${encodeURIComponent(cle)}`,
        { headers: { Authorization: `Bearer ${jeton}` } });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`Cloudflare a refusé la lecture KV de ${cle} : sortie ${r.status}`);
      return r.text();
    },

    async effacerKv(espace, cle) {
      return appeler(`/accounts/${compte}/storage/kv/namespaces/${espace}/values/${encodeURIComponent(cle)}`, { methode: 'DELETE' });
    },

    // Les réglages du projet (liaisons KV, variables). Cloudflare fusionne :
    // ce qui n'est pas cité reste tel quel. Ils ne valent qu'à partir du
    // dépôt suivant.
    async reglerProjet(nom = PROJET, deploymentConfigs) {
      return appeler(`/accounts/${compte}/pages/projects/${nom}`, {
        methode: 'PATCH', corps: JSON.stringify({ deployment_configs: deploymentConfigs }),
      });
    },
  };
}

#!/usr/bin/env node
// Un faux Cloudflare Pages, pour essayer la publication sans compte.
//
// Même parti que `scripts/faux-recherche-entreprises.mjs` et
// `scripts/faux-supabase.mjs` : ce n'est pas une imitation polie, c'est un
// `fetch` que l'on passe au **vrai** client (`prospection/cloudflare-pages.mjs`,
// inchangé). Ce qui est essayé est donc le code qui partira en ligne, pas une
// doublure écrite pour l'occasion.
//
// Les règles de l'API qui sont refaites ici, parce qu'un essai qui les ignore
// ne prouverait rien :
//
//   1. **deux signatures différentes.** Les appels de compte veulent le jeton
//      du compte ; `check-missing`, `upload` et `upsert-hashes` n'acceptent
//      *que* le JWT d'envoi. Un code qui confond les deux passe contre une
//      doublure complaisante et échoue en vrai ;
//   2. **`check-missing` ne rend que ce qui manque.** C'est le mécanisme qui
//      fait que les images communes ne montent qu'une fois ;
//   3. **un manifeste qui désigne une empreinte absente du magasin est
//      refusé.** Sans cette règle, oublier d'envoyer un fichier passerait
//      inaperçu et le site serait troué en ligne ;
//   4. **`_headers` n'est pas un fichier servi** : c'est un réglage. Le faux
//      l'applique aux réponses, comme Pages le fait, et ne le sert pas.
//
// Ce que le faux ne prouve pas : les délais réels, le cache de Cloudflare, les
// plafonds de l'offre gratuite, et la forme exacte des erreurs. La première
// publication réelle reste à faire (action **F5**).
import { extname } from 'node:path';

const JSONR = (corps, statut = 200) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });
const bon = (result) => JSONR({ success: true, errors: [], messages: [], result });
const mauvais = (code, message, statut = 400) =>
  JSONR({ success: false, errors: [{ code, message }], messages: [], result: null }, statut);

// `_headers` de Pages, dans la seule forme dont la prospection a besoin : des
// motifs de chemin, puis des en-têtes indentés.
export function lireEntetes(texte) {
  const regles = [];
  let courante = null;
  for (const ligne of String(texte || '').split('\n')) {
    if (!ligne.trim() || ligne.trim().startsWith('#')) continue;
    if (!/^\s/.test(ligne)) { courante = { motif: ligne.trim(), entetes: {} }; regles.push(courante); continue; }
    const i = ligne.indexOf(':');
    if (i > 0 && courante) courante.entetes[ligne.slice(0, i).trim()] = ligne.slice(i + 1).trim();
  }
  return regles;
}

const correspond = (motif, chemin) => {
  if (!motif.includes('*')) return motif === chemin;
  const re = new RegExp('^' + motif.split('*').map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
  return re.test(chemin);
};

export function fauxCloudflare({ compte = 'f'.repeat(32), jeton = 'jeton-de-compte-assez-long-pour-passer', projets = [] } = {}) {
  const magasin = new Map();      // empreinte → { contenu, type }
  const connus = new Set();       // empreintes déclarées par upsert-hashes
  const existants = new Map();    // nom de projet → fiche
  const deploiements = [];
  let jwtCourant = null;
  const journal = [];             // ce qui a été appelé, pour que l'essai puisse le mesurer

  for (const p of projets) existants.set(p, { id: p, name: p, production_branch: 'main' });

  async function fetchFaux(url, { method = 'GET', headers = {}, body = null } = {}) {
    const u = new URL(url);
    const chemin = u.pathname.replace(/^\/client\/v4/, '');
    const porteur = String(headers.Authorization || headers.authorization || '').replace(/^Bearer\s+/, '');
    journal.push(`${method} ${chemin}`);

    const avecCompte = () => porteur === jeton;
    const avecJwt = () => jwtCourant && porteur === jwtCourant;

    // ------------------------------------------------- les fichiers (JWT seul)
    if (chemin === '/pages/assets/check-missing' && method === 'POST') {
      if (!avecJwt()) return mauvais(10001, 'ce point d entrée n accepte que le jeton d envoi', 403);
      const { hashes } = JSON.parse(body);
      return bon(hashes.filter((h) => !magasin.has(h)));
    }
    if (chemin === '/pages/assets/upload' && method === 'POST') {
      if (!avecJwt()) return mauvais(10001, 'ce point d entrée n accepte que le jeton d envoi', 403);
      const liste = JSON.parse(body);
      for (const f of liste) {
        if (!f.key || typeof f.value !== 'string') return mauvais(8000013, 'fichier sans empreinte ou sans contenu');
        if (f.base64 !== true) return mauvais(8000013, 'la prospection envoie toujours en base64');
        magasin.set(f.key, { contenu: Buffer.from(f.value, 'base64'), type: f.metadata?.contentType || null });
      }
      return bon({ successful_key_count: liste.length });
    }
    if (chemin === '/pages/assets/upsert-hashes' && method === 'POST') {
      if (!avecJwt()) return mauvais(10001, 'ce point d entrée n accepte que le jeton d envoi', 403);
      for (const h of JSON.parse(body).hashes) connus.add(h);
      return bon(true);
    }

    // ------------------------------------------- le compte (jeton du compte)
    if (!avecCompte()) return mauvais(10000, 'jeton du compte absent ou faux', 403);
    const m = chemin.match(new RegExp(`^/accounts/${compte}/pages/projects(?:/([^/]+))?(?:/(upload-token|deployments))?$`));
    if (!m) return mauvais(7003, `route inconnue : ${chemin}`, 404);
    const [, projet, sous] = m;

    if (!projet && method === 'POST') {
      const { name, production_branch } = JSON.parse(body);
      if (!/^[a-z0-9][a-z0-9-]*$/.test(name || '')) return mauvais(8000007, 'nom de projet invalide');
      existants.set(name, { id: name, name, production_branch: production_branch || 'main' });
      return bon(existants.get(name));
    }
    if (projet && !sous && method === 'GET') {
      const f = existants.get(projet);
      return f ? bon(f) : mauvais(8000007, 'Project not found', 404);
    }
    if (projet && sous === 'upload-token' && method === 'GET') {
      if (!existants.has(projet)) return mauvais(8000007, 'Project not found', 404);
      jwtCourant = 'jwt-' + Math.random().toString(36).slice(2, 12);
      return bon({ jwt: jwtCourant });
    }
    if (projet && sous === 'deployments' && method === 'POST') {
      if (!existants.has(projet)) return mauvais(8000007, 'Project not found', 404);
      // Round-trip du multipart par la plateforme : l'essai mesure ce que le
      // client a vraiment sérialisé, pas l'objet qu'il tenait en main.
      const form = await new Response(body, { headers: { 'Content-Type': 'multipart/form-data' } }).formData()
        .catch(() => null) || body;
      const brut = form.get('manifest');
      if (!brut) return mauvais(8000013, 'manifeste absent');
      let manifeste;
      try { manifeste = JSON.parse(brut); } catch { return mauvais(8000013, 'manifeste illisible'); }
      const entrees = Object.entries(manifeste);
      if (entrees.length > 20000) return mauvais(8000013, 'plus de 20 000 entrées au manifeste');
      const absentes = entrees.filter(([, h]) => !magasin.has(h));
      if (absentes.length) return mauvais(8000013, `le manifeste désigne ${absentes.length} fichier(s) que le magasin n a pas (${absentes[0][0]})`);

      const brutEntetes = form.get('_headers');
      const entetes = brutEntetes ? (typeof brutEntetes === 'string' ? brutEntetes : await brutEntetes.text()) : null;
      const id = (deploiements.length + 1).toString().padStart(8, '0');
      deploiements.push({ id, projet, manifeste, entetes: lireEntetes(entetes), branche: form.get('branch') || 'main' });
      return bon({ id, short_id: id.slice(0, 8), url: `https://${id}.${projet}.pages.dev`, environment: 'production' });
    }
    return mauvais(7003, `route inconnue : ${method} ${chemin}`, 404);
  }

  // Ce que reçoit un visiteur du dernier dépôt. Pages sert `/x/` comme
  // `/x/index.html` ; un chemin absent est un 404 ; `_headers` s'applique.
  function servir(chemin, { deploiement = -1 } = {}) {
    const d = deploiements.at(deploiement);
    if (!d) return { statut: 404, entetes: {}, corps: null };
    let cle = chemin.replace(/^\//, '');
    if (cle === '' || cle.endsWith('/')) cle += 'index.html';
    let hash = d.manifeste[cle] ?? d.manifeste['/' + cle];
    if (!hash && !extname(cle)) {
      // Pages sert aussi `/x/page` comme `/x/page.html`.
      hash = d.manifeste[cle + '.html'] ?? d.manifeste['/' + cle + '.html'];
    }
    const entetes = {};
    for (const r of d.entetes) if (correspond(r.motif, '/' + cle.replace(/index\.html$/, ''))) Object.assign(entetes, r.entetes);
    if (!hash) return { statut: 404, entetes, corps: null };
    const f = magasin.get(hash);
    return { statut: 200, entetes: { 'Content-Type': f.type, ...entetes }, corps: f.contenu };
  }

  return {
    fetch: fetchFaux, servir, compte, jeton,
    get deploiements() { return deploiements; },
    get dernier() { return deploiements.at(-1); },
    get magasin() { return magasin; },
    get connus() { return connus; },
    get journal() { return journal; },
    // Combien de fois un contenu a-t-il été envoyé ? Doit rester à 1 pour une
    // image partagée par trente sites.
    envois: () => journal.filter((l) => l.includes('/pages/assets/upload')).length,
  };
}

// Un faux Supabase local : juste ce que l'adaptateur du service demande, avec
// les mêmes refus que le vrai (401 si la clé est absente ou posée en Bearer,
// 404 sur une table ou un objet inconnus, 409 sur un objet déjà là).
//
// Pourquoi un module à part : deux essais s'en servent —
// `scripts/essai-service.mjs` (l'adaptateur lui-même) et
// `scripts/essai-preparation.mjs` (la préparation des photos reçues). Un seul
// faux, donc un seul endroit où il peut se tromper.
//
// Il garde tout en mémoire : des lignes, des objets, et la liste des appels
// reçus (`vues`) pour que les essais mesurent les en-têtes réellement envoyés
// plutôt que ce que le code raconte.
import { createServer } from 'node:http';

const comparer = (l, v) => {
  if (l === null || l === undefined) return NaN;
  if (!Number.isNaN(Number(l)) && !Number.isNaN(Number(v))) return Number(l) - Number(v);
  return Date.parse(l) - Date.parse(v);
};
const OPS = {
  eq: (l, v) => String(l) === v, neq: (l, v) => String(l) !== v,
  // Des nombres se comparent en nombres ; des dates (texte ISO) en dates.
  gt: (l, v) => comparer(l, v) > 0, gte: (l, v) => comparer(l, v) >= 0,
  lt: (l, v) => comparer(l, v) < 0, lte: (l, v) => comparer(l, v) <= 0,
  like: (l, v) => new RegExp('^' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$').test(String(l)),
  is: (l, v) => (v === 'null' ? l === null || l === undefined : String(l) === v),
  in: (l, v) => v.replace(/^\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, '')).includes(String(l)),
};
const RESERVES = ['select', 'order', 'limit', 'on_conflict'];

function filtrer(lignes, params) {
  return lignes.filter((l) => [...params].every(([k, v]) => {
    if (RESERVES.includes(k)) return true;
    const i = v.indexOf('.');
    const op = v.slice(0, i), val = v.slice(i + 1);
    return OPS[op] ? OPS[op](l[k], val) : false;
  }));
}

// base : { <table>: [lignes] }     cles : { <table>: ['colonne', ...] }
// objets : Map('<espace>/<chemin>' -> Buffer)
// comptes : Set des identifiants de compte (API d'administration d'Auth)
export async function fauxSupabase({ cle, base = {}, cles = {}, objets = new Map(), jourParis = true, comptes = new Set() } = {}) {
  const vues = [];
  const serveur = createServer((req, res) => {
    const morceaux = [];
    req.on('data', (c) => morceaux.push(c));
    req.on('end', () => {
      const corpsOctets = Buffer.concat(morceaux);
      const u = new URL(req.url, 'http://x');
      const repondre = (statut, donnees, type = 'application/json') => {
        res.writeHead(statut, { 'content-type': type });
        res.end(donnees === undefined ? '' : (Buffer.isBuffer(donnees) ? donnees : JSON.stringify(donnees)));
      };
      vues.push({ methode: req.method, chemin: u.pathname, requete: u.search, entetes: req.headers });

      // Le vrai Supabase refuse une clé secrète posée en Bearer : on fait pareil.
      if (req.headers.apikey !== cle || req.headers.authorization) return repondre(401, { message: 'clé absente ou mal posée' });

      const prefer = req.headers.prefer || '';
      const json = () => { try { return JSON.parse(corpsOctets.toString('utf8')); } catch { return null; } };

      // ---- stockage
      const liste = u.pathname.match(/^\/storage\/v1\/object\/list\/([a-z0-9-]+)$/);
      if (liste && req.method === 'POST') {
        // Un niveau à la fois, comme le vrai : les sous-dossiers sortent sans id.
        const { prefix = '', limit = 100, offset = 0 } = json() || {};
        const debut = `${liste[1]}/${prefix ? prefix.replace(/\/$/, '') + '/' : ''}`;
        const vus = new Map();
        for (const k of objets.keys()) {
          if (!k.startsWith(debut)) continue;
          const reste = k.slice(debut.length);
          const [nom, ...suite] = reste.split('/');
          if (!vus.has(nom)) vus.set(nom, suite.length ? { name: nom, id: null } : { name: nom, id: 'id-' + nom });
        }
        return repondre(200, [...vus.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(offset, offset + limit));
      }
      const sign = u.pathname.match(/^\/storage\/v1\/object\/sign\/([a-z0-9-]+)\/(.+)$/);
      if (sign && req.method === 'POST') {
        const chemin = decodeURIComponent(sign[2]);
        if (!objets.has(`${sign[1]}/${chemin}`)) return repondre(404, { message: 'Object not found' });
        return repondre(200, { signedURL: `/storage/v1/object/sign/${sign[1]}/${sign[2]}?token=jeton-de-test` });
      }
      const obj = u.pathname.match(/^\/storage\/v1\/object\/([a-z0-9-]+)\/(.+)$/);
      if (obj) {
        const k = `${obj[1]}/${decodeURIComponent(obj[2])}`;
        if (req.method === 'GET') return objets.has(k) ? repondre(200, objets.get(k), 'application/octet-stream') : repondre(404, { message: 'Object not found' });
        if (req.method === 'POST') {
          if (objets.has(k) && req.headers['x-upsert'] !== 'true') return repondre(409, { message: 'The resource already exists' });
          objets.set(k, corpsOctets); return repondre(200, { Key: k });
        }
      }
      // ---- comptes (Auth, administration) : effacer un compte efface ce qui
      // s'y rattache, comme les ON DELETE CASCADE de la vraie base.
      const compte = u.pathname.match(/^\/auth\/v1\/admin\/users\/([0-9a-f-]+)$/);
      if (compte && req.method === 'DELETE') {
        if (!comptes.has(compte[1])) return repondre(404, { message: 'User not found' });
        comptes.delete(compte[1]);
        for (const t of ['membres', 'suppressions', 'invitations']) if (base[t]) base[t] = base[t].filter((l) => l.user_id !== compte[1]);
        return repondre(200, {});
      }
      const espace = u.pathname.match(/^\/storage\/v1\/object\/([a-z0-9-]+)$/);
      if (espace && req.method === 'DELETE') {
        const pris = (json()?.prefixes || []).map((c) => `${espace[1]}/${c}`);
        return repondre(200, pris.filter((c) => objets.delete(c)).map((name) => ({ name })));
      }

      // ---- fonctions
      const rpc = u.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
      if (rpc && req.method === 'POST') {
        if (rpc[1] !== 'jour_paris' || !jourParis) return repondre(404, { message: `function ${rpc[1]} does not exist` });
        const d = new Date(json()?.quand || Date.now());
        return repondre(200, new Date(d.getTime() + 2 * 3600 * 1000).toISOString().slice(0, 10));
      }

      // ---- tables
      const t = u.pathname.match(/^\/rest\/v1\/(\w+)$/);
      if (t && base[t[1]]) {
        const nom = t[1];
        if (req.method === 'GET') {
          let lignes = filtrer(base[nom], u.searchParams);
          const ordre = u.searchParams.get('order');
          if (ordre) {
            const [col, sens] = ordre.split('.');
            lignes = [...lignes].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (sens === 'desc' ? -1 : 1));
          }
          const limite = u.searchParams.get('limit');
          if (limite) lignes = lignes.slice(0, Number(limite));
          return repondre(200, lignes);
        }
        if (req.method === 'POST') {
          const entrantes = [].concat(json() || []);
          const k = cles[nom] || ['id'];
          const memeCle = (a, b) => k.every((c) => String(a[c]) === String(b[c]));
          const ecrites = [];
          for (const ligne of entrantes) {
            const deja = base[nom].find((l) => memeCle(l, ligne));
            if (deja && /ignore-duplicates/.test(prefer)) continue;
            if (deja && /merge-duplicates/.test(prefer)) { Object.assign(deja, ligne); ecrites.push(deja); continue; }
            if (deja) return repondre(409, { message: 'duplicate key value violates unique constraint' });
            const neuve = { id: base[nom].length + 100, cree_le: '2026-10-24T00:00:00Z', ...ligne };
            base[nom].push(neuve); ecrites.push(neuve);
          }
          return /return=representation/.test(prefer) ? repondre(201, ecrites) : repondre(201);
        }
        if (req.method === 'DELETE') {
          const parties = filtrer(base[nom], u.searchParams);
          base[nom] = base[nom].filter((l) => !parties.includes(l));
          // Les ON DELETE CASCADE de la vraie base, pour ce que les essais posent.
          const cascade = { entreprises: ['siren', ['membres', 'profils', 'tarifs', 'sites', 'chantiers', 'photos', 'videos', 'avis', 'statistiques', 'demandes', 'abonnements', 'connexions_google', 'prospects', 'invitations']] };
          if (cascade[nom]) for (const p of parties) for (const t of cascade[nom][1]) if (base[t]) base[t] = base[t].filter((l) => l[cascade[nom][0]] !== p[cascade[nom][0]]);
          return /return=representation/.test(prefer) ? repondre(200, parties) : repondre(204);
        }
        if (req.method === 'PATCH') {
          const champs = json() || {};
          const touchees = filtrer(base[nom], u.searchParams);
          for (const l of touchees) Object.assign(l, champs);
          return /return=representation/.test(prefer) ? repondre(200, touchees) : repondre(204);
        }
      }
      repondre(404, { message: `relation "${t ? t[1] : u.pathname}" does not exist` });
    });
  });
  // Node ferme une connexion inactive au bout de 5 s ; Supabase la garde bien
  // plus. Après une fabrication de 9 s, le client réutilisait une connexion que
  // le faux venait de fermer : « fetch failed » en CI (29 oct. 2026).
  serveur.keepAliveTimeout = 120000;
  await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
  return {
    url: `http://127.0.0.1:${serveur.address().port}`,
    base, objets, vues, comptes,
    arreter: () => serveur.close(),
  };
}

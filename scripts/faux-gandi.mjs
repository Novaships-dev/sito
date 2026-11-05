#!/usr/bin/env node
// Un faux Gandi (API v5, domaines), pour essayer `supabase/functions/_shared/gandi.mjs` sans
// compte. Même parti que `faux-cloudflare.mjs` : un `fetch` que l'on passe au
// vrai client, inchangé.
//
// Les règles refaites ici, parce qu'un essai qui les ignore ne prouverait
// rien :
//
//   1. **le jeton en `Authorization: Bearer`.** L'ancienne forme `Apikey` est
//      refusée : Gandi a remplacé les clés d'API par des jetons d'accès
//      personnels (le client `go-gandi` garde les deux, on n'en veut qu'une) ;
//   2. **`Dry-Run: 1` ne fait rien.** Un achat ou un renouvellement « à
//      blanc » répond, et le registre ne bouge pas : un client qui oublie
//      l'en-tête achète pour de bon, et l'essai le voit ;
//   3. **un nom déjà pris ne s'achète pas**, et un domaine qu'on n'a pas ne
//      se renouvelle pas, ne se redirige pas, ne donne pas de code ;
//   4. **le titulaire porte les champs que Gandi exige** (type, given,
//      family, email, streetaddr, country) et un téléphone sous la forme
//      EPP « +33.612345678 » ;
//   5. **une redirection existe une fois** par hôte, sauf `override` ;
//      `protocol` et `type` ne prennent que les valeurs de Gandi ;
//   6. **un CNAME LiveDNS finit par un point** (nom absolu) ;
//   7. **le faux ne rend le code de transfert que verrou levé.** Ce n'est
//      pas une règle relevée chez Gandi : c'est ce qui oblige le client à
//      lever le verrou, car un domaine `clientTransferProhibited` ne se
//      transfère pas, et un code donné seul ne servirait à rien à l'artisan.
//
// Ce que le faux ne prouve pas : les prix réels, les délais d'enregistrement
// (asynchrones chez Gandi), les contrôles de l'AFNIC et la forme exacte des
// erreurs. Le premier appel réel se fait sur le bac à sable (action F8).

const JSONR = (corps, statut = 200) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });
const erreur = (statut, message, errors = []) =>
  JSONR({ code: statut, message, object: 'HTTPError', cause: message, errors }, statut);

export function fauxGandi({ jeton = 'jeton-de-test-gandi', pris = [], prixHT = 10, prixTTC = 12 } = {}) {
  const registre = new Map(); // fqdn -> { owner, fin, verrou, authinfo }
  const redirections = new Map(); // fqdn -> Map(host -> redir)
  const appels = [];
  for (const p of pris) registre.set(p, { owner: null, fin: '2030-01-01', verrou: true, autrui: true, authinfo: 'X' });

  const plusAns = (date, n) => { const d = new Date(date + 'T00:00:00Z'); d.setUTCFullYear(d.getUTCFullYear() + n); return d.toISOString().slice(0, 10); };
  const AUJOURDHUI = '2026-11-05';

  async function fetch(url, init = {}) {
    const u = new URL(url);
    const methode = (init.method || 'GET').toUpperCase();
    const h = Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const essai = h['dry-run'] === '1';
    const corps = init.body ? JSON.parse(init.body) : null;
    appels.push({ methode, chemin: u.pathname + u.search, essai, corps });
    if (h.authorization !== `Bearer ${jeton}`) return erreur(401, 'The server could not verify that you are authorized');
    const p = u.pathname.replace(/^\/v5/, '');
    let m;

    if (methode === 'GET' && p === '/domain/check') {
      const nom = u.searchParams.get('name');
      return JSONR({ currency: 'EUR', grid: 'A', products: [{
        name: nom, process: 'create', status: registre.has(nom) ? 'unavailable' : 'available',
        prices: [{ duration_unit: 'y', min_duration: 1, max_duration: 10, price_before_taxes: prixHT, price_after_taxes: prixTTC }],
      }] });
    }

    if (methode === 'POST' && p === '/domain/domains') {
      const { fqdn, owner, duration = 1 } = corps || {};
      if (!fqdn) return erreur(400, 'Invalid input', [{ location: 'body', name: 'fqdn', description: 'missing' }]);
      if (registre.has(fqdn)) return erreur(409, `${fqdn} is not available`);
      const exiges = ['type', 'given', 'family', 'email', 'streetaddr', 'country'];
      const manque = exiges.filter((k) => owner?.[k] === undefined || owner[k] === '');
      if (manque.length) return erreur(400, 'Invalid owner', manque.map((k) => ({ location: 'body', name: `owner.${k}`, description: 'missing' })));
      if (owner.phone && !/^\+\d{1,3}\.\d{4,14}$/.test(owner.phone))
        return erreur(400, 'Invalid owner', [{ location: 'body', name: 'owner.phone', description: 'invalid phone format' }]);
      if (essai) return JSONR({ status: 'success' });
      registre.set(fqdn, { owner, fin: plusAns(AUJOURDHUI, duration), verrou: true, authinfo: `CODE-${fqdn.length}-${registre.size}` });
      return JSONR({ message: 'Confirmation e-mail sent' }, 202);
    }

    // LiveDNS : l'enregistrement www d'un domaine à nous. Une valeur de CNAME
    // finit par un point (nom absolu), sinon le DNS la complète de travers.
    if ((m = p.match(/^\/livedns\/domains\/([^/]+)\/records\/([^/]+)\/([A-Z]+)$/)) && methode === 'PUT') {
      const d = registre.get(m[1]);
      if (!d || d.autrui) return erreur(404, 'Not Found');
      const vals = corps?.rrset_values;
      if (!Array.isArray(vals) || !vals.length) return erreur(400, 'Invalid rrset_values');
      if (m[3] === 'CNAME' && !vals.every((v) => typeof v === 'string' && v.endsWith('.'))) return erreur(400, 'CNAME value must be an absolute name');
      d.dns = { ...(d.dns || {}), [`${m[2]}/${m[3]}`]: vals };
      return JSONR({ message: 'DNS Record Created' }, 201);
    }

    if ((m = p.match(/^\/domain\/domains\/([^/]+)(\/.*)?$/))) {
      const fqdn = m[1], suite = m[2] || '';
      const d = registre.get(fqdn);
      if (!d || d.autrui) return erreur(404, 'Not Found');
      if (methode === 'GET' && suite === '') {
        return JSONR({ fqdn, status: d.verrou ? ['clientTransferProhibited'] : [],
          ...(d.verrou ? {} : { authinfo: d.authinfo }),
          dates: { registry_ends_at: `${d.fin}T00:00:00Z`, ...(d.verrou ? {} : { authinfo_expires_at: '2026-12-05T00:00:00Z' }) } });
      }
      if (methode === 'POST' && suite === '/renew') {
        const n = corps?.duration;
        if (!Number.isInteger(n) || n < 1) return erreur(400, 'Invalid duration');
        if (essai) return JSONR({ status: 'success' });
        d.fin = plusAns(d.fin, n);
        return JSONR({ message: 'Domain renewed' }, 202);
      }
      if (methode === 'PATCH' && suite === '/status') {
        if (typeof corps?.clientTransferProhibited !== 'boolean') return erreur(400, 'Invalid status');
        d.verrou = corps.clientTransferProhibited;
        return JSONR({ message: 'Domain status updated' }, 202);
      }
      if (methode === 'POST' && suite === '/webredirs') {
        const { host, url: cible, type, protocol, override } = corps || {};
        if (!host || !(host === fqdn || host.endsWith('.' + fqdn))) return erreur(400, 'Invalid host');
        if (!['cloak', 'http301', 'http302'].includes(type)) return erreur(400, 'Invalid type');
        if (!['http', 'https', 'httpsonly'].includes(protocol)) return erreur(400, 'Invalid protocol');
        if (!cible) return erreur(400, 'Invalid url');
        const r = redirections.get(fqdn) || new Map();
        if (r.has(host) && !override) return erreur(409, 'Web redirection already exists');
        r.set(host, { host, url: cible, type, protocol });
        redirections.set(fqdn, r);
        return JSONR({ message: 'Web redirection created' }, 201);
      }
    }
    return erreur(404, 'Not Found');
  }

  return { fetch, appels, registre, redirections, jeton };
}

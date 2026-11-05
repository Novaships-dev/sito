// Le dialogue avec l'API d'Umami (T22), et rien d'autre : les visites et les
// touches « Appeler » d'un site Umami sur une période.
//
// Chemins et en-têtes relevés le 5 nov. 2026 dans le client officiel
// `@umami/api-client` 0.81.0 (généré depuis le contrat OpenAPI d'Umami) :
//
//   GET <base>/websites/<id>/stats?startAt=<ms>&endAt=<ms>
//       → { pageviews, visitors, visits, bounces, totaltime, comparison }
//   GET <base>/websites/<id>/metrics?type=event&startAt=<ms>&endAt=<ms>
//       → [{ x: <nom de l'événement>, y: <nombre> }]
//   POST <base>/websites  { name, domain }  → { id, … }   (un site par artisan)
//
// Base par défaut : Umami Cloud, `https://api.umami.is/v1`, clé en
// `x-umami-api-key` (le client officiel l'envoie aussi en `Authorization:
// Bearer`). Hébergé ailleurs : `https://<hôte>/api`, jeton en Bearer.
//
// **Ce que ce fichier ne prouve pas.** Aucun appel réel : le compte Umami est
// l'action F9. L'essai tourne contre `scripts/faux-umami.mjs`.

export const BASE_CLOUD = 'https://api.umami.is/v1';
export const EVENEMENT_APPEL = 'Appeler';

export function clientUmami({ cle, base = BASE_CLOUD, fetch: aller = globalThis.fetch } = {}) {
  if (!cle) throw new Error('clientUmami : il manque la clé (UMAMI_JETON, action F9)');
  const racine = base.replace(/\/$/, '');

  async function lire(chemin, params, corps) {
    const q = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : '';
    const entetes = { 'x-umami-api-key': cle, Authorization: `Bearer ${cle}`, Accept: 'application/json' };
    if (corps) entetes['Content-Type'] = 'application/json';
    const r = await aller(`${racine}${chemin}${q}`, {
      method: corps ? 'POST' : 'GET', headers: entetes, body: corps ? JSON.stringify(corps) : undefined,
    });
    const texte = await r.text();
    let j = null;
    try { j = texte ? JSON.parse(texte) : null; } catch { /* autre chose que du JSON */ }
    if (!r.ok) {
      const e = new Error(`Umami a refusé ${chemin} (${r.status}) : ${(j?.message || j?.error || texte || '').toString().slice(0, 200)}`);
      e.statut = r.status;
      throw e;
    }
    return j;
  }

  const verifierId = (id) => { if (!/^[0-9a-f-]{36}$/.test(id || '')) throw new Error(`identifiant Umami invalide : ${id}`); };

  return {
    // Un site Umami pour un site d'abonné (CNIL : un par artisan). Rend son id.
    async creerSite({ nom, domaine }) {
      if (!nom || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domaine || '')) throw new Error(`site Umami : nom ou domaine invalide (${domaine})`);
      const w = await lire('/websites', null, { name: nom, domain: domaine });
      if (!/^[0-9a-f-]{36}$/.test(w?.id || '')) throw new Error('Umami n a pas rendu d identifiant de site');
      return w.id;
    },
    // Les visites de la période [debut, fin[, en millisecondes.
    async visites(id, debut, fin) {
      verifierId(id);
      const s = await lire(`/websites/${id}/stats`, { startAt: debut, endAt: fin - 1 });
      const v = Number(s?.visits);
      if (!Number.isFinite(v) || v < 0) throw new Error(`Umami : nombre de visites illisible pour ${id}`);
      return v;
    },
    // Les touches « Appeler » de la période.
    async appels(id, debut, fin) {
      verifierId(id);
      const lignes = await lire(`/websites/${id}/metrics`, { type: 'event', startAt: debut, endAt: fin - 1 });
      const l = (Array.isArray(lignes) ? lignes : []).find((x) => x.x === EVENEMENT_APPEL);
      return l ? Number(l.y) || 0 : 0;
    },
  };
}

// Le jour de Paris AAAA-MM-JJ → [debut, fin[ en millisecondes UTC. Un jour de
// changement d'heure dure 23 ou 25 heures : on ne compte jamais 24 h.
export function bornesJourParis(jour) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour || '')) throw new Error(`jour invalide : ${jour}`);
  const minuit = (j) => {
    const [a, m, d] = j.split('-').map(Number);
    const guess = Date.UTC(a, m - 1, d);
    // Décalage de Paris à cet instant, en minutes.
    const decalage = (t) => {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        .formatToParts(new Date(t)).map((x) => [x.type, x.value]));
      return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t) / 60000;
    };
    let t = guess - decalage(guess) * 60000;
    t = guess - decalage(t) * 60000;
    return t;
  };
  const [a, m, d] = jour.split('-').map(Number);
  const lendemain = new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
  return { debut: minuit(jour), fin: minuit(lendemain) };
}

// Hier, à Paris.
export function hierParis(maintenant = new Date()) {
  const aujourdhui = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(maintenant);
  const [a, m, d] = aujourdhui.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d - 1)).toISOString().slice(0, 10);
}

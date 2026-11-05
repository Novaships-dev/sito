// Le dialogue avec Google (T24) : consentement OAuth, jetons, compte, fiche,
// avis et réponses. Rien d'autre : pas de décision ici (`avis-google.mjs`).
//
// Chemins relevés le 5 nov. 2026 :
//   - avis : `GET https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/reviews`
//     (pageSize ≤ 50, pageToken ; réponse reviews[], nextPageToken) et
//     `PUT …/v4/{name=accounts/*/locations/*/reviews/*}/reply` { comment }
//     (référence v4 de Google, pages accounts.locations.reviews) ; un avis :
//     name, reviewId, reviewer.displayName, starRating (ONE à FIVE), comment,
//     createTime, updateTime, reviewReply { comment, updateTime } ;
//   - fiches : `GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/-/locations?readMask=…`
//     (guide « location data » de Google) ;
//   - compte : `GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts` ;
//   - OAuth : `accounts.google.com/o/oauth2/v2/auth`, `oauth2.googleapis.com/token`
//     et `/revoke`, portée `business.manage` (exigée par updateReply).
//
// **Ce que ce fichier ne prouve pas.** Aucun appel réel : l'accès à l'API se
// demande avec un artisan pilote (F13). L'essai tourne contre
// `scripts/faux-google.mjs`.

export const PORTEE = 'https://www.googleapis.com/auth/business.manage';
export const BASES = {
  auth: 'https://accounts.google.com/o/oauth2/v2/auth',
  jeton: 'https://oauth2.googleapis.com/token',
  revoquer: 'https://oauth2.googleapis.com/revoke',
  comptes: 'https://mybusinessaccountmanagement.googleapis.com/v1',
  fiches: 'https://mybusinessbusinessinformation.googleapis.com/v1',
  avis: 'https://mybusiness.googleapis.com/v4',
};
const NOTES = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

// L'adresse où envoyer l'artisan : Google lui demande son accord, puis le
// renvoie sur `redirection` avec `code` et `state`.
export function lienConsentement({ clientId, redirection, etat, bases = BASES }) {
  if (!clientId || !redirection || !etat) throw new Error('lienConsentement : client, redirection et état obligatoires');
  const q = new URLSearchParams({ client_id: clientId, redirect_uri: redirection, response_type: 'code', scope: PORTEE,
    access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state: etat });
  return `${bases.auth}?${q}`;
}

// Un avis de Google → les colonnes que le service écrit dans `avis`.
export function versAvis(r, siren, maintenant = new Date().toISOString()) {
  return {
    siren, source: 'google', ref_externe: r.reviewId,
    auteur: r.reviewer?.isAnonymous ? 'Anonyme' : (r.reviewer?.displayName || 'Anonyme'),
    note: NOTES[r.starRating] ?? null, texte: r.comment ?? null, ecrit_le: r.createTime ?? null,
    reponse: r.reviewReply?.comment ?? null, repondu_le: r.reviewReply?.updateTime ?? null,
    recupere_le: maintenant,
  };
}

export function clientGoogle({ clientId, secret, fetch: aller = globalThis.fetch, bases = BASES } = {}) {
  if (!clientId || !secret) throw new Error('clientGoogle : il manque GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET');

  async function lire(r, quoi) {
    const texte = await r.text();
    let j = null;
    try { j = texte ? JSON.parse(texte) : null; } catch { /* autre chose que du JSON */ }
    if (!r.ok) {
      const code = j?.error?.status || j?.error || '';
      const e = new Error(`Google a refusé ${quoi} (${r.status}${code ? ` ${typeof code === 'string' ? code : ''}` : ''})`);
      e.statut = r.status;
      // Jeton de rafraîchissement retiré par l'artisan ou expiré.
      e.revoque = j?.error === 'invalid_grant';
      throw e;
    }
    return j || {};
  }
  const jeton = async (champs, quoi) => lire(await aller(bases.jeton, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: secret, ...champs }).toString(),
  }), quoi);
  const get = async (url, acces, quoi) => lire(await aller(url, { headers: { Authorization: `Bearer ${acces}` } }), quoi);

  return {
    async echangerCode(code, redirection) {
      const j = await jeton({ grant_type: 'authorization_code', code, redirect_uri: redirection }, 'l échange du code');
      return { acces: j.access_token, rafraichissement: j.refresh_token || null, portee: j.scope || '', expire: j.expires_in };
    },
    async rafraichir(rafraichissement) {
      const j = await jeton({ grant_type: 'refresh_token', refresh_token: rafraichissement }, 'le rafraîchissement du jeton');
      return { acces: j.access_token, expire: j.expires_in };
    },
    async revoquer(jetonGoogle) {
      await lire(await aller(`${bases.revoquer}?token=${encodeURIComponent(jetonGoogle)}`, { method: 'POST' }), 'la révocation');
    },
    async comptes(acces) {
      return (await get(`${bases.comptes}/accounts`, acces, 'la liste des comptes')).accounts || [];
    },
    async fiches(acces) {
      const j = await get(`${bases.fiches}/accounts/-/locations?readMask=name,title&pageSize=100`, acces, 'la liste des fiches');
      return j.locations || [];
    },
    // Tous les avis d'une fiche, page par page. `fiche` : « locations/123 ».
    async avis(acces, compte, fiche) {
      const parent = `${compte}/${fiche}`;
      if (!/^accounts\/[^/]+\/locations\/[^/]+$/.test(parent)) throw new Error(`fiche Google invalide : ${parent}`);
      const tous = [];
      let page = '';
      for (let i = 0; i < 100; i++) {
        const j = await get(`${bases.avis}/${parent}/reviews?pageSize=50${page ? `&pageToken=${encodeURIComponent(page)}` : ''}`, acces, 'la liste des avis');
        tous.push(...(j.reviews || []));
        if (!j.nextPageToken) break;
        page = j.nextPageToken;
      }
      return tous;
    },
    async repondre(acces, nomAvis, texte) {
      if (!/^accounts\/[^/]+\/locations\/[^/]+\/reviews\/[^/]+$/.test(nomAvis)) throw new Error(`avis Google invalide : ${nomAvis}`);
      if (!texte || !texte.trim()) throw new Error('réponse vide');
      return lire(await aller(`${bases.avis}/${nomAvis}/reply`, {
        method: 'PUT', headers: { Authorization: `Bearer ${acces}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: texte }),
      }), 'la réponse à un avis');
    },
  };
}

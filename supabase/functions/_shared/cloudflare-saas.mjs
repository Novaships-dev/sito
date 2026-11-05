// Cloudflare for SaaS : le domaine propre d'un artisan (T19). Un « custom
// hostname » par domaine, sur la zone de Sitô (`CLOUDFLARE_ZONE_ID`) ;
// l'artisan, ou Gandi pour un domaine acheté, pointe `www.<domaine>` en CNAME
// vers la zone, et Cloudflare émet le certificat.
//
// Les appels (types du SDK officiel `cloudflare` 7.3.0, relevés le 5 nov.
// 2026, `resources/custom-hostnames`) :
//
//   POST   /zones/<zone>/custom_hostnames            { hostname, ssl: { method, type } }
//   GET    /zones/<zone>/custom_hostnames/<id>
//   GET    /zones/<zone>/custom_hostnames?hostname=<hôte>
//   PATCH  /zones/<zone>/custom_hostnames/<id>       { ssl } : le même réglage
//          relance la validation (commentaire du SDK)
//   DELETE /zones/<zone>/custom_hostnames/<id>
//
// Enveloppe : { success, errors: [{ code, message }], messages, result }.
// `result.status` : active, pending, moved, deleted, blocked… ;
// `result.ssl.status` : pending_validation, active, …_timed_out…
//
// **La règle des 7 jours** (TRD §7) : un hostname qui n'est pas validé est
// effacé par Cloudflare au bout de 7 jours. Un artisan qui pose son CNAME le
// dixième jour ne doit pas tomber sur rien : `suivre()` recrée le hostname
// effacé tant que l'adresse est en attente, et range le nouvel identifiant.
//
// **Ce que ce fichier ne prouve pas.** Aucun appel réel : Cloudflare for SaaS
// doit être activé sur la zone de Sitô, qui n'existe pas encore (F6, F5).
// L'essai tourne contre `scripts/faux-cloudflare-saas.mjs`.

export const API = 'https://api.cloudflare.com/client/v4';

const HOTE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

// Ce que `adresses.etat` retient d'un état Cloudflare.
export function etatAdresse(ch) {
  if (!ch) return 'absente';
  const s = ch.status, ssl = ch.ssl?.status || '';
  if (s === 'active' && ssl === 'active') return 'active';
  if (s === 'blocked' || s === 'moved' || s === 'deleted' || s === 'pending_deletion' || /timed_out$/.test(ssl)) return 'echec';
  return 'en_attente';
}

export function clientSaas({ zone, jeton, fetch: aller = globalThis.fetch, api = API } = {}) {
  if (!zone || !jeton) throw new Error('clientSaas : il manque la zone ou le jeton (CLOUDFLARE_ZONE_ID, CLOUDFLARE_JETON_API)');

  // `404` rend null : un hostname effacé (les 7 jours) n'est pas une panne.
  async function appeler(chemin, { methode = 'GET', corps, absentNull = false } = {}) {
    const entetes = { Authorization: `Bearer ${jeton}` };
    if (corps !== undefined) entetes['Content-Type'] = 'application/json';
    const r = await aller(`${api}/zones/${zone}${chemin}`, {
      method: methode, headers: entetes, body: corps === undefined ? undefined : JSON.stringify(corps),
    });
    if (absentNull && r.status === 404) return null;
    const texte = await r.text();
    let j = null;
    try { j = texte ? JSON.parse(texte) : null; } catch { /* autre chose que du JSON */ }
    if (!r.ok || !j || j.success === false) {
      const dit = (j?.errors || []).map((e) => `${e.code} ${e.message}`).join(' ; ') || (texte ? texte.slice(0, 200) : `sortie ${r.status}`);
      const e = new Error(`Cloudflare a refusé ${methode} ${chemin} : ${dit}`);
      e.statut = r.status;
      throw e;
    }
    return j.result;
  }

  // Ce que l'artisan doit poser, s'il pose lui-même : le CNAME, et la preuve
  // de propriété quand Cloudflare la demande.
  const lire = (ch) => ch && ({
    id: ch.id, hote: ch.hostname, status: ch.status, ssl: ch.ssl?.status || null,
    etat: etatAdresse(ch),
    preuve: ch.ownership_verification ? { type: ch.ownership_verification.type,
      nom: ch.ownership_verification.name, valeur: ch.ownership_verification.value } : null,
    erreurs: [...(ch.verification_errors || []), ...((ch.ssl?.validation_errors || []).map((e) => e.message))],
  });

  const client = {
    async creer(hote) {
      if (!HOTE.test(hote || '')) throw new Error(`hôte refusé : ${hote}`);
      return lire(await appeler('/custom_hostnames', {
        methode: 'POST', corps: { hostname: hote, ssl: { method: 'http', type: 'dv' } },
      }));
    },
    async etat(id) {
      return lire(await appeler(`/custom_hostnames/${encodeURIComponent(id)}`, { absentNull: true }));
    },
    async trouver(hote) {
      const r = await appeler(`/custom_hostnames?hostname=${encodeURIComponent(hote)}`);
      const ch = (Array.isArray(r) ? r : []).find((x) => x.hostname === hote);
      return lire(ch || null);
    },
    async relancer(id) {
      return lire(await appeler(`/custom_hostnames/${encodeURIComponent(id)}`, {
        methode: 'PATCH', corps: { ssl: { method: 'http', type: 'dv' } },
      }));
    },
    async supprimer(id) {
      await appeler(`/custom_hostnames/${encodeURIComponent(id)}`, { methode: 'DELETE', absentNull: true });
      return true;
    },

    // Un tour de suivi d'une ligne `adresses` (genre achetee ou existante).
    // Rend les colonnes à écrire : { cloudflare_id, etat, motif }. Ne touche
    // pas une adresse retirée.
    async suivre(adresse) {
      if (adresse.etat === 'retiree') return null;
      let ch = adresse.cloudflare_id ? await client.etat(adresse.cloudflare_id) : null;
      let motif = null;
      if (!ch && adresse.cloudflare_id) {
        // Effacé par Cloudflare (7 jours sans validation), ou par quelqu'un.
        // Un hostname du même nom peut exister déjà (créé à la main) : on le
        // reprend plutôt que d'en faire un second, que Cloudflare refuserait.
        ch = await client.trouver(adresse.hote) || await client.creer(adresse.hote);
        motif = 'recréé : Cloudflare efface un domaine non validé au bout de 7 jours';
      } else if (!ch) {
        ch = await client.trouver(adresse.hote) || await client.creer(adresse.hote);
      }
      const etat = ch.etat === 'absente' ? 'en_attente' : ch.etat;
      if (etat === 'echec') motif = (ch.erreurs[0] || `Cloudflare : ${ch.status} / ${ch.ssl}`).slice(0, 280);
      return { cloudflare_id: ch.id, etat, motif };
    },
  };
  return client;
}

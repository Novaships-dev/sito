// Le dialogue avec l'API v5 de Gandi, pour les domaines des artisans (T19).
// Rien d'autre ici : pas de décision (quand acheter, pour qui), seulement les
// appels, chacun dans une fonction, et une seule lecture des erreurs.
//
// D'où viennent les chemins et les champs (relevé du 5 nov. 2026 ; la
// documentation de Gandi, https://api.gandi.net/docs/domains, n'a pas pu être
// ouverte depuis la session : ils viennent des deux clients libres écrits
// sur elle et tenus à jour, `go-gandi` (celui du fournisseur Terraform) et
// `gandi_v5` (Ruby), dont les chemins citent la documentation) :
//
//   GET    /v5/domain/check?name=<fqdn>         disponibilité et prix
//   POST   /v5/domain/domains                   achat : { fqdn, owner, duration }
//   POST   /v5/domain/domains/<fqdn>/renew      renouvellement : { duration }
//   GET    /v5/domain/domains/<fqdn>            détail, dont `authinfo`
//   PATCH  /v5/domain/domains/<fqdn>/status     { clientTransferProhibited }
//   POST   /v5/domain/domains/<fqdn>/webredirs  { host, url, type, protocol, override }
//   PUT    /v5/livedns/domains/<fqdn>/records/www/CNAME  { rrset_ttl, rrset_values }
//
// Jeton : `Authorization: Bearer <jeton d'accès personnel>`. `Dry-Run: 1`
// fait vérifier un achat ou un renouvellement sans rien faire. Le bac à sable
// est `https://api.sandbox.gandi.net` (constante de `go-gandi`).
//
// **Ce que ce fichier ne prouve pas.** Aucun appel réel n'a eu lieu : le
// compte et le jeton sont l'action F8 de Fabrice. L'essai tourne contre
// `scripts/faux-gandi.mjs`. Deux points sont à vérifier au premier appel sur
// le bac à sable : le format du téléphone du titulaire (« +33.612345678 »,
// la forme EPP des registres) et la forme de `url` d'une redirection (sans
// schéma dans `gandi_v5` : « www.domaine.fr »).
//
// Règle du service (skill sito-service, 6) : bac à sable tant que
// `GANDI_BAC_A_SABLE=true`, et jamais d'achat réel sans un vrai client et sa
// confirmation dans l'app. Le client refuse donc un achat ou un
// renouvellement réel qui n'apporte pas `confirmation`.

export const API_REELLE = 'https://api.gandi.net/v5';
export const API_BAC_A_SABLE = 'https://api.sandbox.gandi.net/v5';

// Un nom de domaine que l'on accepte de demander : minuscules, des étiquettes
// de lettres, chiffres et tirets, une extension. Les accents (IDN) ne sont pas
// pris en charge ici : l'app les refuse avant (écran Mon adresse, T20).
const FQDN = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
export function nomValide(fqdn) {
  return typeof fqdn === 'string' && FQDN.test(fqdn);
}

// Le titulaire est l'artisan, pas Sitô (décision du 5 oct. : « domaine propre
// inclus », TRD §7 : « titulaire = artisan »). Une entreprise : type 1,
// raison sociale et SIREN (l'AFNIC le demande pour un .fr) ; un entrepreneur
// individuel : type 0. Rien n'est inventé : un champ manquant arrête l'achat.
export function titulaireGandi(t) {
  const manque = ['nom', 'prenom', 'courriel', 'adresse', 'codePostal', 'commune', 'telephone']
    .filter((k) => !t || typeof t[k] !== 'string' || !t[k].trim());
  if (manque.length) throw new Error(`titulaire incomplet : ${manque.join(', ')}`);
  const tel = telephoneEpp(t.telephone);
  if (!tel) throw new Error(`titulaire : téléphone illisible (${t.telephone})`);
  const societe = Boolean(t.raisonSociale);
  return {
    type: societe ? 1 : 0,
    ...(societe ? { orgname: t.raisonSociale.trim() } : {}),
    ...(t.siren ? { siren: String(t.siren).replace(/\s/g, '') } : {}),
    given: t.prenom.trim(), family: t.nom.trim(), email: t.courriel.trim(),
    streetaddr: t.adresse.trim(), zip: t.codePostal.trim(), city: t.commune.trim(),
    country: (t.pays || 'FR').toUpperCase(), phone: tel, lang: 'fr',
  };
}

// « 06 12 34 56 78 », « +33 6 12 34 56 78 » → « +33.612345678 ».
export function telephoneEpp(brut) {
  const c = String(brut || '').replace(/[\s.()-]/g, '');
  let m;
  if ((m = c.match(/^0([1-9]\d{8})$/))) return `+33.${m[1]}`;
  if ((m = c.match(/^\+33([1-9]\d{8})$/))) return `+33.${m[1]}`;
  if ((m = c.match(/^\+(\d{1,3})(\d{4,14})$/))) return `+${m[1]}.${m[2]}`;
  return null;
}

export function clientGandi({ jeton, bacASable = true, fetch: aller = globalThis.fetch, api } = {}) {
  if (!jeton) throw new Error('clientGandi : il manque le jeton (GANDI_JETON, action F8)');
  const base = api || (bacASable ? API_BAC_A_SABLE : API_REELLE);

  // Une seule lecture des réponses. Gandi rend en cas d'erreur
  // { code, message, cause, object, errors: [{ location, name, description }] } :
  // on garde ce qui nomme la faute, jamais le jeton.
  async function appeler(chemin, { methode = 'GET', corps, essai = false } = {}) {
    const entetes = { Authorization: `Bearer ${jeton}`, Accept: 'application/json' };
    if (corps !== undefined) entetes['Content-Type'] = 'application/json';
    if (essai) entetes['Dry-Run'] = '1';
    const r = await aller(`${base}${chemin}`, {
      method: methode, headers: entetes, body: corps === undefined ? undefined : JSON.stringify(corps),
    });
    const texte = await r.text();
    let j = null;
    try { j = texte ? JSON.parse(texte) : null; } catch { /* autre chose que du JSON */ }
    if (!r.ok || (j && j.status === 'error')) {
      const details = (j?.errors || []).map((e) => `${e.name || e.location || ''} ${e.description || ''}`.trim()).join(' ; ');
      const dit = [j?.message || j?.cause, details].filter(Boolean).join(' : ') || (texte ? texte.slice(0, 200) : '');
      const e = new Error(`Gandi a refusé ${methode} ${chemin} (${r.status})${dit ? ` : ${dit}` : ''}`);
      e.statut = r.status;
      throw e;
    }
    return { statut: r.status, corps: j };
  }

  const exigerNom = (fqdn) => { if (!nomValide(fqdn)) throw new Error(`nom de domaine refusé : ${fqdn}`); };
  // Achat et renouvellement coûtent de l'argent : hors bac à sable et hors
  // essai, il faut la confirmation de l'artisan (son identifiant, posé par
  // l'app). Sans elle, rien ne part.
  const exigerConfirmation = (essai, confirmation, quoi) => {
    if (!bacASable && !essai && !confirmation)
      throw new Error(`${quoi} réel refusé : pas de confirmation de l'artisan`);
  };

  return {
    base,

    // { disponible, statut, prix: { ht, ttc, devise, duree } | null }.
    // `statut` est celui de Gandi (available, unavailable, pending, error…).
    async verifier(fqdn) {
      exigerNom(fqdn);
      const { corps } = await appeler(`/domain/check?name=${encodeURIComponent(fqdn)}`);
      const p = (corps?.products || []).find((x) => x.name === fqdn) || corps?.products?.[0];
      if (!p) return { disponible: false, statut: 'inconnu', prix: null };
      const tarif = (p.prices || []).find((x) => (x.min_duration ?? 1) <= 1) || p.prices?.[0];
      return {
        disponible: p.status === 'available',
        statut: p.status,
        prix: tarif ? { ht: tarif.price_before_taxes ?? null, ttc: tarif.price_after_taxes ?? null,
          devise: corps.currency || null, duree: tarif.min_duration ?? 1 } : null,
      };
    },

    // Achat au nom de l'artisan. `essai` : Gandi vérifie et ne fait rien.
    async acheter({ fqdn, titulaire, duree = 1, essai = false, confirmation = null }) {
      exigerNom(fqdn);
      exigerConfirmation(essai, confirmation, 'achat');
      if (!Number.isInteger(duree) || duree < 1 || duree > 10) throw new Error(`durée refusée : ${duree}`);
      const owner = titulaireGandi(titulaire);
      const { statut, corps } = await appeler('/domain/domains', {
        methode: 'POST', corps: { fqdn, owner, duration: duree }, essai,
      });
      return { fait: !essai, statut, message: corps?.message || null };
    },

    async renouveler({ fqdn, duree = 1, essai = false, confirmation = null }) {
      exigerNom(fqdn);
      exigerConfirmation(essai, confirmation, 'renouvellement');
      if (!Number.isInteger(duree) || duree < 1 || duree > 10) throw new Error(`durée refusée : ${duree}`);
      const { statut, corps } = await appeler(`/domain/domains/${fqdn}/renew`, {
        methode: 'POST', corps: { duration: duree }, essai,
      });
      return { fait: !essai, statut, message: corps?.message || null };
    },

    // L'échéance (fin de la période payée) : `adresses.echeance`.
    async echeance(fqdn) {
      exigerNom(fqdn);
      const { corps } = await appeler(`/domain/domains/${fqdn}`);
      const fin = corps?.dates?.registry_ends_at;
      return fin ? String(fin).slice(0, 10) : null;
    },

    // Le code de transfert, pour l'artisan qui part : le domaine est à lui.
    // Le verrou de transfert est levé d'abord, sinon le code ne sert à rien.
    async codeTransfert(fqdn) {
      exigerNom(fqdn);
      await appeler(`/domain/domains/${fqdn}/status`, {
        methode: 'PATCH', corps: { clientTransferProhibited: false },
      });
      const { corps } = await appeler(`/domain/domains/${fqdn}`);
      if (!corps?.authinfo) throw new Error(`Gandi n'a pas rendu de code de transfert pour ${fqdn}`);
      return { code: corps.authinfo, expire: corps?.dates?.authinfo_expires_at || null };
    },

    // `www.<domaine>` en CNAME vers la cible de Sitô (la zone de Cloudflare
    // for SaaS), dans le DNS de Gandi (LiveDNS, celui d'un domaine acheté
    // chez Gandi) : PUT /v5/livedns/domains/<fqdn>/records/www/CNAME
    // { rrset_ttl, rrset_values } (chemin et champs : `go-gandi/livedns`).
    async pointerWww(fqdn, cible) {
      exigerNom(fqdn);
      if (!nomValide(cible)) throw new Error(`cible refusée : ${cible}`);
      await appeler(`/livedns/domains/${fqdn}/records/www/CNAME`, {
        methode: 'PUT', corps: { rrset_ttl: 300, rrset_values: [`${cible}.`] },
      });
      return { nom: `www.${fqdn}`, cible };
    },

    // `https://domaine.fr` → `https://www.domaine.fr` : Cloudflare for SaaS
    // ne sert pas un domaine sans www hors offre Entreprise (TRD §7).
    async redirigerVersWww(fqdn) {
      exigerNom(fqdn);
      if (fqdn.startsWith('www.')) throw new Error(`redirection : donner le domaine nu, pas ${fqdn}`);
      await appeler(`/domain/domains/${fqdn}/webredirs`, {
        methode: 'POST',
        corps: { host: fqdn, url: `www.${fqdn}`, type: 'http301', protocol: 'httpsonly', override: true },
      });
      return { de: `https://${fqdn}`, vers: `https://www.${fqdn}` };
    },
  };
}

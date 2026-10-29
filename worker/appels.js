// La fonction qui sert la page d'appels et enregistre les résultats.
//
// Spécification : `app/specs/08-PROSPECTION.md`. Elle part avec le dépôt
// Cloudflare Pages du projet `sito-demo` comme `_worker.js`, et se branche sur
// un espace KV gratuit (`env.APPELS`). Les sites de prospection, eux, sont
// servis comme de simples fichiers (`env.ASSETS`).
//
// Ce qu'elle garde, et ce qu'elle ne garde pas :
//
//   - elle écrit dans KV, sous `resultat:<siren>`, le statut, le jour et la
//     date de relance. **Aucun numéro de téléphone** n'y entre, jamais : le
//     registre versionné et cette page suivent la même règle (cadre légal).
//     Un corps qui en porte un est **refusé**, pas nettoyé en silence ;
//   - elle ne tient pas le registre à jour toute seule : le soir,
//     `/preparer-appels` relit KV et reporte les résultats dans
//     `prospection/registre.json`, qui reste la vérité versionnée. KV est une
//     boîte aux lettres, pas une base.
//
// Deux refus qui comptent :
//
//   1. **le slug de la page est un secret** : sans lui, aucune écriture. Le
//      chemin de l'API vit sous le slug (`/<slug>/api/resultat`), et un POST
//      sur un autre chemin n'écrit rien ;
//   2. **un statut inconnu est refusé** avant toute écriture, avec la liste
//      des statuts connus. Un résultat ne s'invente pas.

// La même liste que `scripts/prospection/registre.mjs`. Elle est recopiée ici
// parce que le Worker part seul chez Cloudflare, sans le dépôt : l'essai
// (`scripts/essai-appels.mjs`) vérifie que les deux listes sont identiques, de
// sorte qu'un ajout d'un côté ne puisse pas être oublié de l'autre.
export const STATUTS = [
  'a-appeler', 'pas-de-reponse', 'a-rappeler', 'interesse',
  'essai-lance', 'abonne-mois', 'abonne-annee', 'pas-interesse', 'ne-plus-appeler',
];

const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const SIREN = /^\d{9}$/;
const TELEPHONE = /(?:\+33|0033|\b0)\s*[1-9](?:[\s.\-]*\d{2}){4}\b/;

const json = (corps, statut = 200) => new Response(JSON.stringify(corps), {
  status: statut,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
});
const refus = (faute, statut = 400) => json({ ok: false, faute }, statut);

// Le jour à Paris : Fabrice appelle à Marseille, pas à Greenwich. Un résultat
// enregistré à 00 h 30 doit porter la date d'ici.
export const jourDeParis = (d = new Date()) =>
  new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', dateStyle: 'short' }).format(d);

export async function enregistrer(env, corps, { jour = jourDeParis() } = {}) {
  if (!corps || typeof corps !== 'object') return refus('corps illisible');
  const { siren, statut, relance_le = null } = corps;

  if (!SIREN.test(String(siren || ''))) return refus('SIREN attendu : neuf chiffres');
  if (!STATUTS.includes(statut)) return refus(`statut inconnu « ${statut} » (connus : ${STATUTS.join(', ')})`);
  if (statut === 'a-rappeler' && !relance_le) return refus('« à rappeler » demande la date de la relance');
  if (relance_le != null && !JOUR.test(String(relance_le))) return refus('date de relance attendue sous la forme 2026-10-28');
  // Le numéro se cherche dans le corps entier, pas champ par champ : il
  // pourrait se glisser n'importe où.
  const tout = JSON.stringify(corps);
  const numero = tout.match(TELEPHONE);
  if (numero) return refus(`un numéro de téléphone est interdit ici (« ${numero[0]} ») : rien n est enregistré`);

  if (!env || !env.APPELS) return refus('aucun espace KV branché (env.APPELS)', 500);

  const fiche = {
    siren: String(siren), statut, jour,
    relance_le: statut === 'a-rappeler' ? String(relance_le) : null,
  };
  await env.APPELS.put(`resultat:${fiche.siren}`, JSON.stringify(fiche));
  return json({ ok: true, dit: motDe(statut, fiche.relance_le), fiche });
}

function motDe(statut, relance) {
  if (statut === 'a-rappeler') return `Rappel noté pour le ${relance}.`;
  if (statut === 'ne-plus-appeler') return 'Noté : ne plus appeler. Son site est retiré au prochain envoi.';
  if (statut === 'abonne-mois' || statut === 'abonne-annee') return 'Abonné : son site reste en ligne.';
  return 'Enregistré.';
}

// Tous les résultats connus, pour la relecture du soir.
export async function lire(env, siren) {
  if (!env?.APPELS) return null;
  const brut = await env.APPELS.get(`resultat:${siren}`);
  return brut ? JSON.parse(brut) : null;
}

// « Liens ouverts » : l'artisan a-t-il regardé son site ? C'est le seul
// chiffre de la semaine qui ne peut pas venir du registre, puisqu'il se passe
// chez le visiteur. Le Worker compte une vue quand la **page** d'un site est
// servie, pas à chaque image : sinon un site de soixante-dix fichiers vaudrait
// soixante-dix visites.
//
// KV n'a pas d'incrément atomique : deux vues à la même seconde peuvent n'en
// faire qu'une. Pour « untel a ouvert son lien », cela suffit ; ce chiffre est
// un indice, pas une comptabilité, et il est présenté comme tel.
const SLUG = /^[a-z0-9]{16}$/;

export async function compterVue(env, slug) {
  if (!env?.APPELS || !SLUG.test(slug)) return null;
  const cle = `vu:${slug}`;
  const avant = Number(await env.APPELS.get(cle)) || 0;
  const apres = avant + 1;
  await env.APPELS.put(cle, String(apres));
  return apres;
}

// Les vues de plusieurs slugs, pour le point de la semaine.
export async function lireVues(env, slugs = []) {
  const out = {};
  if (!env?.APPELS) return out;
  for (const s of slugs) out[s] = Number(await env.APPELS.get(`vu:${s}`)) || 0;
  return out;
}

// Les slugs en ligne, posés par `publier.mjs` au moment du dépôt (la ligne
// ci-dessous est remplacée ; `null` = pas de filtre, pour les essais).
//
// Pourquoi : Pages **continue de servir pendant sept jours** les fichiers
// d'un dépôt précédent qui ne sont plus dans le nouveau (`s-maxage=604800`,
// constaté le 29 oct. 2026 sur sito-demo.pages.dev). Un artisan qui dit « ne
// plus appeler » verrait son site rester en ligne une semaine. Le Worker voit
// chaque requête : tout ce qui vit sous un slug qui n'est plus dans cette
// liste rend 404, avant même de demander le fichier.
export const SLUGS_EN_LIGNE = null; // SLUGS_EN_LIGNE posé par publier.mjs

export function horsLigne(slug, env, enLigne = SLUGS_EN_LIGNE) {
  if (!enLigne || !SLUG.test(slug) || slug === env?.SLUG_APPELS) return false;
  return !enLigne.includes(slug);
}

export default {
  async fetch(requete, env, contexte) {
    const url = new URL(requete.url);
    const bouts = url.pathname.split('/').filter(Boolean);

    // `/<slug>/api/resultat` : le slug de la page d'appels est le seul laissez-
    // passer. Il est comparé en entier, et il doit être celui de la variable
    // du projet : un slug deviné ailleurs n'écrit rien.
    const estApi = bouts.length === 3 && bouts[1] === 'api' && bouts[2] === 'resultat';
    if (estApi) {
      if (requete.method !== 'POST') return refus('POST attendu', 405);
      if (!env?.SLUG_APPELS) return refus('aucun slug de page d appels configuré (SLUG_APPELS)', 500);
      if (bouts[0] !== env.SLUG_APPELS) return refus('page inconnue', 404);
      let corps = null;
      try { corps = await requete.json(); } catch { return refus('corps illisible'); }
      return enregistrer(env, corps);
    }
    if (url.pathname.endsWith('/api/resultat')) return refus('page inconnue', 404);

    if (bouts.length && horsLigne(bouts[0], env)) {
      return new Response('page inconnue', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    }

    // La page d'un site de prospection : on compte la vue avant de servir.
    // Jamais la page d'appels elle-même (c'est Fabrice qui la regarde), et
    // jamais une image : seulement la page d'accueil du slug.
    const estPageDeSite = requete.method === 'GET'
      && bouts.length >= 1 && bouts.length <= 2
      && (bouts.length === 1 || bouts[1] === 'index.html')
      && bouts[0] !== env?.SLUG_APPELS
      && /^[a-z0-9]{16}$/.test(bouts[0]);
    if (estPageDeSite) {
      // `waitUntil` quand il existe : la vue ne doit pas retarder la page.
      const compte = compterVue(env, bouts[0]);
      if (typeof contexte?.waitUntil === 'function') contexte.waitUntil(compte);
      else await compte;
    }

    // Tout le reste : les fichiers du dépôt (sites de prospection et page
    // d'appels). Pages s'en charge ; le Worker n'ajoute que le noindex, qui
    // est déjà dans `_headers` mais ne coûte rien à répéter.
    if (!env?.ASSETS) return new Response('aucun fichier', { status: 404 });
    return env.ASSETS.fetch(requete);
  },
};

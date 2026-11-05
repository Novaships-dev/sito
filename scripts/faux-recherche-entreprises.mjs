// Un faux `recherche-entreprises.api.gouv.fr`, servi au-dessus d'une
// population d'entreprises RÉELLES enregistrée une fois
// (`prospection/essais/recherche-entreprises.json`).
//
// Pourquoi : les essais ne doivent pas dépendre du réseau ni d'une API
// publique qui bouge (la CI tournerait rouge un jour de maintenance de
// data.gouv.fr, sans qu'une ligne de Sitô ait changé). Mais un faux qui serait
// plus gentil que le vrai ne prouverait rien. Celui-ci reproduit **ce qui a
// été mesuré** le 24 octobre 2026 (journal du jour), et notamment :
//
//   - un **paramètre inconnu est ignoré en silence**, sans erreur, comme si
//     aucun filtre n'avait été posé (`departement_siege=13` rend 10 000
//     résultats là où `departement=13` en rend 4 019). C'est le piège que
//     `extraire.mjs` doit débusquer ;
//   - `departement=13` garde toute entreprise ayant **au moins un
//     établissement** dans le 13, siège ailleurs compris ;
//   - une **valeur** invalide de `activite_principale` rend un 400 qui liste
//     les valeurs valables ;
//   - `per_page` au-delà de 25 rend un 400, et `page × per_page` au-delà de
//     10 000 aussi ;
//   - `total_results` est plafonné à 10 000.
//
// `ignorer` sert aux essais du garde-fou : un faux qui fait exprès d'ignorer
// `departement` doit faire refuser l'extraction, pas la laisser passer.
export const PER_PAGE_MAX = 25;
export const PLAFOND = 10000;
const CODE_APE = /^\d{2}\.\d{2}[A-Z]$/;

// Les filtres que le vrai serveur connaît. Tout le reste est ignoré.
const FILTRES = {
  // Recherche libre : un SIREN rend cette entreprise ; un mot, les noms qui le portent.
  q: (e, v) => (/^\d{9}$/.test(v) ? e.siren === v : String(e.nom_complet || '').toLowerCase().includes(v.toLowerCase())),
  activite_principale: (e, v) => v.split(',').includes(e.activite_principale),
  // Volontairement sur TOUS les établissements, comme le vrai.
  departement: (e, v) => (e.departements_etablissements || []).includes(v),
  etat_administratif: (e, v) => e.etat_administratif === v,
  tranche_effectif_salarie: (e, v) => v.split(',').includes(e.tranche_effectif_salarie),
  est_rge: (e, v) => Boolean(e.complements?.est_rge) === (v === 'true'),
};

const reponse = (statut, corps) => ({
  ok: statut < 300,
  status: statut,
  json: async () => corps,
  text: async () => JSON.stringify(corps),
});

// Rend une fonction utilisable comme `fetch`, et la liste des adresses vues
// (`vues`), pour que les essais mesurent la requête réellement envoyée.
export function fauxRecherche(entreprises, { ignorer = [] } = {}) {
  const vues = [];
  const faux = async function (url) {
    const u = new URL(url);
    const p = u.searchParams;
    vues.push(u.search);

    const perPage = Number(p.get('per_page') ?? 10);
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > PER_PAGE_MAX)
      return reponse(400, { erreur: `Veuillez indiquer un paramètre \`per_page\` entre \`1\` et \`${PER_PAGE_MAX}\`, par défaut \`10\`.` });
    const page = Number(p.get('page') ?? 1);
    if (!Number.isInteger(page) || page < 1)
      return reponse(400, { erreur: 'Veuillez indiquer un paramètre `page` valide.' });
    if (page * perPage > PLAFOND)
      return reponse(400, { erreur: `Le nombre total de résultats est restreint à ${PLAFOND}.` });
    for (const code of (p.get('activite_principale') || '').split(',').filter(Boolean))
      if (!CODE_APE.test(code))
        return reponse(400, { erreur: 'Au moins un paramètre `activite_principale` est non valide. Les valeurs valides : [\'01.11Z\', ...]' });

    let lot = entreprises;
    for (const [cle, valeur] of p) {
      if (!FILTRES[cle] || ignorer.includes(cle)) continue; // inconnu : ignoré en silence
      lot = lot.filter((e) => FILTRES[cle](e, valeur));
    }
    const total = Math.min(lot.length, PLAFOND);
    const debut = (page - 1) * perPage;
    return reponse(200, {
      results: lot.slice(debut, debut + perPage),
      total_results: total,
      page, per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    });
  };
  faux.vues = vues;
  return faux;
}

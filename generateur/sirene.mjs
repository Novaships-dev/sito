// Faits publics. Ce module ne complete jamais un trou : ce que la base ne dit
// pas ressort comme non renseigne, et la page l affiche tel quel.
const FORMES = { '5499': 'SARL, société à responsabilité limitée', '5710': 'SAS, société par actions simplifiée',
  '5720': 'SASU, société par actions simplifiée à associé unique', '1000': 'Entrepreneur individuel',
  '5498': 'SARL unipersonnelle', '5485': 'SARL' };
const APE = { '43.34Z': 'travaux de peinture et vitrerie', '43.33Z': 'travaux de revêtement des sols et des murs',
  '43.99C': 'travaux de maçonnerie générale et gros œuvre', '43.99D': 'autres travaux spécialisés de construction',
  '43.91B': 'travaux de couverture par éléments', '43.29B': 'autres travaux d installation' };
const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

export function normaliser(brut) {
  const s = brut.siege || {};
  const d = brut.date_creation ? new Date(brut.date_creation) : null;
  const espace = (n, t) => String(n).replace(new RegExp(`(.{${t}})(?=.)`, 'g'), '$1 ');
  return {
    siren: brut.siren,
    sirenLisible: espace(brut.siren, 3),
    denomination: brut.nom_raison_sociale || brut.nom_complet,
    nomLisible: lisible(brut.nom_raison_sociale || brut.nom_complet),
    siret: s.siret || null,
    siretLisible: s.siret ? espace(s.siret.slice(0, 9), 3) + ' ' + s.siret.slice(9) : null,
    adresse: s.adresse ? capitaliser(s.adresse) : null,
    commune: s.libelle_commune ? capitaliser(s.libelle_commune) : null,
    codePostal: s.code_postal || null,
    forme: FORMES[brut.nature_juridique] || null,
    dateCreation: brut.date_creation || null,
    dateLisible: d ? `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : null,
    anneeCreation: d ? d.getUTCFullYear() : null,
    ape: brut.activite_principale || null,
    apeLibelle: APE[brut.activite_principale] || null,
    effectif: brut.tranche_effectif_salarie && brut.tranche_effectif_salarie !== 'NN' ? brut.tranche_effectif_salarie : null,
    rge: brut.complements && typeof brut.complements.est_rge === 'boolean' ? brut.complements.est_rge : null,
  };
}
const petits = new Set(['de','du','des','la','le','les','et','a','au','aux','en','sur','sous']);
function lisible(nom) {
  return String(nom).toLowerCase().split(/\s+/)
    .map((m, i) => petits.has(m) && i > 0 ? m : m.charAt(0).toUpperCase() + m.slice(1))
    .join(' ')
    .replace(/\bFacade/g, 'Façade').replace(/\bFacades/g, 'Façades');
}
function capitaliser(t) {
  return String(t).toLowerCase().split(' ')
    .map((m, i) => petits.has(m) && i > 0 ? m : m.charAt(0).toUpperCase() + m.slice(1))
    .join(' ');
}

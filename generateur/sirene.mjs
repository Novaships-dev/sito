// Faits publics. Ce module ne complete jamais un trou : ce que la base ne dit
// pas ressort comme non renseigne, et la page l affiche tel quel.
const FORMES = { '5499': 'SARL, société à responsabilité limitée', '5710': 'SAS, société par actions simplifiée',
  '5720': 'SASU, société par actions simplifiée à associé unique', '1000': 'Entrepreneur individuel',
  '5498': 'SARL unipersonnelle', '5485': 'SARL' };
// Libellés de la nomenclature NAF rév. 2 (Insee). Chaque code d une fiche métier
// doit y être : scripts/verifier-depot.mjs le contrôle.
export const APE = { '43.34Z': 'travaux de peinture et vitrerie', '43.33Z': 'travaux de revêtement des sols et des murs',
  '43.99C': 'travaux de maçonnerie générale et gros œuvre', '43.99D': 'autres travaux spécialisés de construction',
  '43.91B': 'travaux de couverture par éléments', '43.29B': 'autres travaux d installation',
  '43.29A': 'travaux d’isolation', '43.91A': 'travaux de charpente', '43.99A': 'travaux d’étanchéité',
  '43.12A': 'travaux de terrassement courants et travaux préparatoires', '43.21A': 'travaux d’installation électrique dans tous locaux',
  '43.22A': 'travaux d’installation d’eau et de gaz en tous locaux',
  '43.22B': 'travaux d’installation d’équipements thermiques et de climatisation', '43.31Z': 'travaux de plâtrerie',
  '43.32A': 'travaux de menuiserie bois et PVC', '43.32B': 'travaux de menuiserie métallique et serrurerie',
  '25.11Z': 'fabrication de structures métalliques et de parties de structures', '81.30Z': 'services d’aménagement paysager' };
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
// La base écrit en majuscules sans accents : les mots du métier retrouvent
// les leurs (« Maconnerie » sur un site de maçon se voit tout de suite).
const ACCENTS = { facade: 'façade', facades: 'façades', facadier: 'façadier', facadiers: 'façadiers',
  maconnerie: 'maçonnerie', macon: 'maçon', macons: 'maçons', etancheite: 'étanchéité',
  platrerie: 'plâtrerie', platrier: 'plâtrier', batiment: 'bâtiment', batiments: 'bâtiments',
  renovation: 'rénovation', renovations: 'rénovations', decoration: 'décoration', revetement: 'revêtement',
  revetements: 'revêtements', electricite: 'électricité', energie: 'énergie', cheminee: 'cheminée',
  cheminees: 'cheminées', crepi: 'crépi', crepis: 'crépis', freres: 'frères', pere: 'père', generale: 'générale' };
const FORMES_JURIDIQUES = /(^|\s)(sasu|sas|sarlu|sarl|eurl|earl|sci|snc|sa|ei|eirl|scop)(?=\s|$)/gi;
const mot = (m, i) => {
  const a = ACCENTS[m] || m;
  return petits.has(a) && i > 0 ? a : a.charAt(0).toUpperCase() + a.slice(1);
};
// Une casse déjà mêlée (« Septèmes-les-Vallons ») vient d'une source qui
// sait l'écrire : on la garde. Seul le tout-majuscules se refait.
const enMajuscules = (t) => t === t.toUpperCase();
function casse(t) {
  return String(t).toLowerCase().split(' ')
    .map((m, i) => m.split('-').map((p, j) => mot(p, i + j)).join('-'))
    .join(' ');
}
// « RAISON (NOM COMMERCIAL) » : la parenthèse qui répète le nom part, avec
// la forme juridique (lot du 28 oct. 2026 : « Sasu Bmav Maconnerie (sasu
// Bmav Maconnerie) »).
function lisible(nom) {
  let n = String(nom).replace(/\s+/g, ' ').trim();
  const sans = (t) => t.replace(FORMES_JURIDIQUES, ' ').replace(/\s+/g, ' ').trim();
  const p = n.match(/^(.*?)\s*\(([^()]*)\)(?:\s*\([^()]*\))*$/);
  if (p && sans(p[1]).toUpperCase() === sans(p[2]).toUpperCase()) n = p[1];
  n = sans(n) || n;
  return enMajuscules(n) ? casse(n) : n;
}
function capitaliser(t) {
  const n = String(t).replace(/\s+/g, ' ').trim();
  // « MARSEILLE 13EME » : l'arrondissement n'est pas le nom de la commune.
  const sans = n.replace(/^(marseille|lyon|paris)\s+\d{1,2}\s*(e|er|eme|ème)$/i, '$1');
  return enMajuscules(sans) ? casse(sans) : sans;
}

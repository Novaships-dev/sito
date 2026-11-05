// Les mentions légales d'un site d'abonné, communes aux quatre archétypes
// (tâche T50, constat S-004, spécification docs/specs/S-MENTIONS.md).
//
// Un site d'abonné est fabriqué avec `--publication` : il gagne une page
// `mentions-legales.html`, un lien vers elle dans le pied de chaque page, et
// les coordonnées du médiateur près du contact (R. 616-1 du Code de la
// consommation : « de manière visible et lisible »). Un site de prospection
// n'en a pas (privé, non publié au nom de l'artisan : spécification, §2).
//
// Rien n'est inventé ni déduit (MP5) : pas de capital supposé, pas de TVA
// calculée depuis le SIREN. Une valeur absente se dit « Non renseigné » ; une
// mention obligatoire pour tous qui manque (ML1, ML4, ML5, ML6, ML8, ML9)
// arrête la fabrication (MP4) : mieux vaut pas de site qu'un site hors la loi.
//
// Chaque ligne porte `data-ml="MLn"` : `scripts/verifier-site.mjs` les cherche.

import { html as ech } from '../echapper.mjs';

// L'hébergeur des sites d'abonnés (Worker et R2). Relevé le 3 novembre 2026
// dans le dépôt de Cloudflare à la SEC (formulaire 10-K, « Business Address »).
// Source unique : docs/SOURCE-UNIQUE.md.
export const HEBERGEUR = {
  nom: 'Cloudflare, Inc.',
  adresse: '101 Townsend Street, San Francisco, CA 94107, États-Unis',
  telephone: '+1 888 993 5273',
};

// Les mentions que la loi demande à tout site professionnel (MP4).
export const OBLIGATOIRES = ['ML1', 'ML4', 'ML5', 'ML6', 'ML8', 'ML9'];

const EI = '1000';
const NON = 'Non renseigné';

// Le directeur de la publication : celui que l'artisan a saisi, sinon le
// représentant légal donné par l'annuaire (dirigeant personne physique), sinon
// l'entrepreneur lui-même pour une entreprise individuelle. Jamais deviné.
function directeur(brut, m, ei, e) {
  if (m.directeur_publication && String(m.directeur_publication).trim()) return String(m.directeur_publication).trim();
  const d = (brut.dirigeants || []).find((x) => x && x.type_dirigeant === 'personne physique' && x.nom);
  if (d) return [d.prenoms, d.nom].filter(Boolean).join(' ').trim();
  if (ei && e.denomination) return e.denomination;
  return null;
}

// Rassemble les mentions. Rend { lignes, manque } ; `manque` liste les
// mentions obligatoires absentes, par leur numéro et leur nom.
export function rassembler({ brut, e, tel }) {
  const m = brut.mentions || {};
  const ei = brut.nature_juridique === EI;
  const lignes = [];
  const manque = [];
  const ligne = (ml, titre, valeur, { obligatoire = false } = {}) => {
    const vide = valeur === null || valeur === undefined || String(valeur).trim() === '';
    if (vide && obligatoire) manque.push(`${ml} ${titre}`);
    lignes.push({ ml, titre, valeur: vide ? NON : String(valeur), vide });
  };

  ligne('ML1', 'Dénomination', e.denomination ? e.denomination + (ei ? ', entrepreneur individuel (EI)' : '') : null, { obligatoire: true });
  if (!ei) {
    ligne('ML2', 'Forme juridique', e.forme);
    ligne('ML3', 'Capital social', m.capital_social);
  }
  const siege = [e.adresse, [e.codePostal, e.commune].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  ligne('ML4', 'Siège', e.adresse ? siege : null, { obligatoire: true });
  ligne('ML5', 'Téléphone', tel ? tel.lisible : null, { obligatoire: true });
  ligne('ML5', 'Adresse électronique', m.courriel, { obligatoire: true });
  ligne('ML6', 'Immatriculation', m.immatriculation
    || (e.siren ? `SIREN ${e.sirenLisible}, registre national des entreprises (RNE)` : null), { obligatoire: true });
  if (e.siretLisible) ligne('ML6', 'SIRET du siège', e.siretLisible);
  if (m.tva_intra) ligne('ML7', 'TVA intracommunautaire', m.tva_intra);
  ligne('ML9', 'Éditeur du site', e.denomination, { obligatoire: true });
  ligne('ML9', 'Directeur de la publication', directeur(brut, m, ei, e), { obligatoire: true });
  ligne('ML8', 'Hébergeur', `${HEBERGEUR.nom}, ${HEBERGEUR.adresse}, téléphone ${HEBERGEUR.telephone}`, { obligatoire: true });
  ligne('ML10', 'Médiateur de la consommation', m.mediateur_nom);
  ligne('ML10', 'Adresse du médiateur', m.mediateur_adresse);
  ligne('ML10', 'Site du médiateur', m.mediateur_site);
  if (m.decennale_assureur || m.decennale_contrat || m.decennale_zone) {
    ligne('MR1', 'Assurance décennale, assureur', m.decennale_assureur);
    ligne('MR1', 'Numéro de contrat', m.decennale_contrat);
    ligne('MR1', 'Zone couverte', m.decennale_zone);
  }
  return { lignes, manque, mediateur: { nom: m.mediateur_nom || null, adresse: m.mediateur_adresse || null, site: m.mediateur_site || null } };
}

const valeur = (l) => l.vide ? `<td class="vide">${NON}</td>`
  : /^https:\/\//.test(l.valeur) ? `<td><a href="${ech(l.valeur)}">${ech(l.valeur)}</a></td>`
  : `<td>${ech(l.valeur)}</td>`;

// Le titre de l'onglet. « Mentions légales » avant le h1 ferait rougir C3 de
// verifier-site (une mention légale avant le titre) : l'onglet dit autre chose.
export const TITRE = 'informations légales';

// Le contenu de la page `mentions-legales.html` (remplace <main>). `barre` :
// la barre d'appel, que chaque page garde (contrôle T2).
export function page({ lignes, e, barre = '', appel = '', formulaire = false, ml12 = 'Ce site ne dépose aucun cookie ni aucun traceur.' }) {
  let n = 0;
  const groupe = (titre, ids, apres = '') => {
    const ls = lignes.filter((l) => ids.includes(l.ml));
    if (!ls.length && !apres) return '';
    n++;
    return `<section class="verifiable mentions" aria-labelledby="t-ml-${n}">
  <div class="tete"><h2 id="t-ml-${n}" class="moyen">${titre}</h2></div>
  ${ls.length ? `<table class="faits"><tbody>
      ${ls.map((l) => `<tr data-ml="${l.ml}"><th scope="row">${ech(l.titre)}</th>${valeur(l)}</tr>`).join('\n      ')}
  </tbody></table>` : ''}${apres}
</section>`;
  };
  return `<section class="verifiable mentions" aria-labelledby="t-mentions">
  <div class="tete"><p class="enseigne">${ech(e.nomLisible)}</p>
    <h1 id="t-mentions" class="grand" style="font-size:clamp(40px,6vw,72px)">Mentions légales</h1>
    <p class="note">Les informations sur l’entreprise viennent de l’annuaire des entreprises (base Sirene) et de ce qu’elle a déclaré. Une ligne marquée « ${NON} » n’a pas été fournie.</p>
    <p class="note"><a href="index.html">Retour à l’accueil</a></p>
    ${appel}</div>
</section>
${groupe('L’entreprise', ['ML1', 'ML2', 'ML3', 'ML4', 'ML6', 'ML7'])}
${groupe('Nous joindre', ['ML5'])}
${groupe('Publication et hébergement', ['ML9', 'ML8'])}
${groupe('Médiation de la consommation', ['ML10'])}
${groupe('Assurance', ['MR1'])}
${groupe('Données personnelles', [], `
  ${formulaire ? `<p class="note" data-ml="ML11">Le formulaire de demande recueille votre nom, votre téléphone ou votre adresse électronique, et votre message. L’entreprise ci-dessus en est responsable et s’en sert seulement pour vous répondre, parce que vous le lui demandez (mesures préalables à un contrat, article 6.1.b du RGPD) ; personne d’autre ne les reçoit. Ils sont hébergés pour elle par Sitô chez Supabase (serveurs dans l’Union européenne), gardés tant que l’entreprise utilise Sitô, et effacés à la fermeture de son compte. Pour limiter les envois abusifs, une empreinte de votre adresse IP est gardée deux jours, jamais l’adresse elle-même. Vous pouvez demander à l’entreprise d’accéder à vos données, de les corriger ou de les effacer, et saisir la CNIL (cnil.fr) pour toute réclamation.</p>` : `<p class="note" data-ml="ML11">Ce site n’a ni formulaire ni compte : il ne recueille aucune donnée personnelle vous concernant. Si vous écrivez ou téléphonez à l’entreprise, elle seule garde ce que vous lui transmettez. Vous pouvez saisir la CNIL (cnil.fr) pour toute réclamation.</p>`}
  <p class="note" data-ml="ML12">${ech(ml12)}</p>`)}
${barre}`;
}

// Les coordonnées du médiateur près du contact, sur l'accueil (MP3).
export function pres({ mediateur }) {
  if (!mediateur.nom) return `<p class="note" data-ml="ML10">Médiateur de la consommation : ${NON}.</p>`;
  const morceaux = [ech(mediateur.nom), mediateur.adresse ? ech(mediateur.adresse) : null,
    mediateur.site ? `<a href="${ech(mediateur.site)}">${ech(mediateur.site)}</a>` : null].filter(Boolean);
  return `<p class="note" data-ml="ML10">Médiateur de la consommation : ${morceaux.join(', ')}.</p>`;
}

// Le lien du pied de page, sur chaque page (MP1).
export const LIEN = '<p class="note"><a href="mentions-legales.html" data-ml-lien>Mentions légales</a></p>';

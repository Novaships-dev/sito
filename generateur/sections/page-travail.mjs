// La deuxieme page (« le travail en detail ») des archetypes panneau, planche
// et elevation (T52, constat S-012). L archetype matiere a la sienne
// (`archetypes/matiere.mjs`, corpsTravail) ; celle-ci reprend les blocs de la
// page d accueil (postes, chantier, contact, barre d appel), poses sous un
// bandeau de titre que chaque archetype compose a sa facon.
//
// Le titre de premier rang tient sa place sur telephone (verifier-mobile, M2 :
// 14 % de la hauteur ou 86 % de la largeur) : constat S-025, vu sur matiere.
import { html as ech } from '../echapper.mjs';

export const FICHIER = 'le-travail.html';
export const LIEN = { href: FICHIER, texte: 'Le travail en détail' };
export const TITRE = 'Le travail, poste par poste.';

// Le mot du metier, tel que le client le dit : « ravalement », « couverture »,
// « peinture ». Jamais ecrit en dur (la page disait « ravalement » sur un site
// de couverture).
export const motMetier = (base) => String(base.libelle || '').split(' ')[0].toLowerCase();
export const phrase = (base) =>
  `Ce que recouvre exactement le mot ${motMetier(base)}, dans l’ordre où les postes se font.`;

// La barre du haut : retour a l accueil, toujours la ; le SIREN et l appel.
export function etat({ e, appelLien = '' }) {
  const jeton = (contenu, point) =>
    `<span class="jeton">${point ? '<span class="point"></span>' : ''}${contenu}</span>`;
  return `<div class="etat">
  <span class="gauche">
  ${jeton(`<b>${ech(e.nomLisible)}</b>`, true)}
  ${e.commune ? jeton(ech(e.commune)) : ''}
  </span>
  <span class="droite">
    <a class="jeton lien" href="index.html">Retour</a>
    ${jeton(`SIREN <b>${ech(e.sirenLisible)}</b>`)}
    ${appelLien}
  </span>
</div>`;
}

// Le bandeau de titre. `vue` est la photo deja rendue (img du composeur), avec
// son marqueur « Exemple » s il y a lieu.
export function bandeau({ archetype, e, base, vue }) {
  return `<section class="tete-travail tt-${archetype}" aria-labelledby="t-detail">
  <div class="vue">${vue}</div>
  <div class="dit">
    <p class="enseigne">${ech(base.libelle)}${e.commune ? ', ' + ech(e.commune) : ''}</p>
    <h1 id="t-detail" class="titre-travail">${ech(TITRE)}</h1>
    <p class="phrase">${ech(phrase(base))}</p>
  </div>
</section>`;
}

// Trois compositions, une par archetype : la photo a cote du titre (panneau),
// la photo pleine largeur puis le titre (planche), le titre puis la photo
// decalee (elevation).
export function feuille() {
  return `
/* ---------------------------------------------------------------- deuxieme page */
.tete-travail{position:relative;display:grid;border-bottom:1px solid var(--voile-2)}
.tete-travail .vue{position:relative;overflow:hidden;min-width:0}
.tete-travail .vue img{width:100%;height:100%;object-fit:cover}
.tete-travail .dit{min-width:0;padding:clamp(36px,5vw,86px) var(--marge) clamp(30px,3.4vw,56px)}
.tete-travail .enseigne{color:var(--t2)}
.titre-travail{font-family:var(--titre-police);font-weight:700;letter-spacing:-.022em;line-height:.96;
  margin:.6rem 0 .9rem;text-wrap:balance;overflow-wrap:break-word;font-size:clamp(52px,6.4vw,112px)}
.tete-travail .phrase{color:var(--t2);max-width:44ch;font-size:clamp(15px,1.15vw,18px)}
.tt-panneau{grid-template-columns:minmax(0,1fr) minmax(0,1fr);background:var(--encre);color:var(--t)}
.tt-panneau .dit{display:flex;flex-direction:column;justify-content:flex-end;border-right:1px solid var(--voile-2)}
.tt-panneau .vue img{aspect-ratio:4/3}
.tt-planche{grid-template-columns:minmax(0,1fr)}
.tt-planche .vue img{aspect-ratio:21/9;max-height:62svh}
.tt-planche .titre-travail{max-width:14ch}
.tt-elevation{grid-template-columns:minmax(0,7fr) minmax(0,5fr);align-items:end}
.tt-elevation .dit{order:1}
.tt-elevation .vue{order:2;margin:clamp(24px,4vw,64px) var(--marge) 0 0}
.tt-elevation .vue img{aspect-ratio:3/4}
.tt-elevation .vue::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--accent)}
@media (max-width:900px){
  /* Sur telephone : la photo, puis un titre qui tient la largeur (M2). */
  .tete-travail,.tt-panneau,.tt-elevation{grid-template-columns:minmax(0,1fr)}
  .tete-travail .vue{order:1;margin:0}
  .tete-travail .vue img{aspect-ratio:16/10;height:auto}
  .tete-travail .dit{order:2;border:0;padding-top:clamp(22px,3vw,36px)}
  .titre-travail{font-size:clamp(48px,14.5vw,76px);max-width:none}
  .tt-planche .titre-travail{max-width:none}
  .jeton.lien{min-height:44px;padding:0 14px}
}`;
}

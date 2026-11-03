// Appeler l entreprise, commun aux quatre archetypes.
//
// Regle : rules/web/client.md, « le numero est atteignable au pouce en
// permanence ». Jusqu au 2 octobre 2026, seul l archetype matiere avait une
// barre d appel, et son bouton pointait vers « tel: » vide ; les trois autres
// n avaient rien. Aucun verificateur ne le voyait.
//
// Le numero vient de l artisan, par l app, et de nulle part ailleurs : il ne
// figure dans aucune source publique que nous lisons, et Fabrice a tranche le
// 2 octobre que l artisan choisit. Tant qu il ne l a pas donne, la page montre
// un emplacement visible et designe, jamais un lien qui ne compose rien.
//
// Ce qui change d un site a l autre : la forme du bouton, son libelle, le cote
// du nom dans la barre. Tire d une graine a part, pour ne rien deplacer dans
// les autres tirages.

import { CONTEXTES } from '../charte.mjs';
import { moinsPris } from '../graine.mjs';

export const FORMES = ['plein', 'contour', 'pastille'];
export const LIBELLES = ['Appeler', 'Téléphoner', 'Appeler l’entreprise'];
export const PLACES = ['nom-gauche', 'nom-droite'];

export function tirer(g, voisins = []) {
  const libre = (liste, cle) => moinsPris(g, liste,
    voisins.filter(v => v && v[cle]).map(v => ({ valeur: v[cle], poids: v.poids || 1 })));
  return { forme: libre(FORMES, 'forme'), libelle: libre(LIBELLES, 'libelle'), place: g.choisir(PLACES) };
}

// Un numero francais, fixe ou mobile, sous toutes ses ecritures courantes.
// Un numero donne mais invalide arrete la fabrication : mieux vaut pas de site
// qu un bouton qui compose un faux numero.
export function telephone(brut) {
  if (brut === undefined || brut === null || String(brut).trim() === '') return null;
  let n = String(brut).replace(/[\s.\-()]/g, '');
  if (n.startsWith('+33')) n = '0' + n.slice(3);
  else if (n.startsWith('0033')) n = '0' + n.slice(4);
  if (n.startsWith('0') && n[1] === '0') throw new Error('numero de telephone invalide : ' + brut);
  if (!/^0[1-9]\d{8}$/.test(n)) throw new Error('numero de telephone invalide : ' + brut);
  return { lisible: n.replace(/(\d{2})(?=\d)/g, '$1 '), lien: 'tel:+33' + n.slice(1) };
}

import { html as ech } from '../echapper.mjs';

// Le bouton. Sans numero : un emplacement, pas un lien.
// `seulNumero` : dans la pastille du haut, le numero seul. Avec le libelle,
// le bouton doublait de largeur et faisait passer la pastille sur deux lignes
// (controle O15, 2 octobre 2026).
export function lien({ tel, ap, classe = '', numero = true, seulNumero = false }) {
  if (!tel) return `<span class="appel attente ${classe}" data-appel="attente">Votre numéro ici</span>`;
  if (seulNumero) return `<a class="appel ${ap.forme} ${classe}" href="${tel.lien}" data-appel="numero" aria-label="${ech(ap.libelle)}, ${tel.lisible}"><span class="numero">${tel.lisible}</span></a>`;
  return `<a class="appel ${ap.forme} ${classe}" href="${tel.lien}" data-appel="numero">${ech(ap.libelle)}${
    numero ? ` <span class="numero">${tel.lisible}</span>` : ''}</a>`;
}

// La barre fixe du telephone.
export function barre({ e, tel, ap }) {
  return `<div class="barre-appel ${ap.place}" role="region" aria-label="Joindre l’entreprise">
  <span class="qui">${ech(e.nomLisible)}</span>
  ${lien({ tel, ap, classe: 'appel-barre', numero: false })}
</div>`;
}

// Le numero en grand, dans la section contact.
export function enGrand({ tel }) {
  if (!tel) return `<p class="gros-tel attente" data-appel="attente">Votre numéro ici</p>`;
  return `<p class="gros-tel"><a href="${tel.lien}" data-appel="numero">${tel.lisible}</a></p>`;
}

export function feuille() {
  return `
/* ---------------------------------------------------------------- appel
   La barre fixe en bas sur telephone, le bouton dans la pastille du haut sur
   ordinateur. Hauteur de la barre : une variable, que le premier ecran
   retranche pour ne rien cacher dessous. */
:root{--barre-h:calc(66px + env(safe-area-inset-bottom, 0px))}
.appel{display:inline-flex;align-items:center;justify-content:center;gap:.6ch;min-height:48px;
  padding:0 18px;font-family:var(--texte-police);font-weight:700;font-size:15px;line-height:1.1;
  text-decoration:none;white-space:nowrap;border-radius:var(--rayon, 2px);
  transition:transform .28s var(--sortie, ease), background .25s var(--sortie, ease)}
.appel .numero{font-weight:500;font-variant-numeric:tabular-nums}
.appel.plein{background:var(--accent);color:var(--sur-accent)}
.appel.contour{background:transparent;color:var(--t);border:2px solid var(--accent)}
.appel.pastille{background:var(--t);color:var(--nuit);border-radius:99px}
.appel.attente{background:transparent;color:var(--t);border:2px dashed var(--t2);font-weight:600}
.gros-tel{font-family:var(--titre-police);font-weight:800;font-size:clamp(28px,4vw,56px);line-height:1;
  letter-spacing:-.02em;color:var(--ta);margin:clamp(12px,1.6vw,22px) 0 .7rem}
.gros-tel a{color:inherit;text-decoration:none;font-variant-numeric:tabular-nums}
.gros-tel.attente{color:var(--t2)}
.etat .appel{min-height:36px;padding:0 14px;font-size:13px}
.barre-appel{${CONTEXTES.sol};position:fixed;left:0;right:0;bottom:0;z-index:60;display:none;
  align-items:center;gap:12px;min-height:var(--barre-h);
  padding:8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
  background:var(--nuit);border-top:var(--fil, 1px solid var(--voile-2))}
.barre-appel.nom-droite{flex-direction:row-reverse}
.barre-appel.nom-droite .qui{text-align:right}
.barre-appel .qui{flex:1 1 auto;min-width:0;font-weight:600;font-size:13px;color:var(--t);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.barre-appel .appel{flex:0 0 auto}
@media (max-width:900px){
  .barre-appel{display:flex}
  body{padding-bottom:var(--barre-h)}
  .etat .appel{display:none}
}
@media print{.barre-appel{display:none}}`;
}

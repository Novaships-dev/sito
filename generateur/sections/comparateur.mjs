// Variantes du comparateur avant / apres.
//
// Le 24 septembre 2026, les trois sites avaient le meme comparateur : meme
// poignee, memes etiquettes au meme endroit, meme invitation « Glissez ou
// touchez ». La mecanique ne change pas — c est un input range natif, regle V4
// de mouvement.md, et les verificateurs O et M l essaient a chaque fois. Ce
// qui change, c est sa forme.

// Le 2 octobre 2026, cent sites d un meme metier par departement (decision de
// Fabrice) : douze combinaisons ne suffisaient plus. Six poignees, dix
// invitations, deux places d etiquettes : cent vingt comparateurs.
export const PRISES = ['barre', 'rond', 'fil', 'losange', 'double', 'carre'];
export const ETIQUETTES = ['haut', 'bas'];
export const INDICES = ['Glissez ou touchez', 'Faites glisser le trait', 'Touchez pour comparer',
  'Déplacez la séparation', 'Glissez pour voir l’avant', 'Touchez la photo', 'Faites glisser',
  'Comparez d’un geste', 'Avant, après : glissez', 'Glissez le trait'];

import { moinsPris } from '../graine.mjs';

// Le comparateur se tire d un bloc : la combinaison la moins prise par les
// voisins. Tirer chaque piece a part laissait deux voisins tomber sur la meme
// combinaison alors qu il en restait de libres.
export function tirer(g, voisins = []) {
  const cle = (c) => c.prise + '|' + c.indice + '|' + (c.etiquettes || 'haut');
  const toutes = [];
  for (const prise of PRISES) for (const indice of INDICES) for (const etiquettes of ETIQUETTES)
    toutes.push({ prise, indice, etiquettes });
  const k = moinsPris(g, toutes.map(cle),
    voisins.filter(v => v && v.prise).map(v => ({ valeur: cle(v), poids: v.poids || 1 })));
  return toutes.find(c => cle(c) === k);
}

// Applique la variante au HTML produit, quel que soit l archetype qui l a ecrit.
export function appliquer(html, v) {
  return html
    .replace(/class="comparateur /g, `class="comparateur prise-${v.prise} etiq-${v.etiquettes} `)
    .replace(/<span class="indice">Glissez ou touchez<\/span>/g, `<span class="indice">${v.indice}</span>`);
}

export function feuille() {
  return `
/* ---------------------------------------------------------------- comparateur
   variantes de forme ; la mecanique reste l input range natif */
.prise-rond .cadre .prise{width:46px;height:46px;border-radius:50%;
  box-shadow:0 0 0 1px rgba(0,0,0,.35), 0 6px 18px rgba(0,0,0,.35)}
.prise-rond .cadre .prise::before,.prise-rond .cadre .prise::after{top:50%;bottom:auto;width:0;height:0;
  background:none;border-top:6px solid transparent;border-bottom:6px solid transparent;transform:translateY(-50%)}
.prise-rond .cadre .prise::before{left:9px;border-right:7px solid var(--encre, #222)}
.prise-rond .cadre .prise::after{right:9px;border-left:7px solid var(--encre, #222)}
.prise-fil .cadre .couture{width:4px;margin-left:-1px}
.prise-fil .cadre .prise{width:14px;height:96px;border-radius:7px}
.prise-fil .cadre .prise::before,.prise-fil .cadre .prise::after{display:none}
.prise-losange .cadre .prise{width:34px;height:34px;border-radius:3px;transform:translate(-50%,-50%) rotate(45deg);
  box-shadow:0 0 0 1px rgba(0,0,0,.35), 0 6px 18px rgba(0,0,0,.3)}
.prise-losange .cadre:hover .prise{transform:translate(-50%,-50%) rotate(45deg) scale(1.08)}
.prise-losange .cadre .prise::before,.prise-losange .cadre .prise::after{display:none}
.prise-double .cadre .prise{width:16px;height:72px;background:transparent;box-shadow:none}
.prise-double .cadre .prise::before,.prise-double .cadre .prise::after{top:0;bottom:0;width:4px;
  border-radius:2px;background:var(--chaux);box-shadow:0 0 0 1px rgba(0,0,0,.3)}
.prise-double .cadre .prise::before{left:0}
.prise-double .cadre .prise::after{right:0}
.prise-carre .cadre .prise{width:42px;height:42px;border-radius:var(--rayon, 2px);
  box-shadow:0 0 0 1px rgba(0,0,0,.35), 0 6px 18px rgba(0,0,0,.3)}
.prise-carre .cadre .prise::before,.prise-carre .cadre .prise::after{top:50%;bottom:auto;width:0;height:0;
  background:none;border-top:5px solid transparent;border-bottom:5px solid transparent;transform:translateY(-50%)}
.prise-carre .cadre .prise::before{left:8px;border-right:6px solid var(--encre, #222)}
.prise-carre .cadre .prise::after{right:8px;border-left:6px solid var(--encre, #222)}
/* etiquettes en bas : l invitation remonte au centre du haut, seul endroit
   libre, sinon elle se poserait sur « Apres ». */
.etiq-bas .cadre .etiquette{top:auto;bottom:14px}
.etiq-bas .cadre .indice{left:50%;right:auto;top:14px;bottom:auto;transform:translateX(-50%)}`;
}

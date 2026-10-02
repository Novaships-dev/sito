// Variantes du comparateur avant / apres.
//
// Le 24 septembre 2026, les trois sites avaient le meme comparateur : meme
// poignee, memes etiquettes au meme endroit, meme invitation « Glissez ou
// touchez ». La mecanique ne change pas — c est un input range natif, regle V4
// de mouvement.md, et les verificateurs O et M l essaient a chaque fois. Ce
// qui change, c est sa forme.

export const PRISES = ['barre', 'rond', 'fil'];
export const ETIQUETTES = ['haut', 'bas'];
export const INDICES = ['Glissez ou touchez', 'Faites glisser le trait', 'Touchez pour comparer', 'Déplacez la séparation'];

export function tirer(g, voisins = []) {
  // jamais la poignee ni l invitation d un voisin tant qu il en reste une libre
  const libre = (liste, cle) => {
    const l = liste.filter(x => !voisins.some(v => v && v[cle] === x));
    return g.choisir(l.length ? l : liste);
  };
  return {
    prise: libre(PRISES, 'prise'),
    etiquettes: g.choisir(ETIQUETTES),
    indice: libre(INDICES, 'indice'),
  };
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
/* etiquettes en bas : l invitation remonte au centre du haut, seul endroit
   libre, sinon elle se poserait sur « Apres ». */
.etiq-bas .cadre .etiquette{top:auto;bottom:14px}
.etiq-bas .cadre .indice{left:50%;right:auto;top:14px;bottom:auto;transform:translateX(-50%)}`;
}

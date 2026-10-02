// Graine deterministe tiree du SIREN : le meme SIREN redonne toujours le meme
// site, deux SIREN differents ne tombent pas sur la meme composition.
export function graine(chaine) {
  let h = 2166136261;
  for (let i = 0; i < chaine.length; i++) { h ^= chaine.charCodeAt(i); h = Math.imul(h, 16777619); }
  let e = h >>> 0;
  return {
    suivant() { e = (Math.imul(e, 1664525) + 1013904223) >>> 0; return e / 4294967296; },
    choisir(liste) { return liste[Math.floor(this.suivant() * liste.length) % liste.length]; },
    entre(a, b) { return a + this.suivant() * (b - a); },
    entier(a, b) { return Math.floor(this.entre(a, b + 1)); },
  };
}

// Choisit dans `liste` une valeur parmi les moins prises par les voisins.
// `pris` : des valeurs, ou des { valeur, poids }. Tant qu il en reste une que
// personne n a, c est exactement l ancienne regle « jamais celle d un voisin » ;
// quand tout est pris, on prend la moins courante au lieu de tirer au hasard
// dans tout. Voir generateur/tirage.mjs.
export function moinsPris(g, liste, pris = []) {
  const compte = new Map(liste.map(x => [x, 0]));
  for (const p of pris) {
    const v = p && typeof p === 'object' && 'valeur' in p ? p.valeur : p;
    const w = p && typeof p === 'object' && 'poids' in p ? p.poids : 1;
    if (compte.has(v)) compte.set(v, compte.get(v) + w);
  }
  const min = Math.min(...compte.values());
  return g.choisir(liste.filter(x => compte.get(x) === min));
}

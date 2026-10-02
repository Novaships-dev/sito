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

// L'échappement du générateur, en un seul endroit (constat S-006, tâche T48).
//
// Jusqu'au 3 novembre 2026, trois copies (`composer.mjs`, `archetypes/
// matiere.mjs`, `sections/appel.mjs`) n'échappaient que `&` et `<`. Sans
// faille tant que les textes de l'artisan restaient dans le contenu des
// balises ; mais un nom d'entreprise placé dans un attribut (`data-mot`, et
// bientôt les données structurées de T51) pouvait fermer l'attribut et en
// ouvrir un autre.
//
// `html` : pour le contenu d'une balise ET pour la valeur d'un attribut entre
// guillemets doubles ou simples. `jsonDansPage` : pour un objet placé dans
// <script type="application/ld+json"> : rien ne peut y fermer la balise
// (`</script>`), ouvrir un commentaire (`<!--`) ou couper une ligne en
// JavaScript (U+2028, U+2029).

const ENTITES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function html(t) {
  if (t === undefined || t === null) return '';
  return String(t).replace(/[&<>"']/g, (c) => ENTITES[c]);
}

export function jsonDansPage(objet) {
  const brut = JSON.stringify(objet);
  if (brut === undefined) throw new Error('jsonDansPage : valeur non sérialisable');
  return brut
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

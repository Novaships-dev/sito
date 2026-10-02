// La charte d un site : ce qui fait qu il ne ressemble a aucun autre.
//
// Jusqu au 23 septembre 2026, l unicite ne tenait qu a la disposition : trois
// sites de ravalement a Marseille sortaient avec le meme accent #b08c6f, le
// meme fond presque noir et les memes polices. Seule la grille changeait. L oeil
// voit la couleur et la typo avant la grille : les trois se ressemblaient.
//
// La rotation des sept familles est ecrite dans
// skills/_partage/references/palettes.md depuis le 7 septembre, avec sa regle :
// « si le projet precedent utilisait une famille, celui-ci en utilise une autre.
// Jamais deux fois de suite. » Elle n avait jamais ete appliquee. Ce module
// l applique.
//
// Ce qui se tire de la graine, dans l ordre de ce que l oeil remarque :
//   1. la famille de couleurs, parmi sept, jamais celle d un voisin
//   2. le sol : nuit ou papier
//   3. l appariement de polices, parmi quatre
//   4. la geometrie : angles, filets, etiquettes
//   5. ce que dit le mot geant
//
// L accent reste preleve dans les photos de l artisan : c est lui qui nomme
// l apres. La famille fournit tout le reste. Voir rules/web/design-interdits.md,
// « La famille chaude, prelevee ou interdite ».

import { tirer as tirerComparateur } from './sections/comparateur.mjs';

// Les sept familles de palettes.md, en valeurs. Aucune ne reprend une valeur de
// la famille bannie (beige, laiton, espresso) listee dans ce meme fichier.
export const FAMILLES = [
  { cle: 'luxe-froid', nom: 'luxe froid : gris argent, chrome, fumee',
    nuit: '#101418', encre: '#19202600', chaux: '#E7ECEF', gris: '#8C99A2', papier: '#EFF2F4',
    encreClair: '#151A1F', second: '#9FB0BA' },
  { cle: 'foret', nom: 'foret : vert profond, os, ambre',
    nuit: '#0D1512', encre: '#152019', chaux: '#E9EDE6', gris: '#87948A', papier: '#EFF2ED',
    encreClair: '#111A15', second: '#C9922F' },
  { cle: 'noir-fauve', nom: 'noir et fauve : noir casse, fauve chaud, aucun beige',
    nuit: '#0B0D0E', encre: '#16191B', chaux: '#EDEDEA', gris: '#8E8F8C', papier: '#F0F0EE',
    encreClair: '#121415', second: '#C2703C' },
  { cle: 'cobalt-creme', nom: 'cobalt et creme : bleu sature contre un seul neutre',
    nuit: '#0C1424', encre: '#141E32', chaux: '#E8ECF3', gris: '#828FA6', papier: '#EEF1F6',
    encreClair: '#101827', second: '#1D4ED8' },
  { cle: 'terre-ardoise', nom: 'terre cuite et ardoise : rouille chaude contre gris froid',
    nuit: '#111619', encre: '#1B2226', chaux: '#E6EAEC', gris: '#849098', papier: '#EEF1F2',
    encreClair: '#151B1E', second: '#A5482C' },
  { cle: 'olive-papier', nom: 'olive, brique, papier : olive sourd plus accent brique',
    nuit: '#12140E', encre: '#1D2015', chaux: '#EBEDE4', gris: '#8E9182', papier: '#F0F1E9',
    encreClair: '#171A11', second: '#9A3B2A' },
  { cle: 'mono-vif', nom: 'monochrome plus un accent sature',
    nuit: '#0E0E0E', encre: '#1A1A1A', chaux: '#EFEFEF', gris: '#909090', papier: '#F2F2F2',
    encreClair: '#141414', second: '#0E9F6E' },
];

// Quatre appariements. Les polices sont celles autorisees par la regle 17 de
// design-interdits.md : Archivo, Public Sans, Libre Franklin, Bricolage
// Grotesque. Jamais Inter.
export const POLICES = [
  { cle: 'bricolage', titre: 'Display', texte: 'Texte',
    fichiers: ['bricolage.woff2', 'public-sans.woff2'],
    faces: `@font-face{font-family:"Display";src:url("polices/bricolage.woff2") format("woff2");font-weight:200 800;font-display:swap}
@font-face{font-family:"Texte";src:url("polices/public-sans.woff2") format("woff2");font-weight:100 900;font-display:swap}` },
  { cle: 'archivo-etroit', titre: 'Display', texte: 'Texte',
    fichiers: ['archivo-narrow-700.woff2', 'archivo-wght.woff2'],
    faces: `@font-face{font-family:"Display";src:url("polices/archivo-narrow-700.woff2") format("woff2");font-weight:700;font-display:swap}
@font-face{font-family:"Texte";src:url("polices/archivo-wght.woff2") format("woff2");font-weight:100 900;font-display:swap}` },
  { cle: 'archivo-plein', titre: 'Display', texte: 'Texte',
    fichiers: ['archivo-wght.woff2', 'public-sans.woff2'],
    faces: `@font-face{font-family:"Display";src:url("polices/archivo-wght.woff2") format("woff2");font-weight:100 900;font-display:swap}
@font-face{font-family:"Texte";src:url("polices/public-sans.woff2") format("woff2");font-weight:100 900;font-display:swap}` },
  { cle: 'public-bricolage', titre: 'Display', texte: 'Texte',
    fichiers: ['public-sans.woff2', 'bricolage.woff2'],
    faces: `@font-face{font-family:"Display";src:url("polices/public-sans.woff2") format("woff2");font-weight:100 900;font-display:swap}
@font-face{font-family:"Texte";src:url("polices/bricolage.woff2") format("woff2");font-weight:200 800;font-display:swap}` },
];

// Ce que dit le mot geant. Le mot du metier revient sur tous les sites d un
// meme metier : c est la premiere chose qui les rendait jumeaux.
export const MOTS = ['metier', 'commune', 'enseigne', 'aucun'];

export const GEOMETRIES = [
  { cle: 'vif',     rayon: '0px',  filet: '1px', etiquette: 'plein',   jeton: '2px' },
  { cle: 'adouci',  rayon: '3px',  filet: '1px', etiquette: 'contour', jeton: '99px' },
  { cle: 'rond',    rayon: '10px', filet: '2px', etiquette: 'plein',   jeton: '99px' },
];

// Tirage. `pris` est ce que les voisins ont deja : meme commune, meme metier.
// Une famille deja prise n est jamais reprise ; c est la regle de rotation.
export function tirer(g, pris = {}) {
  const libre = (liste, cle, deja) => {
    const l = liste.filter(x => !(deja || []).includes(x[cle] || x));
    return g.choisir(l.length ? l : liste);
  };
  const famille = libre(FAMILLES, 'cle', pris.familles);
  const polices = libre(POLICES, 'cle', pris.polices);
  const geo = g.choisir(GEOMETRIES);
  // Le sol clair reste minoritaire : une page de chantier se lit mieux sombre,
  // et un site sur deux en papier ferait une nouvelle uniformite.
  const sol = g.suivant() < 0.34 ? 'papier' : 'nuit';
  const mot = libre(MOTS.map(x => ({ cle: x })), 'cle', pris.mots).cle;
  // La structure se tire plusieurs fois et garde le tirage le plus eloigne des
  // voisins : trois sites qui ont tous prix et estimateur se lisent pareil,
  // meme si leurs sections ne sont pas dans le meme ordre.
  const voisines = pris.structures || [];
  let structure = structurer(g), meilleur = Infinity;
  for (let essai = 0; essai < 10 && voisines.length; essai++) {
    const c = essai === 0 ? structure : structurer(g);
    const d = voisines.reduce((a, v) => a + ressemblance(c, v), 0);
    if (d < meilleur) { meilleur = d; structure = c; }
  }
  // Le nuancier : quatre ou cinq teintes tirees du vivier du metier, dans un
  // ordre qui n est pas celui du fichier. Cinq teintes identiques sur trois
  // sites, c est une signature de gabarit de plus.
  const teintes = { combien: 4 + Math.floor(g.suivant() * 2), depart: Math.floor(g.suivant() * 7) };
  const comparateur = tirerComparateur(g, pris.comparateurs || []);
  return { famille, polices, geo, sol, mot, structure, teintes, comparateur };
}

function ressemblance(a, b) {
  let n = 0;
  for (const k of ['prix', 'avis', 'estimateur', 'page2', 'nuancierPlace']) if (a[k] === b[k]) n++;
  if (a.ordre.join() === b.ordre.join()) n += 3;
  return n;
}

// La structure de la page. Deux sites qui montrent les memes sections dans le
// meme ordre se lisent pareil, quelles que soient leurs couleurs. Trois pieces
// sont facultatives, l ordre du milieu se tire, et le debut comme la fin ne
// bougent pas : on ouvre toujours sur le chantier et on finit toujours par
// pouvoir joindre l entreprise.
export function structurer(g) {
  const tete = ['ouverture', 'coupure'];
  const queue = ['verifiable', 'contact'];
  // Facultatives : un site qui a l estimateur et pas les avis ne se lit pas
  // comme son voisin qui a l inverse.
  const milieu = ['travail', 'chantier'];
  if (g.suivant() < 0.72) milieu.push('prix');
  if (g.suivant() < 0.55) milieu.push('avis');
  // melange deterministe
  for (let i = milieu.length - 1; i > 0; i--) {
    const j = Math.floor(g.suivant() * (i + 1));
    [milieu[i], milieu[j]] = [milieu[j], milieu[i]];
  }
  if (g.suivant() < 0.5) tete.reverse();
  return {
    ordre: [...tete, ...milieu, ...queue],
    prix: milieu.includes('prix'),
    avis: milieu.includes('avis'),
    estimateur: milieu.includes('prix') && g.suivant() < 0.68,
    page2: g.suivant() < 0.6,
    nuancierPlace: g.suivant() < 0.62 ? 'atmo' : 'comparateur',
  };
}

// Les jetons de la page. Un seul endroit decide des couleurs : ici.
// `accent` est la couleur prelevee dans les photos ; elle garde sa fonction,
// nommer l apres. Le reste vient de la famille.
export function jetons(ch, accent) {
  const f = ch.famille;
  const clair = ch.sol === 'papier';
  return {
    // le sol du premier ecran et le corps de la page
    nuit: clair ? f.papier : f.nuit,
    encre: clair ? f.encreClair : f.encre,
    chaux: clair ? f.encreClair : f.chaux,
    gris: clair ? melange(f.encreClair, f.papier, 0.42) : f.gris,
    papier: clair ? f.papier : f.papier,
    accent: accent || f.second,
    second: f.second,
    // les voiles changent de sens sur un sol clair : ils foncent au lieu
    // d eclaircir, sinon ils disparaissent
    voile1: clair ? 'oklch(0 0 0 / 0.05)' : 'oklch(1 0 0 / 0.07)',
    voile2: clair ? 'oklch(0 0 0 / 0.12)' : 'oklch(1 0 0 / 0.14)',
    voile3: clair ? 'oklch(1 1 1 / 0.62)' : 'oklch(0 0 0 / 0.62)',
    surAccent: clair ? f.papier : '#18120E',
    // Ce qui se lit PAR-DESSUS le sol. Sur un sol clair tout s inverse : un
    // voile blanc sur du papier ne se voit pas, et un texte a 62 pour cent de
    // blanc ne se lit plus du tout. Le 23 septembre 2026, le premier site a
    // sol clair avait sa barre d etat noire, son chapo invisible et ses deux
    // boutons illisibles. Une couleur en dur dans un module partage est une
    // couleur qui ne marche que sur un seul sol.
    sousTexte: clair ? 'oklch(0 0 0 / 0.66)' : 'oklch(1 0 0 / 0.62)',
    dit: clair ? 'oklch(0 0 0 / 0.58)' : 'oklch(1 0 0 / 0.46)',
    ditFort: clair ? 'oklch(0 0 0 / 0.78)' : 'oklch(1 0 0 / 0.78)',
    ombreTexte: clair ? 'oklch(1 0 0 / 0.9)' : 'oklch(0.12 0.01 60 / 0.9)',
    lueur1: clair ? 'oklch(1 0 0 / 0.34)' : 'oklch(1 0 0 / 0.26)',
    lueur2: clair ? 'oklch(1 0 0 / 0.12)' : 'oklch(1 0 0 / 0.07)',
    // Le rai de lumiere prend la couleur de la famille : c est lui qui donne
    // son climat au premier ecran, et c est la premiere chose que l oeil voit.
    rai1: `color-mix(in oklab, ${f.second} 18%, transparent)`,
    rai2: `color-mix(in oklab, ${f.second} 34%, transparent)`,
    boutonFond: clair ? 'oklch(1 0 0 / 0.92)' : 'oklch(0.22 0.01 60 / 0.96)',
    pastilleFond: clair ? 'oklch(1 0 0 / 0.82)' : 'oklch(0.185 0.008 60 / 0.9)',
    clair,
  };
}

function melange(a, b, part) {
  const n = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return '#' + x.map((v, i) => Math.round(v * (1 - part) + y[i] * part).toString(16).padStart(2, '0')).join('');
}

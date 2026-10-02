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
import { moinsPris } from './graine.mjs';

// Les sept familles de palettes.md, en valeurs. Aucune ne reprend une valeur de
// la famille bannie (beige, laiton, espresso) listee dans ce meme fichier.
export const FAMILLES = [
  { cle: 'luxe-froid', nom: 'luxe froid : gris argent, chrome, fumee',
    nuit: '#101418', encre: '#192026', chaux: '#E7ECEF', gris: '#8C99A2', papier: '#EFF2F4',
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
  // La valeur la moins prise par les voisins ; voir graine.mjs, moinsPris.
  const libre = (liste, cle, deja) => {
    const k = moinsPris(g, liste.map(x => x[cle]), deja || []);
    return liste.find(x => x[cle] === k);
  };
  // Le sol se tire d abord. Le sol clair reste minoritaire : une page de
  // chantier se lit mieux sombre, et un site sur deux en papier ferait une
  // nouvelle uniformite.
  const sol = g.suivant() < 0.34 ? 'papier' : 'nuit';
  // Famille, polices, geometrie et mot geant se tirent ENSEMBLE. Tires chacun
  // a part, toujours sur la valeur la moins prise, ils finissaient par se
  // suivre : a cent sites d un departement, des voisins partageaient famille,
  // sol, polices et archetype (mesure du 2 octobre 2026,
  // scripts/capacite-unicite.mjs). Pour chacune des combinaisons, on compte
  // avec combien de voisins elle depasserait le plafond de ressemblance de
  // generateur/unicite.mjs sur les axes deja connus ici, puis avec combien
  // elle s en approcherait a deux points pres (la structure et les photos se
  // tirent apres et peuvent ajouter ces points). On garde la combinaison qui
  // heurte le moins, puis qui frole le moins, puis, a egalite, la famille,
  // les polices et le mot les moins pris : c est la rotation de palettes.md.
  const POIDS = { sol: 3, archetype: 2, famille: 3, polices: 2, geometrie: 1, mot: 1 };
  const PLAFOND = 9;
  const noyaux = pris.noyaux || [];
  const usage = (liste, v) => (liste || []).reduce((a, x) => a + ((x && x.valeur !== undefined ? x.valeur : x) === v ? (x.poids || 1) : 0), 0);
  let min = Infinity, egaux = [];
  for (const f of FAMILLES) for (const po of POLICES) for (const ge of GEOMETRIES) for (const mo of MOTS) {
    let heurts = 0, frolements = 0;
    for (const n of noyaux) {
      const score = (n.sol === sol ? POIDS.sol : 0) + (n.archetype === pris.archetype ? POIDS.archetype : 0)
        + (n.famille === f.cle ? POIDS.famille : 0) + (n.polices === po.cle ? POIDS.polices : 0)
        + (n.geometrie === ge.cle ? POIDS.geometrie : 0) + (n.mot === mo ? POIDS.mot : 0);
      if (score > PLAFOND) heurts += (n.poids || 1);
      else if (score > PLAFOND - 2) frolements += (n.poids || 1);
    }
    const cout = heurts * 1e9 + frolements * 1e6 + usage(pris.familles, f.cle) * 1000 + usage(pris.polices, po.cle) * 10 + usage(pris.mots, mo);
    if (cout < min) { min = cout; egaux = [[f, po, ge, mo]]; } else if (cout === min) egaux.push([f, po, ge, mo]);
  }
  const [famille, polices, geo, mot] = g.choisir(egaux);
  // La structure se tire plusieurs fois et garde le tirage le plus eloigne des
  // voisins : trois sites qui ont tous les memes sections facultatives se
  // lisent pareil, meme si elles ne sont pas dans le meme ordre.
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
  for (const k of ['avis', 'page2', 'nuancierPlace']) if (a[k] === b[k]) n++;
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
  // Les prix ont toujours une place dans l ordre, mais ne s affichent que si
  // l artisan l a choisi (decision de Fabrice, 2 octobre 2026) : c est le
  // composeur qui pose structure.prix d apres ses donnees, pas la graine.
  // Les avis restent facultatifs.
  const milieu = ['travail', 'chantier', 'prix'];
  if (g.suivant() < 0.55) milieu.push('avis');
  // melange deterministe
  for (let i = milieu.length - 1; i > 0; i--) {
    const j = Math.floor(g.suivant() * (i + 1));
    [milieu[i], milieu[j]] = [milieu[j], milieu[i]];
  }
  if (g.suivant() < 0.5) tete.reverse();
  return {
    ordre: [...tete, ...milieu, ...queue],
    prix: false,
    avis: milieu.includes('avis'),
    page2: g.suivant() < 0.6,
    nuancierPlace: g.suivant() < 0.62 ? 'atmo' : 'comparateur',
  };
}

// Les jetons de la page. Un seul endroit decide des couleurs : ici.
// `accent` est la couleur prelevee dans les photos, telle qu elle s affiche ;
// elle garde sa fonction, nommer l apres. Le reste vient de la famille.
//
// Chaque surface a SA couleur de texte, calculee pour tenir 4,6:1 au moins :
//   le sol (--nuit) et sa variante (--encre) : --chaux, --gris, --accent-texte
//   le papier, toujours clair : --sur-papier, --gris-papier, --accent-papier
//   l accent en aplat : --sur-accent, --gris-accent
// Le 2 octobre 2026, deux des trois sites de demonstration avaient un bloc
// illisible : sur sol clair, --encre restait sombre et --chaux devenait
// sombre, noir sur noir ; et une famille avait son encre ecrite #19202600,
// opacite nulle, blanc sur blanc. Rien n etait calcule, tout etait suppose.
export function jetons(ch, accent) {
  const f = ch.famille;
  const clair = ch.sol === 'papier';
  const acc = accent || f.second;
  const nuit = clair ? f.papier : f.nuit;
  const encre = clair ? melange(f.papier, f.encreClair, 0.07) : f.encre;
  const chaux = clair ? f.encreClair : f.chaux;
  const sol = [nuit, encre];
  const gris = pousser(clair ? melange(f.encreClair, f.papier, 0.45) : f.gris, chaux, sol);
  const accentTexte = pousser(acc, chaux, sol);
  const papier = f.papier;
  // un second papier, un ton plus bas, pour detacher un bloc clair d un autre
  const papier2 = melange(f.papier, f.encreClair, 0.05);
  const surPapier = f.encreClair;
  const grisPapier = pousser(melange(f.encreClair, f.papier, 0.45), surPapier, [papier, papier2]);
  const accentPapier = pousser(acc, surPapier, [papier, papier2]);
  // Sur l accent, le texte part du cote qui contraste le plus, puis se pousse.
  const surAccent = pousser(ratio(acc, f.encreClair) >= ratio(acc, f.papier) ? f.encreClair : f.papier,
    ratio(acc, '#000000') >= ratio(acc, '#ffffff') ? '#000000' : '#ffffff', [acc]);
  const grisAccent = pousser(melange(surAccent, acc, 0.3), surAccent, [acc]);
  return {
    nuit, encre, chaux, gris, papier, papier2,
    accent: acc,
    accentTexte, surPapier, grisPapier, accentPapier, surAccent, grisAccent,
    second: f.second,
    // les voiles changent de sens sur un sol clair : ils foncent au lieu
    // d eclaircir, sinon ils disparaissent
    voile1: clair ? 'oklch(0 0 0 / 0.05)' : 'oklch(1 0 0 / 0.07)',
    voile2: clair ? 'oklch(0 0 0 / 0.12)' : 'oklch(1 0 0 / 0.14)',
    voile3: clair ? 'oklch(1 0 0 / 0.62)' : 'oklch(0 0 0 / 0.62)',
    // Ce qui se lit PAR-DESSUS le sol, derive des couleurs calculees : jamais
    // un blanc a moitie transparent, qui ne tient que sur un seul sol.
    sousTexte: melange(gris, chaux, 0.35),
    dit: gris,
    ditFort: melange(gris, chaux, 0.6),
    ombreTexte: clair ? 'oklch(1 0 0 / 0.9)' : 'oklch(0.12 0.01 60 / 0.9)',
    lueur1: clair ? 'oklch(1 0 0 / 0.34)' : 'oklch(1 0 0 / 0.26)',
    lueur2: clair ? 'oklch(1 0 0 / 0.12)' : 'oklch(1 0 0 / 0.07)',
    // Le rai de lumiere prend la couleur de la famille : c est lui qui donne
    // son climat au premier ecran, et c est la premiere chose que l oeil voit.
    rai1: `color-mix(in oklab, ${f.second} 18%, transparent)`,
    rai2: `color-mix(in oklab, ${f.second} 34%, transparent)`,
    boutonFond: clair ? melange(f.papier, '#ffffff', 0.7) : melange(f.nuit, f.chaux, 0.1),
    // la pastille flotte sur le sol : elle en prend la couleur, a peine voilee,
    // sinon le texte gris calcule pour le sol tombe sous le seuil dessus
    pastilleFond: clair ? 'oklch(1 0 0 / 0.82)' : nuit + 'e6',
    clair,
  };
}

// Les contextes de texte. Une surface declare ses trois couleurs de texte, et
// les blocs ecrivent var(--t), var(--t2), var(--ta) : ils ne savent pas sur
// quoi ils sont poses, et n ont pas a le savoir.
export const CONTEXTES = {
  sol: '--t:var(--chaux);--t2:var(--gris);--ta:var(--accent-texte)',
  papier: '--t:var(--sur-papier);--t2:var(--gris-papier);--ta:var(--accent-papier)',
  accent: '--t:var(--sur-accent);--t2:var(--gris-accent);--ta:var(--sur-accent)',
};

// Les jetons en declarations CSS, pour les deux feuilles.
export function declarer(pal) {
  return `--nuit:${pal.nuit};--encre:${pal.encre};--chaux:${pal.chaux};--gris:${pal.gris};
  --papier:${pal.papier};--papier-2:${pal.papier2};--accent:${pal.accent};--second:${pal.second};
  --accent-texte:${pal.accentTexte};--sur-papier:${pal.surPapier};--gris-papier:${pal.grisPapier};
  --accent-papier:${pal.accentPapier};--sur-accent:${pal.surAccent};--gris-accent:${pal.grisAccent};
  --sous-texte:${pal.sousTexte};--dit:${pal.dit};--dit-fort:${pal.ditFort};--ombre-texte:${pal.ombreTexte};
  --lueur-1:${pal.lueur1};--lueur-2:${pal.lueur2};--rai-1:${pal.rai1};--rai-2:${pal.rai2};
  --bouton-fond:${pal.boutonFond};--pastille-fond:${pal.pastilleFond};
  --voile-1:${pal.voile1};--voile-2:${pal.voile2};--voile-3:${pal.voile3};`;
}

const rvb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function luminance(h) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = rvb(h);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function ratio(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
// Pousse une couleur vers `cible` jusqu a tenir `seuil` sur tous les fonds.
function pousser(couleur, cible, fonds, seuil = 4.6) {
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const c = melange(couleur, cible, Math.min(1, t));
    if (fonds.every(f => ratio(c, f) >= seuil)) return c;
  }
  return cible;
}

function melange(a, b, part) {
  const [x, y] = [rvb(a), rvb(b)];
  return '#' + x.map((v, i) => Math.round(v * (1 - part) + y[i] * part).toString(16).padStart(2, '0')).join('');
}

// oklch(L C H) vers #rrggbb, pour calculer les contrastes sur la couleur
// reellement affichee. Formules de Bjorn Ottosson (Oklab, 2020).
export function oklchVersHex(texte) {
  const m = String(texte).match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return null;
  const [L, C, H] = [+m[1], +m[2], +m[3] * Math.PI / 180];
  const a = C * Math.cos(H), b = C * Math.sin(H);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * s,
  ];
  const g = (v) => { v = Math.max(0, Math.min(1, v)); return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; };
  return '#' + lin.map(v => Math.round(g(v) * 255).toString(16).padStart(2, '0')).join('');
}

// Assemblage des textes : rien sur l entreprise n est ecrit ici. Seule la
// connaissance du metier est puisee dans metiers/<metier>.json, et la variante
// est tiree de la graine. Les faits de l entreprise viennent de Sirene.
//
// Un emplacement de texte, dans le fichier metier, s ecrit de trois facons :
//
//   [ "phrase", "phrase", ... ]            une phrase parmi d autres
//
//   { "combiner": [[...], [...]],           un morceau de chaque groupe, mis
//     "joints": [" "] }                     bout a bout (joints entre groupes)
//
//   { "etapes": [[...], [...], ...],        une enumeration : k etapes prises
//     "nombre": [3, 4],                     dans l ordre du fichier, une
//     "toujours": [5] }                     formulation par etape ; les etapes
//                                           listees dans « toujours » y sont
//
// Pourquoi : decision de Fabrice, 2 octobre 2026, 100 sites d un meme metier
// differents dans un meme departement. Un vivier de quinze phrases s epuise au
// cinquieme voisin (mesure, scripts/capacite-unicite.mjs). Les enumerations
// (chapo, etat avant et apres, legendes) se recomposent a l interieur d une
// phrase : deux sites n y lisent jamais la meme phrase. Les textes des gestes
// et la precision sous le comparateur assemblent deux phrases entieres (un
// comment, un pourquoi) : la meme phrase peut revenir sur plusieurs sites du
// departement. La mesure compte ces phrases partagees, pas seulement les
// textes entiers identiques.
//
// `interdits` : les phrases deja affichees par les voisins, avec leur poids
// (meme commune : 5, meme departement : 1). On prend la variante la moins
// lue chez eux, puis, a egalite, celle dont les morceaux sont les moins lus.

const majuscule = (s) => s.charAt(0).toLocaleUpperCase('fr-FR') + s.slice(1);

// Toutes les variantes possibles d un emplacement, ou un echantillon tire de
// la graine quand elles sont trop nombreuses. Chaque variante garde ses
// morceaux pour le decompte.
function variantes(spec, g, plafond = 600) {
  if (Array.isArray(spec)) return spec.map(t => ({ texte: t, morceaux: [t] }));
  if (spec && Array.isArray(spec.combiner)) {
    const groupes = spec.combiner, joints = spec.joints || [' '];
    const total = groupes.reduce((a, x) => a * x.length, 1);
    const une = (indices) => {
      const morceaux = indices.map((k, i) => groupes[i][k]);
      return { texte: morceaux.map((m, i) => (i ? (joints[i - 1] ?? joints[joints.length - 1]) : '') + m).join('') + (spec.fin || ''), morceaux };
    };
    const out = [];
    if (total <= plafond) {
      const rec = (i, acc) => { if (i === groupes.length) { out.push(une(acc)); return; }
        for (let k = 0; k < groupes[i].length; k++) rec(i + 1, [...acc, k]); };
      rec(0, []);
    } else {
      for (let n = 0; n < plafond; n++) out.push(une(groupes.map(x => Math.floor(g.suivant() * x.length))));
    }
    return out;
  }
  if (spec && Array.isArray(spec.etapes)) {
    const etapes = spec.etapes, [kmin, kmax] = spec.nombre || [3, 4];
    const toujours = new Set(spec.toujours || []);
    const out = [];
    for (let n = 0; n < plafond; n++) {
      const k = kmin + Math.floor(g.suivant() * (kmax - kmin + 1));
      const libres = etapes.map((_, i) => i).filter(i => !toujours.has(i));
      const pris = new Set(toujours);
      while (pris.size < Math.min(k, etapes.length) && libres.length)
        pris.add(libres.splice(Math.floor(g.suivant() * libres.length), 1)[0]);
      const morceaux = [...pris].sort((a, b) => a - b).map(i => etapes[i][Math.floor(g.suivant() * etapes[i].length)]);
      out.push({ texte: majuscule(morceaux.join(', ')) + (spec.fin ?? '.'), morceaux });
    }
    return out;
  }
  throw new Error('emplacement de texte illisible dans le fichier metier');
}

export function composerTextes(base, g, param, interdits = []) {
  const lus = interdits.map(x => typeof x === 'object' ? { texte: x.valeur, poids: x.poids || 1 } : { texte: x, poids: 1 });
  const compte = new Map();
  for (const x of lus) compte.set(x.texte, (compte.get(x.texte) || 0) + x.poids);
  // Combien de fois un morceau a deja ete lu chez les voisins.
  const memo = new Map();
  const usage = (m) => {
    if (!memo.has(m)) memo.set(m, lus.reduce((a, x) => a + (x.texte.includes(m) ? x.poids : 0), 0));
    return memo.get(m);
  };
  const deja = new Set();
  const prendre = (spec) => {
    const vs = variantes(spec, g).filter(v => !deja.has(v.texte));
    const score = (v) => (compte.get(v.texte) || 0) * 1e6 + v.morceaux.reduce((a, m) => a + usage(m), 0);
    const min = Math.min(...vs.map(score));
    const choix = g.choisir(vs.filter(v => score(v) === min)).texte;
    deja.add(choix);
    return choix;
  };
  const prendreN = (spec, n) => Array.from({ length: n }, () => prendre(spec));

  const gestes = [...base.gestes];
  // rotation deterministe puis selection
  const depart = g.entier(0, gestes.length - 1);
  const choisis = [];
  for (let i = 0; i < param.nbGestes; i++) choisis.push(gestes[(depart + i) % gestes.length]);
  const r = base.rubriques;
  return {
    titre: prendre(base.titres),
    chapo: prendre(base.chapos),
    gestes: choisis.map(x => ({ terme: x.terme, texte: prendre(x.textes) })),
    avant: prendre(base.coupure.avant),
    apres: prendre(base.coupure.apres),
    invitation: prendre(base.legendes.invitation),
    matiere: base.matiere ? prendre(base.matiere) : '',
    precision: prendre(base.legendes.precision),
    legendes: prendreN(base.legendes.comparateurs, 2),
    rub: {
      gestes: prendre(r.gestes),
      chantier: prendre(r.chantier),
      verifiable: prendre(r.verifiable),
      contact: prendre(r.contact),
      prix: r.prix ? prendre(r.prix) : 'Ce que ça coûte.',
    },
  };
}

// Le nombre de variantes distinctes d un emplacement, pour la mesure.
export function nombreDeVariantes(spec) {
  if (Array.isArray(spec)) return spec.length;
  if (spec && spec.combiner) return spec.combiner.reduce((a, x) => a * x.length, 1);
  if (spec && spec.etapes) {
    const [kmin, kmax] = spec.nombre || [3, 4];
    const toujours = new Set(spec.toujours || []);
    const libres = spec.etapes.map((x, i) => i).filter(i => !toujours.has(i));
    const produit = (idx) => idx.reduce((a, i) => a * spec.etapes[i].length, 1);
    let total = 0;
    const rec = (debut, acc, k) => {
      if (acc.length === k) { total += produit([...acc, ...toujours]); return; }
      for (let i = debut; i < libres.length; i++) rec(i + 1, [...acc, libres[i]], k);
    };
    for (let k = kmin; k <= kmax; k++) rec(0, [], Math.max(0, k - toujours.size));
    return total;
  }
  return 0;
}

// Les phrases qu un site AFFICHE, pour le registre : c est ce que les voisins
// suivants n auront pas le droit de reprendre. Une phrase tiree mais absente
// de la page (le titre des prix sur un site sans prix, la legende d un
// comparateur que l archetype n a pas) ne compte pas : avant le 2 octobre
// 2026 elle comptait, et usait les reserves pour rien.
export function phrases(t, { archetype = null, prix = true } = {}) {
  const tous = [t.titre, t.chapo, t.avant, t.apres, ...t.gestes.map(x => x.texte),
    t.rub.gestes, t.rub.verifiable, t.rub.contact];
  const propres = archetype === 'matiere'
    ? [t.matiere || t.rub.chantier]
    : archetype === null
      ? [t.matiere, t.rub.chantier, t.invitation, t.precision, ...t.legendes]
      : [t.rub.chantier, t.invitation, t.precision, ...t.legendes];
  return [...tous, ...propres, prix ? t.rub.prix : null].filter(Boolean);
}

// Les intitules de section qu un site affiche (« Prendre contact. »). Decision
// de Fabrice, 2 octobre 2026 : ils peuvent se repeter d un site a l autre, ce
// sont des reperes de deux a cinq mots. Le controle U3 ne les compte donc pas ;
// le tirage, lui, continue de prendre les moins lus chez les voisins.
export function intitules(t, { archetype = null, prix = true } = {}) {
  return [t.rub.gestes, t.rub.verifiable, t.rub.contact,
    archetype === 'matiere' && t.matiere ? null : t.rub.chantier,
    prix ? t.rub.prix : null].filter(Boolean);
}


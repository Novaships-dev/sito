// Le tirage d un site : tout ce qui decide de son apparence, sans fabriquer
// une seule image. Le composeur s en sert pour fabriquer ; la mesure de
// capacite (scripts/capacite-unicite.mjs) s en sert pour simuler des
// centaines de sites ; la base s en servira pour reserver l apparence d un
// site avant de le fabriquer.
//
// L ordre des tirages est celui du composeur avant le 2 octobre 2026 : le
// sortir d ici ne devait changer aucun site deja montre.
//
// Les voisins : depuis le 2 octobre 2026, decision de Fabrice, « different
// dans commune et departement, tres important ». Un voisin est un site du
// meme metier dans le meme departement ; ceux de la meme commune comptent
// cinq fois plus dans le choix, parce que ce sont eux que le client compare.

import { graine, moinsPris } from './graine.mjs';
import { composerTextes, phrases as phrasesTextes, intitules as intitulesTextes } from './textes.mjs';
import { tirer as tirerCharte } from './charte.mjs';
import { distribuer as distribuerPhotos, roles as rolesPhotos } from './main-photos.mjs';
import { comparer } from './unicite.mjs';
import * as appel from './sections/appel.mjs';

export const ARCHETYPES = ['matiere', 'panneau', 'planche', 'elevation'];

// Le departement d un code postal. La Corse et l outre-mer ont leurs regles.
export function departement(codePostal) {
  const c = String(codePostal || '').trim();
  if (!/^\d{5}$/.test(c)) return null;
  if (c.startsWith('97') || c.startsWith('98')) return c.slice(0, 3);
  if (c.startsWith('20')) return +c < 20200 ? '2A' : '2B';
  return c.slice(0, 2);
}

// Les voisins d une entreprise dans le registre, avec leur poids.
export function voisinsDe(registre, { siren, metier, commune, departement: dep }) {
  return registre.filter(s => s.metier === metier && s.siren !== siren
    && ((dep && s.departement === dep) || (commune && s.commune === commune)))
    .map(s => ({ ...s, poids: s.commune === commune ? 5 : 1 }));
}

export { moinsPris };

export function parametrer(g, archetype) {
  const p = {
    archetype,
    marge: +g.entre(4.0, 5.0).toFixed(2),
    margeMax: g.entier(56, 76),
    interligne: +g.entre(1.55, 1.68).toFixed(2),
    interlettre: +g.entre(0.16, 0.24).toFixed(2),
    titreMin: g.entier(32, 38),
    titreVw: +g.entre(5.6, 7.2).toFixed(2),
    titreMax: 0,
    titreInter: +g.entre(0.92, 0.99).toFixed(2),
    panneau: g.entier(36, 45),
    panneauADroite: g.suivant() < 0.5,
    cadrage: g.entier(45, 70),
    traitHauteur: g.entier(14, 30),
    marqueurCote: g.suivant() < 0.5 ? 'right' : 'left',
    respiration: +g.entre(6.2, 8.0).toFixed(2),
    respirationMax: g.entier(74, 96),
    respirationResserre: +(g.entre(4.4, 5.6)).toFixed(2),
    colonne: g.entier(30, 38),
    largeurDecale: g.entier(52, 68),
    gestesSurAccent: g.suivant() < 0.34,
    colonneTerme: g.entier(28, 38),
    chantierInverse: g.suivant() < 0.5,
    hauteurOuverture: g.entier(86, 94),
    ordre: g.suivant() < 0.5 ? ['coupure', 'comparateurs'] : ['comparateurs', 'coupure'],
    comparateurLarge: g.suivant() < 0.5 ? 0 : 1,
    nbGestes: g.entier(4, 6),
    ratioCoupure: '1448/752',
    ratioTel: 4 / 3,
    ratioMatiere: g.suivant() < 0.5 ? '2/1' : '21/9',
    motVw: g.entier(14, 17),
    motVwTel: g.entier(24, 28),
    motZoom: g.entier(134, 152),
    motMax: g.entier(150, 190),
    ratioOuverture: g.suivant() < 0.5 ? '16/9' : '3/2',
    ratioOuvertureTel: g.suivant() < 0.5 ? '4/3' : '1/1',
    // atmosphere : chaque entreprise recoit sa lumiere, son angle de rai,
    // sa colonne et son mot geant. Deux SIREN n ont pas la meme respiration.
    souffle: g.entier(14, 21),
    angleRai: g.entier(96, 112),
    marqueVw: +g.entre(11, 13.5).toFixed(1),
    colonneAtmo: +g.entre(0.82, 1.12).toFixed(2),
    ratioAtmo: g.suivant() < 0.5 ? '4/5' : '3/4',
    titreAtmo: g.entier(32, 38),
    titreAtmoTel: g.entier(40, 46),
  };
  if (archetype === 'planche') { p.panneau = g.entier(50, 58); p.hauteurOuverture = g.entier(78, 88); }
  if (archetype === 'elevation') { p.panneau = 100; p.hauteurOuverture = g.entier(52, 64); }
  // Le titre se calibre sur la largeur reellement disponible dans le panneau,
  // sinon un grand corps dans une colonne etroite hache la phrase.
  const facteur = archetype === 'elevation' ? 0.085 : 0.185;
  const alea = g.entre(0.92, 1.08);
  const calcul = (largeur) => Math.round(Math.min(132, (1440 * (largeur / 100) - 2 * p.margeMax) * facteur * alea));
  // C1 de composition.md : le rapport d echelle doit rester au moins de 8, et la
  // plus petite taille declaree est de 10 px. Un panneau trop etroit ne peut pas
  // porter un titre assez grand : on elargit le panneau plutot que de descendre
  // sous le plancher.
  const PLANCHER = 10 * 8;
  while (calcul(p.panneau) < PLANCHER && p.panneau < 54) p.panneau += 1;
  p.titreMax = Math.max(PLANCHER, calcul(p.panneau));
  p.titreVw = +(p.titreMax / 14.4 * g.entre(0.9, 1.05)).toFixed(2);
  // M1 : sur un telephone de 390 px, la formule en vw retombe sous 30 px et le
  // titre disparait. Le plancher mobile est fixe a part, entre 42 et 52 px.
  p.titreMobile = g.entier(42, 52);
  return p;
}

// Un tirage, dans l ordre, a partir d une graine donnee. `charteFixee` :
// { archetype, charte } deja choisis pour ce site (sites.charte, figee a la
// creation, 05-SCHEMA-BACKEND.md §3.6) — on ne les retire pas, meme si de
// nouveaux voisins rendraient aujourd hui un autre choix moins fautif. Sans
// elle, une refabrication (photo ajoutee) pourrait changer l apparence d un
// site deja montre a l artisan pour une raison qui ne le concerne pas.
function tirerUneFois(cle, { siren, metier, base, sources, voisins, prix, charteFixee }) {
  const g = graine(cle);
  const vals = (c) => voisins.filter(s => s[c] !== undefined && s[c] !== null)
    .map(s => ({ valeur: s[c], poids: s.poids || 1 }));
  const archetype = charteFixee ? charteFixee.archetype : moinsPris(g, ARCHETYPES, vals('archetype'));
  const p = parametrer(g, archetype);
  const t = composerTextes(base, g, p, voisins.flatMap(s =>
    (s.phrases || [s.titre]).filter(Boolean).map(x => ({ valeur: x, poids: s.poids || 1 }))));
  // La forme de l appel se tire d une graine a part : l ajouter le 2 octobre
  // 2026 ne devait deplacer aucun autre tirage des sites deja montres.
  const avecPoids = (c) => voisins.filter(s => s[c]).map(s => ({ ...s[c], poids: s.poids || 1 }));
  const ap = appel.tirer(graine(cle + '|appel'), avecPoids('appel'));
  const ch = charteFixee ? structuredClone(charteFixee.charte) : tirerCharte(g, {
    archetype,
    noyaux: voisins.filter(s => s.famille).map(s => ({ archetype: s.archetype, sol: s.sol,
      famille: s.famille, polices: s.polices, geometrie: s.geometrie, mot: s.mot, poids: s.poids || 1 })),
    familles: vals('famille'),
    polices: vals('polices'),
    mots: vals('mot'),
    structures: voisins.map(s => s.structureDetail).filter(Boolean),
    comparateurs: avecPoids('comparateur'),
  });
  if (archetype !== 'matiere') ch.structure.page2 = false;
  ch.structure.prix = !!prix;
  const main = distribuerPhotos(g, sources, avecPoids('main'));
  const ouverture = g.suivant() < 0.62 ? 'geste' : 'detail';
  return { g, archetype, p, t, ap, ch, main, ouverture };
}

// Ce qu un site laisse au registre : ce que ses voisins suivants ne doivent
// pas reprendre, et ce que le controle d unicite compare. Un seul format,
// pour le composeur, le tirage et la mesure.
export function fiche(e, metier, d) {
  return {
    siren: e.siren, nom: e.nom || e.denomination || e.siren, metier,
    commune: e.commune, codePostal: e.codePostal || null, departement: e.departement,
    archetype: d.archetype, titre: d.t.titre, main: d.main, appel: d.ap,
    photos: Object.values(rolesPhotos(d.main)).join(','),
    structure: d.ch.structure.ordre.join(' > '), structureDetail: d.ch.structure,
    comparateur: d.ch.comparateur,
    phrases: phrasesTextes(d.t, { archetype: d.archetype, prix: d.ch.structure.prix }),
    intitules: intitulesTextes(d.t, { archetype: d.archetype, prix: d.ch.structure.prix }),
    famille: d.ch.famille.cle, sol: d.ch.sol, polices: d.ch.polices.cle,
    geometrie: d.ch.geo.cle, mot: d.ch.mot,
  };
}

// Tout le tirage. `sources` : les photos du metier par nom de role (seuls les
// noms comptent ici). `voisins` : voir voisinsDe(). `e` : siren, commune,
// departement. `prix` : l artisan affiche-t-il ses tarifs.
//
// Si le tirage ressemble trop a un voisin (generateur/unicite.mjs), on retire
// avec une graine derivee, jusqu a douze fois, et on garde le tirage le moins
// fautif. Toujours la meme suite de graines : le meme SIREN et les memes
// voisins redonnent le meme site. Un voisin de la meme commune pese cinq fois
// plus qu un voisin du departement.
export const ESSAIS = 12;
export function tirerSite({ siren, metier, base, sources, voisins = [], e = {}, prix = false, charteFixee = null }) {
  const ident = { siren, commune: e.commune, departement: e.departement, codePostal: e.codePostal, nom: e.nom || e.denomination };
  // Charte figee : un seul tirage, jamais retire pour ressembler moins a un
  // voisin — c est justement ce qu on protege (voir tirerUneFois).
  if (charteFixee) {
    const d = tirerUneFois(siren + '|' + metier, { siren, metier, base, sources, voisins, prix, charteFixee });
    return { ...d, fiche: fiche(ident, metier, d), essai: 0 };
  }
  let meilleur = null, coutMin = Infinity;
  for (let k = 0; k < ESSAIS; k++) {
    const cle = siren + '|' + metier + (k ? '|essai' + k : '');
    const d = tirerUneFois(cle, { siren, metier, base, sources, voisins, prix });
    const f = fiche(ident, metier, d);
    let cout = 0;
    for (const v of voisins) {
      const c = comparer(f, v);
      cout += c.length * (v.poids || 1) * 1000 + c.reduce((a, x) => a + (x.score || 0), 0);
    }
    if (cout < coutMin) { coutMin = cout; meilleur = { ...d, fiche: f, essai: k }; }
    if (cout === 0) break;
  }
  return meilleur;
}

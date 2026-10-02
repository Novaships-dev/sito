#!/usr/bin/env node
// Fabrique un site a partir d un SIREN, d un metier et d un jeu de photos.
// Rien sur l entreprise n est invente : les faits viennent de Sirene, le reste
// est une connaissance de metier, et les photos sont marquees comme exemples.
//
// usage :
//   node generateur/composer.mjs --siren 480423623 --metier ravalement \
//        --images <dossier de sources png> --sortie <dossier> [--donnees fichier.json]

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { graine } from './graine.mjs';
import { preleverPalette } from './palette.mjs';
import { trouverCoupure } from './couture.mjs';
import { normaliser } from './sirene.mjs';
import { composerTextes, phrases as phrasesTextes } from './textes.mjs';
import { feuille } from './style.mjs';
import { zoneMatiere } from './zone-matiere.mjs';
import * as arrivee from './sections/arrivee.mjs';
import * as atmosphere from './sections/atmosphere.mjs';
import * as prixSection from './sections/prix.mjs';
import * as avisSection from './sections/avis.mjs';
import * as comparateurVariante from './sections/comparateur.mjs';
import { tirer as tirerCharte, jetons as jetonsCharte } from './charte.mjs';
import { distribuer as distribuerPhotos, roles as rolesPhotos, manquants as manquantsPhotos } from './main-photos.mjs';
import * as matiere from './archetypes/matiere.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
const arg = (nom, defaut) => {
  const i = process.argv.indexOf('--' + nom);
  return i > -1 ? process.argv[i + 1] : defaut;
};

const VERSION = '1.1';
const ARCHETYPES = ['matiere', 'panneau', 'planche', 'elevation'];
const TAILLES = { grand: [600, 900, 1200, 1400], bandeau: [800, 1200, 1600] };

// -------------------------------------------------------------- parametrage
function parametrer(g, archetype) {
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

// -------------------------------------------------------------- images
async function encoder(source, sortie, role, tailles) {
  const faits = [];
  for (const w of tailles) {
    const im = sharp(source).resize({ width: w });
    const a = `${role}-${w}.avif`, wp = `${role}-${w}.webp`;
    await im.clone().avif({ quality: 44, effort: 4, chromaSubsampling: '4:2:0' }).toFile(join(sortie, a));
    await im.clone().webp({ quality: 70, effort: 4 }).toFile(join(sortie, wp));
    faits.push(w);
  }
  const meta = await sharp(source).metadata();
  return { role, tailles: faits, largeur: meta.width, hauteur: meta.height };
}

const jeu = (role, r, sizes, tailleDefaut) => {
  const liste = r.tailles;
  const srcset = liste.map(w => `images/${role}-${w}.avif ${w}w`).join(', ');
  return { src: `images/${role}-${tailleDefaut}.avif`, srcset, sizes, w: r.largeur, h: r.hauteur };
};

const img = (j, alt, extra = '') =>
  `<img src="${j.src}" srcset="${j.srcset}" sizes="${j.sizes}" width="${j.w}" height="${j.h}" ` +
  `alt="Exemple, ${alt}" data-exemple="oui"${extra}>`;

// -------------------------------------------------------------- morceaux
const echapper = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// L atmosphere porte desormais le h1. L ouverture reprend la main juste
// dessous avec le mot du metier en geant : un seul titre de premier rang par
// page, et la phrase ne se dit pas deux fois.
function ouverture(a, p, t, e, im, mot, alt) {
  const visuel = `<div class="visuel"><span class="trait-accent"></span>${
    img(im.ouverture, alt.ouverture || '', ' fetchpriority="high"')
  }<p class="marqueur">Exemple</p></div>`;
  const panneau = `<div class="panneau">
      <p class="enseigne">${echapper(e.nomLisible)}${e.commune ? `<br>${echapper(e.commune)}` : ''}${e.anneeCreation ? `, depuis ${e.anneeCreation}` : ''}</p>
      <h2 id="t-ouverture" class="geant">${echapper(mot)}</h2>
      <p class="note">${echapper(t.chapo)}${e.commune && e.anneeCreation ? ` Entreprise établie à ${echapper(e.commune)} depuis ${e.anneeCreation}.` : ''}</p>
    </div>`;
  if (a === 'elevation') return `<section class="ouverture elevation" aria-labelledby="t-ouverture">${panneau}${visuel}</section>`;
  return `<section class="ouverture" aria-labelledby="t-ouverture">${panneau}${visuel}</section>`;
}

// Sur telephone la photo est recadree en hauteur, sinon elle tombe a deux cents
// pixels et plus personne ne lit la facade. Le recadrage deplace la coupure :
// on la recalcule au lieu de laisser le filet a cote de la vraie limite.
function coupureTelephone(fraction, ratioImage, ratioBoite) {
  const k = ratioImage / ratioBoite;
  const f = fraction * k - (k - 1) / 2;
  return Math.max(0.06, Math.min(0.94, f));
}

function coupure(t, im, fraction, ratioImage, ratioTel) {
  const ft = coupureTelephone(fraction, ratioImage, ratioTel);
  return `<section class="coupure" aria-labelledby="t-coupure" style="--coupure:${(fraction * 100).toFixed(1)}%;--coupure-tel:${(ft * 100).toFixed(1)}%">
  <div class="cliche">${img(im.hero, 'façade dont une partie est sous échafaudage et l’autre déjà reprise')}<span class="fil"></span>
    <span class="pastille av">Avant</span><span class="pastille ap">Après</span></div>
  <div class="socle">
    <div class="gauche"><h2 id="t-coupure" class="moyen">Avant, la partie gauche</h2><p class="d">${echapper(t.avant)}</p></div>
    <div class="droite"><p class="moyen">Après, la partie droite</p><p class="d">${echapper(t.apres)}</p></div>
  </div>
</section>`;
}

function comparateur(id, av, ap, legende, classe, altAv, altAp, aria) {
  return `<figure class="comparateur ${classe}">
    <div class="cadre" id="${id}">
      ${img(av, altAv, ' draggable="false"')}
      ${img(ap, altAp, ' draggable="false"').replace('<img ', '<img class="apres" ')}
      <span class="etiquette av">Avant</span><span class="etiquette ap">Après</span>
      <input class="glissiere" type="range" min="0" max="100" value="50" step="1" aria-label="${aria}">
      <span class="couture"><span class="prise"></span></span>
      <span class="teint" aria-hidden="true"></span>
      <span class="indice">Glissez ou touchez</span>
    </div>
    <div class="bascule">
      <button type="button" class="vers" data-cadre="${id}" data-vers="0">Voir l’avant</button>
      <button type="button" class="vers" data-cadre="${id}" data-vers="100">Voir l’après</button>
    </div>
    ${legende ? `<figcaption class="legende note">${echapper(legende)}</figcaption>` : ''}
  </figure>`;
}

function comparateurs(p, t, im) {
  const c = [
    comparateur('c1', im.avant01, im.apres01, t.legendes[0], p.comparateurLarge === 0 ? 'large' : 'serre',
      'façade complète avant travaux', 'la même façade après reprise', 'Comparer avant et après, façade complète'),
    comparateur('c2', im.avant02, im.apres02, t.legendes[1], p.comparateurLarge === 1 ? 'large' : 'decale',
      'angle de façade avant travaux', 'le même angle après reprise', 'Comparer avant et après, angle de façade'),
  ];
  return `<section class="rubrique" aria-labelledby="t-comparer">
  <div class="tete"><p class="enseigne">Deux chantiers</p>
    <h2 id="t-comparer" class="grand">${echapper(t.invitation)}</h2>
    <p class="note">${echapper(t.precision)}</p></div>
  ${c.join('\n  ')}
</section>`;
}

function gestes(t) {
  const items = t.gestes.map((x, i) =>
    `<div class="geste"><dt><span class="chiffre">${String(i + 1).padStart(2, '0')}</span>${echapper(x.terme)}</dt>
      <dd>${echapper(x.texte)}</dd></div>`).join('\n    ');
  return `<section class="travail" aria-labelledby="t-travail">
  <p class="enseigne">Le détail des postes</p>
  <h2 id="t-travail" class="grand">${echapper(t.rub.gestes)}</h2>
  <dl>
    ${items}
  </dl>
</section>`;
}

function chantier(t, im) {
  return `<section class="rubrique" aria-labelledby="t-chantier">
  <div class="tete"><p class="enseigne">Sur place</p><h2 id="t-chantier" class="grand">${echapper(t.rub.chantier)}</h2></div>
  <div class="chantier">
    <div class="pile">${img(im.chantier, 'échafaudage monté sur une façade')}${img(im.detail, 'gros plan sur le grain de l’enduit')}</div>
    <div class="haut">${img(im.geste, 'la taloche chargée d’enduit appliquée contre le mur')}</div>
  </div>
  <p class="note" style="margin-top:.9rem">Photographies d’exemple. Elles seront remplacées par les chantiers de l’entreprise.</p>
</section>`;
}

function verifiable(t, e, illustration) {
  const l = (th, td, vide) => `<tr><th scope="row">${th}</th><td${vide ? ' class="vide"' : ''}>${td}</td></tr>`;
  const lignes = [
    l('Dénomination', echapper(e.denomination)),
    l('SIREN', e.sirenLisible),
    e.siretLisible ? l('SIRET du siège', e.siretLisible) : '',
    e.forme ? l('Forme juridique', e.forme) : l('Forme juridique', 'Non renseignée dans la base', true),
    e.dateLisible ? l('Date de création', e.dateLisible) : '',
    e.adresse ? l('Siège', echapper(e.adresse)) : '',
    e.ape ? l('Activité déclarée', e.ape + (e.apeLibelle ? ', ' + e.apeLibelle : '')) : '',
    e.effectif ? l('Effectif', 'Tranche ' + e.effectif) : l('Effectif', 'Non renseigné dans la base', true),
    e.rge === true ? l('Qualification RGE', 'Qualification trouvée') :
      l('Qualification RGE', 'Aucune qualification trouvée à cette date', true),
  ].filter(Boolean).join('\n      ');
  return `<section class="verifiable" aria-labelledby="t-verifiable">
  <div class="tete"><p class="enseigne">Sources publiques</p>
    <h2 id="t-verifiable" class="grand">${echapper(t.rub.verifiable)}</h2>
    <p class="note">Données de l’annuaire des entreprises, base Sirene. Les lignes vides le sont dans la source.</p>
    ${illustration ? `<p class="note mention-illustration">Les photos de cette page sont des images d’illustration. Elles seront remplacées par les chantiers de l’entreprise avant toute mise en ligne.</p>` : ''}</div>
  <table class="faits"><tbody>
      ${lignes}
  </tbody></table>
</section>`;
}

function contact(t) {
  return `<section class="contact" aria-labelledby="t-contact">
  <div class="tete"><p class="enseigne">Prendre contact</p><h2 id="t-contact" class="grand">${echapper(t.rub.contact)}</h2></div>
  <div class="creux"><p class="enseigne">Emplacement à remplir</p>
    <p>Téléphone, adresse électronique et horaires de l’entreprise viennent ici. Ils ne figurent pas dans les sources publiques, et cette page n’en invente aucun.</p></div>
</section>`;
}

// Ce que dit le mot geant. Le mot du metier revient sur tous les sites d un
// meme metier : c etait la premiere chose qui les rendait jumeaux. La commune
// et l enseigne disent quelque chose de l entreprise, pas du metier.
function motGeant(ch, base, e) {
  const metier = base.mot || base.libelle.split(' ')[0];
  if (ch.mot === 'commune' && e.commune) return e.commune;
  if (ch.mot === 'enseigne' && e.nomLisible) return e.nomLisible.split(' ')[0];
  if (ch.mot === 'aucun') return '';
  return metier;
}

// -------------------------------------------------------------- assemblage
async function fabriquer(opts) {
  const base = JSON.parse(readFileSync(join(ici, 'metiers', opts.metier + '.json'), 'utf8'));
  const brut = JSON.parse(readFileSync(opts.donnees, 'utf8'));
  const e = normaliser(brut);
  const g = graine(e.siren + '|' + opts.metier);

  // registre : eviter le doublon de composition dans la meme ville et le meme metier
  const cheminRegistre = join(ici, 'registre.json');
  const registre = existsSync(cheminRegistre) ? JSON.parse(readFileSync(cheminRegistre, 'utf8')) : { sites: [] };
  const voisins = registre.sites.filter(s => s.metier === opts.metier && s.commune === e.commune && s.siren !== e.siren);
  const pris = new Set(voisins.map(s => s.archetype));
  const libres = ARCHETYPES.filter(a => !pris.has(a));
  const archetype = (libres.length ? g.choisir(libres) : g.choisir(ARCHETYPES));
  const p = parametrer(g, archetype);
  const t = composerTextes(base, g, p, voisins.flatMap(s => s.phrases || [s.titre]).filter(Boolean));

  // La charte : famille de couleurs, sol, polices, geometrie, mot geant.
  // (la page 2 n est produite que par l archetype matiere ; ailleurs on la
  // retire de la charte plus bas, pour ne pas compter une difference fictive)
  // La rotation des sept familles est la regle de palettes.md : jamais la
  // famille d un voisin. Sans elle, trois ravaleurs de Marseille sortaient
  // avec le meme accent, le meme fond et les memes polices, et seule la
  // grille changeait. Voir generateur/charte.mjs.
  const ch = tirerCharte(g, {
    familles: voisins.map(s => s.famille).filter(Boolean),
    polices: voisins.map(s => s.polices).filter(Boolean),
    mots: voisins.map(s => s.mot).filter(Boolean),
    structures: voisins.map(s => s.structureDetail).filter(Boolean),
    comparateurs: voisins.map(s => s.comparateur).filter(Boolean),
  });

  if (archetype !== 'matiere') ch.structure.page2 = false;
  // Un dossier de sortie reutilise garde l ancienne deuxieme page si celle-ci
  // n est plus produite : le lien disparait mais la page reste en ligne.
  if (existsSync(join(opts.sortie, 'le-travail.html')) && !ch.structure.page2)
    rmSync(join(opts.sortie, 'le-travail.html'));
  mkdirSync(join(opts.sortie, 'images'), { recursive: true });
  mkdirSync(join(opts.sortie, 'polices'), { recursive: true });
  for (const f of ch.polices.fichiers)
    copyFileSync(join(ici, 'polices', f), join(opts.sortie, 'polices', f));

  const sources = {};
  for (const f of readdirSync(opts.images)) {
    const m = f.match(/^([a-z0-9-]+)\.(png|jpe?g|webp|avif)$/i);
    if (m) sources[m[1]] = join(opts.images, f);
  }
  // Un dossier de photos qui ne sont pas celles de l entreprise porte un
  // fichier marqueur. Il suit la page jusqu au bout : mention visible, balise
  // dans l en-tete, et refus de fabriquer une page de publication.
  const illustration = existsSync(join(opts.images, 'SOURCE-ILLUSTRATION'));
  if (illustration && process.argv.includes('--publication')) {
    console.error('Refus : ce dossier contient des photos d illustration (SOURCE-ILLUSTRATION).');
    console.error('Une page publiee montre les chantiers de l entreprise. Voir rules/common/ne-pas-fabriquer.md.');
    process.exit(3);
  }
  // La main de photos : chaque entreprise recoit un jeu different, tire de la
  // graine et evitant celui des voisins. Voir generateur/main-photos.mjs.
  const trous = manquantsPhotos(sources);
  if (trous.length) { console.error('Photos manquantes : ' + trous.join(', ')); process.exit(2); }
  const main = distribuerPhotos(g, sources, voisins.map(s => s.main).filter(Boolean));
  const table = rolesPhotos(main);

  const dossierImages = join(opts.sortie, 'images');
  const enc = {};
  // Les fichiers gardent leur nom de role : le reste du moteur ne sait pas
  // quelle photo a ete tiree, et n a pas a le savoir.
  for (const [role, fichier] of Object.entries(table))
    enc[role] = await encoder(sources[fichier], dossierImages, role,
      role === 'hero' ? TAILLES.bandeau : TAILLES.grand);
  if (!enc['avant-02']) { enc['avant-02'] = enc['avant-01']; enc['apres-02'] = enc['apres-01']; }

  const prelevee = await preleverPalette([sources[table.hero], sources[table['apres-01']], sources[table.detail]]);
  // La couleur prelevee garde sa fonction : nommer l apres. Tout le reste de
  // la palette vient de la famille tiree par la charte, de sorte que deux
  // artisans qui partagent les memes photos de demonstration ne partagent pas
  // pour autant le meme site.
  const pal = { ...prelevee, ...jetonsCharte(ch, prelevee.accent) };
  const cp = await trouverCoupure(sources[table.hero]);
  const fraction = cp.fiable ? cp.fraction : 0.5;

  const largeVisuel = p.panneauADroite ? `${100 - p.panneau}vw` : `${100 - p.panneau}vw`;
  const im = {
    ouverture: (() => { const r = g.suivant() < 0.62 ? 'geste' : 'detail';
      return jeu(r, enc[r], `(max-width:900px) 100vw, ${largeVisuel}`, 1400); })(),
    hero: jeu('hero', enc.hero, '100vw', 1200),
    avant01: jeu('avant-01', enc['avant-01'], '100vw', 1200),
    apres01: jeu('apres-01', enc['apres-01'], '100vw', 1200),
    avant02: jeu('avant-02', enc['avant-02'], `(max-width:900px) 100vw, ${p.largeurDecale}rem`, 1200),
    apres02: jeu('apres-02', enc['apres-02'], `(max-width:900px) 100vw, ${p.largeurDecale}rem`, 1200),
    chantier: jeu('chantier', enc.chantier, '(max-width:900px) 100vw, 40vw', 900),
    detail: jeu('detail', enc.detail, '(max-width:900px) 100vw, 40vw', 900),
    geste: jeu('geste', enc.geste, '(max-width:900px) 100vw, 52vw', 1400),
  };

  const ratioImage = enc.hero.largeur / enc.hero.hauteur;
  const fractionTel = coupureTelephone(fraction, ratioImage, p.ratioTel);

  let corps, style;
  // La fenetre d enduit qui remplira les lettres du mot geant. Elle se mesure
  // dans la photo de l artisan : elle change d une entreprise a l autre, donc
  // le mot aussi. Les quatre archetypes en ont besoin.
  await zoneMatiere(sources[table['apres-01']], dossierImages, 'mur');

  if (archetype === 'matiere') {
    im.avantOuverture = jeu('avant-01', enc['avant-01'], '100vw', 1400);
    corps = matiere.corps({ e, t, im, img, p, base, fraction, fractionTel, illustration, ch,
      mot: motGeant(ch, base, e) });
    style = matiere.feuille(p, pal, ch);
  } else {
    // Les trois autres archetypes recoivent le meme socle que le vaisseau
    // amiral : ecran d ambiance, pastille d etat, nuancier. Chacun dans sa
    // propre composition (voir sections/atmosphere.mjs) : meme air, quatre
    // pages differentes.
    const alt = base.alt || {};
    const ans = e.anneeCreation ? new Date().getFullYear() - e.anneeCreation : null;
    const mot = motGeant(ch, base, e);
    // La charte decide des sections presentes et de leur ordre : deux sites qui
    // montrent les memes blocs dans le meme ordre se lisent pareil, quelles que
    // soient leurs couleurs. Voir generateur/charte.mjs, structurer().
    const bloc = {
      ouverture: ouverture(archetype, p, t, e, im, mot, alt),
      coupure: coupure(t, im, fraction, ratioImage, p.ratioTel),
      comparateurs: comparateurs(p, t, im),
      travail: gestes(t),
      chantier: chantier(t, im),
      prix: prixSection.bloc({ base, ech: echapper, estimateur: ch.structure.estimateur, titre: t.rub.prix }),
      avis: avisSection.bloc(),
      verifiable: verifiable(t, e, illustration),
      contact: contact(t),
    };
    corps = [
      arrivee.calques({ e, ech: echapper }),
      '<div class="premier-ecran">',
      arrivee.pastille({ e, ech: echapper }),
      atmosphere.bloc({ e, t, base, im, ech: echapper, comparateur, mot, ans, alt, ch }),
      '</div>',
      ...ch.structure.ordre.map(k => bloc[k]).filter(Boolean),
      bloc.comparateurs,
    ].join('\n\n');
    style = feuille(p, pal, archetype, ch);
  }

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echapper(e.nomLisible)}, ${base.libelle}${e.commune ? ' à ' + echapper(e.commune) : ''}</title>
<meta name="description" content="${echapper(t.chapo)}">
<meta name="atelier-generateur" content="composer ${VERSION}, ${e.siren}, ${new Date().toISOString().slice(0, 10)}">
<meta name="atelier-images" content="${illustration ? 'illustration' : 'entreprise'}">
${ch.polices.fichiers.map(f => `<link rel="preload" href="polices/${f}" as="font" type="font/woff2" crossorigin>`).join("\n")}
<style>${style}</style>
</head>
<body>
<a class="deplacer" href="#principal">Aller au contenu</a>
<main id="principal">

${corps}

</main>
<footer>
  <p class="enseigne">${echapper(e.nomLisible)}${e.commune ? '<br>' + echapper(e.commune) : ''}</p>
  <p class="note" style="max-width:44ch">Proposition de site. Les informations proviennent de bases publiques, les photographies sont des exemples.</p>
</footer>
<script>
(function(){
  // Le script est la : l arrivee des blocs peut donc etre demandee. Sans lui,
  // le contenu reste simplement visible. Jamais l inverse.
  document.body.classList.add('anime');

  // Trois façons d agir, pour qu il en reste toujours une qui marche :
  // deux boutons, une touche simple sur la photo, un glissement.
  // La couche de saisie est au-dessus des images : sur telephone, glisser sur
  // une image declenche sinon le glisser-deposer du systeme, et le geste meurt.
  var cadres = document.querySelectorAll('.cadre');

  function installer(c){
    var s = c.querySelector('.glissiere');
    var indice = c.querySelector('.indice');
    if (!s) return;
    var servi = false;

    function poser(v, parGeste){
      v = Math.max(0, Math.min(100, v));
      s.value = v;
      c.style.setProperty('--p', v + '%');
      if (parGeste && !servi) { servi = true; if (indice) indice.classList.add('parti'); }
    }

    // Le navigateur fait tout le glissement. Nous, on recopie la valeur.
    s.addEventListener('input', function(){ poser(parseFloat(s.value), true); });

    // Safari ne saute pas toujours a l endroit touche : on pose la valeur
    // au premier contact. Au doigt, on s en garde bien : un defilement
    // vertical commence sur la photo, et la couture sauterait a chaque fois.
    // Une touche sans deplacement produit un click, c est la qu on la traite.
    var typePointeur = '';
    function depuisX(x){
      var r = s.getBoundingClientRect();
      if (r.width) poser((x - r.left) / r.width * 100, true);
    }
    s.addEventListener('pointerdown', function(e){
      typePointeur = e.pointerType;
      if (e.pointerType !== 'touch') depuisX(e.clientX);
    });
    s.addEventListener('click', function(e){
      if (typePointeur === 'touch') depuisX(e.clientX);
    });

    // boutons : rien ne peut les empecher de fonctionner
    var boutons = c.parentNode.querySelectorAll('.vers');
    for (var k = 0; k < boutons.length; k++) (function(b){
      b.addEventListener('click', function(){ poser(parseFloat(b.getAttribute('data-vers')), true); });
    })(boutons[k]);

    poser(parseFloat(s.value), false);
  }

  for (var i = 0; i < cadres.length; i++) installer(cadres[i]);

  // ------------------------------------------------------------ entree
  // Le calque part des que les polices sont la, au plus tard apres 1 s, et
  // immediatement si la personne a demande moins d animation.
  var entree = document.getElementById('entree');
  if (entree) {
    var doux = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sortir = function(){
      if (!entree || entree.dataset.parti) return;
      entree.dataset.parti = '1';
      document.body.classList.add('prete');
      if (doux) { entree.remove(); return; }
      entree.classList.add('partie');
      setTimeout(function(){ if (entree) entree.remove(); }, 700);
    };
    if (doux) sortir();
    else {
      var t0 = Date.now();
      var quandPret = function(){
        var reste = Math.max(0, 820 - (Date.now() - t0));
        setTimeout(sortir, reste);
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(quandPret);
      else quandPret();
      setTimeout(sortir, 2200);
      window.addEventListener('pointerdown', sortir, { once: true });
      window.addEventListener('keydown', sortir, { once: true });
    }
  }

  // ------------------------------------------------------------ atmosphere
  // Le grain n est pas une image telechargee : il est fabrique au chargement,
  // une seule fois, et pose en fondu sur toute la page.
  (function(){
    var scene = document.querySelector('.atmo');
    if (!scene) return;
    var doux = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var n = document.createElement('canvas'); n.width = n.height = 220;
    var g = n.getContext('2d'), d = g.createImageData(220, 220);
    for (var i = 0; i < d.data.length; i += 4) {
      var v = 120 + Math.random() * 135;
      d.data[i] = d.data[i+1] = d.data[i+2] = v; d.data[i+3] = 255;
    }
    g.putImageData(d, 0, 0);
    document.documentElement.style.setProperty('--bruit', 'url(' + n.toDataURL() + ')');
    // Le grain se pose sur le premier ecran au doigt (calque local, bon marche)
    // et sur toute la page a la souris. Voir rules/web/facture.md, F8.
    var grossier = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
    var grain = document.createElement('span');
    grain.className = 'grain'; grain.setAttribute('aria-hidden', 'true');
    (grossier ? scene : document.body).appendChild(grain);

    // l heure sur le chantier, qui tourne
    var h = document.querySelector('.heure');
    if (h) {
      var poser = function(){
        h.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      };
      poser(); setInterval(poser, 20000);
    }

    if (doux) return;

    // la lumiere derive vers le pointeur
    var aura = scene.querySelector('.aura');
    var photo = scene.querySelector('.photo'), lueur = scene.querySelector('.photo .lueur');
    var cx = 58, cy = 34, vx = 58, vy = 34;
    window.addEventListener('pointermove', function(e){
      cx = e.clientX / window.innerWidth * 100;
      cy = e.clientY / window.innerHeight * 100;
      if (photo && lueur) {
        var r = photo.getBoundingClientRect();
        if (r.width) {
          lueur.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
          lueur.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        }
      }
    }, { passive: true });
    if (aura) (function derive(){
      vx += (cx - vx) * 0.045; vy += (cy - vy) * 0.045;
      aura.style.setProperty('--lx', vx.toFixed(2) + '%');
      aura.style.setProperty('--ly', vy.toFixed(2) + '%');
      requestAnimationFrame(derive);
    })();

    // la poussiere dans le rai de lumiere
    var c = scene.querySelector('canvas.poussiere');
    if (!c) return;
    var x = c.getContext('2d'), P = [], L = 0, H = 0, visible = true;
    function taille(){
      var dp = Math.min(window.devicePixelRatio || 1, 2);
      var r = scene.getBoundingClientRect();
      L = c.width = Math.max(1, Math.round(r.width * dp));
      H = c.height = Math.max(1, Math.round(r.height * dp));
      c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
      P = [];
      var nb = Math.round(r.width * r.height / 22000);
      for (var i = 0; i < nb; i++) P.push({
        x: Math.random() * L, y: Math.random() * H,
        r: (Math.random() * 1.7 + 0.35) * dp,
        v: (Math.random() * 0.22 + 0.04) * dp,
        e: Math.random() * 0.5 - 0.25,
        o: Math.random() * 0.5 + 0.18, p: Math.random() * 6.28 });
    }
    taille();
    window.addEventListener('resize', taille);
    if (window.IntersectionObserver) new IntersectionObserver(function(en){
      visible = en[0].isIntersecting;
    }).observe(scene);
    (function flotter(){
      if (visible) {
        x.clearRect(0, 0, L, H);
        for (var i = 0; i < P.length; i++) {
          var m = P[i];
          m.y -= m.v; m.p += 0.012; m.x += Math.sin(m.p) * 0.32 + m.e * 0.1;
          if (m.y < -6) { m.y = H + 6; m.x = Math.random() * L; }
          var br = 0.55 + 0.45 * Math.sin(m.p * 1.7);
          x.beginPath(); x.arc(m.x, m.y, m.r, 0, 6.283);
          x.fillStyle = 'rgba(240,228,208,' + (m.o * br).toFixed(3) + ')';
          x.fill();
        }
      }
      requestAnimationFrame(flotter);
    })();
  })();

  // ------------------------------------------------------------ pointeur
  var fin = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
  var pt = document.getElementById('pointeur');
  if (pt && fin) {
    var px = 0, py = 0, cx = 0, cy = 0, vu = false, boucleEnCours = false;

    function suivre(e){
      px = e.clientX; py = e.clientY;
      if (!vu) {
        // Poser l anneau sous la fleche avant de le montrer : sinon il part
        // du coin haut gauche et traverse l ecran au premier mouvement.
        vu = true; cx = px; cy = py;
        pt.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
        pt.classList.add('vu');
        if (!boucleEnCours) { boucleEnCours = true; requestAnimationFrame(boucle); }
      }
      survol(e);
    }
    window.addEventListener('pointermove', suivre, { passive: true });
    window.addEventListener('pointerdown', suivre, { passive: true });
    document.addEventListener('pointerleave', function(){ pt.classList.remove('vu'); vu = false; });

    function boucle(){
      // 0.45 : l anneau reste colle a la fleche. Au-dessous, on voit deux
      // curseurs au lieu d un, et ca passe pour une page qui rame.
      // Le lissage se resserre quand l ecart grandit : sur un grand ecran, un
      // aller-retour rapide laissait l anneau a une centaine de pixels.
      var d = Math.hypot(px - cx, py - cy);
      var k = d > 180 ? 0.8 : d > 60 ? 0.6 : 0.45;
      cx += (px - cx) * k; cy += (py - cy) * k;
      if (Math.abs(px - cx) < 0.2) cx = px;
      if (Math.abs(py - cy) < 0.2) cy = py;
      pt.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(boucle);
    }

    // Un seul ecouteur pour tout le document : en posant un pointerenter sur
    // chaque element, sortir d un enfant eteignait le halo alors que la
    // souris etait toujours sur le parent.
    var mot = pt.querySelector('.mot');
    function survol(e){
      var el = e.target && e.target.closest
        ? e.target.closest('.cadre, .tel, .vers, .opt, .teinte, .second, a[href], button, input')
        : null;
      if (!el) { pt.classList.remove('sur', 'dit'); if (mot) mot.textContent = ''; return; }
      pt.classList.add('sur');
      var dit = el.classList.contains('cadre') ? 'glisser' : '';
      if (mot) mot.textContent = dit;
      pt.classList.toggle('dit', !!dit);
    }

    // aimant sur le bouton d appel
    document.querySelectorAll('.tel').forEach(function(b){
      b.addEventListener('pointermove', function(e){
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        b.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
    });

    // bascule des images de chantier
    document.querySelectorAll('.chantier figure').forEach(function(f){
      var im = f.querySelector('img'); if (!im) return;
      f.addEventListener('pointermove', function(e){
        var r = f.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
        im.style.transform = 'scale(1.05) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      });
      f.addEventListener('pointerleave', function(){ im.style.transform = ''; });
    });
  } else {
    document.body.classList.add('prete');
  }

  // ------------------------------------------------------------ matiere
  // Le grain de l enduit eclaire par une lumiere qui suit le doigt.
  // WebGL brut, aucune bibliotheque, et l image reste visible si ca echoue.
  (function(){
    var fig = document.querySelector('.grain-gl');
    if (!fig) return;
    var img = fig.querySelector('img');
    var cv = fig.querySelector('.toile');
    if (!img || !cv) return;
    var doux = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (doux) return;

    function demarrer(){
      var gl = cv.getContext('webgl', { antialias: false, alpha: false });
      if (!gl) return;
      var vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*0.5+0.5,0.5-p.y*0.5);gl_Position=vec4(p,0.0,1.0);}';
      var fs = [
        'precision mediump float;varying vec2 uv;uniform sampler2D t;uniform vec2 px;uniform vec3 l;',
        'float g(vec2 c){vec3 s=texture2D(t,c).rgb;return dot(s,vec3(0.299,0.587,0.114));}',
        'void main(){',
        ' vec3 base=texture2D(t,uv).rgb;',
        ' float dx=g(uv+vec2(px.x,0.0))-g(uv-vec2(px.x,0.0));',
        ' float dy=g(uv+vec2(0.0,px.y))-g(uv-vec2(0.0,px.y));',
        ' vec3 n=normalize(vec3(-dx*7.0,-dy*7.0,1.0));',
        ' vec3 ld=normalize(vec3(l.xy-uv,l.z));',
        ' float dif=max(dot(n,ld),0.0);',
        ' float spec=pow(max(dot(reflect(-ld,n),vec3(0.0,0.0,1.0)),0.0),18.0);',
        ' vec3 c=base*(0.52+0.72*dif)+spec*0.22;',
        ' gl_FragColor=vec4(c,1.0);',
        '}'
      ].join(String.fromCharCode(10));
      function compiler(type, src){
        var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
      }
      var a = compiler(gl.VERTEX_SHADER, vs), b = compiler(gl.FRAGMENT_SHADER, fs);
      if (!a || !b) return;
      var pr = gl.createProgram(); gl.attachShader(pr, a); gl.attachShader(pr, b); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      gl.useProgram(pr);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pr, 'p');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); }
      catch (err) { return; }
      var uPx = gl.getUniformLocation(pr, 'px'), uL = gl.getUniformLocation(pr, 'l');
      var lx = 0.5, ly = 0.4, cxl = 0.5, cyl = 0.4;

      function taille(){
        var r = fig.getBoundingClientRect();
        var d = Math.min(window.devicePixelRatio || 1, 1.6);
        cv.width = Math.max(1, Math.round(r.width * d));
        cv.height = Math.max(1, Math.round(r.height * d));
        gl.viewport(0, 0, cv.width, cv.height);
        gl.uniform2f(uPx, 1 / cv.width * 1.4, 1 / cv.height * 1.4);
      }
      taille();
      window.addEventListener('resize', taille);
      fig.addEventListener('pointermove', function(e){
        var r = fig.getBoundingClientRect();
        lx = (e.clientX - r.left) / r.width;
        ly = (e.clientY - r.top) / r.height;
      }, { passive: true });
      fig.addEventListener('pointerleave', function(){ lx = 0.5; ly = 0.4; });

      var actif = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function(en){ actif = en[0].isIntersecting; })
          .observe(fig);
      }
      fig.classList.add('allumee');
      (function rendre(){
        if (actif) {
          cxl += (lx - cxl) * 0.09; cyl += (ly - cyl) * 0.09;
          gl.uniform3f(uL, cxl, cyl, 0.55);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        requestAnimationFrame(rendre);
      })();
    }

    if (img.complete && img.naturalWidth) demarrer();
    else img.addEventListener('load', demarrer, { once: true });
  })();

  // ------------------------------------------------------------ nuancier
  // Simulation indicative de teinte : un voile multiplie sur la partie
  // « apres » seulement. Aucune promesse de rendu exact.
  var nuancier = document.querySelector('.nuancier');
  if (nuancier) {
    var cible = document.getElementById(nuancier.getAttribute('data-cadre'));
    var boutons = nuancier.querySelectorAll('.teinte');
    for (var j = 0; j < boutons.length; j++) (function(b){
      b.addEventListener('click', function(){
        for (var k = 0; k < boutons.length; k++) {
          boutons[k].classList.remove('actif');
          boutons[k].setAttribute('aria-pressed', 'false');
        }
        b.classList.add('actif');
        b.setAttribute('aria-pressed', 'true');
        if (cible) cible.style.setProperty('--teinte', b.getAttribute('data-teinte') || '0 0% 0% / 0');
      });
    })(boutons[j]);
  }

  // ------------------------------------------------------------ estimateur
  var est = document.getElementById('estim');
  if (est) {
    var lu = function(n){ return parseFloat(est.getAttribute('data-' + n)); };
    // Les reglages se decouvrent dans le balisage : l estimateur d un plombier
    // n a pas les memes que celui d un ravaleur, et le script ne les connait
    // pas d avance. Voir generateur/sections/prix.mjs.
    var champs = { surface: parseFloat(est.getAttribute('data-defaut') || '120') };
    var groupes = est.querySelectorAll('[data-groupe]');
    for (var q0 = 0; q0 < groupes.length; q0++) {
      var gr = groupes[q0].getAttribute('data-groupe');
      if (champs[gr] === undefined) champs[gr] = 1;
      if (groupes[q0].classList.contains('actif')) champs[gr] = parseFloat(groupes[q0].getAttribute('data-valeur'));
    }
    var sorties = {};
    var liste = est.querySelectorAll('[data-sortie]');
    for (var q = 0; q < liste.length; q++) sorties[liste[q].getAttribute('data-sortie')] = liste[q];
    var rempli = est.querySelector('.rempli');
    var anim = {};

    function espace(n){
      var s = String(Math.round(n)), out = '';
      for (var i = 0; i < s.length; i++) {
        if (i > 0 && (s.length - i) % 3 === 0) out += '\u202F';
        out += s[i];
      }
      return out;
    }

    function versChiffre(cle, valeur){
      var el = sorties[cle]; if (!el) return;
      var depart = anim[cle] === undefined ? valeur : anim[cle];
      var t0 = performance.now(), duree = 420;
      var doux = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (doux) { anim[cle] = valeur; el.textContent = espace(valeur); return; }
      function pas(t){
        var a = Math.min(1, (t - t0) / duree);
        var e = 1 - Math.pow(1 - a, 3);
        var v = depart + (valeur - depart) * e;
        el.textContent = espace(v);
        if (a < 1) requestAnimationFrame(pas); else anim[cle] = valeur;
      }
      requestAnimationFrame(pas);
    }

    function calculer(){
      var s = champs.surface;
      // Les deux sources donnent 5 000 a 10 000 EUR pour 100 m2 d enduit complet,
      // echafaudage compris, soit 50 a 100 EUR le m2. On part de la, et on module.
      var mult = 1;
      for (var k in champs) if (k !== 'surface') mult *= champs[k];
      var bas = lu('total-bas') * mult;
      var haut = lu('total-haut') * mult;
      var tb = Math.round(s * bas / 100) * 100;
      var th = Math.round(s * haut / 100) * 100;
      versChiffre('bas', tb);
      versChiffre('haut', th);
      if (sorties.surface) sorties.surface.textContent = s;
      if (rempli) {
        var part = Math.max(0.08, Math.min(1, th / 40000));
        rempli.style.transform = 'scaleX(' + part.toFixed(3) + ')';
      }
    }

    var curseur = est.querySelector('[data-champ=surface]');
    if (curseur) curseur.addEventListener('input', function(){
      champs.surface = parseFloat(curseur.value); calculer();
    });
    var opts = est.querySelectorAll('.opt');
    for (var o = 0; o < opts.length; o++) (function(b){
      b.addEventListener('click', function(){
        var g = b.getAttribute('data-groupe');
        var freres = est.querySelectorAll('.opt[data-groupe="' + g + '"]');
        for (var k = 0; k < freres.length; k++) {
          freres[k].classList.remove('actif');
          freres[k].setAttribute('aria-pressed', 'false');
        }
        b.classList.add('actif'); b.setAttribute('aria-pressed', 'true');
        champs[g] = parseFloat(b.getAttribute('data-valeur'));
        calculer();
      });
    })(opts[o]);

    calculer();
  }
})();
</script>
</body>
</html>`;

  writeFileSync(join(opts.sortie, 'index.html'), comparateurVariante.appliquer(html, ch.comparateur), 'utf8');

  if (archetype === 'matiere' && ch.structure.page2 && matiere.corpsTravail) {
    const corps2 = matiere.corpsTravail({ e, t, im, img, p, base, illustration,
      mot: motGeant(ch, base, e) });
    const html2 = html
      .replace(/<title>[^<]*<\/title>/, `<title>${echapper(e.nomLisible)}, le travail en détail</title>`)
      .replace(/<main id="principal">[\s\S]*?<\/main>/, `<main id="principal">\n${corps2}\n</main>`)
      .replace(/<div class="entree"[\s\S]*?<\/div>\n/, '');
    writeFileSync(join(opts.sortie, 'le-travail.html'), comparateurVariante.appliquer(html2, ch.comparateur), 'utf8');
  }
  writeFileSync(join(opts.sortie, 'donnees.json'), JSON.stringify({
    entreprise: e, metier: opts.metier, archetype, palette: pal,
    titre: t.titre,
    charte: { famille: ch.famille.cle, familleNom: ch.famille.nom, sol: ch.sol,
      polices: ch.polices.cle, geometrie: ch.geo.cle, mot: ch.mot,
      structure: ch.structure, teintes: ch.teintes, comparateur: ch.comparateur },
    main, photos: table, phrases: phrasesTextes(t),
    coupure: { fraction, ecart: +cp.ecart.toFixed(1), fiable: cp.fiable },
    parametres: p, produitLe: new Date().toISOString().slice(0, 10),
  }, null, 2), 'utf8');

  registre.sites = registre.sites.filter(s => s.siren !== e.siren);
  registre.sites.push({ siren: e.siren, nom: e.denomination, commune: e.commune, metier: opts.metier,
    archetype, accent: pal.accent, titre: t.titre, main,
    photos: Object.values(rolesPhotos(main)).join(','),
    structure: ch.structure.ordre.join('>'), structureDetail: ch.structure, comparateur: ch.comparateur,
    phrases: phrasesTextes(t),
    famille: ch.famille.cle, sol: ch.sol, polices: ch.polices.cle, geometrie: ch.geo.cle, mot: ch.mot,
    produitLe: new Date().toISOString().slice(0, 10) });
  writeFileSync(cheminRegistre, JSON.stringify(registre, null, 2), 'utf8');

  console.log(`${e.denomination} (${e.siren}) -> ${opts.sortie}`);
  console.log(`  archetype ${archetype}, panneau ${p.panneau}% ${p.panneauADroite ? 'a droite' : 'a gauche'}, titre max ${p.titreMax}px`);
  console.log(`  accent ${pal.accent} preleve dans ${pal.accentSource}, coupure a ${(fraction * 100).toFixed(1)}%`);
  console.log(`  ordre ${p.ordre.join(' puis ')}, ${p.nbGestes} gestes, gestes sur accent : ${p.gestesSurAccent ? 'oui' : 'non'}`);
  console.log(`  photos ${Object.entries(table).map(([k, v]) => v).join(', ')}`);
  console.log(`  charte ${ch.famille.cle} (${ch.famille.nom}), sol ${ch.sol}, polices ${ch.polices.cle}, geometrie ${ch.geo.cle}, mot geant ${ch.mot}`);
}

fabriquer({
  siren: arg('siren'),
  metier: arg('metier', 'ravalement'),
  images: arg('images'),
  sortie: arg('sortie'),
  donnees: arg('donnees'),
});

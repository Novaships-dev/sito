// Archetype « matiere ».
// Le sujet du metier devient la forme de la page : le mot est decoupe dans
// l enduit fini et pose sur la facade fatiguee, la page se repare a mesure
// qu on descend, et le grain du chantier sert de papier.
//
// Toute la mise en forme est ici, pas dans style.mjs : cet archetype n est pas
// un habillage des autres, c est une autre page.

import * as atmosphere from '../sections/atmosphere.mjs';
import * as nuancier from '../sections/nuancier.mjs';
import * as arrivee from '../sections/arrivee.mjs';
import * as prix from '../sections/prix.mjs';
import * as avis from '../sections/avis.mjs';
import * as comparateurV from '../sections/comparateur.mjs';

export function feuille(p, pal, ch) {
  const acc = pal.accentOklch || 'oklch(0.68 0.09 68)';
  return `
@property --p{syntax:"<percentage>";inherits:true;initial-value:50%}
${ch.polices.faces}

:root{
  /* palette prélevée : --accent échantillonné dans images/${pal.accentSource || 'chantier'} */
  /* famille : ${ch.famille.nom}, sol ${ch.sol}, voir generateur/charte.mjs */
  --nuit:${pal.nuit};
  --encre:${pal.encre};
  --chaux:${pal.chaux};
  --gris:${pal.gris};
  --papier:${pal.papier};
  --accent:${acc};
  --second:${pal.second};
  --sur-accent:${pal.surAccent};
  --sous-texte:${pal.sousTexte};
  --dit:${pal.dit};
  --dit-fort:${pal.ditFort};
  --ombre-texte:${pal.ombreTexte};
  --lueur-1:${pal.lueur1};
  --lueur-2:${pal.lueur2};
  --rai-1:${pal.rai1};
  --rai-2:${pal.rai2};
  --bouton-fond:${pal.boutonFond};
  --pastille-fond:${pal.pastilleFond};
  --voile-1:${pal.voile1};
  --voile-2:${pal.voile2};
  --voile-3:${pal.voile3};
  --fil:${ch.geo.filet} solid var(--voile-2);
  --rayon:${ch.geo.rayon};
  --m:clamp(20px,${p.marge}vw,${p.margeMax}px);
  --sortie:cubic-bezier(.2,.7,.2,1);
  --titre-police:"Display","Texte",sans-serif;
  --texte-police:"Texte",system-ui,sans-serif;
}
@view-transition{navigation:auto}
::view-transition-old(racine){animation:sortir-vue .3s cubic-bezier(.4,0,1,1) both}
::view-transition-new(racine){animation:entrer-vue .42s cubic-bezier(0,0,.2,1) both}
@keyframes sortir-vue{to{opacity:0;transform:translateY(-14px)}}
@keyframes entrer-vue{from{opacity:0;transform:translateY(18px)}}
.etat{view-transition-name:barre-etat}
main{view-transition-name:racine}
*{margin:0;padding:0;box-sizing:border-box}
/* overscroll-behavior-x : sans ca, un glissement horizontal sur la photo est
   pris par le navigateur comme un geste de retour arriere. La page change et
   la couture ne bouge jamais. C est la panne constatee sur telephone. */
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;overscroll-behavior-x:none}
body{overscroll-behavior-x:none}
body{background:var(--nuit);color:var(--chaux);
  font-family:var(--texte-police);font-weight:400;
  font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;text-wrap:pretty}
img{display:block;max-width:100%;height:auto}
a{color:inherit}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.deplacer{position:absolute;left:-9999px}
.deplacer:focus{position:static;display:inline-block;margin:12px;padding:12px 16px;background:var(--chaux);color:var(--nuit)}

/* ---------------------------------------------------------------- lettrage
   Deux familles en opposition : une display a caractere, un texte neutre.
   Plancher 10 px sur ordinateur, plafond 80. */
.geant{font-family:var(--titre-police);font-weight:800;
  font-size:clamp(38px,${p.motVw}vw,${p.motMax}px);line-height:.94;letter-spacing:-.028em;text-wrap:balance}
.grand{font-family:var(--titre-police);font-weight:700;
  font-size:clamp(28px,3.4vw,46px);line-height:1.02;letter-spacing:-.02em;text-wrap:balance}
.moyen{font-family:var(--titre-police);font-weight:700;
  font-size:clamp(19px,1.8vw,26px);line-height:1.08;letter-spacing:-.012em}
.enseigne{font-family:var(--texte-police);font-weight:600;font-size:10px;line-height:1.7;
  letter-spacing:.17em;text-transform:uppercase}
.note{font-size:13px;line-height:1.5;color:var(--gris)}
.chiffres{font-variant-numeric:tabular-nums lining-nums}

${arrivee.feuille(ch)}

${atmosphere.feuille(p, 'matiere')}

/* ---------------------------------------------------------------- ouverture */
.ouverture{background:var(--nuit);position:relative}
.ouverture .comparateur{margin:0}
.ouverture .cadre img{width:100%;height:auto;aspect-ratio:${p.ratioOuverture};object-fit:cover;
  max-height:min(76svh,860px);object-position:50% 42%}
.ouverture .dire{padding:clamp(22px,2.6vw,40px) var(--m) clamp(24px,2.8vw,44px);container-type:inline-size}
.ouverture .enseigne{color:var(--accent)}
.ouverture h2.geant{margin:.45rem 0 .8rem;color:var(--chaux);
  font-size:clamp(38px, calc(100cqi / var(--signes) * 1.62), ${p.motMax}px)}
.ouverture h2 .mat{background-image:url("images/mur-1500.avif");
  background-size:120% auto;background-position:50% 56%;
  -webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
@supports not ((background-clip:text) or (-webkit-background-clip:text)){
  .ouverture h2 .mat{color:var(--accent);-webkit-text-fill-color:var(--accent);background-image:none}
}
@media (prefers-contrast:more){
  .ouverture h2 .mat{color:var(--chaux);-webkit-text-fill-color:var(--chaux);background-image:none}
}
.ouverture .phrase{font-size:clamp(15px,1.15vw,18px);line-height:1.45;max-width:46ch;color:var(--gris)}
.agir{display:flex;flex-wrap:wrap;gap:10px 16px;margin-top:clamp(16px,2vw,26px);align-items:center}
.tel{display:inline-flex;align-items:center;gap:.6ch;min-height:52px;padding:0 clamp(18px,1.9vw,26px);
  background:var(--accent);color:oklch(0.2 0.02 60);font-weight:700;font-size:15px;
  text-decoration:none;border-radius:2px;
  transition:transform .28s var(--sortie), box-shadow .28s var(--sortie)}
.tel{will-change:transform}
.tel:focus-visible{box-shadow:0 8px 0 -4px var(--voile-2)}
.tel .numero{font-weight:500;opacity:.72;font-size:.82em}
.second{display:inline-flex;align-items:center;min-height:52px;color:var(--chaux);font-weight:600;
  font-size:14px;text-decoration:none;position:relative}
.second::after{content:"";position:absolute;left:0;right:0;bottom:14px;height:1px;background:var(--accent);
  transform-origin:left;transition:transform .34s var(--sortie)}
.second:hover::after,.second:focus-visible::after{transform:scaleX(.32)}

/* bandeau de titre, deuxieme page */
.bandeau-titre{background:var(--nuit);border-bottom:var(--fil);
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:stretch}
.bandeau-titre .vue{overflow:hidden;order:2}
.bandeau-titre .vue img{width:100%;height:100%;min-height:100%;object-fit:cover;
  aspect-ratio:4/3;transition:transform .8s var(--sortie)}
.bandeau-titre:hover .vue img{transform:scale(1.03)}
.bandeau-titre .dit-titre{order:1;container-type:inline-size;
  padding:clamp(40px,5vw,86px) var(--m) clamp(30px,3.4vw,56px)}
.bandeau-titre .enseigne{color:var(--accent)}
.bandeau-titre h1{margin:.6rem 0 .9rem;color:var(--chaux);max-width:16ch;
  font-size:clamp(40px, calc(100cqi / var(--signes) * 1.5), 92px)}
.bandeau-titre .phrase{color:var(--gris);max-width:44ch;font-size:clamp(15px,1.15vw,18px)}
.travail h2{margin:0 0 clamp(24px,2.8vw,44px)}

/* ---------------------------------------------------------------- rubriques */
.rubrique,.travail,.prix,.avis,.verifiable,.contact{
  padding:clamp(44px,${p.respirationResserre}vw,${p.respirationMax}px) var(--m)}
.tete-r{max-width:44rem;margin-bottom:clamp(24px,2.8vw,44px);display:grid;gap:.7rem}
.tete-r .enseigne{color:var(--accent)}

.coupure{position:relative;background:var(--encre)}
.coupure .cliche{position:relative;overflow:hidden}
.coupure .cliche img{width:100%;height:auto;aspect-ratio:${p.ratioCoupure};object-fit:cover}
.coupure .fil{position:absolute;top:0;bottom:0;left:var(--coupure);width:2px;background:var(--chaux)}
.coupure .pastille{position:absolute;top:clamp(12px,1.6vw,20px);padding:7px 11px;
  font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase}
.coupure .pastille.av{left:clamp(12px,1.6vw,20px);background:var(--voile-3);color:var(--chaux)}
.coupure .pastille.ap{right:clamp(12px,1.6vw,20px);background:var(--accent);color:oklch(0.2 0.02 60)}
.coupure .socle-c{display:grid;grid-template-columns:var(--coupure) 1fr}
.coupure .g{background:var(--encre);padding:clamp(20px,2.2vw,34px) var(--m) clamp(26px,2.6vw,40px)}
.coupure .d,.coupure .d *{color:oklch(0.24 0.02 60)}
.coupure .d{background:var(--accent);
  padding:clamp(20px,2.2vw,34px) var(--m) clamp(26px,2.6vw,40px)}
.coupure .socle-c p.t{font-size:14px;max-width:38ch;margin-top:.5rem}

/* comparateur */
.comparateur{margin:0 0 clamp(24px,2.6vw,40px)}
.comparateur.large{margin-inline:calc(var(--m) * -1)}
.cadre{position:relative;overflow:hidden;background:var(--encre);--p:50%}
.cadre img{width:100%;pointer-events:none;-webkit-user-drag:none;-webkit-touch-callout:none}
.cadre .apres{position:absolute;inset:0;height:100%;object-fit:cover;clip-path:inset(0 0 0 var(--p))}
.cadre .couture{position:absolute;top:0;bottom:0;left:var(--p);width:2px;background:var(--chaux);
  pointer-events:none;z-index:2}
.cadre .prise{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:28px;height:50px;background:var(--chaux);
  transition:transform .2s var(--sortie)}
.cadre:hover .prise{transform:translate(-50%,-50%) scaleY(1.12)}
.cadre .prise::before,.cadre .prise::after{content:"";position:absolute;top:15px;bottom:15px;
  width:1px;background:oklch(0.45 0.01 250)}
.cadre .prise::before{left:10px}
.cadre .prise::after{right:10px}
.cadre .etiquette{position:absolute;top:12px;padding:6px 10px;font-size:10px;font-weight:600;
  letter-spacing:.15em;text-transform:uppercase;pointer-events:none;z-index:2}
.cadre .etiquette.av{left:12px;background:var(--voile-3);color:var(--chaux)}
.cadre .etiquette.ap{right:12px;background:var(--chaux);color:var(--nuit)}
/* La glissiere EST le cadre. Un curseur natif se manipule a la souris, au
   doigt, au stylet et au clavier sans une ligne de code a nous ; la couche de
   saisie maison qu il remplace marchait ici et pas sur un vrai telephone.
   touch-action:pan-y laisse le defilement vertical au navigateur et garde le
   geste horizontal pour le curseur. */
.glissiere{position:absolute;inset:0;z-index:3;width:100%;height:100%;margin:0;
  opacity:0;cursor:ew-resize;touch-action:pan-y;background:none;
  -webkit-appearance:none;appearance:none;-webkit-tap-highlight-color:transparent}
.glissiere::-webkit-slider-runnable-track{height:100%;background:none}
/* Largeur du pouce : 2 px. Un pouce large decale la correspondance entre
   la position du doigt et la valeur : il reste sa demi-largeur de marge
   morte a chaque bout, et la couture n arrive jamais ou on l a posee.
   La cible tactile, c est le cadre entier, pas le pouce. */
.glissiere::-webkit-slider-thumb{-webkit-appearance:none;width:2px;height:46px;border:0}
.glissiere::-moz-range-track{height:100%;background:none}
.glissiere::-moz-range-thumb{width:2px;height:46px;border:0}
.glissiere:focus-visible ~ .couture .prise{outline:2px solid var(--accent);outline-offset:3px}
.indice{position:absolute;left:12px;bottom:12px;z-index:4;background:var(--voile-3);
  color:var(--chaux);padding:7px 11px;font-size:10px;font-weight:600;letter-spacing:.15em;
  text-transform:uppercase;pointer-events:none;transition:opacity .4s var(--sortie)}
.indice.parti{opacity:0}
.bascule{display:flex;gap:1px;margin-top:1px;background:var(--voile-2)}
.comparateur.large .bascule{padding-inline:0}
.vers{flex:1 1 0;min-height:52px;padding:15px 18px;border:0;background:var(--nuit);
  color:var(--chaux);font:inherit;font-weight:600;font-size:14px;cursor:pointer;text-align:center;
  transition:background .28s var(--sortie), color .28s var(--sortie)}
.vers:hover,.vers:focus-visible{background:var(--accent);color:oklch(0.2 0.02 60)}
.legende{margin-top:.7rem}

${prix.feuille()}

${nuancier.feuille()}

/* ---------------------------------------------------------------- travail */
.travail{background:var(--nuit)}
.travail .enseigne{color:var(--accent)}
.travail h2{margin:.6rem 0 clamp(26px,3vw,46px)}
.geste{display:grid;grid-template-columns:3.4rem minmax(0,${p.colonneTerme}%) minmax(0,1fr);
  gap:clamp(10px,2vw,32px);padding:clamp(16px,1.9vw,26px) 0;border-top:var(--fil);align-items:baseline;
  transition:background .3s var(--sortie)}
.geste:hover{background:var(--voile-1)}
.geste:last-of-type{border-bottom:var(--fil)}
.geste .n{font-family:var(--titre-police);font-weight:700;font-size:18px;
  color:var(--accent);line-height:1;opacity:.62;transition:opacity .3s var(--sortie)}
.geste:hover .n{opacity:1}
.geste dt{font-family:var(--titre-police);font-weight:700;font-size:clamp(18px,1.7vw,24px);
  line-height:1.04;letter-spacing:-.01em}
.geste dd{color:oklch(0.78 0.012 250);max-width:52ch;font-size:15px;line-height:1.55}

/* ---------------------------------------------------------------- chantier */
.chantier{background:var(--encre);padding:clamp(44px,${p.respirationResserre}vw,${p.respirationMax}px) 0}
.chantier .paire{display:grid;gap:1px;background:var(--voile-2);
  grid-template-columns:${p.chantierInverse ? 'minmax(0,1.3fr) repeat(2,minmax(0,1fr))' : 'repeat(2,minmax(0,1fr)) minmax(0,1.3fr)'}}
.chantier .haute{${p.chantierInverse ? 'order:1' : 'order:3'}}
.chantier figure{margin:0;position:relative;overflow:hidden;background:var(--encre);
  perspective:900px}
.chantier figure img{will-change:transform}
.grain-gl{position:relative}
.grain-gl .toile{position:absolute;inset:0;width:100%;height:100%;display:none;
  pointer-events:none;opacity:0;transition:opacity .6s var(--sortie)}
.grain-gl.allumee .toile{display:block;opacity:1}
.grain-gl.allumee img{visibility:hidden}
.chantier figure img{width:100%;aspect-ratio:4/3;object-fit:cover;
  transition:transform .7s var(--sortie)}
.chantier figure:hover img{transform:scale(1.04)}
/* Le voile a 0,62 ne tient pas sur une macro claire : le 15 septembre 2026,
   la legende du gros plan d enduit se lisait blanc sur beige. Un degrade
   opaque en bas, qui ne mange pas la photo plus haut. */
.chantier figcaption{position:absolute;left:0;bottom:0;right:0;padding:14px 16px 12px;
  background:linear-gradient(to top, oklch(0.12 0.01 60 / .92) 0%,
    oklch(0.12 0.01 60 / .78) 55%, oklch(0.12 0.01 60 / 0) 100%);
  font-size:12.5px;color:var(--chaux);text-shadow:0 1px 3px oklch(0.1 0 0 / .8)}
.chantier .dit{padding:0 var(--m) clamp(22px,2.6vw,38px);max-width:26ch}

/* ---------------------------------------------------------------- avis */
${avis.feuille()}
${comparateurV.feuille()}

/* ---------------------------------------------------------------- verifiable */
.verifiable{background:var(--papier);color:oklch(0.22 0.01 250)}
.mention-illustration{margin-top:10px;padding:10px 13px;border-left:3px solid var(--accent);
  background:oklch(0.94 0.012 70);color:oklch(0.3 0.03 60);font-weight:600}
.verifiable .enseigne{color:oklch(0.5 0.02 250)}
.verifiable .note{color:oklch(0.5 0.02 250)}
.faits{width:100%;border-collapse:collapse;max-width:70rem;font-variant-numeric:tabular-nums}
.faits th,.faits td{text-align:left;padding:.8rem 1.1rem .8rem 0;
  border-bottom:1px solid oklch(0.22 0.01 250 / 0.13);vertical-align:baseline}
.faits th{font-weight:600;font-size:12px;color:oklch(0.5 0.02 250);width:30%}
.faits td{font-size:15px}
.faits td.vide{color:oklch(0.5 0.02 250)}

/* ---------------------------------------------------------------- contact */
.contact{background:var(--nuit)}
.creux{border-top:2px solid var(--accent);padding-top:clamp(20px,2.4vw,34px);max-width:44rem}
.creux .enseigne{color:var(--accent);margin-bottom:.7rem}
.gros-tel{font-family:var(--titre-police);font-weight:800;
  font-size:clamp(28px,4vw,56px);line-height:1;letter-spacing:-.02em;color:var(--accent);
  margin:clamp(12px,1.6vw,22px) 0 .7rem}
.adresse{margin-top:.8rem;font-size:14px;color:var(--gris)}
footer{background:var(--encre);color:var(--gris);padding:clamp(28px,3vw,48px) var(--m);
  display:flex;flex-wrap:wrap;gap:1rem 2.6rem;justify-content:space-between;align-items:flex-end}
footer .enseigne{color:var(--chaux)}

.barre{position:fixed;left:0;right:0;bottom:0;z-index:50;display:none;
  align-items:center;gap:12px;padding:9px 12px;background:var(--nuit);border-top:var(--fil)}
.barre .qui{flex:1 1 auto;font-weight:600;font-size:13px;color:var(--chaux);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.barre .tel{min-height:46px;font-size:15px;padding:0 18px}

@media (prefers-reduced-motion:reduce){
  *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  .entree{display:none!important}
}

/* ---------------------------------------------------------------- telephone */
@media (max-width:900px){
  body{font-size:16px;padding-bottom:66px}
  .enseigne{font-size:12px;letter-spacing:.15em}
  .note,.geste dd,.coupure .socle-c p.t,.avis .carte p{font-size:14px}
  .tarifs .detail{font-size:13px}
  .cadre .etiquette,.coupure .pastille,.indice{font-size:12px}
  .jeton{font-size:12px}
  .tarifs thead th,.faits th{font-size:12px}
  .vers{font-size:15px}
  .barre{display:flex}
  .ouverture .cadre img{aspect-ratio:${p.ratioOuvertureTel};max-height:none}
  .ouverture h2.geant{font-size:clamp(38px, calc(100cqi / var(--signes) * 1.58), 96px)}
  .tel{width:100%;justify-content:center}
  .second{width:100%}
  .coupure .cliche img{aspect-ratio:4/3}
  .coupure .fil{left:var(--coupure-tel)}
  .coupure .socle-c{grid-template-columns:1fr}
  .chantier .paire{grid-template-columns:1fr}
  .bandeau-titre{grid-template-columns:1fr}
  .bandeau-titre .vue{order:1}
  .bandeau-titre .vue img{aspect-ratio:16/10;min-height:0;height:auto}
  .bandeau-titre .dit-titre{order:2;padding-top:clamp(22px,3vw,36px)}
  .bandeau-titre h1{font-size:clamp(40px, calc(100cqi / var(--signes) * 1.5), 72px)}
  .jeton.lien{min-height:44px;padding:0 14px}
  .estimateur{grid-template-columns:1fr;gap:22px}
  .opt{font-size:15px}
  .teinte{font-size:13px}
  .geste{grid-template-columns:2.6rem 1fr;gap:.3rem .9rem}
  .geste dd{grid-column:2}
  .tarifs thead{position:absolute;left:-9999px}
  .tarifs tbody th,.tarifs td{display:block;width:auto;padding:0;border:0}
  .tarifs tbody tr{display:block;padding:1rem 0;
    border-bottom:1px solid oklch(0.22 0.01 250 / 0.14)}
  .tarifs .somme{margin:.2rem 0 .3rem;font-size:22px}
}`;
}

const ech = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function corps(ctx) {
  const { e, t, im, img, p, mot, fraction, fractionTel, base, illustration, ch } = ctx;

  const comparateur = (id, av, ap, legende, classe, altAv, altAp, aria) => `
  <figure class="comparateur ${classe}">
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
    ${legende ? `<figcaption class="legende note">${ech(legende)}</figcaption>` : ''}
  </figure>`;

  const gestes = t.gestes.map((g, i) => `
    <div class="geste"><span class="n chiffres">${String(i + 1).padStart(2, '0')}</span>
      <dt>${ech(g.terme)}</dt><dd>${ech(g.texte)}</dd></div>`).join('');


  const ligne = (th, td, vide) =>
    `<tr><th scope="row">${th}</th><td${vide ? ' class="vide"' : ''}>${td}</td></tr>`;
  const faits = [
    ligne('Dénomination', ech(e.denomination)),
    ligne('SIREN', e.sirenLisible),
    e.siretLisible ? ligne('SIRET du siège', e.siretLisible) : '',
    e.forme ? ligne('Forme juridique', e.forme) : ligne('Forme juridique', 'Non renseignée dans la base', true),
    e.dateLisible ? ligne('Date de création', e.dateLisible) : '',
    e.adresse ? ligne('Siège', ech(e.adresse)) : '',
    e.ape ? ligne('Activité déclarée', e.ape + (e.apeLibelle ? ', ' + e.apeLibelle : '')) : '',
    e.effectif ? ligne('Effectif', 'Tranche ' + e.effectif) : ligne('Effectif', 'Non renseigné dans la base', true),
    ligne('Qualification RGE', e.rge === true ? 'Qualification trouvée' : 'Aucune qualification trouvée à cette date', e.rge !== true),
  ].filter(Boolean).join('\n      ');

  const ans = e.anneeCreation ? new Date().getFullYear() - e.anneeCreation : null;
  // Les descriptions d images decrivent un metier : elles viennent du fichier
  // metier, jamais du moteur. Un metier qui n en declare pas n obtient rien,
  // et le controle A du verificateur le signale plutot que d inventer.
  const alt = base.alt || {};
  const page2 = ch.structure.page2 ? { href: 'le-travail.html', texte: 'Le travail en détail' } : null;

  // Les sections deviennent des pieces nommees : la charte decide
  // lesquelles sont la et dans quel ordre. Un site qui a l estimateur et
  // pas les avis ne se lit pas comme son voisin qui a l inverse.
  const bloc = {
    ouverture: `<section class="ouverture" aria-labelledby="t-ouverture">
  ${comparateur('c1b', im.avant02, im.apres02, '', 'plein',
    'un autre chantier avant reprise',
    'le même chantier une fois l’enduit posé',
    'Comparer un second chantier avant et après')}
  <div class="dire">
    <p class="enseigne scene-1 d2">${ech(e.nomLisible)}</p>
    <h2 id="t-ouverture" class="geant scene-1 d3" style="--signes:${mot.length}"><span class="mat">${ech(mot)}</span></h2>
    <p class="phrase scene-1 d4">${ech(base.libelle.charAt(0).toUpperCase() + base.libelle.slice(1))}${e.commune ? ' à ' + ech(e.commune) : ''}${ans ? `, depuis ${ans} ans` : ''}. ${ech(t.chapo)}</p>
    <div class="agir scene-1 d4">
      <a class="tel" href="tel:">Appeler l’entreprise</a>
      <a class="second" href="#prix">Ce que ça coûte</a>
    </div>
  </div>
</section>`,
    coupure: `<section class="coupure" aria-labelledby="t-coupure"
         style="--coupure:${(fraction * 100).toFixed(1)}%;--coupure-tel:${(fractionTel * 100).toFixed(1)}%">
  <div class="cliche">${img(im.hero, 'immeuble dont une partie est sous échafaudage et l’autre déjà reprise')}
    <span class="fil"></span>
    <span class="pastille av">Avant</span><span class="pastille ap">Après</span></div>
  <div class="socle-c">
    <div class="g"><h2 id="t-coupure" class="moyen">À gauche, avant</h2><p class="t">${ech(t.avant)}</p></div>
    <div class="d"><p class="moyen">À droite, après</p><p class="t">${ech(t.apres)}</p></div>
  </div>
</section>`,
    prix: prix.bloc({ base, ech, estimateur: ch.structure.estimateur, titre: t.rub.prix }),
    travail: `<section class="travail" id="travaux" aria-labelledby="t-travail">
  <p class="enseigne">Le détail des postes</p>
  <h2 id="t-travail" class="grand">${ech(t.rub.gestes)}</h2>
  <dl>${gestes}
  </dl>
</section>`,
    chantier: `<section class="chantier" aria-labelledby="t-chantier">
  <h2 id="t-chantier" class="grand dit">${ech(t.matiere || t.rub.chantier)}</h2>
  <div class="paire">
    <figure class="haute">${img(im.geste, 'la taloche chargée d’enduit appliquée contre le mur')}
      <figcaption class="note">Application, deux passes puis grattage à la lame.</figcaption></figure>
    <figure class="basse">${img(im.chantier, 'échafaudage monté sur une façade d’immeuble')}
      <figcaption class="note">Montage, filet, protection des menuiseries.</figcaption></figure>
    <figure class="basse grain-gl">${img(im.detail, 'gros plan sur le grain de l’enduit fini')}
      <canvas class="toile" aria-hidden="true"></canvas>
      <figcaption class="note">Le grain, à dix centimètres. La lumière suit le doigt.</figcaption></figure>
  </div>
</section>`,
    avis: avis.bloc(),
    verifiable: `<section class="verifiable" aria-labelledby="t-verifiable">
  <div class="tete-r"><p class="enseigne">Sources publiques</p>
    <h2 id="t-verifiable" class="grand">${ech(t.rub.verifiable)}</h2>
    <p class="note">Données de l’annuaire des entreprises, base Sirene. Les lignes vides le sont dans la source.</p>
    ${illustration ? `<p class="note mention-illustration">Les photos de cette page sont des images d’illustration. Elles seront remplacées par les chantiers de l’entreprise avant toute mise en ligne.</p>` : ''}</div>
  <table class="faits"><tbody>
      ${faits}
  </tbody></table>
</section>`,
    contact: `<section class="contact" aria-labelledby="t-contact">
  <div class="creux">
    <p class="enseigne">Prendre contact</p>
    <h2 id="t-contact" class="grand">${ech(t.rub.contact)}</h2>
    <p class="gros-tel">Votre numéro ici</p>
    <p class="note">Le bouton « Appeler » de cette page compose ce numéro dès que vous nous le donnez. Il ne figure dans aucune source publique, et cette page n’en invente aucun.</p>
    ${e.adresse ? `<p class="adresse">${ech(e.adresse)}</p>` : ''}
  </div>
</section>`,
  };

  return `${arrivee.calques({ e, ech })}

<div class="premier-ecran">
${arrivee.pastille({ e, ech, page2 })}

${atmosphere.bloc({ e, t, base, im, ech, comparateur, mot, ans, alt, ch })}
</div>

${ch.structure.ordre.map(k => bloc[k]).filter(Boolean).join('\n\n')}

<div class="barre" aria-hidden="false">
  <span class="qui">${ech(e.nomLisible)}</span>
  <a class="tel" href="tel:">Appeler</a>
</div>`;
}

// Deuxieme page : le travail en detail. Elle partage la barre d etat et la
// feuille de style, donc la transition entre les deux est native.
export function corpsTravail(ctx) {
  const { e, t, im, img, base , illustration } = ctx;
  const gestes = t.gestes.map((g, i) => `
    <div class="geste"><span class="n chiffres">${String(i + 1).padStart(2, '0')}</span>
      <dt>${ech(g.terme)}</dt><dd>${ech(g.texte)}</dd></div>`).join('');
  const jeton = (contenu, point) =>
    `<span class="jeton">${point ? '<span class="point"></span>' : ''}${contenu}</span>`;
  return `
<div class="etat">
  ${jeton(`<b>${ech(e.nomLisible)}</b>`, true)}
  ${e.commune ? jeton(ech(e.commune)) : ''}
  <span class="droite">
    <a class="jeton lien" href="index.html">Retour</a>
    ${jeton(`SIREN <b>${e.sirenLisible}</b>`)}
  </span>
</div>

<section class="bandeau-titre" aria-labelledby="t-detail">
  <div class="vue">${img(im.geste, 'la taloche chargée d’enduit appliquée contre le mur')}</div>
  <div class="dit-titre">
    <p class="enseigne">${ech(base.libelle)}${e.commune ? ', ' + ech(e.commune) : ''}</p>
    <h1 id="t-detail" class="geant" style="--signes:22">Le travail, poste par poste.</h1>
    <p class="phrase">Ce que recouvre exactement le mot ravalement, dans l’ordre où les postes se font.</p>
  </div>
</section>

<section class="travail" aria-labelledby="t-postes">
  <h2 id="t-postes" class="grand">Les postes.</h2>
  <dl>${gestes}
  </dl>
</section>

<section class="chantier" aria-labelledby="t-chantier2">
  <h2 id="t-chantier2" class="grand dit">${ech(t.matiere || 'Sur le chantier.')}</h2>
  <div class="paire">
    <figure class="haute">${img(im.geste, 'la taloche chargée d’enduit appliquée contre le mur')}
      <figcaption class="note">Application, deux passes puis grattage à la lame.</figcaption></figure>
    <figure class="basse">${img(im.chantier, 'échafaudage monté sur une façade d’immeuble')}
      <figcaption class="note">Montage, filet, protection des menuiseries.</figcaption></figure>
    <figure class="basse grain-gl">${img(im.detail, 'gros plan sur le grain de l’enduit fini')}
      <canvas class="toile" aria-hidden="true"></canvas>
      <figcaption class="note">Le grain, à dix centimètres. La lumière suit le doigt.</figcaption></figure>
  </div>
</section>

<section class="contact" aria-labelledby="t-contact2">
  <div class="creux">
    <p class="enseigne">Prendre contact</p>
    <h2 id="t-contact2" class="grand">Parler du chantier.</h2>
    <p class="gros-tel">Votre numéro ici</p>
    <p class="note">Téléphone et horaires viennent ici. Ils ne figurent dans aucune source publique.</p>
    ${illustration ? `<p class="note mention-illustration">Les photos de cette page sont des images d’illustration. Elles seront remplacées par les chantiers de l’entreprise avant toute mise en ligne.</p>` : ''}
  </div>
</section>

<div class="barre">
  <span class="qui">${ech(e.nomLisible)}</span>
  <a class="tel" href="tel:">Appeler</a>
</div>`;
}

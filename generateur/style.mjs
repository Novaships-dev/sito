// Feuille de style engendree. Les valeurs viennent du parametrage tire de la
// graine et de la palette prelevee : deux entreprises ne recoivent jamais la
// meme feuille.
import * as arrivee from './sections/arrivee.mjs';
import * as atmosphere from './sections/atmosphere.mjs';
import * as nuancier from './sections/nuancier.mjs';
import * as prix from './sections/prix.mjs';
import * as avis from './sections/avis.mjs';
import * as comparateurV from './sections/comparateur.mjs';
import { declarer, CONTEXTES } from './charte.mjs';
import * as appel from './sections/appel.mjs';

export function feuille(p, pal, archetype = 'panneau', ch) {
  const acc = pal.accent || pal.bleu;
  return `
${ch.polices.faces}
:root{
  /* palette prélevée : ${pal.accentSource ? '--accent échantillonné dans images/' + pal.accentSource : 'aucun accent chaud trouvé'} */
  /* famille : ${ch.famille.nom}, sol ${ch.sol}, voir generateur/charte.mjs */
  ${declarer(pal)}
  --bleu:${pal.bleu};
  --marge:clamp(20px,${p.marge}vw,${p.margeMax}px);
  --m:var(--marge);
  --fil:${ch.geo.filet} solid var(--voile-2);
  --rayon:${ch.geo.rayon};
  --sortie:cubic-bezier(.2,.7,.2,1);
  --titre-police:"Display","Texte",sans-serif;
  --texte-police:"Texte",system-ui,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-text-size-adjust:100%;overscroll-behavior-x:none}
body{${CONTEXTES.papier};background:var(--papier);color:var(--t);font-family:var(--texte-police);
  font-size:clamp(15px,1.05vw,17px);line-height:${p.interligne};font-synthesis-weight:none}
img{display:block;max-width:100%;height:auto}
a{color:inherit}
:focus-visible{outline:3px solid var(--bleu);outline-offset:3px}
.deplacer{position:absolute;left:-9999px}
.deplacer:focus{position:static;display:inline-block;margin:12px;padding:10px 14px;background:var(--encre);color:var(--chaux)}
.enseigne{font-weight:600;font-size:clamp(10px,.78vw,12px);line-height:1.9;letter-spacing:${p.interlettre}em;text-transform:uppercase}
.geant{font-family:var(--titre-police);font-weight:700;
  font-size:clamp(${p.titreMobile}px,${p.titreVw}vw,${p.titreMax}px);line-height:${p.titreInter};letter-spacing:-.02em;text-wrap:balance}
.grand{font-family:var(--titre-police);font-weight:700;
  font-size:clamp(28px,${(p.titreVw * 0.66).toFixed(2)}vw,${Math.round(p.titreMax * 0.66)}px);line-height:.98;letter-spacing:-.018em}
.moyen{font-family:var(--titre-police);font-weight:700;font-size:clamp(21px,2.4vw,34px);line-height:1.04}
.note{font-size:clamp(11px,.82vw,13px);line-height:1.55;color:var(--t2)}
.ouverture .panneau .note{font-size:clamp(13px,1vw,16px);max-width:${p.panneau === 100 ? '48' : '34'}ch}
.marqueur{position:absolute;${p.marqueurCote}:var(--marge);bottom:var(--marge);background:rgba(0,0,0,.82);
  color:#fff;padding:8px 13px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
.rubrique{padding:clamp(56px,${p.respiration}vw,${p.respirationMax}px) var(--marge)}
.rubrique>.tete{max-width:${p.colonne}rem;margin-bottom:clamp(28px,3.6vw,56px);display:grid;gap:.9rem}
.rubrique>.tete .enseigne{color:var(--t2)}

/* ouverture */
.ouverture{position:relative;display:grid;min-height:min(${p.hauteurOuverture}svh,1000px);
  grid-template-columns:${p.panneauADroite ? `minmax(0,${100 - p.panneau}%) minmax(0,${p.panneau}%)` : `minmax(0,${p.panneau}%) minmax(0,${100 - p.panneau}%)`}}
.ouverture .panneau{${CONTEXTES.sol};background:var(--encre);color:var(--t);padding:var(--marge);
  display:flex;flex-direction:column;justify-content:space-between;gap:${p.panneau === 100 ? '4.5rem' : '2.4rem'};
  ${p.panneau === 100 ? 'min-height:min(' + p.hauteurOuverture + 'svh,760px);' : ''}
  ${p.panneauADroite ? 'order:2;border-left' : 'border-right'}:1px solid var(--voile-2)}
.ouverture .panneau .enseigne{color:var(--t2)}
.ouverture h1{color:var(--t)}
.ouverture .visuel{position:relative;overflow:hidden;background:var(--encre);${p.panneauADroite ? 'order:1' : ''}}
.ouverture .visuel img{width:100%;height:100%;min-height:100%;object-fit:cover;object-position:${p.cadrage}% 50%}
.ouverture.elevation{grid-template-columns:1fr;grid-template-rows:auto auto;min-height:0}
.ouverture.elevation .panneau{border-right:0;border-bottom:1px solid var(--voile-2);order:1}
.ouverture.elevation .visuel{order:2;height:clamp(240px,44svh,540px)}
.trait-accent{position:absolute;${p.panneauADroite ? 'right' : 'left'}:-1px;top:0;width:2px;height:${p.traitHauteur}%;background:var(--accent)}

/* coupure */
.coupure{background:var(--encre)}
.coupure .cliche{position:relative}
.coupure .cliche img{width:100%;aspect-ratio:${p.ratioCoupure};object-fit:cover}
.coupure .fil{position:absolute;top:0;bottom:0;left:var(--coupure);width:2px;background:rgba(226,231,233,.7)}
.coupure .pastille{position:absolute;top:14px;padding:7px 12px;font-size:12px;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase}
.coupure .pastille.av{left:14px;background:rgba(0,0,0,.82);color:#fff}
.coupure .pastille.ap{right:14px;background:var(--accent);color:var(--sur-accent)}
.coupure .socle{display:grid;grid-template-columns:var(--coupure) 1fr}
.coupure .gauche{${CONTEXTES.sol};background:var(--encre);color:var(--t);padding:var(--marge) var(--marge) calc(var(--marge)*1.4)}
.coupure .droite{${CONTEXTES.accent};background:var(--accent);color:var(--t);padding:var(--marge) var(--marge) calc(var(--marge)*1.4)}
.coupure .socle .moyen{margin-bottom:.7rem}
.coupure .socle p.d{font-size:clamp(13px,.95vw,15px);max-width:36ch;color:var(--t2)}

/* comparateur */
.comparateur{margin:0 0 clamp(28px,3.4vw,56px)}
.comparateur.large{margin-inline:calc(var(--marge)*-1)}
.comparateur.decale{margin-left:auto;width:min(100%,${p.largeurDecale}rem)}
.comparateur.serre{width:min(100%,${p.largeurDecale}rem)}
.cadre{position:relative;overflow:hidden;background:var(--encre);--p:50%;
  touch-action:pan-y;cursor:ew-resize;-webkit-user-select:none;user-select:none}
.cadre img{width:100%;pointer-events:none;-webkit-user-drag:none;-webkit-touch-callout:none}

.cadre .indice{position:absolute;left:14px;bottom:14px;z-index:4;
  background:rgba(0,0,0,.72);color:#fff;padding:7px 12px;font-size:12px;font-weight:600;
  letter-spacing:.06em;pointer-events:none;white-space:nowrap}
.cadre .indice.parti{display:none}
.bascule{display:flex;gap:10px;margin-top:12px}
.comparateur.large .bascule{padding-inline:var(--marge)}
.bascule .vers{flex:1 1 0;min-height:52px;padding:14px 16px;border:1px solid currentColor;
  background:transparent;color:inherit;font:inherit;font-weight:600;font-size:15px;
  letter-spacing:.02em;cursor:pointer}
.bascule .vers:hover{background:var(--encre);color:var(--chaux);border-color:var(--encre)}
.cadre .apres{position:absolute;inset:0;height:100%;object-fit:cover;clip-path:inset(0 0 0 var(--p))}
.cadre .couture{position:absolute;top:0;bottom:0;left:var(--p);width:2px;
  background:var(--chaux);pointer-events:none;z-index:2}
.cadre .prise{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:30px;height:54px;background:var(--chaux);box-shadow:0 0 0 1px rgba(0,0,0,.45);
  display:block}
.cadre .prise::before,.cadre .prise::after{content:"";position:absolute;top:16px;bottom:16px;
  width:1px;background:color-mix(in oklab, var(--nuit) 60%, var(--chaux))}
.cadre .prise::before{left:11px}
.cadre .prise::after{right:11px}
.cadre .etiquette{position:absolute;top:14px;padding:6px 11px;font-size:11px;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase;pointer-events:none;z-index:2}
.cadre .etiquette.av{left:14px;background:rgba(0,0,0,.82);color:#fff}
.cadre .etiquette.ap{right:14px;background:rgba(226,231,233,.92);color:#111}
/* La glissiere EST le cadre : un curseur natif se manipule a la souris, au
   doigt, au stylet et au clavier. Voir rules/web/mouvement.md, V4. */
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
.glissiere:focus-visible ~ .couture .prise{box-shadow:0 0 0 3px var(--bleu), 0 0 0 5px var(--chaux)}
.mention-illustration{margin-top:10px;padding:10px 13px;border-left:3px solid var(--accent);
  background:color-mix(in oklab, var(--t) 6%, transparent);color:var(--t);font-weight:600}
.legende{margin-top:.8rem}
.comparateur.large .legende{padding-inline:var(--marge)}

/* gestes */
.travail{${p.gestesSurAccent ? CONTEXTES.accent : CONTEXTES.sol};background:${p.gestesSurAccent ? 'var(--accent)' : 'var(--encre)'};
  color:var(--t);padding:clamp(56px,${p.respiration}vw,${p.respirationMax}px) var(--marge)}
.travail .enseigne{color:var(--t2)}
.travail h2{margin:.6rem 0 clamp(32px,4vw,64px)}
.geste{display:grid;grid-template-columns:minmax(0,${p.colonneTerme}%) minmax(0,1fr);gap:clamp(14px,3vw,48px);
  padding:clamp(18px,2.2vw,30px) 0;border-top:1px solid color-mix(in oklab, var(--t) 26%, transparent)}
.geste:last-of-type{border-bottom:1px solid color-mix(in oklab, var(--t) 26%, transparent)}
.geste dt{font-family:var(--titre-police);font-weight:700;font-size:clamp(20px,2.1vw,30px);line-height:1.02}
.geste dd{color:var(--t2);max-width:52ch}
.geste .chiffre{color:var(--ta);font-size:12px;font-weight:600;
  letter-spacing:.16em;display:block;margin-bottom:.5rem}

/* chantier */
.chantier{display:grid;grid-template-columns:${p.chantierInverse ? 'minmax(0,1.28fr) minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1.28fr)'};
  gap:clamp(10px,1.4vw,20px);align-items:start}
.chantier .pile{display:grid;gap:clamp(10px,1.4vw,20px);${p.chantierInverse ? 'order:2' : ''}}
.chantier img{width:100%;aspect-ratio:4/3;object-fit:cover}
.chantier .haut{${p.chantierInverse ? 'order:1' : ''}}
.chantier .haut img{aspect-ratio:3/4}

/* verifiable */
.verifiable{${CONTEXTES.papier};background:var(--papier-2);color:var(--t);padding:clamp(56px,${p.respiration}vw,${p.respirationMax}px) var(--marge)}
.faits{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;max-width:70rem}
.faits th,.faits td{text-align:left;padding:.85rem 1rem .85rem 0;border-bottom:1px solid color-mix(in oklab, var(--t) 16%, transparent);vertical-align:top}
.faits th{font-weight:600;font-size:clamp(12px,.86vw,14px);color:var(--t2);width:34%}
.faits td{font-size:clamp(14px,1vw,16px)}
.faits td.vide{color:var(--t2)}

/* contact */
.contact{padding:clamp(56px,${p.respiration}vw,${p.respirationMax}px) var(--marge)}
.creux{border:1px solid color-mix(in oklab, var(--t) 22%, transparent);padding:clamp(22px,3vw,40px);max-width:44rem}
.creux .enseigne{color:var(--t2);margin-bottom:.8rem}
footer{${CONTEXTES.sol};background:var(--encre);color:var(--t2);padding:clamp(32px,4vw,60px) var(--marge);
  display:flex;flex-wrap:wrap;gap:1.2rem 3rem;justify-content:space-between;align-items:flex-end}

@media (max-width:900px){
  /* Plancher de lisibilite au doigt : rien sous 12 px sur un telephone. */
  .enseigne{font-size:13px;letter-spacing:.16em}
  .note{font-size:14px}
  .marqueur,.cadre .etiquette{font-size:12px}
  .geste dd,.faits td{font-size:15px}
  .faits th{font-size:13px}
  /* Le premier ecran porte l image ET le titre : l artisan ouvre sur son telephone. */
  /* minmax(0,1fr), pas 1fr : sous WebKit (Safari) le mot le plus long du
     titre elargissait la colonne de 18 px a 360 px de large, et la page
     defilait de cote (elevation, T49, 3 novembre 2026). */
  .ouverture{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto;min-height:0}
  .ouverture .panneau{min-width:0}
  .ouverture .panneau .geant{overflow-wrap:break-word;hyphens:auto}
  .ouverture .visuel{order:1;height:38svh;min-height:230px;max-height:340px}
  .ouverture .visuel img{height:100%}
  .ouverture .panneau{order:2;border:0;gap:1.4rem;padding-top:calc(var(--marge)*1.1);padding-bottom:calc(var(--marge)*1.2)}
  .ouverture .panneau .note{margin-top:.2rem}
  .trait-accent{display:none}
  /* La photo de la coupure passe en 4/3 : a 203 px de haut on ne lit plus une facade. */
  .coupure .cliche img{aspect-ratio:4/3}
  .coupure .fil{left:var(--coupure-tel)}
  .coupure .socle{grid-template-columns:1fr}
  .coupure .gauche{border-top:4px solid var(--voile-2)}
  .coupure .droite{border-top:4px solid var(--accent)}
  .chantier,.chantier .pile,.chantier .haut{grid-template-columns:1fr;order:initial}
  .geste{grid-template-columns:1fr;gap:.5rem}
  .comparateur.decale,.comparateur.serre{width:100%}
  .comparateur.large{margin-inline:calc(var(--marge)*-1)}
  .comparateur.large .legende{padding-inline:var(--marge)}
}

${arrivee.feuille(ch)}
${atmosphere.feuille(p, archetype)}
${nuancier.feuille()}
${prix.feuille()}
${avis.feuille()}
${comparateurV.feuille()}
${appel.feuille()}
`;
}

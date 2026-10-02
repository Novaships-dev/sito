// Arrivee sur la page, commune aux quatre archetypes.
//
// Quatre choses qui ne dependent d aucune composition : l ecran d entree, la
// mise en scene des blocs, le halo de pointeur, et la pastille d etat qui dit
// en haut de page que la boite tourne — uniquement des faits publics.
//
// Jetons attendus dans :root, avec repli : --nuit --chaux --gris --accent --m
// --sortie --voile-2 --fil --titre-police

export function feuille(ch) {
  return `
/* ---------------------------------------------------------------- entree
   Un temps de chargement dessine. Il ne cache jamais le contenu aux moteurs
   ni aux lecteurs d ecran : c est un calque par-dessus, retire en moins d une
   seconde, et supprime des le premier geste. */
.entree{position:fixed;inset:0;z-index:200;background:var(--nuit, var(--encre));
  display:grid;place-items:center;pointer-events:none;
  animation:ecarter .5s cubic-bezier(.7,0,.2,1) 2.4s forwards}
.entree .nom{font-family:var(--titre-police, "Display", sans-serif);font-weight:800;
  font-size:clamp(26px,4.2vw,58px);letter-spacing:-.02em;color:var(--chaux);
  overflow:hidden;line-height:1.1}
.entree .nom span{display:block;transform:translateY(104%);
  animation:lever .72s cubic-bezier(.16,.84,.28,1) .06s forwards}
.entree .trait{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--accent);
  transform:scaleX(0);transform-origin:left;animation:tirer .9s cubic-bezier(.4,0,.2,1) forwards}
.entree.partie{animation:ecarter .62s cubic-bezier(.7,0,.2,1) forwards}
@keyframes lever{to{transform:none}}
@keyframes tirer{to{transform:scaleX(1)}}
@keyframes ecarter{to{clip-path:inset(0 0 100% 0)}}

/* mise en scene : tout entre, rien ne clignote.
   L arrivee est un supplement, jamais une condition d affichage. Le contenu
   est visible par defaut ; c est le script qui demande l animation en posant
   body.anime. Le 16 septembre 2026, l inverse a rendu tout le premier ecran
   invisible sur un iPhone : la classe attendue n arrivait pas, et il ne
   restait qu un degrade vide. Regle V1. */
body.anime .scene-1{transform:translateY(18px);opacity:0;animation:entrer .8s cubic-bezier(.16,.84,.28,1) forwards}
body.anime .scene-1.d2{animation-delay:.09s}
body.anime .scene-1.d3{animation-delay:.18s}
body.anime .scene-1.d4{animation-delay:.27s}
body.anime .scene-1.d5{animation-delay:.36s}
@keyframes entrer{to{transform:none;opacity:1}}
body.anime:not(.prete) .scene-1{animation-play-state:paused}

/* pointeur : un halo autour de la fleche du systeme, jamais a sa place.
   Le deplacement est ecrit a chaque image par le script : aucune transition
   CSS sur transform, sinon les deux se battent et l anneau traine derriere
   le curseur. L echelle passe par une variable, elle seule s anime. */
@property --ech{syntax:"<number>";inherits:true;initial-value:1}
.pointeur{position:fixed;top:0;left:0;z-index:150;width:0;height:0;pointer-events:none;
  opacity:0;--ech:1;transition:opacity .25s var(--sortie, ease)}
.pointeur.vu{opacity:1}
/* L anneau porte l echelle, le parent porte la position. Melanger les deux
   sur un seul element multiplie la translation par l echelle : l anneau part
   a l autre bout de l ecran des qu il grossit. */
.pointeur .anneau{position:absolute;left:-15px;top:-15px;width:30px;height:30px;
  border:1px solid var(--voile-2, rgba(255,255,255,.14));border-radius:50%;scale:var(--ech);
  transition:--ech .2s var(--sortie, ease), border-color .25s var(--sortie, ease)}
.pointeur.sur{--ech:1.75}
.pointeur.sur .anneau{border-color:var(--accent)}
.pointeur .mot{position:absolute;top:26px;left:0;translate:-50% 0;
  padding:3px 7px;border-radius:99px;background:var(--nuit, var(--encre));white-space:nowrap;
  font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--chaux);
  opacity:0;transition:opacity .2s var(--sortie, ease)}
.pointeur.dit .mot{opacity:1}
@media (pointer:coarse){.pointeur{display:none}}

/* Coupure du mouvement. Elle vit ici parce que c est ici qu on declare
   l ecran d entree : une page qui coupe les animations sans cacher le voile
   garde un rideau noir pour toujours. Regles V2 et V3. */
@media (prefers-reduced-motion:reduce){
  *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  .entree{display:none!important}
}

/* ---------------------------------------------------------------- pastille
   Ce que les meilleurs font et que personne ne fait dans le batiment :
   dire en haut de page que la boite tourne. Ici, uniquement des faits publics. */
.etat{position:relative;z-index:8;display:flex;flex-wrap:wrap;align-items:center;
  gap:8px;padding:12px var(--m, var(--marge));border-bottom:var(--fil, 1px solid rgba(255,255,255,.14));background:var(--nuit, var(--encre))}
.etat.flottante{position:absolute;top:18px;left:var(--m, var(--marge));right:var(--m, var(--marge));z-index:12;
  padding:8px 10px;border:1px solid var(--voile-2);border-bottom:1px solid var(--voile-2);
  border-radius:${ch.geo.jeton};background:var(--pastille-fond)}
.jeton{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;
  border:1px solid transparent;border-radius:${ch.geo.jeton};
  font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--gris);
  transition:border-color .3s var(--sortie, ease), color .3s var(--sortie, ease)}
.jeton:hover{border-color:var(--accent);color:var(--chaux)}
.jeton .point{width:6px;height:6px;background:var(--accent);border-radius:50%}
.jeton b{color:var(--chaux);font-weight:600}
.etat .droite{margin-left:auto;display:flex;gap:8px;align-items:center}
.jeton.lien{text-decoration:none;min-height:34px}
.jeton.lien:hover{border-color:var(--accent);color:var(--chaux)}

/* Le bloc telephone vient en dernier : a specificite egale, c est la derniere
   declaration qui gagne. Ecrit plus haut, le plancher de 12 px etait ecrase par
   le 10 px de la pastille declare en dessous. Constate le 23 septembre 2026,
   regle M4. */
@media (max-width:900px){
  .etat, .etat.flottante{position:relative;top:auto;left:auto;right:auto;border-radius:0;border:0;
    border-bottom:var(--fil, 1px solid rgba(255,255,255,.14));background:var(--nuit, var(--encre));padding:10px var(--m, var(--marge));gap:6px}
  .etat .second-plan{display:none}
  .etat .jeton.lien{min-height:44px;padding-top:0;padding-bottom:0}
  .etat .droite{gap:6px}
  /* Plancher de lisibilite au doigt : rien sous 12 px sur un telephone.
     Regle M4. */
  .jeton{font-size:12px;padding:5px 9px;letter-spacing:.1em}
}
`;
}

// L ecran d entree et le halo de pointeur : deux calques, aucun contenu.
export function calques({ e, ech }) {
  return `<div class="entree" id="entree" aria-hidden="true">
  <p class="nom"><span>${ech(e.nomLisible)}</span></p>
  <span class="trait"></span>
</div>
<div class="pointeur" id="pointeur" aria-hidden="true"><span class="anneau"></span><span class="mot"></span></div>`;
}

// La pastille d etat. Rien qui ne soit un fait public : nom, commune, annee de
// creation, SIREN. L heure sur place est calculee par le script.
// `page2` ajoute le lien vers la seconde page quand l archetype en produit une.
export function pastille({ e, ech, page2 = null }) {
  const jeton = (contenu, point) =>
    `<span class="jeton">${point ? '<span class="point"></span>' : ''}${contenu}</span>`;
  const second = (x) => jeton(x).replace('class="jeton"', 'class="jeton second-plan"');
  return `<div class="etat flottante scene-1">
  ${jeton(`<b>${ech(e.nomLisible)}</b>`, true)}
  ${e.commune ? jeton(ech(e.commune)) : ''}
  ${e.anneeCreation ? second(`Établie en <b>${e.anneeCreation}</b>`) : ''}
  ${second(`<span class="heure">00:00</span> sur place`)}
  <span class="droite">
    ${page2 ? `<a class="jeton lien" href="${page2.href}">${ech(page2.texte)}</a>` : ''}
    ${second(`SIREN <b>${e.sirenLisible}</b>`)}
  </span>
</div>`;
}

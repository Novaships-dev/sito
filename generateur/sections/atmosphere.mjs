import { CONTEXTES } from '../charte.mjs';
// Premier ecran d ambiance, commun aux quatre archetypes.
//
// Ce qui manquait a nos pages face aux meilleurs sites : de l air. Une lumiere
// qui derive, de la poussiere dedans, du grain sur tout, et le mot du metier en
// geant coupe par les bords. Le titre, lui, redescend : le drame vient de
// l environnement, pas du corps de la police. Voir docs/etude-framer.md.
//
// La matiere commune ne fait pas quatre pages identiques : chaque archetype
// recoit sa propre disposition (variante), et les valeurs continuent de venir
// de la graine. Meme air, quatre compositions.
//
// Jetons attendus dans :root, avec repli pour les feuilles qui ne les ont pas :
//   --nuit --chaux --accent --m --sortie --bruit --titre-police

export const VARIANTES = { matiere: 'cote', panneau: 'miroir', planche: 'pile', elevation: 'bandeau' };

export function feuille(p, archetype = 'matiere') {
  const v = VARIANTES[archetype] || 'cote';
  return `
/* ---------------------------------------------------------------- atmosphere
   L en-tete et l atmosphere forment un seul premier ecran. Sur grand ecran le
   groupe ne produit aucune boite : rien ne bouge. Sur telephone c est lui qui
   vaut un ecran, et l atmosphere prend ce qui reste sous la barre d etat, dont
   la hauteur depend du nom de l entreprise et ne peut donc pas etre ecrite en
   dur. */
.premier-ecran{display:contents}
.atmo{${CONTEXTES.sol};position:relative;height:100svh;min-height:560px;overflow:hidden;isolation:isolate;
  background:var(--nuit, var(--encre));display:flex;flex-direction:column;justify-content:center;
  padding:clamp(86px,9vh,120px) var(--m, var(--marge)) clamp(56px,7vh,86px)}
.atmo .aura{position:absolute;inset:-30%;z-index:0;pointer-events:none;
  background:
    radial-gradient(38% 46% at var(--lx,58%) var(--ly,34%),
      color-mix(in oklab, var(--accent) 92%, white) 0%,
      color-mix(in oklab, var(--accent) 60%, transparent) 34%, transparent 68%),
    radial-gradient(52% 62% at calc(var(--lx,58%) + 14%) calc(var(--ly,34%) + 26%),
      color-mix(in oklab, var(--second) 62%, transparent) 0%, transparent 62%);
  filter:blur(58px) saturate(118%);opacity:.68;
  animation:respirer ${p.souffle}s ease-in-out infinite alternate}
@keyframes respirer{from{transform:translate3d(-2%,-1%,0) scale(1.02)}
  to{transform:translate3d(3%,2%,0) scale(1.1)}}
.atmo .rai{position:absolute;inset:-20% -10%;z-index:1;pointer-events:none;
  background:linear-gradient(${p.angleRai}deg, transparent 34%,
    var(--rai-1) 44%, var(--rai-2) 50%, var(--rai-1) 57%, transparent 66%);
  mix-blend-mode:screen;
  animation:balayer ${p.souffle + 4}s ease-in-out infinite alternate}
@keyframes balayer{from{transform:translateX(-4%) rotate(-1.2deg)}
  to{transform:translateX(5%) rotate(1.4deg)}}
.atmo canvas.poussiere{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:.7}
.grain{position:fixed;inset:-100%;z-index:9;pointer-events:none;opacity:.045;
  background-image:var(--bruit);background-size:220px 220px;mix-blend-mode:overlay;
  animation:trembler 1.1s steps(3) infinite}
@keyframes trembler{0%{transform:translate(0,0)}33%{transform:translate(-6px,4px)}
  66%{transform:translate(5px,-5px)}100%{transform:translate(0,0)}}

/* Le mot est le DERNIER element du flux, pas un calque. En absolu, les
   etiquettes du bas se posaient dessus : blanc sur enduit clair, illisible,
   constate le 15 septembre 2026 sur une capture d ecran de 1350 px. */
.atmo .marque{position:relative;z-index:0;
  margin-top:auto;margin-bottom:-0.16em;
  font-family:var(--titre-police, "Display", sans-serif);font-weight:800;letter-spacing:-.045em;
  font-size:clamp(90px, ${p.marqueVw}vw, 300px);line-height:.8;white-space:nowrap;
  color:transparent;-webkit-text-fill-color:transparent;
  background-image:url("images/mur-1500.avif");background-size:112% auto;background-position:50% 62%;
  -webkit-background-clip:text;background-clip:text;
  opacity:.42;pointer-events:none;filter:contrast(112%) brightness(108%)}
.atmo .marque::after{content:attr(data-mot);position:absolute;inset:0;z-index:-1;
  color:var(--voile-1);-webkit-text-fill-color:var(--voile-1)}
@supports not ((background-clip:text) or (-webkit-background-clip:text)){
  .atmo .marque{color:var(--voile-1);-webkit-text-fill-color:var(--voile-1);background-image:none}}

.atmo .corps-atmo{position:relative;z-index:11;min-height:0;display:grid;
  gap:clamp(26px,4vw,64px);align-items:center}
.atmo .phrase-atmo{max-width:52ch;min-height:0}
.atmo .corps-atmo{min-height:0}
.atmo .phrase-atmo .trait{display:block;width:44px;height:2px;background:var(--accent);
  margin-bottom:22px;transform-origin:left;animation:tirer 1.1s var(--sortie, ease) .5s both}
.atmo h1{font-family:var(--titre-police, "Display", sans-serif);font-weight:500;
  font-size:clamp(${p.titreAtmoTel}px, 2.4vw, ${p.titreAtmo}px);line-height:1.15;
  letter-spacing:-.02em;color:var(--t);text-wrap:balance}
.atmo .sous{margin-top:18px;font-size:clamp(14px,1.1vw,16px);line-height:1.6;
  color:var(--sous-texte);max-width:38ch}
.atmo .photo{position:relative;overflow:hidden;border-radius:2px;margin:0;
  box-shadow:0 50px 90px -30px rgb(0 0 0 / .75), 0 0 0 1px var(--voile-1)}
.atmo .photo .comparateur{margin:0}
.atmo .photo .cadre img{width:100%;height:100%;aspect-ratio:${p.ratioAtmo};object-fit:cover;display:block;
  max-height:min(50svh, 430px)}
/* Dans l atmosphere le cadre peut devenir bas : l invitation se range en bas a
   droite, le seul coin libre, sinon elle se pose sur l etiquette  Avant .
   Constate le 23 septembre 2026 sur l elevation et la planche. */
.atmo .cadre .indice{left:auto;right:14px}
.atmo .photo .bascule{margin-top:10px;display:flex;gap:8px;justify-content:center}
.atmo .photo .vers{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;
  color:var(--t);background:var(--bouton-fond);border:1px solid var(--voile-2);
  border-radius:99px;padding:9px 15px;min-height:44px;cursor:pointer;
  transition:background .25s var(--sortie, ease), color .25s var(--sortie, ease)}
.atmo .photo .vers:hover{background:var(--accent);color:var(--sur-accent)}
.atmo .photo .lueur{z-index:4;position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(42% 42% at var(--px,50%) var(--py,40%),
    var(--lueur-1) 0%, var(--lueur-2) 38%, transparent 70%);
  mix-blend-mode:soft-light}
.atmo .photo .bord{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(to top, var(--voile-3), transparent 46%)}
.atmo .nuancier{position:relative;z-index:11;margin-top:clamp(16px,2.4vh,26px)}
.atmo .dit{position:relative;z-index:11;font-size:11.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--dit);font-weight:600;
  text-shadow:0 1px 16px var(--ombre-texte), 0 0 40px var(--ombre-texte)}
.atmo .haut{margin-bottom:clamp(22px,4vh,52px);position:relative;z-index:11}
/* Le nom de l entreprise se lit avant tout le reste. Le 15 septembre 2026 il
   n existait qu en 10 px dans la pastille, contre 258 px pour le mot decoratif :
   la page parlait du metier, pas de l artisan. */
.atmo .nom-atmo{font-family:var(--titre-police, "Display", sans-serif);font-weight:700;
  font-size:clamp(15px,1.25vw,19px);letter-spacing:.14em;text-transform:uppercase;
  color:var(--ta);margin-bottom:7px}
.atmo .bas{margin-top:clamp(20px,3.4vh,44px);display:flex;justify-content:space-between;
  align-items:center;gap:16px;flex-wrap:wrap;
  /* le mot geant passe derriere : sans ce voile les etiquettes se lisent
     gris sur beige, c est-a-dire pas du tout */
  position:relative;z-index:12}
.atmo .bas .dit{color:var(--dit-fort)}
.atmo .fleche{display:inline-block;animation:descendre 2.4s var(--sortie, ease) infinite}
@keyframes descendre{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(5px);opacity:1}}
.heure{font-variant-numeric:tabular-nums}

${disposition(v, p)}

/* Ecran bas (un portable en 1350x700) : la colonne se tasse et la phrase
   passait sous le nuancier. Tout redescend d un cran plutot que de se
   chevaucher. */
@media (min-width:901px) and (max-height:820px){
  .atmo h1{font-size:clamp(26px,2vw,33px)}
  .atmo .sous{font-size:14px;margin-top:12px}
  .atmo .photo .cadre img{max-height:min(42svh, 330px)}
  .atmo .marque{font-size:11.5vw}
  .atmo .haut{margin-bottom:14px}
  .atmo .nuancier{margin-top:12px}
  .atmo .bas{margin-top:12px}
}

/* Sur telephone, les trois couches d ambiance coutent trop cher : un flou de
   58 px sur un element plein ecran, un fondu d ecran anime, et un calque de
   grain en position fixe trois fois plus grand que l ecran. Sur un appareil
   moyen ca saccade, et sur iOS un mix-blend-mode en position fixe peut
   barbouiller la page entiere. On garde la lumiere, on arrete de l animer. */
@media (max-width:900px), (pointer:coarse){
  .atmo .aura{animation:none;filter:blur(40px) saturate(112%);opacity:.6;
    will-change:auto;inset:-18%}
  .atmo .rai{animation:none;opacity:.7}
  .atmo canvas.poussiere{display:none}
  .grain{position:absolute;inset:0;animation:none;opacity:.05;
    background-size:180px 180px}
}
/* Sur telephone, l atmosphere vaut exactement un ecran, barre d appel deduite.
   Elle ne se laisse pas grandir : la hauteur est fixe et c est la photo qui
   prend ce qui reste. Ecrite en hauteur libre, elle mesurait 1000 px sur un
   ecran de 844 : le mot geant et la ligne  Defiler  tombaient sous le pli et
   l ecran paraissait decale. Le titre se mesure en svh, pas en vw, parce que
   c est la hauteur qui manque, jamais la largeur. */
@media (max-width:900px){
  .premier-ecran{display:flex;flex-direction:column;min-height:calc(100svh - var(--barre-h, 66px))}
  .premier-ecran .etat{flex:0 0 auto}
  .atmo{height:auto;flex:1 1 auto;min-height:0;padding:20px 18px 16px;
    justify-content:flex-start;gap:0;overflow:hidden}
  .atmo .haut{margin-bottom:8px}
  .atmo .nom-atmo{font-size:14px;letter-spacing:.12em}
  .atmo .corps-atmo{display:flex;flex-direction:column;gap:12px;flex:1 1 auto;min-height:0;
    text-align:left}
  .atmo .phrase-atmo{flex:0 0 auto;margin:0;max-width:none}
  .atmo h1{font-size:clamp(40px,4.8svh,46px);line-height:1.14}
  /* la phrase d appui revient juste en dessous, dans l ouverture : sur
     telephone le premier ecran garde le titre, la photo et le nuancier */
  .atmo .sous{display:none}
  .atmo .photo{flex:1 1 auto;min-height:190px;display:flex;flex-direction:column;order:0}
  .atmo .photo .comparateur{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
  .atmo .photo .cadre{flex:1 1 auto;min-height:0}
  .atmo .photo .cadre img{aspect-ratio:auto;height:100%;max-height:none;object-fit:cover}
  .atmo .photo .bascule{margin-top:8px}
  .atmo .photo .vers{font-size:10px;padding:8px 12px}
  /* le nuancier tient sur une ligne qui se fait defiler, jamais sur trois */
  .atmo .nuancier{margin-top:10px;flex:0 0 auto}
  .atmo .nuancier .teintes{flex-wrap:nowrap;overflow-x:auto;overscroll-behavior-x:contain;
    scrollbar-width:none;padding-bottom:2px}
  .atmo .nuancier .teintes::-webkit-scrollbar{display:none}
  .atmo .nuancier .teinte{flex:0 0 auto}
  /* la commune est deja dite dans la ligne du haut : sur telephone on ne la
     repete pas, il ne reste que l invitation a defiler */
  .atmo .bas{margin-top:8px}
  .atmo .bas .dit:first-child{display:none}
  /* la ligne passe devant le mot geant : elle se detache quand meme */
  .atmo .bas .dit{text-shadow:0 1px 4px var(--ombre-texte)}
  /* le mot geant passe derriere : decoratif, il ne coute plus rien a la hauteur */
  .atmo .marque{position:absolute;left:0;right:0;bottom:-0.16em;margin:0;text-align:center;
    font-size:16vw;z-index:0;opacity:.26}
}

/* Hauteur au pixel pres seulement si l ecran est assez haut pour tout tenir.
   Sur un ecran court, le premier ecran se laisse depasser et se fait defiler :
   mieux vaut cent pixels de trop que des blocs qui se recouvrent. */
@media (max-width:900px) and (min-height:800px){
  .premier-ecran{height:calc(100svh - var(--barre-h, 66px));overflow:hidden}
}`;
}

// Quatre dispositions pour la meme matiere. Ce qui change : l ordre du texte et
// de la photo, l alignement du mot geant, la largeur des colonnes.
function disposition(v, p) {
  if (v === 'miroir') return `
/* miroir : la photo ouvre, le texte repond. Le mot geant se cale a gauche. */
.atmo .corps-atmo{grid-template-columns:minmax(0,${p.colonneAtmo}fr) minmax(0,1fr)}
.atmo .photo{order:1}
.atmo .phrase-atmo{order:2;justify-self:end}
.atmo .marque{align-self:flex-start;margin-left:-.04em}
.atmo .bas{justify-content:flex-start;gap:clamp(20px,5vw,72px)}`;

  if (v === 'pile') return `
/* Le haut de ces deux compositions laisse la place de la pastille d etat, bouton
   d appel compris : 18 px de marge et 52 px de pastille. Avec 66 px, le nom de
   l entreprise passait dessous, constate le 2 octobre 2026. Controle O15. */
/* pile : tout est centre, la photo tient toute la largeur sous le titre, et le
   mot geant se cale a droite. Une planche, pas deux colonnes.
   La composition empilee demande plus de hauteur qu un ecran sur un portable :
   elle se laisse depasser et se fait defiler. Un bloc qui deborde de sa rangee
   passe SOUS le suivant et le recouvre : le nuancier se posait sur les boutons
   du comparateur, qui devenaient incliquables. Constate le 23 septembre 2026.
   Cent pixels de trop valent mieux que deux blocs qui se recouvrent. */
.atmo{justify-content:flex-start;padding-top:clamp(96px,10vh,120px);padding-bottom:clamp(40px,5vh,64px);
  height:auto;min-height:100svh}
.atmo .haut{margin-bottom:clamp(16px,2.4vh,30px)}
.atmo .corps-atmo{grid-template-columns:minmax(0,1fr);gap:clamp(20px,2.6vw,38px);
  justify-items:center;text-align:center}
.atmo .phrase-atmo{max-width:${Math.round(38 + p.colonneAtmo * 6)}ch}
.atmo .phrase-atmo .trait{margin-left:auto;margin-right:auto;transform-origin:center}
.atmo .sous{margin-left:auto;margin-right:auto}
.atmo .photo{width:min(100%, ${p.largeurDecale + 14}rem)}
.atmo .photo .cadre img{aspect-ratio:${p.ratioOuverture};max-height:min(32svh, 300px)}
.atmo .nuancier{align-self:center;text-align:center}
.atmo .nuancier .teintes{justify-content:center}
/* le mot geant cede : dans une composition empilee c est la photo qui doit
   respirer, pas la decoration */
.atmo .marque{align-self:flex-end;margin-right:-.04em;
  font-size:clamp(70px, ${Math.min(p.marqueVw, 11)}vw, 190px)}`;

  if (v === 'bandeau') return `
/* bandeau : le titre prend toute la largeur, la photo s etale dessous, le
   nuancier se range a droite. Le mot geant sort par la gauche.
   Meme raison que la pile : la hauteur se laisse depasser plutot que de
   faire se recouvrir deux blocs. */
.atmo{justify-content:flex-start;padding-top:clamp(96px,10vh,120px);padding-bottom:clamp(40px,5vh,64px);
  height:auto;min-height:100svh}
.atmo .haut{margin-bottom:clamp(16px,2.4vh,30px)}
.atmo .corps-atmo{grid-template-columns:minmax(0,1fr);gap:clamp(18px,2.2vw,32px)}
.atmo .phrase-atmo{max-width:none}
.atmo h1{max-width:${Math.round(16 + p.colonneAtmo * 3)}ch}
.atmo .sous{max-width:52ch}
.atmo .photo .cadre img{aspect-ratio:16/9;max-height:min(32svh, 300px)}
.atmo .nuancier{align-self:flex-end;text-align:right}
.atmo .nuancier .teintes{justify-content:flex-end}
.atmo .marque{align-self:flex-start;margin-left:-.07em;opacity:.34;
  font-size:clamp(70px, ${Math.min(p.marqueVw, 11)}vw, 190px)}`;

  return `
/* cote : le texte a gauche, la photo a droite, le mot geant centre. */
.atmo .corps-atmo{grid-template-columns:minmax(0,1fr) minmax(0,${p.colonneAtmo}fr)}
.atmo .marque{align-self:center}`;
}

// Le bloc. Les teintes viennent du fichier metier : aucune couleur n est
// inventee ici, et un metier sans nuancier n en recoit pas.
export function bloc({ e, t, base, im, ech, comparateur, mot, ans, alt, ch }) {
  // Le nuancier ne montre jamais le vivier entier ni dans l ordre du fichier :
  // la teinte d origine reste en tete, les autres tournent avec la graine.
  const vivier = Array.isArray(base.teintes) ? base.teintes : [];
  const teintes = (() => {
    if (vivier.length < 2 || !ch || !ch.teintes) return vivier;
    const reste = vivier.slice(1);
    const n = Math.min(ch.teintes.combien, reste.length);
    const pris = [];
    for (let i = 0; i < n; i++) pris.push(reste[(ch.teintes.depart + i) % reste.length]);
    return [vivier[0], ...pris];
  })();
  const nuancier = teintes.length < 2 ? '' : `
  <div class="nuancier scene-1 d5" data-cadre="c0">
    <p class="etiq">${ech(base.nuancierEtiquette || 'Voir l’après dans une autre teinte')}</p>
    <div class="teintes">
${teintes.map((x, i) => `      <button type="button" class="teinte${i === 0 ? ' actif' : ''}" data-teinte="${x.voile || ''}"${i === 0 ? ' aria-pressed="true"' : ''}><span style="background:${x.pastille}"></span>${ech(x.nom)}</button>`).join('\n')}
    </div>
  </div>`;

  return `<section class="atmo" aria-labelledby="t-atmo">
  <span class="aura" aria-hidden="true"></span>
  <span class="rai" aria-hidden="true"></span>
  <canvas class="poussiere" data-decor="oui" aria-hidden="true"></canvas>
  <div class="haut scene-1 d2">
    <p class="nom-atmo">${ech(e.nomLisible)}</p>
    <p class="dit">${ech(base.libelle.charAt(0).toUpperCase() + base.libelle.slice(1))}${e.commune ? ` à ${ech(e.commune)}` : ''}${ans ? `, depuis ${ans} ans` : ''}</p>
  </div>

  <div class="corps-atmo">
    <div class="phrase-atmo scene-1 d3">
      <span class="trait"></span>
      <h1 id="t-atmo">${ech(t.titre)}</h1>
      <p class="sous">${ech(t.chapo)}</p>
    </div>
    <div class="photo scene-1 d4">
      ${comparateur('c0', im.avant01, im.apres01, '', 'nu', alt.avant, alt.apres, alt.invitation)}
      <span class="lueur" aria-hidden="true"></span>
    </div>
  </div>
${nuancier}
  <div class="bas">
    <p class="dit scene-1 d5">${e.commune ? ech(e.commune) : 'Chantier'}${e.anneeCreation ? `, entreprise établie en ${e.anneeCreation}` : ''}</p>
    <p class="dit scene-1 d5">Défiler <span class="fleche" aria-hidden="true">↓</span></p>
  </div>

${mot ? `  <span class="marque" data-mot="${ech(mot.toUpperCase())}" aria-hidden="true">${ech(mot.toUpperCase())}</span>` : ''}
</section>`;
}

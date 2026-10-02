// Nuancier de teintes, commun aux quatre archetypes.
//
// Simulation indicative : un voile multiplie sur la partie « apres » du
// comparateur. Aucune promesse de rendu exact, et c est ecrit dans la page.
// Les couleurs viennent du fichier metier ; ce module ne connait aucune teinte.
//
// Le balisage est produit par sections/atmosphere.mjs, qui pose le nuancier au
// bon endroit de sa composition. Ici, seulement la forme.

export function feuille() {
  return `
/* ---------------------------------------------------------------- nuancier */
.nuancier{margin-top:clamp(16px,2vw,26px)}
.nuancier .etiq{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;
  color:var(--t2);margin-bottom:.6rem}
.teintes{display:flex;flex-wrap:wrap;gap:8px}
.teinte{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px 0 10px;
  border:1px solid var(--voile-2, rgba(255,255,255,.14));background:transparent;color:var(--t2);
  font:inherit;font-weight:600;font-size:12px;cursor:pointer;border-radius:2px;
  transition:border-color .25s var(--sortie, ease), color .25s var(--sortie, ease)}
.teinte span{width:18px;height:18px;border-radius:50%;
  box-shadow:inset 0 0 0 1px var(--voile-2, rgba(255,255,255,.14))}
.teinte:hover{border-color:var(--accent);color:var(--t)}
.teinte.actif{border-color:var(--accent);color:var(--t)}
.cadre .teint{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:hsl(var(--teinte, 0 0% 0% / 0));mix-blend-mode:multiply;
  clip-path:inset(0 0 0 var(--p));transition:background .55s var(--sortie, ease)}`;
}

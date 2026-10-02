// Prix et estimateur, communs aux quatre archetypes.
//
// Les chiffres ne varient jamais d un site a l autre : ce sont des faits
// releves et sources, pris dans le fichier metier. Ce qui varie, c est la
// presence de la section, sa place dans la page, et la presence de
// l estimateur. Voir generateur/charte.mjs, structurer().
//
// Jusqu au 24 septembre 2026, seul le vaisseau amiral avait un prix : les
// trois autres archetypes recevaient le SCRIPT de l estimateur sans jamais
// avoir le balisage correspondant. Du code mort livre au client.

export function feuille() {
  return `
/* ---------------------------------------------------------------- prix */
.prix{background:var(--papier);color:var(--encre)}
.prix .enseigne{color:color-mix(in oklab, var(--encre) 62%, var(--papier))}
.prix .note{color:color-mix(in oklab, var(--encre) 62%, var(--papier))}
.tarifs{width:100%;border-collapse:collapse;max-width:74rem;
  font-variant-numeric:tabular-nums lining-nums;margin-bottom:clamp(28px,3vw,48px)}
.tarifs th,.tarifs td{text-align:left;padding:.85rem 1.2rem .85rem 0;vertical-align:baseline;
  border-bottom:1px solid color-mix(in oklab, var(--encre) 14%, transparent)}
.tarifs thead th{font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;
  color:color-mix(in oklab, var(--encre) 62%, var(--papier));border-bottom-width:2px}
.tarifs tbody th{font-weight:600;font-size:15px;width:30%}
.tarifs .somme{font-family:var(--titre-police);font-weight:700;font-size:20px;
  white-space:nowrap;width:20%}
.tarifs .detail{font-size:13px;color:color-mix(in oklab, var(--encre) 74%, var(--papier))}
.tarifs tbody tr{transition:background .25s var(--sortie)}
.tarifs tbody tr:hover{background:color-mix(in oklab, var(--encre) 4%, transparent)}
.total{border-top:2px solid var(--encre);padding-top:clamp(16px,1.9vw,26px);max-width:46rem}
.somme-geante{font-family:var(--titre-police);font-weight:800;
  font-size:clamp(38px,5.6vw,80px);line-height:.92;letter-spacing:-.03em;margin:.35rem 0 .7rem}
.total .note{max-width:56ch}
.total .note + .note{margin-top:.4rem}
.total a{color:inherit;text-underline-offset:3px}

/* ---------------------------------------------------------------- estimateur
   Le seul endroit de la page ou le visiteur agit sur des chiffres.
   Les fourchettes viennent des memes sources que le tableau au-dessus. */
.estimateur{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:clamp(20px,2.6vw,44px);border-top:2px solid var(--encre);
  padding-top:clamp(20px,2.4vw,34px);margin-bottom:clamp(28px,3vw,48px)}
.estimateur .enseigne{grid-column:1 / -1;color:color-mix(in oklab, var(--encre) 62%, var(--papier))}
.reglages{display:grid;gap:clamp(16px,1.8vw,26px);align-content:start}
.etiq{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;
  color:color-mix(in oklab, var(--encre) 74%, var(--papier));margin-bottom:.5rem}
.etiq b{font-weight:700;color:var(--encre)}
.reglage input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:48px;
  background:transparent;touch-action:pan-y;display:block}
.reglage input[type=range]::-webkit-slider-runnable-track{height:3px;background:color-mix(in oklab, var(--encre) 22%, transparent)}
.reglage input[type=range]::-moz-range-track{height:3px;background:color-mix(in oklab, var(--encre) 22%, transparent)}
.reglage input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
  width:26px;height:26px;margin-top:-11px;background:var(--accent);border:2px solid var(--encre);
  border-radius:50%;cursor:ew-resize;transition:transform .2s var(--sortie)}
.reglage input[type=range]::-moz-range-thumb{width:26px;height:26px;background:var(--accent);
  border:2px solid var(--encre);border-radius:50%;cursor:ew-resize}
.reglage input[type=range]:hover::-webkit-slider-thumb{transform:scale(1.12)}
.choix{border:0;padding:0;margin:0}
.choix legend{padding:0}
.opt{min-height:46px;padding:0 16px;margin:0 6px 6px 0;border:1px solid color-mix(in oklab, var(--encre) 30%, transparent);
  background:transparent;color:var(--encre);font:inherit;font-weight:600;font-size:14px;
  cursor:pointer;border-radius:2px;
  transition:background .25s var(--sortie), color .25s var(--sortie), border-color .25s var(--sortie)}
.opt:hover{border-color:var(--encre)}
.opt.actif{background:var(--encre);color:var(--papier);border-color:var(--encre)}
.resultat{align-self:start}
.resultat .somme-geante{margin:.2rem 0 .8rem;font-size:clamp(32px,4.6vw,66px)}
.jauge{height:5px;background:color-mix(in oklab, var(--encre) 16%, transparent);overflow:hidden;margin-bottom:.9rem}
.jauge .rempli{display:block;height:100%;width:100%;background:var(--accent);
  transform-origin:left;transform:scaleX(.38);transition:transform .5s var(--sortie)}
.resultat .note{max-width:46ch}


/* Section et tete : declarees ici pour que les quatre archetypes l aient,
   pas seulement celui qui a ecrit le premier tableau. */
.prix{background:var(--papier);color:var(--encre);
  padding:clamp(56px,6vw,110px) var(--m, var(--marge))}
.prix .tete-r{max-width:44rem;margin-bottom:clamp(24px,2.8vw,44px);display:grid;gap:.7rem}
.prix .tete-r .enseigne{color:var(--accent)}

/* Telephone : en dernier, pour l emporter a specificite egale. Plancher
   de 12 px, et le tableau devient une liste : trois colonnes ne tiennent
   pas sur 360 px. */
@media (max-width:900px){
  .tarifs .detail{font-size:13px}
  .tarifs thead th{font-size:12px}
  .estimateur{grid-template-columns:1fr;gap:22px}
  .opt{font-size:15px}
  .tarifs thead{position:absolute;left:-9999px}
  .tarifs tbody th,.tarifs td{display:block;width:auto;padding:0;border:0}
  .tarifs tbody tr{display:block;padding:1rem 0;
    border-bottom:1px solid color-mix(in oklab, var(--encre) 14%, transparent)}
  .tarifs .somme{margin:.2rem 0 .3rem;font-size:22px}
}`;
}

// Le tableau et l estimateur. `estimateur` vient de la charte : un site qui
// l a ne se lit pas comme son voisin qui ne l a pas. Tout ce qui nomme le
// metier (la mesure, les choix, leurs libelles) vient du fichier metier.
export function bloc({ base, ech, estimateur, titre }) {
  const px = base.prix;
  if (!px) return '';
  const fr = (n) => Number(n).toLocaleString('fr-FR');
  const postes = px.postes.map(o => `
      <tr><th scope="row">${ech(o.poste)}</th>
        <td class="chiffres somme">${o.bas} à ${o.haut} ${ech(o.unite)}</td>
        <td class="detail">${ech(o.note)}</td></tr>`).join('');
  const sources = px.sources.map(s =>
    `<a href="${s.url}" rel="noopener nofollow">${ech(s.nom)}</a>`).join(', ');

  const cfg = base.estimateur;
  const outil = (estimateur && cfg) ? (() => {
    const m = cfg.mesure;
    const choix = (cfg.choix || []).map(c => `
      <fieldset class="choix">
        <legend class="etiq">${ech(c.legende)}</legend>
${c.options.map(([nom, v], i) => `        <button type="button" class="opt${i === c.defaut ? ' actif' : ''}" data-groupe="${c.cle}" data-valeur="${v}"${i === c.defaut ? ' aria-pressed="true"' : ''}>${ech(nom)}</button>`).join('\n')}
      </fieldset>`).join('');
    // ordre de grandeur de depart, calcule comme le fera le script
    const mult = (cfg.choix || []).reduce((a, c) => a * c.options[c.defaut][1], 1);
    const parM2 = [px.exemple.bas / 100, px.exemple.haut / 100];
    const depart = parM2.map(v => Math.round(m.defaut * v * mult / 100) * 100);
    return `<div class="estimateur" id="estim" data-defaut="${m.defaut}"
      data-total-bas="${parM2[0]}" data-total-haut="${parM2[1]}">
    <p class="enseigne">${ech(cfg.titre)}</p>
    <div class="reglages">
      <label class="reglage">
        <span class="etiq">${ech(m.etiquette)} <b class="chiffres" data-sortie="surface">${m.defaut}</b> ${ech(m.unite)}</span>
        <input type="range" min="${m.min}" max="${m.max}" step="${m.pas}" value="${m.defaut}" data-champ="surface"
               aria-label="${ech(m.aria)}">
      </label>${choix}
    </div>
    <div class="resultat">
      <p class="etiq">${ech(cfg.portee || 'Ordre de grandeur')}</p>
      <p class="somme-geante chiffres"><span data-sortie="bas">${fr(depart[0])}</span> à <span data-sortie="haut">${fr(depart[1])}</span> €</p>
      <div class="jauge"><span class="rempli"></span></div>
      <p class="note">Calcul fait à partir des fourchettes publiques ci-dessus. Ce n’est pas un devis, et l’entreprise n’a pas fixé ces prix. Seule une visite donne un chiffre.</p>
    </div>
  </div>`;
  })() : '';

  return `<section class="prix" id="prix" aria-labelledby="t-prix">
  <div class="tete-r"><p class="enseigne">Avant même d’appeler</p>
    <h2 id="t-prix" class="grand">${ech(titre || 'Ce que ça coûte, à peu près.')}</h2>
    <p class="note">${ech(px.note)}</p></div>
  <table class="tarifs">
    <thead><tr><th scope="col">Poste</th><th scope="col">Fourchette</th><th scope="col">Ce qui la fait varier</th></tr></thead>
    <tbody>${postes}
    </tbody>
  </table>
  ${outil}
  <div class="total">
    <p class="moyen">${ech(px.exemple.titre)}</p>
    <p class="somme-geante chiffres">${fr(px.exemple.bas)} à ${fr(px.exemple.haut)} €</p>
    <p class="note">${ech(px.exemple.note)}</p>
    <p class="note">Sources, relevées à la main : ${sources}.</p>
  </div>
</section>`;
}

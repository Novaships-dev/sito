import { CONTEXTES } from '../charte.mjs';
import { html as ech } from '../echapper.mjs';
// Les tarifs de l entreprise, communs aux quatre archetypes.
//
// Decision de Fabrice, 2 octobre 2026 : « Ce n est pas le generateur qui
// decide, c est l artisan qui coche une case pour activer ca ou pas, et
// ensuite ajouter ses tarifs, c est tout. » Certains artisans ne veulent pas
// afficher de prix.
//
// Donc : aucune section prix sur un site de prospection. Elle n apparait que
// si les donnees de l entreprise portent `prix.affiches: true` et au moins un
// tarif saisi par l artisan, et elle ne montre que ses chiffres.
//
// Jusqu a cette date, la section montrait des ordres de grandeur nationaux,
// sources et dates, identiques sur tous les sites d un metier, avec un
// estimateur calcule dessus. Les fourchettes restent dans le fichier metier :
// l app peut s en servir pour proposer des noms de postes a l artisan. Elles
// ne montent plus sur une page.
//
// L estimateur revient le soir meme, decision de Fabrice : il calcule avec
// les tarifs de l artisan et rien d autre. Le visiteur regle sa surface et
// coche les postes qui le concernent ; un tarif a la surface (EUR/m2) se
// multiplie, un forfait (EUR) s ajoute. Un tarif compte autrement (au metre,
// a l unite) reste dans le tableau et hors du calcul, et la page le dit.

// Valide les tarifs saisis. Rien d invente : un tarif incomplet arrete la
// fabrication plutot que d afficher un chiffre faux ou tronque.
export function tarifs(brut) {
  if (!brut || brut.affiches !== true) return null;
  const postes = Array.isArray(brut.postes) ? brut.postes : [];
  if (!postes.length) throw new Error('prix.affiches est coche mais aucun tarif n est saisi');
  const nombre = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  for (const [i, o] of postes.entries()) {
    if (!o || typeof o.poste !== 'string' || !o.poste.trim()) throw new Error(`tarif ${i + 1} : poste sans nom`);
    if (!nombre(o.bas)) throw new Error(`tarif ${i + 1} (${o.poste}) : montant manquant`);
    if (o.haut !== undefined && o.haut !== null && (!nombre(o.haut) || o.haut < o.bas))
      throw new Error(`tarif ${i + 1} (${o.poste}) : montant haut invalide`);
    if (typeof o.unite !== 'string' || !o.unite.trim()) throw new Error(`tarif ${i + 1} (${o.poste}) : unite manquante`);
  }
  return {
    postes: postes.map(o => ({ poste: o.poste.trim(), bas: o.bas, haut: o.haut ?? null,
      unite: o.unite.trim(), note: (o.note || '').trim() })),
    mention: typeof brut.mention === 'string' ? brut.mention.trim() : '',
  };
}

// Le type d un tarif pour l estimateur, d apres son unite.
export function nature(unite, uniteMesure = 'm²') {
  const u = String(unite).replace(/\s+/g, '').toLowerCase();
  const m = String(uniteMesure).replace(/\s+/g, '').toLowerCase();
  const variantes = new Set([m, m.replace('²', '2'), m.replace('2', '²')]);
  const apres = u.includes('/') ? u.slice(u.lastIndexOf('/') + 1) : null;
  if (apres && variantes.has(apres)) return 'surface';
  if (/^(€|eur|euros?|€ht|€ttc|forfait)$/.test(u)) return 'forfait';
  return 'autre';
}

export function feuille() {
  return `
/* ---------------------------------------------------------------- tarifs */
.prix{${CONTEXTES.papier};background:var(--papier);color:var(--t);
  padding:clamp(56px,6vw,110px) var(--m, var(--marge))}
.prix .tete-r{max-width:44rem;margin-bottom:clamp(24px,2.8vw,44px);display:grid;gap:.7rem}
.prix .tete-r .enseigne{color:var(--ta)}
.prix .note{color:var(--t2)}
.tarifs{width:100%;border-collapse:collapse;max-width:74rem;
  font-variant-numeric:tabular-nums lining-nums;margin-bottom:clamp(20px,2.4vw,36px)}
.tarifs th,.tarifs td{text-align:left;padding:.85rem 1.2rem .85rem 0;vertical-align:baseline;
  border-bottom:1px solid color-mix(in oklab, var(--t) 14%, transparent)}
.tarifs thead th{font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;
  color:var(--t2);border-bottom-width:2px}
.tarifs tbody th{font-weight:600;font-size:15px;width:34%}
.tarifs .somme{font-family:var(--titre-police);font-weight:700;font-size:20px;white-space:nowrap;width:22%}
.tarifs .detail{font-size:13px;color:var(--t2)}
.tarifs tbody tr{transition:background .25s var(--sortie)}
.tarifs tbody tr:hover{background:color-mix(in oklab, var(--t) 4%, transparent)}

/* ---------------------------------------------------------------- estimateur
   Le seul endroit de la page ou le visiteur agit sur des chiffres, et ce
   sont ceux de l artisan. */
.estimateur{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:clamp(20px,2.6vw,44px);border-top:2px solid var(--t);
  padding-top:clamp(20px,2.4vw,34px);margin:clamp(24px,2.8vw,40px) 0}
.estimateur .enseigne{grid-column:1 / -1;color:var(--t2)}
.reglages{display:grid;gap:clamp(16px,1.8vw,26px);align-content:start}
.prix .etiq{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;
  color:var(--t2);margin-bottom:.5rem}
.prix .etiq b{font-weight:700;color:var(--t)}
.reglage input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:48px;
  background:transparent;touch-action:pan-y;display:block}
.reglage input[type=range]::-webkit-slider-runnable-track{height:3px;background:color-mix(in oklab, var(--t) 22%, transparent)}
.reglage input[type=range]::-moz-range-track{height:3px;background:color-mix(in oklab, var(--t) 22%, transparent)}
.reglage input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
  width:26px;height:26px;margin-top:-11px;background:var(--accent);border:2px solid var(--t);
  border-radius:50%;cursor:ew-resize}
.reglage input[type=range]::-moz-range-thumb{width:26px;height:26px;background:var(--accent);
  border:2px solid var(--t);border-radius:50%;cursor:ew-resize}
.choix{border:0;padding:0;margin:0}
.choix legend{padding:0}
.opt{min-height:46px;padding:0 16px;margin:0 6px 6px 0;border:1px solid color-mix(in oklab, var(--t) 30%, transparent);
  background:transparent;color:var(--t);font:inherit;font-weight:600;font-size:14px;text-align:left;
  cursor:pointer;border-radius:var(--rayon, 2px);
  transition:background .25s var(--sortie), color .25s var(--sortie), border-color .25s var(--sortie)}
.opt:hover{border-color:var(--t)}
.opt.actif{background:var(--t);color:var(--papier);border-color:var(--t)}
.resultat{align-self:start}
.somme-geante{font-family:var(--titre-police);font-weight:800;line-height:.92;letter-spacing:-.03em;
  font-size:clamp(32px,4.6vw,66px);margin:.2rem 0 .8rem;font-variant-numeric:tabular-nums lining-nums}
.somme-geante .a-haut[hidden]{display:none}
.jauge{height:5px;background:color-mix(in oklab, var(--t) 16%, transparent);overflow:hidden;margin-bottom:.9rem}
.jauge .rempli{display:block;height:100%;width:100%;background:var(--accent);
  transform-origin:left;transform:scaleX(.38);transition:transform .5s var(--sortie)}
.resultat .note{max-width:46ch}
.resultat .note + .note{margin-top:.4rem}

/* Telephone : en dernier, pour l emporter a specificite egale. Plancher de
   12 px, et le tableau devient une liste. */
@media (max-width:900px){
  .estimateur{grid-template-columns:1fr;gap:22px}
  .opt{font-size:15px}
  .tarifs thead th{font-size:12px}
  .tarifs thead{position:absolute;left:-9999px}
  .tarifs tbody th,.tarifs td{display:block;width:auto;padding:0;border:0}
  .tarifs tbody tr{display:block;padding:1rem 0;
    border-bottom:1px solid color-mix(in oklab, var(--t) 14%, transparent)}
  .tarifs .somme{margin:.2rem 0 .3rem;font-size:22px}
}`;
}

// Le tableau des tarifs de l artisan. Sans tarifs, rien du tout : pas de
// section vide, pas de titre orphelin.
// L estimateur : seulement si le metier dit ce qu on mesure (la surface de
// facade pour un ravaleur) et si l artisan a au moins un tarif a la surface.
function estimateur(tf, cfg) {
  const m = cfg && cfg.mesure;
  if (!m) return '';
  const postes = tf.postes.map(o => ({ ...o, type: nature(o.unite, m.unite) }));
  const comptes = postes.filter(o => o.type !== 'autre');
  if (!comptes.some(o => o.type === 'surface')) return '';
  const horsCalcul = postes.filter(o => o.type === 'autre');
  const fr = (n) => Number(n).toLocaleString('fr-FR');
  // Les tarifs a la surface sont coches d emblee, les forfaits non : le
  // visiteur ajoute ce qui le concerne. Le montant de depart est calcule ici
  // comme le fera le script, pour qu il soit juste sans JavaScript.
  const depart = comptes.reduce((a, o) => {
    if (o.type !== 'surface') return a;
    return [a[0] + o.bas * m.defaut, a[1] + (o.haut ?? o.bas) * m.defaut];
  }, [0, 0]).map(v => Math.round(v / 10) * 10);
  const boutons = comptes.map(o => {
    const actif = o.type === 'surface';
    return `        <button type="button" class="opt${actif ? ' actif' : ''}" aria-pressed="${actif}" data-type="${o.type}" data-bas="${o.bas}" data-haut="${o.haut ?? o.bas}">${ech(o.poste)}</button>`;
  }).join('\n');
  return `<div class="estimateur" id="estim" data-defaut="${m.defaut}">
    <p class="enseigne">${ech(cfg.titre || 'Votre chantier')}</p>
    <div class="reglages">
      <label class="reglage">
        <span class="etiq">${ech(m.etiquette)} <b class="chiffres" data-sortie="surface">${m.defaut}</b> ${ech(m.unite)}</span>
        <input type="range" min="${m.min}" max="${m.max}" step="${m.pas}" value="${m.defaut}" data-champ="surface"
               aria-label="${ech(m.aria)}">
      </label>
      <fieldset class="choix">
        <legend class="etiq">Les postes à compter</legend>
${boutons}
      </fieldset>
    </div>
    <div class="resultat">
      <p class="etiq">Avec les tarifs de l’entreprise</p>
      <p class="somme-geante chiffres"><span data-sortie="bas">${fr(depart[0])}</span><span class="a-haut"${depart[0] === depart[1] ? ' hidden' : ''}> à <span data-sortie="haut">${fr(depart[1])}</span></span> €</p>
      <div class="jauge"><span class="rempli"></span></div>
      <p class="note">Calcul fait avec les tarifs indiqués par l’entreprise, pour les postes choisis. Ce n’est pas un devis.</p>
      ${horsCalcul.length ? `<p class="note">Hors de ce calcul, parce qu’ils ne se comptent pas à la surface : ${horsCalcul.map(o => ech(o.poste)).join(', ')}.</p>` : ''}
    </div>
  </div>`;
}

export function bloc({ tarifs: tf, titre, estimation = null }) {
  if (!tf) return '';
  const fr = (n) => Number(n).toLocaleString('fr-FR');
  const montant = (o) => o.haut !== null && o.haut !== o.bas
    ? `${fr(o.bas)} à ${fr(o.haut)} ${ech(o.unite)}` : `${fr(o.bas)} ${ech(o.unite)}`;
  const avecDetail = tf.postes.some(o => o.note);
  const lignes = tf.postes.map(o => `
      <tr><th scope="row">${ech(o.poste)}</th>
        <td class="chiffres somme">${montant(o)}</td>${avecDetail ? `
        <td class="detail">${ech(o.note)}</td>` : ''}</tr>`).join('');
  return `<section class="prix" id="prix" aria-labelledby="t-prix">
  <div class="tete-r"><p class="enseigne">Les tarifs de l’entreprise</p>
    <h2 id="t-prix" class="grand">${ech(titre || 'Ce que ça coûte.')}</h2>
    ${tf.mention ? `<p class="note">${ech(tf.mention)}</p>` : ''}</div>
  <table class="tarifs">
    <thead><tr><th scope="col">Poste</th><th scope="col">Tarif</th>${avecDetail ? '<th scope="col">Précision</th>' : ''}</tr></thead>
    <tbody>${lignes}
    </tbody>
  </table>
  <p class="note">Tarifs indiqués par l’entreprise.</p>
  ${estimateur(tf, estimation)}
</section>`;
}

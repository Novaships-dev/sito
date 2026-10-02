// Les avis, communs aux quatre archetypes.
//
// Aucun avis n est invente. Sur un site de prospection les emplacements sont
// vides et le disent ; c est l application qui les remplira avec les avis
// Google de l entreprise, une fois l artisan abonne. La section est
// facultative : la charte decide si elle est la.

export function feuille() {
  return `
/* ---------------------------------------------------------------- avis */
.avis{background:var(--nuit);color:var(--chaux);
  padding:clamp(56px,6vw,110px) var(--m, var(--marge))}
.avis .tete-r{max-width:44rem;margin-bottom:clamp(24px,2.8vw,44px);display:grid;gap:.7rem}
.avis .tete-r .enseigne{color:var(--accent)}
.avis .grille{display:grid;gap:1px;background:var(--voile-2);
  grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.avis .carte{background:var(--nuit);padding:clamp(20px,2.2vw,32px);display:grid;gap:.8rem;
  align-content:start;border-radius:var(--rayon, 0)}
.avis .carte .enseigne{color:var(--gris)}
.avis .carte p{color:var(--gris);font-size:14px}
.avis .vide{color:var(--gris);border:1px dashed var(--voile-2);background:transparent}`;
}

export function bloc() {
  return `<section class="avis" aria-labelledby="t-avis">
  <div class="tete-r"><p class="enseigne">Ce que disent les clients</p>
    <h2 id="t-avis" class="grand">Les avis viennent ici.</h2>
    <p class="note">Trois emplacements, à remplir avec les avis réels de l’entreprise. Cette page n’en invente aucun.</p></div>
  <div class="grille">
    <div class="carte vide"><p class="enseigne">À compléter</p><p>Ici viendra un avis de client, avec son prénom, sa commune et l’année du chantier. Rien n’est inventé : l’entreprise fournit ses avis.</p></div>
    <div class="carte vide"><p class="enseigne">À compléter</p><p>Deuxième avis. Un chantier proche de chez le visiteur vaut mieux qu’un avis lointain.</p></div>
    <div class="carte vide"><p class="enseigne">À compléter</p><p>Troisième avis. Trois suffisent : au-delà, plus personne ne les lit.</p></div>
  </div>
</section>`;
}

import { CONTEXTES } from '../charte.mjs';
import { html as ech } from '../echapper.mjs';
// Les avis, communs aux quatre archetypes.
//
// Aucun avis n est invente. Sur un site de prospection les emplacements sont
// vides et le disent ; c est l application qui les remplira avec les avis
// Google de l entreprise, une fois l artisan abonne. La section est
// facultative : la charte decide si elle est la.

export function feuille() {
  return `
/* ---------------------------------------------------------------- avis */
.avis{${CONTEXTES.sol};background:var(--nuit);color:var(--t);
  padding:clamp(56px,6vw,110px) var(--m, var(--marge))}
.avis .tete-r{max-width:44rem;margin-bottom:clamp(24px,2.8vw,44px);display:grid;gap:.7rem}
.avis .tete-r .enseigne{color:var(--ta)}
.avis .grille{display:grid;gap:1px;background:var(--voile-2);
  grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.avis .carte{background:var(--nuit);padding:clamp(20px,2.2vw,32px);display:grid;gap:.8rem;
  align-content:start;border-radius:var(--rayon, 0)}
.avis .carte .enseigne{color:var(--t2)}
.avis .carte p{color:var(--t2);font-size:14px}
.avis .vide{color:var(--t2);border:1px dashed var(--voile-2);background:var(--nuit)}`;
}

// Les avis d un site d abonne (T56, constat S-024) : ceux de la table `avis`,
// tels quels (texte, prenom ou nom affiche, note donnee par le client). Aucun
// avis : aucune section. Jamais « Les avis viennent ici » sur un site publie au
// nom de l artisan. Rien n est invente : sans note, pas d etoiles.
export function bloc({ abonne = false, avis = [] } = {}) {
  if (abonne) {
    const reels = (avis || []).filter((a) => a && typeof a.texte === 'string' && a.texte.trim());
    if (!reels.length) return '';
    const carte = (a) => {
      const note = Number.isInteger(a.note) && a.note >= 1 && a.note <= 5
        ? `<p class="enseigne" aria-label="Note : ${a.note} sur 5">${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</p>` : '';
      const qui = [a.auteur, a.ecrit_le ? String(a.ecrit_le).slice(0, 4) : null].filter(Boolean).map(ech).join(', ');
      return `<div class="carte" data-avis>${note}<p>${ech(a.texte.trim())}</p>${qui ? `<p class="enseigne">${qui}</p>` : ''}</div>`;
    };
    return `<section class="avis" aria-labelledby="t-avis">
  <div class="tete-r"><p class="enseigne">Ce que disent les clients</p>
    <h2 id="t-avis" class="grand">Avis de clients</h2>
    <p class="note">Avis publiés sur la fiche Google de l’entreprise.</p></div>
  <div class="grille">
    ${reels.slice(0, 6).map(carte).join('\n    ')}
  </div>
</section>`;
  }
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

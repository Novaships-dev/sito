#!/usr/bin/env node
// La page d'appels du jour : ce que Fabrice trouve sur son iPhone à 7 h.
//
// Spécification : `app/specs/08-PROSPECTION.md`, « Ce que Fabrice doit trouver
// chaque matin ». Elle se fabrique ici, en HTML statique, et se publie avec le
// lot sous un slug privé ; les résultats d'appel sont enregistrés par la
// fonction `worker/appels.js` dans un espace KV.
//
// Quatre règles qui commandent la forme.
//
// 1. **Aucun numéro de téléphone, nulle part.** Ni dans le registre, ni dans
//    cette page. Fabrice ouvre la fiche publique de l'entreprise (bouton
//    « Fiche Google », une recherche Google Maps sur le nom et la commune) et
//    appelle depuis elle. C'est le cadre légal, pas une préférence : la page
//    est donc relue par `verifier()` avant d'être écrite.
// 2. **Les relances d'abord.** Un rappel promis passe avant un nouvel appel :
//    c'est la seule promesse faite à quelqu'un.
// 3. **Tout au doigt, sur 390 px.** Un bouton de résultat se touche sans
//    viser : 44 px de haut au moins (plancher d'Apple), jamais deux boutons
//    côte à côte sous 44 px.
// 4. **Rien d'inventé.** Un artisan sans note affiche « — », pas un zéro ; le
//    point de la semaine compte ce que le registre sait, et dit « 0 » quand il
//    ne sait rien.
import { STATUTS, relancesDues, appelable } from './registre.mjs';

// Les boutons de résultat, dans l'ordre où Fabrice en a besoin. « à rappeler »
// demande une date : le bouton ouvre le choix du jour.
export const RESULTATS = [
  { statut: 'pas-de-reponse', mot: 'Pas de réponse' },
  { statut: 'a-rappeler', mot: 'Rappeler', demandeDate: true },
  { statut: 'interesse', mot: 'Intéressé' },
  { statut: 'essai-lance', mot: 'Essai lancé' },
  { statut: 'abonne-mois', mot: 'Abonné au mois' },
  { statut: 'abonne-annee', mot: 'Abonné à l année' },
  { statut: 'pas-interesse', mot: 'Pas intéressé' },
  { statut: 'ne-plus-appeler', mot: 'Ne plus appeler', grave: true },
];

// Un numéro français, écrit comme on l'écrit vraiment. Même expression que
// `registre.mjs` : la page ne doit pas en porter davantage que le registre.
const TELEPHONE = /(?:\+33|0033|\b0)\s*[1-9](?:[\s.\-]*\d{2}){4}\b/;

const ECHAPPER = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const e = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ECHAPPER[c]);

// La recherche Google Maps du nom et de la commune : Fabrice y voit la fiche
// et appelle depuis elle. Jamais de lecture automatisée de Google, jamais de
// copie de ses photos (conditions d'utilisation) : c'est un lien, rien de plus.
export const lienFiche = (nom, commune) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nom} ${commune}`)}`;

// Le SMS prêt à copier, pendant l'appel. Texte du document commercial
// « Prospection Sitô : plan, script et objections » (section Messages),
// réponse de Fabrice à Q2 (`memoire/questions.md`, 26 octobre) : à mettre tel
// quel, remplaçable par `--sms` ou par l'appel.
export const SMS = "Bonjour, voici le site que j'ai préparé pour {nom} : {lien}. Glissez sur la photo du haut. Fabrice, Sitô (Marignane)";
export const sms = (fiche, lien, gabarit = SMS) =>
  gabarit.replace('{nom}', fiche.nom || '').replace('{lien}', lien);

// Le point de la semaine : ce que le registre sait, sur les sept derniers
// jours. « Conversations » = un appel qui a donné autre chose qu'une absence.
// `vus` : le compte de vues par slug, relu dans KV (`worker/appels.js`,
// `lireVues`). Absent, « liens ouverts » vaut `null` et la page écrit « ? » :
// un chiffre qu'on n'a pas ne s'affiche pas comme un zéro, qui voudrait dire
// « personne n'a ouvert ».
export function semaine(registre, jour, { jours = 7, vus = null } = {}) {
  const depuis = new Date(Date.parse(jour + 'T00:00:00Z') - (jours - 1) * 86400000)
    .toISOString().slice(0, 10);
  const dans = (f) => f.appele_le && f.appele_le >= depuis && f.appele_le <= jour;
  const fiches = Object.values(registre.fiches || {});
  const appeles = fiches.filter(dans);
  return {
    depuis, jour, jours,
    appels: appeles.length,
    conversations: appeles.filter((f) => f.statut !== 'pas-de-reponse').length,
    interesses: appeles.filter((f) => f.statut === 'interesse').length,
    essais: fiches.filter((f) => f.statut === 'essai-lance').length,
    abonnes: fiches.filter((f) => f.statut === 'abonne-mois' || f.statut === 'abonne-annee').length,
    sites: fiches.filter((f) => f.slug).length,
    // Combien d'artisans ont ouvert leur lien : on compte les personnes, pas
    // les visites, parce que c'est la question posée.
    liens_ouverts: vus ? fiches.filter((f) => f.slug && (vus[f.slug] || 0) > 0).length : null,
  };
}

// Les appels du jour : les relances dues d'abord, puis les nouveaux du lot,
// les mieux notés devant. Un artisan non appelable n'y est pas, et la raison
// se dit (elle sert à comprendre une absence).
export function appelsDuJour(registre, { jour, lot = [] }) {
  const relances = relancesDues(registre, jour).map((f) => ({ ...f, relance: true }));
  const dejaLa = new Set(relances.map((f) => f.siren));
  const ecartes = [];
  const nouveaux = [];
  for (const s of lot) {
    if (dejaLa.has(s.siren)) continue;
    const fiche = registre.fiches?.[s.siren];
    const peut = appelable(fiche, jour);
    const ligne = { siren: s.siren, ...(fiche || {}), nom: fiche?.nom ?? s.nom, commune: fiche?.commune ?? s.commune,
      metier: fiche?.metier ?? s.metier, note: fiche?.note ?? s.note ?? null, slug: fiche?.slug ?? s.slug ?? null,
      pourquoi: s.pourquoi ?? [] };
    if (!peut.oui) { ecartes.push({ ...ligne, motif: peut.motif }); continue; }
    nouveaux.push(ligne);
  }
  nouveaux.sort((a, b) => (b.note ?? -1) - (a.note ?? -1) || a.siren.localeCompare(b.siren));
  return { relances, nouveaux, ecartes, total: relances.length + nouveaux.length };
}

// --------------------------------------------------------------------- la page
function carte(f, { base, gabaritSms }) {
  const lien = f.slug ? `${base}/${f.slug}/` : null;
  const note = f.note == null ? '—' : String(f.note);
  const pourquoi = (f.pourquoi || []).slice(0, 3);
  return `
      <article class="fiche" data-siren="${e(f.siren)}"${f.relance ? ' data-relance="1"' : ''}>
        <header>
          <p class="nom">${e(f.nom)}</p>
          <p class="ou">${e(f.commune)} · ${e(f.metier)} · note <b>${e(note)}</b></p>
          ${f.relance ? `<p class="rappel">Rappel promis le ${e(f.relance_le)}</p>` : ''}
          ${pourquoi.length ? `<ul class="pourquoi">${pourquoi.map((p) => `<li>${e(p)}</li>`).join('')}</ul>` : ''}
        </header>
        <div class="liens">
          <a class="bouton fiche-google" href="${e(lienFiche(f.nom, f.commune))}" target="_blank" rel="noreferrer noopener">Fiche Google</a>
          ${lien ? `<a class="bouton voir" href="${e(lien)}" target="_blank" rel="noreferrer noopener">Voir son site</a>` : '<span class="bouton absent">Pas de site</span>'}
        </div>
        ${lien ? `<button class="bouton sms" type="button" data-sms="${e(sms(f, lien, gabaritSms))}">Copier le SMS</button>` : ''}
        <div class="resultats">
          ${RESULTATS.map((r) => `<button class="resultat${r.grave ? ' grave' : ''}" type="button" data-statut="${e(r.statut)}"${r.demandeDate ? ' data-date="1"' : ''}>${e(r.mot)}</button>`).join('\n          ')}
        </div>
        <p class="etat" role="status"></p>
      </article>`;
}

export function page(registre, { jour, lot = [], base = '', gabaritSms = SMS, api = '/api/resultat', vus = null } = {}) {
  const { relances, nouveaux, ecartes } = appelsDuJour(registre, { jour, lot });
  const s = semaine(registre, jour, { vus });

  const corps = `
    <section class="semaine">
      <h2>La semaine</h2>
      <dl>
        <div><dt>Appels</dt><dd>${s.appels}</dd></div>
        <div><dt>Conversations</dt><dd>${s.conversations}</dd></div>
        <div><dt>Liens ouverts</dt><dd>${s.liens_ouverts == null ? '?' : s.liens_ouverts}</dd></div>
        <div><dt>Essais</dt><dd>${s.essais}</dd></div>
        <div><dt>Abonnés</dt><dd>${s.abonnes}</dd></div>
      </dl>
      <p class="depuis">Depuis le ${e(s.depuis)}. ${s.sites} site${s.sites > 1 ? 's' : ''} montré${s.sites > 1 ? 's' : ''} en tout.</p>
    </section>
${relances.length ? `
    <section class="bloc relances">
      <h2>À rappeler d abord <span class="compte">${relances.length}</span></h2>
      ${relances.map((f) => carte(f, { base, gabaritSms })).join('')}
    </section>` : ''}
    <section class="bloc nouveaux">
      <h2>Les appels du jour <span class="compte">${nouveaux.length}</span></h2>
      ${nouveaux.length ? nouveaux.map((f) => carte(f, { base, gabaritSms })).join('')
        : '<p class="vide">Aucun appel aujourd hui.</p>'}
    </section>
${ecartes.length ? `
    <section class="bloc ecartes">
      <h2>Pas aujourd hui <span class="compte">${ecartes.length}</span></h2>
      <ul>${ecartes.map((f) => `<li>${e(f.nom)} — ${e(f.motif)}</li>`).join('')}</ul>
    </section>` : ''}`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Appels du ${e(jour)}</title>
<style>
:root { --fond:#12161c; --carte:#1b212a; --encre:#f2f4f7; --doux:#9aa4b2; --trait:#2b333f; --vif:#d86e00; --grave:#7f2b2b; }
* { box-sizing:border-box; }
body { margin:0; background:var(--fond); color:var(--encre); font:16px/1.45 -apple-system, system-ui, sans-serif; padding-bottom:2rem; }
h1 { font-size:1.25rem; margin:0; }
h2 { font-size:1rem; color:var(--doux); text-transform:uppercase; letter-spacing:.06em; margin:1.5rem 1rem .5rem; display:flex; gap:.5rem; align-items:center; }
.compte { background:var(--trait); color:var(--encre); border-radius:1rem; padding:.1rem .5rem; font-size:.85rem; }
header.haut { padding:1rem; border-bottom:1px solid var(--trait); position:sticky; top:0; background:var(--fond); z-index:2; }
header.haut p { margin:.25rem 0 0; color:var(--doux); font-size:.9rem; }
.semaine { margin:1rem; background:var(--carte); border:1px solid var(--trait); border-radius:.75rem; padding:.75rem; }
.semaine h2 { margin:0 0 .5rem; }
.semaine dl { display:grid; grid-template-columns:repeat(5,1fr); gap:.25rem; margin:0; }
.semaine dt { color:var(--doux); font-size:.7rem; }
.semaine dd { margin:0; font-size:1.3rem; font-weight:600; }
.depuis { color:var(--doux); font-size:.8rem; margin:.5rem 0 0; }
.fiche { background:var(--carte); border:1px solid var(--trait); border-radius:.75rem; margin:.5rem 1rem; padding:.75rem; }
.fiche[data-relance] { border-color:var(--vif); }
.nom { margin:0; font-weight:600; font-size:1.05rem; }
.ou { margin:.15rem 0 0; color:var(--doux); font-size:.85rem; }
.rappel { margin:.35rem 0 0; color:var(--vif); font-size:.85rem; }
.pourquoi { margin:.4rem 0 0; padding-left:1.1rem; color:var(--doux); font-size:.8rem; }
.liens { display:flex; gap:.5rem; margin-top:.6rem; }
.bouton { flex:1; min-height:44px; display:flex; align-items:center; justify-content:center; text-align:center;
  border:1px solid var(--trait); border-radius:.5rem; background:#232b36; color:var(--encre); text-decoration:none;
  font-size:.9rem; font-weight:500; padding:.5rem; cursor:pointer; }
.fiche-google { background:var(--vif); border-color:var(--vif); color:#1a1205; font-weight:600; }
.bouton.sms { width:100%; margin-top:.5rem; }
.absent { color:var(--doux); }
.resultats { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin-top:.6rem; }
.resultat { min-height:44px; border:1px solid var(--trait); border-radius:.5rem; background:#232b36; color:var(--encre);
  font-size:.9rem; padding:.5rem; cursor:pointer; }
.resultat.grave { border-color:var(--grave); color:#ffb4b4; }
.resultat[aria-pressed="true"] { background:var(--vif); border-color:var(--vif); color:#1a1205; font-weight:600; }
.etat { margin:.5rem 0 0; min-height:1.2em; font-size:.85rem; color:var(--doux); }
.etat[data-faute] { color:#ffb4b4; }
.ecartes ul { margin:0 1rem; padding-left:1.1rem; color:var(--doux); font-size:.85rem; }
.vide { margin:.5rem 1rem; color:var(--doux); }
</style>
</head>
<body>
<header class="haut">
  <h1>Appels du ${e(jour)}</h1>
  <p>${relances.length} rappel${relances.length > 1 ? 's' : ''} promis, ${nouveaux.length} nouveau${nouveaux.length > 1 ? 'x' : ''}.</p>
</header>
<main>${corps}
</main>
<script>
// Un résultat part tout seul, et la fiche dit ce qui s'est passé. Si
// l'enregistrement échoue, le bouton ne reste pas allumé : mieux vaut un
// appel refait qu'un résultat cru à tort.
const API = ${JSON.stringify(api)};
document.addEventListener('click', async (ev) => {
  const bouton = ev.target.closest('.resultat');
  if (bouton) return void (await envoyer(bouton));
  const smsBtn = ev.target.closest('.sms');
  if (smsBtn) return void copier(smsBtn);
});
async function copier(b) {
  const texte = b.dataset.sms;
  try { await navigator.clipboard.writeText(texte); b.textContent = 'SMS copié'; }
  catch { b.textContent = texte; }
  setTimeout(() => { b.textContent = 'Copier le SMS'; }, 2500);
}
async function envoyer(bouton) {
  const fiche = bouton.closest('.fiche');
  const etat = fiche.querySelector('.etat');
  const statut = bouton.dataset.statut;
  let relance = null;
  if (bouton.dataset.date) {
    relance = prompt('Rappeler quel jour ? (2026-10-28)');
    if (!relance) { etat.textContent = 'Rappel annulé : aucune date.'; return; }
  }
  for (const b of fiche.querySelectorAll('.resultat')) b.setAttribute('aria-pressed', 'false');
  etat.removeAttribute('data-faute');
  etat.textContent = 'Enregistrement…';
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siren: fiche.dataset.siren, statut, relance_le: relance }) });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.ok !== true) throw new Error((j && j.faute) || ('sortie ' + r.status));
    bouton.setAttribute('aria-pressed', 'true');
    etat.textContent = j.dit || 'Enregistré.';
  } catch (err) {
    etat.setAttribute('data-faute', '1');
    etat.textContent = 'Pas enregistré : ' + err.message + '. À refaire.';
  }
}
</script>
</body>
</html>
`;
}

// La page est relue avant d'être écrite : un numéro de téléphone qui s'y
// serait glissé (par un nom d'entreprise, par exemple) est une faute, pas une
// remarque. Rend la liste des fautes, vide si tout va bien.
export function verifier(html) {
  const fautes = [];
  const trouve = html.match(TELEPHONE);
  if (trouve) fautes.push(`la page porte un numéro de téléphone (« ${trouve[0]} ») : interdit, Fabrice appelle depuis la fiche publique`);
  if (!/name="robots" content="noindex/.test(html)) fautes.push('la page n est pas en noindex');
  for (const r of RESULTATS) {
    if (!html.includes(`data-statut="${r.statut}"`) && /class="fiche"/.test(html)) {
      fautes.push(`le bouton de résultat « ${r.statut} » manque`);
    }
  }
  for (const r of RESULTATS) if (!STATUTS.includes(r.statut)) fautes.push(`statut inconnu du registre : ${r.statut}`);
  return fautes;
}

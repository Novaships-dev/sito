#!/usr/bin/env node
// Noter les artisans extraits, de 0 à 100, et dire pourquoi.
//
// Spécification : `app/specs/08-PROSPECTION.md`. Décision de Fabrice du
// 23 octobre : « sélectionner les meilleurs profils (fiche Google faible
// etc.) ». La note sert à trier la page d'appels du lendemain ; chaque point
// porte sa raison, écrite en français, parce que Fabrice lit la raison au
// téléphone, pas la note.
//
// Le barème tient dans 100 points, et chaque poste a son plafond :
//
//   site existant        0 à 25   ce qu'une recherche web a trouvé
//   ancienneté           0 à 25   assez vieille pour être installée, pas en fin de course
//   effectif             0 à 20   un patron avec un ou deux compagnons est le cœur de cible
//   RGE                     + 15  signalé par l'API (complements.est_rge)
//   le nom dit le métier    + 15  « RENOVA FACADES » est sûrement un ravaleur
//
// **La présence d'un site ne se devine pas.** Elle vient d'une recherche web
// faite par Claude Code au moment de préparer le lot (`/preparer-appels`), et
// passée ici dans `sites`. Sans cette recherche, la valeur est `inconnu` et
// vaut peu : une note haute ne peut pas se gagner en ne sachant rien.
//
// Jamais de lecture automatisée de Google ni de copie de ses photos
// (conditions d'utilisation, 08-PROSPECTION.md).
import { appelable } from './registre.mjs';

// Ce qu'une recherche web peut trouver, et ce que ça vaut. Un artisan avec un
// site récent fait par un prestataire n'est pas un prospect : il paie déjà.
export const SITES = {
  'aucun': { points: 25, dit: 'aucun site trouvé' },
  'reseau-social': { points: 20, dit: 'une page Facebook ou Instagram seulement' },
  'annuaire': { points: 18, dit: 'une fiche d annuaire seulement' },
  'ancien': { points: 15, dit: 'un site ancien, laissé en l état' },
  'inconnu': { points: 8, dit: 'recherche web pas encore faite' },
  'recent-prestataire': { points: 0, ecarte: 'site récent fait par un prestataire : il paie déjà' },
};

// Bornes basses, en années. La première qui est dépassée gagne.
const ANCIENNETE = [
  { des: 30, points: 12, dit: 'plus de 30 ans de métier' },
  { des: 15, points: 20, dit: 'entre 15 et 30 ans de métier' },
  { des: 5, points: 25, dit: 'entre 5 et 15 ans de métier' },
  { des: 0, points: 15, dit: 'installée depuis peu' },
];

export const EFFECTIFS = {
  '01': { points: 20, dit: '1 ou 2 salariés' },
  '02': { points: 20, dit: '3 à 5 salariés' },
  '03': { points: 14, dit: '6 à 9 salariés' },
  '00': { points: 12, dit: 'aucun salarié' },
  'NN': { points: 10, dit: 'effectif non déclaré' },
};

export const NOTE_MAX = 100;

// Rend { note, pourquoi: [...], ecarte: null | motif }. La note est bornée :
// un barème qui dépasse 100 est une faute du barème, pas un bon prospect.
export function noter(e, { site = 'inconnu' } = {}) {
  const s = SITES[site];
  if (!s) throw new Error(`état de site inconnu : ${site} (connus : ${Object.keys(SITES).join(', ')})`);
  if (s.ecarte) return { note: 0, pourquoi: [], ecarte: s.ecarte };

  const pourquoi = [];
  let note = 0;
  const ajouter = (points, dit) => { if (points) { note += points; pourquoi.push(`${dit} (+${points})`); } };

  ajouter(s.points, s.dit);
  const a = ANCIENNETE.find((x) => (e.annees ?? 0) >= x.des);
  ajouter(a.points, a.dit);
  const eff = EFFECTIFS[e.effectif] || EFFECTIFS.NN;
  ajouter(eff.points, eff.dit);
  if (e.rge) ajouter(15, 'certifiée RGE');
  if (e.nomDitLeMetier) ajouter(15, 'son nom dit le métier');

  if (note > NOTE_MAX) throw new Error(`barème cassé : ${note} points pour ${e.siren}, le maximum est ${NOTE_MAX}`);
  return { note, pourquoi, ecarte: null };
}

// Ce que la recherche web a vu pour un SIREN. Deux formes : l'état du site
// seul (« aucun »), ou { site, metier: "oui" | "non", vu } quand elle a aussi
// regardé ce que fait l'entreprise (site, fiche, annuaire) — obligatoire pour
// un nom muet dans un métier qui exige une preuve (`preuveExigee`).
export function vuSurLeWeb(x) {
  if (!x) return { site: 'inconnu', metier: null, vu: null };
  if (typeof x === 'string') return { site: x, metier: null, vu: null };
  if (x.metier != null && !['oui', 'non'].includes(x.metier)) throw new Error(`métier vu sur le web : « oui » ou « non », reçu « ${x.metier} »`);
  return { site: x.site || 'inconnu', metier: x.metier ?? null, vu: x.vu || null };
}

// Trie les entreprises extraites et dit lesquelles sont écartées, pourquoi.
// Déterministe : à égalité de note, l'ordre est celui des SIREN, pour que deux
// préparations du même soir donnent la même liste.
//
// `exigerPreuve` : faux seulement pour la première liste du soir (`lister`),
// qui doit justement montrer les noms muets à vérifier sur le web.
export function qualifier(entreprises, { registre = { fiches: {} }, aujourdhui = new Date(), sites = {}, exigerPreuve = true } = {}) {
  const jour = aujourdhui.toISOString().slice(0, 10);
  const retenus = [];
  const ecartes = [];

  for (const e of entreprises) {
    const fiche = registre.fiches?.[e.siren];
    const porte = appelable(fiche, jour);
    if (!porte.oui) { ecartes.push({ ...e, motif: porte.motif }); continue; }
    const web = vuSurLeWeb(sites[e.siren]);
    if (web.metier === 'non') { ecartes.push({ ...e, motif: `la recherche web montre un autre métier${web.vu ? ` : ${web.vu}` : ''}` }); continue; }
    if (exigerPreuve && e.preuveExigee && web.metier !== 'oui') {
      ecartes.push({ ...e, motif: 'métier pas prouvé : le nom ne le dit pas et la recherche web ne l a pas montré' });
      continue;
    }
    const n = noter(e, { site: web.site });
    if (n.ecarte) { ecartes.push({ ...e, motif: n.ecarte }); continue; }
    retenus.push({ ...e, note: n.note, pourquoi: n.pourquoi, site: web.site, ...(web.vu ? { metierVu: web.vu } : {}) });
  }

  retenus.sort((a, b) => b.note - a.note || a.siren.localeCompare(b.siren));
  return { retenus, ecartes };
}

// Les `combien` meilleurs de chaque métier, sans jamais deux fois le même
// SIREN : un ravaleur nommé « peinture » ne doit pas être appelé deux fois.
export function lot(parMetier, combien = 10) {
  const pris = new Set();
  const liste = [];
  for (const [metier, retenus] of Object.entries(parMetier)) {
    let n = 0;
    for (const e of retenus) {
      if (n >= combien) break;
      if (pris.has(e.siren)) continue;
      pris.add(e.siren);
      liste.push({ ...e, metier });
      n++;
    }
  }
  return liste;
}

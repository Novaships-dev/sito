#!/usr/bin/env node
// Le registre des artisans déjà traités : `prospection/registre.json`.
//
// Spécification : `app/specs/08-PROSPECTION.md`. Il est **versionné** (il doit
// survivre à un changement de machine) et porte, par SIREN : le métier, le
// nom, la commune, la date du site montré, son slug, le statut du dernier
// appel, la date du dernier appel et celle de la relance promise.
//
// Deux règles qui ne se discutent pas (cadre légal, 08-PROSPECTION.md) :
//
//   1. **aucun numéro de téléphone n'entre ici.** Fabrice appelle le numéro
//      de la fiche publique, qu'il ouvre depuis la page d'appels ; rien n'est
//      stocké. `valider()` refuse tout ce qui ressemble à un numéro français,
//      où qu'il soit dans le fichier ;
//   2. **« ne plus appeler » est définitif**, et un artisan n'est jamais
//      rappelé deux fois le même jour.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { RACINE } from '../env.mjs';

export const CHEMIN = join(RACINE, 'prospection', 'registre.json');

export const STATUTS = [
  'a-appeler', 'pas-de-reponse', 'a-rappeler', 'interesse',
  'essai-lance', 'abonne-mois', 'abonne-annee', 'pas-interesse', 'ne-plus-appeler',
];

const SIREN = /^\d{9}$/;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;
// Un numéro français, écrit comme on l'écrit vraiment : 06 12 34 56 78,
// 06.12.34.56.78, 0612345678, +33 6 12 34 56 78.
const TELEPHONE = /(?:\+33|0033|\b0)\s*[1-9](?:[\s.\-]*\d{2}){4}\b/;

export function vide() { return { version: 1, fiches: {} }; }

export function lire(chemin = CHEMIN) {
  try { return JSON.parse(readFileSync(chemin, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return vide(); throw e; }
}

// Rend la liste des fautes, vide si tout va bien. Jamais un booléen : une
// faute doit pouvoir se nommer.
export function valider(registre) {
  const fautes = [];
  if (!registre || typeof registre !== 'object') return ['le registre n est pas un objet'];
  if (!registre.fiches || typeof registre.fiches !== 'object') return ['le registre n a pas de « fiches »'];

  // Le numéro de téléphone se cherche dans le fichier entier, pas champ par
  // champ : il pourrait se glisser dans une note, un nom, une clé.
  const tout = JSON.stringify(registre);
  const trouve = tout.match(TELEPHONE);
  if (trouve) fautes.push(`un numéro de téléphone est entré dans le registre (« ${trouve[0]} ») : interdit, Fabrice appelle depuis la fiche publique`);

  for (const [siren, f] of Object.entries(registre.fiches)) {
    const ou = `fiche ${siren}`;
    if (!SIREN.test(siren)) fautes.push(`${ou} : le SIREN n a pas 9 chiffres`);
    if (!f || typeof f !== 'object') { fautes.push(`${ou} : n est pas un objet`); continue; }
    if (!STATUTS.includes(f.statut)) fautes.push(`${ou} : statut inconnu « ${f.statut} » (connus : ${STATUTS.join(', ')})`);
    for (const cle of ['site_le', 'appele_le', 'relance_le']) {
      if (f[cle] != null && !JOUR.test(f[cle])) fautes.push(`${ou} : ${cle} attendu sous la forme 2026-10-24, reçu « ${f[cle]} »`);
    }
    if (f.note != null && (typeof f.note !== 'number' || f.note < 0 || f.note > 100)) fautes.push(`${ou} : note hors de 0 à 100 (${f.note})`);
  }
  return fautes;
}

// Écrit trié par SIREN, indenté : un registre se relit à l'œil, et deux
// préparations de suite donnent le même fichier (diff lisible dans Git).
export function ecrire(registre, chemin = CHEMIN) {
  const fautes = valider(registre);
  if (fautes.length) throw new Error(`registre refusé, rien n est écrit :\n  - ${fautes.join('\n  - ')}`);
  const fiches = {};
  for (const siren of Object.keys(registre.fiches).sort()) fiches[siren] = registre.fiches[siren];
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, JSON.stringify({ ...registre, fiches }, null, 1) + '\n');
  return Object.keys(fiches).length;
}

// Peut-on l'appeler aujourd'hui ? Rend { oui, motif } : le motif sert à
// expliquer une absence dans la liste du jour.
export function appelable(fiche, jour) {
  if (!fiche) return { oui: true, motif: null };
  if (fiche.statut === 'ne-plus-appeler') return { oui: false, motif: 'a demandé à ne plus être appelé' };
  if (fiche.statut === 'abonne-mois' || fiche.statut === 'abonne-annee') return { oui: false, motif: 'déjà abonné' };
  if (fiche.appele_le === jour) return { oui: false, motif: 'déjà appelé aujourd hui' };
  if (fiche.relance_le && fiche.relance_le > jour) return { oui: false, motif: `relance promise le ${fiche.relance_le}` };
  return { oui: true, motif: null };
}

// Les relances dues aujourd'hui ou avant, les plus anciennes d'abord : elles
// passent avant les nouveaux appels sur la page du jour.
export function relancesDues(registre, jour) {
  return Object.entries(registre.fiches || {})
    .filter(([, f]) => f.relance_le && f.relance_le <= jour && f.statut !== 'ne-plus-appeler'
      && f.statut !== 'abonne-mois' && f.statut !== 'abonne-annee')
    .map(([siren, f]) => ({ siren, ...f }))
    .sort((a, b) => a.relance_le.localeCompare(b.relance_le) || a.siren.localeCompare(b.siren));
}

// Range une entreprise du lot du jour (site fabriqué, pas encore appelée).
export function inscrire(registre, e, { jour, slug }) {
  const deja = registre.fiches[e.siren] || {};
  registre.fiches[e.siren] = {
    metier: e.metier, nom: e.nom, commune: e.commune,
    site_le: jour, slug,
    statut: deja.statut && deja.statut !== 'a-appeler' ? deja.statut : 'a-appeler',
    appele_le: deja.appele_le ?? null,
    relance_le: deja.relance_le ?? null,
    note: e.note ?? null,
  };
  return registre.fiches[e.siren];
}

// Enregistre le résultat d'un appel. Un statut inconnu est refusé ici, pas
// découvert plus tard à l'écriture.
export function resultat(registre, siren, { statut, jour, relance_le = null }) {
  // Tous les refus avant la moindre écriture : un résultat refusé ne doit
  // pas laisser une fiche à moitié changée.
  if (!STATUTS.includes(statut)) throw new Error(`statut inconnu : ${statut} (connus : ${STATUTS.join(', ')})`);
  if (statut === 'a-rappeler' && !relance_le) throw new Error('« à rappeler » demande la date de la relance');
  const f = registre.fiches[siren];
  if (!f) throw new Error(`aucune fiche pour le SIREN ${siren} : un résultat ne s invente pas`);
  f.statut = statut;
  f.appele_le = jour;
  f.relance_le = statut === 'a-rappeler' ? relance_le : null;
  return f;
}

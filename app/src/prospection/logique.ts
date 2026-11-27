// Les règles de l'espace de prospection, sans écran ni base : le même code sert
// la démonstration, Supabase et les essais (scripts/essai-prospection-app.mjs).
import type { AppelProspect, Prospect, ResultatAppel, StatutProspect } from '../types';
import { decalerJour } from '../jour';

export const OBJECTIF_JOUR = 30; // décision du 23 oct., redite le 27 nov. : « Oui 30 »

export const STATUTS: Record<StatutProspect, { texte: string; ton: 'neutre' | 'attente' | 'ok' | 'probleme'; colonne: string }> = {
  'a-appeler': { texte: 'À appeler', ton: 'neutre', colonne: 'À appeler' },
  'pas-de-reponse': { texte: 'Pas de réponse', ton: 'attente', colonne: 'À appeler' },
  'a-rappeler': { texte: 'À rappeler', ton: 'attente', colonne: 'À rappeler' },
  interesse: { texte: 'Intéressé', ton: 'ok', colonne: 'Intéressés' },
  'maquette-envoyee': { texte: 'Maquette envoyée', ton: 'ok', colonne: 'Intéressés' },
  'essai-lance': { texte: 'Essai lancé', ton: 'ok', colonne: 'Gagnés' },
  abonne: { texte: 'Abonné', ton: 'ok', colonne: 'Gagnés' },
  refuse: { texte: 'Refusé', ton: 'probleme', colonne: 'Perdus' },
  'ne-plus-appeler': { texte: 'Ne plus appeler', ton: 'probleme', colonne: 'Perdus' },
};
export const COLONNES = ['À appeler', 'À rappeler', 'Intéressés', 'Gagnés', 'Perdus'] as const;

// Le jour ouvré suivant (pas de démarchage le week-end).
export function jourOuvreSuivant(jour: string, n = 1): string {
  let j = jour;
  let reste = n;
  while (reste > 0) {
    j = decalerJour(j, 1);
    const d = new Date(`${j}T12:00:00Z`).getUTCDay();
    if (d !== 0 && d !== 6) reste--;
  }
  return j;
}

// Ce que devient la fiche après un appel. Renvoie les champs à écrire, ou une
// erreur lisible : un rappel sans date, un refus ou un « ne plus appeler »
// laissé dans la liste ne passent pas.
export function appliquerResultat(p: Prospect, r: ResultatAppel, aujourdhui: string): Partial<Prospect> {
  if (!STATUTS[r.statut]) throw new Error(`Statut inconnu : ${r.statut}`);
  const suite: Partial<Prospect> = { statut: r.statut, rappel_heure: null };
  switch (r.statut) {
    case 'a-rappeler':
      if (!r.rappel_le || !/^\d{4}-\d{2}-\d{2}$/.test(r.rappel_le)) throw new Error('Choisissez le jour du rappel.');
      if (r.rappel_le < aujourdhui) throw new Error('Le rappel ne peut pas être dans le passé.');
      suite.a_appeler_le = r.rappel_le;
      suite.rappel_heure = r.rappel_heure || null;
      break;
    case 'pas-de-reponse':
      suite.a_appeler_le = jourOuvreSuivant(aujourdhui);
      break;
    case 'interesse':
    case 'maquette-envoyee':
      // une relance par défaut trois jours ouvrés plus tard, sauf date choisie
      suite.a_appeler_le = r.rappel_le || jourOuvreSuivant(aujourdhui, 3);
      suite.rappel_heure = r.rappel_heure || null;
      break;
    case 'refuse':
      suite.a_appeler_le = null;
      suite.raison_refus = r.raison_refus?.trim() || null;
      break;
    default: // essai lancé, abonné, ne plus appeler, à appeler
      suite.a_appeler_le = r.statut === 'a-appeler' ? aujourdhui : null;
  }
  // Le numéro ne reste que pour un appel du jour. Une fiche ajoutée à la main
  // garde le sien jusqu'au jour prévu (on ne peut pas le retrouver le soir).
  if (suite.a_appeler_le !== aujourdhui && p.source === 'soiree') suite.telephone = null;
  if (!suite.a_appeler_le) suite.telephone = null;
  return suite;
}

// La liste du jour : les rappels à heure fixe d'abord (dans l'ordre des heures),
// puis les autres rappels et relances, puis les nouveaux, les plus prometteurs
// devant (moins de présence web = plus à gagner).
export function listeDuJour(tous: Prospect[], aujourdhui: string): Prospect[] {
  const rang = (p: Prospect) => (p.rappel_heure ? 0 : p.statut === 'a-appeler' ? 2 : 1);
  return tous
    .filter((p) => p.a_appeler_le !== null && p.a_appeler_le <= aujourdhui && !['refuse', 'ne-plus-appeler', 'abonne', 'essai-lance'].includes(p.statut))
    .sort((a, b) => rang(a) - rang(b)
      || (a.rappel_heure || '').localeCompare(b.rappel_heure || '')
      || (a.a_appeler_le || '').localeCompare(b.a_appeler_le || '')
      || b.points_faibles.length - a.points_faibles.length
      || a.nom.localeCompare(b.nom, 'fr'));
}

// « Appelé aujourd'hui » : un résultat enregistré aujourd'hui, heure de Paris.
export function appelesAujourdhui(appels: AppelProspect[], aujourdhui: string, jourDe: (iso: string) => string): number {
  return new Set(appels.filter((a) => jourDe(a.fait_le) === aujourdhui).map((a) => a.prospect_id)).size;
}

export type Bilan = { appels: number; joints: number; interesses: number; gagnes: number; refus: number; taux: number | null };
export function bilan(appels: AppelProspect[]): Bilan {
  const joints = appels.filter((a) => a.statut !== 'pas-de-reponse').length;
  const interesses = appels.filter((a) => a.statut === 'interesse' || a.statut === 'maquette-envoyee').length;
  const gagnes = appels.filter((a) => a.statut === 'essai-lance' || a.statut === 'abonne').length;
  const refus = appels.filter((a) => a.statut === 'refuse' || a.statut === 'ne-plus-appeler').length;
  return { appels: appels.length, joints, interesses, gagnes, refus, taux: joints ? Math.round((gagnes / joints) * 100) : null };
}

// Le message qui accompagne la maquette (SMS ou WhatsApp), prêt à envoyer.
export function messageMaquette(p: Prospect): string {
  const lien = p.lien_maquette ? `\n${p.lien_maquette}` : '';
  return `Bonjour, c'est Fabrice de MonSiteArtisan. Comme convenu, voici la maquette du site que j'ai préparée pour ${p.nom}.${lien}\nElle est gratuite et sans engagement. Je reste joignable au 06 01 53 25 82.`;
}

export const numeroAppel = (t: string) => t.replace(/[^\d+]/g, '');
export const numeroLisible = (t: string) => t.replace(/\D/g, '').replace(/^33/, '0').replace(/(\d{2})(?=\d)/g, '$1 ');
export const numeroWhatsApp = (t: string) => t.replace(/\D/g, '').replace(/^0/, '33');

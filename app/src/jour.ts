// Le jour de Paris, comme prive.jour_paris() dans la base : un appareil réglé
// sur un autre fuseau, ou minuit passé en UTC, ne décale pas les statistiques.
import type { JourStat } from './types';

export function jourParis(instant: Date = new Date()): string {
  // en-CA donne AAAA-MM-JJ
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

export function decalerJour(jour: string, n: number): string {
  const [a, m, j] = jour.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1, j + n));
  return d.toISOString().slice(0, 10);
}

// Une ligne par jour, jours sans visite compris, à partir de lignes par page et source.
export function sommeParJour(lignes: JourStat[], debut: string, jours: number): JourStat[] {
  const parJour = new Map<string, JourStat>();
  for (let i = 0; i < jours; i++) {
    const jour = decalerJour(debut, i);
    parJour.set(jour, { jour, visites: 0, appels: 0, demandes: 0 });
  }
  for (const l of lignes) {
    const cible = parJour.get(String(l.jour).slice(0, 10));
    if (!cible) continue;
    cible.visites += Number(l.visites) || 0;
    cible.appels += Number(l.appels) || 0;
    cible.demandes += Number(l.demandes) || 0;
  }
  return [...parJour.values()];
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export function jourCourt(jour: string): string {
  const [, m, j] = jour.split('-').map(Number);
  return `${j} ${MOIS[m - 1]}`;
}

export function dateLisible(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export function heureLisible(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

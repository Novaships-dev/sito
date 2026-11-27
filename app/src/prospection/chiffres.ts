// Les calculs de l'espace « Chiffres » (T72), sans écran ni base : la
// démonstration, Supabase et l'essai passent par ici.
import type { Encaissement, Vente, Formule } from '../types';
import { decalerJour } from '../jour';
import { OFFRE } from '../vitrine/offre';

export const PRIX: Record<Formule, number> = { mensuel: OFFRE.prixMois, annuel: OFFRE.prixAn };

// Taux de 2026 pour une micro-entreprise de prestations de services
// commerciales (BIC), vérifiés le 27 nov. 2026 (economie.gouv.fr,
// bpifrance-creation.fr) : cotisations sociales 21,2 % (10,6 % avec l'ACRE la
// première année), formation professionnelle 0,1 %, versement libératoire de
// l'impôt 1,7 % (option prise à l'immatriculation, décision du 13 nov.).
export const TAUX = { cotisations: 0.212, cotisationsAcre: 0.106, formation: 0.001, liberatoire: 0.017 };
export const tauxPrelevements = (acre: boolean) => (acre ? TAUX.cotisationsAcre : TAUX.cotisations) + TAUX.formation + TAUX.liberatoire;
export const net = (ca: number, acre: boolean) => Math.round(ca * (1 - tauxPrelevements(acre)) * 100) / 100;

export type Periode = '1J' | '7J' | '1M' | '1A' | 'TOUT';
export const PERIODES: { id: Periode; texte: string; long: string }[] = [
  { id: '1J', texte: 'Jour', long: 'aujourd’hui' },
  { id: '7J', texte: 'Semaine', long: 'sur 7 jours' },
  { id: '1M', texte: 'Mois', long: 'sur 30 jours' },
  { id: '1A', texte: 'Année', long: 'sur 12 mois' },
  { id: 'TOUT', texte: 'Tout', long: 'depuis le début' },
];

// Les bornes d'une période (jours inclus), et celles de la période d'avant, pour la variation.
export function bornes(p: Periode, aujourdhui: string, premier: string | null): { debut: string; fin: string; avantDebut: string; avantFin: string } {
  const n = p === '1J' ? 1 : p === '7J' ? 7 : p === '1M' ? 30 : p === '1A' ? 365 : null;
  if (n === null) {
    const debut = premier && premier < aujourdhui ? premier : aujourdhui;
    return { debut, fin: aujourdhui, avantDebut: decalerJour(debut, -1), avantFin: decalerJour(debut, -1) };
  }
  const debut = decalerJour(aujourdhui, -(n - 1));
  return { debut, fin: aujourdhui, avantDebut: decalerJour(debut, -n), avantFin: decalerJour(debut, -1) };
}

export const somme = (e: Encaissement[]) => Math.round(e.reduce((t, x) => t + Number(x.montant), 0) * 100) / 100;
export const dans = (e: Encaissement[], debut: string, fin: string) => e.filter((x) => x.encaisse_le >= debut && x.encaisse_le <= fin);

export type Resume = { ca: number; avant: number; variation: number | null; abonnements: number; oneShot: number; autres: number; nombre: number };
export function resume(tous: Encaissement[], p: Periode, aujourdhui: string): Resume {
  const premier = tous.length ? tous.reduce((m, x) => (x.encaisse_le < m ? x.encaisse_le : m), tous[0].encaisse_le) : null;
  const b = bornes(p, aujourdhui, premier);
  const ici = dans(tous, b.debut, b.fin);
  const ca = somme(ici);
  const avant = p === 'TOUT' ? 0 : somme(dans(tous, b.avantDebut, b.avantFin));
  return {
    ca, avant,
    variation: avant > 0 ? Math.round(((ca - avant) / avant) * 1000) / 10 : null,
    abonnements: somme(ici.filter((x) => x.formule === 'mensuel')),
    oneShot: somme(ici.filter((x) => x.formule === 'annuel')),
    autres: somme(ici.filter((x) => x.formule === 'autre')),
    nombre: ici.length,
  };
}

// La courbe façon bourse : le chiffre d'affaires cumulé sur la période, un point
// par heure (jour), par jour (semaine, mois, tout) ou par semaine (année).
export type Point = { t: string; etiquette: string; cumul: number; du: number };
export function courbe(tous: Encaissement[], p: Periode, aujourdhui: string): Point[] {
  const premier = tous.length ? tous.reduce((m, x) => (x.encaisse_le < m ? x.encaisse_le : m), tous[0].encaisse_le) : null;
  const b = bornes(p, aujourdhui, premier);
  const ici = dans(tous, b.debut, b.fin);
  const points: Point[] = [];
  let cumul = 0;
  if (p === '1J') {
    const heure = (x: Encaissement) => Number(new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Paris' }).format(new Date(x.cree_le)));
    for (let h = 0; h <= 23; h++) {
      const du = somme(ici.filter((x) => heure(x) === h));
      cumul += du;
      points.push({ t: `${aujourdhui}T${String(h).padStart(2, '0')}`, etiquette: `${h} h`, cumul: Math.round(cumul * 100) / 100, du });
    }
    return points;
  }
  const pas = p === '1A' ? 7 : 1;
  for (let j = b.debut; j <= b.fin; j = decalerJour(j, pas)) {
    const finPas = pas === 1 ? j : (decalerJour(j, pas - 1) < b.fin ? decalerJour(j, pas - 1) : b.fin);
    const du = somme(dans(ici, j, finPas));
    cumul += du;
    points.push({ t: j, etiquette: j, cumul: Math.round(cumul * 100) / 100, du });
  }
  return points;
}

// Le revenu qui revient chaque mois : les abonnés au mois, plus un douzième des abonnés à l'année.
export function recurrent(ventes: Vente[]): { mensuel: number; abonnesMois: number; abonnesAn: number } {
  const actives = ventes.filter((v) => v.etat === 'active');
  const mois = actives.filter((v) => v.formule === 'mensuel').length;
  const an = actives.filter((v) => v.formule === 'annuel').length;
  return { mensuel: mois * PRIX.mensuel + Math.round((an * PRIX.annuel) / 12), abonnesMois: mois, abonnesAn: an };
}

// Qui doit payer ce mois-ci : un abonné au mois dont le mois offert est passé
// et dont rien n'est encaissé dans le mois en cours.
export function aEncaisser(ventes: Vente[], encaissements: Encaissement[], aujourdhui: string): Vente[] {
  const mois = aujourdhui.slice(0, 7);
  return ventes.filter((v) => {
    if (v.etat !== 'active' || v.formule !== 'mensuel') return false;
    const finOffert = decalerJour(v.debut_le, 30 * OFFRE.moisOfferts);
    if (finOffert > aujourdhui) return false;
    return !encaissements.some((e) => e.vente_id === v.id && e.encaisse_le.slice(0, 7) === mois);
  });
}

export const eurosPrecis = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);

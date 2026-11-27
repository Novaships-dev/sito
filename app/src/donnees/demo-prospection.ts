// La prospection en démonstration : des entreprises inventées, des numéros de la
// tranche réservée à la fiction par l'ARCEP (06 39 98 xx xx), tout en mémoire
// du navigateur. Sert à essayer l'écran et aux essais automatiques.
import type { AppelProspect, Donnees, NouveauProspect, Prospect } from '../types';
import { jourParis } from '../jour';
import { appliquerResultat } from '../prospection/logique';

type Methodes = Pick<Donnees, 'estProspecteur' | 'prospects' | 'appelsProspect' | 'appelsRecents' | 'enregistrerResultat' | 'enregistrerNotes' | 'ajouterProspect'>;

const CLE = 'sito-demo-prospection-v1';

function fiche(id: string, f: Partial<Prospect> & Pick<Prospect, 'nom' | 'metier' | 'commune'>, jour: string): Prospect {
  return {
    id, siren: null, telephone: null, statut: 'a-appeler', a_appeler_le: jour, rappel_heure: null,
    points_forts: [], points_faibles: [], angle: null, lien_maquette: null, note_google: null, avis_google: null,
    site_actuel: null, notes: null, raison_refus: null, source: 'soiree', cree_le: `${jour}T06:00:00.000Z`, maj_le: `${jour}T06:00:00.000Z`,
    ...f,
  };
}

function depart(jour: string): { prospects: Prospect[]; appels: AppelProspect[] } {
  const p: Prospect[] = [
    fiche('dp1', {
      nom: 'Façades du Garlaban', metier: 'Ravalement', commune: 'Aubagne', telephone: '06 39 98 00 01', statut: 'a-rappeler', rappel_heure: '10:30',
      note_google: 4.8, avis_google: 32,
      points_forts: [{ sujet: 'Avis Google', texte: '4,8 sur 32 avis, clients très satisfaits' }, { sujet: 'Photos', texte: '18 photos de chantiers sur la fiche Google' }],
      points_faibles: [{ sujet: 'Site', texte: 'Aucun site internet' }, { sujet: 'Réseaux', texte: 'Pas de page Facebook ni Instagram' }],
      angle: '4,8 sur 32 avis mais aucun site : les clients qui cherchent un façadier à Aubagne ne voient pas ses chantiers.',
      notes: 'Rappeler après 10 h, il est sur un chantier le matin.',
    }, jour),
    fiche('dp2', {
      nom: 'Toitures Provence Azur', metier: 'Couverture', commune: 'Marseille', telephone: '06 39 98 00 02',
      note_google: 4.2, avis_google: 9, site_actuel: 'toitures-provence-azur.fr (2017)',
      points_forts: [{ sujet: 'Site', texte: 'A un site, signe qu’il croit à internet' }],
      points_faibles: [{ sujet: 'Site', texte: 'Site de 2017, illisible sur téléphone, sans https' }, { sujet: 'Avis Google', texte: 'Seulement 9 avis' }, { sujet: 'Réseaux', texte: 'Facebook sans publication depuis 2022' }],
      angle: 'Son site date de 2017 et s’affiche mal sur téléphone : 7 clients sur 10 cherchent un couvreur depuis leur portable.',
    }, jour),
    fiche('dp3', {
      nom: 'Atelier Couleurs Sud', metier: 'Peinture', commune: 'Aix-en-Provence', telephone: '06 39 98 00 03',
      note_google: 5, avis_google: 4,
      points_forts: [{ sujet: 'Avis Google', texte: '5 sur 5, avis récents' }, { sujet: 'Instagram', texte: 'Compte actif, belles photos de chantiers' }],
      points_faibles: [{ sujet: 'Site', texte: 'Aucun site : Instagram ne remonte pas sur Google' }, { sujet: 'Fiche Google', texte: 'Pas d’horaires ni de photos' }],
      angle: 'Ses photos Instagram sont superbes, mais personne ne les voit en cherchant « peintre Aix » sur Google.',
    }, jour),
    fiche('dp4', {
      nom: 'SB Rénovation Façade', metier: 'Ravalement', commune: 'La Ciotat', telephone: '06 39 98 00 04',
      points_faibles: [{ sujet: 'Fiche Google', texte: 'Aucune fiche Google' }, { sujet: 'Site', texte: 'Aucun site' }, { sujet: 'Réseaux', texte: 'Aucun réseau social' }],
      points_forts: [{ sujet: 'Ancienneté', texte: 'Entreprise créée en 2014' }],
      angle: 'Douze ans de métier et invisible sur internet : un site et une fiche Google lui donnent une existence en ligne.',
    }, jour),
    fiche('dp5', {
      nom: 'Couverture Martin et Fils', metier: 'Couverture', commune: 'Gémenos', telephone: '06 39 98 00 05', statut: 'interesse',
      note_google: 4.6, avis_google: 21,
      points_forts: [{ sujet: 'Avis Google', texte: '4,6 sur 21 avis' }, { sujet: 'Entreprise familiale', texte: 'Deux générations, argument fort' }],
      points_faibles: [{ sujet: 'Site', texte: 'Page PagesJaunes seulement' }],
      angle: 'Entreprise familiale bien notée qui dépend de PagesJaunes : un site à son nom met en avant l’histoire de la famille.',
      notes: 'Intéressé, veut voir la maquette avec sa femme qui fait les devis.',
    }, jour),
    fiche('dp6', {
      nom: 'Peinture Lumière 13', metier: 'Peinture', commune: 'Marignane', telephone: '06 39 98 00 06', statut: 'pas-de-reponse',
      note_google: 3.9, avis_google: 14,
      points_forts: [{ sujet: 'Fiche Google', texte: 'Fiche complète avec horaires et photos' }],
      points_faibles: [{ sujet: 'Avis Google', texte: '3,9 : deux avis négatifs sans réponse' }, { sujet: 'Site', texte: 'Aucun site' }],
      angle: 'Deux avis négatifs restés sans réponse pèsent sur sa note : son site montre ses chantiers réussis.',
    }, jour),
    fiche('dp7', {
      nom: 'Enduits et Pierres du Pays', metier: 'Ravalement', commune: 'Martigues', telephone: '06 39 98 00 07',
      note_google: 4.9, avis_google: 57, site_actuel: 'Page Facebook seulement',
      points_forts: [{ sujet: 'Avis Google', texte: '4,9 sur 57 avis, réputation excellente' }, { sujet: 'Facebook', texte: 'Page active, publie chaque mois' }],
      points_faibles: [{ sujet: 'Site', texte: 'Pas de site : Facebook ne suffit pas pour Google' }],
      angle: '57 avis à 4,9 : il a déjà la réputation, il lui manque la vitrine qui transforme les recherches en appels.',
    }, jour),
  ];
  return { prospects: p, appels: [] };
}

export function prospectionDemo(exiger: () => void): Methodes {
  const jour = jourParis();
  let etat: { jour: string; prospects: Prospect[]; appels: AppelProspect[] };
  try { etat = JSON.parse(localStorage.getItem(CLE) || 'null'); } catch { etat = null as never; }
  if (!etat || !Array.isArray(etat.prospects)) etat = { jour, ...depart(jour) };
  // Un nouveau jour en démonstration : la liste repart du jour, comme le soir le ferait.
  if (etat.jour !== jour) etat = { jour, ...depart(jour) };
  const garder = () => { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch { /* navigation privée */ } };
  let n = 1000;
  const copie = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  const trouver = (id: string) => {
    const p = etat.prospects.find((x) => x.id === id);
    if (!p) throw new Error('Fiche introuvable.');
    return p;
  };

  return {
    async estProspecteur() { exiger(); return true; },
    async prospects() { exiger(); return copie(etat.prospects); },
    async appelsProspect(id) { exiger(); return copie(etat.appels.filter((a) => a.prospect_id === id)).reverse(); },
    async appelsRecents(jours) {
      exiger();
      const depuis = Date.now() - jours * 864e5;
      return copie(etat.appels.filter((a) => Date.parse(a.fait_le) >= depuis));
    },
    async enregistrerResultat(id, r) {
      exiger();
      const p = trouver(id);
      const suite = appliquerResultat(p, r, jourParis());
      const maintenant = new Date().toISOString();
      if (r.note?.trim()) suite.notes = [p.notes, r.note.trim()].filter(Boolean).join('\n');
      Object.assign(p, suite, { maj_le: maintenant });
      etat.appels.push({ id: `da${++n}`, prospect_id: id, statut: r.statut, note: r.note?.trim() || null, fait_le: maintenant });
      garder();
    },
    async enregistrerNotes(id, notes) { exiger(); const p = trouver(id); p.notes = notes.trim() || null; p.maj_le = new Date().toISOString(); garder(); },
    async ajouterProspect(np: NouveauProspect) {
      exiger();
      if (!np.nom.trim()) throw new Error('Le nom de l’entreprise est obligatoire.');
      if (np.telephone && np.telephone.replace(/\D/g, '').length < 10) throw new Error('Numéro incomplet : dix chiffres.');
      const p = fiche(`dm${++n}`, { nom: np.nom.trim(), metier: np.metier.trim() || 'Autre', commune: np.commune?.trim() || null, telephone: np.telephone?.trim() || null, a_appeler_le: np.a_appeler_le, notes: np.notes?.trim() || null, source: 'manuel' }, jourParis());
      p.a_appeler_le = np.a_appeler_le;
      etat.prospects.push(p);
      garder();
      return copie(p);
    },
  };
}

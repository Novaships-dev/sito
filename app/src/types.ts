// Les données de l'app, telles que la base les décrit
// (supabase/migrations/20261002194303_schema.sql et 20261005014022_app.sql).

export type Entreprise = { siren: string; nom_affiche: string; commune: string | null; code_postal: string | null };

export type Profil = {
  siren: string;
  telephone: string | null;
  courriel: string | null;
  prix_affiches: boolean;
  prix_mention: string | null;
  tva_intra: string | null;
  decennale_assureur: string | null;
  decennale_contrat: string | null;
  decennale_zone: string | null;
  mediateur_nom: string | null;
  mediateur_site: string | null;
  // Migration 20261103_mentions_legales (T50) : ce que l'annuaire ne donne pas.
  capital_social: string | null;
  immatriculation: string | null;
  directeur_publication: string | null;
  mediateur_adresse: string | null;
};

export type Tarif = { id: string; poste: string; bas: number; haut: number | null; unite: string; note: string | null; rang: number };

export type Chantier = { id: string; titre: string | null; commune: string | null; termine_le: string | null; description: string | null; publie: boolean; cree_le: string };

export type RolePhoto = 'avant' | 'apres' | 'chantier' | 'geste' | 'detail';
export type Photo = {
  id: string; chantier_id: string | null; role: RolePhoto; paire: number | null;
  etat: 'recue' | 'prete' | 'illisible'; motif: string | null;
  apercu: string | null; // adresse affichable (signée) de l'image, si elle existe
  format_origine: string | null; cree_le: string;
};

export type Demande = { id: string; nom: string | null; telephone: string | null; courriel: string | null; message: string; page: string | null; recue_le: string; lue_le: string | null };

export type JourStat = { jour: string; visites: number; appels: number; demandes: number };

export type Avis = { id: string; auteur: string | null; note: number | null; texte: string | null; ecrit_le: string | null; reponse: string | null; brouillon: string | null; valide_le: string | null };

export type Site = { id: string; statut: string; adresse_en_ligne: string | null; publie_le: string | null };
export type Adresse = { hote: string; genre: 'offerte' | 'achetee' | 'existante'; principale: boolean; etat: 'en_attente' | 'active' | 'echec' | 'retiree'; motif: string | null };
export type Abonnement = { formule: 'mensuel' | 'annuel'; etat: 'essai' | 'actif' | 'impaye' | 'resilie'; fin_periode: string | null; resiliation_prevue: boolean };
export type Suppression = { demandee_le: string; effective_le: string; annulee_le: string | null };

// Ce que l'app envoie : le fichier préparé sur l'appareil (voir photo.ts).
// cle : choisie par l'app, elle nomme le fichier dans le stockage et relie
// l'original (envoyé ensuite) à sa photo.
export type EnvoiPhoto = { fichier: Blob; nom: string; format: string; role: RolePhoto; paire: number | null; chantierId: string; cle: string };
// L'original en pleine résolution, envoyé après la version réduite
// (décision du 9 octobre, migration 20261009005808_photo_source).
export type EnvoiOriginal = { fichier: Blob; nom: string; format: string; chantierId: string; cle: string };

// ---------------------------------------------------------------- prospection
// L'espace de prospection de Fabrice (T70, demande du 27 nov. 2026) : les
// artisans à appeler, leur diagnostic web, le résultat de chaque appel.
// Migration 20261127_prospection. Le numéro n'est gardé que pour le jour de
// l'appel (« aucun numero stocker juste ceux du jour a appeler ») : la base
// l'efface chaque nuit pour toute fiche qui n'est pas à appeler ce jour-là.
export type StatutProspect =
  | 'a-appeler' | 'pas-de-reponse' | 'a-rappeler' | 'interesse' | 'maquette-envoyee'
  | 'essai-lance' | 'abonne' | 'refuse' | 'ne-plus-appeler';
export type Constat = { sujet: string; texte: string };
export type Prospect = {
  id: string;
  siren: string | null;
  nom: string;
  metier: string;
  commune: string | null;
  telephone: string | null;   // seulement le jour de l'appel
  statut: StatutProspect;
  a_appeler_le: string | null; // AAAA-MM-JJ : le jour où il figure dans la liste
  rappel_heure: string | null; // HH:MM, pour un rappel
  points_forts: Constat[];
  points_faibles: Constat[];
  angle: string | null;        // la phrase d'accroche de l'appel
  lien_maquette: string | null;
  note_google: number | null;
  avis_google: number | null;
  site_actuel: string | null;
  notes: string | null;
  raison_refus: string | null;
  source: 'soiree' | 'manuel';
  cree_le: string;
  maj_le: string;
};
export type AppelProspect = { id: string; prospect_id: string; statut: StatutProspect; note: string | null; fait_le: string };
export type ResultatAppel = { statut: StatutProspect; rappel_le?: string | null; rappel_heure?: string | null; note?: string | null; raison_refus?: string | null };
export type NouveauProspect = { nom: string; metier: string; commune: string | null; telephone: string | null; a_appeler_le: string; notes: string | null };

// ---------------------------------------------------------------- chiffres
// Ce que MonSiteArtisan encaisse (T72, migration 20261127002902_chiffres).
// « L'offre 720€/ ans c'est le "one shot" » (27 nov.).
export type Formule = 'mensuel' | 'annuel';
export type Vente = { id: string; fiche_id: string | null; nom: string; formule: Formule; debut_le: string; etat: 'active' | 'terminee'; cree_le: string };
export type Encaissement = { id: string; vente_id: string | null; nom: string; formule: Formule | 'autre'; montant: number; encaisse_le: string; note: string | null; source: 'manuel' | 'stripe'; cree_le: string };
export type NouvelleVente = { fiche_id: string | null; nom: string; formule: Formule; encaisse_aujourdhui: boolean };
export type NouvelEncaissement = { vente_id: string | null; nom: string; formule: Formule | 'autre'; montant: number; encaisse_le: string; note: string | null };

export interface Donnees {
  readonly demo: boolean;
  // connexion
  utilisateur(): Promise<{ courriel: string } | null>;
  seConnecter(courriel: string, motDePasse: string): Promise<void>;
  deconnecter(): Promise<void>;
  surChangementSession(rappel: () => void): () => void;
  // entreprise
  entreprise(): Promise<Entreprise | null>;
  profil(): Promise<Profil>;
  enregistrerProfil(p: Partial<Profil>): Promise<void>;
  tarifs(): Promise<Tarif[]>;
  enregistrerTarif(t: Omit<Tarif, 'id'> & { id?: string }): Promise<void>;
  supprimerTarif(id: string): Promise<void>;
  // chantiers et photos
  chantiers(): Promise<Chantier[]>;
  creerChantier(c: { titre: string; commune: string | null }): Promise<Chantier>;
  photos(chantierId: string): Promise<Photo[]>;
  envoyerPhoto(e: EnvoiPhoto, progression?: (part: number) => void): Promise<void>;
  envoyerOriginal(e: EnvoiOriginal, progression?: (part: number) => void): Promise<void>;
  envoyerVideo(e: { fichier: Blob; nom: string; format: string; chantierId: string }, progression?: (part: number) => void): Promise<void>;
  // ce qui revient du site : plus d'écran (T61), lu pour l'export des données
  demandes(): Promise<Demande[]>;
  statistiques(jours: number): Promise<JourStat[]>;
  avis(): Promise<Avis[]>;
  // site, adresse, abonnement (lus pour « Mon site » et l'export), compte
  site(): Promise<Site | null>;
  adresses(): Promise<Adresse[]>;
  abonnement(): Promise<Abonnement | null>;
  suppression(): Promise<Suppression | null>;
  demanderSuppression(): Promise<void>;
  annulerSuppression(): Promise<void>;
  // prospection (réservée aux comptes prospecteurs : Fabrice)
  estProspecteur(): Promise<boolean>;
  prospects(): Promise<Prospect[]>;
  appelsProspect(prospectId: string): Promise<AppelProspect[]>;
  appelsRecents(jours: number): Promise<AppelProspect[]>;
  enregistrerResultat(prospectId: string, r: ResultatAppel): Promise<void>;
  enregistrerNotes(prospectId: string, notes: string): Promise<void>;
  ajouterProspect(p: NouveauProspect): Promise<Prospect>;
  // chiffres (mêmes droits que la prospection)
  ventes(): Promise<Vente[]>;
  encaissements(): Promise<Encaissement[]>;
  creerVente(v: NouvelleVente): Promise<Vente>;
  ajouterEncaissement(e: NouvelEncaissement): Promise<void>;
  retirerEncaissement(id: string): Promise<void>;
}

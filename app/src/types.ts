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
// Mon adresse, cas B et C (T20) : la réponse du service des domaines.
export type RechercheDomaine = { hote: string; disponible: boolean; motif: string | null };
export type Branchement = { adresse: Adresse; cname: { nom: string; valeur: string } };
export type Abonnement = { formule: 'mensuel' | 'annuel'; etat: 'essai' | 'actif' | 'impaye' | 'resilie'; fin_periode: string | null; resiliation_prevue: boolean };
export type ConnexionGoogle = { etat: 'a_connecter' | 'connectee' | 'revoquee' | 'erreur'; fiche: string | null; derniere_synchro: string | null; motif: string | null };
export type Suppression = { demandee_le: string; effective_le: string; annulee_le: string | null };

// Ce que l'app envoie : le fichier préparé sur l'appareil (voir photo.ts).
// cle : choisie par l'app, elle nomme le fichier dans le stockage et relie
// l'original (envoyé ensuite) à sa photo.
export type EnvoiPhoto = { fichier: Blob; nom: string; format: string; role: RolePhoto; paire: number | null; chantierId: string; cle: string };
// L'original en pleine résolution, envoyé après la version réduite
// (décision du 9 octobre, migration 20261009005808_photo_source).
export type EnvoiOriginal = { fichier: Blob; nom: string; format: string; chantierId: string; cle: string };

// Ce qu'ouvre un lien envoyé par Fabrice (fonction Edge « inscription »,
// supabase/functions/inscription) : créer le compte, ou choisir un nouveau
// mot de passe (décision du 29 octobre 2026 : e-mail et mot de passe, une
// seule fois, sans code).
export type LienCompte = { genre: 'inscription' | 'reprise'; entreprise: string; courriel: string | null };
export const MOT_DE_PASSE_MIN = 8;

export interface Donnees {
  readonly demo: boolean;
  // connexion
  utilisateur(): Promise<{ courriel: string } | null>;
  seConnecter(courriel: string, motDePasse: string): Promise<void>;
  lireLien(jeton: string): Promise<LienCompte>;
  sInscrire(jeton: string, courriel: string, motDePasse: string): Promise<void>;
  reprendre(jeton: string, motDePasse: string): Promise<void>;
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
  // ce qui revient du site
  demandes(): Promise<Demande[]>;
  marquerLue(id: string): Promise<void>;
  statistiques(jours: number): Promise<JourStat[]>;
  avis(): Promise<Avis[]>;
  validerReponse(id: string, texte: string): Promise<void>;
  // site, adresse, abonnement, Google, compte
  site(): Promise<Site | null>;
  adresses(): Promise<Adresse[]>;
  // Mon adresse (T20) : chercher et réserver un domaine (cas B), brancher le
  // sien (cas C), en demander l'état. Passe par le service (fonction Edge
  // `domaines`) : Gandi et Cloudflare ont des clés que l'app n'a pas.
  chercherDomaine(nom: string): Promise<RechercheDomaine>;
  acheterDomaine(nom: string, representant: { prenom: string; nom: string }): Promise<Adresse>;
  brancherDomaine(nom: string): Promise<Branchement>;
  verifierDomaine(hote: string): Promise<Adresse>;
  abonnement(): Promise<Abonnement | null>;
  // Web seulement (T17) : l'adresse du paiement Stripe ou du portail, à ouvrir.
  ouvrirPaiement(action: 'paiement' | 'portail', formule?: 'mensuel' | 'annuel'): Promise<string>;
  connexionGoogle(): Promise<ConnexionGoogle | null>;
  // T24 : l'adresse du consentement Google (fonction Edge `google-lien`) ;
  // Google ramène ensuite sur l'écran Ma fiche Google avec « google=ok ».
  lienGoogle(): Promise<string>;
  suppression(): Promise<Suppression | null>;
  demanderSuppression(): Promise<void>;
  annulerSuppression(): Promise<void>;
}

// Les données de démonstration : tout en mémoire, rien ne sort de l'appareil.
// Sert à essayer l'app sans compte, et aux essais automatiques, qui lisent ce
// qui a été « envoyé » dans window.__sitoDemo (le fichier réellement produit
// par l'app, pas une variable que l'app aurait remplie pour l'essai).
import { MOT_DE_PASSE_MIN } from '../types';
import type { Donnees, LienCompte, Profil, Tarif, Chantier, Photo, Demande, Avis, Adresse, Abonnement, ConnexionGoogle, Suppression, JourStat, EnvoiPhoto } from '../types';
import { jourParis, decalerJour } from '../jour';

export type EnvoiDemo = { genre: 'photo' | 'video' | 'original'; nom: string; format: string; type: string; octets: number; fichier: Blob; role?: string; paire?: number | null; chantierId: string; cle?: string };

declare global { interface Window { __sitoDemo?: { envois: EnvoiDemo[] } } }

// Le compte de démonstration, et les liens qu'enverrait Fabrice. Tout vit
// dans le navigateur (localStorage) : fermer l'app et la rouvrir garde la
// session, comme la vraie (Supabase garde la sienne au même endroit).
export const COMPTE_DEMO = { courriel: 'artisan@exemple.fr', motDePasse: 'chantier13' };
const LIENS_DEMO: Record<string, LienCompte & { utilise?: boolean }> = {
  'demo-inscription': { genre: 'inscription', entreprise: 'Façades Exemple', courriel: null },
  'demo-reprise': { genre: 'reprise', entreprise: 'Façades Exemple', courriel: COMPTE_DEMO.courriel },
  'demo-deja-servi': { genre: 'inscription', entreprise: 'Toitures Voisines', courriel: null, utilise: true },
};
const memoire = {
  lire<T>(cle: string, defaut: T): T { try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) as T : defaut; } catch { return defaut; } },
  ecrire(cle: string, v: unknown) { try { if (v === null) localStorage.removeItem(cle); else localStorage.setItem(cle, JSON.stringify(v)); } catch { /* navigation privée */ } },
};
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Un tirage pseudo-aléatoire fixe : les mêmes chiffres à chaque ouverture.
function tirage(graine: number) { let x = graine; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; }

export function donneesDemo(): Donnees {
  const envois: EnvoiDemo[] = [];
  window.__sitoDemo = { envois };
  let connecte = memoire.lire<string | null>('sito-demo-connecte', null);
  const comptes = memoire.lire<Record<string, string>>('sito-demo-comptes', { [COMPTE_DEMO.courriel]: COMPTE_DEMO.motDePasse });
  const liensServis = memoire.lire<string[]>('sito-demo-liens-servis', []);
  const ouvrir = (courriel: string) => { connecte = courriel; memoire.ecrire('sito-demo-connecte', courriel); prevenir(); };
  const lienValable = (jeton: string) => {
    const l = LIENS_DEMO[jeton];
    if (!l) throw new Error('Ce lien n’est pas valable. Demandez-en un nouveau à Sitô.');
    if (l.utilise || liensServis.includes(jeton)) throw new Error('Ce lien a déjà servi. Connectez-vous avec votre adresse e-mail et votre mot de passe.');
    return l;
  };
  const motDePasseValable = (m: string) => { if (m.length < MOT_DE_PASSE_MIN) throw new Error(`Le mot de passe doit faire au moins ${MOT_DE_PASSE_MIN} caractères.`); };
  const servi = (jeton: string) => { liensServis.push(jeton); memoire.ecrire('sito-demo-liens-servis', liensServis); memoire.ecrire('sito-demo-comptes', comptes); };
  const rappels = new Set<() => void>();
  const prevenir = () => rappels.forEach((r) => r());
  let id = 100;
  const nouvelId = () => `demo-${++id}`;
  const maintenant = () => new Date().toISOString();
  const ilYa = (jours: number, heures = 0) => new Date(Date.now() - jours * 864e5 - heures * 36e5).toISOString();

  const profil: Profil = {
    siren: '000000000', telephone: '0491234567', courriel: 'contact@exemple.fr', prix_affiches: false, prix_mention: null,
    tva_intra: null, decennale_assureur: null, decennale_contrat: null, decennale_zone: null, mediateur_nom: null, mediateur_site: null,
  };
  const tarifs: Tarif[] = [
    { id: 'demo-t1', poste: 'Ravalement enduit gratté', bas: 45, haut: 70, unite: 'm²', note: null, rang: 0 },
    { id: 'demo-t2', poste: 'Nettoyage de façade', bas: 15, haut: 25, unite: 'm²', note: 'Hors échafaudage', rang: 1 },
  ];
  const chantiers: Chantier[] = [
    { id: 'demo-c1', titre: 'Façade d’une maison de ville', commune: 'Aubagne', termine_le: null, description: null, publie: true, cree_le: ilYa(20) },
    { id: 'demo-c2', titre: 'Mur de clôture', commune: 'La Ciotat', termine_le: null, description: null, publie: false, cree_le: ilYa(6) },
  ];
  const photos: (Photo & { cle?: string; original?: boolean })[] = [];
  const demandes: Demande[] = [
    { id: 'demo-d1', nom: 'M. Garcia', telephone: '06 12 34 56 78', courriel: null, message: 'Bonjour, je voudrais un devis pour le ravalement d’une maison de 120 m² à Gémenos.', page: '/', recue_le: ilYa(0, 3), lue_le: null },
    { id: 'demo-d2', nom: 'Sophie', telephone: null, courriel: 'sophie@exemple.fr', message: 'Faites-vous les murs de clôture ?', page: '/realisations', recue_le: ilYa(4), lue_le: ilYa(3) },
  ];
  const avis: Avis[] = [
    { id: 'demo-a1', auteur: 'Jean-Pierre R.', note: 5, texte: 'Travail propre, délais tenus, je recommande.', ecrit_le: ilYa(2), reponse: null,
      brouillon: 'Merci Jean-Pierre pour votre confiance, ce fut un plaisir de travailler sur votre façade.', valide_le: null },
    { id: 'demo-a2', auteur: 'Nadia B.', note: 4, texte: 'Bon résultat, un peu de retard au démarrage.', ecrit_le: ilYa(15), reponse: 'Merci Nadia, et désolé pour le démarrage : la météo ne nous a pas aidés.', brouillon: null, valide_le: ilYa(14) },
  ];
  const adresses: Adresse[] = [{ hote: 'exemple.domaine-sito.fr', genre: 'offerte', principale: true, etat: 'active', motif: null }];
  const abonnement: Abonnement = { formule: 'mensuel', etat: 'essai', fin_periode: ilYa(-14), resiliation_prevue: false };
  const google: ConnexionGoogle = { etat: 'a_connecter', fiche: null, derniere_synchro: null, motif: null };
  let suppression: Suppression | null = null;

  const exiger = () => { if (!connecte) throw new Error('Session expirée : reconnectez-vous.'); };

  return {
    demo: true,
    async utilisateur() { return connecte ? { courriel: connecte } : null; },
    async seConnecter(courriel, mdp) {
      await attendre(150);
      const c = courriel.trim().toLowerCase();
      if (comptes[c] !== mdp) throw new Error('Adresse e-mail ou mot de passe incorrect.');
      ouvrir(c);
    },
    async lireLien(jeton) { await attendre(100); const { utilise: _u, ...l } = lienValable(jeton); return l; },
    async sInscrire(jeton, courriel, mdp) {
      await attendre(150);
      const l = lienValable(jeton);
      if (l.genre !== 'inscription') throw new Error('Ce lien n’est pas valable. Demandez-en un nouveau à Sitô.');
      const c = courriel.trim().toLowerCase();
      motDePasseValable(mdp);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)) throw new Error('Adresse e-mail invalide.');
      if (comptes[c]) throw new Error('Cette adresse a déjà un compte Sitô. Connectez-vous, ou choisissez une autre adresse.');
      comptes[c] = mdp;
      servi(jeton);
      ouvrir(c);
    },
    async reprendre(jeton, mdp) {
      await attendre(150);
      const l = lienValable(jeton);
      if (l.genre !== 'reprise' || !l.courriel) throw new Error('Ce lien n’est pas valable. Demandez-en un nouveau à Sitô.');
      motDePasseValable(mdp);
      comptes[l.courriel] = mdp;
      servi(jeton);
      ouvrir(l.courriel);
    },
    async deconnecter() {
      connecte = null;
      memoire.ecrire('sito-demo-connecte', null);
      prevenir();
    },
    surChangementSession(rappel) { rappels.add(rappel); return () => rappels.delete(rappel); },

    async entreprise() { exiger(); return { siren: '000000000', nom_affiche: 'Façades Exemple', commune: 'Aubagne', code_postal: '13400' }; },
    async profil() { exiger(); return { ...profil }; },
    async enregistrerProfil(p) {
      exiger();
      if (p.telephone != null && !/^0[1-9][0-9]{8}$/.test(p.telephone)) throw new Error('Numéro invalide : dix chiffres, commençant par 0.');
      Object.assign(profil, p, { siren: profil.siren });
    },
    async tarifs() { exiger(); return tarifs.map((t) => ({ ...t })).sort((a, b) => a.rang - b.rang); },
    async enregistrerTarif(t) {
      exiger();
      if (t.haut != null && t.haut < t.bas) throw new Error('Le prix haut doit être supérieur au prix bas.');
      if (t.id) Object.assign(tarifs.find((x) => x.id === t.id) || {}, t);
      else tarifs.push({ ...t, id: nouvelId() });
    },
    async supprimerTarif(tid) { exiger(); const i = tarifs.findIndex((t) => t.id === tid); if (i >= 0) tarifs.splice(i, 1); },

    async chantiers() { exiger(); return chantiers.map((c) => ({ ...c })); },
    async creerChantier(c) {
      exiger();
      const ch: Chantier = { id: nouvelId(), titre: c.titre, commune: c.commune, termine_le: null, description: null, publie: false, cree_le: maintenant() };
      chantiers.unshift(ch);
      return { ...ch };
    },
    async photos(cid) { exiger(); return photos.filter((p) => p.chantier_id === cid).map(({ cle: _c, original: _o, ...p }) => ({ ...p })); },
    async envoyerPhoto(e: EnvoiPhoto, progression) {
      exiger();
      for (let i = 1; i <= 4; i++) { await attendre(60); progression?.(i / 4); }
      envois.push({ genre: 'photo', nom: e.nom, format: e.format, type: e.fichier.type, octets: e.fichier.size, fichier: e.fichier, role: e.role, paire: e.paire, chantierId: e.chantierId, cle: e.cle });
      // Dans la vraie chaîne, le service rend la photo « prête ». Ici : prête si
      // l'appareil a pu la préparer (JPEG), sinon reçue, en attente du service.
      const prete = e.fichier.type === 'image/jpeg';
      photos.push({
        id: nouvelId(), chantier_id: e.chantierId, role: e.role, paire: e.paire, etat: prete ? 'prete' : 'recue', motif: null,
        apercu: prete ? URL.createObjectURL(e.fichier) : null, format_origine: e.format, cree_le: maintenant(), cle: e.cle,
      });
    },
    async envoyerOriginal(e, progression) {
      exiger();
      const photo = photos.find((p) => p.cle === e.cle && p.chantier_id === e.chantierId);
      if (!photo) throw new Error('photo réduite pas encore enregistrée');
      for (let i = 1; i <= 4; i++) { await attendre(60); progression?.(i / 4); }
      envois.push({ genre: 'original', nom: e.nom, format: e.format, type: e.fichier.type, octets: e.fichier.size, fichier: e.fichier, chantierId: e.chantierId, cle: e.cle });
      photo.original = true;
    },
    async envoyerVideo(e, progression) {
      exiger();
      for (let i = 1; i <= 4; i++) { await attendre(60); progression?.(i / 4); }
      envois.push({ genre: 'video', nom: e.nom, format: e.format, type: e.fichier.type, octets: e.fichier.size, fichier: e.fichier, chantierId: e.chantierId });
    },

    async demandes() { exiger(); return demandes.map((d) => ({ ...d })); },
    async marquerLue(did) { exiger(); const d = demandes.find((x) => x.id === did); if (d && !d.lue_le) d.lue_le = maintenant(); },
    async statistiques(jours) {
      exiger();
      const r = tirage(7);
      const fin = jourParis();
      const lignes: JourStat[] = [];
      for (let i = jours - 1; i >= 0; i--) {
        const visites = Math.round(8 + r() * 30);
        lignes.push({ jour: decalerJour(fin, -i), visites, appels: Math.round(r() * visites * 0.12), demandes: r() < 0.25 ? 1 : 0 });
      }
      return lignes;
    },
    async avis() { exiger(); return avis.map((a) => ({ ...a })); },
    async validerReponse(aid, texte) {
      exiger();
      if (!texte.trim()) throw new Error('La réponse est vide.');
      const a = avis.find((x) => x.id === aid);
      if (a) { a.brouillon = texte; a.valide_le = maintenant(); }
    },

    async site() { exiger(); return { id: 'demo-s1', statut: 'publie', adresse_en_ligne: 'https://exemple.domaine-sito.fr', publie_le: ilYa(1) }; },
    async adresses() { exiger(); return adresses.map((a) => ({ ...a })); },
    async abonnement() { exiger(); return { ...abonnement }; },
    async connexionGoogle() { exiger(); return { ...google }; },
    async suppression() { exiger(); return suppression && !suppression.annulee_le ? { ...suppression } : null; },
    async demanderSuppression() { exiger(); suppression = { demandee_le: maintenant(), effective_le: ilYa(-30), annulee_le: null }; },
    async annulerSuppression() { exiger(); if (suppression) suppression.annulee_le = maintenant(); },
  };
}

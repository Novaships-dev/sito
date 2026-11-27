// Les données réelles : Supabase (projet sito, Paris). Les droits sont dans la
// base (sécurité par ligne) : l'app ne voit et n'écrit que ce que la base lui
// permet, quoi qu'elle demande. Essais : supabase/essais/droits*.sql.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as tus from 'tus-js-client';
import type { Donnees, Profil, Tarif, Photo, EnvoiPhoto, EnvoiOriginal, JourStat, Prospect, Vente, Encaissement } from '../types';
import { PRIX } from '../prospection/chiffres';
import { appliquerResultat } from '../prospection/logique';
import { jourParis, decalerJour, sommeParJour } from '../jour';

const ESPACE = 'photos-chantiers';
const PROFIL_VIDE = (siren: string): Profil => ({
  siren, telephone: null, courriel: null, prix_affiches: false, prix_mention: null, tva_intra: null,
  decennale_assureur: null, decennale_contrat: null, decennale_zone: null, mediateur_nom: null, mediateur_site: null,
  capital_social: null, immatriculation: null, directeur_publication: null, mediateur_adresse: null,
});

// Une réponse de Supabase : l'erreur devient une exception, la donnée est typée
// par l'interface Donnees (types.ts), qui suit le schéma de la base.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function verifier<T = any>(r: { data: unknown; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export function donneesSupabase(url: string, cle: string): Donnees {
  const sb: SupabaseClient = createClient(url, cle, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  let sirenMemo: string | null = null;

  async function siren(): Promise<string> {
    if (sirenMemo) return sirenMemo;
    const lignes = verifier(await sb.from('membres').select('siren').limit(1));
    if (!lignes.length) throw new Error("Ce compte n'est relié à aucune entreprise. Contactez MonSiteArtisan.");
    sirenMemo = lignes[0].siren as string;
    return sirenMemo;
  }

  async function envoyerReprenable(chemin: string, fichier: Blob, type: string, progression?: (p: number) => void) {
    const { data } = await sb.auth.getSession();
    const jeton = data.session?.access_token;
    if (!jeton) throw new Error('Session expirée : reconnectez-vous.');
    await new Promise<void>((ok, ko) => {
      const envoi = new tus.Upload(fichier, {
        endpoint: `${url}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 6 * 1024 * 1024, // imposé par Supabase
        headers: { authorization: `Bearer ${jeton}`, 'x-upsert': 'false' },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: { bucketName: ESPACE, objectName: chemin, contentType: type || 'application/octet-stream', cacheControl: '3600' },
        onError: (e) => ko(e),
        onProgress: (envoye, total) => progression?.(total ? envoye / total : 0),
        onSuccess: () => ok(),
      });
      envoi.findPreviousUploads().then((precedents) => {
        if (precedents.length) envoi.resumeFromPreviousUpload(precedents[0]);
        envoi.start();
      });
    });
  }

  // L'extension suit le fichier envoyé (photo.ts met .jpg quand l'appareil a réencodé),
  // format_origine garde ce que l'appareil avait produit (heic, dng…).
  const extension = (nom: string, format: string) => ((nom.includes('.') ? nom.split('.').pop() : format) || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';

  return {
    demo: false,

    async utilisateur() {
      const { data } = await sb.auth.getUser();
      return data.user ? { courriel: data.user.email || '' } : null;
    },
    async seConnecter(courriel, mdp) {
      const r = await sb.auth.signInWithPassword({ email: courriel.trim().toLowerCase(), password: mdp });
      if (r.error) throw new Error(/invalid login credentials/i.test(r.error.message)
        ? 'Adresse e-mail ou mot de passe incorrect.'
        : r.error.message);
    },
    async deconnecter() { sirenMemo = null; await sb.auth.signOut(); },
    surChangementSession(rappel) {
      const { data } = sb.auth.onAuthStateChange(() => { sirenMemo = null; rappel(); });
      return () => data.subscription.unsubscribe();
    },

    async entreprise() {
      const s = await siren();
      return verifier(await sb.from('entreprises').select('siren, nom_affiche, commune, code_postal').eq('siren', s).maybeSingle());
    },
    async profil() {
      const s = await siren();
      const p = verifier(await sb.from('profils').select('*').eq('siren', s).maybeSingle());
      return { ...PROFIL_VIDE(s), ...(p || {}) } as Profil;
    },
    async enregistrerProfil(p) {
      const s = await siren();
      const { siren: _ignore, ...champs } = p as Profil;
      verifier(await sb.from('profils').upsert({ siren: s, ...champs }, { onConflict: 'siren' }));
    },
    async tarifs() {
      const s = await siren();
      return verifier(await sb.from('tarifs').select('id, poste, bas, haut, unite, note, rang').eq('siren', s).order('rang')) as Tarif[];
    },
    async enregistrerTarif(t) {
      const s = await siren();
      if (t.id) verifier(await sb.from('tarifs').update({ poste: t.poste, bas: t.bas, haut: t.haut, unite: t.unite, note: t.note, rang: t.rang }).eq('id', t.id));
      else verifier(await sb.from('tarifs').insert({ siren: s, poste: t.poste, bas: t.bas, haut: t.haut, unite: t.unite, note: t.note, rang: t.rang }));
    },
    async supprimerTarif(id) { verifier(await sb.from('tarifs').delete().eq('id', id)); },

    async chantiers() {
      const s = await siren();
      return verifier(await sb.from('chantiers').select('id, titre, commune, termine_le, description, publie, cree_le').eq('siren', s).order('cree_le', { ascending: false }));
    },
    async creerChantier(c) {
      const s = await siren();
      return verifier(await sb.from('chantiers').insert({ siren: s, titre: c.titre, commune: c.commune }).select('id, titre, commune, termine_le, description, publie, cree_le').single());
    },
    async photos(chantierId) {
      const lignes = verifier(await sb.from('photos')
        .select('id, chantier_id, role, paire, etat, motif, chemin, chemin_original, format_origine, cree_le')
        .eq('chantier_id', chantierId).order('cree_le'));
      const chemins = lignes.map((l: { chemin: string | null }) => l.chemin).filter(Boolean) as string[];
      const signees = chemins.length ? verifier(await sb.storage.from(ESPACE).createSignedUrls(chemins, 3600)) : [];
      const url = new Map<string | null, string | null>(signees.map((x: { path: string | null; signedUrl: string | null }) => [x.path, x.signedUrl]));
      return lignes.map((l: Record<string, unknown>) => ({ ...l, apercu: l.chemin ? url.get(l.chemin as string) || null : null })) as Photo[];
    },
    async envoyerPhoto(e: EnvoiPhoto, progression) {
      const s = await siren();
      const chemin = `${s}/${e.chantierId}/${e.cle}.${extension(e.nom, e.format)}`;
      await envoyerReprenable(chemin, e.fichier, e.fichier.type, progression);
      verifier(await sb.from('photos').insert({
        siren: s, chantier_id: e.chantierId, role: e.role, paire: e.paire, origine: 'entreprise',
        chemin_original: chemin, format_origine: e.format.slice(0, 24), octets: e.fichier.size,
      }));
    },
    async envoyerOriginal(e: EnvoiOriginal, progression) {
      const s = await siren();
      // La photo réduite est partie avant (file dans l'ordre) : on la retrouve par sa clé.
      const photo = verifier(await sb.from('photos').select('id').like('chemin_original', `${s}/${e.chantierId}/${e.cle}.%`).maybeSingle());
      if (!photo) throw new Error('photo réduite pas encore enregistrée');
      const chemin = `${s}/${e.chantierId}/${e.cle}-original.${extension(e.nom, e.format)}`;
      await envoyerReprenable(chemin, e.fichier, e.fichier.type, progression);
      verifier(await sb.from('photos').update({ chemin_source: chemin, octets_source: e.fichier.size }).eq('id', photo.id));
    },
    async envoyerVideo(e, progression) {
      const s = await siren();
      const chemin = `${s}/${e.chantierId}/${crypto.randomUUID()}.${extension(e.nom, e.format)}`;
      await envoyerReprenable(chemin, e.fichier, e.fichier.type, progression);
      verifier(await sb.from('videos').insert({ siren: s, chantier_id: e.chantierId, chemin, format: e.format.slice(0, 24), octets: e.fichier.size }));
    },

    async demandes() {
      const s = await siren();
      return verifier(await sb.from('demandes').select('id, nom, telephone, courriel, message, page, recue_le, lue_le').eq('siren', s).order('recue_le', { ascending: false }).limit(200));
    },
    async statistiques(jours) {
      const s = await siren();
      const debut = decalerJour(jourParis(), -(jours - 1));
      // La table garde une ligne par jour, page et source : on additionne par jour.
      const lignes = verifier(await sb.from('statistiques').select('jour, visites, appels, demandes').eq('siren', s).gte('jour', debut)) as JourStat[];
      return sommeParJour(lignes, debut, jours);
    },
    async avis() {
      const s = await siren();
      return verifier(await sb.from('avis').select('id, auteur, note, texte, ecrit_le, reponse, brouillon, valide_le').eq('siren', s).order('ecrit_le', { ascending: false }).limit(200));
    },

    async site() {
      const s = await siren();
      return verifier(await sb.from('sites').select('id, statut, adresse_en_ligne, publie_le').eq('siren', s).order('cree_le', { ascending: true }).limit(1).maybeSingle());
    },
    async adresses() {
      const site = await this.site();
      if (!site) return [];
      return verifier(await sb.from('adresses').select('hote, genre, principale, etat, motif').eq('site_id', site.id).order('principale', { ascending: false }));
    },
    async abonnement() {
      const s = await siren();
      return verifier(await sb.from('abonnements').select('formule, etat, fin_periode, resiliation_prevue').eq('siren', s).maybeSingle());
    },
    async suppression() {
      return verifier(await sb.from('suppressions').select('demandee_le, effective_le, annulee_le').maybeSingle());
    },
    async demanderSuppression() {
      const { data } = await sb.auth.getUser();
      if (!data.user) throw new Error('Session expirée : reconnectez-vous.');
      // L'app ne peut qu'insérer (user_id seul) : les dates sont posées par la base.
      // Une demande annulée ne se relance pas d'ici (pas de droit de mise à jour sur les dates).
      const r = await sb.from('suppressions').insert({ user_id: data.user.id });
      if (r.error?.code === '23505') throw new Error('Une demande a déjà été faite puis annulée. Écrivez-nous pour supprimer votre compte.');
      verifier(r);
    },
    async annulerSuppression() {
      const { data } = await sb.auth.getUser();
      verifier(await sb.from('suppressions').update({ annulee_le: new Date().toISOString() }).eq('user_id', data.user?.id || ''));
    },

    // ---------------------------------------------------------- prospection
    // La base refuse tout à un compte qui n'est pas prospecteur (sécurité par
    // ligne, migration 20261127…_prospection) : ces appels ne font que demander.
    async estProspecteur() {
      const { data } = await sb.auth.getUser();
      if (!data.user) return false;
      const r = await sb.from('prospecteurs').select('user_id').eq('user_id', data.user.id).limit(1);
      return !r.error && (r.data || []).length > 0;
    },
    async prospects() {
      return verifier<Prospect[]>(await sb.from('fiches_prospection').select('*').order('maj_le', { ascending: false }).limit(2000))
        .map((p) => ({ ...p, note_google: p.note_google == null ? null : Number(p.note_google) }));
    },
    async appelsProspect(id) {
      return verifier(await sb.from('appels_prospection').select('id,prospect_id,statut,note,fait_le').eq('prospect_id', id).order('fait_le', { ascending: false }));
    },
    async appelsRecents(jours) {
      const depuis = new Date(Date.now() - jours * 864e5).toISOString();
      return verifier(await sb.from('appels_prospection').select('id,prospect_id,statut,note,fait_le').gte('fait_le', depuis).order('fait_le', { ascending: false }).limit(5000));
    },
    async enregistrerResultat(id, r) {
      const p = verifier<Prospect>(await sb.from('fiches_prospection').select('*').eq('id', id).single());
      const suite: Partial<Prospect> = appliquerResultat(p, r, jourParis());
      if (r.note?.trim()) suite.notes = [p.notes, r.note.trim()].filter(Boolean).join('\n');
      verifier(await sb.from('fiches_prospection').update(suite).eq('id', id));
      verifier(await sb.from('appels_prospection').insert({ prospect_id: id, statut: r.statut, note: r.note?.trim() || null }));
    },
    async enregistrerNotes(id, notes) { verifier(await sb.from('fiches_prospection').update({ notes: notes.trim() || null }).eq('id', id)); },
    async ajouterProspect(np) {
      if (!np.nom.trim()) throw new Error('Le nom de l’entreprise est obligatoire.');
      if (np.telephone && np.telephone.replace(/\D/g, '').length < 10) throw new Error('Numéro incomplet : dix chiffres.');
      return verifier<Prospect>(await sb.from('fiches_prospection').insert({
        nom: np.nom.trim(), metier: np.metier.trim() || 'Autre', commune: np.commune?.trim() || null,
        telephone: np.telephone?.trim() || null, a_appeler_le: np.a_appeler_le, notes: np.notes?.trim() || null, source: 'manuel',
      }).select('*').single());
    },
    // ---------------------------------------------------------- chiffres
    async ventes() { return verifier<Vente[]>(await sb.from('ventes').select('*').order('cree_le', { ascending: false }).limit(5000)); },
    async encaissements() {
      return verifier<Encaissement[]>(await sb.from('encaissements').select('*').order('encaisse_le', { ascending: false }).limit(20000))
        .map((e) => ({ ...e, montant: Number(e.montant) }));
    },
    async creerVente(nv) {
      if (!nv.nom.trim()) throw new Error('Le nom du client est obligatoire.');
      const v = verifier<Vente>(await sb.from('ventes').insert({ fiche_id: nv.fiche_id, nom: nv.nom.trim(), formule: nv.formule }).select('*').single());
      if (nv.encaisse_aujourdhui) verifier(await sb.from('encaissements').insert({ vente_id: v.id, nom: v.nom, formule: v.formule, montant: PRIX[v.formule] }));
      return v;
    },
    async ajouterEncaissement(e) {
      if (!e.nom.trim()) throw new Error('Le nom du client est obligatoire.');
      if (!(e.montant > 0)) throw new Error('Le montant doit être positif.');
      verifier(await sb.from('encaissements').insert({ vente_id: e.vente_id, nom: e.nom.trim(), formule: e.formule, montant: e.montant, encaisse_le: e.encaisse_le, note: e.note?.trim() || null }));
    },
    async retirerEncaissement(id) { verifier(await sb.from('encaissements').delete().eq('id', id)); },
  };
}

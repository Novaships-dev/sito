// Les données réelles : Supabase (projet sito, Paris). Les droits sont dans la
// base (sécurité par ligne) : l'app ne voit et n'écrit que ce que la base lui
// permet, quoi qu'elle demande. Essais : supabase/essais/droits*.sql.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as tus from 'tus-js-client';
import type { Donnees, Profil, Tarif, Photo, EnvoiPhoto, EnvoiOriginal, JourStat, Adresse, Branchement, RechercheDomaine } from '../types';
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

  // La fonction Edge `domaines` (T20). Une réponse en erreur porte sa phrase
  // dans `erreur` : on la montre telle quelle, elle est écrite pour l'artisan.
  async function domaines(corps: Record<string, unknown>): Promise<unknown> {
    const s = await siren();
    const { data, error } = await sb.functions.invoke('domaines', { body: { siren: s, ...corps } });
    if (error) {
      let dit: string | null = null;
      try { dit = (await (error as { context?: Response }).context?.json())?.erreur ?? null; } catch { /* corps illisible */ }
      throw new Error(dit || 'Le service des domaines ne répond pas. Réessayez dans un moment.');
    }
    if (!data?.ok) throw new Error(data?.erreur || 'Le service des domaines ne répond pas. Réessayez dans un moment.');
    return data;
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
    async marquerLue(id) { verifier(await sb.from('demandes').update({ lue_le: new Date().toISOString() }).eq('id', id)); },
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
    async validerReponse(id, texte) {
      const { data } = await sb.auth.getUser();
      verifier(await sb.from('avis').update({ brouillon: texte, valide_par: data.user?.id, valide_le: new Date().toISOString() }).eq('id', id));
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
    async chercherDomaine(nom) { return (await domaines({ action: 'chercher', nom })) as RechercheDomaine; },
    async acheterDomaine(nom, representant) { return ((await domaines({ action: 'acheter', nom, representant })) as { adresse: Adresse }).adresse; },
    async brancherDomaine(nom) { return (await domaines({ action: 'brancher', nom })) as Branchement; },
    async verifierDomaine(hote) { return ((await domaines({ action: 'verifier', nom: hote })) as { adresse: Adresse }).adresse; },
    async abonnement() {
      const s = await siren();
      return verifier(await sb.from('abonnements').select('formule, etat, fin_periode, resiliation_prevue').eq('siren', s).maybeSingle());
    },
    async ouvrirPaiement(action, formule) {
      const s = await siren();
      // Retour sur l'écran Abonnement, qui lit « paiement=ok » ou « annule ».
      const retour = `${location.origin}${location.pathname}#/abonnement`;
      const { data, error } = await sb.functions.invoke('stripe-session', { body: { siren: s, action, formule, retour } });
      if (error || !data?.url) throw new Error(data?.erreur || 'Le paiement ne répond pas. Réessayez dans un moment.');
      return data.url as string;
    },
    async lienGoogle() {
      const s = await siren();
      const retour = `${location.origin}${location.pathname}#/google`;
      const { data, error } = await sb.functions.invoke('google-lien', { body: { siren: s, retour } });
      if (error || !data?.url) {
        let dit: string | null = null;
        try { dit = (await (error as { context?: Response } | null)?.context?.json())?.erreur ?? null; } catch { /* corps illisible */ }
        throw new Error(dit || data?.erreur || 'Google ne répond pas. Réessayez dans un moment.');
      }
      return data.url as string;
    },
    async connexionGoogle() {
      const s = await siren();
      return verifier(await sb.from('connexions_google').select('etat, fiche, derniere_synchro, motif').eq('siren', s).maybeSingle());
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
  };
}

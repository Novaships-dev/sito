// Les comptes supprimés arrivent à échéance (T12, exigence A18).
//
// L'artisan demande la suppression dans l'app : une ligne `suppressions`, avec
// 30 jours pour changer d'avis (`effective_le`). Passé ce délai, et si la
// demande n'a pas été annulée (`annulee_le` vide), ce module efface tout :
//
//   1. l'abonnement Stripe en cours est résilié (sans Stripe branché, le compte
//      n'est PAS effacé : on n'efface jamais quelqu'un qu'on facture encore) ;
//   2. ses sites d'abonné sont retirés de Cloudflare Pages ;
//   3. ses photos et vidéos sont effacées du stockage ;
//   4. l'entreprise et tout ce qui s'y rattache sont effacés de la base
//      (profil, tarifs, sites, chantiers, photos, avis, demandes,
//      statistiques, abonnement, connexion Google : ON DELETE CASCADE) ;
//   5. le compte lui-même est effacé (Auth), et avec lui sa demande.
//
// Si l'entreprise a un autre membre, seul le compte part : les données de
// l'entreprise restent à ceux qui y travaillent encore.
//
// Chaque étape se rejoue sans dommage : une panne au milieu laisse la demande
// en place, et le tour suivant reprend là où il s'est arrêté (un projet ou un
// fichier déjà effacé n'est pas une faute). Le compte s'efface en dernier.
//
//   node atelier/supprimer-comptes.mjs            (lit le .env)
//   node atelier/supprimer-comptes.mjs --lecture  (dit ce qui serait effacé)
import { fileURLToPath } from 'node:url';
import { projetDe } from './publier-pages.mjs';

export const ESPACES = ['photos-chantiers'];
const ABONNEMENT_EN_COURS = new Set(['essai', 'actif', 'impaye']);

// Les demandes échues et non annulées.
export async function echues(sb, maintenant = new Date()) {
  return sb.lire('suppressions', {
    select: 'user_id,demandee_le,effective_le,annulee_le',
    filtres: { effective_le: ['lte', maintenant.toISOString()], annulee_le: ['is', 'null'] },
    ordre: 'effective_le.asc',
  });
}

// Rend un compte rendu par compte : { user_id, efface, motif?, sirens, etapes }.
// `stripe` : { resilier(idAbonnement) } ou null tant que Stripe n'est pas
// branché (T16). `cloudflare` : le client de scripts/prospection/cloudflare-pages.mjs.
export async function supprimerEchus({ sb, cloudflare, stripe = null, maintenant = new Date(), lecture = false }) {
  const rapports = [];
  for (const d of await echues(sb, maintenant)) {
    const r = { user_id: d.user_id, efface: false, sirens: [], etapes: [] };
    rapports.push(r);
    try {
      const membres = await sb.lire('membres', { select: 'siren,user_id', filtres: { user_id: ['eq', d.user_id] } });
      const aEffacer = [];
      for (const { siren } of membres) {
        const autres = (await sb.lire('membres', { select: 'user_id', filtres: { siren: ['eq', siren] } }))
          .filter((m) => m.user_id !== d.user_id);
        if (autres.length) r.etapes.push(`${siren} : gardée (${autres.length} autre(s) membre(s))`);
        else aEffacer.push(siren);
      }
      r.sirens = aEffacer;

      // 1. Personne qu'on facture encore n'est effacé sans résiliation.
      const abonnes = [];
      for (const siren of aEffacer) {
        const a = await sb.lireUne('abonnements', { select: 'siren,etat,stripe_abonnement', filtres: { siren: ['eq', siren] } });
        if (a && ABONNEMENT_EN_COURS.has(a.etat) && a.stripe_abonnement) abonnes.push(a);
      }
      if (abonnes.length && !stripe) {
        r.motif = `abonnement Stripe en cours (${abonnes.map((a) => a.siren).join(', ')}) et Stripe pas encore branché (T16) : rien n'est effacé`;
        continue;
      }
      if (lecture) { r.motif = 'lecture seule'; continue; }
      for (const a of abonnes) { await stripe.resilier(a.stripe_abonnement); r.etapes.push(`${a.siren} : abonnement résilié`); }

      for (const siren of aEffacer) {
        // 2. Les sites retirés de Cloudflare Pages.
        for (const site of await sb.lire('sites', { select: 'siren,metier,statut', filtres: { siren: ['eq', siren] } })) {
          const projet = projetDe(site);
          const retire = await cloudflare.supprimerProjet(projet);
          r.etapes.push(`${siren} : site ${projet} ${retire ? 'retiré' : 'déjà absent'}`);
        }
        // 3. Les fichiers du stockage, rangés sous `<siren>/`.
        for (const espace of ESPACES) {
          const st = sb.stockage(espace);
          const chemins = await st.lister(siren);
          for (let i = 0; i < chemins.length; i += 100) await st.supprimer(chemins.slice(i, i + 100));
          r.etapes.push(`${siren} : ${chemins.length} fichier(s) effacé(s) de ${espace}`);
        }
        // 4. L'entreprise et tout ce qui s'y rattache.
        const parties = await sb.effacer('entreprises', { siren: ['eq', siren] });
        r.etapes.push(`${siren} : ${parties.length ? 'données effacées' : 'déjà effacée'}`);
      }

      // 5. Le compte, en dernier : tant qu'il reste, la demande reste aussi.
      const existait = await sb.auth.supprimer(d.user_id);
      r.etapes.push(existait ? 'compte effacé' : 'compte déjà absent');
      if (!existait) await sb.effacer('suppressions', { user_id: ['eq', d.user_id] });
      r.efface = true;
    } catch (e) {
      r.motif = `panne, reprise au prochain tour : ${e.message}`;
    }
  }
  return rapports;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { depuisEnv } = await import('./supabase.mjs');
  const { exiger } = await import('../scripts/env.mjs');
  const { clientCloudflare } = await import('../scripts/prospection/cloudflare-pages.mjs');
  const v = exiger(['CLOUDFLARE_COMPTE_ID', 'CLOUDFLARE_JETON_API'], 'retirer les sites des comptes supprimés');
  const rapports = await supprimerEchus({
    sb: depuisEnv(),
    cloudflare: clientCloudflare({ compte: v.CLOUDFLARE_COMPTE_ID, jeton: v.CLOUDFLARE_JETON_API }),
    lecture: process.argv.includes('--lecture'),
  });
  for (const r of rapports) console.log(`${r.user_id} : ${r.efface ? 'effacé' : 'pas effacé'}${r.motif ? ` (${r.motif})` : ''}\n  ${r.etapes.join('\n  ')}`);
  console.log(`${rapports.length} demande(s) échue(s), ${rapports.filter((r) => r.efface).length} effacée(s).`);
  process.exitCode = rapports.some((r) => r.motif && r.motif.startsWith('panne')) ? 1 : 0;
}

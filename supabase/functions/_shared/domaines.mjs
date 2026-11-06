// Le domaine propre d'un artisan, côté service (T20, T63) : chercher, acheter,
// brancher, vérifier. Appelé par la commande de Fabrice `atelier/domaine.mjs`
// (plus d'écran ni de fonction Edge depuis le 6 nov. 2026), et
// essayé dans Node par `scripts/essai-domaines.mjs` (dépôt, Gandi et
// Cloudflare remplacés par des faux). Les deux cas du plan (APPFLOW §3.6) :
//
//   B. « Je veux mon propre nom de domaine » : chercher, puis acheter au nom
//      de l'artisan chez Gandi. Compris dans l'abonnement, donc réservé à un
//      abonnement en cours (`actif`), et aux extensions .fr et .com (Q9,
//      recommandation appliquée : réversible, sans coût) ;
//   C. « J'ai déjà un nom de domaine » : brancher, c'est-à-dire créer le
//      hostname chez Cloudflare et dire à l'artisan quel CNAME poser ; puis
//      vérifier.
//
// L'adresse servie est toujours `www.<domaine>` : Cloudflare for SaaS ne sert
// pas un domaine nu hors offre Entreprise (TRD §7). Le domaine nu est
// redirigé vers www par Gandi (cas B) ; dans le cas C, c'est à l'artisan, et
// l'écran le dit.
//
// Ordre de l'achat, pour ne jamais perdre un domaine payé : la ligne
// `adresses` est écrite avant l'achat (« achat en cours ») ; si Gandi refuse,
// elle passe `echec` avec le motif ; si l'achat passe et qu'une étape suivante
// casse (DNS, redirection, Cloudflare), elle reste `en_attente` avec ce qui
// reste à faire, et le domaine est déjà au nom de l'artisan.
import { nomValide } from './gandi.mjs';

export const EXTENSIONS_INCLUSES = ['fr', 'com'];

// Ce que l'artisan tape → un nom de domaine, ou une phrase qui dit pourquoi
// pas. « https://www.Facades-Martin.fr/ » → « facades-martin.fr ».
export function lireNom(brut) {
  const n = String(brut || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '').replace(/\.$/, '');
  if (!n) return { faute: 'Tapez le nom voulu, par exemple facades-martin.fr.' };
  if (/[^a-z0-9.-]/.test(n)) return { faute: 'Lettres sans accent, chiffres et tirets seulement, par exemple facades-martin.fr.' };
  if (!n.includes('.')) return { faute: 'Ajoutez l’extension, par exemple .fr : facades-martin.fr.' };
  if (!nomValide(n)) return { faute: 'Ce nom n’est pas valable. Exemple : facades-martin.fr.' };
  return { nom: n };
}

const extension = (n) => n.slice(n.lastIndexOf('.') + 1);
const vivante = (a) => a && a.etat !== 'retiree';
const pourApp = (l) => ({ hote: l.hote, genre: l.genre, principale: Boolean(l.principale), etat: l.etat, motif: l.motif ?? null });
const motifCourt = (e) => String(e?.message || e).slice(0, 200);

// ctx : { userId, site: { id } | null, abonnement: { etat } | null,
//         entreprise: { denomination, forme_juridique, siren, adresse, code_postal, commune },
//         profil: { telephone, courriel } | null, courriel }
// depot : { adresses(siteId), hoteAilleurs(hote, siteId), ajouter(ligne), maj(siteId, hote, colonnes) }
// reglages : { cible } — l'hôte vers lequel pointe le CNAME `www`.
export async function traiter({ action, nom: brut, representant, ctx, depot, gandi, saas, reglages }) {
  const erreur = (message, statut = 400) => ({ ok: false, statut, erreur: message });
  if (!['chercher', 'acheter', 'brancher', 'verifier'].includes(action)) return erreur('Action inconnue.');
  const lu = lireNom(brut);
  if (lu.faute) return erreur(lu.faute);
  const nom = lu.nom, hote = `www.${nom}`;

  if (action === 'chercher') {
    if (!EXTENSIONS_INCLUSES.includes(extension(nom)))
      return { ok: true, hote: nom, disponible: false, motif: `Le domaine compris dans l’abonnement finit en ${EXTENSIONS_INCLUSES.map((x) => '.' + x).join(' ou ')}.` };
    const v = await gandi.verifier(nom);
    return { ok: true, hote: nom, disponible: v.disponible, motif: v.disponible ? null : 'Ce nom est déjà pris. Essayez une variante.' };
  }

  if (!ctx.site) return erreur('Votre site n’est pas encore créé : l’adresse viendra avec lui.', 409);
  const existantes = (await depot.adresses(ctx.site.id)) || [];
  const meme = existantes.find((a) => a.hote === hote && vivante(a));

  if (action === 'verifier') {
    if (!meme || meme.genre === 'offerte') return erreur('Cette adresse n’est pas branchée sur votre site.', 404);
    const maj = await saas.suivre(meme);
    if (maj) await depot.maj(ctx.site.id, hote, maj);
    return { ok: true, adresse: pourApp({ ...meme, ...(maj || {}) }) };
  }

  // `adresses.hote` est unique dans toute la base : un domaine déjà branché
  // sur un autre site se dit tout de suite, pas en erreur de la base.
  if ((action === 'brancher' || action === 'acheter') && !meme && await depot.hoteAilleurs(hote, ctx.site.id))
    return erreur('Ce domaine est déjà utilisé par un autre site MonSiteArtisan.', 409);

  if (action === 'brancher') {
    if (meme) return erreur('Ce domaine est déjà branché sur votre site.', 409);
    const ch = await saas.trouver(hote) || await saas.creer(hote);
    const ligne = { site_id: ctx.site.id, hote, genre: 'existante', principale: false, etat: 'en_attente', cloudflare_id: ch.id, motif: null };
    await depot.ajouter(ligne);
    return { ok: true, adresse: pourApp(ligne), cname: { nom: 'www', valeur: reglages.cible }, preuve: ch.preuve || null };
  }

  // acheter
  if (ctx.abonnement?.etat !== 'actif') return erreur('Le domaine est compris dans l’abonnement : il se réserve une fois l’abonnement en cours.', 402);
  if (!EXTENSIONS_INCLUSES.includes(extension(nom))) return erreur('Le domaine compris dans l’abonnement finit en .fr ou .com.');
  if (existantes.some((a) => a.genre === 'achetee' && vivante(a))) return erreur('Un domaine est déjà réservé pour votre site.', 409);
  if (meme) return erreur('Ce domaine est déjà branché sur votre site.', 409);
  const prenom = String(representant?.prenom || '').trim(), famille = String(representant?.nom || '').trim();
  if (!prenom || !famille) return erreur('Indiquez le prénom et le nom de la personne qui représente l’entreprise.');
  const e = ctx.entreprise || {};
  const titulaire = {
    raisonSociale: e.forme_juridique === '1000' ? null : e.denomination,
    siren: e.siren, prenom, nom: famille,
    courriel: ctx.profil?.courriel || ctx.courriel, telephone: ctx.profil?.telephone,
    adresse: e.adresse, codePostal: e.code_postal, commune: e.commune, pays: 'FR',
  };
  const v = await gandi.verifier(nom);
  if (!v.disponible) return erreur('Ce nom vient d’être pris. Essayez une variante.', 409);

  const ligne = { site_id: ctx.site.id, hote, genre: 'achetee', principale: false, etat: 'en_attente',
    registrar: 'gandi', motif: 'Achat en cours.' };
  await depot.ajouter(ligne);
  try {
    await gandi.acheter({ fqdn: nom, titulaire, confirmation: ctx.userId });
  } catch (err) {
    await depot.maj(ctx.site.id, hote, { etat: 'echec', motif: `Achat refusé par le registre : ${motifCourt(err)}`.slice(0, 280) });
    return erreur('La réservation n’a pas abouti. Rien n’a été payé ; nous regardons pourquoi.', 502);
  }
  const reste = [];
  const cols = { motif: null };
  try { await gandi.pointerWww(nom, reglages.cible); } catch (err) { reste.push(`DNS www (${motifCourt(err)})`); }
  try { await gandi.redirigerVersWww(nom); } catch (err) { reste.push(`redirection (${motifCourt(err)})`); }
  try { cols.cloudflare_id = (await saas.creer(hote)).id; } catch (err) { reste.push(`certificat (${motifCourt(err)})`); }
  try { cols.echeance = await gandi.echeance(nom); } catch { /* relue au prochain tour */ }
  if (reste.length) cols.motif = `Domaine réservé à votre nom ; reste à faire : ${reste.join(', ')}.`.slice(0, 280);
  await depot.maj(ctx.site.id, hote, cols);
  return { ok: true, adresse: pourApp({ ...ligne, ...cols }) };
}

// Les avis Google d'un artisan, côté service (T24, T64) : relier sa fiche
// (retour du consentement), puis, à chaque passage, récupérer les avis, que
// le site affiche. Décision du 5 nov. 2026 : avis affichés sur le site de
// l'artisan seulement, plus d'écran dans l'app ; plus aucune réponse n'est
// publiée chez Google (T64).
//
// Ce qui est gardé chiffré (`chiffre.mjs`, le SIREN en donnée associée) : le
// jeton de rafraîchissement, avec le compte et la fiche choisis. Le jeton
// d'accès ne vit que le temps d'un passage, en mémoire.
//
// depot : { lireJeton(siren) → { jeton, portee } | null, poserJeton(siren, chiffre, portee),
//           oublierJeton(siren), connexion(siren, colonnes), poserAvis(lignes) }
import { chiffrer, dechiffrer } from './chiffre.mjs';
import { versAvis } from './google.mjs';

// Le retour de Google : le code devient un jeton, rangé chiffré.
export async function relier({ siren, code, redirection, depot, google, cle }) {
  const t = await google.echangerCode(code, redirection);
  if (!t.rafraichissement) {
    await depot.connexion(siren, { etat: 'erreur', motif: 'Google n’a pas donné d’accès durable. Recommencez la liaison.' });
    return { ok: false, motif: 'pas de jeton de rafraîchissement' };
  }
  const comptes = await google.comptes(t.acces);
  const fiches = await google.fiches(t.acces);
  if (!comptes.length || !fiches.length) {
    await depot.connexion(siren, { etat: 'erreur', motif: 'Ce compte Google ne gère aucune fiche d’établissement.' });
    return { ok: false, motif: 'aucune fiche' };
  }
  // Une fiche par artisan, en pratique. S'il en a plusieurs, la première ; le
  // motif le dit pour qu'il puisse nous écrire.
  const fiche = fiches[0];
  const secret = JSON.stringify({ rafraichissement: t.rafraichissement, compte: comptes[0].name, fiche: fiche.name });
  await depot.poserJeton(siren, await chiffrer(secret, cle, siren), t.portee || 'business.manage');
  await depot.connexion(siren, { etat: 'connectee', compte: comptes[0].accountName || comptes[0].name, fiche: fiche.title || fiche.name,
    motif: fiches.length > 1 ? `${fiches.length} fiches sur ce compte : la première est reliée. Écrivez-nous si ce n’est pas la bonne.` : null });
  return { ok: true };
}

// Un passage : avis récupérés, rien n'est écrit chez Google.
export async function synchroniser({ siren, depot, google, cle, maintenant = () => new Date().toISOString() }) {
  const j = await depot.lireJeton(siren);
  if (!j) return { siren, etat: 'a_connecter', avis: 0 };
  const secret = JSON.parse(await dechiffrer(j.jeton, cle, siren));
  let acces;
  try {
    acces = (await google.rafraichir(secret.rafraichissement)).acces;
  } catch (e) {
    if (e.revoque) {
      // L'artisan a retiré l'accès chez Google : on oublie le jeton, et on le dit.
      await depot.oublierJeton(siren);
      await depot.connexion(siren, { etat: 'revoquee', motif: 'L’accès a été retiré chez Google. Demandez un nouveau lien à MonSiteArtisan pour relier la fiche.' });
      return { siren, etat: 'revoquee', avis: 0 };
    }
    throw e;
  }
  const quand = maintenant();
  const lignes = (await google.avis(acces, secret.compte, secret.fiche)).map((r) => versAvis(r, siren, quand)).filter((l) => l.ref_externe);
  if (lignes.length) await depot.poserAvis(lignes);

  await depot.connexion(siren, { etat: 'connectee', derniere_synchro: quand, motif: null });
  return { siren, etat: 'connectee', avis: lignes.length };
}

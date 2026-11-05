// Les avis Google d'un artisan, côté service (T24) : relier sa fiche (retour
// du consentement), puis, à chaque passage, récupérer les avis et publier les
// réponses qu'il a validées. Décision du 5 octobre : « réponses aux avis
// préparées et validées par l'artisan » — jamais publiées sans `valide_le`.
//
// Ce qui est gardé chiffré (`chiffre.mjs`, le SIREN en donnée associée) : le
// jeton de rafraîchissement, avec le compte et la fiche choisis. Le jeton
// d'accès ne vit que le temps d'un passage, en mémoire.
//
// depot : { lireJeton(siren) → { jeton, portee } | null, poserJeton(siren, chiffre, portee),
//           oublierJeton(siren), connexion(siren, colonnes), poserAvis(lignes),
//           avisAPublier(siren) → [{ id, ref_externe, brouillon }], marquerPubliee(id, texte, quand) }
import { chiffrer, dechiffrer } from './chiffre.mjs';
import { versAvis } from './google.mjs';

const court = (e) => String(e?.message || e).slice(0, 200);

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

// Un passage : avis récupérés, réponses validées publiées.
export async function synchroniser({ siren, depot, google, cle, maintenant = () => new Date().toISOString() }) {
  const j = await depot.lireJeton(siren);
  if (!j) return { siren, etat: 'a_connecter', avis: 0, publiees: 0 };
  const secret = JSON.parse(await dechiffrer(j.jeton, cle, siren));
  let acces;
  try {
    acces = (await google.rafraichir(secret.rafraichissement)).acces;
  } catch (e) {
    if (e.revoque) {
      // L'artisan a retiré l'accès chez Google : on oublie le jeton, et on le dit.
      await depot.oublierJeton(siren);
      await depot.connexion(siren, { etat: 'revoquee', motif: 'L’accès a été retiré chez Google. Reliez à nouveau votre fiche pour retrouver vos avis.' });
      return { siren, etat: 'revoquee', avis: 0, publiees: 0 };
    }
    throw e;
  }
  const quand = maintenant();
  const lignes = (await google.avis(acces, secret.compte, secret.fiche)).map((r) => versAvis(r, siren, quand)).filter((l) => l.ref_externe);
  if (lignes.length) await depot.poserAvis(lignes);

  let publiees = 0;
  const fautes = [];
  for (const a of await depot.avisAPublier(siren)) {
    try {
      await google.repondre(acces, `${secret.compte}/${secret.fiche}/reviews/${a.ref_externe}`, a.brouillon);
      await depot.marquerPubliee(a.id, a.brouillon, maintenant());
      publiees++;
    } catch (e) { fautes.push(`${a.ref_externe} : ${court(e)}`); }
  }
  await depot.connexion(siren, { etat: 'connectee', derniere_synchro: quand,
    motif: fautes.length ? `${fautes.length} réponse(s) pas encore publiée(s) ; nouvel essai au prochain passage.` : null });
  return { siren, etat: 'connectee', avis: lignes.length, publiees, fautes };
}

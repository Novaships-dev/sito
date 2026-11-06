#!/usr/bin/env node
// Le lien qui relie la fiche Google d'un artisan à son site (T64, décision du
// 5 nov. 2026 : avis Google affichés sur le site seulement, plus d'écran dans
// l'app). Fabrice l'envoie à l'artisan par SMS ou WhatsApp ; l'artisan
// l'ouvre, accepte chez Google avec le compte qui gère sa fiche, et c'est fait :
// la fonction Edge `google-retour` range l'accès chiffré, et les avis arrivent
// sur le site à la lecture de la nuit (`atelier/avis.mjs`).
//
//   node atelier/lien-google.mjs --siren 480423623
//
// Il faut, dans .env : GOOGLE_CLIENT_ID, GOOGLE_CLE_CHIFFREMENT (la même que
// celle de la fonction `google-retour`), SITO_RETOUR_GOOGLE (l'adresse de
// `google-retour`, déclarée chez Google). Action F13.
import { pathToFileURL } from 'node:url';
import { lienConsentement } from '../supabase/functions/_shared/google.mjs';
import { signer } from '../supabase/functions/_shared/chiffre.mjs';

// Un SMS peut être lu le lendemain : trois jours, pas quinze minutes.
export const VALIDITE_S = 3 * 24 * 3600;

export async function lienGoogle({ siren, clientId, cle, redirection, maintenant = Date.now() }) {
  const s = String(siren || '').replace(/\s+/g, '');
  if (!/^\d{9}$/.test(s)) throw new Error('Le SIREN fait neuf chiffres.');
  if (!clientId || !cle || !redirection) throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLE_CHIFFREMENT et SITO_RETOUR_GOOGLE sont nécessaires (action F13).');
  const etat = await signer({ siren: s }, cle, { maintenant, secondes: VALIDITE_S });
  return lienConsentement({ clientId, redirection, etat });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { exiger } = await import('../scripts/env.mjs');
  const i = process.argv.indexOf('--siren');
  try {
    const e = exiger(['GOOGLE_CLIENT_ID', 'GOOGLE_CLE_CHIFFREMENT', 'SITO_RETOUR_GOOGLE'], 'fabriquer le lien de liaison Google');
    const url = await lienGoogle({ siren: i > -1 ? process.argv[i + 1] : '', clientId: e.GOOGLE_CLIENT_ID, cle: e.GOOGLE_CLE_CHIFFREMENT, redirection: e.SITO_RETOUR_GOOGLE });
    console.log(`\nLien à envoyer à l'artisan (valable trois jours ; il l'ouvre avec le compte Google qui gère sa fiche) :\n\n  ${url}\n`);
  } catch (err) {
    console.error(`Échec : ${err.message}`);
    process.exitCode = 1;
  }
}

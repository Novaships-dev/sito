#!/usr/bin/env node
// Le lien de paiement à envoyer à un artisan (T62, décision de Fabrice du
// 5 nov. 2026 : « trouver un moyen simple pour encaisser des one shot ou du
// mensuel »). Pas de page de paiement dans l'app : Fabrice envoie un lien
// Stripe par SMS ou WhatsApp, l'artisan paie par carte, c'est tout.
//
// Les trois liens sont faits une fois dans le tableau de bord de Stripe
// (action F7, `memoire/actions-fabrice.md`) et leurs adresses vont dans .env :
//   STRIPE_LIEN_MENSUEL  80 € par mois, 30 jours offerts, engagement 12 mois
//   STRIPE_LIEN_VITRINE  80 € par mois, 90 jours offerts (artisans vitrines)
//   STRIPE_LIEN_ANNUEL   720 € par an, renouvelé chaque année
// Ces adresses ne sont pas des secrets : ce sont des pages de paiement.
//
// Ce script y ajoute le SIREN de l'artisan (`client_reference_id`), que Stripe
// rend au paiement : le webhook rattache ainsi l'abonnement à la bonne
// entreprise (`supabase/functions/_shared/stripe.ts`).
//
//   node atelier/lien-paiement.mjs --siren 480423623 --formule mensuel [--courriel a@b.fr]
import { pathToFileURL } from 'node:url';
import { OFFRE, euros } from '../app/src/vitrine/offre.ts';

export const FORMULES = {
  mensuel: { env: 'STRIPE_LIEN_MENSUEL', dit: () => `${euros(OFFRE.prixMois)} par mois, ${OFFRE.moisOfferts} mois offert, engagement ${OFFRE.engagementMois} mois` },
  vitrine: { env: 'STRIPE_LIEN_VITRINE', dit: () => `${euros(OFFRE.prixMois)} par mois, ${OFFRE.moisOffertsVitrine} mois offerts (artisan vitrine), engagement ${OFFRE.engagementMois} mois` },
  annuel: { env: 'STRIPE_LIEN_ANNUEL', dit: () => `${euros(OFFRE.prixAn)} par an, renouvelé chaque année` },
};

// Une page de paiement Stripe : https://buy.stripe.com/… (test : buy.stripe.com/test_…).
const LIEN_STRIPE = /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9_]+$/;
const COURRIEL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function lien({ siren, formule, courriel, env = process.env }) {
  const f = FORMULES[formule];
  if (!f) throw new Error(`Formule inconnue : ${formule}. Choix : ${Object.keys(FORMULES).join(', ')}.`);
  const s = String(siren || '').replace(/\s+/g, '');
  if (!/^\d{9}$/.test(s)) throw new Error('Le SIREN fait neuf chiffres.');
  const base = (env[f.env] || '').trim();
  if (!base) throw new Error(`${f.env} manque dans .env : le lien de paiement « ${formule} » n'est pas encore fait chez Stripe (action F7).`);
  if (!LIEN_STRIPE.test(base)) throw new Error(`${f.env} n'est pas un lien de paiement Stripe (https://buy.stripe.com/…).`);
  const u = new URL(base);
  u.searchParams.set('client_reference_id', s);
  if (courriel) {
    const c = String(courriel).trim().toLowerCase();
    if (!COURRIEL.test(c)) throw new Error('Adresse e-mail invalide.');
    u.searchParams.set('prefilled_email', c);
  }
  u.searchParams.set('locale', 'fr');
  return { url: u.toString(), dit: f.dit() };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { chargerEnv } = await import('../scripts/env.mjs');
  chargerEnv();
  const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };
  try {
    const r = lien({ siren: arg('siren'), formule: arg('formule') || 'mensuel', courriel: arg('courriel') });
    console.log(`\nLien à envoyer à l'artisan (${r.dit}) :\n\n  ${r.url}\n`);
  } catch (e) {
    console.error(`Échec : ${e.message}`);
    process.exitCode = 1;
  }
}

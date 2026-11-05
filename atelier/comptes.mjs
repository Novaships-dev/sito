#!/usr/bin/env node
// Les comptes des artisans, créés par Fabrice (décision du 5 nov. 2026 :
// « on lui fournit un identifiant et un mot de passe »). L'identifiant est
// l'adresse e-mail de l'artisan ; le mot de passe est tiré au sort ici,
// affiché une seule fois à celui qui lance la commande, et gardé nulle part
// ailleurs que chez Supabase (haché).
//
//   node atelier/comptes.mjs creer <courriel> <siren>
//   node atelier/comptes.mjs mot-de-passe <courriel>     (mot de passe oublié)
//   node atelier/comptes.mjs                             (pose les questions)
//
// Sur le PC : lanceurs\COMPTE_ARTISAN.bat. Jamais dans GitHub Actions : le
// dépôt est public, les journaux de la CI aussi ; un mot de passe n'y passe pas.
//
// Créer un compte, c'est, dans l'ordre :
//   1. l'entreprise : lue dans la base, sinon dans l'annuaire public des
//      entreprises (recherche-entreprises.api.gouv.fr, gratuit, sans clé) ;
//      une entreprise fermée est refusée ;
//   2. le profil de l'entreprise (vide, l'artisan le remplit dans l'app) ;
//   3. le compte (Supabase Auth, déjà confirmé, aucun e-mail envoyé) ;
//   4. le lien `membres` (titulaire). S'il échoue, le compte est effacé :
//      jamais un compte qui ne mène à aucune entreprise.
import { randomInt } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { nomAffiche } from '../scripts/prospection/noms.mjs';

export const ANNUAIRE = 'https://recherche-entreprises.api.gouv.fr/search';
const COURRIEL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SIREN = /^\d{9}$/;

// Sans les caractères qu'on confond en les recopiant (0/O, 1/l/I).
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

// 12 caractères tirés au sort (≈ 59 bits), en trois groupes de quatre :
// « k7mp-3xqa-9rtw ». Facile à dicter et à taper sur un téléphone.
export function motDePasse() {
  const groupe = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${groupe()}-${groupe()}-${groupe()}`;
}

export function courrielValide(c) {
  const v = String(c || '').trim().toLowerCase();
  return COURRIEL.test(v) && v.length <= 200 ? v : null;
}

// La fiche de l'annuaire -> une ligne de `entreprises`. Rien d'inventé : une
// valeur absente reste nulle.
export function ligneEntreprise(e) {
  const s = e.siege || {};
  const ape = /^\d{2}\.\d{2}[A-Z]$/.test(e.activite_principale || '') ? e.activite_principale : null;
  const cp = /^\d{5}$/.test(s.code_postal || '') ? s.code_postal : null;
  const dep = /^(\d{2}|2A|2B|9[78]\d)$/.test(s.departement || '') ? s.departement : null;
  return {
    siren: e.siren,
    denomination: e.nom_raison_sociale || e.nom_complet,
    nom_affiche: nomAffiche(e),
    siret_siege: /^\d{14}$/.test(s.siret || '') ? s.siret : null,
    adresse: s.adresse || null,
    commune: s.libelle_commune || null,
    code_postal: cp,
    departement: dep,
    code_ape: ape,
    forme_juridique: e.nature_juridique || null,
    date_creation: e.date_creation || null,
    tranche_effectif: e.tranche_effectif_salarie || null,
    rge: Boolean(e.complements?.est_rge),
    sirene: e,
    sirene_lu_le: new Date().toISOString(),
  };
}

export async function lireAnnuaire(siren, { fetch: f = fetch } = {}) {
  const r = await f(`${ANNUAIRE}?q=${siren}&page=1&per_page=5`);
  if (!r.ok) throw new Error(`annuaire des entreprises : HTTP ${r.status}`);
  const j = await r.json();
  return (j.results || []).find((e) => e.siren === siren) || null;
}

async function assurerEntreprise(sb, siren, f) {
  const deja = await sb.lireUne('entreprises', { filtres: { siren: ['eq', siren] } });
  if (deja) return deja;
  const fiche = await lireAnnuaire(siren, { fetch: f });
  if (!fiche) throw new Error(`SIREN ${siren} introuvable dans l’annuaire des entreprises. Vérifiez les neuf chiffres.`);
  if (fiche.etat_administratif !== 'A') throw new Error(`L’entreprise ${siren} est fermée dans l’annuaire des entreprises : pas de compte.`);
  const ligne = ligneEntreprise(fiche);
  await sb.insererSiAbsent('entreprises', [ligne]);
  return ligne;
}

export async function creerCompte(sb, { courriel, siren, fetch: f = fetch, tirer = motDePasse }) {
  const c = courrielValide(courriel);
  if (!c) throw new Error('Adresse e-mail invalide.');
  const s = String(siren || '').replace(/\s+/g, '');
  if (!SIREN.test(s)) throw new Error('Le SIREN fait neuf chiffres.');
  if (await sb.auth.chercher(c)) throw new Error(`L’adresse ${c} a déjà un compte. Pour en poser un autre : node atelier/comptes.mjs mot-de-passe ${c}`);

  const entreprise = await assurerEntreprise(sb, s, f);
  await sb.insererSiAbsent('profils', [{ siren: s }]);
  const mdp = tirer();
  const compte = await sb.auth.creer(c, mdp);
  try {
    await sb.inserer('membres', [{ user_id: compte.id, siren: s, role: 'titulaire' }]);
  } catch (e) {
    await sb.auth.supprimer(compte.id);
    throw e;
  }
  return { courriel: c, motDePasse: mdp, siren: s, entreprise: entreprise.nom_affiche };
}

export async function nouveauMotDePasse(sb, { courriel, tirer = motDePasse }) {
  const c = courrielValide(courriel);
  if (!c) throw new Error('Adresse e-mail invalide.');
  const compte = await sb.auth.chercher(c);
  if (!compte) throw new Error(`Aucun compte pour ${c}.`);
  const mdp = tirer();
  await sb.auth.changerMotDePasse(compte.id, mdp);
  return { courriel: c, motDePasse: mdp };
}

// Ce que voit Fabrice : quoi donner à l'artisan, et où il se connecte.
export function aDonner({ courriel, motDePasse: mdp, entreprise }, adresseApp) {
  return [
    '',
    entreprise ? `Compte prêt pour ${entreprise}.` : 'Nouveau mot de passe posé.',
    'À donner à l’artisan (par SMS ou de vive voix) :',
    `  Adresse de l’app : ${adresseApp || '(adresse de l’app Sitô)'}`,
    `  Identifiant      : ${courriel}`,
    `  Mot de passe     : ${mdp}`,
    '',
    'Ce mot de passe n’est gardé nulle part : notez-le maintenant.',
    'S’il est perdu : node atelier/comptes.mjs mot-de-passe ' + courriel,
  ].join('\n');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { depuisEnv } = await import('./supabase.mjs');
  const [action, ...args] = process.argv.slice(2);
  const demander = async (questions) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const r = [];
    for (const q of questions) r.push((await rl.question(q)).trim());
    rl.close();
    return r;
  };
  try {
    let quoi = action, a = args;
    if (!quoi) {
      const [choix] = await demander(['1. Créer le compte d’un artisan\n2. Nouveau mot de passe (oublié)\nVotre choix : ']);
      quoi = choix === '2' ? 'mot-de-passe' : 'creer';
      a = await demander(quoi === 'creer' ? ['Adresse e-mail de l’artisan : ', 'SIREN (9 chiffres) : '] : ['Adresse e-mail de l’artisan : ']);
    }
    const sb = depuisEnv();
    let r;
    if (quoi === 'creer') r = await creerCompte(sb, { courriel: a[0], siren: a[1] });
    else if (quoi === 'mot-de-passe') r = await nouveauMotDePasse(sb, { courriel: a[0] });
    else { console.error('usage : node atelier/comptes.mjs creer <courriel> <siren> | mot-de-passe <courriel>'); process.exitCode = 2; }
    if (r) console.log(aDonner(r, process.env.SITO_ADRESSE_APP));
  } catch (e) {
    console.error(`Échec : ${e.message}`);
    process.exitCode = 1;
  }
}

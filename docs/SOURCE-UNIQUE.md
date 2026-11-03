# Source unique : les chiffres et les valeurs de Sitô

Écrit par Claude (Cowork) le 3 novembre 2026. Ce n'est pas une décision de
Fabrice : chaque ligne cite la décision ou le fichier qui la porte. Si un autre
fichier du dépôt donne une autre valeur, **la source citée ici gagne**, et
l'autre fichier se corrige dans la même tâche.

Règle : une valeur qui change se corrige ici d'abord, puis partout où elle est
recopiée (liste « Recopiée dans »). Une valeur sans source n'entre pas.

## Produit et prix

| Valeur | Chiffre | Source | Recopiée dans |
|---|---|---|---|
| Abonnement mensuel | 39 € HT par mois, sans engagement | `memoire/decisions.md`, 9 oct. 2026 | `app/specs/01-PRD.md` §7, écran Abonnement, `docs/prospection-script.md` |
| Abonnement annuel | 390 € HT par an, sert d'engagement | `memoire/decisions.md`, 9 oct. 2026 | idem |
| Essai gratuit | 14 jours | `memoire/decisions.md`, 9 oct. 2026 | idem, `memoire/questions.md` Q2 |
| Séance photo, formule au mois | 90 € HT la visite | `memoire/decisions.md`, 24 oct. 2026 | `docs/prospection-script.md` |
| Séance photo, formule à l'année | offerte | `memoire/decisions.md`, 23 oct. 2026 | idem |
| Domaine propre | inclus dans l'abonnement, au nom de l'artisan | `memoire/decisions.md`, 5 oct. 2026 | `app/PLAN-APP.md` §4 |
| Adresse offerte par défaut | sous-domaine `nom.<domaine-sito>` | `memoire/decisions.md`, 5 oct. 2026 | idem |
| Nom du produit | « Sitô », provisoire ; domaine non choisi | `memoire/decisions.md`, sept. et 5 oct. 2026 | `docs/noms-2026-10-05.md` |
| Éditeur | la micro-entreprise de Fabrice | `memoire/decisions.md`, 5 oct. 2026 | |

## Sites et unicité

| Valeur | Chiffre | Source | Recopiée dans |
|---|---|---|---|
| Métiers à couvrir | 16, tous, à 100 % | `memoire/decisions.md`, 23 sept. 2026 ; `generateur/banque/plan-images.json` | `memoire/maintenant.md` |
| Métiers dont les textes existent | 3 : ravalement, couverture, peinture | `generateur/metiers/` | `memoire/maintenant.md` |
| Archétypes | 4 : `matiere`, `panneau`, `planche`, `elevation`, tous utilisés | `generateur/tirage.mjs` (`ARCHETYPES`) ; décision du 23 sept. | `generateur/LISEZMOI.md` |
| Cible d'unicité | 100 sites d'un même métier, tous différents, dans un même département ; commune et département | `memoire/decisions.md`, 2 oct. 2026 | `scripts/capacite-unicite.mjs` |
| Poids de la commune dans l'unicité | 5 fois celui du département | `memoire/maintenant.md` (« la commune comptant cinq fois plus ») | `generateur/unicite.mjs` |
| Images prévues par métier | 54 | `banque/liste-images.md` ; `memoire/maintenant.md` | `banque/README.md` |
| Images du ravalement générées | 32 (15 sept.) ; 22 à générer (action F15) | `banque/ravalement/provenance.md` ; `memoire/actions-fabrice.md` F15 | |
| Contraste minimal du texte | 4,6:1 sur les sept familles et les deux sols | `memoire/maintenant.md` | `generateur/charte.mjs` |
| Temps de fabrication d'un site | environ 1 min 30 | `generateur/LISEZMOI.md` | |

## Prospection

| Valeur | Chiffre | Source | Recopiée dans |
|---|---|---|---|
| Sites par jour | 30, sur au moins 3 métiers | `memoire/decisions.md`, 23 oct. 2026 | `app/specs/08-PROSPECTION.md` |
| Appels par jour | 60 (« faut même viser plus ») | `memoire/decisions.md`, 23 oct. 2026 | idem |
| Département | 13 (Bouches-du-Rhône) | `app/specs/08-PROSPECTION.md` ; `prospection/communes-13.json` | |
| Retrait d'un site de prospection | 30 jours ; le jour même si « ne plus appeler » | `app/specs/07-TACHES.md` T38 | `scripts/prospection/publier.mjs` |
| Ravalement | façadiers seulement | `memoire/decisions.md`, 29 oct. 2026 | `prospection/metiers.json` |

## Technique

| Valeur | Chiffre | Source | Recopiée dans |
|---|---|---|---|
| Projet Supabase | `sito`, région Paris, offre gratuite | `memoire/maintenant.md` ; `supabase/README.md` | `.env.example` |
| Taille maximale d'un fichier envoyé | 50 Mo (offre gratuite) ; 150 Mo prévus en offre Pro | `app/specs/02-TRD.md` P7 ; migration `20261005014022_app.sql` | `app/src/photo.ts` (`POIDS_MAX`) |
| Taille d'un morceau d'envoi TUS | 6 Mo exactement | `app/specs/02-TRD.md` P8 | `app/src/donnees/supabase.ts` |
| Côté maximal d'une photo préparée | 3 200 px, JPEG qualité 0,88 | `app/specs/02-TRD.md` P3 | `app/src/photo.ts` |
| Lien d'inscription | jeton de 256 bits, un seul usage, valable 14 jours | migration `20261029181645_invitations.sql` | `supabase/functions/inscription/` |
| Mot de passe | 8 à 72 caractères | `supabase/functions/inscription/logique.ts` | |
| Délai de suppression d'un compte | 30 jours, réversible | `app/specs/01-PRD.md` A18 | |
| Délai de diffusion d'une nouvelle version (KV) | jusqu'à 60 s | `app/specs/02-TRD.md` §7 | `worker/routeur.js` |
| Versions gardées par site | les deux dernières | `app/PLAN-APP.md` §3.3 | `atelier/publier.mjs` |
| Écrans essayés | iPhone 390 px, Android 360 px, ordinateur 1 280 px | `app/specs/02-TRD.md` T1 | `scripts/essai-app.mjs` |
| Téléphones du vérificateur des sites | 360, 390, 430 px | `memoire/maintenant.md` | `scripts/verifier-mobile.mjs` |
| Cible tactile minimale | 44 × 44 px | `app/specs/02-TRD.md` T3 | |
| Version de Node | 22 | `.github/workflows/essais.yml` | `.tool-versions` |

## Travail de Claude Code

| Valeur | Chiffre | Source | Recopiée dans |
|---|---|---|---|
| Lancements autonomes par jour | 20 au plus | `memoire/decisions.md`, 10 oct. 2026 | `scripts/autonome.mjs`, `CLAUDE.md` |
| Budget par panne | 3 approches ou 45 minutes | `memoire/decisions.md`, 10 oct. 2026 | `CLAUDE.md`, `.claude/skills/depanner/SKILL.md` |
| Seuil d'arrêt de la fabrication | moins de 1 Go libre sur le disque | `memoire/decisions.md`, 29 oct. 2026 | `memoire/maintenant.md` |

## Dépenses

| Valeur | État | Source |
|---|---|---|
| Domaine, Cloudflare payant, Stripe, Google Play | repoussés jusqu'à ce que l'app fonctionne | `memoire/decisions.md`, 29 oct. 2026 |
| Serveur loué | non : photos préparées dans l'app, sites publiés par GitHub Actions | `memoire/decisions.md`, 29 oct. 2026 |
| Supabase Pro | au premier client | `memoire/decisions.md`, 5 oct. 2026 |

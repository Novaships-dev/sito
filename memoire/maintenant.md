# État au 6 novembre 2026

À lire en premier, à chaque séance. **Réécrit, pas complété** : quand l'état
change, la phrase fausse disparaît et la juste la remplace
(`docs/REGLE-TRACABILITE.md`). Réécrit le 6 novembre 2026 par Cowork à la fin
du nettoyage décidé par Fabrice le 5 nov. Les chiffres viennent de
`docs/SOURCE-UNIQUE.md` ; les décisions, mot pour mot, de `memoire/decisions.md`.

## En une phrase

Sitô s'appelle maintenant **MonSiteArtisan.com** : une page de vente validée
par Fabrice, un générateur de sites d'artisans prouvé par les essais, une app
réduite à l'essentiel (photos des chantiers et compte), des comptes créés par
Fabrice, un paiement par liens Stripe, des domaines et des avis Google par
commande ; **rien n'est encore en ligne pour un client** : il manque la
micro-entreprise et le domaine (F25), le numéro WhatsApp (F24), les comptes
Stripe, Gandi et Google (F7, F8, F13), la clé de service Supabase (F1) et les
images de 13 métiers sur 16 (F15, F18).

## Les tâches

69 tâches : **50 faites, 18 bloquées, 1 à faire, 0 en cours** (`app/specs/07-TACHES.md`).
Plus aucune tâche « à faire » ouverte que Claude puisse mener seul : T04 attend
T03 (donc F1) ; T66 et T67 attendent F24 et F25.

Le nettoyage du 5 et 6 novembre, fait :

| Étape | Ce qui a changé | Tâche |
|---|---|---|
| 1 | plus d'app Android : l'app s'installe sur l'écran d'accueil depuis la page | T28, T29 abandonnées |
| 2 | comptes créés par Fabrice (`lanceurs\COMPTE_ARTISAN.bat`), plus d'inscription par lien | — |
| 3 | app : deux onglets, Mes chantiers et Mon compte | T61 |
| 4 | page de vente MonSiteArtisan.com (offre, exemples, avant / après, prix), validée le 6 nov. | — |
| 5 | paiement : trois liens Stripe, `node atelier/lien-paiement.mjs` | T62 |
| 6 | domaines : `node atelier/domaine.mjs` | T63 |
| 7 | avis Google sur le site seulement, `node atelier/lien-google.mjs` pour relier une fiche | T64 |
| 8 | ménage des documents | T65 |
| — | plus de formulaire sur les sites : le client appelle (Q10) | T68 |

## L'offre (décidée le 5 nov., `app/src/vitrine/offre.ts`)

Site complet : **80 € par mois** (engagement 12 mois, 1 mois offert) ou
**720 € par an** (renouvelé, sans mois offert). Les 3 premiers artisans
« vitrines » : 3 mois offerts. Nom de domaine .fr ou .com compris, acheté au
nom de l'artisan au premier paiement, il le garde s'il part. Prix sans TVA :
« TVA non applicable, art. 293 B du CGI » (franchise en base), à revoir avec
le comptable si le chiffre d'affaires approche 37 500 € par an.

## Ce que Fabrice fait avec une commande

| Pour | Commande ou lanceur |
|---|---|
| créer le compte d'un artisan, ou lui donner un nouveau mot de passe | `lanceurs\COMPTE_ARTISAN.bat` (sur le PC, jamais par GitHub : le dépôt est public) |
| le faire payer | `node atelier/lien-paiement.mjs --siren <SIREN> --formule mensuel` (ou `vitrine`, `annuel`), puis envoyer le lien |
| acheter ou brancher son domaine | `node atelier/domaine.mjs --siren <SIREN> --chercher <nom.fr>`, puis `--acheter … --prenom … --nom …`, puis `--verifier …` |
| relier sa fiche Google | `node atelier/lien-google.mjs --siren <SIREN>`, puis envoyer le lien (trois jours) |
| ajouter ses photos reçues par mail ou WhatsApp | `docs/PROCEDURE-PHOTOS.md` (une fois le dépôt privé, F20) |

## Ce qui marche, avec sa preuve

| Partie | Ce qui est fait | Preuve |
|---|---|---|
| Page de vente | photo de l'artisan en grand, recherche « façadier Aubagne », avant / après à glisser, trois sites d'exemple, prix, questions ; bouton de maquette visible sans défiler | `essai-app.mjs` (page sur 3 appareils) ; aperçu privé validé par Fabrice |
| App de l'artisan | Mes chantiers (photos préparées sur le téléphone : redressées, sans GPS, originaux à part) et Mon compte (site, téléphone, prix, mentions légales, export, suppression) | `essai-app.mjs` : 135 contrôles, 0 faute (Chromium ; WebKit dans la CI) |
| Comptes | créés par Fabrice, entreprise lue dans l'annuaire public, mot de passe tiré au sort affiché une fois | `essai-comptes.mjs` : 25, 0 ; 7 cassures sur 7 |
| Générateur | un site complet depuis un SIREN, un métier et des photos ; 4 archétypes ; bouton « Appeler » ; aucun formulaire (R-FORM) ; mentions légales ; référencement | `essai-mentions.mjs`, `essai-referencement.mjs`, `essai-fabrication-base.mjs` |
| Paiement | liens Stripe avec le SIREN ; webhook qui rattache l'abonnement | `essai-stripe.mjs` : 30, 0 ; 4 cassures sur 4 |
| Domaines | chercher, acheter (après le premier paiement), brancher, vérifier | `essai-domaines.mjs` : 60, 0 ; 12 cassures sur 12 |
| Avis Google | import chaque nuit pour le site, jeton chiffré, rien publié | `essai-google.mjs` : 24, 0 ; 7 cassures sur 7 |
| Prospection | artisans réels du 13, modèles de sites, lot du soir, page d'appels | `essai-prospection.mjs`, `essai-appels.mjs`, `essai-preparer-appels.mjs` |
| Suite d'essais | toutes les étapes vertes le 6 nov. (machine de Cowork, avec exiftool) | `memoire/essais/derniers.txt` ; CI GitHub |

Tout ce qui parle à Stripe, Gandi, Cloudflare et Google n'a tourné que
contre des faux serveurs : le réel attend les comptes de Fabrice.

## Ce qui est en ligne

6 sites de façadiers du 13 et la page d'appels sur `sito-demo.pages.dev`
(invisibles sur Google), du 29 oct. Aucun site d'abonné, aucun domaine, la
page de vente n'existe qu'en aperçu privé.

## Ce qui attend Fabrice (`memoire/actions-fabrice.md`)

| Action | Pour |
|---|---|
| F25 : créer la micro-entreprise, puis acheter monsiteartisan.com | mettre la page en ligne (T67), mentions légales, TVA |
| F24 : le nouveau numéro WhatsApp | les boutons de la page (T66) |
| F7 : compte Stripe et trois liens de paiement (pas à pas dans l'action) | encaisser |
| F1 : clé de service Supabase dans `.env` | créer les comptes pour de vrai, essais contre la vraie base |
| F8, F13 : comptes Gandi et Google | domaines, avis |
| F15, F18 : images des métiers | sites des autres métiers que le ravalement |
| F20, F21 : dépôt privé, refabrication automatique | photos des artisans, sites mis à jour seuls |
| F23 : retirer l'ancienne table d'inscription | ménage de la base (rien ne presse) |

## Ne pas refaire

- Livrer en choisissant les fichiers à la main.
- Laisser du travail vivre seulement dans l'espace de Claude.
- Construire sans avoir lu `memoire/`, `rules/web/` et `docs/CONSTRAINTS.md`.
- Déclarer un contrôle bon sans l'avoir vu attraper une copie cassée exprès.
- Montrer à Fabrice une page sans images : il juge sur son téléphone, sur le rendu.
- Laisser une phrase fausse dans ce fichier en ajoutant la juste en dessous.

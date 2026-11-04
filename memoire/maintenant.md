# État au 3 novembre 2026

Place libre du disque : **1519,4 Mo** (audit du 3 novembre 2026 à 01:16).

À lire en premier, à chaque séance. **Réécrit, pas complété** : quand l'état
change, la phrase fausse disparaît et la juste la remplace
(`docs/REGLE-TRACABILITE.md`). Réécrit le 3 novembre 2026 par Cowork après
l'audit du dépôt (`docs/audit/REGISTRE.md`, 24 constats), à partir de l'état
écrit par Claude Code après T44 (commit `0dd3776`), puis après le lot 2
(produit) de Cowork, puis après T47, T48, T50, T51, T49 (Cowork, même jour) et T54 (4 nov.). Les
chiffres viennent de
`docs/SOURCE-UNIQUE.md`.

## En une phrase

Le générateur de sites, la base, l'inscription, la préparation des photos dans
l'app, la publication par versions et la prospection marchent et sont prouvés
par des essais ; **aucun site d'abonné n'est encore vendable** : pas de formulaire de
demande, 3 métiers sur 16, pas d'adresse publique posée avant la première
fabrication (D-14), rien d'essayé sur un vrai iPhone (F14). Mentions légales
(T50), référencement (T51) et Safari dans la CI (T49) faits.

## Les tâches

61 tâches : **39 faites, 15 bloquées, 6 à faire, 1 en cours (T32 : textes des métiers, maçonnerie, menuiserie, carrelage et plomberie faits, 9 restants)** (`app/specs/07-TACHES.md`).
T47 à T56 viennent de l'audit du 3 novembre.

**Ordre décidé par Fabrice le 3 nov. (« oui Q5 ») : les tâches de l'audit
d'abord.** T47 (garde de l'essai de l'app), T48 (échappement), T50
(mentions légales), T51 (référencement), T49 (Safari), T54, T55, T56, T46, T52
et T53 sont faites. Le 4 nov. aussi : T10 (formulaire, côté base), T12
(suppression des comptes, contre des faux, pas encore lancée chaque nuit :
D-16), T16 et T17 (Stripe écrit et relié, rien de déployé : F7), T31 (codes
APE), la maçonnerie, la menuiserie, le carrelage et la plomberie pour T32. T45 est faite contre des faux, bloquée sur
F21 pour le réel ; T13 est sans objet (Q7).
T11 (formulaire dans les pages) faite aussi : en ligne dès que la clé publique
est posée (F21). **Prochaine : la suite de T32** (électricité, plâtrerie,
isolation…).
Depuis T50, un
site fabriqué depuis la base est un site d'abonné (`--publication`) : sans
adresse électronique ni directeur de la publication dans `profils`, il n'est
pas fabriqué (l'écran « Compte » de l'app le dit à l'artisan).

## Modèles de prospection (décision du 4 nov.)

T57 à T59 faites : 10 modèles par métier (ravalement, couverture, peinture,
`prospection/modeles/`) ; le lot du soir remplit un modèle libre avec chaque
artisan ; quand Fabrice touche « Essai lancé » ou « Abonné » dans la page
d'appels, la préparation suivante réserve ce modèle à l'artisan et en tire un
nouveau. À la main : `node scripts/prospection/accepter.mjs --siren <SIREN>`.
T60 faite : les photos reçues par mail ou WhatsApp deviennent le site d'abonné (`docs/PROCEDURE-PHOTOS.md`). Elles vont dans `clients/<SIREN>/`, seulement une fois le dépôt privé (F20, à faire par Fabrice).

## Ce qui marche, avec sa preuve

| Partie | Ce qui est fait | Preuve |
|---|---|---|
| Générateur | un site complet depuis un SIREN, un métier et des photos, en 1 min 30 environ ; 4 archétypes ; bouton « Appeler » ; prix et estimateur seulement sur les tarifs de l'artisan ; un seul échappement (T48) ; mentions légales sur un site d'abonné (T50) ; référencement (T51) | `essai-echappement.mjs` (101), `essai-mentions.mjs` (56), `essai-referencement.mjs` (94) ; les cinq vérificateurs à 0 sur les trois sites de démonstration (`node scripts/fabriquer-demo.mjs`, machine avec images) |
| Unicité | 100 sites d'un même métier tous différents dans un département, pour ravalement, couverture et peinture | `node scripts/capacite-unicite.mjs --photos plan` (projection avec les 54 images prévues par métier) |
| Base Supabase | projet `sito`, Paris, gratuit ; droits par ligne sur toutes les tables, droits par colonne ; 9 migrations (la dernière : mentions légales, 3 nov.) | `droits-app.sql` rejoué le 3 nov. après la migration de T50, aucune faute ; `droits.sql` le 29 oct. (T05) |
| Inscription (T43) | par le lien que Fabrice envoie par SMS, e-mail et mot de passe, une seule fois, sans code ; l'artisan reste connecté | `essai-inscription.mjs` (23 contrôles) ; essayée en vrai sur le compte d'essai (inscription, puis reprise) |
| Photos dans l'app (T44) | sur le téléphone, avant l'envoi : version réduite redressée, original nettoyé (sans GPS ni appareil, mêmes pixels), aperçu des RAW ; ce qui est illisible est dit à l'artisan et n'est pas envoyé | `node scripts/essai-app.mjs` : 132 contrôles, 0 faute ; 3 copies cassées attrapées |
| App de l'artisan | React, installable ; tous les écrans en démonstration | `essai-app.mjs` sur iPhone 390, Android 360, ordinateur 1 280, sous Chromium et WebKit (Safari, CI) |
| Service atelier | photos reçues préparées (T07) ; site fabriqué depuis la base (T08) ; boucle qui refait, vérifie et publie par version (T09) | `essai-preparation.mjs` (77), `essai-fabrication-base.mjs` (12), `essai-boucle.mjs` (23) |
| Prospection | artisans réels du 13 trouvés et notés ; lot du jour fabriqué, publié en privé ; page d'appels | `essai-prospection.mjs` (122), `essai-publication-prospection.mjs` (68), `essai-appels.mjs` (79), `essai-preparer-appels.mjs` (49) |
| Suite d'essais | 23 étapes ; toutes vertes le 3 nov. à 01:42 sur le PC (commit `85bba53`, 20 étapes alors) ; sur la machine de Cowork, sans exiftool, les 3 étapes qui en ont besoin disent « NON LANCÉ » (T47) | `memoire/essais/derniers.txt` ; CI GitHub |

## Pour Fabrice : fabriquer un lien d'inscription

Demander à Claude `select public.creer_invitation('<siren>');` : le lien vaut
14 jours et sert une fois. Mot de passe oublié : un lien de reprise,
`creer_invitation('<siren>', 'reprise')` (Q4, appliquée). Pour qu'un artisan
s'inscrive pour de vrai, il manque encore l'app en ligne (son adresse, pour le
lien) et une entreprise réelle dans la base.

## Ce qui est en ligne

6 sites de façadiers du 13 et la page d'appels, sur `sito-demo.pages.dev`
(Cloudflare Pages gratuit), invisibles sur Google : `verifier-en-ligne.mjs`,
50 contrôles, 0 faute, le 29 oct. Ils portent encore l'ancienne écriture des
communes (« Marseille 13eme ») : les refaire est la suite de T41, bloquée.
Aucun site d'abonné n'est en ligne ; aucun domaine n'est acheté.

## Ce qui bloque, et qui doit agir

| Blocage | Qui | Action |
|---|---|---|
| Disque du PC : 1,52 Go libres le 3 nov. ; sous 1 Go, plus de fabrication | Fabrice | F19 (`memoire/actions-fabrice.md`) : Windows Update à vider (environ 4,9 Go) d'abord |
| Images de couverture et de peinture (30 liens du lot) | Fabrice | F18 |
| 22 images du ravalement | Fabrice | F15 |
| Clé secrète Supabase (compte d'essai, essais contre la vraie base) | Fabrice | F1 |
| Vrais appareils (iPhone, Android) pour les essais | Fabrice | F14 |
| Domaine, Cloudflare payant, Stripe, Google Play | repoussés jusqu'à ce que l'app fonctionne | décision du 29 oct. |

## Ce qui manque, par ordre d'importance

Le détail, avec la preuve de chaque constat, est dans `docs/audit/REGISTRE.md`.

1. **Adresse publique** d'un abonné jamais posée avant sa première fabrication (D-14) ; horaires, prix et redirection du sous-domaine absents du référencement (D-13).
2. **Vrais appareils** : rien d'essayé sur un vrai iPhone ou Android, ni les gestes au doigt sous Safari (F14) ; WebKit tourne dans la CI depuis T49.
3. **Formulaire de demande** : fait (T10, T11) ; attend la clé publique dans les secrets GitHub (F21).
4. **9 métiers sur 16** sans textes (S-013, T32 ; maçonnerie, menuiserie, carrelage et plomberie faits le 4 nov.), et les images de 13 d'entre eux.
5. **Documents** encore à écrire : technique, qualité, juridique, exploitation, commerce (lots 3 à 7, `docs/00-INDEX.md`, dernière section). Lots 1 et 2 faits le 3 nov.

## Ne pas refaire

- Livrer en choisissant les fichiers à la main.
- Laisser du travail vivre seulement dans l'espace de Claude.
- Construire sans avoir lu `memoire/`, `rules/web/` et `docs/CONSTRAINTS.md`.
- Déclarer un contrôle bon sans l'avoir vu attraper une copie cassée exprès.
- Conclure sur trois sites de démonstration : mesurer à l'échelle du produit.
- Laisser une phrase fausse dans ce fichier en ajoutant la juste en dessous.

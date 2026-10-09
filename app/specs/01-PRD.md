# 01 — PRD : Sitô, le produit

Version du 9 octobre 2026. Les cinq autres documents en découlent :
`02-TRD.md`, `03-APPFLOW.md`, `04-DESIGN-SYSTEM.md`, `05-SCHEMA-BACKEND.md`,
`06-PLAN-IMPLEMENTATION.md`.

**Règle de lecture.** Une exigence vient soit d'une **décision de Fabrice**
(datée, citée, voir `memoire/decisions.md`), soit d'une **proposition de
Claude** acceptée dans le plan (`app/PLAN-APP.md`, accord « GO » du
9 octobre). Ce qui n'est ni l'un ni l'autre est marqué **Ouvert**.

États employés dans tous les documents :

| État | Sens |
|---|---|
| Fait, prouvé | construit, et un essai versionné le mesure (nom de l'essai donné) |
| Fait, non prouvé | construit, jamais essayé en vrai (base réelle, vrai appareil…) |
| À faire | décidé, pas construit |
| Ouvert | attend une décision de Fabrice |

---

## 1. Le produit en une phrase

Sitô fabrique pour chaque artisan du bâtiment **un site internet unique**, et
lui donne **une app** pour le faire vivre : statistiques, demandes, avis et
fiche Google, photos de chantier qui enrichissent le site.

## 2. Ce que Fabrice a décidé

| Date | Décision (mots de Fabrice quand ils existent) |
|---|---|
| sept. 2026 | Le cœur du produit, c'est **le site créé pour l'artisan**, et ce que l'app fait autour. |
| sept. 2026 | Nom **Sitô**, provisoire. 5 oct. : « il va falloir trouver le nom de domaine parfait ». |
| 23 sept. | « L'app permet à l'artisan de voir les stats de son site, ses commentaires Google et sa fiche pro Google, ainsi que d'ajouter des images avant/après de ses chantiers pour enrichir le site. L'app sert à son référencement. » |
| 23 sept. | « Le site s'adapte aux images ajoutées, c'est fait exprès pour ça. » |
| 24 sept., 2 oct. | Chaque site différent, **dans la commune et le département** ; 100 sites d'un même métier différents dans un même département. |
| 2 oct. | **Téléphone** choisi par l'artisan dans l'app ; sans lui, un emplacement désigné sur le site. |
| 2 oct. | **Prix** : « c'est l'artisan qui coche une case pour activer ça ou pas, et ensuite ajouter ses tarifs ». Estimateur calculé sur ses tarifs. |
| 2 oct. | Images de la banque marquées « Exemple » jusqu'à ce que l'artisan mette les siennes. |
| 3 oct. | Photos : « Tout doit être accepté, iPhone etc., la totale. » |
| 5 oct. | Éditeur : « Ma micro-entreprise, mais c'est un détail à la fin. » |
| 5 oct. | Oui : Cloudflare (un seul Worker), Gandi, sous-domaine offert par défaut, domaine propre inclus dans l'abonnement, vidéos acceptées et gardées, réponses aux avis préparées et validées par l'artisan, abonnement au mois et à l'année, Supabase Pro au premier client. |
| 5 oct. | « Il faut qu'elle soit sur Android Store, et pour Apple Store c'est compliqué, alors elle doit pouvoir être installée ou ajoutée sur la page d'accueil comme une app via le site Sitô. » |
| 9 oct. | « 1. GO 2. OK » : construction lancée ; prix proposé accepté : **39 € HT par mois ou 390 € HT par an**. |

## 3. Pour qui

| Personne | Ce qu'elle veut | Où elle agit |
|---|---|---|
| **L'artisan abonné** (utilisateur de l'app) | des appels et des demandes ; un site qui fait sérieux sans y passer de temps ; répondre vite | l'app, surtout sur iPhone, souvent sur un chantier en 4G |
| **Le visiteur** du site (client de l'artisan) | savoir si l'artisan fait son chantier, voir des réalisations, appeler ou écrire | le site de l'artisan |
| **Sitô** (Fabrice) | fabriquer, publier et faire tourner des milliers de sites sans intervention à la main | le dépôt, le service atelier, les tableaux de bord |

L'artisan travaille surtout au téléphone : **tout doit marcher pareil au doigt
et à la souris** (décision de septembre).

## 4. Ce que fait l'app : les exigences

| N° | Exigence | Source | État |
|---|---|---|---|
| A1 | Se connecter sans mot de passe, par code reçu par e-mail | plan 7.3 | Fait, non prouvé contre la vraie base |
| A2 | Voir les visites, appels et demandes de la semaine, et la courbe de 28 jours, comptés au jour de Paris | 23 sept. ; plan 7.4 | Fait (affichage, prouvé `essai-app`) ; mesure Umami à faire |
| A3 | Lire les demandes laissées sur le site, appeler ou répondre d'un geste, marquer comme lue | plan 7.1 | Fait, prouvé `essai-app` ; formulaire du site à faire |
| A4 | Créer un chantier, ajouter des paires avant/après et d'autres photos | 23 sept. | Fait, prouvé `essai-app` (démonstration) |
| A5 | Accepter **toute** photo de tout appareil ; refuser ce qui n'est pas une photo avec une phrase claire | 3 oct. | Fait, prouvé `essai-app` et `essai-photos` (fichiers fabriqués) |
| A6 | Ne jamais envoyer la position GPS ni l'appareil ; redresser la photo | plan 5.2 | Fait, prouvé `essai-app` |
| A7b | Envoyer aussi l'original en pleine résolution, après la version réduite | 9 oct. (« 3. OK ») | Fait, prouvé `essai-app` et `droits-app.sql` |
| A7 | Ne perdre aucune photo si le réseau coupe ou si l'iPhone met l'app en veille | plan 5.3 | Fait (file IndexedDB, envoi TUS), non prouvé sur vrai réseau |
| A8 | Accepter et garder les vidéos, sans les montrer pour l'instant | 5 oct. | Fait, prouvé `essai-app` |
| A9 | Le site se refabrique et se republie avec les nouvelles photos, sans jamais casser la version en ligne | 23 sept. ; plan 3.3 | Publication par versions faite, prouvée `essai-publication` ; déclenchement depuis l'app à faire |
| A10 | Donner son téléphone, cocher « afficher mes prix », saisir ses tarifs | 2 oct. | Fait, prouvé `essai-app` |
| A11 | Remplir les mentions légales obligatoires (TVA, décennale, médiateur) | plan 7.5 | Fait, prouvé `essai-app` |
| A12 | Voir son adresse (sous-domaine offert) ; demander son propre domaine ; brancher un domaine existant | 5 oct. ; plan 4 | Affichage fait ; achat Gandi et branchement à faire |
| A13 | Lire ses avis Google ; relire, corriger et valider une réponse préparée ; rien n'est publié sans lui | 5 oct. | Écran fait, prouvé `essai-app` ; récupération et publication Google à faire (accès Google) |
| A14 | Voir l'état de sa fiche Google ; un lien direct vers la fiche en attendant | plan 6.4 | Fait (état et lien) ; comparaison fiche / site à faire |
| A15 | Voir sa formule, son état et son échéance ; payer et gérer en ligne sur le web | 5 et 9 oct. | Affichage fait ; Stripe à faire |
| A16 | Dans l'app Android (Play Store) : **aucun prix, aucun achat** | règle Google Play, plan 7.2 | Fait, prouvé `essai-app` |
| A17 | Télécharger toutes ses données | plan 7.5 (RGPD) | Fait, prouvé `essai-app` |
| A18 | Supprimer son compte, avec 30 jours pour changer d'avis | plan 7.5 | Fait (demande, annulation), prouvé `essai-app` ; suppression effective par le service à faire |
| A19 | Installer l'app : Play Store sur Android, écran d'accueil sur iPhone depuis le site Sitô | 5 oct. | Page d'installation et PWA faites ; publication Play Store à faire |
| A20 | Essayer l'app sans compte (démonstration) | proposition de Claude | Fait, prouvé `essai-app` |

## 5. Ce que fait le site de l'artisan (rappel)

Le générateur existe et est vérifié (voir `memoire/maintenant.md`). Les
exigences qui touchent l'app :

| N° | Exigence | État |
|---|---|---|
| S1 | Quatre archétypes, tous utilisés ; charte tirée une fois et **figée** (une photo ajoutée ne change pas le visage du site) | Fait, prouvé (vérificateurs du générateur) |
| S2 | Bouton « Appeler » avec le numéro donné dans l'app ; emplacement désigné sans numéro | Fait |
| S3 | Section prix et estimateur seulement si la case est cochée | Fait |
| S4 | Photos de l'artisan à la place des images « Exemple » | Générateur prêt ; chaîne app → site à faire |
| S5 | Formulaire de demande qui écrit dans la base, protégé des robots | À faire |
| S6 | Mesure d'audience sans cookie (Umami), exemptée de consentement CNIL | À faire |
| S7 | Avis Google réels sur le site | À faire (accès Google) |

## 6. Hors périmètre (pour l'instant)

| Sujet | Pourquoi |
|---|---|
| App dans l'App Store d'Apple | « pour Apple Store c'est compliqué » (5 oct.) : installation depuis le site |
| Montrer les vidéos sur le site | décision du 5 oct. : gardées, montrées plus tard |
| Connexion par SMS | option du plan (8 centimes le code), non décidée |
| Plusieurs entreprises par compte | la base le permet (`membres`), l'app prend la première |
| Notifications | pas encore demandées |

## 7. Le modèle économique

| Élément | Valeur | Source |
|---|---|---|
| Abonnement mensuel | 39 € HT par mois (engagement : **Ouvert**) | 9 oct. |
| Abonnement annuel | 390 € HT par an | 9 oct. |
| Domaine propre | inclus dans l'abonnement, au nom de l'artisan | 5 oct. |
| Adresse offerte | `nom.domaine-sito.fr`, par défaut | 5 oct. |
| Paiement | Stripe Checkout et portail client, sur le web seulement | plan 7.6 |
| Facture électronique | plateforme agréée nécessaire (réception obligatoire depuis le 1er sept. 2026, émission PME au 1er sept. 2027) | plan 7.6 |
| Période d'essai | **14 jours** | 9 oct. (« 2. OK ») |

## 8. Contraintes qui s'imposent

| Contrainte | Conséquence |
|---|---|
| Google Play interdit la vente hors de son système dans l'app | l'app Android n'affiche ni prix ni achat ; l'abonnement se prend sur le site Sitô |
| L'accès aux avis Google est soumis à approbation (fiche gérée depuis 60 jours) | l'app marche sans Google ; il faut un artisan pilote |
| CNIL : mesure d'audience exemptée à trois conditions | un site Umami par artisan, traceurs 13 mois, données 25 mois |
| RGPD | export et suppression de toutes les données de l'artisan |
| Mentions légales d'un artisan | TVA, assurance décennale, médiateur sur le site |
| Le .fr : charte Afnic | domaine au nom de l'artisan, son e-mail, son SIREN |

## 9. Comment on sait que c'est réussi

Chaque étape du plan finit par une preuve (`06-PLAN-IMPLEMENTATION.md`). Pour
le produit entier :

| Mesure | Cible |
|---|---|
| Un artisan change son téléphone sur iPhone | le site republié l'affiche |
| Un artisan ajoute une paire avant/après depuis un chantier | elle est sur son site, sans GPS, dans le bon sens |
| Une publication | change de version en moins de 2 minutes, sans mélange, l'ancienne reste si un contrôle échoue |
| Les chiffres de l'accueil | égalent Umami et la base pour le même jour de Paris |
| 100 sites d'un même métier dans un département | tous différents (`capacite-unicite`) |

## 10. Ouvert : à décider par Fabrice

| N° | Question | Recommandation de Claude |
|---|---|---|
| O1 | Nom définitif et domaine de Sitô (liste : `docs/noms-2026-10-05.md`) | choisir parmi ceux libres en .fr et .com, après vérification INPI |
| O2 | Engagement de l'abonnement mensuel | sans engagement (l'annuel sert d'engagement) — en attente de l'OK de Fabrice |
| O4 | Artisan pilote pour l'accès Google | — (il le trouve) |
| O5 | Compte Google Play : personnel (12 testeurs pendant 14 jours) ou organisation (D-U-N-S) | organisation, si la micro-entreprise obtient un D-U-N-S |

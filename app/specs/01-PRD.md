# 01 — PRD : Sitô, le produit

Version du 3 novembre 2026, réécrite par Claude (Cowork) après l'audit du
dépôt (`docs/audit/REGISTRE.md`, constat S-010). Elle remplace celle du
9 octobre, qui ne donnait au site que 7 lignes et ne contenait aucune exigence
de référencement. **L'ordre suit la décision de Fabrice** de septembre : le
cœur du produit est le site de l'artisan, l'app sert à le faire vivre. Les
cinq autres documents en découlent : `02-TRD.md`, `03-APPFLOW.md`,
`04-DESIGN-SYSTEM.md`, `05-SCHEMA-BACKEND.md`, `06-PLAN-IMPLEMENTATION.md`.

**Règle de lecture.** Une exigence vient soit d'une **décision de Fabrice**
(datée, `memoire/decisions.md`), soit d'une **proposition de Claude** acceptée
dans le plan (`app/PLAN-APP.md`, accord « GO » du 9 octobre), soit d'une
**règle extérieure** (loi, Google), sourcée. Ce qui n'est rien de cela est
marqué **Ouvert**. Les chiffres viennent de `docs/SOURCE-UNIQUE.md`.

États employés dans tous les documents :

| État | Sens |
|---|---|
| Fait, prouvé | construit, et un essai versionné le mesure (nom de l'essai donné) |
| Fait, non prouvé | construit, jamais essayé en vrai (base réelle, vrai appareil, Safari…) |
| Partiel | une partie construite ; le reste est nommé |
| À faire | décidé, pas construit ; la tâche est nommée |
| Ouvert | attend une décision de Fabrice |

---

## 1. Le produit en une phrase

Sitô fabrique pour chaque artisan du bâtiment **un site internet unique**,
différent de ceux de ses voisins, et lui donne **une app** pour le faire
vivre et pour son référencement : statistiques, demandes, avis et fiche Google,
photos de chantier qui enrichissent le site.

## 2. Ce que Fabrice a décidé

| Date | Décision (mots de Fabrice quand ils existent) |
|---|---|
| sept. 2026 | Le cœur du produit, c'est **le site créé pour l'artisan**, et ce que l'app fait autour. |
| sept. 2026 | Tout marche pareil sur téléphone et sur ordinateur ; il travaille surtout sur iPhone. |
| sept. 2026 | Nom **Sitô**, provisoire. 5 oct. : « il va falloir trouver le nom de domaine parfait ». |
| 23 sept. | « L'app permet à l'artisan de voir les stats de son site, ses commentaires Google et sa fiche pro Google, ainsi que d'ajouter des images avant/après de ses chantiers pour enrichir le site. **L'app sert à son référencement.** » |
| 23 sept. | « Le site s'adapte aux images ajoutées, c'est fait exprès pour ça. » ; « tous les métiers, et à 100 % » ; « les archétypes doivent être tous utilisés ». |
| 24 sept., 2 oct. | Chaque site différent, **dans la commune et le département** ; 100 sites d'un même métier différents dans un même département. |
| 2 oct. | **Téléphone** choisi par l'artisan dans l'app ; sans lui, un emplacement désigné sur le site. |
| 2 oct. | **Prix** : « c'est l'artisan qui coche une case pour activer ça ou pas, et ensuite ajouter ses tarifs ». Estimateur calculé sur ses tarifs. |
| 2 oct. | Images de la banque marquées « Exemple » jusqu'à ce que l'artisan mette les siennes. |
| 3 oct. | Photos : « Tout doit être accepté, iPhone etc., la totale. » |
| 5 oct. | Éditeur : « Ma micro-entreprise, mais c'est un détail à la fin. » |
| 5 oct. | Oui : Cloudflare (un seul Worker), Gandi, sous-domaine offert par défaut, domaine propre inclus dans l'abonnement, vidéos acceptées et gardées, réponses aux avis préparées et validées par l'artisan, abonnement au mois et à l'année, Supabase Pro au premier client. |
| 5 oct. | « Il faut qu'elle soit sur Android Store, et pour Apple Store c'est compliqué, alors elle doit pouvoir être installée ou ajoutée sur la page d'accueil comme une app via le site Sitô. » |
| 9 oct. | « 1. GO 2. OK » : construction lancée ; prix accepté : **39 € HT par mois ou 390 € HT par an** ; essai gratuit de 14 jours ; mensuel **sans engagement**. |
| 23 oct. | Prospection : 30 sites par jour sur au moins 3 métiers, 60 appels, artisans réels ; offre : 14 jours d'essai, séance photo offerte avec l'annuel. |
| 24 oct. | Séance photo avec la formule au mois : 90 € HT la visite. |
| 29 oct. | Ravalement : façadiers seulement. Pas de serveur loué ; inscription par lien, e-mail et mot de passe, sans code. Dépenses repoussées jusqu'à ce que l'app fonctionne. |
| 3 nov. | « Tout doit être correct niveau fichier et complet, surtout rien ne doit manquer » ; « oui Q5 » : les tâches de l'audit passent avant le reste de l'app. |

## 3. Pour qui

| Personne | Ce qu'elle veut | Où elle agit |
|---|---|---|
| **Le visiteur** du site (client de l'artisan) | savoir qui, quoi, où, si c'est sérieux ; voir des réalisations ; appeler ou écrire | le site de l'artisan, surtout sur téléphone (`docs/specs/S-PARCOURS-VISITEUR.md`) |
| **L'artisan abonné** | des appels et des demandes ; un site qui fait sérieux sans y passer de temps ; être trouvé sur Google | l'app, surtout sur iPhone, souvent sur un chantier en 4G |
| **L'artisan prospecté** | voir en une minute le site qu'on a fait pour lui | le lien reçu par SMS, sur son téléphone |
| **Sitô** (Fabrice) | fabriquer, publier et faire tourner des milliers de sites sans intervention à la main ; appeler 60 artisans par jour | la page d'appels, le dépôt, les tableaux de bord |

---

## 4. Le site de l'artisan : les exigences

Fichiers : `generateur/`, `rules/web/`, `worker/`. Parcours du visiteur :
`docs/specs/S-PARCOURS-VISITEUR.md`. Métiers : `docs/specs/METIERS.md`.

Les exigences S1 à S7 de la version du 9 octobre sont reprises sous ces
numéros : S1 → S02, S2 → S05, S3 → S06, S4 → S08, S5 → S21, S6 → S20,
S7 → S22. Ne pas confondre une exigence (S05) et un constat d'audit
(S-005, `docs/audit/REGISTRE.md`).

### 4.1 Fabrication et contenu

| N° | Exigence | Source | État et preuve |
|---|---|---|---|
| S01 | Un site complet se fabrique depuis un SIREN, un métier et des photos ; les faits de l'entreprise viennent de Sirene et de nulle part ailleurs ; ce que la base ne dit pas se dit sur la page | sept. ; `rules/common/ne-pas-fabriquer.md` | Fait, prouvé : `verifier-site` sur les sites de démonstration et sur chaque site du lot (T37) |
| S02 | Quatre archétypes, tous utilisés | 23 sept. | Fait, prouvé : `generateur/tirage.mjs` ; les cinq vérificateurs sur les quatre |
| S03 | Le site d'un artisan diffère de ceux de ses voisins (même métier, même commune ou même département) : 100 sites d'un métier sans défaut dans un département | 24 sept., 2 oct. | Fait, prouvé **en projection** pour ravalement, couverture, peinture : `capacite-unicite --photos plan` ; à refaire sur les vraies images (D-09) |
| S04 | La charte est tirée une fois et **figée** : une photo ajoutée ne change pas le visage du site | plan, 9 oct. | Fait, prouvé : `essai-fabrication-base` (T08) |
| S05 | Bouton « Appeler » au premier écran et barre d'appel sur téléphone, avec le numéro donné dans l'app ; sans numéro, un emplacement désigné, jamais un lien vide | 2 oct. | Fait, prouvé : T1, T2, O14, M13 |
| S06 | Section prix et estimateur seulement si l'artisan coche la case ; calculés sur ses seuls tarifs | 2 oct. | Fait, prouvé : calcul vérifié dans un navigateur |
| S07 | Une image de la banque porte la mention « Exemple » (`data-exemple`, `alt` qui commence par « Exemple ») tant que l'artisan n'a pas mis les siennes ; aucune photo de l'artisan sur un site de prospection | sept., 2 oct. | Fait, prouvé : `verifier-site` |
| S08 | Les photos de l'artisan remplacent les exemples ; le site se refait et se republie à chaque ajout | 23 sept. | Partiel : fabrication depuis la base (T08) et boucle (T09) prouvées ; déclenchement par GitHub Actions à faire (T45) |
| S09 | Comparateur avant / après qui marche au doigt et à la souris | sept. | Fait, prouvé : M7 à M11, O5 |
| S10 | Section « vérifiable » : SIREN, SIRET, forme, création, siège, activité, effectif, RGE, depuis Sirene ; une ligne vide dans la source reste vide | sept. | Fait |
| S11 | Deuxième page (« le travail ») sur les quatre archétypes | 23 sept. (archétypes au même niveau) | Fait sur les quatre archétypes (T52, 4 nov.) ; tirée pour 60 % des sites ; vraies photos non essayées (F15) |
| S12 | Textes alternatifs des photos propres au métier et à la photo, jamais écrits pour un autre métier | accessibilité ; `rules/web/accessibilite.md` | **À faire** : écrits en dur pour la façade sur tous les métiers (constat S-023, T55) |
| S13 | Tous les textes de l'artisan sont échappés partout (contenu, attributs, JSON) | sécurité | **À faire** : guillemets non échappés (constat S-006, T48) |
| S14 | 16 métiers, chacun prêt (textes, prompts, 54 images, 100 sites, règle de prospection) | 23 sept. | Partiel : 0 sur 16 prêts, 3 avec textes et prompts (`docs/specs/METIERS.md`, T32, T33) |

### 4.2 Ce que la loi et Google demandent

| N° | Exigence | Source | État et preuve |
|---|---|---|---|
| S15 | **Mentions légales** sur chaque site d'abonné : identité, forme, capital, siège, contact, immatriculation, TVA, hébergeur, éditeur et directeur de la publication, médiateur de la consommation ; lien dans le pied de chaque page | Service Public F37351, F33338 ; Code de la consommation L. 616-1 et R. 616-1 (`docs/specs/S-MENTIONS.md`) | **À faire** (constat S-004, T50) |
| S16 | **Référencement** d'un site d'abonné : titre et description, données structurées `LocalBusiness` (ou type du métier) sans rien d'inventé, adresse canonique, `sitemap.xml`, `robots.txt` qui autorise | 23 sept. (« l'app sert à son référencement ») ; Google Search Central (`docs/specs/S-REFERENCEMENT.md`) | **À faire** (constat S-003, T51) |
| S17 | Aperçu de partage (Open Graph) sur tout site, prospection comprise | même source | **À faire** (T51) |
| S18 | Deux régimes jamais mélangés : site de prospection `noindex` et `robots.txt` qui interdit ; site d'abonné indexable | 23 oct. (liens privés) ; 23 sept. | Partiel : prospection faite et prouvée (X14) ; régime abonné à faire (T51, contrôle R-REGIME) |
| S19 | Pied de page selon le régime : « Proposition de site » seulement sur un site de prospection | `rules/common/ne-pas-fabriquer.md` | **À faire** : écrit en dur sur tous les sites (constat S-022, T54) |
| S20 | Mesure d'audience sans cookie et sans consentement : un site Umami par artisan, traceurs 13 mois, données 25 mois ; clic « Appeler » compté | CNIL (`app/PLAN-APP.md` §7.4) | À faire (T22, T23) |

### 4.3 Ce que le visiteur fait

| N° | Exigence | Source | État et preuve |
|---|---|---|---|
| S21 | ~~Formulaire de demande sur le site~~ | retiré, décision de Fabrice du 6 nov. 2026 (Q10 : « 1. ») | Retiré (T68) : le client appelle avec le bouton « Appeler » ; `verifier-site` refuse tout formulaire (R-FORM) |
| S22 | Avis Google réels de l'artisan sur son site ; jamais inventés ; sur un site d'abonné sans avis, pas de section « avis » | 23 sept. ; `rules/common/ne-pas-fabriquer.md` | **À faire** : un site d'abonné afficherait « Les avis viennent ici » (constat S-024, T56) ; avis réels : T24, T25 |
| S23 | Tout marche pareil sur Safari et sur un vrai iPhone | sept. | **À faire** : jamais essayé (constat S-007, T49 ; T30, F14) |

### 4.4 Qualité de chaque page (plancher)

| N° | Exigence | Source | État et preuve |
|---|---|---|---|
| S24 | Contenu visible sans JavaScript ; mouvement réduit respecté | panne du 16 sept. | Fait, prouvé : O11, V2, V3 |
| S25 | Contraste d'au moins 4,6:1 sur chaque surface, un seul `h1`, titres sans saut, focus visible, cibles de 44 px | `rules/web/accessibilite.md` | Fait, prouvé : A7, O13, M12, `verifier-site` |
| S26 | Budgets de poids des pages et des images | `rules/web/performance.md` | Fait, prouvé : `verifier-site` |
| S27 | Aucune signature de design générique ; polices et palettes bannies refusées | `rules/web/design-interdits.md` | Fait, prouvé : `verifier-site` |
| S28 | Règles de rédaction française (tiret cadratin, point médian, lexique mort) | `rules/common/redaction-fr.md` | Fait, prouvé : `verifier-textes` |

### 4.5 Mise en ligne

| N° | Exigence | Source | État et preuve |
|---|---|---|---|
| S29 | Un site d'abonné se publie par versions : une version cassée est refusée, l'ancienne reste en ligne ; un visiteur ne voit jamais un mélange | plan 3.3 | Fait, prouvé : `essai-publication` ; en réel : T14 (bloquée : F5, F6) |
| S30 | Adresse offerte (sous-domaine) dès la création ; domaine propre au nom de l'artisan, inclus dans l'abonnement | 5 oct. | À faire (T19 à T21 ; domaine de Sitô : F6, repoussé le 29 oct.) |
| S31 | Site de prospection : adresse secrète de 16 caractères, `noindex`, retiré à 30 jours, le jour même si « ne plus appeler » | 23 oct. | Fait, prouvé : `essai-publication-prospection` (68 contrôles) ; en ligne : `verifier-en-ligne` (50 contrôles, 29 oct.) |

---

## 5. La prospection : les exigences

Spécification complète : `app/specs/08-PROSPECTION.md`. Script d'appel :
`docs/prospection-script.md`.

| N° | Exigence | Source | État et preuve |
|---|---|---|---|
| P1 | Chaque soir, les meilleurs profils d'artisans réels du 13 sont trouvés et notés (fiche Google faible, pas de site…) | 23 et 24 oct. | Fait, prouvé : `essai-prospection` (122 contrôles, T34) |
| P2 | Ravalement : façadiers seulement ; un nom muet n'entre au lot que si la recherche web montre la façade comme métier principal | 29 oct. | Fait, prouvé : `essai-prospection` (12 cassures attrapées) |
| P3 | 30 sites par jour sur au moins 3 métiers, prêts avant les appels | 23 oct. | Partiel : chaîne faite (T37 à T40) ; couverture et peinture attendent leurs images (F18) ; T41 bloquée (F18, F19) |
| P4 | Page d'appels du jour sur l'iPhone de Fabrice : relances devant, résultat enregistré au doigt | 23 oct. | Fait, prouvé : `essai-appels` (79 contrôles) ; en ligne le 29 oct. |
| P5 | Aucun numéro de téléphone dans le registre ni dans la page d'appels | cadre légal ; `worker/appels.js` | Fait, prouvé : un corps qui en porte un est refusé |
| P6 | Ce qui bloque un métier ne bloque pas les autres | 23 oct. (« ce qui bloque ne doit pas être bloquant ») | Fait, prouvé : `essai-lot` |

---

## 6. L'app de l'artisan : les exigences

| N° | Exigence | Source | État et preuve |
|---|---|---|---|
| A1 | Se connecter avec l'identifiant (son e-mail) et le mot de passe que Fabrice lui donne, puis rester connecté sur son téléphone ; mot de passe oublié : Fabrice en pose un nouveau | 29 oct., 5 nov. | Fait, prouvé : `essai-app` (connexion), `essai-comptes` (création, nouveau mot de passe, contre des faux) ; réel : clé de service (F1) |
| A2 | ~~Voir ses chiffres de la semaine~~ | retiré de l'app (T61, décision du 5 nov. 2026) | Retiré : écran supprimé, données gardées pour l'export (A17) |
| A3 | ~~Lire les demandes laissées sur le site dans l'app~~ | retiré de l'app (T61, décision du 5 nov. 2026) | Retiré : écran supprimé, données gardées pour l'export (A17) |
| A4 | Créer un chantier, ajouter des paires avant / après et d'autres photos | 23 sept. | Fait, prouvé : `essai-app` (démonstration) |
| A5 | Accepter **toute** photo de tout appareil ; ce que le téléphone ne sait pas lire est dit à l'artisan et reste sur son téléphone ; refuser ce qui n'est pas une photo avec une phrase claire | 3 oct. | Fait, prouvé (T44) : `essai-app` (132 contrôles) |
| A6 | Ne jamais envoyer la position GPS ni l'appareil ; redresser la photo ; préparer sur le téléphone, avant l'envoi | plan 5.2 ; 29 oct. | Fait, prouvé pour les photos (T44) ; **vidéos : GPS encore dedans** (T46) |
| A7b | Envoyer aussi l'original en pleine résolution, après la version réduite, nettoyé de ses métadonnées sans perte | 9 oct. (« 3. OK ») | Fait, prouvé : `essai-app`, `droits-app.sql` |
| A7 | Ne perdre aucune photo si le réseau coupe ou si l'iPhone met l'app en veille | plan 5.3 | Fait, non prouvé : file IndexedDB, envoi TUS ; jamais sur vrai réseau (D-07) |
| A8 | Accepter et garder les vidéos, sans les montrer pour l'instant | 5 oct. | Fait, prouvé : `essai-app` |
| A9 | Le site se refabrique et se republie avec les nouvelles photos, sans jamais casser la version en ligne | 23 sept. ; plan 3.3 | voir S08 et S29 (exigence déplacée dans la partie site, numéro gardé) |
| A10 | Donner son téléphone, cocher « afficher mes prix », saisir ses tarifs (dans « Mon compte » depuis T61) | 2 oct. | Fait, prouvé : `essai-app` |
| A11 | Remplir ce que les mentions légales du site demandent (TVA, décennale, médiateur ; capital et adresse du médiateur à ajouter) | `docs/specs/S-MENTIONS.md` | Partiel : saisie prouvée (`essai-app`) ; champs manquants et affichage sur le site à faire (T50) |
| A12 | ~~Gérer son adresse et son domaine dans l'app~~ | retiré de l'app (T61, décision du 5 nov. 2026) | Retiré : écran supprimé, données gardées pour l'export (A17) |
| A13 | ~~Répondre aux avis Google dans l'app~~ | retiré de l'app (T61, décision du 5 nov. 2026) | Retiré : écran supprimé, données gardées pour l'export (A17) |
| A14 | ~~Voir sa fiche Google dans l'app~~ | retiré de l'app (T61, décision du 5 nov. 2026) | Retiré : écran supprimé, données gardées pour l'export (A17) |
| A15 | ~~Gérer son abonnement dans l'app~~ | retiré de l'app (T61, décision du 5 nov. 2026) | Retiré : écran supprimé, données gardées pour l'export (A17) |
| A16 | ~~App Android sur le Play Store, sans prix~~ | abandonné, décision du 5 nov. 2026 | Retiré : pas d'app Android |
| A17 | Télécharger toutes ses données | plan 7.5 (RGPD) | Fait, prouvé : `essai-app` |
| A18 | Supprimer son compte, avec 30 jours pour changer d'avis | plan 7.5 | Partiel : demande et annulation prouvées (`essai-app`) ; suppression effective écrite et essayée contre des faux (T12, `essai-suppressions`) ; pas encore lancée chaque nuit, résiliation Stripe réelle à T16 (D-16) |
| A19 | Installer l'app sur l'écran d'accueil depuis le site Sitô (iPhone, Android, ordinateur) | 5 oct., 5 nov. | Partiel : page d'installation et PWA faites ; non essayé sur un vrai iPhone |
| A20 | Essayer l'app sans compte (démonstration) | proposition de Claude | Fait, prouvé : `essai-app` |

---

## 7. Hors périmètre (pour l'instant)

| Sujet | Pourquoi |
|---|---|
| App dans l'App Store d'Apple | « pour Apple Store c'est compliqué » (5 oct.) : installation depuis le site |
| Montrer les vidéos sur le site | 5 oct. : gardées, montrées plus tard |
| Connexion par code (e-mail ou SMS) | remplacée par l'inscription par lien et mot de passe (29 oct.) |
| Serveur loué | 29 oct. : photos préparées dans l'app, sites publiés par GitHub Actions |
| Plusieurs entreprises par compte | la base le permet (`membres`), l'app prend la première |
| Notifications | pas encore demandées |
| Pages par commune servie | piste de référencement non décidée (`docs/specs/S-REFERENCEMENT.md` RS5) |
| Avis notés en données structurées sur le site de l'artisan | Google ne les recommande que pour un site qui parle d'autres entreprises |

## 8. Le modèle économique

| Élément | Valeur | Source |
|---|---|---|
| Abonnement mensuel | 39 € HT par mois, **sans engagement** | 9 oct. |
| Abonnement annuel | 390 € HT par an : la formule d'engagement | 9 oct. |
| Période d'essai | **14 jours** | 9 oct. |
| Séance photo | offerte avec l'annuel ; 90 € HT la visite avec le mensuel | 23 et 24 oct. |
| Domaine propre | inclus dans l'abonnement, au nom de l'artisan | 5 oct. |
| Adresse offerte | sous-domaine de Sitô, par défaut | 5 oct. |
| Paiement | Stripe Checkout et portail client, sur le web seulement | plan 7.6 |
| Facture électronique | plateforme agréée nécessaire (réception obligatoire depuis le 1er sept. 2026, émission PME au 1er sept. 2027) | plan 7.6 ; `docs/DETTE.md` D-12 |

## 9. Contraintes qui s'imposent

Toutes dans `docs/CONSTRAINTS.md` (C01 à C44), chacune avec sa source.

## 10. Comment on sait que c'est réussi

Chaque étape finit par une preuve (`06-PLAN-IMPLEMENTATION.md`,
`docs/REGLE-ESSAIS.md`). Pour le produit entier :

| Mesure | Cible |
|---|---|
| Un site d'abonné en ligne | indexable, mentions légales complètes, données structurées lues sans erreur critique par l'outil de test de Google |
| Un artisan change son téléphone sur iPhone | le site republié l'affiche |
| Un artisan ajoute une paire avant / après depuis un chantier | elle est sur son site, sans GPS, dans le bon sens, en moins de 3 minutes (T45) |
| Une publication | change de version sans mélange ; l'ancienne reste si un contrôle échoue |
| Les chiffres de l'accueil de l'app | égalent Umami et la base pour le même jour de Paris |
| 100 sites d'un même métier dans un département | tous différents, sur les vraies images (`capacite-unicite` sans `--photos plan`) |
| 16 métiers | tous prêts (`docs/specs/METIERS.md`) |
| Safari et vrais appareils | les vérificateurs et `essai-app` verts sous WebKit (T49) ; les essais manuels sur iPhone cochés (T30) |

## 11. Ouvert : à décider par Fabrice

| N° | Question | Recommandation de Claude |
|---|---|---|
| O1 | Nom définitif et domaine de Sitô (liste : `docs/noms-2026-10-05.md`) | choisir parmi ceux libres en .fr et .com, après vérification INPI ; repoussé le 29 oct. jusqu'à ce que l'app fonctionne |
| O4 | Artisan pilote pour l'accès Google | — (il le trouve) |
| O5 | Compte Google Play : personnel (12 testeurs pendant 14 jours) ou organisation (D-U-N-S) | organisation, si la micro-entreprise obtient un D-U-N-S ; repoussé le 29 oct. |
| O6 | Ordre des 13 métiers restants | `docs/specs/METIERS.md`, dernière section |
| O7 | Pages par commune servie (référencement) | ne pas les faire avant d'avoir des sites d'abonnés en ligne et mesurés |

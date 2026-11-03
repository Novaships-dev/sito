# Le parcours du visiteur sur le site d'un artisan

Écrit par Claude (Cowork) le 3 novembre 2026. `app/specs/03-APPFLOW.md` décrit
les parcours de l'**artisan** dans l'app ; rien ne décrivait ceux du
**visiteur** sur le site. Ce document les écrit tels que le générateur les
produit aujourd'hui (lu dans `generateur/composer.mjs`,
`generateur/archetypes/matiere.mjs`, `generateur/sections/`), et marque ce qui
manque. Les exigences citées (S01…) sont celles de `app/specs/01-PRD.md` §4.

## Qui est le visiteur

Un particulier, le plus souvent sur son téléphone, qui cherche un artisan de
ce métier près de chez lui (`app/specs/01-PRD.md` §3). Il veut savoir en
quelques secondes : **qui**, **quoi**, **où**, **est-ce sérieux**, **comment
le joindre**.

## La page, de haut en bas

| Ordre | Bloc | Ce que le visiteur y trouve | Fichier | Toujours là ? |
|---|---|---|---|---|
| 1 | Écran d'arrivée et d'ambiance | le titre de la page (seul `h1`), l'enseigne, la commune, l'image d'ouverture | `sections/arrivee.mjs`, `sections/atmosphere.mjs` | oui |
| 2 | Pastille du haut | l'enseigne et le bouton « Appeler » (numéro seul) | `sections/arrivee.mjs`, `sections/appel.mjs` | oui |
| 3 | Ouverture | enseigne, commune, année de création, mot géant, chapô | `composer.mjs` `ouverture()` | oui |
| 4 | Coupure | la photo avant / après qu'on glisse au doigt | `composer.mjs` `coupure()` | oui |
| 5 | Sections du milieu, dans un ordre tiré | le détail des postes (gestes), le chantier, les prix et l'estimateur (si l'artisan les affiche), les avis (si la charte les tire) | `composer.mjs`, `sections/prix.mjs`, `sections/avis.mjs` | ordre et présence tirés par la charte |
| 6 | Vérifiable | dénomination, SIREN, SIRET, forme, création, siège, activité, effectif, RGE, depuis Sirene | `composer.mjs` `verifiable()` | oui |
| 7 | Contact | le numéro en grand, l'adresse | `composer.mjs` `contact()` | oui |
| 8 | Comparateurs | d'autres paires avant / après | `composer.mjs` `comparateurs()` | oui |
| 9 | Barre d'appel | collée en bas sur téléphone | `sections/appel.mjs` | oui |
| 10 | Pied de page | enseigne, commune, mention « Proposition de site » | `composer.mjs` | oui (voir V-M3) |
| page 2 | « Le travail » | les gestes du métier en détail | `archetypes/matiere.mjs` | archétype `matiere` seulement (S-012) |

## Les parcours

| N° | Parcours | Étapes | Ce qui le prouve aujourd'hui | Ce qui manque |
|---|---|---|---|---|
| V1 | **Appeler tout de suite** | arrive (Google, fiche, lien) → lit l'enseigne et la commune au premier écran → touche « Appeler » dans la pastille ou la barre du bas → son téléphone compose | T1, T2 (`verifier-site`), O14 (`verifier-ordinateur`), M13 (`verifier-mobile`) | essai sur un vrai iPhone (Safari) ; comptage des appels (T22) |
| V2 | **Voir le travail avant d'appeler** | glisse la photo avant / après → lit le détail des postes → regarde le chantier → appelle | M7 à M11, O5 (comparateur au doigt et à la souris) | photos réelles de l'artisan à la place des exemples (S08, T45) |
| V3 | **Savoir combien ça coûte** | lit les tarifs de l'artisan → règle sa surface et coche ses postes dans l'estimateur → lit la fourchette → appelle | calcul vérifié dans un navigateur (`memoire/maintenant.md`, 2 oct.) | seulement si l'artisan affiche ses prix (C06) |
| V4 | **Laisser une demande** | remplit nom, téléphone, message → envoie → lit une confirmation ; l'artisan la voit dans l'app (A3) | rien : pas de formulaire | T10, T11, Q3 |
| V5 | **Vérifier que c'est sérieux** | lit la section « vérifiable » (SIREN, création, RGE) → lit les avis → ouvre les mentions légales | section « vérifiable » | mentions légales (T50, S-004) ; avis réels (S-024, A13, T24) |
| V6 | **Revenir plus tard** | retrouve le site sur Google par le nom ou « métier + commune » | rien | référencement (T51, S-003) |
| V7 | **Partager le site** | envoie le lien par message → le destinataire voit un titre et une image | rien | Open Graph (T51, R6) |

## Les règles que chaque parcours tient

| N° | Règle | Contrôle |
|---|---|---|
| V-R1 | Le moyen d'appeler est visible au premier écran, sur téléphone comme sur ordinateur | O14, M13 |
| V-R2 | Le contenu est visible même sans JavaScript (panne du 16 sept. sur iPhone) | O11 |
| V-R3 | Le comparateur marche au doigt et à la souris | M7 à M11, O5 |
| V-R4 | Rien n'est inventé : sans numéro, un emplacement désigné ; sans avis, aucun avis ; sans prix, pas de section prix | T1, `rules/common/ne-pas-fabriquer.md` |
| V-R5 | Aucun texte ne passe sous la pastille ou la barre d'appel | O15, M13 |
| V-R6 | Contraste d'au moins 4,6:1 sur chaque surface | A7, O13, M12 |

## Défauts relevés en écrivant ce document

| N° | Défaut | Constat |
|---|---|---|
| V-M1 | Les textes alternatifs des photos parlent de façade et d'enduit sur tous les métiers | S-023 |
| V-M2 | Un site d'abonné afficherait « Les avis viennent ici » au lieu d'avis | S-024 |
| V-M3 | Le pied de page dit « Proposition de site … les photographies sont des exemples » sur tous les sites, abonnés compris | S-022 |

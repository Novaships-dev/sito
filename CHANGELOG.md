# Ce qui a changé dans Sitô

Une ligne par changement livré, la plus récente en haut. Chaque tâche finie
ajoute la sienne (`docs/REGLE-TRACABILITE.md`). Le détail, les preuves et les
pannes sont dans `memoire/journal.md` ; ce fichier dit seulement **ce qui a
changé** pour Fabrice, pour un artisan ou pour Claude Code.

Reconstruit le 3 novembre 2026 par Claude (Cowork) à partir des entrées
datées de `memoire/journal.md` et des tâches « fait » de
`app/specs/07-TACHES.md`. Avant cette date, il n'existait pas.

## Novembre 2026

| Date | Changement |
|---|---|
| 3 nov. | Socle de pilotage ajouté par Cowork : table unique des chiffres (`docs/SOURCE-UNIQUE.md`), règles de traçabilité et d'essais, ce CHANGELOG, registre de la dette (`docs/DETTE.md`), registre des constats d'audit (`docs/audit/REGISTRE.md`, 21 constats), carte du dépôt générée (`scripts/carte-depot.mjs`), index des documents, vocabulaire, contraintes, sécurité, dépannage. `memoire/maintenant.md` réécrit. Tâches T47 à T53 ajoutées. |
| 3 nov. | T44 : les photos sont préparées dans l'app, sur le téléphone, avant l'envoi : version réduite redressée, original sans GPS ni appareil, aperçu des RAW ; ce qui est illisible est dit à l'artisan et n'est pas envoyé. T46 ajoutée : retirer aussi le GPS des vidéos. |

## Octobre 2026

| Date | Changement |
|---|---|
| 29 oct. | T43 : l'artisan s'inscrit une seule fois, par le lien que Fabrice lui envoie, avec son e-mail et un mot de passe ; plus aucun code. |
| 29 oct. | T42 : audit du dépôt et du PC à chaque fin de séance (doublons, fichiers morts, temporaires, place libre). |
| 29 oct. | T09 : la boucle du service refait, vérifie et publie par version chaque site changé. |
| 29 oct. | T05 : droits de la vraie base rejoués, conformes. |
| 29 oct. | T41, en partie : 6 façadiers du 13 et la page d'appels en ligne sur `sito-demo.pages.dev`, invisibles sur Google ; le ravalement ne retient plus que les façadiers. |
| 27 oct. | T08 : un site se fabrique depuis la base (entreprise, profil, tarifs, photos) ; sa charte ne change plus d'une fabrication à l'autre. |
| 26 oct. | T40 : la soirée de prospection se prépare de bout en bout (`/preparer-appels`). |
| 25 oct. | T37, T38, T39 : le lot du jour se fabrique, se publie en privé, et la page d'appels enregistre les résultats au doigt. |
| 24 oct. | T34, T35, T36 : extraction et note des artisans réels du 13 ; textes des sites de couverture et de peinture ; feuilles de prompts de leurs images. |
| 24 oct. | T01, T02, T06, T07 : outils de la machine installés, CI lisible depuis le PC, service relié à la base, photos reçues préparées. |
| 21 oct. | T00 : anciens dossiers `skills/` et `hooks/` retirés. |
| 11 oct. | `.env` et clé publique de l'app posés sur le PC ; lanceur d'installation de Claude Code. |
| 10 oct. | Claude Code travaille et se dépanne seul : 20 lancements par jour au plus, budget de 3 approches ou 45 minutes par panne. |
| 9 oct. | L'app de l'artisan existe (React, installable) : connexion, accueil, chantiers et photos, mon site, adresse, avis, fiche Google, abonnement, compte, installation. Spécifications 01 à 07 et liste de tâches pour Claude Code. |
| 5 oct. | Base complétée pour l'app (abonnements, demandes, adresses, versions, vidéos, Google, suppressions) ; préparation des photos de tout format ; publication par versions et Worker Cloudflare. |
| 2 oct. | Dépôt `sito` créé sur GitHub. Bouton « Appeler » sur les quatre archétypes ; prix et estimateur seulement sur les tarifs de l'artisan ; 100 sites d'un même métier tous différents dans un département ; base Supabase de douze tables. |
| 1er oct. | Photos, structure, textes, nuancier et comparateur diffèrent d'un voisin à l'autre. |

## Septembre 2026

| Date | Changement |
|---|---|
| 23 sept. | L'unicité devient mécanique : trois ravaleurs de Marseille avaient le même accent, le même fond et les mêmes polices. |
| 16 sept. | Le premier écran devient visible sur iPhone même sans JavaScript. |
| 9 sept. | Le plancher d'une page devient vérifiable (`scripts/verifier-site.mjs`) ; les images d'exemple sont marquées. |
| 8 sept. | Les quatre premiers skills écrits (rédaction, audit de design, prospection, veille). |
| 7 sept. | Création, dans le dépôt Atelier. |

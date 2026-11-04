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
| 4 nov. | T12 : `atelier/supprimer-comptes.mjs` efface un compte 30 jours après sa demande de suppression, si elle n'est pas annulée : site retiré, photos et données effacées, abonnement résilié (jamais d'effacement d'un abonné tant que Stripe n'est pas branché) ; essai `essai-suppressions.mjs`. |
| 4 nov. | T53 : la suite d'essais refuse une tâche « fait » sans ligne de CHANGELOG ni section de journal du même jour avec `TRACAGE` (`scripts/verifier-tracabilite.mjs`), et une carte du dépôt périmée. |
| 4 nov. | T52 : deuxième page « le travail en détail » sur les archétypes panneau, planche et elevation (`generateur/sections/page-travail.mjs`), titre de la deuxième page lisible sur téléphone (S-025), phrase du métier plus écrite « ravalement » en dur ; pastille du premier écran sur fond opaque (contraste O13 sur photo claire) ; `essai-navigateurs` juge la deuxième page. |
| 4 nov. | T46 : l'app retire la position GPS des vidéos avant l'envoi, sans les réencoder (`app/src/video.ts` : `©xyz`, `loci`, clés QuickTime `location`) ; essai `essai-video-gps.mjs` et contrôles dans `essai-app.mjs`. |
| 4 nov. | T45 (sans le réel) : `scripts/refaire-site.mjs` et `.github/workflows/refaire-site.yml` refont et publient un site d'abonné sur Cloudflare Pages (`atelier/publier-pages.mjs`) ; déclencheur de la base vers GitHub (pg_net, jeton au coffre) ; `lanceurs/SECRETS_GITHUB.bat` ; essai `essai-refaire-site.mjs`. Bloquée sur F21 pour le réel. |
| 4 nov. | T60 : `scripts/prospection/photos-artisan.mjs` (`--ranger`, `--fabriquer`) et `docs/PROCEDURE-PHOTOS.md` : les photos reçues par mail ou WhatsApp deviennent le site d'abonné, sur le modèle de l'artisan ; refus tant que le dépôt est public (F20). Essai `essai-photos-artisan.mjs`. |
| 4 nov. | T56 : sur un site d'abonné, la section des avis montre les avis réels de la table `avis` (texte exact, note seulement si donnée) ou n'existe pas ; contrôle R-AVIS ; essai `essai-avis.mjs`. |
| 4 nov. | T55 : textes alternatifs et légendes des photos tirés du fichier du métier (`alt`, nouveau `legendesPhotos`) ; plus aucun texte de façade écrit en dur ; contrôle R-ALT ; essai `essai-alt.mjs`. T60 bloquée sur Q6. |
| 4 nov. | T59 : `scripts/prospection/accepter.mjs` : l'artisan qui accepte garde son modèle, un nouveau le remplace ; conflit du même modèle accepté deux fois ; la préparation du soir réserve les modèles des artisans passés « essai lancé » ou « abonné ». Essai `essai-accepter.mjs`. |
| 4 nov. | T58 : le lot du jour se fabrique sur les modèles libres du métier (`fabriquer-lot.mjs`, `repartir`) ; le modèle est noté au registre des appels ; sur un modèle, aucun voisin ne change le tirage ; plus de contrôle d'unicité du lot. `essai-lot.mjs` fabrique un vrai lot sur des images de synthèse. |
| 4 nov. | T57 : modèles de prospection. `--graine` dans le générateur ; `scripts/prospection/modeles.mjs` tire et vérifie 10 modèles par métier ; `prospection/modeles/` (ravalement, couverture, peinture) ; essai `essai-modeles.mjs`. |
| 4 nov. | Décision de Fabrice : modèles de prospection (`docs/specs/S-MODELES.md`, T57 à T60, Q6). |
| 4 nov. | T54 : sur un site d'abonné, les photos sont celles de l'artisan : ni « Exemple » dans les textes alternatifs, ni marqueur, ni note « Photographies d'exemple ». Contrôle R-EXEMPLE dans `verifier-site`. |
| 3 nov. | T49 : Safari (WebKit) dans la CI, pour les sites (`essai-navigateurs.mjs`) et l'app ; `--navigateur webkit` dans `verifier-mobile`, `verifier-ordinateur`, `essai-app`. Corrigés : images de la deuxième paire absentes (16 fichiers), WebP proposé en plus de l'AVIF, débordement d'elevation, boutons du comparateur recouverts sur panneau, file d'envoi de l'app, lien d'inscription sous WebKit. Nouveau contrôle R-FICHIER. Contre-essais d'échappement, mentions, référencement dans la CI. |
| 3 nov. | T51 : référencement. Prospection : `noindex` dans la page. Abonné : URL canonique, Open Graph, JSON-LD du métier, `robots.txt` qui autorise, `sitemap.xml` ; icônes et image de partage pour tous ; `--adresse` lue dans `adresses`. Contrôles R-REGIME, R-OG, R-JSONLD, R-SITE dans `verifier-site` ; essai `essai-referencement.mjs`. |
| 3 nov. | T50 : mentions légales sur chaque site d'abonné (page, lien de pied de page, médiateur près du contact) ; fabrication refusée si une mention obligatoire manque ; contrôle ML de `verifier-site` ; quatre champs de plus dans `profils` (migration appliquée) et dans l'écran « Compte » ; essai `essai-mentions.mjs`. Un site fabriqué depuis la base l'est désormais avec `--publication`. |
| 3 nov. | T48 : un seul échappement pour le générateur (`generateur/echapper.mjs`, `& < > " '`, plus un échappement JSON pour T51) ; nouvel essai `essai-echappement.mjs` dans la suite, avec son contre-essai. L'ancienne fonction laissait un nom d'entreprise injecter un attribut. |
| 3 nov. | T47 : la suite d'essais dit « NON LANCÉ » pour l'essai de l'app quand exiftool ou ffmpeg manque, au lieu de planter. |
| 3 nov. | Lot 2 (produit) par Cowork : PRD réécrit avec le site d'abord (S01 à S31, P1 à P6, A1 à A20 gardées) ; spécifications des mentions légales et du référencement, sourcées (Service Public, Code de la consommation, Google) ; parcours du visiteur ; fiche des 16 métiers. Lignes périmées du TRD et du plan corrigées. 3 constats nouveaux (S-022 à S-024) et leurs tâches T54 à T56. Q5 répondue : les tâches de l'audit passent avant le reste de l'app. |
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

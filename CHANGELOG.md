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
| 6 nov. 2026 | Page de MonSiteArtisan.com (nouveau nom, décision du 6 nov.) : panneau de chantier en haut, offre en devis (80 € par mois avec 1 mois offert et 12 mois d'engagement, ou 720 € l'année), 3 artisans vitrines, étapes, app, questions, bouton WhatsApp (numéro à venir). À l'adresse de l'app pour qui n'est pas connecté ; l'app installée va droit à la connexion. Police servie par le site. Nom changé dans l'app et les mentions des sites. |
| 5 nov. 2026 | Nettoyage 2 : Fabrice crée les comptes (décision du 5 nov.). `atelier/comptes.mjs` et `lanceurs\COMPTE_ARTISAN.bat` : e-mail + SIREN, entreprise lue dans l'annuaire public, mot de passe tiré au sort affiché une fois ; nouveau mot de passe par la même voie. Inscription par lien retirée de l'app et du dépôt (écran, fonction Edge `inscription`, essais) ; table `invitations` à retirer par Fabrice (F23). |
| 5 nov. 2026 | Nettoyage 1 : plus d'app Android (décision de Fabrice du 5 nov.). L'app s'installe sur l'écran d'accueil depuis le site Sitô ; mode Play Store, `assetlinks.json` et leurs essais retirés ; T28 et T29 abandonnées, Q8 et F12 sans objet. |
| 5 nov. | T24 : Google. Jeton chiffré (AES-256-GCM, SIREN lié) rangé par trois fonctions réservées au service ; liaison par consentement (fonctions Edge `google-lien`, `google-retour`, état signé) ; chaque nuit, avis importés et réponses validées publiées (`atelier/avis.mjs`, `google.yml`) ; bouton « Relier ma fiche Google ». |
| 5 nov. | T22 : statistiques. Client Umami, import de la nuit (jour de Paris, demandes gardées, rejouable), site Umami créé pour chaque abonné, script et événement « Appeler » dans les pages d'abonnés, mentions légales et contrôle R-MESURE ; migration `sites.umami_id` ; `statistiques.yml`. |
| 5 nov. | T20 : écran Mon adresse, cas B (chercher, réserver au nom de l'artisan, abonnement en cours, .fr ou .com) et C (brancher son domaine, CNAME guidé, vérifier) ; fonction Edge `domaines` (écrite, pas déployée) ; les clients de T19 passent dans `supabase/functions/_shared/`. |
| 5 nov. | T28 : app Android préparée, `scripts/android.mjs` écrit `twa-manifest.json` (Bubblewrap, ouverture sur `/?source=android`) et `.well-known/assetlinks.json` ; le Worker et la publication laissent passer ce seul fichier caché ; `essai-android` et son contre-essai. |
| 5 nov. | T19 : clients des domaines contre des faux serveurs, Gandi v5 (vérifier, acheter au nom de l'artisan avec sa confirmation, renouveler, code de transfert, redirection vers www) et Cloudflare for SaaS (hostname, état, recréation après 7 jours) ; `essai-domaines` et son contre-essai. |
| 5 nov. | T32 faite (13 sur 13) : textes du paysagiste (`generateur/metiers/paysagiste.json`) ; les 16 métiers ont leurs textes, 100 sites différents par département pour chacun. Libellés NAF des 9 codes APE qui n'en avaient pas (`generateur/sirene.mjs`), contrôlés par `verifier-depot`. |
| 5 nov. | T32 (12 sur 13) : textes de la piscine (`generateur/metiers/piscine.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 5 nov. | T32 (11 sur 13) : textes du parquet et des sols souples (`generateur/metiers/parquet.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 5 nov. | T32 (10 sur 13) : textes de l'étanchéité des toitures-terrasses (`generateur/metiers/etancheite.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 5 nov. | T32 (9 sur 13) : textes du terrassement et des VRD (`generateur/metiers/terrassement.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 5 nov. | T32 (8 sur 13) : textes de la métallerie, serrurerie et portails (`generateur/metiers/metallerie.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 5 nov. | T32 (7 sur 13) : textes de l'isolation par l'extérieur (`generateur/metiers/isolation.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 5 nov. | T32 (6 sur 13) : textes de la plâtrerie et des cloisons (`generateur/metiers/platrerie.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 5 nov. | T32 (5 sur 13) : textes de l'électricité (`generateur/metiers/electricite.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 5 nov. | T11, complément : la clé publique de Supabase est écrite dans `refaire-site.yml` et `.env.example` (elle n'est pas un secret) ; Fabrice n'a plus à la poser, F21 perd une étape. |
| 4 nov. | T32 (4 sur 13) : textes de la plomberie et du chauffage (`generateur/metiers/plomberie.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 4 nov. | T32 (3 sur 13) : textes du carrelage et de la faïence (`generateur/metiers/carrelage.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 4 nov. | T32 (2 sur 13) : textes de la menuiserie et des fenêtres (`generateur/metiers/menuiserie.json`) ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 4 nov. | T11 : les sites d'abonnés ont un formulaire de demande (quatre archétypes), qui écrit dans la base par `deposer_demande` ; la page des mentions légales dit ce qu'il recueille ; `verifier-site` refuse un formulaire sans champ piège, sans étiquettes ou avec une clé secrète (R-FORM). En ligne dès que `SUPABASE_CLE_PUBLIQUE` est posée (F21). |
| 4 nov. | T10 : la base reçoit les demandes du formulaire d'un site d'abonné (`deposer_demande`) : robots écartés sans rien écrire, 10 demandes par jour et par adresse, 50 par site, adresse IP jamais gardée en clair, demande comptée dans les statistiques du jour. |
| 4 nov. | T32 (1 sur 13) : textes de la maçonnerie générale (`generateur/metiers/maconnerie.json`), au volume des trois premiers métiers ; prix nationaux sourcés ; 100 sites différents dans un département. |
| 4 nov. | T17 : l'écran Abonnement, sur le web, ouvre le paiement Stripe ou le portail (carte, factures, formule, résiliation) et affiche le retour ; rien dans l'app Android. |
| 4 nov. | T16 : le paiement Stripe est écrit (fonctions Edge `stripe-webhook` et `stripe-session`, logique `supabase/functions/_shared/stripe.ts`) et essayé contre un faux Stripe ; rien n'est déployé ni ouvert tant que le compte Stripe n'existe pas (F7). La suppression d'un compte résilie l'abonnement dès que la clé Stripe est là. |
| 4 nov. | T31 : les codes APE de chaque métier n'ont plus qu'une source (`prospection/metiers.json`), recopiée dans le générateur et le plan d'images ; `verifier-depot` refuse un écart ; les sites nomment l'activité pour l'isolation, la charpente et l'étanchéité. |
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

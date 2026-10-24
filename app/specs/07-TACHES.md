# 07 — Tâches : la liste de travail de Claude Code

Version du 9 octobre 2026. Une ligne par tâche. Claude Code la lit à chaque
tour (crochets `.claude/hooks/`), prend la tâche « en cours » ou la première
« à faire » dont les dépendances sont « fait », et met l'état à jour.

**États** : `à faire`, `en cours`, `fait`, `bloqué`. Rien d'autre (le crochet
de fin lit cette colonne). Une tâche « bloqué » cite dans « Bloqué par » le
numéro de l'action de Fabrice (`memoire/actions-fabrice.md`).

**Preuve** : la commande qui doit être verte, plus `node scripts/essais.mjs` à 0
pour toute tâche. Un nouveau contrôle est essayé une fois sur une copie cassée.

Les étapes 1 à 4 du plan (base, photos, publication, app en démonstration)
sont faites et prouvées : voir `06-PLAN-IMPLEMENTATION.md`.

## Rangement et machine

| N° | Tâche | État | Preuve | Dépend | Bloqué par |
|---|---|---|---|---|---|
| T00 | Supprimer `skills/` et `hooks/` (copiés le 9 oct. dans `.claude/skills/` et `.claude/hooks/`) avec `git rm -r`, puis corriger les liens restants (`README.md`, `rules/common/00-index.md`, `docs/historique` exclu) | fait | `node scripts/verifier-depot.mjs .` à 0 ; plus aucun lien vers `hooks/*.sh` hors de `docs/` et `memoire/` | | |
| T01 | Outils de la machine : vérifier `exiftool`, `ffmpeg`, Python + Pillow + pillow-heif, Chromium de Playwright (`npx playwright install chromium`). Installer ce qui manque sans droits d'administrateur (pip --user, npx) ; sinon action de Fabrice précise | fait | `node scripts/essais.mjs` sort 0 (et non 4) sur l'ordinateur de Fabrice | T00 | |
| T02 | Vérifier que la CI GitHub (`.github/workflows/essais.yml`) est verte sur le dernier envoi (`gh run list --workflow essais.yml`, ou la page Actions si `gh` est absent) ; corriger ce qui ne passe que sur une machine | fait | `node scripts/ci-github.mjs --ecrire` à 0 : dernier passage vert, écrit dans `memoire/essais/derniers.txt` | T01 | |

## Prospection (priorité de Fabrice du 23 oct. : avant le reste de l'app)

Spécification : `app/specs/08-PROSPECTION.md`. But : chaque matin à 7 h, 30 sites
en ligne sur des liens privés et la page d'appels du jour sur l'iPhone de Fabrice.

| N° | Tâche | État | Preuve | Dépend | Bloqué par |
|---|---|---|---|---|---|
| T34 | Extraction et qualification : `scripts/prospection/extraire.mjs` et `qualifier.mjs` (API recherche-entreprises, 13, 3 métiers, filtres, note, registre `prospection/registre.json`) | fait | `node scripts/essai-prospection.mjs` : 93 contrôles, 0 faute, sur 693 entreprises réelles enregistrées (sans réseau) ; contre-essai : 7 fautes posées une par une, dont le paramètre mal écrit, chacune attrapée seule | | |
| T35 | Textes à coller dans ChatGPT pour couverture et peinture (`banque/prompts/couverture.md`, `peinture.md`, 32 images chacun, noms de fichiers) + vérificateur d'images d'un métier (nom, taille, paires alignées) | fait | `node scripts/verifier-images.mjs ravalement` : 32 images attendues, 0 faute (3 remarques sur les signes, 1 254 px) ; `--prompts` : 3 feuilles, 0 faute, après correction de 13 largeurs périmées dans `ravalement.md` ; contre-essais : 5 cassures sur les fichiers et 5 sur les feuilles, chacune attrapée seule. Les images elles-mêmes attendent F18 | | |
| T36 | Textes des sites couverture et peinture (`generateur/metiers/couverture.json`, `peinture.json`, au volume du ravalement) | fait | `node scripts/capacite-unicite.mjs --metier couverture --photos plan` et `--metier peinture` : **100 sites, 0 défaut** (U1 à U4), y compris `--communes une` ; essai à blanc : un site de chaque métier composé et passé à `verifier-site` (0 bloquant) | | |
| T37 | Fabrication du lot : `scripts/prospection/fabriquer-lot.mjs`, 10 sites par métier prêt, mode prospection (photos d'illustration), contrôles du générateur | à faire | lot de 10 ravalement fabriqué et vérifié ; un métier sans images est sauté avec un message clair | T34 | |
| T38 | Publication privée : `scripts/prospection/publier.mjs` (Cloudflare Pages gratuit, projet `sito-demo`, slugs aléatoires, `noindex`, images partagées, retrait à 30 jours) + `lanceurs/CLE_CLOUDFLARE.bat` | à faire | essai sur faux Cloudflare local vert ; contre-essai (noindex retiré) rouge | T37 | |
| T39 | Page d'appels du jour (iPhone) et enregistrement des résultats (fonction Pages + KV gratuit), relances, point de la semaine | à faire | essai navigateur 390 px : boutons, résultat enregistré puis relu | T38 | |
| T40 | `/preparer-appels` (skill) + `lanceurs/PREPARER_APPELS.bat` : la soirée de bout en bout (liste, recherche web des sites existants, fabrication, publication, page d'appels) | à faire | essai à blanc sur faux Cloudflare : 30 sites et la page produits | T39 | |
| T41 | Première vraie publication sur Cloudflare et premier lot réel | bloqué | la page d'appels s'ouvre sur l'iPhone de Fabrice, 30 liens qui s'ouvrent, invisibles sur Google | T40 | F5 |

## La vraie base

| N° | Tâche | État | Preuve | Dépend | Bloqué par |
|---|---|---|---|---|---|
| T03 | Créer le compte d'essai dans la vraie base | bloqué | `node scripts/compte-essai.mjs --verifier` à 0 | | F1 |
| T04 | Essai de bout en bout contre la vraie base : `scripts/essai-app-reel.mjs`. L'app tourne en local avec `app/.env.local`, Playwright se connecte au compte d'essai (code obtenu par l'API d'administration `generate_link`, sans lire de boîte mail), change le téléphone, crée un chantier, envoie une photo (TUS) puis son original ; le script relit la base et le stockage (REST, clé de service) et nettoie | à faire | le script vert ; une copie cassée de `donnees/supabase.ts` (mauvaise colonne) le fait rougir | T03 | |
| T05 | Essais de droits rejoués après la dernière migration (`droits.sql`, `droits-app.sql` via MCP `execute_sql`) et conseillers Supabase (`get_advisors`) sans alerte nouvelle | bloqué | aucune ligne « FAUTE » ; avis copiés dans le journal | | F17 |

## Le service atelier

| N° | Tâche | État | Preuve | Dépend | Bloqué par |
|---|---|---|---|---|---|
| T06 | Adaptateur Supabase du service (`atelier/supabase.mjs`, REST + stockage, clé dans `apikey`) avec son faux serveur | fait | `node scripts/essai-service.mjs` vert (28 contrôles), contre-essai rouge (22 fautes) | | |
| T07 | Préparation des photos reçues : photos `recue` → image maîtresse (`atelier/photos.mjs`, HEIC par `atelier/heic.mjs`) → `chemin`, `largeur`, `hauteur`, `etat = prete` ou `illisible` + motif | fait | `node scripts/essai-preparation.mjs` : 77 contrôles, 0 faute (JPEG d'iPhone, HEIC fabriqué, PDF renommé, vidéo, JPEG coupé ; états, octets posés et métadonnées mesurés) ; contre-essai : 3 fautes posées une par une, chacune attrapée | T06 | |
| T08 | Fabriquer un site depuis la base : le générateur lit entreprise, profil, tarifs, photos prêtes (au lieu de `donnees/`) ; la charte reste figée (`sites.charte`) | à faire | essai : un site fabriqué depuis un faux jeu de données passe `verifier-site` ; un deuxième passage avec une photo de plus garde la même charte | T06 | |
| T09 | Boucle du service : à chaque changement (photo prête, profil, tarifs), refabriquer, vérifier, publier par version (`atelier/publier.mjs`), noter `fabrications` et `versions_site` | à faire | essai de bout en bout sur faux Supabase + stockage dossier : une photo ajoutée se retrouve dans la version suivante ; une version refusée ne remplace rien | T07, T08 | |
| T10 | Serveur HTTP du service (`atelier/serveur.mjs`) : `GET /sante`, `POST /demandes` (formulaire des sites : champ piège, limite par adresse IP, écrit `demandes` et compte `statistiques.demandes` du jour de Paris) | à faire | essai HTTP local : demande valide écrite, robot refusé, 11e envoi d'une même IP refusé | T06 | |
| T11 | Formulaire de demande dans les quatre archétypes du générateur, relié à `POST /demandes` | à faire | `fabriquer-demo` + `verifier-site`, `verifier-mobile`, `verifier-ordinateur` à zéro ; essai d'envoi | T10 | |
| T12 | Suppression des comptes à l'échéance : `suppressions.effective_le` dépassée et non annulée → site retiré, photos et données effacées, Stripe résilié | à faire | essai sur faux Supabase : compte effacé, compte annulé intact | T06 | |
| T13 | Adaptateurs Cloudflare réels : R2 (stockage des versions) et KV (adresses), même interface que `stockageDossier` / `adressesFichier` ; essai local avec Miniflare (paquet npm) | à faire | `essai-publication` rejoué sur les adaptateurs Miniflare | | |
| T14 | Déploiement réel du Worker et du site de démonstration sur `x.<domaine-sito>` | bloqué | une version cassée exprès est refusée, l'ancienne reste en ligne | T13 | F5, F6 |
| T15 | Hébergement du service (exiftool, ffmpeg inclus) | bloqué | `GET /sante` répond depuis Internet | T10 | F9 |

## Abonnement, domaines, statistiques, Google

| N° | Tâche | État | Preuve | Dépend | Bloqué par |
|---|---|---|---|---|---|
| T16 | Stripe : Checkout, portail, webhook (signature vérifiée), une seule fonction écrit `abonnements`, rejeu sans double écriture ; essai sur faux Stripe | à faire | essai local : paiement simulé, rejeu, événement inconnu sans accès | T06 | |
| T17 | Écran Abonnement relié (web seulement) : boutons Checkout et portail ; rien dans l'app Android | à faire | `essai-app` : boutons présents sur le web, absents en mode Android | T16 | |
| T18 | Stripe en mode test réel (clés de test) | bloqué | paiement test, prix affiché = prix débité | T16 | F7 |
| T19 | Domaines : client Gandi v5 (vérifier, acheter au nom de l'artisan, renouvellement, code de transfert, redirection) et Cloudflare for SaaS (custom hostname, état, recréation à 7 jours), avec faux serveurs | à faire | essais locaux des deux clients | | |
| T20 | Écran Mon adresse, cas B et C reliés au service | à faire | `essai-app` : recherche, confirmation, CNAME guidé (sur faux service) | T19 | |
| T21 | Domaines en réel (bac à sable Gandi, puis zone Cloudflare) | bloqué | un domaine d'essai branché, certificat valide, `https://domaine.fr` redirigé | T19 | F5, F8 |
| T22 | Statistiques : import nocturne Umami → `statistiques` (jour de Paris), événement « Appeler » dans les sites | à faire | essai sur faux Umami : chiffres de l'accueil = source pour un même jour de Paris | T06 | |
| T23 | Umami en réel | bloqué | chiffres réels d'un site d'essai | T22 | F9 |
| T24 | Google : OAuth, jeton chiffré (`prive.jetons_google`), avis (`reviews.list`, `updateReply`) et fiche, avec faux serveur Google | à faire | essai local : avis importés, réponse validée publiée, jeton jamais en clair | T06 | |
| T25 | Google en réel | bloqué | un avis réel lu, une réponse publiée avec l'accord de l'artisan pilote | T24 | F13 |
| T26 | E-mail des codes de connexion par un serveur d'envoi (SMTP Supabase) | bloqué | 20 codes en une heure arrivent | | F10 |

## Installation de l'app

| N° | Tâche | État | Preuve | Dépend | Bloqué par |
|---|---|---|---|---|---|
| T27 | Hébergement de l'app (PWA) sur l'infrastructure Cloudflare de Sitô | bloqué | l'app s'ouvre depuis Internet et s'installe | T14 | F5, F6 |
| T28 | Android : configuration TWA (Bubblewrap), `assetlinks.json`, `?source=android` | à faire | fichiers prêts, essai de `assetlinks.json` servi par le Worker | | |
| T29 | Android : construction et publication Play Store | bloqué | app installée depuis le Play Store, sans prix | T28, T27 | F12 |
| T30 | Essais sur vrais appareils : iPhone (Safari, HEIC, ProRAW, Live Photo, zones sûres, envoi coupé puis repris) et Android | bloqué | fichiers du plan 5.4 passés depuis chaque appareil | T04 | F14 |

## Les sites

| N° | Tâche | État | Preuve | Dépend | Bloqué par |
|---|---|---|---|---|---|
| T31 | Aligner les codes APE du ravalement entre `ravalement.json` et `plan-images.json` | à faire | `verifier-depot` + `fabriquer-demo --rapide` (si images) | | |
| T32 | Textes des 13 métiers restants, au volume du ravalement (fragments combinés), un métier par sous-tâche dans le journal (ravalement, couverture et peinture sont faits) | à faire | `node scripts/capacite-unicite.mjs --photos plan` : 100 sites sans défaut pour chaque métier | | |
| T33 | Images des métiers : les 22 du ravalement, puis 54 par métier | bloqué | `capacite-unicite` sans `--photos plan` | | F15 |

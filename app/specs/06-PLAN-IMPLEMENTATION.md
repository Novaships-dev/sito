# 06 — Plan d'implémentation

Version du 9 octobre 2026. Repris de `app/PLAN-APP.md` section 9, mis à jour
avec ce qui est fait. Le découpage en tâches que Claude Code exécute est dans
`07-TACHES.md`. **Chaque étape finit par une preuve, pas par une
affirmation.** Rien de payant ne s'ouvre sans l'accord de Fabrice.

États : **Fait, prouvé** / **Fait, non prouvé** / **À faire** / **Ouvert**.

---

## 1. Où on en est

| Bloc | État |
|---|---|
| Générateur de sites (4 archétypes, unicité à 100 sites, 5 vérificateurs) | Fait, prouvé — ravalement seulement |
| Base Supabase (21 tables, droits, stockage) | Fait, prouvé |
| Préparation des photos côté service | Fait, prouvé (fichiers fabriqués) |
| Publication par versions + Worker | Fait, prouvé (R2/KV simulés) |
| App (12 écrans, démonstration, file d'envoi) | Fait, prouvé en démonstration |
| Tout ce qui touche un service extérieur réel | À faire |

## 2. Les étapes

| # | Étape | Contenu | Fini quand (preuve) | Dépend de | Qui | État |
|---|---|---|---|---|---|---|
| 1 | Base | 21 tables, sécurité par ligne, droits par colonne, stockage, jour de Paris | `droits.sql` et `droits-app.sql` conformes | — | Claude | **Fait, prouvé** |
| 2 | Photos (service) | `atelier/photos.mjs`, `heic.mjs` | `essai-photos` : 18 cas, 0 faute ; contre-épreuve attrapée | — | Claude | **Fait, prouvé** (HEIC Supabase non prouvé) |
| 3 | Publication par versions | `atelier/publier.mjs`, `worker/routeur.js` | `essai-publication` : 19 essais, 0 faute ; 2 contre-épreuves | — | Claude | **Fait, prouvé** (simulé) |
| 4 | App en démonstration | écrans, données démo, photos sur l'appareil, file d'envoi | `essai-app` : 96 contrôles, 0 faute, 3 appareils ; original en pleine résolution envoyé ; contre-essai 12/12 ; copie cassée attrapée | — | Claude | **Fait, prouvé** |
| 5 | App contre la vraie base | compte d'essai, compte créé par Fabrice (`atelier/comptes.mjs`, décision du 5 nov. 2026), connexion par mot de passe, profil, tarifs, chantier, envoi TUS | Fabrice se connecte sur son ordinateur puis sur iPhone ; un chantier et une photo apparaissent dans la base | 4 ; action F1 de `memoire/actions-fabrice.md` (clé secrète) | Fabrice + Claude | **À faire** |
| 6 | Nom et domaine de Sitô | choix, vérification INPI / Pappers, achat | domaine enregistré au nom de l'éditeur | décision O1 | Fabrice | **Ouvert** |
| 7 | Cloudflare | zone, Workers payant, R2, KV, déploiement du Worker, adaptateurs réels | le site de démonstration en ligne à `x.domaine-sito.fr` ; une version cassée exprès est refusée et l'ancienne reste | 6 ; accord pour 5 $/mois | Claude (Fabrice ouvre le compte) | **À faire** |
| 8 | Service HTTP | `atelier/serveur.mjs` : inscrire, préparer les photos, refabriquer, publier | une photo envoyée depuis l'app est sur le site en moins de 2 minutes, sans mélange de versions | 5, 7 ; clé de service dans le `.env` local | Claude | **Abandonné** le 29 oct. (pas de serveur loué, décision de Fabrice) : remplacé par T44 (photos dans l'app, faite) et T45 (GitHub Actions) |
| 9 | Hébergement du service | Railway ou équivalent ; exiftool, ffmpeg | le service tourne sans l'ordinateur de Fabrice | 8 ; prix à relever et accord | Claude | **Abandonné** le 29 oct. (pas de serveur loué, décision de Fabrice) : remplacé par T44 (photos dans l'app, faite) et T45 (GitHub Actions) |
| 10 | Formulaire et demandes | formulaire sur les 4 archétypes, champ piège, limite par IP | une demande du site arrive dans l'app ; un robot est refusé | 8 | Claude | **À faire** |
| 11 | Statistiques | Umami hébergé, un site par artisan, événement « Appeler » ; import nocturne | les chiffres de l'accueil égalent Umami et la base pour le même jour de Paris | 9 | Claude | **À faire** |
| 12 | E-mail de connexion | serveur d'envoi (Brevo ou équivalent) | 20 codes envoyés en une heure arrivent | 6 ; prix et accord | Claude | **À faire** |
| 13 | Supabase Pro | offre Pro ; espace photos à 150 Mo ; conversion HEIC | un HEIC envoyé depuis Android devient une photo prête | décision du 5 oct. : au premier client | Fabrice | **À faire** |
| 14 | Domaines (cas B et C) | compte Gandi revendeur, API v5, Cloudflare for SaaS | un domaine d'essai acheté et un domaine existant branchés, certificat valide, `https://domaine.fr` redirigé vers `www` | 7 ; accord (revendeur irréversible) | Claude | **À faire** |
| 15 | Abonnement | Stripe Checkout, portail, webhook, une seule fonction d'écriture | paiement test ; événement rejoué sans double écriture ; prix affiché = prix débité | 8 ; compte Stripe | Claude | **À faire** |
| 16 | Facture électronique | plateforme agréée (ex. Billit) | facture test émise au format exigé | 15 | Claude | **À faire** (avant le 1er sept. 2027) |
| 17 | Compte : fin de vie | suppression effective à 30 jours, export complet | suppression annulée puis menée à terme sur un compte d'essai | 8 | Claude | **À faire** (app faite) |
| 18 | ~~Play Store~~ | abandonné (décision du 5 nov. 2026) : l'app s'installe depuis le site Sitô | — | — | — | **Abandonné** |
| 19 | iPhone | essai réel : installation, HEIC, ProRAW, Live Photo, zones sûres, envoi coupé puis repris | les fichiers du plan 5.4 passent tous depuis un iPhone | 5 ; photos réelles F4 | Fabrice + Claude | **À faire** |
| 20 | Google | demande d'accès, consentement, avis, réponses, fiche | un avis réel lu et une réponse publiée avec l'accord de l'artisan pilote | artisan pilote (O4), domaine et e-mail de Sitô | Fabrice + Claude | **À faire** |
| 21 | Les 15 autres métiers | textes, images (54 par métier), plan d'images | `capacite-unicite` : 100 sites différents par métier et département | images générées par Fabrice | Fabrice + Claude | **À faire** |

Les étapes 1 à 19 n'attendent pas Google.

## 3. Ce que Fabrice fait

**Attention** : les numéros F de ce tableau datent du 9 octobre et ne sont pas
ceux qui font foi. La liste à jour, avec ses numéros, est
`memoire/actions-fabrice.md` (corrigé le 3 nov. 2026, constat S-011).

| N° | Action | Pour l'étape |
|---|---|---|
| F1 | Créer `app\.env.local` (copier `.env.example`, coller la clé publique) | 5 |
| F2 | Créer son utilisateur dans Supabase (Authentication → Users → Add user) | 5 |
| F3 | ~~Mettre `{{ .Token }}` dans le modèle d'e-mail « Magic Link » de Supabase~~ : **inutile** depuis le 29 oct. (plus de code de connexion, T43) | 5 |
| F4 | Envoyer 4 ou 5 vraies photos : iPhone HEIC, Live Photo, ProRAW, Android | 19 |
| F5 | Choisir le nom (INPI, Pappers) | 6 |
| F6 | Demander le numéro D-U-N-S (compte Google Play organisation) | 18 |
| F7 | Trouver l'artisan pilote | 20 |
| F8 | Générer les 22 images du ravalement | 21 |
| F9 | Supprimer les projets Supabase AgentShield et auto-conseil | — |
| F10 | Lancer `lanceurs\POUSSER.bat` après chaque livraison | toutes |

## 4. Les coûts à accepter, dans l'ordre

| Quand | Quoi | Coût relevé (3 oct.) |
|---|---|---|
| étape 6 | domaine de Sitô | selon le nom |
| étape 7 | Cloudflare Workers payant | 5 $/mois + usage |
| étape 9 | hébergement du service | à relever |
| étape 12 | serveur d'e-mail | à relever |
| étape 13 | Supabase Pro | 25 $/mois |
| étape 14 | domaines des artisans | prix public Gandi (création .fr 7,20 € TTC ; renouvellement à vérifier) |
| étape 15 | Stripe | 1,5 % + 0,25 € par carte, + 0,7 % abonnements |
| étape 18 | Google Play | 25 $ une fois |

## 5. Règles de travail à chaque étape

| Règle | Source |
|---|---|
| Lire `memoire/` et `rules/` avant d'écrire du code | `CLAUDE.md` |
| Un contrôle mesure le rendu, et il est essayé une fois sur une copie cassée exprès | `CLAUDE.md` |
| Une livraison, c'est le dépôt entier, contrôlé par `verifier-depot` | `rules/methode.md` |
| Aucun secret dans le dépôt ; pas de Git LFS | décisions de Fabrice |
| Une migration qui a tourné ne se modifie pas | `supabase/README.md` |
| Fin de séance : réécrire `memoire/maintenant.md`, ajouter décisions et pannes, pousser | `CLAUDE.md` |
| Ne jamais présenter un résultat vide ou supposé comme un résultat | `rules/common/ne-pas-fabriquer.md` |

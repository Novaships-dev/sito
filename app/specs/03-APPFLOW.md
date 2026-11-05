# 03 — AppFlow : écrans et parcours

Version du 9 octobre 2026. Chaque écran, ce qu'il lit, ce qu'il écrit, et les
parcours de bout en bout. Le code est dans `app/src/ecrans/`.

États : **Fait, prouvé** / **Fait, non prouvé** / **À faire** / **Ouvert**.

---

## 1. Carte de l'app

```
Lancement ─► session ? ── non ─► Connexion (e-mail + mot de passe) ┐
                │                                            │
               oui ◄─────────────────────────────────────────┘
                ▼
   ┌──────────── Navigation (bas sur téléphone, gauche sur ordinateur) ────────────┐
   │ Accueil │ Chantiers │ Mon site │ Avis │ Plus ─► Mon adresse                   │
   │         │    └► Chantier (paires, photos, vidéos)       Ma fiche Google       │
   │         │                                               Abonnement            │
   │         │                                               Compte                │
   │         │                                               Installer l'app       │
   └────────────────────────────────────────────────────────────────────────────────┘
   Bandeau d'envoi (en haut, toujours) : fichiers en attente, progression, erreur
```

Sur ordinateur, « Plus » disparaît : ses cinq entrées sont dans la barre de
gauche. « Installer l'app » est aussi joignable sans être connecté.

## 2. Les routes

| Route | Écran | Fichier | Connexion requise | État |
|---|---|---|---|---|
| `#/` | Accueil | `Accueil.tsx` | oui | Fait, prouvé |
| `#/chantiers` | Mes chantiers | `Chantiers.tsx` | oui | Fait, prouvé |
| `#/chantiers/<id>` | Un chantier | `Chantiers.tsx` | oui | Fait, prouvé |
| `#/site` | Mon site | `MonSite.tsx` | oui | Fait, prouvé |
| `#/avis` | Mes avis | `Avis.tsx` | oui | Fait, prouvé |
| `#/plus` | Plus (téléphone) | `App.tsx` | oui | Fait, prouvé |
| `#/adresse` | Mon adresse | `Adresse.tsx` | oui | Fait, prouvé (affichage) |
| `#/google` | Ma fiche Google | `Google.tsx` | oui | Fait, prouvé (affichage) |
| `#/abonnement` | Abonnement | `Abonnement.tsx` | oui | Fait : affichage prouvé ; boutons Stripe reliés (T17), prouvés en démonstration |
| `#/compte` | Compte | `Compte.tsx` | oui | Fait, prouvé |
| `#/installer` | Installer l'app | `Installer.tsx` | non | Fait, prouvé (rendu) |
| `#/inscription/<jeton>` | Créer son compte (lien envoyé par SMS) | `Inscription.tsx` | non (connecté : accueil) | Fait, prouvé |
| `#/reprise/<jeton>` | Nouveau mot de passe (lien envoyé par SMS) | `Inscription.tsx` | non (connecté : accueil) | Fait, prouvé |
| autre | Page introuvable | `App.tsx` | oui | Fait |

Paramètres d'adresse : `?demo` force la démonstration ; `?source=android`
active le mode Play Store (mémorisé sur l'appareil).

## 3. Les écrans en détail

### 3.1 Connexion

| Élément | Détail |
|---|---|
| Champs | « Votre adresse e-mail » (`autocomplete="username"`), « Votre mot de passe » (`current-password`), case « Afficher le mot de passe » → « Me connecter » → `seConnecter` |
| Erreurs | « Adresse e-mail ou mot de passe incorrect. » sous le champ |
| Mot de passe oublié | bouton qui dit : demander à Sitô un nouveau lien, reçu par SMS (aucun e-mail : voir 02-TRD §7) |
| Pas de compte | « Ouvrez le lien d'inscription que Sitô vous a envoyé par SMS. » |
| Démonstration | bandeau avec l'adresse et le mot de passe du compte de démonstration ; liens `#/inscription/demo-inscription`, `#/reprise/demo-reprise`, `#/inscription/demo-deja-servi` (déjà servi) |

### 3.1 bis Inscription et reprise (`#/inscription/<jeton>`, `#/reprise/<jeton>`)

| Élément | Détail |
|---|---|
| Lecture du lien | `lireLien` : nom de l'entreprise ; pour une reprise, l'adresse du compte. Lien inconnu, expiré ou déjà servi : écran « Lien refusé » avec la raison, aucun formulaire |
| Inscription | « Votre adresse e-mail », « Choisissez un mot de passe » (8 caractères au moins), « Créer mon compte » → `sInscrire` → connecté, accueil |
| Reprise | « Nouveau mot de passe » → « Enregistrer et me connecter » → `reprendre` |
| Erreurs | adresse qui a déjà un compte : « Cette adresse a déjà un compte Sitô… » ; le lien reste valable |
| Lien | « Installer l'app sur mon téléphone » |

### 3.2 Accueil

| Bloc | Lit | Action | Écrit |
|---|---|---|---|
| Titre | `entreprise().nom_affiche` | — | — |
| Ces 7 derniers jours | `statistiques(28)` → somme des 7 derniers jours : visites, appels, demandes | — | — |
| Courbe | les 28 jours ; tableau « Voir les chiffres » pour les lecteurs d'écran | dérouler | — |
| Demandes | `demandes()`, 20 dernières, les non lues marquées et comptées | Appeler (`tel:`), Répondre par e-mail (`mailto:`), Marquer comme lue | `demandes.lue_le` |
| Vide | « Aucune demande reçue pour l'instant. » | — | — |

### 3.3 Mes chantiers et un chantier

| Bloc | Lit | Action | Écrit |
|---|---|---|---|
| Nouveau chantier | — | « Ce qui a été fait » (obligatoire, 140 car.), « Commune » → Créer, ouvre le chantier | `chantiers` |
| Liste | `chantiers()` | ouvrir | — |
| Avant / après | `photos(id)` + la file d'envoi | une case « Photo avant » et « Photo après » par paire ; une paire vide de plus en bas | file d'envoi → `photos` |
| Autres photos et vidéos | idem | « Ajouter des photos ou vidéos » (plusieurs) | file → `photos` (rôle `chantier`) ou `videos` |
| État d'une photo | `photos.etat` | « Prête » / « Reçue, en préparation » / « Illisible : motif » / « En attente d'envoi » | — |
| Refus | — | « devis.pdf : Un PDF n'est pas une photo… » | — |

### 3.4 Mon site

| Bloc | Lit | Action | Écrit |
|---|---|---|---|
| État | `site()` : En ligne / En préparation / Pas encore en ligne / Suspendu / Archivé, date de mise à jour | « Voir mon site » | — |
| Ce que le site affiche | `profil()` | Téléphone (10 chiffres, contrôlé avant envoi) ; case « Afficher mes prix sur le site » ; phrase sous les prix (280 car.) → Enregistrer | `profils` |
| Mes tarifs (si la case est cochée) | `tarifs()` | Ajouter, Modifier, Retirer ; prestation, de (€), à (€, facultatif, ≥ de), par (m², ml, unité, heure, jour, forfait) | `tarifs` |

### 3.5 Mes avis

| Bloc | Lit | Action | Écrit |
|---|---|---|---|
| Moyenne | `avis()` | — | — |
| Un avis | auteur, date, étoiles (texte « 4 étoiles sur 5 » pour les lecteurs d'écran), texte | — | — |
| Réponse | si `reponse` : « Votre réponse publiée » ; si `valide_le` : « Validée, en cours de publication » ; sinon zone de texte remplie avec le `brouillon` | Valider et publier | `avis.brouillon`, `valide_par`, `valide_le` |
| Vide | « Aucun avis récupéré » + renvoi vers « Ma fiche Google » si non reliée | — | — |

### 3.6 Mon adresse

| Bloc | Lit | État |
|---|---|---|
| Adresses | `adresses()` : hôte, principale, genre (offerte / mon domaine / existant), état (Active / En cours / Problème / Retirée), motif ; « Ouvrir » si active | Fait |
| « Je veux mon propre nom de domaine » | explication ; recherche (.fr ou .com, Q9) ; si libre et abonnement en cours, confirmation du représentant (prérempli depuis « Directeur de la publication ») et réservation ; aucun prix | Fait sur la démonstration (T20, `essai-app`) ; réel : fonction Edge `domaines` à déployer (F8, F6, F5) |
| « J'ai déjà un nom de domaine » | explication ; « Brancher mon domaine » donne le CNAME `www` à poser (type, nom, valeur) ; « Vérifier maintenant » sur l'adresse en attente | Fait sur la démonstration (T20, `essai-app`) ; réel : même fonction |

### 3.7 Ma fiche Google

| Bloc | Lit | État |
|---|---|---|
| État | `connexionGoogle()` : Pas encore reliée / Reliée / Accès retiré / Problème ; fiche, dernière mise à jour, motif | Fait |
| Lien | « Ouvrir ma fiche chez Google » (business.google.com) | Fait |
| Relier | « Relier ma fiche Google » : consentement Google (fonction Edge `google-lien`), retour sur l'écran avec `google=ok` ou `google=erreur` ; « Relier à nouveau » si l'accès a été retiré | Fait sur la démonstration (T24, `essai-app`) ; réel : F13 |
| Comparer fiche et site | nom, adresse, téléphone | **À faire** |

### 3.8 Abonnement

| Bloc | Web | App Android |
|---|---|---|
| État | Période d'essai / Actif / Paiement en échec / Résilié | idem |
| Formule et prix | « Formule mensuel : 39 € HT par mois » | « Formule mensuel » **sans prix** |
| Échéance | fin de l'essai, prochaine échéance, ou date de fin si résiliation demandée | idem |
| Gérer | liste des deux formules ; abonnement en cours : bouton « Carte, factures, formule, résiliation » (portail Stripe) ; sinon « S’abonner au mois » / « à l’année » (Stripe Checkout) ; retour `#/abonnement?paiement=ok` ou `annule`, message lu par l’écran (T17) | **rien** : ni prix, ni lien, ni bouton |
| Retour de Stripe | `?paiement=` après le `#` : n’est pas une route (`App.tsx`), l’écran affiche « Paiement reçu » ou « Paiement annulé » | — |

### 3.9 Compte

| Bloc | Lit | Action | Écrit |
|---|---|---|---|
| Identité | entreprise (nom, SIREN, commune), adresse de connexion | Me déconnecter | session |
| Mentions légales | `profil()` | TVA (FR + 11 car.), assureur décennale, contrat, zone, médiateur, site du médiateur (`https://`) → Enregistrer | `profils` |
| Mes données | toutes les tables de l'artisan | Télécharger mes données (`sito-mes-donnees-AAAA-MM-JJ.json`) | — |
| Supprimer mon compte | `suppression()` | écrire SUPPRIMER → Demander ; puis Annuler la suppression | `suppressions` |

### 3.10 Installer l'app

| Appareil | Ce qui s'affiche |
|---|---|
| iPhone / iPad | trois étapes : Safari → Partager → Sur l'écran d'accueil → Ajouter |
| Android / ordinateur | bouton « Installer Sitô » si le navigateur le propose ; sinon le chemin dans le menu |
| Déjà installée | « L'app est déjà installée sur cet appareil. » |

## 4. Les parcours de bout en bout

### 4.1 Première connexion

| # | Qui | Ce qui se passe | État |
|---|---|---|---|
| 1 | Fabrice | l'entreprise existe (Sirene) ; `select public.creer_invitation('<siren>')` (outil MCP) donne le jeton ; il envoie par SMS `<adresse de l'app>/#/inscription/<jeton>` | Fait (fonction) ; l'adresse de l'app attend sa mise en ligne |
| 2 | Artisan | ouvre le lien, tape son e-mail et choisit un mot de passe, une fois | Fait, prouvé (T43) |
| 3 | Fonction Edge | crée le compte déjà confirmé, le rattache dans `membres`, marque le lien servi ; l'app se connecte (`signInWithPassword`), session gardée sur l'appareil | Fait, prouvé sur le compte d'essai |
| 4 | App | lit `membres` → SIREN ; toutes les lectures suivantes en dépendent | Fait, non prouvé |

### 4.2 Ajouter une photo depuis un chantier

| # | Où | Ce qui se passe | État |
|---|---|---|---|
| 1 | App | l'artisan choisit une ou plusieurs photos (pellicule ou appareil photo) | Fait, prouvé |
| 2 | App | lecture des premiers octets : photo, brut, vidéo ou refus | Fait, prouvé |
| 3 | App | photo lisible → redressée, réduite, JPEG sans métadonnées ; sinon telle quelle | Fait, prouvé |
| 4 | App | le fichier préparé entre dans la file (IndexedDB) ; la case affiche « En attente d'envoi » | Fait, prouvé |
| 5 | App | envoi TUS par morceaux de 6 Mo ; bandeau avec progression ; reprend tout seul au retour du réseau ou à la réouverture | Fait, non prouvé |
| 6 | App | ligne `photos` : `etat = recue`, `chemin_original`, `format_origine` | Fait, non prouvé |
| 6b | App | si la photo a été réduite ici : l'original part ensuite (même clé) et se pose dans `chemin_source` ; le bandeau affiche « (original) » | Fait, prouvé (démonstration) |
| 7 | Service | lit les photos `recue`, prépare l'image maîtresse (HEIC par Supabase, RAW par son aperçu), écrit `chemin`, passe à `prete` ou `illisible` + motif | Module fait, prouvé ; service **À faire** |
| 8 | Service | refabrique le site, 5 vérificateurs ; s'il reste un bloquant, rien n'est publié | Générateur fait ; déclenchement **À faire** |
| 9 | Service | publie la version suivante (R2), bascule le pointeur (KV), garde 2 versions, note `versions_site` | Fait, prouvé (simulé) ; réel **À faire** |
| 10 | App | la photo passe à « Prête » ; « Mon site » montre la nouvelle date | Affichage fait |

### 4.3 Changer son téléphone ou ses prix

| # | Ce qui se passe | État |
|---|---|---|
| 1 | Mon site → téléphone ou case prix → Enregistrer → `profils` | Fait, prouvé (démonstration) |
| 2 | Le service voit le changement, refabrique et publie (comme 4.2, étapes 8–9) | **À faire** |

### 4.4 Une demande arrive

| # | Ce qui se passe | État |
|---|---|---|
| 1 | Le visiteur remplit le formulaire du site | **À faire** |
| 2 | Le service filtre (champ piège, limite par IP) et écrit `demandes`, compte `statistiques.demandes` du jour de Paris | **À faire** |
| 3 | L'accueil la montre en haut, « nouvelle » ; l'artisan appelle ou répond, marque comme lue | Fait, prouvé |

### 4.5 Répondre à un avis

| # | Ce qui se passe | État |
|---|---|---|
| 1 | Le service récupère les avis Google (`reviews.list`) et prépare un brouillon | **À faire** (accès Google) |
| 2 | L'artisan relit, corrige, valide → `brouillon`, `valide_par = lui`, `valide_le` | Fait, prouvé |
| 3 | Le service publie (`updateReply`), écrit `reponse` et `repondu_le` | **À faire** |

### 4.6 Avoir son propre domaine

| Cas | Étapes | État |
|---|---|---|
| A. Offert | créé avec le site : `nom.domaine-sito.fr`, `adresses.genre = offerte` | **À faire** (domaine de Sitô à choisir) |
| B. Acheté | l'artisan tape le nom → disponibilité et prix (Gandi `check`) → confirme → achat au nom de l'artisan → CNAME `www`, redirection `https://domaine.fr → www`, renouvellement auto → custom hostname Cloudflare → état « Active » | **À faire** |
| C. Existant | l'app donne la valeur du CNAME `www` → l'artisan l'ajoute chez son registrar → le service vérifie, recrée si non validé à 7 jours → « Active » | **À faire** |

### 4.7 S'abonner et payer

| # | Où | Ce qui se passe | État |
|---|---|---|---|
| 1 | Site Sitô ou app web | choix mensuel ou annuel → Stripe Checkout | **À faire** |
| 2 | Service | webhook Stripe → `evenements_stripe` (une fois) → une seule fonction écrit `abonnements` | Écrit, essayé contre un faux (T16) ; pas déployé (F7) |
| 3 | App | Abonnement affiche l'état ; « Gérer » ouvre le portail Stripe (web seulement) | Fait (T17) |
| — | App Android | aucun prix, aucun lien d'achat | Fait, prouvé |

### 4.8 Supprimer son compte

| # | Ce qui se passe | État |
|---|---|---|
| 1 | Compte → écrire SUPPRIMER → Demander → ligne `suppressions` (date + 30 jours posée par la base) | Fait, prouvé (démonstration) |
| 2 | Pendant 30 jours : « Annuler la suppression » | Fait, prouvé |
| 3 | Une demande annulée ne se relance pas depuis l'app (droits) : message « Écrivez-nous » | Fait |
| 4 | À l'échéance, le service retire le site, efface photos et données, résilie Stripe, rend le domaine | **À faire** |

### 4.9 Installer l'app

| Appareil | Parcours | État |
|---|---|---|
| Android | Play Store (app TWA qui ouvre l'app avec `?source=android`) | fichiers prêts (T28, `scripts/android.mjs`) ; construction et publication : T29 (compte Google Play, F12) |
| iPhone | depuis le site Sitô : Partager → Sur l'écran d'accueil | Page faite ; non essayé sur iPhone |
| Ordinateur | bouton d'installation du navigateur | Fait |

## 5. États communs à tous les écrans

| Situation | Comportement |
|---|---|
| Chargement | « Chargement… » annoncé aux lecteurs d'écran |
| Erreur de lecture | encadré rouge avec le message et « Réessayer » |
| Erreur d'action | message sous le bouton concerné, jamais regroupé en haut |
| Action réussie | phrase verte sous le bouton (« Enregistré. Le site sera mis à jour. ») |
| Bouton pendant l'envoi | désactivé, libellé « Enregistrement… » / « Envoi… » |
| Session expirée | « Session expirée : reconnectez-vous. » ; retour à la connexion |
| Démonstration | bandeau « Démonstration : rien n'est envoyé, rien n'est publié. » |
| Changement d'écran | défilement en haut, focus sur le contenu, titre de l'onglet « Écran · Sitô » |

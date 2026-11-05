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
| autre | Page introuvable | `App.tsx` | oui | Fait |

Paramètre d'adresse : `?demo` force la démonstration.

## 3. Les écrans en détail

### 3.1 Connexion

| Élément | Détail |
|---|---|
| Champs | « Votre adresse e-mail » (`autocomplete="username"`), « Votre mot de passe » (`current-password`), case « Afficher le mot de passe » → « Me connecter » → `seConnecter` |
| Erreurs | « Adresse e-mail ou mot de passe incorrect. » sous le champ |
| Mot de passe oublié | bouton qui dit : en demander un nouveau à Sitô, reçu par SMS (aucun e-mail : voir 02-TRD §7) |
| Pas de compte | « Sitô vous donne votre identifiant et votre mot de passe. » |
| Démonstration | bandeau avec l'adresse et le mot de passe du compte de démonstration |

## 4. Les parcours de bout en bout

### 4.1 Première connexion

| # | Qui | Ce qui se passe | État |
|---|---|---|---|
| 1 | Fabrice | sur son PC, `lanceurs\COMPTE_ARTISAN.bat` : e-mail et SIREN de l'artisan ; l'entreprise est lue dans l'annuaire, le compte créé, le mot de passe affiché une fois | Fait contre des faux (`essai-comptes`) ; réel : F1 |
| 2 | Fabrice | donne à l'artisan, par SMS, l'adresse de l'app, son identifiant et son mot de passe | — |
| 3 | Artisan | ouvre l'app, se connecte une fois (`signInWithPassword`) ; la session reste sur l'appareil | Fait, prouvé (démonstration) |
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
| 3 | App | Abonnement affiche l'état ; « Gérer » ouvre le portail Stripe | Fait (T17) |

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
| Android | depuis le site Sitô : menu du navigateur → Ajouter à l'écran d'accueil (pas de Play Store, décision du 5 nov. 2026) | Page faite ; non essayé sur un vrai téléphone |
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

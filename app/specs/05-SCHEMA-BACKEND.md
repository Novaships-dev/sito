# 05 — Schéma back-end

Version du 9 octobre 2026. **Relevé dans la vraie base** (projet `sito`,
`magxzrpboyrzguuocjgj`, Paris) le 9 octobre, pas recopié de mémoire. Source
du schéma : `supabase/migrations/` (7 migrations, dans l'ordre). Essais des
droits : `supabase/essais/droits.sql` et `droits-app.sql`.

**Règle** : une migration qui a tourné ne se modifie jamais ; on en écrit une
nouvelle, avec ses droits et son essai dans le même lot.

---

## 1. Vue d'ensemble

```
auth.users ─┬─< membres >── entreprises ─┬─ profils (1-1)
            │                            ├─< tarifs
            ├── suppressions (1-1)       ├─< chantiers ─┬─< photos
            │                            │              └─< videos
            │                            ├─< photos, videos (aussi sans chantier)
            │                            ├─< sites ─┬─< fabrications
            │                            │          ├─< versions_site
            │                            │          └─< adresses
            │                            ├─< avis
            │                            ├─< statistiques
            │                            ├─< demandes
            │                            ├── abonnements (1-1)
            │                            ├── connexions_google (1-1) ── prive.jetons_google (1-1)
            │                            └── prospects (1-1, service seulement)
metiers ──< sites, prospects                evenements_stripe (seul)
```

La clé de tout ce qui appartient à un artisan est le **SIREN** (9 chiffres).
Un utilisateur voit une entreprise s'il est dans `membres`.

## 2. Qui écrit quoi

| Écrivain | Comment | Tables |
|---|---|---|
| **L'app** (artisan connecté, rôle `authenticated`, clé publique) | sécurité par ligne + droits par colonne | `profils`, `tarifs`, `chantiers`, `photos` (colonnes limitées), `videos`, `demandes.lue_le`, `avis` (brouillon et validation), `suppressions` (demande, annulation) |
| **Le service** (clé de service) | contourne les droits : à n'utiliser que côté serveur | tout le reste : `entreprises`, `membres`, `sites`, `fabrications`, `versions_site`, `adresses`, `avis` (récupération, réponse publiée), `statistiques`, `demandes`, `abonnements`, `evenements_stripe`, `connexions_google`, `prive.jetons_google`, `prospects`, `photos.etat/chemin` |
| **Les migrations** | référence | `metiers` |
| **Visiteur anonyme** | aucun accès à aucune table | — |

## 3. Les tables

Notation : **PK** clé primaire, **FK** clé étrangère, `NN` non nul.
Colonne « App » : L = lit, É = écrit.

### 3.1 `metiers` — référence (16 lignes)

| Colonne | Type | Contrainte |
|---|---|---|
| `cle` | text | **PK**, `^[a-z]+$` |
| `libelle` | text | NN |
| `mot` | text | NN (le mot géant du site) |
| `codes_ape` | text[] | NN, défaut `{}` |

Droits : lecture par tout artisan connecté.

### 3.2 `entreprises` — faits publics Sirene (service)

| Colonne | Type | Contrainte | App |
|---|---|---|---|
| `siren` | text | **PK**, `^[0-9]{9}$` | L |
| `denomination` | text | NN | |
| `nom_affiche` | text | NN | L |
| `siret_siege` | text | 14 chiffres | |
| `adresse`, `commune` | text | | L (commune) |
| `code_postal` | text | 5 chiffres | L |
| `departement` | text | `01`–`95`, `2A`, `2B`, `97x`, `98x` ; index | |
| `code_ape` | text | `^\d{2}\.\d{2}[A-Z]$` | |
| `forme_juridique`, `tranche_effectif` | text | | |
| `date_creation` | date | | |
| `rge` | boolean | | |
| `sirene` | jsonb | NN, défaut `{}` (réponse brute) | |
| `sirene_lu_le`, `cree_le`, `mis_a_jour_le` | timestamptz | horodatage auto | |

Droits : lecture si membre.

### 3.3 `membres` — qui a accès à quelle entreprise (service)

| Colonne | Type | Contrainte |
|---|---|---|
| `user_id` | uuid | **PK** (avec siren), FK `auth.users` (suppression en cascade) |
| `siren` | text | **PK**, FK `entreprises` ; index |
| `role` | text | `titulaire` (défaut) ou `collaborateur` |
| `cree_le` | timestamptz | |

Droits : chacun lit ses propres lignes. L'app prend la première entreprise.

### 3.4 `profils` — ce que dit l'artisan (app)

| Colonne | Type | Contrainte | App |
|---|---|---|---|
| `siren` | text | **PK**, FK `entreprises` | L/É |
| `telephone` | text | `^0[1-9][0-9]{8}$` (10 chiffres sans espace) | L/É |
| `courriel` | text | forme d'adresse (affichée dans les mentions légales ; obligatoire pour mettre en ligne) | L/É |
| `horaires` | jsonb | | — (pas encore dans l'app) |
| `prix_affiches` | boolean | NN, défaut `false` | L/É |
| `prix_mention` | text | ≤ 280 | L/É |
| `tva_intra` | text | `^FR[0-9A-Z]{2}[0-9]{9}$` | L/É |
| `decennale_assureur` | text | ≤ 140 | L/É |
| `decennale_contrat` | text | ≤ 60 | L/É |
| `decennale_zone` | text | ≤ 140 | L/É |
| `mediateur_nom` | text | ≤ 140 | L/É |
| `mediateur_site` | text | `^https://` | L/É |
| `mediateur_adresse` | text | ≤ 280 (adresse postale du médiateur, R. 616-1) | L/É |
| `capital_social` | text | ≤ 40 (société seulement) | L/É |
| `immatriculation` | text | ≤ 140 (« RCS Marseille 480 423 623 » ; vide : SIREN et RNE) | L/É |
| `directeur_publication` | text | ≤ 140 (représentant légal ; obligatoire pour mettre en ligne) | L/É |
| `cree_le`, `mis_a_jour_le` | timestamptz | horodatage auto | |

Droits : lire, créer, modifier si membre. L'app écrit par `upsert` sur `siren`.

### 3.5 `tarifs` — tarifs de l'artisan (app)

| Colonne | Type | Contrainte |
|---|---|---|
| `id` | uuid | **PK** |
| `siren` | text | FK ; index `(siren, rang)` |
| `poste` | text | 1 à 120 car. |
| `bas` | numeric(12,2) | NN, ≥ 0 |
| `haut` | numeric(12,2) | nul ou ≥ `bas` |
| `unite` | text | 1 à 24 car. |
| `note` | text | ≤ 280 |
| `rang` | integer | ordre d'affichage, défaut 0 |
| `cree_le`, `mis_a_jour_le` | timestamptz | |

Droits : lire, créer, modifier, supprimer si membre. Affichés sur le site
seulement si `profils.prix_affiches`.

### 3.6 `sites` — un site par entreprise et par métier (service)

| Colonne | Type | Contrainte | App |
|---|---|---|---|
| `id` | uuid | **PK** | L |
| `siren` | text | FK ; unique avec `metier` | |
| `metier` | text | FK `metiers` | |
| `archetype` | text | `matiere`, `panneau`, `planche`, `elevation` | |
| `charte` | jsonb | NN — **figée à la création** | |
| `main_photos` | jsonb | défaut `{}` | |
| `titre` | text | NN | |
| `phrases` | text[] | textes tirés (contrôle d'unicité) | |
| `commune`, `departement` | text | index `(metier, commune)`, `(metier, departement)` | |
| `statut` | text | `prospection` (défaut), `abonne`, `publie`, `suspendu`, `archive` | L |
| `version` | integer | ≥ 1 | |
| `adresse_en_ligne` | text | | L |
| `publie_le` | timestamptz | | L |
| `cree_le`, `mis_a_jour_le` | timestamptz | | |

### 3.7 `fabrications` — chaque fabrication et ses vérifications (service)

| Colonne | Type | Contrainte |
|---|---|---|
| `id` | uuid | **PK** |
| `site_id` | uuid | FK `sites` ; index `(site_id, debut desc)` |
| `version` | integer | ≥ 1 |
| `images` | text | `illustration` ou `entreprise` |
| `statut` | text | `en_cours`, `reussie`, `refusee`, `erreur` |
| `verifications` | jsonb | résultats des 5 vérificateurs |
| `debut`, `fin` | timestamptz | `fin ≥ debut` |

Une fabrication refusée ne remplace jamais le site en ligne.

### 3.8 `versions_site` — versions publiées (service)

| Colonne | Type | Contrainte |
|---|---|---|
| `site_id` | uuid | **PK** (avec numéro), FK |
| `numero` | integer | **PK**, ≥ 1 |
| `fabrication_id` | uuid | FK `fabrications` (mise à nul) ; index |
| `fichiers` | integer | ≥ 0 |
| `octets` | bigint | ≥ 0 |
| `en_ligne` | boolean | **une seule version en ligne par site** (index unique partiel) |
| `publiee_le` | timestamptz | |

### 3.9 `adresses` — sous-domaine et domaines (service)

| Colonne | Type | Contrainte | App |
|---|---|---|---|
| `id` | uuid | **PK** | |
| `site_id` | uuid | FK ; index | |
| `hote` | text | **unique**, nom de domaine valide en minuscules | L |
| `genre` | text | `offerte`, `achetee`, `existante` | L |
| `principale` | boolean | **une seule principale par site** | L |
| `etat` | text | `en_attente` (défaut), `active`, `echec`, `retiree` | L |
| `cloudflare_id` | text | id du custom hostname | |
| `registrar` | text | `gandi` | |
| `echeance` | date | fin de la période payée du domaine | |
| `motif` | text | ≤ 280 | L |
| `cree_le`, `mis_a_jour_le` | timestamptz | | |

### 3.10 `chantiers` (app)

| Colonne | Type | Contrainte |
|---|---|---|
| `id` | uuid | **PK** |
| `siren` | text | FK ; index `(siren, termine_le desc)` |
| `titre` | text | ≤ 140 |
| `commune` | text | |
| `termine_le` | date | |
| `description` | text | ≤ 2 000 |
| `publie` | boolean | défaut `false` |
| `cree_le`, `mis_a_jour_le` | timestamptz | |

Droits : lire, créer, modifier, supprimer si membre.

### 3.11 `photos` (app + service)

| Colonne | Type | Contrainte | App |
|---|---|---|---|
| `id` | uuid | **PK** | L |
| `siren` | text | FK ; index | É |
| `chantier_id` | uuid | FK (cascade) ; doit être un chantier de la **même** entreprise | É, modifiable |
| `role` | text | `avant`, `apres`, `chantier`, `geste`, `detail` | É, modifiable |
| `paire` | smallint | ≥ 1 ; obligatoire (avec le chantier) pour `avant`/`apres` ; **une seule photo par (chantier, paire, rôle)** | É, modifiable |
| `origine` | text | `entreprise` (défaut) ou `illustration` ; l'app ne peut écrire que `entreprise` | É |
| `chemin_original` | text | **unique**, commence par `<siren>/` — le fichier reçu ; depuis T44 (29 oct.), toujours un JPEG préparé sur le téléphone (redressé, 3 200 px au plus, sans métadonnées) | É |
| `format_origine` | text | ≤ 24 (`jpeg`, `heic`, `dng`…) — ce que l'appareil avait produit, lu dans les premiers octets par l'app (`photo.ts`) ; pour un DNG, c'est son aperçu JPEG qui a été envoyé | É |
| `octets` | integer | > 0 — taille du fichier **reçu**, que la préparation ne réécrit pas | É |
| `chemin_source` | text | **unique**, commence par `<siren>/` — l'original en pleine résolution, arrivé après la version réduite (migration du 9 oct.) ; JPEG ou PNG, **sans métadonnées** depuis T44, mêmes pixels | É (modification) |
| `octets_source` | bigint | > 0 | É (modification) |
| `chemin` | text | **unique**, commence par `<siren>/` — image propre pour le site | **service seulement** |
| `largeur`, `hauteur` | integer | > 0 | service |
| `etat` | text | `recue` (défaut), `prete`, `illisible` ; `prete` exige `chemin` | **service seulement** |
| `motif` | text | ≤ 280 | service |
| `cree_le` | timestamptz | | L |

Contraintes : `chemin` ou `chemin_original` présent. Droits : l'app insère
seulement `siren, chantier_id, role, paire, origine, chemin_original,
format_origine, octets`, et ne modifie que `chantier_id, role, paire, chemin_source, octets_source`.

Sans serveur (décision du 29 oct.) : la photo reçue est déjà propre. Le passage
`recue` → `prete` (image maîtresse, `chemin`, `largeur`, `hauteur`) reste à
faire par le workflow de T45 ; il n'a plus besoin d'exiftool ni de ffmpeg
(un JPEG se lit et se réduit avec sharp). `etat = illisible` ne devrait plus
arriver : l'app ne fait plus partir ce qu'elle ne sait pas lire.

### 3.12 `videos` (app)

| Colonne | Type | Contrainte |
|---|---|---|
| `id` | uuid | **PK** |
| `siren` | text | FK ; index |
| `chantier_id` | uuid | FK (cascade) ; même entreprise ; index |
| `chemin` | text | **unique**, commence par `<siren>/` |
| `format` | text | ≤ 24 |
| `octets` | bigint | > 0 |
| `duree_s` | numeric(8,2) | > 0 (posée par le service) |
| `cree_le` | timestamptz | |

Droits : lire, créer, supprimer si membre.

### 3.13 `avis` (service + validation par l'app)

| Colonne | Type | Contrainte | App |
|---|---|---|---|
| `id` | uuid | **PK** | L |
| `siren` | text | FK ; index `(siren, ecrit_le desc)` | |
| `source` | text | `google` | |
| `ref_externe` | text | unique avec `source` | |
| `auteur`, `texte` | text | | L |
| `note` | smallint | 1 à 5 | L |
| `ecrit_le` | timestamptz | | L |
| `reponse`, `repondu_le` | text, timestamptz | réponse **publiée** (service) | L |
| `chantier_id` | uuid | FK (mise à nul) ; index | |
| `recupere_le` | timestamptz | | |
| `brouillon` | text | ≤ 4 096 | L/É |
| `brouillon_le` | timestamptz | | |
| `valide_par` | uuid | FK `auth.users` ; **doit être l'utilisateur connecté** ; index | É |
| `valide_le` | timestamptz | | L/É |

Droits : l'app ne modifie que `brouillon, valide_par, valide_le`.

### 3.14 `statistiques` — par jour, page et source (service)

| Colonne | Type | Contrainte |
|---|---|---|
| `siren` | text | **PK** (avec jour, page, source), FK |
| `jour` | date | **jour de Paris** (`prive.jour_paris()`) |
| `page` | text | défaut `/` |
| `source` | text | défaut `tout` |
| `visites`, `appels`, `demandes` | integer | ≥ 0 |

L'app additionne par jour (`app/src/jour.ts`).

### 3.15 `demandes` — formulaire du site (service ; l'app marque lue)

| Colonne | Type | Contrainte |
|---|---|---|
| `id` | uuid | **PK** |
| `siren` | text | FK ; index `(siren, recue_le desc)` |
| `nom` | text | ≤ 120 |
| `telephone` | text | ≤ 30 |
| `courriel` | text | ≤ 200 |
| `message` | text | 1 à 4 000, NN |
| `page` | text | ≤ 300 |
| `recue_le` | timestamptz | |
| `lue_le` | timestamptz | **seule colonne modifiable par l'app** |

Écrite par le formulaire du site via `public.deposer_demande` (§4, T10) ; les
compteurs de la limite par adresse vivent dans `prive.compteurs_demandes`
(`cle` : empreinte SHA-256 de l'adresse IP et du jour, `jour`, `n` ; effacés
après deux jours ; service seulement).

### 3.16 `abonnements` — une seule source pour l'état du paiement (service)

| Colonne | Type | Contrainte | App |
|---|---|---|---|
| `siren` | text | **PK**, FK | |
| `formule` | text | `mensuel` ou `annuel` | L |
| `etat` | text | `essai`, `actif`, `impaye`, `resilie` | L |
| `stripe_client`, `stripe_abonnement` | text | uniques | |
| `fin_periode` | timestamptz | | L |
| `resiliation_prevue` | boolean | défaut `false` | L |
| `mis_a_jour_le` | timestamptz | | |

Écrite par **une seule fonction** : `ecrireAbonnement` de la fonction Edge
`stripe-webhook` (T16), avec l'état relu chez Stripe. Le retour de paiement
n'écrit rien : il attend l'événement.

### 3.17 `evenements_stripe` (service)

| Colonne | Type | Contrainte |
|---|---|---|
| `id` | text | **PK** (id de l'événement Stripe : un rejeu n'écrit rien) |
| `type` | text | NN |
| `recu_le` | timestamptz | |

### 3.18 `connexions_google` (service ; l'app lit)

| Colonne | Type | Contrainte |
|---|---|---|
| `siren` | text | **PK**, FK |
| `etat` | text | `a_connecter` (défaut), `connectee`, `revoquee`, `erreur` |
| `compte`, `fiche` | text | |
| `derniere_synchro` | timestamptz | |
| `motif` | text | ≤ 280 |
| `mis_a_jour_le` | timestamptz | |

### 3.19 `prive.jetons_google` (service seulement)

| Colonne | Type | Contrainte |
|---|---|---|
| `siren` | text | **PK**, FK |
| `jeton_chiffre` | bytea | chiffré par le service **avant** d'arriver ici |
| `portee` | text | NN |
| `mis_a_jour_le` | timestamptz | |

Aucun droit pour `public`, `anon`, `authenticated`.

### 3.20 `suppressions` — compte supprimé à 30 jours (app)

| Colonne | Type | Contrainte |
|---|---|---|
| `user_id` | uuid | **PK**, FK `auth.users` |
| `demandee_le` | timestamptz | défaut `now()` |
| `effective_le` | timestamptz | défaut `now() + 30 jours`, > `demandee_le` |
| `annulee_le` | timestamptz | |

Droits : l'app insère **seulement** `user_id` (les dates sont posées par la
base) et ne modifie que `annulee_le`. Une demande annulée ne se relance pas
depuis l'app.

### 3.21 `prospects` — suivi de prospection (service seulement)

`siren` (PK), `metier`, `campagne`, `qualification` (`prioritaire`, `bonne`,
`ecartee`), dates d'envoi, d'ouverture, de contact, `lecture_secondes`,
`reponse`, `relance_prevue`, `statut` (`a_envoyer` … `ne_plus_contacter`).
Aucune politique : invisible pour les artisans.

### 3.22 `invitations` — liens d'inscription et de reprise (service seulement)

Décision de Fabrice du 29 oct. 2026 : inscription par e-mail et mot de passe,
une seule fois, sans code ; Fabrice envoie le lien par SMS. Migration
`20261029181645_invitations`.

| Colonne | Type | Contrainte |
|---|---|---|
| `jeton` | text | **PK**, 64 caractères hexadécimaux (256 bits tirés par la base) |
| `siren` | text | FK `entreprises` (suppression en cascade) ; index |
| `genre` | text | `inscription` (crée le compte) ou `reprise` (nouveau mot de passe) |
| `user_id` | uuid | FK `auth.users` ; posé à l'inscription ; obligatoire pour une reprise |
| `cree_le`, `expire_le` | timestamptz | `expire_le` = création + 14 jours |
| `utilisee_le` | timestamptz | posé d'un coup par la fonction Edge (un seul usage) |

Aucune politique, aucun droit pour l'app ni pour un visiteur. Un lien se
fabrique par `public.creer_invitation(siren, genre)` (clé de service ou outil
MCP) ; il ne sert que par la fonction Edge `inscription`
(`supabase/functions/inscription/`), qui crée le compte déjà confirmé
(aucun e-mail envoyé) et le rattache dans `membres`. Essai :
`supabase/essais/invitations.sql`, `scripts/essai-inscription.mjs`.

## 4. Fonctions et déclencheurs

| Objet | Rôle |
|---|---|
| `prive.est_membre(siren)` | `security definer` : l'utilisateur connecté est-il membre ? Base de toutes les politiques |
| `prive.jour_paris(instant)` | date du jour à Paris (la base tourne en UTC) |
| `public.creer_invitation(siren, genre)` | `security definer`, clé de service seulement : fabrique un lien d'inscription ou de reprise (§3.22) et rend son jeton |
| `public.deposer_demande(siren, message, nom, telephone, courriel, page, piege)` | `security definer`, appelable par un visiteur (`anon`, voulu) : le formulaire d'un site d'abonné ; champ piège (rien d'écrit), site `abonne` ou `publie` seulement, longueurs, téléphone ou courriel exigé, 10 par jour et par adresse IP, 50 par site ; écrit `demandes` et compte `statistiques.demandes` du jour de Paris ; rend `recue`, `inconnu`, `invalide` ou `trop` (T10, migration `20261104174705`) |
| `prive.maj_horodatage()` | pose `mis_a_jour_le` à chaque modification (entreprises, profils, tarifs, sites, chantiers, adresses, abonnements, connexions_google, prospects) |

Le schéma `prive` n'est pas exposé par l'API.

## 5. Stockage (relevé le 9 oct.)

| Espace | Public | Taille max | Types | Rangement | Droits |
|---|---|---|---|---|---|
| `photos-chantiers` | non | 50 Mo (150 Mo proposés en Pro) | tous | `<siren>/<chantier>/<uuid>.<ext>` | lire, créer, modifier, supprimer si membre du SIREN du premier dossier |
| `banque` | non | 15 Mo | JPEG, PNG, WebP | images générées par métier | service seulement |

L'app affiche les images par **adresses signées** (1 heure). Le stockage
n'est pas dans les sauvegardes Supabase : le service recopiera les originaux
dans R2 (à faire).

## 6. Cloudflare (hors base)

| Élément | Contenu | État |
|---|---|---|
| KV `ADRESSES` | `hôte → {"site": "<id>", "version": n}` ; redirections possibles | Worker fait ; espace à créer |
| R2 `SITES` | `sites/<site>/<version>/…` + `.manifeste.json` écrit en dernier ; 2 versions gardées | idem |
| Worker `routeur.js` | route `*/*` ; cache rangé par version | idem |

## 7. Le service atelier : interface à construire

Aucun de ces points n'existe encore ; c'est la liste de ce que le service
doit offrir pour que l'app soit complète. Les noms sont proposés.

| Besoin | Déclencheur | Lit | Écrit |
|---|---|---|---|
| Inscrire un artisan (fonction Edge `inscription`, faite le 29 oct.) | lien envoyé par Fabrice (`creer_invitation`) | `invitations` | `auth.users` (par l'API d'administration), `membres`, `invitations` ; restent à poser : `profils`, `sites`, `adresses` (offerte) |
| Préparer les photos reçues (`atelier/preparer-recues.mjs`, fait) | nouvelle ligne `photos.etat = recue` | stockage | `photos.chemin/largeur/hauteur/etat/motif/format_origine` |
| Refabriquer et publier | photo prête, profil ou tarifs modifiés | tout le site | `fabrications`, `versions_site`, `sites`, R2, KV |
| Recevoir une demande | POST du formulaire du site | — | `demandes`, `statistiques` |
| Statistiques | chaque nuit (heure de Paris) | Umami | `statistiques` |
| Stripe | webhook | — | `evenements_stripe`, `abonnements` |
| Domaines (clients écrits, T19 : `atelier/gandi.mjs`, `atelier/cloudflare-saas.mjs` ; reste à les appeler depuis la demande de l'artisan, T20) | demande de l'artisan | Gandi, Cloudflare | `adresses` (`cloudflare_id`, `etat`, `motif`, `echeance`) |
| Google | après consentement, puis périodiquement | API GBP | `connexions_google`, `prive.jetons_google`, `avis` |
| Publier une réponse validée | `avis.valide_le` posé, `reponse` vide | — | Google, `avis.reponse/repondu_le` |
| Supprimer un compte | `suppressions.effective_le` atteinte, non annulée | tout | efface tout, résilie, retire le site |

**Fabriquer un site depuis la base (T08, `atelier/fabriquer.mjs`, fait le
27 octobre).** Lit `entreprises` (le `sirene` brut), `profils`, `tarifs` et
`photos` (`etat = prete`), construit l'entrée du générateur et lance
`generateur/composer.mjs` en sous-processus, comme `fabriquer-lot.mjs` le fait
déjà pour la prospection. Deux points à retenir :

- **La charte ne se retire plus une fois choisie.** `tirerSite()`
  (`generateur/tirage.mjs`) accepte un `charteFixee` qui saute le tirage et le
  retirage pour ressemblance ; `composer.mjs --charte <fichier>` le lui donne.
  Sans ça, une refabrication (une photo de plus) pouvait changer l'apparence
  d'un site déjà montré, si d'autres sites avaient été fabriqués entre les
  deux et rendaient aujourd'hui un autre choix moins fautif. `sites.charte`
  s'écrit à la première fabrication, jamais ensuite.
- **Pas de catégorie « hero » dans `photos.role`** (seulement avant, après,
  chantier, geste, detail) : la coupure avant/après du premier écran reprend
  la photo « après » de la première paire. Choix d'ingénierie, à revoir avec
  de vraies photos d'artisan (T30) — s'il s'avère que ça ne rend pas, la
  structure devra pouvoir se passer de section « coupure » hors prospection.

Preuve : `node scripts/essai-fabrication-base.mjs`, 12 contrôles, 0 faute
(faux Supabase) ; contre-essai : 1 cassure (la charte figée n'est plus relue),
attrapée sur l'archétype et la charte qui changent alors qu'ils ne devraient
pas.

## 8. État des données au 9 octobre

Base vide : 0 utilisateur, 0 entreprise, 0 site. Les 16 métiers sont chargés.

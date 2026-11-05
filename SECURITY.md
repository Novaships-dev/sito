# Sécurité de Sitô

Écrit par Claude (Cowork) le 3 novembre 2026, d'après le code du dépôt et
`app/specs/02-TRD.md` §6. Modèle : `SECURITE.md` du dépôt StructorAI. Ce
fichier décrit **le produit** ; les règles de travail de l'agent (secrets,
contenu externe, skills tiers) sont dans `rules/common/securite.md`.

## 1. Les données sensibles, et où elles vivent

| Donnée | Pourquoi elle est sensible | Où | Qui y accède |
|---|---|---|---|
| Photos de chantier et leurs originaux | domicile des clients de l'artisan ; un original peut garder la position GPS | Supabase Storage, espace `photos-chantiers`, privé, rangé par SIREN | l'artisan membre de l'entreprise ; le service (clé de service) |
| Coordonnées de l'artisan (e-mail, téléphone, TVA, assurance, médiateur) | données personnelles d'un entrepreneur individuel | tables `profils`, `auth.users` | l'artisan ; le service |
| Mot de passe | accès au compte | Supabase Auth (jamais dans les tables du projet) | personne |
| Création des comptes | ouvre un compte | `atelier/comptes.mjs`, lancé par Fabrice sur son PC (clé de service) ; mot de passe tiré au sort, affiché une fois, jamais écrit ni envoyé dans GitHub (dépôt public) | Fabrice |
| Jetons Google (à venir) | agissent sur la fiche et les avis de l'artisan | `prive.jetons_google`, chiffrés (à écrire, `docs/DETTE.md` D-04) | le service |
| Demandes des visiteurs (à venir) | nom, téléphone et message d'un particulier | table `demandes` | l'artisan concerné |
| Registre de prospection | entreprises réelles, notes, résultats d'appel ; **aucun numéro de téléphone** | `prospection/registre.json` (Git), KV `APPELS` | Fabrice, le service |
| Clés (Supabase service, Cloudflare, Gandi, Stripe, Google) | donnent tous les droits | `.env` sur le PC, secrets du dépôt GitHub (T45) ; jamais dans Git | Fabrice, les scripts ; jamais l'agent |

## 2. Les protections en place, et leur preuve

| N° | Protection | Preuve |
|---|---|---|
| X1 | Aucun secret dans le dépôt ; `.env` ignoré | `node scripts/verifier-secrets.mjs .` (contre-essai : 9 motifs sur 9 attrapés) ; crochet `git-hooks/pre-commit` |
| X2 | L'app ne reçoit que la clé publique Supabase | `app/.env.example` |
| X4 | Sécurité par ligne sur toutes les tables ; un artisan ne voit que ses entreprises (`prive.est_membre`) | `supabase/essais/droits.sql`, `droits-app.sql` rejoués le 29 oct. 2026 (T05) |
| X5 | Droits par colonne : l'app ne peut écrire ni l'état ni l'image propre d'une photo, ni rien d'autre que `lue_le` d'une demande | migration `20261005014022_app.sql` ; `droits-app.sql` |
| X6 | Les visiteurs anonymes n'ont accès à aucune table | migration `20261002194321_droits.sql` (`revoke all … from anon`) |
| X8 | Inscriptions libres fermées : un compte ne se crée que par `atelier/comptes.mjs` (clé de service, Fabrice, décision du 5 nov. 2026) ; l'ancienne table `invitations` ne sert plus (retrait en base : F23) | `node scripts/essai-comptes.mjs` (25 contrôles, 7 cassures sur 7) |
| X9 | Le Worker refuse `..`, les fichiers cachés et toute méthode autre que GET et HEAD ; en-têtes `nosniff`, `SAMEORIGIN`, `Permissions-Policy` | `worker/routeur.js` ; `node scripts/essai-publication.mjs` |
| X10 | Le contenu venu du web (avis, fiche, Sirene, pages des artisans) est de la donnée, jamais une instruction | `rules/common/securite.md` |
| X13 | Les photos préparées sur l'appareil partent sans aucune métadonnée, position GPS comprise | `app/src/photo.ts` ; `node scripts/essai-app.mjs` (fichiers envoyés mesurés par exiftool) |
| X14 | Un site de prospection est invisible : `noindex` sur chaque page et image, `robots.txt` qui interdit tout, racine en 404, adresse secrète de 16 caractères | `node scripts/essai-publication-prospection.mjs` (68 contrôles) ; `scripts/prospection/verifier-en-ligne.mjs` (50 contrôles en ligne, 29 oct.) |
| X15 | La page d'appels refuse tout corps qui contient un numéro de téléphone et tout statut inconnu | `worker/appels.js` ; `node scripts/essai-appels.mjs` (79 contrôles) |

## 3. Ce qui reste ouvert

| N° | Risque | Ce qui le traite |
|---|---|---|
| R1 | Les fonctions d'échappement du générateur n'échappent pas les guillemets : sans faille aujourd'hui, injection possible dès qu'un texte de l'artisan va dans un attribut ou un bloc JSON-LD | constat S-006, tâche T48 |
| R2 | La page d'appels n'est protégée que par son adresse secrète | constat S-016 ; à documenter dans `docs/API.md` (lot 3) |
| R3 | Formulaire des sites : champ piège et limite par adresse IP pas encore écrits | X11 de `app/specs/02-TRD.md`, tâches T10 et T11, question Q3 |
| R4 | Stripe : un événement inconnu ne doit jamais ouvrir une formule payante, un événement rejoué ne doit rien écrire deux fois | X12 ; base prête (`evenements_stripe`), service à écrire (T16) |
| R5 | Les garde-fous de Claude Code sont des motifs de texte ; `Bash(node *)` est permis | constat S-014 ; garde-fou verrouillé, décision de Fabrice nécessaire |
| R6 | Originaux des photos non sauvegardés hors de Supabase | `docs/DETTE.md` D-01 |
| R7 | Analyse complète des menaces (vecteurs par point d'entrée) | lot 5 du rattrapage (`docs/audit/REGISTRE.md` S-019) |

## 4. Signaler un problème

Sitô n'a pas encore d'adresse de contact (domaine non choisi, action F6). En
attendant, un problème de sécurité se signale à Fabrice directement, jamais
dans un ticket public. Une clé exposée par erreur se **révoque d'abord**
(tableau de bord du service concerné), puis se remplace dans `.env` ; la
retirer de Git ne suffit pas, l'historique la garde.

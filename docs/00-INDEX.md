# Index des documents de sito

Écrit par Claude (Cowork) le 3 novembre 2026. Chaque document du dépôt, ce
qu'il contient et **quand le lire**. Un document ajouté ou retiré se reporte
ici dans la même tâche (`docs/REGLE-TRACABILITE.md`). La liste complète des
fichiers, comptée par script, est `docs/audit/CARTE.md`.

**Qui fait foi** : les décisions de Fabrice (`memoire/decisions.md`), puis les
chiffres de `docs/SOURCE-UNIQUE.md`, puis le code. Tout le reste est écrit par
Claude et n'est pas validé par Fabrice.

## À lire au début de chaque séance

| Document | Contenu |
|---|---|
| `CLAUDE.md` | la loi du dépôt : ordre de lecture, façon de travailler, interdits, commandes |
| `memoire/maintenant.md` | où en est le projet, en une page |
| `memoire/decisions.md` | les décisions de Fabrice, mot pour mot |
| `memoire/de-cowork.md` | ce que Cowork a déposé ; à commiter à part |
| `app/specs/07-TACHES.md` | la liste de travail, une ligne par tâche |

## À lire avant une tâche, selon la tâche

| Document | À lire avant de… |
|---|---|
| `docs/SOURCE-UNIQUE.md` | écrire ou changer un chiffre, un prix, une limite, un délai |
| `docs/REGLE-TRACABILITE.md` | déclarer une tâche finie |
| `docs/REGLE-ESSAIS.md` | écrire ou lancer un essai |
| `docs/CONTEXT.md` | nommer quelque chose (vocabulaire du projet) |
| `docs/CONSTRAINTS.md` | toute tâche : ce qui ne se discute pas |
| `docs/TROUBLESHOOTING.md` | dépanner |
| `docs/DETTE.md` | toucher à une partie dont un défaut est déjà connu |
| `docs/audit/REGISTRE.md` | auditer, ou corriger un constat |
| `docs/audit/CARTE.md` | auditer : le périmètre complet, zone par zone |
| `SECURITY.md` | toucher aux comptes, aux droits, aux photos, aux points d'entrée |
| `memoire/pieges.md` | toute tâche : les pannes déjà vécues |
| `memoire/questions.md` | poser une question à Fabrice, ou voir les réponses |
| `memoire/actions-fabrice.md` | bloquer une tâche sur une action de Fabrice |
| `memoire/comptes-essai.md` | essayer contre la vraie base |
| `memoire/journal.md` | reprendre une tâche commencée ; ajout seul |
| `CHANGELOG.md` | dire ce qui a changé ; une ligne par tâche finie |

## Le produit et l'app

| Document | Contenu |
|---|---|
| `app/specs/README.md` | l'ordre des spécifications |
| `app/specs/01-PRD.md` | le produit, pour qui, exigences A1 à A20 et S1 à S7 |
| `app/specs/02-TRD.md` | architecture, pile, exigences techniques, sécurité, services, variables, essais |
| `app/specs/03-APPFLOW.md` | écrans, routes, parcours de l'app |
| `app/specs/04-DESIGN-SYSTEM.md` | couleurs, composants et ton de l'app |
| `app/specs/05-SCHEMA-BACKEND.md` | tables, droits, stockage |
| `app/specs/06-PLAN-IMPLEMENTATION.md` | les étapes et leur preuve |
| `app/specs/08-PROSPECTION.md` | la prospection : 30 sites et la page d'appels chaque matin |
| `app/PLAN-APP.md` | le plan de l'app du 3 au 5 oct. : hébergement, domaines, photos, Google |
| `app/README.md` | lancer et construire l'app |
| `docs/prospection-script.md` | plan, script d'appel et objections (copie du document remis à Fabrice) |
| `docs/noms-2026-10-05.md` | noms possibles pour Sitô |

## Les sites et le générateur

| Document | Contenu |
|---|---|
| `generateur/LISEZMOI.md` | fabriquer un site ; ce qui n'est jamais inventé |
| `rules/common/00-index.md` | l'index des règles et ce qui les impose |
| `rules/methode.md` | la méthode de livraison |
| `rules/web/*.md` | composition, facture, mouvement, client, photos, interdits de design, accessibilité, performance |
| `banque/README.md`, `banque/liste-images.md` | la banque d'images, 54 par métier |
| `banque/prompts/*.md` | les textes à coller dans ChatGPT, par métier |
| `atelier/LISEZMOI.md` | le service qui prépare les photos et publie |
| `supabase/README.md` | la base, les migrations, l'essai des droits |

## L'outillage de Claude Code

| Document | Contenu |
|---|---|
| `.claude/skills/*/SKILL.md` | travailler, dépanner, fin de séance, base, app, service, préparation des appels, rédaction, audit de design, prospection, veille |
| `.claude/skills/_partage/references/*.md` | molettes, palettes, signatures interdites, versions datées |
| `docs/outils-claude-code.md` | les outils de Claude Code dans ce dépôt |
| `docs/verification-outillage-2026-10-09.md` | la vérification de l'outillage du 9 oct. |
| `AGENTS.md` | renvoi vers `CLAUDE.md` pour tout autre agent |

## Rapports datés (photos d'un jour, pas l'état actuel)

| Document | Contenu |
|---|---|
| `docs/audit-2026-09-23.md` | audit du 23 sept. ; dépassé sur plusieurs points |
| `docs/etude-framer.md` | ce qui est retenu de Framer |
| `docs/cahier-des-charges.md` | cahier des charges de septembre, **non validé** par Fabrice |

## Archives : ne pas s'en servir pour une tâche

| Dossier | Contenu |
|---|---|
| `docs/lecture-structorai/` | 53 fichiers : lecture du dépôt StructorAI (3 oct.), pour un autre produit |
| `docs/historique/` | 11 documents de cadrage de septembre, plusieurs contredits depuis |

## Encore à écrire (plan de rattrapage du 3 nov. 2026)

Lot 2 produit : PRD avec le site d'abord, liste numérotée des fonctions du
site, spécifications du référencement et des mentions légales. Lot 3
technique : `docs/API.md`, codes d'erreur, variables, conventions, schéma
généré depuis la base, spécification par fonction. Lot 4 qualité : stratégie
d'essais, `docs/ESSAIS-IPHONE.md`, carte des écrans. Lot 5 juridique : menaces,
RGPD et conservation, CGV, confidentialité, mentions de Sitô. Lot 6
exploitation : mise en ligne et retour arrière, continuité, support. Lot 7
commerce : concurrents, coûts réels, programme pilote, discours, rétention.
Suivi des constats : `docs/audit/REGISTRE.md`.

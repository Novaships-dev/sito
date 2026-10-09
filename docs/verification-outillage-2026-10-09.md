# Vérification : Claude a-t-il tout pour travailler sur l'app Sitô ?

9 octobre 2026. Demande de Fabrice : vérifier dans StructorAI et dans atelier
tout ce qu'il faut pour coder une app, et dire si Claude a tout pour
travailler sur Sitô. Écrit par Claude, pas une décision de Fabrice.

## Ce qui a été lu

| Source | Lu | Méthode |
|---|---|---|
| atelier (`Bureau\atelier`) | 62 fichiers texte sur 62 (hors `node_modules`, `.git`, polices) | copiés, comparés octet par octet avec sito |
| StructorAI | l'outillage de Claude : `CLAUDE.md`, `.claude/settings.json`, `.claude/hooks/` (README + 5 scripts), `.claude/commands/` (README, `log.md`), `OPS/AUDIT/Z12-CLAUDE-OUTILLAGE.md`, `OPS/REGLE-TESTS.md`, `OPS/PROMPT-REPRISE.md`, `OPS/COMPTES.md`, `docs/ETAT-REPRISE.md`, `FICHIERS_A_CREER.md`, `.github/workflows/tests.yml` ; la liste complète de `docs/` (47 fichiers) et `OPS/` (≈ 400 fichiers) | lecture ciblée ; le reste du dépôt (1 597 fichiers) avait été lu en entier le 3 octobre (`docs/lecture-structorai/01.md` à `48.md`) |

## 1. atelier : rien ne manque dans sito

| Résultat | Fichiers |
|---|---|
| Identiques dans sito | 31 (4 skills, 4 hooks, 9 docs de cadrage rangés dans `docs/historique/`, règles communes, `sirene.mjs`, `zone-matiere.mjs`…) |
| Différents, **sito plus récent** (atelier date du 7 au 14 sept., sito du 2 au 9 oct.) | 30 (générateur, vérificateurs, règles web, `CLAUDE.md`, `README.md`, `methode.md`…) ; les 5 écarts relus ligne à ligne (`securite.md`, `tells-design.md`, `verifier-depot.mjs`, `verifier-textes.mjs`, `.gitignore`) vont tous dans le sens « sito ajoute » ; les autres n'ont pas été relus ligne à ligne |
| Absent de sito | `docs/journal.md` : ses 68 lignes sont toutes dans `memoire/journal.md` |

Conclusion : **atelier est une ancienne copie de sito ; il n'apporte rien de plus.**

## 2. Ce que StructorAI avait pour que Claude travaille seul

| Pièce | Rôle | Leçon mesurée dans StructorAI |
|---|---|---|
| `CLAUDE.md` (40 Ko) | la loi du dépôt : sources de vérité, pile, conventions, règles de sécurité, commandes, quand escalader | utile, mais très long |
| `.claude/settings.json` : `permissions` (44 autorisées, 52 à demander) | Claude travaille sans demander l'autorisation à chaque commande ; suppression, migrations, déploiements restent à demander | format vérifié : `Bash(cmd *)` ; **seules 4 clés sur 19 étaient lues**, 15 ignorées en silence |
| `.claude/settings.json` : `hooks` | SessionStart (contexte), PreCompact (sauvegarde), Stop (secrets, RLS) | une clé inventée avait laissé **3 crochets morts pendant des mois** ; le contrôle RLS visait un dossier inexistant : **faux vert permanent** |
| `.claude/skills/<nom>/SKILL.md` | savoir-faire chargé à la demande | 19 fichiers plats `SKILL-*.md` **jamais chargés** : un skill doit être un dossier |
| `.claude/commands/` (`/log`…) | fin de séance : état, journal | — |
| `.mcp.json` | serveurs MCP du dépôt | **absent** : le bloc MCP de `settings.json` n'a jamais rien monté |
| `.github/workflows/tests.yml` | rejoue les essais depuis un clone neuf, sans secret | créé après que 4 preuves se sont révélées vertes « seulement sur la machine de leur auteur » |
| `OPS/TESTS/*.txt` | la sortie des essais, versionnée à chaque tâche | « jamais de ✅ sur une suite rouge » |
| `OPS/REGLE-TESTS.md` | quand lancer tout, quand cibler | une spec qui *affiche* un écran ne prouve rien sur ses *boutons* |
| `docs/ENV.md` + `.env.example` | toutes les variables, sans valeur | — |
| `OPS/COMPTES.md` | comptes de test, lesquels touchent quoi | les essais automatiques ne touchent jamais le compte réel |
| `docs/DEPLOY.md`, `ERRORS.md`, `CONVENTIONS.md`, `API.md`, `db-reference/` | déploiement, erreurs connues, conventions, API, base | — |
| `OPS/PROMPT-REPRISE.md`, `docs/ETAT-REPRISE.md` | reprendre une session sans historique | **contiennent un mot de passe en clair** (compte démo) |

## 3. sito aujourd'hui, pièce par pièce

| Pièce | Dans sito | État |
|---|---|---|
| Loi du dépôt | `CLAUDE.md` (2,3 Ko) | **Présent, à compléter** : ne cite pas `app/specs/`, ni les commandes de l'app (`npm run build`, `essai-app`), ni les règles apprises le 9 oct. |
| Ce qu'on construit | `app/specs/01` à `06` | Présent, à jour |
| Décisions, état, pannes, journal | `memoire/` | Présent, à jour |
| Règles | `rules/` | Présent (sites) ; **rien pour l'app** au-delà des specs |
| Essais | `essai-app`, `essai-photos`, `essai-publication`, `droits*.sql`, 5 vérificateurs | Présent, tous verts ; **lancés à la main seulement** |
| Crochet de commit | `git-hooks/pre-commit` | Présent, branché (corrigé le 9 oct.) |
| Crochets de session | `hooks/*.sh` | **Présents mais jamais branchés** : pas de `.claude/settings.json` |
| Autorisations | — | **Absent** : chaque commande peut demander l'autorisation |
| Skills | `skills/` (4 skills d'outillage) | **Pas chargés** par Claude Code : ils ne sont pas dans `.claude/skills/` ; aucun skill pour l'app |
| Commande de fin de séance | — | **Absent** (la règle est écrite dans `CLAUDE.md`, rien ne l'impose) |
| Serveurs MCP | — | Supabase est branché côté Claude (compte), pas dans le dépôt |
| Essais rejoués depuis un clone neuf (CI) | — | **Absent** |
| Variables d'environnement | `app/.env.example`, TRD §8 | Présent pour l'app ; **absent pour le service** (`.env.example` racine) |
| Comptes de test | — | **Absent** : la base est vide, aucun compte d'essai |
| Déploiement, erreurs, API du service | — | **Absent** (rien n'est encore déployé ; le service n'existe pas) |
| Contrôle des textes de l'app | `verifier-textes` | **`app/` est exclu** : les phrases de l'app ne sont pas contrôlées |
| Pousser sur GitHub depuis le cloud | — | **Impossible** : le cloud n'a pas d'accès au dépôt privé ; on passe par `POUSSER.bat` sur le PC |

## 4. Verdict

**Pour coder l'app : oui, Claude a l'essentiel.** Les specs, le schéma réel, les
décisions, l'état, les pannes, les essais et le code existent et se tiennent.

**Pour travailler seul, longtemps, sans se tromper : pas encore.** Il manque
ce que StructorAI a appris à ses dépens : crochets réellement branchés,
autorisations, essais rejoués à chaque envoi, comptes de test, variables du
service, et une loi du dépôt qui pointe vers les specs.

## 5. Ce qu'il faudrait ajouter (proposé, rien n'est construit)

| # | Fichier | Pourquoi | Preuve que ça marche |
|---|---|---|---|
| 1 | `CLAUDE.md` complété | lire `app/specs/` d'abord ; commandes de l'app ; règles du 9 oct. | relecture |
| 2 | `.claude/settings.json` : autorisations + crochets branchés (clés officielles seulement) | moins d'interruptions ; secrets et fichiers protégés à 100 % | un crochet essayé sur une écriture interdite : refus mesuré |
| 3 | `.claude/skills/` : déplacer les 4 skills + skill `app-sito` | qu'ils se chargent vraiment | le skill apparaît en session |
| 4 | `.github/workflows/essais.yml` | rejouer build, `essai-app`, `essai-photos`, `essai-publication`, `verifier-depot` depuis un clone neuf, sans secret | une copie cassée exprès fait rougir la CI |
| 5 | `.env.example` racine (service) | noms de toutes les variables du service, sans valeur | `verifier-depot` le vérifie |
| 6 | `memoire/comptes-essai.md` + un compte d'essai dans la base | essais de bout en bout sans toucher un vrai client ; **aucun mot de passe écrit** (connexion par code) | connexion réelle depuis l'app |
| 7 | `verifier-textes` étendu aux textes de `app/src/` | les phrases de l'app suivent les règles FR | une phrase fautive ajoutée exprès est refusée |
| 8 | `memoire/essais/derniers.txt` écrit par un script | la sortie des essais versionnée, comme `OPS/TESTS` | — |
| 9 | Plus tard, quand ils existent : `docs/deploiement.md`, `docs/erreurs.md`, `docs/api-service.md` | — | — |

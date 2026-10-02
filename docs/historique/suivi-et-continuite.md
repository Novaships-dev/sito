# Suivi et continuité — ne pas se perdre à mi-chemin

**Version 1.0 — septembre 2026**
Fondé sur le guide long d'ECC, lu intégralement. C'est le document qui manquait à l'architecture.

---

## Le problème

Une session de développement assistée se dégrade toute seule. Le contexte se remplit, les décisions se noient dans l'historique, et au bout de deux heures l'agent a oublié pourquoi il fait ce qu'il fait. Le guide nomme ça la **pourriture de contexte**, et le distingue nettement : *« être miné par la pourriture de contexte dans la première heure, contre tenir des sessions productives pendant des heures ».*

Sur un projet comme le tien — génération de sites, pipeline photo, publicité, annuaire — une session qui s'arrête au milieu d'une génération laisse un état indéterminé. Sans système, ça coûte une journée.

---

## 1. La règle d'or : chaque phase produit un fichier

Le motif central du guide, et la réponse directe à « ne pas foirer à mi-chemin ».

```
Phase 1 : RECHERCHE   → recherche.md
Phase 2 : PLAN        → plan.md
Phase 3 : IMPLÉMENTER → modifications de code
Phase 4 : RELIRE      → constats.md
Phase 5 : VÉRIFIER    → terminé, ou retour à la phase précédente
```

**Cinq règles qui vont avec, à respecter sans exception :**

1. Chaque agent reçoit **une** entrée claire et produit **une** sortie claire.
2. La sortie d'une phase devient l'entrée de la suivante.
3. **Ne jamais sauter une phase.**
4. **Utiliser `/clear` entre les agents.**
5. **Stocker les sorties intermédiaires dans des fichiers.**

La cinquième est celle qui sauve. Si la session tombe en phase 3, `recherche.md` et `plan.md` existent toujours sur le disque. On reprend là, pas au début.

**Application au projet :** toute tâche qui dépasse une heure passe par ces cinq phases. Génération d'un lot de sites, construction d'un bloc, mise en place du pipeline photo, campagne de prospection.

```
travaux/<date>-<tache>/
├── 1-recherche.md
├── 2-plan.md
├── 3-journal.md        # ce qui a été fait, au fil de l'eau
├── 4-constats.md
└── 5-verification.md
```

---

## 2. Le fichier de session

Le guide est précis sur le contenu. Un fichier de session doit contenir **trois choses**, pas deux :

- **Les approches qui ont marché**, avec preuve vérifiable
- **Les approches tentées qui n'ont pas marché**
- **Les approches non tentées, et ce qui reste à faire**

La deuxième est celle que tout le monde oublie, et c'est la plus utile : sans elle, la session suivante refait les mêmes essais ratés.

**Règle de fichier : un nouveau fichier par session.** Le guide insiste : *« créer un nouveau fichier pour chaque session pour ne pas polluer le nouveau travail avec l'ancien contexte ».* Ne jamais réécrire le fichier de la veille.

```
memoire/sessions/2026-09-07-pipeline-photo.md
memoire/sessions/2026-09-08-blocs-realisation.md
```

**Reprise :** on ouvre une conversation neuve et on donne le chemin du fichier. Rien d'autre.

---

## 3. Les trois hooks de persistance

Le guide les nomme comme « les hooks que la plupart des gens ne connaissent pas ».

| Hook | Moment | Rôle |
|---|---|---|
| `SessionStart` | ouverture | charge automatiquement le contexte précédent |
| `PreCompact` | **avant compactage** | sauvegarde l'état important dans un fichier |
| `Stop` | fin de session | persiste les apprentissages |

**`PreCompact` est le plus important et le moins connu.** Le compactage écrase du contexte. Sans ce hook, ce qui comptait disparaît sans avertissement. Avec, l'état est écrit sur disque avant que le contexte ne soit réduit.

**Choix de conception à reprendre : l'apprentissage continu passe par le hook `Stop`, pas par `UserPromptSubmit`.** Justification donnée : `UserPromptSubmit` tourne à **chaque message** et ajoute de la latence partout. `Stop` tourne une seule fois en fin de session — léger, invisible pendant le travail.

---

## 4. Le compactage stratégique

**Désactiver le compactage automatique.** Compacter à la main, à des moments logiques — fin de phase, fin de tâche — ou via un skill dédié.

Raison : le compactage automatique se déclenche quand le contexte est plein, c'est-à-dire au pire moment, au milieu d'un raisonnement. Le compactage manuel se déclenche quand une phase est terminée, quand la perte est acceptable.

Une fois le plan établi et le contexte nettoyé, on travaille depuis le plan. C'est là tout l'intérêt d'avoir écrit `plan.md`.

---

## 5. L'injection dynamique de contexte

Une hiérarchie d'autorité à connaître, elle change la façon d'écrire les consignes :

> **contenu du prompt système > messages de l'utilisateur > résultats d'outils**

Au lieu de tout mettre dans `CLAUDE.md` — chargé à chaque session, pour toutes les tâches — on injecte le contexte utile au moment utile :

```bash
claude --system-prompt "$(cat memoire/maintenant.md)"
```

Et des alias par mode de travail :

```bash
alias c-dev='claude --system-prompt "$(cat contextes/developpement.md)"'
alias c-design='claude --system-prompt "$(cat contextes/design.md)"'
alias c-seo='claude --system-prompt "$(cat contextes/seo.md)"'
alias c-prospect='claude --system-prompt "$(cat contextes/prospection.md)"'
```

**C'est ce qui donne enfin un rôle au dossier `contextes/`** que l'architecture listait sans l'expliquer. Une session de design ne charge pas les règles de prospection, et inversement.

---

## 6. Le routage des modèles

Table reprise telle quelle du guide.

| Type de tâche | Modèle | Raison |
|---|---|---|
| Exploration, recherche de fichiers | Haiku | rapide, peu cher, suffisant |
| Modifications simples | Haiku | un fichier, consignes claires |
| Implémentation multi-fichiers | Sonnet | meilleur équilibre pour le code |
| Architecture complexe | Opus | raisonnement profond nécessaire |
| Revue de code | Sonnet | comprend le contexte, saisit les nuances |
| Analyse de sécurité | Opus | on ne peut pas se permettre de rater une faille |
| Rédaction de documentation | Haiku | structure simple |
| Débogage complexe | Opus | doit tenir tout le système en tête |

**Par défaut Sonnet pour 90 % du code.** Passer à Opus quand : la première tentative a échoué, la tâche touche cinq fichiers ou plus, il y a une décision d'architecture, ou le code est critique pour la sécurité.

Configuration :

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

Deux chiffres à connaître : la réflexion étendue réserve jusqu'à **31 999 tokens de sortie** par requête ; la réduire coupe environ **70 %** du coût caché. Et les sous-agents tournant sur Haiku coûtent environ **80 % de moins**, ce qui suffit pour explorer, lire des fichiers et lancer des tests.

**Application directe :** ton pipeline photo consomme de la vision sur chaque image. Le routage n'est pas un détail de confort, c'est une ligne de coût.

---

## 7. Le problème des sous-agents, et sa solution

Le guide nomme un piège que je n'avais pas signalé.

> Les sous-agents existent pour économiser du contexte en renvoyant des résumés. Mais l'orchestrateur possède un contexte sémantique que le sous-agent n'a pas. **Le sous-agent ne connaît que la requête littérale, pas l'intention derrière.**

C'est la cause principale des résultats à côté de la plaque.

**Le motif de récupération itérative :**

1. L'orchestrateur évalue **chaque** retour de sous-agent.
2. Il pose des questions de suivi **avant** d'accepter.
3. Le sous-agent retourne à la source, répond, revient.
4. Boucle jusqu'à suffisance — **trois cycles maximum**.

**La clé : transmettre l'objectif, pas seulement la requête.** Ne pas demander « trouve les fichiers qui gèrent les images », mais « trouve les fichiers qui gèrent les images, parce qu'on veut ajouter le format AVIF sans casser l'appariement avant/après ».

---

## 8. Les évaluations

Deux motifs, à utiliser selon la nature du travail.

**Par point de contrôle.** Des jalons explicites, vérification contre des critères définis, correction avant de continuer. Pour le travail structuré : construire un bloc, générer un site.

**En continu.** Toutes les N minutes ou après chaque changement majeur : suite de tests complète plus vérification. Pour le travail exploratoire.

**Les deux métriques, avec leurs chiffres réels :**

```
pass@k : au moins UNE tentative sur k réussit
         k=1 : 70 %   k=3 : 91 %   k=5 : 97 %

pass^k : TOUTES les k tentatives doivent réussir
         k=1 : 70 %   k=3 : 34 %   k=5 : 17 %
```

**Quand utiliser laquelle :** `pass@k` quand il suffit que ça marche une fois. `pass^k` quand la constance est essentielle.

**Application au projet, et c'est important :** la génération de site est un cas `pass^k`. Si le générateur produit un bon site une fois sur trois, il est inutilisable — chaque artisan n'a qu'un seul site. Les chiffres ci-dessus le montrent brutalement : un taux de 70 % par tentative donne **17 % de constance sur cinq**. Le générateur doit être évalué en `pass^k`, pas en `pass@k`.

---

## 9. La correction sur les MCP

Le guide corrige une nouvelle fois ma recommandation, et c'est la troisième fois sur ce sujet.

> Pour les MCP de contrôle de version, de base de données, de déploiement — GitHub, Supabase, Vercel, Railway — **la plupart de ces plateformes ont déjà des CLI robustes que le MCP ne fait qu'emballer.** Le MCP est un emballage agréable, mais il a un coût.

La solution : transformer les fonctions utiles du MCP en **commandes et skills** qui appellent la CLI directement.

```
/gh-pr        →  enveloppe gh pr create avec les options du projet
/db-migrate   →  enveloppe la CLI Supabase
/deploy       →  enveloppe la CLI Vercel
```

Et une nuance qui compte : *« avec le chargement paresseux, le problème de fenêtre de contexte est en grande partie résolu. Mais l'usage de tokens et le coût ne le sont pas de la même façon. »* Le passage par CLI et skills reste une optimisation de coût même quand le contexte n'est plus le problème.

**Politique MCP définitive pour ce projet :**

| | Choix |
|---|---|
| **MCP** | navigateur uniquement — c'est le seul qui n'a pas d'équivalent CLI, et c'est celui dont dépendent les skills de qualité web |
| **CLI plus skills** | Supabase, Vercel, GitHub |
| **À la demande** | Firecrawl, Perplexity |
| **Écarté** | Composio |

---

## 10. La parallélisation, avec sa limite

**Les arbres de travail git**, pour que deux instances ne se marchent pas dessus :

```bash
git worktree add ../chantier-blocs blocs
git worktree add ../chantier-pipeline pipeline-photo
cd ../chantier-blocs && claude
```

**La méthode en cascade :** ouvrir les nouvelles tâches dans de nouveaux onglets à droite, balayer de gauche à droite, du plus ancien au plus récent, et se concentrer sur **trois ou quatre tâches au maximum**.

**Et l'avertissement, qui vaut d'être repris :** le guide déconseille explicitement de fixer un nombre arbitraire de terminaux. *« L'ajout d'un terminal doit venir d'une nécessité réelle. »* L'objectif énoncé : **combien peut-on faire avec le minimum viable de parallélisation.**

Motif recommandé : la conversation principale pour les changements de code, les conversations dérivées pour les questions sur l'état du code ou la recherche externe.

Et une habitude simple : nommer chaque conversation avec `/rename`.

---

## 11. Le démarrage à deux instances

Motif d'amorçage directement applicable à ton point de départ.

**Instance 1 — l'échafaudage.** Structure du projet, `CLAUDE.md`, règles, agents, configurations.

**Instance 2 — la recherche.** Connectée aux services et à la recherche web. Produit le cahier des charges détaillé, les diagrammes d'architecture, et compile les références avec de vrais extraits de documentation.

Les deux tournent en parallèle sur un dépôt vide. C'est exactement la situation dans laquelle tu es.

**Astuce associée :** beaucoup de sites de documentation exposent un fichier `llms.txt`. L'ajouter à l'URL de la page de documentation donne une version optimisée pour un modèle. À essayer sur les documentations Google, Supabase, Astro.

---

## 12. Deux optimisations à poser dès le départ

**Code modulaire.** Des fichiers principaux de quelques centaines de lignes, pas de milliers. Le guide indique que ça aide à la fois sur le coût en tokens **et** sur la réussite du premier coup. C'est une règle d'architecture, pas de style.

**Remplacer grep.** Le guide cite `mgrep` avec un chiffre : sur un banc d'essai de cinquante tâches, `mgrep` associé à Claude Code a consommé environ **deux fois moins de tokens** que les flux fondés sur grep, à qualité jugée égale ou supérieure.

---

## 13. L'apprentissage continu

Le déclencheur est simple à repérer : **si tu as dû répéter une consigne plusieurs fois, ou si l'agent a buté deux fois sur le même problème, ce motif doit devenir un skill.**

Le guide résume le problème en trois mots : tokens gaspillés, contexte gaspillé, temps gaspillé.

La solution : quand quelque chose de non trivial est découvert — une technique de débogage, un contournement, un motif propre au projet — c'est enregistré comme skill. La fois suivante, le skill se charge tout seul.

**Application ici :** les comportements réels des API, les pièges du pipeline photo, les combinaisons de blocs qui ne fonctionnent pas. Chaque découverte non triviale finit dans un skill ou dans `memoire/pieges.md`.

---

## 14. Les fichiers à créer, et ce qu'ils contiennent

### `memoire/maintenant.md`

Réécrit à chaque fin de session. Format fixe :

```markdown
# État au <date>

## Ce qui tourne
<ce qui est déployé et fonctionne, avec la preuve>

## En cours
<la tâche, sa phase, le chemin du dossier travaux/>

## Ce qui bloque
<le blocage, ce qui a été tenté, ce qui reste à essayer>

## Prochaine action
<une seule phrase, exécutable telle quelle>

## Ne pas refaire
<les impasses de cette session>
```

La section « ne pas refaire » est celle qui évite de perdre deux fois la même journée.

### `memoire/decisions.md`

Une entrée par arbitrage. Jamais réécrite, seulement complétée.

```markdown
## 2026-09-07 — Molettes calées à 5 / 3 / 4
Contexte : ligne de base des dépôts à 8/6/4, inadaptée au brief artisan.
Décision : 5 / 3 / 4, cas « confiance d'abord » avec variance relevée d'un cran.
Conséquence : docs/design/molettes.md, packages/design.
Statut : actif.
```

### `travaux/<date>-<tache>/`

Un dossier par tâche longue, avec les cinq fichiers de phase. Supprimé quand la tâche est livrée et que ses enseignements sont passés dans `decisions.md` et `pieges.md`.

---

## 15. Définition de « fini »

Sans elle, une tâche n'est jamais terminée, elle est seulement abandonnée.

Une tâche est finie quand **toutes** ces conditions sont vraies :

- `pnpm verifier` passe intégralement
- le réviseur en contexte neuf n'a plus de constat bloquant
- la sortie est visible dans la planche ou dans le navigateur, pas seulement dans le terminal
- `memoire/maintenant.md` est à jour
- les enseignements sont dans `decisions.md` ou `pieges.md`
- le dossier `travaux/` est archivé ou supprimé

Le principe d'ECC, à afficher : *un résultat, ce n'est pas seulement du code. C'est une piste de preuves — le plan, le test qui échoue, le test qui passe, les constats de revue, la vérification finale.*

---

## 16. Ce qui entre dans le dépôt

| Fichier | Emplacement |
|---|---|
| `session-depart.sh` | `.claude/hooks/` — charge `maintenant.md` |
| `pre-compactage.sh` | `.claude/hooks/` — **le plus important** |
| `session-fin.sh` | `.claude/hooks/` — persiste les apprentissages |
| `/point` | `.claude/commands/` — met à jour `maintenant.md` |
| `/phase` | `.claude/commands/` — ouvre un dossier `travaux/` en cinq phases |
| `/reprendre` | `.claude/commands/` — relit le dernier fichier de session |
| `contextes/*.md` | un par mode de travail, injecté par alias |
| `docs/agent/sessions.md` | la procédure complète |
| `docs/agent/routage-modeles.md` | la table de routage |
| `docs/qualite/evaluations.md` | points de contrôle, continu, `pass@k` contre `pass^k` |

---

## 17. Ce qu'il reste à écrire, et qui n'est toujours pas fait

Pour être clair sur l'état réel :

| Manque | Statut |
|---|---|
| Le nom du produit | **jamais traité** |
| Le calendrier de développement | **jamais traité** |
| Le modèle de données | listé, non spécifié |
| Le contenu de `settings.json` | listé, non spécifié |
| Les workflows `.github/` | listés, non spécifiés |
| Le catalogue réel des blocs | listé, non spécifié |
| Le tableau des 18 métiers avec prestations et unités | listé, non spécifié |
| Le format des fiches `contextes/` | **défini ici**, section 5 |
| Le système de suivi | **défini ici** |

Et le fait principal : **rien n'existe encore sur disque.** Ces documents décrivent où vont les choses. Aucun fichier du dépôt n'est écrit.

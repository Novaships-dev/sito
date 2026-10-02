# Organisation des dépôts

**Version 1.1 — septembre 2026**
Trois dépôts privés. Un par business, plus un pour l'outillage partagé.

---

## Pourquoi trois et pas un

| Raison | Détail |
|---|---|
| **Cloisonnement des instincts** | `continuous-learning-v2` calcule un identifiant de projet sur douze caractères. Un seul dépôt = un seul identifiant = les conventions e-commerce contaminent le générateur de sites artisans |
| **Cloisonnement des secrets** | les clés Shopify et Printify d'un côté, les identifiants Google Ads de tes clients artisans de l'autre. Après ce qu'on a lu sur l'injection de prompt, les mélanger dans un espace accessible à l'agent est un mauvais calcul |
| **Coût de contexte** | `CLAUDE.md` est chargé à **chaque requête**. Un fichier couvrant les deux métiers te fait payer le contexte e-commerce en travaillant sur Sitô |
| **Règles réellement différentes** | la mode assume l'audace visuelle, l'artisan a besoin de sobriété rassurante. Molettes différentes, palettes différentes, interdits différents |
| **Piles différentes** | Liquid et Shopify CLI d'un côté, Astro et Node de l'autre. Rien à partager au niveau du code |
| **Sortie propre** | si tu vends ADYTON un jour, il part sans démêlage |

**Ce que tu veux partager, c'est l'outillage, pas le code.** L'écosystème est construit exactement pour ça.

---

## 1. `atelier` — l'outillage, privé

Ton dépôt de skills, règles, hooks et scanners. Installé dans les autres projets par une commande.

```
atelier/
├── README.md
├── skills/
│   ├── _partage/
│   │   └── references/
│   │       ├── tells-design.md        # signatures visuelles, 53 entrées
│   │       ├── tells-texte-fr.md      # lexique mort français
│   │       ├── molettes.md
│   │       ├── palettes.md
│   │       └── versions.md            # faits datés
│   ├── redaction-fr/SKILL.md          # anti-bouillie en français
│   ├── audit-design/SKILL.md
│   ├── prospection-sirene/SKILL.md    # utile aux deux : Sirene sert aussi au B2B
│   └── veille-concurrence/SKILL.md
├── rules/
│   ├── common/                        # ce qui vaut pour tout ce que tu fais
│   │   ├── securite.md
│   │   ├── git-workflow.md
│   │   └── redaction-fr.md
│   ├── web/                           # sites, Astro
│   └── shopify/                       # Liquid, thème
├── hooks/
│   ├── pre-ecriture.sh
│   ├── post-ecriture.sh
│   ├── pre-compactage.sh
│   └── session-depart.sh
└── scripts/
    ├── regles-fr.mjs                  # règles françaises pour kill-ai-slop
    └── verifier-textes.mjs
```

**Installation dans un projet :**

```bash
npx skills add ton-compte/atelier
```

Les règles se copient à la main, comme chez ECC — les plugins ne les distribuent pas :

```bash
cp -r ../atelier/rules/common .claude/rules/atelier/
cp -r ../atelier/rules/web .claude/rules/atelier/      # pour Sitô
cp -r ../atelier/rules/shopify .claude/rules/atelier/  # pour ADYTON
```

**Privé au début.** Tes règles de prospection et ton système anti-bouillie français sont un avantage. Publiable plus tard si ça devient un actif de réputation.

**Attention au piège relevé dans l'audit :** copier les répertoires entiers, jamais avec `/*`. Les fichiers de `common` et de `web` portent les mêmes noms.

---

## 2. `adyton` — la boutique, privé

Thème Shopify, assets, intégration Printify.

```
adyton/
├── CLAUDE.md                    # 40 lignes, contexte boutique uniquement
├── AGENTS.md
├── CONTEXT.md                   # glossaire : SKU, collection, drop, mockup…
├── .gitignore
├── .gitattributes               # Git LFS pour les fichiers lourds
├── .env.example
├── .claude/
│   ├── rules/
│   │   ├── atelier/             # copié depuis atelier : common + shopify
│   │   └── adyton/              # propres à la boutique
│   ├── skills/
│   └── hooks/
├── memoire/
│   ├── maintenant.md
│   ├── decisions.md
│   └── pieges.md
├── theme/                       # le thème Shopify
│   ├── layout/  templates/  sections/  snippets/
│   ├── assets/  config/  locales/
├── assets-sources/              # ← Git LFS
│   ├── produits/                # photos brutes
│   ├── mockups/
│   ├── logos/
│   └── polices/
├── printify/
│   ├── catalogue.json           # produits, variantes, correspondances
│   ├── scripts/                 # synchronisation API
│   └── mockups/
├── docs/
│   ├── marque.md                # ton, palette, typographies, anti-références
│   ├── produits.md
│   ├── printify.md              # comportements réels de l'API
│   ├── shopify.md
│   └── juridique/               # CGV, retours, RGPD
└── scripts/
    ├── deploiement.sh           # via Shopify CLI
    └── verifier-theme.sh        # theme check
```

### Trois points spécifiques à ADYTON

**Git LFS est obligatoire.** Les photos produit et les mockups sont lourds et binaires. Sans LFS, le dépôt devient inutilisable en quelques mois. À poser **avant** le premier commit d'image — c'est douloureux à rattraper après.

```
# .gitattributes
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.mp4 filter=lfs diff=lfs merge=lfs -text
```

**Les règles de design sont l'inverse de Sitô.** Une boutique de vêtements assume l'audace : molettes plutôt vers 8 / 6 / 4, la ligne de base des dépôts. Sitô est à 5 / 3 / 4. **Ne jamais partager le fichier de molettes entre les deux.**

**Shopify a son propre outillage.** Shopify CLI pour le développement local et le déploiement, `theme check` pour le contrôle — l'équivalent de Biome. Le hook `PostToolUse` lance `theme check` sur les fichiers Liquid, pas Prettier.

---

## 3. `sito` — le produit, privé

Monorepo interne, parce que là le code est réellement commun.

```
sito/
├── CLAUDE.md  AGENTS.md  CONTEXT.md  RULES.md
├── .claude/
│   ├── rules/
│   │   ├── ecc/                 # common + web, copiés depuis ECC
│   │   ├── atelier/             # copiés depuis atelier
│   │   └── sito/                # règles de domaine BTP
│   ├── skills/  agents/  commands/  hooks/
├── memoire/  docs/  contextes/  schemas/  scripts/  tests/  exemples/
├── apps/
│   └── generateur/  annuaire/  tableau-de-bord/  vitrine/  mobile/
└── packages/
    └── design/  photo/  redaction/  sirene/  seo/  video/  publicite/  ui/
```

Structure détaillée dans `architecture-depot.md`.

---

## Ce qui est partagé, ce qui ne l'est pas

| Élément | `atelier` | `adyton` | `sito` |
|---|---|---|---|
| Règles de sécurité | source | copié | copié |
| Flux git | source | copié | copié |
| Anti-bouillie **textuel** français | source | copié | copié |
| Anti-bouillie **visuel** | source | copié | copié |
| **Molettes** | — | **propres** | **propres** |
| **Palettes** | — | **propres** | **propres** |
| Hooks | source | copié | copié |
| Secrets | aucun | propres | propres |
| Instincts | — | cloisonnés | cloisonnés |
| Code métier | aucun | propre | propre |

**Le lexique mort français se partage** — « savoir-faire », « n'hésitez pas », « sur-mesure » sonnent faux partout.
**Les molettes et palettes ne se partagent jamais** — c'est précisément là que les deux métiers divergent.

---

## Ajouter un business plus tard

1. Nouveau dépôt privé
2. `npx skills add ton-compte/atelier`
3. Copier `rules/common` plus le paquet de domaine qui convient
4. Écrire `CLAUDE.md`, `CONTEXT.md`, `memoire/`
5. Créer `rules/<business>/` pour ce qui lui est propre

Ce qui a été appris ailleurs est disponible immédiatement. Ce qui est propre reste cloisonné.

---

## Ordre de mise en place

1. **`atelier`** en premier, même presque vide. Il reçoit ce qu'on a produit dans l'audit.
2. **`adyton`** ensuite, avec Git LFS **posé avant la première image**.
3. **`sito`** après le test terrain de trois semaines.

Le point 3 après le test : inutile de monter un monorepo à cinq applications avant de savoir si cinq façadiers veulent du produit.

---

## Annexe — L'outillage Shopify pour ADYTON

### Les dépôts officiels, à privilégier absolument

Après tous les dépôts sosies trouvés dans l'audit, voici deux sources **de première main** :

**`Shopify/agent-skills`** — *« une collection de skills d'agent vérifiés pour fonctionner avec l'écosystème de développement de Shopify »*. Généré en amont par Shopify, qui n'accepte ni contribution ni pull request dessus. Chaque skill contient un `SKILL.md` **et un `scripts/search_docs.js` qui interroge la documentation `shopify.dev`** pertinente pour ce skill.

**`Shopify/liquid-skills`** — support du langage Liquid, avec un **serveur de langage** :

```
/plugin marketplace add Shopify/liquid-skills
/plugin install liquid-lsp@liquid-skills
/plugin install liquid-skills@liquid-skills
```

Le `liquid-lsp` donne la vérification de types et l'aller à la définition sur les fichiers Liquid **sans éditeur ouvert** — le pendant de `typescript-lsp` mentionné dans le guide court d'ECC.

**Ce sont les seuls skills Shopify à installer.** Les autres sont communautaires et non vérifiés.

### `TeamDijon/shopify-rules` — le complément

Règles consommables par un agent pour le développement de thèmes Liquid. Sa raison d'être, formulée nettement :

> *« Les agents produisent du code Liquid incorrect sans consigne explicite. Le Liquid de Shopify est plein de motifs non évidents, de contournements des limites du langage, et de conventions communautaires qui n'apparaissent pas dans la documentation de base. »*

Et le constat sur ce qui existe déjà : *« le thème Horizon de Shopify inclut 43 règles couvrant l'accessibilité et les standards de code de base, mais elles ne couvrent ni les motifs Liquid avancés, ni la logique e-commerce, ni les contournements sur lesquels s'appuient les développeurs expérimentés. C'est ce vide que ce projet comble. »*

**Son format de règle est excellent, et transposable à tes règles BTP :**

```
Problème
Solution
Comment ça marche
Variantes
Références de source
Cas limites
Règles liées
```

Ce format est meilleur que ce que j'avais prévu. Les **cas limites** et les **références de source** sont ce qui empêche une règle de devenir un dogme incompréhensible six mois plus tard.

**Et sa chaîne de création de règles est un motif à copier :**

```
/discover-rule-topics  →  BACKLOG.md  →  /quick-rule            →  rules/
                                      →  /research-shopify-rule →  rules/
```

Une commande découvre les sujets manquants et remplit un carnet, deux autres transforment une entrée du carnet en règle — la version rapide ou la version documentée. **Exactement ce qu'il te faut pour construire `rules/sito/` progressivement**, plutôt que d'essayer de tout écrire d'un coup.

### Un fait à mettre dans `versions.md`

> **Shopify déprécie ses API tous les trimestres.**

C'est pour ça qu'un skill communautaire recommande de brancher un MCP de documentation en direct plutôt que de figer les réponses. Ça rejoint le principe de `versions.md` de Mobile Taste Skill : les faits sensibles aux versions vivent dans un seul fichier daté.

Pour ADYTON : `docs/shopify.md` doit porter une date de dernière vérification, et être relu à chaque version trimestrielle.

### Ce que ça donne dans `adyton/`

```bash
# Skills officiels
/plugin marketplace add Shopify/liquid-skills
/plugin install liquid-lsp@liquid-skills
/plugin install liquid-skills@liquid-skills
npx skills add Shopify/agent-skills

# Règles communautaires, après lecture
skill-warden scan TeamDijon/shopify-rules
cp -r rules/ .claude/rules/shopify/

# Ton outillage
npx skills add ton-compte/atelier
```

**Et le hook `PostToolUse` d'ADYTON lance `shopify theme check`**, pas Biome. C'est l'équivalent Liquid.

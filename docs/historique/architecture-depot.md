# Architecture du dépôt — projet site chantier artisan

**Version 3.2 — septembre 2026**

> ## Décisions actées — 7 septembre 2026
>
> | # | Sujet | Décision |
> |---|---|---|
> | 1 | **Nom** | **Sitô**, provisoire. `SiteArtisan` écarté : `siteartisan.fr` est le produit de Quickio. Trois vérifications avant de figer, voir `docs/produit/nom.md` |
> | 2 | Périmètre du premier livrable | générateur de site + pages de chantier. Pas d'app mobile, pas d'annuaire, pas de publicité |
> | 3 | Calendrier | **trois semaines de test terrain avant de coder**, cinq artisans par messagerie, pages montées à la main |
> | 4 | Base de données | Supabase, RLS par `site_id` |
> | 5 | Blocs de départ | **huit** : accueil, prestation, réalisation, galerie, preuves, zone, contact, pied |
> | 6 | Métier du test | ravalement de façade |
> | 7 | Département | celui de Fabrice |
> | 8 | ECC | installé, **après** le test terrain |
Reconstruite après lecture intégrale de six dépôts de référence. Voir `audit-repos.md` pour les preuves.
Document de référence unique. À lire avant d'écrire la première ligne de code.

---

## Sommaire

1. Les quatre convergences qui fondent cette architecture
2. Le principe de répartition
3. Arborescence complète
4. Les fichiers racine
5. `docs/` — la documentation projet
6. `.claude/` — la configuration de l'agent
7. `.claude/skills/` — le modèle `_shared`
8. `memoire/` — le cerveau
9. Les molettes et les planchers
10. Le fichier de vérité par artisan
11. Politique MCP
12. Ce qu'on installe de l'extérieur
13. La boucle de vérification
14. Sécurité de la chaîne d'approvisionnement
15. Ordre de mise en place
16. Annexes

---

## 1. Les quatre convergences

Six dépôts lus intégralement. Quatre mécanismes reviennent chez des auteurs sans lien entre eux. Ce sont eux qui structurent tout le reste.

| Mécanisme | ECC | Taste Skill | UI UX Pro Max | Mobile Taste | Addy Osmani |
|---|---|---|---|---|---|
| Trois molettes : variance, mouvement, densité | — | oui | oui | oui | — |
| Fichier de vérité persistant à la racine du projet | mémoire | — | `MASTER.md` | `MOBILE-DESIGN.md` | — |
| Ne jamais fabriquer une sortie quand la donnée manque | oui | oui | oui | — | oui |
| Contrôle mécanique avant livraison | oui | 50 cases | table de priorités | rubrique notée | listes de pré-lancement |
| Revue depuis un contexte neuf | oui | — | — | oui | persona relecteur |
| Connaissance partagée en un seul endroit | `rules/` | — | `references/` | `_shared/references/` | `docs/` |

**Quand quatre projets sans lien arrivent au même mécanisme, ce n'est plus une opinion.**

---

## 2. Le principe de répartition

Une seule règle. Elle décide de l'emplacement de chaque information.

| Nature | Où | Coût en contexte |
|---|---|---|
| Doit être respecté sans exception | **hook** ou permission | nul, tourne hors contexte |
| Connaissance mobilisable | **skill** | ~100 tokens de description en permanence, le corps au déclenchement |
| Connaissance partagée entre plusieurs skills | **`_shared/references/`** | nul, chargé sur renvoi |
| Standard permanent du projet | **règle** | **toujours chargé** — donc rare et court |
| Frontière de délégation | **sous-agent** | contexte neuf, pas de biais hérité |
| Documentation de référence | **`docs/`** | nul, lu à la demande |
| État courant, décisions, pièges | **`memoire/`** | injecté au démarrage de session |
| Consigne d'orientation | **`CLAUDE.md`**, court | chargé à chaque requête |

**Conséquence :** `docs/` peut peser des centaines de pages sans coûter un token. `rules/` doit rester à sept fichiers courts. C'est l'inverse du réflexe naturel.

---

## 3. Arborescence complète

```
sito/
│
├── CLAUDE.md                    # orientation, 40 lignes max
├── AGENTS.md                    # même contenu, pour Codex et harnais tiers
├── README.md
├── RULES.md                     # index des règles
├── SECURITY.md
├── CONTRIBUTING.md
├── TROUBLESHOOTING.md
├── CHANGELOG.md
├── VERSION
├── LICENSE
├── .gitignore  .gitattributes  .env.example  .markdownlint.json
├── .tool-versions               # Node 18 minimum (exigence ECC)
├── commitlint.config.js
├── package.json  pnpm-workspace.yaml  turbo.json  biome.json
├── .mcp.json
│
├── .claude/                     # section 6
├── .github/
│
├── docs/                        # section 5 — volumineux, coût nul
├── memoire/                     # section 8
│
├── contextes/                   # fiches chargeables à la demande
│   ├── metier-facadier.md
│   ├── metier-peintre.md
│   └── …                        # une par métier des 18
│
├── recherche/                   # veille gelée et datée
│   ├── concurrence/
│   ├── publicites-sociales/     # captures des pubs croisées
│   └── reglementaire/
│
├── schemas/
│   ├── chantier.schema.json
│   ├── site.schema.json
│   ├── artisan.schema.json
│   ├── demande.schema.json
│   └── bloc.schema.json         # schéma des blocs, cf. section 7
│
├── scripts/
│   ├── anti-slop.sh
│   ├── verifier-textes.ts
│   ├── verifier-seo.ts
│   ├── planche-blocs.ts
│   ├── lighthouse.sh
│   └── prospection/
│
├── tests/
│   ├── unitaires/  integration/  e2e/
│
├── exemples/
│   ├── chantier-ravalement/
│   ├── chantier-salle-de-bain/
│   └── site-reference/
│
├── apps/
│   ├── mobile/  generateur/  annuaire/  tableau-de-bord/  vitrine/
│
└── packages/
    ├── design/  photo/  redaction/  sirene/  seo/  video/  publicite/  ui/
```

---

## 4. Les fichiers racine

| Fichier | Contenu | Longueur |
|---|---|---|
| `CLAUDE.md` | le projet en 3 phrases, les 6 commandes, l'architecture en une ligne par dossier, les 5 règles absolues avec renvoi, « toujours commencer en mode plan », renvoi vers `memoire/maintenant.md` | 40 lignes |
| `AGENTS.md` | contenu identique | 40 lignes |
| `RULES.md` | index commenté de `.claude/rules/`, avec pour chaque règle sa portée et son hook associé | 1 page |
| `SECURITY.md` | secrets, dépendances, signalement, périmètre RGPD, **revue des skills tiers** | 1 page |
| `CONTRIBUTING.md` | branches, commits atomiques calibrés autour de cent lignes, revue, définition de « fini » | 2 pages |
| `TROUBLESHOOTING.md` | build cassé, hook bloquant, MCP absent, quota API, migration échouée | vivant |
| `.env.example` | toutes les variables, aucune valeur | exhaustif |
| `.tool-versions` | Node 18+, pnpm | 2 lignes |

**Jamais dans `CLAUDE.md` :** la liste des signatures d'IA, le détail des blocs, le modèle de données, l'historique, les argumentaires.

---

## 5. `docs/` — la documentation projet

### `docs/00-index.md`

Sommaire, avec pour chaque fichier une ligne disant **quand** le lire. Point d'entrée quand l'agent ne sait pas où chercher.

### `docs/produit/`

`nom.md` · `cahier-des-charges.md` · `vision.md` · `cible.md` · `metiers.md` (les 18, prestations, unités, contraintes) · `parcours-artisan.md` · `parcours-visiteur.md` · `glossaire-btp.md` · `hors-perimetre.md`

### `docs/architecture/`

`vue-ensemble.md` · `monorepo.md` · `modele-donnees.md` · `multi-tenant.md` · `generation-statique.md` · `pipeline-photo.md` · `pipeline-video.md` · `pipeline-publicite.md` · `files-attente.md` · `domaines.md` · `observabilite.md`

### `docs/architecture/adr/`

Un fichier par décision structurante, jamais réécrit.

```
0001-monorepo-pnpm-turborepo.md
0002-astro-plutot-que-next.md
0003-supabase.md
0004-biome-plutot-que-eslint-prettier.md
0005-pas-d-api-places.md
0006-publication-automatique-sans-validation.md
0007-molettes-plutot-que-gabarits-figes.md      ← révisé après audit
0008-annuaire-en-vignettes-sans-texte.md
0009-api-google-ads-acces-basic.md
0010-stockage-objet-sans-frais-de-sortie.md
0011-master-md-par-artisan.md                   ← nouveau
0012-un-seul-connecteur-mcp-par-defaut.md       ← nouveau
```

Format : contexte, options, décision, conséquences, date, statut.

### `docs/design/`

| Fichier | Contenu |
|---|---|
| `molettes.md` | variance, mouvement, densité ; table d'inférence ; **calage artisan à 5 / 3 / 4** |
| `planchers.md` | les minima non négociables sous les molettes |
| `blocs.md` | le catalogue, au schéma de la section 7 |
| `palettes.md` | les palettes, **avec la famille bannie et les sept familles de rotation** |
| `typographies.md` | les couples, licences, poids, échelles |
| `tokens.md` | variables CSS, espacements pilotés par la densité |
| `tells.md` | **le catalogue des signatures d'IA, en ajout seul, avec vérification grep** |
| `unicite.md` | table d'attribution, règle métier plus département |
| `accessibilite.md` | contrastes, focus, mouvement réduit, clavier |
| `planche-controle.md` | comment lancer la planche, comment juger |
| `logo.md` | génération SVG, garde-fous, déclinaisons |

### `docs/redaction/`

`ton.md` · `interdits.md` · `dictee.md` · `faits-obligatoires.md` · `exemples.md` (dix avant/après commentés)

### `docs/seo/`

`strategie.md` · `architecture-pages.md` · `regle-communes.md` · `balisage.md` · `images.md` · `fiche-google.md` · `avis.md` · `contenu-duplique.md` · `reponses-generatives.md` · `performance.md` · `mesure.md`

### `docs/apis/`

Une fiche par API, avec les **comportements réels observés**, pas la documentation recopiée.

`sirene.md` · `rge.md` · `google-business-profile.md` · `google-ads.md` · `places.md` (pourquoi on ne l'utilise pas) · `meta.md` · `reseaux-unifies.md` · `stripe.md` · `telephonie.md` · `quotas.md`

### `docs/juridique/`

`droit-image.md` · `clause-devis.md` · `rgpd.md` · `cgv.md` · `prospection.md` · `facturation-electronique.md` · `retrait.md`

### `docs/commerce/`

`paliers.md` · `couts-unitaires.md` · `rentabilite.md` · `acquisition.md` · `prospection.md` · `argumentaire.md` · `objections.md` · `concurrence.md` · `veille-publicites.md`

### `docs/operations/`

`environnements.md` · `deploiement.md` · `sauvegardes.md` · `continuite.md` · `incidents.md` · `runbook.md` · `supervision.md` · `support.md`

### `docs/qualite/`

`strategie-tests.md` · `boucle-verification.md` · `criteres-sortie.md` · `revue-code.md` · `rubrique-audit.md` (passes, format de constat, calcul de score)

### `docs/stores/`

`play-store.md` · `app-store.md` · `fiches-magasins.md`

### `docs/agent/`

| Fichier | Contenu |
|---|---|
| `installation.md` | mise en place d'un poste, dans l'ordre |
| `ecc.md` | ce qu'on prend, ce qu'on écarte, mise à jour |
| `skills-externes.md` | liste, provenance, **date de dernière revue**, empreinte du commit installé |
| `politique-mcp.md` | pourquoi un seul connecteur, comment en activer un temporairement |
| `hooks.md` | chaque hook, son événement, son effet, comment le neutraliser en urgence |
| `sous-agents.md` | rôle et périmètre de chacun |
| `securite-agent.md` | injection de prompt, dépôts sosies, AgentShield |
| `sessions.md` | démarrer, terminer, `/point` |
| `versions.md` | **tous les faits sensibles aux versions, datés** |

**`docs/agent/versions.md` est repris de Mobile Taste Skill.** Un seul fichier daté où vivent les faits qui périment : versions de Node, de Claude Code, seuils d'API, barèmes MaPrimeRénov', exigences des magasins d'applications, niveaux d'accès Google Ads. Sans ce fichier, les faits périmés se dispersent partout et personne ne sait lesquels revérifier.

---

## 6. `.claude/`

```
.claude/
├── settings.json               # versionné
├── settings.local.json         # jamais versionné
│
├── rules/                      # TOUJOURS CHARGÉ — sept fichiers courts
│   ├── 00-index.md
│   ├── design-interdits.md
│   ├── redaction.md
│   ├── seo-communes.md
│   ├── donnees-publiques.md
│   ├── ne-pas-fabriquer.md     ← nouveau, cf. plus bas
│   └── securite.md
│
├── skills/                     # section 7
├── agents/
│   ├── reviseur-design.md
│   ├── reviseur-seo.md
│   ├── reviseur-redaction.md
│   ├── reviseur-securite.md
│   ├── reviseur-juridique.md
│   └── testeur.md
│
├── commands/
│   ├── nouveau-bloc.md
│   ├── generer-site.md
│   ├── nouvelle-page-chantier.md
│   ├── verifier-tout.md
│   ├── auditer-design.md
│   ├── prospecter.md
│   ├── planche.md
│   └── point.md
│
└── hooks/
    ├── pre-ecriture.sh
    ├── post-ecriture.sh
    ├── session-depart.sh
    └── session-fin.sh
```

### `rules/ne-pas-fabriquer.md` — la règle issue de trois dépôts

Formulation à reprendre :

> Quand une recherche, une API ou une analyse ne renvoie rien d'exploitable : réessayer **une** fois avec une requête plus étroite. Si c'est encore vide, dire explicitement que la recommandation vient des valeurs par défaut internes et non d'une correspondance réelle. **Ne jamais présenter un résultat vide comme s'il avait renvoyé des données.**
>
> Sur une page publiée : ce dont le modèle n'est pas sûr n'apparaît pas. L'omission est toujours préférable à l'invention.

C'est la même règle que celle posée pour les pages de chantier. Elle est maintenant générale.

### Hooks

Événements : `PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd`, `PreCompact`, `Notification`. Entrée JSON sur l'entrée standard. **Pour bloquer, code de sortie 2** — le format décision/raison est déprécié.

| Hook | Événement | Effet |
|---|---|---|
| `post-ecriture.sh` | `PostToolUse` sur écriture | `anti-slop.sh` + Biome, bloque si détection |
| `pre-ecriture.sh` | `PreToolUse` | interdit `.env`, `memoire/decisions.md`, migrations figées |
| `session-depart.sh` | `SessionStart` | injecte `memoire/maintenant.md` |
| `session-fin.sh` | `SessionEnd` | rappelle `/point` |

Profils ECC : `ECC_HOOK_PROFILE=minimal|standard|strict`, `ECC_DISABLED_HOOKS=…`.

---

## 7. `.claude/skills/` — le modèle `_shared`

Repris de Mobile Taste Skill. **La connaissance vit une seule fois.**

```
.claude/skills/
├── _shared/
│   └── references/
│       ├── tells.md              # signatures d'IA, ajout seul, avec grep
│       ├── molettes.md           # variance, mouvement, densité, planchers
│       ├── palettes.md           # familles bannies, familles de rotation
│       ├── skeletons.md          # code canonique + modes d'échec nommés
│       ├── review-rubric.md      # passes, format de constat, calcul de score
│       ├── lexique-metiers.md    # vocabulaire BTP par corps d'état
│       ├── apis-observees.md     # comportements réels
│       └── versions.md           # faits datés
│
├── blocs/                        # les blocs de page, un fichier chacun
│   ├── accueil/
│   ├── prestation/
│   ├── realisation/
│   ├── commune/
│   ├── preuves/
│   ├── contact/
│   └── pied/
│
├── generateur-site/SKILL.md
├── page-chantier/SKILL.md
├── pipeline-photo/SKILL.md
├── redaction-chantier/SKILL.md
├── prospection-sirene/SKILL.md
├── pipeline-video/SKILL.md
├── publicite-lsa/SKILL.md
├── migration-site/SKILL.md
├── audit-design/SKILL.md         ← nouveau, séparé de la construction
└── veille-concurrence/SKILL.md
```

**Un skill par tâche, jamais un skill fourre-tout.** Mobile Taste sépare construire, planifier la navigation, définir les jetons, auditer, refondre un écran, refondre l'app. Même découpage ici : générer, alimenter, auditer, migrer sont quatre skills distincts.

### Le schéma de bloc

Repris de Taste Skill section 12, adapté.

```yaml
---
name: realisation-avant-apres
categorie: realisation
compatibilite_molettes:
  variance: [3, 7]
  mouvement: [1, 4]
  densite: [3, 6]
metiers: ["ravalement", "peinture", "carrelage", "maconnerie"]
quand_utiliser: "…"
ne_pas_utiliser: "…"
pile: ["astro", "tailwind"]
---
```

Corps obligatoire : croquis visuel · interface de props · squelette de code · **repli mobile explicite sous 768 px** · variantes par palier de mouvement · notes de mode sombre · anti-motifs · références réelles.

Discipline : un bloc par fichier · chaque bloc autonome · chaque bloc passe le contrôle avant livraison · **on cherche dans le catalogue avant de coder à la main**.

### `tells.md` — la mécanique d'entretien

Le catalogue grandit par observation. Pour chaque nouvelle signature repérée, une entrée qui contient :

1. un **numéro en ajout seul**, jamais renuméroté ;
2. l'**interdiction binaire**, pas « avec parcimonie » ;
3. l'**alternative correcte** ;
4. la **vérification grep** quand elle est possible.

Le point 2 est capital. Taste Skill le documente explicitement à propos du tiret cadratin : le modèle ignore historiquement les limites formulées comme « à utiliser avec parcimonie ». La formulation doit être binaire.

---

## 8. `memoire/`

```
memoire/
├── index.md            # sommaire
├── maintenant.md       # état courant, injecté au SessionStart
├── decisions.md        # journal daté, jamais réécrit
├── pieges.md           # erreurs commises
├── apis-observees.md   # comportements réels
├── clients.md          # retours terrain anonymisés
└── sessions/           # résumés archivés
```

**Deux entrées à créer dès aujourd'hui dans `pieges.md` :**

- Un tableau `agents` explicite dans `.claude-plugin/plugin.json` supprime la découverte native des fichiers `agents/*.md` par Claude Code. Des personas peuvent ne charger pour personne sans aucune erreur visible.
- Le réflexe « artisan donc papier chaud » produit systématiquement la palette beige, laiton et espresso, qui est la signature d'IA la plus répandue sur ce type de brief.

ECC propose aussi son coffre, `.ecc/memory/` et `~/.ecc/memory/`, format `ecc.memory.v1`. **À traiter comme du contexte non revu, jamais comme de la politique exécutable.**

---

## 9. Les molettes et les planchers

### Les trois molettes

```
VARIANCE    1 = symétrie parfaite   10 = asymétrie forte
MOUVEMENT   1 = statique            10 = chorégraphie complexe
DENSITE     1 = très aéré           10 = dense
```

Table d'inférence, croisée entre Taste Skill et UI UX Pro Max :

| Lecture du brief | Variance | Mouvement | Densité |
|---|---|---|---|
| minimaliste, calme, éditorial | 5-6 | 3-4 | 2-3 |
| premium consommateur, luxe | 7-8 | 5-7 | 3-4 |
| agence, expérimental | 9-10 | 8-10 | 3-4 |
| **confiance d'abord, accessibilité critique** | **3-4** | **2-3** | **4-5** |
| refonte, préserver | identique | +1 | identique |

**Calage du projet : 5 / 3 / 4.**

Justification : un particulier qui cherche un maçon veut être rassuré, pas ébloui. C'est un cas « confiance d'abord » avec une nuance — les photos de chantier apportent déjà l'impact visuel, donc la variance peut monter à 5 sans risque. La ligne de base des deux dépôts est 8 / 6 / 4 ; s'y tenir donnerait un site d'agence créative, hors sujet.

La densité pilote directement l'échelle d'espacement : basse, 24 à 96 px ; standard, 16 à 64 px ; haute, 8 à 32 px.

### Les planchers — non négociables sous les molettes

Repris de Mobile Taste Skill, adaptés au web et au projet.

- Contraste WCAG AA, 4,5:1 pour le corps, 3:1 pour le grand texte
- Cible tactile 44 × 44 px minimum, 8 px d'écart
- `prefers-reduced-motion` respecté pour tout mouvement au-dessus de 3
- Anneau de focus toujours visible
- Jamais `h-screen`, toujours `min-h-[100dvh]`
- LCP sous 2,5 s, INP sous 200 ms, CLS sous 0,1
- Animer uniquement `transform` et `opacity`
- Un seul thème par page, un seul accent, un seul système de rayons
- Repli mobile déclaré explicitement pour chaque disposition multi-colonnes

**Les molettes règlent l'expression. Les planchers ne se négocient pas.**

---

## 10. Le fichier de vérité par artisan

Troisième convergence, reprise de `MASTER.md` et `MOBILE-DESIGN.md`.

```
sites/<siren>/DESIGN.md          # source de vérité de cet artisan
sites/<siren>/pages/accueil.md   # surcharges par type de page
sites/<siren>/pages/realisation.md
sites/<siren>/pages/commune.md
```

**Contenu de `DESIGN.md` :** molettes retenues, bloc par section, palette, couple typographique, jetons, décisions manuelles de l'artisan avec leur date.

**Règle de résolution :** on lit `DESIGN.md`, puis on cherche une surcharge pour le type de page courant ; si elle existe, elle l'emporte, sinon `DESIGN.md` s'applique seul.

**Verrou anti-écrasement, repris tel quel :** si `DESIGN.md` existe déjà, une régénération **n'écrit rien**. Il faut une autorisation explicite. Et avant de l'accorder, lire le fichier existant.

**Pourquoi c'est structurant :** un artisan qui a changé sa couleur d'accent ne doit jamais la voir réinitialisée par une régénération déclenchée six mois plus tard. Sans ce verrou, le produit détruit périodiquement le travail de ses clients.

---

## 11. Politique MCP

**Un connecteur par défaut.**

ECC ne livre plus que `chrome-devtools` et a retiré les six autres lors d'un audit de juin 2026. Les noms d'outils MCP sont chargés en permanence dans le contexte.

| Connecteur | Statut | Pourquoi |
|---|---|---|
| **chrome-devtools** | **par défaut** | l'agent voit ses propres pages ; c'est aussi le connecteur dont dépendent les skills de qualité web d'Addy Osmani — `performance_start_trace`, `performance_analyze_insight`, `lighthouse_audit` |
| Supabase | par défaut | la base |
| Vercel | à la demande | sessions de déploiement et de domaines |
| Firecrawl | à la demande | migration d'un site existant, veille |
| Perplexity | à la demande | recherche réglementaire |
| Composio | écarté | trop d'outils chargés pour trop peu d'usage ici |

Le reste passe par des skills qui appellent une CLI ou une API REST : même capacité, coût de contexte nul.

---

## 12. Ce qu'on installe de l'extérieur

### ECC — la fondation

```
npx ecc-universal setup
```

Node 18+, Git, Claude Code 2.1+. **Une seule voie**, jamais empilée.

Règles à copier à la main, les plugins ne les distribuent pas :

```
git clone https://github.com/affaan-m/ECC.git
mkdir -p .claude/rules/ecc
cp -R rules/common .claude/rules/ecc/
cp -R rules/typescript .claude/rules/ecc/
```

Ce qu'on utilise : `/ecc:plan`, `tdd-workflow`, `/code-review`, `/build-fix`, `/context-budget`, `/save-session`, `/resume-session`, `/security-scan`. Plus les skills `cost-aware-llm-pipeline` (routage de modèles et budget — le projet consomme de la vision sur chaque photo) et `content-hash-cache-pattern` (cache par empreinte, pour ne pas retraiter deux fois la même image).

### Qualité web — Addy Osmani

```
/plugin marketplace add addyosmani/web-quality-skills
```

Skills : `web-quality-audit`, `performance`, `core-web-vitals`, `accessibility`, `seo`, `best-practices`. Astro explicitement supporté. **C'est la boucle de vérification SEO et performance, écrite par un ingénieur Chrome.**

Trois règles de méthode à reprendre dans `rules/` : traiter une trace comme une observation de laboratoire et non une donnée d'utilisateur réel ; étiqueter les constats comme hypothèses quand aucune page ne peut être exécutée ; préférer les capacités aux noms d'outils propres à un fournisseur.

### Méthode d'ingénierie — Addy Osmani

```
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

Cycle définir, planifier, construire, vérifier, relire, livrer. Commits atomiques calibrés autour de cent lignes. Quatre personas : relecteur, auditeur de sécurité, ingénieur de test, auditeur de performance.

### Design — pour fabriquer les blocs, pas pour générer les sites

**Distinction essentielle.** Ces outils servent à **construire le catalogue de blocs**, une fois. Ils ne génèrent pas les sites clients à l'exécution.

| Outil | Apport |
|---|---|
| `Leonxlnx/taste-skill` | les molettes, les signatures d'IA, le schéma de blocs, le contrôle en cinquante cases |
| `nextlevelbuilder/ui-ux-pro-max-skill` | 192 palettes, 74 appariements typographiques, 119 règles, le motif MASTER |
| `draftbit/mobile-taste-skill` | l'organisation `_shared`, les signatures propres au mobile — pour l'app artisan |

---

## 13. La boucle de vérification

Sans elle, la qualité décroît à mesure que la session s'allonge.

### `scripts/anti-slop.sh`

Grep sur les signatures, lancé par `PostToolUse`, **code de sortie 2** en cas de détection. Alimenté par `_shared/references/tells.md`.

**Le fichier le plus rentable du dépôt.**

### `scripts/verifier-textes.ts`

Lexique mort, énumérations par trois, formule « ce n'est pas X, c'est Y », **tiret cadratin — interdiction binaire**, et toute phrase ne contenant aucun fait.

Plus l'audit de copie repris de Taste Skill : relire chaque chaîne visible et signaler ce qui est grammaticalement cassé, au référent flou, ou qui sonne comme un modèle essayant de paraître réfléchi.

### `scripts/planche-blocs.ts`

Rend chaque bloc dans ses paliers de molettes compatibles. Sans cette planche, personne ne peut juger le système.

### Vérifications comptables

Reprises du contrôle avant livraison de Taste Skill, celles qui se mesurent :

- nombre d'intitulés en capitales au-dessus des titres ≤ plafond(sections / 3)
- pas trois sections consécutives en image plus texte alternés
- au moins quatre familles de mise en page différentes sur huit sections
- aucune intention de CTA en double
- aucun libellé de bouton sur deux lignes au bureau
- navigation sur une ligne, hauteur ≤ 80 px

### `pnpm verifier`

Une seule commande : anti-slop, textes, types, Biome, tests, contrôle SEO, Lighthouse. **Une seule**, parce que chaque commande supplémentaire est une friction dans une boucle d'agent.

---

## 14. Sécurité de la chaîne d'approvisionnement

**Un skill est un fichier d'instructions que l'agent exécute.** Le traiter comme du code tiers.

### Les dépôts sosies sont un problème réel

Recensés pendant l'audit :

- Taste Skill : au moins quatre copies, dont une nommée avec un enchaînement de 1, l et I, pensé pour être illisible. Le dépôt authentique est `Leonxlnx/taste-skill`, sans chiffre, 72 900 étoiles.
- UI UX Pro Max : cinq versions au moins, avec des chiffres **tous différents** — 79 palettes ici, 192 là, 95 ailleurs. Le dépôt de référence est `nextlevelbuilder/ui-ux-pro-max-skill`, 123 000 étoiles.

### Procédure obligatoire avant toute installation

1. Vérifier le **compte propriétaire**, pas seulement le nom du dépôt.
2. Vérifier les **étoiles et les forks** — une copie en a zéro.
3. Vérifier la **date du dernier commit**.
4. **Lire le `SKILL.md`** avant de l'installer.
5. Consigner dans `docs/agent/skills-externes.md` : provenance, empreinte du commit, date de revue.
6. Scanner :

```
npx ecc-agentshield scan
npx ecc-agentshield scan --fix
```

Il analyse `CLAUDE.md`, `settings.json`, les configurations MCP, les hooks, les définitions d'agents et les skills.

**Ne jamais installer depuis un lien vu dans une vidéo.**

---

## 15. Ordre de mise en place

1. Monorepo, pnpm, Turborepo, Biome, fichiers racine, `.env.example`.
2. `CLAUDE.md`, `AGENTS.md`, `.claude/rules/` — sept fichiers.
3. **`_shared/references/tells.md` puis `anti-slop.sh` puis le hook `PostToolUse`.** Avant toute ligne d'interface.
4. `docs/00-index.md` et la charpente vide de `docs/`.
5. `memoire/` avec `index.md`, `maintenant.md`, `pieges.md` et le hook `SessionStart`.
6. ECC par une seule voie, puis `npx ecc-agentshield scan`.
7. MCP : `chrome-devtools` et Supabase, rien d'autre.
8. `web-quality-skills`, qui dépend du connecteur précédent.
9. `docs/design/molettes.md` et `planchers.md`.
10. Le catalogue de blocs, un bloc à la fois, chacun rendu dans la planche et passé au réviseur.
11. Les skills métier, un par un.
12. Les sous-agents réviseurs.
13. Les applications.

**Le point 3 avant le point 13.** Poser la barrière avant de produire ce qu'elle doit filtrer.

---

## Annexe A — Le catalogue des signatures

Base de `_shared/references/tells.md`. Numérotation en ajout seul.

| # | Signature | # | Signature |
|---|---|---|---|
| 01 | dégradé violet ou noir | 14 | étoiles scintillantes |
| 02 | fond blanc pur | 15 | flèches animées |
| 03 | couleurs néon | 16 | survol animé partout |
| 04 | pastels fades | 17 | Inter |
| 05 | arc-en-ciel | 18 | Geist |
| 06 | bande colorée en haut | 19 | Space Grotesk |
| 07 | 3 cartes de fonctionnalités | 20 | emojis dans les titres |
| 08 | grille bento | 21 | puces à coches vertes |
| 09 | coins arrondis trop doux | 22 | « ce n'est pas X, c'est Y » |
| 10 | ombres portées partout | 23 | témoignages inventés |
| 11 | verre liquide | 24 | 3 paliers de tarifs |
| 12 | grille de points | 25 | zéro vraie démonstration |
| 13 | orbes floues en fond | | |

**Ajouts issus de l'audit :**

| # | Signature | Source |
|---|---|---|
| 26 | **tiret cadratin, où que ce soit** — interdiction binaire | Taste Skill 9.G |
| 27 | palette beige, laiton, espresso sur brief artisan | Taste Skill 4.2 |
| 28 | Fraunces ou Instrument Serif en police d'affichage | Taste Skill 4.1 |
| 29 | serif par défaut « parce que c'est créatif » | Taste Skill 4.1 |
| 30 | Poppins, Montserrat | projet |
| 31 | hero centré à deux boutons | Taste Skill 4.3 |
| 32 | icônes Lucide ou Heroicons — préférer Phosphor, HugeIcons, Radix, Tabler | Taste Skill 3.C |
| 33 | intitulé en capitales au-dessus de chaque titre — plafond : sections ÷ 3 | Taste Skill 4.7 |
| 34 | point médian comme séparateur par défaut | Taste Skill 9.F |
| 35 | fausse capture d'écran construite en `<div>` | Taste Skill 4.8 |
| 36 | numérotation de section en intitulé — `00 / INDEX`, `001 · Capacités` | Taste Skill 9.F |
| 37 | indice de défilement — « Scroll », flèche vers le bas | Taste Skill 9.F |
| 38 | bandeau de lieu, d'heure ou de météo | Taste Skill 9.F |
| 39 | pastille de version dans le hero — V0.6, BETA | Taste Skill 9.F |
| 40 | nombres faussement précis non sourcés | Taste Skill 4.9 |
| 41 | noms génériques — Jane Doe, Acme, Nexus | Taste Skill 9.D |
| 42 | verbes creux — élever, fluide, libérer, révolutionner | Taste Skill 9.D |
| 43 | trois sections consécutives en image plus texte alternés | Taste Skill 4.7 |
| 44 | deux appels à l'action de même intention sur une page | Taste Skill 4.5 |
| 45 | `window.addEventListener('scroll')` | Taste Skill 5.D |

**Les numéros 23, 25 et 40 sont des règles de produit, pas de design.** Aucun témoignage inventé sur un site client : les avis viennent de Google, rattachés à un chantier réel.

---

## Annexe B — Les 20 éléments d'un dossier d'agent bien tenu

| # | Élément | Où |
|---|---|---|
| 1 | dossier principal | racine du monorepo |
| 2 | dossier cerveau | `memoire/` |
| 3 | `CLAUDE.md` | racine, 40 lignes |
| 4 | routage des modèles | `.claude/settings.json` |
| 5 | fichiers de contexte | `contextes/` |
| 6 | dossier mémoire | `memoire/` |
| 7 | fichier index | `memoire/index.md`, `docs/00-index.md` |
| 8 | `tools.md` | `docs/agent/politique-mcp.md` |
| 9 | dossiers projets | `apps/`, `packages/` |
| 10 | contexte par projet | un `CLAUDE.md` court par application si besoin |
| 11 | base de connaissance | `docs/` |
| 12 | GitHub | dépôt, Actions, issues |
| 13 | `maintenant.md` | `memoire/maintenant.md` |
| 14 | suivi des tâches | issues GitHub |
| 15 | fichier de règles | `.claude/rules/`, `RULES.md` |
| 16 | skills | `.claude/skills/` |
| 17 | workflows | `.claude/commands/` |
| 18 | scripts | `scripts/` |
| 19 | `.env` | `.env.example` versionné, `.env` jamais |
| 20 | `.gitignore` | `.env`, `node_modules`, `.turbo`, `dist`, `settings.local.json` |

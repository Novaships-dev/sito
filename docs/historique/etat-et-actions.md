# Où on en est, et quoi faire maintenant

**7 septembre 2026**

---

## 1. Ce qui existe

Sept fichiers. Rien d'autre.

| Fichier | Lignes | À quoi il sert |
|---|---|---|
| `cahier-des-charges-app-chantier.md` | 1 438 | la spécification produit, source de vérité fonctionnelle |
| `audit-repos.md` | 2 378 | ce qu'on a extrait des dépôts lus, avec les corrections |
| `architecture-depot.md` | 729 | où va chaque fichier dans le dépôt Sitô |
| `suivi-et-continuite.md` | 377 | comment ne pas se perdre entre les sessions |
| `organisation-depots.md` | 283 | les trois dépôts, ce qui se partage |
| `nom-produit.md` | 59 | Sitô, provisoire, avec les vérifications à faire |
| `demo-rmpc-v2.html` | — | une page, refaite après audit |

**Total : environ 5 250 lignes de documentation.**

---

## 2. Ce qui n'existe pas

- aucun dépôt Git
- aucune ligne de code
- aucun skill écrit
- aucun compte créé, aucun domaine réservé
- **aucun artisan contacté**

Il faut le dire clairement : **on a beaucoup réfléchi et rien construit.** C'est normal à ce stade, mais ça ne peut pas durer.

---

## 3. Les décisions prises

| # | Sujet | Décision |
|---|---|---|
| 1 | Nom | **Sitô**, provisoire. SiteArtisan écarté, c'est le produit de Quickio |
| 2 | Premier livrable | générateur + pages de chantier. Pas d'app, pas d'annuaire, pas de publicité |
| 3 | Calendrier | **trois semaines de test terrain AVANT de coder** |
| 4 | Base | Supabase, cloisonnement par `site_id` |
| 5 | Blocs | huit pour démarrer |
| 6 | Métier du test | ravalement de façade |
| 7 | Département | le tien |
| 8 | ECC | oui, après le test terrain |
| 9 | Dépôts | trois : `atelier`, `adyton`, `sito` |

---

## 4. La conséquence de la décision 3

**Tu as décidé de tester avant de coder.** Donc :

- `sito` **n'existe pas encore** et c'est voulu. Le monter maintenant serait construire un monorepo à cinq applications sans savoir si cinq façadiers veulent le produit.
- `atelier` peut se monter maintenant, il sert aux deux business.
- `adyton` peut se monter maintenant, la boutique existe déjà.

**Le seul travail de dépôt qui a du sens cette semaine, c'est `atelier` et `adyton`.**

---

## 5. `atelier` — deux heures de travail

Le dépôt d'outillage. Il reçoit ce qu'on a produit.

### Créer

```bash
mkdir atelier && cd atelier
git init
mkdir -p skills/_partage/references rules/common rules/web rules/shopify hooks scripts docs
printf "node_modules\\n.env\\n.DS_Store\\n" > .gitignore
```

### Y déposer les documents

```bash
mkdir -p docs/audit
# copier depuis tes téléchargements
cp ~/Téléchargements/audit-repos.md            docs/audit/
cp ~/Téléchargements/architecture-depot.md     docs/
cp ~/Téléchargements/suivi-et-continuite.md    docs/
cp ~/Téléchargements/organisation-depots.md    docs/
```

### Installer l'outillage vérifié en premier

```bash
# Dans Claude Code, plugins officiels d'abord
/plugin install frontend-design
/plugin install code-review
/plugin install context7
```

Ces trois-là sont vérifiés par l'éditeur. Pas de procédure de contrôle nécessaire.

### Poser le scanner de sécurité

```bash
pip install skill-warden
```

C'est lui qui vérifie un dépôt **avant** installation. À partir de maintenant, aucun skill tiers ne s'installe sans être passé dessus.

### Le premier fichier utile

✅ **Fait le 2026-09-08.** `skills/_partage/references/tells-design.md`, le catalogue des
signatures : **53 entrées** numérotées en ajout seul, avec alternative et vérification
grep. Compilé depuis l'annexe A de `architecture-depot.md` et les sections 21.2, 38.2 et
38.4 de `audit-repos.md`. Il porte aussi les cinq familles esthétiques et le test
d'unicité en trois temps.

### Le second

✅ `skills/_partage/references/versions.md`, les faits qui périment, datés. Existe, à
remplir au fil de l'eau.

### Les quatre skills d'outillage

✅ **Faits le 2026-09-08** : `redaction-fr`, `audit-design`, `prospection-sirene`,
`veille-concurrence`. Écrits selon la méthode de la section 39 de l'audit : forme
impérative, description insistante couvrant les cas où l'utilisateur ne nomme pas la
chose, gabarit de sortie exact, aucun skill posé sur une tâche simple.

**Ce qui ne se fait toujours pas :** écrire les **dix skills métier de Sitô**
(`generateur-site`, `page-chantier`, `pipeline-photo`, `redaction-chantier`,
`pipeline-video`, `publicite-lsa`, `migration-site`, et le catalogue de blocs). Ils
demandent le protocole de test avec et sans skill, décrit en section 39.4. Sans données
de terrain, on ne sait pas quoi tester.

Les quatre ci-dessus sont des skills d'**outillage**, pas des skills métier : leur
substance existait déjà dans le dépôt, il ne s'agissait que de l'assembler.

**Rappel de la section 39.4** : lancer chaque cas de test deux fois, avec et sans le
skill. Une affirmation qui passe dans les deux cas ne mesure pas le skill.

---

## 6. `adyton` — le point urgent

Une seule chose est urgente, et elle l'est vraiment.

### Git LFS, avant la première image

```bash
mkdir adyton && cd adyton
git init
git lfs install

cat > .gitattributes << 'EOF'
*.png  filter=lfs diff=lfs merge=lfs -text
*.jpg  filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.webp filter=lfs diff=lfs merge=lfs -text
*.psd  filter=lfs diff=lfs merge=lfs -text
*.ai   filter=lfs diff=lfs merge=lfs -text
*.mp4  filter=lfs diff=lfs merge=lfs -text
EOF

git add .gitattributes && git commit -m "LFS avant toute image"
```

**C'est le seul geste vraiment pressant de toute cette liste.** Si une photo produit entre dans l'historique Git sans LFS, elle y reste. Rattraper ça demande de réécrire l'historique. À faire avant de committer quoi que ce soit.

### Ensuite

```bash
# Skills Shopify officiels
/plugin marketplace add Shopify/liquid-skills
/plugin install liquid-lsp@liquid-skills
/plugin install liquid-skills@liquid-skills
npx skills add Shopify/agent-skills

# Récupérer le thème existant
shopify theme pull
```

---

## 7. `sito` — plus tard, et voici quand

**Déclencheur : à la fin des trois semaines de test terrain, si le résultat est positif.**

Ce qui sera prêt le jour où on le monte :

- l'arborescence complète, dans `architecture-depot.md`
- les huit blocs à construire
- la palette et les molettes, corrigées après audit
- le système de suivi de session
- la liste ordonnée des installations

**Il n'y a rien à faire dessus maintenant.**

---

## 8. Ce qui n'est toujours pas fait, et qui compte

| Manque | Statut |
|---|---|
| **Le protocole des trois semaines** | **jamais écrit** — c'est le blocage principal |
| Le calendrier de développement | jamais écrit |
| Le modèle de données | listé, non spécifié |
| Le catalogue des huit blocs | listé, non spécifié |
| Le tableau des 18 métiers | listé, non spécifié |
| Les vérifications sur le nom | à faire : `sito.fr`, recherche INPI |

---

## 9. Ce que je ferais à ta place, dans l'ordre

**Aujourd'hui, quinze minutes**
Créer `adyton`, poser Git LFS, committer. Le seul geste irréversible si on le rate.

**Cette semaine, deux heures**
Créer `atelier`, y déposer les six documents, installer les trois plugins vérifiés et `skill-warden`.

**Cette semaine, une heure**
Vérifier `sito.fr` et faire la recherche d'antériorité INPI. Si ça coince, on trouve un autre nom maintenant plutôt que dans trois mois.

**La semaine prochaine**
Le protocole des trois semaines, puis les cinq façadiers.

**Dans un mois**
Selon le résultat du terrain : monter `sito`, ou changer de sujet.

---

## 10. Une remarque de méthode

Le guide court d'ECC prévient : *« ne surcompliquez pas, traitez la configuration comme un réglage fin, pas comme une architecture ».*

On a produit 5 250 lignes. Une partie est nécessaire et se prouvera à l'usage : les signatures de design, le suivi de session, le cloisonnement des dépôts, le fichier de vérité par artisan.

Une autre partie est du zèle. **Le tri se fera en construisant, pas en documentant davantage.**

Le meilleur test de tout ce travail n'est pas un dépôt bien rangé. C'est un façadier qui regarde une page de son chantier sur son téléphone et qui dit oui.

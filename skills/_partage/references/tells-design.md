# Catalogue des signatures visuelles

> Base de travail des skills `audit-design` et de tout ce qui produit une interface.
> Sources : `docs/historique/architecture-depot.md` annexe A, `docs/historique/audit-repos.md` sections 21.2,
> 38.2 et 38.4.

---

## Comment ce fichier s'entretient

Quatre règles, reprises de Taste Skill via l'audit :

1. **Numérotation en ajout seul.** Un numéro attribué ne change jamais. Une signature
   abandonnée est barrée, pas supprimée, et son numéro n'est pas réattribué.
2. **Interdiction binaire.** Jamais « à utiliser avec parcimonie ». Le modèle ignore
   historiquement les limites formulées ainsi. Le tiret cadratin est le cas documenté :
   la seule formulation qui tient est « jamais ».
3. **Alternative correcte.** Une interdiction sans remplacement produit une page vide,
   pas une page meilleure.
4. **Vérification grep quand elle est possible.** Ce qui se cherche automatiquement ne
   dépend pas de l'attention de qui relit.

---

## 1. Le catalogue

### Couleur et fond

| # | Signature | Alternative | Vérification |
|---|---|---|---|
| 01 | dégradé violet, ou noir vers violet | une couleur pleine tirée du sujet | `linear-gradient` |
| 02 | fond blanc pur `#FFF` | un blanc teinté par la palette du sujet | `#fff`, `#FFFFFF` |
| 03 | couleurs néon | saturation tenue, une seule couleur d'accent |  |
| 04 | pastels fades | contraste réel entre fond et texte |  |
| 05 | arc-en-ciel | une famille, deux valeurs |  |
| 06 | bande colorée en haut de page | rien, ou une règle typographique |  |
| 13 | orbes floues en fond | une texture liée au sujet | `blur(` |
| 27 | palette beige, laiton, espresso posée sur un brief artisan | la couleur du métier, pas celle du gabarit |  |
| 47 | texte gris sur fond coloré | texte pleine valeur, contraste mesuré |  |

### Mise en page

| # | Signature | Alternative | Vérification |
|---|---|---|---|
| 07 | trois cartes de fonctionnalités | le nombre réel d'éléments |  |
| 08 | grille bento | une hiérarchie qui suit l'importance |  |
| 09 | coins arrondis trop doux | un rayon, choisi, cohérent | `rounded-3xl`, `border-radius: 2` |
| 10 | ombres portées partout | l'ombre marque une élévation réelle | `box-shadow` |
| 11 | verre liquide, effet dépoli | une surface opaque | `backdrop-filter` |
| 12 | grille de points en fond | rien |  |
| 31 | hero centré à deux boutons | un seul appel à l'action, aligné au texte |  |
| 43 | trois sections consécutives image plus texte alternés | changer de forme à chaque section |  |
| 44 | deux appels à l'action de même intention sur une page | un seul |  |
| 46 | cartes imbriquées dans des cartes | une seule profondeur de conteneur |  |
| 48 | tuile d'icône en carré arrondi au-dessus de chaque titre | pas d'icône, ou une seule dans la page |  |

### Typographie

| # | Signature | Alternative | Vérification |
|---|---|---|---|
| 17 | Inter | une police choisie pour le sujet | `Inter` |
| 18 | Geist | idem | `Geist` |
| 19 | Space Grotesk | idem | `Space Grotesk` |
| 28 | Fraunces, Instrument Serif en police d'affichage | idem | `Fraunces`, `Instrument` |
| 29 | serif par défaut « parce que c'est créatif » | un choix motivé par écrit |  |
| 30 | Poppins, Montserrat | idem | `Poppins`, `Montserrat` |
| 33 | intitulé en capitales au-dessus de chaque titre | plafond : nombre de sections divisé par 3 | `uppercase` |
| 49 | accentuer un seul mot d'un titre, en italique, en gras ou en couleur | un titre d'un seul poids |  |
| 50 | capitales pour les étiquettes | casse normale | `text-transform: uppercase` |
| 51 | étiquette typographique inutile au-dessus du contenu | supprimer l'étiquette |  |

### Ponctuation et micro-texte

| # | Signature | Alternative | Vérification |
|---|---|---|---|
| 20 | emojis dans les titres | rien |  |
| 21 | puces à coches vertes | une liste simple |  |
| 22 | « ce n'est pas X, c'est Y » | une phrase déclarative | regex FR04 |
| 26 | **tiret cadratin, où que ce soit** | trait d'union, ou reformuler | `—` |
| 34 | point médian comme séparateur | virgule | `\s·\s` |
| 36 | numérotation de section en intitulé, `00 / INDEX` | pas de numéro |  |
| 41 | noms génériques, Jane Doe, Acme, Nexus | des noms réels, ou aucun nom | `Acme`, `Nexus`, `Lorem` |
| 42 | verbes creux, élever, fluide, libérer, révolutionner | un verbe qui décrit l'acte |  |

### Mouvement

| # | Signature | Alternative | Vérification |
|---|---|---|---|
| 14 | étoiles scintillantes | rien |  |
| 15 | flèches animées | rien | `animate-bounce` |
| 16 | survol animé partout | le survol marque ce qui est cliquable | `hover:scale` |
| 37 | indice de défilement, « Scroll », flèche vers le bas | rien |  |
| 45 | `window.addEventListener('scroll')` | `IntersectionObserver` | `addEventListener('scroll'` |
| 52 | entrées en fondu-glissé sur chaque section | une seule séquence orchestrée, ou rien |  |
| 53 | marqueurs numérotés sur un contenu qui n'est pas une séquence | des puces, ou rien |  |

### Faux contenu

| # | Signature | Alternative | Vérification |
|---|---|---|---|
| 23 | témoignages inventés | des avis réels, rattachés à un chantier réel |  |
| 24 | trois paliers de tarifs | le nombre réel d'offres |  |
| 25 | zéro vraie démonstration | montrer le produit en fonctionnement |  |
| 35 | fausse capture d'écran construite en `div` | une vraie capture |  |
| 38 | bandeau de lieu, d'heure ou de météo | rien |  |
| 39 | pastille de version dans le hero, `V0.6`, `BETA` | rien |  |
| 40 | nombres faussement précis, non sourcés | le chiffre réel avec sa source, ou rien |  |

> **Les numéros 23, 25 et 40 sont des règles de produit, pas de design.**
> Aucun témoignage inventé sur un site client. Les avis viennent de Google, rattachés à
> un chantier réel. Ils ne se négocient pas au nom d'une intention esthétique.

---

## 2. Les cinq familles

Un cran au-dessus de la signature isolée : l'esthétique complète qui revient quel que
soit le sujet. Source : audit section 38.2.

| # | Famille |
|---|---|
| F1 | crème chaud, serif contrastée, accent terre cuite ou argile |
| F2 | fond quasi noir avec un unique accent vert acide ou vermillon |
| F3 | mise en page de quotidien : filets capillaires, aucun arrondi, colonnes denses |
| F4 | le kit de cartes SaaS : contenu découpé en cartes arrondies identiques, un seul rayon partout quelle que soit la hiérarchie, la même ombre grise douce sous chacune, dégradés en décoration |
| F5 | l'habillage de gabarit, quel que soit le sujet |

**F5 est la plus insidieuse.** Elle se reconnaît à son assemblage : intitulé en capitales
espacées au-dessus de chaque titre, chaînes de métadonnées jointes par des points médians,
libellés en « MOT + fragment » avec un tiret cadratin espacé, noir teinté `#0B0B0B` ou
`#111` à la place du noir, police à chasse fixe pour les petites étiquettes de données,
flèche ajoutée au texte des liens et des boutons.

**La nuance, et elle compte** : ces traits sont légitimes pour certains briefs. Le problème
est qu'ils arrivent comme des **défauts** et non comme des **choix**. Quand le brief demande
explicitement une de ces esthétiques, le brief l'emporte.

---

## 3. Le test d'unicité

La procédure qui sépare un choix d'un défaut. Source : audit section 38.3.

> Travailler un prompt similaire pour voir si on arrive quelque part de similaire.

**Si le même brief, reformulé, produirait le même résultat, c'est un défaut.**

En trois temps, et le deuxième est celui qu'on saute :

1. **Écrire un plan compact** : la palette en 4 à 6 valeurs hexadécimales nommées, les
   polices et leurs rôles, un concept de mise en page en prose courte avec des schémas en
   caractères, et les principes propres à cette page.
2. **Relire ce plan contre le brief.** Chaque partie qui ressemble au défaut générique
   qu'on produirait pour n'importe quelle page similaire est révisée. **Dire ce qui a
   changé et pourquoi.**
3. **Écrire le code seulement après** avoir confirmé l'unicité du plan.

L'étape 2 est celle qui manquait. Sans elle, trois propositions se ressemblent.

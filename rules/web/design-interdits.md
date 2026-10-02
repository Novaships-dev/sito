# Signatures de design à éviter

Catalogue en ajout seul. Ne jamais renuméroter.
Chaque entrée porte une interdiction, une alternative, et une détection si
elle est possible.

Imposé par `scripts/regles-fr.mjs` via `kill-ai-slop`, pas par bonne volonté.

## Les cinq familles

Le design généré converge vers cinq familles. Elles sont légitimes pour
certains briefs, mais ce sont des défauts et non des choix, et elles
apparaissent quel que soit le sujet.

| # | Famille |
|---|---|
| F1 | crème chaud proche de #F4F1EA, serif contrastée, accent terre cuite proche de #D97757 |
| F2 | fond quasi noir avec un unique accent vert acide ou vermillon |
| F3 | mise en page de quotidien : filets capillaires, aucun arrondi, colonnes denses |
| F4 | kit de cartes : contenu en cartes arrondies identiques, un seul rayon, la même ombre douce, dégradés en décoration |
| F5 | habillage de gabarit : intitulé en capitales, points médians, noir teinté, chasse fixe pour les étiquettes, flèche dans les liens |

F1 mérite une note : l'accent argile est la couleur d'interaction du modèle
lui-même. C'est ce qu'il ressort quand on lui demande artisan, chaleureux,
matière. Sur un brief d'artisan, c'est le piège par défaut.

## Le catalogue

| # | Signature | Alternative |
|---|---|---|
| 01 | dégradé violet ou noir | aplat, ou photo |
| 02 | fond blanc pur | blanc cassé froid ou chaud, choisi |
| 03 | couleurs néon | saturation tenue |
| 04 | pastels fades | contraste réel |
| 05 | arc-en-ciel | une couleur d'accent, une seule |
| 06 | bande colorée en haut de page | rien |
| 07 | trois cartes de fonctionnalités alignées | liste, ou tableau |
| 08 | grille bento | grille irrégulière justifiée par le contenu |
| 09 | coins arrondis trop doux et uniformes | un seul système de rayons, hiérarchisé |
| 10 | ombres portées partout | filet, ou rien |
| 11 | verre liquide, backdrop-filter | aplat |
| 12 | grille de points en fond | rien |
| 13 | orbes floues en fond | rien |
| 14 | étoiles scintillantes | rien |
| 15 | flèches animées | rien |
| 16 | survol animé sur chaque carte | mouvement déclenché par l'utilisateur seulement |
| 17 | Inter | Archivo, Public Sans, Libre Franklin, Bricolage Grotesque |
| 18 | Geist | idem |
| 19 | Space Grotesk | idem |
| 20 | emoji dans un titre | rien |
| 21 | puces à coches vertes | liste simple |
| 22 | « ce n'est pas X, c'est Y » | phrase déclarative |
| 23 | témoignage inventé | avis réel rattaché à une réalisation, ou rien |
| 24 | trois paliers de tarifs par réflexe | le nombre de paliers réels |
| 25 | zéro démonstration réelle | montrer la chose |
| 26 | tiret cadratin, où que ce soit | trait d'union, ou reformuler |
| 27 | palette beige, laiton, espresso de gabarit | voir `references/palettes.md` |
| 27b | couleur de la famille chaude non déclarée comme prélevée | déclarer la photo source, voir plus bas |
| 28 | Fraunces ou Instrument Serif en police d'affichage | autre, ou pas de serif |
| 29 | serif par défaut parce que « ça fait créatif » | sans-serif, sauf raison écrite |
| 30 | Poppins, Montserrat | voir 17 |
| 31 | hero centré à deux boutons | hero asymétrique, un seul appel à l'action |
| 32 | icônes Lucide ou Heroicons | Phosphor, HugeIcons, Radix, Tabler, une seule famille |
| 33 | intitulé en capitales au-dessus de chaque titre | plafond : nombre de sections divisé par trois |
| 34 | point médian comme séparateur | virgule, ou retour à la ligne |
| 35 | fausse capture d'écran construite en div | vraie capture, ou emplacement déclaré |
| 36 | numérotation décorative de section | seulement si le contenu est une séquence |
| 37 | indice de défilement, flèche vers le bas | rien |
| 38 | bandeau de lieu, heure ou météo | rien |
| 39 | pastille de version dans le hero | rien |
| 40 | nombre faussement précis non sourcé | donnée réelle, ou absence |
| 41 | nom générique, Jean Dupont, Acme, Nexus | nom réel, ou champ vide déclaré |
| 42 | verbe creux : élever, fluide, libérer, révolutionner | verbe concret |
| 43 | trois sections consécutives en image plus texte alternés | varier les familles de mise en page |
| 44 | deux appels à l'action de même intention sur une page | un seul |
| 45 | addEventListener sur scroll | IntersectionObserver, ou rien |
| 46 | cartes imbriquées dans des cartes | une seule profondeur |
| 47 | texte gris sur fond coloré | contraste vérifié |
| 48 | tuile d'icône en carré arrondi au-dessus de chaque titre | rien |
| 49 | noir teinté, #0B0B0B ou #111, à la place du noir | une couleur sombre choisie |
| 50 | chasse fixe pour les petites étiquettes de données | la police du projet |

## La famille chaude, prélevée ou interdite

La règle 27 vise le beige de gabarit : celui qui arrive par défaut, identique
d'un site généré à l'autre. Elle ne vise pas les couleurs d'une façade.

Une couleur de la famille chaude est admise à une condition : elle est
**prélevée dans une photo du chantier** et la page le déclare, en commentaire,
en nommant le fichier source.

    /* palette prélevée : --ocre échantillonné dans images/rav-hero.png */
    --ocre:#B99875;

Sans cette déclaration, toute couleur de teinte 18 à 52, saturation 0,10 à 0,50
et clarté 0,45 à 0,88 est un constat bloquant. Les teintes de gabarit listées à
la règle 27 restent interdites même déclarées : elles ne viennent d'aucune
photo.

Le critère est la cohérence. Une couleur prélevée ne s'ajoute pas à la palette,
elle y prend une fonction : ici l'ocre nomme l'après du ravalement, en face de
l'encre qui nomme l'avant. Une couleur prélevée qui ne sert à rien est une
couleur de gabarit avec une meilleure excuse.

## Le test d'unicité

Avant de coder : le même brief, reformulé, produirait-il le même résultat ?
Si oui, c'est un défaut et pas un choix. Réviser, et écrire ce qui a changé
et pourquoi.

## Dépenser l'audace à un seul endroit

Un élément est la chose mémorable. Tout le reste autour reste calme.
Avant de livrer, retirer un élément.

## L'unicité se mesure, elle ne se juge plus

Le test d'unicité de `tells-design.md` demandait un jugement : « le même brief,
reformulé, produirait-il le même résultat ? » Un jugement ne se déclenche pas
tout seul. Le 23 septembre 2026, trois ravaleurs de Marseille ont reçu trois
sites jugés identiques par le client, alors que les quatre vérificateurs les
déclaraient tous bons. Ils avaient raison : chacun respectait le plancher.
Aucun ne mesurait la distance entre eux.

Mesuré : les trois avaient le **même accent** `#b08c6f`, le **même fond** quasi
noir, les **mêmes polices** sur deux des trois, et le **même mot géant**. Seule
la grille changeait. L'œil voit la couleur et la typographie avant la grille.

La cause est identifiable : la palette est prélevée dans les photos, et trois
sites de démonstration partagent les mêmes photos. Tant que c'est vrai,
**la couleur prélevée ne peut pas porter l'unicité**. Elle garde sa fonction —
nommer l'après — mais tout le reste vient d'ailleurs.

Ce qui porte l'unicité, six axes tirés de la graine dans `generateur/charte.mjs` :

| Axe | Valeurs | Poids |
|---|---|---|
| famille de couleurs | les sept de `palettes.md` | 3 |
| sol | nuit ou papier | 3 |
| appariement de polices | quatre | 2 |
| archétype | quatre | 2 |
| contenu du mot géant | métier, commune, enseigne, aucun | 1 |
| géométrie | vif, adouci, rond | 1 |

La **rotation des sept familles** est la règle de `palettes.md`, écrite le
7 septembre et jamais appliquée jusqu'ici : jamais la famille d'un voisin.

`scripts/verifier-unicite.mjs` compare deux à deux les sites de **même métier et
même commune** — deux sites qui ne se rencontrent jamais n'ont pas à différer.
Au-delà de 6 points communs sur 12, c'est bloquant. Prouvé en fabriquant deux
sites jumeaux : le contrôle les refuse et nomme les axes partagés.

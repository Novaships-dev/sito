# Composition

Les autres règles disent ce qu'il ne faut pas faire. Celle-ci dit ce qu'il faut
atteindre. Une page peut passer tous les autres contrôles et rester plate :
c'est arrivé, et c'est ce que ce fichier corrige.

## Pourquoi ces règles existent

Trois pages données comme les meilleures d'un générateur concurrent, examinées
le 9 septembre 2026 : titre serif centré, un mot en italique, bouton pilule à
flèche, micro-capitales séparées, dégradé pastel. Trois fois la même page. Elles
échouent au test d'unicité et elles frappent quand même, parce que leur premier
écran est une affirmation.

Il faut leur impact et refuser leur formule.

## Le premier écran

**C1. Amplitude typographique.** Le rapport entre la plus grande et la plus
petite taille déclarée est d'au moins 8. Un titre à 88 pixels contre une légende
à 11 donne 8. Un titre à 44 contre un corps à 16 donne 2,75 : c'est un document,
pas une page.

**C2. Amplitude lumineuse.** La page déclare au moins deux fonds dont la
luminance relative diffère d'au moins 0,55. Sans pleine largeur sombre quelque
part, tout a le même poids, donc rien n'en a.

**C3. Le premier écran affirme.** Avant le `h1` dans l'ordre du document, aucun
tableau, aucune mention légale, aucun bandeau de conformité. Ces contenus
existent, ils viennent plus bas. Le premier écran porte une image et une phrase.

Cibles non contrôlables par un script, à tenir à l'œil :

- le titre occupe au moins 20 % de la hauteur du premier écran
- une image occupe au moins 60 % de sa surface
- trois éléments, pas neuf

## Le téléphone

La plupart des artisans ouvriront la page **sur leur téléphone**, pas sur un
écran d'ordinateur. Une page qui n'est belle qu'en large est une page ratée,
quelle que soit sa mise en page sur un grand écran.

Le piège mesuré : un titre dimensionné en `vw` s'effondre sur un téléphone. À
6,2 vw, 390 pixels de large donnent 24 pixels de titre. La formule qui produit
88 pixels sur un ordinateur produit une page fade sur un téléphone, et personne
ne le voit tant qu'on ne regarde que le grand écran.

**Le plancher mobile se déclare à part**, il ne se déduit pas d'une formule.

| | plancher |
|---|---|
| M0, débordement horizontal | aucun, jamais |
| M1, taille du titre | 40 px au minimum |
| M2, place du titre | 14 % du premier écran |
| M3, image sur le premier écran | 22 % de la surface |
| M4, plus petit texte rendu | 12 px |
| M5, cible tactile | 44 px dans sa plus petite dimension |
| M6, poids du premier écran | 420 Ko |
| M7, le comparateur suit le doigt | partout sur l'image, pas sur une bande |
| M8, le défilement reste possible | un glissement vertical fait défiler la page |

**Sur téléphone, l'image passe au-dessus du titre.** Empiler le panneau puis
l'image renvoie la photo sous la ligne de flottaison : le premier écran devient
un mur de texte. C'est le contraire de ce qu'on cherche.

**Toute l'image se saisit, pas une bande.** Un curseur natif posé au milieu de
la photo ne rend sensible qu'un bandeau de 76 pixels sur une image de 293 : au
doigt, neuf touchers sur dix ne font rien, et l'artisan conclut que ça ne marche
pas. Le glissement se pilote sur le cadre entier, et le sens décide : vertical,
la page défile ; horizontal, la couture suit. Le curseur reste dans la page pour
le clavier et les lecteurs d'écran.

**La photo coupée se recadre en hauteur sur téléphone.** Une image de rapport
1,93 tombe à 203 pixels de haut sur 390 de large : on ne lit plus une façade. En
4/3 elle remonte à 293. Le recadrage déplace la limite entre l'avant et l'après,
donc le filet est recalculé, il ne reste pas à côté de la vraie coupure.

**Les deux moitiés se nomment sur l'image.** Deux pastilles, « avant » sur la
partie en travaux et « après » sur la partie reprise, et les blocs de texte
en dessous disent laquelle ils décrivent. Empilés sur téléphone sans ce
repère, ils se suivent sans qu'on sache ce qu'ils désignent.

## Vérification du rendu, pas du code

`scripts/verifier-site.mjs` lit le fichier. Il ne peut pas voir qu'un titre
s'effondre à 24 pixels sur un téléphone, parce que le fichier, lui, déclare bien
un `clamp`.

`scripts/verifier-mobile.mjs` ouvre la page dans un vrai navigateur, en 390 par
844 puis en 360 par 740, et mesure ce qui s'affiche. Les sept planchers du
tableau y sont bloquants. Sur Windows il pilote le Chrome déjà installé, il n'y
a rien à télécharger.

    node scripts/verifier-mobile.mjs <dossier du site>

Un site n'est pas fini tant que les deux vérificateurs ne sortent pas à zéro.

## Ne pas remplir l'écran exactement

Le héros qui fait exactement la hauteur de la fenêtre oblige à deviner qu'il y a
une suite. Laisser dépasser la section suivante de quelques dizaines de pixels
dit la même chose sans indicateur de défilement, interdit par ailleurs.

## La grille

Une seule colonne centrée aux mêmes marges du haut en bas est un traitement de
texte. Il faut au moins deux traitements de largeur distincts dans la page :
pleine largeur, colonne étroite, décalage à droite, débord d'un seul côté.

## La matière fait la forme

La forme sort du sujet, elle ne lui est pas appliquée. Une entreprise qui
travaille des surfaces mérite une page où le grain de l'enduit est visible en
gros plan et où les couleurs viennent de ses propres façades. Une entreprise de
menuiserie n'aura pas la même page, et c'est le but.

## Références

Ce ne sont pas les autres sites d'artisans. C'est la monographie d'architecture
et le catalogue d'exposition : le métier traité avec le sérieux qu'on réserve à
un livre. Personne ne l'a jamais fait à un ravaleur.

## Vérification

`scripts/verifier-site.mjs` contrôle C1, C2 et C3, tous bloquants. Le reste est
un jugement, et il reste humain.


## Le texte se lit

Constaté le 14 septembre 2026, en photographiant la page écran par écran. Ces
fautes ne se voient pas dans le code, seulement à l'image.

- **Rien ne se pose sur le mot géant.** Une étiquette grise sur les lettres
  d'enduit ne se lit pas. Le mot descend, le texte garde le fond sombre.
- **Un bouton posé sur une photo est un aplat**, pas un voile translucide avec
  du blanc à 60 %. Texte à 700, fond opaque, état de survol franc.
- **La description d'un geste ne descend pas sous 15 px**, et sa couleur reste
  au-dessus de 0,78 de clarté sur fond sombre. En dessous, on ne la lit pas,
  on la devine.
- **Un emplacement vide dit ce qu'il attend**, en français, à la première
  personne de l'entreprise : « À compléter — ici viendra un avis de client ».
  Jamais « Emplacement 1 », jamais « numéro à compléter » collé dans un bouton
  d'appel : le visiteur croit à une page cassée.
- **Gauche et droite se nomment** : « À gauche, avant » et « À droite, après »,
  pas « la partie gauche ».

Repérage : `scripts/mesure-lisibilite.mjs`. Il signale large, y compris à tort
sur du texte fin ; on regarde ensuite les endroits qu'il pointe. Le plancher
opposable reste A7 dans `verifier-site.mjs`.

## Un premier écran qui vaut un écran vaut un écran entier

Une section qui doit remplir l'écran du téléphone n'est presque jamais seule :
au-dessus d'elle il y a une barre d'état, en dessous une barre d'appel fixe.
Écrire `height:100svh` sur la section seule donne donc toujours un premier
écran trop haut. Le 16 septembre 2026, l'atmosphère mesurait 1000 px sur un
écran de 844 : le nuancier, la ligne « Défiler » et le mot géant tombaient sous
le pli, et la page paraissait décalée.

Trois règles, dans cet ordre.

1. **Le groupe est l'unité, pas la section.** La barre d'état et la section
   sont réunies dans un même bloc (`.premier-ecran`), qui vaut
   `calc(100svh - hauteur de la barre d'appel)`. La section prend ce qui reste
   avec `flex:1`. La hauteur de la barre d'état dépend du nom de l'entreprise :
   elle ne peut jamais être écrite en dur.
2. **Ce qui doit rétrécir est la photo, pas le texte.** La photo est le seul
   bloc élastique : `flex:1` avec un plancher, image en `height:100%` et
   `object-fit:cover`. Les tailles de texte gardent leur plancher mobile ; un
   titre se mesure alors en `svh`, jamais en `vw`, puisque c'est la hauteur qui
   manque.
3. **Sur un écran court, on laisse couler.** En dessous d'une hauteur donnée,
   le groupe reprend une hauteur libre et se fait défiler. Cent pixels de trop
   valent mieux que deux blocs qui se recouvrent : un bloc recouvert n'est pas
   seulement laid, il n'est plus cliquable, et `M10` tombe en délai d'attente
   sans dire pourquoi.

## Un bloc qui déborde de sa rangée en recouvre un autre

Dans une grille ou une colonne flexible à hauteur contrainte, un bloc dont le
contenu dépasse la rangée qu'on lui a donnée ne pousse pas le suivant : il sort
de sa boîte et se superpose à lui. Le bloc recouvert n'est pas seulement laid,
**il n'est plus cliquable** — et la panne se lit alors comme un délai d'attente
sans cause apparente dans les contrôles.

Constaté le 23 septembre 2026 en portant l'écran d'ambiance sur les archétypes
`elevation` et `planche` : le nuancier se posait sur les boutons « Voir
l'avant » et « Voir l'après », et `verifier-ordinateur.mjs` mourait sur un clic
intercepté au lieu de nommer la faute.

Trois règles.

1. **La chaîne de hauteur doit être complète ou absente.** Si un bloc doit
   rétrécir, tous ses ancêtres portent `min-height:0` et la rangée est déclarée
   `minmax(0,1fr)`. Un `align-items:center` sur le conteneur casse la chaîne :
   l'élément reprend la hauteur de son contenu et ressort de la rangée.
2. **Un seul bloc élastique, et c'est l'image.** Le texte garde ses planchers.
3. **Quand la composition ne rentre pas, elle se laisse dépasser.** Hauteur
   libre et défilement plutôt que hauteur fixe et chevauchement.

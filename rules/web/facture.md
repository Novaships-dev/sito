# Facture

`design-interdits.md` dit ce qu'il ne faut pas faire. `composition.md` donne les
proportions. Ce fichier-ci dit **comment une page est faite**, au détail. Il
existe parce qu'une page peut respecter les deux autres et rester une brochure
de 2010 : des aplats, des rectangles, des filets d'un pixel, rien qui bouge.

Retirer tout ce qui est moderne sans rien mettre à la place n'est pas une
méthode. C'est ce qui s'est passé, et c'est ce que ce fichier corrige.

## F1. La typographie entre dans l'image

Poser un titre à côté d'une photo est une mise en page. Le faire entrer dedans
est un dessin. Trois façons, par ordre de force :

- **le mot découpé dans la matière** : `background-clip: text` sur une fenêtre
  d'enduit prélevée dans la photo de l'artisan. Le mot du métier est fait de la
  matière du métier. Prévoir la solution de repli `@supports not` et
  `prefers-contrast: more`, sinon le titre disparaît ;
- **le texte qui traverse une limite de couleur**, la même phrase changeant de
  traitement là où la façade change ;
- **le bloc de texte qui mord sur l'image** au lieu de se ranger dessous.

## F2. Le mouvement porte le sujet, il ne décore pas

La page d'un ravaleur raconte une transformation. Le mouvement doit dire ça, ou
ne pas exister.

Il se fait **sans script et sans écoute du défilement** : `animation-timeline:
view()`, sous `@supports`. Un plan de travail qui n'a pas la prise en charge
doit voir la page complète et correcte, pas une page vide.

**Une animation liée au défilement ne touche jamais l'opacité.** Un bloc qui
commence à zéro peut rester invisible si la plage ne se résout pas : on
translate, on ne fait pas disparaître. Cette règle vient d'un bloc resté noir à
l'écran.

`prefers-reduced-motion: reduce` coupe tout, sans exception.

## F3. La profondeur vient de la superposition

Pas d'ombre portée, pas de flou. Un élément passe devant un autre, un bloc
dépasse son cadre d'un seul côté, une image sort par le bord pendant que sa
voisine reste dans la marge. La grille se tient partout et se brise à un seul
endroit, choisi.

## F4. La matière du métier est le papier de la page

Le grain de l'enduit, prélevé dans une photo réelle, en fond à très faible
opacité. Ce n'est pas une texture d'habillage : c'est le sujet, en sourdine.

## F5. Les états sont dessinés

Un bouton n'est pas un rectangle d'un pixel. Un lien porte un filet qui se
rétracte au survol. Le focus est visible et choisi, jamais celui du système par
défaut, jamais supprimé. Toute commande tactile fait au moins 44 points.

## F6. Le détail se voit

Chiffres tabulaires dans les tableaux, `text-wrap: balance` sur les titres,
`pretty` sur les paragraphes, interlettrage négatif sur les grandes tailles,
filets en `color-mix` plutôt qu'en gris arbitraire, échelle d'espacement tenue.

## F7. Le plan de travail de 2026

Ce qui est disponible et qu'on utilise : `color-mix()` et OKLCH pour dériver une
couleur au lieu d'en inventer une, `@supports` pour tout ce qui est récent,
`svh` plutôt que `vh`, `clamp()` borné en pixels aux deux bouts, `:focus-visible`,
`text-wrap`, les animations liées au défilement.

Ce qu'on n'utilise pas : les bibliothèques d'animation, les bibliothèques
d'icônes, les cadres applicatifs. Une page d'artisan pèse moins de 300 Ko sur
téléphone. Rien de ce qui précède ne coûte un octet de script.

## Vérification

`verifier-site.mjs` contrôle ce qui se lit dans le fichier.
`verifier-mobile.mjs` ouvre la page dans un vrai navigateur et mesure le rendu,
y compris le comparateur essayé au doigt.

Ce fichier-ci n'est pas entièrement contrôlable par un script. Ce qui l'est :
les planchers de `composition.md` et les dix contrôles de téléphone. Le reste
est un jugement, et il reste humain.


## F8 — De l'air, de la lumière, du grain

Constat du 14 septembre 2026, après avoir mesuré les sites les mieux dessinés
du moment : ce qui sépare une page correcte d'une page qui impressionne n'est
ni la structure ni la taille du titre. C'est **l'atmosphère**. Voir
`docs/etude-framer.md`.

Sur l'archétype `matiere`, le premier écran porte quatre couches, dans cet
ordre de profondeur :

1. **une nappe de lumière** chaude, très floutée, qui respire lentement et
   dérive vers le pointeur ;
2. **un rai oblique** en `mix-blend-mode: screen`, qui balaie la page ;
3. **de la poussière** dans ce rai, en canvas décoratif (`data-decor="oui"`) ;
4. **du grain** sur toute la page, engendré au chargement, jamais téléchargé.

Le mot du métier passe en géant coupé par les bords, rempli avec la matière
prélevée sur les photos, et **le titre redescend** entre 32 et 38 px sur
ordinateur : le drame vient de l'environnement, pas du corps de la police.
Sur téléphone le titre remonte à 40 px au moins, plancher M1.

Chaque grandeur est tirée de la graine : durée du souffle, angle du rai,
largeur de la colonne, corps du mot géant, cadrage de la photo. Deux SIREN
n'ont pas la même respiration.

Ce qui reste interdit : le verre liquide (`backdrop-filter`), l'ombre portée
décorative, et tout mouvement qui touche l'opacité d'un bloc de contenu.


### F8 bis — Ce qu'on voit d'abord est ce qu'on peut prendre en main

L'atmosphère a d'abord été posée autour d'une photo fixe, avec le comparateur
renvoyé à l'écran suivant. Résultat : le visiteur tire sur la photo du premier
écran et rien ne bouge. Il en conclut que le site est cassé, et il a raison de
le conclure.

La règle : **le premier objet visible de la page est manipulable**. Sur
`matiere`, la photo dans la lumière EST le comparateur avant/après, avec ses
deux boutons et le nuancier juste dessous, le tout au-dessus de la ligne de
flottaison, téléphone compris (vérifié : cadre entre 442 et 708 px sur un
écran de 844).

### F8 ter — L'ambiance s'arrête au doigt

Trois couches animées en permanence — un flou de 58 px plein écran, un fondu
d'écran, un calque de grain en `position:fixed` trois fois plus grand que
l'écran — coûtent trop cher sur un téléphone, et sur iOS un `mix-blend-mode`
en position fixe peut barbouiller la page entière.

Sous `(pointer:coarse)` : la lumière reste mais ne s'anime plus, le grain
devient un calque local au premier écran, la poussière disparaît. Mesuré à
48 images par seconde pendant un défilement sur un écran de 390 px.

# Couverture et zinguerie — les 32 prompts

À coller tels quels dans ChatGPT, un par image. Le nom de fichier est celui que
le générateur attend : renomme l'image dès le téléchargement. Le cadrage et la
largeur minimale ne sont pas décoratifs : en dessous de la largeur indiquée, le
site afficherait un agrandissement, et un cadrage faux est refusé par
`node scripts/verifier-images.mjs couverture`.

Métier `couverture` du plan (`generateur/banque/plan-images.json`) : mot géant
« Toiture », matière « tuile et zinc », détail principal `detail-zinc.jpg`.

## Le bloc à coller UNE FOIS en tête de conversation

> Tu es photographe documentaire spécialisé bâtiment. Toutes les images que tu
> vas produire sont des photographies réalistes prises en France, région
> méditerranéenne (Marseille, Aix, arrière-pays provençal). Règles valables
> pour toutes les images, sans exception :
> — aucune personne visible en entier, aucun visage, jamais ; pour les gestes,
>   des mains et des avant-bras seulement ;
> — aucun texte lisible : ni enseigne, ni plaque de rue, ni marque sur un
>   outil, une palette ou un véhicule ;
> — architecture française méditerranéenne : tuiles canal ou tuiles
>   mécaniques, génoises, zinc, pierre calcaire, volets bois ou métal ;
> — point de vue d'un couvreur sur son chantier : depuis l'échafaudage, depuis
>   une échelle, depuis la rue ou le toit voisin. Jamais de vue aérienne de
>   drone, jamais de maquette ni de rendu 3D ;
> — lumière de fin d'après-midi, rasante, ombres longues, ciel clair et banal,
>   jamais de coucher de soleil spectaculaire ;
> — objectif 35 mm ou 50 mm, pas de grand-angle déformant ;
> — couleurs naturelles, contraste doux, aucune retouche HDR, aucune
>   saturation publicitaire, grain photographique fin ;
> — pas de filigrane, pas de cadre, pas de bordure, pas de collage.
> Confirme en un mot, puis attends mes demandes une par une.

Ensuite, une image par message, avec le prompt ci-dessous.

---

## Les deux hero — la coupure avant/après dans une seule image

La coupure est **verticale et franche**, et elle tombe sur une ligne du
bâtiment (rangée de tuiles, arête, lucarne). C'est ce que le site met en
première page : une toiture à moitié refaite doit se lire en une seconde.

### 1 — `hero.jpg` · 16/9 · 1600 px

> Toiture en tuiles canal d'une maison de village provençale, photographiée
> depuis le toit voisin, objectif 35 mm, le pan de toit occupe les deux tiers
> bas du cadre. **La moitié gauche est déposée** : les tuiles sont enlevées et
> empilées en bas de pan, les liteaux de bois et l'écran sous-toiture gris
> apparaissent en rangées régulières. **La moitié droite est recouverte** :
> tuiles canal reposées, alignement net, faîtage scellé au mortier clair. La
> limite entre les deux moitiés est verticale et tombe exactement sur une
> rangée de tuiles, au centre de l'image. Fin d'après-midi, lumière rasante
> venant de la droite qui dessine le relief de chaque tuile. Photographie
> documentaire, couleurs naturelles. Format 16/9.

### 2 — `hero-variante-2.jpg` · 16/9 · 1600 px

> Toit à deux pans d'une maison de campagne, vu depuis le sol en légère
> contre-plongée, objectif 50 mm. **Moitié gauche** : tuiles mécaniques
> noircies, envahies de mousse par plaques, deux tuiles cassées, mortier de
> faîtage tombé. **Moitié droite** : tuiles neuves teinte terre cuite,
> alignement régulier, faîtières scellées. La coupure est verticale et suit
> l'arête du toit jusqu'au faîtage. Fin d'après-midi, lumière rasante.
> Format 16/9.

---

## Les trois paires avant/après — méthode obligatoire

**Toujours générer l'APRÈS d'abord**, puis demander la dégradation **de cette
image même**. Jamais deux images séparées : on obtiendrait deux toitures
différentes et le comparateur du site n'aurait aucun sens.

### 4 — `apres-01.jpg` · 4/3 · 1400 px — *à générer en premier*

> Toiture en tuiles canal d'une maison de village, vue depuis le toit d'en
> face, objectif 50 mm, le pan de toit remplit le cadre. Toiture nettoyée et
> entièrement recouverte : tuiles canal propres, courbes régulières, rangées
> parfaitement alignées, faîtage scellé au mortier clair, génoise nette en bas
> de pan. Fin d'après-midi, lumière rasante venant de la gauche. Photographie
> documentaire, couleurs naturelles. Format 4/3.

### 3 — `avant-01.jpg` · 4/3 · 1400 px — *modification de l'image précédente*

> Reprends **exactement cette image**. Garde le même toit, le même cadrage, la
> même focale, la même lumière, la même heure. Change uniquement l'état de la
> couverture : mousse épaisse installée par plaques sur les tuiles, plusieurs
> tuiles glissées hors de leur rang, deux tuiles cassées laissant voir le
> liteau, mortier de faîtage descellé et tombé par endroits, traces noires de
> ruissellement. Rien d'autre ne bouge : la pente, la génoise, le faîtage et
> l'arrière-plan restent au même endroit, au pixel près.

### 6 — `apres-02.jpg` · 4/3 · 1400 px — *à générer en premier*

> Gouttière pendante en zinc neuf le long d'une rive de toit, vue depuis le sol
> en contre-plongée, objectif 50 mm, la gouttière traverse le cadre en
> diagonale douce. Zinc clair sans bosse, crochets réguliers, about de
> gouttière soudé net, planche de rive repeinte, tuiles de rive alignées
> au-dessus. Fin d'après-midi, lumière rasante, ombre portée nette sur la
> façade. Format 4/3.

### 5 — `avant-02.jpg` · 4/3 · 1400 px — *modification*

> Reprends **exactement cette image**, même gouttière, même cadrage, même
> lumière. Change seulement l'état : zinc percé et fendu en deux endroits,
> gouttière déformée et affaissée entre deux crochets, crochets tordus et
> rouillés, planche de rive grise et fendue, coulures sombres sur la façade
> sous la fuite. Aucun autre changement.

### 8 — `apres-03.jpg` · 4/3 · 1400 px — *à générer en premier*

> Souche de cheminée en maçonnerie sur un toit de tuiles, vue depuis le pan de
> toit, objectif 50 mm, la souche occupe le centre du cadre. Souche reprise :
> enduit neuf sans fissure, couronnement droit, **solin en zinc neuf** engagé
> dans la maçonnerie et rabattu sur les tuiles, pliage net, soudure propre aux
> angles. Fin d'après-midi, lumière rasante. Format 4/3.

### 7 — `avant-03.jpg` · 4/3 · 1400 px — *modification*

> Reprends **exactement cette image**, même souche, même cadrage, même lumière.
> Change seulement l'état : enduit de la souche fissuré et décollé par plaques,
> couronnement épaufré, solin ouvert et soulevé laissant un jour entre le zinc
> et la maçonnerie, traces d'infiltration sombres sur les tuiles au pied de la
> souche. Aucun autre changement.

---

## Les trois chantier

### 9 — `chantier.jpg` · 4/3 · 1400 px

> Échafaudage de toit monté le long d'une façade, avec garde-corps et filet de
> sécurité tendu, et une palette de tuiles canal cerclée hissée sur le plancher
> d'échafaudage. Vue depuis le trottoir d'en face, objectif 35 mm. Aucune
> personne, aucune marque lisible sur le cerclage. Fin d'après-midi.
> Format 4/3.

### 10 — `chantier-2.jpg` · 4/3 · 1400 px

> Pan de toit en cours : la moitié basse porte un écran sous-toiture gris
> agrafé et des liteaux de bois cloués en rangées régulières, la moitié haute
> est encore en tuiles anciennes. Vue depuis le haut du pan, objectif 35 mm,
> les rangées fuient vers le bas du cadre. Aucune personne. Lumière rasante de
> fin de journée. Format 4/3.

### 11 — `chantier-3.jpg` · 4/3 · 1400 px

> Monte-matériaux appuyé contre une façade, rail incliné jusqu'au bord du toit,
> plateau chargé de tuiles canal à mi-hauteur, piles de tuiles en attente sur
> le trottoir protégé par des plaques. Vue depuis la rue, objectif 35 mm,
> légère contre-plongée. Aucune personne. Format 4/3.

---

## Les cinq geste — mains et outils, jamais de visage

### 12 — `geste.jpg` · 4/3 · 1400 px

> Gros plan sur deux mains d'artisan qui posent une tuile canal sur un liteau
> de bois : la tuile est tenue par ses deux bords, le rang déjà posé est
> visible en dessous, l'écran sous-toiture gris apparaît entre les liteaux.
> Manches de veste de travail usées, poussière de terre cuite sur la peau.
> Cadrage serré : on ne voit que les mains, les avant-bras, la tuile et le
> toit. Aucun visage, aucun corps. Objectif 50 mm, faible profondeur de champ,
> lumière rasante de fin de journée. Format 4/3.

### 13 — `geste-2.jpg` · 4/3 · 1400 px

> Gros plan sur un fer à souder de couvreur posé sur une jonction de deux
> feuilles de zinc : la goutte d'étain fond et s'étale le long du joint, un
> mince filet de fumée monte, la panne du fer est noircie. Une main gantée
> seulement, aucun visage. Objectif 50 mm, lumière rasante qui fait briller le
> zinc. Format 4/3.

### 14 — `geste-3.jpg` · 4/3 · 1400 px

> Gros plan sur une cisaille à tôle qui découpe une feuille de zinc : la coupe
> est amorcée sur un tiers de la feuille, le bord découpé se relève
> légèrement, des chutes de zinc enroulées sont posées à côté. Mains gantées
> seulement, aucun visage. Objectif 50 mm. Format 4/3.

### 15 — `geste-4.jpg` · 4/3 · 1400 px

> Gros plan sur une plieuse à main serrée sur une bande de zinc : le pli est
> fait sur la moitié de la longueur, arête vive et régulière, le reste de la
> bande est encore plat. Deux mains seulement, aucun visage. Objectif 50 mm,
> lumière rasante qui souligne l'arête du pli. Format 4/3.

### 16 — `geste-5.jpg` · 4/3 · 1400 px

> Gros plan sur une main à la truelle qui scelle une tuile faîtière au mortier :
> bourrelet de mortier frais lissé le long de la faîtière, excédent coupé net,
> tuiles du rang visibles de part et d'autre. Aucun visage. Objectif 50 mm.
> Format 4/3.

---

## Les huit matière — macros à dix centimètres

### 17 — `detail-zinc.jpg` · 4/3 · 1400 px — **la plus importante du lot**

> Macrophotographie d'une feuille de zinc neuve pliée, prise à dix centimètres,
> le zinc remplit tout le cadre : une arête de pli traverse l'image en
> diagonale, la surface porte le fin moirage gris du zinc laminé, un reflet
> doux glisse le long du pli. Lumière très rasante venant de la gauche qui fait
> ressortir le relief du pli et la matière du métal. Netteté parfaite d'un bord
> à l'autre, objectif macro, aucune profondeur de champ floue. Format 4/3.
>
> *Cette image sert au remplissage du mot géant, au rendu de matière du site et
> au prélèvement de la palette. Il faut une arête nette et un gris franc, ni
> bleuté ni verdâtre, sinon le site entier devient terne.*

### 18 — `matiere-02.jpg` · 4/3 · 1400 px
> Macro d'une tuile canal neuve en terre cuite, prise à dix centimètres : la
> courbe de la tuile traverse le cadre, l'ombre portée se creuse dans le galbe,
> grain de terre cuite visible, teinte terre cuite chaude. Lumière rasante,
> netteté totale, plein cadre. Format 4/3.

### 19 — `matiere-03.jpg` · 4/3 · 1400 px
> Macro d'une tuile ancienne couverte de mousse : coussins de mousse verte et
> lichen gris installés dans le creux de la tuile, terre cuite délavée visible
> par endroits. Lumière rasante. Format 4/3.

### 20 — `matiere-04.jpg` · 4/3 · 1400 px
> Macro d'une soudure à l'étain sur zinc : le cordon d'étain court le long du
> joint, légèrement bombé et brillant, le zinc mat de part et d'autre. Lumière
> rasante qui sépare le brillant du mat. Format 4/3.

### 21 — `matiere-05.jpg` · 4/3 · 1400 px
> Macro d'un faîtage scellé au mortier : deux tuiles faîtières, bourrelet de
> mortier frais lissé et brossé entre elles, grain de sable visible dans le
> mortier. Lumière rasante. Format 4/3.

### 22 — `matiere-06.jpg` · 4/3 · 1400 px
> Macro d'un liteau de bois cloué sur un écran sous-toiture gris : fibre du
> bois nette, tête de clou enfoncée, maille de l'écran lisible sous le liteau.
> Lumière rasante. Format 4/3.

### 23 — `matiere-07.jpg` · 4/3 · 1400 px
> Macro d'un solin de zinc encastré dans une maçonnerie : le zinc est engagé
> dans un trait de scie rempli de mastic, la pierre calcaire occupe le haut du
> cadre, le zinc rabattu le bas. Lumière rasante. Format 4/3.

### 24 — `matiere-08.jpg` · 4/3 · 1400 px
> Macro d'un chéneau en zinc vu de dessus, une eau claire et peu profonde au
> fond qui reflète le ciel, parois de zinc propres, soudure longitudinale
> visible. Lumière de fin de journée. Format 4/3.

---

## Les cinq ambiance

### 25 — `ambiance-01.jpg` · 3/2 · 1400 px
> Ligne de faîtage d'un toit de tuiles canal se découpant sur un ciel de fin de
> journée, vue en contre-plongée depuis le pan opposé, objectif 50 mm. Les
> faîtières forment une ligne régulière du bord gauche au bord droit du cadre.
> Aucune personne. Format 3/2.

### 26 — `ambiance-02.jpg` · 3/2 · 1400 px
> Toit vu depuis le haut d'une échelle appuyée à la gouttière : les rangées de
> tuiles fuient en perspective vers le faîtage, les deux montants de l'échelle
> entrent dans le bas du cadre. Objectif 35 mm, fin d'après-midi. Aucune
> personne. Format 3/2.

### 27 — `ambiance-03.jpg` · 3/2 · 1400 px
> Deux palettes de tuiles canal cerclées, posées sur le plancher d'échafaudage
> au bord d'un toit, vues de côté, objectif 50 mm. Ombres longues de fin de
> journée sur les tuiles. Aucune marque lisible, aucune personne. Format 3/2.

### 28 — `ambiance-04.jpg` · 3/2 · 1400 px
> Gouttière en zinc neuve fixée contre une façade enduite, vue en léger
> contre-plongée, objectif 50 mm : le zinc clair tranche sur l'enduit, l'ombre
> portée de la gouttière dessine une ligne nette sur le mur. Format 3/2.

### 29 — `ambiance-05.jpg` · 3/2 · 1400 px
> Vue plongeante sur les toits d'un village provençal en fin de journée : nappe
> de tuiles canal de teintes mêlées, souches de cheminée, une ou deux lucarnes,
> collines au fond. Objectif 50 mm, lumière rasante. Aucune personne.
> Format 3/2.

---

## Les trois signes — textures de fond, plein cadre

### 30 — `signe-01.jpg` · 1/1 · 1400 px
> Trame de tuiles canal photographiée strictement de face, parfaitement à plat,
> remplissant tout le cadre, éclairage uniforme et doux, aucune ombre portée,
> aucun bord de toit, aucun objet. Utilisable en fond répétable. Format carré.

### 31 — `signe-02.jpg` · 1/1 · 1400 px
> Texture de zinc patiné photographiée de face, à plat, plein cadre, éclairage
> uniforme : moirage gris doux, fines rayures de laminage, aucune profondeur,
> aucun pli. Format carré.

### 32 — `signe-03.jpg` · 1/1 · 1400 px
> Macro du grain d'une ardoise naturelle, de face, à plat, plein cadre :
> feuilletage fin, teinte gris-bleu sombre, éclairage uniforme. Aucun objet
> identifiable. Format carré.

---

## Contrôle avant de ranger les fichiers

1. Les trois paires se superposent : la pente, la rive et l'arrière-plan sont
   au même endroit sur l'avant et sur l'après, et les deux fichiers ont
   **exactement les mêmes dimensions** (le vérificateur le mesure).
2. `hero.jpg` et `hero-variante-2.jpg` : la coupure est verticale et franche.
3. `detail-zinc.jpg` : arête de pli nette à 300 % d'agrandissement, gris franc.
4. Aucune image ne contient de visage ni de texte lisible.
5. Toutes font au moins la largeur demandée : 1600 px pour les deux hero,
   1400 px pour les trente autres.

Renommer exactement comme indiqué, puis ranger :

```
images/couverture/sources/         hero, hero-variante-2,
                                   avant-01 à 03, apres-01 à 03,
                                   chantier, chantier-2, chantier-3,
                                   geste, geste-2 à geste-5, detail-zinc
images/couverture/banque/matiere/  matiere-02 à matiere-08
images/couverture/banque/ambiance/ ambiance-01 à ambiance-05
images/couverture/banque/signes/   signe-01 à signe-03
```

Puis mesurer, avant toute fabrication de site :

```
node scripts/verifier-images.mjs couverture
```

Les 22 images suivantes (8 hero et 7 paires de plus, pour tenir 100 sites
différents dans un même département) viennent après ce premier jeu de 32, sur
le modèle de `banque/prompts/ravalement-22-images.md`.

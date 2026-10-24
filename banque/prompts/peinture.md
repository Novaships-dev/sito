# Peinture intérieure — les 32 prompts

À coller tels quels dans ChatGPT, un par image. Le nom de fichier est celui que
le générateur attend : renomme l'image dès le téléchargement. Le cadrage et la
largeur minimale ne sont pas décoratifs : en dessous de la largeur indiquée, le
site afficherait un agrandissement, et un cadrage faux est refusé par
`node scripts/verifier-images.mjs peinture`.

Métier `peinture` du plan (`generateur/banque/plan-images.json`) : mot géant
« Peinture », matière « mur fini », détail principal `detail-peinture.jpg`.

Ce métier se photographie **dedans**. Le piège de l'intérieur, c'est la photo
de catalogue : pièce meublée, décoration parfaite, lumière de studio. Ce n'est
pas ce qu'il faut. Ce sont des pièces d'habitation françaises ordinaires, vues
pendant ou juste après le chantier, éclairées par la fenêtre.

## Le bloc à coller UNE FOIS en tête de conversation

> Tu es photographe documentaire spécialisé bâtiment. Toutes les images que tu
> vas produire sont des photographies réalistes prises à l'intérieur de
> logements français ordinaires (appartement haussmannien modeste, immeuble des
> années 1970, maison de ville). Règles valables pour toutes les images, sans
> exception :
> — aucune personne visible en entier, aucun visage, jamais ; pour les gestes,
>   des mains et des avant-bras seulement ;
> — aucun texte lisible : ni marque sur un pot, ni étiquette, ni affiche, ni
>   écran ;
> — pièces d'habitation banales : plinthes bois, portes à panneaux, moulures
>   simples, parquet ou carrelage, radiateur, interrupteur, prise ;
> — pièces vides ou presque, pendant ou juste après le chantier : pas de
>   décoration de magazine, pas de meuble design, pas de plante en scène, pas
>   de table dressée ;
> — lumière du jour venant d'une fenêtre hors champ ou visible, douce,
>   latérale ; aucun éclairage de studio, aucun flash, aucune lumière colorée ;
> — objectif 35 mm ou 50 mm, hauteur d'œil, lignes verticales droites, pas de
>   grand-angle déformant ;
> — couleurs naturelles, contraste doux, aucune retouche HDR, aucune
>   saturation publicitaire, grain photographique fin ;
> — pas de filigrane, pas de cadre, pas de bordure, pas de collage.
> Confirme en un mot, puis attends mes demandes une par une.

Ensuite, une image par message, avec le prompt ci-dessous.

---

## Les deux hero — la coupure avant/après dans une seule image

La coupure est **verticale et franche**, et elle tombe sur une ligne de la
pièce (angle de mur, encadrement de porte). C'est la première image du site :
la pièce à moitié refaite doit se lire en une seconde.

### 1 — `hero.jpg` · 16/9 · 1600 px

> Grande pièce d'habitation vide, photographiée de face depuis la porte,
> objectif 35 mm, hauteur d'œil, deux murs visibles de part et d'autre de
> l'angle. **La moitié gauche est en travaux** : sol entièrement bâché de
> plastique, ruban de masquage posé sur la plinthe et le chambranle, mur en
> sous-couche blanche irrégulière avec taches de rebouchage encore visibles,
> escabeau replié contre le mur. **La moitié droite est finie** : mur peint
> d'un gris-beige uni et régulier, plinthe blanche nette, parquet dégagé et
> propre. La limite entre les deux moitiés tombe exactement sur l'angle
> vertical du mur, au centre de l'image. Lumière du jour venant d'une fenêtre à
> droite, douce et latérale. Photographie documentaire, couleurs naturelles.
> Format 16/9.

### 2 — `hero-variante-2.jpg` · 16/9 · 1600 px

> Couloir d'appartement photographié dans l'axe, objectif 50 mm, hauteur d'œil,
> une porte au fond. **Moitié gauche** : papier peint arraché par bandes,
> plâtre nu apparent, traces de colle sèche, plinthe décapée. **Moitié
> droite** : mur peint blanc cassé uni, plinthe repeinte, encadrement de porte
> net. La coupure est verticale et tombe sur l'arête de l'encadrement de la
> porte. Lumière du jour venant d'une pièce latérale. Format 16/9.

---

## Les trois paires avant/après — méthode obligatoire

**Toujours générer l'APRÈS d'abord**, puis demander la dégradation **de cette
image même**. Jamais deux images séparées : on obtiendrait deux pièces
différentes et le comparateur du site n'aurait aucun sens.

### 4 — `apres-01.jpg` · 4/3 · 1400 px — *à générer en premier*

> Salon vide d'un appartement ordinaire, mur du fond photographié de face,
> objectif 50 mm, hauteur d'œil, le mur remplit le cadre avec la plinthe en bas
> et un bout de plafond en haut. Mur fraîchement peint : teinte blanc chaud
> parfaitement uniforme, aucune trace de reprise, plinthe bois repeinte en
> blanc satiné avec une arête nette contre le parquet, prise électrique propre
> et bien entourée. Lumière du jour venant d'une fenêtre à gauche, rasante sur
> le mur. Photographie documentaire, couleurs naturelles. Format 4/3.

### 3 — `avant-01.jpg` · 4/3 · 1400 px — *modification de l'image précédente*

> Reprends **exactement cette image**. Garde la même pièce, le même cadrage, la
> même focale, la même lumière, la même heure. Change uniquement l'état des
> surfaces : mur marqué de rectangles plus clairs laissés par des meubles,
> traces de doigts et frottements, fissures capillaires fines qui partent du
> haut du mur, plinthe jaunie et écaillée, auréole grise autour de la prise.
> Rien d'autre ne bouge : la plinthe, la prise, le parquet et le plafond
> restent au même endroit, au pixel près.

### 6 — `apres-02.jpg` · 4/3 · 1400 px — *à générer en premier*

> Cage d'escalier d'un petit immeuble, photographiée depuis un palier,
> objectif 35 mm : la volée de marches monte à droite, la rampe en bois suit la
> montée, le mur d'échiffre occupe la gauche du cadre. Murs repeints d'un gris
> très clair uniforme, rampe en bois reprise et vernie, nez de marche propres,
> mur du palier net jusqu'au plafond. Lumière du jour venant d'une fenêtre de
> palier hors champ. Format 4/3.

### 5 — `avant-02.jpg` · 4/3 · 1400 px — *modification*

> Reprends **exactement cette image**, même cage d'escalier, même cadrage, même
> lumière. Change seulement l'état : peinture des murs écaillée par plaques à
> hauteur de main, cloques le long de l'échiffre, traces noires de frottement,
> rampe en bois à la peinture craquelée et partie en écailles, pied des murs
> encrassé. Aucun autre changement.

### 8 — `apres-03.jpg` · 4/3 · 1400 px — *à générer en premier*

> Chambre vide, angle de deux murs photographié de face, objectif 50 mm, un
> radiateur sous la fenêtre à droite du cadre. Murs peints d'un vert sauge
> doux, parfaitement unis, angle vertical droit et net entre les deux murs,
> raccord propre au plafond, plinthe blanche. Lumière du jour venant de la
> fenêtre, douce. Format 4/3.

### 7 — `avant-03.jpg` · 4/3 · 1400 px — *modification*

> Reprends **exactement cette image**, même chambre, même cadrage, même
> lumière. Change seulement l'état : papier peint à petits motifs datés sur les
> deux murs, décollé et retroussé dans l'angle vertical et au-dessus de la
> plinthe, lés mal raccordés, bulles le long du mur. Aucun autre changement.

---

## Les trois chantier

### 9 — `chantier.jpg` · 4/3 · 1400 px

> Pièce vide entièrement bâchée pour une mise en peinture : plastique de
> protection sur tout le sol et remonté sur les plinthes, escabeau ouvert au
> milieu, pots de peinture fermés alignés le long du mur, rouleau et bac posés
> au sol. Vue depuis la porte, objectif 35 mm. Aucune personne, aucune marque
> lisible sur les pots. Lumière du jour par la fenêtre. Format 4/3.

### 10 — `chantier-2.jpg` · 4/3 · 1400 px

> Détail d'une pièce préparée avant la première passe : ruban de masquage posé
> bien droit sur la plinthe, sur le chambranle de la porte et autour d'un
> interrupteur, plastique agrafé en bas de mur, mur encore en sous-couche. Vue
> de trois quarts, objectif 50 mm, légère plongée. Aucune personne.
> Format 4/3.

### 11 — `chantier-3.jpg` · 4/3 · 1400 px

> Bac à peinture posé sur une bâche, rempli de peinture blanche, rouleau chargé
> appuyé sur la grille d'égouttage, manche télescopique couché en diagonale dans
> le cadre, quelques gouttes séchées sur la bâche. Objectif 50 mm, plongée
> franche. Aucune personne. Format 4/3.

---

## Les cinq geste — mains et outils, jamais de visage

### 12 — `geste.jpg` · 4/3 · 1400 px

> Gros plan sur une main et un avant-bras qui passent un rouleau sur un mur :
> la bande fraîche déposée est nette et plus foncée que le mur encore sec à
> côté, le grain du rouleau se lit dans la peinture humide. Manche de veste de
> travail usé, quelques gouttes de peinture sur la peau. Cadrage serré : on ne
> voit que la main, l'avant-bras, le rouleau et le mur. Aucun visage, aucun
> corps. Objectif 50 mm, faible profondeur de champ, lumière du jour rasante.
> Format 4/3.

### 13 — `geste-2.jpg` · 4/3 · 1400 px

> Gros plan sur une main qui tire un pinceau à rechampir le long d'une
> plinthe : la bande de peinture suit l'arête sans la dépasser, les soies du
> pinceau sont chargées, le parquet est protégé juste en dessous. Aucun visage.
> Objectif 50 mm, lumière du jour latérale. Format 4/3.

### 14 — `geste-3.jpg` · 4/3 · 1400 px

> Gros plan sur une spatule large qui reboucha une fissure à l'enduit : la
> fissure est ouverte en V sur le mur, l'enduit frais est tiré par-dessus et
> déborde légèrement de part et d'autre de la lame. Mains seulement, aucun
> visage. Objectif 50 mm. Format 4/3.

### 15 — `geste-4.jpg` · 4/3 · 1400 px

> Gros plan sur une cale à poncer passée sur un rebouchage sec : la tache
> claire d'enduit s'arase au niveau du mur, une fine poussière blanche reste en
> suspension devant la surface et se dépose au pied du mur. Main gantée
> seulement, aucun visage. Objectif 50 mm, lumière rasante qui révèle la
> poussière. Format 4/3.

### 16 — `geste-5.jpg` · 4/3 · 1400 px

> Gros plan sur deux mains qui tirent une bande de ruban de masquage d'un geste
> continu le long d'un chambranle : le rouleau de ruban est tenu d'une main, la
> bande posée est plaquée de l'autre, parfaitement droite. Aucun visage, aucune
> marque lisible sur le rouleau. Objectif 50 mm. Format 4/3.

---

## Les huit matière — macros à dix centimètres

### 17 — `detail-peinture.jpg` · 4/3 · 1400 px — **la plus importante du lot**

> Macrophotographie d'un mur fraîchement peint au rouleau, prise à dix
> centimètres, le mur remplit tout le cadre : le grain régulier laissé par le
> rouleau se lit sur toute la surface, teinte blanc chaud légèrement crème,
> aucune trace de reprise ni de coulure. Lumière très rasante venant de la
> gauche qui fait ressortir chaque relief du grain. Netteté parfaite d'un bord à
> l'autre, objectif macro, aucune profondeur de champ floue. Format 4/3.
>
> *Cette image sert au remplissage du mot géant, au rendu de matière du site et
> au prélèvement de la palette. Il faut du grain net et un blanc chaud franc,
> ni gris ni bleuté, sinon le site entier devient terne.*

### 18 — `matiere-02.jpg` · 4/3 · 1400 px
> Macro d'un mur laqué satiné : surface parfaitement lisse, reflet doux et
> étiré de la fenêtre qui traverse le cadre en diagonale, teinte blanc cassé.
> Lumière latérale, netteté totale, plein cadre. Format 4/3.

### 19 — `matiere-03.jpg` · 4/3 · 1400 px
> Macro de la bande de finition entre deux teintes, à l'angle de deux murs : la
> limite verticale est franche et droite, un bleu profond à gauche, un blanc
> chaud à droite, grain de rouleau identique des deux côtés. Lumière rasante.
> Format 4/3.

### 20 — `matiere-04.jpg` · 4/3 · 1400 px
> Macro d'une plinthe peinte en blanc satiné au pied d'un mur coloré : l'arête
> de la plinthe contre le parquet est nette, aucune bavure sur le bois, le
> raccord mur-plinthe est droit. Lumière rasante. Format 4/3.

### 21 — `matiere-05.jpg` · 4/3 · 1400 px
> Macro d'un enduit de rebouchage poncé sur un mur : tache claire bien arasée,
> contour estompé, fine poussière restante, trait de fissure encore devinable
> au centre. Lumière rasante. Format 4/3.

### 22 — `matiere-06.jpg` · 4/3 · 1400 px
> Macro d'un papier peint décollé : le lé se retrousse et laisse voir le plâtre
> nu en dessous, restes de colle sèche en plaques, bord du papier déchiré en
> dentelle. Lumière rasante. Format 4/3.

### 23 — `matiere-07.jpg` · 4/3 · 1400 px
> Macro d'une boiserie laquée : la laque est lisse et pleine, et le veinage du
> bois reste lisible en relief très léger sous la peinture. Lumière rasante.
> Format 4/3.

### 24 — `matiere-08.jpg` · 4/3 · 1400 px
> Macro d'un nuancier de teintes en éventail tenu ouvert contre un mur peint :
> les languettes de couleur se chevauchent en dégradé de gris et de beiges,
> aucun texte ni code lisible. Lumière du jour douce. Format 4/3.

---

## Les cinq ambiance

### 25 — `ambiance-01.jpg` · 3/2 · 1400 px
> Pièce vide et entièrement bâchée, vue depuis la porte, objectif 35 mm : la
> lumière de la fenêtre tombe en nappe sur le plastique du sol et se reflète
> doucement, murs en sous-couche. Aucune personne. Format 3/2.

### 26 — `ambiance-02.jpg` · 3/2 · 1400 px
> Pots refermés, rouleaux lavés et pinceaux posés à sécher, rangés le long d'un
> mur en fin de journée, vus en légère plongée, objectif 50 mm. Ombres longues
> sur la bâche. Aucune marque lisible, aucune personne. Format 3/2.

### 27 — `ambiance-03.jpg` · 3/2 · 1400 px
> Escabeau ouvert, en silhouette à contre-jour devant un mur fraîchement peint,
> la fenêtre derrière lui, objectif 50 mm : le mur est uni, l'escabeau se
> découpe en ombre nette. Aucune personne. Format 3/2.

### 28 — `ambiance-04.jpg` · 3/2 · 1400 px
> Reflet de la fenêtre sur un mur satiné : le rectangle de lumière et les
> montants de la fenêtre se devinent dans le reflet, le reste du mur reste
> sombre et uni. Objectif 50 mm. Format 3/2.

### 29 — `ambiance-05.jpg` · 3/2 · 1400 px
> Porte intérieure fraîchement peinte, entrouverte sur une pièce claire, vue de
> face, objectif 50 mm : laque blanche nette sur les panneaux, chambranle
> repeint, bande de lumière qui sort de la pièce. Aucune personne. Format 3/2.

---

## Les trois signes — textures de fond, plein cadre

### 30 — `signe-01.jpg` · 1/1 · 1400 px
> Aplat de peinture mate photographié strictement de face, parfaitement à plat,
> remplissant tout le cadre, éclairage uniforme et doux, aucune ombre portée,
> aucun bord de mur, aucun objet. Teinte blanc chaud. Utilisable en fond
> répétable. Format carré.

### 31 — `signe-02.jpg` · 1/1 · 1400 px
> Texture de grain de rouleau photographiée de face, à plat, plein cadre,
> éclairage uniforme : relief fin et régulier, aucune profondeur, aucune
> coulure. Format carré.

### 32 — `signe-03.jpg` · 1/1 · 1400 px
> Macro du grain d'une toile de bâche de peintre, de face, à plat, plein cadre :
> tissage visible, plis très doux, teinte écrue, éclairage uniforme. Aucun
> objet identifiable. Format carré.

---

## Contrôle avant de ranger les fichiers

1. Les trois paires se superposent : plinthes, prises, radiateur et plafond
   sont au même endroit sur l'avant et sur l'après, et les deux fichiers ont
   **exactement les mêmes dimensions** (le vérificateur le mesure).
2. `hero.jpg` et `hero-variante-2.jpg` : la coupure est verticale et franche.
3. `detail-peinture.jpg` : grain net à 300 % d'agrandissement, blanc chaud.
4. Aucune image ne contient de visage ni de texte lisible.
5. Toutes font au moins la largeur demandée : 1600 px pour les deux hero,
   1400 px pour les trente autres.

Renommer exactement comme indiqué, puis ranger :

```
images/peinture/sources/         hero, hero-variante-2,
                                 avant-01 à 03, apres-01 à 03,
                                 chantier, chantier-2, chantier-3,
                                 geste, geste-2 à geste-5, detail-peinture
images/peinture/banque/matiere/  matiere-02 à matiere-08
images/peinture/banque/ambiance/ ambiance-01 à ambiance-05
images/peinture/banque/signes/   signe-01 à signe-03
```

Puis mesurer, avant toute fabrication de site :

```
node scripts/verifier-images.mjs peinture
```

Les 22 images suivantes (8 hero et 7 paires de plus, pour tenir 100 sites
différents dans un même département) viennent après ce premier jeu de 32, sur
le modèle de `banque/prompts/ravalement-22-images.md`.

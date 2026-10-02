# Ravalement — les 32 prompts

À coller tels quels dans ChatGPT, un par image. Le nom de fichier est celui que
le générateur attend : renomme l'image dès le téléchargement.

## Le bloc à coller UNE FOIS en tête de conversation

> Tu es photographe documentaire spécialisé bâtiment. Toutes les images que tu
> vas produire sont des photographies réalistes prises en France, région
> méditerranéenne (Marseille, Aix, arrière-pays provençal). Règles valables
> pour toutes les images, sans exception :
> — aucune personne visible en entier, aucun visage, jamais ;
> — aucun texte lisible : ni enseigne, ni plaque de rue, ni marque sur un
>   outil, un sac ou un véhicule ;
> — architecture française méditerranéenne : enduit teinté, volets bois ou
>   métal, tuiles canal, ferronneries, pierre calcaire ;
> — lumière de fin d'après-midi, rasante, ombres longues, ciel clair et banal,
>   jamais de coucher de soleil spectaculaire ;
> — objectif 35 mm ou 50 mm, hauteur d'œil, pas de grand-angle déformant ;
> — couleurs naturelles, contraste doux, aucune retouche HDR, aucune
>   saturation publicitaire, grain photographique fin ;
> — pas de filigrane, pas de cadre, pas de bordure, pas de collage.
> Confirme en un mot, puis attends mes demandes une par une.

Ensuite, une image par message, avec le prompt ci-dessous.

---

## Les deux hero — la coupure avant/après dans une seule image

### 1 — `hero.jpg` · 16/9 · 1600 px

> Façade d'un immeuble de trois niveaux dans une rue de Marseille, photographié
> de face, objectif 35 mm, hauteur d'œil, depuis le trottoir d'en face. **La
> moitié gauche du bâtiment est en cours de ravalement** : échafaudage tubulaire
> monté sur toute la hauteur, filet de chantier vert tendu, enduit piqué par
> endroits laissant voir le support gris. **La moitié droite est terminée** :
> enduit gratté fin teinte sable clair, volets bois bleu-gris, appuis de fenêtre
> propres. La limite entre les deux moitiés tombe exactement sur la descente
> d'eau verticale, au centre de l'image. Fin d'après-midi, lumière rasante
> venant de la droite, ombres longues sur l'enduit neuf. Photographie
> documentaire, couleurs naturelles. Format 16/9.

### 2 — `hero-variante-2.jpg` · 16/9 · 1600 px

> Maison de ville provençale de deux niveaux, photographiée de face, objectif
> 50 mm. **Moitié gauche** : support ancien piqué, gris, cloques d'enduit,
> fissures. **Moitié droite** : enduit gratté neuf, teinte sable rosé, arêtes
> nettes. La coupure tombe sur l'angle du mur, en ligne verticale franche. Fin
> d'après-midi, lumière rasante. Format 16/9.

---

## Les trois paires avant/après — méthode obligatoire

**Toujours générer l'APRÈS d'abord**, puis demander la dégradation **de cette
image même**. Jamais deux images séparées : on obtiendrait deux bâtiments
différents et le comparateur du site n'aurait aucun sens.

### 4 — `apres-01.jpg` · 4/3 · 1400 px — *à générer en premier*

> Maison de ville de deux niveaux, rue calme de Marseille, façade vue de face,
> objectif 50 mm, hauteur d'œil, cadrage serré sur la façade qui remplit le
> cadre. Enduit gratté fin fraîchement refait, teinte sable clair, volets bois
> bleu-gris repeints, appuis de fenêtre propres, porte d'entrée bois foncé,
> trottoir étroit au premier plan. Fin d'après-midi, lumière rasante venant de
> la gauche. Photographie documentaire, couleurs naturelles. Format 4/3.

### 3 — `avant-01.jpg` · 4/3 · 1400 px — *modification de l'image précédente*

> Reprends **exactement cette image**. Garde le même bâtiment, le même cadrage,
> la même focale, la même lumière, la même heure, le même trottoir. Change
> uniquement l'état de la façade : enduit cloqué et soufflé par plaques,
> fissures verticales suivies sur toute la hauteur, coulures noires de
> ruissellement sous les appuis de fenêtre, salissures vertes en bas de mur,
> volets bois décolorés et écaillés. Rien d'autre ne bouge : les fenêtres, la
> porte, la gouttière et le trottoir restent au même endroit, au pixel près.

### 6 — `apres-02.jpg` · 4/3 · 1400 px — *à générer en premier*

> Immeuble d'angle de quatre niveaux, centre-ville de Marseille, vu depuis le
> trottoir opposé, objectif 35 mm, les deux faces de l'angle visibles. Enduit
> refait teinte sable, balcons en ferronnerie noire dégagés et repeints,
> volets métalliques gris, tuiles canal en couronnement. Fin d'après-midi,
> lumière rasante sur une des deux faces, l'autre à l'ombre. Format 4/3.

### 5 — `avant-02.jpg` · 4/3 · 1400 px — *modification*

> Reprends **exactement cette image**, même immeuble, même angle, même
> cadrage, même lumière. Change seulement l'état : enduit noirci par le
> ruissellement le long des descentes d'eau, traînées sombres sous les
> balcons, ferronneries rouillées avec coulures d'oxyde sur l'enduit,
> fissures au droit des appuis. Aucun autre changement.

### 8 — `apres-03.jpg` · 4/3 · 1400 px — *à générer en premier*

> Mur pignon aveugle d'une maison provençale, sans fenêtre, vu de face,
> objectif 50 mm, le mur remplit le cadre. Enduit monocouche projeté teinté
> ocre clair, fraîchement posé, grain régulier, arêtes d'angle nettes, bas de
> mur propre. Fin d'après-midi, lumière très rasante qui révèle le grain.
> Format 4/3.

### 7 — `avant-03.jpg` · 4/3 · 1400 px — *modification*

> Reprends **exactement cette image**, même mur, même cadrage, même lumière.
> Change seulement l'état : fissures en escalier suivant les joints de
> maçonnerie, salissures vertes et noires en partie basse, enduit décollé par
> plaques laissant voir la pierre. Aucun autre changement.

---

## Les trois chantier

### 9 — `chantier.jpg` · 4/3 · 1300 px

> Échafaudage tubulaire monté sur toute la hauteur d'une façade, dans une rue
> étroite de Marseille. Bâche de protection tendue sur une partie, filet de
> chantier, trottoir protégé par des plaques. Vue depuis le trottoir d'en
> face, objectif 35 mm, hauteur d'œil. Aucune personne. Fin d'après-midi.
> Format 4/3.

### 10 — `chantier-2.jpg` · 4/3 · 1300 px

> Pied d'un échafaudage au niveau du trottoir : seaux de mortier empilés, sacs
> de mortier en pile, règle d'aluminium appuyée contre le tube, taloche posée
> sur un seau, fine poussière d'enduit au sol. Objectif 50 mm, légère
> plongée. Aucune personne, aucune marque lisible sur les sacs. Lumière de fin
> d'après-midi. Format 4/3.

### 11 — `chantier-3.jpg` · 4/3 · 1300 px

> Façade en cours de ravalement vue depuis le trottoir d'en face : partie
> gauche piquée et grise, partie droite déjà enduite teinte sable, limite
> irrégulière au milieu du mur, échafaudage partiellement démonté. Objectif
> 35 mm. Aucune personne. Format 4/3.

---

## Les cinq geste — mains et outils, jamais de visage

### 12 — `geste.jpg` · 4/3 · 1300 px

> Gros plan sur une main et un avant-bras d'artisan qui applique de l'enduit
> contre un mur avec une taloche inox chargée de mortier. Manche de veste de
> travail usé, poussière d'enduit sur la peau. Cadrage serré : on ne voit que
> la main, l'avant-bras, l'outil et le mur. Aucun visage, aucun corps.
> Objectif 50 mm, faible profondeur de champ, lumière rasante de fin de
> journée. Format 4/3.

### 13 — `geste-2.jpg` · 4/3 · 1300 px

> Gros plan sur une lame de gratton qui gratte un enduit encore frais : fine
> poussière d'enduit qui tombe en suspension devant le mur, sillons réguliers
> apparaissant sur la surface. Main gantée seulement, aucun visage. Objectif
> 50 mm, lumière rasante qui éclaire la poussière en suspension. Format 4/3.

### 14 — `geste-3.jpg` · 4/3 · 1300 px

> Deux mains qui tirent une règle d'aluminium sur un enduit frais, de bas en
> haut, laissant une surface plane derrière elle et un bourrelet de mortier
> devant. Cadrage serré sur les mains, la règle et le mur. Aucun visage.
> Objectif 50 mm. Format 4/3.

### 15 — `geste-4.jpg` · 4/3 · 1300 px

> Main qui passe une brosse large sur un mur de pierre pour l'humidifier avant
> reprise : le support foncit au passage de la brosse, gouttes d'eau sur la
> pierre. Cadrage serré, aucun visage. Objectif 50 mm. Format 4/3.

### 16 — `geste-5.jpg` · 4/3 · 1300 px

> Lance de machine à projeter tenue à bout de bras, en train de projeter du
> mortier sur un mur : jet de matière visible, éclaboussures sur l'enduit,
> tuyau qui part hors champ. On ne voit que les bras et l'outil, aucun visage.
> Objectif 35 mm, vitesse rapide qui fige la projection. Format 4/3.

---

## Les huit matière — macros à dix centimètres

### 17 — `detail-enduit.jpg` · 4/3 · 1400 px — **la plus importante du lot**

> Macrophotographie d'un enduit gratté fin fraîchement terminé, pris à dix
> centimètres du mur, l'enduit remplit tout le cadre. Grain régulier, petits
> éclats de sable visibles, teinte sable chaud légèrement rosé. Lumière très
> rasante venant de la gauche qui fait ressortir chaque relief du grain.
> Netteté parfaite d'un bord à l'autre, objectif macro, aucune profondeur de
> champ floue. Format 4/3.
>
> *Cette image sert au remplissage du mot géant, au rendu de matière du site et
> au prélèvement de la palette. Il faut du grain net et une couleur chaude
> franche, sinon le site entier devient gris.*

### 18 — `matiere-02.jpg` · 4/3 · 1400 px
> Macro d'un enduit taloché serré, grain fermé et lisse, marques circulaires de
> la taloche encore lisibles, teinte sable. Lumière rasante, netteté totale,
> plein cadre. Format 4/3.

### 19 — `matiere-03.jpg` · 4/3 · 1400 px
> Macro d'un enduit à la chaux lissé, surface légèrement nuancée, variations de
> blanc cassé et de beige, petites irrégularités de main. Lumière rasante.
> Format 4/3.

### 20 — `matiere-04.jpg` · 4/3 · 1400 px
> Macro d'un monocouche projeté, grain irrégulier en relief, projections
> figées, teinte ocre clair. Lumière rasante qui accentue les creux. Format 4/3.

### 21 — `matiere-05.jpg` · 4/3 · 1400 px
> Macro d'une fissure ouverte en V dans un enduit, préparée avant reprise :
> lèvres de la fissure dégagées au burin, poussière propre, support visible au
> fond. Lumière rasante. Format 4/3.

### 22 — `matiere-06.jpg` · 4/3 · 1400 px
> Macro d'un joint de pierre repris au mortier de chaux : deux pierres
> calcaires, joint frais beurré et brossé entre elles, teinte claire. Lumière
> rasante. Format 4/3.

### 23 — `matiere-07.jpg` · 4/3 · 1400 px
> Macro d'une arête d'angle de mur fraîchement enduite : arête parfaitement
> droite et vive, enduit identique des deux côtés, baguette d'angle invisible.
> Lumière rasante qui sépare les deux faces. Format 4/3.

### 24 — `matiere-08.jpg` · 4/3 · 1400 px
> Macro du raccord entre un enduit ancien encrassé et un enduit neuf : la
> limite traverse le cadre, différence nette de teinte et de grain de part et
> d'autre. Lumière rasante. Format 4/3.

---

## Les cinq ambiance

### 25 — `ambiance-01.jpg` · 3/2 · 1600 px
> Rue étroite de Marseille en fin d'après-midi, un échafaudage monté sur une
> façade se découpe en silhouette à contre-jour, lumière chaude au fond de la
> rue, façades ocre de part et d'autre. Aucune personne. Objectif 35 mm.
> Format 3/2.

### 26 — `ambiance-02.jpg` · 3/2 · 1600 px
> Outils de façadier posés au pied d'un mur enduit : taloche, seau, règle,
> brosse. Ombres longues de fin de journée sur le trottoir. Légère plongée,
> objectif 50 mm. Aucune personne. Format 3/2.

### 27 — `ambiance-03.jpg` · 3/2 · 1600 px
> Façade terminée vue en contre-plongée depuis le pied du mur, l'enduit neuf
> monte vers un ciel clair, tuiles canal en couronnement. Objectif 35 mm.
> Format 3/2.

### 28 — `ambiance-04.jpg` · 3/2 · 1600 px
> Filet de chantier vert tendu sur un échafaudage, photographié à contre-jour :
> la lumière du soir passe à travers la maille, la façade derrière est
> adoucie. Objectif 50 mm. Format 3/2.

### 29 — `ambiance-05.jpg` · 3/2 · 1600 px
> Gouttière et descente d'eau en zinc neuves fixées contre un enduit sable
> fraîchement refait, vues en léger contre-plongée, ombre portée nette sur le
> mur. Objectif 50 mm. Format 3/2.

---

## Les trois signes — textures de fond, plein cadre

### 30 — `signe-01.jpg` · 1/1 · 1400 px
> Texture d'enduit gratté photographiée strictement de face, parfaitement à
> plat, remplissant tout le cadre, éclairage uniforme et doux, aucune ombre
> portée, aucun objet, aucun bord de mur. Utilisable en fond répétable. Format
> carré.

### 31 — `signe-02.jpg` · 1/1 · 1400 px
> Trame régulière d'un filet de chantier vert photographiée de face, à plat,
> plein cadre, éclairage uniforme, aucune profondeur. Format carré.

### 32 — `signe-03.jpg` · 1/1 · 1400 px
> Poussière d'enduit en suspension dans un rai de lumière, sur fond sombre et
> flou : seules les particules sont nettes, points lumineux dispersés. Aucun
> objet identifiable. Format carré.

---

## Contrôle avant de ranger les fichiers

1. Les trois paires se superposent : fenêtres, gouttière et trottoir au même
   endroit sur l'avant et sur l'après.
2. `hero.jpg` : la coupure est verticale et franche.
3. `detail-enduit.jpg` : grain net à 300 % d'agrandissement, couleur chaude.
4. Aucune image ne contient de visage ni de texte lisible.
5. Toutes font au moins la largeur demandée.

Renommer exactement comme indiqué, puis :

```
sources-ravalement/   hero, avant-01, apres-01, avant-02, apres-02,
                      chantier, geste, detail-enduit  (+ SOURCE-ILLUSTRATION)
banque/ravalement/    tout le reste
```

---

# Les 22 images ajoutées le 2 octobre 2026

Fabrice veut 100 sites de ravalement différents dans un même département.
Avec 2 hero et 3 paires, une paire de sites sur deux montrait la même façade.
Ces 22 images portent le métier à 10 hero et 10 paires. Même bloc de tête que
plus haut, même méthode pour les paires : l'après d'abord, puis la
dégradation de cette image même.

Chaque hero garde une coupure verticale franche entre la partie en travaux et
la partie finie : le générateur la mesure. Les bâtiments changent d'un hero à
l'autre : villa, mas, immeuble, pavillon, maison de village. C'est ce qui rend
deux sites voisins différents.

## Huit hero de plus

### 33. `hero-variante-3.jpg`, 16/9, 1600 px

> Villa provençale à un étage, toit de tuiles canal, photographiée de face,
> objectif 35 mm, depuis le portail. **Moitié gauche** : enduit ancien grisâtre,
> fissures fines sous les fenêtres, traces de ruissellement. **Moitié droite** :
> enduit taloché neuf, teinte ocre clair, appuis nets. La coupure tombe
> exactement sur la descente d'eau verticale. Fin d'après-midi, lumière rasante
> venant de la gauche. Format 16/9.

### 34. `hero-variante-4.jpg`, 16/9, 1600 px

> Maison de village en pierre calcaire, deux niveaux, rue en pente, vue de face,
> objectif 50 mm. **Moitié gauche** : joints creusés, pierres nues, restes
> d'enduit en lambeaux. **Moitié droite** : enduit à pierre vue à la chaux,
> joints pleins, teinte beige. La coupure suit verticalement le chaînage d'angle
> en pierres de taille. Lumière rasante de fin de journée. Format 16/9.

### 35. `hero-variante-5.jpg`, 16/9, 1600 px

> Immeuble de ville de cinq niveaux, balcons en ferronnerie, centre de
> Marseille, vu depuis le trottoir opposé, objectif 35 mm. **Moitié gauche** :
> façade noircie par la pollution et le ruissellement. **Moitié droite** :
> enduit clair repris jusqu'à la corniche, ferronneries repeintes en noir. La
> coupure tombe verticalement entre deux colonnes de fenêtres. Fin
> d'après-midi. Format 16/9.

### 36. `hero-variante-6.jpg`, 16/9, 1600 px

> Pavillon des années 1970 avec garage accolé, jardin devant, vu de face,
> objectif 35 mm. **Moitié gauche** : crépi grisâtre avec traces vertes en pied
> de mur. **Moitié droite** : enduit gratté fin blanc cassé, soubassement net.
> La coupure tombe sur l'arête entre la maison et le garage. Lumière douce de
> fin de journée. Format 16/9.

### 37. `hero-variante-7.jpg`, 16/9, 1600 px

> Mas provençal en pierre, volets bois, vu de face dans la campagne, objectif
> 50 mm. **Moitié gauche** : vieil enduit tombé par plaques, pierre visible.
> **Moitié droite** : enduit à la chaux couleur sable, lisse et régulier. La
> coupure suit verticalement l'encadrement en pierre de la porte d'entrée.
> Lumière rasante dorée. Format 16/9.

### 38. `hero-variante-8.jpg`, 16/9, 1600 px

> Façade d'angle à l'intersection de deux rues, immeuble de trois niveaux, vue
> depuis le carrefour, objectif 35 mm. **Moitié gauche** : sous échafaudage
> avec bâches blanches. **Moitié droite** : terminée, enduit teinte rose pâle,
> volets gris. La coupure tombe exactement sur l'angle du bâtiment. Fin
> d'après-midi. Format 16/9.

### 39. `hero-variante-9.jpg`, 16/9, 1600 px

> Immeuble des années 1960 de quatre étages, fenêtres en bandes, vu de face,
> objectif 35 mm. **Moitié gauche** : béton taché, épaufrures aux nez de
> balcon, armatures visibles par endroits. **Moitié droite** : enduit lisse
> gris clair, nez de balcon repris. La coupure suit un joint de dilatation
> vertical. Lumière de fin de journée. Format 16/9.

### 40. `hero-variante-10.jpg`, 16/9, 1600 px

> Bastide à volets verts, deux niveaux, platanes devant, vue de face, objectif
> 50 mm. **Moitié gauche** : peinture écaillée sur l'enduit, taches d'humidité.
> **Moitié droite** : enduit neuf jaune paille, encadrements de fenêtres blancs.
> La coupure tombe sur la descente d'eau verticale. Lumière filtrée par les
> arbres. Format 16/9.

## Sept paires de plus

Pour chacune : d'abord `apres-NN`, puis `avant-NN` en modifiant **cette image
même** (« Reprends exactement cette image, même bâtiment, même cadrage, même
focale, même lumière ; change uniquement l'état de la façade : … ; rien d'autre
ne bouge, au pixel près »).

### 41. `apres-04.jpg`, 4/3, 1400 px, *en premier*

> Villa à toit de tuiles, façade vue de face depuis le jardin, objectif 50 mm,
> la façade remplit le cadre. Enduit taloché ocre neuf, appuis de fenêtre
> repris, volets bois clairs. Fin d'après-midi. Format 4/3.

### 42. `avant-04.jpg`, *modification*

> État à donner : enduit grisâtre, fissures fines sous chaque fenêtre, traces
> de ruissellement sous les appuis, volets délavés.

### 43. `apres-05.jpg`, 4/3, 1400 px, *en premier*

> Immeuble de trois étages, vue de face depuis le trottoir, objectif 35 mm.
> Soubassement repris, enduit gratté beige jusqu'en pied de mur, porte d'entrée
> en bois. Fin d'après-midi. Format 4/3.

### 44. `avant-05.jpg`, *modification*

> État à donner : enduit qui tombe par plaques en pied de mur, mousse verte en
> soubassement, salissures sombres.

### 45. `apres-06.jpg`, 4/3, 1400 px, *en premier*

> Maison de village en pierre, deux niveaux, vue de face, objectif 50 mm.
> Enduit à pierre vue à la chaux, joints pleins, teinte beige. Lumière rasante.
> Format 4/3.

### 46. `avant-06.jpg`, *modification*

> État à donner : joints creusés, enduit partiel en lambeaux, pierres nues,
> salissures sous la génoise.

### 47. `apres-07.jpg`, 4/3, 1400 px, *en premier*

> Pavillon de plain-pied, façade vue de face, objectif 35 mm. Enduit gratté fin
> blanc cassé, menuiseries blanches, pied de mur propre. Format 4/3.

### 48. `avant-07.jpg`, *modification*

> État à donner : crépi tyrolien sale, fissures autour des menuiseries,
> coulures grises sous les appuis.

### 49. `apres-08.jpg`, 4/3, 1400 px, *en premier*

> Façade sur cour intérieure d'un immeuble ancien, trois niveaux, objectif
> 35 mm. Enduit neuf clair, descentes d'eau neuves bien fixées. Lumière
> indirecte de fin de journée. Format 4/3.

### 50. `avant-08.jpg`, *modification*

> État à donner : descentes d'eau rouillées et mal fixées, coulures noires le
> long des descentes, enduit taché.

### 51. `apres-09.jpg`, 4/3, 1400 px, *en premier*

> Corniche et bandeau mouluré d'un immeuble ancien, cadrage serré sur le haut
> de façade, objectif 50 mm, vu d'en bas. Moulures reprises nettes, bandeau
> protégé, enduit clair. Lumière rasante. Format 4/3.

### 52. `avant-09.jpg`, *modification*

> État à donner : moulures érodées et noircies, morceaux manquants, traînées
> sombres sous le bandeau.

### 53. `apres-10.jpg`, 4/3, 1400 px, *en premier*

> Mur de clôture enduit le long d'une rue, avec chapeau en tuiles, objectif
> 50 mm, le mur remplit le cadre. Enduit repris, chapeau refait. Format 4/3.

### 54. `avant-10.jpg`, *modification*

> État à donner : enduit fissuré, chapeau cassé avec tuiles manquantes,
> mousses et salissures vertes.

## Où les ranger

Les 22 vont dans `images/ravalement/sources/`, à côté des 17 premières : le
générateur les trouve par leur nom, sans rien changer d'autre. Vérifier pour
chaque paire que l'avant et l'après se superposent, et pour chaque hero que la
coupure est verticale et franche.

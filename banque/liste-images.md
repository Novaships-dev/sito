# Liste de production des images — 16 métiers, 512 images

Engendrée par `scripts/liste-images.mjs` depuis `generateur/banque/plan-images.json`.
Pour une liste à cocher dans un tableur : `node scripts/liste-images.mjs --csv`.
Pour un seul métier : `node scripts/liste-images.mjs ravalement`.

**32 images par métier** : 2 hero, 3 paires avant/après (6 fichiers), 3 chantier,
5 geste, 8 matière (dont le détail principal), 5 ambiance, 3 signes.

## Les cinq règles qui valent pour les 512

1. **Aucun visage.** Mains, avant-bras, silhouettes de loin. Jamais un portrait.
2. **Aucun texte lisible** : ni enseigne, ni plaque de rue, ni marque sur un
   outil ou un sac. L'IA écrit du faux français, ça se repère tout de suite.
3. **Architecture française, méditerranéenne pour le Sud** : enduit teinté,
   volets bois ou métal, tuiles canal, ferronneries.
4. **Lumière de fin de journée, rasante.** C'est elle qui donne la matière.
5. **1600 px de large minimum**, JPEG qualité haute, pas de grand-angle
   déformant, pas de ciel spectaculaire, pas de retouche saturée.

## Les paires avant/après : la seule chose qui casse

Deux images générées séparément donnent deux bâtiments différents, et le
comparateur devient absurde. Marche à suivre :

1. générer **l'après** d'abord, cadrage soigné ;
2. reprendre **cette image même** en modification, consigne : « garde
   exactement le même bâtiment, le même cadrage, la même lumière ; dégrade :
   fissures, cloques, salissures, peinture écaillée » ;
3. superposer les deux : fenêtres, gouttière et trottoir doivent tomber au
   même pixel.

## Les trois fichiers qui pilotent le site

- `hero.jpg` : un script y **mesure la césure** avant/après. Coupure franche et
  verticale obligatoire, sinon la mesure se rabat sur 50 % et le bandeau ment.
- `detail-<matière>.jpg` : remplit le mot géant, alimente le rendu WebGL, et
  **la palette du site entier en est prélevée**. Grain net, couleur chaude
  franche dans le cadre.
- `apres-01.jpg` : entre aussi dans le prélèvement de la palette.

## Où ranger

```
sources-<metier>/        les 8 fichiers exiges par le generateur
banque/<metier>/matiere/ ambiance/ signes/    le reste
```

Un dossier dont les photos ne sont pas celles de l'entreprise reçoit un fichier
vide nommé `SOURCE-ILLUSTRATION`. Le générateur pose alors une mention visible
dans la page, et **refuse** de fabriquer en mode publication. Voir
`rules/common/ne-pas-fabriquer.md`.


## Ravalement de façade  (ravalement)
Codes APE : 43.34Z, 43.33Z, 43.99C   Mot geant : Ravalement   Matiere : enduit
Dossier : sources-ravalement/ et banque/ravalement/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | immeuble de trois niveaux, moitié gauche sous échafaudage et filet, moitié droite enduit sable terminé, coupure sur la descente d'eau |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | maison de ville, moitié gauche support piqué et gris, moitié droite enduit gratté neuf, coupure sur l'angle du mur |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | maison de ville deux niveaux, volets bleus, enduit cloqué, fissures suivies, coulures sous les appuis |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | la même maison, même cadrage, enduit gratté sable, appuis nettoyés  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | immeuble d'angle quatre niveaux, balcons en ferronnerie, enduit noirci par le ruissellement |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | le même immeuble, enduit repris, ferronneries dégagées  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | mur pignon aveugle, fissures en escalier, salissures vertes |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | le même pignon, monocouche teinté, fissures traitées  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | échafaudage monté sur une façade de rue étroite, bâche, trottoir protégé |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | pied d'échafaudage, seaux, sacs de mortier empilés, règle d'aluminium appuyée |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | façade en cours, moitié piquée moitié enduite, vue du trottoir d'en face |
| 12 | `geste.jpg` | 4/3 | 1300 px | taloche chargée d'enduit appliquée contre le mur, main et avant-bras |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | lame qui gratte l'enduit encore frais, poussière fine qui tombe |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | règle d'aluminium tirée à deux mains sur l'enduit |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | brosse qui humidifie le support avant reprise |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | lance de machine à projeter tenue à bout de bras, projection en cours |
| 17 | `detail-enduit.jpg` | 4/3 | 1400 px | enduit gratté fin en lumière rasante  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | taloché serré, grain fermé |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | lissé à la chaux, léger nuancé |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | monocouche projeté, grain irrégulier |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | fissure ouverte en V avant reprise |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | joint de pierre repris au mortier de chaux |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | arête d'angle neuve, baguette invisible |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | raccord entre ancien et neuf, limite visible |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | rue étroite au soleil de fin de journée, échafaudage en silhouette |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | outils posés au pied du mur, ombre longue |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | façade terminée vue en contre-plongée contre le ciel |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | filet de chantier en contre-jour |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | gouttière et descente d'eau neuves contre l'enduit |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture d'enduit à plat, plein cadre |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de filet de chantier |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | poussière d'enduit dans un rai de lumière |


## Peinture intérieure  (peinture)
Codes APE : 43.34Z   Mot geant : Peinture   Matiere : mur fini
Dossier : sources-peinture/ et banque/peinture/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | grande pièce, moitié gauche en travaux (bâches, sous-couche, ruban), moitié droite finie, coupure sur l'angle du mur |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | couloir, moitié gauche papier arraché et plâtre nu, moitié droite peint en blanc cassé |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | salon aux murs marqués, traces de meubles, fissures capillaires, plinthes jaunies |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | le même salon, murs unis, plinthes nettes  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | cage d'escalier sombre, peinture écaillée sur la rampe et les murs |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | la même cage, murs clairs, rampe reprise  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | chambre avec papier peint daté, décollé aux angles |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | la même chambre peinte, angles nets  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | pièce entièrement bâchée, escabeau ouvert, pots alignés le long du mur |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | ruban de masquage en place sur plinthes et encadrements, avant première passe |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | bac à peinture, rouleau chargé, manche télescopique appuyé |
| 12 | `geste.jpg` | 4/3 | 1300 px | rouleau qui dépose la peinture, bande fraîche et nette |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | pinceau en coupe d'angle le long d'une plinthe |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | spatule qui reboucha une fissure à l'enduit |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | cale à poncer sur un rebouchage sec, poussière fine |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | ruban de masquage tiré d'un geste continu |
| 17 | `detail-peinture.jpg` | 4/3 | 1400 px | grain de rouleau en lumière rasante  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | mur laqué satiné, reflet doux |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | bande de finition à l'angle de deux teintes |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | plinthe peinte, arête nette contre le sol |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | enduit de rebouchage poncé, tache claire |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | papier peint décollé montrant le plâtre |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | boiserie laquée, veinage encore lisible |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | nuancier de teintes tenu contre le mur |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | pièce vide et bâchée, lumière de fenêtre |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | pots et outils rangés en fin de journée |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | escabeau en silhouette contre un mur frais |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | reflet de fenêtre sur un mur satiné |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | porte fraîchement peinte, entrouverte |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | aplat de teinte plein cadre |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | texture de rouleau à plat |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de toile de bâche |


## Maçonnerie générale  (maconnerie)
Codes APE : 43.99C, 43.91B   Mot geant : Maçonnerie   Matiere : pierre et joint
Dossier : sources-maconnerie/ et banque/maconnerie/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | mur de pierre, moitié gauche déjointoyée et étayée, moitié droite rejointoyée au mortier de chaux |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | extension en parpaings, moitié gauche brute, moitié droite enduite |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | muret de clôture dégradé, pierres descellées, joints tombés |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | le même muret remonté et rejointoyé  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | mur porteur avant ouverture, tracé au crayon pour la découpe |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | le même mur avec ouverture créée, linteau posé, tableaux nets  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | dalle de terrasse fissurée et affaissée |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | la même surface, dalle neuve talochée  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | montage de parpaings au cordeau, bétonnière en fond |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | banches en place, ferraillage en attente, étais |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | fondations ouvertes, tranchée nette, semelle ferraillée |
| 12 | `geste.jpg` | 4/3 | 1300 px | truelle qui charge le joint entre deux pierres |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | fil à plomb tenu contre l'angle d'un mur |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | niveau à bulle posé sur une rangée de parpaings |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | règle de maçon tirée sur une dalle fraîche |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | massette et burin sur une pierre à retailler |
| 17 | `detail-pierre.jpg` | 4/3 | 1400 px | joint frais beurré entre deux pierres  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | pierre taillée, arête vive |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | parpaing monté, joint régulier |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | béton lissé à l'hélicoptère |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | ferraillage en attente, fers croisés |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | linteau béton posé sur ses appuis |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | chaînage d'angle coffré |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | dalle talochée en cours de prise |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | chantier au petit matin, tas de sable et de gravier |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | mur monté à mi-hauteur en fin de journée |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | bétonnière en rotation, poussière |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | échafaudage bas et brouette |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | outils de maçon posés sur un parpaing |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture de béton brut |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de parpaings |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de sable de rivière |


## Couverture et zinguerie  (couverture)
Codes APE : 43.91B, 43.91A   Mot geant : Toiture   Matiere : tuile et zinc
Dossier : sources-couverture/ et banque/couverture/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | toiture en tuiles canal, moitié gauche déposée montrant liteaux et écran, moitié droite recouverte |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | toit à deux pans, moitié gauche mousse et tuiles cassées, moitié droite neuve |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | toiture couverte de mousse, tuiles glissées et cassées, faîtage descellé |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | la même toiture nettoyée et recouverte, faîtage scellé  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | gouttière percée et déformée, rive abîmée |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | la même gouttière en zinc neuf, rive refaite  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | souche de cheminée fissurée, solin ouvert |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | la même souche reprise, solin zinc neuf  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | échafaudage de toit et filet de sécurité, palette de tuiles montée |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | liteaux et écran sous-toiture posés sur la moitié d'un pan |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | monte-matériaux appuyé contre la façade, tuiles en attente |
| 12 | `geste.jpg` | 4/3 | 1300 px | mains qui posent une tuile canal sur le liteau |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | fer à souder sur une jonction de zinc, goutte d'étain |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | cisaille qui découpe une feuille de zinc |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | plieuse à main sur une bande de zinc |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | mains qui scellent une tuile faîtière au mortier |
| 17 | `detail-zinc.jpg` | 4/3 | 1400 px | tuile canal neuve, courbe et ombre  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | tuile ancienne couverte de mousse |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | zinc plié, arête nette |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | soudure à l'étain sur zinc |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | faîtage scellé au mortier |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | liteau et écran sous-toiture |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | solin encastré dans la maçonnerie |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | chéneau en zinc, eau claire au fond |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | ligne de faîtage contre un ciel de fin de journée |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | toit vu depuis l'échelle, tuiles en perspective |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | palettes de tuiles montées sur le toit |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | gouttière neuve contre la façade |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | vue plongeante sur les toits d'un village |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | trame de tuiles plein cadre |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | texture de zinc patiné |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain d'ardoise |


## Menuiserie et fenêtres  (menuiserie)
Codes APE : 43.32A, 43.32B   Mot geant : Menuiserie   Matiere : bois et joint
Dossier : sources-menuiserie/ et banque/menuiserie/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | façade, moitié gauche anciennes fenêtres bois grises, moitié droite fenêtres neuves posées |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | atelier, moitié gauche bois brut empilé, moitié droite ouvrants finis alignés |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | fenêtre ancienne simple vitrage, peinture écaillée, mastic tombé |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | la même baie avec fenêtre neuve posée  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | porte d'entrée fatiguée, seuil usé |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | la même porte remplacée, seuil aluminium neuf  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | volets bois décolorés et déformés |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | les mêmes volets refaits, lasure fraîche  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | dépose en cours, ancien dormant sorti, protection au sol |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | calage et réglage d'un dormant neuf, niveau posé |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | fenêtres neuves alignées contre un mur, emballage retiré |
| 12 | `geste.jpg` | 4/3 | 1300 px | mains qui vissent une patte de fixation dans le tableau |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | pistolet à mastic qui tire un joint de pose |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | rabot qui prend un copeau sur un chant de bois |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | mains qui règlent une paumelle à la clé |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | mètre et crayon sur un chant, trait de coupe |
| 17 | `detail-bois.jpg` | 4/3 | 1400 px | chêne huilé, veinage serré  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | pin lasuré, nœud visible |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | aluminium laqué, arête nette |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | PVC blanc, soudure d'angle |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | joint de pose entre dormant et maçonnerie |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | paumelle en place, vis alignées |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | vitrage feuilleté vu en tranche |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | seuil aluminium, rupture de pont thermique |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | atelier avec établi et copeaux |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | ouvrants finis alignés contre un mur |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | pièce vue à travers une fenêtre neuve |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | protection au sol et outils rangés |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | lumière du matin sur un dormant posé |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | veinage de bois plein cadre |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | texture d'aluminium brossé |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | trame de vitrage et reflet |


## Carrelage et faïence  (carrelage)
Codes APE : 43.33Z   Mot geant : Carrelage   Matiere : joint et coupe
Dossier : sources-carrelage/ et banque/carrelage/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | sol de pièce, moitié gauche chape nue avec plots de colle, moitié droite carrelée et jointoyée |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | mur de salle d'eau, moitié gauche support nu, moitié droite faïence posée |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | salle de bains datée, faïence fendue, joints noircis |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | la même salle de bains refaite  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | terrasse aux carreaux descellés, mousse dans les joints |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | la même terrasse recarrelée, joints nets  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | cuisine au sol usé et taché |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | la même cuisine, grès cérame posé  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | carreaux empilés, croisillons, seau de colle et peigne |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | niveau laser allumé dans une pièce en travaux |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | carrelette et carreau en cours de coupe sur tréteaux |
| 12 | `geste.jpg` | 4/3 | 1300 px | peigne à colle tiré sur la chape, sillons réguliers |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | mains qui posent un carreau et le font coulisser |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | croisillon glissé entre deux carreaux |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | raclette qui pousse le joint en diagonale |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | éponge qui nettoie le voile de ciment |
| 17 | `detail-joint.jpg` | 4/3 | 1400 px | grès cérame, surface mate  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | faïence blanche brillante |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | joint gris fraîchement tiré |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | coupe d'angle à 45 degrés |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | plinthe carrelée, arête nette |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | mosaïque de petits carreaux |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | colle peignée avant pose |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | seuil de douche à l'italienne |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | pièce en cours, carreaux empilés |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | niveau laser dans la pénombre |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | salle d'eau finie en lumière rasante |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | outils posés sur un carreau |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | reflet de fenêtre sur un sol neuf |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | trame de carrelage plein cadre |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | texture de joint |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de grès cérame |


## Plâtrerie et cloisons  (platrerie)
Codes APE : 43.31Z   Mot geant : Plâtrerie   Matiere : bande et angle
Dossier : sources-platrerie/ et banque/platrerie/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | pièce, moitié gauche ossature métallique nue, moitié droite plaques posées et bandes enduites |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | plafond, moitié gauche rails apparents, moitié droite fini blanc |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | cloison ancienne fissurée, plâtre gonflé |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | la même cloison refaite, surface plane  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | plafond taché et fissuré |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | le même plafond refait, bandes invisibles  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | angle de mur épaufré |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | le même angle repris, arête droite  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | ossature métallique montée, rails et montants alignés |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | plaques stockées à plat, visseuse posée dessus |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | pièce en cours, bandes en train de sécher |
| 12 | `geste.jpg` | 4/3 | 1300 px | couteau à enduire qui tire une bande sur un joint |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | visseuse qui pose une vis affleurante |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | cutter qui coupe une plaque le long d'une règle |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | cale à poncer sur un joint sec |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | mains qui posent une bande armée dans l'enduit frais |
| 17 | `detail-bande.jpg` | 4/3 | 1400 px | bande enduite, joint invisible  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | angle droit avec baguette |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | vis affleurante dans la plaque |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | découpe nette dans une plaque |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | isolant glissé entre montants |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | rail au sol, fixation visible |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | enduit de finition tiré fin |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | plaque hydrofuge vue en tranche |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | ossature à contre-jour |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | pièce blanche prête à peindre |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | poussière de ponçage dans la lumière |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | plaques empilées contre un mur |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | échafaudage roulant sous un plafond |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture de plaque de plâtre |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de rails |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | poussière fine en suspension |


## Isolation extérieure  (isolation)
Codes APE : 43.29A   Mot geant : Isolation   Matiere : panneau et sous-enduit
Dossier : sources-isolation/ et banque/isolation/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | façade, moitié gauche panneaux isolants posés et chevillés, moitié droite finie enduite |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | pignon, moitié gauche mur nu, moitié droite isolé et enduit |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | maison aux murs nus, enduit ancien fatigué |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | la même maison isolée par l'extérieur, enduit neuf  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | tableau de fenêtre sans isolation |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | le même tableau traité, retour d'isolant posé  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | soubassement dégradé |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | le même soubassement isolé et enduit  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | panneaux isolants empilés au pied de l'échafaudage |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | façade à mi-parcours, panneaux posés en quinconce |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | treillis de fibre de verre déroulé sur le sous-enduit |
| 12 | `geste.jpg` | 4/3 | 1300 px | mains qui chevillent un panneau isolant |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | couteau qui marque et coupe un panneau |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | taloche qui applique le sous-enduit sur le treillis |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | mains qui déroulent le treillis et le noient dans l'enduit |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | règle qui vérifie la planéité des panneaux |
| 17 | `detail-isolant.jpg` | 4/3 | 1400 px | panneau de polystyrène vu en tranche  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | laine de roche, fibres visibles |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | treillis noyé dans le sous-enduit |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | cheville à frapper en place |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | retour d'isolant au tableau de fenêtre |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | profilé de départ en bas de mur |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | sous-enduit frais, grain gris |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | enduit de finition sur isolant |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | façade à mi-chantier, panneaux et enduit |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | échafaudage bâché en fin de journée |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | panneaux empilés et sanglés |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | mur isolé vu en lumière rasante |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | angle de maison traité, arête nette |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture de polystyrène |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de treillis |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de sous-enduit |


## Électricité  (electricite)
Codes APE : 43.21A   Mot geant : Électricité   Matiere : tableau et cuivre
Dossier : sources-electricite/ et banque/electricite/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | local technique, moitié gauche vieux tableau à fusibles, moitié droite tableau neuf modulaire |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | mur, moitié gauche saignées ouvertes et gaines, moitié droite fini |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | tableau électrique ancien, fusibles porcelaine, fils en désordre |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | le même emplacement, tableau modulaire neuf, repérage en place  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | prise pendante et fils apparents |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | le même mur, appareillage encastré et net  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | coffret extérieur rouillé |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | le même coffret remplacé, étiquetage neuf  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | saignées ouvertes dans le mur, gaines en attente |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | tableau en cours de câblage, peignes posés, fils peignés |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | touret de câble et outils sur un établi de chantier |
| 12 | `geste.jpg` | 4/3 | 1300 px | mains qui dénudent un fil à la pince |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | tournevis qui serre une borne de disjoncteur |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | mains qui peignent les fils dans le tableau |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | aiguille qui tire un fil dans une gaine |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | multimètre tenu sur une borne, pointes en place |
| 17 | `detail-tableau.jpg` | 4/3 | 1400 px | tableau câblé, peignes cuivre alignés  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | disjoncteurs en rang, manettes nettes |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | fils repérés et étiquetés |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | gaine annelée dans une saignée |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | boîte d'encastrement scellée |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | borne automatique vue de près |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | cuivre dénudé, brins serrés |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | coffret de communication rangé |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | local technique en lumière crue |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | tableau ouvert vu de face, net |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | outils d'électricien posés en ordre |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | gaines qui sortent d'un mur nu |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | tableau fermé, façade blanche |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | trame de peignes cuivre |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | texture de gaine annelée |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de plastique de coffret |


## Plomberie et chauffage  (plomberie)
Codes APE : 43.22A, 43.22B   Mot geant : Plomberie   Matiere : cuivre brasé
Dossier : sources-plomberie/ et banque/plomberie/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | chaufferie, moitié gauche vieille chaudière et tuyaux rouillés, moitié droite installation neuve |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | mur technique, moitié gauche tuyaux anciens, moitié droite collecteur neuf |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | vieille chaudière murale entartrée, raccords verdis |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | le même emplacement, équipement neuf posé  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | salle d'eau aux tuyaux apparents, robinetterie calcaire |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | la même salle d'eau, alimentation encastrée, robinetterie neuve  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | radiateur fonte rouillé sous une fenêtre |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | le même emplacement, radiateur neuf posé  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | collecteur en cours de montage, nourrice et vannes |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | tubes cuivre coupés à longueur, posés sur tréteaux |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | unité extérieure de pompe à chaleur en cours de calage |
| 12 | `geste.jpg` | 4/3 | 1300 px | chalumeau qui braise un raccord cuivre |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | pince à sertir refermée sur un raccord multicouche |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | coupe-tube en rotation sur un cuivre |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | clé à molette sur un écrou de raccordement |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | mains qui purgent un radiateur, clé et chiffon |
| 17 | `detail-cuivre.jpg` | 4/3 | 1400 px | cuivre brasé, cordon régulier  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | collecteur et vannes alignées |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | multicouche serti, bague marquée |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | robinet thermostatique neuf |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | calorifuge posé sur un tube |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | filetage et téflon enroulé |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | tube PER en couronne |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | échangeur à plaques vu de près |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | chaufferie propre et éclairée |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | tubes alignés contre un mur |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | unité extérieure sur ses plots |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | outils de plombier posés |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | vapeur légère devant une chaudière |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture de cuivre poli |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de tubes parallèles |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de calorifuge |


## Serrurerie et portails  (metallerie)
Codes APE : 43.32B, 25.11Z   Mot geant : Métallerie   Matiere : acier et soudure
Dossier : sources-metallerie/ et banque/metallerie/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | atelier, moitié gauche acier brut et gabarit, moitié droite ouvrage peint fini |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | entrée de propriété, moitié gauche ancien portail rouillé, moitié droite portail neuf |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | portail en fer rouillé et déformé, gonds descellés |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | le même accès, portail neuf posé  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | garde-corps de balcon corrodé |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | le même garde-corps refait, thermolaqué  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | grille de fenêtre piquée |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | la même grille remplacée  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | atelier avec gabarit de montage, pièces en attente |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | portail posé sur tréteaux avant peinture |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | scellement des poteaux, niveau et étais |
| 12 | `geste.jpg` | 4/3 | 1300 px | poste à souder en action, arc et fumée légère, main gantée |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | meuleuse qui ébavure un cordon, gerbe d'étincelles |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | équerre et serre-joint sur un assemblage |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | mains qui percent un plat d'acier |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | pinceau qui applique une couche d'apprêt |
| 17 | `detail-acier.jpg` | 4/3 | 1400 px | acier brossé, grain de meulage  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | cordon de soudure régulier |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | thermolaquage noir mat |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | acier corten patiné |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | assemblage boulonné |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | charnière massive graissée |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | tube carré coupé net |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | apprêt gris sur acier nu |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | atelier en contre-jour, étincelles |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | portail neuf devant un mur de pierre |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | établi et outils de métallier |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | pièces d'acier empilées |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | ombre d'une grille sur un mur |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture d'acier brossé |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de barreaux |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de peinture martelée |


## Terrassement et VRD  (terrassement)
Codes APE : 43.12A   Mot geant : Terrassement   Matiere : grave et bordure
Dossier : sources-terrassement/ et banque/terrassement/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | terrain, moitié gauche en terre remuée, moitié droite plateforme réglée et compactée |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | accès, moitié gauche chemin boueux, moitié droite enrobé posé |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | terrain en pente, terre nue, ornières |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | le même terrain terrassé et nivelé  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | allée défoncée et boueuse |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | la même allée en grave compactée et bordurée  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | tranchée ouverte devant une maison |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | la même zone refermée et réglée  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | pelle mécanique en action, godet chargé |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | tranchée ouverte, gaines posées sur lit de sable |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | plaque vibrante sur une couche de grave |
| 12 | `geste.jpg` | 4/3 | 1300 px | mains qui posent une bordure au cordeau |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | règle qui tire une couche de sable |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | niveau laser installé sur trépied |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | mains qui déroulent un géotextile |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | pelle qui règle un fond de forme |
| 17 | `detail-grave.jpg` | 4/3 | 1400 px | grave compactée, cailloux serrés  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | bordure béton posée |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | sable réglé, surface lisse |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | géotextile déroulé |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | enrobé chaud fraîchement posé |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | regard de visite scellé |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | drain et gravier en tranchée |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | terre végétale régalée |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | chantier au lever du jour, engin à l'arrêt |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | tas de grave et de terre |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | tranchée rectiligne vue en longueur |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | plateforme réglée et vide |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | traces de chenilles dans la terre |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture de grave |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de bordures alignées |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de sable et poussière |


## Étanchéité toiture-terrasse  (etancheite)
Codes APE : 43.99A   Mot geant : Étanchéité   Matiere : bitume soudé
Dossier : sources-etancheite/ et banque/etancheite/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | toiture-terrasse, moitié gauche ancienne membrane cloquée, moitié droite bitume neuf soudé |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | terrasse, moitié gauche support nu, moitié droite membrane posée et relevés faits |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | toiture-terrasse fissurée, cloques et flaques stagnantes |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | la même terrasse refaite, surface nette  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | relevé d'acrotère décollé |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | le même relevé refait, bande de solin posée  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | évacuation bouchée et affaissée |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | la même évacuation reprise, platine neuve  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | rouleaux de membrane en attente, chalumeau à proximité |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | terrasse en cours, moitié couverte, ligne de recouvrement |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | acrotère préparé, primaire appliqué |
| 12 | `geste.jpg` | 4/3 | 1300 px | chalumeau qui soude un lé de bitume, flamme et fondu |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | rouleau déroulé au pied, membrane qui se pose |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | mains qui marouflent un recouvrement |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | pinceau qui applique le primaire d'accrochage |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | cutter qui recoupe un lé le long d'un relevé |
| 17 | `detail-bitume.jpg` | 4/3 | 1400 px | bitume soudé, cordon de fusion  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | recouvrement de deux lés |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | relevé d'acrotère terminé |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | platine d'évacuation posée |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | granulés minéraux en surface |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | primaire noir sur support béton |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | membrane soudée à l'air chaud |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | joint de dilatation traité |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | terrasse vue à plat, lignes de lés |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | fumée légère au-dessus du chalumeau |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | rouleaux alignés contre l'acrotère |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | flaque d'eau claire sur membrane neuve |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | ciel bas au-dessus d'une terrasse |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture de bitume granulé |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de recouvrements |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de membrane |


## Parquet et sols souples  (parquet)
Codes APE : 43.33Z   Mot geant : Parquet   Matiere : chêne huilé
Dossier : sources-parquet/ et banque/parquet/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | pièce, moitié gauche ancien sol déposé et ragréage, moitié droite parquet posé |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | couloir, moitié gauche revêtement usé, moitié droite sol souple neuf |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | parquet ancien rayé, lames disjointes et grises |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | le même parquet poncé et huilé  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | moquette tachée dans une chambre |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | la même chambre, parquet flottant posé  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | sol souple décollé dans une cuisine |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | la même cuisine, sol neuf  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | lames empilées en acclimatation, cales de dilatation |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | ragréage en cours, lisseur et seau |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | ponceuse à bande en pause sur un parquet à moitié poncé |
| 12 | `geste.jpg` | 4/3 | 1300 px | mains qui emboîtent deux lames |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | maillet et cale qui tassent une lame |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | ponceuse qui passe sur un parquet, poussière |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | pinceau qui applique l'huile, bois qui fonce |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | cutter qui coupe un sol souple le long d'une règle |
| 17 | `detail-parquet.jpg` | 4/3 | 1400 px | chêne huilé, veinage chaud  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | lame poncée, arête vive |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | joint entre deux lames |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | sol souple à motif bois |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | plinthe et cale de dilatation |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | ragréage lissé, surface mate |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | seuil entre deux revêtements |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | parquet ancien avant ponçage |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | pièce vide au sol neuf, lumière de fenêtre |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | lames empilées contre un mur |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | poussière de ponçage dans un rai de lumière |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | reflet de fenêtre sur parquet huilé |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | outils posés sur le sol fini |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture de chêne plein cadre |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de lames |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de poussière de bois |


## Piscine  (piscine)
Codes APE : 43.99C   Mot geant : Piscine   Matiere : margelle et enduit
Dossier : sources-piscine/ et banque/piscine/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | bassin, moitié gauche en travaux (ferraillage, banches), moitié droite terminé et rempli |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | plage de piscine, moitié gauche dalle brute, moitié droite margelles posées |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | bassin ancien, enduit taché, margelles descellées |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | le même bassin rénové, eau claire  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | plage de piscine fissurée |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | la même plage refaite, margelles alignées  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | local technique en désordre |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | le même local rangé, filtration neuve  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | ferraillage du bassin avant coulage |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | banches en place, réservations visibles |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | local technique en cours, pompe et filtre posés |
| 12 | `geste.jpg` | 4/3 | 1300 px | mains qui posent une margelle au mortier |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | taloche qui applique l'enduit de bassin |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | mains qui règlent une vanne de filtration |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | niveau posé sur une margelle |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | brosse qui nettoie la ligne d'eau |
| 17 | `detail-margelle.jpg` | 4/3 | 1400 px | margelle en pierre reconstituée  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | enduit de bassin lissé, teinte claire |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | ligne d'eau carrelée |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | escalier de bassin en béton |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | skimmer encastré |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | liner tendu, pli net |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | eau claire sur fond clair |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | plage en bois exotique |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | bassin rempli au soleil de fin de journée |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | reflets sur l'eau au calme |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | local technique propre |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | chantier de bassin vu de haut |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | margelles empilées en attente |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture d'eau en surface |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de margelles |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain d'enduit de bassin |


## Paysagiste  (paysagiste)
Codes APE : 81.30Z   Mot geant : Jardin   Matiere : pavé et gazon
Dossier : sources-paysagiste/ et banque/paysagiste/

| # | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|
| 1 | `hero.jpg` | 16/9 | 1600 px | jardin, moitié gauche friche et terre nue, moitié droite aménagé et planté |
| 2 | `hero-variante-2.jpg` | 16/9 | 1600 px | allée, moitié gauche terre battue, moitié droite pavée |
| 3 | `avant-01.jpg` | 4/3 | 1400 px | jardin en friche, herbes hautes, clôture affaissée |
| 4 | `apres-01.jpg` | 4/3 | 1400 px | le même jardin aménagé  [MEME bâtiment, MEME cadrage que avant-01] |
| 5 | `avant-02.jpg` | 4/3 | 1400 px | terrasse envahie de mousse |
| 6 | `apres-02.jpg` | 4/3 | 1400 px | la même terrasse nettoyée et remise en état  [MEME bâtiment, MEME cadrage que avant-02] |
| 7 | `avant-03.jpg` | 4/3 | 1400 px | haie dépérie et irrégulière |
| 8 | `apres-03.jpg` | 4/3 | 1400 px | la même haie retaillée ou replantée  [MEME bâtiment, MEME cadrage que avant-03] |
| 9 | `chantier.jpg` | 4/3 | 1300 px | plants en godets alignés avant plantation, terre préparée |
| 10 | `chantier-2.jpg` | 4/3 | 1300 px | pavés empilés et sable de pose étalé |
| 11 | `chantier-3.jpg` | 4/3 | 1300 px | arrosage automatique en cours de pose, tuyaux en tranchée |
| 12 | `geste.jpg` | 4/3 | 1300 px | mains qui plantent un arbuste, terre autour des racines |
| 13 | `geste-2.jpg` | 4/3 | 1300 px | taille-haie en action, coupe nette |
| 14 | `geste-3.jpg` | 4/3 | 1300 px | maillet qui cale un pavé |
| 15 | `geste-4.jpg` | 4/3 | 1300 px | râteau qui règle une terre fine |
| 16 | `geste-5.jpg` | 4/3 | 1300 px | sécateur sur une branche |
| 17 | `detail-pave.jpg` | 4/3 | 1400 px | pavé engazonné, joint vert  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 18 | `matiere-02.jpg` | 4/3 | 1400 px | gazon fraîchement tondu, bandes régulières |
| 19 | `matiere-03.jpg` | 4/3 | 1400 px | paillage d'écorce autour d'un pied |
| 20 | `matiere-04.jpg` | 4/3 | 1400 px | bordure de jardin posée |
| 21 | `matiere-05.jpg` | 4/3 | 1400 px | terre fine régalée |
| 22 | `matiere-06.jpg` | 4/3 | 1400 px | haie taillée, arête nette |
| 23 | `matiere-07.jpg` | 4/3 | 1400 px | dalle de terrasse sur plots |
| 24 | `matiere-08.jpg` | 4/3 | 1400 px | goutte-à-goutte au pied d'un arbuste |
| 25 | `ambiance-01.jpg` | 3/2 | 1600 px | jardin en fin de journée, lumière basse |
| 26 | `ambiance-02.jpg` | 3/2 | 1600 px | outils posés sur l'herbe |
| 27 | `ambiance-03.jpg` | 3/2 | 1600 px | allée pavée vue en perspective |
| 28 | `ambiance-04.jpg` | 3/2 | 1600 px | arrosage en fonctionnement |
| 29 | `ambiance-05.jpg` | 3/2 | 1600 px | tas de terre et brouette |
| 30 | `signe-01.jpg` | 1/1 | 1400 px | texture de gazon plein cadre |
| 31 | `signe-02.jpg` | 1/1 | 1400 px | trame de pavés |
| 32 | `signe-03.jpg` | 1/1 | 1400 px | grain de terre et paillage |


512 images au total.

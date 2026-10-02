# Banque d'images par métier — liste de production

État du 15 septembre 2026. Ce document dit **exactement** quoi générer, sous
quel nom, à quel format. Il est calé sur ce que `generateur/composer.mjs`
consomme aujourd'hui, pas sur une intention.

---

## 1. Ce que le générateur exige, aujourd'hui, pour chaque entreprise

Huit fichiers, noms imposés, dans un dossier `sources-<metier>/`. S'il en
manque un, la fabrication s'arrête net.

| Fichier | Rapport | Largeur mini | Ce qu'on doit voir | Où il sert |
|---|---|---|---|---|
| `hero.jpg` | 16/9 à 2/1 | 1600 px | **un seul bâtiment, moitié en travaux, moitié fini** — la césure doit être franche et verticale | bandeau « la coupure » ; le générateur y mesure la position de la césure |
| `avant-01.jpg` | 4/3 | 1400 px | la façade dégradée, cadrage large | comparateur du premier écran |
| `apres-01.jpg` | 4/3 | 1400 px | **la même façade, même point de vue, même focale, même heure**, rénovée | comparateur du premier écran |
| `avant-02.jpg` | 4/3 ou 1/1 | 1300 px | un second chantier, avant | comparateur plus bas |
| `apres-02.jpg` | 4/3 ou 1/1 | 1300 px | **le même second chantier**, après | comparateur plus bas |
| `chantier.jpg` | 4/3 | 1300 px | le chantier en cours, échafaudage ou protection, vu de la rue | bande « chantier » |
| `geste.jpg` | 4/3 | 1300 px | **les mains et l'outil au travail**, cadrage serré, pas de visage | ouverture ou bande chantier |
| `detail-enduit.jpg` | 4/3 | 1400 px | **macro de la matière finie**, à dix centimètres | remplissage du mot géant, WebGL, prélèvement de la palette |

Trois de ces images font plus que décorer :

- `hero.jpg` : un script cherche la césure avant/après par analyse de la
  chaleur des couleurs. **Une coupure franche et verticale est obligatoire**,
  sinon la mesure se rabat sur 50 % et le bandeau ment.
- `detail-enduit.jpg` + `apres-01.jpg` + `hero.jpg` : la palette du site entier
  (accent, encre) est **prélevée dessus**. Une image grise donne un site gris.
  Il faut une couleur chaude franche quelque part dans le cadre.
- `detail-enduit.jpg` : sert de remplissage au mot géant. Le grain doit être
  net et lisible à 300 % d'agrandissement.

**Point de code à corriger avant d'ouvrir le deuxième métier** : le nom
`detail-enduit` est écrit en dur dans `composer.mjs`. Pour la couverture ce
sera `detail-zinc`, pour le carrelage `detail-joint`. Une ligne à changer,
notée ici pour ne pas la découvrir sur le premier chantier hors ravalement.

---

## 2. Les paires avant/après : le seul point où l'IA casse

Une paire n'est bonne que si c'est **le même bâtiment, au même endroit, à la
même focale**. Générer deux images séparément donne deux bâtiments différents,
et le comparateur devient absurde.

La marche à suivre, dans cet ordre :

1. générer d'abord **l'après** (la façade finie), en soignant le cadrage ;
2. reprendre **cette image** en modification (image-to-image), avec la
   consigne : « garde exactement le même bâtiment, le même cadrage, la même
   lumière, la même heure ; dégrade l'enduit : fissures, cloques, salissures
   de ruissellement, peinture écaillée » ;
3. vérifier en superposant : les fenêtres, la gouttière et le trottoir doivent
   tomber au même pixel.

Le `hero` se fabrique pareil, mais en une seule image : demander explicitement
une façade dont **la moitié gauche est sous échafaudage et la moitié droite
terminée**, la limite tombant sur un axe vertical du bâtiment (descente d'eau,
angle de mur).

---

## 3. Consignes valables pour toutes les images

- **Aucun visage.** Mains, dos, silhouettes de loin, jamais un portrait.
- **Aucun texte lisible** : pas d'enseigne, pas de plaque de rue, pas de
  marque sur un outil ou un sac de mortier. L'IA écrit du faux français, ça se
  voit tout de suite.
- **Architecture française**, et méditerranéenne pour le Sud : enduit teinté,
  volets bois ou métal, tuiles canal, ferronneries. Pas de brique anglaise, pas
  de bardage nord-américain.
- **Lumière de fin de journée**, chaude, rasante. C'est elle qui donne la
  matière, et c'est elle que le site prolonge.
- **Pas de grand-angle déformant**, pas de ciel spectaculaire, pas de
  retouche « immobilier » saturée. On vend du sérieux, pas une brochure.
- **1600 px de large minimum**, JPEG qualité haute. Le générateur ré-encode en
  AVIF et WebP en quatre tailles, il n'a pas besoin de plus.
- **Cohérence par entreprise** : les huit images d'un même jeu doivent avoir
  l'air prises le même jour, par le même appareil.

---

## 4. Les métiers

### Vague 1 — les six qu'on ouvre en premier

| # | Métier | Codes APE visés | Mot géant | Matière du macro |
|---|---|---|---|---|
| 1 | **Ravalement de façade** | 43.34Z, 43.33Z, 43.99C | Ravalement | enduit gratté |
| 2 | **Peinture intérieure** | 43.34Z | Peinture | mur fini, bande de finition |
| 3 | **Maçonnerie générale** | 43.99C, 43.91B | Maçonnerie | pierre et joint frais |
| 4 | **Couverture et zinguerie** | 43.91B, 43.91A | Toiture | tuile canal, soudure zinc |
| 5 | **Menuiserie et fenêtres** | 43.32A, 43.32B | Menuiserie | bois raboté, joint de pose |
| 6 | **Carrelage et faïence** | 43.33Z | Carrelage | joint tiré, coupe d'angle |

### Vague 2 — ensuite

| # | Métier | Codes APE visés | Mot géant | Matière du macro |
|---|---|---|---|---|
| 7 | Plâtrerie et cloisons | 43.31Z | Plâtrerie | bande enduite, angle droit |
| 8 | Isolation extérieure | 43.29A | Isolation | panneau et sous-enduit |
| 9 | Électricité | 43.21A | Électricité | tableau câblé, peignes cuivre |
| 10 | Plomberie et chauffage | 43.22A, 43.22B | Plomberie | cuivre brasé, collecteur |
| 11 | Serrurerie et portails | 43.32B, 25.11Z | Métallerie | acier brossé, cordon de soudure |
| 12 | Terrassement et VRD | 43.12A | Terrassement | grave compactée, bordure |
| 13 | Étanchéité toiture-terrasse | 43.99A | Étanchéité | bitume soudé, relevé |
| 14 | Parquet et sols souples | 43.33Z | Parquet | chêne huilé, coupe de lame |
| 15 | Piscine | 43.99C | Piscine | margelle, enduit de bassin |
| 16 | Paysagiste | 81.30Z | Jardin | pavé engazonné, taille nette |

Les codes APE sont **à confirmer sur la base Sirene** au moment d'ouvrir
chaque métier — c'est le skill `prospection-sirene` qui tranche, pas ce
tableau. Un code faux donne une liste de prospects fausse.

---

## 5. Ce qu'il faut générer, métier par métier

Pour chaque métier : **8 images obligatoires** (le jeu ci-dessus) × autant de
jeux qu'on veut de variété, puis les quatre couches de banque.

### 5.1 Ravalement de façade

| Rôle | Sujet exact à demander |
|---|---|
| hero | immeuble de trois niveaux, moitié gauche sous échafaudage avec filet, moitié droite enduit neuf teinte sable, coupure sur la descente d'eau |
| avant-01 / apres-01 | maison de ville deux niveaux, volets bleus ; avant : enduit cloqué, fissures suivies, coulures sous les appuis |
| avant-02 / apres-02 | immeuble d'angle, quatre niveaux, balcons ferronnerie |
| chantier | échafaudage monté sur une façade, bâche, trottoir protégé, vu depuis la rue |
| geste | taloche chargée d'enduit appliquée contre le mur, main et avant-bras seulement |
| detail-enduit | macro d'enduit gratté fin, lumière rasante, grain net |

**Matière** (8) : gratté fin, taloché, lissé, monocouche projeté, chaux
brossée, fissure ouverte en V avant reprise, joint de pierre repris, arête
d'angle neuve.
**Geste** (4) : lame qui gratte, brosse sur support humide, projection à la
machine, règle d'aluminium tirée sur l'enduit.
**Ambiance** (4) : rue étroite avec échafaudage, seau et outils au sol,
échafaudage à contre-jour en fin de journée, façade terminée vue en contre-plongée.
**Signes** (3) : texture d'enduit à plat pour fond, trame de filet de chantier,
pastille d'accent tirée de l'enduit.

### 5.2 Peinture intérieure

| Rôle | Sujet exact |
|---|---|
| hero | grande pièce, moitié gauche en travaux (bâches, sous-couche, ruban), moitié droite finie, coupure sur un angle de mur |
| avant-01 / apres-01 | salon avec murs marqués, traces, fissures ; après : murs unis, plinthes nettes |
| avant-02 / apres-02 | cage d'escalier ou couloir |
| chantier | pièce bâchée, escabeau, pots alignés, ruban de masquage en place |
| geste | rouleau qui dépose la peinture, bande nette sur le mur, main seulement |
| detail-peinture | macro du mur fini, grain de rouleau visible en lumière rasante |

**Matière** (8) : grain de rouleau, mur laqué, bande de finition à l'angle,
plinthe peinte, enduit de rebouchage poncé, papier abîmé avant dépose, boiserie
laquée, nuancier de teintes posé sur le mur.
**Geste** (4) : ruban tiré, spatule qui reboucha, ponçage, pinceau en coupe d'angle.
**Ambiance** (4) : pièce vide bâchée, lumière de fenêtre sur mur frais, pots et
outils rangés, escabeau en silhouette.
**Signes** (3) : aplat de teinte, texture de rouleau, grain de toile bâche.

### 5.3 Maçonnerie générale

| Rôle | Sujet exact |
|---|---|
| hero | mur de pierre, moitié gauche déjointoyée et étayée, moitié droite rejointoyée |
| avant-01 / apres-01 | muret ou mur de clôture dégradé, puis repris |
| avant-02 / apres-02 | ouverture créée dans un mur porteur, linteau posé |
| chantier | banchage ou montage de parpaings, bétonnière, ferraillage |
| geste | truelle qui charge le joint, main et outil |
| detail-pierre | macro de joint frais entre deux pierres |

**Matière** (8) : joint beurré, pierre taillée, parpaing monté au cordeau,
béton lissé, ferraillage en attente, linteau posé, chaînage d'angle, dalle talochée.
**Geste** (4) : truelle, fil à plomb, niveau posé, règle de maçon tirée.
**Ambiance** (4) : fondations ouvertes, banches en place, tas de sable et
gravier, mur monté à mi-hauteur en fin de journée.
**Signes** (3) : texture de béton, trame de parpaing, grain de sable.

### 5.4 Couverture et zinguerie

| Rôle | Sujet exact |
|---|---|
| hero | toiture en tuiles canal, moitié gauche déposée avec liteaux nus, moitié droite recouverte |
| avant-01 / apres-01 | toiture avec tuiles cassées et mousse, puis neuve |
| avant-02 / apres-02 | gouttière et rive, avant et après zinguerie |
| chantier | échafaudage de toit, palette de tuiles montée, filet de sécurité |
| geste | mains qui posent une tuile, ou fer à souder sur zinc |
| detail-zinc | macro d'une soudure de zinc ou d'un recouvrement de tuile |

**Matière** (8) : tuile canal neuve, tuile ancienne mousse, zinc plié, soudure
à l'étain, faîtage scellé, liteau et écran sous-toiture, solin, chéneau.
**Geste** (4) : pose de tuile, pliage de zinc, fer à souder, découpe à la cisaille.
**Ambiance** (4) : toit vu depuis l'échelle, ligne de faîtage contre le ciel de
fin de journée, palettes montées, gouttière en gros plan contre la façade.
**Signes** (3) : trame de tuiles, texture de zinc, grain d'ardoise.

### 5.5 Menuiserie et fenêtres

| Rôle | Sujet exact |
|---|---|
| hero | façade, moitié gauche anciennes fenêtres bois fatiguées, moitié droite fenêtres neuves posées |
| avant-01 / apres-01 | fenêtre ancienne simple vitrage, puis fenêtre neuve en place |
| avant-02 / apres-02 | porte d'entrée, avant et après |
| chantier | dépose en cours, calage, mousse et joint, protection au sol |
| geste | mains qui vissent une pattes de fixation, ou rabot sur le bois |
| detail-bois | macro de bois raboté, ou du joint de pose entre dormant et maçonnerie |

**Matière** (8) : chêne huilé, pin lasuré, aluminium laqué, PVC blanc, joint de
pose, paumelle, vitrage feuilleté vu en tranche, seuil aluminium.
**Geste** (4) : vissage, calage à la cale, pistolet à mastic, rabot.
**Ambiance** (4) : atelier avec établi, fenêtres neuves alignées contre un mur,
pièce vue à travers une fenêtre posée, protection au sol.
**Signes** (3) : veinage de bois, texture d'aluminium brossé, trame de vitrage.

### 5.6 Carrelage et faïence

| Rôle | Sujet exact |
|---|---|
| hero | sol de pièce, moitié gauche chape nue avec plots de colle, moitié droite carrelée |
| avant-01 / apres-01 | salle de bains datée, puis refaite |
| avant-02 / apres-02 | terrasse ou cuisine |
| chantier | carreaux empilés, croisillons, règle et niveau laser |
| geste | peigne à colle tiré, ou joint lissé à la raclette |
| detail-joint | macro d'un joint tiré entre deux carreaux |

**Matière** (8) : grès cérame, faïence blanche, joint gris tiré, coupe d'angle,
plinthe carrelée, mosaïque, colle peignée, seuil de douche.
**Geste** (4) : peigne à colle, coupe à la carrelette, croisillon posé, raclette à joint.
**Ambiance** (4) : pièce en cours, carreaux empilés, niveau laser dans la
pénombre, salle d'eau finie en lumière rasante.
**Signes** (3) : trame de carrelage, texture de joint, grain de grès.

### 5.7 à 5.16 — les autres métiers

Même structure, à produire au moment d'ouvrir le métier : **8 rôles + 8 matière
+ 4 geste + 4 ambiance + 3 signes**. Le sujet des huit rôles se déduit du
tableau des matières de la section 4.

---

## 6. Compte total

Par métier : **8 images par jeu de démonstration** (prévoir 3 jeux pour varier
les sites d'un même métier, soit 24) **+ 19 images de banque**.
Soit **43 images par métier**, 258 pour les six premiers.

Rangement :

```
sources-<metier>/
  hero.jpg  avant-01.jpg  apres-01.jpg  avant-02.jpg  apres-02.jpg
  chantier.jpg  geste.jpg  detail-<matiere>.jpg
  _donnees/<siren>.json
banque/<metier>/
  matiere/01..08.jpg   geste/01..04.jpg
  ambiance/01..04.jpg  signes/01..03.jpg
```

Les quatre couches de banque ne sont **pas encore lues par le générateur** :
il faudra les brancher (choix piloté par la graine, comme le reste) une fois
le premier lot produit. Le jeu de huit, lui, marche dès aujourd'hui.

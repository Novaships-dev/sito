# Liste de production des images, 16 métiers, 864 images

Engendrée par `scripts/liste-images.mjs` depuis `generateur/banque/plan-images.json`.
Pour une liste à cocher dans un tableur : `node scripts/liste-images.mjs --csv`.
Pour un seul métier : `node scripts/liste-images.mjs ravalement`.

**54 images par métier** : 10 hero, 10 paires avant/après (20 fichiers),
3 chantier, 5 geste, 8 matière (dont le détail principal), 5 ambiance, 3 signes.

Passé de 32 à 54 le 2 octobre 2026 : Fabrice veut 100 sites d'un même métier
différents dans un même département, et « chaque métier a des images
différentes ». Avec 2 photos hero et 3 paires, une paire de sites sur deux
montrait la même façade (mesure : `scripts/capacite-unicite.mjs`). Les 22
images ajoutées par métier sont les hero 3 à 10 et les paires 04 à 10.

## Les cinq règles qui valent pour les 864

1. **Aucun visage.** Mains, avant-bras, silhouettes de loin. Jamais un portrait.
2. **Aucun texte lisible** : ni enseigne, ni plaque de rue, ni marque sur un
   outil ou un sac. L'IA écrit du faux français, ça se repère tout de suite.
3. **Architecture française, méditerranéenne pour le Sud** : enduit teinté,
   volets bois ou métal, tuiles canal, ferronneries.
4. **Lumière de fin de journée, rasante.** C'est elle qui donne la matière.
5. **La largeur minimale de la colonne « largeur mini »** : 1600 px pour un
   hero, 1400 px pour tout le reste. C'est la plus grande rendition que le
   générateur encode à partir du fichier (`generateur/composer.mjs`) ; en
   dessous, le site afficherait un agrandissement. JPEG qualité haute, pas de
   grand-angle déformant, pas de ciel spectaculaire, pas de retouche saturée.

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
images/<metier>/sources/           tout ce que le générateur lit : hero, paires,
                                   chantier, geste, detail-<matière>
images/<metier>/banque/matiere/    matiere-02 à matiere-08
images/<metier>/banque/ambiance/   ambiance-01 à ambiance-05
images/<metier>/banque/signes/     signe-01 à signe-03
```

Avant toute fabrication, mesurer un métier : `node scripts/verifier-images.mjs
<metier>` (nom, largeur, cadrage, paires alignées, minimum jouable).

Un dossier dont les photos ne sont pas celles de l'entreprise reçoit un fichier
vide nommé `SOURCE-ILLUSTRATION`. Le générateur pose alors une mention visible
dans la page, et **refuse** de fabriquer en mode publication. Voir
`rules/common/ne-pas-fabriquer.md`.


## Ravalement de façade  (ravalement)
Codes APE : 43.34Z, 43.33Z, 43.99C   Mot geant : Ravalement   Matiere : enduit
Dossiers : images/ravalement/sources/ et images/ravalement/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | immeuble de trois niveaux, moitié gauche sous échafaudage et filet, moitié droite enduit sable terminé, coupure sur la descente d'eau |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | maison de ville, moitié gauche support piqué et gris, moitié droite enduit gratté neuf, coupure sur l'angle du mur |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | villa provençale à un étage, moitié gauche enduit ancien fissuré et grisé, moitié droite enduit taloché ocre clair, coupure sur la descente d'eau |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | maison de village en pierre, moitié gauche joints creusés et pierres nues, moitié droite enduit à pierre vue à la chaux, coupure sur un chaînage d'angle |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | immeuble de ville de cinq niveaux, moitié gauche façade noircie avec balcons, moitié droite enduit clair repris jusqu'à la corniche, coupure sur une ligne de fenêtres |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | pavillon des années 1970, moitié gauche crépi grisâtre avec traces vertes, moitié droite enduit gratté blanc cassé, coupure sur l'arête du garage |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | mas en pierre, moitié gauche vieil enduit tombé par plaques, moitié droite enduit à la chaux couleur sable, coupure sur l'encadrement d'une porte |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | façade d'angle de deux rues, moitié gauche sous échafaudage avec bâches, moitié droite terminée teinte rose pâle, coupure sur l'angle du bâtiment |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | immeuble des années 1960 à quatre étages, moitié gauche béton taché et épaufré, moitié droite enduit lisse gris clair, coupure sur un joint de dilatation |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | bastide à volets verts, moitié gauche peinture écaillée sur enduit, moitié droite enduit neuf jaune paille, coupure sur la descente d'eau |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | maison de ville deux niveaux, volets bleus, enduit cloqué, fissures suivies, coulures sous les appuis |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | la même maison, même cadrage, enduit gratté sable, appuis nettoyés  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | immeuble d'angle quatre niveaux, balcons en ferronnerie, enduit noirci par le ruissellement |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | le même immeuble, enduit repris, ferronneries dégagées  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | mur pignon aveugle, fissures en escalier, salissures vertes |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | le même pignon, monocouche teinté, fissures traitées  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | villa à toit de tuiles, enduit grisâtre, fissures sous les fenêtres, traces de ruissellement |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même villa, même cadrage, enduit taloché ocre, appuis repris  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | façade d'immeuble de trois étages, enduit qui tombe par plaques en pied de mur, mousse verte |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même immeuble, même cadrage, soubassement repris, enduit gratté beige  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | maison de village en pierre, joints creusés, enduit partiel en lambeaux |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | la même maison, même cadrage, enduit à pierre vue à la chaux  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | pavillon, crépi tyrolien sale et fissuré autour des menuiseries |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même pavillon, même cadrage, enduit gratté fin blanc cassé  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | façade sur cour avec descentes d'eau rouillées et coulures noires |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même cour, même cadrage, enduit neuf clair, descentes refixées  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | corniche et bandeau d'immeuble ancien, moulures érodées et noircies |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | la même corniche, même cadrage, moulures reprises, bandeau protégé  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | mur de clôture en enduit fissuré, chapeau cassé, mousses |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | le même mur, même cadrage, enduit repris, chapeau refait  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | échafaudage monté sur une façade de rue étroite, bâche, trottoir protégé |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | pied d'échafaudage, seaux, sacs de mortier empilés, règle d'aluminium appuyée |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | façade en cours, moitié piquée moitié enduite, vue du trottoir d'en face |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | taloche chargée d'enduit appliquée contre le mur, main et avant-bras |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | lame qui gratte l'enduit encore frais, poussière fine qui tombe |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | règle d'aluminium tirée à deux mains sur l'enduit |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | brosse qui humidifie le support avant reprise |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | lance de machine à projeter tenue à bout de bras, projection en cours |
| 39 | sources | `detail-enduit.jpg` | 4/3 | 1400 px | enduit gratté fin en lumière rasante  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | taloché serré, grain fermé |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | lissé à la chaux, léger nuancé |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | monocouche projeté, grain irrégulier |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | fissure ouverte en V avant reprise |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | joint de pierre repris au mortier de chaux |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | arête d'angle neuve, baguette invisible |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | raccord entre ancien et neuf, limite visible |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | rue étroite au soleil de fin de journée, échafaudage en silhouette |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | outils posés au pied du mur, ombre longue |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | façade terminée vue en contre-plongée contre le ciel |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | filet de chantier en contre-jour |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | gouttière et descente d'eau neuves contre l'enduit |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture d'enduit à plat, plein cadre |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de filet de chantier |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | poussière d'enduit dans un rai de lumière |


## Peinture intérieure  (peinture)
Codes APE : 43.34Z   Mot geant : Peinture   Matiere : mur fini
Dossiers : images/peinture/sources/ et images/peinture/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | grande pièce, moitié gauche en travaux (bâches, sous-couche, ruban), moitié droite finie, coupure sur l'angle du mur |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | couloir, moitié gauche papier arraché et plâtre nu, moitié droite peint en blanc cassé |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | chambre, moitié gauche murs rebouchés et poncés au plâtre blanc, moitié droite peinte vert sauge, coupure sur l'angle de la fenêtre |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | cuisine, moitié gauche murs gras et jaunis, moitié droite peinture lessivable blanche, coupure sur le bord de la hotte |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | bureau, moitié gauche ancien papier peint à motifs, moitié droite mur bleu profond, coupure sur l'encadrement de porte |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | séjour à plafond haut, moitié gauche plafond fissuré et taché, moitié droite plafond blanc mat, coupure sur une poutre |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | cage d'escalier d'immeuble, moitié gauche murs tagués et écaillés, moitié droite peinture neuve gris clair, coupure sur un palier |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | salle de bains, moitié gauche peinture cloquée par l'humidité, moitié droite peinture spéciale pièces humides, coupure sur l'angle de la douche |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | chambre d'enfant, moitié gauche murs marqués de traces, moitié droite deux teintes séparées par une ligne nette, coupure sur l'angle |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | entrée, moitié gauche boiseries écaillées, moitié droite boiseries laquées, coupure sur le chambranle |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | salon aux murs marqués, traces de meubles, fissures capillaires, plinthes jaunies |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | le même salon, murs unis, plinthes nettes  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | cage d'escalier sombre, peinture écaillée sur la rampe et les murs |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | la même cage, murs clairs, rampe reprise  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | chambre avec papier peint daté, décollé aux angles |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | la même chambre peinte, angles nets  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | cuisine aux murs jaunis par la graisse, prises entourées de traces |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même cuisine, même cadrage, murs blancs nets  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | séjour avec fissures au plafond et taches d'eau |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même séjour, même cadrage, plafond uni blanc  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | couloir étroit aux murs griffés, plinthes abîmées |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | le même couloir, même cadrage, murs clairs, plinthes peintes  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | bureau au papier peint daté et décollé |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même bureau, même cadrage, mur peint vert foncé  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | salle de bains aux murs moisis près du plafond |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même salle de bains, même cadrage, murs sains et peints  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | porte intérieure jaunie, chants écaillés |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | la même porte, même cadrage, laquée blanc satiné  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | chambre aux murs rebouchés de partout, taches de plâtre |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | la même chambre, même cadrage, peinture terminée  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | pièce entièrement bâchée, escabeau ouvert, pots alignés le long du mur |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | ruban de masquage en place sur plinthes et encadrements, avant première passe |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | bac à peinture, rouleau chargé, manche télescopique appuyé |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | rouleau qui dépose la peinture, bande fraîche et nette |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | pinceau en coupe d'angle le long d'une plinthe |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | spatule qui reboucha une fissure à l'enduit |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | cale à poncer sur un rebouchage sec, poussière fine |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | ruban de masquage tiré d'un geste continu |
| 39 | sources | `detail-peinture.jpg` | 4/3 | 1400 px | grain de rouleau en lumière rasante  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | mur laqué satiné, reflet doux |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | bande de finition à l'angle de deux teintes |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | plinthe peinte, arête nette contre le sol |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | enduit de rebouchage poncé, tache claire |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | papier peint décollé montrant le plâtre |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | boiserie laquée, veinage encore lisible |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | nuancier de teintes tenu contre le mur |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | pièce vide et bâchée, lumière de fenêtre |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | pots et outils rangés en fin de journée |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | escabeau en silhouette contre un mur frais |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | reflet de fenêtre sur un mur satiné |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | porte fraîchement peinte, entrouverte |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | aplat de teinte plein cadre |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | texture de rouleau à plat |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de toile de bâche |


## Maçonnerie générale  (maconnerie)
Codes APE : 43.99C, 43.91B   Mot geant : Maçonnerie   Matiere : pierre et joint
Dossiers : images/maconnerie/sources/ et images/maconnerie/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | mur de pierre, moitié gauche déjointoyée et étayée, moitié droite rejointoyée au mortier de chaux |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | extension en parpaings, moitié gauche brute, moitié droite enduite |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | mur de soutènement en pierres sèches, moitié gauche effondré, moitié droite remonté, coupure sur un poteau |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | façade de maison, moitié gauche ouverture brute sans linteau étayée, moitié droite baie finie avec linteau, coupure sur l'étai |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | pile de portail, moitié gauche fissurée et penchée, moitié droite reconstruite en pierre, coupure entre les deux piles |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | muret de jardin, moitié gauche parpaings nus, moitié droite enduit et chaperonné, coupure sur un joint |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | escalier extérieur en béton, moitié gauche marches épaufrées, moitié droite marches reprises, coupure sur la rampe |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | cave voûtée, moitié gauche pierres déjointoyées, moitié droite rejointoyées à la chaux, coupure sur l'arc |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | dalle de garage, moitié gauche coffrage et ferraillage, moitié droite coulée et talochée, coupure sur la règle de coffrage |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | cheminée intérieure en pierre, moitié gauche déposée en gravats, moitié droite remontée, coupure sur le jambage |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | muret de clôture dégradé, pierres descellées, joints tombés |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | le même muret remonté et rejointoyé  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | mur porteur avant ouverture, tracé au crayon pour la découpe |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | le même mur avec ouverture créée, linteau posé, tableaux nets  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | dalle de terrasse fissurée et affaissée |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | la même surface, dalle neuve talochée  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | mur en pierre avec une brèche et des pierres tombées au sol |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | le même mur, même cadrage, brèche reprise, joints neufs  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | seuil de porte cassé et creusé |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même seuil, même cadrage, seuil neuf en pierre  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | pilier de portail fendu en deux |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | le même pilier, même cadrage, reconstruit et chaperonné  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | escalier extérieur aux marches cassées |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même escalier, même cadrage, marches reprises  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | mur intérieur avant ouverture, gaines repérées |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | le même mur, même cadrage, ouverture faite, linteau apparent  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | muret en parpaings bruts |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | le même muret, même cadrage, enduit et couvertine posée  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | appentis en ruine, murs effondrés |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | le même appentis, même cadrage, murs remontés  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | montage de parpaings au cordeau, bétonnière en fond |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | banches en place, ferraillage en attente, étais |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | fondations ouvertes, tranchée nette, semelle ferraillée |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | truelle qui charge le joint entre deux pierres |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | fil à plomb tenu contre l'angle d'un mur |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | niveau à bulle posé sur une rangée de parpaings |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | règle de maçon tirée sur une dalle fraîche |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | massette et burin sur une pierre à retailler |
| 39 | sources | `detail-pierre.jpg` | 4/3 | 1400 px | joint frais beurré entre deux pierres  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | pierre taillée, arête vive |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | parpaing monté, joint régulier |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | béton lissé à l'hélicoptère |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | ferraillage en attente, fers croisés |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | linteau béton posé sur ses appuis |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | chaînage d'angle coffré |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | dalle talochée en cours de prise |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | chantier au petit matin, tas de sable et de gravier |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | mur monté à mi-hauteur en fin de journée |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | bétonnière en rotation, poussière |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | échafaudage bas et brouette |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | outils de maçon posés sur un parpaing |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture de béton brut |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de parpaings |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de sable de rivière |


## Couverture et zinguerie  (couverture)
Codes APE : 43.91B, 43.91A   Mot geant : Toiture   Matiere : tuile et zinc
Dossiers : images/couverture/sources/ et images/couverture/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | toiture en tuiles canal, moitié gauche déposée montrant liteaux et écran, moitié droite recouverte |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | toit à deux pans, moitié gauche mousse et tuiles cassées, moitié droite neuve |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | toit en ardoises, moitié gauche ardoises glissées et crochets rouillés, moitié droite ardoises neuves, coupure sur une lucarne |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | toiture en tuiles mécaniques, moitié gauche tuiles noircies, moitié droite tuiles neuves rouges, coupure sur le faîtage |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | toit de maison de village, moitié gauche génoises abîmées, moitié droite génoises refaites, coupure sur une descente d'eau |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | auvent, moitié gauche tôle rouillée, moitié droite zinc neuf, coupure sur un chevron |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | toiture, moitié gauche voliges apparentes et écran neuf, moitié droite tuiles posées, coupure sur une ligne de liteau |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | lucarne, moitié gauche zinguerie déchirée, moitié droite habillage zinc neuf, coupure au milieu de la lucarne |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | toit en pente douce, moitié gauche tuiles canal envahies d'herbe, moitié droite nettoyées et reposées, coupure sur une rangée de tuiles |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | chéneau d'immeuble, moitié gauche percé et rouillé, moitié droite chéneau zinc neuf, coupure sur une naissance d'eau |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | toiture couverte de mousse, tuiles glissées et cassées, faîtage descellé |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | la même toiture nettoyée et recouverte, faîtage scellé  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | gouttière percée et déformée, rive abîmée |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | la même gouttière en zinc neuf, rive refaite  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | souche de cheminée fissurée, solin ouvert |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | la même souche reprise, solin zinc neuf  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | toit en ardoises aux ardoises manquantes |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | le même toit, même cadrage, ardoises remplacées  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | génoise de maison provençale effritée |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | la même génoise, même cadrage, reprise rang par rang  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | fenêtre de toit mal raccordée, traces d'infiltration |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | la même fenêtre de toit, même cadrage, raccord étanche neuf  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | rive de toit sans planche, tuiles en porte-à-faux |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | la même rive, même cadrage, rive neuve posée  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | descente d'eau arrachée du mur |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même descente, même cadrage, zinc neuf fixé  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | noue de toiture encombrée de feuilles et percée |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | la même noue, même cadrage, noue zinc neuve  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | faîtage aux tuiles décalées et mortier tombé |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | le même faîtage, même cadrage, faîtières scellées  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | échafaudage de toit et filet de sécurité, palette de tuiles montée |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | liteaux et écran sous-toiture posés sur la moitié d'un pan |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | monte-matériaux appuyé contre la façade, tuiles en attente |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | mains qui posent une tuile canal sur le liteau |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | fer à souder sur une jonction de zinc, goutte d'étain |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | cisaille qui découpe une feuille de zinc |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | plieuse à main sur une bande de zinc |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | mains qui scellent une tuile faîtière au mortier |
| 39 | sources | `detail-zinc.jpg` | 4/3 | 1400 px | tuile canal neuve, courbe et ombre  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | tuile ancienne couverte de mousse |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | zinc plié, arête nette |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | soudure à l'étain sur zinc |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | faîtage scellé au mortier |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | liteau et écran sous-toiture |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | solin encastré dans la maçonnerie |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | chéneau en zinc, eau claire au fond |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | ligne de faîtage contre un ciel de fin de journée |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | toit vu depuis l'échelle, tuiles en perspective |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | palettes de tuiles montées sur le toit |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | gouttière neuve contre la façade |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | vue plongeante sur les toits d'un village |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | trame de tuiles plein cadre |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | texture de zinc patiné |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain d'ardoise |


## Menuiserie et fenêtres  (menuiserie)
Codes APE : 43.32A, 43.32B   Mot geant : Menuiserie   Matiere : bois et joint
Dossiers : images/menuiserie/sources/ et images/menuiserie/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | façade, moitié gauche anciennes fenêtres bois grises, moitié droite fenêtres neuves posées |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | atelier, moitié gauche bois brut empilé, moitié droite ouvrants finis alignés |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | salon, moitié gauche baie vitrée ancienne à cadre alu terne, moitié droite baie neuve à galandage, coupure sur le meneau |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | façade de maison de village, moitié gauche volets bois délavés, moitié droite volets neufs peints, coupure sur une descente d'eau |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | entrée, moitié gauche porte vitrée ancienne, moitié droite porte pleine neuve, coupure sur le dormant |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | chambre, moitié gauche fenêtre bois aux carreaux fendus, moitié droite fenêtre neuve double vitrage, coupure sur le montant central |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | escalier intérieur, moitié gauche marches usées et rampe branlante, moitié droite marches neuves et rampe bois, coupure sur un poteau |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | cuisine, moitié gauche placards anciens décollés, moitié droite façades neuves en bois, coupure sur un montant |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | garage, moitié gauche porte basculante cabossée, moitié droite porte sectionnelle neuve, coupure sur le pilier |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | dressing, moitié gauche niche brute, moitié droite placard sur mesure posé, coupure sur un montant |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | fenêtre ancienne simple vitrage, peinture écaillée, mastic tombé |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | la même baie avec fenêtre neuve posée  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | porte d'entrée fatiguée, seuil usé |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | la même porte remplacée, seuil aluminium neuf  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | volets bois décolorés et déformés |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | les mêmes volets refaits, lasure fraîche  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | porte-fenêtre aux bois gonflés et peinture craquelée |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même ouverture, même cadrage, porte-fenêtre neuve  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | escalier aux marches usées et creusées |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même escalier, même cadrage, marches neuves  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | portail bois disjoint |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | le même portail, même cadrage, portail bois neuf  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | placard de chambre aux portes voilées |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même placard, même cadrage, portes neuves coulissantes  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | fenêtre de toit en bois noircie |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même fenêtre, même cadrage, fenêtre neuve posée  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | porte de cave pourrie en bas |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | la même porte, même cadrage, porte neuve  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | pergola en bois grise et fendue |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | la même pergola, même cadrage, bois neuf lasuré  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | dépose en cours, ancien dormant sorti, protection au sol |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | calage et réglage d'un dormant neuf, niveau posé |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | fenêtres neuves alignées contre un mur, emballage retiré |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | mains qui vissent une patte de fixation dans le tableau |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | pistolet à mastic qui tire un joint de pose |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | rabot qui prend un copeau sur un chant de bois |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | mains qui règlent une paumelle à la clé |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | mètre et crayon sur un chant, trait de coupe |
| 39 | sources | `detail-bois.jpg` | 4/3 | 1400 px | chêne huilé, veinage serré  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | pin lasuré, nœud visible |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | aluminium laqué, arête nette |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | PVC blanc, soudure d'angle |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | joint de pose entre dormant et maçonnerie |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | paumelle en place, vis alignées |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | vitrage feuilleté vu en tranche |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | seuil aluminium, rupture de pont thermique |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | atelier avec établi et copeaux |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | ouvrants finis alignés contre un mur |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | pièce vue à travers une fenêtre neuve |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | protection au sol et outils rangés |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | lumière du matin sur un dormant posé |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | veinage de bois plein cadre |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | texture d'aluminium brossé |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | trame de vitrage et reflet |


## Carrelage et faïence  (carrelage)
Codes APE : 43.33Z   Mot geant : Carrelage   Matiere : joint et coupe
Dossiers : images/carrelage/sources/ et images/carrelage/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | sol de pièce, moitié gauche chape nue avec plots de colle, moitié droite carrelée et jointoyée |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | mur de salle d'eau, moitié gauche support nu, moitié droite faïence posée |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | cuisine, moitié gauche crédence brute, moitié droite crédence carrelée en métro, coupure sur l'angle du plan de travail |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | douche, moitié gauche receveur déposé et natte d'étanchéité, moitié droite douche à l'italienne carrelée, coupure sur le siphon |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | terrasse, moitié gauche dalle béton nue, moitié droite dalles posées sur plots, coupure sur un joint |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | entrée, moitié gauche vieux carrelage fendu, moitié droite carreaux de ciment neufs, coupure sur une ligne de joint |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | escalier extérieur, moitié gauche marches brutes, moitié droite marches carrelées avec nez de marche, coupure sur une marche |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | salle de bains, moitié gauche murs ragréés, moitié droite grand format posé, coupure sur un tasseau |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | plan de travail, moitié gauche bois abîmé, moitié droite carrelage posé, coupure sur un joint |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | séjour, moitié gauche ragréage frais, moitié droite carrelage imitation bois, coupure sur une règle |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | salle de bains datée, faïence fendue, joints noircis |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | la même salle de bains refaite  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | terrasse aux carreaux descellés, mousse dans les joints |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | la même terrasse recarrelée, joints nets  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | cuisine au sol usé et taché |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | la même cuisine, grès cérame posé  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | douche à joints noircis et carreaux fissurés |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même douche, même cadrage, refaite à l'italienne  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | crédence de cuisine aux carreaux jaunis |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | la même crédence, même cadrage, carreaux neufs  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | escalier extérieur aux carreaux décollés |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | le même escalier, même cadrage, recarrelé  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | sol d'entrée aux carreaux cassés |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | la même entrée, même cadrage, sol neuf  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | plage de piscine aux carreaux soulevés |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même plage, même cadrage, carrelage reposé  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | toilettes au carrelage daté |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | les mêmes toilettes, même cadrage, carrelage neuf  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | balcon aux carreaux fendus et joints vides |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | le même balcon, même cadrage, carrelage neuf et jointoyé  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | carreaux empilés, croisillons, seau de colle et peigne |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | niveau laser allumé dans une pièce en travaux |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | carrelette et carreau en cours de coupe sur tréteaux |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | peigne à colle tiré sur la chape, sillons réguliers |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | mains qui posent un carreau et le font coulisser |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | croisillon glissé entre deux carreaux |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | raclette qui pousse le joint en diagonale |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | éponge qui nettoie le voile de ciment |
| 39 | sources | `detail-joint.jpg` | 4/3 | 1400 px | grès cérame, surface mate  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | faïence blanche brillante |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | joint gris fraîchement tiré |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | coupe d'angle à 45 degrés |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | plinthe carrelée, arête nette |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | mosaïque de petits carreaux |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | colle peignée avant pose |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | seuil de douche à l'italienne |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | pièce en cours, carreaux empilés |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | niveau laser dans la pénombre |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | salle d'eau finie en lumière rasante |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | outils posés sur un carreau |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | reflet de fenêtre sur un sol neuf |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | trame de carrelage plein cadre |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | texture de joint |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de grès cérame |


## Plâtrerie et cloisons  (platrerie)
Codes APE : 43.31Z   Mot geant : Plâtrerie   Matiere : bande et angle
Dossiers : images/platrerie/sources/ et images/platrerie/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | pièce, moitié gauche ossature métallique nue, moitié droite plaques posées et bandes enduites |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | plafond, moitié gauche rails apparents, moitié droite fini blanc |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | combles, moitié gauche isolant apparent et suspentes, moitié droite plafond en plaques fini, coupure sur une solive |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | chambre, moitié gauche cloison en ossature, moitié droite cloison terminée avec porte, coupure sur le montant |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | séjour, moitié gauche faux plafond déposé, moitié droite faux plafond neuf avec spots, coupure sur une poutre |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | salle de bains, moitié gauche plaques hydrofuges vertes, moitié droite enduites et lissées, coupure sur un angle |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | couloir, moitié gauche murs bosselés, moitié droite doublage neuf, coupure sur un encadrement |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | plafond voûté, moitié gauche lattis apparent, moitié droite plâtre neuf, coupure sur l'arête |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | sous-pente, moitié gauche rampants bruts, moitié droite habillés en plaques, coupure sur une panne |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | niche murale, moitié gauche brute, moitié droite habillée avec étagères, coupure sur l'arête |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | cloison ancienne fissurée, plâtre gonflé |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | la même cloison refaite, surface plane  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | plafond taché et fissuré |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | le même plafond refait, bandes invisibles  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | angle de mur épaufré |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | le même angle repris, arête droite  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | plafond fissuré en toile d'araignée |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | le même plafond, même cadrage, plafond neuf  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | mur doublé décollé et bombé |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même mur, même cadrage, doublage neuf  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | combles nus avant aménagement |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | les mêmes combles, même cadrage, rampants habillés  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | cloison percée de trous de chevilles |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | la même cloison, même cadrage, cloison reprise  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | corniche en plâtre cassée |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même corniche, même cadrage, corniche reprise  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | arche de passage abîmée |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | la même arche, même cadrage, arche reprise  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | placard maçonné bancal |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | le même emplacement, même cadrage, cloison et niche neuves  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | ossature métallique montée, rails et montants alignés |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | plaques stockées à plat, visseuse posée dessus |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | pièce en cours, bandes en train de sécher |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | couteau à enduire qui tire une bande sur un joint |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | visseuse qui pose une vis affleurante |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | cutter qui coupe une plaque le long d'une règle |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | cale à poncer sur un joint sec |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | mains qui posent une bande armée dans l'enduit frais |
| 39 | sources | `detail-bande.jpg` | 4/3 | 1400 px | bande enduite, joint invisible  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | angle droit avec baguette |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | vis affleurante dans la plaque |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | découpe nette dans une plaque |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | isolant glissé entre montants |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | rail au sol, fixation visible |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | enduit de finition tiré fin |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | plaque hydrofuge vue en tranche |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | ossature à contre-jour |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | pièce blanche prête à peindre |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | poussière de ponçage dans la lumière |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | plaques empilées contre un mur |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | échafaudage roulant sous un plafond |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture de plaque de plâtre |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de rails |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | poussière fine en suspension |


## Isolation extérieure  (isolation)
Codes APE : 43.29A   Mot geant : Isolation   Matiere : panneau et sous-enduit
Dossiers : images/isolation/sources/ et images/isolation/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | façade, moitié gauche panneaux isolants posés et chevillés, moitié droite finie enduite |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | pignon, moitié gauche mur nu, moitié droite isolé et enduit |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | maison de plain-pied, moitié gauche murs nus avec rails de départ, moitié droite isolée et enduite, coupure sur l'angle |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | immeuble, moitié gauche panneaux posés en quinconce, moitié droite treillis et enduit, coupure sur une ligne de fenêtres |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | façade, moitié gauche bardage déposé, moitié droite bardage bois neuf sur isolant, coupure sur une descente d'eau |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | mur de garage, moitié gauche brique nue, moitié droite isolé et enduit gris, coupure sur la porte |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | maison à étage, moitié gauche échafaudage et isolant, moitié droite terminée, coupure sur la descente d'eau |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | pignon, moitié gauche isolant chevillé, moitié droite sous-enduit armé, coupure sur un repère |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | façade, moitié gauche appuis anciens, moitié droite appuis prolongés au nu de l'isolant, coupure entre deux fenêtres |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | maison, moitié gauche enduit ancien fissuré, moitié droite enduit neuf sur isolation, coupure sur l'angle |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | maison aux murs nus, enduit ancien fatigué |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | la même maison isolée par l'extérieur, enduit neuf  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | tableau de fenêtre sans isolation |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | le même tableau traité, retour d'isolant posé  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | soubassement dégradé |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | le même soubassement isolé et enduit  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | façade nord tachée d'humidité |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même façade, même cadrage, isolée et enduite  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | pignon en parpaings nus |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même pignon, même cadrage, isolé et enduit  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | maison aux murs fins et volets roulants anciens |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | la même maison, même cadrage, isolée, coffres repris  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | angle de façade fissuré |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même angle, même cadrage, isolé avec cornière  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | façade de garage brute |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même façade, même cadrage, isolée et enduite  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | appuis de fenêtre trop courts après travaux |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | les mêmes appuis, même cadrage, appuis prolongés  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | maison en briques ternes |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | la même maison, même cadrage, isolée et bardée  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | panneaux isolants empilés au pied de l'échafaudage |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | façade à mi-parcours, panneaux posés en quinconce |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | treillis de fibre de verre déroulé sur le sous-enduit |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | mains qui chevillent un panneau isolant |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | couteau qui marque et coupe un panneau |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | taloche qui applique le sous-enduit sur le treillis |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | mains qui déroulent le treillis et le noient dans l'enduit |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | règle qui vérifie la planéité des panneaux |
| 39 | sources | `detail-isolant.jpg` | 4/3 | 1400 px | panneau de polystyrène vu en tranche  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | laine de roche, fibres visibles |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | treillis noyé dans le sous-enduit |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | cheville à frapper en place |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | retour d'isolant au tableau de fenêtre |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | profilé de départ en bas de mur |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | sous-enduit frais, grain gris |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | enduit de finition sur isolant |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | façade à mi-chantier, panneaux et enduit |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | échafaudage bâché en fin de journée |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | panneaux empilés et sanglés |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | mur isolé vu en lumière rasante |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | angle de maison traité, arête nette |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture de polystyrène |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de treillis |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de sous-enduit |


## Électricité  (electricite)
Codes APE : 43.21A   Mot geant : Électricité   Matiere : tableau et cuivre
Dossiers : images/electricite/sources/ et images/electricite/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | local technique, moitié gauche vieux tableau à fusibles, moitié droite tableau neuf modulaire |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | mur, moitié gauche saignées ouvertes et gaines, moitié droite fini |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | cuisine, moitié gauche fils sortant des murs, moitié droite prises et éclairage posés, coupure sur la crédence |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | garage, moitié gauche baladeuses et rallonges, moitié droite circuit neuf sous goulotte, coupure sur un poteau |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | séjour, moitié gauche plafond avec fils pendants, moitié droite spots encastrés allumés, coupure sur une poutre |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | tableau, moitié gauche disjoncteurs anciens, moitié droite tableau neuf repéré, coupure sur le rail |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | façade, moitié gauche éclairage extérieur cassé, moitié droite appliques neuves, coupure sur la porte |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | salle de bains, moitié gauche prises non conformes, moitié droite appareillage neuf, coupure sur le meuble |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | chambre, moitié gauche murs ouverts pour les gaines, moitié droite murs refermés avec interrupteurs, coupure sur la porte |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | jardin, moitié gauche tranchée et gaine, moitié droite bornes lumineuses posées, coupure sur une allée |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | tableau électrique ancien, fusibles porcelaine, fils en désordre |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | le même emplacement, tableau modulaire neuf, repérage en place  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | prise pendante et fils apparents |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | le même mur, appareillage encastré et net  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | coffret extérieur rouillé |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | le même coffret remplacé, étiquetage neuf  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | fils de plafond pendants sans luminaire |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | le même plafond, même cadrage, luminaire posé  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | cuisine avec multiprises en chaîne |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | la même cuisine, même cadrage, prises neuves en nombre  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | compteur et disjoncteur sur une planche |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | le même emplacement, même cadrage, gaine technique neuve  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | garage éclairé par une ampoule nue |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même garage, même cadrage, éclairage neuf  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | prise extérieure arrachée |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | le même mur, même cadrage, prise étanche neuve  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | salle de bains aux fils apparents |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | la même salle de bains, même cadrage, appareillage conforme  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | interphone cassé à l'entrée |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | la même entrée, même cadrage, visiophone neuf  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | saignées ouvertes dans le mur, gaines en attente |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | tableau en cours de câblage, peignes posés, fils peignés |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | touret de câble et outils sur un établi de chantier |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | mains qui dénudent un fil à la pince |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | tournevis qui serre une borne de disjoncteur |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | mains qui peignent les fils dans le tableau |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | aiguille qui tire un fil dans une gaine |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | multimètre tenu sur une borne, pointes en place |
| 39 | sources | `detail-tableau.jpg` | 4/3 | 1400 px | tableau câblé, peignes cuivre alignés  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | disjoncteurs en rang, manettes nettes |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | fils repérés et étiquetés |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | gaine annelée dans une saignée |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | boîte d'encastrement scellée |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | borne automatique vue de près |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | cuivre dénudé, brins serrés |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | coffret de communication rangé |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | local technique en lumière crue |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | tableau ouvert vu de face, net |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | outils d'électricien posés en ordre |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | gaines qui sortent d'un mur nu |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | tableau fermé, façade blanche |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | trame de peignes cuivre |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | texture de gaine annelée |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de plastique de coffret |


## Plomberie et chauffage  (plomberie)
Codes APE : 43.22A, 43.22B   Mot geant : Plomberie   Matiere : cuivre brasé
Dossiers : images/plomberie/sources/ et images/plomberie/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | chaufferie, moitié gauche vieille chaudière et tuyaux rouillés, moitié droite installation neuve |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | mur technique, moitié gauche tuyaux anciens, moitié droite collecteur neuf |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | salle de bains, moitié gauche baignoire ancienne, moitié droite douche neuve, coupure sur le mur |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | cuisine, moitié gauche évier ancien et tuyaux apparents, moitié droite évier neuf, coupure sur le meuble |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | buanderie, moitié gauche ballon rouillé, moitié droite chauffe-eau neuf, coupure sur un tuyau |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | toilettes, moitié gauche WC ancien à réservoir haut, moitié droite WC suspendu, coupure sur le mur |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | sous-sol, moitié gauche tuyaux en plomb, moitié droite cuivre neuf, coupure sur une vanne |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | séjour, moitié gauche radiateur ancien, moitié droite radiateur neuf, coupure sous la fenêtre |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | chaufferie, moitié gauche réservoir de fioul, moitié droite pompe à chaleur, coupure sur le mur |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | salle d'eau, moitié gauche lavabo fendu, moitié droite meuble vasque neuf, coupure sur le miroir |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | vieille chaudière murale entartrée, raccords verdis |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | le même emplacement, équipement neuf posé  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | salle d'eau aux tuyaux apparents, robinetterie calcaire |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | la même salle d'eau, alimentation encastrée, robinetterie neuve  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | radiateur fonte rouillé sous une fenêtre |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | le même emplacement, radiateur neuf posé  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | douche au receveur fêlé et joints noirs |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même douche, même cadrage, douche neuve  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | cuisine à la robinetterie qui fuit |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | la même cuisine, même cadrage, robinetterie neuve  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | WC ancien jauni |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | le même emplacement, même cadrage, WC neuf  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | ballon d'eau chaude rouillé dans un placard |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même placard, même cadrage, chauffe-eau neuf  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | radiateur en fonte qui fuit |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | le même mur, même cadrage, radiateur neuf  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | sous-évier encombré de tuyaux |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | le même sous-évier, même cadrage, évacuations neuves  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | chaudière au sol ancienne |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | le même local, même cadrage, chaudière neuve  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | collecteur en cours de montage, nourrice et vannes |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | tubes cuivre coupés à longueur, posés sur tréteaux |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | unité extérieure de pompe à chaleur en cours de calage |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | chalumeau qui braise un raccord cuivre |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | pince à sertir refermée sur un raccord multicouche |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | coupe-tube en rotation sur un cuivre |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | clé à molette sur un écrou de raccordement |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | mains qui purgent un radiateur, clé et chiffon |
| 39 | sources | `detail-cuivre.jpg` | 4/3 | 1400 px | cuivre brasé, cordon régulier  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | collecteur et vannes alignées |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | multicouche serti, bague marquée |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | robinet thermostatique neuf |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | calorifuge posé sur un tube |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | filetage et téflon enroulé |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | tube PER en couronne |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | échangeur à plaques vu de près |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | chaufferie propre et éclairée |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | tubes alignés contre un mur |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | unité extérieure sur ses plots |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | outils de plombier posés |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | vapeur légère devant une chaudière |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture de cuivre poli |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de tubes parallèles |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de calorifuge |


## Serrurerie et portails  (metallerie)
Codes APE : 43.32B, 25.11Z   Mot geant : Métallerie   Matiere : acier et soudure
Dossiers : images/metallerie/sources/ et images/metallerie/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | atelier, moitié gauche acier brut et gabarit, moitié droite ouvrage peint fini |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | entrée de propriété, moitié gauche ancien portail rouillé, moitié droite portail neuf |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | escalier extérieur, moitié gauche rampe rouillée, moitié droite rampe neuve, coupure sur une marche |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | terrasse, moitié gauche garde-corps vétuste, moitié droite garde-corps acier et verre, coupure sur un poteau |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | vitrine, moitié gauche rideau métallique tagué, moitié droite rideau neuf, coupure sur le montant |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | jardin, moitié gauche clôture grillagée affaissée, moitié droite panneaux métalliques neufs, coupure sur un poteau |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | intérieur, moitié gauche escalier en bois, moitié droite escalier métallique neuf, coupure sur une marche |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | balcon, moitié gauche barreaudage piqué, moitié droite barreaudage repeint, coupure sur une fixation |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | portillon, moitié gauche portillon rouillé, moitié droite portillon neuf, coupure sur le pilier |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | fenêtre, moitié gauche barreaux tordus, moitié droite grille neuve, coupure sur le meneau |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | portail en fer rouillé et déformé, gonds descellés |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | le même accès, portail neuf posé  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | garde-corps de balcon corrodé |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | le même garde-corps refait, thermolaqué  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | grille de fenêtre piquée |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | la même grille remplacée  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | rampe d'escalier rouillée et branlante |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même rampe, même cadrage, rampe neuve  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | portillon de jardin tordu |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même accès, même cadrage, portillon neuf  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | pergola métallique rouillée |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | la même pergola, même cadrage, métal repeint  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | auvent de porte déformé |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même auvent, même cadrage, auvent neuf  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | grille de soupirail rouillée |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même grille, même cadrage, grille neuve  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | escalier extérieur métallique corrodé |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | le même escalier, même cadrage, escalier repris  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | clôture métallique affaissée |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | la même clôture, même cadrage, clôture neuve  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | atelier avec gabarit de montage, pièces en attente |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | portail posé sur tréteaux avant peinture |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | scellement des poteaux, niveau et étais |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | poste à souder en action, arc et fumée légère, main gantée |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | meuleuse qui ébavure un cordon, gerbe d'étincelles |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | équerre et serre-joint sur un assemblage |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | mains qui percent un plat d'acier |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | pinceau qui applique une couche d'apprêt |
| 39 | sources | `detail-acier.jpg` | 4/3 | 1400 px | acier brossé, grain de meulage  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | cordon de soudure régulier |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | thermolaquage noir mat |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | acier corten patiné |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | assemblage boulonné |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | charnière massive graissée |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | tube carré coupé net |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | apprêt gris sur acier nu |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | atelier en contre-jour, étincelles |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | portail neuf devant un mur de pierre |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | établi et outils de métallier |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | pièces d'acier empilées |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | ombre d'une grille sur un mur |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture d'acier brossé |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de barreaux |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de peinture martelée |


## Terrassement et VRD  (terrassement)
Codes APE : 43.12A   Mot geant : Terrassement   Matiere : grave et bordure
Dossiers : images/terrassement/sources/ et images/terrassement/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | terrain, moitié gauche en terre remuée, moitié droite plateforme réglée et compactée |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | accès, moitié gauche chemin boueux, moitié droite enrobé posé |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | parcelle, moitié gauche broussailles, moitié droite terrain décapé, coupure sur un piquet |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | cour, moitié gauche gravats, moitié droite cour en grave, coupure sur une bordure |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | jardin en pente, moitié gauche talus nu, moitié droite talus stabilisé en gabions, coupure sur un gabion |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | accès de garage, moitié gauche tranchée de réseaux, moitié droite enrobé neuf, coupure sur un regard |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | terrain, moitié gauche fouilles de fondations, moitié droite fondations coulées, coupure sur le coffrage |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | chemin, moitié gauche ornières pleines d'eau, moitié droite chemin drainé, coupure sur un caniveau |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | parking, moitié gauche terre battue, moitié droite dalles alvéolées, coupure sur une ligne |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | terrain, moitié gauche souches et racines, moitié droite terrain nivelé, coupure sur un engin |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | terrain en pente, terre nue, ornières |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | le même terrain terrassé et nivelé  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | allée défoncée et boueuse |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | la même allée en grave compactée et bordurée  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | tranchée ouverte devant une maison |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | la même zone refermée et réglée  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | entrée de propriété boueuse |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même entrée, même cadrage, entrée en enrobé  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | terrain en friche avant construction |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même terrain, même cadrage, plateforme prête  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | talus qui s'effondre |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | le même talus, même cadrage, talus soutenu  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | cour inondée après la pluie |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | la même cour, même cadrage, cour drainée  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | allée de gravier dispersé |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même allée, même cadrage, allée bordurée  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | terrain avec tranchée de raccordement |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | le même terrain, même cadrage, raccordement refermé  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | zone de stationnement creusée d'ornières |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | la même zone, même cadrage, sol stabilisé  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | pelle mécanique en action, godet chargé |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | tranchée ouverte, gaines posées sur lit de sable |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | plaque vibrante sur une couche de grave |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | mains qui posent une bordure au cordeau |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | règle qui tire une couche de sable |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | niveau laser installé sur trépied |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | mains qui déroulent un géotextile |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | pelle qui règle un fond de forme |
| 39 | sources | `detail-grave.jpg` | 4/3 | 1400 px | grave compactée, cailloux serrés  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | bordure béton posée |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | sable réglé, surface lisse |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | géotextile déroulé |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | enrobé chaud fraîchement posé |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | regard de visite scellé |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | drain et gravier en tranchée |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | terre végétale régalée |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | chantier au lever du jour, engin à l'arrêt |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | tas de grave et de terre |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | tranchée rectiligne vue en longueur |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | plateforme réglée et vide |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | traces de chenilles dans la terre |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture de grave |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de bordures alignées |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de sable et poussière |


## Étanchéité toiture-terrasse  (etancheite)
Codes APE : 43.99A   Mot geant : Étanchéité   Matiere : bitume soudé
Dossiers : images/etancheite/sources/ et images/etancheite/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | toiture-terrasse, moitié gauche ancienne membrane cloquée, moitié droite bitume neuf soudé |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | terrasse, moitié gauche support nu, moitié droite membrane posée et relevés faits |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | terrasse, moitié gauche gravillons et membrane ancienne, moitié droite membrane neuve et gravillons propres, coupure sur un relevé |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | toit de garage, moitié gauche feutre déchiré, moitié droite membrane EPDM neuve, coupure sur une planche de rive |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | balcon, moitié gauche carrelage fissuré, moitié droite résine d'étanchéité, coupure sur le garde-corps |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | terrasse végétalisée, moitié gauche membrane nue, moitié droite substrat et plantations, coupure sur une bordure |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | toiture-terrasse, moitié gauche flaques, moitié droite pentes reprises, coupure sur une évacuation |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | acrotère, moitié gauche relevé décollé, moitié droite relevé neuf, coupure sur un angle |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | terrasse, moitié gauche isolant posé, moitié droite membrane soudée, coupure sur un lé |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | auvent plat, moitié gauche bitume fendu, moitié droite membrane neuve, coupure sur un chevron |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | toiture-terrasse fissurée, cloques et flaques stagnantes |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | la même terrasse refaite, surface nette  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | relevé d'acrotère décollé |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | le même relevé refait, bande de solin posée  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | évacuation bouchée et affaissée |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | la même évacuation reprise, platine neuve  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | toit de garage couvert de mousse |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | le même toit, même cadrage, membrane neuve  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | balcon qui fuit sur l'étage du dessous |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même balcon, même cadrage, étanchéité refaite  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | terrasse aux gravillons et herbes |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | la même terrasse, même cadrage, terrasse refaite  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | relevé décollé contre un mur |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même relevé, même cadrage, relevé neuf  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | évacuation pleine de feuilles |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même évacuation, même cadrage, crapaudine neuve  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | coupole de toit fissurée |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | la même coupole, même cadrage, coupole remplacée  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | toit plat avec rustines |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | le même toit, même cadrage, membrane continue  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | rouleaux de membrane en attente, chalumeau à proximité |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | terrasse en cours, moitié couverte, ligne de recouvrement |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | acrotère préparé, primaire appliqué |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | chalumeau qui soude un lé de bitume, flamme et fondu |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | rouleau déroulé au pied, membrane qui se pose |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | mains qui marouflent un recouvrement |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | pinceau qui applique le primaire d'accrochage |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | cutter qui recoupe un lé le long d'un relevé |
| 39 | sources | `detail-bitume.jpg` | 4/3 | 1400 px | bitume soudé, cordon de fusion  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | recouvrement de deux lés |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | relevé d'acrotère terminé |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | platine d'évacuation posée |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | granulés minéraux en surface |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | primaire noir sur support béton |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | membrane soudée à l'air chaud |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | joint de dilatation traité |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | terrasse vue à plat, lignes de lés |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | fumée légère au-dessus du chalumeau |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | rouleaux alignés contre l'acrotère |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | flaque d'eau claire sur membrane neuve |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | ciel bas au-dessus d'une terrasse |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture de bitume granulé |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de recouvrements |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de membrane |


## Parquet et sols souples  (parquet)
Codes APE : 43.33Z   Mot geant : Parquet   Matiere : chêne huilé
Dossiers : images/parquet/sources/ et images/parquet/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | pièce, moitié gauche ancien sol déposé et ragréage, moitié droite parquet posé |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | couloir, moitié gauche revêtement usé, moitié droite sol souple neuf |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | salon, moitié gauche parquet grisé, moitié droite parquet poncé vitrifié, coupure sur une lame |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | chambre, moitié gauche lino ancien, moitié droite parquet chêne, coupure sur une barre de seuil |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | escalier, moitié gauche marches moquettées, moitié droite marches en bois, coupure sur une marche |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | séjour, moitié gauche carrelage ancien, moitié droite parquet flottant, coupure sur une plinthe |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | bureau, moitié gauche lames disjointes, moitié droite lames resserrées, coupure sur une lame |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | chambre, moitié gauche dalles plastiques, moitié droite sol vinyle imitation bois, coupure sur la porte |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | salon, moitié gauche parquet taché, moitié droite parquet huilé, coupure sur un tapis retiré |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | couloir, moitié gauche chape, moitié droite parquet à bâtons rompus, coupure sur une règle |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | parquet ancien rayé, lames disjointes et grises |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | le même parquet poncé et huilé  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | moquette tachée dans une chambre |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | la même chambre, parquet flottant posé  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | sol souple décollé dans une cuisine |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | la même cuisine, sol neuf  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | parquet taché d'eau près d'une fenêtre |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | le même parquet, même cadrage, lames remplacées et huilées  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | escalier recouvert de moquette usée |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même escalier, même cadrage, bois remis à nu  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | sol de cuisine en lino déchiré |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | la même cuisine, même cadrage, sol vinyle neuf  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | parquet grinçant aux lames soulevées |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même parquet, même cadrage, refixé et poncé  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | chambre au carrelage froid |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même chambre, même cadrage, parquet posé  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | parquet verni jauni |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | le même parquet, même cadrage, poncé et huilé naturel  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | seuil de porte aux revêtements mal raccordés |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | le même seuil, même cadrage, raccord net  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | lames empilées en acclimatation, cales de dilatation |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | ragréage en cours, lisseur et seau |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | ponceuse à bande en pause sur un parquet à moitié poncé |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | mains qui emboîtent deux lames |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | maillet et cale qui tassent une lame |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | ponceuse qui passe sur un parquet, poussière |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | pinceau qui applique l'huile, bois qui fonce |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | cutter qui coupe un sol souple le long d'une règle |
| 39 | sources | `detail-parquet.jpg` | 4/3 | 1400 px | chêne huilé, veinage chaud  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | lame poncée, arête vive |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | joint entre deux lames |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | sol souple à motif bois |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | plinthe et cale de dilatation |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | ragréage lissé, surface mate |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | seuil entre deux revêtements |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | parquet ancien avant ponçage |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | pièce vide au sol neuf, lumière de fenêtre |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | lames empilées contre un mur |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | poussière de ponçage dans un rai de lumière |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | reflet de fenêtre sur parquet huilé |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | outils posés sur le sol fini |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture de chêne plein cadre |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de lames |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de poussière de bois |


## Piscine  (piscine)
Codes APE : 43.99C   Mot geant : Piscine   Matiere : margelle et enduit
Dossiers : images/piscine/sources/ et images/piscine/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | bassin, moitié gauche en travaux (ferraillage, banches), moitié droite terminé et rempli |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | plage de piscine, moitié gauche dalle brute, moitié droite margelles posées |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | bassin, moitié gauche liner décoloré, moitié droite liner neuf bleu, coupure sur une échelle |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | plage, moitié gauche gravier, moitié droite bois composite, coupure sur une margelle |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | bassin, moitié gauche vide et sale, moitié droite rempli d'eau claire, coupure sur l'escalier |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | local technique, moitié gauche pompe ancienne, moitié droite filtration neuve, coupure sur un tuyau |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | abord de piscine, moitié gauche terre nue, moitié droite dallage posé, coupure sur une margelle |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | bassin, moitié gauche carrelage tombé, moitié droite carrelage refait, coupure sur la ligne d'eau |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | piscine, moitié gauche sans abri, moitié droite abri bas posé, coupure sur un rail |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | bassin, moitié gauche enduit taché, moitié droite enduit neuf gris clair, coupure sur un skimmer |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | bassin ancien, enduit taché, margelles descellées |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | le même bassin rénové, eau claire  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | plage de piscine fissurée |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | la même plage refaite, margelles alignées  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | local technique en désordre |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | le même local rangé, filtration neuve  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | piscine verte abandonnée |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même piscine, même cadrage, eau claire  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | liner déchiré au fond du bassin |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même bassin, même cadrage, liner neuf  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | escalier de piscine fissuré |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | le même escalier, même cadrage, escalier refait  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | skimmer cassé |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même bord, même cadrage, skimmer neuf  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | abord de piscine en terre |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | le même abord, même cadrage, plage dallée  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | couverture de piscine déchirée |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | la même piscine, même cadrage, couverture neuve  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | ligne d'eau carrelée noircie |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | la même ligne d'eau, même cadrage, carrelage nettoyé et rejointoyé  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | ferraillage du bassin avant coulage |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | banches en place, réservations visibles |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | local technique en cours, pompe et filtre posés |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | mains qui posent une margelle au mortier |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | taloche qui applique l'enduit de bassin |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | mains qui règlent une vanne de filtration |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | niveau posé sur une margelle |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | brosse qui nettoie la ligne d'eau |
| 39 | sources | `detail-margelle.jpg` | 4/3 | 1400 px | margelle en pierre reconstituée  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | enduit de bassin lissé, teinte claire |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | ligne d'eau carrelée |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | escalier de bassin en béton |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | skimmer encastré |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | liner tendu, pli net |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | eau claire sur fond clair |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | plage en bois exotique |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | bassin rempli au soleil de fin de journée |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | reflets sur l'eau au calme |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | local technique propre |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | chantier de bassin vu de haut |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | margelles empilées en attente |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture d'eau en surface |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de margelles |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain d'enduit de bassin |


## Paysagiste  (paysagiste)
Codes APE : 81.30Z   Mot geant : Jardin   Matiere : pavé et gazon
Dossiers : images/paysagiste/sources/ et images/paysagiste/banque/

| # | dossier | fichier | cadrage | largeur mini | sujet a demander a l IA |
|---|---|---|---|---|---|
| 1 | sources | `hero.jpg` | 16/9 | 1600 px | jardin, moitié gauche friche et terre nue, moitié droite aménagé et planté |
| 2 | sources | `hero-variante-2.jpg` | 16/9 | 1600 px | allée, moitié gauche terre battue, moitié droite pavée |
| 3 | sources | `hero-variante-3.jpg` | 16/9 | 1600 px | pelouse, moitié gauche jaunie et pelée, moitié droite gazon neuf, coupure sur une bordure |
| 4 | sources | `hero-variante-4.jpg` | 16/9 | 1600 px | terrasse, moitié gauche dalles soulevées par des racines, moitié droite terrasse reposée, coupure sur un pot |
| 5 | sources | `hero-variante-5.jpg` | 16/9 | 1600 px | massif, moitié gauche envahi de ronces, moitié droite planté de vivaces, coupure sur une pierre |
| 6 | sources | `hero-variante-6.jpg` | 16/9 | 1600 px | clôture, moitié gauche grillage nu, moitié droite haie plantée, coupure sur un poteau |
| 7 | sources | `hero-variante-7.jpg` | 16/9 | 1600 px | potager, moitié gauche terre en friche, moitié droite carrés potagers, coupure sur une planche |
| 8 | sources | `hero-variante-8.jpg` | 16/9 | 1600 px | allée, moitié gauche dalles cassées, moitié droite pas japonais, coupure sur une pierre |
| 9 | sources | `hero-variante-9.jpg` | 16/9 | 1600 px | talus, moitié gauche terre ravinée, moitié droite talus planté, coupure sur un piquet |
| 10 | sources | `hero-variante-10.jpg` | 16/9 | 1600 px | cour, moitié gauche béton nu, moitié droite cour plantée avec arbre, coupure sur une bordure |
| 11 | sources | `avant-01.jpg` | 4/3 | 1400 px | jardin en friche, herbes hautes, clôture affaissée |
| 12 | sources | `apres-01.jpg` | 4/3 | 1400 px | le même jardin aménagé  [MEME bâtiment, MEME cadrage que avant-01] |
| 13 | sources | `avant-02.jpg` | 4/3 | 1400 px | terrasse envahie de mousse |
| 14 | sources | `apres-02.jpg` | 4/3 | 1400 px | la même terrasse nettoyée et remise en état  [MEME bâtiment, MEME cadrage que avant-02] |
| 15 | sources | `avant-03.jpg` | 4/3 | 1400 px | haie dépérie et irrégulière |
| 16 | sources | `apres-03.jpg` | 4/3 | 1400 px | la même haie retaillée ou replantée  [MEME bâtiment, MEME cadrage que avant-03] |
| 17 | sources | `avant-04.jpg` | 4/3 | 1400 px | pelouse envahie de mousse |
| 18 | sources | `apres-04.jpg` | 4/3 | 1400 px | la même pelouse, même cadrage, gazon regarni  [MEME bâtiment, MEME cadrage que avant-04] |
| 19 | sources | `avant-05.jpg` | 4/3 | 1400 px | massif envahi de mauvaises herbes |
| 20 | sources | `apres-05.jpg` | 4/3 | 1400 px | le même massif, même cadrage, massif replanté  [MEME bâtiment, MEME cadrage que avant-05] |
| 21 | sources | `avant-06.jpg` | 4/3 | 1400 px | allée de jardin défoncée |
| 22 | sources | `apres-06.jpg` | 4/3 | 1400 px | la même allée, même cadrage, allée refaite  [MEME bâtiment, MEME cadrage que avant-06] |
| 23 | sources | `avant-07.jpg` | 4/3 | 1400 px | arbre mort au milieu du jardin |
| 24 | sources | `apres-07.jpg` | 4/3 | 1400 px | le même jardin, même cadrage, arbre abattu, sol replanté  [MEME bâtiment, MEME cadrage que avant-07] |
| 25 | sources | `avant-08.jpg` | 4/3 | 1400 px | terrasse en bois grisée |
| 26 | sources | `apres-08.jpg` | 4/3 | 1400 px | la même terrasse, même cadrage, bois nettoyé et huilé  [MEME bâtiment, MEME cadrage que avant-08] |
| 27 | sources | `avant-09.jpg` | 4/3 | 1400 px | clôture végétale clairsemée |
| 28 | sources | `apres-09.jpg` | 4/3 | 1400 px | la même clôture, même cadrage, haie dense  [MEME bâtiment, MEME cadrage que avant-09] |
| 29 | sources | `avant-10.jpg` | 4/3 | 1400 px | bassin de jardin vaseux |
| 30 | sources | `apres-10.jpg` | 4/3 | 1400 px | le même bassin, même cadrage, bassin curé et planté  [MEME bâtiment, MEME cadrage que avant-10] |
| 31 | sources | `chantier.jpg` | 4/3 | 1400 px | plants en godets alignés avant plantation, terre préparée |
| 32 | sources | `chantier-2.jpg` | 4/3 | 1400 px | pavés empilés et sable de pose étalé |
| 33 | sources | `chantier-3.jpg` | 4/3 | 1400 px | arrosage automatique en cours de pose, tuyaux en tranchée |
| 34 | sources | `geste.jpg` | 4/3 | 1400 px | mains qui plantent un arbuste, terre autour des racines |
| 35 | sources | `geste-2.jpg` | 4/3 | 1400 px | taille-haie en action, coupe nette |
| 36 | sources | `geste-3.jpg` | 4/3 | 1400 px | maillet qui cale un pavé |
| 37 | sources | `geste-4.jpg` | 4/3 | 1400 px | râteau qui règle une terre fine |
| 38 | sources | `geste-5.jpg` | 4/3 | 1400 px | sécateur sur une branche |
| 39 | sources | `detail-pave.jpg` | 4/3 | 1400 px | pavé engazonné, joint vert  [sert au mot geant, au WebGL et au prelevement de la palette] |
| 40 | banque/matiere | `matiere-02.jpg` | 4/3 | 1400 px | gazon fraîchement tondu, bandes régulières |
| 41 | banque/matiere | `matiere-03.jpg` | 4/3 | 1400 px | paillage d'écorce autour d'un pied |
| 42 | banque/matiere | `matiere-04.jpg` | 4/3 | 1400 px | bordure de jardin posée |
| 43 | banque/matiere | `matiere-05.jpg` | 4/3 | 1400 px | terre fine régalée |
| 44 | banque/matiere | `matiere-06.jpg` | 4/3 | 1400 px | haie taillée, arête nette |
| 45 | banque/matiere | `matiere-07.jpg` | 4/3 | 1400 px | dalle de terrasse sur plots |
| 46 | banque/matiere | `matiere-08.jpg` | 4/3 | 1400 px | goutte-à-goutte au pied d'un arbuste |
| 47 | banque/ambiance | `ambiance-01.jpg` | 3/2 | 1400 px | jardin en fin de journée, lumière basse |
| 48 | banque/ambiance | `ambiance-02.jpg` | 3/2 | 1400 px | outils posés sur l'herbe |
| 49 | banque/ambiance | `ambiance-03.jpg` | 3/2 | 1400 px | allée pavée vue en perspective |
| 50 | banque/ambiance | `ambiance-04.jpg` | 3/2 | 1400 px | arrosage en fonctionnement |
| 51 | banque/ambiance | `ambiance-05.jpg` | 3/2 | 1400 px | tas de terre et brouette |
| 52 | banque/signes | `signe-01.jpg` | 1/1 | 1400 px | texture de gazon plein cadre |
| 53 | banque/signes | `signe-02.jpg` | 1/1 | 1400 px | trame de pavés |
| 54 | banque/signes | `signe-03.jpg` | 1/1 | 1400 px | grain de terre et paillage |


864 images au total (jeu « complet »).

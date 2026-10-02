# Ce que Framer sait faire, et ce que ça change pour nous

Relevé du 14 septembre 2026. Sources en bas. Ce document n'est pas une règle :
c'est une base de comparaison. Ce qu'on en retient devient une règle ou rien.

## 1. Mesuré en page, pas jugé sur capture

Un seul site a pu être ouvert et mesuré dans un vrai navigateur depuis cette
session (les autorisations par site n'ont pas suivi) : **midu.design**, studio
de design, en vitrine de la galerie Framer. Mesuré à 1440 × 900 :

| Grandeur | Relevé |
|---|---|
| Hauteur de page | 11 306 px, soit 12,6 écrans |
| Familles de caractères | une seule, Switzer, en trois graisses, plus Inter |
| Tailles de texte distinctes | 15 |
| Plus petite, plus grande | 12 px et 84 px, rapport 7 |
| Titre h1 | 26 px seulement : le grand corps sert ailleurs, pas au h1 |
| Éléments avec `transform` | 92 |
| Éléments avec `filter` ou `backdrop-filter` | 58 |
| Éléments avec `mix-blend-mode` | 3 |
| Transitions CSS déclarées | **0** |
| Éléments en `position:sticky` | 0 |
| Images | 53 |

Le chiffre qui compte : **zéro transition CSS pour 92 transformations**. Framer
ne décrit pas le mouvement en CSS, il le pilote en JavaScript, image par image,
avec son propre moteur. C'est puissant et c'est cher : tout le mouvement dépend
du script. Chez nous, le mouvement est écrit en CSS et survit à un script mort.

## 2. Le vocabulaire de mouvement de Framer

Ce que l'outil sait poser sans écrire une ligne :

- **Appear** : l'élément s'anime en entrant dans l'écran, avec décalage entre
  voisins.
- **Scroll transforms** : position, échelle, rotation, opacité liées à la
  position du défilement, réversibles en remontant.
- **Sections collantes** et contenu qui défile par-dessus.
- **Transitions de page** : fondu, glissé, poussé, 200 à 400 ms.
- **Texte** : révélation par caractère, par mot ou par ligne, effet machine à
  écrire.
- **Hover, press, loop, drag** sur n'importe quel élément.
- **Variantes de composant** : accordéon, onglets, menus, bascules.
- **Ressort** paramétrable, inertie sur les éléments déplaçables.
- Le curseur personnalisé n'est pas natif : il passe par du code.

Rien là-dedans que nous ne sachions déjà produire. Nous avons en plus ce qu'un
gabarit ne peut pas avoir : la palette prélevée sur les photos de l'entreprise,
la coupure avant/après mesurée sur l'image, et une composition différente par
SIREN.

## 3. La vraie leçon : la structure, pas les effets

Le gabarit Framer de référence pour notre métier, SOLIDFRAME, construction et
rénovation, et un site de métier en vitrine, Interstellar Interiors, suivent la
même trame, dans cet ordre :

1. barre de navigation, sept entrées, deux boutons dont « Appeler » ;
2. ouverture : une phrase, deux boutons, trois réassurances courtes ;
3. **bandeau de chiffres** : 50+ chantiers, 10+ ans, 100 % assuré, 4,9/5 ;
4. **services**, six entrées avec image et prix de départ ;
5. pourquoi nous, trois raisons ;
6. **déroulé du chantier**, quatre à cinq étapes ;
7. **réalisations** avec métadonnées : commune, type de bien, nature des
   travaux, année ;
8. **témoignages**, douze, avec photo, nom et citation ;
9. **questions fréquentes**, quatre familles de trois questions ;
10. appel final plein écran, « Demander mon estimation » ;
11. pied de page : mentions, réseaux, politique.

## 4. Ce que nos pages n'ont pas

Comparé poste par poste avec l'archétype `matiere` :

| Eux | Nous |
|---|---|
| Bandeau de chiffres | absent |
| Liste de services avec prix de départ | fourchettes publiques et estimateur : **meilleur**, mais aucune liste de prestations |
| Réalisations avec commune, nature, année | photos sans métadonnées |
| Témoignages avec photo et nom | emplacement vide |
| Questions fréquentes | absent |
| Formulaire de contact | bouton d'appel seul |
| Pied de page complet | mentions minimales |
| Visage humain | aucune photo de personne |

À l'inverse, ils n'ont pas : comparateur avant/après tiré des photos de
l'entreprise, nuancier qui teinte la façade, estimateur calé sur des sources
publiques datées, gros plan de matière éclairé, et une page qui n'est pas le
gabarit du voisin.

## 5. Ce qui manque vraiment est du contenu, pas du code

Chiffres, témoignages, réalisations datées, visage : rien de tout cela ne
s'invente. `rules/common/ne-pas-fabriquer.md` l'interdit, et c'est ce qui rend
un site crédible pour un client. Ce sont des cases à remplir par l'artisan, à
lui demander une fois, pas des composants à écrire.

## Sources

- Galerie Framer : https://www.framer.com/gallery/
- midu.design, mesuré en page le 14 septembre 2026
- SOLIDFRAME, gabarit construction et rénovation : https://solidframe.framer.website/
- Interstellar Interiors : https://interstellarinteriors.com
- Guide des animations Framer : https://framerwebsites.com/blog/framer-animations-complete-guide

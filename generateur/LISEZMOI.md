# Générateur

Fabrique le site d'une entreprise à partir de son SIREN, de son métier et d'un
dossier de photos.

    node generateur/composer.mjs \
      --siren 480423623 --metier ravalement \
      --images images/ravalement/sources \
      --sortie sites/480423623 \
      --donnees donnees/entreprises-demo/480423623.json

`--publication` refuse de fabriquer si le dossier de photos porte la marque
`SOURCE-ILLUSTRATION` : des images de démonstration ne partent jamais en ligne
au nom d'un artisan.

Environ une minute et demie par site, surtout pour l'encodage des images en
AVIF et WebP à quatre tailles.

## Ce qui n'est jamais inventé

Les faits de l'entreprise viennent de la base Sirene et de nulle part ailleurs.
Ce que la base ne dit pas ressort en clair sur la page. Le téléphone et
l'adresse électronique n'existent dans aucune source publique : la page
affiche un emplacement déclaré vide, elle n'en fabrique pas.

Le reste du texte est une connaissance de métier, écrite une fois dans
`metiers/<métier>.json` : titres, chapôs, gestes, légendes, teintes du
nuancier, descriptions d'images, prix sourcés, réglages de l'estimateur. Le
moteur ne contient aucun mot propre à un métier.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `composer.mjs` | l'assemblage : lit les données, tire la charte, encode les images, écrit la page et son script |
| `charte.mjs` | ce qui rend un site unique : famille de couleurs, sol, polices, géométrie, mot géant, structure, nuancier, comparateur |
| `main-photos.mjs` | distribue à chaque entreprise son propre jeu de photos |
| `graine.mjs` | le tirage déterministe : le même SIREN redonne toujours le même site |
| `textes.mjs` | tire les phrases dans le fichier métier, sans jamais reprendre celles d'un voisin |
| `palette.mjs` | prélève dans les photos la couleur qui nomme « l'après » |
| `couture.mjs` | mesure dans la photo hero où passe la limite avant / après |
| `zone-matiere.mjs` | trouve dans une photo la fenêtre de matière qui remplit le mot géant |
| `sirene.mjs` | met en forme les données Sirene, sans jamais combler un trou |
| `style.mjs` | la feuille de style des archétypes `panneau`, `planche`, `elevation` |
| `archetypes/matiere.mjs` | l'archétype `matiere`, avec sa deuxième page |
| `sections/*.mjs` | les blocs communs aux quatre archétypes : arrivée, ambiance, nuancier, prix, avis, comparateur |
| `metiers/*.json` | un fichier par métier. **Seul `ravalement.json` existe** |
| `banque/plan-images.json` | les 32 images de chacun des seize métiers |
| `registre.json` | les sites déjà fabriqués, pour que leurs voisins ne leur ressemblent pas |
| `polices/` | les quatre polices autorisées (Archivo, Archivo Narrow, Bricolage Grotesque, Public Sans) |

## Comment deux sites restent différents

Le SIREN donne une graine. Le registre donne les **voisins** : les sites du
même métier dans la même commune. Chaque tirage écarte ce que les voisins ont
déjà pris.

| Axe | Valeurs |
|---|---|
| archétype | `matiere`, `panneau`, `planche`, `elevation` |
| famille de couleurs | les sept de `skills/_partage/references/palettes.md` |
| sol | nuit ou papier |
| polices | quatre appariements |
| géométrie | angles vifs, adoucis ou ronds |
| mot géant | le métier, la commune, l'enseigne, ou rien |
| photos | quel hero, quel chantier, quel geste, quelles paires avant / après |
| structure | prix, avis, estimateur et deuxième page présents ou non, ordre des sections |
| nuancier | quatre ou cinq teintes tirées d'un vivier de dix |
| comparateur | forme de la poignée, place des étiquettes, invitation |
| textes | aucune phrase reprise d'un voisin |

`scripts/verifier-unicite.mjs` mesure ensuite la distance entre voisins et
refuse deux sites trop proches.

## Les photos attendues

Dans le dossier passé à `--images`, nommées par rôle :

    hero.jpg  hero-variante-2.jpg
    avant-01.jpg  apres-01.jpg   (et -02, -03)
    chantier.jpg  chantier-2.jpg  chantier-3.jpg
    geste.jpg  geste-2.jpg … geste-5.jpg
    detail-<matière>.jpg

Le minimum pour qu'un métier tourne : un hero, une paire, un chantier, un
geste, un détail. Plus il y a de variantes, plus deux voisins ont de chances
d'avoir des photos différentes.

La photo hero doit montrer une limite verticale nette entre une partie en
travaux et une partie finie : c'est elle que `couture.mjs` mesure.

## Après fabrication

    node scripts/verifier-site.mjs       sites/<siren>
    node scripts/verifier-ordinateur.mjs sites/<siren>
    node scripts/verifier-mobile.mjs     sites/<siren>
    node scripts/verifier-unicite.mjs    sites

Les cinq à zéro, ou ce n'est pas fini. Voir `rules/methode.md`.

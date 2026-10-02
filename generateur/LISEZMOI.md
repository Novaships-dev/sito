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
Ce que la base ne dit pas ressort en clair sur la page.

Deux champs viennent de l'artisan lui-même, par l'app, dans le fichier de
données de l'entreprise :

    "telephone": "04 91 23 45 67"
    "prix": { "affiches": true, "mention": "…",
              "postes": [ { "poste": "Enduit gratté", "bas": 48, "haut": 62,
                            "unite": "€/m²", "note": "…" } ] }

Sans numéro, la page montre un emplacement « Votre numéro ici », jamais un lien
qui ne compose rien. Sans `prix.affiches: true`, il n'y a pas de section prix.
Un numéro faux, ou une case cochée sans tarif complet, arrête la fabrication.

Le reste du texte est une connaissance de métier, écrite une fois dans
`metiers/<métier>.json` : titres, chapôs, gestes, légendes, teintes du
nuancier, descriptions d'images. Le moteur ne contient aucun mot propre à un
métier. Les fourchettes de prix sourcées et les réglages d'estimateur qui y
restent ne montent plus sur les pages depuis le 2 octobre 2026 : l'app peut
s'en servir pour proposer des noms de postes à l'artisan.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `composer.mjs` | l'assemblage : lit les données, tire la charte, encode les images, écrit la page et son script |
| `charte.mjs` | ce qui rend un site unique : famille de couleurs, sol, polices, géométrie, mot géant, structure, nuancier, comparateur |
| `main-photos.mjs` | distribue à chaque entreprise son propre jeu de photos |
| `graine.mjs` | le tirage déterministe : le même SIREN redonne toujours le même site |
| `textes.mjs` | compose les phrases à partir du fichier métier, en prenant les variantes les moins lues chez les voisins |
| `tirage.mjs` | tout ce qui décide de l'apparence d'un site, sans fabriquer d'image ; retire quand un voisin ressemble trop |
| `unicite.mjs` | les règles de ressemblance (U1 à U4), partagées par le tirage, le vérificateur et la mesure |
| `sections/appel.mjs` | le bouton et la barre d'appel, le numéro de l'artisan |
| `palette.mjs` | prélève dans les photos la couleur qui nomme « l'après » |
| `couture.mjs` | mesure dans la photo hero où passe la limite avant / après |
| `zone-matiere.mjs` | trouve dans une photo la fenêtre de matière qui remplit le mot géant |
| `sirene.mjs` | met en forme les données Sirene, sans jamais combler un trou |
| `style.mjs` | la feuille de style des archétypes `panneau`, `planche`, `elevation` |
| `archetypes/matiere.mjs` | l'archétype `matiere`, avec sa deuxième page |
| `sections/*.mjs` | les blocs communs aux quatre archétypes : arrivée, ambiance, nuancier, prix, avis, comparateur |
| `metiers/*.json` | un fichier par métier. **Seul `ravalement.json` existe** |
| `banque/plan-images.json` | les 54 images de chacun des seize métiers |
| `registre.json` | les sites déjà fabriqués, pour que leurs voisins ne leur ressemblent pas |
| `polices/` | les quatre polices autorisées (Archivo, Archivo Narrow, Bricolage Grotesque, Public Sans) |

## Les textes d'un métier

Un emplacement de texte (titre, chapô, état avant, geste…) s'écrit dans
`metiers/<métier>.json` de trois façons, lues par `textes.mjs` :

| Forme | Exemple | Pour |
|---|---|---|
| une liste de phrases | `"titres": ["…", "…"]` | les titres, écrits un par un |
| `{ "combiner": [[…], […]], "joints": [" "] }` | une phrase « comment » + une phrase « pourquoi » | les textes des gestes |
| `{ "etapes": [[…], […]], "nombre": [3, 4], "toujours": [5] }` | une énumération : k étapes dans l'ordre, une formulation par étape | chapô, état avant, état après |

Le but, depuis le 2 octobre 2026 : **100 sites d'un même métier différents
dans un même département** (décision de Fabrice). Chaque emplacement doit donc
offrir au moins une centaine de variantes. Une phrase combinée doit porter son
propre sujet : « Il marque les reprises » recollé derrière n'importe quelle
autre phrase ne désigne plus rien.

## Comment deux sites restent différents

Le SIREN donne une graine. Le registre donne les **voisins** : les sites du
même métier dans le même département, ceux de la même commune comptant cinq
fois plus. Chaque tirage prend ce que les voisins ont le moins pris
(`tirage.mjs`, `graine.mjs`). Famille de couleurs, polices, géométrie et mot
géant se tirent ensemble, comme une combinaison (`charte.mjs`). Si le site
tiré ressemble encore trop à un voisin, le tirage recommence avec une graine
dérivée, jusqu'à douze fois, toujours la même suite : le même SIREN redonne le
même site.

| Axe | Valeurs |
|---|---|
| archétype | `matiere`, `panneau`, `planche`, `elevation` |
| famille de couleurs | les sept de `skills/_partage/references/palettes.md` |
| sol | nuit ou papier |
| polices | quatre appariements |
| géométrie | angles vifs, adoucis ou ronds |
| mot géant | le métier, la commune, l'enseigne, ou rien |
| photos | quel hero, quel chantier, quel geste, quelles paires avant / après |
| structure | avis et deuxième page présents ou non, ordre des sections (les prix dépendent de l'artisan) |
| nuancier | quatre ou cinq teintes tirées d'un vivier de dix |
| comparateur | six poignées, dix invitations, deux places d'étiquettes : 120 formes |
| appel | forme du bouton, libellé, côté du nom dans la barre |
| textes | 110 titres, des milliers d'énumérations, 100 textes par geste |

`scripts/verifier-unicite.mjs` mesure ensuite la distance entre voisins et
refuse deux sites trop proches. Les règles sont dans `unicite.mjs`, partagées
par le tirage, le vérificateur et la mesure de capacité
(`scripts/capacite-unicite.mjs`, avec `--photos plan` pour mesurer les photos
prévues avant de les générer).

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

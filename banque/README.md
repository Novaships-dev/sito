# Banque d'images

Ce dossier contient **la liste** des images, pas les images.

Les images pèsent environ 40 Mo par métier en JPEG (170 Mo en PNG d'origine),
soit plus de 600 Mo pour les seize métiers. Estimation tirée des 32 images du
ravalement (25 Mo en JPEG), portée à 54 images. Fabrice a décidé de ne pas utiliser
Git LFS : elles ne vont donc pas dans Git. Elles vivent dans `images/` à la
racine du dépôt, dossier ignoré par Git, et à terme dans le stockage de la base
de l'app.

## Ce qu'il y a ici

| Fichier | Contenu |
|---|---|
| `liste-images.md` | les 864 images à produire, 54 par métier, avec nom de fichier, cadrage, largeur et sujet. Engendré par `node scripts/liste-images.mjs` depuis `generateur/banque/plan-images.json` |
| `liste-images.csv` | la même liste, à cocher dans un tableur (`node scripts/liste-images.mjs --csv`) |
| `prompts/ravalement.md` | les prompts ChatGPT du ravalement, prêts à coller : les 32 du 15 septembre et les 22 ajoutés le 2 octobre |
| `prompts/couverture.md`, `prompts/peinture.md` | les 32 prompts du premier jeu de chacun des deux métiers de la prospection (24 octobre). Les 22 suivants viendront après |
| `ravalement/provenance.md` | quel original ChatGPT est devenu quel fichier |

La source de vérité est `generateur/banque/plan-images.json` : seize métiers,
leurs codes APE, leur mot géant, leur matière, et le sujet exact de chacune des
54 images. Les dossiers, les cadrages et les largeurs attendus sont dans
`scripts/plan-images.mjs`, lu par `liste-images.mjs` et `verifier-images.mjs` :
une seule table, pour que la liste ne demande pas une image que le contrôle
refuse.

Avant de fabriquer un site d'un métier :

```
node scripts/verifier-images.mjs <metier>     les fichiers de images/<metier>/
node scripts/verifier-images.mjs --prompts    les feuilles de prompts/
```

## Les 54 images d'un métier

Passé de 32 à 54 le 2 octobre 2026, pour que 100 sites d'un même métier dans un
même département ne montrent pas la même façade (décision de Fabrice : « chaque
métier a des images différentes »).

| Rôle | Nombre | Fichiers |
|---|---|---|
| hero | 10 | `hero.jpg`, `hero-variante-2.jpg` à `hero-variante-10.jpg` |
| paires avant / après | 10 paires | `avant-01.jpg` / `apres-01.jpg` à `avant-10.jpg` / `apres-10.jpg` |
| chantier | 3 | `chantier.jpg`, `chantier-2.jpg`, `chantier-3.jpg` |
| geste | 5 | `geste.jpg`, `geste-2.jpg` à `geste-5.jpg` |
| matière | 8 | `detail-<matière>.jpg`, puis `matiere-02.jpg` à `matiere-08.jpg` |
| ambiance | 5 | `ambiance-01.jpg` à `ambiance-05.jpg` |
| signes | 3 | `signe-01.jpg` à `signe-03.jpg` |

## Où les ranger

```
images/<metier>/
  sources/          les fichiers que le générateur lit (39 une fois les 54 faites)
                    + un fichier vide SOURCE-ILLUSTRATION
  banque/matiere/   matiere-02 à 08
  banque/ambiance/  ambiance-01 à 05
  banque/signes/    signe-01 à 03
  originaux/        les PNG de ChatGPT, tels que téléchargés
```

Le générateur reconnaît les fichiers par leur nom
(`generateur/main-photos.mjs`) : un métier s'ouvre sans toucher au moteur, à
condition de respecter ces noms.

**Les couches `banque/` ne sont pas encore lues par le générateur.** Voir
`memoire/maintenant.md`.

## Les règles qui valent pour toutes les images

Reprises de `liste-images.md` : aucun visage, aucun texte lisible,
architecture française et méditerranéenne pour le Sud, lumière de fin de
journée, 1 600 px de large minimum. Les paires avant / après se font en
générant l'après d'abord, puis en modifiant **cette même image** pour obtenir
l'avant.

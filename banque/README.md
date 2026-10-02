# Banque d'images

Ce dossier contient **la liste** des images, pas les images.

Les images pèsent environ 25 Mo par métier en JPEG (100 Mo en PNG d'origine),
soit plus de 400 Mo pour les seize métiers. Fabrice a décidé de ne pas utiliser
Git LFS : elles ne vont donc pas dans Git. Elles vivent dans `images/` à la
racine du dépôt, dossier ignoré par Git, et à terme dans le stockage de la base
de l'app.

## Ce qu'il y a ici

| Fichier | Contenu |
|---|---|
| `liste-images.md` | les 512 images à produire, 32 par métier, avec nom de fichier, cadrage, largeur et sujet. Engendré par `node scripts/liste-images.mjs` depuis `generateur/banque/plan-images.json` |
| `liste-images.csv` | la même liste, à cocher dans un tableur (`node scripts/liste-images.mjs --csv`) |
| `prompts/ravalement.md` | les 32 prompts ChatGPT du ravalement, prêts à coller. **Seul métier fait.** |
| `ravalement/provenance.md` | quel original ChatGPT est devenu quel fichier |

La source de vérité est `generateur/banque/plan-images.json` : seize métiers,
leurs codes APE, leur mot géant, leur matière, et le sujet exact de chacune des
32 images.

## Les 32 images d'un métier

| Rôle | Nombre | Fichiers |
|---|---|---|
| hero | 2 | `hero.jpg`, `hero-variante-2.jpg` |
| paires avant / après | 3 paires | `avant-01.jpg` / `apres-01.jpg`, `-02`, `-03` |
| chantier | 3 | `chantier.jpg`, `chantier-2.jpg`, `chantier-3.jpg` |
| geste | 5 | `geste.jpg`, `geste-2.jpg` à `geste-5.jpg` |
| matière | 8 | `detail-<matière>.jpg`, puis `matiere-02.jpg` à `matiere-08.jpg` |
| ambiance | 5 | `ambiance-01.jpg` à `ambiance-05.jpg` |
| signes | 3 | `signe-01.jpg` à `signe-03.jpg` |

## Où les ranger

```
images/<metier>/
  sources/          les 17 fichiers que le générateur lit aujourd'hui
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

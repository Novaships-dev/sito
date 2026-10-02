# Photos

## Le principe

Sur un site publié, **toute photo présentée comme un chantier de l'artisan doit
être un chantier de l'artisan.** Sans exception. C'est ce qui sépare le produit
d'un site de gabarit, et c'est ce qui se voit le jour où l'artisan regarde une
réalisation qu'il n'a jamais faite.

## Trois statuts, trois traitements

| Statut | D'où elle vient | Autorisée | Comment |
|---|---|---|---|
| **Réelle** | l'artisan | oui | rien de particulier |
| **Exemple** | générée pour la démonstration | oui, sur un site de prospection | marquage obligatoire, voir plus bas |
| **Banque d'images** | Unsplash, Pexels, Google, son site actuel | **jamais** | aucune exception |

Le troisième cas est interdit pour deux raisons distinctes. Les conditions de
l'API Google interdisent la réutilisation. Et les photos de son site actuel lui
appartiennent, ou appartiennent à son prestataire.

## Le site de prospection

Il part sans aucune photo de l'artisan, puisqu'on ne l'a jamais eu au téléphone.
La page doit donc tenir avec des emplacements vides ou des images d'exemple.

**Images d'exemple, générées par corps de métier.** Un jeu par métier, réutilisable
sur tous les sites de prospection de ce métier. Générées, jamais photographiées
ailleurs.

**Marquage obligatoire.** Toute image d'exemple porte :

    <img src="..." alt="Exemple, ..." data-exemple="oui">

Et la section qui la contient dit ce qu'elle est, en clair, à côté de l'image.
Pas en petit dans un pied de page.

**Pourquoi le marquage n'est pas négociable.** Sans lui, on présente à un maçon
un chantier qu'il n'a pas fait, sur une page qui porte son nom, son SIREN et son
adresse. Le jour où il s'en aperçoit, la conversation est finie. Marquée comme
exemple, la même image devient un argument : voilà à quoi ressemblera votre page.

## Ce qu'on retire d'une image d'exemple, et ce qu'on laisse

**On retire les plaques d'immatriculation.** Une plaque est un identifiant
national unique. Une plaque inventée par un générateur d'images peut tomber sur
celle d'un véhicule réel, et on l'affiche alors sur une page qui porte le nom et
l'adresse d'une entreprise. Le risque est petit, la réparation est nulle : on
recadre, ou on retire.

**On laisse les numéros de rue.** Un numéro seul n'identifie rien : il n'y a pas
un 12 en France, il y en a des centaines de milliers. Le retirer coûte deux
choses. La retouche se voit presque toujours, et une façade dont le numéro a été
effacé se lit comme une photo trafiquée, ce qui abîme exactement la crédibilité
qu'on cherchait à protéger.

**En pratique, recadrer avant de retoucher.** Une retouche ratée laisse une
trace visible, un recadrage n'en laisse aucune. Si l'élément gênant est au bord
du cadre, on coupe.

## L'emplacement vide

Un emplacement déclaré vide est une option valable, et parfois la meilleure. Il
se déclare, il ne se subit pas : la zone dit qu'elle attend les photos, elle
n'est pas un trou dans la mise en page.

## Vérification

`scripts/verifier-site.mjs` impose :

- aucune adresse de banque d'images, jamais
- toute image sans `alt` est un constat bloquant
- toute image marquée `data-exemple` doit avoir un `alt` qui commence par
  « Exemple »

# Palettes

## La famille bannie

Sur un brief artisan, luxe, artisanat ou patrimoine, le défaut du modèle est
beige chaud plus laiton plus espresso. Deux sources indépendantes, dont une
de première partie, la nomment comme la signature la plus répandue.

Valeurs à éviter :

- fonds : #f5f1ea, #f7f5f1, #fbf8f1, #efeae0, #ece6db, #faf7f1, #e8dfcb, #F4F1EA
- accents : #b08947, #b6553a, #9a2436, #9c6e2a, #bc7c3a, #7d5621, #D97757
- textes : #1a1714, #1a1814, #1b1814

Note : #D97757 est l'accent d'interaction du modèle lui-même. C'est
littéralement la couleur qu'il a sous les yeux en permanence.

## Les sept familles de rotation

1. luxe froid : gris argent, chrome, fumée
2. forêt : vert profond, os, ambre
3. noir et fauve : noir cassé, fauve chaud, contraste net, aucun beige
4. cobalt et crème : bleu saturé contre un seul neutre, aucun laiton
5. terre cuite et ardoise : rouille chaude contre gris froid
6. olive, brique, papier : olive sourd plus accent brique
7. monochrome plus un accent saturé : blanc cassé, noir cassé, une couleur vive

Règle de rotation : si le projet précédent utilisait une famille, celui-ci
en utilise une autre. Jamais deux fois de suite.

## Palette Sitô, retenue

Bleu de travail, ardoise, papier froid. Ancrée dans le sujet : le bleu du
vêtement de travail et des bâches, le gris des toits. Hors des cinq familles
de défaut.

    --bleu       #0E4C7C
    --bleu-fonce #0A3A5E
    --ardoise    #1B2A33
    --gris       #4A5A64
    --papier     #F2F4F5
    --craie      #E2E7E9

Contrastes vérifiés : bleu sur papier 8:1, ardoise sur papier 13:1,
blanc sur bleu 8:1, gris sur papier 5,2:1.

## Architecture en trois couches

    primitif    --gris-800: #2A2A28          la valeur brute
    sémantique  --texte-principal: var(...)   l'intention
    composant   --carte-texte: var(...)       l'usage

Un client change sa couleur d'accent : on modifie une valeur primitive et
tout suit. Sans les trois couches, il faut retoucher chaque composant.

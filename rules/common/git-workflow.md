# Git

## Commits

Un commit fait une chose. Viser une centaine de lignes modifiées, pas mille.
Le message dit ce qui change et pourquoi, en français, à l'impératif.

Le commit est un point de sauvegarde : committer dès qu'un état fonctionne,
avant d'essayer la chose suivante.

## Branches

Travail sur tronc. Une branche courte par sujet, fusionnée vite. Pas de
branche qui vit plus d'une semaine.

## Interdits

- un `console.log` dans un commit
- un fichier `.env` dans l'historique
- une image binaire sans Git LFS configuré au préalable
- un `git push --force` sur la branche principale

## Avant un push

Relire le diff. Le hook ouvre l'éditeur pour ça.

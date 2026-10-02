# Accessibilité

Cible : WCAG 2.2 niveau AA. La 2.2 inclut la 2.1.

Score Lighthouse accessibilité : 100. C'est la seule catégorie qui ne tolère
aucun écart.

## Planchers non négociables

- contraste 4,5:1 pour le corps de texte, 3:1 pour le grand texte
- cible tactile de 44 par 44 pixels minimum, 8 pixels d'écart
- anneau de focus toujours visible, jamais supprimé
- `prefers-reduced-motion` respecté pour tout mouvement
- navigation clavier complète, ordre de tabulation logique
- texte alternatif sur chaque image porteuse de sens, vide sur les décoratives
- jamais de `h-screen`, toujours `min-height: 100dvh`
- zoom non désactivé
- niveaux de titre jamais sautés

## Formulaires

Libellé visible, jamais dans le champ seul. Message d'erreur près du champ
concerné, pas regroupé en haut. Texte d'aide avant l'erreur, pas après.

## Ce qui ne porte jamais le sens seul

La couleur. Toujours doubler par un libellé, une forme ou une position.

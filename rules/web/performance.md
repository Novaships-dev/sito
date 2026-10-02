# Performance

## Core Web Vitals

| Métrique | Bon | À améliorer | Mauvais |
|---|---|---|---|
| LCP | 2,5 s ou moins | 2,5 à 4,0 s | plus de 4,0 s |
| INP | 200 ms ou moins | 200 à 500 ms | plus de 500 ms |
| CLS | 0,1 ou moins | 0,1 à 0,25 | plus de 0,25 |

## Budget

| Ressource | Budget |
|---|---|
| poids total de la page | moins de 1,5 Mo |
| JavaScript | moins de 300 Ko compressé |
| CSS | moins de 100 Ko compressé |
| images au-dessus de la ligne de flottaison | moins de 500 Ko au total |
| polices | moins de 100 Ko |
| tiers | moins de 200 Ko |

## Cibles Lighthouse

Performance 90 ou plus. Accessibilité 100. Bonnes pratiques 95 ou plus.
SEO 95 ou plus.

## Images

AVIF en premier, WebP en repli. `srcset` calibré sur les points de rupture
réels, jamais une image de 2400 pixels servie au téléphone. Une seule image
en chargement prioritaire, tout le reste en différé. Dimensions déclarées
pour réserver l'espace.

## Animation

Uniquement `transform` et `opacity`. Jamais `width`, `height`, `top`, `left`.

## Mesure

Une trace unique est une observation de laboratoire, pas une donnée
d'utilisateur réel. Quand aucune page ne peut être exécutée, étiqueter les
constats comme des hypothèses.

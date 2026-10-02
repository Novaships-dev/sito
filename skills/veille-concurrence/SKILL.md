---
name: veille-concurrence
description: Tient a jour la carte des concurrents sur un marche et repond a la question de savoir ce que personne ne fait. Utilise ce skill des que l'utilisateur cite un concurrent, demande qui fait deja ca, comment se positionner, ce qui differencie son produit, ou veut comparer des offres et des prix, meme s'il ne dit jamais le mot concurrence. Utilise-le aussi avant toute decision de prix ou de perimetre.
---

# Veille concurrentielle

## Le principe

Une veille sert a deux choses, et deux seulement :

1. **Trouver le trou.** Ce que personne ne fait, et pourquoi.
2. **Estimer la fenetre.** Combien de temps avant que quelqu'un le fasse.

Tout le reste est de la collection de captures d'ecran.

## La carte

Une ligne par acteur, une colonne par capacite. Les capacites sont celles du produit,
pas celles que les concurrents mettent en avant.

Gabarit, a adapter au marche :

```
| Acteur | <capacite 1> | <capacite 2> | ... | Prix |
```

**Ton produit occupe la premiere ligne.** Sinon la lecture est fausse : on compare des
concurrents entre eux au lieu de les comparer a soi.

Exemple tenu sur le marche des sites d'artisans, au 6 septembre 2026 :

| | App terrain | Site domaine propre | Page par chantier redigee | SEO structure | Prix |
|---|---|---|---|---|---|
| Ce produit | oui | oui | oui | complet | 79 EUR |
| TrustUp Pro | oui | oui, fait par eux | non | partiel | Starter gratuit, paliers payants |
| Letmo | oui | non, sous-domaine | non, galeries | non | 15,99 EUR / 2 membres |
| Quickio | non | oui | non | a la creation | 14,90 EUR |
| Simplebo | non | oui | non | oui | des 25 EUR + frais |
| Solocal / Local.fr | non | oui | non | oui | 100 a 250 EUR, engagement long |

## Trouver le trou

La question n'est pas quelle case est vide. C'est **quelle chaine complete personne ne
tient**.

Sur cet exemple : la chaine photo de chantier vers analyse vers page publiee vers
referencement. Letmo a les photos sans le referencement. Quickio a le site sans les
chantiers. TrustUp a la base sans le moteur. Les agences ont la competence sans le
produit.

Chacun tient un maillon. Personne ne tient la chaine.

## Estimer la fenetre

Le concurrent dangereux n'est pas le mieux place. C'est celui qui a deja **la donnee**
et a qui il ne manque qu'un moteur.

Pour chaque acteur, deux questions :

1. **Qu'a-t-il deja** que tu mettras des mois a construire ? Une base de clients, une
   donnee metier, une marque installee.
2. **Qu'est-ce qui le ralentit ?** Le frein le plus solide est economique, pas technique.
   Un acteur dont le site est une prestation humaine facturee ne peut pas la transformer
   en moteur self-service sans tuer une ligne de revenu.

La fenetre est la duree de ce frein, pas la duree du developpement.

## Rythme

Une veille qui se fait quand on y pense ne se fait pas. Deux moments fixes :

- **A chaque decision de prix ou de perimetre.** Sans exception.
- **Une fois par trimestre**, sur la carte entiere.

Chaque entree est **datee**. Un tableau de prix sans date est un piege : les prix bougent
et personne ne saura si la ligne date de trois mois ou de deux ans.

## Gabarit de sortie

```
VEILLE <marche>   <date du releve>

CARTE
<le tableau>

LE TROU
- chaine complete que personne ne tient : <laquelle>
- qui tient quel maillon : <acteur> = <maillon>

MENACES, par ordre
- <acteur> : a deja <quoi>, freine par <quoi>, fenetre estimee <duree>

CE QUI A BOUGE DEPUIS LE DERNIER RELEVE
- <changement de prix, de perimetre, levee de fonds, fermeture>

CE QUI N'EST PAS UN FOSSE
- <ce qu'on croyait differenciant et qui ne l'est pas>
```

La derniere section est la plus utile et la plus desagreable a ecrire.

## Regles

- **Date chaque chiffre.** Un prix sans date ne sert a rien.
- **Cite la source.** Page tarifs, capture, article. Un chiffre non source ne rentre pas
  dans la carte.
- **N'estime pas un chiffre d'affaires** ni un nombre de clients sans source publique.
  L'invention d'un ordre de grandeur contamine toutes les decisions qui suivent.
- **Ne conclus pas a la place de qui lit.** Rends la carte, le trou, la fenetre. La
  decision suit.

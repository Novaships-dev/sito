---
name: audit-design
description: Audite une interface deja construite et rend un constat chiffre des signatures de design generique qu'elle porte. Utilise ce skill des que l'utilisateur montre une page, une maquette, un theme ou un ecran et demande un avis, dit que quelque chose sonne faux, generique ou fait IA, ou avant de livrer quoi que ce soit de visuel, meme s'il ne prononce jamais le mot audit. Ce skill audite, il ne construit pas.
---

# Audit de design

## Ce que ce skill fait, et ce qu'il ne fait pas

Il **audite**. Il ne construit pas, il ne refond pas, il ne propose pas de maquette.
Auditer et construire sont deux skills separes, volontairement : celui qui a produit une
page est le plus mauvais juge de sa banalite.

L'entree est une page, un theme, une maquette ou une capture. La sortie est un constat
chiffre, avec des numeros de signature verifiables.

## La reference

Le catalogue vit dans `references/tells-design.md` : 53 signatures numerotees, cinq
familles esthetiques, et le test d'unicite. **Ne juge jamais de memoire.** Ouvre le
catalogue et cite les numeros.

Deux fichiers l'accompagnent : `references/molettes.md` pour les niveaux de variance,
mouvement et densite attendus, et `references/palettes.md` pour les familles de couleurs
bannies.

## Procedure, trois passes

### Passe 1, le grep

Les signatures qui se cherchent automatiquement se cherchent automatiquement. Le
catalogue donne la colonne Verification. Lance-la avant de regarder quoi que ce soit.

Un constat trouve au grep ne se discute pas. Il est present ou absent.

### Passe 2, les cinq familles

Regarde la page entiere et demande-toi si elle appartient a F1, F2, F3, F4 ou F5.

**F5, l'habillage de gabarit, est celle qui passe le plus souvent.** Elle se reconnait a
son assemblage, pas a un element isole : capitales espacees au-dessus des titres,
metadonnees jointes par des points medians, noir teinte au lieu du noir, chasse fixe pour
les petites etiquettes, fleche ajoutee aux liens.

Une famille identifiee n'est un defaut que si le brief ne la demandait pas. **Quand le
brief demande explicitement une de ces esthetiques, le brief l'emporte.** Note-le.

### Passe 3, le test d'unicite

La question, et elle seule :

> Si le meme brief etait reformule, arriverait-on quelque part de similaire ?

Si oui, la page est un defaut generique et pas un choix. C'est le constat le plus grave
que ce skill puisse rendre, et il ne se prouve pas au grep. Il s'argumente.

## Gabarit de sortie

Utilise toujours ce modele.

```
AUDIT <nom de la page>   <date>

VERDICT   <passe | a revoir | generique>

BLOQUANTS (n)
- #<num> <signature>  ->  <ou, ligne ou zone>  ->  <remede du catalogue>

FAMILLE
- <F1 a F5 ou aucune>  <demandee par le brief : oui / non>

TEST D'UNICITE
- <ce qui distingue cette page d'une page generique sur le meme sujet>
- <ce qui ne la distingue pas>

MOLETTES relevees
- variance <n>  mouvement <n>  densite <n>   attendu : <la ligne de base du projet>

CE QUI TIENT
- <ce qui est bon, et pourquoi>
```

La derniere section n'est pas de la politesse. Ce qui tient doit etre nomme, sinon la
correction le casse.

## Regles de jugement

- **Un constat sans numero de catalogue n'est pas un constat.** Si tu vois un probleme
  qui n'a pas de numero, propose son entree au catalogue plutot que de le signaler seul.
- **Les numeros 23, 25 et 40 sont des regles de produit.** Temoignages inventes, absence
  de demonstration reelle, nombres non sources. Ils ne se negocient pas au nom d'une
  intention esthetique.
- **Ne recommande pas une refonte complete.** Rends la liste des constats. La decision de
  refondre appartient a qui lit.
- **Ce skill s'evalue a l'oeil, pas au test automatique.** Sa sortie est un jugement.
  N'invente pas d'assertions chiffrees sur ce qui demande un regard humain.

## Ce que l'audit ne couvre pas

L'accessibilite et la performance ont leurs propres regles, dans `rules/web/`. Cet audit
ne les remplace pas et ne doit pas les evoquer a moitie.

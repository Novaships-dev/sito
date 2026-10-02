---
name: redaction-fr
description: Ecrit et corrige les textes francais destines a etre publies, en supprimant les signatures qui font sonner un texte comme genere. Utilise ce skill des que tu ecris ou relis du contenu francais destine a un site, une fiche produit, une page de chantier, un e-mail de prospection ou une description de boutique, meme si l'utilisateur ne parle jamais de style ni de relecture. Utilise-le aussi quand un texte francais existant doit etre raccourci, reformule ou verifie avant publication.
---

# Redaction francaise, contenu publie

## Quand ce skill sert, et quand il ne sert pas

Il sert pour du **contenu publie** : pages de site, fiches produit, descriptions
Shopify, pages de chantier, messages de prospection, textes d'interface.

Il ne sert pas pour la documentation interne, les journaux, les messages de commit.
Le verificateur exclut deja `docs/`, `rules/` et `references/` pour cette raison.

## Le principe

Un texte sonne genere pour trois raisons, dans cet ordre d'importance :

1. **Il ne dit aucun fait.** C'est la cause premiere. « Un travail soigne » ne dit rien.
   « Enduit gratte, 180 m2, quatre jours » dit tout.
2. **Il porte des tournures mortes.** Le lexique de l'artisanat francais en ligne est
   sature de formules que personne ne lit plus.
3. **Il porte des signatures de ponctuation.** Le tiret cadratin et le point median en
   separateur sont les deux plus reconnaissables.

Corriger le 2 et le 3 sans corriger le 1 donne un texte propre et vide. **Commence
toujours par le fait.**

## Procedure

1. **Cherche le fait.** Pour chaque phrase sans donnee verifiable, soit tu trouves la
   donnee, soit tu supprimes la phrase. Ne remplace jamais une formule creuse par une
   autre formule creuse.
2. **Passe le lexique mort.** La liste vit dans `references/tells-texte-fr.md`.
3. **Passe la ponctuation.** Jamais de tiret cadratin. Jamais de point median en
   separateur. Ces deux interdictions sont binaires.
4. **Lance le verificateur** avant de rendre le texte :

   ```
   node scripts/verifier-textes.mjs <chemin>
   ```

   Sortie 1 : une signature bloquante subsiste. Sortie 0 : le texte passe.
5. **Relis a froid.** Le brouillon d'abord, l'amelioration ensuite, jamais dans le meme
   mouvement.

## Les six regles du verificateur

| Code | Gravite | Ce qui est cherche | Remede |
|---|---|---|---|
| FR01 | bloquant | tiret cadratin | trait d'union, ou reformuler |
| FR02 | bloquant | point median entoure d'espaces | virgule |
| FR03 | avertissement | lexique mort | remplacer par un fait |
| FR04 | avertissement | « ce n'est pas X, c'est Y » | phrase declarative | <!-- verif-ignore -->
| FR05 | avertissement | fleche dans un lien ou un bouton | retirer la fleche |
| FR06 | avertissement | « devis gratuit et sans engagement » | dire ce que couvre le devis | <!-- verif-ignore -->

Un avertissement ne bloque pas, mais il se corrige. Un avertissement laisse tel quel
revient toujours.

## Faux positif

Un cas legitime existe : une citation, un nom propre, un extrait de source. Ajoute
`verif-ignore` en commentaire sur la ligne concernee. Jamais sur un fichier entier.

## Exemples

**Avant**

> Fort de notre savoir-faire, nous realisons vos travaux dans les regles de l'art. <!-- verif-ignore -->
> Notre equipe dynamique est a votre ecoute pour un devis gratuit et sans engagement. <!-- verif-ignore -->

Trois formules mortes, zero fait, une promesse creuse.

**Apres**

> Ravalement de facade, enduit gratte sur 180 m2, quatre jours de chantier.
> Le devis chiffre la surface, l'echafaudage et la reprise des fissures.

**Avant**

> Nos prestations sur-mesure ne sont pas de simples travaux, ce sont des projets. <!-- verif-ignore -->

Lexique mort, plus la tournure « ce n'est pas X, c'est Y ». <!-- verif-ignore -->

**Apres**

> Chaque chantier part d'un releve sur place. Le devis suit le releve, pas l'inverse.

## Gabarit de sortie

Quand tu corriges un texte existant, rends toujours ce format :

```
TEXTE CORRIGE
<le texte>

CE QUI A CHANGE
- <regle touchee> : <ce qui a ete retire> devient <ce qui le remplace>, parce que <raison>

FAITS MANQUANTS
- <ce qu'il faut demander a l'artisan pour completer>
```

La troisieme section est la plus utile. Elle transforme une relecture en question
concrete a poser.

---
name: prospection-sirene
description: Extrait, qualifie et suit des entreprises depuis les bases publiques francaises pour une campagne de prospection B2B, en respectant le cadre legal de la sollicitation. Utilise ce skill des que l'utilisateur veut trouver des entreprises par metier et par departement, parle de liste de prospects, de SIREN, de code APE, de base RGE, de campagne de contact ou de demarchage, meme s'il ne nomme jamais Sirene. Utilise-le aussi pour qualifier une liste existante ou preparer un envoi par lots.
---

# Prospection depuis les bases publiques

## Ce que ce skill est

Un outil **interne**. Ce n'est pas un module livre a un client. Il produit une liste
qualifiee et un plan de contact, pas un envoi.

## Etape 1, extraire

Source : l'API entreprises publique `recherche-entreprises.api.gouv.fr`, sans
authentification.

Filtrage par **code APE** du metier vise et par **departement**.

Trois pieges, tous documentes, tous couteux :

- **`etat_administratif=A` est obligatoire.** Sans ce parametre, une majorite
  d'entreprises cessees remonte dans les resultats.
- **L'API ignore silencieusement les parametres inconnus.** Une faute de frappe dans un
  nom de parametre ne produit aucune erreur, juste un filtre absent. Verifie toujours que
  le nombre de resultats bouge quand tu ajoutes un filtre.
- **`total_results` plafonne a 10 000.** C'est un plancher, pas un decompte. Ne le
  presente jamais comme un nombre d'entreprises.

## Etape 2, qualifier

Filtres de selection :

| Critere | Valeur retenue |
|---|---|
| Anciennete | plus de 2 ans |
| Effectif | 0 a 10 |
| Certification RGE | croisee avec la base publique, priorite aux certifies |

Les RGE passent devant. Ce sont ceux qui investissent, et le badge est exploitable
immediatement.

Puis, pour chaque entreprise, deux questions : a-t-elle un site, a-t-elle une fiche
Google active.

| Cas | Valeur | Action |
|---|---|---|
| Pas de site, fiche Google active | la meilleure | prioritaire. Visible, perd des demandes, rien a resilier |
| Site ancien ou casse | bonne | verifier chez quel prestataire |
| Site recent chez Simplebo, Solocal, Local.fr | faible | ecarter, sous contrat long |

## Etape 3, le cadre legal, avant tout envoi

Cette etape ne se saute pas et ne s'optimise pas.

- **Adresse professionnelle** : regime d'opposition. Desinscription en un clic dans le
  message, information article 14 du RGPD des le premier contact.
- **Adresse personnelle** (gmail, orange.fr, hotmail) : le consentement est exige meme en
  B2B. Ces adresses ne recoivent pas d'e-mail. Elles passent au telephone, ou nulle part.
- **Telephone** : le demarchage B2B reste autorise.
- **Jamais d'appel a froid** sans avoir envoye quelque chose d'abord.

Les photos ne se prennent nulle part : ni sur Google, dont les conditions l'interdisent,
ni sur le site actuel de l'entreprise, dont les images lui appartiennent.

## Etape 4, envoyer par lots

**Par lots de 50, jamais 400 d'un coup.** Deux raisons : on n'absorbe pas 400 reponses,
et le message doit s'ajuster sur les premiers retours.

## Etape 5, mesurer l'ouverture

C'est le point decisif, et celui qu'on oublie.

Il faut savoir **qui a ouvert et combien de temps il est reste**. Celui qui a regarde
trois minutes se rappelle le lendemain. Les signatures se font la, pas dans le volume.

Signaux a tracer : ouverture du lien, duree, pages vues, retour une seconde fois, clic
sur le bouton de contact.

## Etape 6, suivre

Une table, ces colonnes, pas moins :

```
entreprise | SIREN | metier | commune | qualification | date_envoi
| ouverture | date_contact | reponse | relance_prevue | statut
```

Sans elle, on rappelle les memes et on en oublie la moitie.

## Ordre d'execution

1. Un metier, un departement. Jamais deux a la fois.
2. Extraction et qualification.
3. Generation du lot complet.
4. Envoi par vagues de 50.
5. Relance a 48 heures, **sur les seuls ouvreurs**.
6. Metier suivant, meme departement, avant de changer de departement.

## Gabarit de sortie

```
CAMPAGNE <metier> <departement>   <date>

EXTRACTION
- code APE utilise : <code>
- filtres : etat_administratif=A, anciennete>2ans, effectif 0-10
- brut : <n> resultats   (rappel : plafond API a 10 000)

QUALIFICATION
- prioritaires (pas de site, fiche active) : <n>
- bonnes (site ancien ou casse) : <n>
- ecartees (contrat long) : <n>

CANAL
- e-mail professionnel : <n>
- telephone seul (adresse personnelle) : <n>

LOTS
- vague 1 : <n>   vague 2 : <n>   ...

A VERIFIER AVANT ENVOI
- <ce qui n'a pas pu etre confirme>
```

## Ce que ce skill ne fait pas

Il n'envoie rien. Il ne redige pas le message de contact. Il ne decide pas d'appeler.
Ces trois actes appartiennent a une personne.

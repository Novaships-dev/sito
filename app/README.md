# L'app de l'artisan

**État au 2 octobre 2026 : rien n'est construit.** Ce dossier recevra le code de
l'app. Ce fichier dit ce qu'elle doit faire, d'où vient chaque exigence, et ce
qui reste à décider.

---

## Ce que Fabrice a décidé

Le 23 septembre 2026, mot pour mot :

> « L'app permet à l'artisan de voir les stats de son site, ses commentaires
> Google et sa fiche pro Google, ainsi que d'ajouter des images avant/après de
> ses chantiers pour enrichir le site. L'app sert à son référencement. »

> « C'est une application, le site s'adapte aux images ajoutées, c'est fait
> exprès pour ça. »

Et le 15 septembre, sur les photos : le site de démonstration est présenté à
l'artisan avec des images générées ; **s'il s'abonne, il met les siennes.**

## Les quatre fonctions

| # | Fonction | Ce que voit l'artisan |
|---|---|---|
| 1 | **Statistiques du site** | visites, appels reçus, demandes, d'où viennent les visiteurs, quelles pages rapportent |
| 2 | **Avis Google** | ses avis, avec une réponse préparée pour chacun |
| 3 | **Fiche Google** | l'état de sa fiche d'établissement, ce qui manque, ce qui contredit son site |
| 4 | **Ajouter ses avant / après** | il envoie les photos d'un chantier, le site s'enrichit tout seul |

La quatrième est celle qui fait le produit : c'est elle qui remplace les images
de démonstration par les siennes, et qui fait grossir le site chantier après
chantier.

## Ce que le cahier des charges détaille déjà

`docs/cahier-des-charges.md` a été **rédigé par Claude et non validé par
Fabrice**. Il ne fait pas foi. Mais plusieurs sections couvrent exactement ces
quatre fonctions et peuvent servir de matière :

| Fonction | Sections utiles |
|---|---|
| Statistiques | 5.13 (tableau de bord : appels et demandes en haut, pas les visites), 7.8, mesure d'audience sans cookie |
| Avis Google | 7.5 (demander, répondre, afficher), 24bis.5 (avis rattaché à la page du chantier) |
| Fiche Google | 5.14, 7.4 (cohérence site / fiche : mêmes nom, adresse, téléphone, prestations) |
| Avant / après | 5.2 à 5.10 (envoi, tri automatique, alignement des paires, analyse par un modèle de vision, page générée, publication) |

Ce que le cahier des charges dit et que Fabrice a **contredit depuis** :

- « Jamais de photo de banque d'images » : Fabrice a décidé de faire générer
  des images par métier pour présenter les sites, remplacées par celles de
  l'artisan quand il s'abonne.
- Le test terrain de trois semaines avant de coder : rejeté.
- Vingt gabarits et vingt palettes dessinés à la main : le générateur fait
  autrement, avec quatre archétypes et une charte tirée du SIREN.

## La contrainte à lancer tout de suite

**L'API Google Business Profile** (avis et fiche) est **soumise à approbation
par Google**. D'après le cahier des charges, section 11 : demande validée à la
main, fiche vérifiée et active depuis plus de 60 jours, site professionnel
valide exigé, refus fréquents, quotas de départ faibles. Ces conditions sont à
revérifier sur la documentation de Google au moment de la demande.

Conséquence : sans cet accès, l'app peut afficher les avis et ouvrir la fiche
pour que l'artisan réponde lui-même, mais pas répondre à sa place. La demande
d'accès est la seule chose de l'app qui dépend d'un tiers et d'un délai : elle
se lance avant d'écrire le code, pas après.

## Comment le site s'adapte aux photos ajoutées

Choix d'ingénierie de Claude, à exposer à Fabrice, pas encore construit.

1. L'artisan envoie ses photos depuis l'app. Elles vont dans le stockage de la
   base, marquées **photos de l'entreprise** et non plus **illustration**.
2. Le générateur refabrique le site avec ces photos. Il ne retire jamais au
   hasard la charte de l'artisan : couleurs, polices, archétype et structure
   sont **figés à la création** et conservés dans la base. Un site qui change
   de couleur parce qu'une photo a été ajoutée, c'est un produit qui détruit
   le travail de ses clients.
3. Les cinq vérificateurs tournent sur le site refabriqué. S'il en reste un
   bloquant, rien n'est publié et l'ancien site reste en ligne.
4. Le site est republié.

Le site reste un site statique : rapide, bien référencé, et vérifié avant
chaque mise en ligne. C'est ce que le générateur sait déjà faire ; il manque
le déclenchement depuis l'app et la mise en ligne.

## La base, proposition

À confirmer par Fabrice avant création (voir `memoire/maintenant.md`).

| Table | Ce qu'elle garde |
|---|---|
| `entreprises` | SIREN, données Sirene, téléphone, courriel, horaires (ce que Sirene ne donne pas) |
| `sites` | l'entreprise, le métier, l'archétype, **la charte figée**, la main de photos, la structure, l'adresse en ligne. Remplace `generateur/registre.json` et sert au contrôle d'unicité |
| `photos` | le site, le rôle (hero, avant, après, geste…), le chantier, l'origine (`illustration` ou `entreprise`), le chemin dans le stockage |
| `chantiers` | le site, la commune, la date, les paires avant / après, le texte de la page |
| `avis` | les avis Google rattachés, et le chantier concerné s'il y en a un |
| `statistiques` | visites, appels, demandes, par jour et par page |

Les images de la banque (480 à venir, plus les 32 du ravalement) vont dans le
**stockage** de la base, pas dans Git.

## Ce qui est déjà prêt côté site

Le générateur et ses cinq vérificateurs, dans ce dépôt. Les sections avis
(`generateur/sections/avis.mjs`) et prix existent sur les quatre archétypes ;
la section avis affiche aujourd'hui des emplacements vides et honnêtes, que
l'app remplira avec les vrais avis Google.

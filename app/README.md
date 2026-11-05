# L'app de l'artisan

**Le plan complet de construction est dans `app/PLAN-APP.md`.**

**État au 9 octobre 2026 : l'app existe et marche en démonstration.** Elle
n'a pas encore tourné contre la vraie base (voir « Ce qui n'est pas prouvé »).

## Lancer l'app

- Sur l'ordinateur de Fabrice : `lanceurs\APP.bat` (installe, puis ouvre l'app
  sur http://localhost:5173). Avec `app/.env.local`, elle parle à la vraie base ;
  sans, ou avec `?demo` dans l'adresse, elle tourne en démonstration (compte artisan@exemple.fr, mot de passe chantier13 ; voir `src/donnees/demo.ts`).
- `app/.env.local` n'est jamais dans le dépôt (`.env.*` est ignoré). Il ne
  contient que l'adresse du projet et la clé **publique** ; modèle :
  `app/.env.example`. La clé de service n'y va jamais.
- Essai : `cd app && npm run build`, puis `node scripts/essai-app.mjs` à la
  racine (et `--contre-essai`).

## Ce qui est construit

| Fichier | Rôle |
|---|---|
| `src/types.ts` | les données, telles que la base les décrit, et l'interface `Donnees` |
| `src/donnees/supabase.ts` | la vraie base : connexion par e-mail et mot de passe (compte créé par Fabrice), envoi reprenable (TUS, 6 Mo) |
| `src/donnees/demo.ts` | la démonstration, en mémoire ; garde les fichiers « envoyés » pour l'essai |
| `src/photo.ts` | préparation sur l'appareil : redressée, 3 200 px au plus, JPEG sans métadonnées ; RAW, DNG et HEIC illisibles partent tels quels ; vidéos à part ; PDF refusé |
| `src/attente.ts` | file d'envoi gardée dans l'appareil (IndexedDB) jusqu'à la fin de l'envoi |
| `src/ecrans/` | Connexion, Accueil, Chantiers, Mon site, Mon adresse, Avis, Fiche Google, Abonnement, Compte, Installer |

Pas d'app sur le Play Store (décision du 5 nov. 2026) : l'app s'installe
sur l'écran d'accueil depuis le site Sitô, sur iPhone comme sur Android.

## Ce qui n'est pas prouvé

- La connexion, les droits et l'envoi contre la vraie base Supabase : le poste
  de travail de Claude n'y a pas accès. À essayer sur l'ordinateur de Fabrice.
- De vraies photos d'iPhone et d'Android : HEIC et DNG de l'essai sont fabriqués.
- Le HEIC dans Safari : l'essai tourne dans Chromium, qui ne lit pas le HEIC.

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

## La base

Créée le 2 octobre 2026, Supabase confirmé par Fabrice. Tables, droits,
stockage et essais : `supabase/README.md`.

Ce que l'artisan règle lui-même dans l'app, décidé par Fabrice le 2 octobre :

- **son numéro de téléphone** (`profils.telephone`) : sans lui, le site montre
  un emplacement, pas un faux bouton ;
- **afficher ses prix ou non** (`profils.prix_affiches`), puis **ses tarifs**
  (`tarifs`) : sans la case cochée, pas de section prix. Avec au moins un tarif
  au m², la page ajoute un estimateur qui calcule sur ses seuls tarifs ;
- **ses photos avant / après** (`chantiers`, `photos`) : les images de la banque
  restent marquées « Exemple » jusqu'à ce qu'il mette les siennes.

Les fourchettes de prix du marché qui restent dans le fichier métier peuvent
servir à lui proposer des noms de postes ; elles ne montent plus sur son site.

Les images de la banque (480 à venir, plus les 32 du ravalement) vont dans
l'espace de stockage `banque`, pas dans Git.

## Ce qui est déjà prêt côté site

Le générateur et ses cinq vérificateurs, dans ce dépôt. Les sections avis
(`generateur/sections/avis.mjs`), tarifs (`generateur/sections/prix.mjs`) et
appel (`generateur/sections/appel.mjs`) existent sur les quatre archétypes ;
la section avis affiche aujourd'hui des emplacements vides et honnêtes, que
l'app remplira avec les vrais avis Google.

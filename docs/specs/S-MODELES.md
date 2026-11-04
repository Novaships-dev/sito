# Spécification : les modèles de prospection

Écrit par Claude (Cowork) le 4 novembre 2026, d'après la décision de Fabrice
du même jour (`memoire/decisions.md`, « Modèles de prospection »). Ce document
cite la décision ; il n'en est pas une.

## 1. Le changement

| | Jusqu'au 4 nov. | Avec les modèles |
|---|---|---|
| Site de prospection | un site différent par artisan appelé (unicité sur tous les sites) | un des **10 modèles libres du métier**, rempli avec l'entreprise appelée (nom, commune, SIREN, numéro, métier) |
| Unicité | entre tous les sites, acceptés ou non | entre les **sites acceptés** seulement : « 100 site différent mais valider » |
| Artisan qui accepte | (pas de règle) | **garde le site qu'il a vu** ; le modèle devient le sien et sort de la rotation ; un nouveau modèle, différent de tous ceux déjà pris, le remplace |
| Photos de l'artisan | par l'app (pas encore en ligne) | par mail ou WhatsApp à Fabrice, déposées pour Claude, qui refait le site avec elles (même modèle), puis le peaufine |

## 2. Les règles

| N° | Règle |
|---|---|
| MO1 | Chaque métier prêt a **10 modèles libres** à tout moment |
| MO2 | Un modèle = une apparence complète figée : archétype, charte (couleurs, polices, géométrie, mot géant, structure, nuancier, comparateur) et graine des textes et des photos. Deux sites du même modèle ne diffèrent que par les données de l'entreprise |
| MO3 | Les modèles d'un métier sont différents entre eux (règles d'unicité U1 à U4 de `generateur/unicite.mjs`), et différents de tout modèle déjà pris |
| MO4 | Le lot du jour répartit les artisans sur les modèles libres (le même modèle peut servir plusieurs artisans le même jour : ils ne se connaissent pas et un seul l'acceptera) |
| MO5 | Accepter (`scripts/prospection/accepter.mjs --siren`) : le modèle montré à cet artisan passe « pris », à son SIREN ; il ne sert plus jamais à personne ; un nouveau modèle est tiré pour revenir à 10 libres |
| MO6 | Deux artisans qui acceptent le même modèle le même jour : le premier enregistré le garde ; le second reçoit un autre modèle libre, et Fabrice le lui montre avant de continuer (rien ne change dans son dos) |
| MO7 | Photos reçues : rangées par rôle (avant, après, chantier, geste, détail), le site refait avec le modèle de l'artisan et ses photos, en site d'abonné (`--publication` : mentions légales, référencement, plus aucun « exemple ») |
| MO8 | Les modèles et leur état vivent dans le dépôt (`prospection/modeles/<métier>.json`, petit, versionné). Les photos des artisans ne vont pas dans un dépôt public (question Q6) |

## 3. Ce qui change dans le dépôt

1. `generateur/tirage.mjs` et `composer.mjs` : `--graine <clé>` tire textes,
   paramètres et photos d'une clé donnée au lieu du SIREN (T57).
2. `scripts/prospection/modeles.mjs` : tire et tient les 10 modèles par
   métier (T57).
3. `scripts/prospection/fabriquer-lot.mjs` : fabrique avec les modèles libres
   et note le modèle dans `prospection/registre.json` (T58).
4. `scripts/prospection/accepter.mjs` : MO5 et MO6 (T59).
5. `scripts/prospection/photos-artisan.mjs` et une procédure pour Fabrice :
   le dossier de photos reçues devient le site d'abonné (T60).

## 3 bis. Ce qui est fait (4 nov. 2026)

| Pièce | État |
|---|---|
| T57 modèles, `--graine` | fait : 10 modèles libres par métier pour ravalement, couverture, peinture (`prospection/modeles/`) |
| T58 lot du jour | fait : chaque artisan reçoit un modèle libre, noté au registre des appels |
| T59 acceptation | fait : quand Fabrice touche « Essai lancé » ou « Abonné » dans la page d'appels, la préparation du soir réserve le modèle de l'artisan et en tire un nouveau ; à la main : `node scripts/prospection/accepter.mjs --siren <SIREN>` |
| T60 photos reçues | fait : `photos-artisan.mjs` ; photos dans `clients/<SIREN>/` du dépôt, une fois privé (Q6, F20) ; procédure `docs/PROCEDURE-PHOTOS.md` |

## 4. Preuve attendue

Voir les colonnes « Preuve » de T57 à T60 dans `app/specs/07-TACHES.md`.

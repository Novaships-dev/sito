---
name: preparer-appels
description: Prépare le lot d'appels du lendemain pour Sitô, de bout en bout (extraction, recherche web des sites existants, fabrication, publication privée, page d'appels). À utiliser pour la soirée de prospection, lancée par `/preparer-appels` ou `lanceurs\PREPARER_APPELS.bat`.
---

# Préparer les appels de demain

Spécification : `app/specs/08-PROSPECTION.md`. Décisions de Fabrice du
23 octobre (`memoire/decisions.md`) : 30 sites par soir, 10 par métier
(ravalement, couverture, peinture), Bouches-du-Rhône.

Le code fait tout, sauf une chose qui ne se scripte pas : **savoir si un
artisan a déjà un site**. C'est pour ça que ce travail se fait en deux
commandes séparées, avec une recherche web entre les deux.

## 1. Lister les candidats

```
node scripts/prospection/preparer-appels.mjs --lister
```

Écrit `prospection/a-verifier.json` (fichier de travail du soir, hors de
Git). Il contient, par métier, les candidats éligibles et les **vingt
premiers** à vérifier sur le web (triés par note, sans tenir compte de leur
site — c'est justement ce qui manque).

## 2. Vérifier chaque candidat sur le web

Pour **chacun** des candidats listés (`siren`, `nom`, `commune`) : une
recherche web (`"<nom>" "<commune>"`), jamais une lecture automatisée de
Google ni une copie de ses photos (cadre légal, `08-PROSPECTION.md`). Classer
dans un des statuts de `scripts/prospection/qualifier.mjs` (`SITES`) :

| Statut | Ce qu'on a trouvé |
|---|---|
| `aucun` | rien, ou une fiche d'annuaire professionnel sans site propre |
| `reseau-social` | une page Facebook ou Instagram, pas de site |
| `annuaire` | une fiche d'annuaire généraliste (Pages Jaunes, etc.), rien de plus |
| `ancien` | un site qui existe mais semble abandonné (dernière actualité ancienne, design daté, aucune mention de l'année en cours) |
| `recent-prestataire` | un site récent, visiblement fait par un professionnel (pas du bricolage) : cet artisan **paie déjà quelqu'un**, il écarte |

Un candidat non vérifié (budget de temps dépassé, recherche sans résultat
net) reste absent du fichier : il vaudra `inconnu`, 8 points, comme s'il
n'avait pas été cherché — jamais une note haute sans savoir.

Écrire le résultat dans un fichier JSON, par exemple
`prospection/sites-du-jour.json` (hors de Git aussi) :

```json
{ "123456789": "aucun", "987654321": "recent-prestataire" }
```

**Le métier, pour les candidats `metier_a_prouver`** (décision du 29 oct. :
« Ravalement de façade c'est des façadiers »). Aucun code APE ne dit le
ravalement : un nom qui ne dit pas la façade (« NICOLAS FERMAUD ») ne suffit
pas. La recherche regarde aussi **ce que fait l'entreprise** (son site, sa
fiche, un annuaire) et l'écrit :

```json
{ "123456789": { "site": "annuaire", "metier": "oui", "vu": "fiche Pages Jaunes : ravalement de façades, enduits" },
  "555666777": { "site": "aucun", "metier": "non", "vu": "site : maçonnerie générale, piscines" } }
```

`"oui"` seulement si la façade est son **métier principal**. Sans `"oui"`, le
candidat est écarté avec sa raison et ne reçoit pas de site. Un `"non"`
écarte aussi un candidat dont le nom dit le métier.

## 3. Fabriquer, publier, produire la page

```
node scripts/prospection/preparer-appels.mjs --sites prospection/sites-du-jour.json
```

Dans l'ordre : qualifie une seconde fois avec ce que le web a dit, choisit
les dix meilleurs de chaque métier, fabrique (comme
`scripts/prospection/fabriquer-lot.mjs` : un métier sans images prêtes est
**sauté avec son message**, ça ne bloque pas les autres), publie sur
Cloudflare Pages (comme `scripts/prospection/publier.mjs`, sauf `--sec`), et
écrit la page d'appels + `worker/appels.js` (`_worker.js`) dans le même
dépôt, sous un slug privé et **stable** (`prospection/appels.json`, tiré une
fois, jamais deviné).

Sans compte Cloudflare (action **F5** de `memoire/actions-fabrice.md`), ajouter
`--sec` : tout se calcule, rien ne part en ligne. Tant que F5 n'est pas faite,
c'est le seul mode possible.

## 4. Les réglages Cloudflare (une fois, pas tous les soirs)

- **F5** : le compte Cloudflare (`lanceurs\CLE_CLOUDFLARE.bat`), fait le 27 oct.
- L'espace KV lié sous le nom `APPELS` et la variable `SLUG_APPELS` (valeur de
  `prospection/appels.json`, `.slug`) se posent par l'API, sans tableau de
  bord : `node scripts/prospection/reglages-cloudflare.mjs` (idempotent, relit
  le projet et dit ce qui manque). À lancer **avant** `--sites` : un réglage ne
  vaut qu'à partir du dépôt suivant. Sans eux, `worker/appels.js` refuse
  d'enregistrer un résultat (`env.APPELS` ou `env.SLUG_APPELS` absents).

## 5. Le soir suivant : relire les résultats

KV garde les résultats de la veille (`resultat:<siren>`) ; ce que Fabrice a
tapé sur son iPhone doit rejoindre `prospection/registre.json`, la vérité
versionnée. Tant que ce report n'est pas écrit (c'est la suite de ce skill,
à faire quand le KV réel existe), les statuts restent dans KV seulement —
ne jamais prétendre le registre à jour sans l'avoir relu.

## 6. Enregistrer le travail

`prospection/registre.json` (les artisans) et `prospection/en-ligne.json`
(ce qui est en ligne) changent à chaque lot réel. Vérifier `git status`,
ajouter ces deux fichiers (jamais `git add -A`), commiter
(`Prospection : lot du <jour>`), pousser. Les fichiers de travail du soir
(`prospection/a-verifier.json`, `prospection/sites-du-jour.json`) restent
hors de Git.

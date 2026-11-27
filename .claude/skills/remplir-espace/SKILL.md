---
name: remplir-espace
description: Préparation du soir de l'espace de prospection de Fabrice, depuis le cloud (tâche programmée à 21 h, dimanche à jeudi) : trouver les artisans du lendemain, relever leur numéro public, faire la vraie analyse de chacun, verser le tout dans la base. À utiliser quand la tâche programmée « Préparer les appels de demain » se lance, ou sur demande.
---

# Remplir l'espace de prospection pour demain

Décisions de Fabrice (27 nov. 2026, `memoire/decisions.md`) :
- « aucun numero stocker juste ceux du jour a appeler » ;
- « Il faut surtout que en plus des numero j'ai une vrais analyse de l'artisan
  pour l'apelle » ;
- « Je préfére B oui et A pour les maquette » : ce skill est **B** (cloud,
  numéros et analyses) ; les maquettes se font sur son PC (`/preparer-appels`) ;
- « Oui 21H c'est bon » ; « facadier en premier puis ensuite il y'aura un mix
  tout les jour de différente branche » : réglages dans
  `prospection/espace-reglages.json` (`metiers`, `par_jour`).

Outils : le connecteur **Supabase** (projet `sito`, réf.
`magxzrpboyrzguuocjgj`, outil `execute_sql`), **WebSearch**, **WebFetch**.
Aucun fichier `.env` ici : on n'en a pas besoin, et on ne le cherche pas.
On ne travaille jamais sans surveillance sur autre chose que ce skill.

## 1. Le jour d'appel

Le jour ouvré qui suit aujourd'hui, heure de Paris (vendredi soir ou samedi :
lundi). Noté `J` (AAAA-MM-JJ) dans la suite.

## 2. Ce qui est déjà dans l'espace

```sql
select siren, nom, commune, metier, statut, a_appeler_le
from public.fiches_prospection
where a_appeler_le <= 'J' and statut not in ('refuse','ne-plus-appeler','abonne','essai-lance');
select siren from public.fiches_prospection where siren is not null;
```

La première liste : les **rappels et relances** de `J`, à préparer comme les
nouveaux (numéro du jour, analyse rafraîchie). La seconde : les SIREN à ne
**jamais** reprendre comme nouveaux.

## 3. Choisir les nouveaux

`par_jour` (30) moins le nombre de rappels, au moins 15 nouveaux.
Métiers du jour : `metiers` du fichier de réglages ; s'il y en a plusieurs,
les répartir à parts égales. Codes APE (`app/specs/08-PROSPECTION.md`) :
ravalement `43.34Z` (et `43.99D`) ; couverture `43.91B`, `43.91A` ; peinture
`43.34Z`, `43.33Z`.

Source : l'annuaire public des entreprises, par WebFetch, par exemple
`https://recherche-entreprises.api.gouv.fr/search?activite_principale=43.34Z&departement=13&etat_administratif=A&per_page=25&page=N`
(changer de page d'un soir à l'autre ; ne pas toujours prendre les mêmes).
Garder : siège dans le 13, entreprise active, **petite** (sans salarié ou
moins de 10), pas déjà dans l'espace ni dans `prospection/registre.json`.
**Ravalement = façadiers seulement** (décision du 29 oct.) : le nom dit la
façade, ou la recherche web montre que la façade est le métier principal.

## 4. L'analyse de chaque artisan (rappels compris)

Pour chacun, deux à quatre recherches web (`"<nom>" "<commune>"`,
`"<nom>" avis`, `<métier> <commune>` pour les concurrents). On ne lit jamais
Google de façon automatisée et on ne copie pas ses photos ; on lit ce que les
résultats et les pages publiques montrent.

Relever **seulement ce qui est vu**, jamais deviné :

| Champ | Ce qu'on écrit |
|---|---|
| `telephone` | le numéro **public** de l'entreprise (fiche Google, son site, annuaire professionnel). Pas trouvé : pas de numéro, la fiche entre quand même |
| `note_google`, `avis_google` | si visibles |
| `site_actuel` | « aucun », « Facebook seulement », « site de 2017, pas adapté au téléphone »… |
| `points_forts`, `points_faibles` | constats courts et vérifiables : `{ "sujet": "Avis Google", "texte": "4,8 sur 32 avis" }` |
| `angle` | une phrase pour ouvrir l'appel : un point fort, un manque, ce que le site change |
| `diagnostic.resume` | qui il est : ancienneté (date de création), taille, zone, spécialités vues |
| `diagnostic.presence` | canal par canal (Fiche Google, Site internet, Facebook, Instagram, PagesJaunes) : `etat` = `bon`, `moyen` ou `absent`, et un `detail` |
| `diagnostic.clients` | ce qui revient dans ses avis, en bien et en mal (paraphrasé, jamais recopié) |
| `diagnostic.concurrents` | qui sort devant lui pour son métier et sa ville, et ce qu'ils ont de plus |
| `diagnostic.questions` | 2 à 4 questions à lui poser, propres à son cas |
| `diagnostic.objections` | 2 ou 3 objections probables et la réponse, avec nos vrais prix (80 € par mois, 1 mois offert, 12 mois ; ou 720 € l'année) |
| `diagnostic.proposition` | ce qu'on lui propose, en une phrase, et pourquoi lui |

Rédaction : `redaction-fr` (pas de tiret cadratin, pas de point médian, rien
qui sonne généré). Un artisan qui a déjà un site récent fait par un
professionnel : l'écarter (il paie déjà quelqu'un).

## 5. Verser dans la base

Une seule requête, avec la liste en JSON (les règles sont dans la base :
numéro gardé seulement pour `J`, statut et notes de Fabrice jamais écrasés,
un refusé ne revient jamais) :

```sql
select prive.verser_fiches($json$[ {"siren":"…","nom":"…","metier":"Ravalement","commune":"…","telephone":"06 …",
  "note_google":4.8,"avis_google":32,"site_actuel":"aucun","points_forts":[…],"points_faibles":[…],
  "angle":"…","diagnostic":{…}} ]$json$::jsonb, 'J');
```

Lire le bilan rendu (`crees`, `mises_a_jour`, `numeros`, `ecartees`).
Contrôle : `select count(*) from public.fiches_prospection where a_appeler_le = 'J'`.

## 6. Ce qui ne se fait jamais

- Écrire un numéro ou une analyse dans le dépôt Git (ni fichier, ni commit).
- Inventer une note, un avis, un concurrent ou un numéro.
- Appeler, écrire ou envoyer quoi que ce soit à un artisan.
- Toucher aux autres tables, ou à une fiche autrement que par `prive.verser_fiches`.

## 7. Le compte rendu

À la fin, un message court : le jour `J`, combien de fiches (nouvelles,
rappels), combien avec numéro, les écartées et pourquoi. Si la base ou le
web ne répondent pas : le dire, ne rien verser à moitié sans le dire.

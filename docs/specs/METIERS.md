# Les 16 métiers de Sitô, et où chacun en est

Écrit par Claude (Cowork) le 3 novembre 2026, d'après
`generateur/banque/plan-images.json`, `generateur/metiers/`,
`banque/prompts/` et `prospection/metiers.json`. Décision de Fabrice du
23 sept. 2026 : « Il va falloir faire **tous les métiers, et à 100 %**. »

Un métier est **prêt** quand ses cinq pièces existent et sont prouvées :

1. ses textes (`generateur/metiers/<clé>.json`), au volume du ravalement ;
2. sa feuille de prompts (`banque/prompts/<clé>.md`) ;
3. ses 54 images générées, rangées et vérifiées (`node scripts/verifier-images.mjs <clé>`) ;
4. 100 sites sans défaut dans un département (`node scripts/capacite-unicite.mjs --metier <clé>`, sans `--photos plan`) ;
5. sa règle de prospection (`prospection/metiers.json` : codes APE, mots, preuve du métier).

## État au 3 novembre 2026

| Clé | Métier | Codes APE (plan d'images) | Textes | Prompts | Images | 100 sites | Prospection |
|---|---|---|---|---|---|---|---|
| `ravalement` | Ravalement de façade | 43.34Z, 43.99C, 43.99D, 43.29A | oui | oui | 32 sur 54 (F15) | oui, en projection (`--photos plan`) | oui (façadiers seulement, décision du 29 oct.) |
| `couverture` | Couverture et zinguerie | 43.91B, 43.91A, 43.99A | oui | oui | 0 (F18) | oui, en projection | oui |
| `peinture` | Peinture intérieure | 43.34Z, 43.33Z | oui | oui | 0 (F18) | oui, en projection | oui |
| `maconnerie` | Maçonnerie générale | 43.99C, 43.91B | oui (4 nov.) | non | 0 | oui, en projection | non |
| `menuiserie` | Menuiserie et fenêtres | 43.32A, 43.32B | oui (4 nov.) | non | 0 | oui, en projection | non |
| `carrelage` | Carrelage et faïence | 43.33Z | oui (4 nov.) | non | 0 | oui, en projection | non |
| `platrerie` | Plâtrerie et cloisons | 43.31Z | non | non | 0 | non | non |
| `isolation` | Isolation extérieure | 43.29A | non | non | 0 | non | non |
| `electricite` | Électricité | 43.21A | non | non | 0 | non | non |
| `plomberie` | Plomberie et chauffage | 43.22A, 43.22B | oui (4 nov.) | non | 0 | oui, en projection | non |
| `metallerie` | Serrurerie et portails | 43.32B, 25.11Z | non | non | 0 | non | non |
| `terrassement` | Terrassement et VRD | 43.12A | non | non | 0 | non | non |
| `etancheite` | Étanchéité toiture-terrasse | 43.99A | non | non | 0 | non | non |
| `parquet` | Parquet et sols souples | 43.33Z | non | non | 0 | non | non |
| `piscine` | Piscine | 43.99C | non | non | 0 | non | non |
| `paysagiste` | Paysagiste | 81.30Z | non | non | 0 | non | non |

**Prêts : 0 sur 16.** Sept ont leurs textes (maçonnerie, menuiserie, carrelage et plomberie depuis le 4 nov., sans prompts encore), trois leurs prompts ; aucun n'a encore
ses 54 images.

## Ce qui ne colle pas encore

| N° | Écart | Où | Tâche |
|---|---|---|---|
| M1 | Codes APE du ravalement : 3 dans `plan-images.json`, 5 dans `ravalement.json`, 4 dans `prospection/metiers.json` (43.34Z, 43.99C, 43.99D, 43.29A) | trois fichiers | T31 (`docs/DETTE.md` D-10) ; **réglé le 4 nov.** : une seule source, `prospection/metiers.json`, recopiée à l’identique et contrôlée par `verifier-depot` |
| M2 | Un même code APE sert plusieurs métiers (43.34Z : ravalement et peinture ; 43.33Z : ravalement, carrelage, parquet ; 43.99C : ravalement, maçonnerie, piscine ; 43.91B : maçonnerie et couverture ; 43.32B : menuiserie et métallerie). La prospection ne peut donc pas trier par code seul | `plan-images.json` | règle du 29 oct. : nom et recherche web, `prospection/metiers.json` (`mots`, `motsAutreMetier`, `preuveDuMetier`) |
| M3 | Le générateur décrit les photos de chaque métier comme une façade (« échafaudage », « taloche chargée d'enduit », « grain de l'enduit ») : textes alternatifs écrits en dur | `generateur/composer.mjs`, `generateur/archetypes/matiere.mjs` | constat S-023 |

## Ordre proposé pour les 13 restants

Non décidé par Fabrice. Proposition : d'abord les métiers dont un site montre
le mieux un avant / après (le comparateur est le cœur de la page), et qui sont
nombreux dans le 13 : maçonnerie, menuiserie, carrelage, plomberie,
électricité, puis les autres. Le nombre d'entreprises par code APE dans le 13
est à mesurer avec `scripts/prospection/extraire.mjs` avant de trancher.
Question à poser à Fabrice au moment de T32.

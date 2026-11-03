# Spécification : le référencement d'un site d'artisan

Écrit par Claude (Cowork) le 3 novembre 2026 pour la tâche **T51** (constat
S-003). Décision de Fabrice du 23 sept. 2026 : « L'app permet à l'artisan de
voir les stats de son site, ses commentaires Google et sa fiche pro Google
[…]. **L'app sert à son référencement.** » Aujourd'hui, aucun site ne porte de
données structurées, d'aperçu de partage, d'icône, de plan du site ni de
`robots.txt` d'abonné.

## 1. Deux régimes, jamais mélangés

| | Site de prospection | Site d'abonné |
|---|---|---|
| Visible sur Google | **non** | **oui** |
| `<meta name="robots">` | `noindex` (déjà en place, X14) | absent |
| `robots.txt` | interdit tout (déjà en place) | autorise tout, cite le plan du site |
| `sitemap.xml` | absent | présent |
| Données structurées | absentes | présentes |
| Aperçu de partage (Open Graph) | présent (le lien part par SMS : l'artisan doit voir un titre et une image) | présent |
| Adresse | `sito-demo.pages.dev/<slug>/` | sous-domaine offert ou domaine de l'artisan |

Un site d'abonné qui garderait `noindex` serait invisible : c'est la faute la
plus coûteuse de ce document. Un site de prospection indexé exposerait un
artisan qui n'a rien demandé. Les deux se contrôlent (R5).

## 2. Ce que porte chaque page d'un site d'abonné

| N° | Élément | Contenu | Source de la valeur |
|---|---|---|---|
| R1 | `<title>` | « <enseigne>, <métier> à <commune> » (déjà produit), 60 caractères au plus | Sirene, fichier métier |
| R2 | `<meta name="description">` | le chapô tiré (déjà produit), 160 caractères au plus | fichier métier |
| R3 | `<link rel="canonical">` | l'adresse publique de la page (domaine de l'artisan s'il en a un, sinon le sous-domaine) | table `adresses` |
| R4 | Données structurées JSON-LD | voir §3 | Sirene, `profils`, `adresses` |
| R5 | Régime | `noindex` présent si et seulement si site de prospection | marqueur de publication |
| R6 | Open Graph | `og:title`, `og:description`, `og:image` (une photo de l'artisan, jamais une image d'exemple sur un site d'abonné), `og:url`, `og:type=website`, `og:locale=fr_FR` | fabrication |
| R7 | Icône | `favicon.ico` et une icône PNG, tirées de la charte du site (initiale et couleur), jamais un logo inventé pour l'entreprise | charte |
| R8 | Langue | `<html lang="fr">` (déjà produit) | |
| R9 | Titres | un seul `h1`, niveaux sans saut (déjà contrôlé par `verifier-site`) | |
| R10 | Images | `alt` décrivant **la photo réelle** ; jamais un texte écrit pour un autre métier (constat S-023) | fichier métier ou légende de l'artisan |

## 3. Les données structurées

Google exige `name` et `address` pour `LocalBusiness`, et recommande notamment
`telephone`, `url`, `geo`, `openingHoursSpecification`, `priceRange`
(Google Search Central, relevé le 3 nov. 2026). Le type précis vient du métier
quand schema.org en a un.

| Propriété | Valeur | Règle |
|---|---|---|
| `@type` | type du métier si schema.org en a un (exemples : `RoofingContractor` pour couverture, `Plumber` pour plomberie, `Electrician` pour électricité, `GeneralContractor` pour maçonnerie), sinon `HomeAndConstructionBusiness` | table de correspondance à écrire dans le fichier de chaque métier (`schemaType`), vérifiée contre schema.org au moment de T51 |
| `name` | enseigne, sinon dénomination | obligatoire |
| `address` | `PostalAddress` complète depuis Sirene | obligatoire ; fabrication arrêtée si absente |
| `telephone` | le numéro donné par l'artisan, au format international | seulement s'il l'a donné |
| `url` | adresse publique de la page | |
| `image` | une ou plusieurs photos de l'artisan | jamais une image d'exemple |
| `areaServed` | la commune et, si l'artisan les donne, les communes servies | |
| `priceRange` | seulement si l'artisan affiche ses prix | jamais inventé |
| `openingHoursSpecification` | seulement si l'artisan les donne (champ à ajouter dans l'app, T51) | |
| `aggregateRating`, `review` | **jamais** sur le site de l'artisan lui-même | Google ne les recommande que pour un site qui recueille des avis sur **d'autres** entreprises ; des avis sur soi-même n'ouvrent pas les résultats enrichis |

Le JSON-LD passe par la fonction d'échappement JSON de T48 : un `</script>` dans
un nom ne doit jamais fermer la balise.

## 4. Le site en entier

| N° | Élément | Règle |
|---|---|---|
| RS1 | `sitemap.xml` | toutes les pages du site d'abonné (accueil, deuxième page, mentions légales), avec leur adresse publique |
| RS2 | `robots.txt` | site d'abonné : `Allow: /` et la ligne `Sitemap:` ; prospection : `Disallow: /` (déjà en place) |
| RS3 | Une adresse, une version | le Worker redirige le sous-domaine vers le domaine propre quand l'artisan en a un (301), pour qu'une seule adresse soit indexée |
| RS4 | Vitesse | budgets de `rules/web/performance.md`, déjà contrôlés par `verifier-site` |
| RS5 | Pages par commune | **hors de T51.** Une page par commune servie est une piste ; elle demande une décision de Fabrice et ne doit pas fabriquer du contenu dupliqué |

## 5. La fiche Google de l'artisan

Le référencement local passe d'abord par la fiche Google Business Profile.
L'app la montre (A14) et, avec l'accès à l'API (T24, T25, artisan pilote F13),
signalera ce qui contredit le site : nom, adresse, téléphone, activité.
Règle : **le site et la fiche disent la même chose** ; une différence est
montrée à l'artisan, jamais corrigée sans lui.

## 6. Preuve attendue (T51)

`scripts/verifier-site.mjs` gagne trois contrôles, chacun essayé sur une copie
cassée :

| Contrôle | Rouge quand |
|---|---|
| R-JSONLD | le bloc JSON-LD manque, ne se lit pas, n'a pas `name` ou `address`, ou porte une valeur absente des données (téléphone inventé, `aggregateRating`) |
| R-OG | `og:title`, `og:description`, `og:image` ou `og:url` manque ; `og:image` pointe une image d'exemple sur un site d'abonné |
| R-REGIME | un site d'abonné porte `noindex`, ou un site de prospection ne le porte pas |

Et, une fois un site d'abonné en ligne : l'outil de test des résultats enrichis
de Google le lit sans erreur critique (essai manuel, noté au journal).

## Sources (relevées le 3 novembre 2026)

- [Google Search Central : données structurées LocalBusiness](https://developers.google.com/structured-data/local-businesses/)
- [schema.org : LocalBusiness](https://schema.org/LocalBusiness)

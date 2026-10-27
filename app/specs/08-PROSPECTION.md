# 08 — Prospection : la chaîne qui prépare les appels de Fabrice

Version du 24 octobre 2026. Décisions de Fabrice du 23 octobre (`memoire/decisions.md`).
Le plan commercial, le script d'appel et les objections sont dans le document
Claude « Prospection Sitô : plan, script et objections » ; ici, seulement ce que
Claude Code construit.

## Ce que Fabrice doit trouver chaque matin à 7 h

Une page privée, faite pour son iPhone : la **page d'appels du jour**.
- 30 artisans, 10 par métier (ravalement de façade, couverture et zinguerie,
  peinture), Bouches-du-Rhône, triés par note.
- Pour chacun : nom, commune, métier, note et pourquoi, le lien de son site
  Sitô déjà en ligne, un bouton « Fiche Google » (ouvre la recherche Google Maps
  « nom + commune » : Fabrice y voit la fiche et appelle depuis elle), le SMS
  du lien prêt à copier (texte du document, section Messages), et des boutons
  de résultat en un appui : pas de réponse, rappeler (jour + heure),
  intéressé, essai lancé, abonné mois, abonné année, pas intéressé, ne plus appeler.
- En haut : les relances du jour (rappels promis, ouvreurs à 48 h) avant les
  nouveaux.
- Le point chiffré de la semaine : appels, conversations, liens ouverts,
  essais, abonnements (les objectifs sont dans le document).

## Les pièces

| Pièce | Rôle |
|---|---|
| `prospection/metiers.json` (fait) | les trois métiers : libellé, codes APE, et les mots qui tranchent le métier sur la raison sociale. Les mots s'écrivent au singulier : la recherche se fait en mot entier, pluriel compris |
| `scripts/prospection/extraire.mjs` (fait) | API publique `recherche-entreprises.api.gouv.fr` (sans clé) : codes APE du métier, `departement=13`, **`etat_administratif=A` obligatoire**, effectif `NN,00,01,02,03`, créée il y a plus de 2 ans. **Tous ces filtres sont refaits sur chaque réponse**, voir « Ce que l'API fait vraiment » plus bas |
| `scripts/prospection/qualifier.mjs` (fait) | note de 0 à 100 : site existant 0 à 25, ancienneté 0 à 25, effectif 0 à 20, RGE +15, nom qui dit le métier +15. Un site récent fait par un prestataire **écarte** (il paie déjà). Le RGE vient de l'API elle-même (`complements.est_rge`), pas d'un appel à l'ADEME. La présence d'un site se vérifie par une recherche web faite par Claude Code au moment de préparer le lot (`/preparer-appels`) et passée dans `sites` ; sans elle, la valeur est `inconnu` et vaut peu : **une note haute ne se gagne pas en ne sachant rien**. **Jamais** de lecture automatisée de Google (conditions d'utilisation) ni de copie de ses photos |
| `scripts/prospection/registre.mjs` + `prospection/registre.json` (versionné, sans numéro de téléphone) (fait) | chaque artisan déjà traité : SIREN, métier, nom, commune, date du site, slug, statut, date du dernier appel, relance. Un artisan n'est jamais rappelé deux fois le même jour, jamais après « ne plus appeler », jamais quand il est abonné. `valider()` cherche un numéro de téléphone dans le fichier **entier** et refuse l'écriture s'il en trouve un |
| `scripts/prospection/fabriquer-lot.mjs` (fait) | 10 sites par métier pour les mieux notés, avec le générateur (`composer.mjs` en mode prospection : photos d'illustration, mention visible), dans `sites/prospection/<jour>/<siren>/` (hors de Git), contrôlés par `verifier-site` (chaque site), `verifier-mobile` (les `--mobile n` premiers, 1 par défaut) et l'unicité sur le lot entier. **Un métier dont les images ne sont pas prêtes est sauté**, avec son message et la commande qui mesure : la réponse vient de `verifier-images.mjs`, et le marqueur `SOURCE-ILLUSTRATION` est exigé en plus (sans lui la page ne porterait pas la mention). Ce qui bloque un métier ne bloque pas les autres. **C'est ici que le slug de 16 caractères est tiré** (`randomBytes`, pas `Math.random`) et inscrit au registre des artisans avec le jour ; `publier.mjs` le relit, il ne le refait pas. Deux registres qui ne se mélangent pas : `prospection/registre.json` (les artisans) et `prospection/registre-sites.json` (l'unicité des sites de prospection, l'équivalent de `generateur/registre.json` pour la démonstration) |
| `scripts/prospection/publier.mjs` (fait, sauf la première publication réelle : **F5**) | Cloudflare Pages, offre gratuite, **un seul projet** `sito-demo` : chaque site sous son slug de 16 caractères (tiré par `fabriquer-lot.mjs`, relu ici) ; images communes partagées une fois ; `_headers` avec `X-Robots-Tag: noindex` partout ; `robots.txt` qui interdit tout ; aucune page d'index (la racine rend 404) ; retrait des sites non signés après 30 jours. Jeton dans `.env` (`CLOUDFLARE_COMPTE_ID`, `CLOUDFLARE_JETON_API`), lu par `scripts/env.mjs`. **Pages déploie le projet entier, pas un site** : publier le lot du jour, c'est redéployer tous les sites encore vivants. Un site retiré n'est pas effacé, il n'entre plus au manifeste. Comme un manifeste n'a besoin que d'empreintes et non de fichiers, `prospection/en-ligne.json` (versionné) garde pour chaque slug son plan chemin → empreinte : les sites des jours passés se redéploient sans leur dossier et sans rien renvoyer. L'empreinte est celle de Cloudflare, `blake3(base64(contenu) + extension)` coupée à 32 signes (paquet `hash-wasm`, Node ne sait pas faire blake3) : c'est elle qui fait que les images de banque ne montent qu'une fois. Le dialogue avec l'API est dans `scripts/prospection/cloudflare-pages.mjs`, essayé contre `scripts/faux-cloudflare.mjs` (un `fetch`, pas une doublure : le vrai client est le code mesuré) |
| page d'appels + ses résultats (fait, sauf le KV réel : **F5**) | `scripts/prospection/page-appels.mjs` fabrique la page (HTML statique, iPhone d'abord), `worker/appels.js` est le `_worker.js` du projet : il sert les fichiers, enregistre les résultats dans KV sous `resultat:<siren>` et compte les liens ouverts sous `vu:<slug>`. Servie par le même projet sous un slug privé ; **le slug est le laissez-passer** de l'API (`/<slug>/api/resultat`), un POST ailleurs n'écrit rien. Les relances dues passent **avant** les nouveaux ; un artisan déjà appelé le jour même, abonné ou « ne plus appeler » est écarté, avec sa raison écrite. **Aucun numéro de téléphone** ni dans la page ni dans KV : un corps qui en porte un est refusé, et la page est relue par `verifier()` avant d'être écrite. Un statut inconnu est refusé avant toute écriture. KV est une boîte aux lettres, pas une base : le soir, `/preparer-appels` relit les résultats et les reporte dans `prospection/registre.json`, qui reste la vérité versionnée. « Liens ouverts » est le seul chiffre qui ne vient pas du registre : le Worker compte une vue quand la **page** d'un site est servie (pas ses images, pas ses autres pages, pas la page d'appels de Fabrice). KV n'a pas d'incrément atomique : c'est un indice, pas une comptabilité, et un compte inconnu s'affiche « ? », jamais « 0 » |
| `scripts/prospection/preparer-appels.mjs` (fait, sauf la première publication réelle : **F5**) | la soirée de bout en bout, en deux commandes séparées par la recherche web (qui ne se scripte pas) : `--lister` (extrait, qualifie une première fois en « inconnu », écrit `prospection/a-verifier.json`, hors de Git, avec le réservoir de candidats et les `--verifier` premiers à vérifier) puis `--sites <fichier>` (qualifie une seconde fois avec ce que le web a dit, choisit le lot, fabrique, publie, écrit la page d'appels et `_worker.js` dans le même dépôt sous un slug **stable** : `appelsSlug()`, tiré une fois, gardé dans `prospection/appels.json`, jamais redeviné). `publier()` gagne un paramètre `extra` : des fichiers fixes du projet (le worker, la page d'appels) qui entrent au manifeste à chaque publication, hors du cycle de vie des sites d'artisan |
| `.claude/skills/preparer-appels/SKILL.md` + `lanceurs/PREPARER_APPELS.bat` (fait) | la préparation du lot, de bout en bout, lancée d'un double-clic le soir (ou par `/preparer-appels`) ; détaille comment classer un site trouvé sur le web parmi les statuts de `qualifier.mjs` |
| `lanceurs/CLE_CLOUDFLARE.bat` | comme `CLE_SUPABASE.bat` : ouvre la page des jetons Cloudflare, Fabrice colle, le script range dans `.env` et vérifie le jeton |

## Les images des deux nouveaux métiers

`banque/prompts/couverture.md` et `banque/prompts/peinture.md`, sur le modèle de
`banque/prompts/ravalement.md` : le bloc de règles à coller une fois, puis un
texte par image avec son nom de fichier, d'après `banque/liste-images.csv`.
**32 images par métier pour démarrer** (2 hero, 3 paires, 3 chantier, 5 geste,
8 matière dont le détail principal, 5 ambiance, 3 signes), 54 ensuite. Fabrice
les génère dans ChatGPT et les range dans `images/<métier>/` ; un script les
vérifie avant toute fabrication : `node scripts/verifier-images.mjs <métier>`
(nom, cadrage, largeur, paires alignées au pixel, minimum jouable du
générateur). La largeur exigée est la plus grande rendition que le générateur
encode à partir du fichier : **1600 px pour un hero, 1400 px pour les autres**
(`scripts/plan-images.mjs`, miroir de `TAILLES` dans `generateur/composer.mjs`).
Les images n'étant pas dans Git, la suite d'essais contrôle partout l'accord
entre les feuilles de prompts et le plan (`verifier-images.mjs --prompts`), et
les fichiers eux-mêmes seulement là où ils sont.

Les textes des sites de ces deux métiers (`generateur/metiers/<métier>.json`,
au volume du ravalement) passent avant les 13 autres métiers de T32.

## Ce que l'API fait vraiment (mesuré le 24 octobre 2026)

Les chiffres sont des `total_results` réels, pour `activite_principale=43.34Z`
et `etat_administratif=A`. Ils sont la raison d'être de la moitié du code de
`extraire.mjs`.

| Requête | Résultats |
|---|---|
| sans autre filtre | 10 000 (plafond) |
| `&departement=13` | 4 019 |
| `&departement_siege=13` (nom mal écrit) | **10 000** |
| `&zzz=13` (nom inconnu) | **10 000** |
| `&departement=13&tranche_effectif_salarie=00,01,02,03` | 563 |
| `&departement=13&tranche_effectif_salarie=NN` | 3 418 |
| `&departement=13&est_rge=true` | 21 |

- **Un nom de paramètre inconnu est ignoré en silence.** Une faute de frappe
  ne se voit donc pas dans la réponse. Comparer « avec » et « sans » ne suffit
  pas non plus : deux totaux égaux peuvent dire « ignoré » comme « rien à
  écarter » (vu sur 43.99D, où toutes les entreprises du 13 étaient déjà dans
  la bonne tranche). Le signal décisif est une **valeur impossible** :
  `departement=976` (Mayotte) ou `tranche_effectif_salarie=52` (5 000 salariés
  et plus) doivent faire s'effondrer le total. `verifierFiltres()` le mesure
  avant chaque extraction, et refuse de partir sinon.
- Une **valeur** invalide de `activite_principale` rend un 400 qui liste les
  valeurs valables. Le code veut la forme pointée : `43.34Z`, pas `4334Z`.
- `per_page` ne dépasse pas 25, et `page × per_page` pas 10 000.
- **`departement=13` ne filtre pas le siège** : il garde toute entreprise ayant
  au moins un établissement dans le 13 (une société de Quimper domiciliée à
  Marseille sort dans la réponse). Le filtre se refait sur `siege.departement`.
- **`NN` (effectif non renseigné) pèse 3 418 des 3 979** petites entreprises :
  l'exclure jetterait presque tous les artisans visés. Il est gardé et vaut
  10 points sur 20.
- `43.34Z` est « peinture **et vitrerie** » : la réponse est pleine de
  miroitiers. D'où les mots de `metiers.json`, cherchés en mot entier,
  **pluriel compris** : par morceaux, « ite » attrape ATS ETANCHEITE ; en mot
  strictement entier, « couverture » rate LES COUVERTURES LOPEZ, qui serait
  alors appelée comme peintre.

Les codes APE retenus, et ce qu'ils pèsent dans le 13 (petites entreprises
actives) : ravalement `43.34Z` 3 979, `43.99C` 9 264, `43.99D` 524,
`43.29A` 304 ; couverture `43.91B` 653, `43.91A` 269, `43.99A` 395 ;
peinture `43.34Z` 3 979, `43.33Z` 1 494. `43.99C` frôle le plafond de
l'API : l'extraction le signale (`bilan.plafonds`).

## Cadre légal (rappel, non négociable)

Numéro appelé = celui de la fiche publique de l'entreprise, ouvert par Fabrice
depuis la page d'appels ; aucun numéro stocké. Sites montrés privés, invisibles
sur Google, sans photo de l'artisan prise ailleurs. « Ne plus appeler » =
retrait du site le jour même.

## Preuves

- extraction et qualification (faite) : `node scripts/essai-prospection.mjs`,
  93 contrôles. Il tourne **sans réseau** : les entreprises sont réelles mais
  prélevées une fois dans `prospection/essais/recherche-entreprises.json`
  (693 entreprises, `node scripts/prospection/extraire.mjs --enregistrer-essai`),
  et `scripts/faux-recherche-entreprises.mjs` les sert avec la sémantique
  mesurée de l'API, pièges compris. Contre-essai : sept fautes posées une par
  une, dont le paramètre mal écrit, chacune attrapée seule ;
- publication : essai sur un faux Cloudflare local (comme `essai-publication`) :
  slugs non devinables, `noindex` présent sur chaque page, aucun index, retrait
  à 30 jours ;
- page d'appels : `essai-app`-like sur iPhone 390 px : boutons, résultat
  enregistré puis relu ;
- la soirée de bout en bout : `node scripts/essai-preparer-appels.mjs`, sur un
  faux Cloudflare — la chaîne réelle sans aucune image (30 candidats qualifiés
  avec le web, un « site récent, prestataire » écarté avant le lot) et, en
  fixture minimale, 30 sites publiés avec `_worker.js` et la page d'appels
  sous son slug stable ;
- tout s'ajoute à `node scripts/essais.mjs`.

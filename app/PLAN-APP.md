# Plan de l'app Sitô

Version du 3 octobre 2026, réécrite après les réponses de Fabrice :

> « StructorAI et Sitô sont 2 apps différentes. » « OK donc comment faire,
> faut écrire tout ça avec la solution. » « OK donc faut organiser ça. »
> « Tout doit être accepté, iPhone etc., la totale. »
> « Concentre-toi sur Sitô. »

**Ce document est le plan d'origine, gardé pour ses recherches.** Les
réponses de Fabrice (5 et 9 octobre) et l'état réel sont dans les six
documents de `app/specs/`, qui font référence pour coder. Les
sources web sont datées dans `docs/lecture-structorai/web.md` et `web2.md`.

---

## 1. Ce que fait l'app

Décision de Fabrice, 23 septembre 2026 : l'artisan abonné peut :

- voir les statistiques de son site ;
- voir ses avis Google et sa fiche Google ;
- ajouter ses photos avant/après de chantier, et **le site se refabrique avec**.

Décisions du 2 octobre, en plus :

- il donne son téléphone ;
- il coche « afficher mes prix » et saisit ses tarifs ;
- les images d'exemple restent marquées « Exemple » jusqu'à ce qu'il mette les
  siennes.

Décision du 3 octobre : **toutes ses photos sont acceptées**, quel que soit
l'appareil.

## 2. L'ensemble, en une image

```
Téléphone ou ordinateur de l'artisan ──► App Sitô (web, installable)
                                            │
                                            ▼
                     Supabase (Paris) : comptes, base, photos d'origine
                                            ▲
                                            │ clé de service, jamais dans l'app
         Service « atelier » (Node, un seul service)
           ├─ reçoit les photos, les convertit en JPEG/WebP propres
           ├─ fabrique le site (generateur/), lance les 5 vérificateurs
           ├─ publie la nouvelle version ; l'ancienne reste si un contrôle échoue
           ├─ reçoit les demandes du formulaire, les événements Stripe
           └─ récupère avis, fiche et statistiques (Google, Umami)
                                            │
                                            ▼
         Cloudflare : un seul Worker sert TOUS les sites
           ├─ fichiers des sites dans R2, rangés par site et par version
           ├─ nom.domaine-sito.fr : sous-domaine offert à chaque artisan
           └─ www.son-domaine.fr : domaine propre, par « Cloudflare for SaaS »
```

---

## 3. Héberger des milliers de sites : la solution

### 3.1 Le problème

Un projet Cloudflare Pages par artisan est impossible : **100 projets au plus
par compte**, limite que Cloudflare dit ne pas relever. Les autres limites
tombent aussi vite : 500 Workers par compte payant, 100 domaines par zone.

### 3.2 La solution : un seul Worker qui sert tous les sites

C'est un schéma documenté par Cloudflare (« Worker as origin », juin 2026) :

1. **Une zone Cloudflare pour Sitô**, le plan gratuit suffit pour démarrer.
   On y crée une origine factice `sites.domaine-sito.fr AAAA 100::`
   (proxifiée), déclarée « fallback origin » de Cloudflare for SaaS.
2. **Une route `*/*` vers un seul Worker.** Toutes les requêtes y arrivent, y
   compris celles des domaines des artisans. Le Worker lit le nom demandé
   (`Host`) et décide seul quel site servir.
3. **Une table « adresse → site et version »** dans Workers KV, recopiée depuis
   Supabase par le service atelier. Exemple de valeur :
   `dupont-plomberie.domaine-sito.fr → { site: "8f3…", version: 7 }`.
4. **Les fichiers dans R2**, rangés `sites/<site>/<version>/index.html`,
   `…/img/…webp`. Le Worker lit `R2.get("sites/8f3…/7/" + chemin)`.

### 3.3 Publier une nouvelle version, sans jamais casser le site en ligne

1. Le service atelier fabrique la version 8 et lance les cinq vérificateurs.
2. **S'il reste un bloquant, on s'arrête** : la version 7 reste en ligne, et
   l'app dit à l'artisan pourquoi.
3. Sinon, il envoie les fichiers dans `sites/<site>/8/`. Seuls les fichiers
   changés repartent : les images inchangées sont recopiées dans R2 sans être
   renvoyées. R2 est lisible dès l'écriture (« readers will immediately see
   the latest object »).
4. Il fait passer le pointeur KV de 7 à 8. KV peut mettre **jusqu'à 60
   secondes** pour être vu partout : pendant cette minute, certains visiteurs
   voient encore la version 7 en entier, **jamais un mélange des deux**.
5. Aucune purge de cache n'est nécessaire : le Worker range chaque fichier en
   cache sous une clé qui contient le numéro de version. Cela évite la limite du plan gratuit (5 purges par
   minute pour tout le compte).
6. On garde les deux dernières versions, pour pouvoir revenir en arrière d'un
   geste, et on efface les plus anciennes.

### 3.4 Le sous-domaine offert à chaque artisan

- Enregistrement DNS joker `*.domaine-sito.fr` (proxifié, tous plans), servi
  par le même Worker.
- Le certificat gratuit de Cloudflare couvre **un seul niveau** de
  sous-domaine : `dupont-plomberie.domaine-sito.fr` oui,
  `a.b.domaine-sito.fr` non.
- C'est l'adresse par défaut : elle existe dès la création du site, sans rien
  acheter.

### 3.5 Le domaine propre de l'artisan

1. Le service atelier crée un « custom hostname » par l'API Cloudflare :
   `POST /zones/{zone}/custom_hostnames` pour `www.son-domaine.fr`.
2. Chez le registrar : `www CNAME sites.domaine-sito.fr`. Si c'est nous qui
   avons acheté le domaine, c'est fait par API ; sinon l'artisan le fait,
   guidé par l'app.
3. Le certificat se valide tout seul par HTTP dès que le CNAME pointe, en
   quelques secondes à quelques minutes.
4. L'app interroge l'état jusqu'à `status = active` et `ssl.status = active`,
   puis affiche « Votre site est en ligne à www.son-domaine.fr ».
5. **Piège** : un domaine non validé est **supprimé par Cloudflare au bout de
   7 jours**. L'app le recrée et relance l'artisan.

**Le domaine sans `www`** (`son-domaine.fr`) ne peut pas être servi
directement par Cloudflare for SaaS hors offre Entreprise. Solution : le
registrar redirige `https://son-domaine.fr` vers `https://www.son-domaine.fr`.
Gandi le fait en HTTPS avec certificat automatique ; **OVH ne redirige pas une
adresse `https://`** (doc OVH, mars 2026). D'où le choix de Gandi en
section 4.

### 3.6 Ce que ça coûte

| Poste | Prix officiel relevé le 3 octobre 2026 |
|---|---|
| Workers payant | 5 $/mois, 10 millions de requêtes incluses, puis 0,30 $/million |
| R2 stockage | 10 Go/mois gratuits, puis 0,015 $/Go/mois |
| R2 écritures | 1 million/mois gratuites, puis 4,50 $/million ; 1 000 publications de 20 fichiers = 20 000 écritures |
| R2 sortie vers les visiteurs | gratuite |
| KV | 10 millions de lectures/mois incluses dans Workers payant |
| Cloudflare for SaaS | 100 domaines propres inclus, puis 0,10 $ par domaine et par mois, 50 000 au plus |

**Autre possibilité** : un seul projet Vercel Pro (20 $/mois). Il sait servir
le domaine sans `www`, mais limite à 100 ajouts de domaine par heure, et les
fichiers des sites devraient être stockés à part. Recommandé : Cloudflare.

---

## 4. Organiser les domaines

### 4.1 Trois cas dans l'app (écran « Mon adresse »)

| Cas | Ce que fait l'artisan | Ce que fait Sitô |
|---|---|---|
| **A. Adresse offerte** (par défaut) | rien | `nom-artisan.domaine-sito.fr` dès la création |
| **B. « Je veux mon domaine »** | tape le nom voulu, voit s'il est libre et son prix, confirme | achète le domaine **à son nom** chez Gandi par API, pose le CNAME, la redirection et le renouvellement automatique |
| **C. « J'ai déjà un domaine »** | ajoute un CNAME chez son registrar, suivant l'écran pas à pas | crée le custom hostname, vérifie, affiche l'état |

### 4.2 Les règles du .fr (charte Afnic, mai 2025)

- **Titulaire possible** : toute personne physique résidant dans l'UE, en
  Islande, au Liechtenstein, en Norvège ou en Suisse, et toute entreprise qui
  y a son siège ou son établissement principal. Un artisan français est donc
  éligible.
- **Le domaine est au nom de l'artisan**, qui en est le titulaire. Sitô gère
  le compte chez le registrar et est contact technique. C'est ce qui lui
  permet de partir avec son domaine.
- Pour une entreprise, on fournit le **SIREN et la raison sociale**, que la
  base connaît déjà.
- **L'e-mail du titulaire est celui de l'artisan**, pas celui de Sitô.
- Un entrepreneur individuel est titulaire en personne physique : par défaut,
  son nom n'est pas publié dans l'annuaire Whois.

### 4.3 Le registrar : Gandi (proposé)

Raisons :

- **la redirection `son-domaine.fr → www` marche en HTTPS**, ce qu'OVH ne fait
  pas ;
- l'API v5 couvre tout ce qu'il faut :
  - vérifier : `GET /v5/domain/check` ;
  - acheter, avec un objet `owner` qui reçoit les coordonnées de l'artisan :
    `POST /v5/domain/domains` ;
  - renouveler automatiquement : `PATCH …/autorenew` ;
  - donner le code de transfert : `PUT …/authinfo` ;
- le « compte revendeur » range chaque titulaire comme client.

Points à vérifier avant d'ouvrir le compte :

- le prix de renouvellement du .fr chez Gandi : sa page affiche 25,90 € TTC,
  incohérent avec la création à 7,20 € TTC ;
- l'endpoint API de la redirection ;
- passer « revendeur » est **irréversible**.

Pour comparer, OVH : création 5,99 € TTC, renouvellement 9,35 € TTC par an.

### 4.4 Quand l'artisan résilie

- Il **garde son domaine** puisqu'il en est titulaire.
- L'app lui donne le code de transfert, et lui dit jusqu'à quand le domaine
  est payé.
- On supprime le custom hostname Cloudflare. Une redirection temporaire vers
  son nouveau site est possible s'il le demande.
- Qui paie le domaine pendant l'abonnement : à décider (question 6).

---

## 5. Accepter toutes les photos : la solution

### 5.1 Ce que les appareils produisent

| Appareil | Formats |
|---|---|
| iPhone | **HEIC** par défaut, JPEG en réglage « Plus compatible », **ProRAW (DNG) de 25 à 75 Mo**, Live Photo (HEIC + vidéo), captures PNG, panoramas |
| Android | JPEG, **Ultra HDR** (JPEG + carte de gain), HEIF, AVIF, Motion Photo (image + vidéo collée à la fin), RAW DNG |
| Ordinateur | JPEG, PNG, WebP, AVIF, TIFF, BMP, GIF, HEIC (Mac) |

### 5.2 La règle : tout entre, tout ressort en JPEG/WebP propre

1. **Le champ d'envoi accepte tout** : `accept="image/*"` plus les extensions
   RAW (`.dng`, `.cr2`, `.cr3`, `.nef`, `.arw`), avec sélection multiple.
   Depuis un correctif WebKit de mars 2024, Safari envoie alors le HEIC tel
   quel, sans le convertir.
2. **Sur l'appareil d'abord** : ce que le navigateur sait afficher, l'app le
   convertit avant l'envoi. Safari sait afficher le HEIC ; tous les
   navigateurs savent afficher JPEG, PNG, WebP, GIF et BMP.
   - Conversion : redressée selon l'orientation, réduite à 3 000 px au plus,
     encodée en JPEG de haute qualité.
   - Le fichier envoyé est léger, ce qui compte en 4G sur un chantier.
   - Il ne contient plus aucune métadonnée, **dont la position GPS de la
     maison du client**.
3. **Sur le service atelier**, pour ce que le navigateur ne sait pas lire :
   - **HEIC envoyé depuis Android ou Windows** : conversion par les
     « transformations d'images » de Supabase, qui acceptent le HEIC en entrée
     (offre Pro). Cela évite de faire tourner nous-mêmes un décodeur HEVC,
     dont la situation en brevets n'est pas claire pour un usage commercial.
   - **RAW / DNG** : on en extrait l'aperçu JPEG intégré (`exiftool`,
     `-PreviewImage` puis `-JpgFromRaw`, en gardant le plus grand). Un fichier
     RAW n'apporte rien de plus à un site.
   - **Ultra HDR, Motion Photo, Live Photo** : la partie image est un JPEG
     ordinaire, la vidéo jointe est ignorée.
   - Puis `sharp` dans tous les cas : redressement, conversion des couleurs
     Display P3 vers sRGB (à vérifier sur une vraie photo d'iPhone), taille,
     WebP pour le site, toutes les métadonnées retirées.
4. **Rien n'est refusé en silence.** Un fichier vraiment illisible (corrompu,
   ou qui n'est pas une image) est signalé par son nom et sa cause, et les
   autres photos du lot passent quand même.

### 5.3 L'envoi depuis un chantier

- Envoi **reprenable** (protocole TUS, recommandé par Supabase, morceaux de
  6 Mo, lien valable 24 h).
- Le fichier choisi est gardé dans le stockage de l'app (IndexedDB) jusqu'à
  la fin de l'envoi. Si l'iPhone met l'app en veille ou si le réseau coupe,
  l'envoi reprend à la réouverture : l'iPhone ne permet pas l'envoi en
  arrière-plan pour une app web.
- La version réduite part en premier, pour que le site se mette à jour vite.
  L'original suit.
- **Supabase gratuit limite un fichier à 50 Mo** : un ProRAW de 75 Mo ne passe
  pas. Avec le plan Pro, la limite se règle par espace de stockage : proposé
  150 Mo pour `photos-chantiers`, au lieu des 15 Mo actuels.
- **Les photos de Supabase ne sont pas dans ses sauvegardes**, même en Pro.
  Le service atelier recopie chaque original dans R2.

### 5.4 Les essais avant de dire que c'est fini

Un jeu de fichiers réels, envoyé depuis un iPhone, un Android et un
ordinateur :

- HEIC ;
- ProRAW ;
- Live Photo ;
- Ultra HDR ;
- PNG ;
- TIFF ;
- BMP ;
- un fichier corrompu ;
- un PDF renommé en `.jpg`.

Pour chacun, on vérifie qu'il apparaît dans le site, sans GPS, dans le bon
sens, aux bonnes couleurs, ou qu'il est refusé avec un message qui dit
pourquoi.

---

## 6. Avis, fiche et statistiques Google

### 6.1 Qui demande l'accès à Google

**L'éditeur de Sitô**, c'est-à-dire Fabrice et l'entreprise qui facturera
l'abonnement (question 1). Condition officielle de Google (août 2026), mot
pour mot :

> « Manage a Google Business Profile that is verified and active for 60+
> days. This GBP can be the applicant's own office or headquarters or it
> could belong to one of the clients they manage. »

Il n'est donc **pas nécessaire d'avoir sa propre fiche**. Il suffit d'être
**gestionnaire** de la fiche vérifiée, depuis plus de 60 jours, d'un artisan
client, qui ajoute l'adresse e-mail de Sitô comme gestionnaire. Google
recommande d'être gestionnaire, pas propriétaire.

### 6.2 Ce qu'il faut préparer

1. Un **artisan pilote** dont la fiche Google est vérifiée depuis plus de 60
   jours, qui ajoute l'e-mail de Sitô comme gestionnaire.
2. **Une adresse e-mail sur le domaine de Sitô** : un e-mail qui ne
   correspond pas au site est une cause de refus citée.
3. **Le site de Sitô en ligne**, avec sa politique de confidentialité.
4. Un **projet Google Cloud** : noter son numéro et son identifiant.
5. Le formulaire `https://support.google.com/business/contact/api_default`,
   option « Application for Basic API Access ». Examen annoncé en 14 jours.
6. Ensuite, l'écran de consentement Google, vérifié avec une **vidéo de
   démonstration**. Google annonce 3 à 5 jours ouvrés pour un accès
   « sensible ».

### 6.3 Ce que l'app fera avec l'accès

- **Avis** : lecture et réponse (`accounts.locations.reviews.list` et
  `updateReply`, API v4). La bibliothèque Node de Google ne couvre pas cette
  API : deux appels à écrire à la main.
- **Fiche** : lecture d'abord, puis correction de ce qui contredit le site
  (nom, adresse, téléphone, prestations).
- **Statistiques Google** : vues, appels depuis la fiche, itinéraires,
  mots-clés de recherche. Affichées à part des visites du site, jamais
  additionnées.
- **Règle Google** : répondre aux avis au nom de l'artisan exige **son
  autorisation**. Elle figure dans les conditions d'utilisation et dans le
  consentement Google.
- Jeton de chaque artisan **chiffré** dans la base.

### 6.4 Les risques, et l'app sans Google

- Un blog (mai 2026) affirme que seul un propriétaire peut demander, ce qui
  contredit la page officielle.
- Des développeurs signalent en août-septembre 2026 que **l'API des avis
  reste impossible à activer même après approbation** : c'est un forum, sans
  réponse de Google.
- Donc **l'app est construite pour marcher sans Google**. Elle affiche un
  lien direct vers la fiche pour que l'artisan réponde lui-même.
- En lecture seule, l'API Places donne 5 avis au plus : 1 000 lectures
  gratuites par mois, puis 25 $ les 1 000, avec des règles d'affichage
  strictes, dont la date de visite en France.

---

## 7. Le reste de l'app

### 7.1 Les écrans (iPhone d'abord, marche aussi sur Android et ordinateur)

| Écran | Contenu |
|---|---|
| Accueil | appels, demandes, visites de la semaine ; la dernière demande en haut |
| Mes chantiers | créer un chantier, ajouter une paire avant/après, voir l'aperçu dans le site |
| Mon site | aperçu, état (en ligne, en cours, refusé et pourquoi), téléphone, case « afficher mes prix », tarifs |
| Mon adresse | les trois cas de la section 4.1 |
| Mes avis | liste, note, date, réponse (section 6) |
| Ma fiche Google | état, ce qui manque, ce qui contredit le site |
| Abonnement | formule, échéance, portail Stripe |
| Compte | mentions légales, export de ses données, suppression |

### 7.2 L'app elle-même (proposé)

- Une **app web installable** (PWA), écrite en React. Elle s'ouvre sur
  iPhone, Android et ordinateur sans passer par un store.
- Depuis iOS 26, tout site ajouté à l'écran d'accueil s'ouvre comme une app.
  Les notifications sur iPhone ne marchent qu'une fois l'app ajoutée à
  l'écran d'accueil.
- Si un jour il faut être dans l'App Store, la même app s'emballe avec
  Capacitor (99 $/an chez Apple, 25 $ une fois chez Google).

### 7.3 Connexion

- Par **code ou lien reçu par e-mail**, avec un serveur d'envoi à nous
  (Brevo ou équivalent) : celui de Supabase n'envoie que 2 e-mails par heure.
- Par SMS en option : environ 8 centimes par code vers la France.

### 7.4 Les statistiques du site

- **Visites** : Umami, hébergé par nous. Logiciel libre, sites illimités,
  créés par API. C'est une mesure sans cookie, exemptée de consentement par
  la CNIL, à trois conditions :
  - un site Umami distinct par artisan, et aucun suivi d'un site à l'autre ;
  - des traceurs gardés 13 mois au plus ;
  - des données gardées 25 mois au plus.
- **Appels** : clic sur « Appeler », compté par Umami (`data-umami-event`).
- **Demandes** : comptées dans la base, là où le formulaire les écrit.
- Les jours se comptent **en heure de Paris**, pas en UTC. Sinon tout ce qui
  arrive entre minuit et 2 h tombe sur la veille.

### 7.5 La base : ce qui s'ajoute aux douze tables

| Table | Rôle |
|---|---|
| `abonnements` | **une seule** source pour la formule et l'état de paiement, écrite par une seule fonction |
| `evenements_stripe` | un événement Stripe rejoué n'écrit rien deux fois |
| `demandes` | les messages du formulaire du site |
| `adresses` | sous-domaine, domaine propre, état du certificat, registrar, échéance |
| `versions_site` | version en ligne, version précédente, résultat des vérificateurs |
| `connexions_google` | jeton chiffré, compte, fiche, état |
| `profils` : + SIRET affiché, n° de TVA, assurance décennale, médiateur de la consommation | les **mentions légales obligatoires** du site de l'artisan |
| `suppressions` | suppression de compte en 30 jours, réversible |

Chaque table nouvelle reçoit ses droits dans la même migration, et entre
dans l'export et la suppression RGPD, avec un essai.

### 7.6 Abonnement et facture électronique

- **Stripe Checkout et portail client**, en français : résiliation en ligne,
  changement de carte, téléchargement des factures.
- Frais en France : 1,5 % + 0,25 € par carte, plus 0,7 % pour les
  abonnements.
- **Le prix affiché est lu chez Stripe**, un essai compare les deux. Un
  événement inconnu ne donne jamais accès à une formule payante.
- **Facture électronique** : obligation de recevoir depuis le 1er septembre
  2026, d'émettre pour les PME au 1er septembre 2027. Stripe seul ne suffit
  pas : il faut une plateforme agréée, par exemple Billit, partenaire de
  Stripe.

---

## 8. Comptes à ouvrir

Rien de payant n'est ouvert sans l'accord de Fabrice.

| Compte | Coût | Quand |
|---|---|---|
| Domaine de Sitô | à choisir | d'abord : e-mail, site, sous-domaines en dépendent |
| Cloudflare (zone Sitô, Workers payant, R2) | 5 $/mois + usage | à la première publication |
| Supabase Pro | 25 $/mois | avant le premier client (pas de sauvegarde en gratuit, pause après 7 jours) |
| Hébergement du service atelier (Railway ou équivalent) | prix à relever | dès le service |
| Gandi (revendeur) | domaines au prix public | au premier domaine propre |
| Serveur d'e-mail (Brevo ou équivalent) | prix à relever | dès la connexion par e-mail |
| Google Cloud + demande d'accès | gratuit | dès qu'un artisan pilote a une fiche de 60 jours |
| Stripe, puis plateforme agréée de facture électronique | frais par paiement | au premier abonnement |
| Umami | hébergé par nous | avec le service atelier |

## 9. Ordre de construction

Chaque étape finit par une preuve, pas par une affirmation.

| # | Étape | Fini quand |
|---|---|---|
| 1 | Domaine de Sitô, zone Cloudflare, Worker, R2 | le site de démonstration est en ligne à `x.domaine-sito.fr` ; une version cassée exprès est refusée et l'ancienne reste |
| 2 | Migrations de la section 7.5 | `essais/droits.sql` étendu, tous conformes |
| 3 | Service atelier : fabriquer depuis la base, publier par version | une publication change de version en moins de 2 minutes, sans mélange |
| 4 | Formulaire de contact et `demandes` | une demande du site arrive en base ; un robot est refusé |
| 5 | App : connexion, téléphone, prix et tarifs | Fabrice change son téléphone sur iPhone, le site republié l'affiche |
| 6 | Photos : la section 5 en entier | les fichiers d'essai du 5.4 passent tous, depuis iPhone, Android et ordinateur |
| 7 | Statistiques Umami et accueil | les chiffres de l'accueil égalent Umami et la base pour le même jour de Paris |
| 8 | Domaines : cas B et C | un domaine d'essai acheté et un domaine existant branchés, certificat valide, `https://domaine.fr` redirigé |
| 9 | Abonnement Stripe | paiement test, événement rejoué sans double écriture, prix affiché = prix débité |
| 10 | Compte : export, suppression, mentions légales | suppression annulée puis menée à terme sur un compte d'essai |
| 11 | Google, dès l'accès accordé | un avis réel lu et une réponse publiée, avec l'accord de l'artisan pilote |

Les étapes 1 à 10 n'attendent pas Google.

---

## 10. Questions pour Fabrice

1. **Qui édite Sitô** : quelle entreprise, avec quel SIRET, facture
   l'abonnement et demande l'accès Google ? Pas de recommandation : c'est à
   toi de le dire.
2. **Nom de domaine de Sitô** : lequel ? C'est le premier achat, tout en
   dépend.
3. **Hébergement** : Cloudflare, avec un seul Worker et R2, comme décrit en
   section 3 ? **Recommandé : oui.**
4. **Registrar** : Gandi, pour la redirection HTTPS du domaine sans `www` ?
   **Recommandé : oui.**
5. **Adresse par défaut** : chaque artisan reçoit `nom.domaine-sito.fr`, le
   domaine propre en option ? **Recommandé : oui.**
6. **Domaine propre** : inclus dans l'abonnement, ou payé à part par
   l'artisan (environ 6 à 10 € par an) ? **Recommandé : inclus**, c'est
   simple à vendre et le coût est faible.
7. **Vidéos** : une Live Photo ou une Motion Photo donne sa photo. Faut-il
   aussi accepter et montrer des vidéos de chantier sur le site ?
   **Recommandé : les accepter et les garder dès maintenant, les montrer plus
   tard.**
8. **Artisan pilote** : connais-tu un artisan avec une fiche Google vérifiée
   depuis plus de 60 jours, prêt à ajouter Sitô comme gestionnaire ?
9. **App** : web installable (React), emballée plus tard pour l'App Store si
   besoin ? **Recommandé : oui.**
10. **Réponses aux avis** : réponse préparée par l'IA, relue et validée par
    l'artisan, ou l'artisan écrit seul ? **Recommandé : réponse préparée,
    jamais envoyée sans lui.**
11. **Prix de l'abonnement**, au mois et à l'année : c'est ta décision.
12. **Supabase Pro** (25 $/mois) au premier client ? **Recommandé : oui.**

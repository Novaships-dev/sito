# Recherche web — plan de l'app Sitô (3 octobre 2026)

Méthode : WebSearch / WebFetch uniquement. Légende : **[OFFICIEL]** = doc officielle de l'éditeur ; **[BLOG]** = blog / article tiers ; **[FORUM]** = forum / discussion. « non trouvé » = je n'ai pas trouvé de source fiable. Les dates sont celles affichées sur la page (« Last updated ») quand elles étaient visibles.

---

## 1. API Google Business Profile (GBP) en 2026

### 1.1 Obtenir l'accès
- **[OFFICIEL]** https://developers.google.com/my-business/content/prereqs (màj 2026-08-28)
  - Demande via le **formulaire de contact GBP API**, option « Application for Basic API Access », avec le **numéro de projet Google Cloud**.
  - Conditions : « Manage a Google Business Profile that is verified and active for 60+ days » ; avoir un **site web** représentant l'entreprise de la fiche ; utiliser une adresse e-mail **propriétaire/gestionnaire** de cette fiche.
  - Conséquence pour Sitô : c'est **l'éditeur de Sitô** (le demandeur) qui doit avoir sa propre fiche GBP vérifiée depuis 60 jours et un site. À anticiper tout de suite.
  - Délai : aucun délai officiel (« A follow-up email will be sent to you after your request has been reviewed »).
  - Indicateur : quota **0 QPM = pas encore approuvé**, **300 QPM = approuvé**.
- **[BLOG]** slashpost.ai, 11 mai 2026 (https://slashpost.ai/blogs/google-business-profile/google-business-profile-api-documentation-2026) : délai « a few days to a few weeks » ; refus fréquents pour cas d'usage flou, numéro de projet erroné, scopes demandés non utilisés.

### 1.2 Quotas par défaut
- **[OFFICIEL]** https://developers.google.com/my-business/content/limits (màj 2026-08-28)
  - 300 QPM pour chacune : Business Information, Account Management, Performance, Verifications, Lodging, Place Actions, Notifications.
  - Business Information : Create Location 300/jour ; SearchGoogleLocation 300/jour ; Update Location 10 000/jour ; **10 modifications/minute par fiche (non augmentable)**.

### 1.3 Activer les API et scope OAuth
- **[OFFICIEL]** https://developers.google.com/my-business/content/basic-setup (màj 2026-08-28) : 7 API à activer — Google My Business API (v4), My Business Account Management API, Lodging, Place Actions, Notifications, Verifications, **My Business Business Information API**.
- **[OFFICIEL]** https://developers.google.com/my-business/content/implement-oauth (màj 2026-08-28) : scope **`https://www.googleapis.com/auth/business.manage`** (l'ancien `plus.business.manage` est déprécié). Accès **hors ligne** recommandé : stocker le **refresh token** de chaque artisan en base pour agir quand il n'est pas connecté. La doc décrit explicitement qu'une « partner platform or application can access and modify location data with explicit consent from the business owner » → **un SaaS tiers peut gérer les fiches de ses clients via OAuth** (consentement de chaque artisan), y compris répondre aux avis.

### 1.4 Lire les avis et y répondre
- **[OFFICIEL]** https://developers.google.com/my-business/content/review-data (màj 2026-08-28) — **toujours l'API v4** :
  - Lire : `GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews` (`accounts.locations.reviews.list`).
  - Répondre : `PUT .../reviews/{reviewId}/reply` (`accounts.locations.reviews.updateReply`) ; suppression de réponse possible (`deleteReply`).
  - Aucune note de dépréciation sur la page.
- **[BLOG]** slashpost.ai (mai 2026) : Reviews v4 « fully operational » ; **l'API Q&A a été arrêtée le 3 novembre 2025**, sans remplaçant annoncé.

### 1.5 Lire / modifier la fiche
- **[OFFICIEL]** https://developers.google.com/my-business/reference/businessinformation/rest/v1/locations/patch (màj 2024-10-16) : `PATCH https://mybusinessbusinessinformation.googleapis.com/v1/locations/{id}` avec `updateMask` (liste des champs) et `validateOnly` ; scope `business.manage`. Lecture via `locations.get` / `accounts.locations.list` (même API).

### 1.6 Performance API (vues, appels, itinéraires)
- **[OFFICIEL]** https://developers.google.com/my-business/reference/performance/rest (màj 2024-10-16) : endpoint `https://businessprofileperformance.googleapis.com` ; méthodes `fetchMultiDailyMetricsTimeSeries` (plusieurs métriques en un appel), `getDailyMetricsTimeSeries`, `searchkeywords.impressions.monthly` (mots-clés de recherche mensuels).
- **[OFFICIEL]** https://developers.google.com/my-business/reference/performance/rest/v1/DailyMetric : métriques quotidiennes — impressions Maps/Search × mobile/desktop, `CALL_CLICKS` (clics sur « appeler » de la fiche), `WEBSITE_CLICKS`, `BUSINESS_DIRECTION_REQUESTS` (itinéraires), `BUSINESS_CONVERSATIONS`, `BUSINESS_BOOKINGS`, `BUSINESS_FOOD_MENU_CLICKS`.
- Profondeur d'historique disponible : non trouvé sur la doc consultée.

### 1.7 Vérification de l'app OAuth par Google
- **[OFFICIEL]** https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification (màj 2026-08-19) : un scope sensible exige politique de confidentialité sur le domaine de l'app, page d'accueil publique, domaine vérifié dans Search Console, **vidéo de démo** YouTube non répertoriée ; « typically takes 3-5 business days ».
- Classement de `business.manage` (sensible / restreint) : **non confirmé par la doc officielle** (non trouvé dans la page des scopes consultée, page tronquée).
- **[FORUM]** discuss.google.dev, 23 juillet et 17 août 2026 (https://discuss.google.dev/t/oauth-business-manage-shown-as-non-sensitive-in-auth-platform-but-backend-blocks-all-external-users-with-error-403-access-denied-no-submit-for-verification-path-exists/384175) : `business.manage` affiché « non-sensitive » dans la console, mais **erreur 403 access_denied pour tous les utilisateurs externes** (seuls les test users passent), sans chemin de soumission ; **non résolu**. → Risque réel de blocage : prévoir un plan B et tester tôt avec un artisan externe.

### 1.8 Alternative si l'accès est refusé : Places API (New)
- **[OFFICIEL]** https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places : champ `reviews` = « List of reviews about this place, sorted by relevance. A maximum of 5 reviews can be returned. » → **lecture seule, 5 avis max, pas de réponse possible**, pas d'accès à la fiche ni aux stats.
- **[OFFICIEL]** https://developers.google.com/maps/documentation/places/web-service/place-details (màj 2026-09-28) : le champ `reviews` déclenche le SKU **Place Details Enterprise + Atmosphere**.
- **[OFFICIEL]** https://developers.google.com/maps/billing-and-pricing/pricing (màj 2026-09-28) : ce SKU = **1 000 événements gratuits/mois**, puis **25,00 $ / 1 000** (0–100 000/mois), dégressif jusqu'à 2,28 $ / 1 000 au-delà de 5 M.
- **[OFFICIEL]** https://developers.google.com/maps/documentation/places/web-service/policies (màj 2026-09-28) : afficher l'auteur (avatar, nom, lien), attribution « Google Maps », lien `googleMapsUri`, avertissement que les avis ne sont pas vérifiés par Google, explication de l'ordre/filtrage ; **pour la France : afficher la `visitDate` (mois/année)** ; signalement via `flagContentUri`. Pas besoin de carte Google. Seul le **place ID** peut être stocké indéfiniment ; le reste suit la limite de cache de 30 jours des conditions Maps Platform.
- Autre plan B : l'artisan répond à ses avis lui-même dans l'app Google Maps / Google Business ; Sitô se contente d'un lien profond. (suggestion, pas une source)

---

## 2. Statistiques de site sans bandeau cookies (France)

### 2.1 Cadre CNIL (exemption de consentement)
- **[OFFICIEL]** CNIL, « Cookies : solutions pour les outils de mesure d'audience » (màj 4 juillet 2025) — https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience
  - Exemption si : mesure d'audience **pour l'usage exclusif de l'éditeur**, données **uniquement statistiques anonymes**, **pas de recoupement** avec d'autres traitements ni de transmission de données non anonymisées à des tiers, **pas de suivi de navigation entre plusieurs sites** avec un identifiant commun.
  - Recommandations : informer les personnes (politique de confidentialité), traceurs ≤ **13 mois** sans prorogation automatique, données conservées ≤ **25 mois**.
  - La CNIL fournit un **outil d'auto-évaluation** pour les éditeurs de solutions ; elle ne « certifie » aucun outil. → Demander au fournisseur sa documentation de conformité.
  - Point d'attention pour Sitô : **un script/identifiant commun à tous les sites artisans ne doit pas permettre de suivre un internaute d'un site à l'autre** (un « site » distinct par artisan dans l'outil, sans identifiant transverse).
  - Je n'ai pas pu vérifier sur la page une liste nominative d'outils « validés » (le résumé automatique en citait, mais je ne le considère pas fiable) → non confirmé.

### 2.2 Outils (prix et API)
| Outil | Prix 2026 | Multi-sites / API | Source |
|---|---|---|---|
| **Plausible** (cloud) | Starter 9 $/mois (1 site), Growth 14 $ (3 sites), Business 19 $ (10 sites, **Stats API 600 req/h**), Enterprise sur devis ; palier 10 k pages vues ; annuel = 2 mois offerts | **Stats API seulement à partir de Business** ; **Sites API (créer des sites par API) = Enterprise uniquement** | [OFFICIEL] https://plausible.io/ (section tarifs), https://plausible.io/docs/sites-api |
| **Umami Cloud** | Hobby gratuit : « 100k events a month on 3 sites with 6 months retention » ; Pro 20 $/mois (vérifié 7 août 2026) | API Cloud par clé sur `https://api.umami.is` ; « Any operation you can do through the application is available in the API » (sites, stats, pageviews, events, metrics) | [BLOG] https://canivibecodeit.com/umami-cloud ; [OFFICIEL] https://docs.umami.is/docs/api |
| **Umami auto-hébergé** | Logiciel gratuit (« self-hosting is always free ») ; coût = serveur + Postgres (peut viser la même instance Postgres ou une instance dédiée) | Même API (auth par token de login), **sites illimités**, création de site par API | [OFFICIEL] umami.is (métadonnées de la page tarifs), docs.umami.is |
| **Cloudflare Web Analytics** | Gratuit, « Available on all plans » | API GraphQL ; **limite souple de 10 sites par compte** (augmentable via support) ; **pas d'événements personnalisés** (« Not yet ») ; 6 mois d'historique agrégé | [OFFICIEL] https://developers.cloudflare.com/web-analytics/faq/ (màj 14 juillet 2026) |
| **GoatCounter** | Hébergé « currently offered for free » pour usage raisonnable ; plans payants mentionnés sans prix visible (page tarifs en 404) | API REST : `/api/v0/stats/total`, `/stats/hits`, création de sites `/api/v0/sites` ; **4 req/s** ; dépôt arp242/goatcounter ~6 000 étoiles | [OFFICIEL] https://www.goatcounter.com/ , https://www.goatcounter.com/api |
| **Matomo** | Auto-hébergé gratuit (sites/hits illimités) ; Cloud Business à partir de 26 $/mois pour 50 000 hits (-17 % en annuel) | API Reporting Matomo (non vérifiée ici) ; nombre de sites inclus en Cloud : non trouvé | [BLOG] https://frontdeskreview.com/software/web-analytics/matomo/ (vérifié sept. 2026) |

Lecture pour Sitô : pour des centaines de sites avec lecture par API depuis l'app, **Plausible cloud devient cher/limité** (Sites API en Enterprise), **Cloudflare Web Analytics ne convient pas** (10 sites, pas d'événements). **Umami auto-hébergé** (ou GoatCounter) est le meilleur rapport coût/contrôle ; Umami Cloud Pro possible au démarrage.

### 2.3 Compter les clics « appeler » (tel:) et les demandes
- **[OFFICIEL]** Umami : attribut `data-umami-event="Appel"` sur le lien `<a href="tel:...">` ou `umami.track('Appel')` ; noms d'événements ≤ 50 caractères — https://docs.umami.is/docs/track-events
- **[OFFICIEL]** Plausible : classe `plausible-event-name=Appel` ou `plausible('Appel')` ; suivi auto des liens sortants, téléchargements et **soumissions de formulaire** (option du site) ; il faut créer un « goal » du même nom ; **les événements comptent dans le quota de pages vues** — https://plausible.io/docs/custom-event-goals
- Demandes de formulaire : la source fiable est **la table des demandes en base (Supabase)** écrite par la fonction qui reçoit le formulaire ; l'événement analytics n'est qu'un complément. (recommandation, pas une source)
- Les **appels depuis la fiche Google** sont à lire via `CALL_CLICKS` de la Performance API (§1.6), distincts des clics tel: du site.

---

## 3. Hébergement de centaines / milliers de sites statiques avec domaine propre

### 3.1 Cloudflare
- **Pages** — [OFFICIEL] https://developers.cloudflare.com/pages/platform/limits/ (màj 2026-09-05)
  - **« Cloudflare Pages has a limit of 100 projects per account. This limit is not routinely increased. »** → **un projet Pages par artisan ne passe pas à l'échelle.**
  - Domaines personnalisés **par projet** : Free 100, Pro 250, Business 500.
  - Builds/mois : Free 500, Pro 5 000, Business 20 000 (inutile si on construit en Node chez nous et qu'on pousse le résultat).
  - Fichiers par site : 20 000 (Free) / 100 000 (payant) ; 25 Mio max par fichier.
- **Workers + Static Assets** — [OFFICIEL] https://developers.cloudflare.com/workers/platform/limits/ (màj 2026-09-05)
  - Workers par compte : **Free 100 / Paid 500** ; « Custom domains » : **100 par zone** ; 1 000 routes par zone ; 20 000 / 100 000 fichiers par version.
  - [OFFICIEL] https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ (màj 2026-04-23) : **« Requests to static assets are free and unlimited. »**
  - [OFFICIEL] https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/ (màj 2026-09-22) : Workers offre « a distinctly broader set of features » ; coût similaire à Pages. Pas de déclaration explicite de fin de Pages.
  - Déploiement par API sans Wrangler — [OFFICIEL] https://developers.cloudflare.com/workers/static-assets/direct-upload/ : (1) `assets-upload-session` avec manifeste (chemins + SHA-256 + taille) → JWT 1 h + liste des fichiers manquants ; (2) upload multipart base64 sur `/workers/assets/upload?base64=true` → completion token ; (3) déploiement du Worker avec ce token (ou `keep_assets: true`). Les fichiers déjà envoyés ne sont pas renvoyés (déduplication).
- **Workers for Platforms** (multi-locataires) — [OFFICIEL] https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/platform/pricing/ : **25 $/mois**, inclus 20 M requêtes, 60 M ms CPU, **1 000 scripts** ; puis 0,30 $/M requêtes, 0,02 $/script supplémentaire.
- **Cloudflare for SaaS (domaines des clients)** — [OFFICIEL] https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/ (màj 2026-08-14) : **100 custom hostnames inclus** (Free/Pro/Business), **0,10 $ par hostname supplémentaire**, max 50 000 (au-delà : Enterprise). Certificats SSL gérés pour le domaine de l'artisan.
- Architecture qui découle de ces limites (déduction, pas une source) : **un seul Worker « routeur »** (ou Workers for Platforms) qui sert le site selon le `Host`, fichiers stockés par artisan (R2 ou assets), + **Cloudflare for SaaS** pour les domaines propres. Évite les plafonds de 100 projets Pages / 500 Workers / 100 domaines par zone.

### 3.2 Vercel
- [OFFICIEL] https://vercel.com/docs/limits (màj 2026-09-16) : projets Hobby 200 / Pro illimités ; **domaines par projet : Hobby 50, Pro « illimités »** (limite souple 100 000/projet) ; déploiements API/jour : Free 100, **Pro 6 000** ; upload CLI : 100 Mo Hobby / 1 Go Pro.
- [OFFICIEL] https://vercel.com/pricing : **Hobby = non commercial** (donc exclu pour Sitô), **Pro 20 $/mois** avec 20 $ de crédit d'usage. → Un seul projet Vercel Pro peut porter des milliers de domaines (routage par hostname via middleware/rewrites).

### 3.3 Netlify
- [OFFICIEL] https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/ (màj 2026-09-01) : plans à crédits — Free 0 $ (300 crédits), Personal 9 $ (1 000), Pro dès 20 $ (3 000 crédits) … 126 $ (20 000). **Déploiement en production = 15 crédits**, bande passante 20 crédits/Go, 2 crédits/10 000 requêtes, **soumissions de formulaire gratuites et illimitées**. **500 projets max par compte** sur tous les plans.
  → Republier souvent des centaines de sites coûte cher en crédits (ex. 1 000 republications = 15 000 crédits). Netlify Forms est un atout mais le modèle est peu adapté.

### 3.4 Formulaire de contact sans serveur
- Cloudflare Worker (même Worker que le site) ou **Supabase Edge Function** qui insère la demande en base + envoie un e-mail (limites Edge Functions au §6).
- Anti-spam : [OFFICIEL] Cloudflare Turnstile https://developers.cloudflare.com/turnstile/plans/ (màj 2026-08-14) — gratuit, mais **20 widgets max par compte et 10 hostnames par widget** sur le plan gratuit → **≈ 200 domaines max** ; à prévoir (contacter Cloudflare, ou anti-spam maison : champ piège + limitation de débit).
- Netlify Forms gratuit illimité (voir 3.3) si hébergé chez Netlify.

### 3.5 Achat de domaines par API
- **Cloudflare Registrar API** : [OFFICIEL] changelog 15 avril 2026 https://developers.cloudflare.com/changelog/post/2026-04-15-registrar-api-beta/ et https://developers.cloudflare.com/registrar/registrar-api/ (màj 2026-09-16) — **l'achat par API existe désormais (bêta)** : `domain-search`, `domain-check`, `POST /registrar/registrations`, statut. Limites bêta : **sous-ensemble d'extensions** (exemples .com, .dev, .app), **pas de renouvellement, transfert ni modification de contacts par API**, paiement sur le moyen de paiement par défaut du compte, prix coûtant. [BLOG] https://blog.cloudflare.com/registrar-api-beta/ : extension prévue « later this year » pour les créateurs de sites.
  - **.fr : non listé** dans les TLD gérés par Cloudflare Registrar ([OFFICIEL] https://www.cloudflare.com/tld-policies). → **Bloquant pour des artisans français qui veulent un .fr.**
- **OVHcloud API** : [OFFICIEL] https://docs.ovhcloud.com/en/guides/web-cloud/domains/api-domain-order (màj 2026-02-10) — `POST /order/cart` → `GET/POST /order/cart/{cartId}/domain` → configuration requise (`requiredConfiguration`) → `GET .../checkout` (simulation) → `POST .../checkout` avec `autoPayWithPreferredPaymentMethod` et `waiveRetractationPeriod`. Gère le .fr (registrar français). OVH propose aussi un serveur MCP domaines (guide « mcp-domain-getting-started »).
- **Gandi API v5** : [OFFICIEL] https://api.gandi.net/docs/domains/ — `GET /v5/domain/check` (disponibilité + prix HT/TTC), `POST /v5/domain/domains` (enregistrement payant) ; auth par **Personal Access Token** (clé API dépréciée) ; paramètres spécifiques mentionnés pour .fr.
- Prix unitaires .fr/.com chez OVH/Gandi en 2026 : non relevés.

---

## 4. App de l'artisan : PWA vs Expo/React Native vs Capacitor

### 4.1 PWA sur iPhone (2026)
- **Installation** — [BLOG] Michael Tsai, 3 oct. 2025 (https://mjtsai.com/blog/2025/10/03/web-apps-in-ios-26/) : depuis **iOS 26**, « every website added to the Home Screen opens as a web app » par défaut, même sans manifeste ; l'utilisateur peut décocher « Open as Web App ».
- **Toujours pas d'invite d'installation automatique** sur Safari (`beforeinstallprompt` non supporté) : l'artisan doit faire Partager → « Sur l'écran d'accueil » — [BLOG] mobiloud.com (https://www.mobiloud.com/blog/progressive-web-apps-ios/ — titre « 2026 », date affichée 14 mars 2024, contenu mis à jour avec Safari 18.4).
- **Push web** : [OFFICIEL] WebKit « Meet Declarative Web Push » (27 mars 2025) https://webkit.org/blog/16535/meet-declarative-web-push/ — Web Push « for web apps saved to the Home Screen on iOS and iPadOS » (depuis iOS 16.4) ; **Declarative Web Push** (sans service worker obligatoire) testable dès **iOS/iPadOS 18.4**. → Sur iPhone, **pas de push tant que l'app n'est pas sur l'écran d'accueil**. Pastille (Badging API) supportée.
- Limites (BLOG mobiloud) : pas de Background Sync / Background Fetch ; stockage local purgeable en cas de manque d'espace ; audience push « roughly 10-15x smaller » que le natif (estimation du blog) ; pas de PWA sur l'App Store (règle 4.2.2).
- **Appareil photo / galerie** : `<input type="file" accept="image/*" capture>` ouvre l'appareil photo ou la photothèque (accès caméra au premier plan cité par mobiloud).
- **HEIC en PWA** : [FORUM] Apple Developer Forums https://developer.apple.com/forums/thread/743049 — si `accept` contient explicitement `image/heic`, Safari 17+ **convertit même les JPEG en HEIC** ; avec seulement `image/*` ce n'est pas le cas. [FORUM] Hacker News (https://news.ycombinator.com/item?id=23268189) : avec un `accept` en types JPEG, Safari convertit le HEIC en JPEG à l'envoi — comportement non documenté officiellement par Apple (non confirmé). → Ne pas compter dessus : convertir côté serveur (§5).
- UE / DMA : [BLOG] mobiloud — Apple avait retiré les web apps écran d'accueil dans l'UE en bêta iOS 17.4 puis les a rétablies.

### 4.2 Expo / React Native
- [OFFICIEL] **Expo SDK 57** sorti le **30 juin 2026** (React Native 0.86), version « small, focused », sans rupture — https://expo.dev/changelog/sdk-57
- [OFFICIEL] **SDK 58 en bêta depuis le 15 sept. 2026** (React Native 0.88 RC), cible **iOS 27** (cycle de vie UIKit « scenes » obligatoire) — https://expo.dev/changelog/sdk-58-beta. → La version stable devrait sortir d'ici quelques semaines.
- [OFFICIEL] **EAS** https://expo.dev/pricing : Free 0 $ (15 builds Android + 15 iOS/mois, file basse priorité, 1 000 MAU EAS Update) ; Starter 19 $/mois + usage (45 $ de crédit build, 3 000 MAU) ; Production 199 $/mois (225 $ de crédit, 50 000 MAU).
- [OFFICIEL] **Apple Developer Program : 99 $/an** — https://developer.apple.com/programs/ ; revue : « On average, 90% of submissions are reviewed in less than 24 hours » — https://developer.apple.com/distribute/app-review/
- [OFFICIEL] **Google Play : 25 $ une fois** — https://support.google.com/googleplay/android-developer/answer/6112435 ; **comptes personnels créés après le 13/11/2023 : test fermé avec ≥ 12 testeurs pendant 14 jours** avant la production (ne s'applique pas aux comptes organisation) ; examen de la demande « seven days or less » — https://support.google.com/googleplay/android-developer/answer/14151465 → **ouvrir le compte au nom de l'éditeur de Sitô (organisation)**.
- Inscription Apple en organisation : exigence D-U-N-S non vérifiée ici (page d'inscription en 404) → non trouvé.

### 4.3 Capacitor
- [OFFICIEL] Ionic blog, **Capacitor 8.5** (31 juillet 2026) — https://ionic.io/blog/capacitor-8-5-released : adoption UIScene pour iOS 27 (`npx cap migrate`) ; **Capacitor 9 prévu « towards the end of the year »**. Plugin caméra officiel `@capacitor/camera` (v8.x).
- Intérêt : réutiliser une PWA web existante et l'emballer pour l'App Store (push natif fiable). Mêmes frais Apple/Google que Expo.

### 4.4 Le plus simple pour un artisan (synthèse, pas une source)
- PWA : rien à installer depuis un store, mais geste « Ajouter à l'écran d'accueil » à expliquer, et push seulement après ce geste.
- App native (Expo ou Capacitor) : installation familière depuis l'App Store, push fiable, appareil photo natif ; coût 99 $/an + 25 $, revue Apple (souvent < 24 h) et, si compte Google perso, 14 jours de test fermé.
- Chemin pragmatique : **commencer en PWA** (même code web, déploiement immédiat, Fabrice teste sur son iPhone), garder **Expo** (déjà maîtrisé avec StructorAI) ou Capacitor comme étape 2 si les notifications d'avis sont jugées indispensables.

---

## 5. Photos iPhone : HEIC, EXIF/GPS, redimensionnement

### 5.1 Support HEIC
- **Navigateurs** — [OFFICIEL-référence] caniuse https://caniuse.com/heif : HEIC/HEIF affiché nativement par **Safari ≥ 17 (macOS et iOS)** ; **ni Chrome ni Firefox**. → Sur iPhone, Safari peut décoder le HEIC dans un `<img>`/canvas puis réexporter en JPEG/WebP (canvas → `toBlob`), ce qui supprime aussi les métadonnées. (déduction technique)
- **sharp (Node / libvips)** — [OFFICIEL] https://sharp.pixelplumbing.com/api-output : « Support for patent-encumbered HEIC images using `hevc` compression requires the use of a globally-installed libvips compiled with support for libheif, libde265 and x265. » → **les binaires précompilés de sharp ne lisent PAS les HEIC d'iPhone.** AVIF : oui. **Par défaut sharp supprime toutes les métadonnées** (« By default all metadata will be removed, which includes EXIF-based orientation ») → appeler `.rotate()` avant pour appliquer l'orientation EXIF, puis resize + `.webp()`/`.jpeg()`.
- **heic2any** (navigateur) — https://github.com/alexcorvi/heic2any : ~890 étoiles, MIT, **dernière version npm 0.0.4 du 29/03/2023**, dernier push 11/04/2024 (via ungh.cc, miroir de l'API GitHub) ; ne conserve pas les métadonnées. → **peu maintenu**.
- **heic-to** (navigateur, libheif 1.22.2 en WASM) — https://github.com/hoppergee/heic-to : 326 étoiles, **v1.5.2 du 26 mai 2026**, variante `heic-to/csp` et worker (`heic-to/next`). Pas de support Node annoncé. → **remplaçant plus vivant de heic2any**.
- **Supabase Storage Image Transformations** — [OFFICIEL] https://supabase.com/docs/guides/storage/serving/image-transformations (màj **2026-10-02**) : **plan Pro et plus** ; **100 images d'origine incluses**, puis **5 $ / 1 000 images d'origine** ; 25 Mo et 50 Mpx max, largeur/hauteur 1–2 500 px ; formats source : PNG, JPEG, WebP, AVIF, GIF, ICO, SVG, BMP, TIFF, et **HEIC accepté en source (pas en sortie)** ; conversion automatique en WebP selon le client (`format=origin` pour désactiver).
  - Pour Sitô, les images du site statique doivent de toute façon être **générées une fois au build** (fichiers WebP dans le site), pas servies à la volée par Supabase.

### 5.2 Pipeline recommandé (synthèse)
1. Dans l'app : `accept="image/*"` (sans `image/heic`, cf. bug Safari §4.1) ; si le fichier est HEIC et que le navigateur sait le décoder (Safari), conversion canvas → JPEG/WebP ≤ ~2 500 px avant envoi (économise la bande passante 4G sur chantier) ; sinon `heic-to`.
2. Upload dans Supabase Storage (bucket privé « originaux »).
3. Au build Node : sharp `.rotate().resize().webp()` → métadonnées EXIF/GPS supprimées par défaut. Si un HEIC passe quand même : soit libvips système avec libheif (image Docker), soit `heic-convert` (npm, pur JS, plus lent — non évalué ici).

---

## 6. Supabase en 2026

Source principale : [OFFICIEL] https://supabase.com/pricing (consultée le 3 oct. 2026, pas de date affichée).

| | Free | Pro |
|---|---|---|
| Prix | 0 $ | **25 $/mois** (dont 10 $ de crédit compute = instance Micro) |
| Projets | **2 projets actifs max** ; **pause automatique « After 1 week of inactivity »** | par organisation, chaque projet supplémentaire consomme du compute |
| MAU Auth | 50 000 | 100 000, puis 0,00325 $/MAU |
| Base | 500 Mo | 8 Go, puis 0,125 $/Go |
| Fichiers (Storage) | 1 Go ; fichier ≤ 50 Mo | 100 Go, puis 0,0213 $/Go ; fichier ≤ 500 Go |
| Egress | 5 Go | 250 Go, puis 0,09 $/Go (0,03 $/Go en cache) |
| Edge Functions | 500 000 invocations | 2 M, puis 2 $/M |
| Transformations d'images | non | 100 images d'origine, puis 5 $/1 000 (§5) |

- Plan Team : 599 $/mois (SOC2/ISO 27001, sauvegardes 14 j).

### Sauvegardes
- [OFFICIEL] https://supabase.com/docs/guides/platform/backups (màj 2026-10-02) : **Free = aucune sauvegarde automatique** ; **Pro = 7 jours de sauvegardes quotidiennes** ; Team 14 j ; Enterprise 30 j. PITR en option : ~100 $/mois (7 j), ~200 $ (14 j), ~400 $ (28 j), nécessite au moins l'instance Small.
- **Les fichiers de Storage ne sont PAS inclus dans les sauvegardes** (« backups do not include objects you store via the Storage API »). → Prévoir une copie des photos ailleurs (ex. R2/S3) ou une politique « on ne supprime jamais ».

### Auth : lien magique / OTP e-mail
- [OFFICIEL] https://supabase.com/docs/guides/auth/auth-smtp (màj 2026-10-02) : le SMTP par défaut = **2 messages/heure** et **uniquement vers les adresses de l'équipe du projet** → **SMTP personnalisé obligatoire en production** (Resend, AWS SES, Postmark, SendGrid, ZeptoMail, Brevo cités). Ensuite limite initiale de 30 messages/h, ajustable.

### Auth : OTP par SMS
- [OFFICIEL] https://supabase.com/docs/guides/auth/phone-login (màj 2026-10-02) : **fournisseur SMS obligatoire** — MessageBird, Twilio (et Twilio Verify), Vonage, TextLocal (communautaire) ; WhatsApp via Twilio. 1 OTP / 60 s par utilisateur, expiration 1 h ; recommandation : CAPTCHA + limites de débit (fraude au SMS).
- [OFFICIEL] Twilio, tarifs France https://www.twilio.com/en-us/sms/pricing/fr : **0,0798 $ par SMS sortant** vers la France (numéro international ou expéditeur alphanumérique) + 0,001 $ par échec. Prix Twilio Verify : non relevé.
- → Pour des artisans, **lien magique / code à 6 chiffres par e-mail** est quasi gratuit ; le SMS coûte ~8 centimes par connexion.

### Edge Functions
- [OFFICIEL] https://supabase.com/docs/guides/functions/limits (màj 2026-10-02) : mémoire **256 Mo**, **CPU 2 s par requête**, durée murale 150 s (Free) / 400 s (payant), 504 si pas de réponse en 150 s, taille 20 Mo (CLI) ; 100 fonctions (Free) ; **ports SMTP 25/587 sortants interdits** (envoyer les e-mails via l'API HTTP d'un fournisseur) ; **pas de bibliothèques Node multithread : sharp est exclu**. → **Le build des sites + traitement d'images ne peut pas tourner dans une Edge Function** : il faut un worker Node ailleurs (Railway, comme StructorAI, ou une file d'attente).

---

## 7. Stripe pour l'abonnement SaaS + facturation électronique en France

### 7.1 Stripe Checkout + Customer Portal
- [OFFICIEL] https://docs.stripe.com/customer-management : portail hébergé, activable **sans code** depuis le Dashboard ; le client peut **mettre à jour ses infos de facturation y compris son n° de TVA**, changer de moyen de paiement, **changer / annuler l'abonnement** (immédiatement ou fin de période), **payer, voir et télécharger ses factures** ; traduit en **français** ; compatible Checkout, pricing table, Stripe Tax, SEPA Direct Debit. Limites : **pas d'iframe** ; session valable 5 min puis 1 h après la dernière activité ; changement de formule max 10 produits ; un abonnement à essai gratuit/multi-produits ne peut être que résilié, pas modifié dans le portail.
  - Dans une PWA / app : ouvrir le portail dans le navigateur (pas d'iframe).

### 7.2 Tarifs Stripe (France)
- [OFFICIEL] https://stripe.com/fr/pricing : cartes EEE standard **1,5 % + 0,25 €** ; premium 2,8 % + 0,25 € ; **prélèvement SEPA 0,35 €** ; **Stripe Billing (abonnements) 0,7 % du volume** en paiement à l'usage ; **Stripe Tax 0,5 % par transaction** (sans code) ou **0,45 € par transaction** (API).
  - Ex. abonnement 49 €/mois par carte : 0,99 € + 0,34 € (Billing) ≈ 1,33 € avant Stripe Tax (calcul à partir des taux ci-dessus).

### 7.3 Stripe Tax / TVA
- [OFFICIEL] https://docs.stripe.com/tax/supported-countries/european-union/france : France supportée (TVA), seuil d'enregistrement « 1 transaction » ; **Stripe ne calcule pas la taxe pour les DROM-COM** (Guyane, Guadeloupe, Martinique, Mayotte, Réunion, etc.) ; la Corse est calculée en TVA française.
- Pour un SaaS français qui facture des artisans français, la TVA française à 20 % s'applique au taux normal (pas d'autoliquidation en domestique) — Stripe Tax est optionnel si toute la clientèle est en métropole (on peut fixer le taux manuellement). (déduction, à valider avec l'expert-comptable)

### 7.4 Facturation électronique obligatoire — calendrier réel
- [OFFICIEL] economie.gouv.fr https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises :
  - **1er septembre 2026 (déjà en vigueur)** : **toutes les entreprises doivent pouvoir RECEVOIR** des factures électroniques ; grandes entreprises et ETI doivent **émettre** + e-reporting.
  - **1er septembre 2027** : **PME et micro-entreprises doivent ÉMETTRE** des factures électroniques (et e-reporting).
  - Concerne tous les assujettis à la TVA, y compris micro-entrepreneurs. « Ce n'est pas un simple PDF envoyé par e-mail » : factures structurées transmises via une **plateforme agréée (PA)**.
- [OFFICIEL Stripe, page ressource] https://stripe.com/resources/more/e-reporting-in-france (màj 24 nov. 2025) : Stripe **ne se présente pas comme plateforme agréée** ; il renvoie à **Billit** (app partenaire sur la Stripe App Marketplace) pour créer/envoyer des e-factures.
- [BLOG] plateya.fr, 16 juillet 2026 (https://www.plateya.fr/blog/detail/stripe-est-il-conforme-a-la-facturation-electronique-2026) : « Stripe seul n'est pas conforme » (PDF, pas de Factur-X/UBL/CII routé par une PA) ; options : Stripe + Billit (PA) ; Stripe + connecteur (Invopop, Indy…) ; facturation maison + PA ; ou logiciel français (Pennylane, Qonto, Sage) maître de la facturation et Stripe pour l'encaissement.
- **Ce que ça implique pour l'éditeur de Sitô** :
  - L'éditeur de Sitô doit **déjà pouvoir recevoir** des e-factures (choisir une PA dès maintenant).
  - Les factures d'abonnement émises à des artisans (B2B domestique) devront passer **en e-facture via une PA au plus tard le 1er septembre 2027** → choisir dès le départ une chaîne Stripe + PA (ex. Billit) ou faire émettre les factures par l'outil comptable (Pennylane/Qonto) branché sur Stripe.
  - Les artisans eux-mêmes ont la même obligation pour leurs propres factures clients : opportunité produit (hors périmètre actuel).

---

## 8. Juridique : éditeur de sites pour des tiers

### 8.1 Mentions légales du site de l'artisan
- [OFFICIEL] entreprendre.service-public.gouv.fr https://entreprendre.service-public.gouv.fr/vosdroits/F31228 (vérifiée le 31 juillet 2023 — ancienne) : identité (nom, adresse, mention « EI » pour un entrepreneur individuel), **numéro d'immatriculation** (RCS ; pour un artisan, le registre concerné — RNE/ex-Répertoire des métiers — n'est pas détaillé sur la page lue), **e-mail et téléphone**, **n° de TVA intracommunautaire**, **hébergeur (nom, adresse, téléphone)**, autorité de contrôle si profession réglementée ; accès « facile ». Sanction : **1 an d'emprisonnement et 75 000 € d'amende** (personne physique). Plus : politique de protection des données / cookies.
- [OFFICIEL] Médiation de la consommation — https://www.economie.gouv.fr/mediation-conso/vous-etes-un-professionnel/vos-principales-obligations-0 : depuis le 1er janvier 2016, tout professionnel qui vend à des consommateurs (donc l'artisan) doit adhérer à un **médiateur de la consommation** référencé CECMC et afficher ses coordonnées (dont l'adresse web du médiateur) **sur son site**, ses CGV, bons de commande (art. L.612-1, L.616-1, R.616-1 C. conso).
- → Le générateur Sitô doit **exiger ces champs à l'onboarding** (SIREN/SIRET, n° TVA, assurance si souhaitée, médiateur) et générer automatiquement les pages « Mentions légales » + « Confidentialité ». L'hébergeur à afficher = l'hébergeur technique réel (ex. Cloudflare, Inc.) et l'éditeur de Sitô comme prestataire.

### 8.2 RGPD : Sitô = sous-traitant de l'artisan
- L'artisan est **responsable de traitement** pour les demandes de devis reçues via son site ; l'éditeur de Sitô est **sous-traitant** (art. 28 RGPD) pour ces données, et responsable de traitement pour ses propres données clients (compte, facturation).
- [OFFICIEL] CNIL, « Sous-traitance : exemple de clauses » https://www.cnil.fr/fr/sous-traitance-exemple-de-clauses : modèle de clauses art. 28 — traitement uniquement sur instruction, confidentialité, protection dès la conception, **notification des violations** au responsable, aide à l'exercice des droits, registre, **sous-traitance ultérieure** (autorisation générale avec information ou autorisation au cas par cas), **sort des données en fin de contrat** (suppression / restitution / transfert). Les clauses doivent être adaptées, elles « ne constituent pas à elles seules un contrat ».
- [OFFICIEL] Guide CNIL du sous-traitant (PDF) : https://www.cnil.fr/sites/default/files/atoms/files/rgpd-guide_sous-traitant-cnil.pdf (non lu en détail).
- → Annexer un **DPA** aux CGV/CGU, avec la liste des sous-traitants ultérieurs (Supabase, Cloudflare, Stripe, fournisseur e-mail, outil d'analytics, Google) et leur localisation.

### 8.3 Droit de rétractation B2B (artisan ≤ 5 salariés)
- [OFFICIEL] DGCCRF, 1er juillet 2025 — https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/petits-professionnels-vous-avez-14-jours-pour-vous-retracter-en-cas-de-contrat-conclu-hors-etablissement : art. **L.221-3 C. conso** — un professionnel **≤ 5 salariés** bénéficie d'un **délai de rétractation de 14 jours** si le contrat est **conclu hors établissement** (démarchage chez lui, sur un chantier, dans la rue…) et que son objet **n'entre pas dans son activité principale**. **Exclus : ventes en ligne, ventes à distance par téléphone, foires et salons.**
- [BLOG/jurisprudence] Legalis — Cass. 1re civ., **12 septembre 2018** (https://www.legalis.net/actualite/droit-de-retraction-dun-professionnel-sur-un-contrat-de-creation-dun-site-internet/) : la création/exploitation d'un site internet **n'entre pas dans l'activité principale** d'une architecte → rétractation admise. [BLOG] grandestavocats.fr (7 déc. 2018) : faute d'information, le délai a été **prolongé de 12 mois**.
  - Divergence : grandestavocats.fr cite aussi les contrats « à distance » dans L221-3 ; **la fiche officielle DGCCRF dit l'inverse (vente en ligne exclue)** → retenir la fiche officielle, à confirmer par un avocat.
- → **Souscription en ligne dans l'app : pas de rétractation légale B2B.** Si Fabrice fait signer des artisans **en face-à-face sur le chantier** (démarchage) : leur remettre l'information + formulaire de rétractation, sinon risque de rétractation jusqu'à 12 mois + 14 jours.

### 8.4 CGV / CGU
- Rédiger des **CGV B2B** (abonnement, durée, résiliation — le portail Stripe permet la résiliation en ligne), **CGU de l'app**, **DPA**, propriété des contenus (photos et textes appartiennent à l'artisan ; licence d'usage pour publier), sort du site et du domaine à la résiliation (transfert du nom de domaine à l'artisan ?).
- Fonction « résiliation en 3 clics » (amende 15 000 € citée par service-public) : obligation **pour les contrats conclus par voie électronique avec des consommateurs** — formellement B2C, mais le portail Stripe la fournit de toute façon. (nuance non vérifiée sur le texte de loi)

---

## 9. Dépôts / bibliothèques open source utiles (vérifiés le 3 oct. 2026)

Étoiles et date du dernier push : via ungh.cc (miroir public de l'API GitHub ; l'API GitHub directe et les pages /commits étaient refusées à WebFetch — 403 / robots.txt). Licence et version : registre npm.

| # | Besoin | Dépôt | Étoiles | Dernier push | Licence | Remarque |
|---|---|---|---|---|---|---|
| 1 | Client Node Google (Business Information, Account Management, Performance) | https://github.com/googleapis/google-api-nodejs-client (npm `googleapis` 182.0.0) | 12 256 | 2026-10-02 | Apache-2.0 | **L'API v4 (avis) n'est PAS couverte par la bibliothèque** : [FORUM/issue] https://github.com/googleapis/google-api-nodejs-client/issues/3513 → appeler `https://mybusiness.googleapis.com/v4/...` à la main avec `oauth2Client.request({url})` (google-auth-library). Présence des modules Business Information / Performance dans `googleapis` : à vérifier dans le paquet. |
| 2 | Gestion des avis Google (open source) | Aucun projet mature trouvé. Exemples : https://github.com/satheeshds/gbp-review-agent (serveur MCP, 9 étoiles, push 2025-12-03), https://github.com/phllle/review-reply-service (0 étoile) | — | — | — | → **À coder soi-même** (2 endpoints v4 : list + updateReply). |
| 3 | Client API Umami | https://github.com/umami-software/api-client (npm `@umami/api-client` 0.81.0) | 47 | 2026-08-28 | MIT | Client officiel ; fonctionne avec Umami Cloud et auto-hébergé. |
| 4 | Umami (serveur à auto-héberger) | https://github.com/umami-software/umami | 39 045 | 2026-09-26 | MIT | Sans cookies, Postgres. |
| 5 | Client API Plausible | Aucun client Node officiel trouvé (non trouvé) ; API HTTP documentée. | — | — | — | |
| 6 | Déploiement Cloudflare (CLI) | https://github.com/cloudflare/workers-sdk (npm `wrangler` 4.147.0) | 4 590 | 2026-09-30 | MIT OR Apache-2.0 | `wrangler deploy` / `wrangler pages deploy` utilisables depuis le worker Node de build. |
| 7 | SDK API Cloudflare (déploiement par API, custom hostnames, registrar) | https://github.com/cloudflare/cloudflare-typescript (npm `cloudflare` 7.2.0) | 817 | 2026-10-03 | Apache-2.0 | SDK officiel, pour le direct upload d'assets (§3.1) et Cloudflare for SaaS sans passer par la CLI. |
| 8 | HEIC → JPEG/PNG dans le navigateur | https://github.com/hoppergee/heic-to (npm `heic-to` 1.5.2 du 2026-05-26) | 346 | 2026-05-26 | **LGPL-3.0** | libheif 1.22.2 en WASM ; mode worker et CSP. LGPL : acceptable en dépendance non modifiée. |
| 9 | HEIC (ancien standard) | https://github.com/alexcorvi/heic2any (npm 0.0.4 du 2023-03-29) | ~890 | 2024-04-11 | MIT | **Peu maintenu** — préférer heic-to. |
| 10 | HEIC côté Node (pur JS) | https://github.com/catdad-experiments/heic-convert (npm 2.1.0) | 321 | 2024-12-02 | ISC | Contourne l'absence de HEIC dans sharp précompilé ; maintenance faible. |
| 11 | Traitement d'images Node | https://github.com/lovell/sharp (npm 0.35.5) | 32 726 | 2026-09-27 | Apache-2.0 | Pas de HEIC dans les binaires précompilés (§5) ; supprime l'EXIF par défaut. |
| 12 | Supabase (client) | https://github.com/supabase/supabase-js (npm 2.117.2) | 4 524 | 2026-08-04 | MIT | Upload Storage depuis web ou Expo. |
| 13 | Expo + Supabase Storage (exemple officiel) | dépôt supabase/supabase, dossier `examples/user-management/expo-user-management` — tutoriel [OFFICIEL] https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native (màj 2026-10-02) | — | — | — | `expo-image-picker` → `fetch(uri).arrayBuffer()` → `supabase.storage.from(...).upload(path, arraybuffer, { contentType })`. |
| 14 | Upload reprenable (4G de chantier) | https://github.com/tus/tus-js-client (npm 4.3.1) | 2 625 | 2026-09-30 | MIT | [OFFICIEL] https://supabase.com/docs/guides/storage/uploads/resumable-uploads (màj 2026-10-02) : recommandé au-delà de 6 Mo, **chunkSize fixé à 6 Mo**. |

---

## Synthèse : ce qui change le plan

1. **Accès API Google Business Profile = chemin critique.** l'éditeur de Sitô doit avoir sa propre fiche GBP vérifiée depuis 60 jours + un site, puis demander l'accès (délai non garanti). Un bug signalé en juillet–août 2026 bloque le scope `business.manage` pour les utilisateurs externes. → Lancer la demande maintenant ; concevoir l'app pour fonctionner **sans** avis/fiche/stats Google (mode dégradé), et ajouter ces fonctions ensuite.
2. **Cloudflare Pages : un projet par artisan est impossible** (100 projets par compte). → Un seul Worker (ou Vercel Pro) qui sert tous les sites selon le nom de domaine + Cloudflare for SaaS (100 domaines gratuits, puis 0,10 $/domaine/mois).
3. **Les domaines .fr ne sont pas gérés par Cloudflare Registrar** (et son API d'achat est en bêta, sans renouvellement). → Utiliser OVH ou Gandi par API pour les .fr.
4. **Le build et le traitement d'images ne peuvent pas tourner dans une Supabase Edge Function** (sharp interdit, 2 s de CPU). → Il faut un worker Node (Railway, comme StructorAI). Les binaires standards de sharp ne lisent pas le HEIC : conversion côté iPhone (Safari) ou avec heic-to.
5. **Statistiques** : Plausible et Cloudflare Web Analytics sont limités pour des centaines de sites → Umami auto-hébergé (MIT, API, sites illimités). Les demandes de devis sont comptées dans Supabase.
6. **Facturation électronique** : l'émission devient obligatoire pour les PME au **1er septembre 2027** ; la réception est déjà obligatoire depuis le 1er septembre 2026. Stripe seul ne suffit pas → prévoir Stripe + une plateforme agréée (Billit, etc.).
7. **Juridique** : en vente en ligne, l'artisan n'a pas de droit de rétractation B2B. En démarchage sur chantier, il a 14 jours s'il a 5 salariés ou moins. Mentions légales et médiateur de la consommation sont à collecter dès l'onboarding. Un DPA (art. 28) est à annexer.
8. **Supabase** : le plan Pro (25 $/mois) est nécessaire en production (pas de sauvegarde en Free, et pause après 7 jours). **Les photos de Storage ne sont pas sauvegardées** → prévoir une copie. Un SMTP personnalisé est obligatoire pour les liens magiques.

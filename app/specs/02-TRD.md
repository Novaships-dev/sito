# 02 — TRD : exigences techniques

Version du 9 octobre 2026. Ce qu'il faut savoir pour coder Sitô sans se
tromper. Le pourquoi produit est dans `01-PRD.md` ; les tables dans
`05-SCHEMA-BACKEND.md` ; l'ordre dans `06-PLAN-IMPLEMENTATION.md`.

États : **Fait, prouvé** / **Fait, non prouvé** / **À faire** / **Ouvert**
(définis dans `01-PRD.md`).

---

## 1. Architecture

```
Téléphone ou ordinateur ──► App Sitô (React, PWA)          app/
                                  │  clé PUBLIQUE seulement
                                  ▼
                     Supabase (Paris) : comptes, base, photos d'origine
                                  ▲
                                  │  clé de service (.env local, jamais dans l'app)
           Service « atelier » (Node 22)                     atelier/
             ├─ photos → image maîtresse propre               atelier/photos.mjs
             ├─ fabrique le site + 5 vérificateurs           generateur/, scripts/verifier-*
             ├─ publie par versions                          atelier/publier.mjs
             ├─ demandes du formulaire, événements Stripe    (à faire)
             └─ avis, fiche, statistiques (Google, Umami)    (à faire)
                                  │
                                  ▼
           Cloudflare : un seul Worker sert tous les sites  worker/routeur.js
             ├─ KV : hôte → { site, version }
             ├─ R2 : sites/<site>/<version>/…
             └─ Cloudflare for SaaS : domaines des artisans
```

| Composant | Rôle | Dossier | État |
|---|---|---|---|
| App | interface de l'artisan | `app/` | Fait, prouvé en démonstration (`essai-app`) ; non prouvé contre la vraie base |
| Base | données, droits, photos d'origine | `supabase/` | Fait, prouvé (`supabase/essais/droits*.sql`) |
| Générateur | fabrique un site unique | `generateur/` | Fait, prouvé (5 vérificateurs) |
| Préparation des photos (service) | toute photo → JPEG sRGB propre | `atelier/photos.mjs` | Fait, prouvé (`essai-photos`, fichiers fabriqués) |
| Conversion HEIC (service) | par les transformations d'images Supabase | `atelier/heic.mjs` | **Plus utilisée** (T44, 29 oct.) : l'app n'envoie que du JPEG ; un HEIC illisible sur le téléphone n'est pas envoyé |
| Publication par versions | écrire à côté, basculer, garder 2 versions | `atelier/publier.mjs` | Fait, prouvé (`essai-publication`, R2/KV simulés) |
| Worker | sert tous les sites selon l'hôte | `worker/routeur.js` | Fait, prouvé (même essai) ; jamais déployé |
| Service HTTP | relie app, base, générateur, publication | `atelier/serveur.mjs` | À faire |
| Adaptateurs R2 / KV réels | remplacent le dossier et le JSON d'essai | `atelier/` | À faire |
| Formulaire du site → `demandes` | — | service | À faire |
| Umami | visites et appels | hébergé par Sitô | À faire |
| Stripe | abonnement | service + webhook | À faire |
| Gandi | achat de domaine au nom de l'artisan | service | À faire |
| Google Business Profile | avis, fiche | service | À faire (accès à obtenir) |

## 2. Pile technique

| Élément | Version | Où |
|---|---|---|
| Node | 22 | service, scripts |
| React / React DOM | ^19.3.0 | `app/package.json` |
| Vite | ^8.3.4 | idem |
| vite-plugin-pwa (Workbox) | ^2 | idem |
| TypeScript | ^5.9, mode strict | idem |
| @supabase/supabase-js | ^2.117.3 | idem |
| tus-js-client | ^4.3.1 | idem |
| sharp | ^0.34 | service, essais |
| Playwright | ^1.63 | essais en navigateur |
| exiftool, ffmpeg | paquets système | **essais seulement** (fabriquer et relire les fichiers d'essai) ; plus aucun serveur n'en a besoin depuis T44 |
| Supabase | projet `sito`, réf. `magxzrpboyrzguuocjgj`, eu-west-3 (Paris), offre gratuite → Pro au premier client | — |
| Cloudflare | zone Sitô, Workers payant, R2, KV, Cloudflare for SaaS | à ouvrir |

Pas de cadriciel CSS : une feuille `app/src/style.css` avec des variables
(`04-DESIGN-SYSTEM.md`). Pas de routeur externe : adresses en `#/…`.

## 3. Organisation du code de l'app

| Fichier | Rôle |
|---|---|
| `src/types.ts` | types des données (suivent le schéma) et interface `Donnees` : **tout** accès aux données passe par elle |
| `src/donnees/supabase.ts` | implémentation réelle |
| `src/donnees/demo.ts` | implémentation en mémoire ; garde les fichiers « envoyés » dans `window.__sitoDemo` pour les essais |
| `src/donnees/index.ts` | choix : Supabase si `VITE_SUPABASE_URL` et `VITE_SUPABASE_CLE_PUBLIQUE`, sinon démonstration ; `?demo` force la démonstration ; mode Android (`?source=android`, mémorisé) |
| `src/photo.ts` | reconnaissance par les premiers octets, préparation sur l'appareil |
| `src/nettoyer.ts` | l'original sans métadonnées, sans perte (JPEG : segments Exif, XMP, IPTC, commentaires retirés, orientation gardée ; PNG : eXIf, tEXt, zTXt, iTXt, tIME retirés) |
| `src/apercu-brut.ts` | l'aperçu JPEG rangé dans un RAW (DNG, NEF, CR2…), le plus grand, avec l'orientation du RAW |
| `src/attente.ts` | file d'envoi dans IndexedDB (base `sito-envois`, ou `sito-envois-demo`) |
| `src/jour.ts` | jour de Paris, sommes par jour, dates en français |
| `src/ui.tsx` | contexte, chargement, actions, composants communs |
| `src/App.tsx` | coquille, navigation, routes, bandeau d'envoi |
| `src/ecrans/*.tsx` | un fichier par écran (`03-APPFLOW.md`) |

**Règle** : un écran ne parle jamais à Supabase directement ; il appelle
`Donnees`. Une nouvelle fonction s'ajoute d'abord à l'interface, puis aux deux
implémentations, puis à l'essai.

## 4. Exigences non fonctionnelles

| N° | Exigence | Mesure | État |
|---|---|---|---|
| T1 | Marche pareil sur iPhone (390 px), petit Android (360 px) et ordinateur (1 280 px) | `essai-app` : chaque écran, chaque appareil | Fait, prouvé |
| T2 | Aucun débordement horizontal | idem | Fait, prouvé |
| T3 | Cibles tactiles de 44 × 44 px au moins | idem | Fait, prouvé |
| T4 | WCAG 2.2 AA : contraste, libellé visible sur chaque champ, titres sans saut, focus visible, clavier complet | idem + `04-DESIGN-SYSTEM.md` | Fait, prouvé (sauf lecteur d'écran réel) |
| T5 | Zones sûres de l'iPhone (encoche, barre du bas) | `env(safe-area-inset-*)` | Fait, non prouvé sur iPhone réel |
| T6 | Installable (manifeste, icônes 192/512/masquable, service worker) | build | Fait ; installation réelle non essayée |
| T7 | Hors ligne : l'app s'ouvre, les photos attendent le réseau | Workbox `navigateFallback`, file IndexedDB | Fait, non prouvé sur vrai réseau |
| T8 | Mise à jour automatique de l'app | `registerType: 'autoUpdate'` | Fait |
| T9 | Dates et jours **en heure de Paris**, quel que soit le fuseau de l'appareil | `jour.ts`, `prive.jour_paris()` | Fait, prouvé (`droits-app.sql`) |
| T10 | Français partout, montants en euros français | `Intl` fr-FR | Fait |
| T11 | Aucune erreur dans la console | `essai-app` | Fait, prouvé |
| T12 | Poids de l'app | 334 Ko de JS (101 Ko compressé) au 9 oct. | mesuré, pas de cible fixée |

## 5. Photos : exigences précises

| N° | Règle | Où | État |
|---|---|---|---|
| P1 | La nature d'un fichier se lit dans ses **premiers octets**, jamais dans son nom | `photo.ts`, `atelier/photos.mjs` | Fait, prouvé |
| P2 | Champ d'envoi : `image/*,video/*` + extensions RAW, HEIC, TIFF, vidéo ; sélection multiple pour « autres photos » | `Chantiers.tsx` | Fait |
| P3 | Lisible par le navigateur → redressé, 3 200 px au plus, JPEG qualité 0,88, fond blanc sous la transparence, **aucune métadonnée** | `photo.ts` | Fait, prouvé (pixels, exiftool) |
| P4 | RAW, DNG, TIFF → l'aperçu JPEG qu'il contient (1 000 px au moins sur le grand côté) part, préparé comme P3 ; **illisible ici** (HEIC hors Safari, RAW sans aperçu) → **pas envoyé** : l'artisan lit pourquoi, que la photo reste sur son téléphone, et comment l'envoyer (décision du 29 oct. : pas de serveur pour convertir ; et le fichier porterait sa position GPS) | `photo.ts`, `apercu-brut.ts` | Fait, prouvé (T44, `essai-app`) |
| P5 | Vidéo → table `videos`, jamais une case avant/après | `photo.ts`, `Chantiers.tsx` | Fait, prouvé |
| P6 | Ni photo ni vidéo (PDF…) → refus avec une phrase qui nomme le fichier ; les autres du lot passent | idem | Fait, prouvé |
| P7 | 50 Mo au plus par fichier (limite actuelle de l'espace `photos-chantiers`) ; 150 Mo proposés en offre Pro | `photo.ts` `POIDS_MAX`, base | Fait ; passage à 150 Mo à faire |
| P8 | Envoi reprenable : TUS, morceaux de **6 Mo exactement** (imposé par Supabase), reprise par empreinte | `supabase.ts` | Fait, non prouvé contre Supabase |
| P9 | Chemin de stockage `<siren>/<chantier>/<uuid>.<ext>` ; l'extension suit le fichier envoyé (`.jpg` si réencodé), `format_origine` garde le format d'appareil | `supabase.ts` | Fait, non prouvé |
| P10 | Le service rend la photo `prete` (image propre dans `chemin`) ou `illisible` (avec `motif`) ; l'app ne peut écrire ni l'un ni l'autre | base (droits par colonne) | Base faite, prouvée ; service à faire |
| P11 | L'original en pleine résolution suit la version réduite, même clé ; posé dans `photos.chemin_source`. Depuis T44 il part **sans métadonnées** (ni GPS, ni appareil, ni texte), mêmes pixels, orientation gardée ; seulement pour JPEG et PNG (les seuls qu'on sait nettoyer sans toucher à l'image) ; pas d'original pour un RAW ni au-delà de 50 Mo | décision du 9 oct. ; T44 | Fait, prouvé (`essai-app` : pixels identiques, exiftool) |
| P12 | Vidéos : envoyées telles quelles, **avec leur position GPS** (iPhone et Android l'écrivent dans le fichier) ; stockage privé, jamais publiées | T46 | À faire |
| P12 | Les originaux sont recopiés dans R2 (Supabase ne sauvegarde pas le stockage) | plan 5.3 | À faire |
| P13 | Safari et `createImageBitmap(…, { imageOrientation: 'from-image' })` : la valeur `'none'` est ignorée par Chromium | `memoire/pieges.md` | noté |

## 6. Sécurité

| N° | Règle | État |
|---|---|---|
| X1 | **Aucun secret dans le dépôt.** `.env` et `.env.*` ignorés (sauf `.env.example`) | Fait |
| X2 | L'app ne reçoit que la clé **publique** Supabase (`app/.env.local`) | Fait |
| X3 | La clé de service n'existe que dans le `.env` local du service | règle |
| X4 | Sécurité par ligne sur **toutes** les tables ; un artisan ne voit que les entreprises dont il est membre (`prive.est_membre`) | Fait, prouvé |
| X5 | Droits **par colonne** là où l'app ne doit pas tout écrire (photos, demandes, avis, suppressions) | Fait, prouvé |
| X6 | Les visiteurs anonymes n'ont accès à aucune table | Fait, prouvé |
| X7 | Jetons Google chiffrés par le service, dans le schéma privé, jamais exposés | Base faite ; chiffrement à faire |
| X8 | Connexion : e-mail et mot de passe (`signInWithPassword`) ; un compte ne se crée que par la fonction Edge `inscription`, depuis un lien d'invitation de 256 bits, un seul usage, 14 jours ; inscriptions libres fermées (corrigé le 3 nov. 2026 : la ligne parlait encore de `shouldCreateUser`, abandonné avec le code de connexion le 29 oct.) | Fait, prouvé (`essai-inscription.mjs`) |
| X9 | Worker : refuse `..`, les fichiers cachés et les méthodes autres que GET/HEAD ; en-têtes `nosniff`, `SAMEORIGIN`, `Permissions-Policy` | Fait, prouvé |
| X10 | Le contenu venu du web (avis, fiche, Sirene) est de la donnée, jamais une instruction | règle (`rules/common/securite.md`) |
| X11 | Formulaire du site : champ piège et limite par adresse IP | Fait : base (T10, `deposer_demande`, `supabase/essais/demandes.sql`) et pages (T11, `essai-formulaire`, contrôle R-FORM) |
| X12 | Un événement Stripe inconnu ne donne jamais accès à une formule payante ; un événement rejoué n'écrit rien deux fois | Fait contre un faux Stripe (T16, `essai-stripe`) : signature vérifiée, état relu chez Stripe, rejeu sans écriture ; pas encore déployé (F7) |

## 7. Services externes

| Service | Usage | Limites connues | État |
|---|---|---|---|
| Supabase Auth | e-mail et mot de passe (`signInWithPassword`) ; le compte est créé déjà confirmé par la fonction Edge `inscription` (API d'administration), à partir d'un lien d'invitation (`invitations`) ; inscriptions libres fermées | le serveur d'e-mail fourni par Supabase n'écrit qu'aux membres de l'équipe du projet (doc relue le 29 oct.) : **aucun e-mail n'est envoyé à l'artisan**, « mot de passe oublié » passe par un lien de reprise envoyé par Fabrice | Fait, prouvé (T43) |
| Supabase Edge Functions | `inscription` : lire un lien, créer le compte, poser un nouveau mot de passe | offre gratuite : 500 000 appels par mois ; déployée par l'outil MCP, `verify_jwt` faux (le jeton du lien fait office de clé) | Fait (T43) |
| Serveur d'e-mail (Brevo ou équivalent) | plus nécessaire pour se connecter ; seulement si un jour l'app écrit à l'artisan | prix à relever | Plus utile pour la connexion |
| Supabase Storage | photos et vidéos d'origine, TUS | 50 Mo par fichier en gratuit ; pas dans les sauvegardes | Fait |
| Supabase transformations d'images | HEIC → JPEG | offre Pro | Plus utilisée (T44) |
| Cloudflare Workers + KV + R2 | servir tous les sites | KV : jusqu'à 60 s pour être vu partout ; R2 demande une carte bancaire (C23) | Fait, non déployé ; remplacé pour les abonnés par Pages (T45) |
| Cloudflare Pages (abonnés) | un projet par site d'abonné (`sito-<siren>-<métier>`), un dépôt atomique par version (`atelier/publier-pages.mjs`, T45) | offre gratuite : 100 projets par compte, donc **100 abonnés au plus** sur ce schéma (D-15) ; 500 dépôts par mois | Fait contre faux Cloudflare ; réel : F21 |
| GitHub Actions | refaire et publier un site à chaque changement (`refaire-site.yml`, T45) ; essais à chaque envoi (`essais.yml`) | dépôt public : minutes illimitées ; dépôt privé (F20) : **2 000 minutes par mois**. Un tour de `refaire-site` ≈ 2 à 3 min, soit ≈ 600 refabrications par mois si rien d'autre ne tourne ; `essais.yml` ≈ 10 min par envoi, rendu et Safari la nuit (≈ 15 min) | Fait (T45) ; réel : F21 |
| Cloudflare for SaaS | domaines des artisans (`supabase/functions/_shared/cloudflare-saas.mjs`, T19) : un custom hostname par domaine, état relu, recréé s'il a été effacé | 100 inclus, puis 0,10 $/mois ; domaine sans `www` impossible hors Entreprise ; domaine non validé supprimé à 7 jours | Fait contre faux Cloudflare (`essai-domaines`) ; réel : zone de Sitô (F6, F5) |
| Gandi API v5 | vérifier, acheter (titulaire = artisan), renouveler, code de transfert, redirection `https://domaine.fr → www` (`supabase/functions/_shared/gandi.mjs`, T19 ; CNAME `www` par LiveDNS, T20) | passage revendeur irréversible ; chemins relevés dans deux clients libres (`go-gandi`, `gandi_v5`), la documentation n'ayant pas pu être ouverte ; à vérifier au premier appel : format du téléphone du titulaire, forme de `url` d'une redirection | Fait contre faux Gandi (`essai-domaines`) ; réel : bac à sable (F8) |
| Google Business Profile API v4 | `reviews.list`, `updateReply`, fiche | accès sur demande, 60 jours de gestion d'une fiche | À faire |
| Umami (hébergé) | visites, clics « Appeler » | CNIL : un site par artisan, 13 mois / 25 mois | À faire |
| Stripe | Checkout, portail client | 1,5 % + 0,25 € par carte, + 0,7 % abonnements | À faire |
| Plateforme de facture électronique (ex. Billit) | émission conforme | obligation PME au 1er sept. 2027 | À faire |
| Google Play | app Android en TWA (Bubblewrap), `assetlinks.json` (`scripts/android.mjs`, T28 : les deux fichiers, servis par le Worker) | compte personnel : 12 testeurs pendant 14 jours ; organisation : D-U-N-S | Fichiers prêts et essayés (`essai-android`) ; manquent l'adresse de l'app (F6, T27), le nom du paquet (Q8) et l'empreinte de la clé (F12) |

## 8. Variables d'environnement

| Variable | Où | Contenu | Secret |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `app/.env.local` | `https://magxzrpboyrzguuocjgj.supabase.co` | non |
| `VITE_SUPABASE_CLE_PUBLIQUE` | `app/.env.local` | clé `sb_publishable_…` | non (publique par conception) |
| clé de service Supabase | `.env` du service | — | **oui**, jamais dans le dépôt ni dans l'app |
| jetons Cloudflare, Gandi, Stripe, Google | `.env` du service | — | **oui** |
| `SITO_CHROMIUM` | essais | chemin d'un Chromium si celui de Playwright manque | non |
| `SITO_APP_DIST` | `essai-app` | dossier d'une copie construite (essai d'une copie cassée) | non |
| `SITO_PYTHON` | essais des photos | interprète Python à utiliser (chemin complet s'il n'est pas dans le PATH ; nom inexistant pour le contre-essai) | non |
| `GITHUB_JETON` | `ci-github` | jeton GitHub à portée fine (Actions : lecture) ; facultatif, le gestionnaire d'identifiants de Git sert par défaut | **oui** |
| `STRIPE_CLE_SECRETE`, `STRIPE_SECRET_WEBHOOK`, `STRIPE_PRIX_MENSUEL`, `STRIPE_PRIX_ANNUEL` | secrets des fonctions Edge `stripe-webhook` et `stripe-session` (et `.env` pour la résiliation, T12) | clés et prix Stripe de test (F7) | **oui** pour les deux premières |
| `GANDI_JETON`, `GANDI_BAC_A_SABLE`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_JETON_API`, `SITO_CIBLE_CNAME` | secrets de la fonction Edge `domaines` (T20) ; `GANDI_BAC_A_SABLE` vaut `false` pour le réel, toute autre valeur garde le bac à sable ; `SITO_CIBLE_CNAME` : l'hôte de la zone de Sitô vers lequel pointe `www` | jetons Gandi (F8) et Cloudflare (F5), zone et cible (F6) | **oui** pour les deux jetons |
| `SUPABASE_CLE_PUBLIQUE` | écrite en clair dans `refaire-site.yml` et `.env.example` | la clé `sb_publishable_…`, posée dans le formulaire des sites d'abonnés (T11) | non (publique par conception) |
| `SITO_RETOURS_PAIEMENT` | secret de la fonction Edge `stripe-session` | adresses de l'app acceptées comme retour de paiement, séparées par des virgules | non |
| `SITO_CI_API` | `ci-github` | autre adresse d'API GitHub (faux serveur local, pour essayer le verdict rouge) | non |

## 9. Essais

Règle du dépôt : **un contrôle mesure le rendu, jamais la variable que le code
vient d'écrire, et il est essayé une fois sur une copie cassée exprès.**

| Commande | Ce qu'elle prouve | Résultat au 9 oct. |
|---|---|---|
| `cd app && npm run build` | types stricts, construction, service worker | OK |
| `node scripts/essai-app.mjs` | parcours complet en démonstration, rendu sur 3 appareils, fichiers envoyés mesurés | 96 contrôles, 0 faute |
| `node scripts/essai-app.mjs --contre-essai` | chaque contrôle attrape une entrée cassée | 12/12 |
| copie cassée (`SITO_APP_DIST`) | une app qui n'envoie pas la photo réduite est refusée | 6 fautes attrapées |
| `node scripts/essai-photos.mjs` | préparation des photos côté service | 18 cas, 0 faute |
| `node scripts/essai-publication.mjs` | versions, bascule, Worker | 19 essais, 0 faute |
| `node scripts/essai-service.mjs` (+ `--contre-essai`) | l'adaptateur Supabase du service contre un faux Supabase local : en-têtes, refus (401, 404, 409), rejeu, octets du stockage | 28 contrôles, 0 faute ; copie cassée : 22 fautes (24 oct.) |
| `supabase/essais/droits.sql`, `droits-app.sql` | droits de la base | conformes |
| `node scripts/verifier-depot.mjs .` | rien ne manque au dépôt | avant toute livraison |
| `node scripts/essais.mjs` | tous les essais d'un coup, résumé dans `memoire/essais/derniers.txt` | vert le 9 oct. |
| `node scripts/verifier-secrets.mjs .` (+ `--contre-essai`) | aucun secret dans ce qui part sur GitHub | vert ; 9 motifs sur 9 attrapés |
| `node scripts/essai-outillage.mjs` (+ `--contre-essai`) | réglages et crochets de Claude Code, compte d'essai sur faux Supabase | 34 contrôles, 0 faute ; copie cassée : 13 fautes |

**À ajouter** : un essai de bout en bout contre la vraie base (compte
d'essai), lancé sur l'ordinateur de Fabrice ; un essai sur iPhone réel
(Safari, HEIC, ProRAW, Live Photo).

## 10. Livraison

| Étape | Commande |
|---|---|
| Contrôle du dépôt | `node scripts/verifier-depot.mjs .` |
| Envoi sur GitHub | `lanceurs\POUSSER.bat` (refuse si le dépôt est incomplet) |
| Lancer l'app en local | `lanceurs\APP.bat` (http://localhost:5173) |
| Pas de Git LFS | décision de Fabrice ; images dans `images/` (ignoré) et le stockage |

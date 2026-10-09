# Recherche web n° 2 — solutions détaillées pour l'app Sitô (3 octobre 2026)

Suite de `docs/lecture-structorai/web.md` (pas répété ici : limites Pages 100 projets, Workers 500, Workers for Platforms 25 $, Cloudflare for SaaS 100 inclus, Vercel Pro 20 $, API OVH/Gandi de commande, sharp sans HEIC, TUS 6 Mo…).
Méthode : WebSearch / WebFetch uniquement. **[OFFICIEL]** doc de l'éditeur ; **[BLOG]** article tiers ; **[FORUM]** forum/discussion. « non trouvé » = pas de source fiable. Dates = « Last updated » affiché par la page. Les lignes « → » sont mes déductions, pas des sources.

---

## A. Héberger des milliers de sites sur Cloudflare

### A1. Architecture « un seul Worker routeur » + R2 + KV

**Le schéma est officiellement documenté** (sans Workers for Platforms) :
- [OFFICIEL] « Worker as origin » (màj 2026-06-19) — https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/worker-as-origin/
  1. Dans la zone SaaS, créer une fallback origin « originless » : `service.example.com AAAA 100::` (proxifié).
  2. Workers Routes → route **`*/*`** vers le Worker : « routes all traffic entering your zone to the Worker, including requests from custom hostnames ».
  3. « the `custom_origin_server` setting on individual custom hostnames is bypassed » → **le Worker décide seul, d'après l'en-tête Host**.
  - La page ne mentionne aucune exigence Workers for Platforms : un Worker normal (plan Workers Paid) suffit.
- [OFFICIEL] « Hostname routing » (Workers for Platforms, màj 2026-09-24) — https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/configuration/hostname-routing/ : même schéma (Cloudflare for SaaS + route `*/*` + recherche KV/D1 par hostname) pour « handle millions of domains without hitting route limits ». Workers for Platforms n'y sert qu'à **dispatcher vers un Worker distinct par client** ; inutile si tous les sites sont des fichiers statiques servis par le même code.
- → Schéma Sitô : `requête → Worker → KV.get(host) = "artisan-123" → R2.get("artisan-123/" + chemin) → réponse (Cache-Tag: artisan-123)`.
- Aucun guide officiel « site statique multi-locataire depuis R2 » complet n'a été trouvé (non trouvé) ; le schéma est l'assemblage des deux pages ci-dessus.

**R2 — limites** [OFFICIEL] https://developers.cloudflare.com/r2/platform/limits/ (màj 2026-06-08)
- Objet max **5 Tio** ; envoi en une seule requête PUT **5 Gio** ; multipart 10 000 parties.
- **Écritures concurrentes sur la même clé : 1 par seconde.** Pas de plafond publié d'écritures par seconde sur des clés différentes.
- Buckets par compte : 1 000 000 ; objets par bucket : illimité ; clé ≤ 1 024 octets.
- API REST Cloudflare (pas l'API S3) : 1 200 requêtes / 5 min ; opérations de gestion de bucket : 50/s.

**R2 — prix** [OFFICIEL] https://developers.cloudflare.com/r2/pricing/ (màj 2026-10-01)
- Stockage Standard **0,015 $/Go-mois** ; classe A (PutObject, CopyObject, ListObjects, UploadPart…) **4,50 $/million** ; classe B (GetObject, HeadObject…) **0,36 $/million**.
- Gratuit chaque mois : 10 Go-mois, 1 M classe A, 10 M classe B.
- **Sortie (egress) vers Internet : gratuite.**

**R2 — cohérence** [OFFICIEL] https://developers.cloudflare.com/r2/reference/consistency/ (màj 2026-04-30)
- « Readers will immediately see the latest object globally » (lecture après écriture **forte**, listes aussi).
- « An object you delete from R2, but that is still cached, will still be available. You should purge the cache » → le délai de mise à jour vient **du cache, pas de R2**.

**Workers payant** [OFFICIEL] https://developers.cloudflare.com/workers/platform/pricing/ (màj 2026-10-02)
- **5 $/mois minimum** ; **10 M requêtes/mois incluses**, puis 0,30 $/M ; **30 M ms CPU inclus**, puis 0,02 $/M ms.
- **KV** (payant) : 10 M lectures/mois incluses puis 0,50 $/M ; 1 M écritures incluses puis 5 $/M ; 1 Go inclus puis 0,50 $/Go-mois. (Gratuit : 100 000 lectures/jour, 1 000 écritures/jour.)
- **D1** (payant) : 25 milliards de lignes lues/mois incluses, 50 M lignes écrites, 5 Go inclus.

**KV — cohérence et limites**
- [OFFICIEL] https://developers.cloudflare.com/kv/concepts/how-kv-works/ (màj 2026-04-21) : « Changes may take up to **60 seconds or more** to be visible in other global network locations » ; `cacheTtl` par défaut 60 s. S'applique aussi aux **lectures négatives** (clé absente) → un nouveau domaine peut répondre « inconnu » pendant ~1 min.
- [OFFICIEL] https://developers.cloudflare.com/kv/platform/limits/ (màj 2026-04-21) : **1 écriture/s par clé** ; clé 512 octets ; valeur 25 Mio ; `cacheTtl` minimum **30 s** ; 1 000 opérations KV par invocation.
- → Alternative si le délai gêne : D1 (base SQL, lecture cohérente depuis la région primaire, non vérifié ici) ou métadonnées du custom hostname Cloudflare (non vérifié).

**Cache et purge**
- [OFFICIEL] https://developers.cloudflare.com/cache/how-to/purge-cache/ (màj 2026-09-29) : **toutes les méthodes (URL, hostname, tag, préfixe, tout) sur tous les plans**, y compris Free. Débits (par compte) pour tag/hostname/préfixe/tout : **Free 5 requêtes/minute** (seau de 25), **Pro 5/s**, Business 10/s, Enterprise 50/s ; par URL : Free 800 URL/s, Pro/Business 1 500. Max **100 éléments par requête** (Enterprise 500).
- [OFFICIEL] Changelog 1er avril 2025 — https://developers.cloudflare.com/changelog/post/2025-04-01-purge-for-all/ et [OFFICIEL/blog Cloudflare] https://blog.cloudflare.com/instant-purge-for-all/ (1er avril 2025) : purge « under 150 ms » visée ; « single-file purge … approximately 250ms at the P50 ».
- [OFFICIEL] Cache API — https://developers.cloudflare.com/workers/runtime-apis/cache/ (màj 2026-08-14) : « the contents of the cache do not replicate outside of the originating data center » (cache **local à chaque datacenter**) ; fonctionne sur domaines personnalisés.
- [OFFICIEL] https://developers.cloudflare.com/workers/reference/how-the-cache-works/ (màj 2026-07-06) : entrées de la Cache API purgeables **par tag** si le Worker ajoute un en-tête `Cache-Tag` ; « it is not possible to purge a URL that uses a custom cache key set by a Worker » ; purge par hostname / tout possible.
- → Schéma Sitô : le Worker met `Cache-Tag: site-<id>` sur chaque réponse ; après publication, **une purge par tag** = tout le site. Sur plan **Free, 5 purges/minute par compte** : suffisant au début, mais **plan Pro (5/s)** à prévoir quand des centaines d'artisans publient. Alternative sans purge : URL de fichiers versionnées (`/img/abc123.webp`) + HTML en cache court.

### A2. Cloudflare for SaaS : brancher le domaine d'un artisan

[OFFICIEL] « Configuring Cloudflare for SaaS » (màj 2026-06-19) — https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/getting-started/
1. Zone Sitô sur Cloudflare (**plan Free suffit**) ; activer Cloudflare for SaaS.
2. **Fallback origin** : enregistrement proxifié (ici `AAAA 100::` pour un Worker, cf. A1), puis Custom Hostnames → « Add Fallback Origin » (ou API `update fallback origin`) → statut **Active**.
3. (Optionnel) **Cible CNAME** pour les clients : `CNAME sites.sito.fr → fallback` proxifié.
4. Par artisan : **créer le custom hostname** (tableau de bord ou API « Create Custom Hostname » : `POST /zones/{zone_id}/custom_hostnames`) ; un GET de suivi peut être nécessaire pour récupérer les jetons DCV.
5. L'artisan crée `www.sondomaine.fr CNAME sites.sito.fr`.
6. Prêt quand `result.status = active` **et** `result.ssl.status = active`.
- Suppression : `DELETE /zones/{zone_id}/custom_hostnames/{id}` (référence API https://developers.cloudflare.com/api/resources/custom_hostnames/ — méthode delete, non ouverte en détail).

**Validation du certificat** [OFFICIEL] https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/security/certificate-management/issue-and-validate/validate-certificates/ (màj 2026-05-07)
- Méthodes : `http`, `txt`, `email` (+ DCV déléguée). HTTP DCV marche « as long as the hostname is pointing to the SaaS provider » et est proxifié → **zéro geste supplémentaire pour l'artisan** (juste le CNAME), au prix d'une courte coupure ; TXT ou DCV déléguée = pas de coupure mais un enregistrement de plus.

**Délais**
- [OFFICIEL] Validation temps réel (màj 2026-04-15) — https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/hostname-validation/realtime-validation/ : « Cloudflare takes a few seconds » après l'ajout du CNAME ; pour accélérer : « continually send no-change PATCH requests … (which resets the validation backoff schedule) ».
- [OFFICIEL] Calendrier de réessai (màj 2026-07-16) — https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/hostname-validation/backoff-schedule/ : **75 essais sur 7 jours** ; 10 premiers essais en ~20 min, puis espacement jusqu'à 4 h ; **après 7 jours sans succès, le custom hostname est supprimé automatiquement**.
- Délai d'émission du certificat lui-même : non trouvé (chiffre précis).

**Prix** [OFFICIEL] https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/ (màj 2026-08-14) : 100 inclus, **0,10 $ par hostname supplémentaire** (Free/Pro/Business), max 50 000 ; wildcard et certificats personnalisés = Enterprise.

**Domaine nu (apex `exemple.fr`)**
- [OFFICIEL] Plans (même page) : **« Apex Proxying/BYOIP » : Free/Pro/Business = Non ; Enterprise = add-on payant.**
- [OFFICIEL] Apex proxying (màj 2026-06-10) — https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/apex-proxying/ : IP statiques attribuées au compte, l'artisan crée des enregistrements **A** ; « Only certain customers have access … cost associated, reach out to your account team ». Alternative citée : **CNAME flattening** chez le DNS du client (si son DNS le permet).
- → Solutions sans Enterprise, par ordre de simplicité :
  1. **Site sur `www.exemple.fr`** (custom hostname) + **redirection `exemple.fr → www` faite chez le registrar** (OVH/Gandi : voir B2).
  2. Si le DNS de l'artisan supporte ALIAS/ANAME/CNAME à l'apex (Cloudflare DNS, Gandi LiveDNS « ALIAS »… à vérifier par registrar) : ajouter `exemple.fr` comme second custom hostname.
  3. **Pas d'enregistrement A vers une IP fixe Cloudflare** hors Enterprise (les IP anycast ne sont pas garanties ; non documenté comme supporté).

### A3. Sous-domaines gratuits `*.sito.fr`
- [OFFICIEL] Routes Workers (màj 2026-06-01) — https://developers.cloudflare.com/workers/configuration/routing/routes/ : `*.example.com/*` couvre tous les sous-domaines (pas l'apex) ; « All domains and subdomains must have a DNS record to be proxied ».
- [OFFICIEL] Wildcard DNS (màj 2026-04-16) — https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/ : « Customers on all plans can create and proxy wildcard DNS records. »
- [OFFICIEL] Universal SSL (màj 2026-04-30) — https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/ : couvre « the root domain and **first-level subdomains** » ; **pas** `a.b.sito.fr`.
- → **Oui** : `*.sito.fr` proxifié + route `*.sito.fr/*` sur le même Worker, certificat Universal SSL gratuit. Format : `dupont-plomberie.sito.fr` (un seul niveau). Avec la route `*/*` de A1, une seule route peut tout couvrir.

### A4. Publier un site = envoyer les fichiers changés dans R2 puis purger
- R2 est compatible S3 (PutObject = classe A). Le programme Node compare les empreintes (hash) et n'envoie que les fichiers modifiés, puis **une purge par tag** `site-<id>`.
- Visibilité : R2 = immédiate (cohérence forte) ; purge visée < 150 ms (P50 ≈ 250 ms en purge unitaire) → **nouveau site visible en quelques secondes** (déduction). Nouveau domaine dans KV : jusqu'à **60 s** (cf. A1).
- Plafonds d'écriture : **1 écriture/s sur une même clé** (sans effet : chaque fichier a sa clé) ; aucun plafond global par bucket publié (non trouvé) ; 1 M opérations classe A gratuites/mois puis 4,50 $/M. Ex. : 1 000 publications × 20 fichiers = 20 000 PUT/mois → dans le gratuit.
- Purge : **5/minute sur plan Free** = plafond réel de publications simultanées → regrouper ou passer en Pro.

### A5. Comparaison : un seul projet Vercel Pro
- [OFFICIEL] https://vercel.com/docs/platforms/multi-tenant-platforms/limits (màj 2026-09-08) : domaines personnalisés **illimités en Pro** (limite souple 100 000/projet) ; **ajout de domaine par API : 100 requêtes/heure par équipe**, vérification 50/h, suppression 100/h ; wildcard `*.sito.fr` sur tous les plans mais Vercel doit répondre au défi DNS (nameservers Vercel ou délégation `_acme-challenge`).
- [OFFICIEL] https://vercel.com/docs/domains/working-with-domains/add-a-domain (màj 2026-09-16) : **apex supporté par un enregistrement A** (76.76.21.21 ou la valeur affichée — guide lié https://vercel.com/kb/guide/a-record-and-caa-with-vercel) ; sous-domaine par CNAME propre au projet ; certificats automatiques. → **Gros avantage : `exemple.fr` nu fonctionne sans Enterprise.**
- [OFFICIEL] https://vercel.com/pricing : Pro **20 $/mois** avec 20 $ de crédit d'usage ; 1 M invocations de fonctions incluses ; Hobby non commercial. [OFFICIEL] https://vercel.com/docs/pricing/regional-pricing (màj 2026-09-14) : au-delà, transfert 0,15–0,35 $/Go, 2,00–3,20 $/M requêtes CDN.
- Routage par hôte : middleware/rewrites (Platforms Starter Kit Next.js). Pour des fichiers statiques par artisan, il faut stocker les fichiers ailleurs (Blob 0,023–0,041 $/Go) ou redéployer le projet à chaque publication (**6 000 déploiements/jour en Pro**, cf. recherche n° 1) — un déploiement unique contenant tous les sites ne passe pas à l'échelle (déduction).
- → Bilan : Vercel est **plus simple pour les domaines (apex inclus)** ; Cloudflare est **moins cher et plus adapté aux fichiers statiques** (sortie gratuite, R2). Point dur Cloudflare = domaine nu → redirection apex → www chez le registrar.

---

## B. Organiser les domaines .fr des artisans

### B1. Règles AFNIC du .fr
Source principale : [OFFICIEL] Charte de nommage Afnic, version du 5 mai 2025 — https://www.afnic.fr/wp-media/uploads/2025/04/afnic-charte-de-nommage-2025-05-05.pdf
- **Qui peut être titulaire (art. 5.1)** : « toutes personnes physiques résidant et toutes personnes morales ayant leur siège ou établissement principal » dans l'**UE**, ou en **Islande, Liechtenstein, Norvège, Suisse**. → Un artisan en France (EI ou société) est éligible.
- **Exactitude des données (art. 5.1)** : le titulaire et son contact administratif fournissent téléphone, e-mail et « éléments d'identification exacts », et doivent les **mettre à jour sans délai**. Art. 5.3 : enregistrement « sur la base des déclarations faites par le demandeur et sous sa responsabilité ».
- **Le titulaire = le demandeur** ; l'Afnic ne traite qu'avec les **bureaux d'enregistrement** (art. 3.1, 4.1). La charte n'encadre pas explicitement le fait qu'un prestataire enregistre à son propre nom pour un client (non trouvé). → Pour que le domaine appartienne à l'artisan, **il doit être le titulaire** (contact « owner/holder ») ; Sitô peut être contact administratif/technique ou simple gestionnaire du compte registrar.
- **Whois/RDAP (art. 8.4)** : pour une **personne physique**, « diffusion restreinte » **par défaut** : aucune donnée personnelle publiée (seulement le bureau d'enregistrement et les DNS). Pour une personne morale : publication (non détaillé dans l'extrait lu).
- **Transmission / changement de titulaire (art. 6.4)** : possible avec « accord des deux parties ». **Changement de bureau d'enregistrement (art. 6.6)** : le titulaire choisit un nouveau bureau qui fait l'opération. Le mot « authinfo » n'apparaît pas dans la charte (le code d'autorisation y est cité pour les noms soumis à examen préalable) ; le code de transfert est géré par les bureaux (voir OVH B4). Guide des procédures Afnic (non lu en détail) : https://www.afnic.fr/wp-media/uploads/2022/10/Guide-des-procedures-Afnic-VF.pdf
- **Délai d'enregistrement** : non trouvé dans une source officielle (en pratique immédiat chez les bureaux, non vérifié).
- **Données demandées à l'achat** [OFFICIEL] OVHcloud https://www.ovhcloud.com/fr/domains/tld/fr/ : particulier = date et lieu de naissance ; **entreprise = SIREN (ou TVA/DUNS) + raison sociale** ; association = SIREN/WALDEC/JO.

**Prix publics .fr (relevés le 3 oct. 2026)**
| | Création 1re année | Renouvellement | Transfert entrant | Source |
|---|---|---|---|---|
| OVHcloud | 4,99 € HT / 5,99 € TTC | **7,79 € HT / 9,35 € TTC par an** | 4,59 € HT | [OFFICIEL] https://www.ovhcloud.com/fr/domains/tld/fr/ (offre citée valable jusqu'au 31/12/2026) |
| Gandi | 7,20 € TTC/an (1 à 10 ans) | page affiche « 28,78 € HT / 25,90 € TTC » (incohérent HT>TTC : **à revérifier**) ; changement de propriétaire **gratuit** | 7,20 € | [OFFICIEL] https://www.gandi.net/fr/domain/tld/fr |

### B2. Acheter et gérer le domaine par API

**OVHcloud** (guides API màj 2026-02-10)
- Commande : https://docs.ovhcloud.com/en/guides/web-cloud/domains/api-domain-order — configuration **`OWNER_CONTACT`** = « Represents the domain name holder », valeur `/me/contact/1234` ou `/domain/contact/12345` (« If empty, the nic used to the API will be used as a template » → **si on oublie, c'est Sitô qui devient titulaire**). Paiement auto : `autoPayWithPreferredPaymentMethod` (« default payment method of the nic »). Avertissement : « Domain names have specific and much more complex rules … the API cannot describe such constraints » → voir règles.
- Règles d'éligibilité : https://docs.ovhcloud.com/en/guides/web-cloud/domains/api-domain-rules — `GET /domain/configurationRule?action=create&domain=…` puis `POST /domain/configurationRule/check` avant commande ; champs du contact titulaire : `legalForm` (individual/corporation/association/other), `organisationName`, `firstName`/`lastName`, email, téléphone, adresse, langue. Champs propres au .fr (SIREN…) : non listés sur la page (à lire dans la réponse de `configurationRule`).
- Contacts : https://docs.ovhcloud.com/en/guides/web-cloud/domains/api-domain-contacts — `POST/GET /domain/contact`, `PUT /domain/contact/{id}`. Point clé : **« The holder contact operates independently from nichandles and cannot access OVHcloud services »** → l'artisan peut être titulaire **sans compte OVH**, le domaine restant géré dans le compte OVH de l'éditeur de Sitô (admin/tech/billing = nichandles Sitô). Changement de titulaire = produit à commander (« DomainTrade », e-mails de validation aux deux parties).
- Zone DNS : `POST /domain/zone/{zoneName}/record` (fieldType, subDomain, target, ttl) **puis obligatoirement `POST /domain/zone/{zoneName}/refresh`** — [FORUM/issue] https://github.com/ovh/terraform-provider-ovh/issues/1290 : sans le droit `refresh`, les enregistrements apparaissent dans la console mais **ne sont pas publiés**.
- **Redirection web apex → www** : [OFFICIEL] https://docs.ovhcloud.com/en/guides/web-cloud/domains/redirect-domain-name (màj 2026-03-27) : 301/302/invisible, mais **« A redirection created from the OVHcloud Control Panel does not allow you to redirect a `https://` URL »** ; propagation « 4 to 24 hours ». → **`https://exemple.fr` ne sera pas redirigé** (erreur de certificat dans le navigateur). Endpoint API de redirection (`/domain/zone/{zone}/redirection`) : existence citée par Terraform `ovh_domain_zone_redirection`, page non lisible → non vérifié.
- Renouvellement auto : endpoint non vérifié (non trouvé dans les guides lus).
- Programme partenaire [OFFICIEL] https://partner.ovhcloud.com/en/partner-benefits/ : niveaux Standard (accord + support Premium, prévision > 500 €), Advanced (MRR 5 000 €, 5 certifications)… **aucune remise sur les domaines mentionnée**.

**Gandi**
- API v5 [OFFICIEL] https://api.gandi.net/docs/domains/ : `POST /v5/domain/domains` avec objet `owner` (`type`: individual/company/association/publicbody, `orgname`, `extra_parameters` « needed for some extensions ») ; **`PATCH /v5/domain/domains/{domain}/autorenew`** (`enabled`, `duration`) ; **`PUT /v5/domain/domains/{domain}/authinfo`** (réinitialise le code d'autorisation) ; `sharing_id` = organisation payeuse. Endpoint API de redirection web : non trouvé sur cette page.
- **Redirection web avec HTTPS** [OFFICIEL] https://docs.gandi.net/en/domain_names/common_operations/web_forwarding.html : « If you create a forward using the HTTPS protocol, and a free certificate is available, a certificate will be automatically generated » ; choix http/https/les deux ; pas de HTTPS pour les redirections masquées ou wildcard. → **Gandi gère correctement `https://exemple.fr → https://www.exemple.fr`**, contrairement à la redirection OVH.
- Revendeur [OFFICIEL] https://docs.gandi.net/en/rest_api/migration_from_v3/resellers/index.html : comptes prépayés par organisation ; création de domaine avec toutes les coordonnées du titulaire dans la requête ; « the owner will be automatically added as a customer of your reseller organization » ; les « customers » ne peuvent pas se connecter. Devenir revendeur : organisation de type « Société » → « Devenir Revendeur » (**irréversible**) — https://docs.gandi.net/fr/revendeurs/demarrage_revendeur/index.html. Grilles de remise : page « avantages revendeur » en erreur (trop de redirections) → non trouvé.

**Domaine nu : synthèse des options** (déduction à partir de A2 + B2)
1. Domaine acheté par Sitô chez **Gandi** (titulaire = artisan) : `www CNAME sites.sito.fr` + **redirection web HTTPS apex → www** par Gandi. Le plus simple.
2. Chez OVH : idem mais la redirection apex ne marche qu'en `http://` → insuffisant ; alternative = déléguer les DNS du domaine à Cloudflare (zone dans le compte Sitô, CNAME flattening à l'apex). Nombre max de zones par compte Cloudflare : **non trouvé**.
3. Vercel : apex via enregistrement A sans surcoût (A5).

### B3. Domaine que l'artisan possède déjà
- Procédure minimale : chez son registrar, **`www` CNAME `sites.sito.fr`** (+ redirection apex → www si son registrar sait le faire en HTTPS). Validation du certificat par HTTP automatique dès que le CNAME pointe (A2).
- Vérification automatique : l'app interroge `GET /zones/{zone_id}/custom_hostnames/{id}` jusqu'à `status = active` et `ssl.status = active` ; peut relancer par PATCH sans changement pour réinitialiser l'attente (A2, source officielle realtime-validation). **Attention : suppression automatique après 7 jours sans validation** → recréer le hostname si l'artisan tarde.
- Transfert vers le registrar de Sitô : possible (OVH 4,59 € HT, Gandi 7,20 €) mais demande le code d'autorisation à l'ancien registrar → plus lourd ; à réserver aux artisans qui le demandent.

### B4. Résiliation : le domaine reste à l'artisan
- Puisque l'artisan est **titulaire**, il garde le droit sur le nom (charte art. 6.4/6.6). Sitô doit lui remettre le moyen de partir :
  - OVH : `PUT /domain/{serviceName}` avec `transferLockStatus=unlocked`, puis **`GET /domain/{serviceName}/authInfo`** → code à transmettre — [OFFICIEL] https://docs.ovhcloud.com/en/guides/web-cloud/domains/api-domain-transfer (màj 2026-02-10) ; rien de spécifique au .fr dans ce guide.
  - Gandi : `PUT /v5/domain/domains/{domain}/authinfo`.
- À prévoir dans le contrat (déduction) : e-mail du titulaire = **e-mail de l'artisan** (pas celui de Sitô) ; durée payée restante ; qui paie le renouvellement après résiliation ; délai de remise du code ; suppression du custom hostname Cloudflare (`DELETE`) et du CNAME ; possibilité de laisser une redirection temporaire.

---

## C. Accepter toutes les photos (iPhone, Android, ordinateur)

### C1. Formats produits en 2026
| Source | Format | Détail / taille | Source |
|---|---|---|---|
| iPhone (défaut) | **HEIF/HEIC** (vidéo HEVC) depuis iOS 11 | Réglage « Plus compatible » (Réglages > Appareil photo > Formats) → **JPEG** / H.264. Partage hors iCloud : « the media might automatically be shared in a more compatible format, such as JPEG » | [OFFICIEL] Apple https://support.apple.com/en-us/116944 (5 déc. 2025) |
| iPhone Pro | **ProRAW = DNG** | « approximately **25 MB** » en 12 Mpx, « approximately **75 MB** » en 48 Mpx ; iPhone 12 Pro et Pro ultérieurs, iOS 14.3+ | [OFFICIEL] Apple https://support.apple.com/en-us/119916 (19 avr. 2024) |
| iPhone 16 Pro | DNG avec image principale en **JPEG XL** + aperçu JPEG intégré | — | [FORUM] Exiv2 issue #3041 (21 sept. 2024) https://github.com/Exiv2/exiv2/issues/3041 |
| iPhone | Live Photo (HEIC + MOV), captures PNG, panoramas | Ce que Safari envoie pour une Live Photo via `<input>` : **non trouvé** (source officielle) | — |
| Android 14+ | **Ultra HDR JPEG** (JPEG + gain map) | « fully backward compatible with JPEG images » ; les lecteurs anciens affichent l'image SDR | [OFFICIEL] https://developer.android.com/about/versions/14/features ; spécification https://developer.android.com/media/platform/hdr-image-format (màj 2024-10-25) |
| Android | **Motion Photo** = image (JPEG, HEIC ou AVIF) + vidéo MP4/MOV ajoutée à la fin | « Standard JPEG decoders will read only the JPEG portion » | [OFFICIEL] https://developer.android.com/media/platform/motion-photo-format (màj 2024-07-10) |
| Samsung | HEIF optionnel (« Photos haute efficacité ») ; RAW DNG ; DNG 1.7 en JPEG XL | Défaut activé ou non : **non confirmé** (forum contradictoire) | [FORUM] https://eu.community.samsung.com/t5/galaxy-a-series/how-to-save-photos-as-jpeg-not-heic/td-p/3411409 (23 janv. 2025) ; [FORUM] Immich #31829 (27 sept. 2026) https://github.com/immich-app/immich/issues/31829 |
| Ordinateurs | PNG, TIFF, BMP, GIF, WebP, AVIF, HEIC (Mac) | Tailles typiques : non trouvé | — |

### C2. Ce que le navigateur envoie
- **Safari iOS** — [OFFICIEL] WebKit, bug 267277 « [iOS] Avoid transcoding images on file inputs unless the set of image types is explicitly restricted », corrigé le **5 mars 2024** (commit 275726@main) — https://bugs.webkit.org/show_bug.cgi?id=267277 et message de commit https://www.mail-archive.com/webkit-changes@lists.webkit.org/msg211341.html :
  - Avant : « on iOS, HEIC is unconditionally transcoded to JPEG ».
  - Après : « transcoding to the compatible format for images is only performed if the `accept` attribute restricts the set of image types ».
  - Donc : `accept="image/*"` (ou `*/*`, ou pas d'accept) → **le HEIC part tel quel** ; `accept="image/jpeg,image/png"` → **Safari convertit en JPEG**. Les vidéos restent transcodées.
  - Version d'iOS qui contient le correctif : **non trouvé** (2024 → au plus tard iOS 18 ; iOS 26 concerné).
  - Cas inverse déjà connu (recherche n° 1) : `accept` contenant `image/heic` peut convertir des JPEG en HEIC (forum Apple 743049).
- [FORUM] Apple https://developer.apple.com/forums/thread/743037 (iOS 17) : le sélecteur photo propose « Automatique » (défaut) / « Actuel » / « Plus compatible » ; aucun moyen HTML de forcer le choix.
- Sélection multiple : attribut `multiple` (standard HTML ; comportement iOS non vérifié dans une source officielle).
- **Chrome Android** : comportement HEIC/transcodage **non trouvé** dans une source officielle.
- → Choix pratique pour Sitô : deux boutons ou une détection. Option simple : `accept="image/jpeg,image/png,image/webp"` sur iPhone → l'iPhone envoie du **JPEG** (le serveur n'a jamais à décoder du HEVC) ; `accept="image/*"` ailleurs (ordinateur, Android) et conversion serveur pour le reste. Inconvénient : sur ordinateur, un `accept` restreint masquerait les HEIC/AVIF/TIFF dans le sélecteur.

### C3. Côté serveur Node (sharp / libvips)
- **sharp précompilé** — [OFFICIEL] https://sharp.pixelplumbing.com/ (v0.35.5 du 27 sept. 2026) : entrée **JPEG, PNG, WebP, GIF, AVIF, TIFF, SVG** ; **pas HEIC (HEVC), pas RAW**.
- **libvips système** — [OFFICIEL] https://sharp.pixelplumbing.com/install : détection par `pkg-config --modversion vips-cpp` ; **`SHARP_FORCE_GLOBAL_LIBVIPS`** (toujours utiliser la libvips système) / `SHARP_IGNORE_GLOBAL_LIBVIPS` ; compilation : C++17, `node-addon-api` ≥ 7, `node-gyp` ≥ 9 (`npm install --save node-addon-api node-gyp`). Version minimale = `config.libvips` du package.json : **sharp 0.35.5 exige libvips ≥ 8.18.7** ([OFFICIEL] registre npm https://registry.npmjs.org/sharp/latest).
- **Versions de libvips des distributions** :
  - Debian ([OFFICIEL] https://tracker.debian.org/pkg/vips) : bookworm 8.14.1, **trixie (stable) 8.16.1**, testing 8.18.6, unstable 8.18.7.
  - Ubuntu ([OFFICIEL] https://launchpad.net/ubuntu/+source/vips) : 24.04 = 8.15.1, 25.10 = 8.16.1, **26.04 = 8.18.0**.
  - → **Aucune distribution stable ne fournit libvips ≥ 8.18.7** : avec sharp 0.35.5, il faut **compiler libvips** dans l'image Docker, ou épingler une version de sharp plus ancienne compatible (correspondance version sharp ↔ libvips non vérifiée).
- **Paquets apt Debian** ([OFFICIEL] https://tracker.debian.org/pkg/libheif ; libheif 1.23.4 indiqué en stable/testing/unstable) : `libheif1`, `libheif-dev`, **`libheif-plugin-libde265`** (décodage HEIC), `libheif-plugin-x265` (encodage), `libheif-plugin-dav1d` (AVIF), `libheif-examples` (outil en ligne de commande `heif-dec`), `libheif-plugins-all`. libvips : `libvips-dev`, `libvips-tools`, `libvips42t64`. LibRaw ([OFFICIEL] https://tracker.debian.org/pkg/libraw) : trixie 0.21.4 (`libraw-dev`, `libraw-bin`), testing 0.22.1.
- → **Voie la plus simple (déduction)** : garder sharp précompilé, et **convertir avant** les formats exotiques avec un outil système : `heif-dec` (paquet `libheif-examples` + `libheif-plugin-libde265`) ou `vips` en ligne de commande (`libvips-tools`, si compilé avec libheif) : HEIC → JPEG/PNG 16 bits, puis sharp. Pas de compilation.
- **RAW / DNG** — [OFFICIEL] libvips 8.18 (4 déc. 2025) https://www.libvips.org/2025/12/04/What's-new-in-8.18.html : « libvips 8.18 now uses libraw to add support for most camera RAW formats » (`dcrawload`) ; [OFFICIEL] https://www.libvips.org/API/current/ctor.Image.dcrawload.html : formats « ARW, CR2, CR3, CRW, **DNG**, NEF… ». Décodage des DNG en **JPEG XL** (iPhone 16 Pro, Samsung DNG 1.7) : non vérifié (dépend de la version de LibRaw).
  - Alternative : **extraire l'aperçu JPEG intégré** avec exiftool (`-PreviewImage`, `-JpgFromRaw`). [FORUM] Immich #31829 (27 sept. 2026) : sur les DNG Samsung en JPEG XL, la balise `PreviewJXL` contient les données capteur brutes (image sombre) → **préférer `PreviewImage`/`JpgFromRaw` et prendre le plus grand aperçu valide**.
  - → Pour un site d'artisan, un RAW n'apporte rien : accepter le DNG mais n'utiliser que l'aperçu JPEG (déduction).
- **Ultra HDR JPEG** : JPEG normal pour tout décodeur (C1) → sharp le lit (image SDR). libvips 8.18 lit/écrit l'UltraHDR via libultrahdr (même source 8.18) ; présence dans sharp précompilé : non trouvé.
- **Motion Photo / Live Photo** : la partie JPEG est lue normalement (vidéo ignorée).
- **Orientation, couleurs, métadonnées** — [OFFICIEL] https://sharp.pixelplumbing.com/api-operation et https://sharp.pixelplumbing.com/api-output, https://sharp.pixelplumbing.com/api-colour :
  - `autoOrient()` : « Auto-orient based on the EXIF Orientation tag, then remove the tag » ; `rotate()` sans angle appelle `autoOrient()`.
  - « By default all metadata will be removed, which includes EXIF-based orientation » → **GPS supprimé par défaut**.
  - « By default output image will be web-friendly sRGB » ; `withIccProfile('srgb'|'p3'|…)` / `keepIccProfile()` pour contrôler. → Display P3 de l'iPhone converti en sRGB par défaut (à tester sur une vraie photo).
- **Brevets HEVC** :
  - libde265 : **LGPL** (bibliothèque) — https://github.com/strukturag/libde265 ; le README ne parle pas des brevets.
  - [OFFICIEL] Access Advance https://accessadvance.com/topic-what-do-we-license/ (10 nov. 2025) : licence couvrant les décodeurs/encodeurs HEVC, y compris « HEVC Software Sold separately from a device » et services cloud (redevance « per authorized user » selon le résumé) ; **aucune exemption publiée pour un décodage logiciel sur serveur**.
  - → Risque juridique réel mais non chiffrable ici (consulter un juriste). **Le contourner** : faire convertir le HEIC **par l'iPhone** (accept restreint, C2) ou par Safari (canvas), ou laisser **Supabase Image Transformations** (qui accepte le HEIC en entrée, recherche n° 1) faire la conversion.

### C4. Envoi depuis la 4G d'un chantier (TUS + Supabase Storage)
- [OFFICIEL] https://supabase.com/docs/guides/storage/uploads/file-limits (màj 2026-10-02) : **Free : 50 Mo max** par fichier ; **Pro et plus : réglable jusqu'à 500 Go** ; limite globale dans Storage Settings, et **limite par bucket** (taille + types de fichiers) qui ne peut dépasser la globale. → Un ProRAW 48 Mpx (≈ 75 Mo) **ne passe pas en Free**.
- [OFFICIEL] https://supabase.com/docs/guides/storage/uploads/resumable-uploads (màj 2026-10-02) : endpoint `https://{projectId}.storage.supabase.co/storage/v1/upload/resumable` ; **chunkSize fixé à 6 Mo** ; l'URL d'envoi est valable **jusqu'à 24 h** ; 409 si deux clients envoient au même endroit (sauf `x-upsert: true`) ; `removeFingerprintOnSuccess: true` conseillé ; en-têtes `authorization: Bearer <jeton>` + métadonnées `bucketName`, `objectName`, `contentType`, `cacheControl`. Aucune note de compatibilité navigateur.
- [OFFICIEL] tus-js-client https://github.com/tus/tus-js-client/blob/main/docs/api.md : `findPreviousUploads()` + `resumeFromPreviousUpload()` ; l'adresse d'envoi est mémorisée dans le **Web Storage** du navigateur (localStorage) par empreinte du fichier ; réessais par défaut `[0, 1000, 3000, 5000]` ms. Dernière version v4.3.1 (16 janv. 2025). Compatibilité Safari iOS : **non trouvé** (pas de liste officielle).
- **Reprise après mise en veille** : pas de Background Sync sur iPhone (recherche n° 1). Si la PWA est tuée, l'objet `File` est perdu ; la doc tus ne dit pas comment le retrouver. → Déduction : **conserver le fichier (Blob) dans IndexedDB** au moment du choix, puis relancer l'envoi à la réouverture de l'app (avec `findPreviousUploads`) ; envoyer d'abord une **version réduite** (ex. 2 500 px JPEG/WebP via canvas) pour que le site se mette à jour vite, l'original ensuite si nécessaire.

---

## D. Accès à l'API Google Business Profile sans fiche propre à l'éditeur de Sitô

### D1. Texte officiel exact
[OFFICIEL] https://developers.google.com/my-business/content/prereqs (màj 2026-08-28), liste des prérequis, mot pour mot :
- « Manage a Google Business Profile that is verified and active for 60+ days. **This GBP can be the applicant's own office or headquarters or it could belong to one of the clients they manage.** »
- « Have a website representing the business listed on the GBP. »
- (même page, résumé) utiliser « an email address that is listed as an **owner/manager** on your business's GBP » ; formulaire « GBP API contact form », option « Application for Basic API Access ».
- **Lien exact du formulaire** (relevé sur la page) : **https://support.google.com/business/contact/api_default** — la page du formulaire elle-même est **refusée à WebFetch (robots.txt)** : champs non vérifiés directement.

→ **Réponse à la question : il n'est PAS nécessaire d'être propriétaire de sa propre fiche.** La fiche peut être **celle d'un client géré** ; il suffit d'être **gestionnaire (manager)** avec l'adresse e-mail utilisée pour la demande. Donc : un artisan client (fiche vérifiée depuis 60 jours ou plus) ajoute l'adresse Google de l'éditeur de Sitô comme **gestionnaire** → l'éditeur de Sitô peut déposer la demande.

### D2. FAQ officielle
[OFFICIEL] https://developers.google.com/my-business/content/faq (màj 2026-08-28), mot pour mot :
- « Any individual or company who can demonstrate legal business reason to access GBP APIs are approved for access. » → **un développeur indépendant peut demander**, s'il justifie d'un usage professionnel légitime.
- « Requests are reviewed within 14 days. »
- « If a 3P partner is added as a manager of the Google Business Profile by the merchant, who should be the primary owner of the GBP, then the 3P partner need not use merchant credentials to use GBP APIs to edit and access GBP data. »
- « We strongly recommend that 3P partners don't add themselves as owner of the GBP but only add themselves as manager. »
- « Register for a GBP Organization account as an agency. » (programme agences : https://developers.google.com/my-business/business-partners → business.google.com/agencysignup ; plateformes → intégration via l'API).
- Conseils de la FAQ (résumé) : e-mail professionnel **sur le domaine de l'entreprise**, site **à jour et en ligne**.

### D3. Règles d'usage
[OFFICIEL] https://developers.google.com/my-business/content/policies (màj 2026-08-28) :
- « You can only use the Business Profile APIs to create, manage, and report on business listings that you either own or are authorized to manage on behalf of the business owner ».
- « If you respond to reviews on behalf of your end-client, you must receive their authorization first ».
- « You cannot allow agencies, end-clients, or other third parties to use your Business Profile project … in a way that allows those third parties to avoid applying for their own Business Profile project ».
- → Sitô doit **recueillir l'autorisation écrite de l'artisan** (CGU + consentement OAuth) avant de répondre aux avis à sa place.

### D4. Le site web demandé
- Texte officiel : « a website representing the business listed on the GBP ». Lu à la lettre avec D1 : si la fiche utilisée est celle d'un artisan client, **le site exigé est celui de l'entreprise de cette fiche** (donc le site Sitô de l'artisan, qui affiche sa fiche). Mais la FAQ insiste sur un e-mail sur le domaine de **l'entreprise demandeuse** → interprétation ambiguë ; **non tranché par une source officielle**.
- → Le plus sûr (déduction) : demande faite par l'éditeur de Sitô avec **un e-mail @domaine-de-sito**, **le site de Sitô en ligne** (avec politique de confidentialité), **et** être gestionnaire de la fiche d'un artisan client dont le site Sitô est en ligne.

### D5. Retours de terrain (non officiels, contradictoires)
- [BLOG] xovionlabs.com, 18 mai 2026 — https://xovionlabs.com/blog/google-business-profile-api-hidden-gate/ : « Sign in as the GBP owner, not a manager » (rejet si demandé depuis un compte gestionnaire) ; délai « 4 days to 6 weeks » ; fiches de moins de 60 jours « auto-rejected ». **Contredit la page officielle** (« owner/manager », « clients they manage ») → à traiter comme un risque, pas comme une règle.
- [BLOG] legalclarity.org (date non visible) — https://legalclarity.org/how-to-complete-the-google-business-profile-api-access-request-form/ : champs cités (ID du projet Cloud, type d'entité « agency / software developer building a platform / business », URL du site, cas d'usage écrit, nombre de fiches) ; « The domain of your website must match the domain of the email address you use to submit the form — a mismatch is a known reason for rejection ». Il parle d'« ID » de projet alors que la recherche n° 1 citait le **numéro** de projet (officiel) → fournir les deux.
- [FORUM] discuss.google.dev, août–sept. 2026 — https://discuss.google.dev/t/business-profile-api-reviews-endpoint-mybusiness-googleapis-com-cant-be-enabled-basic-access-pending-10-business-days/389462 : 8 cas (SaaS d'avis, agences SEO) : demandes **sans réponse 7 à 10+ jours**, ou **approuvées mais l'API v4 (avis) impossible à activer** (« Service [mybusiness.googleapis.com] is not available to this consumer ») ; une agence demande explicitement si une fiche **gérée pour un client** suffit — **sans réponse de Google**. Un utilisateur (28 sept. 2026) signale un 404 sur l'endpoint v4 des avis qui marchait avant.
- [FORUM] localsearchforum.com, févr.–mars 2025 — https://localsearchforum.com/threads/need-help-getting-access-to-google-business-profile-apis.62211/ : refus puis approbation partielle ; « Getting access … was one of the most challenging processes I've encountered ».
- [OFFICIEL] https://developers.google.com/my-business/content/known-issues (màj 2026-08-28) : seul problème listé = pagination des avis (pages 2+ incomplètes) ; **rien sur le blocage de l'activation v4**.

### D6. Conclusion pratique
1. **Pas besoin de créer une fausse fiche ou d'attendre 60 jours une fiche l'éditeur de Sitô** : selon le texte officiel, être **gestionnaire** de la fiche vérifiée (≥ 60 jours) d'un artisan client suffit.
2. Préparer : projet Google Cloud (numéro **et** ID), e-mail sur le domaine de Sitô, site Sitô en ligne avec confidentialité, l'artisan pilote ajoute cet e-mail comme **gestionnaire**, puis formulaire https://support.google.com/business/contact/api_default → « Application for Basic API Access », type « plateforme / développeur ».
3. Risques : blogs qui disent « propriétaire seulement », délai réel (2 semaines officiel, jusqu'à 6 semaines rapporté), et blocage actuel de l'API v4 des avis même après approbation (forum août–sept. 2026). → Garder le mode dégradé (lien profond vers Google pour répondre aux avis).

---

## Synthèse : confirmé / incertain

**Confirmé par une source officielle**
- Un seul Worker (route `*/*`) peut servir tous les domaines clients via Cloudflare for SaaS, sans Workers for Platforms. R2 : sortie gratuite, 0,015 $/Go, cohérence immédiate. Workers 5 $/mois (10 M requêtes). KV : jusqu'à 60 s de délai. Purge par tag sur tous les plans (Free : 5/min).
- Domaine nu sur Cloudflare for SaaS = Enterprise seulement (add-on). Sous-domaines `*.sito.fr` couverts gratuitement (un niveau).
- Custom hostname non validé = supprimé après 7 jours.
- Vercel Pro gère les domaines nus (enregistrement A), mais 100 ajouts de domaine/heure.
- .fr : titulaire UE/EEE/Suisse ; diffusion restreinte par défaut des particuliers. Chez OVH, le titulaire peut ne pas avoir de compte OVH ; la redirection OVH ne gère pas `https://`. Gandi : redirection HTTPS avec certificat.
- Safari iOS n'envoie du JPEG que si `accept` restreint les types d'images. sharp précompilé ne lit ni HEIC ni RAW ; sharp 0.35.5 exige libvips ≥ 8.18.7, absente des distributions stables. libvips 8.18 lit les DNG via LibRaw.
- Supabase : 50 Mo par fichier en Free, jusqu'à 500 Go en Pro ; TUS par morceaux de 6 Mo, URL valable 24 h.
- GBP : la fiche peut être celle d'un client géré ; gestionnaire accepté ; demande examinée en 14 jours.

**Incertain / non trouvé**
- Version d'iOS contenant le correctif WebKit ; comportement de Chrome Android ; Live Photo.
- Risque de brevets HEVC pour un décodage sur serveur.
- Prix de renouvellement Gandi (page incohérente) ; endpoints API de redirection OVH/Gandi ; remises revendeur Gandi.
- Nombre maximal de zones par compte Cloudflare ; délai d'émission du certificat.
- GBP : le site exigé doit-il être celui de la fiche ou celui du demandeur ? Blogs qui disent « propriétaire seulement » ; blocage actuel de l'API v4.

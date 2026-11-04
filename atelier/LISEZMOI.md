# Le service « atelier »

Le service Node qui fait tourner Sitô derrière l'app : il reçoit les photos,
fabrique les sites, les vérifie et les publie. Plan : `app/PLAN-APP.md`,
sections 2, 3 et 5.

| Fichier | Rôle | Essai |
|---|---|---|
| `supabase.mjs` | la seule porte vers la base : les tables (PostgREST) et le stockage, la clé secrète dans l'en-tête `apikey` et jamais en `Bearer` ; un refus de Supabase lève `ErreurSupabase` (jamais une liste vide silencieuse), une écriture rejouée n'écrit qu'une fois | `node scripts/essai-service.mjs` (faux Supabase local, sans réseau ni clé) |
| `photos.mjs` | toute photo reçue (JPEG, PNG, WebP, AVIF, TIFF, GIF, BMP, HEIC, RAW/DNG, Motion Photo) devient une image maîtresse JPEG sRGB, 3 200 px au plus, redressée, **sans métadonnées** ; une vidéo est reconnue et mise à part ; un fichier illisible est refusé avec un motif qui le nomme | `node scripts/essai-photos.mjs` |
| `preparer-recues.mjs` | les lignes `photos.etat = recue` deviennent `prete` (image propre posée à côté de l'original, `chemin`, `largeur`, `hauteur`) ou `illisible` avec un motif écrit pour l'artisan ; la meilleure source est préférée (`chemin_source` dès qu'il est là), un fichier pas encore arrivé laisse la photo « reçue », et `octets` n'est jamais écrasé. Reprenable : l'image s'écrit avant la ligne | `node scripts/essai-preparation.mjs` (faux Supabase local ; `--contre-essai` repose trois fautes une par une) |
| `heic.mjs` | conversion du HEIC par les transformations d'images de Supabase (offre Pro) : Sitô ne décode pas le HEVC lui-même | **pas encore essayé** contre Supabase (projet en offre gratuite) |
| `publier.mjs` | publication par versions : vérifier, écrire la version à côté, basculer les adresses, garder deux versions | `node scripts/essai-publication.mjs` |
| `fabriquer.mjs` | fabrique un site depuis la base (entreprise, profil, tarifs, photos prêtes) ; la charte s'écrit une fois, puis reste figée | `node scripts/essai-fabrication-base.mjs` |
| `boucle.mjs` | un tour : chaque site changé depuis sa dernière fabrication (photo prête, profil, tarifs, entreprise) est refait, vérifié par `verifier-site`, publié par version ; `fabrications`, `versions_site` (une seule en ligne) et `sites.version` notés ; un refus ne remplace rien et ne se retente pas sans changement. Pas de serveur : c'est ce que GitHub Actions appellera (T45) | `node scripts/essai-boucle.mjs` (faux Supabase, vrai générateur et vrai vérificateur ; `--contre-essai` : 4 cassures) |
| `supprimer-comptes.mjs` | les comptes dont la suppression est échue (30 jours, non annulée) : abonnement Stripe résilié (sans Stripe branché, le compte n'est pas effacé), sites retirés de Cloudflare Pages, fichiers du stockage, entreprise et données (cascade), puis le compte ; une entreprise à plusieurs membres garde ses données ; une panne laisse la demande, le tour suivant reprend | `node scripts/essai-suppressions.mjs` (faux Supabase, faux Cloudflare ; `--contre-essai` : 3 cassures) |
| `../worker/routeur.js` | le Worker Cloudflare qui sert tous les sites selon l'adresse demandée | idem |

Outils demandés sur la machine du service : Node 22, `exiftool`
(paquet Debian `libimage-exiftool-perl`), `ffmpeg`.

Ce que les essais ne prouvent pas encore :

- de **vraies** photos d'iPhone et d'Android : le HEIC et le DNG des essais
  sont fabriqués ;
- R2, Workers KV et le cache de Cloudflare réels : les essais les remplacent
  par un dossier et un fichier JSON ;
- la conversion HEIC par Supabase.

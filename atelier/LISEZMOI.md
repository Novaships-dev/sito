# Le service « atelier »

Le service Node qui fait tourner Sitô derrière l'app : il reçoit les photos,
fabrique les sites, les vérifie et les publie. Plan : `app/PLAN-APP.md`,
sections 2, 3 et 5.

| Fichier | Rôle | Essai |
|---|---|---|
| `supabase.mjs` | la seule porte vers la base : les tables (PostgREST) et le stockage, la clé secrète dans l'en-tête `apikey` et jamais en `Bearer` ; un refus de Supabase lève `ErreurSupabase` (jamais une liste vide silencieuse), une écriture rejouée n'écrit qu'une fois | `node scripts/essai-service.mjs` (faux Supabase local, sans réseau ni clé) |
| `photos.mjs` | toute photo reçue (JPEG, PNG, WebP, AVIF, TIFF, GIF, BMP, HEIC, RAW/DNG, Motion Photo) devient une image maîtresse JPEG sRGB, 3 200 px au plus, redressée, **sans métadonnées** ; une vidéo est reconnue et mise à part ; un fichier illisible est refusé avec un motif qui le nomme | `node scripts/essai-photos.mjs` |
| `heic.mjs` | conversion du HEIC par les transformations d'images de Supabase (offre Pro) : Sitô ne décode pas le HEVC lui-même | **pas encore essayé** contre Supabase (projet en offre gratuite) |
| `publier.mjs` | publication par versions : vérifier, écrire la version à côté, basculer les adresses, garder deux versions | `node scripts/essai-publication.mjs` |
| `../worker/routeur.js` | le Worker Cloudflare qui sert tous les sites selon l'adresse demandée | idem |

Outils demandés sur la machine du service : Node 22, `exiftool`
(paquet Debian `libimage-exiftool-perl`), `ffmpeg`.

Ce que les essais ne prouvent pas encore :

- de **vraies** photos d'iPhone et d'Android : le HEIC et le DNG des essais
  sont fabriqués ;
- R2, Workers KV et le cache de Cloudflare réels : les essais les remplacent
  par un dossier et un fichier JSON ;
- la conversion HEIC par Supabase.

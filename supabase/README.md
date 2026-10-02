# La base Supabase

Créée le 2 octobre 2026. Décision de Fabrice : « La base Supabase doit être
solide pour être tranquille et penser à la suite. »

| | |
|---|---|
| Projet | `sito`, référence `magxzrpboyrzguuocjgj` |
| Adresse de l'API | https://magxzrpboyrzguuocjgj.supabase.co |
| Région | Paris (`eu-west-3`) |
| Organisation | Novaships-dev's Org, offre gratuite |

L'offre gratuite autorise deux projets actifs par organisation ; ceux en pause
ne comptent pas. Un projet gratuit sans activité pendant une semaine est mis en
pause par Supabase (il se relance depuis le tableau de bord, données
conservées). D'après la documentation Supabase lue le 2 octobre 2026.

**Aucune clé dans ce dépôt, jamais.** La clé de service (`service_role`)
contourne tous les droits ci-dessous : elle ne vit que dans un fichier `.env`
local (ignoré par Git) ou dans les secrets de l'hébergeur.

## Les migrations

`migrations/` contient tout le schéma, dans l'ordre. Le nom de chaque fichier
porte la version enregistrée par Supabase. Une migration qui a tourné ne se
modifie plus : on en écrit une nouvelle.

| Fichier | Contenu |
|---|---|
| `…_schema.sql` | les tables, leurs contraintes, les index |
| `…_droits.sql` | la sécurité par ligne et les politiques |
| `…_stockage.sql` | les deux espaces d'images et leurs droits |
| `…_metiers.sql` | les seize métiers |

## Les tables

| Table | Ce qu'elle garde | L'artisan |
|---|---|---|
| `metiers` | les seize métiers et leurs codes APE | lit |
| `entreprises` | les faits publics Sirene | lit les siennes |
| `membres` | quel compte représente quelle entreprise | lit les siens |
| `profils` | téléphone, courriel, horaires, **case « afficher mes prix »** | lit et écrit le sien |
| `tarifs` | ses tarifs, poste par poste | lit et écrit les siens |
| `sites` | un site par entreprise et métier, **charte figée** ; remplace `generateur/registre.json` | lit les siens |
| `fabrications` | chaque fabrication et le résultat des cinq vérificateurs | lit les siennes |
| `chantiers` | ses chantiers | lit et écrit les siens |
| `photos` | ses photos, rangées par chantier et par paire avant / après | lit et écrit les siennes, toujours marquées « entreprise » |
| `avis` | les avis Google récupérés | lit les siens |
| `statistiques` | visites, appels, demandes par jour et par page | lit les siennes |
| `prospects` | le suivi de prospection (`skills/prospection-sirene`) | rien : interne |

Les règles qui ne dépendent pas du code de l'app sont dans la base elle-même :
SIREN à neuf chiffres, téléphone à dix chiffres, tarif haut jamais sous le bas,
une seule photo « avant » et une seule « après » par paire, photo toujours
rangée dans le dossier de son entreprise, statut d'un site parmi une liste
fermée.

## Le stockage

| Espace | Contenu | Accès |
|---|---|---|
| `photos-chantiers` | les photos de l'artisan, sous `<siren>/<chantier>/<fichier>`, 15 Mo au plus, JPEG, PNG, WebP, HEIC | l'artisan dans le dossier de ses entreprises |
| `banque` | les images générées par métier | le service seulement |

## Les droits sont essayés, pas supposés

`essais/droits.sql` crée deux artisans fictifs, essaie tout ce que l'un n'a pas
le droit de faire chez l'autre, puis annule tout. Résultat du 2 octobre 2026 :
les onze essais donnent le résultat attendu (écrire chez l'autre, se déclarer
une photo d'illustration, créer ou modifier une entreprise, lire la
prospection, poser un téléphone faux ou un tarif incohérent : refusé ; écrire
chez soi : accepté ; visiteur anonyme : refusé). À rejouer après chaque
migration.

Conseillers Supabase le même jour : aucun avertissement de sécurité ni de
performance. Deux remarques d'information, voulues : `prospects` n'a aucune
politique (accès service seulement), et les index ne servent pas encore (base
vide).

## Ce qui n'est pas encore fait

- Le générateur lit encore `generateur/registre.json`. Le brancher sur la
  table `sites` demande la clé de service sur l'ordinateur qui fabrique.
- L'inscription d'un artisan (création du compte, vérification qu'il
  représente l'entreprise, ligne dans `membres`) n'existe pas.
- Les images du ravalement ne sont pas encore dans l'espace `banque`.
- Les types TypeScript de l'app se génèrent quand l'app existera :
  `supabase gen types typescript --project-id magxzrpboyrzguuocjgj`.

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

## Ajouts du 5 octobre 2026 (migration `20261005014022_app`)

Pour l'app (plan : `app/PLAN-APP.md`, section 7.5) :

| Table | Ce qu'elle garde | L'artisan |
|---|---|---|
| `abonnements` | la seule source de la formule et de l'état du paiement | lit le sien |
| `evenements_stripe` | les événements Stripe déjà traités | rien |
| `demandes` | les messages du formulaire du site | lit, marque lu (`lue_le` seulement) |
| `adresses` | sous-domaine offert, domaine acheté, domaine existant | lit |
| `versions_site` | versions publiées, une seule en ligne | lit |
| `videos` | vidéos de chantier gardées | lit, ajoute, supprime |
| `connexions_google` | état de la connexion Google | lit |
| `prive.jetons_google` | jeton Google chiffré | rien, jamais |
| `suppressions` | suppression du compte à 30 jours | demande (sans choisir la date), annule |

`photos` reçoit tout format : l'app envoie l'original (`chemin_original`), le
service pose l'image propre (`chemin`) et l'état `prete` ou `illisible` ;
l'app ne peut écrire ni l'un ni l'autre. `avis` reçoit un brouillon de réponse
que seul un membre de l'entreprise valide, en son nom. `profils` reçoit les
mentions légales (TVA, décennale, médiateur). `prive.jour_paris()` donne le
jour de Paris. Espace `photos-chantiers` : tout format, 50 Mo (à passer à
150 Mo avec l'offre Pro).

Essai : `essais/droits-app.sql`, 16 essais conformes le 5 octobre 2026 ;
`essais/droits.sql` rejoué le même jour : conforme.

**Ajout du 9 octobre 2026** (migration `20261009005808_photo_source`,
décision de Fabrice « 3. OK ») : `photos.chemin_source` et `octets_source`.
L'app envoie d'abord la version réduite (`chemin_original`), puis le fichier
d'origine en pleine résolution, qu'elle pose dans `chemin_source` ; elle ne
peut écrire que ces deux colonnes en plus. `essais/droits-app.sql` étendu :
19 essais conformes le 9 octobre ; avant la migration, l'essai rougissait
(colonne absente).

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
| `prospects` | le suivi de prospection (`.claude/skills/prospection-sirene`) | rien : interne |

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

**Rejoué le 29 octobre 2026** (T05, après la dernière migration
`20261009005808_photo_source` ; base et dépôt ont les mêmes 7 migrations) :
`droits.sql` 11 résultats attendus, `droits-app.sql` 20 résultats attendus,
aucune « FAUTE », rien de resté dans la base. Conseillers : aucun
avertissement. Sécurité, 3 informations voulues : `prospects`,
`evenements_stripe` et `prive.jetons_google` sans politique (service
seulement, « rien, jamais » pour l'app). Performance : 18 index jamais
utilisés (base vide).

## Ce qui n'est pas encore fait

- Le générateur lit encore `generateur/registre.json`. Le brancher sur la
  table `sites` demande la clé de service sur l'ordinateur qui fabrique.
- L'inscription d'un artisan (création du compte, vérification qu'il
  représente l'entreprise, ligne dans `membres`) n'existe pas.
- Les images du ravalement ne sont pas encore dans l'espace `banque`.
- Les types TypeScript de l'app se génèrent quand l'app existera :
  `supabase gen types typescript --project-id magxzrpboyrzguuocjgj`.

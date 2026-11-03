# Le vocabulaire de Sitô

Écrit par Claude (Cowork) le 3 novembre 2026, sur le modèle du `CONTEXT.md`
de mattpocock/skills relevé dans `docs/historique/audit-repos.md` §18.6. Un mot
du projet a **un seul sens**, celui-ci. Un texte, un nom de variable ou un
écran qui l'emploie autrement se corrige. Chaque entrée cite où le mot vit
dans le dépôt.

## Les personnes

| Mot | Sens | Où |
|---|---|---|
| Fabrice | le fondateur ; seul à décider du produit et des dépenses | `memoire/decisions.md` |
| artisan | l'entreprise du bâtiment pour qui un site est fabriqué ; identifiée par son SIREN | table `entreprises` |
| abonné | artisan qui a pris l'abonnement (au mois ou à l'année) | table `abonnements` |
| titulaire | le compte de l'artisan rattaché à son entreprise (rôle dans `membres`) | table `membres` |
| visiteur | le particulier qui arrive sur le site de l'artisan | `app/specs/01-PRD.md` §3 |
| Claude Code | l'agent qui code seul sur le PC de Fabrice | `CLAUDE.md` §2 |
| Cowork | Claude dans l'app, avec Fabrice ; dépose des fichiers et l'annonce dans `memoire/de-cowork.md` | `CLAUDE.md` §2 |

## Les sites

| Mot | Sens | Où |
|---|---|---|
| site de prospection | site fabriqué pour un artisan **avant** qu'il soit client, avec des images d'exemple, publié en privé (noindex, adresse secrète), retiré à 30 jours | `app/specs/08-PROSPECTION.md` |
| site d'abonné | site d'un artisan abonné, avec ses photos, publié à son adresse | `app/PLAN-APP.md` §3 |
| métier | un corps de métier (ravalement, couverture, peinture…) ; 16 prévus | `generateur/metiers/`, `generateur/banque/plan-images.json` |
| archétype | une des 4 compositions de page : `matiere`, `panneau`, `planche`, `elevation` | `generateur/tirage.mjs` |
| charte | l'ensemble tiré pour un site (archétype, famille, sol, polices, géométrie, mot géant) ; **figée** une fois tirée | `generateur/charte.mjs`, colonne `sites.charte` |
| famille | une des 7 familles de couleurs en rotation | `.claude/skills/_partage/references/palettes.md` |
| sol | fond clair ou sombre d'un site | `generateur/charte.mjs` |
| mot géant | le mot du métier affiché en très grand à l'ouverture | `generateur/composer.mjs` |
| comparateur | le curseur avant / après qu'on glisse au doigt ou à la souris | `generateur/sections/comparateur.mjs` |
| paire | une photo « avant » et sa photo « après » du même chantier | table `photos` (`paire`) |
| nuancier | le choix de teintes montré sur la page | `generateur/sections/nuancier.mjs` |
| tarifs | les prix **de l'artisan**, affichés seulement s'il coche la case | table `tarifs`, `profils.prix_affiches` |
| estimateur | le calcul pour le visiteur, fait avec les seuls tarifs de l'artisan | `generateur/sections/prix.mjs` |
| image d'exemple | image de la banque, marquée « Exemple » sur la page jusqu'à ce que l'artisan mette les siennes | `rules/web/photos.md` |
| banque | les images générées par métier (54 prévues par métier) | `banque/`, espace de stockage `banque` |
| unicité | deux sites voisins (même métier, même commune ou même département) ne se ressemblent pas | `scripts/verifier-unicite.mjs` (U1 à U4) |
| registre d'unicité | ce que chaque site a déjà pris (phrases, chartes), pour que le suivant diffère | `generateur/registre.json` |
| plancher | ce qu'aucune page ne peut rater (contraste, polices, poids, appel…) | `scripts/verifier-site.mjs` |

## La fabrication et la publication

| Mot | Sens | Où |
|---|---|---|
| fabrication | produire les fichiers d'un site depuis les données et les photos | `generateur/composer.mjs`, table `fabrications` |
| vérificateurs | les cinq scripts qui jugent un site : dépôt, site, ordinateur, mobile, unicité | `README.md` |
| version | un état publié d'un site ; la nouvelle s'écrit à côté, puis le pointeur bascule | `atelier/publier.mjs`, table `versions_site` |
| service atelier | le code qui prépare les photos, fabrique et publie ; tournera dans GitHub Actions | `atelier/` |
| boucle | un tour du service : refaire, vérifier, publier chaque site changé | `atelier/boucle.mjs` |
| Worker | le programme Cloudflare qui sert tous les sites selon l'adresse demandée | `worker/routeur.js` |
| photo reçue / prête / illisible | les trois états d'une photo envoyée par l'app | colonne `photos.etat` |
| original | le fichier d'origine en pleine résolution, envoyé après la version réduite | colonne `photos.chemin_source` |

## La prospection

| Mot | Sens | Où |
|---|---|---|
| lot du jour | les sites de prospection fabriqués pour la soirée (30 visés, 3 métiers au moins) | `scripts/prospection/fabriquer-lot.mjs` |
| slug | l'adresse secrète de 16 caractères d'un site de prospection | `prospection/registre-sites.json` |
| page d'appels | la page du jour sur l'iPhone de Fabrice : qui appeler, résultat au doigt | `worker/appels.js`, `scripts/prospection/page-appels.mjs` |
| statut d'appel | un des 9 résultats possibles d'un appel (`a-appeler` … `ne-plus-appeler`) | `worker/appels.js` (`STATUTS`) |
| registre de prospection | qui a été trouvé, noté, appelé ; **aucun numéro de téléphone** | `prospection/registre.json` |

## L'app et les comptes

| Mot | Sens | Où |
|---|---|---|
| lien d'inscription | le lien envoyé par SMS par Fabrice ; crée le compte et le rattache à l'entreprise ; un seul usage, 14 jours | table `invitations` (genre `inscription`) |
| lien de reprise | le lien qui remplace « mot de passe oublié » | table `invitations` (genre `reprise`) |
| démonstration | l'app sans compte, sur des données inventées (`?demo`) | `app/src/donnees/demo.ts` |

## Le travail

| Mot | Sens | Où |
|---|---|---|
| tâche T.. | une ligne de travail de Claude Code, avec sa preuve | `app/specs/07-TACHES.md` |
| action F.. | ce que seul Fabrice peut faire (compte, clé, paiement, appareil) | `memoire/actions-fabrice.md` |
| question Q.. | une question posée à Fabrice, avec la réponse recommandée | `memoire/questions.md` |
| constat S.. | un constat d'audit numéroté | `docs/audit/REGISTRE.md` |
| dette D.. | un défaut connu, accepté pour l'instant | `docs/DETTE.md` |
| contre-essai | l'essai lancé sur une copie cassée exprès, qui doit rougir | `docs/REGLE-ESSAIS.md` E1 |
| garde-fou verrouillé | un fichier que Claude Code n'a pas le droit de modifier | `CLAUDE.md` §3, point 10 |

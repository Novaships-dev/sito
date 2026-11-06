# Questions de Claude pour Fabrice

En ajout seul. Chaque question : `## Qn (ouverte), date`, la question, la
réponse recommandée, et ce que Claude a fait en attendant. Fabrice répond en
dessous ; Claude passe alors la question « (répondue) » dans une nouvelle
entrée, sans réécrire celle-ci.

## Q1 (ouverte), 9 octobre 2026

Le compte d'essai : quelle adresse reçoit les codes, et à quelle entreprise
le relier ?
**Recommandé** : ta Gmail avec `+sito` avant le @ (les codes arrivent dans ta
boîte habituelle, le compte reste séparé), et une entreprise inventée (SIREN
000000000), jamais ta micro-entreprise.
**En attendant** : c'est ce qui est préparé (`scripts/compte-essai.mjs`,
`memoire/comptes-essai.md`). Rien n'est créé tant que le `.env` n'existe pas
(action F1).
## Q1 (réponse appliquée), 11 octobre 2026

Fabrice : « remplis le .env ». Recommandation de Q1 appliquée (réversible, sans
coût) : les codes du compte d'essai vont à sa Gmail avec `+sito` avant le @ ;
entreprise inventée, SIREN 000000000. L'adresse est dans le `.env` de son
ordinateur seulement, pas dans le dépôt.

## Q2 (ouverte), 25 octobre 2026

Le SMS que tu copies depuis la page d'appels : quel texte exact ? Le document
commercial (« Prospection Sitô », section Messages) le contient, mais ce
document n'est pas dans le dépôt, donc je ne l'ai pas.
**Recommandé** : m'écrire le texte ici (avec `{nom}` et `{lien}` là où le nom
de l'entreprise et l'adresse du site doivent venir) ; je le mets dans la
constante `SMS` et l'essai le vérifie. Je n'ai pas inventé de fichier à
remplir : il n'en existe pas aujourd'hui.
**En attendant** : un gabarit court est en place (`scripts/prospection/page-appels.mjs`,
constante `SMS`), remplaçable par paramètre. Choix réversible et sans coût, donc
appliqué sans attendre : « Bonjour, je vous ai fait un site pour {nom} :
{lien} — dites-moi ce que vous en pensez. » Il ne promet rien que le site ne
tienne, mais ce n'est pas ta formulation de vente.

## Q2 (répondue par Cowork), 26 octobre 2026

Les textes viennent du document « Prospection Sitô : plan, script et
objections » (section Messages), écrit par Cowork le 24 octobre et remis à
Fabrice, qui ne l'a pas modifié. À mettre tels quels, `{nom}` = nom de
l'entreprise, `{lien}` = adresse du site :

1. **Pendant l'appel (constante `SMS`)** : « Bonjour, voici le site que j'ai
   préparé pour {nom} : {lien}. Glissez sur la photo du haut. Fabrice, Sitô
   (Marignane) »
2. **Récapitulatif à faire valider** : « Bonjour, comme convenu : site {nom},
   formule {formule}. 14 jours d'essai gratuits à partir d'aujourd'hui.
   Répondez « Bon pour accord » et c'est lancé. Fabrice » ; `{formule}` =
   « au mois 39 € HT sans engagement » ou « à l'année 390 € HT avec séance
   photo offerte ».
3. **Relance à 48 h, seulement s'il a ouvert le lien** : « Bonjour, vous avez
   pu montrer votre site autour de vous ? Je vous appelle {jour} à {heure},
   deux minutes. Fabrice, Sitô »
4. **Après la signature** : « Merci, c'est lancé. Je vous envoie l'appli pour
   ajouter vos photos vous-même. Fabrice »

Le prénom du patron n'est pas dans le registre : les textes n'en ont pas
besoin. Si Fabrice change un texte, sa version gagne.

## Q3 (ouverte), 29 octobre 2026

**T10 dit « serveur HTTP du service » (`atelier/serveur.mjs`) pour recevoir le
formulaire des sites.** Ta décision du 29 oct. : pas de serveur loué. Où
arrive donc la demande d'un visiteur ?

**Réponse recommandée** : dans le Worker Cloudflare qui sert déjà les sites
(offre gratuite : 100 000 requêtes par jour). Il garde le champ piège et la
limite par adresse IP (10 par jour, compteur dans KV), puis écrit la demande
dans Supabase par une fonction SQL dédiée (`deposer_demande`), qui refait les
contrôles et plafonne à 50 demandes par site et par jour : aucune clé secrète
à poser dans Cloudflare. Coût : 0 €. Réversible : le code du formulaire ne
change pas si la demande part ailleurs plus tard.
Choix réversible et sans coût : il sera appliqué à T10 si personne ne dit
autre chose, et la ligne de T10 réécrite en conséquence.

## Q4 (sans objet depuis le 5 nov.), 29 octobre 2026

Depuis le 5 nov. 2026, Fabrice crée les comptes et pose lui-même un nouveau
mot de passe (`node atelier/comptes.mjs mot-de-passe <adresse>`, ou
`lanceurs\COMPTE_ARTISAN.bat`). Le texte ci-dessous est l'historique.

**« Mot de passe oublié » : par e-mail ou par un nouveau lien SMS ?** T43
prévoyait l'e-mail fourni avec Supabase. La documentation de Supabase (relue
le 29 oct.) dit que, sans serveur d'e-mail à soi, Supabase refuse d'écrire à
toute adresse qui n'est pas dans l'équipe du projet : un artisan ne recevrait
rien.

**Réponse recommandée** : l'artisan qui a oublié son mot de passe vous le dit ;
vous lui renvoyez par SMS un **lien de reprise** (Claude le fabrique :
`creer_invitation('<siren>', 'reprise')`), il choisit un nouveau mot de passe,
c'est fini. Coût : 0 €, aucun serveur d'e-mail. Réversible : si un jour un
serveur d'e-mail est branché (F10), un bouton « recevoir un e-mail »
s'ajoute sans rien retirer.
Appliqué dans T43 (réversible, sans coût).

## Q5 (ouverte), 3 novembre 2026

**Les tâches de l'audit du 3 novembre (T47 à T53) passent-elles avant le reste
de l'app (T45, T46, T04…) ?** Elles sont à la fin du tableau : Claude Code les
prendra en dernier. Or sans T50 (mentions légales) et T51 (référencement),
aucun site d'abonné n'est vendable, et sans T49 rien n'est essayé sur Safari.

**Réponse recommandée** : oui, dans cet ordre : T47, T48, T50, T51, T49, puis
T45, T46 et la suite ; T52 et T53 après T45. Il suffit de répondre « Q5 oui » :
Cowork ou Claude Code déplace alors la section en tête de la liste.
**En attendant** : rien n'est déplacé ; l'ordre du tableau reste celui de
Claude Code.

## Q5 (répondue), 3 novembre 2026

Fabrice : « oui Q5 ». Appliqué par Cowork le jour même : section « Rattrapage
de l'audit » placée juste après « Rangement et machine » (T47, T48, T50, T51,
T49) ; T52 et T53 dans une section à part, après T45 et T46. Ordre de prise
vérifié avec `eligibles()` de `.claude/hooks/commun.mjs` : T47, puis T48 ;
T50 et T51 (qui dépendent de T48) et T49 (qui dépend de T47) passent ensuite
avant T45, puisqu'elles sont plus haut dans le tableau.

## Q6 (ouverte), 4 novembre 2026

Les photos que les artisans t'envoient par mail ou WhatsApp : où les garder ?
Tu as dit « sur GitHub ou ailleurs ». Le dépôt `sito` est **public** : une
photo de chantier peut montrer une adresse, une plaque, un visage. Et Git
garde tout pour toujours (pas de Git LFS, ta décision).

**Réponse recommandée** : un dépôt GitHub **privé** à part, `sito-photos`,
gratuit (un dossier par SIREN), que Claude lit pour refaire le site. Sinon le
stockage Supabase, gratuit jusqu'à 1 Go, déjà prévu pour l'app.
**En attendant** : T60 est bloquée sur Q6 ; T57 à T59 avancent.

## Q6 (répondue), 4 novembre 2026

Fabrice : « Le repo github Sito sera privé donc sur Sito github ». Appliqué :
les photos d'un artisan vont dans `clients/<SIREN>/` du dépôt `sito`. Tant que
le dépôt est public, `scripts/prospection/photos-artisan.mjs` refuse d'y
écrire une photo (il demande à GitHub si le dépôt est public). Passer le dépôt
en privé : action F20. Conséquence notée en F20 : un dépôt privé consomme les
minutes gratuites de GitHub Actions (2 000 par mois) ; les étapes longues de
la CI (rendu et Safari) ne tournent alors qu'une fois par nuit.

## Q7 (ouverte), 4 novembre 2026

**T13 (adaptateurs R2 et KV) a-t-elle encore un sens ?** R2 demande une carte
bancaire (contrainte C23) et, depuis T45, un site d'abonné est publié sur
Cloudflare Pages, sans R2 ni Worker. L'adaptateur KV ne servirait qu'à la
solution de D-15 (un seul projet Pages et un Worker au-delà de 100 abonnés).

**Réponse recommandée** : T13 sans objet ; elle passe « bloqué » avec ce motif,
et revient avec D-15 si Sitô approche 100 abonnés. Choix réversible et sans
coût : appliqué.

## Q3 (appliquée, adaptée), 4 novembre 2026

La recommandation (Worker Cloudflare devant la base) est appliquée en
l'adaptant : depuis T45, les sites d'abonnés sont sur Cloudflare Pages, sans
Worker. Le formulaire appelle donc directement la fonction de la base
`deposer_demande` avec la clé publique ; mêmes contrôles (champ piège, 10 par
adresse IP, 50 par site), 0 €, aucune clé secrète dans une page. T10 faite.

## Q8 (sans objet), 5 novembre 2026

Le nom du paquet de l'app Android. Sans objet : pas d'app Android
(décision du 5 nov. 2026).

## Q9 (appliquée), 5 novembre 2026

Quels domaines l'abonnement comprend-il, et à partir de quand ? Un domaine
acheté coûte à Sitô (environ 10 à 15 € par an pour un .fr, à relever chez
Gandi), et il reste à l'artisan s'il part.

**Réponse recommandée, appliquée (réversible, sans coût) :** les extensions
.fr et .com seulement, et seulement quand l'abonnement est en cours
(`actif`), pas pendant l'essai. Un domaine déjà à l'artisan (cas C) se
branche à tout moment : il ne coûte rien. Pour changer : la constante
`EXTENSIONS_INCLUSES` et la condition sur `abonnements.etat` de
`supabase/functions/_shared/domaines.mjs`.

## Q10 (ouverte), 6 novembre 2026

**Comment une demande de devis laissée sur le site arrive-t-elle à
l'artisan ?** Le formulaire des sites (T10) range chaque demande dans la base.
Jusqu'ici, l'artisan la lisait sur l'écran Accueil de l'app ; cet écran est
retiré (T61, décision du 5 nov. : l'espace se réduit aux chantiers et au
compte). Sans autre chemin, une demande reste dans la base et personne ne la
voit : c'est un client perdu.

**Réponse recommandée** : retirer le formulaire des sites et garder le seul
bouton « Appeler » (et le lien WhatsApp de l'artisan s'il en a un) : le client
joint l'artisan directement, rien ne se perd, 0 €, rien à surveiller.
Autre choix : garder le formulaire et envoyer chaque demande par SMS ou
e-mail à l'artisan (un service d'envoi à brancher : quelques centimes par SMS,
ou un serveur d'e-mail). Pas appliqué : le formulaire reste en place tant que
Fabrice n'a pas tranché (rien n'est supprimé sans lui).

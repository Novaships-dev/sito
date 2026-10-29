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

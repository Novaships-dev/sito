# Décisions de Fabrice

Ce fichier ne contient que ce que Fabrice a dit ou tranché lui-même. Rien de ce
que Claude a proposé n'y entre tant que Fabrice ne l'a pas validé. Chaque ligne
porte sa date et, quand c'est possible, ses mots exacts.

En ajout seul. Une décision remplacée n'est pas effacée : elle est marquée
« remplacée le … » et la nouvelle est écrite en dessous.

Sources : les conversations du 7 septembre au 2 octobre 2026, et la mémoire du
projet Compréhension. La partie du 7 au 15 septembre n'existe plus qu'en
résumé : les citations de cette période sont reprises du résumé, pas de
l'échange d'origine.

---

## Comment travailler avec lui

| Date | Décision |
|---|---|
| sept. 2026 | « Concis, direct, en français. Pas de flatterie, pas de mise en garde non demandée. Questions toutes en un seul tour, numérotées, chacune avec ta réponse recommandée, pour que je réponde par numéros. Ne construis rien avant mon accord sur le plan. Si un accès manque ou si un fichier est introuvable, dis-le. **N'invente jamais un résultat.** » |
| sept. 2026 | Les documents du projet (cahier des charges, architecture, organisation des dépôts…) ont été **rédigés par Claude, pas par lui**. Il n'a pas pu tout vérifier : ils contiennent des passages faux ou inutiles et **ne doivent jamais être cités comme ses décisions**. |
| sept. 2026 | Quand un dépôt est analysé, il attend une lecture fichier par fichier, pas un survol du README. |
| 2 oct. 2026 | « bien lire les conversations, il faut ouvrir les fichiers et les lire, pas juste les survoler, prends ton temps, concentre-toi et fais-le bien » |
| sept. 2026 | Il travaille surtout sur iPhone : tout doit marcher pareil sur téléphone et sur ordinateur. |

## Le dépôt et les outils

| Date | Décision |
|---|---|
| sept. 2026 | « **Pas de Git LFS**, j'en ai décidé ainsi. » Les images lourdes ne vont donc pas dans Git. |
| 2 oct. 2026 | Un dépôt dédié à l'app, avec **tout ce qui a été fait ces deux ou trois dernières semaines réuni dessus**. « Il ne faut rien oublier. » |
| 2 oct. 2026 | « Il va falloir créer un repo et une base pour ça. » Le choix de **Supabase** vient de Claude ; Fabrice a répondu « oui » à l'ensemble du plan sans le trancher séparément. À lui confirmer avant de créer quoi que ce soit de payant. |
| 2 oct. 2026 | **Supabase confirmé** : « Oui Supabase, j'ai le MCP. » « La base Supabase doit être **solide** pour être tranquille et penser à la suite. » |
| 2 oct. 2026 | « AgentShield et auto-conseil doivent être **supprimés**, je ne les utilise plus. » (projets Supabase, en pause ; suppression à faire par Fabrice dans le tableau de bord) |
| 2 oct. 2026 | Ordre de travail : barre d'appel, puis prix, puis unicité au département, puis base. « Le meilleur pour toi. » |

## Le produit

| Date | Décision |
|---|---|
| sept. 2026 | Le cœur du produit, c'est **le site internet créé pour l'artisan**, et ce que l'app fait autour. Pas les protocoles ni les tableaux de rentabilité. |
| sept. 2026 | **Rejet du test terrain de trois semaines** prévu dans le cahier des charges. |
| sept. 2026 | Ordre de travail : d'abord garantir que les sites sont faits correctement et respectent les règles du dépôt, **ensuite** chercher à quels artisans les proposer. |
| sept. 2026 | Les règles sont **une base, pas un gabarit** : chaque site doit rester différent et unique. |
| sept. 2026 | Nom : **Sitô**, provisoire. |
| 23 sept. 2026 | **Le rôle de l'app** : « L'app permet à l'artisan de voir les stats de son site, ses commentaires Google et sa fiche pro Google, ainsi que d'ajouter des images avant/après de ses chantiers pour enrichir le site. L'app sert à son référencement. » |
| 23 sept. 2026 | « C'est une application, **le site s'adapte aux images ajoutées**, c'est fait exprès pour ça, c'est du code. » La façon technique de le faire reste à choisir par Claude (voir `app/README.md`). |
| 23 sept. 2026 | « Il va falloir faire **tous les métiers, et à 100 %**. » |
| 23 sept. 2026 | « Les archétypes doivent être **tous utilisés**, c'est débile d'en avoir que un. » |
| 2 oct. 2026 | **Le téléphone** : pas de recherche du numéro sur la fiche Google ; « c'est mieux de laisser l'artisan choisir ». Tant qu'il ne l'a pas donné dans l'app, le site montre un emplacement désigné. |
| 2 oct. 2026 | **Les prix** : « Ce n'est pas le générateur qui décide, c'est l'artisan qui coche une case pour activer ça ou pas, et ensuite ajouter ses tarifs, c'est tout. » « Certains artisans n'auront pas forcément envie d'afficher leurs prix, c'est à prendre en compte dans l'app et les sites. » **Remplace** la règle « un ordre de prix figure sur la page » de `rules/web/client.md`. |
| 2 oct. 2026, soir | **L'estimateur revient, calculé sur les tarifs de l'artisan** (« Oui », contre la recommandation de Claude d'attendre). |

## L'unicité des sites

| Date | Décision |
|---|---|
| 23 sept. 2026 | « Le problème c'est que les 3 sites se ressemblent complètement. » / « Mon app ne doit pas faire les mêmes sites pour chaque artisan. » |
| 24 sept. 2026 | « Pour les points 2, 3, 4, 5, 6 : **tout doit être différent**, c'est aussi simple que ça, et ça pour chaque métier, chaque site généré. » Les points en question : photos, structure, textes, nuancier, prix, comparateur. |

| 2 oct. 2026 | « Différent dans **commune et département**, très important. » |
| 2 oct. 2026, soir | Taille visée : **100 sites** d'un même métier différents dans un même département (« Oui 100 »). |
| 2 oct. 2026, soir | Photos à grande échelle : « **Chaque métier a des images différentes.** » Réponse à la proposition de Claude (une dizaine de photos de façade et de paires avant / après par métier, et le partage de la banque accepté au-delà pour les sites de prospection) : la banque grandit métier par métier. |
| 2 oct. 2026, soir | Textes à grande échelle : « Si tu recommandes, ok » : les réserves de phrases s'agrandissent par fragments combinés. |
| 2 oct. 2026, nuit | Intitulés de section : « Oui ça peut se répéter, c'est pas un problème je pense. » Le contrôle U3 ne les compte plus. |

Les **prix** : remplacé le 2 octobre. Ce ne sont plus des prix du marché
sourcés et identiques d'un site à l'autre, ce sont **les tarifs de l'artisan**,
affichés seulement s'il coche la case (voir « Le produit »).

## Les images

| Date | Décision |
|---|---|
| sept. 2026 | Sur un site de prospection il n'y a **aucune photo de l'artisan** : le design fait tout l'effet. |
| 15 sept. 2026 | « Il va falloir une banque d'images, d'assets, d'animations pour chaque métier, pour donner quelque chose au client sans qu'il ait mis ses images. » |
| 15 sept. 2026 | « Je peux toutes les faire générer par IA avec ChatGPT, c'est même mieux. […] Il va falloir la liste des métiers et la liste exacte de ce qu'il faut générer comme images par métier : matière, geste, ambiance, signes et autres. » |
| 15 sept. 2026 | « Je génère des images avant/après **pour présenter le site à l'artisan**, et s'il s'abonne et prend le site, **il devra mettre les siennes**. » |
| 15 sept. 2026 | « Pas obligé d'expliquer d'où vient l'image, c'est un site, l'artisan et le client s'en foutent. » Tranché le 2 octobre, ligne suivante. |
| 2 oct. 2026 | « Oui, ça reste des exemples le temps que l'artisan ajoute les siennes. » La mention « Exemple » reste sur les images de la banque jusqu'à ce que l'artisan mette ses photos. |
| 15 sept. 2026 | 32 images par métier, avec des prompts ChatGPT « le top du top, précis à fond ». |
| 23 sept. 2026 | « Les images sont utiles » : les images générées doivent **réellement servir** dans les sites. |
| sept. 2026 | Plaques sur les images : retirer les plaques d'immatriculation, garder les numéros de rue. |

## Le design

| Date | Décision |
|---|---|
| sept. 2026 | Direction de départ : panneau sombre à gauche avec le titre en grand, photo du geste en gros plan à droite. Depuis le 23 septembre ce n'est plus qu'un des quatre archétypes. |
| sept. 2026 | La palette d'un site peut sortir de la palette Sitô, à condition que la couleur ajoutée s'accorde avec le reste. |
| sept. 2026 | Les pages de démonstration `demo-rmpc-v2`, `demo-rmpc-ermont`, `demo-page-chantier`, `demo-ecran-vente` sont **à jeter** : ce ne sont pas de vrais sites. |
| sept. 2026 | « Je te demande interactif et animé. » |
| sept. 2026 | Le curseur avant/après : « Ça doit fonctionner pour les deux » (souris et doigt). |
| sept. 2026 | Ce qu'il retient de Framer : « surtout de l'animation et un beau design », pas la structure des pages. |
| 15 sept. 2026 | « Tout doit être lisible, clair et intuitif. » Le mot RAVALEMENT était trop gros sur ordinateur et le nom de l'entreprise trop discret. |

## L'app

| Date | Décision |
|---|---|
| 3 oct. 2026 | « StructorAI et Sitô sont 2 apps différentes. » « Concentre-toi sur Sitô. » Le plan de l'app ne s'appuie plus sur StructorAI. |
| 3 oct. 2026 | Aucun lien entre Sitô et une autre entreprise de Fabrice tant qu'il ne l'a pas dit : « tu dois supprimer tout rapport » avec celle que Claude avait citée. Qui édite Sitô reste à lui demander. |
| 3 oct. 2026 | Hébergement de milliers de sites : « OK donc comment faire, faut écrire tout ça avec la solution. » Solution écrite dans `app/PLAN-APP.md` section 3, en attente de son accord. |
| 3 oct. 2026 | Domaines des artisans : « OK donc faut organiser ça. » Organisation écrite dans `app/PLAN-APP.md` section 4, en attente de son accord. |
| 3 oct. 2026 | Photos : « Tout doit être accepté, iPhone etc., la totale. » Tous les formats de tous les appareils (HEIC, RAW, Live Photo, Ultra HDR…). |
| 5 oct. 2026 | Éditeur de Sitô : « Ma micro-entreprise, mais c'est un détail à la fin. » |
| 5 oct. 2026 | Nom : « Sitô est un nom comme ça pour l'instant, je sais pas, il va falloir trouver le nom de domaine parfait. » |
| 5 oct. 2026 | Oui à : hébergement Cloudflare (un seul Worker), registrar Gandi, adresse offerte en sous-domaine par défaut, domaine propre inclus dans l'abonnement, vidéos acceptées et gardées, réponses aux avis préparées et validées par l'artisan, Supabase Pro au premier client. |
| 5 oct. 2026 | Artisan pilote pour l'accès Google : « Non, mais je vais trouver. » |
| 5 oct. 2026 | L'app : « Il faut qu'elle soit sur Android Store, et pour Apple Store c'est compliqué, alors elle doit pouvoir être installée ou ajoutée sur la page d'accueil comme une app via le site Sitô. » |
| 5 oct. 2026 | Abonnement au mois et à l'année : « Oui, les deux. » Montants non fixés. |
| 9 oct. 2026 | « 1. GO 2. OK » : construction lancée (base, photos, publication par versions, puis l'app) ; prix proposé accepté : **39 € HT par mois, 390 € HT par an**. |
| 9 oct. 2026 | « C'est bon l'ordinateur et là tu peux tout faire comme il faut. » |
| 9 oct. 2026 | Il veut six documents `.md` pour coder : PRD, TRD tablé, AppFlow tablé, Design System (Design Brief), schéma back-end, plan d'implémentation tablé. Écrits dans `app/specs/`. |
| 9 oct. 2026 | Essai gratuit : **14 jours** (« 2. OK »). |
| 9 oct. 2026 | L'original en pleine résolution est envoyé après la version réduite (« 3. OK »). |
| 9 oct. 2026 | Engagement de l'abonnement mensuel : il demande l'avis de Claude (« quelle est le mieux selon toi ? ») ; recommandation : sans engagement, l'annuel servant d'engagement. |
| 9 oct. 2026 | « ok » : **mensuel sans engagement**, l'annuel (390 € HT) sert d'engagement. |
| 9 oct. 2026 | « Fais en sorte que le repo sito soit parfait pour que Claude Code puisse coder […] je veux que le repo soit prêt pour être codé car après Claude Code sera lancé et je ne veux plus intervenir. Je veux allumer mon ordinateur et il code et rectifie et finalise l'app jusqu'au bout. » Outillage de travail autonome mis en place (`CLAUDE.md` section 2, `app/specs/07-TACHES.md`, `.claude/`). |
| 10 oct. 2026 | « Si il y a des problèmes il doit pouvoir aller chercher et trouver la solution tout seul et rectifier ce qu'il faut sans mon autorisation. » |
| 10 oct. 2026 | Plan de dépannage autonome : « Parfait ». Réponses : « 1. Auto » (mode d'autorisation **auto**) ; « 2. OK » (budget par panne : **3 approches ou 45 minutes**, puis tâche bloquée avec diagnostic) ; « 3. OUI » (installer sans demander les outils **gratuits et open source**, sans droits d'administrateur) ; « 4. OUI » (annuler ses propres commits avec **`git revert`**) ; « 5. OUI » à la recommandation « garde-fous **verrouillés** » (lu comme l'accord sur le plan, qui disait « ce qui reste fermé à clé ») ; « 6. OK » (**20 lancements par jour** au plus). |
| 23 oct. 2026 | Prospection pendant que l'app se code : « préparer ma prospection pour appeler des artisans et leur présenter les sites que j'ai faits pour eux », avec un nombre de sites par jour, un nombre d'appels et un pitch ; mettre en avant qu'il peut « venir sur leur chantier prendre des photos » lui-même. |
| 23 oct. 2026 | Réponses au plan : sélectionner les meilleurs profils (« fiche Google faible etc. ») ; « tous les sites du jour doivent être prêts avant » ; rythme 30 sites et 60 appels par jour accepté, « faut même viser plus » ; **30 sites par jour sur au moins 3 métiers différents** ; images à générer par métier, « carrées », sans image sans but ; un pitch « de pro comme le loup de Wall Street » ; hébergement des sites montrés : « le meilleur moyen, sécurisé et gratuit » ; offre : 14 jours d'essai pour tous et séance photo offerte avec l'annuel (« Oui parfait ») ; plan + script + objections dans un document, suivi à part. « Ce qui bloque ne doit pas être bloquant. » |
| 24 oct. 2026 | « Oui réveille la base » (projet Supabase `sito` réveillé par Claude, Cowork, le 24 oct.) ; séance photo avec la formule au mois : « Oui parfait 90 euro » (**90 € HT la visite**) ; images de couverture et peinture : « générer par moi à la main » dans ChatGPT. « Je veux des artisans réels. » |
| 29 oct. 2026 | Métier ravalement : « Ravalement de façade c'est des façadiers ». Les maçons généralistes, l'isolation, les cheminées et toute entreprise dont le métier n'est pas la façade ne reçoivent **pas** de site de ravalement. « Faut surtout trouver d'où vient ce problème » : la cause est à trouver et à corriger, pas seulement les sites du jour. |
| 29 oct. 2026 | Place sur le PC : « Claude doit travailler sur ma machine mais tout transférer dans GitHub une fois fini, sinon j'aurai jamais assez de mémoire ». Ce qui est fini et en sécurité ailleurs (GitHub pour le code et la mémoire, Cloudflare pour les sites publiés) ne reste pas sur le PC. |
| 29 oct. 2026 | « Il faut aussi éviter les fichiers doublons etc, faut faire des audits et supprimer et rectifier. » |
| 29 oct. 2026 | Dépenses repoussées jusqu'à ce que l'app soit finie et fonctionne : « Le nom de domaine on va attendre que l'app soit finie et fonctionne » ; « Cloudflare je paye pas pour rien » (pas d'offre payante) ; « Stripe on va attendre qu'elle fonctionne » ; « Google Play pareil ». Hébergement et serveur d'e-mail : questions posées, pas encore tranchées. |
| 29 oct. 2026 | « Je vais pas louer un ordi pour faire tourner une app » ; connexion : « le mec s'inscrit c'est fini ». Réponse « Ben ouais » aux deux propositions : (1) **pas de serveur loué** : les photos sont préparées dans l'app, le site est refait et publié par GitHub Actions, gratuitement ; (2) **inscription par e-mail et mot de passe, une seule fois, sans code**. Fabrice : « c'est toi qui as décidé tout ça, pas moi » (le serveur hébergé et le code par e-mail venaient de Claude). |
| 3 nov. 2026 | Audit du dépôt : « tout doit être correct niveau fichier et complet, surtout rien ne doit manquer » ; « tout doit être fait sur le repo » (sur GitHub, pas sur le PC). Ordre des tâches : « oui Q5 » : les tâches de l'audit T47, T48, T50, T51, T49 passent avant le reste de l'app ; T52 et T53 après T45 et T46. « Enchaine le lot 2 » (produit : PRD avec le site d'abord, fonctions du site, référencement, mentions légales). |
| 4 nov. 2026 | **Modèles de prospection.** « si ont fait 10 site différent par jour pour la prospection et que les 10 sont refuser par les artisan j'ai 10 site de fait pour rien » ; « faire un site modèle pour toute les entreprise contacter ou l'ont change juste ce qu'il faut par rapport a l'entreprise contacter » ; « des qu'il y'en a un d'accepter il devient officiel et donc il faudra l'avoir en tant que référence pour ne pas refaire le même pour le prochain appelle » ; « une dixaine de template de site différent niveau couleur et architecture de prêt au cas ou il y'en a plusieurs d'accepter à la suite » ; « une fois le site accepter par l'artisan il envoie ces photos par mail ou whatsapp pour que je puisse avec l'aide de Claude ajouter a sont site en attendant la construction de l'app ». « Le stockage on le stock sur github ou ailleurs c'est pas un problème » ; « 100 site différent mais valider si il ne sont pas valider sa sers a rien » ; « j'envoie le site a l'artisan si il l'accepte c'est bon on met c'est photos on le peaufine et c'est fini ». Réponses de Fabrice : (1) l'artisan qui accepte garde le site montré : « Oui logique » ; (2) « Oui 10 par métier » ; (3) « Oui chaque site accepter est différent » ; (4) photos reçues par mail ou WhatsApp, déposées pour Claude qui les met sur le site : « Oui c'est sa ». |
| 4 nov. 2026 | Photos des artisans (Q6) : « Le repo github Sito sera privé donc sur Sito github ». Les photos reçues par mail ou WhatsApp sont gardées dans le dépôt `sito`, qui passe en privé. |

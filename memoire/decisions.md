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

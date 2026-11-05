# Images de la page MonSiteArtisan.com

Commande d'images pour ChatGPT (demande de Fabrice du 6 nov. 2026 : « que sa
soit cohérent et que sa donne envie et que sa soit compréhensible pour
l'artisan et que sa saute direct au yeux ce qu'on fait et que ces de la
qualité »). Écrit par Claude (Cowork), à valider sur le rendu.

## La direction, commune à toutes les images

Le même monde partout, pour que la page tienne d'un bloc :

- **Lieu** : Marseille et la Provence. Maisons en enduit clair, tuiles rondes
  orangées, volets peints, ciel bleu. Pas de Paris, pas de buildings.
- **Lumière** : fin d'après-midi, soleil bas et chaud, ombres douces.
- **Gens** : artisans de 30 à 50 ans, tenue de travail propre **vert foncé**
  (la couleur de la marque), sans logo, sans casque sauf sur un toit.
  Visages naturels, souriants sans poser.
- **Interdits** : aucun texte, aucun logo, aucune plaque d'immatriculation,
  aucun écran avec des lettres lisibles (les écrans sont ajoutés par la page).
- **Qualité** : « photo réaliste, appareil plein format, objectif 35 mm,
  netteté nette, grain naturel ».

**Comment faire** : ouvrir une seule conversation ChatGPT pour tout le lot.
Coller d'abord le bloc « À coller en premier », puis demander les images une
par une, dans l'ordre. Télécharger chaque image et l'envoyer à Claude dans la
conversation Cowork, avec son numéro.

### À coller en premier

> Tu vas me faire une série de photos pour le site d'une entreprise qui crée
> des sites internet pour les artisans du bâtiment, à Marseille. Toutes les
> photos doivent former une série cohérente : photo réaliste, appareil plein
> format, objectif 35 mm, lumière chaude de fin d'après-midi, Provence
> (enduit clair, tuiles rondes, volets peints, ciel bleu). Les artisans
> portent une tenue de travail propre vert foncé, sans logo. Jamais de texte,
> de logo, de plaque d'immatriculation ni d'écran lisible. Je te demande les
> photos une par une.

## Les 6 images

| N° | Où sur la page | Format | Demande |
|---|---|---|---|
| 1 | En haut, la grande photo | paysage 3:2 | « Photo 1 : un artisan façadier d'environ 40 ans, debout devant une maison provençale dont il vient de refaire la façade (enduit neuf couleur pierre claire, volets bleu-gris), il regarde son téléphone en souriant, un échafaudage démonté posé contre le mur. Plan américain, il est sur le tiers gauche, la façade remplit le reste. » |
| 2 | Section « l'app » | portrait 4:5 | « Photo 2 : gros plan sur les mains d'un artisan, gants de travail retirés et posés sur un seau, qui prend en photo avec son téléphone une façade fraîchement enduite. On voit le téléphone de dos, l'écran n'est pas visible. Arrière-plan flou. » |
| 3 | Avant / après | paysage 3:2 | « Photo 3 : la façade d'une maison marseillaise **avant** travaux, prise de face : enduit sale et grisé, fissures, traces noires sous les fenêtres, volets délavés. Même lumière que les autres. » |
| 4 | Avant / après | paysage 3:2 | « Photo 4 : **exactement la même façade, même cadrage, même lumière** que la photo 3, **après** ravalement : enduit neuf couleur pierre claire, fissures disparues, volets repeints en bleu-gris. » (dans la même conversation que la photo 3) |
| 5 | Exemple de site : couvreur | paysage 3:2 | « Photo 5 : un couvreur avec casque sur un toit de tuiles rondes orangées neuves, en train de poser les dernières tuiles, vue sur les toits de Marseille et la mer au loin. » |
| 6 | Exemple de site : peintre | paysage 3:2 | « Photo 6 : une grande pièce de maison provençale qui vient d'être repeinte en blanc chaud, parquet protégé par une bâche, un peintre de dos range ses rouleaux près d'une fenêtre ouverte sur le jardin. » |

## Ce que la page en fait

- La photo 1 porte le haut de la page. Par-dessus, un téléphone montre un site
  d'exemple et une notification « Nouvelle demande de devis » : on comprend
  tout de suite qu'un site ramène des clients.
- Les photos 3 et 4 forment un comparateur à glisser, comme sur les sites des
  artisans.
- Les photos 1, 5 et 6 habillent trois sites d'exemple différents (façadier,
  couvreur, peintre), montrés dans un ordinateur et un téléphone.
- Les fichiers vont dans `app/public/vitrine/` (`1.webp` à `6.webp`), réduits
  par Claude. Ce sont des images générées, aucune photo d'un vrai artisan :
  elles peuvent aller dans le dépôt même public.

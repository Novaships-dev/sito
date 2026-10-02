# Pièges

Chaque entrée est une panne qui a réellement eu lieu, avec ce qui l'attrape
aujourd'hui. Si une panne n'a pas de garde, c'est écrit. En ajout seul.

La leçon qui chapeaute toutes les autres : **une règle qui demande un jugement
ne se déclenche jamais.** Elle ne tient que le jour où un script la mesure, et
ce script doit avoir été essayé une fois sur une copie cassée exprès.

---

## Livraison et continuité

| Date | Panne | Garde |
|---|---|---|
| 14 sept. | Livraison faite en choisissant les fichiers à la main : `zone-matiere.mjs`, `methode.md`, `client.md`, `facture.md` restent en arrière. Le générateur casse, le lanceur réécrit le bon fichier avec une vieille version. | `scripts/verifier-depot.mjs` ; le dépôt se livre entier ; le lanceur s'arrête à la première erreur. `rules/methode.md`. |
| 16 sept. | L'espace de travail de Claude est vidé entre deux sessions. Le correctif iPhone, écrit mais jamais posé sur l'ordinateur de Fabrice, est perdu et refait de mémoire. | **Ce dépôt.** Tout ce qui compte est poussé sur GitHub. Rien ne vit seulement dans l'espace de Claude. |
| 15 sept. → 1er oct. | Deux semaines de travail n'existent que dans l'espace de Claude : GitHub et le Bureau restent au 14 septembre. | Idem. Pousser à la fin de chaque séance de travail. |
| 23 sept. | Claude construit sans avoir lu `palettes.md`, où la rotation des sept familles était écrite depuis le 7 septembre. | `CLAUDE.md` : lire `memoire/` puis `rules/` avant d'écrire une ligne. |

## Rendu et interaction

| Date | Panne | Garde |
|---|---|---|
| sept. | Anneau du pointeur : une transition CSS se bat contre le script qui le déplace à chaque image (513 px de retard) ; départ depuis (0,0) ; `scale` et `transform` sur le même élément (765 px de décalage). | règles V6, contrôles O du vérificateur ordinateur. |
| sept. | Comparateur mort : couche de saisie maison, retour arrière du navigateur qui vole le glissement horizontal, poignée de 46 px qui fausse la correspondance doigt / valeur. | Input range natif sur tout le cadre, `overscroll-behavior-x:none`, poignée de 2 px. Règle V4. M7 à M11, O5. |
| sept. | `@property --p{inherits:false}` : la couture ne bougeait sur aucun appareil, et tous les contrôles lisaient la variable au lieu des pixels. | Les contrôles mesurent la couture rendue, jamais la variable. `rules/methode.md`. |
| sept. | Contrôle O5 qui mesurait les mauvais boutons ; M5 instable une fois sur six. | Contrôles limités au comparateur testé ; attente de fin d'animation. |
| sept. | Le filet vert du chantier trompe la mesure de la coupure (33 % au lieu de 48 %). | `couture.mjs` reconnaît le filet. |
| 16 sept. | **Premier écran invisible sur iPhone** : les blocs partaient à `opacity:0` et n'apparaissaient qu'avec une classe posée par le script, qui n'arrivait pas. | Contenu visible par défaut, animation demandée par `body.anime`. **O11** charge la page JavaScript coupé. Règle V1. |
| 16 sept. | L'écran d'ambiance mesurait 1 000 px sur un écran de 844 : le premier écran paraissait décalé. | En-tête et ambiance forment un seul bloc ; la photo est le seul bloc élastique. `rules/web/composition.md`. |
| 23 sept. | Le nuancier se pose **sur** les boutons du comparateur, qui deviennent incliquables ; le vérificateur meurt sur un clic intercepté au lieu de nommer la faute. Cause : `align-items:center` casse la chaîne de hauteur. | `rules/web/composition.md`, « Un bloc qui déborde de sa rangée en recouvre un autre ». |
| 23 sept. | Plancher de 12 px sur téléphone écrasé par une règle de 10 px déclarée plus bas. | Bloc téléphone toujours en dernier dans chaque feuille. M4. |
| 23 sept. | Mouvement réduit incomplet sur trois archétypes : animations qui continuent, voile d'entrée qui ne part jamais. | Coupure du mouvement portée par `sections/arrivee.mjs`, qui possède l'écran d'entrée. V2, V3. |
| 23 sept. | Sol clair : voiles blancs invisibles sur papier, barre d'état noire, boutons illisibles. Une couleur en dur dans un module partagé ne marche que sur un seul sol. | Toutes les couleurs des modules passent par les jetons de `charte.mjs`. |
| 1er oct. | Une variable de police se référençait elle-même (`--texte-police:var(--texte-police)`) : le navigateur l'invalide sans bruit et affiche du Times New Roman. Visible sur les captures du 23 septembre, non relevé. | **O12** vérifie que le texte s'affiche dans les polices déclarées. |

## Unicité

| Date | Panne | Garde |
|---|---|---|
| 23 sept. | Trois ravaleurs de Marseille : même accent `#b08c6f`, même fond, mêmes polices, même mot géant. Seule la grille changeait. Cause : palette prélevée dans les mêmes photos de démonstration. | `charte.mjs` : rotation des sept familles, sol, polices, géométrie, mot géant. `verifier-unicite.mjs` U1. |
| 24 sept. | Même après la charte : mêmes photos, même structure, même vivier de textes, même nuancier, même comparateur. | Main de photos, structure tirée, vivier triplé, nuancier tiré, comparateur tiré. U2 (titre), U3 (phrase commune), U4 (comparateur). |

## Méthode de Claude

| Date | Panne | Garde |
|---|---|---|
| sept. | Survol des dépôts au lieu de les lire, réponses à côté de ce que Fabrice voit à l'écran. | Lire les fichiers en entier, regarder les captures qu'il envoie, mesurer avant d'affirmer. |
| 23 sept. | Question posée à Fabrice sur un choix technique qui était le sien à faire (site statique ou dynamique). | Les choix d'ingénierie se tranchent et se disent ; seuls les choix de produit se posent en question. |
| 1er oct. | Commande `cat > fichier` sans contenu en entrée : l'outil attend dix minutes. | Toujours un `<<'FIN'` ou un fichier source. |

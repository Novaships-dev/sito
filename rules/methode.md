# Méthode

Cette règle existe parce qu'elle a été enfreinte, plusieurs fois, dans la même
semaine. Elle passe avant les règles de design : une belle page produite hors du
dépôt ne vaut rien, elle meurt à la fin de la conversation.

## Rien ne se construit hors du dépôt

Toute page destinée à un artisan **sort du générateur**. Pas d'un fichier écrit à
la main dans un dossier temporaire, pas d'une maquette isolée, pas d'un exemple
« juste pour montrer ».

Une maquette a un seul usage légitime : trancher une direction en dix secondes.
Dès qu'elle est validée, **elle entre dans le dépôt le jour même**, sous forme
d'archétype et de règles. Une maquette validée qui n'est pas intégrée est une
dette, pas un livrable.

## Un livrable, c'est quatre choses ensemble

1. le code dans le dépôt, au bon endroit, pas dans un dossier temporaire ;
2. la règle écrite dans `rules/`, pour que la décision survive à la session ;
3. le contrôle dans `scripts/`, pour qu'elle soit vérifiée sans qu'on y pense ;
4. les **trois** vérificateurs de rendu à zéro : `verifier-site.mjs` (le
   fichier), `verifier-ordinateur.mjs` (souris et clavier), `verifier-mobile.mjs`
   (doigt), plus `verifier-depot.mjs` avant tout le reste.

Une page se juge sur les deux appareils, jamais sur un seul. Le comparateur a
été réparé pour le doigt puis cassé pour la souris, puis l'inverse, parce qu'un
seul des deux était vérifié à chaque fois.

Il en manque un, ce n'est pas fini. On ne dit pas que c'est fini.

## Une livraison, c'est le dépôt entier

Une mise à jour ne se compose **jamais** en choisissant les fichiers à la main.
On envoie le dépôt complet, produit par un script, et on le contrôle avant de
s'en servir.

Le 14 septembre 2026, une livraison a été faite en listant les fichiers un par
un. Quatre pièces sont restées en arrière : `generateur/zone-matiere.mjs`,
`rules/methode.md`, `rules/web/client.md`, `rules/web/facture.md`. Le générateur
a cassé au premier lancement, les trois sites n'ont pas été refabriqués, et le
fichier livré à l'artisan était l'ancien — sans rien de ce qui venait d'être
écrit. Le contrôle, lui, tournait sur les vieilles pages et les déclarait
bloquées pour une autre raison, ce qui a masqué la vraie.

Trois verrous, dans cet ordre :

1. `scripts/verifier-depot.mjs` suit chaque import, chaque police, chaque règle
   citée, et refuse si une pièce manque. Il tourne **avant** le générateur.
2. Le lanceur s'arrête à la première erreur. Une fabrication qui échoue
   n'écrase jamais un fichier déjà livré.
3. Les vérificateurs tournent sur la page qu'on vient de produire, avec sa date,
   pas sur ce qui traîne dans le dossier de sortie.

Un `SORTIE=0` sur l'installation ne prouve rien : il dit que l'archive s'est
ouverte, pas qu'elle était complète.

## Le dépôt se lit avant de construire

Avant d'écrire une ligne, on lit `rules/web/`. Le dépôt existe pour éviter de
redécouvrir ce qui est déjà décidé. Ne pas le lire, c'est rendre obsolète tout
ce qu'il contient, et refaire à moitié ce qui était fait.

## Les interdits ne sont pas une méthode

`design-interdits.md` dit ce qu'il ne faut pas faire. Ce n'est pas un langage de
design. Retirer tout ce qui est moderne sans rien mettre à la place produit une
page de 2010 : des aplats, des rectangles, des bordures à un pixel, rien qui
bouge. La méthode est dans `composition.md` et `facture.md`. Les interdits ne
sont que le plancher.

## Un contrôle ne lit jamais ce que le code vient d'écrire

Vérifier qu'une variable CSS a la bonne valeur ne prouve rien : c'est répéter
ce que le code a fait, pas constater ce que le visiteur voit. Un contrôle
mesure le rendu — une position en pixels, une taille, une couleur calculée —
et il doit être essayé une fois sur une copie cassée exprès. Un contrôle qui
n'a jamais rien attrapé n'est pas un contrôle.

## Ce qui se dit et ce qui ne se dit pas

On ne dit jamais qu'une chose marche sans l'avoir mesurée. On donne la mesure.
Quand un contrôle ne peut pas prouver quelque chose, on le dit au lieu de
laisser croire que le contrôle couvre tout.

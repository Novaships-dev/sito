# Mouvement et manipulation

Une page d'artisan bouge pour une raison : montrer le travail. Le mouvement
qui ne montre rien est du bruit, et le bruit fait fuir le client. Ces six
règles sont le plancher. Elles se vérifient dans `scripts/verifier-site.mjs`,
section `vie()`.

## V1 — Aucune animation ne peut cacher le contenu

Une animation liée au défilement (`animation-timeline: view()`) ne touche
jamais `opacity`. Sur un navigateur qui ne la gère pas, ou quand le défilement
ne franchit jamais le seuil, le bloc resterait invisible pour toujours. Le
mouvement porte sur `transform`, `clip-path`, `filter`, jamais sur la
visibilité. Le texte est lisible avec le JavaScript coupé.

### L'arrivée des blocs n'est jamais une condition d'affichage

Un bloc qui arrive en fondu part de `opacity:0`. Cette opacité nulle doit être
demandée par une classe que le script pose lui-même (`body.anime`), et non
retirée par une classe qu'il posera peut-être. Écrit dans l'autre sens
— `.bloc{opacity:0}` révélé par `body.prete` — la page devient invisible dès
que la classe n'arrive pas : script lent, erreur plus haut, JavaScript coupé.

Le 16 septembre 2026, tout le premier écran d'un site livré était invisible sur
un iPhone pour cette raison : il ne restait qu'un dégradé vide. Le contrôle
`O11` de `verifier-ordinateur.mjs` charge la page avec le JavaScript coupé et
refuse tout bloc à opacité nulle.

## V2 — Le mouvement se coupe

Dès qu'une `@keyframes` existe, la page déclare
`@media (prefers-reduced-motion: reduce)` et y neutralise animation et
transition. Ce n'est pas une option de confort : c'est un réglage système que
des gens activent pour des raisons qui ne nous regardent pas.

## V3 — L'écran d'entrée a une sortie garantie

Un voile plein écran au chargement est un pari sur le réseau de l'artisan.
Il n'est acceptable qu'avec trois verrous : `pointer-events:none` sur le
voile, un plafond en dur d'au plus 2,5 s posé avec `setTimeout`, et un retrait
immédiat au premier geste (pointeur, touche, défilement). Si le JavaScript
échoue avant, le voile ne doit jamais exister : il est posé par le script,
pas écrit en dur dans le HTML servi sans script.

## V4 — Ce qui se manipule est un contrôle natif, pas une couche maison

Chaque élément manipulable — comparateur, nuancier, estimateur — **est** un
contrôle natif (`<input type="range">`, `<button>`), pas un `div` rendu
sensible au JavaScript. Le contrôle porte un `aria-label` en français.

Le comparateur en est l'exemple : le `range` couvre tout le cadre
(`inset:0`, `opacity:0`, `z-index:3`), et le script ne fait que recopier sa
valeur dans `--p`. Le navigateur s'occupe du reste — souris, doigt, stylet,
clavier — sur tous les systèmes, y compris ceux qu'on ne peut pas essayer
d'ici.

Une couche de saisie écrite à la main a été essayée : détection de direction,
`preventDefault` conditionnel, trois chemins séparés. Elle passait tous les
contrôles en machine et ne fonctionnait pas sur un vrai téléphone. Trois
pièges, tous constatés :

- **Le geste horizontal est volé par le navigateur.** Un glissement de côté
  est pris pour un retour arrière et la page change. Correctif :
  `overscroll-behavior-x: none` sur `html` et `body`. Sans lui, la couture ne
  bougera jamais sur un téléphone, quoi qu'on écrive en JavaScript.
- **Le pouce large décale la valeur.** Un pouce de 46 px laisse 23 px morts à
  chaque bout : on pose le doigt à 15 % et on obtient 9 %. Le pouce fait 2 px
  de large ; la cible tactile, c'est le cadre entier.
- **Le défilement vertical doit rester possible** au-dessus du comparateur :
  `touch-action: pan-y` sur le contrôle.

### Une variable qui change ne prouve rien

Le comparateur n'a jamais fonctionné, sur aucun appareil, pendant plusieurs
jours. `@property --p` était déclaré `inherits:false` : la variable changeait
bien sur `.cadre`, et les enfants qui dessinent la couture et découpent l'image
— `.couture`, `.apres`, `.teint` — ne la voyaient jamais. Mesuré après coup :
la valeur passait de 50 % à 20 % pendant que la couture restait à 720 px sur
1440, et le `clip-path` à `inset(0 0 0 50%)`.

Personne ne l'a vu parce que **tous les contrôles lisaient `--p` sur le cadre**
— la seule chose qui bougeait. Un contrôle qui lit ce que le code écrit ne
contrôle rien : il se contente de répéter.

Règle : on mesure ce que l'œil voit. Position de la couture en pixels,
`clip-path` calculé, taille rendue — jamais la variable qu'on vient d'écrire.
`@property` avec `inherits:false` est interdit pour toute variable lue par un
enfant.

Vérifié en rendu réel : M7 (glissement au doigt en haut et en bas de l'image),
M8 (la page défile encore), M9 (une simple touche suffit), M10 (les boutons
marchent), M11 (le contrôle natif existe, large et attrapable).

## V5 — Le décor ne bloque jamais

Un `<canvas>` est un décor : `aria-hidden="true"`, `pointer-events:none`, et
l'image qu'il remplace reste dans le HTML derrière lui. Un canvas qui ne
remplace rien — de la poussière dans un rai de lumière, par exemple — se
déclare avec `data-decor="oui"` : il n'a pas d'image à préserver, mais les deux
autres conditions restent. Si le contexte
graphique échoue — vieux téléphone, `file://`, pilote refusé — le visiteur
voit la photo et ne sait pas qu'il manque quelque chose.

## V6 — Le pointeur dessiné ne remplace pas le vrai

Un pointeur personnalisé est `pointer-events:none` et disparaît sous
`@media (pointer:coarse)`. On ne masque jamais le curseur système sur toute
la page : si le rendu du nôtre s'arrête, le visiteur doit encore voir où il
clique. C'est un halo autour de la flèche, pas un remplacement — donc il doit
lui rester collé. Trois fautes, toutes constatées le 14 septembre 2026 :

- **Transition CSS sur `transform`.** Le script écrit la position à chaque
  image ; une transition de 180 ms par-dessus en relance une à chaque fois et
  l'anneau traîne. Mesuré : jusqu'à 513 px derrière la flèche, contre 36 à
  50 px une fois la transition retirée et le lissage porté à 0,45.
- **Échelle et position sur le même élément.** `scale` et `transform` se
  multiplient : au survol, l'anneau s'éloigne de la flèche d'autant qu'il
  grossit. La position va sur le parent, l'échelle sur un enfant.
- **Départ au coin haut gauche.** Sans poser l'anneau sous la flèche avant de
  le montrer, il traverse l'écran au premier mouvement de souris.

Le survol se détecte avec **un seul écouteur** et `closest()`. Un
`pointerenter` posé sur chaque élément éteint le halo dès qu'on passe sur un
enfant, alors que la souris n'a pas quitté le parent.

---

Ces règles disent ce qui est interdit, pas ce qu'il faut faire. Le mouvement
propre à chaque site reste libre et doit rester différent d'un site à
l'autre : voir `design-interdits.md`, test d'unicité.

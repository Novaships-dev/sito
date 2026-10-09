# État au 9 octobre 2026

À lire en premier, à chaque séance. Réécrit à la fin de chaque séance.

---

## Ce qui marche, mesuré

**Le générateur de sites.** À partir d'un SIREN, d'un métier et d'un dossier
de photos, il fabrique un site complet en environ une minute et demie.

- **Quatre archétypes**, au même niveau : `matiere`, `panneau`, `planche`,
  `elevation`.
- **Appeler l'entreprise** sur les quatre : barre fixe en bas sur téléphone,
  bouton dans la pastille du haut sur ordinateur, numéro en grand dans la
  section contact. Le numéro vient de l'artisan (champ `telephone`) ; sans lui,
  un emplacement « Votre numéro ici », jamais un lien vide.
- **Prix** : seulement si l'artisan coche la case et saisit ses tarifs (champ
  `prix`). Les sites de prospection n'ont pas de section prix.
- **Estimateur** : revenu sur décision de Fabrice, calculé avec les seuls
  tarifs de l'artisan. Le visiteur règle sa surface et coche ses postes ; un
  tarif au m² se multiplie, un forfait s'ajoute, un tarif au mètre ou à l'unité
  reste hors calcul et la page le dit. Calcul vérifié dans un navigateur.
- **Couleurs** : chaque surface a ses couleurs de texte, calculées pour tenir
  4,6:1 sur les sept familles et les deux sols.
- **Unicité** contre les voisins : même métier, même département, la commune
  comptant cinq fois plus. Voir « Où en est l'unicité ».
- **Cinq vérificateurs**, tous à zéro sur les trois sites de démonstration :

| Script | Ce qu'il vérifie | Règles |
|---|---|---|
| `scripts/verifier-depot.mjs` | le dépôt est complet, rien ne manque | — |
| `scripts/verifier-site.mjs` | le plancher de la page, sans navigateur | 24, dont T1 et T2 (appel) |
| `scripts/verifier-ordinateur.mjs` | souris et clavier réels | O1 à O15, dont O13 (contraste rendu), O14 (appel au premier écran), O15 (la pastille du haut ne touche aucun texte) |
| `scripts/verifier-mobile.mjs` | doigt réel, trois téléphones (360, 390, 430 px) | M0 à M13, dont M12 (contraste rendu) et M13 (barre d'appel) |
| `scripts/verifier-unicite.mjs` | la distance entre deux sites voisins, commune et département | U1 à U4 |

**Les trois sites de démonstration** (ravalement, Marseille) :
Sud Ravalement Façades `480423623`, Evora Ravalement `881767842`, Provence
Ravalement Peinture `849891528`. Données Sirene dans `donnees/entreprises-demo/`.

**La base Supabase** : projet `sito`, Paris, offre gratuite. Douze tables,
sécurité par ligne partout, deux espaces d'images, seize métiers. Droits
essayés avec deux artisans fictifs : conformes. Voir `supabase/README.md`.

**Les images du ravalement** : les 32 générées par Fabrice le 15 septembre.
Correspondance dans `banque/ravalement/provenance.md`.

## Où en est l'unicité

Objectif fixé par Fabrice le 2 octobre : **100 sites d'un même métier
différents dans un même département**.

Mesuré avec `node scripts/capacite-unicite.mjs --photos plan` (projection avec
les 54 images prévues par métier), à 100 sites :

| | Le 2 octobre au matin | Le 2 octobre, fin de journée |
|---|---|---|
| sites tous différents, sans aucun défaut | 3 | **100** |
| paires de sites trop proches (U1) | 40 sur 4 950 | 0 |
| même titre (U2) | 285 | 0 |
| au moins une phrase commune (U3) | 4 488 paires | 0 |
| même comparateur (U4) | 419 | 0 |
| même façade coupée | 49 % des paires | 9 % (avec les nouvelles images) |
| phrases partagées par deux sites (gestes, précisions) | non mesuré | 0,5 en moyenne, 5 au plus |

Même résultat, 0 défaut, si les 100 sites sont tous dans la même commune.
Avec les 17 photos d'aujourd'hui : 0 défaut aussi, mais une paire de sites sur
deux montre la même façade coupée.

Ce qui a changé : textes du ravalement réécrits par morceaux combinés
(110 titres, des milliers d'énumérations, 100 textes par geste), comparateur à
120 formes, couleurs, polices, géométrie et mot géant tirés ensemble, retirage
quand un site ressemble trop à un voisin, 22 images de plus par métier au plan.
Les intitulés de section (« Prendre contact. ») peuvent se répéter : décision
de Fabrice, U3 ne les compte plus.

## Ce qui manque, par ordre d'importance

1. **Les 22 nouvelles images du ravalement** : hero 3 à 10, paires 04 à 10.
   Prompts prêts dans `banque/prompts/ravalement.md` (images 33 à 54). Tant
   qu'elles ne sont pas générées, une paire de sites sur deux montre la même
   façade.
2. **Un seul métier sur seize.** `generateur/metiers/` ne contient que
   `ravalement.json`. Chaque métier doit atteindre le même volume de textes que
   le ravalement pour tenir 100 sites. Les codes APE du ravalement diffèrent
   entre `ravalement.json` (cinq codes) et `plan-images.json` (trois) : à
   aligner.
3. **Les images des quinze autres métiers** : 54 chacun, 810 au total ; sujets
   dans `banque/liste-images.md`, prompts seulement pour le ravalement.
4. **Quinze images de la banque du ravalement inutilisées** : matière 02 à 08,
   ambiance 01 à 05, signes 01 à 03.
5. **La deuxième page** n'existe que sur l'archétype `matiere`.
6. **Référencement absent** : pas de données structurées `LocalBusiness`, pas
   d'aperçu de partage, pas de favicon, pas de `sitemap.xml` ni de `robots.txt`.
7. **Aucun site en ligne.** Pas d'hébergement, pas de domaine.
8. **Safari jamais testé.** Les vérificateurs tournent sous Chromium.
9. **L'app** : écrite et essayée en démonstration le 9 octobre (voir plus
   bas). Jamais lancée contre la vraie base. Manquent : le service HTTP, le
   branchement du générateur sur la table `sites`, Stripe, Gandi, Google.

## Questions ouvertes pour Fabrice

1. **AgentShield et auto-conseil** (Supabase) : suppression à faire par
   Fabrice dans le tableau de bord, une suppression étant définitive.

## Prochaine action

**App** : `app/PLAN-APP.md` (décisions de Fabrice du 5 octobre, section 10).
Construction lancée le 5 octobre (« GO ») :

- **base** : migration `20261005014022_app` appliquée (abonnements, demandes,
  adresses, versions du site, vidéos, Google, suppressions, mentions légales,
  photos de tout format) ; `supabase/essais/droits-app.sql` : 16 essais
  conformes ; `droits.sql` rejoué : conforme ;
- **photos** : `atelier/photos.mjs`, 18 formats et cas essayés, 0 faute,
  contre-épreuve attrapée (`node scripts/essai-photos.mjs`) ;
- **publication par versions** : `atelier/publier.mjs` et
  `worker/routeur.js`, 19 essais, 0 faute, deux contre-épreuves attrapées
  (`node scripts/essai-publication.mjs`) ;
- **l'app** (9 octobre) : `app/`, React, installable (PWA). Connexion par
  code e-mail, accueil (semaine, demandes), chantiers et photos (préparation
  sur l'appareil, file d'envoi gardée dans IndexedDB, envoi TUS), mon site
  (téléphone, case prix, tarifs), adresse, avis (réponse préparée validée),
  fiche Google, abonnement (aucun prix dans l'app Android), compte (mentions
  légales, export, suppression en 30 jours), page d'installation iPhone.
  `node scripts/essai-app.mjs` : 94 contrôles, 0 faute, trois fois de suite,
  en démonstration (iPhone 390, Android 360, ordinateur 1280) ; contre-essai
  12/12 ; copie cassée exprès (photo non réduite) : 6 fautes attrapées.
  Colonnes et droits lus par l'app vérifiés dans la vraie base par SQL.
- **9 octobre, suite** : six documents pour coder dans `app/specs/` (PRD, TRD,
  AppFlow, Design System, schéma back-end, plan d'implémentation) ; l'original
  en pleine résolution suit la photo réduite (migration
  `20261009005808_photo_source` appliquée, `droits-app.sql` : 19 conformes ;
  `essai-app` : 96 contrôles, 0 faute) ; essai gratuit 14 jours.
- **GitHub** : à jour le 9 octobre à 3 h 07, commit `2e78036` (117 fichiers).
  Les envois précédents échouaient : le crochet de commit refusait
  `app/index.html` (corrigé). POUSSER ne pose plus de question.
- **pour essayer contre la vraie base** (Fabrice) : la base n'a encore aucun
  utilisateur ni aucune entreprise ; le modèle d'e-mail « Magic Link » de
  Supabase doit contenir le code (`{{ .Token }}`) ; puis `lanceurs\APP.bat`.
- **à faire** : le service HTTP qui relie le tout, les adaptateurs Cloudflare
  R2/KV réels, l'essai sur de vraies photos, Stripe, Gandi, Google.

Restent ouverts pour Fabrice : le nom (liste dans `docs/noms-2026-10-05.md`),
le compte Google Play (numéro D-U-N-S), l'artisan pilote.

**Images** :

Générer les 22 images du ravalement, les ranger dans
`images/ravalement/sources/`, relancer `node scripts/capacite-unicite.mjs`
sans `--photos plan` pour mesurer sur les vraies images, puis ouvrir le
deuxième métier.

## Ne pas refaire

- Livrer en choisissant les fichiers à la main.
- Laisser du travail vivre seulement dans l'espace de Claude.
- Construire sans avoir lu `memoire/` et `rules/web/`.
- Déclarer un contrôle bon sans l'avoir vu attraper une copie cassée exprès.
- Conclure sur trois sites de démonstration : mesurer à l'échelle du produit.
- Écrire une phrase à combiner qui commence par un pronom.

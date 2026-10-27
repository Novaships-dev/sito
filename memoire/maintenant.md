# État au 28 octobre 2026

À lire en premier, à chaque séance. Réécrit à la fin de chaque séance.

## En bref, 25 octobre 2026

- **Claude Code travaille et se dépanne seul** (décisions de Fabrice du
  10 octobre) : `lanceurs\CLAUDE_AUTONOME.bat` → `scripts/autonome.mjs`, mode
  auto sans fenêtre de question, 20 lancements par jour au plus ; une panne se
  traite par `.claude/skills/depanner/SKILL.md` (pièges, doc officielle,
  tickets GitHub), budget 3 approches ou 45 minutes, puis « bloqué » (panne) et
  nouvelle tentative le lendemain. Garde-fous verrouillés (CLAUDE.md, Jamais 10).
- **Prouvé dans un clone** : trois pannes posées exprès (paquet manquant,
  texte fautif, erreur de type) réparées seul, essais à 0, puis quatre tâches
  faites avec preuves et deux bloquées honnêtement (`memoire/journal.md`, 10 oct.).
- **Liste de travail** : `app/specs/07-TACHES.md` (41 tâches, 12 bloquées par
  une action de Fabrice). T00, T01, T02, T06, T07, T34, T35, T36 et T37 faites
  (25 oct.) : le service sait parler à la base et au stockage, transformer les
  photos que l'app envoie en images propres pour le site, la prospection sait
  trouver et noter des artisans réels, les trois métiers ont leurs textes de
  site, **le lot du jour se fabrique** (dix sites par métier prêt, vérifiés un
  par un), **il se publie, privé** (noindex partout, aucune page d'accueil,
  retrait à 30 jours), **la page d'appels du jour existe** : relances
  devant, résultats enregistrés au doigt sur 390 px, et **la soirée se
  prépare de bout en bout** (`/preparer-appels` : liste, recherche web des
  sites existants, fabrication, publication, page). **F5 faite (27 oct.,
  Cowork)** : Fabrice a créé le compte Cloudflare gratuit et rangé le jeton
  (Pages + KV) ; **T41 débloquée, à faire** : la première vraie publication
  et le premier lot réel. **T08 faite (27 oct.)** : le générateur fabrique un
  site depuis la base (entreprise, profil, tarifs, photos prêtes) au lieu de
  `donnees/`, et la charte d'un site existant ne se retire plus à chaque
  refabrication (`generateur/tirage.mjs --charte`, `atelier/fabriquer.mjs`).
  **Prochaine tâche, dans l'ordre du tableau** : T41 (dépend de T40, fait ;
  plus aucun blocage) — demande une vraie recherche web candidat par candidat
  (T40, `--lister`/`--sites`) avant de fabriquer et publier pour de vrai ; pas
  entamée cette séance pour ne pas la bâcler en fin de tour. T09 (boucle du
  service) vient après dans le tableau, mais T41 passe avant.
  T02 faite : la CI est verte sur les six derniers envois, et
  `node scripts/ci-github.mjs` la relit depuis la machine. T05 bloquée par F17.
- **La prospection, pièce par pièce** : 9 codes APE mesurés dans le 13,
  `prospection/metiers.json` (3 métiers), extraction qui refait tous les
  filtres de l'API (qui en ignore en silence), note sur 100 avec ses raisons,
  registre sans aucun numéro de téléphone. Essai sur 693 entreprises réelles
  enregistrées, sans réseau. Les deux feuilles de prompts sont prêtes
  (`banque/prompts/couverture.md`, `peinture.md`, 32 images chacune) ; il manque
  les images elles-mêmes (**F18**, à générer par Fabrice dans ChatGPT, puis
  `node scripts/verifier-images.mjs couverture`) et la publication Cloudflare
  (F5).
- **Le lot du jour est fabricable** (T37, 25 oct.) : dix ravaleurs réels du 13,
  dix sites sur dix, 0 en échec, chacun passé à `verifier-site`, un passé au
  vérificateur mobile, unicité du lot sans constat, dix slugs de 16 caractères
  inscrits au registre. Couverture et peinture sont **sautées avec leur
  message** tant que F18 n'est pas fait : ce qui bloque un métier ne bloque pas
  les autres. Rien n'a été écrit dans `prospection/registre.json` : ces dix
  artisans n'ont reçu aucun site, la mise en ligne est T38.
- **La publication privée est écrite et prouvée sans compte** (T38, 25 oct.) :
  68 contrôles sur un faux Cloudflare qui refait les règles de l'API, et
  10 cassures posées une par une, chacune attrapée. Ce que voit un visiteur :
  la racine rend 404, chaque page et chaque image portent `noindex`,
  `robots.txt` interdit tout, et les images de banque ne montent qu'une fois.
  **Ce qui manque est le compte Cloudflare lui-même (F5)** : tant qu'il
  n'existe pas, aucun site n'est réellement en ligne, et « publication
  Cloudflare » n'est pas une chose prouvée — seulement un code mesuré.
- **La page d'appels est prête** (T39, 25 oct.) : 79 contrôles dont le
  navigateur à 390 px (aucun bouton sous 44 px, « Intéressé » touché au doigt,
  résultat relu dans KV), 13 cassures chacune attrapée. Les relances passent
  devant, un artisan déjà appelé ou abonné est écarté **avec sa raison**, et
  aucun numéro de téléphone n'entre ni dans la page ni dans KV. Le KV réel
  attend **F5** lui aussi.
- **La soirée se prépare de bout en bout** (T40, 26 oct., `/preparer-appels`) :
  deux commandes séparées par la recherche web (qui ne se scripte pas) —
  `--lister` écrit les candidats à vérifier, `--sites <fichier>` qualifie avec
  ce que le web a dit, fabrique, publie, et écrit la page d'appels et
  `_worker.js` dans le même dépôt, sous un slug **stable**
  (`prospection/appels.json`). 43 contrôles, 0 faute, dont « 30 sites et la
  page produits » sur le faux Cloudflare ; 3 cassures attrapées. **F5**
  (compte Cloudflare) et, une fois faite, un réglage à poser à la main dans
  le tableau de bord (espace KV `APPELS`, variable `SLUG_APPELS`) restent les
  seules choses qui manquent pour que ça serve pour de vrai.
- **La suite d'essais est verte et complète sur le PC de Fabrice** (24 oct.,
  `memoire/essais/derniers.txt`) : les 10 étapes à 0, plus aucun essai « non
  lancé ». exiftool 13.59, ffmpeg 9.0.2, Python 3.13.15 avec Pillow 13.0.0 et
  pillow-heif 1.8.1, Chromium de Playwright : tout est installé en portée
  utilisateur, rien à faire pour Fabrice.
- **Ce qui attend Fabrice, tout de suite** (`memoire/actions-fabrice.md`) :
  **F17** réveiller la base Supabase (`lanceurs\REVEILLER_SUPABASE.bat` :
  le projet gratuit s'est mis en pause, la base ne répond plus) et **F1** la
  clé secrète (`lanceurs\CLE_SUPABASE.bat`). Sans elles, T03, T04 et T05
  restent bloquées. F0, F2 et F4 sont faites (24 oct.) ; F3 attend F10.
  Questions ouvertes : `memoire/questions.md` (Q1).
- **Ce qu'il ne fera jamais seul** : comptes payants, domaines, paiements réels,
  Play Store, vraies photos (F5 à F15).

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
2. **Trois métiers sur seize.** `generateur/metiers/` contient
   `ravalement.json`, `couverture.json` et `peinture.json`, chacun mesuré à
   100 sites sans défaut. Les treize autres doivent atteindre le même volume de
   textes (T32). Les codes APE du ravalement diffèrent entre `ravalement.json`
   (cinq codes) et `plan-images.json` (trois) : à aligner (T31).
3. **Les images des quinze autres métiers** : 54 chacun, 810 au total ; sujets
   dans `banque/liste-images.md`. Textes à coller dans ChatGPT prêts pour trois
   métiers (ravalement, couverture, peinture) ; les treize autres restent à
   écrire. Un métier se mesure avant fabrication :
   `node scripts/verifier-images.mjs <metier>`.
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

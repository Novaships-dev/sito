# Journal

En ajout seul. Une entrée par changement structurant.

## 2026-09-07, création

Dépôt créé. Contenu initial issu d'un audit de douze dépôts et de la
spécification Agent Skills.

Décisions actées :

- les hooks imposent, les skills expliquent. Un skill se déclenche entre 50
  et 80 pour cent du temps, un hook 100 pour cent.
- catalogue de signatures en ajout seul, jamais renuméroté
- palette beige, laiton, espresso bannie sur brief artisan
- molettes calées à 5 / 3 / 4 pour Sitô, 8 / 6 / 4 pour ADYTON, jamais partagées
- un connecteur MCP permanent plus Context7, le reste en CLI
- WCAG 2.2 AA, accessibilité Lighthouse à 100

Faux positif corrigé le jour même : la règle sur les polices matchait
« Interventions » à cause de « Inter ». Corrigée pour ne matcher que dans un
contexte de déclaration de police. Leçon : un motif sans sa liste de faux
positifs génère du bruit et finit désactivé.

## 2026-09-08, les trous comblés

Le dépôt annonçait quatre skills dans `organisation-depots.md` et n'en contenait
aucun. Zéro `SKILL.md`. Le fichier `tells-design.md`, désigné dans
`etat-et-actions.md` comme « le premier fichier utile », n'existait pas non plus.

Écrits ce jour, par compilation des documents déjà présents, sans apport extérieur :

- `skills/_partage/references/tells-design.md` — 53 signatures numérotées en ajout
  seul, avec alternative et vérification grep ; les cinq familles esthétiques ; le
  test d'unicité en trois temps.
- `skills/redaction-fr/SKILL.md`
- `skills/audit-design/SKILL.md`
- `skills/prospection-sirene/SKILL.md`
- `skills/veille-concurrence/SKILL.md`

Méthode suivie : section 39 de `audit-repos.md`. Forme impérative, description
insistante couvrant les cas où l'utilisateur ne nomme pas la chose, gabarit de sortie
exact dans chaque skill, jamais de skill sur une tâche simple.

Deux écarts de nommage corrigés dans `organisation-depots.md` : le script s'appelle
`regles-fr.mjs` et non `anti-slop-fr.mjs`, et `verifier-textes` est un `.mjs` et non
un `.ts`.

Effet mesurable sur le contrôle : le vérificateur ne scannait que **deux** fichiers
du dépôt, `CLAUDE.md` et `README.md`, parce que `docs/`, `rules/` et `references/`
sont exclus par conception. Il en scanne maintenant **six**. Sortie 0.

Cas d'école rencontré en écrivant `redaction-fr` : le skill qui interdit le lexique
mort doit citer ce lexique pour l'illustrer. Six lignes marquées `verif-ignore`,
jamais le fichier entier. C'est l'usage prévu du marqueur.

## 2026-09-09, le standard devient vérifiable

Constat de départ : `design-interdits.md` affirmait « Imposé par
`scripts/regles-fr.mjs` via `kill-ai-slop`, pas par bonne volonté ». Faux.
`kill-ai-slop` n'a jamais été installé, et `regles-fr.mjs` couvre 8 des
50 signatures. Sur six familles d'exigences, une seule était réellement
imposée : les textes français.

Ajouté :

- `scripts/verifier-site.mjs` — le plancher d'une page construite. Signatures
  détectables par motif, polices et palettes bannies, contraste calculé depuis
  les blocs CSS, focus supprimé, zoom bloqué, images sans `alt`, niveaux de
  titre sautés, nombre de `h1`, budgets de poids, banques d'images.
- `rules/web/photos.md` — trois statuts de photo, et le marquage obligatoire
  des images d'exemple.

Décision sur les photos : le site de prospection part sans aucune photo de
l'artisan, on ne peut ni prendre celles de Google ni celles de son site actuel.
Les images d'exemple générées par corps de métier sont autorisées, à condition
d'être marquées `data-exemple="oui"` avec un `alt` qui commence par « Exemple ».
Non marquées, elles présentent à un maçon un chantier qu'il n'a pas fait, sur
une page qui porte son SIREN. Le vérificateur impose le marquage.

Mesure sur les deux démos existantes, qui sont à jeter :

| Page | Constats bloquants |
|---|---|
| `demo-rmpc-v2.html` | 10 : 4 points médians, 6 photos Unsplash |
| `demo-rmpc-ermont.html` | 24 : 3 tirets cadratins, 11 points médians, 10 photos Unsplash |

Ce que le vérificateur ne fait pas, et ne fera pas : dire à quoi la page doit
ressembler. Il n'impose que le plancher. Les sites sont tous différents, c'est
le test d'unicité qui le garantit, et il demande un jugement.

## 2026-09-23, l'unicité devient mécanique

Constat du client, sur trois sites de ravalement à Marseille : « les 3 sites se
ressemblent complètement ». Les quatre vérificateurs les déclaraient bons.

Mesuré : même accent `#b08c6f` sur les trois, même fond quasi noir, mêmes
polices sur deux des trois, même mot géant. Seule la disposition changeait.

Cause : la palette est prélevée dans les photos, et les trois sites de
démonstration partagent les mêmes photos. La rotation des sept familles de
`palettes.md`, écrite le 7 septembre, n'avait jamais été appliquée.

Ajouté :

- `generateur/charte.mjs` — six axes tirés de la graine : famille parmi sept,
  sol nuit ou papier, appariement de polices parmi quatre, géométrie, contenu
  du mot géant, et les jetons de couleur des deux sols. La rotation exclut ce
  que les voisins ont déjà pris.
- `scripts/verifier-unicite.mjs` — cinquième vérificateur. Le seul qui ne
  regarde pas une page mais la distance entre deux pages.
- `generateur/sections/` — arrivée, atmosphère, nuancier extraits en modules
  partagés : les quatre archétypes ont le même socle, chacun sa composition.

Deux choses sorties du moteur vers `metiers/ravalement.json` : les teintes du
nuancier et les descriptions d'images. Le moteur ne connaît plus aucun mot de
ravalement, ce qui était la condition pour ouvrir les quinze autres métiers.

Effet mesuré, trois sites, même métier, même commune : luxe froid / nuit /
bricolage / matière, terre-ardoise / nuit / public-bricolage / élévation,
forêt / papier / archivo-plein / planche. Zéro bloquant sur les cinq
vérificateurs.

Leçon : une règle qui demande un jugement ne se déclenche jamais. Le test
d'unicité existait depuis le 8 septembre et n'a rien empêché tant qu'aucun
script ne le mesurait.

## 2026-10-01, tout diffère d'un voisin à l'autre

Demande du client : sur chaque métier et chaque site généré, les photos, la
structure, les textes, le nuancier, les prix et le comparateur doivent différer.

Ajouté :

- `generateur/main-photos.mjs` — une main de photos par entreprise, tirée de la
  graine, évitant celle des voisins. Les candidats se découvrent par le nom des
  fichiers ; `detail-enduit` n'est plus écrit dans le moteur.
- `charte.structurer()` — sections nommées, présence et ordre tirés : prix,
  avis, estimateur, deuxième page facultatifs. Le tirage garde, sur dix essais,
  le plus éloigné des voisins.
- `sections/prix.mjs`, `sections/avis.mjs` — sur les quatre archétypes. Les
  chiffres restent ceux du fichier métier, sourcés ; seules la présence et la
  place changent. L'estimateur lit ses réglages dans le fichier métier.
- `sections/comparateur.mjs` — poignée, place des étiquettes et invitation
  tirées, jamais celles d'un voisin. La mécanique reste l'input range natif.
- Vivier de textes du ravalement : 15 titres, 8 chapôs, 3 textes par geste,
  6 intitulés par rubrique. Aucune phrase d'un voisin n'est reprise.
- `verifier-unicite.mjs` : U3 (phrase commune) et U4 (même comparateur).
- `verifier-ordinateur.mjs` : O12, le texte s'affiche dans les polices déclarées.

Panne trouvée en chemin : en remplaçant les noms de police par leur variable,
la définition de la variable a été remplacée aussi. `--texte-police` valait
`var(--texte-police)` ; le navigateur l'invalide sans bruit et affiche du Times
New Roman. Les cinq contrôles passaient. Visible sur les captures du 23
septembre, non relevé. O12 l'attrape maintenant, prouvé sur la page fautive.

## 2026-10-02, le dépôt sito

Constat de Fabrice : « je n'ai que le repo GitHub atelier, aucun repo en rapport
avec cette app, tout est éparpillé dans mon ordinateur ».

Mesuré sur son ordinateur et sur GitHub : `Novaships-dev/Atelier` et sa copie
sur le Bureau s'arrêtaient au 14 septembre (commit `5e73417`). Tout le travail
du 15 septembre au 1er octobre n'existait que dans l'espace de travail de
Claude, déjà vidé une fois le 16 septembre. Une sauvegarde a été posée sur le
Bureau avant toute autre chose.

Créé : ce dépôt, avec tout ce qui concerne Sitô, réuni après lecture complète
des conversations et des fichiers.

- `memoire/` : `maintenant.md` (l'état), `decisions.md` (les décisions de
  Fabrice, citées), `pieges.md` (les pannes et leur garde), ce journal.
- `banque/` : la liste des 512 images, les prompts du ravalement, et la
  provenance des 32 images, retrouvée par comparaison des pixels.
- `app/README.md` : ce que l'app doit faire, d'après Fabrice, et ce qui reste à
  décider.
- `docs/historique/` : les documents de cadrage du début, marqués comme non
  validés.
- `scripts/fabriquer-demo.mjs` : refabrique les trois sites et lance les cinq
  vérificateurs, s'arrête à la première erreur.

Trouvé en relisant les règles : les archétypes `panneau`, `planche` et
`elevation` n'ont **aucune barre d'appel**, ce que `rules/web/client.md`
impose. Aucun vérificateur ne le voyait. Noté en tête de `maintenant.md`.

## 2 octobre 2026, soir

Le dépôt est sur GitHub (`Novaships-dev/sito`, commit `dfe10cc`, poussé par
`CREER_SITO.bat`). Fabrice a répondu aux questions : téléphone donné par
l'artisan, prix cochés par l'artisan avec ses tarifs, mention « Exemple »
jusqu'à ses photos, unicité dans la commune ET le département, Supabase
« solide ». Ordre laissé à Claude : appel, prix, unicité, base.

- **Couleurs.** En lisant le code avant d'écrire la barre d'appel, trouvé une
  encre transparente dans la famille « luxe froid ». Mesuré dans le navigateur :
  102 textes illisibles sur les trois sites de démonstration. Système de
  couleurs refait (couleurs de texte calculées par surface), contrôle de
  contraste rendu ajouté (O13, M12). Zéro texte sous le seuil.
- **Appel.** Module commun aux quatre archétypes, numéro validé, emplacement
  « Votre numéro ici » sans numéro, jamais de lien vide. T1, T2, O14, M13.
- **Prix.** Plus de prix du marché ni d'estimateur sur les pages. Section
  « Les tarifs de l'entreprise » seulement si l'artisan coche et saisit ses
  tarifs. `rules/web/client.md` mise à jour.
- **Unicité.** Voisins = même métier, même département, la commune comptant
  cinq fois plus. Tirage sorti dans `generateur/tirage.mjs`, choix « la moins
  prise » au lieu de « au hasard quand tout est pris ». Capacité mesurée :
  trois sites. Les réserves sont à agrandir ; voir `maintenant.md`.
- **Base.** Projet Supabase `sito` (Paris, gratuit), 12 tables, sécurité par
  ligne partout, deux espaces d'images, 16 métiers. Droits essayés avec deux
  artisans fictifs : onze essais conformes. Voir `supabase/README.md`.
- Troisième taille de téléphone (430 × 932) ajoutée au vérificateur mobile.
- Vu sur capture, pas par un contrôle : la pastille du haut, agrandie par le
  bouton d'appel, touchait le nom de l'entreprise sur deux compositions.
  Corrigé, et O15 ajouté pour que ça ne repose plus sur l'œil.

## 2 octobre 2026, nuit

Fabrice : 100 sites par métier et par département, « chaque métier a des
images différentes », textes agrandis « si tu recommandes », estimateur à
refaire sur ses tarifs.

- **Estimateur** refait sur les tarifs de l'artisan. Calcul vérifié dans un
  navigateur, dans quatre cas, au centime.
- **Textes du ravalement** : 110 titres écrits un par un ; chapô, état avant
  et après en énumérations recomposées ; gestes en « comment » plus
  « pourquoi », cent textes par geste ; légendes, invitations, précisions
  combinées ; quinze intitulés par rubrique. Les 532 morceaux passent le
  vérificateur de textes.
- **Comparateur** : 120 formes. **Retirage** quand un site ressemble trop à
  un voisin. **Couleurs, polices, géométrie et mot géant** tirés ensemble.
- **Images** : plan porté à 54 par métier (864 au total), 22 prompts de plus
  pour le ravalement.
- **Mesure** à 100 sites, avec les images prévues : 1 paire trop proche sur
  4 950, aucun titre, texte long ni comparateur identique, même façade sur 9 %
  des paires. Reste : les intitulés de section, question posée à Fabrice.
- Les règles d'unicité passent de `scripts/` à `generateur/unicite.mjs` : le
  tirage s'en sert aussi.
- Fabrice : les intitulés de section peuvent se répéter. U3 ne les compte
  plus. Mesure à 100 sites : aucun défaut, dans le département comme dans une
  seule commune. Vérifié que U3 attrape toujours une vraie phrase commune.

## 9 octobre 2026, nuit : dépôt prêt pour Claude Code en autonomie

- `CLAUDE.md` réécrit (ordre de lecture, « Travailler seul », interdits, commandes).
- `app/specs/07-TACHES.md` : 34 tâches, état, preuve, dépendances, blocages.
- `.claude/settings.json` (autorisations, interdits, 5 crochets en Node), `.claude/hooks/`, `.claude/skills/` (travailler, sito-app, sito-base, sito-service, fin-de-seance + les 4 anciens), `.mcp.json` (Playwright).
- `scripts/essais.mjs`, `verifier-secrets.mjs`, `essai-outillage.mjs`, `compte-essai.mjs`, `env.mjs` ; `.env.example` racine ; CI `.github/workflows/essais.yml`.
- `memoire/actions-fabrice.md` (F0 à F16), `questions.md`, `comptes-essai.md`, `essais/derniers.txt`.
- `lanceurs/CLAUDE_AUTONOME.bat`.- Essai réel, dans un clone jetable (mode sans permissions, conteneur isolé) : `claude -p "/travailler 3"` a enchaîné en 10 minutes T00, T01, T06, T07 (avec essais et contre-essais), un commit par tâche, et a bloqué T02 (pas de dépôt distant) et T05 (pas d'outil Supabase) au lieu de les inventer. Ce travail n'est pas repris dans le dépôt : Claude Code le refera sur le PC.
- Une session réelle a refusé d'afficher le `.env` (règle de CLAUDE.md) ; la valeur n'apparaît nulle part dans sa sortie.
## 10 octobre 2026 : dépannage autonome (décisions de Fabrice du jour)

- Construit : `scripts/autonome.mjs` (lancements sans fenêtre, mode auto, 20 par jour, arrêt après 3 lancements sans changement, attente si la limite de l'abonnement est atteinte, tâches en panne rouvertes le lendemain 3 fois au plus) ; `.claude/skills/depanner/SKILL.md` ; budget de panne dans `.claude/hooks/fin.mjs` (avertissement à 45 min, « bloqué » + « panne » à 60 min) ; garde-fous verrouillés et commandes dangereuses refusées dans `.claude/hooks/pre-outil.mjs` (aussi les connecteurs autres que Supabase et Playwright, et les SQL qui suppriment des données) ; `lanceurs/PREMIER_LANCEMENT.bat`.
- `essai-outillage` : 87 contrôles, 0 faute ; contre-essai (crochets et lanceur vidés) : 50 fautes, attrapé.
- Essai réel dans un clone jetable avec un dépôt distant local : trois pannes posées exprès dans un commit (`tus-js-client` retiré de `node_modules`, un « · » dans Abonnement, une erreur de type dans Accueil), suite rouge (2 fautes). `scripts/autonome.mjs` a lancé Claude Code 2.1.296 en mode auto (modèle claude-sonnet-5-5). Sans aide : les trois pannes réparées dans le code (`npm install`, texte corrigé, ligne fautive retirée), essais à 0, commit « Réparation », piège noté ; puis T00, T01, T06, T07 faites avec preuves et contre-essais ; T02 et T05 bloquées honnêtement (pas de GitHub, pas de connecteur Supabase sur ce poste) avec une action précise. Aucun fichier verrouillé touché (diff vide). Il a trouvé un défaut de l'essai d'outillage, ne l'a pas contourné, l'a écrit : corrigé depuis. Arrêté par Claude (Cowork) au bout de 30 minutes pendant T08 : la preuve était faite. Ce travail du clone n'est pas repris : Claude Code le refera sur le PC.
## 11 octobre 2026 : « Install Claude Code toi-même et remplis le .env et le modèle, fais-le »

- `.env` (sans la clé secrète) et `app/.env.local` (clé publique) créés sur l'ordinateur de Fabrice par `lanceurs\INSTALLER_OUTILLAGE.bat`, depuis `_installation/` (jamais dans Git) ; un fichier existant n'est jamais écrasé.
- La clé secrète : Claude ne la lit pas (règle de Fabrice, secrets jamais lus ni affichés par l'agent). `lanceurs\CLE_SUPABASE.bat` ouvre la page des clés, Fabrice colle, le script l'écrit dans `.env` et crée le compte d'essai. Essayé avec une fausse clé sous PowerShell 7 : ligne remplacée, mauvaise clé refusée.
- Claude Code : `lanceurs\INSTALLER_CLAUDE_CODE.bat` (installateur officiel `irm https://claude.ai/install.ps1 | iex`). Le poste de Claude ne peut pas télécharger ce script (proxy) : pas relu avant exécution ; source officielle d'Anthropic, demandée par Fabrice.
- Modèle d'e-mail (F3) : ni le navigateur intégré ni Chrome ne sont connectés à Supabase ; Claude ne saisit pas de mot de passe. À faire dès que Fabrice est connecté dans Chrome.
- Modèle d'e-mail (F3), après connexion de Fabrice dans Chrome : page « Magic link or OTP » ouverte ; Supabase refuse la modification sans SMTP personnel. Modèle par défaut relevé : sujet « Your sign-in link », un lien « Sign in », pas de code. Texte à mettre après F10 : sujet « Votre code de connexion Sitô » ; corps `<h2>Votre code Sitô</h2><p>Saisissez ce code dans l'app pour vous connecter :</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p><p>Si vous n'avez pas demandé ce code, ignorez ce message.</p>`.

## 21 octobre 2026, nuit : suite rouge au réveil, réparée avant toute tâche

Plan en trois lignes : la suite d'essais rougissait avant d'avoir touché à quoi
que ce soit (2 fautes) ; donc dépannage d'abord, aucune tâche de `07-TACHES.md`
par-dessus une suite rouge ; puis T00.

Deux pannes, trouvées et réparées :

- **Le type du fichier DNG dépendait du poste.** `app/src/photo.ts` posait le
  Content-Type de l'envoi avec `f.type || TYPES[format]` : le navigateur lit le
  registre de Windows, qui annonce un `.DNG` comme « image/DNG ». Le contrôle
  de l'essai de l'app (DNG envoyé tel quel) rougissait. La séance précédente
  avait déjà renversé la priorité (le tableau des formats fait autorité, ce qui
  est juste : le type ne doit dépendre que du format reconnu, jamais de
  l'appareil) mais avait écrit dans le tableau la valeur du registre Windows.
  Remis la valeur du format : `image/x-adobe-dng`. `essai-app` : 96 contrôles,
  0 faute.
- **Un secret probable dans `app/dist-casse/`.** Une copie construite exprès
  cassée (`SITO_APP_DIST`) était restée dans le dépôt, non ignorée : la clé
  publique Supabase empaquetée dedans faisait rougir `verifier-secrets`
  (4 lignes bloquantes). Copie supprimée, et `.gitignore` ignore maintenant
  `app/dist-*/` : une copie d'essai construite sur place ne part plus sur
  GitHub. Vérifié : `verifier-secrets` à 0, et la ligne `app/dist/` qui
  précède n'a pas changé.

Trouvé en arrivant, pas écrit par cette séance : `scripts/autonome.mjs` et
`scripts/essai-outillage.mjs` (fichiers verrouillés) portaient déjà, dans le
dossier de travail, l'attente sur coupure d'Internet et son contrôle
(`FAUX_MODE=reseau`). Non touchés ici ; leur contrôle est vert
(`essai-outillage` : 90 contrôles, 0 faute) et ils partent dans ce commit pour
ne pas rester seulement sur la machine.

Suite complète : aucune faute, 1 essai non lancé (photos du service : python +
Pillow + pillow-heif manquent sur ce poste, c'est l'objet de T01).

### T00 : les anciens `skills/` et `hooks/` retirés du dépôt

Plan en trois lignes : vérifier d'abord que les 13 fichiers sont bien recopiés
dans `.claude/` avant d'effacer quoi que ce soit ; `git rm -r skills hooks` ;
corriger le dernier lien qui restait et prouver avec `verifier-depot`.

- Comparaison octet pour octet avant la suppression : les 9 fichiers de
  `skills/` sont identiques à ceux de `.claude/skills/` ; les 4 crochets
  `hooks/*.sh` n'ont pas de jumeau, ils sont remplacés par les cinq crochets
  Node de `.claude/hooks/` que `.claude/settings.json` appelle réellement.
- `git rm -r skills hooks` : 13 fichiers.
- `README.md` : la ligne « anciens emplacements » retirée du tableau.
  `rules/common/00-index.md` était déjà juste (il cite `.claude/hooks/*.mjs` et
  `git-hooks/pre-commit`). Les deux scripts qui citent le dossier partagé
  pointaient déjà sur `.claude/skills/_partage/`.
- Preuve : `verifier-depot` à 0 (270 fichiers), et plus aucun lien vers
  `hooks/*.sh` hors de `docs/` et `memoire/`. Suite complète : aucune faute
  (l'essai des photos du service reste non lancé, c'est T01).
- Laissé exprès : un commentaire de la migration
  `20261002194303_schema.sql` cite encore `skills/prospection-sirene`. Une
  migration déjà écrite ne se modifie pas (CLAUDE.md, Jamais 6), et ce n'est
  pas un lien vers `hooks/*.sh`.


## 24 octobre 2026 : T01, les outils de la machine

Plan en trois lignes : mesurer ce qui est réellement installé sur le PC
(exiftool, ffmpeg, Python + Pillow + pillow-heif, Chromium de Playwright) ;
réparer la détection de Python, qui déclarait l'essai des photos impossible
alors que tout était là ; prouver par `scripts/essais.mjs` à 0, sans aucun
essai « non lancé », et par un contre-essai de chaque garde ajoutée.

### Ce qui est installé, mesuré

| Outil | Version | Où |
|---|---|---|
| exiftool | 13.59 | `AppData\Local\Programs\ExifTool` |
| ffmpeg | 9.0.2-full (gyan.dev) | WinGet, portée utilisateur |
| Python | 3.13.15 | `AppData\Local\Programs\Python\Python313` |
| Pillow | 13.0.0 | paquet utilisateur |
| pillow-heif | 1.8.1 | paquet utilisateur |
| Chromium | celui de Playwright | pris par défaut par `essai-app.mjs` |

Rien à installer : aucune action de Fabrice n'était nécessaire.

### La détection de Python, réparée (`scripts/python.mjs`)

Deux fautes dans la même ligne de `essais.mjs` :

- `python3` **existe** sous Windows, mais ce n'est que la passerelle du
  Microsoft Store : elle répond « Python est introuvable » et ne lance rien ;
- `spawnSync(py, ['-c', 'import PIL, pillow_heif'], { shell: true })` laisse
  cmd.exe recoller les arguments : la commande est coupée sur l'espace et la
  virgule.

Résultat : la suite finissait « aucune faute, mais 1 essai NON LANCÉ », donc
jamais rouge. Une panne invisible, exactement ce que la preuve de T01 interdit.

Un seul endroit cherche l'interprète maintenant : `scripts/python.mjs`
(`python`, `py`, `python3` sous Windows ; `python3`, `python` ailleurs ; jamais
de `shell`), lu par `essais.mjs` (lancer ou non l'essai) et par
`essai-photos.mjs` (fabriquer les fichiers d'essai). `SITO_PYTHON` force un
interprète, noté dans `02-TRD.md`.

Contre-essai fait : `SITO_PYTHON=python-qui-nexiste-pas` → `essai-photos.mjs`
sort 2 avec sa phrase, et la suite complète remet « NON LANCÉ (manque python +
Pillow + pillow-heif) » avec le verdict « pas une réussite complète ».

### L'essai de l'app rendait un diagnostic illisible

Trouvé dans le relevé de la veille : `essai-app` avait rougi une fois avec
`page.evaluate: TypeError: Cannot read properties of undefined (reading
'fichier')`, sans nommer le contrôle ni écrire le résumé. Cause : l'attente de
10 s après l'envoi d'une photo de 12 Mpx est dépassée quand la machine fait
autre chose ; le contrôle rougissait bien, puis la lecture de l'envoi absent
levait une erreur que rien ne rattrapait.

- Attente portée à 30 s : le temps accordé change, la mesure non.
- `lireEnvoi` dit « envoi N absent : M envoi(s) seulement ».
- Le parcours a un `catch` : l'erreur est comptée comme faute, nommée, et le
  résumé « X contrôles, Y faute(s) » s'écrit quand même.

Contre-essai sur une copie cassée exprès, construite dans un dossier temporaire
hors du dépôt (piège du 21 octobre) : `envois.push({ genre: 'original' … })`
retiré de `donnees/demo.ts`, `SITO_APP_DIST` pointé sur ce `dist`. Rouge, et
lisible : « FAUTE photo JPEG (iPhone, GPS, orientation 6) envoyée, puis son
original » puis « FAUTE essai interrompu — envoi 1 absent : 1 envoi(s)
seulement », 25 contrôles, 2 fautes, sortie 1. Copie supprimée.

Refusé par un crochet, sans que ce soit une panne : le `Remove-Item -Recurse
-Force` du nettoyage. Autre voie prise (la jonction `node_modules` retirée
seule, puis `rm -r`) ; `app/node_modules` vérifié intact après coup.

### Preuve

`node scripts/essais.mjs` : les 8 étapes vertes, **aucun essai non lancé**
(l'essai des photos du service tourne : 18 fichiers, 0 faute), verdict
« TOUT EST VERT », sortie 0. C'est la preuve demandée par T01.

### T02 : l'état de la CI GitHub, lisible depuis la machine

Plan en trois lignes : le dépôt est privé et `gh` n'est pas installé, donc
l'API de GitHub refuse tout sans jeton ; écrire un script qui va chercher le
jeton lui-même (jamais par l'agent) et rend un verdict en code de sortie ;
l'essayer vert, rouge et refusé avant de s'en servir comme preuve.

- `scripts/ci-github.mjs` : `--tous` (les cinq derniers passages), `--journal`
  (les étapes en échec et la fin du journal de la tâche fautive), `--ecrire`
  (la ligne du verdict ajoutée à `memoire/essais/derniers.txt`, après
  `essais.mjs` qui réécrit ce fichier). Sorties : 0 vert, 1 rouge, 2 en cours,
  3 pas de jeton, 4 l'API a refusé.
- **Le jeton ne passe pas par l'agent.** Ordre : `GITHUB_JETON` du `.env`, sinon
  `git credential fill` — le gestionnaire d'identifiants qui sert déjà à
  `git push` sur ce poste. La valeur ne sort pas de la fonction qui la lit ;
  rien à coller, aucune action de Fabrice. Variables notées dans `02-TRD.md`,
  ligne facultative dans `.env.example`.
- Panne rencontrée et réparée : `process.exit()` juste après un `fetch` tue
  Node sous Windows sur une assertion de libuv (`UV_HANDLE_CLOSING`, sortie
  127) — le verdict était perdu. Le script fixe `process.exitCode` et laisse
  les connexions se fermer : 1,5 s, sortie juste.
- Refusé par un crochet, sans que ce soit une panne : un téléchargement
  raccordé directement à un interprète (« script téléchargé puis exécuté sans
  être lu »). Autre voie : écrire la réponse dans un fichier, puis le lire.
  C'est ce refus qui a montré que le dépôt est privé (404 sans jeton), donc
  qu'un script authentifié était nécessaire.

Les trois chemins essayés avant de s'en servir :

| Essai | Résultat |
|---|---|
| vrai GitHub, jeton du gestionnaire | passage #8 vert, sortie 0 |
| faux GitHub local (`SITO_CI_API`), passage en échec | « FAILURE », tâche et étape nommées, fin du journal affichée, sortie 1 |
| vrai GitHub, faux jeton | « 401 Unauthorized », « le jeton n'a pas le droit Actions : lecture », sortie 4 |

Relevé des cinq derniers passages : **#4 à #8 tous verts**, dont #8 sur le
commit `916f4eb` (T01). Rien à corriger : aucun contrôle ne passait que sur une
machine. Le dernier passage, celui du commit de T02, est vérifié plus bas.

**Verdict de T02** : passage **#9 vert** sur le commit `bc6ef85` (celui de la
tâche), relevé par `node scripts/ci-github.mjs` (sortie 0) et ajouté à
`memoire/essais/derniers.txt` par `--ecrire`. Les six derniers passages (#4 à
#9) sont verts : rien ne passait que sur une seule machine, aucun correctif à
écrire. T02 faite.

Trois actions de Fabrice passées à « fait » en les mesurant, pas en les
supposant : **F0** (Claude Code tourne sur le PC), **F2** (`.claude.json` :
`hasTrustDialogAccepted` vrai pour ce dossier), **F4** (les outils Supabase
sont offerts à la session). **F1 reste à faire** : `compte-essai.mjs
--verifier` dit « Configuration manquante : SUPABASE_CLE_SERVICE » (sortie 3),
donc T03 et T04 restent bloquées, à juste titre.

### T05 : bloquée, la base Supabase dort (action F17)

Plan en trois lignes : rejouer `droits.sql` et `droits-app.sql` par l'outil
Supabase, relever les conseillers, et ne rien conclure d'une réponse vide.

Mesuré, pas supposé :

- `list_projects` : le projet `sito` (`magxzrpboyrzguuocjgj`, eu-west-3) est
  **INACTIVE**. Un projet gratuit se met en pause après quelques jours sans
  usage ; le dernier usage date du 11 octobre.
- `list_migrations` : « Connection terminated due to connection timeout »
  (deux fois).
- `execute_sql` sur un simple `select 1` : « Database is possibly not
  accessible at the moment ».
- **Le piège** : `get_advisors` répond `{"lints": []}` sans erreur. Une liste
  vide sur une base en pause ne veut pas dire « aucune alerte » : elle veut
  dire « rien n'a été analysé ». Écrire « conseillers sans alerte » ici aurait
  été fabriquer un résultat (CLAUDE.md, Jamais 1).

Aucun outil du connecteur Supabase ne sait relancer un projet en pause (ni
`get_project`, ni rien d'autre dans la liste) : seul le tableau de bord le
fait. Donc **T05 bloquée par F17**, nouvelle action : double-clic sur
`lanceurs\REVEILLER_SUPABASE.bat`, bouton « Restore project », attendre
« Active healthy ». Le lanceur ouvre la bonne page et relit la base ensuite.

T03 et T04 étaient déjà bloquées par F1 (clé secrète) ; elles attendent aussi
F17. Tâche suivante : T06, qui ne touche pas la vraie base.

### T06 : l'adaptateur Supabase du service

Plan en trois lignes : un seul fichier, `atelier/supabase.mjs`, qui pose les
en-têtes (`apikey`, jamais `Bearer`) et rend les tables et le stockage derrière
des fonctions qui se relisent ; `scripts/essai-service.mjs` le mesure contre un
faux Supabase local (sans réseau ni clé, comme la CI) ; contre-essai sur une
copie cassée exprès, construite hors du dépôt.

- `atelier/supabase.mjs` : une seule fonction pose les en-têtes, et elle ne
  pose que `apikey`. Les tables : `lire`, `lireUne` (deux lignes trouvées =
  faute, pas un choix au hasard), `inserer`, `insererSiAbsent` (rejeu),
  `poser` (upsert sur des colonnes nommées), `majorer` (refuse d'écrire sans
  filtre : jamais toute la table), `fonction` (RPC, pour `prive.jour_paris`).
  Le stockage : `lire`, `ecrire` (un fichier déjà là n'est pas écrasé sans le
  dire), `supprimer`, `urlSignee`. Toute réponse ≥ 300 lève `ErreurSupabase`
  qui nomme méthode, chemin et code — et jamais la clé.
- `scripts/essai-service.mjs` : faux Supabase local (sous-ensemble de
  PostgREST et du stockage, avec ses vrais refus 401, 404, 409), **28
  contrôles, 0 faute**. Il mesure les en-têtes reçus, les octets relus, et ce
  que fait un rejeu — pas ce que le code raconte.
- Contre-essai sur une copie cassée hors du dépôt (clé posée en
  `Authorization: Bearer`, refus HTTP avalés) : **22 fautes sur 28**, dont les
  deux qui comptent (« la clé voyage dans apikey », « aucun appel ne pose
  Authorization »). Le contre-essai s'arrête (code 2) si la copie ne casse
  rien, pour que le jour où le module change de forme on le sache.
- Branché dans `scripts/essais.mjs` (étape « service : adaptateur Supabase »),
  dans `--complet` (contre-essai) et dans la CI.
- Preuve : suite complète verte, l'étape « service : adaptateur Supabase » à
  28 contrôles et 0 faute ; `verifier-depot` à 0 (278 fichiers). T06 faite.
  Tâche suivante : T07 (préparation des photos reçues), qui s'appuie sur cet
  adaptateur et sur `atelier/photos.mjs`.

### Deux sessions dans le même dépôt, en même temps (à savoir)

Vu en relisant le commit de T06 : `git add -A` y a emporté trois fichiers
qu'une **autre session Claude** (Cowork, piste prospection) écrivait au même
moment — `memoire/decisions.md` (décisions de Fabrice des 23 et 24 octobre),
`app/specs/08-PROSPECTION.md`, `lanceurs/CLE_CLOUDFLARE.bat`. Leur contenu est
intact et poussé ; seul le message du commit ne les cite pas. Aucun fichier
verrouillé n'a été modifié par cette session : `decisions.md` a été écrit par
l'autre session, pas par moi (le diff ne contient que des décisions de
Fabrice).

Leçon pour la suite de cette séance : **ne plus faire `git add -A`**, nommer
les fichiers de la tâche, et relire `git status` avant de commiter.

Trouvé dans ces décisions : le 24 octobre, « Oui réveille la base ». Mesuré à
l'instant : le projet Supabase `sito` est passé de `INACTIVE` à `COMING_UP`.
F17 est donc en cours de traitement ; T05 redevient faisable dès que l'état
passe à `ACTIVE_HEALTHY`.

### T05 : essais de droits rejoués (rouverte dès que la base est debout)

Plan en trois lignes : attendre que le projet passe de `COMING_UP` à
`ACTIVE_HEALTHY` (la passerelle REST répond déjà 401, mais la base non) ;
rejouer `supabase/essais/droits.sql` puis `droits-app.sql` par `execute_sql`,
en lisant chaque ligne du résultat une par une ; relever les conseillers
sécurité et performance, et ne compter comme « sans alerte nouvelle » que ce
qui est comparé à la liste connue, jamais une réponse vide.

**T05 remise en attente, sans rien inventer.** Le réveil de la base est lancé
(`COMING_UP` depuis une dizaine de minutes) mais la base refuse encore toute
requête : `execute_sql` sur un `select 1` répond « Database is possibly not
accessible at the moment », quatre fois à quelques minutes d'intervalle. Deux
sondes sans clé ont été essayées pour savoir quand elle sera debout, et aucune
ne sert : `/rest/v1/` et `/auth/v1/health` répondent 401 même base éteinte
(la passerelle vit séparément). Le seul signal juste est `execute_sql`
lui-même, qu'il faut relancer de temps en temps. T05 reste donc « bloqué »
par F17 (réveil en cours, pas encore fini) : je ne déclare rien de vert sans
l'avoir mesuré. Je passe à T07, qui ne touche pas la vraie base.

### T07 : préparer les photos reçues

Plan en trois lignes : `atelier/preparer-recues.mjs` prend les lignes
`photos.etat = recue`, lit la meilleure source dans le stockage
(`chemin_source` si l'original est arrivé, sinon `chemin_original`), la passe à
`preparerPhoto`, pose l'image propre à côté (`<cle>-propre.jpg`) et écrit
`chemin`, `largeur`, `hauteur`, `octets`, `etat = prete` — ou `illisible` avec
un motif écrit pour l'artisan ; le faux Supabase de `scripts/essai-service.mjs`
devient un module à part (`scripts/faux-supabase.mjs`) pour que le nouvel essai
s'en serve ; contre-essai sur copie cassée hors du dépôt.

**Fait, mesuré.** `atelier/preparer-recues.mjs` (131 lignes) et son essai
`scripts/essai-preparation.mjs` : **77 contrôles, 0 faute**.

- Deux corrections au plan ci-dessus, trouvées en relisant le schéma :
  **`octets` n'est pas écrit.** C'est la taille du fichier que l'app a envoyé
  (`app/src/donnees/supabase.ts` : `octets: e.fichier.size`), et elle reste
  vraie après la préparation : l'écraser par la taille de l'image propre
  perdait une information que personne ne pouvait plus retrouver. La §7 de
  `05-SCHEMA-BACKEND.md` ne demandait d'ailleurs que
  `chemin/largeur/hauteur/etat/motif`.
  **`format_origine` l'est, en revanche** : l'app le devine du navigateur, qui
  se trompe (piège du 21 octobre, un `.DNG` annoncé « image/DNG » sous
  Windows) ; ici il est lu dans les premiers octets. Noté dans la spec.
- L'essai mesure ce qui est **posé dans le stockage**, pas ce que la ligne
  raconte : les octets se décodent, leur taille est celle annoncée par la
  ligne, le rouge de la mire est dans le bon coin (orientation EXIF 6
  redressée), et exiftool n'y trouve plus ni position GPS ni modèle de
  téléphone. 14 photos d'essai : JPEG d'iPhone avec GPS, original en pleine
  résolution préféré à la version réduite (3 200 px au lieu de 400),
  original annoncé mais absent (la réduite suffit), deux HEIC fabriqués par
  libheif, PDF renommé `.jpg`, JPEG coupé, vidéo MP4, nom de fichier de
  400 caractères (le motif tient dans les 280 de la colonne), ligne sans
  aucun fichier, fichier pas encore arrivé, lignes déjà `prete` et
  `illisible` (intactes), et une image laissée par un passage interrompu.
- Trois passages de suite : le deuxième reprend les HEIC quand le
  convertisseur existe, le troisième ne touche plus rien (`JSON.stringify`
  de la table, identique avant et après).
- L'invariant, mesuré sur la table entière : **aucune ligne « prete » sans son
  image dans le stockage**, et toute image propre rangée sous le SIREN.
- **Contre-essai refait autrement.** Première version : les trois fautes
  posées ensemble dans une seule copie. Elle rougissait, mais sur
  « essai interrompu » — la deuxième faute faisait planter la troisième, et
  l'essai s'arrêtait à 0 contrôle. Un essai interrompu ne prouve rien. Donc
  chaque faute est maintenant posée **seule**, dans sa copie, et l'essai
  entier est rejoué dessus : 10, 4 et 4 fautes nommées, aucune interruption.
  Une cassure qui ferait planter l'essai au lieu d'être mesurée est comptée
  « non attrapée ».
- Deux pièges rencontrés et corrigés en passant :
  `verifier-depot` lit les chaînes de caractères comme du code — la copie
  cassée repointait un import en écrivant le chemin relatif en clair, et le
  vérificateur a cru que l'essai importait un module voisin de lui (bloquant,
  à raison). Le remplacement se fait par un motif. Et `coinRouge` / exiftool
  sur les octets d'un fichier qui n'est pas une image levaient une exception
  hors de tout `catch` : chaque mesure se rattrape et nomme son contrôle
  (même leçon que le 24 octobre sur `essai-app.mjs`).
- Branché : `scripts/essais.mjs` (étape « service : préparation des photos
  reçues »), `--complet` (contre-essai), et la CI. Les deux essais qui
  fabriquent de vraies photos partagent désormais une seule réponse sur les
  outils de la machine (`outilsPhotos`), pour qu'ils ne divergent pas.
- Preuve : suite complète verte, `verifier-depot` à 0 (282 fichiers). T07 faite.

### T34 : extraction et qualification des artisans à appeler

Plan en trois lignes : `scripts/prospection/extraire.mjs` interroge
`recherche-entreprises.api.gouv.fr` (publique, sans clé) code APE par code APE
et refait lui-même les filtres que l'API prétend appliquer ;
`qualifier.mjs` note de 0 à 100 avec les raisons écrites, `registre.mjs` tient
`prospection/registre.json` (jamais de numéro de téléphone, jamais deux appels
le même jour, jamais après « ne plus appeler ») ; `scripts/essai-prospection.mjs`
rejoue tout contre une population d'entreprises **réelles enregistrées une
fois** et un faux serveur qui reproduit la sémantique mesurée de l'API.

**Sémantique de l'API mesurée avant d'écrire une ligne** (24 oct., totaux réels) :

| Requête | `total_results` |
|---|---|
| `activite_principale=43.34Z&etat_administratif=A` | 10 000 (plafond) |
| `… &departement=13` | 4 019 |
| `… &departement_siege=13` (mal écrit) | **10 000** |
| `… &zzz=13` (inconnu) | **10 000** |
| `… &departement=13&tranche_effectif_salarie=00,01,02,03` | 563 |
| `… &departement=13&tranche_effectif_salarie=NN` | 3 418 |
| `… &departement=13&est_rge=true` | 21 |

- Le piège de la spec est confirmé : **un nom de paramètre inconnu est ignoré
  en silence**, et le nombre de résultats ne bouge pas. Une valeur invalide de
  `activite_principale`, elle, rend un 400 qui liste les valeurs valables, et
  le code veut la forme pointée (`43.34Z`, pas `4334Z`).
- `per_page` est plafonné à 25, et `page × per_page` à 10 000 (400 au-delà).
- **`departement=13` ne filtre pas le siège** mais n'importe quel
  établissement : la première réponse rendait FRANCE VITRE, siège à Quimper,
  avec une domiciliation à Marseille. L'extraction refait donc le filtre sur
  `siege.departement`.
- **`NN` (effectif non renseigné) pèse 3 418 des 3 979** : l'exclure jetterait
  presque tous les artisans visés. Il est gardé et vaut peu de points.
- Le RGE n'a pas besoin de la base ADEME : l'API le porte déjà
  (`complements.est_rge`, `liste_rge` par établissement). 21 entreprises
  seulement en 43.34Z dans le 13 : c'est un bonus rare, pas un filtre.
- `43.34Z` est « peinture **et vitrerie** » : la réponse est pleine de
  miroitiers (MIROITERIE MASSILIA, FRANCE VITRE). Le métier se tranche donc
  aussi sur le nom, pas seulement sur le code APE.

**Fait, mesuré.** Quatre pièces et leur essai : `prospection/metiers.json`,
`scripts/prospection/extraire.mjs`, `qualifier.mjs`, `registre.mjs`, et
`scripts/essai-prospection.mjs` — **93 contrôles, 0 faute**, sans réseau.

- L'essai rejoue **693 entreprises réelles** prélevées une fois dans l'API
  (`prospection/essais/recherche-entreprises.json`, réduites aux champs lus),
  servies par `scripts/faux-recherche-entreprises.mjs`, qui reproduit la
  sémantique mesurée plus haut, pièges compris. La population a été choisie
  pour faire travailler chaque filtre : 394 sièges dans le 13, **105 sièges
  ailleurs avec un établissement marseillais**, 134 effectifs hors cible,
  60 entreprises de moins de deux ans, 169 RGE. La date du jour est figée au
  24 octobre, sinon l'âge des entreprises changerait le résultat avec le temps.
- Chaque entreprise retenue est **relue sur la population**, pas crue sur
  parole : siège dans le 13, active, deux ans au moins, effectif dans la
  cible, code APE du métier, aucun mot d'un autre métier dans sa raison
  sociale.

**Deux garde-fous se sont révélés faux en les essayant, et ont été refaits.**

1. *« Le nombre de résultats doit bouger »* ne marche pas. Première version :
   comparer le total avec et sans le filtre. Elle s'est arrêtée sur 43.99D,
   où **toutes** les entreprises du 13 étaient déjà dans la bonne tranche
   d'effectif : deux totaux égaux, et le garde-fou criait au loup. Deux totaux
   égaux veulent dire « ignoré » **ou** « rien à écarter », et on ne peut pas
   les distinguer. Le signal décisif est une **valeur impossible** :
   `departement=976` (Mayotte) ou `tranche_effectif_salarie=52` (5 000
   salariés et plus) doivent faire s'effondrer le total. Mesuré sur 43.99D :
   10 000 sans filtre, 571 avec `departement=13`, **6** avec 976, **0** avec
   l'effectif 52. Et avant tout appel réseau, le contrôle regarde simplement
   si le paramètre est écrit dans l'adresse : une faute de frappe se voit là,
   gratuitement.
2. *« Mot entier »* ne marche pas non plus. En cherchant les mots du métier
   par morceaux, « ite » (pour l'ITE) attrapait **48 noms** sans rapport, dont
   ATS ETANCHEITE. Mais en mot strictement entier, « charpente » ratait SARL
   MIDI CHARPENTES et « couverture » ratait LES COUVERTURES LOPEZ — qui aurait
   donc été appelée comme peintre. La règle juste est **mot entier, pluriel
   compris** (`s?`), et les deux moitiés sont épinglées par quatre vraies
   raisons sociales de la population.

- Le barème tient exactement dans 100 : site 0-25, ancienneté 0-25, effectif
  0-20, RGE +15, nom qui dit le métier +15. Le meilleur profil possible fait
  100, le plus maigre 33. **Une note haute ne se gagne pas en ne sachant
  rien** : sans recherche web, le site vaut `inconnu` et 8 points. Un site
  récent fait par un prestataire écarte : il paie déjà.
- Le registre refuse un numéro de téléphone **où qu'il soit dans le fichier**
  (quatre écritures essayées : `06 12 34 56 78`, `06.12.34.56.78`,
  `0612345678`, `+33 6 12 34 56 78`), un statut inventé, un SIREN à huit
  chiffres, une date à l'envers, une note à 140 — et un refus **n'écrit rien**
  sur le disque (relu octet pour octet avant et après).
- Le lot du jour : 30 artisans, 10 par métier, aucun SIREN deux fois même
  quand deux métiers partagent 43.34Z.
- Deux détails corrigés en route : le bilan des écartées sortait **une ligne
  par date de création** (le motif contenait le détail) ; motif et détail sont
  désormais séparés, avec trois exemples par motif. Et l'essai s'interrompait
  quand l'extraction refusait de partir : chaque extraction est rattrapée,
  nomme son métier et laisse le résumé s'écrire.
- Essayé une fois **contre la vraie API** : ravalement et couverture,
  150 entreprises lues, 79 retenues, les filtres vérifiés en passant
  (`departement 10000→11`, `effectif 660→0`).
- Contre-essai : **7 fautes posées une par une**, dans sept copies hors du
  dépôt, l'essai entier rejoué sur chacune. Chacune est attrapée seule, aucune
  n'interrompt l'essai.
- Branché : `scripts/essais.mjs`, `--complet`, la CI.

### T35 : les deux feuilles de prompts, et le contrôle des images d'un métier

Plan en trois lignes, avant de faire :

1. `banque/prompts/couverture.md` et `peinture.md` : 32 prompts chacun, sur le
   modèle du ravalement (bloc de tête collé une fois, puis une image par
   message), avec le nom de fichier exact, le cadrage et la largeur minimale
   lus dans le plan — l'après avant l'avant pour chaque paire.
2. `scripts/plan-images.mjs` : une seule table des dossiers, cadrages et
   largeurs, utilisée par `liste-images.mjs` et `verifier-images.mjs`, pour
   que les trois réponses ne divergent plus (les anciennes largeurs de
   `liste-images.mjs` étaient fausses des deux côtés).
3. `scripts/verifier-images.mjs` : les fichiers sur le disque (nom, largeur,
   cadrage, paires alignées, minimum jouable) **et** l'accord entre une feuille
   de prompts et le plan (`--prompts`), celui-ci seul pouvant tourner dans la
   CI puisque les images ne sont pas dans Git. Contre-essais des deux côtés.

**Fait, mesuré.** Deux feuilles de prompts, une table unique, un vérificateur à
deux faces.

- `banque/prompts/couverture.md` et `banque/prompts/peinture.md` : **32 prompts
  chacune**, sur le modèle du ravalement — un bloc de règles à coller une fois
  en tête de conversation, puis une image par message, avec son nom de fichier,
  son cadrage et sa largeur minimale. Les sujets viennent du plan
  (`generateur/banque/plan-images.json`), rien n'est inventé à côté. Pour les
  paires, l'**après est demandé avant l'avant**, l'avant étant la dégradation
  de cette image même : deux images séparées donneraient deux bâtiments
  différents et le comparateur du site n'aurait plus de sens.
- La peinture se photographie dedans : le bloc de tête lui interdit la pièce de
  catalogue (meubles design, décoration de magazine, lumière de studio) et
  demande des logements français ordinaires, vides, éclairés par la fenêtre.

**Une seule table des dossiers, des cadrages et des largeurs**
(`scripts/plan-images.mjs`). Trois scripts posent la même question et doivent
recevoir la même réponse. La table vivait dans `liste-images.mjs` seulement, et
elle y était **fausse des deux côtés** : 1 300 px annoncés pour les vues de
chantier et les gestes, que `composer.mjs` encode jusqu'à 1 400 (le site
afficherait un agrandissement), et 1 600 px pour les ambiances, qui ne passent
jamais par le jeu « bandeau ». La largeur exigée est maintenant la plus grande
rendition que le générateur fabrique à partir du fichier : **1600 px pour un
hero, 1400 px pour les autres**. `liste-images.mjs` lit la table au lieu de la
recopier, et `banque/liste-images.md` et `.csv` ont été regénérés (864 images,
avec le dossier de rangement en colonne).

**Le vérificateur, deux faces** (`scripts/verifier-images.mjs`).

1. Les **fichiers sur le disque**, `node scripts/verifier-images.mjs <metier>` :
   présence (le nom fait foi, l'extension non), largeur, cadrage à 3 % près,
   **paires alignées au pixel** (sinon la couture du comparateur ne tombe pas
   au même endroit sur les deux images), et le minimum jouable demandé à la
   fonction même du générateur (`generateur/main-photos.mjs`), pas à une liste
   recopiée. Sur le ravalement : **32 images attendues, 0 faute**, 3 remarques
   (les trois `signe-*` font 1 254 px). Les largeurs des trois dossiers de
   `banque/` sont des remarques et non des fautes : **aucun code ne les lit
   aujourd'hui**, ce sont les couches d'habillage prévues par
   `main-photos.mjs` ; exiger une largeur que rien n'utilise serait inventer
   une règle.
2. Les **feuilles de prompts**, `--prompts` : chaque image du jeu a un prompt et
   un seul, qui annonce le bon cadrage et la bonne largeur ; un nom qui n'est
   dans aucun jeu du métier est une faute de frappe ; l'après est demandé avant
   l'avant. **C'est le seul des deux contrôles qui tourne dans un clone neuf et
   dans la CI**, puisque les images ne sont pas dans Git et que les feuilles,
   elles, y sont.

**Ce que le contrôle des feuilles a trouvé en naissant** : 13 largeurs périmées
dans `banque/prompts/ravalement.md` (les trois chantier et les cinq geste
annonçaient 1 300 px, les cinq ambiance 1 600 px). Corrigées. Le bloc « où
ranger » de cette feuille citait encore `sources-ravalement/`, dossier qui
n'existe plus : remis sur `images/ravalement/sources/`. Même correction dans
`banque/liste-images.md` et dans `app/specs/08-PROSPECTION.md`, qui demandait
« taille ≥ 1600 px » pour toutes les images.

**Contre-essais, dix cassures posées une par une, chacune attrapée seule.**

- Sur les fichiers (copies hors du dépôt) : une image réduite à 900 px, une
  image absente, une paire désalignée (1448×1086 contre 1400×1050), un cadrage
  carré au lieu de 16/9, tous les hero retirés (le générateur refuserait le
  métier).
- Sur les feuilles : une largeur ramenée à 1 300 px, un prompt retiré, `signe-01`
  écrit `signes-01`, la paire 01 demandée dans le mauvais ordre, un cadrage
  annoncé 3/2 au lieu de 16/9. Le contre-essai refuse aussi une cassure qui ne
  changerait rien au texte : une cassure sans effet ne prouve rien.

**Branché** dans `scripts/essais.mjs` : les feuilles de prompts à chaque
passage ; en `--complet`, leur contre-essai, les images du ravalement sur le
disque et leur contre-essai (ces deux derniers « NON LANCÉ » là où `images/`
n'est pas, avec la raison).

Ce qui reste à Fabrice : **générer les 64 images** dans ChatGPT (décision du
24 octobre : « générer par moi à la main ») et les ranger dans
`images/couverture/` et `images/peinture/`, puis lancer
`node scripts/verifier-images.mjs couverture` et `… peinture`. Sans elles, T37
sautera les deux métiers avec un message clair, et la prospection n'aura que le
ravalement.

### Deux pannes trouvées en passant la suite en mode complet (24 oct., nuit)

Le mode `--complet` n'avait plus tourné en entier sur le PC depuis T34 : il
cachait deux rouges, tous deux réparés avant de clore T35.

1. **Deux cassures du contre-essai de prospection ne mordaient plus.**
   `essai-prospection.mjs` visait `if (siege.departement !== departement)
   return { garde: false,` et `if (annees < ancienneteMin) return { garde:
   false,` ; `extraire.mjs` a depuis rangé ses refus derrière une fonction
   `non(motif, detail)` (la correction du bilan des écartées, même journée).
   Le texte ne se trouvait plus, et le contre-essai **le disait** au lieu de
   passer au vert : « la cassure n a rien changé dans extraire.mjs : le module
   a changé de forme », sortie 2. C'est exactement ce qu'on lui demande. Les
   deux cassures visent maintenant `return non(` : **7 cassures, 0 non
   attrapée**.
2. **O6 rougissait sur les trois sites de démonstration, sous Windows
   seulement.** `verifier-ordinateur.mjs` comparait `page.url()` à une adresse
   fabriquée à la main, `'file://' + fichier` : sous Windows cela donne
   `file://C:\…\index.html`, là où le navigateur rend
   `file:///C:/…/index.html`. L'égalité était donc fausse à chaque fois, et le
   contrôle annonçait une navigation qui n'avait pas eu lieu — sur Linux, où le
   chemin commence par `/`, la concaténation tombe juste par hasard : la CI
   était verte. L'adresse se demande maintenant à Node
   (`pathToFileURL(fichier).href`), ici et dans les deux autres scripts qui
   fabriquaient la même chaîne (`verifier-mobile.mjs`,
   `mesure-lisibilite.mjs`). Le vérificateur ordinateur repasse à « aucun
   constat » sur le site de Sud Ravalement, et **O6 mord toujours** :
   contre-épreuve sur une copie du site, hors du dépôt, où un `pointerup`
   change l'adresse — 2 bloquants O6 attrapés, un par écran.

**Preuve de T35**, sur le PC de Fabrice, 24 octobre 23 h 44 :
`node scripts/essais.mjs` → **TOUT EST VERT** (12 étapes, dont la nouvelle
« feuilles de prompts contre le plan d images »), et
`node scripts/essais.mjs --complet` → **TOUT EST VERT** aussi, 19 étapes, les
trois sites de démonstration compris (479 s) : c'est ce passage-là qui a sorti
les deux pannes ci-dessus. `memoire/essais/derniers.txt` garde le passage
simple.

### T36 : les textes des sites de couverture et de peinture

Plan en trois lignes, avant de faire :

1. Lire ce que le moteur exige d'un fichier métier (`textes.mjs` : listes,
   `combiner`, `etapes`/`nombre`/`toujours` ; `composer.mjs` : `libelle`,
   `mot`, `alt`, `teintes`, `nuancierEtiquette`, `estimateur`) et les volumes
   exacts du ravalement, emplacement par emplacement.
2. Écrire `generateur/metiers/couverture.json` et `peinture.json` au même
   volume, avec de la vraie connaissance de métier : l'eau et les recouvrements
   pour la toiture, la préparation et la lumière pour la peinture.
3. Mesurer avec le vrai tirage (`capacite-unicite.mjs --photos plan`), au
   département et dans le pire cas (tous dans la même commune), et composer un
   site de chaque métier pour voir le moteur tenir.

**Fait, mesuré.** Deux fichiers, 40 Ko chacun environ, aux volumes du
ravalement :

| Emplacement | Ravalement | Couverture | Peinture |
|---|---|---|---|
| titres | 110 | 111 | 110 |
| chapô (énumération) | 34 770 | 34 770 | 34 770 |
| état avant | 1 358 | 1 358 | 1 358 |
| état après | 3 850 | 3 850 | 3 850 |
| gestes | 8 × 100 | 8 × 100 | 8 × 100 |
| légendes de comparateur | 960 | 960 | 960 |
| invitation, précision | 80, 81 | 80, 81 | 80, 81 |
| rubriques | 5 × 15 | 5 × 15 | 5 × 15 |
| phrases de matière | 30 | 30 | 30 |
| teintes du nuancier | 10 | 10 | 10 |

**La mesure, avec le vrai tirage** (`node scripts/capacite-unicite.mjs
--metier <métier> --photos plan`) :

| Sites | Couverture U1/U2/U3/U4 | Peinture U1/U2/U3/U4 |
|---|---|---|
| 25 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| 50 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| **100** | **0 / 0 / 0 / 0** | **0 / 0 / 0 / 0** |
| 200 | 2 / 89 / 391 / 80 | 2 / 90 / 389 / 80 |

À 100 sites, aucun défaut non plus avec `--communes une` (tous à Marseille, le
pire cas), et les phrases partagées par une paire de voisins restent à 0,46 en
moyenne et 3 au plus dans une même commune. À 200 sites les réserves cèdent,
exactement comme pour le ravalement : la cible de Fabrice est 100.

**Essai à blanc du moteur**, hors du dépôt et sur un registre à part
(`--registre`), pour vérifier qu'un fichier métier neuf suffit au générateur :
un site `couverture` et un site `peinture` composés avec les photos du
ravalement (les leurs n'existent pas encore, F18), tous deux à **0 bloquant**
chez `verifier-site`. Les textes se recollent comme ils doivent : « La dépose
s'arrête à ce qu'on peut recouvrir le soir même. Le tri décide du nombre de
tuiles à commander, donc du prix. » Chaque phrase à combiner porte son sujet
(piège du 2 octobre). Dossiers d'essai effacés, `generateur/registre.json`
jamais touché.

**Un choix de nommage, à savoir.** `prospection/metiers.json` (Cowork) appelle
le métier « peinture et décoration », le plan d'images « Peinture intérieure ».
Le fichier métier dit **« peinture intérieure »**, parce que c'est ce que le
site montre et raconte : les 32 images et les textes sont des pièces
d'habitation. Promettre « décoration » sans contenu derrière serait écrire une
phrase que la page ne tient pas. Le libellé de la prospection, qui sert à
filtrer l'API, n'a pas été touché.

### T37 : la fabrication du lot du jour

Plan en trois lignes, avant de faire :

1. Lire ce que la pièce doit relier : la qualification en amont
   (`qualifier.lot()`, qui dit qui appeler), le générateur en aval
   (`composer.mjs --donnees --registre`), et les trois vérificateurs
   (`verifier-site`, `verifier-mobile`, `verifier-unicite`).
2. Écrire `scripts/prospection/fabriquer-lot.mjs` : dix sites par métier
   **prêt**, en mode prospection (photos de la banque, mention visible), un
   métier sans images sauté avec son message, le slug tiré et inscrit au
   registre des artisans.
3. Prouver sur le ravalement, le seul métier qui a ses images aujourd'hui :
   dix sites fabriqués et vérifiés pour de vrai, et les deux autres métiers
   sautés proprement.

**Fait.** La pièce est entre la qualification et la publication. Quatre
décisions de structure, parce qu'elles se paieraient cher plus tard :

**Un métier sans images est sauté, pas fabriqué de travers.** La réponse à
« les images sont-elles là ? » ne vient pas d'un `existsSync` recopié mais de
`verifier-images.mjs` lui-même : une image trop petite ou une paire avant/après
désalignée rendrait le site bancal, et il vaut mieux sauter le métier. Pour
cela, `verifier-images.mjs` a reçu la garde `pathToFileURL(process.argv[1])` :
il s'importe sans que sa ligne de commande s'exécute. Le marqueur
`SOURCE-ILLUSTRATION` est exigé **en plus** des images : sans lui, le
générateur ne poserait pas la mention « images d'illustration » et le site
montrerait des photos de banque sans le dire. Mieux vaut aucun site qu'un site
qui ment. Ce qui bloque un métier ne bloque pas les autres : couverture et
peinture attendent F18, le ravalement se fabrique quand même.

**Deux registres, qui ne se mélangent jamais.** `prospection/registre.json`
garde les artisans (qui a reçu un site, quand, sous quel slug, où en est
l'appel) ; `prospection/registre-sites.json` garde l'unicité des sites de
prospection, l'équivalent de `generateur/registre.json` pour la démonstration.
Les mêler aurait fait compter les trois sites de démonstration comme des
voisins des sites de prospection, et l'inverse aussi.

**Le slug est tiré ici, pas à la publication.** Seize caractères de
`randomBytes`, jamais `Math.random` : l'adresse du site privé est son seul
secret. Il est inscrit au registre avec le jour ; `publier.mjs` le relira au
lieu de le refaire. La spec (`08-PROSPECTION.md`) l'attribuait à la
publication : elle est corrigée, ligne de `fabriquer-lot.mjs`.

**Rien n'est inventé pour le générateur.** `donneesSirene()` recopie la forme
de l'API : un champ que l'extraction n'a pas (adresse, SIRET, forme juridique)
reste `null` et la page affiche le vide tel quel ; `est_rge` absent vaut faux,
jamais vrai par défaut.

**La preuve, sur les vraies entreprises.** Dix ravaleurs réels du 13, pris
dans les mieux notés des 693 entreprises enregistrées, fabriqués par la ligne
de commande (`--lot`, `--mobile 1`) :

| Mesure | Résultat |
|---|---|
| sites fabriqués | **10 / 10**, 0 sauté, 0 en échec |
| notes | 83, 77, 73, 72, puis six à 68 |
| `verifier-site` | passé sur chacun des dix |
| `verifier-mobile` | passé sur 749892089, ok (3 appareils) |
| unicité du lot | « Aucun constat. Deux voisins ne se ressemblent pas. » |
| registre des artisans | 10 inscrits, 10 slugs distincts, statut `a-appeler`, `valider()` à 0 faute, aucun champ de téléphone |
| mention d'illustration | `<meta name="atelier-images" content="illustration">` sur les dix pages |

La preuve a tourné avec `--sortie`, `--registre` et `--appels` dans le dossier
temporaire : **le `prospection/registre.json` versionné n'a pas bougé**, parce
que ces dix artisans n'ont reçu aucun site en ligne (la publication est T38).
Inscrire un site non publié aurait écrit une chose fausse dans le registre.

**L'essai** (`scripts/essai-lot.mjs`) est coupé en deux, parce que les images
ne sont pas dans Git : 25 contrôles qui ne demandent aucune image (un métier
sans images sauté avec son message, F18 et la commande nommés ; les données du
générateur qui n'inventent rien ; 500 slugs tirés, aucun deux fois ; le
registre qui refuse un numéro de téléphone), et 54 en `--complet`, qui
fabriquent deux sites de ravalement pour de vrai et relisent leur registre.
**Contre-essai** : trois cassures posées une par une dans une copie du module
hors du dépôt — le marqueur plus exigé, le slug devenu devinable, un métier
sans images fabriqué quand même — **chacune attrapée**, et une cassure qui ne
trouverait plus son texte compterait comme ratée (piège du 24 octobre).

**Branché dans `scripts/essais.mjs`** : la moitié sans images à chaque passage,
le contre-essai et la fabrication réelle en `--complet` (celle-ci « NON LANCÉ »
là où `images/` n'est pas, avec la raison).

**Un piège retrouvé en passant.** Le vérificateur mobile sur un lot dépasse les
dix minutes de l'outil : le lot a été lancé en arrière-plan, comme le piège du
2 octobre le demande. Et pour fabriquer la liste d'essai, un script hors du
dépôt importait les modules par chemin absolu Windows : Node refuse
(`ERR_UNSUPPORTED_ESM_URL_SCHEME`, « protocol 'c:' »), il faut `file:///C:/…`.

### T38 : la publication privée sur Cloudflare Pages

Plan en trois lignes, avant de faire :

1. Lire ce que l'API Pages demande vraiment (envoi direct : jeton d'envoi,
   `check-missing`, `upload`, `upsert-hashes`, dépôt avec manifeste) au lieu de
   le supposer, et comment Cloudflare calcule l'empreinte d'un fichier.
2. Écrire le dialogue (`cloudflare-pages.mjs`), la décision de publication
   (`publier.mjs`) et un faux Cloudflare qui refait les règles de l'API, pour
   que le **vrai** client soit le code mesuré.
3. Prouver sans compte : noindex partout, aucune page d'index, images communes
   montées une fois, retrait à 30 jours et retrait le jour même ; contre-essai
   sur chaque règle.

**Fait**, sauf la seule chose qui demande Fabrice : la première publication
réelle (**F5**). Quatre décisions de structure :

**Pages déploie le projet entier, pas un site.** C'est le fait qui commande
tout le reste : un dépôt porte le plan complet du projet `sito-demo`. Publier
le lot du jour, c'est donc redéployer **tous les sites encore vivants**. Un
site retiré n'est pas effacé : il n'entre plus au manifeste, et son adresse
rend 404. Le « retrait à 30 jours » n'est pas un ménage à faire, c'est une
omission.

**Un manifeste n'a besoin que d'empreintes, pas de fichiers.** Les fichiers
restent dans le magasin du projet d'un dépôt au suivant. D'où
`prospection/en-ligne.json` (versionné, comme le registre) : pour chaque slug,
son plan chemin → empreinte. Les sites des jours précédents se redéploient
**sans que leurs dossiers soient encore sur le disque et sans renvoyer un
octet** — mesuré : après avoir effacé les dossiers, le projet se redéploie,
0 fichier monté, le site retiré en moins.

**L'empreinte n'est pas un SHA.** Cloudflare attend
`blake3(base64(contenu) + extension sans le point)`, en hexadécimal coupé à
32 signes — c'est `hashFile` de `@cloudflare/deploy-helpers`, le code dont
wrangler se sert. Un SHA-256 ferait tout remonter à chaque dépôt et
`check-missing` ne servirait plus à rien ; or c'est précisément lui qui fait
que **les images de banque partagées par trente sites ne montent qu'une
fois**. Node ne sait pas faire blake3 (seulement blake2b512 et blake2s256) :
`hash-wasm` installé (gratuit, libre, sans droits d'administrateur, zéro
dépendance), le paquet que wrangler utilise lui aussi. Son blake3 a été
recoupé avec les vecteurs officiels (chaîne vide et « abc ») avant d'être cru.

**Le faux Cloudflare est un `fetch`, pas une doublure.** Même parti que
`faux-recherche-entreprises.mjs` : le faux est passé au vrai client, qui n'est
pas modifié pour l'essai. Il refait quatre règles de l'API, parce qu'un essai
qui les ignore ne prouverait rien : les **deux signatures** (les trois appels
de fichiers n'acceptent que le jeton d'envoi, pas celui du compte) ;
`check-missing` qui ne rend que ce qui manque ; **un manifeste désignant une
empreinte absente est refusé** (sans quoi oublier un fichier passerait
inaperçu et le site serait troué en ligne) ; `_headers` qui est un réglage et
non un fichier servi.

**La preuve** (`node scripts/essai-publication-prospection.mjs`) : **68
contrôles, 0 faute**, et **dix cassures posées une par une, chacune
attrapée**. Ce qui est mesuré sur ce que reçoit le visiteur : la
racine du projet rend **404** (aucune page d'accueil) ; chaque page et chaque
image portent `X-Robots-Tag: noindex` ; `robots.txt` interdit tout ;
`donnees.json`, `sirene.json` et les fichiers cachés ne sont pas publiés et
rendent 404 ; onze contenus distincts pour trois sites, l'image partagée
comptée **une fois** ; un second dépôt ne renvoie rien ; un abonné garde son
site quel que soit son âge, un site de 30 jours pile reste, 54 jours part,
« ne plus appeler » part le jour même ; `--sec` ne fait aucun appel.

**Le contre-essai a trouvé un trou dans l'essai lui-même**, ce qui est tout
son intérêt. Sept cassures posées une par une ; six rougissaient, la septième
non : remplacer blake3 par un SHA-256 **passait**. Raison : l'essai calculait
l'empreinte attendue avec la fonction qu'il essayait, donc l'attente bougeait
avec elle. Réparé en écrivant des **témoins en dur** (l'empreinte d'un `.webp`
connu, d'un `.txt` connu, et le même contenu sous deux extensions, qui doivent
différer). La leçon est celle du haut de `pieges.md` : un essai qui se mesure à
lui-même ne mesure rien.

**Mesuré aussi sur le vrai lot de T37**, par la ligne de commande et en mode
`--sec` (aucun appel) : les dix sites de ravalement donnent **713 chemins au
manifeste pour 167 fichiers distincts à monter**. Les 546 autres chemins
désignent des empreintes déjà présentes : ce sont les images de banque, les
mêmes pour les dix artisans, et elles ne monteront qu'une fois. Le partage
n'est donc pas une propriété de trois sites d'essai, il se voit sur le lot
réel.

**Et une faute trouvée en relisant mon propre code**, qu'aucun essai ne
couvrait : les sites du lot entraient au manifeste **sans demander au registre
s'il les gardait**. Un artisan qui dit « ne plus appeler » entre la fabrication
du soir et la publication aurait vu son site mis en ligne quand même, parce que
son dossier était sur le disque. C'est le registre qui décide, jamais le lot :
un slug que le plan ne garde pas est écarté, ses fichiers ne sont même pas
montés, et le bilan le dit (`ecartes`).

Durci dans le même esprit : une **date de site illisible fait retirer**, pas
garder. `registre.ecrire()` refuse d'écrire une date mal formée, donc une telle
date vient d'une retouche à la main ; un site qu'on ne sait pas dater ne peut
pas tenir la promesse des trente jours, il sort, et son motif le dit. Garder
par défaut aurait laissé un site en ligne sans fin, en silence.

**Et le contre-essai a repris la main une seconde fois.** La garde ci-dessus
testait `Number.isFinite(age)` ; la cassure correspondante est **passée**. La
raison vaut d'être écrite : `Date.parse('le 3 mars')` **ne rend pas NaN**. V8 y
lit mars 2001, l'âge devient 9 367 jours, le site est retiré — pour la mauvaise
raison — et la branche de précaution n'est jamais atteinte. Le garde-fou avait
l'air de marcher parce qu'un autre chemin donnait par hasard le bon verdict.
Réparé en vérifiant la **forme** de la date avant tout calcul, avec la même
expression que le registre, et en essayant les trois cas : illisible franche,
`2026-13-45`, et « le 3 mars », celle qui ment. Dixième cassure ajoutée ; les
dix rougissent. Huitième cassure ajoutée au
contre-essai, qui rougit.

### T39 : la page d'appels du jour, et les résultats

Plan en trois lignes, avant de faire :

1. Lire ce que le registre sait déjà faire (`appelable`, `relancesDues`,
   `resultat`) : la décision de qui appeler est écrite depuis T34, la page ne
   doit pas la refaire.
2. Fabriquer la page (`page-appels.mjs`, HTML statique, iPhone d'abord) et la
   fonction qui enregistre (`worker/appels.js`, le `_worker.js` du projet
   Pages, branché sur un KV gratuit).
3. Prouver au doigt, sur 390 px, dans un vrai navigateur : toucher un bouton,
   relire le résultat dans KV, et vérifier qu'un échec ne mente pas.

**Fait**, sauf le KV réel (**F5**). Ce qui a demandé une décision :

**La page ne décide rien.** Qui appeler est déjà écrit dans le registre :
`appelsDuJour()` compose les relances dues (devant, c'est la seule promesse
faite à quelqu'un) puis les appelables du lot, les mieux notés d'abord, et
range les autres dans « pas aujourd'hui » **avec leur raison** — déjà appelé
le jour même, abonné, ne plus appeler. Une absence qui ne s'explique pas
ressemble à une panne.

**KV est une boîte aux lettres, pas une base.** Le Worker écrit
`resultat:<siren>` et s'arrête là ; le soir, `/preparer-appels` relit et
reporte dans `prospection/registre.json`, qui reste la vérité versionnée.
Deux sources de vérité auraient divergé le premier jour d'avion sans réseau.

**Aucun numéro, deux fois gardé.** Ni la page ni KV n'en portent : le Worker
refuse un corps où un numéro traîne (cherché dans le corps **entier**, pas
champ par champ), et la page est relue par `verifier()` avant d'être écrite.
C'est la même expression que le registre : la page ne peut pas être plus
laxiste que lui.

**Un échec ne s'affiche pas comme un succès.** Si l'enregistrement rate, le
bouton ne reste pas allumé et la fiche écrit « Pas enregistré : … À refaire ».
Mieux vaut un appel refait qu'un résultat cru à tort — c'est mesuré, en
coupant l'API avec `page.route`.

**« Liens ouverts » est le seul chiffre qui ne vient pas du registre** : il se
passe chez le visiteur. Le Worker compte une vue quand la **page** d'un site
est servie — pas ses images (un site de soixante-dix fichiers vaudrait soixante-
dix visites), pas ses autres pages (le lien envoyé est la racine), pas la page
d'appels de Fabrice. KV n'a pas d'incrément atomique : deux vues à la même
seconde peuvent n'en faire qu'une, donc ce chiffre est un indice et il est
présenté comme tel. Un compte inconnu s'affiche **« ? »**, jamais « 0 », qui
voudrait dire « personne n'a ouvert ».

**La preuve** : **79 contrôles, 0 faute**, dont le navigateur à 390 px —
aucun bouton sous 44 px (plancher d'Apple), rien ne dépasse à droite,
« Intéressé » touché au doigt, la fiche dit « Enregistré. », le résultat relu
dans KV, et le report dans le registre sort l'artisan de la liste du jour.
**Contre-essai : 13 cassures, chacune attrapée.**

**Deux essais à moi, faux, corrigés en route.** Le point de la semaine :
j'avais compté trois appels là où le jeu d'essai n'en portait que deux — le
code avait raison, l'attente était fausse. Plutôt que de corriger le chiffre,
le jeu d'essai a été refait pour mesurer **les deux bords** de la fenêtre de
sept jours (un appel le 19, dedans ; un le 18, dehors ; et la fenêtre
resserrée à six jours qui fait sortir le 19) : c'est au bord qu'un décompte se
trompe, pas au milieu. Et une cassure qui ne mordait pas : « chaque image
compte une vue » ne changeait rien, parce que mon image d'essai était rangée
trois niveaux plus bas et qu'une autre garde l'excluait déjà. Remplacée par ce
qu'elle visait vraiment — une deuxième page du même site, et l'adresse tordue
`/<slug>/index.html/n-importe-quoi`, qui permettrait de gonfler le compteur
depuis l'extérieur.

**À savoir pour Fabrice.** Le texte du SMS est un gabarit court
(`page-appels.mjs`, `SMS`) : le texte exact est dans son document commercial,
section Messages, et s'écrase par paramètre. Rien n'y promet ce que le site ne
tient pas.

Mis à jour le 26 octobre, après la réponse de Cowork à Q2 (`memoire/questions.md`) :
la constante `SMS` porte maintenant le texte réel du document (« Bonjour, voici
le site que j'ai préparé pour {nom} : {lien}. Glissez sur la photo du haut.
Fabrice, Sitô (Marignane) »), plus les trois autres textes (récapitulatif,
relance à 48 h, après signature), notés mais pas encore câblés : ils ne sont
pas affichés par la page d'appels aujourd'hui, seul le premier l'est.

### T40 : la soirée de bout en bout (`/preparer-appels`)

Plan en trois lignes, avant de faire :

1. Lire ce qui existe déjà (extraction, qualification, fabrication,
   publication, page d'appels, T34 à T39) et ce qu'il manque pour en faire une
   seule soirée : la qualification attend une `sites` map que personne ne
   remplit (« la présence d'un site se vérifie par une recherche web faite par
   Claude Code », `qualifier.mjs`) et rien ne publie la page d'appels ni
   `worker/appels.js` lui-même — T39 les avait écrits, mais isolés.
2. Écrire `scripts/prospection/preparer-appels.mjs` en deux phases séparées
   par la recherche web (qui ne se scripte pas) : `lister()` (extrait, note
   une première fois en « inconnu », écrit les candidats à vérifier) et
   `preparer()` (note une seconde fois avec ce que le web a dit, fabrique,
   publie, produit la page). Donner à `publier()` un paramètre `extra` pour
   les fichiers fixes du projet (`_worker.js`, la page d'appels).
3. Prouver sur un faux Cloudflare, sans compte : la chaîne réelle (sans aucune
   image, ce qui tourne dans un clone neuf) et, séparément, « 30 sites et la
   page produits » en fixture minimale (comme T38, le vrai générateur
   demandant des images hors de Git).

**Fait**, sauf ce qui demande Fabrice : la première publication réelle et un
réglage Cloudflare à faire une fois (**F5**). Ce qui a demandé une décision :

**Deux commandes, pas une.** Une recherche web ne se scripte pas (conditions
d'utilisation de Google, et jugement qu'un script n'a pas). `--lister` extrait
et qualifie une première fois (site « inconnu » pour tout le monde, 8 points),
ordonne les candidats, et écrit `prospection/a-verifier.json` : le réservoir
complet (pour requalifier sans réseau à l'étape suivante) et les vingt
premiers à vérifier. Entre les deux, Claude Code cherche chaque candidat sur
le web et écrit un fichier `{ "<siren>": "aucun" | "reseau-social" | … }`.
`--sites <fichier>` relit tout, qualifie une seconde fois, choisit le lot.

**Le slug de la page d'appels est stable, pas tiré chaque soir.** Les slugs
des sites d'artisan, eux, changent à chaque fabrication (`fabriquer-lot.mjs`) :
personne ne les retient, ils voyagent par SMS. La page d'appels, c'est Fabrice
qui la garde en favori sur son iPhone ; lui en donner un nouveau chaque soir
l'obligerait à la rouvrir depuis zéro. `appelsSlug()` tire une fois (16
caractères, `randomBytes`), le garde dans `prospection/appels.json` (versionné :
un chemin de routage, pas un secret d'artisan), et le relit ensuite. Un fichier
abîmé (slug invalide) n'empêche rien : un nouveau est tiré, pas d'arrêt.

**`_worker.js` et la page d'appels ne sont pas des sites d'artisan : ils
entrent au manifeste à chaque publication, sans condition.** `publier()` ne
savait parler que du cycle de vie d'un site (gardé, retiré selon le registre
des artisans). Un paramètre `extra` (fichiers `{ chemin, contenu }`) les
ajoute au manifeste et au magasin à monter, au même titre que `robots.txt` :
exactement comme lui, ils sont de chaque dépôt, jamais retirés. Ce que ça
change pour Cloudflare, mesuré dans `cloudflare-pages.mjs` (l'empreinte ne
dépend que du contenu et de l'extension) : rien de spécial à faire pour que
`_worker.js` devienne la fonction du projet, il monte comme n'importe quel
fichier, à la clé exacte `_worker.js`, à la racine.

**La preuve, en deux morceaux, pour rester honnête.** La fabrication réelle
d'un site (T37) demande les images de l'artisan, qui ne sont pas dans Git :
aucun essai ne peut donc fabriquer 30 vrais sites dans un clone neuf, et
`essai-lot.mjs --complet` le prouve déjà pour deux sites de ravalement, pas
plus. Fabriquer une banque d'images de synthèse juste pour cet essai aurait
été une abstraction que rien d'autre dans le dépôt ne demande. Donc :

1. **La chaîne réelle**, sans aucune image (`node scripts/essai-preparer-appels.mjs`) :
   30 candidats qualifiés avec une recherche web simulée (un « site récent,
   prestataire » placé en tête des critères, pour être sûr qu'il serait choisi
   si la recherche web ne comptait pas) — il est absent du lot, les 30 autres
   sont comptés **sautés**, pas perdus, et **la page se produit quand même**,
   relue par `verifier()`, publiée avec le worker sur le faux Cloudflare.
2. **« 30 sites et la page produits »**, en fixture minimale (même méthode que
   T38, qui teste `publier()` sans le vrai générateur) : 30 dossiers de site
   avec une image partagée, un registre de 30 artisans, une page produite par
   `page()` qui les montre tous (« Les appels du jour 30 »), publiée avec
   `_worker.js` et la page d'appels — **34 contenus distincts montés**
   (30 pages + 1 image partagée + le worker + la page d'appels), relus un par
   un depuis ce que le faux Cloudflare servirait à un visiteur.

**Preuve** : `node scripts/essai-preparer-appels.mjs` : **43 contrôles, 0
faute**. Contre-essai : **3 cassures une par une, chacune attrapée** — le
slug qui ne se relit plus, le worker qui ne voyage plus, la recherche web qui
n'atteint plus la qualification.

**Ce qui reste manuel, une fois.** Un espace KV nommé `APPELS` et la variable
`SLUG_APPELS` (la valeur de `prospection/appels.json`) posés dans le tableau
de bord Cloudflare du projet `sito-demo`, après F5 : `worker/appels.js` les
lit par leur nom, et aucun outil du dépôt ne parle au tableau de bord pour
l'instant. Noté dans `.claude/skills/preparer-appels/SKILL.md`.

Suite complète : `node scripts/essais.mjs` vert. `verifier-depot` à 0
(309 fichiers).

## 27 octobre 2026 : T08, fabriquer un site depuis la base

Plan : lire `app/specs/05-SCHEMA-BACKEND.md` §7 et `generateur/composer.mjs`
pour voir ce qu'il attend de `donnees/` ; écrire un adaptateur qui construit
la même entrée depuis `entreprises/profils/tarifs/photos` (`atelier/supabase.mjs`,
T06) et appelle le générateur en sous-processus, comme `fabriquer-lot.mjs` le
fait déjà pour la prospection ; prouver sur un faux Supabase, avec une copie
cassée.

**Le problème qui n'était pas dans l'énoncé.** `tirerSite()`
(`generateur/tirage.mjs`) retire jusqu'à douze fois pour s'éloigner des
voisins (`generateur/registre.json`), toujours de façon déterministe pour un
même SIREN **tant que la liste des voisins ne change pas**. Si d'autres sites
sont fabriqués entre deux passages du même site (un concurrent du même
département), le tirage le moins fautif peut changer : une refabrication
demandée pour une simple photo ajoutée pouvait changer l'archétype et toute
la charte d'un site déjà montré à l'artisan, sans aucune raison qui le
concerne. C'est exactement ce que `sites.charte` « figée à la création »
(05-SCHEMA-BACKEND.md §3.6) est censé empêcher, et rien dans le code ne le
faisait encore.

**Réparé dans le générateur, pas contourné à côté.** `tirerSite()` et
`tirerUneFois()` acceptent un `charteFixee` (`{ archetype, charte }`) : s'il
est donné, l'archétype et la charte ne se retirent plus, un seul tirage
suffit. `composer.mjs --charte <fichier>` le lui passe. `atelier/fabriquer.mjs`
lit `sites.archetype/charte` s'ils existent déjà pour ce SIREN et ce métier,
les reconstitue en entier (le résumé écrit dans `donnees.json` ne garde que
les clés, pas les objets complets avec couleurs et fichiers de police —
`charteComplete()`, par les tables `FAMILLES/POLICES/GEOMETRIES` de
`charte.mjs`), et les écrit **une seule fois**, à la création.

**Photos : pas de catégorie « hero ».** `photos.role` ne connaît que avant,
après, chantier, geste, detail (migration du 2 octobre) ; la banque
d'illustration de la prospection a une catégorie « hero » séparée (une photo
mi-travaux, pensée pour la coupure avant/après du premier écran), que les
photos d'un artisan n'ont pas forcément. Choix d'ingénierie noté dans
05-SCHEMA-BACKEND.md §7 : reprendre la photo « après » de la première paire
comme hero, à revoir une fois de vraies photos essayées (T30).

**Preuve** : `node scripts/essai-fabrication-base.mjs`, faux Supabase (entreprise,
profil, tarifs, photos générées à la volée avec `sharp`) : **12 contrôles,
0 faute**. Une première fabrication passe `verifier-site` et écrit
`sites.charte` ; une deuxième (une photo de plus, et un concurrent jumeau —
même archétype, même famille, mêmes polices, même géométrie, même mot —
inséré dans le registre entre les deux) garde l'archétype et la charte
identiques, et ne réécrit pas `sites.charte` ; sans les quatre catégories de
photos, rien n'est fabriqué ni écrit, et le motif nomme ce qui manque.
Contre-essai : la copie cassée ne relit plus la charte figée (`if (false &&
siteExistant?.charte)`) — l'archétype passe de `matiere` à `panneau` et la
charte change, attrapé par les deux contrôles prévus pour ça.

Suite complète : `node scripts/essais.mjs` vert (17 étapes, 0 faute).
`node scripts/essais.mjs --complet` lancé en tâche de fond pour vérifier les
contre-essais et les sites de démonstration (sensibles au changement de
`tirage.mjs`/`composer.mjs`).

**Suite du 28 octobre.** `--complet` est revenu vert sauf un rougissement du
vérificateur ordinateur sur un site de démonstration (« l'écran d'entrée ne
part pas »), après que la tâche de fond est restée ouverte plus de 22 h (la
machine a dû dormir). Relancé seul (`node scripts/fabriquer-demo.mjs`) : la
fabrication réussit, mais Playwright échoue une deuxième fois autrement
(délai de navigation dépassé) — deux pannes différentes sur le même tour,
jamais sur la fabrication elle-même. `node scripts/essais.mjs` simple reste
vert à chaque fois. Noté dans `memoire/pieges.md` : ne pas soupçonner
`tirage.mjs`/`composer.mjs` pour un rougissement isolé de
`verifier-ordinateur`/`verifier-mobile` quand la suite simple est verte.
T08 marquée fait.

Avant de committer T08, trois lots de travail non poussés trouvés dans
l'arbre, mélangés avec le mien (jamais `git add -A`, mais `git status`
systématique avant de committer, règle du dépôt) : T40 (déjà fait et décrit
au journal du 26, jamais poussé), et deux dépôts de Cowork annoncés dans
`memoire/de-cowork.md` sans avoir encore été lus en tout début de cette
tâche — `lanceurs/CLE_CLOUDFLARE.bat` (27 oct., le jeton de compte Cloudflare)
et surtout **F5 faite, T41 débloquée** (28 oct.) : Fabrice a créé le compte
Cloudflare gratuit et rangé le jeton avec `CLE_CLOUDFLARE.bat`. Séparés en
trois commits distincts (`T40 : …`, `Cowork : …`, `T08 : …`), chacun avec
exactement ses fichiers.

`lanceurs/RANGER_IMAGES.bat` se réclame de Cowork dans son propre en-tête
(« Ecrit par Cowork le 28 oct. 2026 ») mais n'a pas de ligne dans
`memoire/de-cowork.md` : commité comme Cowork quand même (le fichier le dit
lui-même, et son contenu est cohérent avec F18), mais l'absence d'annonce est
à signaler, pas à corriger ici — `memoire/de-cowork.md` n'est pas à moi.

**T41 est maintenant la bonne prochaine tâche** (dépend de T40, fait ; plus
aucun blocage), et elle vient avant T09 dans l'ordre du tableau. Pas entamée
ce tour : elle demande une vraie recherche web candidat par candidat avant de
publier pour de vrai sur le compte Cloudflare réel de Fabrice, et ce tour-ci
était déjà long. `memoire/maintenant.md` mis à jour pour que le prochain tour
la prenne, pas T09.

## 28 oct. 2026 — T41 (première vraie publication, premier lot réel)

Plan : 1) `--lister` sur le ravalement (couverture et peinture attendent F18,
sautées avec leur message) puis recherche web candidat par candidat ;
2) `--sites` pour de vrai sur le compte Cloudflare de Fabrice, et poser par
l'API (si le jeton le permet) l'espace KV `APPELS` et `SLUG_APPELS` ;
3) relire en ligne : 404 à la racine, `noindex` partout, chaque lien répond.

## 29 oct. 2026 — T41, suite

**Disque plein au démarrage** : 11 Mo libres sur C:, la suite rougit sur
« Espace insuffisant sur le disque » (fabrication du lot). Mesuré : `%TEMP%`
pèse 1,6 Go, dont ≈ 650 Mo de dossiers `essai-publication-…` (≈ 50 Mo
chacun), `essai-photos-…`, `essai-preparation-…` jamais effacés par les essais.
L'effacement en masse de ces dossiers est **refusé par le mode auto**
(« Shared Scratch Sweep ») : pas contourné. Fait à la place :
- `sites/prospection/2026-10-28/` (81 Mo) effacé **après** relecture en
  ligne : `verifier-en-ligne.mjs` → 6 sites et la page d'appels, 50 contrôles,
  0 faute (décision du 29 oct.) ;
- la cause : `essai-publication.mjs`, `essai-photos.mjs`,
  `essai-preparation.mjs` effacent leur dossier quand ils passent (gardé pour
  lire une faute). Vérifié : 122 dossiers avant trois passages, 122 après.
- 139 Mo libres : sous 1 Go, plus de fabrication (décision du 29 oct.) ;
  **F19** ajoutée pour Fabrice (fichiers temporaires, Téléchargements 894 Mo).

**Essai faux, réparé** : `essai-preparer-appels.mjs` comparait le Worker
publié au fichier brut ; il part désormais avec `SLUGS_EN_LIGNE` posé
(`workerAvecSlugs`, filtre des sites retirés que Pages sert encore 7 jours).
L'essai attend maintenant ce contenu-là. 49 contrôles, 0 faute ; contre-essai
3 cassures sur 3 attrapées. Suite complète verte.

En ligne sur `sito-demo.pages.dev` : 6 façadiers seulement (SP FACADES,
SCULPTURE FACADE, DUO FACADE, MC FACADES, BRIZZI FACADES, EVORA RAVALEMENT) ;
les 4 non-façadiers signalés par Cowork n'y sont plus. Reste dans T41 : la
cause du mauvais tri (mots de `metiers.json`, nom muet gardé d'office), les
noms (enseigne, forme juridique, accents) et les communes officielles, puis
refabriquer les 6 — ce dernier point attend F19.

**La cause du mauvais tri, corrigée** (décision du 29 oct., signalement de
Cowork). Plan : 1) mots de `metiers.json` et preuve du métier ; 2) noms et
communes à la source et dans le générateur ; 3) essais qui rougissent sur les
quatre cas réels.
- `metiers.json` : ravalement = ravalement, ravaleur, façade, façadier, enduit,
  crépi ; `motsAutreMetier` (maçonnerie, maçon, isolation, isol, ITE,
  plâtrerie, cheminée, énergie, gros œuvre) écarte un nom qui ne dit pas aussi
  la façade ; `preuveDuMetier` : un nom muet porte `preuveExigee`.
- `qualifier.mjs` : la recherche web peut écrire `{ site, metier, vu }` ; sans
  `"oui"`, un nom muet est écarté avec sa raison ; un `"non"` écarte toujours.
  `lister` montre les noms muets (`metier_a_prouver`) pour qu'ils soient
  cherchés. Skill `/preparer-appels` mis à jour.
- `scripts/prospection/noms.mjs` (nouveau) + `prospection/communes-13.json`
  (119 communes, geo.api.gouv.fr) ; `generateur/sirene.mjs` : accents des
  mots de métier, casse des noms composés gardée, arrondissement retiré,
  parenthèse en double et forme juridique retirées.
- Communes du registre remises au nom officiel (6 fiches).
Preuve : `essai-prospection.mjs` 122 contrôles, 0 faute ; contre-essai
12 cassures sur 12 attrapées (dont 5 nouvelles ; celle de la table des
communes passait d'abord, le code postal suffisant à tous les cas : ajouté un
code postal partagé, 13103). Sur la population réelle, sans web, plus aucun
nom muet au ravalement. Suite complète verte.

T41 passe **bloqué** : refabriquer les 6 sites avec leurs noms propres
demande de la place (F19) ; les 30 liens demandent F18.

## 29 oct. 2026 — T05 (essais de droits et conseillers)

Plan : 1) comparer migrations base / dépôt ; 2) rejouer `droits.sql` et
`droits-app.sql` par `execute_sql` ; 3) `get_advisors` sécurité et performance.

- `list_migrations` : 7 migrations, les mêmes noms et versions que
  `supabase/migrations/`.
- `droits.sql` : « A voit 1 entreprise(s) ; A ecrit chez B : refuse ; A ecrit
  chez lui : accepte ; A declare une illustration : refuse ; A cree une
  entreprise : refuse ; A modifie Sirene : 0 ligne(s) ; A voit 0 prospect(s) ;
  telephone faux : refuse ; haut sous bas : refuse ; A pose son telephone :
  accepte ; anonyme : refuse ».
- `droits-app.sql` : « A voit 1 demande(s) ; A marque sa demande lue : 1 ; A
  marque une demande de B : 0 ; A reecrit un message : refuse ; A voit 0
  abonnement(s) de B ; A se donne un abonnement : refuse ; A lit les jetons
  Google : refuse ; A envoie une photo HEIC : accepte ; A pose l original de sa
  photo : accepte ; A range son original chez B : refuse ; A pose l image
  propre : refuse ; A declare sa photo prete : refuse ; A valide sa reponse :
  1 ; A reecrit l avis du client : refuse ; A valide au nom de B : refuse ; A
  raccourcit le delai : refuse ; A demande la suppression : accepte ; A
  supprime B : refuse ; anonyme : refuse ; jour de Paris pour 23 h 30 UTC le
  5 : 2026-10-06 ». Aucune « FAUTE ».
- Après coup : 0 utilisateur `@essai.invalid`, 0 entreprise d'essai.
- Conseillers sécurité : 1 avis INFO `rls_enabled_no_policy` sur 3 tables
  (`prive.jetons_google`, `public.evenements_stripe`, `public.prospects`) :
  voulu, accès service seulement (05-SCHEMA-BACKEND §2). Le 2 oct., seule
  `prospects` était citée : les deux autres viennent de la migration `app`
  du 5 oct., même intention. Performance : 1 avis INFO `unused_index`,
  18 index (base vide). Aucune alerte nouvelle.

## 29 oct. 2026 — T09 (boucle du service)

Plan : 1) `atelier/boucle.mjs` : savoir si un site a changé depuis sa
dernière fabrication, le refaire, le publier par version, noter la base ;
2) essai de bout en bout sur faux Supabase ; 3) contre-essai.

- Sans serveur loué (décision du 29 oct.) : la boucle fait **un tour** et rend
  son bilan ; c'est le workflow GitHub Actions de T45 qui la lancera.
- « Changé » = une date (`mis_a_jour_le`/`cree_le`) de photos prêtes, profil,
  tarifs ou entreprise plus récente que la dernière fabrication, **réussie ou
  non** : un site refusé n'est pas retenté en boucle. Limite notée dans le
  module : un tarif supprimé ne laisse pas de date.
- `atelier/fabriquer.mjs` : une ligne `sites` inscrite **sans** charte
  recevait jamais la sienne (`if (!siteExistant)`) ; corrigé en
  `if (!siteExistant?.charte)`. `essai-fabrication-base` reste à 12/0.
- Constat sur le générateur : un second « geste » n'est pas forcément montré
  (un seul est tiré parmi les candidats, `main-photos.mjs`) ; une seconde
  paire avant/après l'est toujours. L'essai prouve donc « une photo ajoutée
  est dans la version suivante » avec une paire.
- Contre-essai : la première cassure faisait d'abord planter l'essai (il
  relisait la version 1 après son effacement, deux versions gardées) : le
  manifeste de la version 1 est maintenant lu juste après le premier tour.
Preuve : `essai-boucle.mjs` 23 contrôles, 0 faute ; contre-essai 4/4 ; suite
complète verte (18 étapes). Place libre : 133 Mo.

## 29 oct. 2026 — CI rouge, réparée avant T10

#25, #26, #27 rouges, #24 vert. `node scripts/ci-github.mjs --journal` ne
montrait que la fin du journal (rien d'utile) : option `--lignes=N` ajoutée.
Avec 3 000 lignes : « essai interrompu — fetch failed » dans
`essai-fabrication-base` et `essai-boucle`, juste après la première
fabrication. Cause et réparation : `memoire/pieges.md` (29 oct., course entre
un `spawnSync` de 9 s et la fermeture des connexions inactives du faux
serveur). Essais locaux verts ; preuve attendue : la CI.

## 29 oct. 2026 — T42 (audit du dépôt et du PC)

T10 repassée « à faire » : Cowork (18 h 11) place T42 et T43 avant T10. Le
brouillon de T10 (`supabase/migrations/20261029150000_deposer_demande.sql`,
`supabase/essais/demandes.sql`) reste sur le disque, non enregistré, non
appliqué à la base : T10 le reprendra.
Plan : 1) `scripts/audit-depot.mjs` : doublons (SHA-256), fichiers suivis
morts, dossiers vides, temporaires (%TEMP% `sito-*`/`essai-*`, `app/dist-*`,
lots anciens), 20 plus gros fichiers, place libre ; corrige ce qui est permis ;
2) contre-essai sur un clone avec un doublon, un mort, un temporaire ;
3) branché dans `/fin-de-seance`, rapport `memoire/essais/audit.txt`.

## 29 octobre 2026 à 18:28 — audit du dépôt (scripts/audit-depot.mjs)

- scripts/unicite-regles.mjs : cité nulle part (ni chemin, ni nom)
- `scripts/audit-depot.mjs` : premier passage sur le vrai dépôt, 1 fichier
  mort retiré par `git rm` (`scripts/unicite-regles.mjs`, simple renvoi vers
  `generateur/unicite.mjs` depuis le 2 oct., que plus rien n'importe),
  132 temporaires (dossiers `essai-*` et `sito-*` de %TEMP% d'avant le
  29 oct., `.playwright-mcp/`) et `sites/prospection/` vide supprimés :
  1 240 → 1 850 Mo libres. Second passage : 0/0/0/0. `docs/` que rien ne
  cite (43 fichiers, surtout `docs/lecture-structorai/`) : listés, gardés
  comme archive, pas retirés.
- Une règle « dossier cité » (un fichier vit si son dossier est cité)
  essayée puis retirée : « scripts/ » cité seul dans CLAUDE.md rendait vivant
  tout `scripts/`, et le mort n'était plus trouvé.
- `verifier-depot` rougissait sur les deux fichiers posés par le contre-essai
  (chemins écrits en clair dans l'essai) : chemins composés, ils n'existent
  que dans le clone.
- Le crochet refuse la suppression récursive dans %TEMP% depuis le terminal
  (même nommée avec un joker) : les copies gardées par les contre-essais
  cassés exprès (≈ 55 Mo, `sito-audit-contre-essai-*`) partiront au prochain
  audit, après deux heures.
- Demande de Cowork (18 h 30) : `scripts/mesure-disque.mjs`, lecture seule,
  296 s pour tout C: ; `pagefile.sys` et `hiberfil.sys` refusent `lstat`
  (EPERM), leur taille vient de `dir`. Le gros : Windows Update 4,9 Go,
  Office 4,4 Go, Chrome 1,5 Go, veille prolongée 1,5 Go → F19 réécrite.
  `npm cache clean --force` fait par Claude Code : ≈ 530 Mo (le dossier
  `_npx`, où vit le serveur Playwright de Claude Code, est gardé).
Preuve : audit 0/0/0/0 ; `--contre-essai` 18 contrôles, 0 faute ; 4 cassures
sur 4 attrapées ; suite complète verte. Place libre : 2,1 Go.
- Erreur de rangement : le `git rm` de `scripts/unicite-regles.mjs`, déjà
  indexé par l'audit, est parti dans le commit `Cowork : memoire/de-cowork.md`
  (73dfb14), fait pendant la tâche. Historique laissé tel quel (jamais
  réécrit). Garde : un audit qui corrige indexe ses `git rm` ; avant un
  commit `Cowork : …`, vérifier `git diff --cached --stat`.

## 29 oct. 2026 — T43 (inscription sans code)

Plan : 1) base : `invitations` + `creer_invitation`, fonction Edge
`inscription` (compte créé confirmé par l'API d'administration, rattaché à
l'entreprise du lien) ; 2) app : connexion par mot de passe, écrans
d'inscription et de reprise, code retiré ; 3) essais (logique, réel sur le
compte d'essai, navigateur) et specs.

- Doc Supabase relue (29 oct.) : sans serveur d'e-mail personnel, Supabase
  refuse d'écrire aux adresses hors de l'équipe du projet. « Mot de passe
  oublié » par l'e-mail de Supabase ne toucherait donc aucun artisan :
  remplacé par un lien de reprise que Fabrice envoie par SMS (Q4).
- Fonction Edge plutôt qu'inscription libre : les inscriptions publiques
  restent fermées, rien à régler dans le tableau de bord, aucune clé posée.
- Le `.env` n'a toujours pas la clé de service (F1) : l'essai réel passe par
  la fonction elle-même (`essai-inscription.mjs --reel <jeton>`), le jeton
  fabriqué par l'outil MCP. Le compte d'essai (SIREN 000000000,
  `SITO_COMPTE_ESSAI_COURRIEL`) est né ainsi : inscription 6/0, puis reprise
  6/0 (connexion par mot de passe, mauvais mot de passe refusé, il ne voit
  que l'entreprise d'essai, lien refusé la seconde fois). Mot de passe tiré
  au hasard, jamais écrit : la fois suivante, un lien de reprise.
- Contrôle des secrets : l’argument `motDePasse` passé à `password` passait pour un mot de passe
  écrit en clair (motif de 8 caractères) ; variable renommée `mdp`.
- App : `Donnees` perd `envoyerCode`/`verifierCode`, gagne `seConnecter`,
  `lireLien`, `sInscrire`, `reprendre` (démonstration et Supabase) ; écran
  `Inscription.tsx` pour `#/inscription/<jeton>` et `#/reprise/<jeton>`. La
  démonstration garde sa session dans localStorage (comme Supabase) : avant,
  sessionStorage la perdait à la fermeture.
- L'essai a trouvé un vrai défaut : passer d'un lien refusé à un autre lien
  gardait l'écran « Lien refusé » (état non remis à zéro). Corrigé par une clé
  par jeton sur l'écran.
- Contre-essai de l'app : les copies construites avec `mktemp -d` rougissaient
  toutes dès le premier champ, cassées ou non : Node lisait le chemin POSIX
  `/tmp/…` comme `C:\tmp\…`. Avec `cygpath -w`, la copie saine passe (115/0)
  et chaque cassure rougit sur son contrôle (piège noté).
Preuve : `essai-app` 115/0, contre-essai 2/2 ; `essai-inscription` 23/0 et
4/4, réel 6/0 deux fois ; suite complète verte (20 étapes).

## 3 nov. 2026 — fin de séance

Séance du 29 oct. (soir) : T42 (`ae27a7d`, `0fdb906`), T43 (`1077659`,
`90c1f51`), commits Cowork `36211e8`, `73dfb14`. CI verte sur `90c1f51`.
Audit du 3 nov. : 6 copies d'essai oubliées effacées, 0 doublon, 0 mort ;
1,5 Go libres. Suite complète verte. Suivante : T44.

## 3 nov. 2026 — T44 (photos préparées dans l'app)

Plan : 1) l'original part sans métadonnées, sans perte (`nettoyer.ts`) ;
2) RAW/DNG : l'aperçu JPEG intégré (`apercu-brut.ts`) ; illisible : pas
envoyé, dit à l'artisan ; 3) essais (pixels, exiftool), contre-essai, specs.

- Ce qui existait : réduction 3 200 px, redressement, JPEG sans métadonnées.
  Ce qui fuyait : l'original (décision du 9 oct.) partait avec son GPS, et un
  DNG ou un HEIC illisible partait tel quel, avec le sien, vers un service de
  conversion qui n'existe plus (pas de serveur, 29 oct.).
- Décision du 3 oct. « tout doit être accepté » contre « pas de serveur » :
  un RAW porte presque toujours un aperçu JPEG de l'appareil ; c'est lui qui
  part. Seul ce qui n'a ni aperçu ni décodeur (HEIC hors iPhone) est refusé,
  avec le moyen de l'envoyer quand même.
- Originaux : seulement JPEG et PNG (nettoyables sans toucher à l'image) ;
  WebP, GIF, AVIF, HEIC sur iPhone : la version réduite suffit.
- Premier passage rouge : l'aperçu d'essai, tout uni, pesait 18 Ko, sous un
  seuil de 32 Ko. Un aperçu se juge à ses pixels une fois décodé (1 000 px au
  moins), pas à son poids. Et la fin d'un JPEG se lit (FFD9 après l'image) au
  lieu de « jusqu'au JPEG suivant », qui aurait coupé un aperçu à sa vignette.
- Vidéos : leur position GPS reste dedans (iPhone, Android). Hors du sujet de
  T44 (photos) ; T46 ajoutée.
Preuve : `essai-app` 132/0 ; contre-essai 3/3 (une cassure d'abord non
posée par un sed mal échappé, reposée et attrapée).

## 3 nov. 2026 — T47 (garde de l'étape « app » de la suite), par Cowork

Plan : (1) une garde `outilsApp` (exiftool, ffmpeg : ce qu'`essai-app.mjs`
appelle) sur l'étape « app : parcours et rendu » de `scripts/essais.mjs` ;
(2) preuve sur une machine sans exiftool : étape « NON LANCÉ », sortie 4 ;
(3) contre-essai : garde retirée, la suite redevient rouge (sortie 1).

Résultat : `scripts/essais.mjs` gagne `outilsApp` (exiftool, ffmpeg), posée
sur l'étape « app : parcours et rendu » et sur le contre-essai de l'app.
Preuve sur la machine de Cowork, sans exiftool : sortie 4, l'étape « NON
LANCÉ », 0 faute (3 étapes non lancées, toutes faute d'exiftool). Contre-essai
(copie `essais-casse-t47.mjs`, garde retirée, effacée ensuite) : sortie 1,
« FAUTE app : parcours et rendu ». `memoire/essais/derniers.txt` laissé tel
quel (il porte le passage complet du PC, 3 nov. 01:42) ; la preuve avec les
outils est la CI GitHub.
TRACAGE : scripts/essais.mjs, app/specs/07-TACHES.md, docs/audit/REGISTRE.md (S-005 clos), docs/REGLE-ESSAIS.md, docs/TROUBLESHOOTING.md, CHANGELOG.md, memoire/journal.md

## 3 nov. 2026 — T48 (un seul échappement pour le générateur), par Cowork

Plan : 1. `generateur/echapper.mjs` (`html`, `jsonDansPage`) remplace les trois
copies et l'échappement passé en paramètre aux sections ; 2. un essai qui
fabrique des sites porteurs d'une charge et les lit dans Chromium ; 3. contre-
essai sur une copie du générateur avec l'ancienne fonction.

Résultat : trois copies retirées (`composer.mjs`, `archetypes/matiere.mjs`,
`sections/appel.mjs`) ; `arrivee`, `atmosphere`, `prix` importent la fonction
au lieu de la recevoir ; échappés en plus : le texte alternatif des images, le
`aria-label` des glissières, le SIREN de la balise `atelier-generateur`.
`essai-echappement.mjs` : 101 contrôles, 0 faute, 10 sites, quatre archétypes.
Contre-essai : 7 fautes ; l'ancienne fonction laissait un vrai attribut
`data-injecte` entrer dans la page (4 sites sur 10). Panne en route : un
U+2028 écrit tel quel dans une regex (piège noté).
TRACAGE : generateur/echapper.mjs, generateur/composer.mjs, generateur/archetypes/matiere.mjs, generateur/sections/appel.mjs, generateur/sections/arrivee.mjs, generateur/sections/atmosphere.mjs, generateur/sections/prix.mjs, generateur/LISEZMOI.md, scripts/essai-echappement.mjs, scripts/essais.mjs, app/specs/07-TACHES.md, docs/audit/REGISTRE.md (S-006 clos), docs/audit/CARTE.md, CHANGELOG.md, memoire/pieges.md, memoire/journal.md

## 3 nov. 2026 — T50 (mentions légales d'un site d'abonné), par Cowork

Plan : 1. `generateur/sections/mentions.mjs` (page, lien, médiateur) et le
régime abonné (`--publication`) dans `composer.mjs` ; 2. contrôle ML de
`verifier-site` et `essai-mentions.mjs` ; 3. migration des champs manquants,
écran « Compte », `atelier/fabriquer.mjs`.

Résultat : 56 contrôles, 0 faute, quatre archétypes ; contre-essai 4 fautes ;
contrôle ML rouge sur 4 copies cassées. Migration appliquée sur la vraie base
(`apply_migration`, version `20261103143933`, fichier renommé) ; `droits-app.sql`
rouge avant (« column capital_social does not exist »), 23 résultats sans
faute après ; conseillers : rien de nouveau. Vérifié en route : le directeur
de la publication est bien obligatoire (LCEN, déplacé à l'article 1-1 par la
loi SREN de 2024) ; adresse de Cloudflare relevée à la SEC. Écart : le titre
d'onglet dit « informations légales », car « mentions légales » avant le h1
fait rougir C3 (contrôle laissé tel quel). Le pied de page d'un site d'abonné
est déjà corrigé ici ; le reste de T54 (note « Photographies d'exemple », texte
alternatif « Exemple, ») reste à faire. `essai-fabrication-base` et
`essai-boucle` ont des profils complets (sinon refus, à raison).
TRACAGE : generateur/sections/mentions.mjs, generateur/composer.mjs, generateur/archetypes/matiere.mjs, generateur/LISEZMOI.md, atelier/fabriquer.mjs, scripts/verifier-site.mjs, scripts/essai-mentions.mjs, scripts/essais.mjs, scripts/essai-fabrication-base.mjs, scripts/essai-boucle.mjs, supabase/migrations/20261103143933_mentions_legales.sql, supabase/essais/droits-app.sql, supabase/README.md, app/src/ecrans/Compte.tsx, app/src/types.ts, app/src/donnees/supabase.ts, app/src/donnees/demo.ts, app/specs/05-SCHEMA-BACKEND.md, app/specs/07-TACHES.md, docs/specs/S-MENTIONS.md, docs/SOURCE-UNIQUE.md, docs/audit/REGISTRE.md (S-004 clos), docs/audit/CARTE.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md

## 3 nov. 2026 — T51 (référencement), par Cowork

Plan : 1. `generateur/sections/referencement.mjs` (en-tête par régime, JSON-LD,
icônes, image de partage, robots.txt, plan du site) et `--adresse` ; 2. contrôles
R-REGIME, R-OG, R-JSONLD, R-SITE de `verifier-site` ; 3. `essai-referencement.mjs`.

Résultat : 94 contrôles, 0 faute, quatre archétypes ; 10 copies cassées
attrapées ; contre-essai 14 fautes. `schemaType` ajouté aux trois fichiers
métier. `atelier/fabriquer.mjs` lit l'adresse principale dans `adresses` ;
`essai-fabrication-base` la pose avant la deuxième fabrication (14 contrôles),
`essai-boucle` a une table `adresses` vide. Trou trouvé : rien ne pose
`sites` ni l'adresse offerte avant la première fabrication (D-14). Laissés pour
plus tard, en dette : horaires, `priceRange`, redirection RS3 (D-13).
TRACAGE : generateur/sections/referencement.mjs, generateur/composer.mjs, generateur/metiers/couverture.json, generateur/metiers/peinture.json, generateur/metiers/ravalement.json, generateur/LISEZMOI.md, atelier/fabriquer.mjs, scripts/verifier-site.mjs, scripts/essai-referencement.mjs, scripts/essais.mjs, scripts/essai-fabrication-base.mjs, scripts/essai-boucle.mjs, docs/specs/S-REFERENCEMENT.md, docs/DETTE.md (D-13, D-14), docs/audit/REGISTRE.md (S-003 clos), docs/audit/CARTE.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md

## 3 nov. 2026 — T49 (Safari, WebKit), par Cowork

Plan : 1. `--navigateur webkit` (ou SITO_NAVIGATEUR) dans `verifier-mobile`,
`verifier-ordinateur`, `essai-app` ; 2. `essai-navigateurs.mjs` : un site
d'abonné de chaque archétype, photos de synthèse, les deux vérificateurs ;
3. la CI installe WebKit et lance les deux moteurs (WebKit ne s'installe pas
sur la machine de Cowork : la preuve sera la CI).

En route, sous Chromium déjà : sur l'archétype panneau, à 1 440 × 900, la photo
de l'ouverture passait sous le titre et les boutons « Voir l'avant / Voir
l'après » sous l'étiquette du nuancier, qui prenait les clics. Présent avant
aujourd'hui (vérifié sur le commit f05f73a). `verifier-ordinateur` plantait
dessus (attente de Playwright) au lieu d'un constat. Corrigé : le corps de
l'atmosphère ne se tasse plus sur grand écran ; le clic recouvert devient le
constat O5 (l'ancien site le montre, avec O15). La page des mentions légales a
maintenant le bouton d'appel en haut et un titre de 40 px.

Résultat (T49) : CI verte avec WebKit au septième passage (commit `36077de`) :
sites 17 contrôles, app 132 contrôles, 0 faute ; Chromium sur les mêmes sites,
0 faute. Ce que WebKit a montré, et que Chromium cachait : 16 images de la
deuxième paire citées et absentes (cause réelle des cadres de 28 px ; l'AVIF
était une fausse piste, le WebP est proposé quand même) ; débordement de 18 px
d'elevation à 360 px ; une photo « ajoutée à l'envoi » qui ne partait jamais
(la file ne lisait pas sa réserve en mémoire) ; le lien d'inscription qui
ouvrait la connexion. Nouveau contrôle R-FICHIER. M7 à M9 non essayés sous
WebKit (CDP), dit dans le rapport. Constat S-025 ouvert (deuxième page, M2).
Installer WebKit (et exiftool par npm) sur la machine de Cowork : refusé par le
mode auto ; toute la preuve WebKit vient de la CI.
TRACAGE : scripts/verifier-mobile.mjs, scripts/verifier-ordinateur.mjs, scripts/verifier-site.mjs, scripts/essai-app.mjs, scripts/essai-navigateurs.mjs, scripts/essais.mjs, .github/workflows/essais.yml, generateur/composer.mjs, generateur/style.mjs, generateur/sections/atmosphere.mjs, generateur/sections/mentions.mjs, generateur/archetypes/matiere.mjs, app/src/photo.ts, app/src/attente.ts, app/src/App.tsx, app/specs/07-TACHES.md, docs/audit/REGISTRE.md (S-007 clos, S-025), docs/audit/CARTE.md, CLAUDE.md (§4), CHANGELOG.md, memoire/pieges.md, memoire/maintenant.md, memoire/journal.md, memoire/de-cowork.md

## 4 nov. 2026 — T54 (photos et pied de page selon le régime), par Cowork

Plan : 1. `PHOTOS_EXEMPLE` dans `composer.mjs` (faux pour `--publication`) :
alt sans « Exemple, », sans `data-exemple`, sans marqueur ni note ; 2. contrôle
R-EXEMPLE de `verifier-site` ; 3. contrôles dans `essai-mentions` et
`essai-fabrication-base`.

Résultat : essai-mentions 62 contrôles, 0 faute (contre-essai toujours
attrapé) ; essai-fabrication-base 15 contrôles, 0 faute. R-EXEMPLE rouge sur
deux copies cassées. Le pied de page était déjà réglé par T50. Constaté en
route : sur un site de prospection matiere, la note « Photographies
d'exemple » n'existe pas (alt et marquage suffisent) ; rien changé.
TRACAGE : generateur/composer.mjs, scripts/verifier-site.mjs, scripts/essai-mentions.mjs, scripts/essai-fabrication-base.mjs, app/specs/07-TACHES.md, docs/audit/REGISTRE.md (S-022 clos), CHANGELOG.md, memoire/maintenant.md, memoire/journal.md

## 4 nov. 2026 — T57 (modèles de prospection), par Cowork

Plan : 1. `--graine` dans `tirage.mjs` et `composer.mjs` ; 2.
`scripts/prospection/modeles.mjs` (compléter à 10 libres, `--verifier`) ;
3. `essai-modeles.mjs` et les 30 modèles du dépôt.

Résultat : 18 contrôles, 0 faute ; contre-essai 3 fautes. Les modèles sont
tirés en voisins « de la même commune » les uns des autres (règle la plus
stricte), sur les noms de photos du plan de la banque. Un modèle fixe charte
et graine : les phrases et la main de photos ne bougent plus d'un artisan à
l'autre.
TRACAGE : generateur/tirage.mjs, generateur/composer.mjs, scripts/prospection/modeles.mjs, prospection/modeles/ravalement.json, prospection/modeles/couverture.json, prospection/modeles/peinture.json, scripts/essai-modeles.mjs, scripts/essais.mjs, .github/workflows/essais.yml, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T58 (lot du jour sur les modèles), par Cowork

Plan : 1. `repartir()` dans `fabriquer-lot.mjs`, `--charte` et `--graine` du
modèle ; 2. modèle au registre des appels ; 3. un vrai lot sur images de
synthèse dans `essai-lot.mjs`.

Résultat : 34 contrôles, 0 faute ; suite complète sans faute. Panne trouvée
par le vrai lot : deux artisans sur le même modèle recevaient des titres et un
bouton d'appel différents, parce que les voisins du registre changeaient
encore le choix des textes ; sur un modèle, les voisins ne comptent plus
(`composer.mjs`). Le contrôle d'unicité du lot est retiré, par la décision du
4 nov. (pas un contrôle affaibli : l'exigence a changé, l'unicité se mesure
entre modèles). Le contre-essai de `essai-lot` rate déjà sur cette machine
(cassure du marqueur, sans images) comme avant T58 ; attrapée sur le PC.
TRACAGE : scripts/prospection/fabriquer-lot.mjs, scripts/prospection/registre.mjs, generateur/composer.mjs, scripts/essai-lot.mjs, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md

## 4 nov. 2026 — T59 (acceptation d'un site), par Cowork

Plan : 1. `accepter.mjs` (`--siren`, `--tous`) ; 2. appel de `accepterTous`
dans `preparer-appels.mjs` avant le lot ; 3. `essai-accepter.mjs`.

Résultat : 13 contrôles, 0 faute ; contre-essai 7 fautes ; `essai-preparer-appels`
toujours vert (49). Choix : pas de nouveau statut dans la page d'appels ;
« Essai lancé » et « Abonné » valent acceptation (l'artisan a dit oui).
Réversible ; dit à Fabrice.
TRACAGE : scripts/prospection/accepter.mjs, scripts/prospection/preparer-appels.mjs, scripts/essai-accepter.mjs, scripts/essais.mjs, .github/workflows/essais.yml, app/specs/07-TACHES.md, docs/specs/S-MODELES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T55 (textes alternatifs du métier), par Cowork

Plan : 1. `altDe()` et `A()` dans `composer.mjs`, `base.alt` dans
`matiere.mjs` ; 2. légendes de matiere dans `legendesPhotos` des trois métiers ;
3. contrôle R-ALT de `verifier-site` et `essai-alt.mjs`.

Résultat : 52 contrôles, 0 faute ; contre-essai 16 fautes. R-ALT a trouvé en
plus les textes des deux comparateurs (« façade complète avant travaux »,
« angle de façade ») et du deuxième comparateur de matiere : tirés désormais
de `avant`, `apres`, `avant2`, `apres2`, `invitation`, `invitation2`. Légendes
de couverture et de peinture écrites par Cowork, à relire par Fabrice. T60
passée « bloqué » sur Q6.
TRACAGE : generateur/composer.mjs, generateur/archetypes/matiere.mjs, generateur/metiers/ravalement.json, generateur/metiers/couverture.json, generateur/metiers/peinture.json, scripts/verifier-site.mjs, scripts/essai-alt.mjs, scripts/essais.mjs, .github/workflows/essais.yml, app/specs/07-TACHES.md, docs/audit/REGISTRE.md (S-023 clos), CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T56 (avis réels seulement), par Cowork

Plan : 1. `avis.bloc({ abonne, avis })` : avis réels ou rien sur un site
d'abonné ; 2. `atelier/fabriquer.mjs` lit la table `avis` ; 3. contrôle R-AVIS
et `essai-avis.mjs`.

Résultat : 18 contrôles, 0 faute ; contre-essai 4 fautes ;
`essai-fabrication-base` (15) et `essai-boucle` (23) verts avec une table
`avis` vide dans leur faux Supabase. Au plus 6 avis, les plus récents.
TRACAGE : generateur/sections/avis.mjs, generateur/composer.mjs, generateur/archetypes/matiere.mjs, atelier/fabriquer.mjs, scripts/verifier-site.mjs, scripts/essai-avis.mjs, scripts/essai-fabrication-base.mjs, scripts/essai-boucle.mjs, scripts/essais.mjs, .github/workflows/essais.yml, app/specs/07-TACHES.md, docs/audit/REGISTRE.md (S-024 clos), CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T60 (photos reçues par mail ou WhatsApp), par Cowork

Plan : 1. `photos-artisan.mjs` : `--ranger` (préparation par
`atelier/photos.mjs`, manifeste), `--fabriquer` (modèle réservé, `--publication`) ;
2. garde du dépôt public (`gh api`, refus sans réponse sûre) ; 3. essai et
procédure pour Fabrice.

Résultat : 12 contrôles, 0 faute ; contre-essai rouge. Q6 répondue par Fabrice
(dépôt privé, photos dedans) ; F20 ajoutée ; CI : rendu et Safari la nuit sur
un dépôt privé (minutes comptées). Le HEIC n'est pas converti (brevets HEVC,
`atelier/heic.mjs`) : refus avec la consigne « renvoyer par WhatsApp ». Les
rôles des photos se décident en les regardant (Claude ou Fabrice).
TRACAGE : scripts/prospection/photos-artisan.mjs, scripts/essai-photos-artisan.mjs, docs/PROCEDURE-PHOTOS.md, .gitignore, scripts/essais.mjs, .github/workflows/essais.yml, app/specs/07-TACHES.md, docs/specs/S-MODELES.md, docs/00-INDEX.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T45 (refaire et publier par GitHub Actions), par Cowork

Plan : 1. `atelier/publier-pages.mjs` (un projet Pages par site, R2 étant
exclu) et `publier` injectable dans `atelier/boucle.mjs` ; 2.
`scripts/refaire-site.mjs`, `.github/workflows/refaire-site.yml`, lanceur des
secrets ; 3. déclencheur de la base (pg_net) et essais.

Résultat : `essai-refaire-site.mjs` 15 contrôles, 0 faute ; contre-essai rouge.
Migration du déclencheur appliquée : la première version faisait échouer les
écritures de `profils` (essai SQL rouge sur « new.etat »), corrigée aussitôt
par `20261104044905`. Le passage de l'essai SQL sur la correction n'a pas
abouti : l'outil Supabase a posé une question (sans doute la suppression d'un
tarif d'essai dans le bloc annulé) et personne n'a répondu ; à relancer, ce qui
compte avant tout appel réel. Pages limite à 100 projets : D-15. Minutes de
GitHub Actions comptées dans `02-TRD.md` §7. T45 bloquée sur F21 (secrets du
dépôt, jeton GitHub au coffre de Supabase).
TRACAGE : atelier/publier-pages.mjs, atelier/boucle.mjs, scripts/refaire-site.mjs, scripts/essai-refaire-site.mjs, scripts/secrets-github.mjs, lanceurs/SECRETS_GITHUB.bat, .github/workflows/refaire-site.yml, .github/workflows/essais.yml, scripts/essais.mjs, supabase/migrations/20261104044828_prevenir_github.sql, supabase/migrations/20261104044905_prevenir_github_correction.sql, supabase/essais/prevenir.sql, supabase/README.md, app/specs/02-TRD.md, app/specs/07-TACHES.md, docs/DETTE.md (D-15), memoire/actions-fabrice.md (F21), memoire/pieges.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

4 nov., 13 h 30 (T45, suite) : `supabase/essais/prevenir.sql` relancé sur la
version corrigée, aucune faute (sans jeton : aucun appel ; avec jeton : un
appel juste ; photo reçue : rien ; prête : un appel ; tarif supprimé : un
appel). Essai des droits d'un artisan connecté : profil, tarif et photo
acceptés, profil d'un autre refusé, fonction non appelable. Conseillers : rien
de nouveau.
TRACAGE : supabase/README.md, app/specs/07-TACHES.md, memoire/journal.md

## 4 nov. 2026 — T46 (vidéos sans position GPS), par Cowork

Plan : 1. `app/src/video.ts` : parcours des boîtes ISO BMFF, `©xyz`, `loci` et
clés QuickTime `location` changées en `free` de même taille ; 2. appel dans
`preparer()` de `photo.ts` ; 3. essai hors navigateur (`essai-video-gps.mjs`) et
contrôles dans `essai-app.mjs`.

Résultat : 17 contrôles, 0 faute ; contre-essai 4 fautes. Trouvé en route :
ffmpeg écrit la position d'une MP4 dans `loci` (3GPP), pas dans `©xyz` ; les
deux sont effacées. La partie navigateur tourne dans la CI (exiftool).
TRACAGE : app/src/video.ts, app/src/photo.ts, scripts/essai-video-gps.mjs, scripts/essai-app.mjs, scripts/essais.mjs, .github/workflows/essais.yml, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T52 (deuxième page sur les quatre archétypes), par Cowork

Plan : 1. `generateur/sections/page-travail.mjs` : barre de retour, bandeau de
titre composé par archétype, puis postes, chantier, contact ; 2. branchement
dans `composer.mjs`, plus de `page2 = false` hors matiere dans `tirage.mjs` ;
3. `essai-navigateurs.mjs` juge `le-travail.html` sur les quatre archétypes.

Résultat : 25 contrôles, 0 faute (Chromium). Trouvé en route : la phrase de la
deuxième page de matiere disait « ravalement » quel que soit le métier
(corrigé) ; la pastille voilée tombait à 4,34:1 sur une photo claire (fond
opaque, piège noté). S-025 : avec l'ancienne règle, le titre de matiere ne
prenait que 9 % de l'écran mais passait M2 par la largeur ; il prend
maintenant 19 %. Les vraies photos (fabriquer-demo) attendent F15.
TRACAGE : generateur/sections/page-travail.mjs, generateur/composer.mjs, generateur/tirage.mjs, generateur/archetypes/matiere.mjs, generateur/charte.mjs, scripts/essai-navigateurs.mjs, app/specs/07-TACHES.md, docs/audit/REGISTRE.md, CHANGELOG.md, memoire/maintenant.md, memoire/pieges.md, memoire/journal.md, docs/audit/CARTE.md

T52, complément : la ligne S11 de `app/specs/01-PRD.md` passe à « fait ».
TRACAGE : app/specs/01-PRD.md, memoire/journal.md

## 4 nov. 2026 — T53 (contrôle mécanique de la traçabilité), par Cowork

Plan : 1. `scripts/verifier-tracabilite.mjs` : pour chaque tâche « fait », une
ligne datée de CHANGELOG et une section de journal du même jour à son nom avec
`TRACAGE` ; 2. `carte-depot --verifier` et ce contrôle dans `essais.mjs` ;
3. contre-essais dans la suite complète et la CI.

Résultat : sur le dépôt, 32 tâches « fait », toutes tracées ; les 18 finies
avant la règle (3 nov.) sont listées dans le script, liste fermée.
Contre-essai : 8 contrôles, 0 faute (T99 sans trace, avec une seule des deux,
section sans TRACAGE, journal d'un autre jour : rouge ; avec les deux du même
jour : vert).
TRACAGE : scripts/verifier-tracabilite.mjs, scripts/essais.mjs, .github/workflows/essais.yml, docs/REGLE-TRACABILITE.md, CLAUDE.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T10 (formulaire des sites, côté base), par Cowork

Plan : 1. Q3 appliquée et adaptée : plus de Worker devant les sites d'abonnés
(Pages depuis T45), donc une fonction `deposer_demande` appelée par l'API de
Supabase avec la clé publique ; 2. migration ; 3. essai SQL.

Résultat : migration écrite (`supabase/brouillons/deposer_demande.sql`), **pas
appliquée** : `apply_migration` a demandé une confirmation que l'app a annulée
seule en 0,4 s, trois fois (Fabrice sur iPhone, hors de chez lui). Rien n'a
été exécuté sur la base. T10 bloquée sur F22.
TRACAGE : supabase/brouillons/deposer_demande.sql, app/specs/07-TACHES.md, memoire/actions-fabrice.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T12 (suppression des comptes à l'échéance), par Cowork

Plan : 1. `atelier/supprimer-comptes.mjs` : demandes échues non annulées,
Stripe d'abord (refus sans Stripe), Pages, stockage, entreprise (cascade),
compte en dernier ; 2. l'adaptateur Supabase apprend `effacer`, `auth.supprimer`
et `stockage.lister` ; les deux faux suivent ; 3. `essai-suppressions.mjs`.

Résultat : 19 contrôles, 0 faute ; contre-essai : 3 cassures sur 3. Trouvé en
route : le faux Supabase comparait les dates en nombres (NaN, tout filtre
`lte` sur une date tombait) et prenait `/object/list/` pour un envoi de fichier
(corrigés ; essai-service, boucle, refaire-site, fabrication-base, publication
toujours verts). Pas encore lancé chaque nuit : D-16.
TRACAGE : atelier/supprimer-comptes.mjs, atelier/supabase.mjs, atelier/LISEZMOI.md, scripts/faux-supabase.mjs, scripts/faux-cloudflare.mjs, scripts/prospection/cloudflare-pages.mjs, scripts/essai-suppressions.mjs, scripts/essais.mjs, .github/workflows/essais.yml, app/specs/07-TACHES.md, app/specs/01-PRD.md, docs/DETTE.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T31 (codes APE alignés), par Cowork

Plan : 1. source unique : `prospection/metiers.json`, seule lue par
l'extraction ; 2. recopier dans `generateur/metiers/*.json` et
`plan-images.json` ; 3. contrôle dans `verifier-depot`.

Résultat : ravalement 43.34Z, 43.99C, 43.99D, 43.29A ; couverture 43.91B,
43.91A, 43.99A ; peinture 43.34Z, 43.33Z. `verifier-depot` à 0 ; copie cassée
(un code de trop dans la fiche, deux de moins dans le plan) : 2 écarts, sortie 1.
Libellés APE manquants ajoutés dans `generateur/sirene.mjs`. Les 13 autres
métiers n'ont pas encore de ligne de prospection : rien à comparer.
TRACAGE : generateur/metiers/ravalement.json, generateur/metiers/couverture.json, generateur/metiers/peinture.json, generateur/banque/plan-images.json, generateur/sirene.mjs, scripts/verifier-depot.mjs, docs/specs/METIERS.md, docs/DETTE.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

T13 passée « bloqué » (Q7, recommandation appliquée) : R2 exclu (C23), Pages
depuis T45 ; l'adaptateur KV revient avec D-15.
Piège noté : la carte compte les lignes ; l'écrire pendant que la suite a
réécrit `memoire/essais/derniers.txt` la rend périmée dès que ce fichier est
remis (CI de T12 rouge, réparée par le commit de T31).
TRACAGE : memoire/questions.md, app/specs/07-TACHES.md, memoire/maintenant.md, memoire/pieges.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T16 (Stripe, contre un faux), par Cowork

Plan : 1. logique sans réseau dans `supabase/functions/_shared/stripe.ts`
(signature, état relu chez Stripe, rejeu, paiement, portail, résiliation) ;
2. fonctions Edge `stripe-webhook` et `stripe-session` ; 3. `essai-stripe.mjs`.

Résultat : 22 contrôles, 0 faute ; contre-essai : 3 cassures sur 3 (signature
non vérifiée, rejeu qui réécrit, « incomplete » qui donne actif). Choix : l'état
n'est jamais lu dans l'événement mais relu chez Stripe, ce qui rend l'ordre
d'arrivée sans effet ; l'événement est noté après l'écriture, pour qu'une
panne laisse Stripe renvoyer. La suppression des comptes (T12) résilie
désormais l'abonnement si la clé Stripe est dans le `.env`. Rien n'est
déployé : décision du 29 oct. (« Stripe on va attendre qu'elle fonctionne »),
F7 complétée.
TRACAGE : supabase/functions/_shared/stripe.ts, supabase/functions/stripe-webhook/index.ts, supabase/functions/stripe-session/index.ts, scripts/essai-stripe.mjs, atelier/supprimer-comptes.mjs, scripts/essais.mjs, .github/workflows/essais.yml, memoire/actions-fabrice.md, app/specs/02-TRD.md, app/specs/05-SCHEMA-BACKEND.md, app/specs/01-PRD.md, supabase/README.md, docs/DETTE.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T17 (écran Abonnement relié), par Cowork

Plan : 1. `ouvrirPaiement` dans l'interface `Donnees` (Supabase : fonction
Edge `stripe-session` ; démonstration : retour immédiat) ; 2. boutons sur
l'écran, web seulement ; 3. contrôles dans `essai-app.mjs`.

Résultat : build 0. Vu dans un navigateur (app construite, démonstration) :
le portail revenait sur « Page introuvable », parce que le routeur prenait
`?paiement=…` du `#` pour une route ; corrigé dans `App.tsx`, puis message
affiché. Android : 0 bouton ; copie cassée (garde retirée) : 1 bouton. Les
contrôles de `essai-app` tournent dans la CI.
TRACAGE : app/src/types.ts, app/src/donnees/supabase.ts, app/src/donnees/demo.ts, app/src/ecrans/Abonnement.tsx, app/src/App.tsx, scripts/essai-app.mjs, app/specs/03-APPFLOW.md, app/specs/01-PRD.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T32, maçonnerie (1 sur 13), par Cowork

Plan : 1. ordre de Q non posée mais réversible : maçonnerie d'abord (proposition
de `docs/specs/METIERS.md`) ; 2. `generateur/metiers/maconnerie.json`, même
structure que peinture, textes tirés du plan d'images ; 3. prix nationaux
relevés le 4 nov. (travaux.com, Habitatpresto, La Maison Saint-Gobain, Obat).

Résultat : `capacite-unicite --metier maconnerie --photos plan` : d'abord 25
sites sans défaut seulement (les phrases de précision du comparateur, 6 × 6
combinaisons), puis 100 après les avoir portées à 9 × 9 comme les autres
métiers. Deux sites fabriqués (photos de synthèse) : `verifier-site` 0
bloquant, `verifier-mobile` 0, aucun mot d'un autre métier. Restent les
prompts d'images de la maçonnerie et 12 métiers.
TRACAGE : generateur/metiers/maconnerie.json, docs/specs/METIERS.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

F22 réécrite : passage par le SQL Editor de Supabase (le mode automatique refuse `apply_migration`, 4 nov. à 17 h 40).
TRACAGE : memoire/actions-fabrice.md, memoire/journal.md

## 4 nov. 2026 — T10 (formulaire des sites, côté base), suite et fin, par Cowork

Plan : 1. appliquer la migration (`apply_migration`, confirmation de Fabrice) ;
2. `supabase/essais/demandes.sql` en rôle `anon` ; 3. rejouer les droits.

Résultat : migration `20261104174705_deposer_demande` appliquée à 18 h 47
(trois essais avant : annulation automatique de l'app, refus du mode auto,
fenêtre sans réponse). Essai : 17 résultats justes, puis limite de 50 par
site et contre-essai (copie temporaire sans champ piège : le robot est écrit)
justes. `droits.sql` 11 et `droits-app.sql` 23 sans faute. Conseillers :
`deposer_demande` appelable par `anon`, voulu. Q3 notée appliquée.
TRACAGE : supabase/migrations/20261104174705_deposer_demande.sql, supabase/essais/demandes.sql, supabase/README.md, app/specs/05-SCHEMA-BACKEND.md, app/specs/02-TRD.md, app/specs/01-PRD.md, app/specs/07-TACHES.md, memoire/actions-fabrice.md, memoire/questions.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T11 (formulaire dans les pages), par Cowork

Plan : 1. `generateur/sections/formulaire.mjs` (champs, champ piège, script
qui appelle `rpc/deposer_demande` avec la clé publique) dans le contact des
quatre archétypes ; 2. mentions légales ML11 selon la présence du
formulaire ; 3. R-FORM dans `verifier-site`, `essai-formulaire.mjs`.

Résultat : 31 contrôles, 0 faute (Chromium, faux Supabase) ; contre-essai :
3 cassures attrapées par R-FORM. Le générateur refuse une clé qui n'est pas
`sb_publishable_`. `fabriquer.mjs` passe l'adresse et la clé publique quand
`SUPABASE_CLE_PUBLIQUE` est dans l'environnement (ajoutée à `.env.example`,
aux secrets GitHub de F21 et à `refaire-site.yml`). Texte des mentions écrit
par Claude, non relu par un juriste (S-019).
TRACAGE : generateur/sections/formulaire.mjs, generateur/composer.mjs, generateur/sections/mentions.mjs, scripts/verifier-site.mjs, scripts/essai-formulaire.mjs, scripts/essai-fabrication-base.mjs, atelier/fabriquer.mjs, scripts/secrets-github.mjs, .github/workflows/refaire-site.yml, .github/workflows/essais.yml, scripts/essais.mjs, .env.example, app/specs/02-TRD.md, app/specs/01-PRD.md, app/specs/07-TACHES.md, docs/specs/S-MENTIONS.md, memoire/actions-fabrice.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T32, menuiserie (2 sur 13), par Cowork

Plan : 1. `generateur/metiers/menuiserie.json` sur la structure des autres,
textes tirés du plan d'images (fenêtres, portes, volets, escaliers,
placards) ; 2. prix relevés le 4 nov. (La Maison Saint-Gobain, Travaux.com,
Habitatpresto) ; 3. capacité et fabrication.

Résultat : 100 sites sans défaut du premier coup (phrases de précision déjà
à 9 × 9). Deux sites fabriqués, formulaire compris : `verifier-site` 0
bloquant, `verifier-mobile` 0. Relu dans les pages : « façades décollées »
pouvait se lire comme une façade de maison, devenu « façades de placard
décollées ». L'estimateur compte des fenêtres (unité « u »).
TRACAGE : generateur/metiers/menuiserie.json, docs/specs/METIERS.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T32, carrelage (3 sur 13), par Cowork

Plan : 1. `generateur/metiers/carrelage.json` (sols, faïence, douches à
l'italienne, terrasses), textes tirés du plan d'images ; 2. prix relevés le
4 nov. (Habitatpresto, ABC Travaux) ; 3. capacité et fabrication.

Résultat : avec 87 titres, 13 paires de voisins avaient le même titre à 100
sites (U2) ; porté à 112 titres : 100 sites sans défaut. Deux sites
fabriqués : `verifier-site` 0 bloquant, `verifier-mobile` 0, aucun mot d'un
autre métier. Leçon : un métier tient à 100 sites avec au moins ~105 titres.
TRACAGE : generateur/metiers/carrelage.json, docs/specs/METIERS.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 4 nov. 2026 — T32, plomberie (4 sur 13), par Cowork

Plan : 1. `generateur/metiers/plomberie.json` (alimentations, évacuations,
sanitaires, eau chaude, chauffage), textes tirés du plan d'images ; 2. prix
relevés le 4 nov. (Travaux.com, La Prime Énergie, La Maison Saint-Gobain) ;
3. capacité et fabrication.

Résultat : 104 titres, 100 sites sans défaut du premier coup. Deux sites
fabriqués : `verifier-site` 0 bloquant, `verifier-mobile` 0, aucun mot d'un
autre métier. Aucune mention de qualification gaz : rien ne dit qu'un artisan
donné l'a. L'estimateur compte des équipements (unité « u »).
TRACAGE : generateur/metiers/plomberie.json, docs/specs/METIERS.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

## 5 nov. 2026 — T11, complément (clé publique dans le dépôt), par Cowork

Plan : la clé publique (`sb_publishable_…`, lue par l'outil Supabase
`get_publishable_keys`) n'est pas un secret : l'écrire dans `refaire-site.yml`
et `.env.example` plutôt que la faire poser à Fabrice. `secrets-github.mjs`
ne la demande plus (il aurait refusé un `.env` sans elle).

Résultat : `verifier-secrets` sans constat, `essai-refaire-site` 15 contrôles
sans faute. F21 réduite d'une étape.
TRACAGE : .github/workflows/refaire-site.yml, scripts/secrets-github.mjs, .env.example, app/specs/02-TRD.md, app/specs/01-PRD.md, memoire/actions-fabrice.md, memoire/maintenant.md, CHANGELOG.md, memoire/journal.md, docs/audit/CARTE.md

## 5 nov. 2026 — T32, électricité (5 sur 13), par Cowork

Plan : 1. `generateur/metiers/electricite.json` (diagnostic, tableau,
circuits, appareillage, mesures), textes tirés du plan d'images ; 2. prix
relevés le 5 nov. (Ootravaux, La Maison Saint-Gobain, Obat, Habitatpresto) ;
3. capacité et fabrication.

Résultat : 103 titres, 100 sites sans défaut. Deux sites fabriqués :
`verifier-site` 0 bloquant, `verifier-mobile` 0. Deux phrases corrigées avant
publication pour coller à la règle : le diagnostic à la vente vaut pour une
installation de plus de quinze ans ; le détecteur de fumée est obligatoire par
logement, le couloir des chambres n'est qu'une recommandation.
TRACAGE : generateur/metiers/electricite.json, docs/specs/METIERS.md, app/specs/07-TACHES.md, CHANGELOG.md, memoire/maintenant.md, memoire/journal.md, docs/audit/CARTE.md

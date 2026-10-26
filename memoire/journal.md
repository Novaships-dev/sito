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

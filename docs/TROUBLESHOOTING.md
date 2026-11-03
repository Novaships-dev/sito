# Dépannage : la panne, ce qu'on voit, quoi faire

Écrit par Claude (Cowork) le 3 novembre 2026. Rassemble en un seul endroit les
pannes déjà vécues et leur remède, tirés de `memoire/pieges.md`,
`memoire/actions-fabrice.md` et de la coordination Cowork et Claude Code.
Pour une panne nouvelle, Claude Code suit `.claude/skills/depanner/SKILL.md`
(3 approches ou 45 minutes, puis tâche bloquée) et ajoute l'entrée ici et dans
`memoire/pieges.md`.

## Pour Fabrice, sur le PC

| Ce qu'on voit | Cause | Quoi faire |
|---|---|---|
| La fenêtre noire de Claude Code ne bouge plus | un clic dedans l'a mise en mode « Sélection » : tout est en pause | appuyer sur Échap ; pour de bon : propriétés de la fenêtre, décocher « Mode d'édition rapide » |
| Après un redémarrage, Claude Code ne travaille plus | le lanceur ne repart pas seul | double-clic sur `lanceurs\CLAUDE_AUTONOME.bat` ; pour de bon : mettre un raccourci de ce fichier dans `shell:startup` |
| « Espace insuffisant sur le disque » ; tâches bloquées par F19 | moins de 1 Go libre : plus aucune fabrication (décision du 29 oct.) | action F19 de `memoire/actions-fabrice.md`, dans l'ordre du gain (nettoyage de Windows Update d'abord, environ 4,9 Go) |
| « Database is possibly not accessible » | la base Supabase gratuite s'est mise en pause | double-clic sur `lanceurs\REVEILLER_SUPABASE.bat`, puis « Restore project », attendre « Active healthy » (F17) |
| Rien n'arrive sur GitHub | le crochet de commit a refusé un fichier | lire `pousser.log` après chaque `lanceurs\POUSSER.bat` |
| Claude Code ignore les autorisations du projet (« not been trusted ») | le dossier n'a jamais été approuvé | `lanceurs\PREMIER_LANCEMENT.bat` une fois, accepter la confiance (F2) |
| Claude Code s'arrête la nuit | coupure d'Internet | rien : depuis le 29 oct., `scripts/autonome.mjs` attend sans limite (5 min, puis 15 min) |
| « session limit, resets … » | limite de l'abonnement Claude | rien : le lanceur attend l'heure de reprise annoncée (6 h au plus) |

## Pour Claude Code, dans le dépôt

| Ce qu'on voit | Cause | Quoi faire |
|---|---|---|
| `node scripts/essais.mjs` sort 4 | un outil manque (exiftool, ffmpeg, Python avec pillow-heif) | installer sans droits d'administrateur (`pip install --user`, `winget --scope user`), le noter au journal ; sinon action de Fabrice |
| `essai-app.mjs` lancé seul plante sur `spawnSync exiftool ENOENT` | exiftool manque | installer exiftool ; dans `node scripts/essais.mjs`, l'étape dit « NON LANCÉ » depuis T47 |
| « Executable doesn't exist » de Playwright | Chromium de Playwright absent | `npx playwright install chromium`, ou `SITO_CHROMIUM=<chemin de Chrome>` |
| Vert sur le PC, rouge dans la CI | l'essai dépend de la machine (chemin, fichier non versionné, connexion qui expire) | lire `node scripts/ci-github.mjs --journal` ; pièges du 29 oct. dans `memoire/pieges.md` |
| Un contre-essai sort 2 : « la cassure n'a rien changé » | la cassure vise un code qui a bougé | réviser la cassure, pas l'essai (`docs/REGLE-ESSAIS.md` E2) |
| Le crochet `pre-outil.mjs` refuse | action interdite (secret, garde-fou verrouillé, nouveau .md à la racine, migration existante, commande dangereuse) | lire la raison, prendre une autre voie ; si aucune n'existe, écrire la question dans `memoire/questions.md` et bloquer la tâche |
| Le mode auto refuse une action | elle sort de ce qui est permis sans surveillance | ce n'est pas une panne : autre voie, ou tâche bloquée |
| `Date.parse` rend une date absurde au lieu de NaN | V8 lit « le 3 mars » comme mars 2001 | valider le format avant (`/^\d{4}-\d{2}-\d{2}$/`) |
| `process.exit(0)` après un `fetch` : code 127 sous Windows | Node meurt sur une assertion de libuv | fixer `process.exitCode` et laisser les connexions se fermer |
| Un module importé par chemin absolu Windows est refusé | `ERR_UNSUPPORTED_ESM_URL_SCHEME` | `pathToFileURL(chemin).href` ; dans le dépôt, chemins relatifs |
| Le vérificateur mobile sur un lot dépasse 10 minutes | l'outil coupe à 10 minutes | lancer les lots en arrière-plan dès le départ, un journal par site |

## Pour Cowork, quand il dépose des fichiers

| Ce qu'on voit | Cause | Quoi faire |
|---|---|---|
| Le fichier arrive sur le PC dans une ancienne version | une livraison réutilise l'ancien contenu quand on livre deux fois depuis le même chemin | chaque livraison part d'un fichier au nom unique ; relire le fichier sur le PC après livraison |
| Un dépôt de Cowork part dans le commit d'une tâche | les deux sessions écrivent en même temps | annoncer chaque dépôt dans `memoire/de-cowork.md` ; Claude Code le commite à part (`Cowork : …`) |
| Impossible d'écrire dans `.claude/`, `.github/`, `.mcp.json` | chemins protégés pour les outils de Claude | livrer par `_installation/` puis `lanceurs\INSTALLER_OUTILLAGE.bat` |

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

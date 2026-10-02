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

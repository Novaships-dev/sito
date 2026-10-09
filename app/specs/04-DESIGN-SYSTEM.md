# 04 — Design System et Design Brief

Version du 9 octobre 2026. Ce document couvre **l'app de l'artisan**. Les
**sites** des artisans ont leur propre système, volontairement différent d'un
site à l'autre (section 9).

Source unique du code : `app/src/style.css`. Une valeur qui n'est pas ici ne
s'invente pas : elle s'ajoute ici d'abord, puis dans la feuille.

---

## 1. Brief

| Question | Réponse |
|---|---|
| Pour qui | un artisan du bâtiment, sur iPhone, souvent sur un chantier, en plein soleil, les mains prises, en 4G |
| Ce qu'il doit ressentir | « c'est simple, c'est sérieux, ça marche » |
| Ce qui compte d'abord | les **appels et demandes** (de l'argent), puis les **photos** (son site), puis le reste |
| Principe | « Tout doit être lisible, clair et intuitif. » (Fabrice, 15 sept.) |
| Ce qu'on évite | le jargon (pas de « PWA », « CNAME » sans explication, « upload »), les écrans chargés, les décorations qui ne servent pas, la couleur seule pour dire un état |
| Ton | vouvoiement, phrases courtes, verbes d'action ; on dit ce qui se passe et ce qui va se passer |
| Plateformes | téléphone d'abord (le doigt), ordinateur ensuite (souris et clavier) ; les deux sont vérifiés à chaque fois |
| Plancher | WCAG 2.2 AA (`rules/web/accessibilite.md`) |

## 2. Couleurs

Toutes en variables CSS sur `:root`. Thème clair seulement (`color-scheme:
light`) ; le thème sombre n'est pas prévu.

| Jeton | Valeur | Usage |
|---|---|---|
| `--fond` | `#f6f4ef` | fond de page (pierre claire) |
| `--surface` | `#ffffff` | cartes, champs |
| `--texte` | `#1c1f1d` | texte courant |
| `--discret` | `#545a56` | texte secondaire, aide, dates |
| `--trait` | `#d9d5cc` | bordures de cartes, séparateurs |
| `--vert` | `#1f2a24` | couleur de marque : boutons, navigation, liens |
| `--vert-clair` | `#2e3f35` | survol des boutons et de la navigation |
| `--ocre` | `#e8b04a` | accent : onglet actif, compteur, liseré « non lue », progression |
| `--rouge` | `#9b1c10` | erreurs, action dangereuse |
| focus | `#1a5fb4` | anneau de focus (3 px) |
| bordure de champ | `#8a8f8b` | contour des champs |

### 2.1 Contrastes mesurés (formule WCAG)

| Paire | Rapport | Exigé |
|---|---|---|
| texte / fond | 15,13 | 4,5 |
| texte / surface | 16,63 | 4,5 |
| discret / fond | 6,42 | 4,5 |
| discret / surface | 7,06 | 4,5 |
| blanc / vert (bouton) | 14,84 | 4,5 |
| blanc / vert-clair (survol) | 11,18 | 4,5 |
| vert / surface (bouton secondaire) | 14,84 | 4,5 |
| texte de navigation `#e9ede9` / vert | 12,55 | 4,5 |
| ocre (onglet actif) / vert | 7,59 | 4,5 |
| rouge / fond | 7,44 | 4,5 |
| blanc / rouge (bouton danger) | 8,18 | 4,5 |
| succès `#1d5a2e` / fond | 7,48 | 4,5 |
| étoiles `#8a5a00` / surface | 5,93 | 4,5 |
| focus / fond | 5,72 | 3 |
| bordure de champ / surface | 3,29 | 3 |

### 2.2 Pastilles d'état

La couleur ne porte jamais le sens seule : **le texte dit l'état**.

| Ton | Fond | Texte | Rapport | Exemples |
|---|---|---|---|---|
| `ok` | `#dff0e3` | `#1d5a2e` | 6,93 | En ligne, Prête, Active, Actif, Sur le site |
| `attente` | `#fbefd5` | `#6b4100` | 7,73 | Reçue, en préparation ; En attente d'envoi ; Période d'essai |
| `probleme` | `#fbe0dc` | `#8a1a0f` | 7,51 | Illisible ; Problème ; Paiement en échec |
| `neutre` | `#e9e7e1` | `#3f4440` | 8,04 | Pas encore en ligne ; Résilié ; Pas encore reliée |

Autres surfaces : bandeau de démonstration `#5c3900` sur `#fbefd5` (9,02) ;
compteur `#2b1d00` sur ocre (8,40) ; alerte `#6e140b` sur `#fbe0dc` (9,50).

## 3. Typographie

| Élément | Valeur |
|---|---|
| Police | celle du système : `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (aucun téléchargement, rendu natif) |
| Taille de base | 17 px (`:root`), interligne 1,45 |
| `h1` | 1,6 rem, interligne 1,2 ; **un seul par écran** |
| `h2` | 1,15 rem |
| Aide sous un libellé | 0,92 rem, couleur `--discret` |
| Pastilles, compteurs | 0,85 rem, gras 600 |
| Chiffres de l'accueil | 1,8 rem, gras 700, chiffres tabulaires |
| Adresses web | police à chasse fixe, coupure autorisée |
| Zoom | jamais bloqué (`-webkit-text-size-adjust: 100%`, pas de `maximum-scale`) |

Niveaux de titre jamais sautés (contrôlé par `essai-app`).

## 4. Espacements, rayons, tailles

| Jeton | Valeur |
|---|---|
| Marge latérale téléphone | 16 px, ou la zone sûre si elle est plus grande |
| Marges ordinateur | 40 px × 32 px ; contenu limité à 760 px |
| Espace entre cartes | 16 px ; entre éléments de liste 12 px |
| Rembourrage de carte | 16 px |
| `--rayon` (cartes) | 14 px |
| Rayon boutons / champs | 12 px / 10 px |
| `--nav` (hauteur de la barre du bas) | 64 px |
| Cible tactile minimale | **44 × 44 px** (boutons et champs : 48 px de haut) |
| Seuil ordinateur | 900 px : la navigation passe à gauche (240 px) |
| Zones sûres | `env(safe-area-inset-top/right/bottom/left)` sur la page, la barre du bas et le bandeau |
| Hauteur d'écran | `min-height: 100dvh`, jamais `100vh` |

## 5. Composants

| Composant | Classe / fichier | Règles |
|---|---|---|
| Bouton principal | `.bouton` | fond vert, texte blanc, 48 px, gras ; un seul par bloc |
| Bouton secondaire | `.bouton.secondaire` | fond blanc, bordure et texte verts |
| Bouton danger | `.bouton.danger` | fond rouge ; seulement pour supprimer, et derrière une confirmation écrite |
| Bouton désactivé | `:disabled` | opacité 0,55, curseur interdit ; le libellé dit pourquoi on attend (« Envoi… ») |
| Lien-bouton | `.lien` | texte souligné, 44 px de haut |
| Carte | `.carte` | fond blanc, bordure `--trait`, rayon 14 px |
| Carte-lien | `.lien-carte` | toute la carte est cliquable ; bordure verte au survol |
| Demande non lue | `.non-lue` | liseré ocre à gauche **et** le mot « nouvelle » |
| Champ | `input`, `textarea` | libellé visible au-dessus (`label for`), aide entre le libellé et le champ (`aria-describedby`), 48 px, bordure 1,5 px ; invalide : bordure rouge + `aria-invalid` + message sous le champ |
| Case à cocher | `.case-a-cocher` | case 26 px, tout le libellé cliquable sur 44 px |
| Choix de fichier | `.choix` | le champ fichier est invisible mais focalisable ; le libellé est un bouton secondaire pleine largeur ; l'anneau de focus apparaît sur le bouton |
| Pastille | `Pastille` (`ui.tsx`) | voir 2.2 |
| Message | `Message` (`ui.tsx`) | erreur `role="alert"`, réussite `role="status"` |
| Chargement | `Chargement` (`ui.tsx`) | « Chargement… » ou encadré d'erreur + « Réessayer » |
| Écran | `Ecran` (`ui.tsx`) | `<main id="contenu" tabindex="-1">`, lien retour éventuel, `h1`, titre d'onglet |
| Navigation | `.navigation` | téléphone : barre fixe en bas, 5 onglets icône + mot ; ordinateur : colonne à gauche, 10 entrées ; onglet courant `aria-current="page"` en ocre et gras |
| Bandeau d'envoi | `.envois` | collé en haut, vert ; « Envoi de X (+n) » + barre de progression ; erreur + « Réessayer » |
| Bandeau de démonstration | `.bandeau-demo` | au-dessus de tout, en mode démonstration seulement |
| Chiffres | `.chiffres` | trois cases : visites, appels, demandes |
| Courbe | `.courbe` | barres verticales vertes, sans axe chiffré ; les chiffres sont dans un tableau dépliable |
| Paire avant / après | `.paire` | deux colonnes égales, images 4:3 recadrées |
| Galerie | `.galerie` | grille de vignettes de 140 px minimum |
| Étoiles | `.etoiles` | ★☆ en texte, avec `aria-label` « n étoiles sur 5 » |

## 6. Icônes

Tracés SVG en ligne, 24 × 24, trait 1,8 px, sans remplissage, couleur du
texte (`currentColor`). Cinq icônes : accueil (maison), chantiers (appareil
photo), mon site (fenêtre), avis (étoile), plus (trois points). Toujours
accompagnées d'un mot ; `aria-hidden="true"`.

Icône de l'app : carré vert `#1f2a24` arrondi, maison ocre `#e8b04a`
(`public/icone.svg`) ; déclinaisons 192, 512, masquable 512, Apple 180.

## 7. Mouvement

Aucune animation dans l'app à ce jour. Toute animation future respecte
`prefers-reduced-motion` (déjà neutralisé dans la feuille).

## 8. Écrire dans l'app

| Règle | Exemple |
|---|---|
| Dire ce qui va se passer | « Enregistré. Le site sera mis à jour. » |
| Un refus nomme le fichier et la raison | « devis.pdf : Un PDF n'est pas une photo. Envoyez la photo elle-même. » |
| Une erreur dit quoi faire | « Code incorrect ou expiré. Demandez-en un nouveau. » |
| Ce qui n'existe pas encore est dit honnêtement | « La recherche et l'achat depuis l'app arrivent bientôt. » |
| Jamais de faux chiffre ni de faux état | les écrans vides le disent : « Aucune demande reçue pour l'instant. » |
| Apostrophe typographique `’` dans l'interface | « Changer d’adresse ou renvoyer un code » |
| Montants | `Intl` fr-FR : « 85,50 € » |
| Dates | « 9 octobre 2026 », heure de Paris |

## 9. Les sites des artisans (rappel, autre système)

Les sites ne suivent **pas** ce design system : chacun est unique (décisions
du 24 septembre et du 2 octobre). Leurs règles sont dans le dépôt :

| Sujet | Où |
|---|---|
| Accessibilité, performance, photos, mouvement, interdits de design | `rules/web/*.md` |
| Quatre archétypes (`matiere`, `panneau`, `planche`, `elevation`) | `generateur/archetypes/` |
| Charte tirée et figée : famille de couleurs, sol, polices, géométrie, mot géant | `generateur/charte.mjs`, `palette.mjs`, `style.mjs`, `generateur/polices/` |
| Contraste rendu mesuré (4,6:1 visé) | `scripts/contraste-rendu.mjs`, vérificateurs |
| Unicité entre voisins | `scripts/verifier-unicite.mjs`, `capacite-unicite.mjs` |

Le seul point commun : l'app ne change jamais l'apparence d'un site ; elle lui
donne ses photos, son téléphone et ses tarifs.

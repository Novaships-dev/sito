# État au 2 octobre 2026

À lire en premier, à chaque séance. Réécrit à la fin de chaque séance.

---

## Ce qui marche, mesuré

**Le générateur de sites.** À partir d'un SIREN, d'un métier et d'un dossier
de photos, il fabrique un site complet en environ une minute et demie.

- **Quatre archétypes**, tous au même niveau depuis le 23 septembre :
  `matiere`, `panneau`, `planche`, `elevation`. Chacun a l'écran d'ambiance,
  le nuancier, les prix, les avis, le comparateur avant/après.
- **Unicité tirée du SIREN** et des voisins (même métier, même commune) :
  famille de couleurs parmi sept, sol clair ou nuit, polices parmi quatre
  appariements, géométrie, mot géant, main de photos, présence et ordre des
  sections, teintes du nuancier, forme du comparateur, phrases. Voir
  `generateur/charte.mjs` et `generateur/main-photos.mjs`.
- **Cinq vérificateurs**, tous à zéro sur les trois sites de démonstration :

| Script | Ce qu'il vérifie | Règles |
|---|---|---|
| `scripts/verifier-depot.mjs` | le dépôt est complet, rien ne manque | — |
| `scripts/verifier-site.mjs` | le plancher de la page, sans navigateur | 22 (A, C, G, P, V) |
| `scripts/verifier-ordinateur.mjs` | souris et clavier réels | O1 à O12 |
| `scripts/verifier-mobile.mjs` | doigt réel, trois téléphones | M0 à M11 |
| `scripts/verifier-unicite.mjs` | la distance entre deux sites voisins | U1 à U4 |

**Les trois sites de démonstration** (ravalement, Marseille) :
Sud Ravalement Façades `480423623`, Evora Ravalement `881767842`, Provence
Ravalement Peinture `849891528`. Les données Sirene sont dans
`donnees/entreprises-demo/`.

**Les images du ravalement** : les 32 générées par Fabrice le 15 septembre,
renommées et classées. La correspondance fichier ChatGPT → rôle est dans
`banque/ravalement/provenance.md`.

## Ce qui manque, par ordre d'importance

1. **Aucun moyen d'appeler l'artisan.** Sur `matiere`, le bouton pointe vers
   `tel:` vide. Sur les trois autres archétypes, **il n'y a même pas de barre
   d'appel**, ce qui viole `rules/web/client.md` (« le numéro est atteignable
   au pouce en permanence »). Aucun vérificateur ne l'attrape. Trouvé le
   2 octobre en relisant les règles. Il faut un champ téléphone dans les
   données de l'entreprise, la barre sur les quatre archétypes, et un contrôle.
2. **Un seul métier sur seize.** `generateur/metiers/` ne contient que
   `ravalement.json`. Il faut les quinze autres : textes, prix sourcés,
   teintes, réglages de l'estimateur.
3. **Les images des quinze autres métiers** : 480 à générer par Fabrice. La
   liste exacte est dans `banque/liste-images.md` ; les prompts ChatGPT
   n'existent encore que pour le ravalement (`banque/prompts/ravalement.md`).
4. **Les quinze images de la couche « banque » ne sont toujours pas
   utilisées** par le générateur : matière 02 à 08, ambiance 01 à 05, signes
   01 à 03. Le générateur se sert des 17 autres (hero, paires, chantiers,
   gestes, détail). Fabrice a dit le 23 septembre que les images devaient
   servir.
5. **La deuxième page** (`le-travail.html`) n'existe que sur l'archétype
   `matiere`.
6. **Référencement absent** : pas de données structurées `LocalBusiness`, pas
   d'aperçu de partage (Open Graph), pas de favicon, pas de `sitemap.xml` ni
   de `robots.txt`.
7. **Aucun site en ligne.** Pas d'hébergement, pas de domaine.
8. **Safari jamais testé.** Les vérificateurs tournent sous Chromium.
9. **L'app n'existe pas.** Voir `app/README.md`.

## Questions ouvertes pour Fabrice

1. **La mention « Exemple » sur les photos de démonstration.** Le 15 septembre
   il a dit qu'il n'était « pas obligé d'expliquer d'où vient l'image ». Les
   règles actuelles (`rules/web/photos.md`, `rules/common/ne-pas-fabriquer.md`)
   imposent une mention visible et interdisent de publier ces photos. À
   trancher.
2. **Supabase** pour la base et le stockage des images : proposé par Claude,
   pas encore confirmé séparément.
3. **L'unicité par commune ou par département ?** Le générateur compare les
   voisins de la même commune. Le cahier des charges parlait du département.
4. **Les prix** restent identiques d'un site à l'autre parce que ce sont des
   faits sourcés. Lui confirmer que c'est acceptable.

## Prochaine action

1. Mettre ce dossier sur GitHub : dépôt vide et privé `Novaships-dev/sito`,
   puis `CREER_SITO.bat` posé sur le Bureau le 2 octobre (il n'est pas dans le
   dépôt). Si tu lis ce fichier depuis GitHub, c'est fait.
2. Ensuite, le point 1 de « Ce qui manque » : pouvoir appeler l'artisan
   depuis les quatre archétypes, avec son contrôle.

## Ne pas refaire

- Livrer en choisissant les fichiers à la main.
- Laisser du travail vivre seulement dans l'espace de Claude.
- Construire sans avoir lu `memoire/` et `rules/web/`.
- Déclarer un contrôle bon sans l'avoir vu attraper une copie cassée exprès.

# Règles communes

Chargées à chaque session. Rester court : chaque ligne coûte du contexte partout.

| Fichier | Portée | Imposé par |
|---|---|---|
| `ne-pas-fabriquer.md` | toute sortie | jugement, plus revue |
| `securite.md` | secrets, contenu externe, skills tiers | `.claude/hooks/pre-outil.mjs`, `.claude/hooks/post-ecriture.mjs`, `scripts/verifier-secrets.mjs` |
| `git-workflow.md` | commits, branches | `git-hooks/pre-commit`, interdits de `.claude/settings.json` |
| `redaction-fr.md` | tout texte publié en français | `scripts/verifier-textes.mjs` |

Règles hors paquet commun, chargées selon le travail :

| Fichier | Portée | Imposé par |
|---|---|---|
| `rules/methode.md` | toute livraison | `scripts/verifier-depot.mjs` |
| `rules/web/composition.md` | plancher de composition, téléphone | `scripts/verifier-site.mjs`, `scripts/verifier-mobile.mjs` |
| `rules/web/facture.md` | facture, matière, profondeur | `scripts/verifier-site.mjs` |
| `rules/web/mouvement.md` | animation et manipulation | `scripts/verifier-site.mjs`, `scripts/verifier-ordinateur.mjs`, `scripts/verifier-mobile.mjs` |
| `rules/web/client.md` | ce que le client et l'artisan jugent | revue |
| `rules/web/photos.md` | traitement des photos de chantier | revue |
| `rules/web/design-interdits.md` | plancher, test d'unicité | `scripts/verifier-site.mjs` |
| `rules/web/accessibilite.md` | contraste, cibles, lecteurs d'écran | les deux vérificateurs |
| `rules/web/performance.md` | budgets de poids | `scripts/verifier-site.mjs` |

Les paquets de domaine (`web/`, `shopify/`) étendent ces règles.
En cas de conflit, le spécifique l'emporte sur le général.

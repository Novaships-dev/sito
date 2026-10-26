# Ce que Cowork dépose dans le dépôt

Seul Cowork (Claude dans l'app, avec Fabrice) écrit ce fichier, en ajout seul.
Claude Code le lit au début de chaque tâche et avant chaque commit, et commite
les fichiers listés à part (`Cowork : <fichiers>`). Règle : `CLAUDE.md`,
section 2, « Deux sessions ».

| Date | Fichiers | Pourquoi |
|---|---|---|
| 24 oct. 2026 | `app/specs/08-PROSPECTION.md`, tâches T34 à T41 dans `app/specs/07-TACHES.md`, `memoire/actions-fabrice.md` (F5, F18), `memoire/decisions.md`, `lanceurs/CLE_CLOUDFLARE.bat` | prospection décidée par Fabrice le 23 oct. ; déjà emportés par le commit de T06 (voir journal) |
| 24 oct. 2026 | `CLAUDE.md` (étape 8 et « Deux sessions »), `memoire/de-cowork.md` | ne plus mélanger les deux sessions dans un même commit |
| 24 oct. 2026 | `scripts/autonome.mjs`, `scripts/essai-outillage.mjs` | la limite de séance de l'abonnement Claude (« session limit · resets 5:10am ») n'était pas reconnue : 3 lancements perdus et arrêt à 01:11 ; désormais attente jusqu'à l'heure de reprise annoncée (6 h au plus), sans arrêt. Essai d'outillage : 91 contrôles, 0 faute ; contre-essai rouge |
| 26 oct. 2026 | `memoire/questions.md` (réponse à Q2) | les 4 SMS du document de prospection, pour la page d'appels |

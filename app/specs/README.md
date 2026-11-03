# Les documents pour coder Sitô

Écrits le 9 octobre 2026 par Claude, à partir des décisions de Fabrice
(`memoire/decisions.md`), du plan (`app/PLAN-APP.md`), de la base réelle et du
code. Chaque ligne dit son état : fait et prouvé, fait sans preuve, à faire,
ou ouvert (à décider par Fabrice).

| # | Document | Répond à |
|---|---|---|
| 1 | `01-PRD.md` | quoi et pour qui : le site d'abord (S01 à S31), la prospection (P1 à P6), l'app (A1 à A20), décisions, modèle économique (réécrit le 3 nov. 2026) |
| 2 | `02-TRD.md` | comment : architecture, pile, sécurité, services, essais |
| 3 | `03-APPFLOW.md` | les écrans, les routes, les parcours de bout en bout |
| 4 | `04-DESIGN-SYSTEM.md` | brief, couleurs mesurées, typographie, composants, ton |
| 5 | `05-SCHEMA-BACKEND.md` | les 21 tables, les droits, le stockage, le service à construire |
| 6 | `06-PLAN-IMPLEMENTATION.md` | les 21 étapes, leur preuve, qui fait quoi, les coûts |
| 7 | `07-TACHES.md` | la liste de travail de Claude Code : une ligne par tâche, son état, sa preuve, ce qui la bloque |

Les spécifications **du site** (mentions légales, référencement, parcours du
visiteur, métiers) sont dans `docs/specs/`.

Quand le code change, le document concerné change dans la même livraison.

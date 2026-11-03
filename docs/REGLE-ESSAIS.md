# Règle des essais : ce qu'un essai doit prouver, et quand le lancer

Écrit par Claude (Cowork) le 3 novembre 2026. Rassemble les règles d'essai
déjà écrites dans le dépôt (`CLAUDE.md` §2, `rules/methode.md`,
`memoire/pieges.md`, `app/specs/02-TRD.md` §9) et celles que StructorAI a
payées cher (`OPS/REGLE-TESTS.md`, dépôt StructorAI, 29 juil. et 6 août 2026).
Ce n'est pas une décision de Fabrice.

## Les six règles

| N° | Règle | Pourquoi (panne réelle) |
|---|---|---|
| E1 | **Un essai qu'on n'a pas vu rougir ne prouve rien.** Tout contrôle ajouté ou modifié est lancé une fois sur une copie cassée exprès, et la sortie rouge est copiée dans le journal. | StructorAI : 2 956 essais verts sur un webhook de paiement mort. Sito, 25 oct. : un contre-essai visait un texte qui n'existait plus et ne cassait rien (`memoire/pieges.md`). |
| E2 | **Si la copie cassée ne fait pas rougir l'essai, on soupçonne d'abord la cassure.** Elle doit sortir 2 et le dire, jamais compter comme réussie. | Sito, 24 et 25 oct. : deux cassures qui ne mordaient pas (`memoire/pieges.md`). |
| E3 | **Un essai ne tire jamais sa vérité du code qu'il juge.** L'attendu s'écrit en dur dans l'essai. | Sito, 25 oct. : les empreintes recalculées avec la fonction essayée ; l'essai restait vert quand l'algorithme changeait. |
| E4 | **Un contrôle mesure le rendu, jamais la variable que le code vient d'écrire.** | Sito, sept. : la couture du comparateur ne bougeait sur aucun appareil, les contrôles lisaient la variable CSS (`rules/methode.md`). |
| E5 | **Un écran affiché ne prouve rien sur ses boutons.** Quand une règle change, l'essai clique le bouton qui en dépend. | StructorAI, 1er août : « Envoyer la facture » grisé pendant trois lots sans un essai rouge. |
| E6 | **Vert ici, vert dans un clone neuf.** Une tâche n'est finie que si la CI GitHub est verte. | Sito, 29 oct. : CI rouge trois fois, verte en local ; StructorAI : une erreur de types qui n'existait que sur un clone neuf. |

## Quand lancer quoi

| Situation | À lancer |
|---|---|
| Toute tâche, à la fin | `node scripts/essais.mjs` : 0 obligatoire. 4 seulement si un outil manque et que la tâche T01 le note. |
| La tâche touche le générateur ou les règles web | en plus : `node scripts/fabriquer-demo.mjs` (les cinq vérificateurs) sur la machine qui a les images |
| La tâche touche une migration | en plus : `supabase/essais/droits.sql` et `droits-app.sql` (outil MCP `execute_sql`), puis `get_advisors` sans alerte nouvelle |
| La tâche touche l'app | en plus : `node scripts/essai-app.mjs` et sa copie cassée (`SITO_APP_DIST`) |
| La tâche ajoute un contrôle | en plus : le `--contre-essai` du script concerné |
| Avant une mise en ligne réelle | `node scripts/essais.mjs --complet`, puis l'essai Safari (T49) et la liste d'essais manuels sur iPhone (`docs/ESSAIS-IPHONE.md`, lot 4) |
| Fin de séance | `/fin-de-seance` (audit du dépôt, place libre du disque) |

## Ce qui n'est pas encore essayé du tout

Écrit pour ne pas le croire couvert :

- **Safari** : aucun vérificateur ne lance WebKit (`scripts/`, 3 nov. 2026). Tâche T49.
- **Vrais appareils** : aucun essai sur un vrai iPhone ni un vrai Android (T30, bloquée par F14).
- **Vraie base de bout en bout** : l'app n'a jamais tourné contre la vraie base (T04).
- **Lecteur d'écran réel** : `app/specs/02-TRD.md` T4, « sauf lecteur d'écran réel ».
- **Réseau réel** : envoi coupé puis repris, jamais essayé hors démonstration (`02-TRD.md` T7, P8).

## Sur une machine sans un outil

`node scripts/essais.mjs` dit « NON LANCÉ » pour l'essai qui manque d'un outil
et sort 4. Exception relevée le 3 novembre 2026 : l'étape « app : parcours et
rendu » n'a pas cette garde et **plante** quand exiftool manque (constat
S-005 de `docs/audit/REGISTRE.md`, tâche T47).

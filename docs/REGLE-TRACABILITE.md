# Règle de traçabilité : ce qu'une tâche met à jour

Écrit par Claude (Cowork) le 3 novembre 2026, sur le modèle de
`OPS/REGLE-TRACABILITE.md` du dépôt StructorAI. Ce n'est pas une décision de
Fabrice ; elle applique deux de ses décisions : « N'invente jamais un
résultat » (sept. 2026) et « éviter les fichiers doublons, faire des audits,
supprimer et rectifier » (29 oct. 2026).

**Une tâche qui n'a pas mis à jour ses fichiers n'est pas finie.** Elle reste
« en cours » dans `app/specs/07-TACHES.md`, même si son code marche.

## Pourquoi

Le 3 novembre 2026, l'audit du dépôt a trouvé `memoire/maintenant.md` qui se
contredisait : 6 sites « en ligne » au début, « Aucun site en ligne » plus bas,
et le code de connexion par e-mail encore décrit alors qu'il était abandonné
depuis le 29 octobre. Le README annonçait 3 sites différents ; la mesure en
donnait 100. Chaque fichier avait été juste le jour où il a été écrit. Aucun
n'a été mis à jour quand le reste a changé. Dans StructorAI, la même dérive a
forcé un audit complet du dépôt le 25 juin 2026.

## À chaque tâche, sans exception

| Fichier | Ce qu'on y écrit |
|---|---|
| `app/specs/07-TACHES.md` | l'état de la tâche (`fait`, `bloqué` avec son action, `en cours`) et la preuve obtenue, chiffres compris |
| `CHANGELOG.md` | une ligne datée en tête de section : ce qui a changé pour Fabrice ou pour un artisan, en une phrase |
| `memoire/journal.md` | le plan en trois lignes au début, le résultat et la preuve à la fin (ajout seul) |
| `memoire/essais/derniers.txt` | réécrit par `node scripts/essais.mjs` ; versionné avec le commit |

## Selon ce que la tâche a touché

| Si la tâche… | … mettre à jour |
|---|---|
| change un chiffre, un prix, une limite, un délai | `docs/SOURCE-UNIQUE.md` d'abord, puis chaque fichier de sa colonne « Recopiée dans » |
| change l'état global (une étape franchie, un blocage levé) | `memoire/maintenant.md` |
| ajoute, retire ou change une table, une colonne, un droit | une nouvelle migration, `app/specs/05-SCHEMA-BACKEND.md`, `supabase/README.md`, puis rejouer `supabase/essais/droits.sql` et `droits-app.sql` |
| ajoute ou change un point d'entrée (fonction Edge, Worker, page d'appels, formulaire) | `docs/API.md` (à écrire : lot 3 du plan de rattrapage) |
| ajoute une variable d'environnement | `.env.example` et `app/specs/02-TRD.md` §8 |
| change ce que fait l'app ou le site | la ligne de l'exigence dans `app/specs/01-PRD.md` (colonne État) |
| change un écran ou un parcours | `app/specs/03-APPFLOW.md` |
| rencontre une panne qui a réellement eu lieu | `memoire/pieges.md` (ajout seul), avec ce qui l'attrape désormais |
| laisse un défaut connu derrière elle | `docs/DETTE.md`, avec son numéro |
| trouve un constat d'audit | `docs/audit/REGISTRE.md`, avec son numéro |
| ajoute ou supprime des fichiers | relancer `node scripts/carte-depot.mjs --ecrire` (réécrit `docs/audit/CARTE.md`) |
| a besoin d'une décision de Fabrice | `memoire/questions.md` (ajout seul) ; une décision ne s'écrit jamais à sa place dans `memoire/decisions.md` |
| attend une action de Fabrice | `memoire/actions-fabrice.md`, avec où cliquer, pourquoi, combien |

## Définition de « fini »

Une tâche est « fait » quand les six conditions sont vraies, toutes :

1. la commande de sa colonne « Preuve » a tourné et sa sortie est copiée dans le journal ;
2. tout contrôle nouveau a rougi une fois sur une copie cassée exprès ;
3. `node scripts/essais.mjs` sort 0 ;
4. les fichiers des deux tableaux ci-dessus sont à jour ;
5. le commit est poussé et la CI GitHub est verte (`node scripts/ci-github.mjs --journal`) ;
6. le journal finit par une ligne `TRACAGE : <fichiers mis à jour>`.

Si l'une manque, la tâche reste « en cours ». Ce qui n'a pas tourné se dit
(`rules/common/ne-pas-fabriquer.md`).

## Ce que ce fichier ne fait pas

Une règle qui demande un jugement ne se déclenche jamais (`memoire/pieges.md`,
en tête). Depuis T53 (4 nov. 2026), deux étapes de `node scripts/essais.mjs`
la tiennent mécaniquement :

- `node scripts/verifier-tracabilite.mjs` refuse une tâche « fait » sans
  ligne datée dans `CHANGELOG.md` ou sans section de journal du même jour, à
  son nom, avec une ligne `TRACAGE` (les 18 tâches finies avant la règle sont
  listées dans le script, liste fermée) ;
- `node scripts/carte-depot.mjs --verifier` refuse une carte périmée.

Le reste (SOURCE-UNIQUE, specs, DETTE, REGISTRE) tient encore par la lecture.

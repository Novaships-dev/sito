# Questions de Claude pour Fabrice

En ajout seul. Chaque question : `## Qn (ouverte), date`, la question, la
réponse recommandée, et ce que Claude a fait en attendant. Fabrice répond en
dessous ; Claude passe alors la question « (répondue) » dans une nouvelle
entrée, sans réécrire celle-ci.

## Q1 (ouverte), 9 octobre 2026

Le compte d'essai : quelle adresse reçoit les codes, et à quelle entreprise
le relier ?
**Recommandé** : ta Gmail avec `+sito` avant le @ (les codes arrivent dans ta
boîte habituelle, le compte reste séparé), et une entreprise inventée (SIREN
000000000), jamais ta micro-entreprise.
**En attendant** : c'est ce qui est préparé (`scripts/compte-essai.mjs`,
`memoire/comptes-essai.md`). Rien n'est créé tant que le `.env` n'existe pas
(action F1).
## Q1 (réponse appliquée), 11 octobre 2026

Fabrice : « remplis le .env ». Recommandation de Q1 appliquée (réversible, sans
coût) : les codes du compte d'essai vont à sa Gmail avec `+sito` avant le @ ;
entreprise inventée, SIREN 000000000. L'adresse est dans le `.env` de son
ordinateur seulement, pas dans le dépôt.

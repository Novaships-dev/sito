# Comptes d'essai

Les essais automatiques ne touchent **jamais** un vrai artisan. Ils utilisent
ce compte, et seulement lui. Connexion par mot de passe, jamais écrit. Pour reprendre la main
(décision du 5 nov. 2026) : `node atelier/comptes.mjs mot-de-passe <adresse du compte d'essai>`
sur le PC (clé de service dans `.env`). Créé le 29 oct. 2026 par l'ancien
lien d'inscription.

| Élément | Valeur |
|---|---|
| Adresse de connexion | celle de `SITO_COMPTE_ESSAI_COURRIEL` dans le `.env` (la Gmail de Fabrice avec `+sito`) ; jamais écrite dans le dépôt |
| Entreprise | inventée : « ESSAI SITO », SIREN `000000000` (aucune entreprise réelle n'a ce numéro), Marseille 13001 |
| Création | `node scripts/compte-essai.mjs` (idempotent) ; `--verifier` pour lire sans écrire |
| Ce que les essais peuvent y écrire | profil, tarifs, chantiers, photos et vidéos sous `000000000/` dans le stockage |
| Nettoyage | chaque essai efface ce qu'il a créé |

Démonstration sans compte : l'app avec `?demo`, compte artisan@exemple.fr, mot de passe chantier13, données en
mémoire seulement.

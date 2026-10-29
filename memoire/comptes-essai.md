# Comptes d'essai

Les essais automatiques ne touchent **jamais** un vrai artisan. Ils utilisent
ce compte, et seulement lui. Depuis le 29 oct. 2026 (T43), connexion par mot de
passe : il est tiré au hasard par l'essai et jamais écrit. Pour reprendre la
main, un lien de reprise : `select public.creer_invitation('000000000', 'reprise');`
(outil MCP), puis `SITO_CLE_PUBLIQUE=<clé publique> node scripts/essai-inscription.mjs --reel <jeton>`.
Créé le 29 oct. 2026 par ce chemin (inscription puis reprise, 6/0 chaque fois).

| Élément | Valeur |
|---|---|
| Adresse de connexion | celle de `SITO_COMPTE_ESSAI_COURRIEL` dans le `.env` (la Gmail de Fabrice avec `+sito`) ; jamais écrite dans le dépôt |
| Entreprise | inventée : « ESSAI SITO », SIREN `000000000` (aucune entreprise réelle n'a ce numéro), Marseille 13001 |
| Création | `node scripts/compte-essai.mjs` (idempotent) ; `--verifier` pour lire sans écrire |
| Ce que les essais peuvent y écrire | profil, tarifs, chantiers, photos et vidéos sous `000000000/` dans le stockage |
| Nettoyage | chaque essai efface ce qu'il a créé |

Démonstration sans compte : l'app avec `?demo`, compte artisan@exemple.fr, mot de passe chantier13, données en
mémoire seulement.

---
name: sito-base
description: Procédure pour toute modification de la base Supabase de Sitô (migration, droits, stockage). À utiliser avant d'écrire du SQL qui change le schéma, une politique de sécurité ou un espace de stockage.
---

# Modifier la base Sitô

Projet `sito`, réf. `magxzrpboyrzguuocjgj`, Paris. Outils : le connecteur MCP
Supabase (`list_tables`, `execute_sql`, `apply_migration`, `list_migrations`,
`get_advisors`). Jamais la clé de service dans une commande.

## Dans cet ordre

1. Lire `supabase/README.md` et `app/specs/05-SCHEMA-BACKEND.md`.
2. Écrire `supabase/migrations/<AAAAMMJJHHMMSS>_<nom>.sql` : en tête, la
   décision de Fabrice qui la justifie (citée) ; **les droits dans la même
   migration** (sécurité par ligne sur toute table nouvelle, droits par colonne
   si l'app ne doit pas tout écrire).
3. Étendre `supabase/essais/droits-app.sql` (ou `droits.sql`) avec les cas
   permis et refusés. **Le lancer AVANT d'appliquer** : il doit rougir (la
   colonne ou la règle n'existe pas encore). C'est la copie cassée.
4. Appliquer avec `apply_migration` (même nom).
5. `list_migrations` : Supabase donne sa propre version (horodatage).
   **Renommer le fichier local avec cette version** pour que dépôt et base
   concordent (piège du 9 octobre).
6. Relancer les essais de droits : tout « accepte » ou « refuse » attendu,
   aucune « FAUTE ».
7. `get_advisors` (sécurité et performance) : corriger ce qui est nouveau.
8. Mettre à jour `app/specs/05-SCHEMA-BACKEND.md`, `supabase/README.md`, et
   les types de `app/src/types.ts` si l'app lit la nouvelle colonne.

## Jamais

- Modifier une migration existante (le crochet le refuse).
- `DROP`, suppression de colonne, réinitialisation : action de Fabrice.
- Toucher `auth.*`, `storage.*` en dehors des politiques de stockage.
- Écrire des données de test dans la vraie base hors du compte d'essai
  (`scripts/compte-essai.mjs`, SIREN 000000000).

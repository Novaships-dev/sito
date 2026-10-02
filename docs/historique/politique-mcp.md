# Politique MCP

## La règle

Configurer largement, activer peu. 20 à 30 serveurs dans la configuration,
moins de 10 activés, moins de 80 outils actifs.

Les noms d'outils MCP sont chargés en permanence. Une fenêtre de 200 000
peut n'en valoir que 70 000 avec trop d'outils actifs.

C'est l'inverse des skills : seule leur description est chargée, environ
100 tokens chacune. On peut en installer beaucoup.

## Ce qui reste permanent

| Connecteur | Raison |
|---|---|
| navigateur, chrome-devtools | l'agent voit ses propres pages, corrige ce qu'il a écrit. Requis par les skills de qualité web |
| Context7 | documentation à jour, contre la dérive des API |

## Ce qui passe par CLI plutôt que MCP

Supabase, Vercel, GitHub. Ces plateformes ont des CLI robustes que le MCP ne
fait qu'emballer, avec un coût de contexte. Écrire une commande qui appelle
la CLI donne la même capacité pour zéro token permanent.

## Activé à la demande

Firecrawl pour la migration d'un site existant et la veille.
Perplexity pour la recherche réglementaire.

## Écarté

Composio : trop d'outils chargés pour trop peu d'usage ici.

## Vérifier

    /mcp        les serveurs actifs
    /plugins    les extensions

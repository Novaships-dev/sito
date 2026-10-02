# Shopify et Liquid

## Outillage officiel seulement

    /plugin marketplace add Shopify/liquid-skills
    /plugin install liquid-lsp@liquid-skills
    /plugin install liquid-skills@liquid-skills
    npx skills add Shopify/agent-skills

Ce sont les seules sources de première main. Les autres skills Shopify sont
communautaires et passent par la procédure de `rules/common/securite.md`.

## Vérification

Le hook `post-ecriture` lance `shopify theme check` sur les fichiers Liquid.
C'est l'équivalent de Biome pour ce dépôt.

## Les API se déprécient tous les trimestres

Ne jamais répondre de mémoire sur une question d'API ou de version. Utiliser
Context7 pour la documentation en direct. `docs/shopify.md` porte une date de
dernière vérification et se relit à chaque version trimestrielle.

## Git LFS

Obligatoire, et posé avant la première image. Une photo entrée dans
l'historique sans LFS y reste, et le rattrapage demande de réécrire
l'historique.

## Design

Les règles de `rules/web/design-interdits.md` s'appliquent, à une nuance
près : une boutique de vêtements assume l'audace visuelle. Molettes plutôt
vers 8 / 6 / 4. Voir `references/molettes.md`.

Ne jamais partager le fichier de molettes ni la palette avec un autre projet.

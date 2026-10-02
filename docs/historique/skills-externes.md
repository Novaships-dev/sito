# Skills externes installés

Une ligne par skill. Ne jamais noter les chiffres annoncés par un dépôt : ils
se périment. Noter l'empreinte du commit et la date.

| Skill | Source | Vérifié par | Empreinte | Date | Revu le |
|---|---|---|---|---|---|
| frontend-design | Anthropic, marketplace officiel | éditeur | - | - | - |
| code-review | Anthropic, marketplace officiel | éditeur | - | - | - |
| context7 | Upstash, marketplace officiel | éditeur | - | - | - |

## À faire avant chaque ajout

1. `skill-warden scan <compte>/<depot>`
2. vérifier le compte propriétaire, pas seulement le nom du dépôt
3. vérifier les étoiles et la date du dernier commit
4. lire le frontmatter, aucun chevron
5. lire le corps du SKILL.md
6. remplir une ligne ici
7. `npx ecc-agentshield scan --injection --sandbox`

## Dépôts sosies rencontrés

Le problème est réel. Exemples relevés :

- des copies de `taste-skill`, dont une nommée avec un enchaînement de
  chiffres 1, de L minuscules et de I majuscules pour être illisible
- cinq versions de `ui-ux-pro-max` avec des chiffres tous différents
- trois copies de `Scrapegraph-ai`

Ne jamais installer depuis un lien vu dans une vidéo.

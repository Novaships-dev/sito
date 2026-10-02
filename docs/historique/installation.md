# Installer atelier dans un projet

## 1. Les plugins vérifiés par l'éditeur, en premier

Ils ne demandent aucune procédure de contrôle.

    /plugin install frontend-design
    /plugin install code-review
    /plugin install context7

`frontend-design` est le seul outil anti-signature de première partie.
`context7` récupère la documentation à jour au lieu de s'appuyer sur la
mémoire du modèle.

## 2. Le scanner de skills

    pip install skill-warden

À partir de là, aucun skill tiers ne s'installe sans être passé dessus.

## 3. atelier

    npx skills add <compte>/atelier

Puis les règles, à la main, répertoire par répertoire :

    mkdir -p .claude/rules/atelier
    cp -r rules/common .claude/rules/atelier/
    cp -r rules/web    .claude/rules/atelier/

Jamais avec `/*`. Les fichiers de `common` et des paquets de domaine portent
les mêmes noms, et un aplatissement écrase les règles communes.

## 4. Les hooks

Dans `.claude/settings.json` du projet :

    {
      "hooks": {
        "PreToolUse":  [{ "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": ".claude/hooks/pre-ecriture.sh" }] }],
        "PostToolUse": [{ "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": ".claude/hooks/post-ecriture.sh" }] }],
        "SessionStart":[{ "matcher": "*",          "hooks": [{ "type": "command", "command": ".claude/hooks/session-depart.sh" }] }],
        "PreCompact":  [{ "matcher": "*",          "hooks": [{ "type": "command", "command": ".claude/hooks/pre-compactage.sh" }] }]
      }
    }

Copier les hooks dans le projet :

    mkdir -p .claude/hooks && cp hooks/*.sh .claude/hooks/ && chmod +x .claude/hooks/*.sh

## 5. Le détecteur visuel

    npx skills add yetone/kill-ai-slop

Et le lancer avec nos règles :

    npx kill-ai-slop . --rules=.claude/scripts/regles-fr.mjs

## 6. Contrôle final

    npx ecc-agentshield scan --injection --sandbox

## Ordre, et pourquoi

Les plugins vérifiés d'abord parce qu'ils ne demandent aucun contrôle.
Le scanner ensuite parce qu'il conditionne tout le reste.
Les hooks avant la première ligne d'interface : poser la barrière avant de
produire ce qu'elle doit filtrer.

#!/usr/bin/env bash
# PreCompact. Le compactage écrase du contexte : sauver avant.
set -uo pipefail
RACINE=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
mkdir -p "$RACINE/memoire/sessions"
HORO=$(date +%Y-%m-%d-%H%M)
cat > "$RACINE/memoire/sessions/$HORO-avant-compactage.md" << FIN
# Sauvegarde avant compactage, $HORO

## Ce qui a marche

## Ce qui a ete tente et n a pas marche

## Ce qui reste

FIN
echo "Etat sauve dans memoire/sessions/$HORO-avant-compactage.md. Le remplir avant de continuer."
exit 0

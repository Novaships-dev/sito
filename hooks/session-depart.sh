#!/usr/bin/env bash
# SessionStart. Injecte l'état courant dans le contexte.
set -uo pipefail
RACINE=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
[ -f "$RACINE/memoire/maintenant.md" ] && cat "$RACINE/memoire/maintenant.md"
[ -f "$RACINE/memoire/pieges.md" ] && { echo; echo "## Pieges connus"; head -40 "$RACINE/memoire/pieges.md"; }
exit 0

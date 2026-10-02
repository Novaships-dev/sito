#!/usr/bin/env bash
# PostToolUse, après écriture ou édition d'un fichier.
# Sortie 2 = bloque. Sortie 0 = laisse passer.
# Entrée : JSON sur stdin.
set -uo pipefail

ENTREE=$(cat)
FICHIER=$(printf '%s' "$ENTREE" | python3 -c \
  'import sys,json; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))' 2>/dev/null)

[ -z "$FICHIER" ] && exit 0
[ -f "$FICHIER" ] || exit 0

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODE=0

case "$FICHIER" in
  *.html|*.md|*.astro|*.jsx|*.tsx|*.vue|*.liquid|*.txt)
    if ! node "$RACINE/scripts/verifier-textes.mjs" "$FICHIER"; then
      echo "Signature textuelle bloquante. Voir rules/common/redaction-fr.md" >&2
      CODE=2
    fi
    ;;
esac

case "$FICHIER" in
  *.liquid)
    command -v shopify >/dev/null && shopify theme check --path "$(dirname "$FICHIER")" 2>/dev/null || true
    ;;
  *.ts|*.tsx|*.js|*.jsx)
    command -v biome >/dev/null && biome check --write "$FICHIER" >/dev/null 2>&1 || true
    if grep -qn 'console\.log' "$FICHIER"; then
      echo "console.log present dans $FICHIER" >&2
    fi
    ;;
esac

exit $CODE

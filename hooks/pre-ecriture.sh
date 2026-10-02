#!/usr/bin/env bash
# PreToolUse. Bloque les écritures interdites. Sortie 2 = refus.
set -uo pipefail

ENTREE=$(cat)
FICHIER=$(printf '%s' "$ENTREE" | python3 -c \
  'import sys,json; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))' 2>/dev/null)

[ -z "$FICHIER" ] && exit 0
BASE=$(basename "$FICHIER")

# Secrets
case "$BASE" in
  .env|.env.*)
    [ "$BASE" = ".env.example" ] || { echo "Ecriture dans $BASE refusee. Les secrets ne passent jamais par l agent." >&2; exit 2; }
    ;;
esac

# Journaux en ajout seul
case "$FICHIER" in
  */memoire/decisions.md|*/memoire/pieges.md)
    echo "$FICHIER est en ajout seul. Ajouter une entree datee, ne pas reecrire." >&2
    exit 2
    ;;
esac

# Prolifération de fichiers markdown à la racine
if [[ "$BASE" == *.md ]]; then
  DOSSIER=$(dirname "$FICHIER")
  if [ "$DOSSIER" = "." ] || [ "$DOSSIER" = "$(git rev-parse --show-toplevel 2>/dev/null)" ]; then
    case "$BASE" in
      README.md|CLAUDE.md|AGENTS.md|RULES.md|CONTEXT.md|SECURITY.md|CONTRIBUTING.md|CHANGELOG.md|TROUBLESHOOTING.md) ;;
      *) echo "Pas de nouveau .md a la racine. Ranger dans docs/." >&2; exit 2 ;;
    esac
  fi
fi

exit 0

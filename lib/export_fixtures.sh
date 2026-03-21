#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXDIR="$ROOT/fixtures"

fixtures=(
  "01-basic-layout"
  "02-links-and-anchors"
  "03-embeds"
  "04-callouts"
  "05-print-stress"
  "06-extensions"
)

usage() {
  cat >&2 <<'EOF'
Usage:
  lib/export_fixtures.sh              # export all fixtures
  lib/export_fixtures.sh 04-callouts  # export one fixture
  lib/export_fixtures.sh 03-embeds 06-extensions
EOF
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

selected=()
if [[ $# -eq 0 ]]; then
  selected=("${fixtures[@]}")
else
  for arg in "$@"; do
    arg="${arg%.md}"
    selected+=("$arg")
  done
fi

for name in "${selected[@]}"; do
  note="$FIXDIR/${name}.md"
  out="$FIXDIR/${name}.pdf"
  if [[ ! -f "$note" ]]; then
    echo "Fixture not found: $name" >&2
    usage
    exit 1
  fi
  echo "[fixture] $(basename "$note") -> $(basename "$out")" >&2
  "$ROOT/lib/export_with_edge.sh" "$note" "$out" >/dev/null
  echo "$out"
done

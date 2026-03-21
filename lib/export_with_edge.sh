#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: lib/export_with_edge.sh <note.md> [output.pdf]" >&2
  exit 2
fi

DEBUG_HTML_PATH="${OPENCLAW_OBS_PDF_DEBUG_HTML:-}"
KEEP_TEMP="${OPENCLAW_OBS_PDF_KEEP_TEMP:-0}"
PAPER_SIZE="${OPENCLAW_OBS_PDF_PAPER_SIZE:-A4}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NOTE_INPUT="$1"
NOTE_ABS="$(cd "$ROOT" && python3 - <<'PY' "$NOTE_INPUT"
import os, sys
print(os.path.abspath(sys.argv[1]))
PY
)"

if [[ ! -f "$NOTE_ABS" ]]; then
  echo "Note not found: $NOTE_ABS" >&2
  exit 1
fi

EDGE_BIN="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
if [[ ! -x "$EDGE_BIN" ]]; then
  echo "Microsoft Edge not found at: $EDGE_BIN" >&2
  exit 1
fi

if [[ $# -eq 2 ]]; then
  OUT_ABS="$(cd "$ROOT" && python3 - <<'PY' "$2"
import os, sys
print(os.path.abspath(sys.argv[1]))
PY
)"
else
  stem="$(basename "$NOTE_ABS" .md)"
  OUT_ABS="$(dirname "$NOTE_ABS")/${stem}.pdf"
fi

mkdir -p "$(dirname "$OUT_ABS")"
TMP_DIR="$(mktemp -d "$ROOT/.vaultpress-tmp.XXXXXX")"
HTML_PATH="$TMP_DIR/rendered.html"
PROFILE_DIR="$TMP_DIR/edge-profile"
LOG_PATH="$TMP_DIR/edge.log"
mkdir -p "$PROFILE_DIR"

cleanup() {
  local ec=$?
  pkill -f "$PROFILE_DIR" >/dev/null 2>&1 || true
  if [[ "$KEEP_TEMP" != "1" ]]; then
    rm -rf "$TMP_DIR" >/dev/null 2>&1 || true
  fi
  return $ec
}
trap cleanup EXIT INT TERM

OPENCLAW_OBS_PDF_PAPER_SIZE="$PAPER_SIZE" node "$ROOT/lib/export_note_to_html.js" "$NOTE_ABS" "$HTML_PATH" >/dev/null

if [[ -n "$DEBUG_HTML_PATH" ]]; then
  mkdir -p "$(dirname "$DEBUG_HTML_PATH")"
  cp "$HTML_PATH" "$DEBUG_HTML_PATH"
fi

FILE_URL="file://$HTML_PATH"

set +e
python3 - <<'PY' "$EDGE_BIN" "$PROFILE_DIR" "$OUT_ABS" "$FILE_URL" "$LOG_PATH"
import subprocess, sys, pathlib
edge_bin, profile_dir, out_abs, file_url, log_path = sys.argv[1:6]
cmd = [
    edge_bin,
    '--headless=new',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=15000',
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    '--enable-local-file-accesses',
    f'--user-data-dir={profile_dir}',
    f'--print-to-pdf={out_abs}',
    file_url,
]
log_path = pathlib.Path(log_path)
out_path = pathlib.Path(out_abs)
with log_path.open('w', encoding='utf-8') as log:
    try:
        proc = subprocess.run(cmd, stdout=log, stderr=subprocess.STDOUT, timeout=45)
        if proc.returncode != 0 and not (out_path.exists() and out_path.stat().st_size > 0):
            raise SystemExit(proc.returncode or 1)
    except subprocess.TimeoutExpired:
        if not (out_path.exists() and out_path.stat().st_size > 0):
            raise SystemExit(124)
PY
status=$?
set -e

if [[ $status -ne 0 && ! -s "$OUT_ABS" ]]; then
  echo "Edge print failed. Log: $LOG_PATH" >&2
  tail -50 "$LOG_PATH" >&2 || true
  exit $status
fi

if [[ ! -s "$OUT_ABS" ]]; then
  echo "Edge print failed: output missing or empty." >&2
  tail -50 "$LOG_PATH" >&2 || true
  exit 1
fi

echo "$OUT_ABS"

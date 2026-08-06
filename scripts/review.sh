#!/usr/bin/env bash
#
# Start the dev server (if it isn't already up) and open the forest for review.
#
# Idempotent: if something is already serving the port, this attaches to it
# rather than starting a second server. Exiting with Ctrl+C stops only a server
# this script started — an already-running `pnpm dev` is left alone.

set -euo pipefail

PORT="${PORT:-3477}"
ROUTE="${ROUTE:-/}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL="http://localhost:${PORT}${ROUTE}"

cd "$REPO_DIR"

blue() { printf '\033[1;34m%s\033[0m\n' "$1"; }
dim() { printf '\033[2m%s\033[0m\n' "$1"; }
red() { printf '\033[1;31m%s\033[0m\n' "$1"; }

is_up() { curl -fsS -o /dev/null --max-time 2 "http://localhost:${PORT}/" 2>/dev/null; }

open_browser() {
  # Give the page a beat so the first paint isn't a compile screen.
  sleep 1
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 &
  else
    dim "No xdg-open — open this yourself: $URL"
  fi
}

blue "🌲 Animated Homepage Components — review"
dim  "$REPO_DIR"
echo

if [[ ! -d node_modules ]]; then
  blue "Installing dependencies (first run)…"
  pnpm install
  echo
fi

if is_up; then
  blue "Dev server already running on :${PORT} — attaching."
  echo "   $URL"
  open_browser
  echo
  dim "Nothing to stop: this window did not start the server. Close it any time."
  # Keep the terminal open so the launcher window doesn't vanish instantly.
  read -r -p "Press Enter to close this window. " || true
  exit 0
fi

SERVER_PID=""
cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo
    blue "Stopping dev server…"
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

blue "Starting dev server on :${PORT}…"
pnpm dev --port "$PORT" &
SERVER_PID=$!

# Wait for the server to answer, but don't hang forever if it dies on boot.
for _ in $(seq 1 60); do
  if is_up; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    red "Dev server exited before it came up. Scroll up for the error."
    read -r -p "Press Enter to close this window. " || true
    exit 1
  fi
  sleep 1
done

if ! is_up; then
  red "Dev server did not come up within 60s."
  read -r -p "Press Enter to close this window. " || true
  exit 1
fi

echo
blue "Ready → $URL"
dim  "  the forest   $URL"
dim  "  the lab      http://localhost:${PORT}/lab"
echo
dim  "Ctrl+C stops the server and closes this window."
echo

open_browser

# Hand the terminal back to the dev server so its logs keep streaming here.
wait "$SERVER_PID"

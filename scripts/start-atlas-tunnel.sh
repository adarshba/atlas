#!/usr/bin/env bash
set -euo pipefail

ATLAS_PORT="${ATLAS_PORT:-3000}"
ATLAS_TUNNEL_NAME="${ATLAS_TUNNEL_NAME:-atlas}"
ATLAS_TUNNEL_URL="${ATLAS_TUNNEL_URL:-http://localhost:${ATLAS_PORT}}"
ATLAS_PUBLIC_DOMAIN="${ATLAS_PUBLIC_DOMAIN:-atlas.kaizenops.in}"

dev_pid=''
tunnel_pid=''

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

stop_process() {
  local pid="$1"

  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
  fi
}

shutdown() {
  trap - INT TERM EXIT
  stop_process "$dev_pid"
  stop_process "$tunnel_pid"
  wait "$dev_pid" "$tunnel_pid" 2>/dev/null || true
}

wait_for_exit() {
  while true; do
    if ! kill -0 "$dev_pid" 2>/dev/null; then
      set +e
      wait "$dev_pid"
      status=$?
      set -e
      exit "$status"
    fi

    if ! kill -0 "$tunnel_pid" 2>/dev/null; then
      set +e
      wait "$tunnel_pid"
      status=$?
      set -e
      exit "$status"
    fi

    sleep 1
  done
}

require_command bun
require_command cloudflared

trap shutdown INT TERM EXIT

echo "Starting Atlas dev server on port ${ATLAS_PORT}"
ATLAS_PORT="$ATLAS_PORT" bun run dev &
dev_pid="$!"

echo "Starting Cloudflare tunnel ${ATLAS_TUNNEL_NAME} for ${ATLAS_TUNNEL_URL}"
echo "Public domain: https://${ATLAS_PUBLIC_DOMAIN}"
cloudflared tunnel run --url "$ATLAS_TUNNEL_URL" "$ATLAS_TUNNEL_NAME" &
tunnel_pid="$!"

wait_for_exit

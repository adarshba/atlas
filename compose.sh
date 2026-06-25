#!/usr/bin/env bash
set -euo pipefail

COMPOSE_CMD=""

if command -v podman &>/dev/null; then
  COMPOSE_CMD="podman compose"
elif command -v docker &>/dev/null; then
  COMPOSE_CMD="docker compose"
else
  echo "Error: Neither podman nor docker found. Install one of them." >&2
  exit 1
fi

COMPOSE_FILE="${COMPOSE_FILE:-docker/compose.yaml}"

exec $COMPOSE_CMD -f "$COMPOSE_FILE" "$@"

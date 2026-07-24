#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${RUNTIME_PROJECT_SOURCE:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)}"
cd "$PROJECT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${JWT_SECRET:?JWT_SECRET must be set}"

if [ "${#JWT_SECRET}" -lt 32 ]; then
  echo "JWT_SECRET must contain at least 32 characters" >&2
  exit 1
fi

# Schema changes remain an explicit provisioning step.
if [ "${ALLOW_SCHEMA_MIGRATION:-0}" = "1" ]; then
  npm run db:migrate
fi

# Local demo credentials are generated in memory and synchronized with three
# demo users. Nothing is written to a tracked file, and production is opt-in.
if [ "${NODE_ENV:-development}" != "production" ] && [ "${ENABLE_DEMO_CREDENTIALS:-1}" = "1" ]; then
  export ENABLE_DEMO_CREDENTIALS=1
  if [ -z "${DEMO_PASSWORD:-${SEED_DEMO_PASSWORD:-${DEMO_SEED_PASSWORD:-}}}" ]; then
    DEMO_PASSWORD="$(node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('base64url'))")"
    export DEMO_PASSWORD
  fi
  npm run provision:demo-credentials
fi

HOST="${HOST:-127.0.0.1}"
API_PORT="${API_PORT:-${PORT:-3000}}"
UI_PORT="${UI_PORT:-${CLIENT_PORT:-${FRONTEND_PORT:-3001}}}"

case "$API_PORT:$UI_PORT" in
  *[!0-9:]*|:*) echo "API_PORT and UI_PORT must be numeric" >&2; exit 1 ;;
esac
if [ "$API_PORT" = "$UI_PORT" ]; then
  echo "API_PORT and UI_PORT must be different" >&2
  exit 1
fi
for runtime_port in "$API_PORT" "$UI_PORT"; do
  if lsof -nP -iTCP:"$runtime_port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $runtime_port is already in use" >&2
    exit 1
  fi
done

child_pids=""
cleanup() {
  trap - EXIT INT TERM
  for child_pid in $child_pids; do
    kill "$child_pid" >/dev/null 2>&1 || true
  done
  for child_pid in $child_pids; do
    wait "$child_pid" >/dev/null 2>&1 || true
  done
}
trap cleanup EXIT INT TERM

if [ "${NODE_ENV:-development}" = "production" ]; then
  npm start -- --hostname "$HOST" --port "$UI_PORT" &
else
  npm run dev -- --hostname "$HOST" --port "$UI_PORT" &
fi
app_pid=$!
child_pids="$app_pid"

TARGET_HOST="$HOST" TARGET_PORT="$UI_PORT" PROXY_HOST="$HOST" PROXY_PORT="$API_PORT" \
  node scripts/runtime-proxy.mjs &
proxy_pid=$!
child_pids="$child_pids $proxy_pid"

echo "Financial Services UI listening on http://$HOST:$UI_PORT"
echo "Financial Services API gateway listening on http://$HOST:$API_PORT"

while kill -0 "$app_pid" >/dev/null 2>&1 && kill -0 "$proxy_pid" >/dev/null 2>&1; do
  sleep 1
done

runtime_result=1
if ! kill -0 "$app_pid" >/dev/null 2>&1; then
  wait "$app_pid" || runtime_result=$?
else
  wait "$proxy_pid" || runtime_result=$?
fi
exit "$runtime_result"

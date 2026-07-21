#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${RUNTIME_PROJECT_SOURCE:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)}"
cd "$PROJECT_DIR"

: "${DATABASE_URL:?DATABASE_URL must be set}"
: "${JWT_SECRET:?JWT_SECRET must be set}"

if [ "${#JWT_SECRET}" -lt 32 ]; then
  echo "JWT_SECRET must contain at least 32 characters" >&2
  exit 1
fi

# Schema changes are explicit, reviewed migrations. A controlled runtime may
# disable startup deployment after it has already prepared an isolated schema.
# Startup never creates, resets, pushes, or seeds a database.
if [ "${ALLOW_SCHEMA_MIGRATION:-1}" = "0" ]; then
  echo "Database migration deployment was disabled for this pre-provisioned runtime."
else
  npm run db:migrate
fi

if [ "${NODE_ENV:-development}" = "production" ]; then
  exec npm start -- --hostname "${HOST:-127.0.0.1}" --port "${PORT:-3000}"
else
  exec npm run dev -- --hostname "${HOST:-127.0.0.1}" --port "${PORT:-3000}"
fi

#!/bin/sh
set -eu

if [ -z "${APP_KEY:-}" ] && [ -f /run/secrets/backend_env ]; then
    APP_KEY="$(grep '^APP_KEY=' /run/secrets/backend_env | cut -d= -f2- | tr -d '\r')"
    export APP_KEY
fi

rm -f .env
php artisan optimize:clear >/dev/null 2>&1 || true

exec "$@"

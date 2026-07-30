#!/bin/sh
set -eu

if [ -f /run/secrets/backend_env ]; then
    if [ -z "${APP_KEY:-}" ]; then
        APP_KEY="$(grep '^APP_KEY=' /run/secrets/backend_env | cut -d= -f2- | tr -d '\r')"
        export APP_KEY
    fi
    cp /run/secrets/backend_env .env
fi

php artisan optimize:clear >/dev/null 2>&1 || true

exec "$@"
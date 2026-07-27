#!/bin/sh
set -eu

if [ -z "${APP_KEY:-}" ] && [ -f /run/secrets/backend_env ]; then
    APP_KEY="$(grep '^APP_KEY=' /run/secrets/backend_env | cut -d= -f2- | tr -d '\r')"
    export APP_KEY
fi

if [ ! -f .env ] && [ -f /run/secrets/backend_env ]; then
    cp /run/secrets/backend_env .env
fi

exec "$@"

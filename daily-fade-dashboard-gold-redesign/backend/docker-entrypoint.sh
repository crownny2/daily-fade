#!/bin/sh
set -e

# Generate APP_KEY if not already set via Render env vars
if [ -z "$APP_KEY" ]; then
  echo "WARNING: APP_KEY not set. Generating one for this run only."
  echo "Set APP_KEY permanently in Render's environment variables."
  php artisan key:generate --force
fi

# Cache config/routes for speed (safe to skip if it ever causes issues)
php artisan config:cache || true
php artisan route:cache || true

# Run migrations against Supabase Postgres. Safe to run on every boot —
# Laravel skips migrations that already ran.
php artisan migrate --force

# On first deploy only, seed demo data manually via Render shell:
#   php artisan db:seed --force
# (Not run automatically here so you don't wipe real bookings later.)

# Render injects $PORT — bind to it, not a hardcoded port
php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"

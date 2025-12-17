#!/bin/bash
set -e

# Export PHP configuration
export PHP_INI_SCAN_DIR=/app/
export PHP_ERROR_REPORTING=E_ALL
export PHP_DISPLAY_ERRORS=On
export PHP_LOG_ERRORS=On
export PHP_ERROR_LOG=/dev/stderr

# Utiliser le PORT fourni par Render (défaut 8080)
export PORT=${PORT:-8080}

echo "Starting FrankenPHP on port $PORT..."

# Démarrer FrankenPHP avec le Caddyfile
cd /app
frankenphp run --config Caddyfile

#!/bin/bash
set -x

export PHP_INI_SCAN_DIR=/app/backend/
export PHP_INI_DIR=/app/backend/
export PHP_ERROR_REPORTING=E_ALL
export PHP_DISPLAY_ERRORS=On
export PHP_LOG_ERRORS=On
export PHP_ERROR_LOG=/dev/stderr

# Démarrer FrankenPHP avec le Caddyfile
frankenphp run --config Caddyfile

<?php
// backend/lib/log.php
// Système léger de logging d'erreurs

function log_error(string $message, array $context = []): void {
    $entry = [
        'timestamp' => date('c'),
        'level' => 'error',
        'message'   => $message,
        'context'   => $context
    ];
    // Écrit dans error_log (Railway, console, etc.)
    error_log(json_encode($entry, JSON_UNESCAPED_UNICODE));
    // Écrit aussi dans logs/debug.log
    $logFile = __DIR__ . '/../logs/debug.log';
    if (ensure_logs_dir_exists()) {
        @file_put_contents($logFile, json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
    }
}

function log_debug(string $message, array $context = []): void {
    $entry = [
        'timestamp' => date('c'),
        'level' => 'debug',
        'message'   => $message,
        'context'   => $context
    ];
    // Écrit dans error_log (Railway, console, etc.)
    error_log(json_encode($entry, JSON_UNESCAPED_UNICODE));
    // Écrit aussi dans logs/debug.log
    $logFile = __DIR__ . '/../logs/debug.log';
    if (ensure_logs_dir_exists()) {
        @file_put_contents($logFile, json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
    }
}

/**
 * Vérifie que le dossier logs/ existe, le crée si besoin, et s'assure qu'il est accessible en écriture.
 * Ne lance jamais d'exception, loggue dans error_log en cas d'échec.
 */
function ensure_logs_dir_exists(): bool {
    $logsDir = __DIR__ . '/../logs';
    if (!is_dir($logsDir)) {
        if (!@mkdir($logsDir, 0775, true) && !is_dir($logsDir)) {
            error_log("[logs] Impossible de créer le dossier logs/ : $logsDir");
            return false;
        }
    }
    if (!is_writable($logsDir)) {
        error_log("[logs] Le dossier logs/ n'est pas accessible en écriture : $logsDir");
        return false;
    }
    return true;
}



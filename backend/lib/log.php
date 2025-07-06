<?php
// backend/lib/log.php
// Système léger de logging d'erreurs

function log_error(string $message, array $context = []): void {
    $entry = [
        'timestamp' => date('c'),
        'message'   => $message,
        'context'   => $context
    ];
    // Écrit directement sur la sortie d'erreur standard que Railway peut lire
    error_log(json_encode($entry, JSON_UNESCAPED_UNICODE));
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



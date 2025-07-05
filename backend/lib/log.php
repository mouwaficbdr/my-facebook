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



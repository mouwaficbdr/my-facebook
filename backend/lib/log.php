<?php
// backend/lib/log.php
// Système léger de logging d'erreurs

function log_error(string $message, array $context = []): void {
    $logDir = __DIR__ . '/../logs';
    $logFile = $logDir . '/error.log';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0775, true);
    }
    // Rotation si >1Mo
    if (file_exists($logFile) && filesize($logFile) > 1024 * 1024) {
        rename($logFile, $logFile . '.' . date('Ymd_His'));
    }
    $entry = [
        'timestamp' => date('c'),
        'message'   => $message,
        'context'   => $context
    ];
    file_put_contents($logFile, json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
}



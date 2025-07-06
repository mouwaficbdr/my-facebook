<?php
// backend/lib/rate_limit.php
require_once __DIR__ . '/log.php';

if (!defined('RATE_LIMIT_FILE')) define('RATE_LIMIT_FILE', __DIR__ . '/../logs/rate_limit.json');
if (!defined('RATE_LIMIT_MAX')) define('RATE_LIMIT_MAX', 5);
if (!defined('RATE_LIMIT_WINDOW')) define('RATE_LIMIT_WINDOW', 600); // 10 minutes en secondes

function rate_limit_check(string $action, string $ip): bool {
    ob_start(); // Capture tous les warnings/notices pour ne jamais polluer la sortie JSON
    $logFile = __DIR__ . '/../logs/rate_limit.json';
    $max = defined('RATE_LIMIT_MAX') ? RATE_LIMIT_MAX : 5;
    $window = defined('RATE_LIMIT_WINDOW') ? RATE_LIMIT_WINDOW : 600;
    $now = time();
    $data = [];
    
    // Vérifier/créer logs/ de façon robuste
    ensure_logs_dir_exists();
    
    if (file_exists($logFile)) {
        $json = @file_get_contents($logFile);
        if ($json !== false) {
            $data = json_decode($json, true) ?: [];
        }
    }
    $key = $action . ':' . $ip;
    if (!isset($data[$key])) {
        $data[$key] = [];
    }
    // Nettoyer les timestamps expirés
    $data[$key] = array_filter($data[$key], function($ts) use ($now, $window) {
        return $ts > $now - $window;
    });
    if (count($data[$key]) >= $max) {
        ob_end_clean(); // On supprime tout output parasite
        return false;
    }
    $data[$key][] = $now;
    // Sauvegarde robuste
    $json = json_encode($data);
    $ok = false;
    if (ensure_logs_dir_exists()) {
        $ok = @file_put_contents($logFile, $json, LOCK_EX);
    }
    if ($ok === false) {
        error_log("[rate_limit] Impossible d'écrire dans $logFile");
        // Pas d'exception, on continue
    }
    ob_end_clean(); // On supprime tout output parasite
    return true;
}



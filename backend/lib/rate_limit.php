<?php
// backend/lib/rate_limit.php
require_once __DIR__ . '/log.php';

const RATE_LIMIT_FILE = __DIR__ . '/../logs/rate_limit.json';
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 600; // 10 minutes en secondes

function rate_limit_check(string $action, string $ip): bool {
    $now = time();
    $data = [];
    if (file_exists(RATE_LIMIT_FILE)) {
        $json = file_get_contents(RATE_LIMIT_FILE);
        $data = json_decode($json, true) ?: [];
    }
    $key = $action . ':' . $ip;
    if (!isset($data[$key])) $data[$key] = [];
    // Nettoyer les timestamps trop anciens
    $data[$key] = array_filter($data[$key], function($ts) use ($now) {
        return $ts > $now - RATE_LIMIT_WINDOW;
    });
    if (count($data[$key]) >= RATE_LIMIT_MAX) {
        log_error('Rate limit exceeded', ['ip' => $ip, 'action' => $action]);
        // Sauvegarder l'état même si bloqué
        file_put_contents(RATE_LIMIT_FILE, json_encode($data), LOCK_EX);
        return false;
    }
    $data[$key][] = $now;
    // Nettoyage périodique des IP inactives
    foreach ($data as $k => $arr) {
        if (empty($arr)) unset($data[$k]);
    }
    file_put_contents(RATE_LIMIT_FILE, json_encode($data), LOCK_EX);
    return true;
}



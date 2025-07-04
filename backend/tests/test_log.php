<?php
// backend/tests/test_log.php
require_once __DIR__ . '/../lib/log.php';

function assert_test($cond, $msg) {
    if (!$cond) {
        echo "[FAIL] $msg\n";
        exit(1);
    } else {
        echo "[OK] $msg\n";
    }
}

// Nettoyer le log avant test
$logFile = __DIR__ . '/../logs/error.log';
if (file_exists($logFile)) unlink($logFile);

// Test : écrire un log
log_error('Test log', ['foo' => 'bar']);

// Vérifier la présence du log
assert_test(file_exists($logFile), 'Le fichier de log doit exister');
$lines = file($logFile, FILE_IGNORE_NEW_LINES);
assert_test(count($lines) === 1, 'Le log doit contenir une ligne');
$entry = json_decode($lines[0], true);
assert_test($entry !== null, 'Le log doit être au format JSON');
assert_test($entry['message'] === 'Test log', 'Le message doit être correct');
assert_test($entry['context']['foo'] === 'bar', 'Le contexte doit être correct');

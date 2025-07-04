<?php
// backend/tests/test_rate_limit.php
require_once __DIR__ . '/../lib/rate_limit.php';

function assert_test($cond, $msg) {
    if (!$cond) {
        echo "[FAIL] $msg\n";
        exit(1);
    } else {
        echo "[OK] $msg\n";
    }
}

$ip = '1.2.3.4';
$action = 'login';
$file = __DIR__ . '/../logs/rate_limit.json';
if (file_exists($file)) unlink($file);

// 5 tentatives autorisées
for ($i = 1; $i <= 5; $i++) {
    assert_test(rate_limit_check($action, $ip), "Tentative $i autorisée");
}
// 6e doit être bloquée
assert_test(!rate_limit_check($action, $ip), "6e tentative doit être bloquée");

// Nettoyer après test
if (file_exists($file)) unlink($file);



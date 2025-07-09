<?php
// backend/tests/test_runner.php

$testDir = __DIR__;
$testFiles = glob($testDir . '/test_*.php');

$success = 0;
$fail = 0;

foreach ($testFiles as $file) {
    if (basename($file) === 'test_runner.php') continue;
    echo "\n=== Test : " . basename($file) . " ===\n";
    $output = [];
    $return = 0;
    exec("php " . escapeshellarg($file), $output, $return);
    foreach ($output as $line) {
        echo $line . "\n";
    }
    if ($return === 0) {
        $success++;
    } else {
        $fail++;
    }
}

if (file_exists(__DIR__ . '/test_profile.php')) {
    require_once __DIR__ . '/test_profile.php';
    // Appel automatique si JWT fourni en argument
    if (isset($argv[1]) && isset($argv[2])) {
        test_profile_endpoint($argv[1], $argv[2]);
    } else {
        echo "Usage: php test_runner.php <userId> <jwt>\n";
    }
}

$total = $success + $fail;
echo "\nRésumé : $success/$total tests OK, $fail échec(s).\n";
if ($fail > 0) exit(1);



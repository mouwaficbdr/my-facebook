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

$total = $success + $fail;
echo "\nRésumé : $success/$total tests OK, $fail échec(s).\n";
if ($fail > 0) exit(1);



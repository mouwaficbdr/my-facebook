<?php
// backend/tests/debug_env.php
// Script de débogage pour vérifier les variables d'environnement

// Charger les configurations
require_once __DIR__ . '/../config/env.php';

echo "=== Débogage des variables d'environnement ===\n";
echo "APP_ENV: " . (getenv('APP_ENV') ?: 'non défini') . "\n";
echo "MAIL_DRIVER: " . (getenv('MAIL_DRIVER') ?: 'non défini') . "\n";
echo "MAIL_FROM: " . (getenv('MAIL_FROM') ?: 'non défini') . "\n";
echo "MAIL_FROM_NAME: " . (getenv('MAIL_FROM_NAME') ?: 'non défini') . "\n";

// Afficher la clé API Brevo de manière sécurisée (premiers et derniers caractères seulement)
$brevoKey = getenv('BREVO_API_KEY');
if ($brevoKey) {
  $length = strlen($brevoKey);
  $maskedKey = substr($brevoKey, 0, 5) . '...' . substr($brevoKey, -5);
  echo "BREVO_API_KEY: " . $maskedKey . " (longueur: " . $length . ")\n";
} else {
  echo "BREVO_API_KEY: non défini\n";
}

// Vérifier si le fichier .env.local existe et est lisible
$envPath = __DIR__ . '/../../.env.local';
echo "\nFichier .env.local: " . (file_exists($envPath) ? 'existe' : 'n\'existe pas') . "\n";
if (file_exists($envPath)) {
  echo "Permissions: " . substr(sprintf('%o', fileperms($envPath)), -4) . "\n";
  echo "Taille: " . filesize($envPath) . " octets\n";
}

// Afficher toutes les variables d'environnement commençant par MAIL_ ou BREVO_
echo "\nToutes les variables d'environnement liées au mail:\n";
foreach ($_ENV as $key => $value) {
  if (strpos($key, 'MAIL_') === 0 || strpos($key, 'BREVO_') === 0) {
    echo "$key: " . (strpos($key, 'KEY') !== false ? substr($value, 0, 5) . '...' . substr($value, -5) : $value) . "\n";
  }
}

// Tester la fonction getenv directement
echo "\nTest direct de getenv():\n";
echo "getenv('BREVO_API_KEY'): " . (getenv('BREVO_API_KEY') ? 'défini' : 'non défini') . "\n";
echo "getenv('MAIL_DRIVER'): " . (getenv('MAIL_DRIVER') ?: 'non défini') . "\n";

// Vérifier si putenv fonctionne
echo "\nTest de putenv():\n";
putenv('TEST_VAR=test_value');
echo "getenv('TEST_VAR'): " . (getenv('TEST_VAR') ?: 'non défini') . "\n";

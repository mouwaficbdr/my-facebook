<?php
// backend/tests/test_auth_flows.php
// Script de test pour vérifier les flux d'authentification complets

// Charger les configurations
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../lib/log.php';

// Configuration
$baseUrl = getenv('APP_URL') ?: 'http://localhost:3000';
$apiBaseUrl = $baseUrl . '/api';

// Fonctions utilitaires
function makeRequest($url, $method = 'GET', $data = null)
{
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    if ($data) {
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
  }

  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
  ]);

  $response = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  return [
    'code' => $httpCode,
    'body' => json_decode($response, true)
  ];
}

function printResult($title, $result)
{
  echo "\n=== $title ===\n";
  echo "Status: " . $result['code'] . "\n";
  echo "Response: " . json_encode($result['body'], JSON_PRETTY_PRINT) . "\n";
}

// Vérifier si un email de test est fourni
$testEmail = $argv[1] ?? null;
if (!$testEmail) {
  echo "Usage: php test_auth_flows.php your-email@example.com\n";
  exit(1);
}

// Vérifier si l'email est valide
if (!filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
  echo "Erreur: L'adresse email fournie n'est pas valide.\n";
  exit(1);
}

echo "=== Test des flux d'authentification ===\n";
echo "Email de test: $testEmail\n";
echo "API Base URL: $apiBaseUrl\n";
echo "Driver email configuré: " . (getenv('MAIL_DRIVER') ?: 'simulation') . "\n\n";

// 1. Test d'inscription
echo "1. Test d'inscription...\n";
$signupData = [
  'nom' => 'Test',
  'prenom' => 'User',
  'email' => $testEmail,
  'password' => 'Test123456',
  'genre' => 'Autre',
  'date_naissance' => '1990-01-01'
];

$signupResult = makeRequest("$apiBaseUrl/signup.php", 'POST', $signupData);
printResult("Résultat inscription", $signupResult);

// 2. Test de demande de réinitialisation de mot de passe
echo "\n2. Test de demande de réinitialisation de mot de passe...\n";
$forgotData = [
  'email' => $testEmail
];

$forgotResult = makeRequest("$apiBaseUrl/forgot_password.php", 'POST', $forgotData);
printResult("Résultat demande réinitialisation", $forgotResult);

echo "\n=== Instructions pour compléter les tests ===\n";
echo "1. Vérifiez votre boîte de réception ou les logs pour les emails envoyés\n";
echo "2. Pour confirmer l'email, utilisez le lien reçu ou appelez directement:\n";
echo "   $apiBaseUrl/confirm_email.php?token=VOTRE_TOKEN\n";
echo "3. Pour réinitialiser le mot de passe, utilisez le lien reçu ou appelez:\n";
echo "   $apiBaseUrl/reset_password.php avec le token et le nouveau mot de passe\n";

echo "\nNote: Si vous utilisez le mode 'simulation', les emails ne sont pas réellement envoyés.\n";
echo "Vérifiez les logs pour voir les détails des emails simulés.\n";

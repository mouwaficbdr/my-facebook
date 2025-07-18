<?php
// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../lib/cors.php';
handle_cors();

require_once __DIR__ . '/../lib/jwt.php';
require_once __DIR__ . '/../lib/auth_middleware.php';

header('Content-Type: application/json');

// Afficher toutes les informations sur les cookies
$cookies = [];
foreach ($_COOKIE as $name => $value) {
  $cookies[$name] = $value;
}

// Vérifier si l'utilisateur est authentifié
$authenticated = false;
$user = null;

try {
  // Tenter d'authentifier l'utilisateur
  require_auth();
  $authenticated = true;
  $user = $GLOBALS['auth_user'];
} catch (Throwable $e) {
  // L'authentification a échoué
}

// Répondre avec les informations d'authentification
echo json_encode([
  'success' => true,
  'authenticated' => $authenticated,
  'user' => $user,
  'cookies' => $cookies,
  'headers' => getallheaders()
]);

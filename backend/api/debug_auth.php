<?php
// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../lib/cors.php';
handle_cors();

header('Content-Type: application/json');

// Afficher toutes les informations sur les cookies et les headers
$cookies = [];
foreach ($_COOKIE as $name => $value) {
  $cookies[$name] = $value;
}

// Récupérer tous les headers
$headers = [];
foreach (getallheaders() as $name => $value) {
  $headers[$name] = $value;
}

// Récupérer le cookie JWT
$jwt = $_COOKIE['jwt'] ?? null;

// Répondre avec les informations de débogage
echo json_encode([
  'success' => true,
  'cookies' => $cookies,
  'headers' => $headers,
  'jwt_present' => !empty($jwt),
  'request_method' => $_SERVER['REQUEST_METHOD'],
  'request_uri' => $_SERVER['REQUEST_URI'],
  'remote_addr' => $_SERVER['REMOTE_ADDR'],
  'server_name' => $_SERVER['SERVER_NAME'],
  'server_port' => $_SERVER['SERVER_PORT'],
  'http_host' => $_SERVER['HTTP_HOST'] ?? null,
  'http_origin' => $_SERVER['HTTP_ORIGIN'] ?? null,
  'http_referer' => $_SERVER['HTTP_REFERER'] ?? null
]);

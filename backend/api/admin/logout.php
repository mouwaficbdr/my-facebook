<?php
// api/admin/logout.php
// Déconnexion pour le back office

if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../lib/log.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
  exit;
}

// Supprimer le cookie admin
$env = defined('APP_ENV') ? APP_ENV : (getenv('APP_ENV') ?: 'development');
$dev = ($env === 'development' || $env === 'local' || $env === 'dev');

$cookieOptions = [
  'expires' => time() - 3600, // Expirer le cookie
  'path' => '/', // Doit correspondre au path de la pose
  'domain' => '',
  'secure' => !$dev,
  'httponly' => true,
  'samesite' => $dev ? 'Lax' : 'None'
];

setcookie('admin_jwt', '', $cookieOptions);

// Log de déconnexion
log_info('Admin logout', [
  'ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
  'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
]);

http_response_code(200);
echo json_encode([
  'success' => true,
  'message' => 'Déconnexion réussie.'
]);

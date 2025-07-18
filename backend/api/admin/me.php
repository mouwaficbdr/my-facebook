<?php
// api/admin/me.php
// Endpoint pour vérifier l'authentification admin et récupérer les infos utilisateur

if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/admin_middleware.php';
require_once __DIR__ . '/../../lib/log.php';

header('Content-Type: application/json');

// Vérifier l'authentification sans bloquer
$user = authenticate_user();

if (!$user) {
  http_response_code(401);
  echo json_encode(['success' => false, 'message' => 'Non authentifié']);
  exit;
}

// Vérifier que l'utilisateur est admin ou modérateur
try {
  $pdo = getPDO();
  $stmt = $pdo->prepare('SELECT id, nom, prenom, email, role, photo_profil FROM users WHERE id = ? AND role IN (\'admin\', \'moderator\') AND is_active = 1 LIMIT 1');
  $stmt->execute([$user['id']]);
  $admin_user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$admin_user) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Accès refusé. Vous n\'avez pas les droits administrateur.']);
    exit;
  }

  http_response_code(200);
  echo json_encode([
    'success' => true,
    'user' => [
      'id' => $admin_user['id'],
      'nom' => $admin_user['nom'],
      'prenom' => $admin_user['prenom'],
      'email' => $admin_user['email'],
      'role' => $admin_user['role'],
      'photo_profil' => $admin_user['photo_profil']
    ]
  ]);
} catch (Throwable $e) {
  log_error('Admin me.php error', [
    'error' => $e->getMessage(),
    'trace' => $e->getTraceAsString()
  ]);
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
}

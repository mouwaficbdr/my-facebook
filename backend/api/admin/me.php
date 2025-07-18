<?php
// api/admin/me.php - Retourne les infos de l'admin connecté (JWT admin)
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

require_admin();
$currentAdmin = $GLOBALS['admin_user'] ?? null;
if (!$currentAdmin) {
  http_response_code(401);
  echo json_encode(['success' => false, 'message' => 'Authentification admin requise.']);
  exit;
}

try {
  $pdo = getPDO();
  $stmt = $pdo->prepare('SELECT id, nom, prenom, email, role, photo_profil FROM users WHERE id = ? AND is_active = 1 LIMIT 1');
  $stmt->execute([$currentAdmin['user_id']]);
  $admin = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$admin) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Admin non trouvé.']);
    exit;
  }
  http_response_code(200);
  echo json_encode(['success' => true, 'admin' => $admin]);
} catch (Throwable $e) {
  log_error('Admin me API error', ['error' => $e->getMessage()]);
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
} 
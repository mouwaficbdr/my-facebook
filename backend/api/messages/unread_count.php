<?php
// api/messages/unread_count.php
// Récupère le nombre total de messages non lus pour l'utilisateur connecté

if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/jwt.php';
require_once __DIR__ . '/../../lib/log.php';

handle_cors();
header('Content-Type: application/json');

// Vérification authentification
$user = verify_jwt();
if (!$user) {
  http_response_code(401);
  echo json_encode(['success' => false, 'message' => 'Non authentifié.']);
  exit;
}

try {
  $pdo = getPDO();
  $userId = $user['user_id'];

  // Compter les messages non lus
  $stmt = $pdo->prepare("
        SELECT COUNT(*) as unread_count
        FROM messages 
        WHERE receiver_id = ? AND is_read = 0
    ");
  $stmt->execute([$userId]);
  $result = $stmt->fetch(PDO::FETCH_ASSOC);

  http_response_code(200);
  echo json_encode([
    'success' => true,
    'data' => [
      'unread_count' => (int)$result['unread_count']
    ]
  ]);
} catch (Throwable $e) {
  log_error('Unread count error', [
    'user_id' => $user['user_id'] ?? null,
    'error' => $e->getMessage()
  ]);

  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Erreur lors du comptage des messages.'
  ]);
}

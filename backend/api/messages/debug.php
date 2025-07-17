<?php
// Debug endpoint pour tester la messagerie
require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/jwt.php';

handle_cors();
header('Content-Type: application/json');

try {
  // Test authentification
  $user = verify_jwt();
  if (!$user) {
    echo json_encode([
      'success' => false,
      'message' => 'Non authentifié',
      'debug' => 'JWT non valide ou absent'
    ]);
    exit;
  }

  // Test connexion DB
  $pdo = getPDO();

  // Test table messages
  $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM messages");
  $stmt->execute();
  $messageCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

  // Test compteur non lus
  $stmt = $pdo->prepare("SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = ? AND is_read = 0");
  $stmt->execute([$user['user_id']]);
  $unreadCount = $stmt->fetch(PDO::FETCH_ASSOC)['unread_count'];

  echo json_encode([
    'success' => true,
    'debug' => [
      'user' => $user,
      'total_messages' => (int)$messageCount,
      'unread_messages' => (int)$unreadCount,
      'database' => 'OK',
      'jwt' => 'OK'
    ]
  ]);
} catch (Exception $e) {
  echo json_encode([
    'success' => false,
    'error' => $e->getMessage(),
    'file' => $e->getFile(),
    'line' => $e->getLine()
  ]);
}

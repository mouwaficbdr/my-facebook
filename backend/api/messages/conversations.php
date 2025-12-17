<?php
// api/messages/conversations.php
// Récupère la liste des conversations de l'utilisateur connecté

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

  // Récupérer les conversations avec le dernier message
  $stmt = $pdo->prepare("
        SELECT DISTINCT
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END as friend_id,
            u.nom,
            u.prenom,
            u.photo_profil,
            last_msg.contenu as last_message,
            last_msg.created_at as last_message_time,
            last_msg.sender_id as last_sender_id,
            COALESCE(unread_count.count, 0) as unread_count
        FROM messages m
        INNER JOIN users u ON (
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id = u.id
                ELSE m.sender_id = u.id
            END
        )
        INNER JOIN (
            SELECT 
                CASE 
                    WHEN sender_id = ? THEN receiver_id 
                    ELSE sender_id 
                END as friend_id,
                MAX(created_at) as max_time
            FROM messages 
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY friend_id
        ) latest ON (
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END = latest.friend_id 
            AND m.created_at = latest.max_time
        )
        LEFT JOIN messages last_msg ON (
            last_msg.created_at = latest.max_time
            AND (
                (last_msg.sender_id = ? AND last_msg.receiver_id = latest.friend_id)
                OR (last_msg.receiver_id = ? AND last_msg.sender_id = latest.friend_id)
            )
        )
        LEFT JOIN (
            SELECT sender_id, COUNT(*) as count
            FROM messages 
            WHERE receiver_id = ? AND is_read = false
            GROUP BY sender_id
        ) unread_count ON unread_count.sender_id = u.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY last_msg.created_at DESC
    ");

  $userId = $user['user_id'];
  $stmt->execute([
    $userId,
    $userId,
    $userId,
    $userId,
    $userId,
    $userId,
    $userId,
    $userId,
    $userId,
    $userId,
    $userId
  ]);

  $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Formater les données
  $formattedConversations = array_map(function ($conv) {
    return [
      'friend_id' => (int)$conv['friend_id'],
      'nom' => $conv['nom'],
      'prenom' => $conv['prenom'],
      'photo_profil' => $conv['photo_profil'],
      'last_message' => $conv['last_message'],
      'last_message_time' => $conv['last_message_time'],
      'last_sender_id' => (int)$conv['last_sender_id'],
      'unread_count' => (int)$conv['unread_count'],
      'last_message_formatted' => date('H:i', strtotime($conv['last_message_time']))
    ];
  }, $conversations);

  http_response_code(200);
  echo json_encode([
    'success' => true,
    'data' => [
      'conversations' => $formattedConversations,
      'total' => count($formattedConversations)
    ]
  ]);
} catch (Throwable $e) {
  log_error('Messages conversations error', [
    'user_id' => $user['user_id'] ?? null,
    'error' => $e->getMessage()
  ]);

  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Erreur lors du chargement des conversations.'
  ]);
}

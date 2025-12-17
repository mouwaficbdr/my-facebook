<?php
// api/messages/list.php
// Récupère les messages d'une conversation entre deux utilisateurs

if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/jwt.php';
require_once __DIR__ . '/../../lib/validation.php';
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

// Récupération des paramètres
$friendId = $_GET['friend_id'] ?? null;
$offset = (int)($_GET['offset'] ?? 0);
$limit = min((int)($_GET['limit'] ?? 20), 50); // Max 50 messages par requête

// Validation
if (!$friendId || !is_numeric($friendId)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'ID ami requis.']);
  exit;
}

try {
  $pdo = getPDO();
  $userId = $user['user_id'];
  $friendId = (int)$friendId;

  // Vérifier que l'ami existe et est bien ami
  $stmt = $pdo->prepare("
        SELECT u.id, u.nom, u.prenom, u.photo_profil
        FROM users u
        INNER JOIN friendships f ON (
            (f.user_id = ? AND f.friend_id = u.id) OR 
            (f.friend_id = ? AND f.user_id = u.id)
        )
        WHERE u.id = ? AND f.status = 'accepted'
    ");
  $stmt->execute([$userId, $userId, $friendId]);
  $friend = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$friend) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Utilisateur non autorisé.']);
    exit;
  }

  // Récupérer les messages
  $stmt = $pdo->prepare("
        SELECT 
            m.id,
            m.sender_id,
            m.receiver_id,
            m.contenu,
            m.type,
            m.is_read,
            m.created_at,
            u.nom as sender_nom,
            u.prenom as sender_prenom,
            u.photo_profil as sender_photo
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE (
            (m.sender_id = ? AND m.receiver_id = ?) OR 
            (m.sender_id = ? AND m.receiver_id = ?)
        )
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    ");

  $stmt->execute([$userId, $friendId, $friendId, $userId, $limit, $offset]);
  $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Compter le total
  $stmt = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM messages 
        WHERE (
            (sender_id = ? AND receiver_id = ?) OR 
            (sender_id = ? AND receiver_id = ?)
        )
    ");
  $stmt->execute([$userId, $friendId, $friendId, $userId]);
  $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

  // Marquer les messages reçus comme lus
  $stmt = $pdo->prepare("
        UPDATE messages 
        SET is_read = true 
        WHERE sender_id = ? AND receiver_id = ? AND is_read = false
    ");
  $stmt->execute([$friendId, $userId]);

  // Formater les messages
  $formattedMessages = array_map(function ($msg) use ($userId) {
    return [
      'id' => (int)$msg['id'],
      'sender_id' => (int)$msg['sender_id'],
      'receiver_id' => (int)$msg['receiver_id'],
      'contenu' => $msg['contenu'],
      'type' => $msg['type'],
      'is_read' => (bool)$msg['is_read'],
      'created_at' => $msg['created_at'],
      'created_at_formatted' => date('H:i', strtotime($msg['created_at'])),
      'is_mine' => (int)$msg['sender_id'] === $userId,
      'sender' => [
        'nom' => $msg['sender_nom'],
        'prenom' => $msg['sender_prenom'],
        'photo_profil' => $msg['sender_photo']
      ]
    ];
  }, $messages);

  // Inverser l'ordre pour avoir les plus anciens en premier
  $formattedMessages = array_reverse($formattedMessages);

  http_response_code(200);
  echo json_encode([
    'success' => true,
    'data' => [
      'messages' => $formattedMessages,
      'friend' => $friend,
      'pagination' => [
        'offset' => $offset,
        'limit' => $limit,
        'total' => (int)$total,
        'has_next' => ($offset + $limit) < $total
      ]
    ]
  ]);
} catch (Throwable $e) {
  log_error('Messages list error', [
    'user_id' => $user['user_id'] ?? null,
    'friend_id' => $friendId ?? null,
    'error' => $e->getMessage()
  ]);

  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Erreur lors du chargement des messages.'
  ]);
}

<?php
// api/messages/send.php
// Envoie un nouveau message

if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/jwt.php';
require_once __DIR__ . '/../../lib/validation.php';
require_once __DIR__ . '/../../lib/rate_limit.php';
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

// Rate limiting
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!rate_limit_check('send_message', $ip, 30, 60)) { // 30 messages par minute max
  http_response_code(429);
  echo json_encode([
    'success' => false,
    'message' => 'Trop de messages envoyés, ralentissez.'
  ]);
  exit;
}

// Parsing JSON
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Données invalides.']);
  exit;
}

// Validation
$rules = [
  'receiver_id' => ['required', 'numeric'],
  'contenu' => ['required', 'string', 'max:1000'],
  'type' => ['in:text,image']
];

$errors = validate($input, $rules);
if ($errors) {
  http_response_code(400);
  echo json_encode(['success' => false, 'errors' => $errors]);
  exit;
}

try {
  $pdo = getPDO();
  $userId = $user['user_id'];
  $receiverId = (int)$input['receiver_id'];
  $contenu = trim($input['contenu']);
  $type = $input['type'] ?? 'text';

  // Vérifier que le destinataire existe et est ami
  $stmt = $pdo->prepare("
        SELECT u.id, u.nom, u.prenom
        FROM users u
        INNER JOIN friendships f ON (
            (f.user_id = ? AND f.friend_id = u.id) OR 
            (f.friend_id = ? AND f.user_id = u.id)
        )
        WHERE u.id = ? AND f.status = 'accepted'
    ");
  $stmt->execute([$userId, $userId, $receiverId]);
  $receiver = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$receiver) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Destinataire non autorisé.']);
    exit;
  }

  // Insérer le message
  $stmt = $pdo->prepare("
        INSERT INTO messages (sender_id, receiver_id, contenu, type, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
  $stmt->execute([$userId, $receiverId, $contenu, $type]);

  $messageId = $pdo->lastInsertId();

  // Récupérer le message créé avec les infos du sender
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
        WHERE m.id = ?
    ");
  $stmt->execute([$messageId]);
  $message = $stmt->fetch(PDO::FETCH_ASSOC);

  // Créer une notification pour le destinataire
  try {
    $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, from_user_id, type, title, message, data, created_at)
            VALUES (?, ?, 'message', ?, ?, ?, NOW())
        ");

    $notifTitle = "Nouveau message";
    $notifMessage = $user['prenom'] . " " . $user['nom'] . " vous a envoyé un message";
    $notifData = json_encode([
      'message_id' => $messageId,
      'sender_id' => $userId,
      'conversation_id' => $receiverId
    ]);

    $stmt->execute([$receiverId, $userId, $notifTitle, $notifMessage, $notifData]);
  } catch (Exception $e) {
    // Log l'erreur mais ne pas faire échouer l'envoi du message
    log_error('Notification creation failed', ['error' => $e->getMessage()]);
  }

  // Formater la réponse
  $formattedMessage = [
    'id' => (int)$message['id'],
    'sender_id' => (int)$message['sender_id'],
    'receiver_id' => (int)$message['receiver_id'],
    'contenu' => $message['contenu'],
    'type' => $message['type'],
    'is_read' => (bool)$message['is_read'],
    'created_at' => $message['created_at'],
    'created_at_formatted' => date('H:i', strtotime($message['created_at'])),
    'is_mine' => true,
    'sender' => [
      'nom' => $message['sender_nom'],
      'prenom' => $message['sender_prenom'],
      'photo_profil' => $message['sender_photo']
    ]
  ];

  http_response_code(201);
  echo json_encode([
    'success' => true,
    'message' => 'Message envoyé.',
    'data' => [
      'message' => $formattedMessage,
      'receiver' => $receiver
    ]
  ]);
} catch (Throwable $e) {
  log_error('Send message error', [
    'user_id' => $user['user_id'] ?? null,
    'receiver_id' => $receiverId ?? null,
    'error' => $e->getMessage()
  ]);

  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Erreur lors de l\'envoi du message.'
  ]);
}

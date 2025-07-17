<?php
// api/messages/delete.php
// Supprime un message (propriétaire uniquement)

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

// Parsing JSON
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Données invalides.']);
  exit;
}

// Validation
$rules = [
  'message_id' => ['required', 'numeric']
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
  $messageId = (int)$input['message_id'];

  // Vérifier que le message existe et appartient à l'utilisateur
  $stmt = $pdo->prepare("
        SELECT id, sender_id, contenu, type, receiver_id
        FROM messages 
        WHERE id = ? AND sender_id = ?
    ");
  $stmt->execute([$messageId, $userId]);
  $message = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$message) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Message non trouvé ou non autorisé.']);
    exit;
  }

  // Si c'est une image, supprimer le fichier physique
  if ($message['type'] === 'image' && $message['contenu']) {
    $imagePath = __DIR__ . '/../../' . $message['contenu'];
    if (file_exists($imagePath)) {
      unlink($imagePath);
    }
  }

  // Supprimer le message de la base de données
  $stmt = $pdo->prepare("DELETE FROM messages WHERE id = ?");
  $stmt->execute([$messageId]);

  http_response_code(200);
  echo json_encode([
    'success' => true,
    'message' => 'Message supprimé.',
    'data' => [
      'message_id' => $messageId,
      'receiver_id' => $message['receiver_id']
    ]
  ]);
} catch (Throwable $e) {
  log_error('Delete message error', [
    'user_id' => $user['user_id'] ?? null,
    'message_id' => $messageId ?? null,
    'error' => $e->getMessage()
  ]);

  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Erreur lors de la suppression du message.'
  ]);
}

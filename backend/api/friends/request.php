<?php
// api/friends/request.php - Envoyer une demande d'ami
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}
require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
header('Content-Type: application/json');
require_auth();
$user = $GLOBALS['auth_user'];
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}
$input = json_decode(file_get_contents('php://input'), true);
$friendId = isset($input['friend_id']) ? intval($input['friend_id']) : 0;
if ($friendId <= 0 || $friendId == $user['id']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID cible invalide.']);
    exit;
}
try {
    $pdo = getPDO();
    // Vérifier si déjà amis ou demande existante
    $check = $pdo->prepare("SELECT status FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)");
    $check->execute([$user['id'], $friendId, $friendId, $user['id']]);
    $row = $check->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        if ($row['status'] === 'accepted') {
            echo json_encode(['success' => false, 'message' => 'Déjà amis.', 'friend_status' => 'friends']);
            exit;
        } elseif ($row['status'] === 'pending') {
            echo json_encode(['success' => false, 'message' => 'Demande déjà en attente.', 'friend_status' => 'request_sent']);
            exit;
        }
    }
    // Créer la demande
    $stmt = $pdo->prepare("INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES (?, ?, 'pending', NOW())");
    $stmt->execute([$user['user_id'], $friendId]);
    echo json_encode(['success' => true, 'message' => 'Demande envoyée.', 'friend_status' => 'request_sent']);
    exit;
} catch (Throwable $e) {
    require_once __DIR__ . '/../../lib/log.php';
    log_error('friend_request_error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'user' => $user,
        'friendId' => $friendId,
        'input' => $input,
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la demande.', 'error' => $e->getMessage()]);
    exit;
} 
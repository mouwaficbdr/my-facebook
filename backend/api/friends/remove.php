<?php
// api/friends/remove.php - Retirer un ami ou annuler une demande
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
    // Supprimer la relation (accepted ou pending dans les deux sens)
    $stmt = $pdo->prepare("DELETE FROM friendships WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND (status = 'accepted' OR status = 'pending')");
    $stmt->execute([$user['id'], $friendId, $friendId, $user['id']]);
    echo json_encode(['success' => true, 'message' => 'Relation supprimée.', 'friend_status' => 'not_friends']);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression.', 'error' => $e->getMessage()]);
    exit;
} 
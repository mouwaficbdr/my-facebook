<?php
// api/friends/refuse.php - Refuser une demande d'ami
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
if ($friendId <= 0 || $friendId == $user['user_id']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID cible invalide.']);
    exit;
}
try {
    $pdo = getPDO();
    // Vérifier qu'une demande existe et est bien reçue
    $check = $pdo->prepare("SELECT status FROM friendships WHERE user_id = ? AND friend_id = ? AND status = 'pending'");
    $check->execute([$friendId, $user['user_id']]);
    $row = $check->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Aucune demande à refuser.', 'friend_status' => 'not_friends']);
        exit;
    }
    // Supprimer la demande
    $stmt = $pdo->prepare("DELETE FROM friendships WHERE user_id = ? AND friend_id = ? AND status = 'pending'");
    $stmt->execute([$friendId, $user['user_id']]);
    echo json_encode(['success' => true, 'message' => 'Demande refusée.', 'friend_status' => 'not_friends']);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du refus.', 'error' => $e->getMessage()]);
    exit;
} 
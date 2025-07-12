<?php
// api/friends/list.php - Liste des amis d'un utilisateur
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
$currentUser = $GLOBALS['auth_user'];

$userId = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID utilisateur invalide.']);
    exit;
}

// Vérifier que l'utilisateur cible existe et est actif
try {
    $pdo = getPDO();
    $userCheck = $pdo->prepare("SELECT id FROM users WHERE id = ? AND is_active = 1 AND email_confirmed = 1 LIMIT 1");
    $userCheck->execute([$userId]);
    $userExists = $userCheck->fetchColumn();
    if (!$userExists) {
        http_response_code(200);
        echo json_encode(['success' => true, 'friends' => []]);
        exit;
    }
    // Récupérer tous les amis (accepted dans les deux sens)
    $query = "
        SELECT u.id, u.nom, u.prenom, u.photo_profil
        FROM users u
        JOIN friendships f ON (
            (f.user_id = :uid AND f.friend_id = u.id)
            OR (f.friend_id = :uid AND f.user_id = u.id)
        )
        WHERE f.status = 'accepted' AND u.is_active = 1 AND u.email_confirmed = 1
    ";
    $stmt = $pdo->prepare($query);
    $stmt->execute(['uid' => $userId]);
    $friends = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($friends as &$friend) {
        $friend['id'] = intval($friend['id']);
    }
    http_response_code(200);
    echo json_encode(['success' => true, 'friends' => $friends]);
    exit;
} catch (Throwable $e) {
    http_response_code(200);
    echo json_encode(['success' => true, 'friends' => []]);
    exit;
} 
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
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;
    // Récupérer le nombre total d'amis
    $countQuery = "
        SELECT COUNT(*)
        FROM users u
        JOIN friendships f ON (
            (f.user_id = :uid AND f.friend_id = u.id)
            OR (f.friend_id = :uid AND f.user_id = u.id)
        )
        WHERE f.status = 'accepted' AND u.is_active = 1 AND u.email_confirmed = 1
    ";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute(['uid' => $userId]);
    $total = intval($countStmt->fetchColumn());
    $total_pages = $limit > 0 ? (int)ceil($total / $limit) : 1;
    // Récupérer les amis paginés
    $query = "
        SELECT u.id, u.nom, u.prenom, u.photo_profil
        FROM users u
        JOIN friendships f ON (
            (f.user_id = :uid AND f.friend_id = u.id)
            OR (f.friend_id = :uid AND f.user_id = u.id)
        )
        WHERE f.status = 'accepted' AND u.is_active = 1 AND u.email_confirmed = 1
        ORDER BY u.prenom, u.nom
        LIMIT :limit OFFSET :offset
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindValue('uid', $userId, PDO::PARAM_INT);
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $friends = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($friends as &$friend) {
        $friend['id'] = intval($friend['id']);
    }
    $pagination = [
        'current_page' => $page,
        'per_page' => $limit,
        'total' => $total,
        'total_pages' => $total_pages,
        'has_next' => $page < $total_pages,
        'has_prev' => $page > 1,
    ];
    http_response_code(200);
    echo json_encode(['success' => true, 'friends' => $friends, 'pagination' => $pagination]);
    exit;
} catch (Throwable $e) {
    http_response_code(200);
    echo json_encode(['success' => true, 'friends' => []]);
    exit;
} 
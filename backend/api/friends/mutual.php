<?php
// api/friends/mutual.php - Liste détaillée des amis en commun
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

$otherId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
if ($otherId <= 0 || $otherId == $user['user_id']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID cible invalide.']);
    exit;
}

$limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 50;
$offset = isset($_GET['offset']) ? max(0, intval($_GET['offset'])) : 0;

try {
    $pdo = getPDO();
    // Mutual friends : intersection des amis acceptés des deux users (MySQL compatible)
    $query = "
        SELECT u.id, u.nom, u.prenom, u.photo_profil
        FROM users u
        WHERE u.id IN (
            SELECT my_friends.friend_id FROM (
                SELECT CASE WHEN f1.user_id = :me1 THEN f1.friend_id ELSE f1.user_id END AS friend_id
                FROM friendships f1
                WHERE (f1.user_id = :me2 OR f1.friend_id = :me3) AND f1.status = 'accepted'
            ) AS my_friends
            INNER JOIN (
                SELECT CASE WHEN f2.user_id = :other1 THEN f2.friend_id ELSE f2.user_id END AS friend_id
                FROM friendships f2
                WHERE (f2.user_id = :other2 OR f2.friend_id = :other3) AND f2.status = 'accepted'
            ) AS other_friends
            ON my_friends.friend_id = other_friends.friend_id
        )
        AND u.is_active = 1 AND u.email_confirmed = 1
        ORDER BY u.prenom, u.nom
        LIMIT :limit OFFSET :offset
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindValue('me1', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('me2', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('me3', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('other1', $otherId, PDO::PARAM_INT);
    $stmt->bindValue('other2', $otherId, PDO::PARAM_INT);
    $stmt->bindValue('other3', $otherId, PDO::PARAM_INT);
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $mutuals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($mutuals as &$m) {
        $m['id'] = intval($m['id']);
    }
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'mutual_friends' => $mutuals,
        'count' => count($mutuals)
    ]);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement des amis en commun.']);
    exit;
} 
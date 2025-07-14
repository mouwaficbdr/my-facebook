<?php
// api/friends/received.php - Liste des demandes d'amis reçues
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

$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
$offset = ($page - 1) * $limit;

try {
    $pdo = getPDO();
    // Nombre total de demandes reçues
    $countQuery = "SELECT COUNT(*) FROM friendships WHERE friend_id = :me AND status = 'pending'";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute(['me' => $user['user_id']]);
    $total = intval($countStmt->fetchColumn());
    $total_pages = $limit > 0 ? (int)ceil($total / $limit) : 1;

    // Récupérer les demandes reçues paginées
    $query = "
        SELECT f.user_id AS sender_id, f.created_at,
               u.nom, u.prenom, u.photo_profil
        FROM friendships f
        JOIN users u ON u.id = f.user_id
        WHERE f.friend_id = :me AND f.status = 'pending'
        ORDER BY f.created_at DESC
        LIMIT :limit OFFSET :offset
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindValue('me', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Pour chaque demandeur, calculer le nombre d'amis en commun
    foreach ($requests as &$req) {
        $senderId = intval($req['sender_id']);
        // Mutual friends count
        $mutualQuery = "
            SELECT COUNT(*) FROM (
                SELECT CASE WHEN f1.user_id = :me THEN f1.friend_id ELSE f1.user_id END AS friend_id
                FROM friendships f1
                WHERE (f1.user_id = :me OR f1.friend_id = :me) AND f1.status = 'accepted'
                INTERSECT
                SELECT CASE WHEN f2.user_id = :sender THEN f2.friend_id ELSE f2.user_id END AS friend_id
                FROM friendships f2
                WHERE (f2.user_id = :sender OR f2.friend_id = :sender) AND f2.status = 'accepted'
            ) AS mutuals
        ";
        $mutualStmt = $pdo->prepare($mutualQuery);
        $mutualStmt->execute(['me' => $user['user_id'], 'sender' => $senderId]);
        $req['mutual_friends_count'] = intval($mutualStmt->fetchColumn());
        $req['sender_id'] = $senderId;
        unset($req['user_id']);
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
    echo json_encode([
        'success' => true,
        'requests' => $requests,
        'pagination' => $pagination
    ]);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement des demandes.', 'error' => $e->getMessage()]);
    exit;
} 
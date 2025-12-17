<?php
// api/notifications.php - Liste des notifications de l'utilisateur connecté (premium)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}
require_once __DIR__ . '/../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/auth_middleware.php';
header('Content-Type: application/json');
require_auth();
$user = $GLOBALS['auth_user'];
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}
$page = max(1, intval($_GET['page'] ?? 1));
$limit = min(30, max(1, intval($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;
$unreadOnly = isset($_GET['unread']) && $_GET['unread'] == '1';
try {
    $pdo = getPDO();
    // Compter le total
    if ($unreadOnly) {
        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = false');
        $countStmt->execute([$user['user_id']]);
    } else {
        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ?');
        $countStmt->execute([$user['user_id']]);
    }
    $total = (int)$countStmt->fetchColumn();
    // Récupérer les notifications (non lues d'abord, puis plus récentes)
    if ($unreadOnly) {
        $stmt = $pdo->prepare("SELECT id, type, data, is_read, created_at FROM notifications WHERE user_id = ? AND is_read = false ORDER BY created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute([$user['user_id']]);
    } else {
        $stmt = $pdo->prepare("SELECT id, type, data, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY is_read ASC, created_at DESC LIMIT $limit OFFSET $offset");
        $stmt->execute([$user['user_id']]);
    }
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Formatage
    foreach ($notifications as &$n) {
        $n['is_read'] = (bool)$n['is_read'];
        $n['data'] = $n['data'] ? json_decode($n['data'], true) : null;
    }
    echo json_encode([
        'success' => true,
        'data' => [
            'notifications' => $notifications,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'has_next' => ($offset + $limit) < $total
            ]
        ]
    ]);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur', 'error' => $e->getMessage()]);
    exit;
} 
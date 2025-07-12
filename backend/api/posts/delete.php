<?php
// api/posts/delete.php - Supprimer un post (propriétaire uniquement)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}
require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
require_once __DIR__ . '/../../lib/log.php';
header('Content-Type: application/json');

require_auth();
$user = $GLOBALS['auth_user'];
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$post_id = isset($input['post_id']) ? intval($input['post_id']) : 0;
if ($post_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de post invalide.']);
    exit;
}

try {
    $pdo = getPDO();
    // Vérifier que le post appartient à l'utilisateur
    $stmt = $pdo->prepare('SELECT id FROM posts WHERE id = ? AND user_id = ?');
    $stmt->execute([$post_id, $user['user_id']]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Action interdite.']);
        exit;
    }
    // Supprimer likes, comments, saved_posts liés
    $pdo->prepare('DELETE FROM likes WHERE post_id = ?')->execute([$post_id]);
    $pdo->prepare('DELETE FROM comments WHERE post_id = ?')->execute([$post_id]);
    $pdo->prepare('DELETE FROM saved_posts WHERE post_id = ?')->execute([$post_id]);
    // Supprimer le post
    $pdo->prepare('DELETE FROM posts WHERE id = ?')->execute([$post_id]);
    echo json_encode(['success' => true, 'message' => 'Post supprimé.']);
    exit;
} catch (Throwable $e) {
    log_error('Delete post error', ['error' => $e->getMessage(), 'user_id' => $user['user_id'], 'post_id' => $post_id]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du post.']);
    exit;
} 
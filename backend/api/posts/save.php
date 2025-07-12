<?php
// api/posts/save.php - Enregistrer/désenregistrer un post
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
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

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
$post_id = isset($input['post_id']) ? intval($input['post_id']) : 0;
if ($post_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de post invalide.']);
    exit;
}

try {
    $pdo = getPDO();
    // Vérifier que le post existe
    $stmt = $pdo->prepare('SELECT id FROM posts WHERE id = ?');
    $stmt->execute([$post_id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Post introuvable.']);
        exit;
    }
    if ($method === 'POST') {
        // Empêcher les doublons
        $check = $pdo->prepare('SELECT 1 FROM saved_posts WHERE user_id = ? AND post_id = ?');
        $check->execute([$user['user_id'], $post_id]);
        if ($check->fetch()) {
            echo json_encode(['success' => true, 'message' => 'Déjà enregistré.']);
            exit;
        }
        $insert = $pdo->prepare('INSERT INTO saved_posts (user_id, post_id, created_at) VALUES (?, ?, NOW())');
        $insert->execute([$user['user_id'], $post_id]);
        echo json_encode(['success' => true, 'message' => 'Post enregistré.']);
        exit;
    } elseif ($method === 'DELETE') {
        $delete = $pdo->prepare('DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?');
        $delete->execute([$user['user_id'], $post_id]);
        echo json_encode(['success' => true, 'message' => 'Post désenregistré.']);
        exit;
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
        exit;
    }
} catch (Throwable $e) {
    log_error('Save post error', ['error' => $e->getMessage(), 'user_id' => $user['user_id'], 'post_id' => $post_id]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement du post.']);
    exit;
} 
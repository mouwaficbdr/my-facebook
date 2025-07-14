<?php
// api/upload/cover_delete.php - Suppression de la cover utilisateur
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
$currentUser = $GLOBALS['auth_user'];
if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
    exit;
}
try {
    $pdo = getPDO();
    $userId = intval($currentUser['user_id']);
    // Récupérer l'URL actuelle de la cover
    $stmt = $pdo->prepare('SELECT cover_url FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || empty($row['cover_url'])) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Aucune cover à supprimer.']);
        exit;
    }
    $coverPath = $row['cover_url'];
    // Supprimer le fichier physique si présent
    $filePath = __DIR__ . '/../../' . $coverPath;
    if (is_file($filePath)) {
        @unlink($filePath);
    }
    // Mettre à jour la BDD
    $stmt = $pdo->prepare('UPDATE users SET cover_url = NULL, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$userId]);
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Cover supprimée.']);
    exit;
} catch (Throwable $e) {
    log_error('Cover delete error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'currentUser' => $currentUser
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression.', 'error' => $e->getMessage()]);
    exit;
} 
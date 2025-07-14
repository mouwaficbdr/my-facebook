<?php
// api/upload/cover.php - Upload de la photo de couverture utilisateur
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
if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Aucun fichier uploadé.']);
    exit;
}
$file = $_FILES['file'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
$maxSize = 5 * 1024 * 1024; // 5 Mo
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé.']);
    exit;
}
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Fichier trop volumineux (max 5 Mo).']);
    exit;
}
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$userId = intval($currentUser['user_id']);

// Nettoyage : supprimer l'ancienne cover si elle existe
try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT cover_url FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && !empty($row['cover_url'])) {
        $oldPath = __DIR__ . '/../../' . $row['cover_url'];
        if (is_file($oldPath)) {
            @unlink($oldPath);
        }
    }
} catch (Throwable $e) {
    // On logue mais on ne bloque pas l'upload si l'ancien fichier n'est pas supprimé
    log_error('Cover old image cleanup error', [
        'error' => $e->getMessage(),
        'userId' => $userId
    ]);
}
$filename = $userId . '_' . time() . '.' . $ext;
$uploadDir = __DIR__ . '/../../uploads/cover/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}
$destPath = $uploadDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de l’enregistrement du fichier.']);
    exit;
}
// Mettre à jour la base de données
try {
    $pdo = getPDO();
    $url = 'uploads/cover/' . $filename;
    $stmt = $pdo->prepare('UPDATE users SET cover_url = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$url, $userId]);
    http_response_code(200);
    echo json_encode(['success' => true, 'url' => $url]);
    exit;
} catch (Throwable $e) {
    log_error('Cover upload error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'currentUser' => $currentUser
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour.', 'error' => $e->getMessage()]);
    exit;
} 
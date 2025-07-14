<?php
// api/users/me.php - Profil de l'utilisateur connecté
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

// Authentification JWT obligatoire
require_auth();
$currentUser = $GLOBALS['auth_user'];
if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}

try {
    $pdo = getPDO();
    $userId = intval($currentUser['user_id']);
    $userQuery = "SELECT id, nom, prenom, bio, photo_profil, cover_url, ville, pays, date_naissance FROM users WHERE id = ? AND is_active = 1 AND email_confirmed = 1 LIMIT 1";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé.']);
        exit;
    }
    // Nombre d'amis
    $friendsQuery = "SELECT COUNT(*) as total FROM friendships WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'";
    $friendsStmt = $pdo->prepare($friendsQuery);
    $friendsStmt->execute([$userId, $userId]);
    $user['friends_count'] = intval($friendsStmt->fetchColumn());

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'user' => $user
        ]
    ]);
    exit;
} catch (Throwable $e) {
    log_error('Me error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'currentUser' => $currentUser
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement du profil.', 'error' => $e->getMessage()]);
    exit;
} 
<?php
// api/users/change_password.php - Changement de mot de passe pour l'utilisateur connecté
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
require_once __DIR__ . '/../../lib/validation.php';
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

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Entrée JSON invalide.']);
    exit;
}

$oldPassword = $input['old_password'] ?? '';
$newPassword = $input['new_password'] ?? '';
$confirmPassword = $input['confirm_password'] ?? '';

if (!$oldPassword || !$newPassword || !$confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tous les champs sont obligatoires.']);
    exit;
}

if ($newPassword !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La confirmation ne correspond pas au nouveau mot de passe.']);
    exit;
}

// Validation de la force du mot de passe (utilise la même logique que signup/reset)
$validation = validate([
    'password' => $newPassword
], [
    'password' => ['required', 'min:8', 'max:64', 'password']
]);
if (isset($validation['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $validation['password']]);
    exit;
}

try {
    $pdo = getPDO();
    $userId = intval($currentUser['user_id']);
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ? AND is_active = 1 AND email_confirmed = 1 LIMIT 1');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé.']);
        exit;
    }
    if (!password_verify($oldPassword, $user['password_hash'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ancien mot de passe incorrect.']);
        exit;
    }
    // Si le nouveau mot de passe est identique à l'ancien
    if (password_verify($newPassword, $user['password_hash'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Le nouveau mot de passe doit être différent de l\'ancien.']);
        exit;
    }
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $update = $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
    $update->execute([$hash, $userId]);
    // Optionnel : Invalider les anciens tokens JWT ici si implémenté
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Mot de passe modifié avec succès.']);
    exit;
} catch (Throwable $e) {
    log_error('Change password error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'currentUser' => $currentUser
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur lors du changement de mot de passe.']);
    exit;
} 
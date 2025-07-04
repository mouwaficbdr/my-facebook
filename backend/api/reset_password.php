<?php
// backend/api/reset_password.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../lib/validation.php';
require_once __DIR__ . '/../lib/log.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$token = isset($input['token']) ? trim($input['token']) : '';
$password = isset($input['password']) ? $input['password'] : '';
$password_confirm = isset($input['password_confirm']) ? $input['password_confirm'] : '';

// 1. Validation des inputs
$errors = [];
if (!$token || !preg_match('/^[a-f0-9]{64}$/', $token)) {
    $errors['token'] = 'Lien de réinitialisation invalide ou expiré.';
}
if (!$password || !$password_confirm) {
    $errors['password'] = 'Mot de passe requis.';
} elseif ($password !== $password_confirm) {
    $errors['password'] = 'Les mots de passe ne correspondent pas.';
}
// Règles de sécurité du mot de passe
$pwErrors = validate(['password' => $password], ['password' => ['required', 'min:8', 'max:64', 'password']]);
if ($pwErrors) {
    $errors['password'] = $pwErrors['password'];
}
if ($errors) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE reset_password_token = ? AND reset_token_expiry > NOW() LIMIT 1');
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    if (!$user) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Lien de réinitialisation invalide ou expiré.'
        ]);
        exit;
    }
    // Hashage et mise à jour du mot de passe, suppression du token
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_token_expiry = NULL WHERE id = ?');
    $stmt->execute([$hash, $user['id']]);
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Votre mot de passe a été réinitialisé avec succès.'
    ]);
} catch (Throwable $e) {
    log_error('DB error (reset password)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
}

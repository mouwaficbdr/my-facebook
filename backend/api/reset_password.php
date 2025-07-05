<?php
// api/reset_password.php
header('Access-Control-Allow-Origin: https://my-facebook-by-mouwafic.vercel.app');
header('Access-Control-Allow-Credentials: true');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../lib/validation.php';
require_once __DIR__ . '/../lib/log.php';

header('Content-Type: application/json');

// 1. Parsing JSON POST
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Requête invalide (JSON attendu).']);
    exit;
}

// 2. Validation token et nouveau mot de passe
$rules = [
    'token' => ['required'],
    'password' => ['required', 'min:8', 'max:64', 'password']
];
$errors = validate($input, $rules);
if ($errors) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// 3. Validation format token
if (!preg_match('/^[a-f0-9]{64}$/', $input['token'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token invalide.']);
    exit;
}

// 4. Recherche utilisateur avec token valide
try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1');
    $stmt->execute([$input['token']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    log_error('DB error (reset password)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 5. Vérification utilisateur
if (!$user) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token invalide ou expiré.']);
    exit;
}

// 6. Hashage nouveau mot de passe
$hash = password_hash($input['password'], PASSWORD_BCRYPT);

// 7. Mise à jour mot de passe et nettoyage token
try {
    $stmt = $pdo->prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?');
    $stmt->execute([$hash, $user['id']]);
} catch (Throwable $e) {
    log_error('DB error (update password)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 8. Réponse succès
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Mot de passe mis à jour avec succès. Vous pouvez maintenant vous connecter.'
]); 
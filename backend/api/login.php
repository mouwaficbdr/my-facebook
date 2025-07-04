<?php
// backend/api/login.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../lib/validation.php';
require_once __DIR__ . '/../lib/rate_limit.php';
require_once __DIR__ . '/../lib/log.php';
require_once __DIR__ . '/../lib/jwt.php';

header('Content-Type: application/json');

$env = defined('APP_ENV') ? APP_ENV : (getenv('APP_ENV') ?: 'development');

// 1. Parsing JSON POST
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Requête invalide (JSON attendu).']);
    exit;
}

// 2. Rate limiting IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!rate_limit_check('login', $ip)) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => "Trop de tentatives, réessayez plus tard."
    ]);
    exit;
}

// 3. Validation inputs
$rules = [
    'email' => ['required', 'email', 'max:255'],
    'password' => ['required', 'min:8', 'max:64']
];
$errors = validate($input, $rules);
if ($errors) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// 4. Recherche user actif et confirmé
try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id, email, password_hash, role, is_active, email_confirmed FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch();
} catch (Throwable $e) {
    log_error('DB error (login)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 5. Vérification user et password
$loginOk = $user
    && $user['is_active']
    && $user['email_confirmed']
    && password_verify($input['password'], $user['password_hash']);

if (!$loginOk) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => "Identifiants invalides ou compte non confirmé."
    ]);
    exit;
}

// 6. Génération JWT
$payload = [
    'user_id' => $user['id'],
    'email' => $user['email'],
    'role' => $user['role'],
    'exp' => time() + (getenv('JWT_EXPIRATION') ?: 3600)
];
$jwt = generate_jwt($payload);

// 7. Set-Cookie httpOnly, Secure, SameSite, Path, Max-Age
$cookieParams = [
    'expires' => $payload['exp'],
    'path' => '/',
    'domain' => '', // Par défaut, domaine courant
    'secure' => ($env === 'production'),
    'httponly' => true,
    'samesite' => 'Strict'
];
setcookie('token', $jwt, $cookieParams);

// 8. Réponse JSON standardisée
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => "Connexion réussie."
]);

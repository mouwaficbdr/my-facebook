<?php
// api/login.php
// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

require_once __DIR__ . '/../lib/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../lib/validation.php';
require_once __DIR__ . '/../lib/rate_limit.php';
require_once __DIR__ . '/../lib/log.php';
require_once __DIR__ . '/../lib/jwt.php';

// Gestion CORS
handle_cors();

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

// 3. Validation centralisée
$rules = [
    'email' => ['required', 'email'],
    'password' => ['required']
];
$errors = validate($input, $rules);
if ($errors) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// 4. Recherche utilisateur (case-insensitive)
try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id, nom, prenom, email, password_hash, email_confirmed, role, genre, date_naissance, photo_profil FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    log_error('DB error (login)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 5. Vérification utilisateur et mot de passe
if (!$user || !password_verify($input['password'], $user['password_hash'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Email ou mot de passe incorrect.'
    ]);
    exit;
}

// 6. Vérification email confirmé (obligatoire)
if (!$user['email_confirmed']) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Veuillez confirmer votre email avant de vous connecter.'
    ]);
    exit;
}

// 7. Génération JWT
$payload = [
    'user_id' => $user['id'],
    'email' => $user['email'],
    'role' => $user['role'],
    'prenom' => $user['prenom'],
    'nom' => $user['nom'],
    'iat' => time(),
    'exp' => time() + (7 * 24 * 60 * 60) // 7 jours
];

$token = generate_jwt($payload);

// 8. Mise à jour dernière connexion
try {
    $stmt = $pdo->prepare('UPDATE users SET last_login = NOW() WHERE id = ?');
    $stmt->execute([$user['id']]);
} catch (Throwable $e) {
    log_error('DB error (update last login)', ['error' => $e->getMessage()]);
    // On continue même si ça échoue
}

// 9. Réponse avec cookie sécurisé
$dev = ($env === 'development' || $env === 'local' || $env === 'dev');

// En développement, on définit des options de cookie plus permissives
if ($dev) {
    // Options pour le développement local
    setcookie('jwt', $token, [
        'expires' => time() + (7 * 24 * 60 * 60),
        'path' => '/',
        'domain' => '',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
} else {
    // Options pour la production
    setcookie('jwt', $token, [
        'expires' => time() + (7 * 24 * 60 * 60),
        'path' => '/',
        'domain' => '',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'None'
    ]);
}

// Log pour le débogage
error_log("Cookie JWT défini avec les options: " . json_encode([
    'dev' => $dev,
    'secure' => $dev ? 'false' : 'true',
    'samesite' => $dev ? 'Lax' : 'None'
]));

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Connexion réussie.',
    'user' => [
        'id' => $user['id'],
        'nom' => $user['nom'],
        'prenom' => $user['prenom'],
        'email' => $user['email'],
        'genre' => $user['genre'],
        'date_naissance' => $user['date_naissance'],
        'role' => $user['role'],
        'photo_profil' => $user['photo_profil'] ?? null
    ]
]);

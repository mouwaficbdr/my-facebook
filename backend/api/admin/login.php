<?php
// api/admin/login.php
// Connexion dédiée pour le back office (admin/moderator uniquement)

if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../lib/validation.php';
require_once __DIR__ . '/../../lib/rate_limit.php';
require_once __DIR__ . '/../../lib/log.php';
require_once __DIR__ . '/../../lib/jwt.php';

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

// 2. Rate limiting IP (plus strict pour admin)
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!rate_limit_check('admin_login', $ip, 3, 300)) { // 3 tentatives par 5 minutes
  http_response_code(429);
  echo json_encode([
    'success' => false,
    'message' => "Trop de tentatives de connexion admin, réessayez plus tard."
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

// 4. Recherche utilisateur admin/moderator uniquement
try {
  $pdo = getPDO();
  $stmt = $pdo->prepare('
        SELECT id, nom, prenom, email, password_hash, email_confirmed, role, genre, date_naissance, photo_profil 
        FROM users 
        WHERE LOWER(email) = LOWER(?) 
        AND role IN (\'admin\', \'moderator\')
        AND is_active = true
        LIMIT 1
    ');
  $stmt->execute([$input['email']]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
  log_error('DB error (admin login)', ['error' => $e->getMessage()]);
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
  exit;
}

// 5. Vérification utilisateur et mot de passe
if (!$user || !password_verify($input['password'], $user['password_hash'])) {
  http_response_code(401);
  echo json_encode([
    'success' => false,
    'message' => 'Accès refusé. Seuls les administrateurs et modérateurs peuvent se connecter.'
  ]);
  exit;
}

// 6. Vérification email confirmé (obligatoire pour admin)
if (!$user['email_confirmed']) {
  http_response_code(403);
  echo json_encode([
    'success' => false,
    'message' => 'Email non confirmé. Contactez un administrateur.'
  ]);
  exit;
}

// 7. Génération JWT avec flag admin
$payload = [
  'user_id' => $user['id'],
  'email' => $user['email'],
  'role' => $user['role'],
  'prenom' => $user['prenom'],
  'nom' => $user['nom'],
  'is_admin_session' => true, // Flag pour identifier les sessions admin
  'iat' => time(),
  'exp' => time() + (8 * 60 * 60) // 8 heures (plus court que les sessions utilisateur)
];

$token = generate_jwt($payload);

// 8. Mise à jour dernière connexion
try {
  $stmt = $pdo->prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
  $stmt->execute([$user['id']]);
} catch (Throwable $e) {
  log_error('DB error (update admin last login)', ['error' => $e->getMessage()]);
  // On continue même si ça échoue
}

// 9. Log de connexion admin pour audit
log_info('Admin login successful', [
  'user_id' => $user['id'],
  'email' => $user['email'],
  'role' => $user['role'],
  'ip' => $ip,
  'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
]);

// 10. Réponse avec cookie sécurisé
$dev = ($env === 'development' || $env === 'local' || $env === 'dev');

// Définir les options du cookie avec des paramètres adaptés à l'environnement
$cookieOptions = [
  'expires' => time() + (24 * 60 * 60), // 24 heures
  'path' => '/', // Cookie accessible sur toute l'app
  'domain' => '', // Domaine vide pour correspondre au domaine actuel
  'secure' => !$dev, // Sécurisé en production, non sécurisé en dev
  'httponly' => true, // Toujours httponly pour la sécurité
  'samesite' => $dev ? 'Lax' : 'None' // Lax en dev, None en prod pour les requêtes cross-origin
];

// Définir le cookie
setcookie('admin_jwt', $token, $cookieOptions);

http_response_code(200);
echo json_encode([
  'success' => true,
  'message' => 'Connexion administrateur réussie.',
  'user' => [
    'id' => $user['id'],
    'nom' => $user['nom'],
    'prenom' => $user['prenom'],
    'email' => $user['email'],
    'role' => $user['role'],
    'photo_profil' => $user['photo_profil'] ?? null
  ]
]);

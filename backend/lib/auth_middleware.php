<?php
// backend/lib/auth_middleware.php
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/log.php';

function require_auth()
{
    // Auth spéciale pour tests automatisés : header X-User-Id
    if (isset($_SERVER['HTTP_X_USER_ID']) && getenv('APP_ENV') === 'test') {
        $userId = intval($_SERVER['HTTP_X_USER_ID']);
        if ($userId > 0) {
            // Charger l'utilisateur depuis la base
            $pdo = getPDO();
            $stmt = $pdo->prepare('SELECT id, email, role FROM users WHERE id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $GLOBALS['auth_user'] = [
                    'user_id' => $row['id'],
                    'email' => $row['email'],
                    'role' => $row['role'] ?? 'user',
                    'id' => $row['id']
                ];
                return;
            }
        }
    }
    $token = null;
    // 1. Vérifier le header Authorization
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            $token = trim($matches[1]);
        }
    } elseif (function_exists('apache_request_headers')) {
        // Pour certains serveurs, le header peut être dans apache_request_headers
        $headers = apache_request_headers();
        if (isset($headers['Authorization']) && preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            $token = trim($matches[1]);
        }
    }
    // 2. Sinon, fallback sur le cookie
    if (!$token && !empty($_COOKIE['admin_jwt'])) {
        $token = $_COOKIE['admin_jwt'];
    }
    if (!$token && !empty($_COOKIE['jwt'])) {
        $token = $_COOKIE['jwt'];
    }
    // Suppression du fallback sur 'token' (obsolète)
    // if (!$token && !empty($_COOKIE['token'])) {
    //     $token = $_COOKIE['token'];
    // }
    if (!$token) {
        log_error('Aucun JWT trouvé', ['cookies' => $_COOKIE, 'headers' => $_SERVER]);
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
        exit;
    }
    $payload = validate_jwt($token);
    if (!$payload) {
        log_error('JWT invalide ou expiré', ['token' => $token]);
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Token invalide ou expiré.']);
        exit;
    }
    // Expose le payload JWT globalement pour la suite du script
    $GLOBALS['auth_user'] = $payload;
}

function require_role($role)
{
    if (empty($GLOBALS['auth_user']) || !isset($GLOBALS['auth_user']['role'])) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Accès interdit.']);
        exit;
    }
    if ($GLOBALS['auth_user']['role'] !== $role) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Droits insuffisants.']);
        exit;
    }
}

function authenticate_user()
{
    // 1. JWT via cookie (vérifier d'abord admin_jwt, puis jwt standard)
    if (isset($_COOKIE['admin_jwt'])) {
        $jwt = $_COOKIE['admin_jwt'];
    } elseif (isset($_COOKIE['jwt'])) {
        $jwt = $_COOKIE['jwt'];
    } else {
        // 2. JWT via Authorization: Bearer ...
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        if ($auth && preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
            $jwt = $matches[1];
        } else {
            return null;
        }
    }
    $payload = validate_jwt($jwt);
    if (!$payload) return null;
    if (!isset($payload['user_id'])) return null;
    return [
        'id' => $payload['user_id'],
        'email' => $payload['email'] ?? null,
        'role' => $payload['role'] ?? 'user',
    ];
}

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

    // Débogage - Enregistrer les informations de la requête
    $debug_info = [
        'cookies' => $_COOKIE,
        'headers' => getallheaders(),
        'method' => $_SERVER['REQUEST_METHOD'],
        'uri' => $_SERVER['REQUEST_URI']
    ];
    error_log('Auth Debug: ' . json_encode($debug_info));

    $token = null;

    // 1. Vérifier le header Authorization
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            $token = trim($matches[1]);
            error_log('Token trouvé dans le header Authorization');
        }
    } elseif (function_exists('apache_request_headers')) {
        // Pour certains serveurs, le header peut être dans apache_request_headers
        $headers = apache_request_headers();
        if (isset($headers['Authorization']) && preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            $token = trim($matches[1]);
            error_log('Token trouvé dans apache_request_headers');
        }
    }

    // 2. Sinon, fallback sur le cookie
    if (!$token && !empty($_COOKIE['admin_jwt'])) {
        $token = $_COOKIE['admin_jwt'];
        error_log('Token trouvé dans le cookie admin_jwt');
    }
    if (!$token && !empty($_COOKIE['jwt'])) {
        $token = $_COOKIE['jwt'];
        error_log('Token trouvé dans le cookie jwt');
    }

    // 3. Fallback sur le paramètre de requête (pour les tests uniquement)
    if (!$token && !empty($_GET['token'])) {
        $token = $_GET['token'];
        error_log('Token trouvé dans le paramètre GET token');
    }

    if (!$token) {
        log_error('Aucun JWT trouvé', ['cookies' => $_COOKIE, 'headers' => $_SERVER]);
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Authentification requise.',
            'debug' => [
                'cookies' => $_COOKIE,
                'headers' => getallheaders(),
                'method' => $_SERVER['REQUEST_METHOD'],
                'uri' => $_SERVER['REQUEST_URI']
            ]
        ]);
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

    // S'assurer que l'ID utilisateur est disponible
    if (!isset($payload['user_id']) && isset($payload['id'])) {
        $GLOBALS['auth_user']['user_id'] = $payload['id'];
    }

    // S'assurer que l'ID est disponible
    if (!isset($payload['id']) && isset($payload['user_id'])) {
        $GLOBALS['auth_user']['id'] = $payload['user_id'];
    }

    error_log('Authentification réussie pour l\'utilisateur: ' . ($GLOBALS['auth_user']['id'] ?? 'ID inconnu'));
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

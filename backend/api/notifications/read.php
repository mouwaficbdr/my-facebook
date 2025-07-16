<?php
file_put_contents(__DIR__ . '/../../logs/__debug__-notif-read.log', date('c') . " ENTRY notifications/read.php\n", FILE_APPEND);
// api/notifications/read.php - Marquer une ou plusieurs notifications comme lues (premium)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}
require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
header('Content-Type: application/json');
require_auth();
$user = $GLOBALS['auth_user'];
if (!$user) {
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
if (file_exists(__DIR__ . '/../../lib/log.php')) {
    require_once __DIR__ . '/../../lib/log.php';
    if (function_exists('log_error')) log_error('DEBUG: entry notifications/read.php', [
        'method'=>$_SERVER['REQUEST_METHOD'],
        'uri'=>$_SERVER['REQUEST_URI'],
        'input'=>file_get_contents('php://input'),
        'headers'=>getallheaders()
    ]);
}
if (function_exists('log_error')) log_error('DEBUG: notif read input', [
    'raw' => file_get_contents('php://input'),
    'parsed' => $input
]);
if (!is_array($input) || !isset($input['ids']) || !is_array($input['ids'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Paramètre ids (array) requis.']);
    exit;
}
$ids = array_filter(array_map('intval', $input['ids']));
if (empty($ids)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Aucun ID valide fourni.']);
    exit;
}
try {
    $pdo = getPDO();
    // Sécuriser la requête pour n'impacter que les notifications de l'utilisateur
    $in = implode(',', array_fill(0, count($ids), '?'));
    $params = array_merge([$user['user_id']], $ids);
    $sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN ($in)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    // LOG DEBUG
    if (file_exists(__DIR__ . '/../../lib/log.php')) {
        require_once __DIR__ . '/../../lib/log.php';
        if (function_exists('log_error')) log_error('DEBUG: notif read update', [
            'user_id' => $user['user_id'],
            'ids' => $ids,
            'rowCount' => $stmt->rowCount()
        ]);
    }
    echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);
    exit;
} catch (Throwable $e) {
    if (function_exists('log_error')) log_error('Erreur notif read', [
        'err' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'input' => $input,
        'user' => $user
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur', 'error' => $e->getMessage()]);
    exit;
} 
<?php
// api/users/me_update.php - Mise à jour du profil de l'utilisateur connecté
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

$fields = ['nom', 'prenom', 'bio', 'ville', 'pays', 'date_naissance', 'photo_profil'];
$update = [];
$params = [];
foreach ($fields as $field) {
    if (isset($input[$field])) {
        $update[] = "$field = ?";
        $params[] = trim($input[$field]);
    }
}
if (empty($update)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Aucune donnée à mettre à jour.']);
    exit;
}

// Validation simple
if (isset($input['nom']) && !validate_name($input['nom'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nom invalide.']);
    exit;
}
if (isset($input['prenom']) && !validate_name($input['prenom'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Prénom invalide.']);
    exit;
}
if (isset($input['date_naissance']) && $input['date_naissance'] !== '' && !validate_date($input['date_naissance'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Date de naissance invalide.']);
    exit;
}

try {
    $pdo = getPDO();
    $userId = intval($currentUser['user_id']);
    $sql = "UPDATE users SET ".implode(', ', $update).", updated_at = NOW() WHERE id = ? AND is_active = 1 AND email_confirmed = 1";
    $params[] = $userId;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Profil mis à jour.']);
    exit;
} catch (Throwable $e) {
    log_error('Me update error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'currentUser' => $currentUser
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour du profil.', 'error' => $e->getMessage()]);
    exit;
} 
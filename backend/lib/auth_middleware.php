<?php
// backend/lib/auth_middleware.php
require_once __DIR__ . '/jwt.php';

function require_auth() {
    if (empty($_COOKIE['token'])) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
        exit;
    }
    $payload = validate_jwt($_COOKIE['token']);
    if (!$payload) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Token invalide ou expiré.']);
        exit;
    }
    // Expose le payload JWT globalement pour la suite du script
    $GLOBALS['auth_user'] = $payload;
}

function require_role($role) {
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
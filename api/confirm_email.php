<?php
// api/confirm_email.php
require_once __DIR__ . '/../backend/config/db.php';
require_once __DIR__ . '/../backend/config/env.php';
require_once __DIR__ . '/../backend/lib/log.php';

header('Content-Type: application/json');

// 1. Vérification token GET
$token = $_GET['token'] ?? '';
if (empty($token)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token manquant.']);
    exit;
}

// 2. Validation token
if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token invalide.']);
    exit;
}

// 3. Recherche utilisateur avec token
try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id, email_confirmed FROM users WHERE email_confirm_token = ? AND email_confirmed = 0 LIMIT 1');
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    log_error('DB error (confirm email)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 4. Vérification utilisateur
if (!$user) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token invalide ou email déjà confirmé.']);
    exit;
}

// 5. Confirmation email
try {
    $stmt = $pdo->prepare('UPDATE users SET email_confirmed = 1, email_confirm_token = NULL WHERE id = ?');
    $stmt->execute([$user['id']]);
} catch (Throwable $e) {
    log_error('DB error (update email confirmed)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 6. Réponse succès
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Email confirmé avec succès. Vous pouvez maintenant vous connecter.'
]); 
<?php
// backend/api/forgot_password.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../lib/log.php';
require_once __DIR__ . '/../lib/mail.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? trim($input['email']) : '';
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email invalide.']);
    exit;
}

// Générer un message générique pour éviter le phishing
$genericMsg = 'Si cet email existe, un lien de réinitialisation a été envoyé.';

try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id, prenom FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user) {
        $token = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', time() + 3600); // 1h
        $stmt = $pdo->prepare('UPDATE users SET reset_password_token = ?, reset_token_expiry = ? WHERE id = ?');
        $stmt->execute([$token, $expiry, $user['id']]);
        // Envoi du mail
        $resetUrl = (getenv('APP_URL') ?: 'http://localhost:3000') . "/reset-password?token=$token";
        $subject = "Réinitialisation de votre mot de passe";
        $body = "<p>Bonjour {$user['prenom']},</p><p>Pour réinitialiser votre mot de passe, cliquez sur ce lien : <a href='$resetUrl'>$resetUrl</a></p>";
        send_mail($email, $subject, $body);
    }
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => $genericMsg]);
} catch (Throwable $e) {
    log_error('DB error (forgot password)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
}

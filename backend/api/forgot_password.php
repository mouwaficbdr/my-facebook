<?php
// api/forgot_password.php
header('Access-Control-Allow-Origin: https://my-facebook-by-mouwafic.vercel.app');
header('Access-Control-Allow-Credentials: true');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../lib/log.php';
require_once __DIR__ . '/../lib/mail.php';

header('Content-Type: application/json');

$env = defined('APP_ENV') ? APP_ENV : (getenv('APP_ENV') ?: 'development');

// 1. Parsing JSON POST
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Requête invalide (JSON attendu).']);
    exit;
}

// 2. Validation email
if (empty($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email invalide.']);
    exit;
}

// 3. Recherche utilisateur
try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id, nom, prenom, email FROM users WHERE LOWER(email) = LOWER(?) AND email_confirmed = 1 LIMIT 1');
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    log_error('DB error (forgot password)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 4. Masquage existence compte (prod)
if (!$user) {
    if ($env === 'production') {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "Si l'email est valide, un lien de réinitialisation a été envoyé."
        ]);
        exit;
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => "Aucun compte trouvé avec cet email."
        ]);
        exit;
    }
}

// 5. Génération token réinitialisation
$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', time() + (60 * 60)); // 1 heure

// 6. Sauvegarde token
try {
    $stmt = $pdo->prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?');
    $stmt->execute([$token, $expires, $user['id']]);
} catch (Throwable $e) {
    log_error('DB error (save reset token)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 7. Envoi email réinitialisation (simulation en prod, Mailtrap en dev)
try {
    $resetUrl = (getenv('APP_URL') ?: 'http://localhost:3000') . "/reset-password?token=$token";
    $subject = "Réinitialisation de votre mot de passe";
    $body = "<p>Bonjour {$user['prenom']},</p><p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous :</p><p><a href='$resetUrl'>$resetUrl</a></p><p>Ce lien expire dans 1 heure.</p><p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>";
    send_mail($user['email'], $subject, $body);
} catch (Throwable $e) {
    log_error('Mail error (forgot password)', ['error' => $e->getMessage()]);
    // On ne bloque pas si l'email échoue
}

// 8. Réponse standardisée
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => $env === 'production'
        ? "Si l'email est valide, un lien de réinitialisation a été envoyé."
        : "Email de réinitialisation envoyé."
]); 
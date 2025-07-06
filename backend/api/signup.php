<?php
// api/signup.php
header('Access-Control-Allow-Origin: https://my-facebook-by-mouwafic.vercel.app');
header('Access-Control-Allow-Credentials: true');
error_log("DEBUG: Before require_once db.php");
require_once __DIR__ . '/../config/db.php';
error_log("DEBUG: After require_once db.php");
error_log("DEBUG: Before require_once env.php");
require_once __DIR__ . '/../config/env.php';
error_log("DEBUG: After require_once env.php");
error_log("DEBUG: Before require_once validation.php");
require_once __DIR__ . '/../lib/validation.php';
error_log("DEBUG: After require_once validation.php");
error_log("DEBUG: Before require_once rate_limit.php");
require_once __DIR__ . '/../lib/rate_limit.php';
error_log("DEBUG: After require_once rate_limit.php");
error_log("DEBUG: Before require_once log.php");
require_once __DIR__ . '/../lib/log.php';
error_log("DEBUG: After require_once log.php");
error_log("DEBUG: Before require_once mail.php");
require_once __DIR__ . '/../lib/mail.php';
error_log("DEBUG: After require_once mail.php");

header('Content-Type: application/json');

error_log("DEBUG: Before JSON parsing");

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
if (!rate_limit_check('signup', $ip)) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => "Trop de tentatives, réessayez plus tard."
    ]);
    exit;
}

// 3. Validation centralisée
$rules = [
    'nom' => ['required', 'min:2', 'max:50', 'alpha_spaces'],
    'prenom' => ['required', 'min:2', 'max:50', 'alpha_spaces'],
    'email' => ['required', 'email', 'max:255'],
    'password' => ['required', 'min:8', 'max:64', 'password'],
    'genre' => ['required', 'in:Homme,Femme,Autre'],
    'date_naissance' => ['required', 'date', 'before:today', 'age_min:13']
];
$errors = validate($input, $rules);
if ($errors) {
    // Message UX explicite pour l'âge
    if (isset($errors['date_naissance']) && strpos($errors['date_naissance'], 'Âge minimum') !== false) {
        $errors['date_naissance'] = 'Vous devez avoir au moins 13 ans pour vous inscrire.';
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// 4. Vérification unicité email (case-insensitive)
try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
    $stmt->execute([$input['email']]);
    $exists = $stmt->fetch();
} catch (Throwable $e) {
    log_error('DB error (check email)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 5. Masquage existence compte (prod)
if ($exists) {
    if ($env === 'production') {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => "Si l'email est valide, un lien de confirmation a été envoyé."
        ]);
        exit;
    } else {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => "Email déjà utilisé."
        ]);
        exit;
    }
}

// 6. Hashage mot de passe
$hash = password_hash($input['password'], PASSWORD_BCRYPT);

// 7. Génération token confirmation
$token = bin2hex(random_bytes(32));

// 8. Insertion utilisateur
try {
    $stmt = $pdo->prepare('INSERT INTO users (nom, prenom, email, password_hash, genre, date_naissance, email_confirm_token, email_confirmed, date_inscription) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())');
    $stmt->execute([
        $input['nom'],
        $input['prenom'],
        $input['email'],
        $hash,
        $input['genre'],
        $input['date_naissance'],
        $token
    ]);
} catch (Throwable $e) {
    log_error('DB error (insert user)', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
    exit;
}

// 9. Envoi email confirmation (simulation en prod, Mailtrap en dev)
try {
    $confirmUrl = (getenv('APP_URL') ?: 'http://localhost:3000') . "/confirm-email?token=$token";
    $subject = "Confirmez votre inscription";
    $body = "<p>Bonjour {$input['prenom']},</p><p>Merci de vous être inscrit. Cliquez sur le lien ci-dessous pour confirmer votre email :</p><p><a href='$confirmUrl'>$confirmUrl</a></p>";
    send_mail($input['email'], $subject, $body);
} catch (Throwable $e) {
    log_error('Mail error (signup)', ['error' => $e->getMessage()]);
    // On ne bloque pas l'inscription si l'email échoue
}

// 10. Réponse JSON standardisée
http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => $env === 'production'
        ? "Si l'email est valide, un lien de confirmation a été envoyé."
        : "Inscription réussie. Merci de confirmer votre email."
]); 
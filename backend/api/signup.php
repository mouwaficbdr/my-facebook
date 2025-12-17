<?php
// api/signup.php
// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
// TEMPORAIREMENT DÉSACTIVÉ POUR DEBUG
// if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
//     error_reporting(0);
//     ini_set('display_errors', 0);
// }

require_once __DIR__ . '/../lib/cors.php';
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

// Gestion CORS
handle_cors();

header('Content-Type: application/json');

error_log("DEBUG: Before JSON parsing");

error_log("DEBUG: About to read php://input");
$rawInput = file_get_contents('php://input');
error_log("DEBUG: Raw input received: " . substr($rawInput, 0, 100));

error_log("DEBUG: About to json_decode");
$input = json_decode($rawInput, true);
error_log("DEBUG: JSON decoded, type: " . gettype($input));

error_log("DEBUG: Line 36 - checking APP_ENV");
$env = defined('APP_ENV') ? APP_ENV : (getenv('APP_ENV') ?: 'development');
error_log("DEBUG: ENV value: $env");

// 1. Parsing JSON POST
if (!is_array($input)) {
    error_log("DEBUG: Input is not array, returning 400");
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Requête invalide (JSON attendu).']);
    exit;
}

error_log("DEBUG: JSON is valid array, continuing...");

// 2. Rate limiting IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
error_log("DEBUG: About to check rate limit for IP: $ip");
if (!rate_limit_check('signup', $ip)) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => "Trop de tentatives, réessayez plus tard."
    ]);
    exit;
}
error_log("DEBUG: Rate limit check passed");

// 3. Validation centralisée
error_log("DEBUG: About to validate input data");
$rules = [
    'nom' => ['required', 'min:2', 'max:50', 'alpha_spaces'],
    'prenom' => ['required', 'min:2', 'max:50', 'alpha_spaces'],
    'email' => ['required', 'email', 'max:255'],
    'password' => ['required', 'min:8', 'max:64', 'password'],
    'genre' => ['required', 'in:Homme,Femme,Autre'],
    'date_naissance' => ['required', 'date', 'before:today', 'age_min:13']
];
error_log("DEBUG: Calling validate()...");
$errors = validate($input, $rules);
error_log("DEBUG: Validation complete. Errors: " . json_encode($errors));
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
<?php
// backend/config/env.php
// Chargement manuel du .env.local si présent (uniquement en développement)
if (getenv('APP_ENV') !== 'production') {
    $envFile = __DIR__ . '/../../.env.local';
    if (file_exists($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (!strpos($line, '=')) continue;
            list($name, $value) = explode('=', $line, 2);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

// Variables d'environnement pour la connexion MySQL

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'myfacebook');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_PORT', getenv('DB_PORT') ?: 3306);
define('DB_SSL', getenv('DB_SSL') === 'true');



// Variables d'environnement pour l'envoi d'emails
define('MAIL_DRIVER', getenv('MAIL_DRIVER') ?: 'simulation');
define('MAIL_HOST', getenv('MAIL_HOST') ?: 'smtp.mailtrap.io');
define('MAIL_PORT', getenv('MAIL_PORT') ?: 2525);
define('MAIL_USER', getenv('MAIL_USER') ?: '');
define('MAIL_PASS', getenv('MAIL_PASS') ?: '');
define('MAIL_FROM', getenv('MAIL_FROM') ?: 'no-reply@myfacebook.com');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'MyFacebook');
define('BREVO_API_KEY', getenv('BREVO_API_KEY') ?: '');

// Variables d'environnement pour JWT
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'changeme');
define('JWT_EXPIRATION', getenv('JWT_EXPIRATION') ?: 3600);

// Variables d'environnement pour le rate limiting
define('RATE_LIMIT_MAX', getenv('RATE_LIMIT_MAX') ?: 5);
define('RATE_LIMIT_WINDOW', getenv('RATE_LIMIT_WINDOW') ?: 600);

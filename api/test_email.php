<?php
// api/test_email.php
require_once __DIR__ . '/../backend/config/db.php';
require_once __DIR__ . '/../backend/config/env.php';
require_once __DIR__ . '/../backend/lib/log.php';
require_once __DIR__ . '/../backend/lib/mail.php';

header('Content-Type: application/json');

// Test de simulation d'email
$testEmail = 'test@example.com';
$subject = 'Test de simulation d\'email';
$body = '<p>Ceci est un test de simulation d\'email.</p><p>En production, cet email ne sera pas réellement envoyé mais sera loggé.</p>';

try {
    $result = send_mail($testEmail, $subject, $body);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Test d\'email effectué',
        'email_sent' => $result,
        'environment' => defined('APP_ENV') ? APP_ENV : (getenv('APP_ENV') ?: 'development'),
        'note' => 'En production, les emails sont simulés et loggés'
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors du test d\'email',
        'error' => $e->getMessage()
    ]);
} 
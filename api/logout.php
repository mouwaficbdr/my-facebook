<?php
// api/logout.php
header('Content-Type: application/json');
// Supprimer le cookie JWT (token)
setcookie('token', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'domain' => '',
    'secure' => (getenv('APP_ENV') === 'production'),
    'httponly' => true,
    'samesite' => 'Strict'
]);
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Déconnexion réussie.'
]); 
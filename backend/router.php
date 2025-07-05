<?php
// FORCER L'AFFICHAGE DES ERREURS POUR LE DEBUG
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// backend/router.php
// Routeur simple pour le serveur PHP intégré

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Supprimer le slash final
$path = rtrim($path, '/');

// Routes API
if (strpos($path, '/api/') === 0) {
    $api_path = substr($path, 5); // Enlever '/api/'
    
    // Mapper les endpoints
    $endpoints = [
        'signup' => 'api/signup.php',
        'login' => 'api/login.php',
        'logout' => 'api/logout.php',
        'confirm-email' => 'api/confirm_email.php',
        'forgot-password' => 'api/forgot_password.php',
        'reset-password' => 'api/reset_password.php'
    ];
    
    if (isset($endpoints[$api_path])) {
        include $endpoints[$api_path];
        return true;
    }
}

// Route par défaut
if ($path === '' || $path === '/') {
    include 'index.php';
    return true;
}

// 404 pour les routes non trouvées
http_response_code(404);
echo json_encode([
    'success' => false,
    'message' => 'Endpoint non trouvé',
    'path' => $path
]);
return true; 
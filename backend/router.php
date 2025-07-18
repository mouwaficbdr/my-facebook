<?php
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
        // Routes utilisateur standard
        'signup' => 'api/signup.php',
        'login' => 'api/login.php',
        'logout' => 'api/logout.php',
        'confirm-email' => 'api/confirm_email.php',
        'forgot-password' => 'api/forgot_password.php',
        'reset-password' => 'api/reset_password.php',
        'change-password' => 'api/users/change_password.php',
        'notifications' => 'api/notifications.php',
        'notifications-read' => 'api/notifications/read.php',

        // Routes admin
        'admin/login' => 'api/admin/login.php',
        'admin/logout' => 'api/admin/logout.php',
        'admin/me' => 'api/admin/me.php',
        'admin/dashboard' => 'api/admin/dashboard.php',
        'admin/users' => 'api/admin/users.php',
        'admin/posts' => 'api/admin/posts.php',
        'admin/stats' => 'api/admin/stats.php',
        'admin/moderation-logs' => 'api/admin/moderation_logs.php'
    ];

    if (isset($endpoints[$api_path])) {
        include $endpoints[$api_path];
        return true;
    }

    // Gestion des sous-dossiers API
    $segments = explode('/', $api_path);
    if (count($segments) >= 2) {
        $file_path = 'api/' . implode('/', $segments) . '.php';
        if (file_exists($file_path)) {
            include $file_path;
            return true;
        }
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

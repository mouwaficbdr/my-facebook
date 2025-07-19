<?php
// backend/router.php
// Routeur simple pour le serveur PHP intégré

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Supprimer le slash final
$path = rtrim($path, '/');

// Gestion des fichiers statiques (uploads)
if (strpos($path, '/uploads/') === 0) {
    $file_path = __DIR__ . $path;
    
    // Vérifier que le fichier existe et est dans le dossier uploads (sécurité renforcée)
    if (file_exists($file_path) && 
        strpos(realpath($file_path), realpath(__DIR__ . '/uploads/')) === 0 &&
        !strpos($path, '..') && // Bloquer les tentatives de directory traversal
        preg_match('/^\/uploads\/[a-zA-Z0-9\/_-]+\.[a-zA-Z0-9]+$/', $path)) { // Validation stricte du chemin
        // Déterminer le type MIME
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file_path);
        finfo_close($finfo);
        
        // Headers pour les images
        header('Content-Type: ' . $mime_type);
        header('Cache-Control: public, max-age=31536000'); // Cache 1 an
        header('Access-Control-Allow-Origin: *');
        
        // Servir le fichier
        readfile($file_path);
        return true;
    } else {
        // Fichier non trouvé ou accès non autorisé
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Fichier non trouvé']);
        return true;
    }
}

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

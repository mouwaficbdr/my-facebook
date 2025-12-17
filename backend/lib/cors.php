<?php
// lib/cors.php - Middleware CORS centralisé

function handle_cors() {
    // Liste des origines autorisées
    $allowed_origins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://my-facebook-by-mouwafic.vercel.app'
    ];

    // Récupérer l'origine de la requête
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Si pas d'origine (ex: curl) ou origine autorisée
    if (in_array($origin, $allowed_origins) || empty($origin)) {
        // Si l'origine est vide (curl), on peut mettre * ou l'origine par défaut, 
        // mais pour les cookies il faut une origine précise.
        // Si vide, on ne met rien ou on met la première autorisée si on veut être permissif.
        $allow_origin = empty($origin) ? $allowed_origins[2] : $origin;
        
        header("Access-Control-Allow-Origin: $allow_origin");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    }

    // Gestion des requêtes OPTIONS (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        // S'assurer que les headers sont envoyés même pour OPTIONS
        if (in_array($origin, $allowed_origins)) {
             header("Access-Control-Allow-Origin: $origin");
             header('Access-Control-Allow-Credentials: true');
             header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
             header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        }
        http_response_code(200);
        exit;
    }
} 
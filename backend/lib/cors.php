<?php
// lib/cors.php - Middleware CORS centralisé

function handle_cors() {
    // Headers CORS pour toutes les requêtes
    header('Access-Control-Allow-Origin: https://my-facebook-by-mouwafic.vercel.app');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    
    // Gestion des requêtes OPTIONS (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
} 
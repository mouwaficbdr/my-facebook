<?php
// backend/config/db.php
// Connexion PDO à MySQL (Aiven ou XAMPP)

require_once __DIR__ . '/env.php';

function getPDO(): PDO {
    $host = DB_HOST;
    $db   = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;
    $port = DB_PORT;
    $ssl  = DB_SSL; // true/false selon besoin

    // Gestion dynamique du certificat SSL depuis la variable d'environnement
    if (getenv('DB_SSL_CA_CONTENT')) {
        $caPath = sys_get_temp_dir() . '/ca.pem';
        file_put_contents($caPath, getenv('DB_SSL_CA_CONTENT'));
        define('DB_SSL_CA_PATH', $caPath);
    }
    // Si pas de contenu, on prend le chemin local si défini
    if (!defined('DB_SSL_CA_PATH')) {
        $envCaPath = getenv('DB_SSL_CA_PATH');
        if ($envCaPath) {
            define('DB_SSL_CA_PATH', $envCaPath);
        }
    }

    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    if ($ssl) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = DB_SSL_CA_PATH;
    }
    // Log temporaire pour debug (commenté pour la production)
    /* file_put_contents(__DIR__ . '/../logs/error.log', json_encode([
        'dsn' => $dsn,
        'user' => $user,
        'ssl' => $ssl,
        'ssl_ca' => DB_SSL_CA_PATH
    ]) . PHP_EOL, FILE_APPEND); */
    return new PDO($dsn, $user, $pass, $options);
}



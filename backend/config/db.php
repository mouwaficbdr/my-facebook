<?php
// backend/config/db.php
// Connexion PDO multi-drivers (MySQL ou PostgreSQL)
// Utilisez la variable DB_DRIVER pour choisir le driver

require_once __DIR__ . '/env.php';

function getPDO(): PDO {
    $driver = getenv('DB_DRIVER') ?: 'mysql'; // 'mysql' ou 'pgsql'
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

    // Construction du DSN selon le driver
    if ($driver === 'pgsql') {
        $dsn = "pgsql:host=$host;port=$port;dbname=$db";
    } else {
        $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    // SSL pour MySQL uniquement (Postgres utilise sslmode dans le DSN)
    if ($driver === 'mysql' && $ssl && defined('DB_SSL_CA_PATH')) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = DB_SSL_CA_PATH;
    }

    // Pour Postgres avec SSL, on peut ajouter sslmode au DSN
    if ($driver === 'pgsql' && $ssl) {
        $dsn .= ";sslmode=require";
    }

    return new PDO($dsn, $user, $pass, $options);
}

function get_db_connection(): PDO {
    return getPDO();
}



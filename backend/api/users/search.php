<?php
// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../config/db.php';
header('Content-Type: application/json');

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if ($q === '' || strlen($q) < 2) {
    echo json_encode(['success' => false, 'error' => 'Requête trop courte.']);
    exit;
}

try {
    $pdo = getPDO();
    // Recherche sur nom, prénom, email (LIKE sécurisé)
    $sql = "SELECT id, nom, prenom, photo_profil FROM users WHERE (nom LIKE :q1 OR prenom LIKE :q2 OR email LIKE :q3) LIMIT 10";
    $like = '%' . $q . '%';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':q1', $like, PDO::PARAM_STR);
    $stmt->bindValue(':q2', $like, PDO::PARAM_STR);
    $stmt->bindValue(':q3', $like, PDO::PARAM_STR);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'users' => $users]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur', 'trace' => $e->getMessage()]);
} 
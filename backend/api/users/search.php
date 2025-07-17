<?php
require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../lib/jwt.php';
handle_cors();

// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../config/db.php';
header('Content-Type: application/json');

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$friendsOnly = isset($_GET['friends_only']) && $_GET['friends_only'] === '1';

if ($q === '' || strlen($q) < 2) {
    echo json_encode(['success' => false, 'message' => 'Requête trop courte.']);
    exit;
}

try {
    $pdo = getPDO();

    if ($friendsOnly) {
        // Vérifier l'authentification pour la recherche d'amis
        $user = verify_jwt();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Non authentifié.']);
            exit;
        }

        // Recherche limitée aux amis
        $sql = "
            SELECT DISTINCT u.id, u.nom, u.prenom, u.photo_profil 
            FROM users u
            INNER JOIN friendships f ON (
                (f.user_id = ? AND f.friend_id = u.id) OR 
                (f.friend_id = ? AND f.user_id = u.id)
            )
            WHERE f.status = 'accepted' 
            AND u.email_confirmed = 1 
            AND u.is_active = 1 
            AND u.id != ?
            AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?) 
            LIMIT 10
        ";

        $like = '%' . $q . '%';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $user['user_id'],
            $user['user_id'],
            $user['user_id'],
            $like,
            $like,
            $like
        ]);
    } else {
        // Recherche générale
        $sql = "
            SELECT id, nom, prenom, photo_profil 
            FROM users 
            WHERE email_confirmed = 1 
            AND is_active = 1 
            AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?) 
            LIMIT 10
        ";

        $like = '%' . $q . '%';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$like, $like, $like]);
    }

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format de réponse compatible avec l'ancien code
    if ($friendsOnly) {
        echo json_encode([
            'success' => true,
            'data' => [
                'users' => $users,
                'total' => count($users)
            ]
        ]);
    } else {
        // Format original pour la searchbar de la navbar
        echo json_encode([
            'success' => true,
            'users' => $users
        ]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur',
        'trace' => $e->getMessage()
    ]);
}

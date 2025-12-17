<?php
// api/friends/suggestions.php - Suggestions d'amis
// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
require_once __DIR__ . '/../../lib/log.php';

// Gestion CORS
handle_cors();

header('Content-Type: application/json');

// Authentification JWT
require_auth();
$user = $GLOBALS['auth_user'];
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}

try {
    $pdo = getPDO();
    
    // Paramètres de pagination
    $limit = min(10, max(5, intval($_GET['limit'] ?? 5)));
    
    // Récupération des suggestions d'amis
    // Algorithme : utilisateurs avec qui on a des amis en commun, tri multicritères
    $query = "
        SELECT DISTINCT
            u.id,
            u.nom,
            u.prenom,
            u.photo_profil,
            u.ville,
            u.pays,
            u.bio,
            u.date_inscription,
            -- Nombre d'amis en commun (MySQL compatible)
            (
                SELECT COUNT(*) FROM (
                    SELECT CASE WHEN f1.user_id = :me1 THEN f1.friend_id ELSE f1.user_id END AS friend_id
                    FROM friendships f1
                    WHERE (f1.user_id = :me2 OR f1.friend_id = :me3) AND f1.status = 'accepted'
                ) AS my_friends
                INNER JOIN (
                    SELECT CASE WHEN f2.user_id = u.id THEN f2.friend_id ELSE f2.user_id END AS friend_id
                    FROM friendships f2
                    WHERE (f2.user_id = u.id OR f2.friend_id = u.id) AND f2.status = 'accepted'
                ) AS user_friends
                ON my_friends.friend_id = user_friends.friend_id
            ) AS mutual_friends,
            -- Nombre total d'amis
            (
                SELECT COUNT(*) FROM friendships f3
                WHERE (f3.user_id = u.id OR f3.friend_id = u.id) AND f3.status = 'accepted'
            ) AS total_friends
        FROM users u
        WHERE u.id != :me4
          AND u.is_active = true
          AND u.email_confirmed = true
          AND NOT EXISTS(
            SELECT 1 FROM friendships f4
            WHERE ((f4.user_id = :me5 AND f4.friend_id = u.id)
                OR (f4.friend_id = :me6 AND f4.user_id = u.id))
              AND f4.status IN ('pending','accepted','blocked')
          )
        ORDER BY mutual_friends DESC, total_friends DESC, u.date_inscription ASC, u.nom ASC
        LIMIT :limit
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindValue('me1', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('me2', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('me3', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('me4', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('me5', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('me6', $user['user_id'], PDO::PARAM_INT);
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $suggestions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Formatage des données
    foreach ($suggestions as &$suggestion) {
        $suggestion['id'] = intval($suggestion['id']);
        $suggestion['mutual_friends'] = intval($suggestion['mutual_friends']);
        $suggestion['total_friends'] = intval($suggestion['total_friends']);
        $suggestion['date_inscription'] = $suggestion['date_inscription'];
    }
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'suggestions' => $suggestions,
            'total' => count($suggestions)
        ]
    ]);
    
} catch (Throwable $e) {
    log_error('Friends suggestions error', [
        'error' => $e->getMessage(), 
        'user_id' => $user['user_id']
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement des suggestions.']);
}

/**
 * Formate une date en temps relatif (ex: "il y a 2 heures")
 */
function formatRelativeTime($datetime) {
    $now = new DateTime();
    $date = new DateTime($datetime);
    $diff = $now->diff($date);
    
    if ($diff->y > 0) {
        return "il y a " . $diff->y . " an" . ($diff->y > 1 ? "s" : "");
    } elseif ($diff->m > 0) {
        return "il y a " . $diff->m . " mois";
    } elseif ($diff->d > 0) {
        return "il y a " . $diff->d . " jour" . ($diff->d > 1 ? "s" : "");
    } elseif ($diff->h > 0) {
        return "il y a " . $diff->h . " heure" . ($diff->h > 1 ? "s" : "");
    } elseif ($diff->i > 0) {
        return "il y a " . $diff->i . " minute" . ($diff->i > 1 ? "s" : "");
    } else {
        return "à l'instant";
    }
} 
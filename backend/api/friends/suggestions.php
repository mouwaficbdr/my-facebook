<?php
// api/friends/suggestions.php - Suggestions d'amis
require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
require_once __DIR__ . '/../../lib/log.php';

// Gestion CORS
handle_cors();

header('Content-Type: application/json');

// Authentification JWT
$user = authenticate_user();
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
    // Algorithme : utilisateurs avec qui on a des amis en commun + utilisateurs actifs récents
    $query = "
        SELECT DISTINCT
            u.id,
            u.nom,
            u.prenom,
            u.photo_profil,
            u.ville,
            u.pays,
            u.bio,
            COUNT(DISTINCT f1.user_id) as mutual_friends,
            MAX(p.created_at) as last_activity,
            EXISTS(SELECT 1 FROM friendships WHERE user_id = ? AND friend_id = u.id) as friendship_status
        FROM users u
        LEFT JOIN friendships f1 ON (f1.user_id = u.id OR f1.friend_id = u.id)
        LEFT JOIN friendships f2 ON (
            (f2.user_id = ? AND f2.friend_id = f1.user_id AND f1.user_id != ?) OR
            (f2.user_id = ? AND f2.friend_id = f1.friend_id AND f1.friend_id != ?) OR
            (f2.friend_id = ? AND f2.user_id = f1.user_id AND f1.user_id != ?) OR
            (f2.friend_id = ? AND f2.user_id = f1.friend_id AND f1.friend_id != ?)
        )
        LEFT JOIN posts p ON u.id = p.user_id
        WHERE u.id != ?
        AND u.is_active = 1
        AND u.email_confirmed = 1
        AND NOT EXISTS(SELECT 1 FROM friendships WHERE user_id = ? AND friend_id = u.id)
        AND NOT EXISTS(SELECT 1 FROM friendships WHERE user_id = u.id AND friend_id = ?)
        GROUP BY u.id
        ORDER BY mutual_friends DESC, last_activity DESC
        LIMIT ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        $user['id'], // friendship_status check
        $user['id'], // mutual friends check 1
        $user['id'], // mutual friends check 1 exclude
        $user['id'], // mutual friends check 2
        $user['id'], // mutual friends check 2 exclude
        $user['id'], // mutual friends check 3
        $user['id'], // mutual friends check 3 exclude
        $user['id'], // mutual friends check 4
        $user['id'], // mutual friends check 4 exclude
        $user['id'], // exclude current user
        $user['id'], // exclude existing friendships 1
        $user['id'], // exclude existing friendships 2
        $limit
    ]);
    
    $suggestions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatage des données
    foreach ($suggestions as &$suggestion) {
        $suggestion['id'] = intval($suggestion['id']);
        $suggestion['mutual_friends'] = intval($suggestion['mutual_friends']);
        $suggestion['last_activity_formatted'] = $suggestion['last_activity'] 
            ? formatRelativeTime($suggestion['last_activity']) 
            : 'Jamais actif';
        
        // Suppression des champs sensibles
        unset($suggestion['last_activity']);
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
        'user_id' => $user['id']
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
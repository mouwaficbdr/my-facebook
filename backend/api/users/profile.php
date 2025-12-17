<?php
// api/users/profile.php - Profil public d'un utilisateur
// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
require_once __DIR__ . '/../../lib/log.php';

header('Content-Type: application/json');

// Authentification JWT obligatoire
require_auth();
$currentUser = $GLOBALS['auth_user'];
if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}

// Récupération de l'ID cible
$userId = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID utilisateur invalide.']);
    exit;
}

try {
    $pdo = getPDO();

    // 1. Infos publiques utilisateur
    $userQuery = "SELECT id, nom, prenom, bio, photo_profil, cover_url, ville, pays, date_naissance FROM users WHERE id = ? AND is_active = true AND email_confirmed = true LIMIT 1";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé.']);
        exit;
    }

    // 2. Nombre d'amis
    $friendsQuery = "SELECT COUNT(*) as total FROM users u JOIN friendships f ON ((f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id)) WHERE f.status = 'accepted' AND u.is_active = true AND u.email_confirmed = true AND u.id != ?";
    $friendsStmt = $pdo->prepare($friendsQuery);
    $friendsStmt->execute([$userId, $userId, $userId]);
    $user['friends_count'] = intval($friendsStmt->fetchColumn());

    // 3. Statut d'amitié
    $friendStatus = 'not_friends';
    if ($userId === intval($currentUser['user_id'])) {
        $friendStatus = 'self';
    } else {
        $statusQuery = "SELECT status, user_id, friend_id FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) LIMIT 1";
        $statusStmt = $pdo->prepare($statusQuery);
        $statusStmt->execute([$currentUser['user_id'], $userId, $userId, $currentUser['user_id']]);
        $row = $statusStmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            if ($row['status'] === 'accepted') {
                $friendStatus = 'friends';
            } elseif ($row['status'] === 'pending') {
                if ($row['user_id'] == $currentUser['user_id']) {
                    $friendStatus = 'request_sent';
                } else {
                    $friendStatus = 'request_received';
                }
            }
        }
    }

    // 4. Liste paginée des posts publics
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(20, max(5, intval($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;
    $postsQuery = "
        SELECT 
            p.id, 
            p.contenu, 
            p.image_url, 
            p.type, 
            p.is_public, 
            p.created_at, 
            p.updated_at, 
            u.nom, 
            u.prenom, 
            u.photo_profil,
            u.id as user_id,
            u.ville,
            u.pays,
            COUNT(DISTINCT l.id) as likes_count,
            COUNT(DISTINCT c.id) as comments_count,
            EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked,
            (SELECT type FROM likes WHERE post_id = p.id AND user_id = ? LIMIT 1) as user_like_type
        FROM posts p 
        JOIN users u ON u.id = p.user_id 
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id AND c.parent_id IS NULL
        WHERE p.user_id = ? AND p.is_public = true 
        GROUP BY p.id
        ORDER BY p.created_at DESC 
        LIMIT ? OFFSET ?
    ";
    $postsStmt = $pdo->prepare($postsQuery);
    $postsStmt->execute([$currentUser['user_id'], $currentUser['user_id'], $userId, $limit, $offset]);
    $posts = $postsStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($posts as &$post) {
        $post['id'] = intval($post['id']);
        $post['user_id'] = intval($post['user_id']);
        $post['is_public'] = boolval($post['is_public']);
        $post['likes_count'] = intval($post['likes_count']);
        $post['comments_count'] = intval($post['comments_count']);
        $post['user_liked'] = boolval($post['user_liked']);
        $post['created_at_formatted'] = formatRelativeTime($post['created_at']);
        $post['updated_at_formatted'] = formatRelativeTime($post['updated_at']);
    }
    // Suppression de l'ancien code de calcul des compteurs qui n'est plus nécessaire
    // $postIds = array_column($posts, 'id');
    // $likesCount = [];
    // $commentsCount = [];
    // if (count($postIds) > 0) {
    //     $inQuery = implode(',', array_fill(0, count($postIds), '?'));
    //     // Likes
    //     $likeStmt = $pdo->prepare("SELECT post_id, COUNT(*) as likes_count FROM likes WHERE post_id IN ($inQuery) GROUP BY post_id");
    //     $likeStmt->execute($postIds);
    //     foreach ($likeStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    //         $likesCount[$row['post_id']] = (int)$row['likes_count'];
    //     }
    //     // Comments
    //     $commentStmt = $pdo->prepare("SELECT post_id, COUNT(*) as comments_count FROM comments WHERE post_id IN ($inQuery) GROUP BY post_id");
    //     $commentStmt->execute($postIds);
    //     foreach ($commentStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    //         $commentsCount[$row['post_id']] = (int)$row['comments_count'];
    //     }
    // }
    // foreach ($posts as &$post) {
    //     $post['likes_count'] = $likesCount[$post['id']] ?? 0;
    //     $post['comments_count'] = $commentsCount[$post['id']] ?? 0;
    // }
    unset($post);

    // 5. Pagination
    $countQuery = "SELECT COUNT(*) as total FROM posts WHERE user_id = ? AND is_public = true";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute([$userId]);
    $totalPosts = $countStmt->fetchColumn();

    // Nombre d'amis en commun (contournement PDO)
    // 1. Récupérer les amis de l'utilisateur courant
    $myFriendsQuery = "SELECT friend_id AS fid FROM friendships WHERE user_id = ? AND status = 'accepted' UNION SELECT user_id AS fid FROM friendships WHERE friend_id = ? AND status = 'accepted'";
    $myFriendsStmt = $pdo->prepare($myFriendsQuery);
    $myFriendsStmt->execute([$currentUser['user_id'], $currentUser['user_id']]);
    $myFriends = $myFriendsStmt->fetchAll(PDO::FETCH_COLUMN, 0);

    // 2. Récupérer les amis de l'utilisateur cible
    $theirFriendsQuery = "SELECT friend_id AS fid FROM friendships WHERE user_id = ? AND status = 'accepted' UNION SELECT user_id AS fid FROM friendships WHERE friend_id = ? AND status = 'accepted'";
    $theirFriendsStmt = $pdo->prepare($theirFriendsQuery);
    $theirFriendsStmt->execute([$userId, $userId]);
    $theirFriends = $theirFriendsStmt->fetchAll(PDO::FETCH_COLUMN, 0);

    // 3. Intersection en PHP
    $mutualFriends = array_intersect($myFriends, $theirFriends);
    $mutualFriendsCount = count($mutualFriends);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'user' => $user,
            'friend_status' => $friendStatus,
            'posts' => $posts,
            'posts_count' => intval($totalPosts),
            'friends_count' => intval($user['friends_count']),
            'mutual_friends_count' => $mutualFriendsCount,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => intval($totalPosts),
                'total_pages' => ceil($totalPosts / $limit),
                'has_next' => ($page * $limit) < $totalPosts,
                'has_prev' => $page > 1
            ]
        ]
    ]);
    exit;

} catch (Throwable $e) {
    log_error('Profile error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'currentUser' => $currentUser
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement du profil.', 'error' => $e->getMessage()]);
    exit;
}

// Fonction utilitaire pour le formatage des dates relatives
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
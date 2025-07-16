<?php
// api/posts/saved.php - Liste des posts enregistrés par l'utilisateur connecté
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

require_auth();
$user = $GLOBALS['auth_user'];
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}

try {
    $pdo = getPDO();
    // Pagination
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(20, max(5, intval($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;

    // Récupérer les posts enregistrés (jointure saved_posts + posts + users)
    $query = "
        SELECT 
            p.id,
            p.contenu,
            p.image_url,
            p.type,
            p.is_public,
            p.created_at,
            p.updated_at,
            u.id as user_id,
            u.nom,
            u.prenom,
            u.photo_profil,
            u.ville,
            u.pays,
            sp.created_at as saved_at,
            COUNT(DISTINCT l.id) as likes_count,
            COUNT(DISTINCT c.id) as comments_count,
            EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked,
            (SELECT type FROM likes WHERE post_id = p.id AND user_id = ? LIMIT 1) as user_like_type
        FROM saved_posts sp
        INNER JOIN posts p ON sp.post_id = p.id
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id AND c.parent_id IS NULL
        WHERE sp.user_id = ?
        GROUP BY p.id, p.contenu, p.image_url, p.type, p.is_public, p.created_at, p.updated_at, u.id, u.nom, u.prenom, u.photo_profil, u.ville, u.pays, sp.created_at
        ORDER BY sp.created_at DESC
        LIMIT ? OFFSET ?
    ";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$user['user_id'], $user['user_id'], $user['user_id'], $limit, $offset]);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Récupérer les commentaires récents pour chaque post (max 3)
    foreach ($posts as &$post) {
        if (!isset($post['id'])) continue;
        $commentsQuery = "
            SELECT 
                c.id,
                c.contenu,
                c.created_at,
                c.parent_id,
                u.id as user_id,
                u.nom,
                u.prenom,
                u.photo_profil,
                (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as replies_count
            FROM comments c
            INNER JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ? AND c.parent_id IS NULL
            ORDER BY c.created_at DESC
            LIMIT 3
        ";
        $commentsStmt = $pdo->prepare($commentsQuery);
        $commentsStmt->execute([$post['id']]);
        $post['comments'] = $commentsStmt->fetchAll(PDO::FETCH_ASSOC);
        // Formatage des dates
        $post['created_at_formatted'] = formatRelativeTime($post['created_at']);
        $post['updated_at_formatted'] = formatRelativeTime($post['updated_at']);
        foreach ($post['comments'] as &$comment) {
            $comment['created_at_formatted'] = formatRelativeTime($comment['created_at']);
        }
        // Conversion des types
        $post['likes_count'] = intval($post['likes_count']);
        $post['comments_count'] = intval($post['comments_count']);
        $post['user_liked'] = boolval($post['user_liked']);
        $post['user_id'] = isset($post['user_id']) ? intval($post['user_id']) : null;
        $post['id'] = isset($post['id']) ? intval($post['id']) : null;
    }

    // Nombre total de posts enregistrés pour la pagination
    $countQuery = "SELECT COUNT(*) as total FROM saved_posts WHERE user_id = ?";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute([$user['user_id']]);
    $totalPosts = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'posts' => $posts,
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
    log_error('Saved posts error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'user_id' => $user['user_id'] ?? null
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement des posts enregistrés.']);
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
<?php
// api/feed.php - Récupération du flux d'actualités
require_once __DIR__ . '/../lib/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/auth_middleware.php';
require_once __DIR__ . '/../lib/log.php';

// Gestion CORS
handle_cors();

header('Content-Type: application/json');

// Authentification JWT
require_auth();
$user = $GLOBALS['auth_user'];
if (!$user) {
    log_error('feed.php: $user non défini après require_auth', []);
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}

// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

try {
    $pdo = getPDO();

    // Paramètres de pagination
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(20, max(5, intval($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;

    // Récupération des posts avec informations utilisateur et statistiques
    // Modifié pour ne montrer que les posts des amis et de l'utilisateur lui-même
    // Ajout d'un shuffle aléatoire pour simuler un feed de réseau social
    // Évite les posts consécutifs du même auteur
    $query = "
        WITH ranked_posts AS (
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
                COUNT(DISTINCT l.id) as likes_count,
                COUNT(DISTINCT c.id) as comments_count,
                EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked,
                (SELECT type FROM likes WHERE post_id = p.id AND user_id = ? LIMIT 1) as user_like_type,
                -- Priorité temporelle
                CASE 
                    WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1
                    WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 2
                    ELSE 3
                END as time_priority,
                -- Seed pour le shuffle basé sur la date et l'ID
                RAND(UNIX_TIMESTAMP(DATE(NOW())) + p.id + ?) as shuffle_seed
            FROM posts p
            INNER JOIN users u ON p.user_id = u.id
            LEFT JOIN likes l ON p.id = l.post_id
            LEFT JOIN comments c ON p.id = c.post_id AND c.parent_id IS NULL
            WHERE p.is_public = 1 AND u.is_active = 1 AND u.email_confirmed = 1
            AND (
                -- Posts de l'utilisateur lui-même
                p.user_id = ?
                OR 
                -- Posts des amis (relation acceptée)
                p.user_id IN (
                    -- Amis qui ont envoyé une demande à l'utilisateur
                    SELECT user_id FROM friendships 
                    WHERE friend_id = ? AND status = 'accepted'
                    UNION
                    -- Amis à qui l'utilisateur a envoyé une demande
                    SELECT friend_id FROM friendships 
                    WHERE user_id = ? AND status = 'accepted'
                )
            )
            GROUP BY p.id
        )
        SELECT * FROM ranked_posts
        ORDER BY 
            time_priority,
            shuffle_seed DESC,
            created_at DESC
        LIMIT ? OFFSET ?
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        $user['user_id'],  // Pour user_liked
        $user['user_id'],  // Pour user_like_type
        $user['user_id'],  // Seed pour RAND()
        $user['user_id'],  // Pour p.user_id = ?
        $user['user_id'],  // Pour friend_id = ?
        $user['user_id'],  // Pour user_id = ?
        $limit,
        $offset
    ]);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Post-traitement pour éviter les auteurs consécutifs
    $shuffledPosts = [];
    $usedAuthors = [];
    
    foreach ($posts as $post) {
        $authorId = $post['user_id'];
        
        // Si l'auteur a déjà été utilisé récemment, on le met en attente
        if (in_array($authorId, $usedAuthors)) {
            // Chercher un post d'un autre auteur dans la liste
            $alternativePost = null;
            foreach ($posts as $altPost) {
                if (!in_array($altPost['user_id'], $usedAuthors) && !in_array($altPost['id'], array_column($shuffledPosts, 'id'))) {
                    $alternativePost = $altPost;
                    break;
                }
            }
            
            if ($alternativePost) {
                $shuffledPosts[] = $alternativePost;
                $usedAuthors[] = $alternativePost['user_id'];
                // Garder seulement les 3 derniers auteurs pour éviter la répétition
                if (count($usedAuthors) > 3) {
                    array_shift($usedAuthors);
                }
            } else {
                // Si pas d'alternative, on ajoute quand même mais on réinitialise
                $shuffledPosts[] = $post;
                $usedAuthors = [$authorId];
            }
        } else {
            $shuffledPosts[] = $post;
            $usedAuthors[] = $authorId;
            // Garder seulement les 3 derniers auteurs
            if (count($usedAuthors) > 3) {
                array_shift($usedAuthors);
            }
        }
    }
    
    $posts = $shuffledPosts;

    // Récupération des commentaires pour chaque post
    foreach ($posts as &$post) {
        // Vérification de l'existence de la clé 'id' avant usage
        if (!isset($post['id'])) continue;

        // Commentaires récents (max 3) avec likes et réponses
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

    // Récupération du nombre total de posts pour la pagination
    // Modifié pour compter uniquement les posts des amis et de l'utilisateur lui-même
    $countQuery = "
        SELECT COUNT(*) as total 
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        WHERE p.is_public = 1 AND u.is_active = 1 AND u.email_confirmed = 1
        AND (
            -- Posts de l'utilisateur lui-même
            p.user_id = ?
            OR 
            -- Posts des amis (relation acceptée)
            p.user_id IN (
                -- Amis qui ont envoyé une demande à l'utilisateur
                SELECT user_id FROM friendships 
                WHERE friend_id = ? AND status = 'accepted'
                UNION
                -- Amis à qui l'utilisateur a envoyé une demande
                SELECT friend_id FROM friendships 
                WHERE user_id = ? AND status = 'accepted'
            )
        )
    ";
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute([
        $user['user_id'],  // Pour p.user_id = ?
        $user['user_id'],  // Pour friend_id = ?
        $user['user_id']   // Pour user_id = ?
    ]);
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
} catch (Throwable $e) {
    log_error('Feed error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'user_id' => $user['id'] ?? null
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement du flux.']);
}

/**
 * Formate une date en temps relatif (ex: "il y a 2 heures")
 */
function formatRelativeTime($datetime)
{
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

<?php
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../lib/cors.php';
handle_cors();

header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

// Désactiver l'affichage des erreurs PHP en production
if (getenv('APP_ENV') === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

$post_id = isset($_GET['post_id']) ? intval($_GET['post_id']) : 0;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

if ($post_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Paramètre post_id manquant ou invalide']);
    exit;
}

try {
    $pdo = get_db_connection();
    // Compter le total
    $stmtTotal = $pdo->prepare('SELECT COUNT(*) FROM comments WHERE post_id = :post_id');
    $stmtTotal->execute(['post_id' => $post_id]);
    $total = (int)$stmtTotal->fetchColumn();

    // Récupérer les commentaires paginés (du plus récent au plus ancien) avec likes et réponses
    $stmt = $pdo->prepare('SELECT c.id, c.contenu, c.created_at, c.user_id, c.parent_id, u.nom, u.prenom, u.photo_profil,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as replies_count,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = :current_user_id) as user_liked
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = :post_id AND c.parent_id IS NULL
        ORDER BY c.created_at DESC
        LIMIT :limit OFFSET :offset');
    $stmt->bindValue(':post_id', $post_id, PDO::PARAM_INT);
    $stmt->bindValue(':current_user_id', isset($_GET['user_id']) ? intval($_GET['user_id']) : 0, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formatage des dates
    foreach ($comments as &$comment) {
        $comment['created_at_formatted'] = date('d/m/Y H:i', strtotime($comment['created_at']));
    }

    $has_next = ($offset + $limit) < $total;

    echo json_encode([
        'success' => true,
        'data' => [
            'comments' => $comments,
            'pagination' => [
                'offset' => $offset,
                'limit' => $limit,
                'total' => $total,
                'has_next' => $has_next
            ]
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur : ' . $e->getMessage()]);
    exit;
} 
<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/cors.php';
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

$comment_id = isset($_GET['comment_id']) ? intval($_GET['comment_id']) : 0;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

if ($comment_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Paramètre comment_id manquant ou invalide']);
    exit;
}

try {
    $pdo = get_db_connection();
    
    // Vérifier que le commentaire parent existe
    $stmtParent = $pdo->prepare('SELECT id FROM comments WHERE id = :comment_id AND parent_id IS NULL');
    $stmtParent->execute(['comment_id' => $comment_id]);
    if (!$stmtParent->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Commentaire parent introuvable']);
        exit;
    }
    
    // Compter le total des réponses
    $stmtTotal = $pdo->prepare('SELECT COUNT(*) FROM comments WHERE parent_id = :comment_id');
    $stmtTotal->execute(['comment_id' => $comment_id]);
    $total = (int)$stmtTotal->fetchColumn();

    // Récupérer les réponses paginées (du plus récent au plus ancien)
    $stmt = $pdo->prepare('SELECT c.id, c.contenu, c.created_at, c.user_id, c.parent_id, u.nom, u.prenom, u.photo_profil
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.parent_id = :comment_id
        ORDER BY c.created_at ASC
        LIMIT :limit OFFSET :offset');
    $stmt->bindValue(':comment_id', $comment_id, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $replies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formatage des dates
    foreach ($replies as &$reply) {
        $reply['created_at_formatted'] = date('d/m/Y H:i', strtotime($reply['created_at']));
    }

    $has_next = ($offset + $limit) < $total;

    echo json_encode([
        'success' => true,
        'data' => [
            'replies' => $replies,
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
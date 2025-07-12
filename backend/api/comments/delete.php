<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../lib/jwt.php';
handle_cors();

header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

// Désactiver l'affichage des erreurs PHP en production
if (getenv('APP_ENV') === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Authentification utilisateur (JWT)
$user = get_authenticated_user();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Utilisateur non authentifié']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$comment_id = isset($input['comment_id']) ? intval($input['comment_id']) : 0;

if ($comment_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'ID de commentaire manquant ou invalide']);
    exit;
}

try {
    $pdo = get_db_connection();
    
    // Vérifier que le commentaire existe et appartient à l'utilisateur
    $stmt = $pdo->prepare('SELECT c.id, c.post_id, c.user_id, c.parent_id, u.nom, u.prenom 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.id = :comment_id');
    $stmt->execute(['comment_id' => $comment_id]);
    $comment = $stmt->fetch();
    
    if (!$comment) {
        echo json_encode(['success' => false, 'error' => 'Commentaire introuvable']);
        exit;
    }
    
    // Vérifier que l'utilisateur est le propriétaire du commentaire
    if ($comment['user_id'] != $user['id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Vous ne pouvez supprimer que vos propres commentaires']);
        exit;
    }
    
    // Récupérer les informations avant suppression pour la réponse
    $post_id = $comment['post_id'];
    $is_reply = $comment['parent_id'] !== null;
    
    // Supprimer le commentaire (les réponses et likes seront supprimés automatiquement via CASCADE)
    $stmt = $pdo->prepare('DELETE FROM comments WHERE id = :comment_id AND user_id = :user_id');
    $stmt->execute([
        'comment_id' => $comment_id,
        'user_id' => $user['id']
    ]);
    
    if ($stmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la suppression du commentaire']);
        exit;
    }
    
    // Récupérer le nouveau compteur de commentaires pour le post
    $stmtCount = $pdo->prepare('SELECT COUNT(*) as comments_count FROM comments WHERE post_id = :post_id');
    $stmtCount->execute(['post_id' => $post_id]);
    $comments_count = (int)$stmtCount->fetchColumn();
    
    // Si c'était une réponse, récupérer le nouveau compteur de réponses pour le commentaire parent
    $replies_count = null;
    if ($is_reply) {
        $stmtRepliesCount = $pdo->prepare('SELECT COUNT(*) as replies_count FROM comments WHERE parent_id = :parent_id');
        $stmtRepliesCount->execute(['parent_id' => $comment['parent_id']]);
        $replies_count = (int)$stmtRepliesCount->fetchColumn();
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'comment_id' => $comment_id,
            'post_id' => $post_id,
            'comments_count' => $comments_count,
            'replies_count' => $replies_count,
            'is_reply' => $is_reply,
            'parent_comment_id' => $comment['parent_id']
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur : ' . $e->getMessage()]);
    exit;
} 
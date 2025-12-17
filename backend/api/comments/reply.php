<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../lib/jwt.php';
handle_cors();

header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
$parent_comment_id = isset($input['parent_comment_id']) ? intval($input['parent_comment_id']) : 0;
$contenu = isset($input['contenu']) ? trim($input['contenu']) : '';

if ($parent_comment_id <= 0 || $contenu === '') {
    echo json_encode(['success' => false, 'error' => 'Paramètres manquants ou invalides']);
    exit;
}

try {
    $pdo = get_db_connection();
    
    // Vérifier que le commentaire parent existe et récupérer le post_id
    $stmtParent = $pdo->prepare('SELECT c.id, c.post_id, c.parent_id FROM comments c WHERE c.id = :parent_comment_id');
    $stmtParent->execute(['parent_comment_id' => $parent_comment_id]);
    $parentComment = $stmtParent->fetch();
    
    if (!$parentComment) {
        echo json_encode(['success' => false, 'error' => 'Commentaire parent introuvable']);
        exit;
    }
    
    // Vérifier que le commentaire parent n'est pas déjà une réponse (un seul niveau de profondeur)
    if ($parentComment['parent_id'] !== null) {
        echo json_encode(['success' => false, 'error' => 'Impossible de répondre à une réponse']);
        exit;
    }
    
    // Insérer la réponse
    $stmt = $pdo->prepare('INSERT INTO comments (post_id, user_id, contenu, parent_id, created_at) VALUES (:post_id, :user_id, :contenu, :parent_id, CURRENT_TIMESTAMP)');
    $stmt->execute([
        'post_id' => $parentComment['post_id'],
        'user_id' => $user['id'],
        'contenu' => $contenu,
        'parent_id' => $parent_comment_id
    ]);
    $reply_id = $pdo->lastInsertId();
    
    // Récupérer la réponse créée avec infos utilisateur
    $stmt = $pdo->prepare('SELECT c.id, c.contenu, c.created_at, c.user_id, c.parent_id, u.nom, u.prenom, u.photo_profil
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = :reply_id');
    $stmt->execute(['reply_id' => $reply_id]);
    $reply = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($reply) {
        $reply['created_at_formatted'] = date('d/m/Y H:i', strtotime($reply['created_at']));
    }
    
    // Récupérer le nouveau compteur de commentaires pour le post
    $stmtCount = $pdo->prepare('SELECT COUNT(*) as comments_count FROM comments WHERE post_id = :post_id');
    $stmtCount->execute(['post_id' => $parentComment['post_id']]);
    $comments_count = (int)$stmtCount->fetchColumn();
    
    // Récupérer le nombre de réponses pour le commentaire parent
    $stmtRepliesCount = $pdo->prepare('SELECT COUNT(*) as replies_count FROM comments WHERE parent_id = :parent_id');
    $stmtRepliesCount->execute(['parent_id' => $parent_comment_id]);
    $replies_count = (int)$stmtRepliesCount->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'reply' => $reply,
            'parent_comment_id' => $parent_comment_id,
            'post_id' => $parentComment['post_id'],
            'comments_count' => $comments_count,
            'replies_count' => $replies_count
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur : ' . $e->getMessage()]);
    exit;
} 
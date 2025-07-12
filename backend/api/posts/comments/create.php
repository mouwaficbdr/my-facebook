<?php
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../lib/cors.php';
require_once __DIR__ . '/../../../lib/jwt.php';
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
$post_id = isset($input['post_id']) ? intval($input['post_id']) : 0;
$contenu = isset($input['contenu']) ? trim($input['contenu']) : '';

if ($post_id <= 0 || $contenu === '') {
    echo json_encode(['success' => false, 'error' => 'Paramètres manquants ou invalides']);
    exit;
}

try {
    $pdo = get_db_connection();
    // Vérifier que le post existe
    $stmtPost = $pdo->prepare('SELECT id FROM posts WHERE id = :post_id');
    $stmtPost->execute(['post_id' => $post_id]);
    if (!$stmtPost->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Post introuvable']);
        exit;
    }
    // Insérer le commentaire
    $stmt = $pdo->prepare('INSERT INTO comments (post_id, user_id, contenu, created_at) VALUES (:post_id, :user_id, :contenu, NOW())');
    $stmt->execute([
        'post_id' => $post_id,
        'user_id' => $user['id'],
        'contenu' => $contenu
    ]);
    $comment_id = $pdo->lastInsertId();
    // Récupérer le commentaire créé avec infos utilisateur
    $stmt = $pdo->prepare('SELECT c.id, c.contenu, c.created_at, c.user_id, u.nom, u.prenom, u.photo_profil
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = :comment_id');
    $stmt->execute(['comment_id' => $comment_id]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($comment) {
        $comment['created_at_formatted'] = date('d/m/Y H:i', strtotime($comment['created_at']));
    }
    
    // Récupérer le nouveau compteur de commentaires
    $stmtCount = $pdo->prepare('SELECT COUNT(*) as comments_count FROM comments WHERE post_id = :post_id');
    $stmtCount->execute(['post_id' => $post_id]);
    $comments_count = (int)$stmtCount->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'comment' => $comment,
            'post_id' => $post_id,
            'comments_count' => $comments_count
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur : ' . $e->getMessage()]);
    exit;
} 
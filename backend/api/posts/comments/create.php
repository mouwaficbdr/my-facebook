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
    $stmtPost = $pdo->prepare('SELECT id, user_id FROM posts WHERE id = :post_id');
    $stmtPost->execute(['post_id' => $post_id]);
    $post = $stmtPost->fetch(PDO::FETCH_ASSOC);
    if (!$post) {
        echo json_encode(['success' => false, 'error' => 'Post introuvable']);
        exit;
    }
    // Insérer le commentaire
    $stmt = $pdo->prepare('INSERT INTO comments (post_id, user_id, contenu, created_at) VALUES (:post_id, :user_id, :contenu, CURRENT_TIMESTAMP)');
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
    
    // Log des variables clés avant la condition de notification
    if (function_exists('log_error')) log_error('DEBUG: Variables avant notif COMMENT', [
        'user_id' => $user['id'] ?? null,
        'post_user_id' => $post['user_id'] ?? null
    ]);
    // Après avoir inséré le commentaire, générer une notification si besoin
    if ($user['id'] !== $post['user_id']) {
        if (function_exists('log_error')) log_error('DEBUG: Passage dans le bloc notification COMMENT', ['post_user_id' => $post['user_id'], 'from_user_id' => $user['id']]);
        try {
            // Récupérer toutes les infos utilisateur pour enrichir la notification
            $user_id = $user['id'];
            $stmt = $pdo->prepare('SELECT id, prenom, nom, photo_profil FROM users WHERE id = ? LIMIT 1');
            $stmt->execute([$user_id]);
            $user_full = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user_full) {
                $user = array_merge($user, $user_full);
            }
            // Fallback safe pour tronquer la description du commentaire
            if (function_exists('mb_strimwidth')) {
                $description = mb_strimwidth($contenu, 0, 60, '...');
            } else {
                $description = strlen($contenu) > 60 ? substr($contenu, 0, 57) . '...' : $contenu;
            }
            $notifData = [
                'user_id' => $user['id'],
                'prenom' => $user['prenom'],
                'nom' => $user['nom'],
                'avatar' => $user['photo_profil'] ?? null,
                'post_id' => $post['id'],
                'comment_id' => $comment_id,
                'title' => $user['prenom'] . ' a commenté votre post',
                'description' => $description,
            ];
            $notifTitle = $notifData['title'];
            $notifMessage = $notifData['description'];
            $notifStmt = $pdo->prepare('INSERT INTO notifications (user_id, from_user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)');
            $notifStmt->execute([
                $post['user_id'],
                $user['id'],
                'comment',
                $notifTitle,
                $notifMessage,
                json_encode($notifData, JSON_UNESCAPED_UNICODE)
            ]);
            if (function_exists('log_error')) log_error('Notif comment OK', ['post_user_id' => $post['user_id'], 'from_user_id' => $user['id']]);
        } catch (Throwable $e) {
            if (function_exists('log_error')) log_error('Erreur notif comment', ['err' => $e->getMessage()]);
        }
    }

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
<?php
// api/posts/share.php - Partager un post avec un ami (pour l'avenir)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
require_once __DIR__ . '/../../lib/validation.php';
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

// Vérification méthode HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
    exit;
}

// Parsing JSON POST
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Requête invalide (JSON attendu).']);
    exit;
}

// Validation des données
$rules = [
    'post_id' => ['required', 'integer'],
    'friend_id' => ['required', 'integer']
];

$errors = validate($input, $rules);
if ($errors) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

try {
    $pdo = getPDO();
    
    // Vérification que le post existe et est public
    $postQuery = "SELECT id, user_id, contenu FROM posts WHERE id = ? AND is_public = 1";
    $postStmt = $pdo->prepare($postQuery);
    $postStmt->execute([$input['post_id']]);
    $post = $postStmt->fetch();
    
    if (!$post) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Post non trouvé ou privé.']);
        exit;
    }
    
    // Vérification que l'ami existe et est bien un ami
    $friendshipQuery = "
        SELECT status FROM friendships 
        WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
        AND status = 'accepted'
    ";
    $friendshipStmt = $pdo->prepare($friendshipQuery);
    $friendshipStmt->execute([
        $user['id'], 
        $input['friend_id'], 
        $input['friend_id'], 
        $user['id']
    ]);
    $friendship = $friendshipStmt->fetch();
    
    if (!$friendship) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé dans vos amis.']);
        exit;
    }
    
    // TODO: Quand la messagerie sera implémentée, créer un message ici
    // Pour l'instant, on simule le partage
    
    // Log du partage pour debug
    log_info('Post shared', [
        'user_id' => $user['id'],
        'post_id' => $input['post_id'],
        'friend_id' => $input['friend_id'],
        'post_content' => substr($post['contenu'], 0, 100) . '...'
    ]);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Post partagé avec succès.',
        'data' => [
            'post_id' => intval($input['post_id']),
            'friend_id' => intval($input['friend_id']),
            'shared_at' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Throwable $e) {
    log_error('Share error', [
        'error' => $e->getMessage(), 
        'user_id' => $user['id'],
        'post_id' => $input['post_id'] ?? null,
        'friend_id' => $input['friend_id'] ?? null
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du partage.']);
} 
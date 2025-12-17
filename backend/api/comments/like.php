<?php
// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// api/comments/like.php - Gestion des likes/unlikes sur les commentaires
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
    'comment_id' => ['required', 'integer'],
    'action' => ['required', 'in:like,unlike'],
    'type' => ['in:like,love,haha,wow,sad,angry']
];

$errors = validate($input, $rules);
if ($errors) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// Type de réaction par défaut
$reactionType = $input['type'] ?? 'like';

try {
    $pdo = getPDO();
    
    // Vérification que le commentaire existe
    $commentQuery = "SELECT c.id, c.post_id FROM comments c WHERE c.id = ?";
    $commentStmt = $pdo->prepare($commentQuery);
    $commentStmt->execute([$input['comment_id']]);
    $comment = $commentStmt->fetch();
    
    if (!$comment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Commentaire non trouvé.']);
        exit;
    }
    
    if ($input['action'] === 'like') {
        // Vérification si l'utilisateur a déjà liké ce commentaire
        $existingQuery = "SELECT id, type FROM comment_likes WHERE user_id = ? AND comment_id = ?";
        $existingStmt = $pdo->prepare($existingQuery);
        $existingStmt->execute([$user['id'], $input['comment_id']]);
        $existingLike = $existingStmt->fetch();
        
        if ($existingLike) {
            // Mise à jour du type de réaction
            $updateQuery = "UPDATE comment_likes SET type = ? WHERE user_id = ? AND comment_id = ?";
            $updateStmt = $pdo->prepare($updateQuery);
            $updateStmt->execute([$reactionType, $user['id'], $input['comment_id']]);
            
            $action = 'updated';
        } else {
            // Nouveau like
            $insertQuery = "INSERT INTO comment_likes (user_id, comment_id, type, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
            $insertStmt = $pdo->prepare($insertQuery);
            $insertStmt->execute([$user['id'], $input['comment_id'], $reactionType]);
            
            $action = 'added';
        }
    } else {
        // Unlike - suppression du like
        $deleteQuery = "DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?";
        $deleteStmt = $pdo->prepare($deleteQuery);
        $deleteStmt->execute([$user['id'], $input['comment_id']]);
        
        $action = 'removed';
    }
    
    // Récupération des nouvelles statistiques
    $statsQuery = "
        SELECT 
            COUNT(*) as total_likes,
            COUNT(CASE WHEN type = 'like' THEN 1 END) as likes,
            COUNT(CASE WHEN type = 'love' THEN 1 END) as loves,
            COUNT(CASE WHEN type = 'haha' THEN 1 END) as hahas,
            COUNT(CASE WHEN type = 'wow' THEN 1 END) as wows,
            COUNT(CASE WHEN type = 'sad' THEN 1 END) as sads,
            COUNT(CASE WHEN type = 'angry' THEN 1 END) as angrys,
            EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?) as user_liked,
            (SELECT type FROM comment_likes WHERE comment_id = ? AND user_id = ? LIMIT 1) as user_like_type
        FROM comment_likes 
        WHERE comment_id = ?
    ";
    
    $statsStmt = $pdo->prepare($statsQuery);
    $statsStmt->execute([
        $input['comment_id'], 
        $user['id'], 
        $input['comment_id'], 
        $user['id'], 
        $input['comment_id']
    ]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    // Formatage des statistiques
    $reactions = [
        'total' => intval($stats['total_likes']),
        'like' => intval($stats['likes']),
        'love' => intval($stats['loves']),
        'haha' => intval($stats['hahas']),
        'wow' => intval($stats['wows']),
        'sad' => intval($stats['sads']),
        'angry' => intval($stats['angrys'])
    ];
    // On ne filtre que les types, mais on garde toujours 'total'
    $reactions_types = $reactions;
    unset($reactions_types['total']);
    $reactions_types = array_filter($reactions_types, function($value) {
        return $value > 0;
    });
    $reactions = ['total' => intval($stats['total_likes'])] + $reactions_types;
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $input['action'] === 'like' ? 'Réaction ajoutée.' : 'Réaction supprimée.',
        'data' => [
            'comment_id' => intval($input['comment_id']),
            'action' => $action,
            'user_liked' => boolval($stats['user_liked']),
            'user_like_type' => $stats['user_like_type'],
            'reactions' => $reactions
        ]
    ]);
    
} catch (Throwable $e) {
    log_error('Comment like error', [
        'error' => $e->getMessage(), 
        'user_id' => $user['id'],
        'comment_id' => $input['comment_id'] ?? null,
        'action' => $input['action'] ?? null
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la gestion de la réaction.']);
} 
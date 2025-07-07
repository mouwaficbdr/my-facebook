<?php
// api/posts/create.php - Création de nouveaux posts
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
    'contenu' => ['required', 'min:1', 'max:5000'],
    'type' => ['required', 'in:text,image,video'],
    'is_public' => ['boolean']
];

$errors = validate($input, $rules);
if ($errors) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// Validation spécifique selon le type
if ($input['type'] === 'image' || $input['type'] === 'video') {
    if (empty($input['image_url'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'URL de média requise pour ce type de post.']);
        exit;
    }
}

try {
    $pdo = getPDO();
    
    // Insertion du post
    $query = "
        INSERT INTO posts (user_id, contenu, image_url, type, is_public, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        $user['id'],
        $input['contenu'],
        $input['image_url'] ?? null,
        $input['type'],
        $input['is_public'] ?? true
    ]);
    
    $postId = $pdo->lastInsertId();
    
    // Récupération du post créé avec informations utilisateur
    $selectQuery = "
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
            0 as likes_count,
            0 as comments_count,
            false as user_liked,
            null as user_like_type
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    ";
    
    $selectStmt = $pdo->prepare($selectQuery);
    $selectStmt->execute([$postId]);
    $post = $selectStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($post) {
        // Formatage des données
        $post['created_at_formatted'] = formatRelativeTime($post['created_at']);
        $post['updated_at_formatted'] = formatRelativeTime($post['updated_at']);
        $post['comments'] = [];
        $post['likes_count'] = intval($post['likes_count']);
        $post['comments_count'] = intval($post['comments_count']);
        $post['user_liked'] = boolval($post['user_liked']);
        $post['user_id'] = intval($post['user_id']);
        $post['id'] = intval($post['id']);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Post créé avec succès.',
            'data' => $post
        ]);
    } else {
        throw new Exception('Erreur lors de la récupération du post créé.');
    }
    
} catch (Throwable $e) {
    log_error('Create post error', [
        'error' => $e->getMessage(), 
        'user_id' => $user['id'],
        'input' => $input
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création du post.']);
}

/**
 * Formate une date en temps relatif (ex: "il y a 2 heures")
 */
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
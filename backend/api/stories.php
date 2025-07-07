<?php
require_once __DIR__ . '/../lib/cors.php';
handle_cors();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/jwt.php';
require_once __DIR__ . '/../lib/auth_middleware.php';

header('Content-Type: application/json');

// Dossier d'upload des stories
$uploadDir = __DIR__ . '/../uploads/stories/';
$uploadUrl = 'uploads/stories/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $pdo = getPDO();
        $sql = 'SELECT s.id, s.user_id, u.nom as user_nom, u.prenom as user_prenom, u.photo_profil as user_avatar, s.image, s.legend, s.created_at
                FROM stories s
                JOIN users u ON s.user_id = u.id
                ORDER BY s.created_at DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $stories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'stories' => $stories]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        exit;
    }
}

if ($method === 'POST') {
    try {
        $pdo = getPDO();
        // Authentification JWT obligatoire
        require_auth();
        $user = $GLOBALS['auth_user'];

        if (!isset($_FILES['image']) || !isset($_POST['legend'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Image and legend required']);
            exit;
        }

        $image = $_FILES['image'];
        $legend = trim($_POST['legend']);

        // Vérification du type de fichier (image uniquement)
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($image['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid image type', 'type' => $image['type']]);
            exit;
        }

        // Générer un nom de fichier unique
        $ext = pathinfo($image['name'], PATHINFO_EXTENSION);
        $filename = $user['id'] . '-' . time() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
        $targetPath = $uploadDir . $filename;
        $relativePath = $uploadUrl . $filename;

        // Déplacer le fichier uploadé
        if (!move_uploaded_file($image['tmp_name'], $targetPath)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save image']);
            exit;
        }

        // Enregistrer la story en BDD
        $sql = 'INSERT INTO stories (user_id, image, legend) VALUES (?, ?, ?)';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user['id'], $relativePath, $legend]);
        $storyId = $pdo->lastInsertId();

        // Récupérer la story créée
        $sql = 'SELECT s.id, s.user_id, u.nom as user_nom, u.prenom as user_prenom, u.photo_profil as user_avatar, s.image, s.legend, s.created_at
                FROM stories s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$storyId]);
        $story = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'story' => $story]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        exit;
    }
}

// TODO: Endpoint DELETE pour supprimer une story
// À implémenter : vérifier l'authentification, autoriser uniquement l'utilisateur propriétaire à supprimer sa story.
// Route : DELETE /api/stories.php?id=xxx

// TODO: Endpoint GET pour compter/afficher les vues d'une story
// À implémenter : stocker et retourner le nombre de vues pour chaque story.
// Route : GET /api/stories.php?vues&id=xxx

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']); 
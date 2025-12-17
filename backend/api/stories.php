<?php
// Désactiver l'affichage des erreurs PHP en production (préserver la sortie JSON)
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}

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

        // Vérifier si on demande une story spécifique
        if (isset($_GET['id'])) {
            $storyId = (int)$_GET['id'];

            // Si on demande les vues d'une story
            if (isset($_GET['vues'])) {
                // Vérifier que l'utilisateur est authentifié
                require_auth();
                $user = $GLOBALS['auth_user'];

                // Vérifier que l'utilisateur est le propriétaire de la story
                $checkOwner = $pdo->prepare('SELECT user_id FROM stories WHERE id = ?');
                $checkOwner->execute([$storyId]);
                $owner = $checkOwner->fetch(PDO::FETCH_ASSOC);

                if (!$owner || $owner['user_id'] != $user['id']) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'error' => 'Vous n\'êtes pas autorisé à voir les statistiques de cette story']);
                    exit;
                }

                // Récupérer les vues
                $sql = 'SELECT sv.id, sv.user_id, u.nom, u.prenom, u.photo_profil, sv.viewed_at
                        FROM story_views sv
                        JOIN users u ON sv.user_id = u.id
                        WHERE sv.story_id = ?
                        ORDER BY sv.viewed_at DESC';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$storyId]);
                $views = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Compter le nombre total de vues
                $countSql = 'SELECT COUNT(*) as total FROM story_views WHERE story_id = ?';
                $countStmt = $pdo->prepare($countSql);
                $countStmt->execute([$storyId]);
                $count = $countStmt->fetch(PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'views' => $views,
                    'count' => $count['total']
                ]);
                exit;
            }

            // Récupérer une story spécifique
            $sql = 'SELECT s.id, s.user_id, u.nom as user_nom, u.prenom as user_prenom, 
                    u.photo_profil as user_avatar, s.image, s.legend, s.created_at,
                    (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) as view_count
                    FROM stories s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$storyId]);
            $story = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$story) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Story non trouvée']);
                exit;
            }

            // Si l'utilisateur est authentifié, marquer la story comme vue
            if (isset($GLOBALS['auth_user'])) {
                $user = $GLOBALS['auth_user'];

                // Ne pas compter la vue si l'utilisateur est le propriétaire
                if ($user['id'] != $story['user_id']) {
                    // Insérer la vue (ignore si déjà vue - compatible Postgres)
                    $viewSql = 'INSERT INTO story_views (story_id, user_id) VALUES (?, ?) ON CONFLICT (story_id, user_id) DO NOTHING';
                    $viewStmt = $pdo->prepare($viewSql);
                    $viewStmt->execute([$storyId, $user['id']]);

                    // Mettre à jour le compteur de vues
                    $story['view_count'] = (int)$story['view_count'] + ($viewStmt->rowCount() > 0 ? 1 : 0);
                }
            }

            echo json_encode(['success' => true, 'story' => $story]);
            exit;
        }

        // Filtrer par amis si l'utilisateur est authentifié
        $friendsOnly = isset($_GET['friends']) && $_GET['friends'] === 'true';
        $userId = null;

        if ($friendsOnly) {
            // Authentification requise pour le filtre par amis
            require_auth();
            $user = $GLOBALS['auth_user'];
            $userId = $user['id'];

            // Récupérer les stories de l'utilisateur et de ses amis
            $sql = "SELECT s.id, s.user_id, u.nom as user_nom, u.prenom as user_prenom, 
                    u.photo_profil as user_avatar, s.image, s.legend, s.created_at,
                    (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) as view_count,
                    (SELECT COUNT(*) FROM story_views WHERE story_id = s.id AND user_id = ?) as viewed_by_me
                    FROM stories s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
                    AND (
                        s.user_id = ?
                        OR s.user_id IN (
                            SELECT CASE WHEN user_id = ? THEN friend_id ELSE user_id END
                            FROM friendships 
                            WHERE status = 'accepted' 
                            AND (user_id = ? OR friend_id = ?)
                        )
                    )
                    ORDER BY s.created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId, $userId, $userId, $userId, $userId]);
        } else {
            // Récupérer toutes les stories (pour les 24 dernières heures)
            $sql = "SELECT s.id, s.user_id, u.nom as user_nom, u.prenom as user_prenom, 
                    u.photo_profil as user_avatar, s.image, s.legend, s.created_at,
                    (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) as view_count";

            // Ajouter le statut "vu par moi" si l'utilisateur est authentifié
            if (isset($GLOBALS['auth_user'])) {
                $userId = $GLOBALS['auth_user']['id'];
                $sql .= ", (SELECT COUNT(*) FROM story_views WHERE story_id = s.id AND user_id = ?) as viewed_by_me";
            }

            $sql .= " FROM stories s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
                    ORDER BY s.created_at DESC";

            $stmt = $pdo->prepare($sql);
            if (isset($GLOBALS['auth_user'])) {
                $stmt->execute([$userId]);
            } else {
                $stmt->execute();
            }
        }

        $stories = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Regrouper les stories par utilisateur
        $storiesByUser = [];
        foreach ($stories as $story) {
            $userId = $story['user_id'];
            if (!isset($storiesByUser[$userId])) {
                $storiesByUser[$userId] = [
                    'user_id' => $userId,
                    'user_nom' => $story['user_nom'],
                    'user_prenom' => $story['user_prenom'],
                    'user_avatar' => $story['user_avatar'],
                    'stories' => []
                ];
            }

            // Convertir les valeurs numériques
            $story['view_count'] = (int)$story['view_count'];
            if (isset($story['viewed_by_me'])) {
                $story['viewed_by_me'] = (bool)(int)$story['viewed_by_me'];
            }

            $storiesByUser[$userId]['stories'][] = $story;
        }

        echo json_encode([
            'success' => true,
            'stories' => array_values($storiesByUser)
        ]);
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

        // Débogage - Enregistrer les informations de la requête
        error_log('POST stories.php - Headers: ' . json_encode(getallheaders()));
        error_log('POST stories.php - Cookies: ' . json_encode($_COOKIE));
        error_log('POST stories.php - POST: ' . json_encode($_POST));

        // Solution temporaire pour le débogage: utiliser debug_user_id si fourni
        if (isset($_POST['debug_user_id']) && is_numeric($_POST['debug_user_id'])) {
            $debug_user_id = (int)$_POST['debug_user_id'];
            error_log("Utilisation de debug_user_id: $debug_user_id");

            // Vérifier que l'utilisateur existe
            $checkUser = $pdo->prepare('SELECT id, email, role FROM users WHERE id = ?');
            $checkUser->execute([$debug_user_id]);
            $userRow = $checkUser->fetch(PDO::FETCH_ASSOC);

            if ($userRow) {
                // Utiliser cet utilisateur pour l'authentification
                $GLOBALS['auth_user'] = [
                    'user_id' => $userRow['id'],
                    'email' => $userRow['email'],
                    'role' => $userRow['role'] ?? 'user',
                    'id' => $userRow['id']
                ];
                error_log("Utilisateur trouvé et défini: " . json_encode($GLOBALS['auth_user']));
            } else {
                error_log("Utilisateur avec ID $debug_user_id non trouvé");
            }
        } else {
            // Authentification JWT standard
            require_auth();
        }

        $user = $GLOBALS['auth_user'];

        // Vérifier que l'utilisateur est correctement authentifié
        if (!isset($user['id']) && !isset($user['user_id'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Authentification requise. Utilisateur non identifié.',
                'debug' => [
                    'user' => $user,
                    'cookies' => $_COOKIE,
                    'headers' => getallheaders(),
                    'post' => $_POST
                ]
            ]);
            exit;
        }

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

if ($method === 'DELETE') {
    try {
        // Authentification JWT obligatoire
        require_auth();
        $user = $GLOBALS['auth_user'];

        // Vérifier que l'ID de la story est fourni
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID de story manquant']);
            exit;
        }

        $storyId = (int)$_GET['id'];
        $pdo = getPDO();

        // Vérifier que la story existe et appartient à l'utilisateur
        $checkSql = 'SELECT * FROM stories WHERE id = ? AND user_id = ?';
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$storyId, $user['id']]);
        $story = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$story) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Story non trouvée ou vous n\'êtes pas autorisé à la supprimer']);
            exit;
        }

        // Supprimer l'image du stockage
        $imagePath = __DIR__ . '/../' . $story['image'];
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }

        // Supprimer la story de la base de données
        // Les vues seront automatiquement supprimées grâce à la contrainte ON DELETE CASCADE
        $deleteSql = 'DELETE FROM stories WHERE id = ?';
        $deleteStmt = $pdo->prepare($deleteSql);
        $deleteStmt->execute([$storyId]);

        echo json_encode(['success' => true, 'message' => 'Story supprimée avec succès']);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        exit;
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);

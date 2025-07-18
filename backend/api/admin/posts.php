<?php
// api/admin/posts.php
// Gestion des posts pour le back office

if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/admin_middleware.php';
require_once __DIR__ . '/../../lib/log.php';

header('Content-Type: application/json');

require_admin();

$method = $_SERVER['REQUEST_METHOD'];

try {
  $pdo = getPDO();

  if ($method === 'GET') {
    // Liste des posts avec pagination
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $user_id = intval($_GET['user_id'] ?? 0);

    $offset = ($page - 1) * $limit;

    // Construction de la requête
    $where_conditions = ['p.id > 0'];
    $params = [];

    if ($search) {
      $where_conditions[] = 'p.contenu LIKE ?';
      $params[] = "%$search%";
    }

    if ($user_id > 0) {
      $where_conditions[] = 'p.user_id = ?';
      $params[] = $user_id;
    }

    $where_clause = implode(' AND ', $where_conditions);

    // Requête principale
    $sql = "
            SELECT 
                p.id, p.user_id, p.contenu, p.image_url, p.type, p.is_public,
                p.created_at, p.updated_at,
                u.nom, u.prenom, u.email, u.photo_profil,
                COUNT(DISTINCT l.id) as likes_count,
                COUNT(DISTINCT c.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN likes l ON p.id = l.post_id
            LEFT JOIN comments c ON p.id = c.post_id
            WHERE $where_clause
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        ";

    $params[] = $limit;
    $params[] = $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Compter le total pour la pagination
    $count_sql = "SELECT COUNT(DISTINCT p.id) FROM posts p JOIN users u ON p.user_id = u.id WHERE $where_clause";
    $count_params = array_slice($params, 0, -2); // Enlever limit et offset
    $count_stmt = $pdo->prepare($count_sql);
    $count_stmt->execute($count_params);
    $total = (int) $count_stmt->fetchColumn();

    http_response_code(200);
    echo json_encode([
      'success' => true,
      'data' => [
        'posts' => $posts,
        'pagination' => [
          'page' => $page,
          'limit' => $limit,
          'total' => $total,
          'pages' => ceil($total / $limit)
        ]
      ]
    ]);
  } elseif ($method === 'DELETE') {
    // Suppression d'un post
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input) || !isset($input['post_id'])) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'ID du post requis.']);
      exit;
    }

    $post_id = intval($input['post_id']);
    $reason = $input['reason'] ?? 'Modération administrative';
    $current_user = $GLOBALS['auth_user'];

    // Vérifier que le post existe
    $stmt = $pdo->prepare('
            SELECT p.id, p.user_id, p.contenu, p.image_url, p.type, p.is_public, p.created_at,
                   u.email, u.nom, u.prenom 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.id = ?
        ');
    $stmt->execute([$post_id]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
      http_response_code(404);
      echo json_encode(['success' => false, 'message' => 'Post non trouvé.']);
      exit;
    }

    // Commencer une transaction
    $pdo->beginTransaction();

    try {
      // Définir les variables pour le trigger
      $pdo->exec("SET @current_admin_id = " . $current_user['user_id']);
      $pdo->exec("SET @delete_reason = " . $pdo->quote($reason));

      // Supprimer le post (le trigger va sauvegarder dans deleted_posts)
      $stmt = $pdo->prepare('DELETE FROM posts WHERE id = ?');
      $stmt->execute([$post_id]);

      // Ajouter un log de modération
      $stmt = $pdo->prepare('
                INSERT INTO moderation_logs 
                (admin_id, action_type, target_id, target_type, details, created_at) 
                VALUES (?, ?, ?, ?, ?, NOW())
            ');
      $details = [
        'post_content' => substr($post['contenu'], 0, 200),
        'post_author' => $post['prenom'] . ' ' . $post['nom'],
        'post_author_id' => $post['user_id'],
        'reason' => $reason
      ];
      $stmt->execute([
        $current_user['user_id'],
        'delete_post',
        $post_id,
        'post',
        json_encode($details)
      ]);

      // Valider la transaction
      $pdo->commit();

      // Log de l'action
      log_info('Post deleted by admin', [
        'admin_id' => $current_user['user_id'],
        'admin_role' => $current_user['role'],
        'post_id' => $post_id,
        'post_author_id' => $post['user_id'],
        'post_author_email' => $post['email'],
        'reason' => $reason
      ]);

      http_response_code(200);
      echo json_encode(['success' => true, 'message' => 'Post supprimé avec succès.']);
    } catch (Throwable $e) {
      // Annuler la transaction en cas d'erreur
      $pdo->rollBack();
      throw $e;
    }
  } else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
  }
} catch (Throwable $e) {
  log_error('Admin posts API error', [
    'error' => $e->getMessage(),
    'trace' => $e->getTraceAsString(),
    'method' => $method
  ]);
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
}

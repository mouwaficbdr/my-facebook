<?php
// api/admin/users.php
// Gestion des utilisateurs pour le back office

if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/admin_middleware.php';
require_once __DIR__ . '/../../lib/validation.php';
require_once __DIR__ . '/../../lib/log.php';

header('Content-Type: application/json');

require_admin();

$method = $_SERVER['REQUEST_METHOD'];

try {
  $pdo = getPDO();

  if ($method === 'GET') {
    // Liste des utilisateurs avec pagination
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $role_filter = $_GET['role'] ?? '';

    $offset = ($page - 1) * $limit;

    // Construction de la requête
    $where_conditions = ['u.id > 0'];
    $params = [];

    if ($search) {
      $where_conditions[] = '(u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ?)';
      $search_param = "%$search%";
      $params[] = $search_param;
      $params[] = $search_param;
      $params[] = $search_param;
    }

    if ($role_filter && in_array($role_filter, ['user', 'moderator', 'admin'])) {
      $where_conditions[] = 'u.role = ?';
      $params[] = $role_filter;
    }

    $where_clause = implode(' AND ', $where_conditions);

    // Requête principale
    $sql = "
            SELECT 
                u.id, u.nom, u.prenom, u.email, u.role, u.genre,
                u.date_inscription, u.last_login, u.is_active, u.email_confirmed,
                u.photo_profil, u.ville, u.pays,
                COUNT(DISTINCT p.id) as posts_count,
                COUNT(DISTINCT f1.id) + COUNT(DISTINCT f2.id) as friends_count
            FROM users u
            LEFT JOIN posts p ON u.id = p.user_id
            LEFT JOIN friendships f1 ON u.id = f1.user_id AND f1.status = 'accepted'
            LEFT JOIN friendships f2 ON u.id = f2.friend_id AND f2.status = 'accepted'
            WHERE $where_clause
            GROUP BY u.id
            ORDER BY u.date_inscription DESC
            LIMIT $limit OFFSET $offset
        ";

    // $params[] = $limit; // Enlevé pour Postgres
    // $params[] = $offset; // Enlevé pour Postgres

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Compter le total pour la pagination
    $count_sql = "SELECT COUNT(DISTINCT u.id) FROM users u WHERE $where_clause";
    $count_params = array_slice($params, 0, -2); // Enlever limit et offset
    $count_stmt = $pdo->prepare($count_sql);
    $count_stmt->execute($count_params);
    $total = (int) $count_stmt->fetchColumn();

    http_response_code(200);
    echo json_encode([
      'success' => true,
      'data' => [
        'users' => $users,
        'pagination' => [
          'page' => $page,
          'limit' => $limit,
          'total' => $total,
          'pages' => ceil($total / $limit)
        ]
      ]
    ]);
  } elseif ($method === 'PUT') {
    // Modification d'un utilisateur (rôle, statut)
    if (!can_admin()) {
      http_response_code(403);
      echo json_encode(['success' => false, 'message' => 'Seuls les administrateurs peuvent modifier les utilisateurs.']);
      exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input) || !isset($input['user_id'])) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'Données invalides.']);
      exit;
    }

    $user_id = intval($input['user_id']);
    $new_role = $input['role'] ?? null;
    $is_active = $input['is_active'] ?? null;

    if ($new_role && !in_array($new_role, ['user', 'moderator', 'admin'])) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'Rôle invalide.']);
      exit;
    }

    // Vérifier que l'utilisateur existe
    $stmt = $pdo->prepare('SELECT id, role, email FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $target_user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$target_user) {
      http_response_code(404);
      echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé.']);
      exit;
    }

    // Empêcher la modification de son propre compte
    $current_user = $GLOBALS['auth_user'];
    if ($user_id == $current_user['user_id']) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'Vous ne pouvez pas modifier votre propre compte.']);
      exit;
    }

    $updates = [];
    $params = [];

    if ($new_role !== null) {
      $updates[] = 'role = ?';
      $params[] = $new_role;
    }

    if ($is_active !== null) {
      $updates[] = 'is_active = ?';
      $params[] = $is_active ? 'true' : 'false';
    }

    if (empty($updates)) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'Aucune modification spécifiée.']);
      exit;
    }

    $params[] = $user_id;
    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Log de l'action
    log_info('User modified by admin', [
      'admin_id' => $current_user['user_id'],
      'target_user_id' => $user_id,
      'changes' => $input
    ]);

    // Ajouter un log de modération
    $stmt = $pdo->prepare('
            INSERT INTO moderation_logs 
            (admin_id, action_type, target_id, target_type, details, created_at) 
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ');
    $details = [
      'previous_role' => $target_user['role'],
      'new_role' => $new_role,
      'is_active' => $is_active,
      'user_email' => $target_user['email']
    ];
    $stmt->execute([
      $current_user['user_id'],
      'change_role',
      $user_id,
      'user',
      json_encode($details)
    ]);

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Utilisateur modifié avec succès.']);
  } elseif ($method === 'DELETE') {
    // Désactivation d'un utilisateur
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input) || !isset($input['user_id'])) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'ID utilisateur requis.']);
      exit;
    }

    $user_id = intval($input['user_id']);
    $current_user = $GLOBALS['auth_user'];

    // Empêcher la suppression de son propre compte
    if ($user_id == $current_user['user_id']) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'Vous ne pouvez pas désactiver votre propre compte.']);
      exit;
    }

    // Vérifier que l'utilisateur existe
    $stmt = $pdo->prepare('SELECT id, email, role FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $target_user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$target_user) {
      http_response_code(404);
      echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé.']);
      exit;
    }

    // Vérifier les permissions : un modérateur ne peut pas désactiver un admin ou un autre modérateur
    if (
      $current_user['role'] === 'moderator' &&
      ($target_user['role'] === 'admin' || $target_user['role'] === 'moderator')
    ) {
      http_response_code(403);
      echo json_encode(['success' => false, 'message' => 'Vous n\'avez pas les droits pour désactiver cet utilisateur.']);
      exit;
    }

    // Seul un admin peut désactiver un autre admin
    if ($target_user['role'] === 'admin' && $current_user['role'] !== 'admin') {
      http_response_code(403);
      echo json_encode(['success' => false, 'message' => 'Seul un administrateur peut désactiver un autre administrateur.']);
      exit;
    }

    // Désactiver plutôt que supprimer (soft delete)
    $stmt = $pdo->prepare('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$user_id]);

    // Log de l'action
    log_info('User deactivated by admin', [
      'admin_id' => $current_user['user_id'],
      'target_user_id' => $user_id,
      'target_email' => $target_user['email']
    ]);

    // Ajouter un log de modération
    $stmt = $pdo->prepare('
            INSERT INTO moderation_logs 
            (admin_id, action_type, target_id, target_type, details, created_at) 
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ');
    $details = [
      'user_email' => $target_user['email'],
      'user_role' => $target_user['role']
    ];
    $stmt->execute([
      $current_user['user_id'],
      'ban_user',
      $user_id,
      'user',
      json_encode($details)
    ]);

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Utilisateur désactivé avec succès.']);
  } else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
  }
} catch (Throwable $e) {
  log_error('Admin users API error', [
    'error' => $e->getMessage(),
    'trace' => $e->getTraceAsString(),
    'method' => $method
  ]);
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
}

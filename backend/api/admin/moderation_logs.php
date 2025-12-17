<?php
// api/admin/moderation_logs.php
// Endpoint pour suivre les actions de modération

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
    // Liste des logs de modération avec pagination
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
    $action_type = trim($_GET['action_type'] ?? '');

    $offset = ($page - 1) * $limit;

    // Construction de la requête
    $where_conditions = ['1=1'];
    $params = [];

    if ($action_type) {
      $where_conditions[] = 'ml.action_type = ?';
      $params[] = $action_type;
    }

    $where_clause = implode(' AND ', $where_conditions);

    // Requête principale
    $sql = "
            SELECT 
                ml.id, ml.admin_id, ml.action_type, ml.target_id, ml.target_type,
                ml.details, ml.created_at,
                a.prenom as admin_prenom, a.nom as admin_nom, a.email as admin_email,
                a.role as admin_role
            FROM moderation_logs ml
            JOIN users a ON ml.admin_id = a.id
            WHERE $where_clause
            ORDER BY ml.created_at DESC
            LIMIT $limit OFFSET $offset
        ";

    // $params[] = $limit;
    // $params[] = $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Compter le total pour la pagination
    $count_sql = "SELECT COUNT(*) FROM moderation_logs ml WHERE $where_clause";
    $count_params = array_slice($params, 0, -2); // Enlever limit et offset
    $count_stmt = $pdo->prepare($count_sql);
    $count_stmt->execute($count_params);
    $total = (int) $count_stmt->fetchColumn();

    http_response_code(200);
    echo json_encode([
      'success' => true,
      'data' => [
        'logs' => $logs,
        'pagination' => [
          'page' => $page,
          'limit' => $limit,
          'total' => $total,
          'pages' => ceil($total / $limit)
        ]
      ]
    ]);
  } elseif ($method === 'POST') {
    // Ajouter un log de modération
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'Données invalides.']);
      exit;
    }

    $admin_id = $GLOBALS['auth_user']['user_id'];
    $action_type = $input['action_type'] ?? '';
    $target_id = intval($input['target_id'] ?? 0);
    $target_type = $input['target_type'] ?? '';
    $details = $input['details'] ?? null;

    if (!$action_type || !$target_id || !$target_type) {
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'Paramètres manquants.']);
      exit;
    }

    $stmt = $pdo->prepare('
            INSERT INTO moderation_logs 
            (admin_id, action_type, target_id, target_type, details, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ');
    $stmt->execute([$admin_id, $action_type, $target_id, $target_type, json_encode($details)]);

    http_response_code(201);
    echo json_encode([
      'success' => true,
      'message' => 'Log de modération enregistré.',
      'data' => [
        'id' => $pdo->lastInsertId()
      ]
    ]);
  } else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
  }
} catch (Throwable $e) {
  log_error('Admin moderation logs API error', [
    'error' => $e->getMessage(),
    'trace' => $e->getTraceAsString(),
    'method' => $method
  ]);
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
}

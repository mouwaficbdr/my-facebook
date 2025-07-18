<?php
// backend/lib/admin_middleware.php
// Middleware spécifique pour les routes d'administration

require_once __DIR__ . '/auth_middleware.php';
require_once __DIR__ . '/log.php';

function require_admin()
{
  require_auth();

  $user = $GLOBALS['auth_user'];
  if (!$user || !isset($user['role'])) {
    log_error('Admin access denied - no role', ['user' => $user]);
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Accès interdit.']);
    exit;
  }

  if ($user['role'] !== 'admin' && $user['role'] !== 'moderator') {
    log_error('Admin access denied - insufficient role', [
      'user_id' => $user['user_id'],
      'role' => $user['role']
    ]);
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Droits administrateur requis.']);
    exit;
  }

  // Log de l'accès admin pour audit
  log_info('Admin access granted', [
    'user_id' => $user['user_id'],
    'role' => $user['role'],
    'endpoint' => $_SERVER['REQUEST_URI'] ?? 'unknown'
  ]);
}

function require_admin_role()
{
  require_auth();

  $user = $GLOBALS['auth_user'];
  if (!$user || $user['role'] !== 'admin') {
    log_error('Admin role required', [
      'user_id' => $user['user_id'] ?? null,
      'role' => $user['role'] ?? null
    ]);
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Seuls les administrateurs peuvent effectuer cette action.']);
    exit;
  }
}

function can_moderate()
{
  if (empty($GLOBALS['auth_user'])) return false;
  $role = $GLOBALS['auth_user']['role'] ?? 'user';
  return in_array($role, ['admin', 'moderator']);
}

function can_admin()
{
  if (empty($GLOBALS['auth_user'])) return false;
  return ($GLOBALS['auth_user']['role'] ?? 'user') === 'admin';
}

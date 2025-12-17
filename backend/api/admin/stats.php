<?php
// api/admin/stats.php
// Statistiques pour le dashboard admin

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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
  exit;
}

try {
  $pdo = getPDO();

  // Mettre à jour les statistiques du jour
  $pdo->exec('CALL update_daily_stats()');

  // Statistiques générales
  $stats = [];

  // Nombre total d'utilisateurs
  $stmt = $pdo->query('SELECT COUNT(*) as total FROM users WHERE is_active = true');
  $stats['total_users'] = (int) $stmt->fetchColumn();

  // Nombre total de posts
  $stmt = $pdo->query('SELECT COUNT(*) as total FROM posts');
  $stats['total_posts'] = (int) $stmt->fetchColumn();

  // Nombre de posts supprimés
  $stmt = $pdo->query('SELECT COUNT(*) as total FROM deleted_posts');
  $stats['deleted_posts'] = (int) $stmt->fetchColumn();

  // Nombre de demandes d'amis en cours
  $stmt = $pdo->query("SELECT COUNT(*) as total FROM friendships WHERE status = 'pending'");
  $stats['pending_friend_requests'] = (int) $stmt->fetchColumn();

  // Nouveaux utilisateurs cette semaine
  $stmt = $pdo->query('SELECT COUNT(*) as total FROM users WHERE date_inscription >= CURRENT_TIMESTAMP - INTERVAL \'7 days\'');
  $stats['new_users_week'] = (int) $stmt->fetchColumn();

  // Posts cette semaine
  $stmt = $pdo->query('SELECT COUNT(*) as total FROM posts WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL \'7 days\'');
  $stats['new_posts_week'] = (int) $stmt->fetchColumn();

  // Utilisateurs actifs (connectés dans les 30 derniers jours)
  $stmt = $pdo->query('SELECT COUNT(*) as total FROM users WHERE last_login >= CURRENT_TIMESTAMP - INTERVAL \'30 days\'');
  $stats['active_users_month'] = (int) $stmt->fetchColumn();

  // Évolution activité (posts par jour sur 7 derniers jours)
  $stmt = $pdo->query('
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as posts_count
        FROM posts 
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL \'7 days\'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ');
  $activity_chart = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Répartition par genre
  $stmt = $pdo->query('
        SELECT genre, COUNT(*) as count 
        FROM users 
        WHERE is_active = true 
        GROUP BY genre
    ');
  $gender_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Top 5 utilisateurs les plus actifs (par nombre de posts)
  $stmt = $pdo->query('
        SELECT 
            u.id, u.prenom, u.nom, u.email, u.photo_profil,
            COUNT(p.id) as posts_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
        WHERE u.is_active = true
        GROUP BY u.id, u.prenom, u.nom, u.email, u.photo_profil
        ORDER BY posts_count DESC
        LIMIT 5
    ');
  $top_users = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // Statistiques de modération
  $stmt = $pdo->query('
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
        FROM moderation_logs
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL \'30 days\'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ');
  $moderation_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

  http_response_code(200);
  echo json_encode([
    'success' => true,
    'data' => [
      'stats' => $stats,
      'activity_chart' => $activity_chart,
      'gender_stats' => $gender_stats,
      'top_users' => $top_users,
      'moderation_stats' => $moderation_stats
    ]
  ]);
} catch (Throwable $e) {
  log_error('Admin stats API error', [
    'error' => $e->getMessage(),
    'trace' => $e->getTraceAsString()
  ]);
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
}

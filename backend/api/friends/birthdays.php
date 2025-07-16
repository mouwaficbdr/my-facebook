<?php
// api/friends/birthdays.php - Prochains anniversaires des amis
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}
require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
header('Content-Type: application/json');
require_auth();
$user = $GLOBALS['auth_user'];
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}

$limit = isset($_GET['limit']) ? max(1, min(20, intval($_GET['limit']))) : 3;

try {
    $pdo = getPDO();
    // Récupérer tous les amis acceptés
    $query = "
        SELECT u.id, u.nom, u.prenom, u.photo_profil, u.date_naissance
        FROM users u
        JOIN friendships f ON (
            (f.user_id = ? AND f.friend_id = u.id)
            OR (f.friend_id = ? AND f.user_id = u.id)
        )
        WHERE f.status = 'accepted' AND u.is_active = 1 AND u.email_confirmed = 1
    ";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$user['user_id'], $user['user_id']]);
    $friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $today = new DateTime('today');
    $anniversaires = [];
    foreach ($friends as $f) {
        if (empty($f['date_naissance'])) continue;
        $birth = DateTime::createFromFormat('Y-m-d', $f['date_naissance']);
        if (!$birth) continue;
        // Prochain anniversaire (cette année ou l'année prochaine)
        $next = DateTime::createFromFormat('Y-m-d', $today->format('Y') . '-' . $birth->format('m-d'));
        if ($next < $today) {
            $next->modify('+1 year');
        }
        $f['next_birthday'] = $next->format('Y-m-d');
        $f['days_left'] = (int)$today->diff($next)->format('%a');
        $anniversaires[] = $f;
    }
    // Trier par jours restants
    usort($anniversaires, function($a, $b) {
        return $a['days_left'] <=> $b['days_left'];
    });
    // Limiter
    $anniversaires = array_slice($anniversaires, 0, $limit);
    // Formatage final
    foreach ($anniversaires as &$a) {
        $a['id'] = intval($a['id']);
        unset($a['date_naissance']); // On ne retourne pas la date exacte pour la vie privée
    }
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'birthdays' => $anniversaires,
        'count' => count($anniversaires)
    ]);
    exit;
} catch (Throwable $e) {
    http_response_code(200);
    echo json_encode(['success' => true, 'birthdays' => [], 'count' => 0]);
    exit;
} 
<?php
// api/friends/accept.php - Accepter une demande d'ami
if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
    error_reporting(0);
    ini_set('display_errors', 0);
}
require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/auth_middleware.php';
header('Content-Type: application/json');
// Auth spéciale pour tests automatisés : header X-User-Id
if (getenv('APP_ENV') === 'test' && isset($_SERVER['HTTP_X_USER_ID'])) {
    $userId = intval($_SERVER['HTTP_X_USER_ID']);
    if ($userId > 0) {
        $pdo = getPDO();
        $stmt = $pdo->prepare('SELECT id, email, role FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $GLOBALS['auth_user'] = [
                'user_id' => $row['id'],
                'email' => $row['email'],
                'role' => $row['role'] ?? 'user',
                'id' => $row['id']
            ];
        }
    }
}
require_auth();
$user = $GLOBALS['auth_user'];
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentification requise.']);
    exit;
}
$input = json_decode(file_get_contents('php://input'), true);
$friendId = isset($input['friend_id']) ? intval($input['friend_id']) : 0;
if ($friendId <= 0 || $friendId == $user['user_id']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID cible invalide.']);
    exit;
}
try {
    $pdo = getPDO();
    // Vérifier qu'une demande existe et est bien reçue
    $check = $pdo->prepare("SELECT status FROM friendships WHERE user_id = ? AND friend_id = ? AND status = 'pending'");
    $check->execute([$friendId, $user['user_id']]);
    $row = $check->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Aucune demande à accepter.', 'friend_status' => 'not_friends']);
        exit;
    }
    // Accepter la demande
    $stmt = $pdo->prepare("UPDATE friendships SET status = 'accepted' WHERE user_id = ? AND friend_id = ? AND status = 'pending'");
    $stmt->execute([$friendId, $user['user_id']]);

    // Générer une notification à l'expéditeur (demandeur initial)
    // Récupérer toutes les infos utilisateur pour enrichir la notification
    $user_id = $user['id'];
    $stmtUser = $pdo->prepare('SELECT id, prenom, nom, photo_profil FROM users WHERE id = ? LIMIT 1');
    $stmtUser->execute([$user_id]);
    $user_full = $stmtUser->fetch(PDO::FETCH_ASSOC);
    // Récupérer les infos du demandeur initial (friendId)
    $stmtFriend = $pdo->prepare('SELECT id, prenom, nom, photo_profil FROM users WHERE id = ? LIMIT 1');
    $stmtFriend->execute([$friendId]);
    $friend_full = $stmtFriend->fetch(PDO::FETCH_ASSOC);
    $notifData = [
        'user_id' => $friend_full['id'] ?? $friendId,
        'prenom' => $friend_full['prenom'] ?? null,
        'nom' => $friend_full['nom'] ?? null,
        'avatar' => $friend_full['photo_profil'] ?? null,
        'accepter_id' => $user['id'],
        'title' => (($user_full['prenom'] ?? null) ? $user_full['prenom'] : 'Quelqu\'un') . ' a accepté votre demande d\'ami',
        'description' => '',
    ];
    $notifTitle = $notifData['title'];
    $notifMessage = $notifData['description'];
    $notifStmt = $pdo->prepare('INSERT INTO notifications (user_id, from_user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)');
    $notifStmt->execute([
        $friendId, // l'expéditeur initial de la demande
        $user['id'],
        'friend_request', // doit être une valeur autorisée par l'énum
        $notifTitle,
        $notifMessage,
        json_encode($notifData, JSON_UNESCAPED_UNICODE)
    ]);

    echo json_encode(['success' => true, 'message' => 'Demande acceptée.', 'friend_status' => 'friends']);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'acceptation.', 'error' => $e->getMessage()]);
    exit;
} 
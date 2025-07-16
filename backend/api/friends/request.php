<?php
// api/friends/request.php - Envoyer une demande d'ami
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
    // Vérifier si déjà amis ou demande existante
    $check = $pdo->prepare("SELECT status FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)");
    $check->execute([$user['user_id'], $friendId, $friendId, $user['user_id']]);
    $row = $check->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        if ($row['status'] === 'accepted') {
            echo json_encode(['success' => false, 'message' => 'Déjà amis.', 'friend_status' => 'friends']);
            exit;
        } elseif ($row['status'] === 'pending') {
            echo json_encode(['success' => false, 'message' => 'Demande déjà en attente.', 'friend_status' => 'request_sent']);
            exit;
        }
    }
    // Créer la demande
    // Supprimer toute relation existante (quel que soit le statut)
    $delete = $pdo->prepare("DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)");
    $delete->execute([$user['user_id'], $friendId, $friendId, $user['user_id']]);
    $stmt = $pdo->prepare("INSERT INTO friendships (user_id, friend_id, status, created_at) VALUES (?, ?, 'pending', NOW())");
    $stmt->execute([$user['user_id'], $friendId]);

    // Générer une notification pour le destinataire
    $stmtUser = $pdo->prepare('SELECT id, prenom, nom, photo_profil FROM users WHERE id = ? LIMIT 1');
    $stmtUser->execute([$user['user_id']]);
    $user_full = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if ($user_full) {
        $user = array_merge($user, $user_full);
    }
    $notifData = [
        'user_id' => $user['id'],
        'prenom' => $user['prenom'],
        'nom' => $user['nom'],
        'avatar' => $user['photo_profil'] ?? null,
        'demandeur_id' => $user['id'],
        'title' => $user['prenom'] . ' vous a envoyé une demande d\'ami',
        'description' => '',
    ];
    $notifTitle = $notifData['title'];
    $notifMessage = $notifData['description'];
    $notifStmt = $pdo->prepare('INSERT INTO notifications (user_id, from_user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)');
    $notifStmt->execute([
        $friendId, // destinataire
        $user['id'],
        'friend_request',
        $notifTitle,
        $notifMessage,
        json_encode($notifData, JSON_UNESCAPED_UNICODE)
    ]);

    echo json_encode(['success' => true, 'message' => 'Demande envoyée.', 'friend_status' => 'request_sent']);
    exit;
} catch (Throwable $e) {
    require_once __DIR__ . '/../../lib/log.php';
    log_error('friend_request_error', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
        'user' => $user,
        'friendId' => $friendId,
        'input' => $input,
    ]);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la demande.', 'error' => $e->getMessage()]);
    exit;
} 
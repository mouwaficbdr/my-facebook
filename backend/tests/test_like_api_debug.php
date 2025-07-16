<?php
// backend/tests/test_like_api_debug.php
// Simule un appel API POST sur like.php avec JWT valide et logue la réponse
require_once __DIR__ . '/../config/db.php';

function log_debug($msg, $ctx = []) {
    $line = '[' . date('Y-m-d H:i:s') . "] $msg " . json_encode($ctx, JSON_UNESCAPED_UNICODE) . "\n";
    file_put_contents(__DIR__ . '/../logs/notifications_test_debug.log', $line, FILE_APPEND);
}

// Récupérer l'user_id cible
$email = 'badaroumouwafic@gmail.com';
$pdo = getPDO();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) {
    log_debug('User introuvable', ['email' => $email]);
    echo "User introuvable pour l'email $email\n";
    exit;
}
$user_id = $row['id'];
log_debug('User trouvé', ['email' => $email, 'user_id' => $user_id]);

// Récupérer un post_id existant qui n'appartient pas à l'utilisateur cible
$stmt = $pdo->prepare('SELECT id FROM posts WHERE user_id != ? LIMIT 1');
$stmt->execute([$user_id]);
$post = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$post) {
    log_debug('Aucun post trouvé pour test', []);
    echo "Aucun post trouvé pour test\n";
    exit;
}
$post_id = $post['id'];
log_debug('Post trouvé', ['post_id' => $post_id]);

// Générer un JWT valide pour l'utilisateur cible (en supposant que la clé secrète est connue)
require_once __DIR__ . '/../lib/jwt.php';
$payload = [
    'user_id' => $user_id,
    'email' => $email,
    'role' => 'user',
    'exp' => time() + 3600
];
$jwt = generate_jwt($payload);
log_debug('JWT généré', ['jwt' => $jwt]);

// Préparer la requête POST
$data = [
    'post_id' => $post_id,
    'action' => 'like',
    'type' => 'like'
];
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\nAuthorization: Bearer $jwt\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true
    ]
];
$context  = stream_context_create($options);
$url = 'http://localhost:8000/backend/api/posts/like.php'; // Adapter si besoin
$response = file_get_contents($url, false, $context);
log_debug('Réponse API like.php', ['response' => $response]);
echo "Réponse API : $response\n"; 
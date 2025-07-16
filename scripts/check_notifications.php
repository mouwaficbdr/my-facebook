<?php
// scripts/check_notifications.php
require_once __DIR__ . '/../backend/config/db.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = getPDO();
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    if ($user_id) {
        $stmt = $pdo->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 20');
        $stmt->execute([$user_id]);
    } else {
        $stmt = $pdo->query('SELECT * FROM notifications ORDER BY id DESC LIMIT 20');
    }
    $rows = $stmt->fetchAll();
    if (!$rows) {
        echo "Aucune notification trouvée.\n";
        exit;
    }
    foreach ($rows as $row) {
        echo "ID: {$row['id']} | User: {$row['user_id']} | Type: {$row['type']} | Read: {$row['is_read']} | Date: {$row['created_at']}\n";
        echo "  Data: {$row['data']}\n";
    }
} catch (Throwable $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
} 
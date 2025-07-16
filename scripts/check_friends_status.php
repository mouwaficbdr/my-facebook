<?php
// scripts/check_friends_status.php
// Usage: php check_friends_status.php <user_id>
require_once __DIR__ . '/../backend/config/db.php';

if (php_sapi_name() !== 'cli') {
    echo "Ce script doit être lancé en CLI (php check_friends_status.php <user_id>)\n";
    exit(1);
}

if ($argc < 2) {
    echo "Usage: php check_friends_status.php <user_id>\n";
    exit(1);
}

$userId = intval($argv[1]);
if ($userId <= 0) {
    echo "ID utilisateur invalide.\n";
    exit(1);
}

$pdo = getPDO();

// Récupérer tous les amis (accepted)
$sql = "
    SELECT u.id, u.nom, u.prenom, u.is_active, u.email_confirmed
    FROM users u
    JOIN friendships f ON (
        (f.user_id = ? AND f.friend_id = u.id)
        OR (f.friend_id = ? AND f.user_id = u.id)
    )
    WHERE f.status = 'accepted' AND u.id != ?
    ORDER BY u.nom, u.prenom
";
$stmt = $pdo->prepare($sql);
$stmt->execute([$userId, $userId, $userId]);
$friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

$total = count($friends);
$active_confirmed = 0;
$inactive_or_unconfirmed = 0;

foreach ($friends as $friend) {
    if ($friend['is_active'] && $friend['email_confirmed']) {
        $active_confirmed++;
    } else {
        $inactive_or_unconfirmed++;
    }
}

echo "\nUtilisateur #$userId\n";
echo "Total amis (accepted): $total\n";
echo "Amis actifs + email_confirmed: $active_confirmed\n";
echo "Amis inactifs ou non confirmés: $inactive_or_unconfirmed\n";
echo "\nDétail:\n";
foreach ($friends as $friend) {
    echo "- #{$friend['id']} {$friend['prenom']} {$friend['nom']} | actif: {$friend['is_active']} | confirmé: {$friend['email_confirmed']}\n";
} 
<?php
// scripts/add_test_friends.php
// Ce script ajoute des relations d'amitié (status 'accepted') entre 5 utilisateurs existants et vérifiés.
// L'utilisateur avec l'email 'badaroumouwafc@gmail.com' aura les 4 autres comme amis.

require_once __DIR__ . '/../backend/config/db.php';

$pdo = getPDO();

// 1. Sélectionner 5 utilisateurs vérifiés (email_confirmed = 1, is_active = 1)
$stmt = $pdo->prepare("SELECT id, email, prenom, nom FROM users WHERE email_confirmed = 1 AND is_active = 1 ORDER BY id ASC LIMIT 5");
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($users) < 5) {
    echo "Il faut au moins 5 utilisateurs vérifiés dans la base.\n";
    exit(1);
}

// 2. Trouver l'utilisateur cible
$mainUser = null;
foreach ($users as $u) {
    if ($u['email'] === 'badaroumouwafic@gmail.com') {
        $mainUser = $u;
        break;
    }
}
if (!$mainUser) {
    echo "Utilisateur avec l'email badaroumouwafc@gmail.com non trouvé parmi les 5.\n";
    exit(1);
}

// 3. Créer toutes les amitiés entre les 5 (non redondant, non dupliqué)
$friendPairs = [];
foreach ($users as $i => $u1) {
    foreach ($users as $j => $u2) {
        if ($i < $j) {
            $friendPairs[] = [$u1['id'], $u2['id']];
        }
    }
}

// 4. Insérer les amitiés (status 'accepted') si elles n'existent pas déjà
$inserted = [];
foreach ($friendPairs as [$id1, $id2]) {
    // Vérifier si la relation existe déjà (dans un sens ou l'autre)
    $check = $pdo->prepare("SELECT id FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)");
    $check->execute([$id1, $id2, $id2, $id1]);
    if (!$check->fetch()) {
        $ins = $pdo->prepare("INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'accepted')");
        $ins->execute([$id1, $id2]);
        $inserted[] = [$id1, $id2];
    }
}

// 5. Afficher le récapitulatif
$userMap = [];
foreach ($users as $u) {
    $userMap[$u['id']] = $u['prenom'] . ' ' . $u['nom'] . ' (' . $u['email'] . ')';
}

echo "\nAmitiés créées :\n";
foreach ($friendPairs as [$id1, $id2]) {
    echo "- " . $userMap[$id1] . " <--> " . $userMap[$id2] . "\n";
}

echo "\nL'utilisateur principal (badaroumouwafc@gmail.com) a pour amis :\n";
foreach ($users as $u) {
    if ($u['id'] !== $mainUser['id']) {
        echo "- " . $userMap[$u['id']] . "\n";
    }
} 
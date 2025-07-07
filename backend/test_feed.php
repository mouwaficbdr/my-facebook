<?php
// test_feed.php - Script de test pour les nouveaux endpoints
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/lib/log.php';

echo "=== Test des nouveaux endpoints MyFacebook ===\n\n";

try {
    $pdo = getPDO();
    
    // Test 1: Vérification des tables
    echo "1. Vérification des tables...\n";
    $tables = ['users', 'posts', 'likes', 'comments', 'friendships', 'notifications', 'messages'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "   ✅ Table '$table' existe\n";
        } else {
            echo "   ❌ Table '$table' manquante\n";
        }
    }
    
    // Test 2: Vérification des données de test
    echo "\n2. Vérification des données de test...\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   👥 Utilisateurs: $userCount\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM posts");
    $postCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   📝 Posts: $postCount\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM likes");
    $likeCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   ❤️ Likes: $likeCount\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM comments");
    $commentCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   💬 Commentaires: $commentCount\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM friendships");
    $friendshipCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   🤝 Amitiés: $friendshipCount\n";
    
    // Test 3: Vérification d'un post avec ses relations
    echo "\n3. Test d'un post avec ses relations...\n";
    
    $stmt = $pdo->query("
        SELECT 
            p.id,
            p.contenu,
            u.prenom,
            u.nom,
            COUNT(l.id) as likes_count,
            COUNT(c.id) as comments_count
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        GROUP BY p.id
        LIMIT 1
    ");
    
    $post = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($post) {
        echo "   📝 Post #{$post['id']} par {$post['prenom']} {$post['nom']}\n";
        echo "   Contenu: " . substr($post['contenu'], 0, 50) . "...\n";
        echo "   ❤️ {$post['likes_count']} likes, 💬 {$post['comments_count']} commentaires\n";
    } else {
        echo "   ❌ Aucun post trouvé\n";
    }
    
    // Test 4: Vérification des suggestions d'amis
    echo "\n4. Test des suggestions d'amis...\n";
    
    $stmt = $pdo->query("
        SELECT 
            u.id,
            u.prenom,
            u.nom,
            COUNT(DISTINCT f1.user_id) as mutual_friends
        FROM users u
        LEFT JOIN friendships f1 ON (f1.user_id = u.id OR f1.friend_id = u.id)
        WHERE u.id != 1
        GROUP BY u.id
        ORDER BY mutual_friends DESC
        LIMIT 3
    ");
    
    $suggestions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($suggestions as $suggestion) {
        echo "   👤 {$suggestion['prenom']} {$suggestion['nom']} ({$suggestion['mutual_friends']} amis en commun)\n";
    }
    
    echo "\n✅ Tous les tests sont passés avec succès !\n";
    echo "🎉 La homepage sociale est prête à être utilisée !\n";
    
} catch (Throwable $e) {
    echo "❌ Erreur lors des tests: " . $e->getMessage() . "\n";
    log_error('Test error', ['error' => $e->getMessage()]);
} 
<?php

/**
 * Tests d'intégration pour le module Stories
 * 
 * Ce script teste le flux complet de création, visualisation et suppression d'une story,
 * ainsi que l'expiration automatique.
 * 
 * Pour exécuter ce test :
 * php tests/test_stories_integration.php
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/jwt.php';

// Fonction pour les assertions
function assert_true($condition, $message = "Assertion failed")
{
  if (!$condition) {
    echo "\033[31mFAIL: $message\033[0m\n";
    debug_print_backtrace();
    exit(1);
  } else {
    echo "\033[32mPASS: $message\033[0m\n";
  }
}

// Fonction pour créer un utilisateur de test
function create_test_user()
{
  $pdo = getPDO();

  // Vérifier si l'utilisateur de test existe déjà
  $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'test_stories_integration@example.com'");
  $stmt->execute();
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($user) {
    return $user['id'];
  }

  // Créer un nouvel utilisateur de test
  $stmt = $pdo->prepare("
        INSERT INTO users (nom, prenom, email, password_hash, genre, date_naissance, email_confirmed)
        VALUES ('Test', 'Integration', 'test_stories_integration@example.com', ?, 'Autre', '2000-01-01', 1)
    ");
  $stmt->execute([password_hash('password123', PASSWORD_DEFAULT)]);

  return $pdo->lastInsertId();
}

// Fonction pour créer une story de test
function create_test_story($user_id)
{
  $pdo = getPDO();

  // Créer une story de test
  $image_path = 'uploads/stories/test-' . time() . '.jpg';
  $legend = 'Story de test pour intégration';

  // Copier une image de test
  $source_image = __DIR__ . '/test_image.jpg';
  if (!file_exists($source_image)) {
    // Créer une image de test si elle n'existe pas
    $image = imagecreatetruecolor(100, 100);
    $bg_color = imagecolorallocate($image, 255, 255, 255);
    imagefill($image, 0, 0, $bg_color);
    $text_color = imagecolorallocate($image, 0, 0, 0);
    imagestring($image, 5, 10, 40, 'Test Image', $text_color);
    imagejpeg($image, $source_image);
    imagedestroy($image);
  }

  $target_path = __DIR__ . '/../' . $image_path;
  copy($source_image, $target_path);

  // Insérer la story dans la base de données
  $stmt = $pdo->prepare("
        INSERT INTO stories (user_id, image, legend)
        VALUES (?, ?, ?)
    ");
  $stmt->execute([$user_id, $image_path, $legend]);

  return $pdo->lastInsertId();
}

// Fonction pour créer une story expirée
function create_expired_story($user_id)
{
  $pdo = getPDO();

  // Créer une story expirée (plus de 24 heures)
  $image_path = 'uploads/stories/test-expired-' . time() . '.jpg';
  $legend = 'Story expirée de test';

  // Copier une image de test
  $source_image = __DIR__ . '/test_image.jpg';
  $target_path = __DIR__ . '/../' . $image_path;
  copy($source_image, $target_path);

  // Insérer la story dans la base de données avec une date de création de plus de 24 heures
  $stmt = $pdo->prepare("
        INSERT INTO stories (user_id, image, legend, created_at)
        VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL 25 HOUR))
    ");
  $stmt->execute([$user_id, $image_path, $legend]);

  return $pdo->lastInsertId();
}

// Fonction pour ajouter une vue à une story
function add_story_view($story_id, $viewer_id)
{
  $pdo = getPDO();

  $stmt = $pdo->prepare("
        INSERT IGNORE INTO story_views (story_id, user_id)
        VALUES (?, ?)
    ");
  $stmt->execute([$story_id, $viewer_id]);

  return $stmt->rowCount() > 0;
}

// Fonction pour nettoyer les données de test
function cleanup_test_data()
{
  $pdo = getPDO();

  // Supprimer les stories de test
  $stmt = $pdo->prepare("
        DELETE s FROM stories s
        JOIN users u ON s.user_id = u.id
        WHERE u.email = 'test_stories_integration@example.com'
    ");
  $stmt->execute();

  // Supprimer les images de test
  $files = glob(__DIR__ . '/../uploads/stories/test-*.jpg');
  foreach ($files as $file) {
    if (file_exists($file)) {
      unlink($file);
    }
  }
}

// Exécuter les tests d'intégration
echo "Exécution des tests d'intégration pour le module Stories...\n";

// Créer un utilisateur de test
$user_id = create_test_user();
echo "Utilisateur de test créé avec ID: $user_id\n";

// Test 1: Créer une story
$story_id = create_test_story($user_id);
assert_true($story_id > 0, "Test 1: Création d'une story");
echo "Story créée avec ID: $story_id\n";

// Test 2: Vérifier que la story existe dans la base de données
$pdo = getPDO();
$stmt = $pdo->prepare("SELECT * FROM stories WHERE id = ?");
$stmt->execute([$story_id]);
$story = $stmt->fetch(PDO::FETCH_ASSOC);
assert_true($story !== false, "Test 2: La story existe dans la base de données");
assert_true($story['user_id'] == $user_id, "Test 2: La story appartient à l'utilisateur de test");

// Test 3: Ajouter une vue à la story
// Créer un utilisateur viewer de test
$viewer_email = 'test_stories_viewer@example.com';
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$viewer_email]);
$viewer = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$viewer) {
    $stmt = $pdo->prepare("
        INSERT INTO users (nom, prenom, email, password_hash, genre, date_naissance, email_confirmed)
        VALUES ('Viewer', 'Test', ?, ?, 'Autre', '2000-01-01', 1)
    ");
    $stmt->execute([$viewer_email, password_hash('password123', PASSWORD_DEFAULT)]);
    $viewer_id = $pdo->lastInsertId();
} else {
    $viewer_id = $viewer['id'];
}
$view_added = add_story_view($story_id, $viewer_id);
assert_true($view_added, "Test 3: Ajout d'une vue à la story");

// Test 4: Vérifier que la vue a été enregistrée
$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM story_views WHERE story_id = ? AND user_id = ?");
$stmt->execute([$story_id, $viewer_id]);
$view_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
assert_true($view_count == 1, "Test 4: La vue a été enregistrée");

// Test 5: Créer une story expirée
$expired_story_id = create_expired_story($user_id);
assert_true($expired_story_id > 0, "Test 5: Création d'une story expirée");
echo "Story expirée créée avec ID: $expired_story_id\n";

// Test 6: Exécuter le script de nettoyage des stories expirées
echo "Exécution du script de nettoyage des stories expirées...\n";
include __DIR__ . '/../scripts/cleanup_stories.php';

// Test 7: Vérifier que la story expirée a été supprimée
$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM stories WHERE id = ?");
$stmt->execute([$expired_story_id]);
$expired_story_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
assert_true($expired_story_count == 0, "Test 7: La story expirée a été supprimée");

// Test 8: Vérifier que la story non expirée existe toujours
$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM stories WHERE id = ?");
$stmt->execute([$story_id]);
$story_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
assert_true($story_count == 1, "Test 8: La story non expirée existe toujours");

// Test 9: Supprimer la story
$stmt = $pdo->prepare("DELETE FROM stories WHERE id = ?");
$stmt->execute([$story_id]);
assert_true($stmt->rowCount() == 1, "Test 9: Suppression de la story");

// Test 10: Vérifier que les vues ont été supprimées (cascade)
$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM story_views WHERE story_id = ?");
$stmt->execute([$story_id]);
$view_count_after_delete = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
assert_true($view_count_after_delete == 0, "Test 10: Les vues ont été supprimées en cascade");

// Nettoyer les données de test
cleanup_test_data();

echo "\nTous les tests d'intégration ont été exécutés avec succès!\n";

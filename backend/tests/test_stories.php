<?php

/**
 * Tests unitaires pour l'API Stories
 * 
 * Pour exécuter ce test :
 * php tests/test_stories.php
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

// Fonction pour effectuer des requêtes HTTP simulées
function mock_request($method, $endpoint, $data = [], $token = null)
{
  // Sauvegarder les variables globales
  $old_server = $_SERVER;
  $old_get = $_GET;
  $old_post = $_POST;
  $old_files = $_FILES;
  $old_cookie = $_COOKIE;

  // Configurer la requête simulée
  $_SERVER['REQUEST_METHOD'] = $method;
  $_SERVER['REQUEST_URI'] = $endpoint;

  if ($method === 'GET') {
    $_GET = $data;
  } else {
    $_POST = $data;
  }

  // Simuler l'authentification JWT si un token est fourni
  if ($token) {
    $_COOKIE['jwt'] = $token;
  } else {
    unset($_COOKIE['jwt']);
  }

  // Capturer la sortie
  ob_start();

  // Inclure le fichier API
  $api_file = __DIR__ . '/../api/' . ltrim($endpoint, '/');
  if (!file_exists($api_file)) {
    ob_end_clean();
    echo "API file not found: $api_file\n";
    return null;
  }

  try {
    include $api_file;
  } catch (Exception $e) {
    ob_end_clean();
    echo "Exception: " . $e->getMessage() . "\n";
    return null;
  }

  $output = ob_get_clean();

  // Restaurer les variables globales
  $_SERVER = $old_server;
  $_GET = $old_get;
  $_POST = $old_post;
  $_FILES = $old_files;
  $_COOKIE = $old_cookie;

  // Analyser la sortie JSON
  return json_decode($output, true);
}

// Fonction pour créer un utilisateur de test
function create_test_user()
{
  $pdo = getPDO();

  // Vérifier si l'utilisateur de test existe déjà
  $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'test_stories@example.com'");
  $stmt->execute();
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($user) {
    return $user['id'];
  }

  // Créer un nouvel utilisateur de test
  $stmt = $pdo->prepare("
        INSERT INTO users (nom, prenom, email, password_hash, genre, date_naissance, email_confirmed)
        VALUES ('Test', 'Stories', 'test_stories@example.com', ?, 'Autre', '2000-01-01', 1)
    ");
  $stmt->execute([password_hash('password123', PASSWORD_DEFAULT)]);

  return $pdo->lastInsertId();
}

// Fonction pour créer un token JWT pour l'utilisateur de test
function create_test_token($user_id)
{
  $payload = [
    'user_id' => $user_id,
    'exp' => time() + 3600
  ];

  return generate_jwt($payload);
}

// Fonction pour nettoyer les données de test
function cleanup_test_data()
{
  $pdo = getPDO();

  // Supprimer les stories de test
  $stmt = $pdo->prepare("
        DELETE s FROM stories s
        JOIN users u ON s.user_id = u.id
        WHERE u.email = 'test_stories@example.com'
    ");
  $stmt->execute();
}

// Exécuter les tests
echo "Exécution des tests pour l'API Stories...\n";

// Créer un utilisateur de test et un token JWT
$user_id = create_test_user();
$token = create_test_token($user_id);

// Test 1: Récupérer les stories (non authentifié)
$response = mock_request('GET', '/stories.php');
assert_true(isset($response['success']) && $response['success'] === true, "Test 1: Récupération des stories (non authentifié)");
assert_true(isset($response['stories']) && is_array($response['stories']), "Test 1: Le format de la réponse est correct");

// Test 2: Récupérer les stories (authentifié)
$response = mock_request('GET', '/stories.php', [], $token);
assert_true(isset($response['success']) && $response['success'] === true, "Test 2: Récupération des stories (authentifié)");
assert_true(isset($response['stories']) && is_array($response['stories']), "Test 2: Le format de la réponse est correct");

// Test 3: Récupérer les stories des amis (authentifié)
$response = mock_request('GET', '/stories.php', ['friends' => 'true'], $token);
assert_true(isset($response['success']) && $response['success'] === true, "Test 3: Récupération des stories des amis");
assert_true(isset($response['stories']) && is_array($response['stories']), "Test 3: Le format de la réponse est correct");

// Test 4: Tentative de suppression sans ID
$response = mock_request('DELETE', '/stories.php', [], $token);
assert_true(isset($response['success']) && $response['success'] === false, "Test 4: Suppression sans ID échoue");
assert_true(isset($response['error']) && strpos($response['error'], 'ID') !== false, "Test 4: Message d'erreur approprié");

// Nettoyer les données de test
cleanup_test_data();

echo "\nTous les tests ont été exécutés avec succès!\n";

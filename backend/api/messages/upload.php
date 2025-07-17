<?php
// api/messages/upload.php
// Upload d'image pour les messages

if (getenv('APP_ENV') === 'production' || getenv('APP_ENV') === 'prod') {
  error_reporting(0);
  ini_set('display_errors', 0);
}

require_once __DIR__ . '/../../lib/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/jwt.php';
require_once __DIR__ . '/../../lib/log.php';

handle_cors();
header('Content-Type: application/json');

// Vérification authentification
$user = verify_jwt();
if (!$user) {
  http_response_code(401);
  echo json_encode(['success' => false, 'message' => 'Non authentifié.']);
  exit;
}

// Vérifier qu'un fichier a été uploadé
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Aucun fichier valide fourni.']);
  exit;
}

$file = $_FILES['image'];

// Validation du type de fichier
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.']);
  exit;
}

// Validation de la taille (max 5MB)
$maxSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxSize) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Fichier trop volumineux. Maximum 5MB.']);
  exit;
}

try {
  // Créer le dossier s'il n'existe pas
  $uploadDir = __DIR__ . '/../../uploads/messages/';
  if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
  }

  // Générer un nom unique
  $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
  $filename = uniqid('msg_' . $user['user_id'] . '_', true) . '.' . $extension;
  $filepath = $uploadDir . $filename;

  // Déplacer le fichier
  if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    throw new Exception('Erreur lors du déplacement du fichier.');
  }

  // URL relative pour la base de données
  $relativeUrl = 'uploads/messages/' . $filename;

  http_response_code(200);
  echo json_encode([
    'success' => true,
    'message' => 'Image uploadée avec succès.',
    'data' => [
      'url' => $relativeUrl,
      'filename' => $filename
    ]
  ]);
} catch (Throwable $e) {
  log_error('Message image upload error', [
    'user_id' => $user['user_id'] ?? null,
    'error' => $e->getMessage()
  ]);

  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Erreur lors de l\'upload de l\'image.'
  ]);
}

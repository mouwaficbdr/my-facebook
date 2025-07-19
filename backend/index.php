<?php
// Configuration automatique des dossiers d'upload au démarrage
if (file_exists(__DIR__ . '/scripts/ensure_upload_dirs.php')) {
    include __DIR__ . '/scripts/ensure_upload_dirs.php';
}

http_response_code(200);
echo json_encode([
  'success' => true,
  'message' => 'Backend PHP Railway opérationnel !',
  'uploads_configured' => true
]); 
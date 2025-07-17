<?php
// Test endpoint pour vérifier la configuration
require_once __DIR__ . '/../../lib/cors.php';
handle_cors();
header('Content-Type: application/json');

echo json_encode([
  'success' => true,
  'message' => 'Messages API is working',
  'timestamp' => date('Y-m-d H:i:s')
]);

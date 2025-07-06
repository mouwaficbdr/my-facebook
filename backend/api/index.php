<?php
require_once __DIR__ . '/../lib/cors.php';

// Gestion CORS
handle_cors();

header('Content-Type: application/json');
http_response_code(200);
echo json_encode([
  'success' => true,
  'message' => 'Backend PHP Railway opérationnel!'
]); 
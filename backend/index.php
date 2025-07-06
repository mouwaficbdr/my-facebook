<?php
http_response_code(200);
echo json_encode([
  'success' => true,
  'message' => 'Backend PHP Railway opérationnel !'
]);
<?php
// backend/config/mail_brevo.php
// Configuration Brevo pour la production

/**
 * Envoie un email via l'API Brevo
 * 
 * @param string $to Adresse email du destinataire
 * @param string $subject Sujet de l'email
 * @param string $body Corps de l'email (HTML)
 * @return bool Succès ou échec de l'envoi
 */
function send_mail_brevo(string $to, string $subject, string $body): bool
{
  // Récupération de la clé API
  $apiKey = getenv('BREVO_API_KEY');

  // Débogage de la clé API
  error_log('DEBUG: Brevo API key length: ' . ($apiKey ? strlen($apiKey) : 0));

  if (!$apiKey) {
    if (function_exists('log_error')) {
      log_error('Brevo API key not configured');
    }
    error_log('ERROR: Brevo API key not configured');
    return false;
  }

  // Nettoyage de la clé API (suppression des espaces et retours à la ligne)
  $apiKey = trim($apiKey);

  // Vérification de l'adresse d'expédition
  $fromEmail = getenv('MAIL_FROM') ?: 'noreply@myfacebook.com';
  $fromName = getenv('MAIL_FROM_NAME') ?: 'MyFacebook';

  error_log('DEBUG: Using sender email: ' . $fromEmail);

  // Préparation des données pour l'API
  $data = [
    'sender' => [
      'email' => $fromEmail,
      'name' => $fromName
    ],
    'to' => [
      [
        'email' => $to
      ]
    ],
    'subject' => $subject,
    'htmlContent' => $body
  ];

  // Log des données envoyées (sans la clé API)
  error_log('DEBUG: Brevo API request data: ' . json_encode($data));

  // Configuration de la requête cURL
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, 'https://api.brevo.com/v3/smtp/email');
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json',
    'api-key: ' . $apiKey
  ]);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Augmentation du timeout
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // Vérification SSL
  curl_setopt($ch, CURLOPT_VERBOSE, true); // Mode verbeux pour le débogage

  // Exécution de la requête
  $response = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $error = curl_error($ch);
  $info = curl_getinfo($ch);
  curl_close($ch);

  // Log des informations de la requête
  error_log('DEBUG: Brevo API response code: ' . $httpCode);
  error_log('DEBUG: Brevo API response: ' . $response);
  if ($error) {
    error_log('DEBUG: Brevo API curl error: ' . $error);
  }

  // Analyse de la réponse
  if ($httpCode === 401) {
    error_log('ERROR: Brevo API authentication failed. Please check your API key.');
    if (function_exists('log_error')) {
      log_error('Brevo API authentication failed', [
        'http_code' => $httpCode,
        'response' => $response
      ]);
    }
    return false;
  }

  // Log des informations de débogage en cas d'erreur
  if ($httpCode < 200 || $httpCode >= 300) {
    if (function_exists('log_error')) {
      log_error('Brevo API error', [
        'http_code' => $httpCode,
        'response' => $response,
        'curl_error' => $error,
        'to' => $to,
        'request_info' => $info
      ]);
    }
    error_log('ERROR: Brevo API error - HTTP Code: ' . $httpCode . ' - Response: ' . $response . ' - cURL Error: ' . $error);
    return false;
  }

  error_log('SUCCESS: Email sent via Brevo API to ' . $to);
  return true;
}

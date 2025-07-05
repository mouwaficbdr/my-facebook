<?php
// backend/config/mail_production.php
// Configuration SendGrid pour la production

function send_mail_production(string $to, string $subject, string $body): bool {
    $apiKey = getenv('SENDGRID_API_KEY');
    if (!$apiKey) {
        log_error('SendGrid API key not configured');
        return false;
    }

    $data = [
        'personalizations' => [
            [
                'to' => [['email' => $to]]
            ]
        ],
        'from' => [
            'email' => getenv('MAIL_FROM') ?: 'noreply@yourdomain.com',
            'name' => getenv('MAIL_FROM_NAME') ?: 'My Facebook'
        ],
        'subject' => $subject,
        'content' => [
            [
                'type' => 'text/html',
                'value' => $body
            ]
        ]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.sendgrid.com/v3/mail/send');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 202) {
        log_error('SendGrid error', [
            'http_code' => $httpCode,
            'response' => $response,
            'to' => $to
        ]);
        return false;
    }

    return true;
} 
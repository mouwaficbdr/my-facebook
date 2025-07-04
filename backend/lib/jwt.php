<?php
// backend/lib/jwt.php

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function generate_jwt(array $payload): string {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $key = getenv('JWT_SECRET') ?: 'changeme';
    $header_enc = base64url_encode(json_encode($header));
    $payload_enc = base64url_encode(json_encode($payload));
    $signature = hash_hmac('sha256', "$header_enc.$payload_enc", $key, true);
    $signature_enc = base64url_encode($signature);
    return "$header_enc.$payload_enc.$signature_enc";
}

function validate_jwt(string $jwt) {
    $key = getenv('JWT_SECRET') ?: 'changeme';
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return false;
    list($header_enc, $payload_enc, $signature_enc) = $parts;
    $header = json_decode(base64url_decode($header_enc), true);
    $payload = json_decode(base64url_decode($payload_enc), true);
    $signature = base64url_decode($signature_enc);
    $expected = hash_hmac('sha256', "$header_enc.$payload_enc", $key, true);
    if (!hash_equals($expected, $signature)) return false;
    if (!isset($payload['exp']) || $payload['exp'] < time()) return false;
    return $payload;
}

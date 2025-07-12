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

function get_authenticated_user() {
    // 1. JWT via cookie
    if (isset($_COOKIE['jwt'])) {
        $jwt = $_COOKIE['jwt'];
    } else {
        // 2. JWT via Authorization: Bearer ...
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        if ($auth && preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
            $jwt = $matches[1];
        } else {
            return null;
        }
    }
    $payload = validate_jwt($jwt);
    if (!$payload) return null;
    // On attend au moins user_id, email, role dans le payload
    if (!isset($payload['user_id'])) return null;
    return [
        'id' => $payload['user_id'],
        'email' => $payload['email'] ?? null,
        'role' => $payload['role'] ?? 'user',
        // Ajoute d'autres champs si besoin
    ];
}

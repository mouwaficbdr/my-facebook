<?php
// backend/tests/test_friends.php
require_once __DIR__ . '/../config/db.php';

function test_received_requests($jwt) {
    $url = "http://localhost:8000/api/friends/received.php";
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "Cookie: jwt=$jwt\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $result = file_get_contents($url, false, $context);
    if ($result === false) {
        echo "[FAIL] received.php: Erreur HTTP.\n";
        return false;
    }
    $data = json_decode($result, true);
    if (!isset($data['success']) || !$data['success']) {
        echo "[FAIL] received.php: Erreur API: ".$data['message']."\n";
        return false;
    }
    if (!isset($data['requests']) || !is_array($data['requests'])) {
        echo "[FAIL] received.php: Champ 'requests' manquant ou invalide.\n";
        return false;
    }
    // Vérifier structure d'une demande si présente
    if (count($data['requests']) > 0) {
        $fields = ['sender_id','created_at','nom','prenom','photo_profil','mutual_friends_count'];
        foreach ($fields as $f) {
            if (!array_key_exists($f, $data['requests'][0])) {
                echo "[FAIL] received.php: Champ '$f' manquant dans une demande.\n";
                return false;
            }
        }
    }
    echo "[OK] received.php: Payload conforme.\n";
    return true;
}

function test_mutual_friends($jwt, $otherUserId) {
    $url = "http://localhost:8000/api/friends/mutual.php?user_id=$otherUserId";
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "Cookie: jwt=$jwt\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $result = file_get_contents($url, false, $context);
    if ($result === false) {
        echo "[FAIL] mutual.php: Erreur HTTP.\n";
        return false;
    }
    $data = json_decode($result, true);
    if (!isset($data['success']) || !$data['success']) {
        echo "[FAIL] mutual.php: Erreur API: ".$data['message']."\n";
        return false;
    }
    if (!isset($data['mutual_friends']) || !is_array($data['mutual_friends'])) {
        echo "[FAIL] mutual.php: Champ 'mutual_friends' manquant ou invalide.\n";
        return false;
    }
    // Vérifier structure d'un mutual si présent
    if (count($data['mutual_friends']) > 0) {
        $fields = ['id','nom','prenom','photo_profil'];
        foreach ($fields as $f) {
            if (!array_key_exists($f, $data['mutual_friends'][0])) {
                echo "[FAIL] mutual.php: Champ '$f' manquant dans un mutual.\n";
                return false;
            }
        }
    }
    echo "[OK] mutual.php: Payload conforme.\n";
    return true;
}

function test_suggestions($jwt) {
    $url = "http://localhost:8000/api/friends/suggestions.php";
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "Cookie: jwt=$jwt\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $result = file_get_contents($url, false, $context);
    if ($result === false) {
        echo "[FAIL] suggestions.php: Erreur HTTP.\n";
        return false;
    }
    $data = json_decode($result, true);
    if (!isset($data['success']) || !$data['success']) {
        echo "[FAIL] suggestions.php: Erreur API: ".$data['message']."\n";
        return false;
    }
    if (!isset($data['data']['suggestions']) || !is_array($data['data']['suggestions'])) {
        echo "[FAIL] suggestions.php: Champ 'suggestions' manquant ou invalide.\n";
        return false;
    }
    // Vérifier structure d'une suggestion si présente
    if (count($data['data']['suggestions']) > 0) {
        $fields = ['id','nom','prenom','photo_profil','mutual_friends','total_friends','date_inscription'];
        foreach ($fields as $f) {
            if (!array_key_exists($f, $data['data']['suggestions'][0])) {
                echo "[FAIL] suggestions.php: Champ '$f' manquant dans une suggestion.\n";
                return false;
            }
        }
    }
    echo "[OK] suggestions.php: Payload conforme.\n";
    return true;
}

// Exemple d'appel (à adapter avec un vrai JWT et userId)
// test_received_requests('eyJhbGciOiJI...');
// test_mutual_friends('eyJhbGciOiJI...', 15);
// test_suggestions('eyJhbGciOiJI...'); 
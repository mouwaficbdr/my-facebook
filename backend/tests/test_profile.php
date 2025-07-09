<?php
// backend/tests/test_profile.php
require_once __DIR__ . '/../config/db.php';

function test_profile_endpoint($userId, $jwt) {
    $url = "http://localhost:8000/api/users/profile.php?id=$userId";
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "Cookie: jwt=$jwt\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    $result = file_get_contents($url, false, $context);
    if ($result === false) {
        echo "[FAIL] Erreur lors de la requête HTTP.\n";
        return false;
    }
    $data = json_decode($result, true);
    if (!$data['success']) {
        echo "[FAIL] Erreur API: ".$data['message']."\n";
        return false;
    }
    $fields = ['user','friend_status','posts','posts_count','friends_count','mutual_friends_count','pagination'];
    foreach ($fields as $f) {
        if (!array_key_exists($f, $data['data'])) {
            echo "[FAIL] Champ manquant: $f\n";
            return false;
        }
    }
    echo "[OK] Profil utilisateur accessible et complet.\n";
    return true;
}

// Exemple d'appel (à adapter avec un vrai JWT valide)
// test_profile_endpoint(15, 'eyJhbGciOiJI...'); 
<?php
// backend/tests/test_validation.php
require_once __DIR__ . '/../lib/validation.php';

function assert_test($cond, $msg) {
    if (!$cond) {
        echo "[FAIL] $msg\n";
        exit(1);
    } else {
        echo "[OK] $msg\n";
    }
}

// Champs de test
$valid = [
    'nom' => 'Jean-Pierre',
    'prenom' => 'Marie Claire',
    'email' => 'test@example.com',
    'password' => 'Abcdef12',
    'genre' => 'Femme',
    'date_naissance' => '2000-05-10'
];
$rules = [
    'nom' => ['required', 'min:2', 'max:50', 'alpha_spaces'],
    'prenom' => ['required', 'min:2', 'max:50', 'alpha_spaces'],
    'email' => ['required', 'email', 'max:255'],
    'password' => ['required', 'min:8', 'max:64', 'password'],
    'genre' => ['required', 'in:Homme,Femme,Autre'],
    'date_naissance' => ['required', 'date', 'before:today', 'age_min:13']
];

// Cas valide
assert_test(count(validate($valid, $rules)) === 0, 'Cas valide accepté');

// Cas invalides
$invalid = $valid;
$invalid['nom'] = 'J1';
assert_test(isset(validate($invalid, $rules)['nom']), 'Nom avec chiffre rejeté');
$invalid['nom'] = 'J';
assert_test(isset(validate($invalid, $rules)['nom']), 'Nom trop court rejeté');
$invalid['prenom'] = 'Marie@';
assert_test(isset(validate($invalid, $rules)['prenom']), 'Prénom avec caractère spécial rejeté');
$invalid['email'] = 'badmail';
assert_test(isset(validate($invalid, $rules)['email']), 'Email invalide rejeté');
$invalid['password'] = 'abcdefg';
assert_test(isset(validate($invalid, $rules)['password']), 'Password faible rejeté');
$invalid['genre'] = 'Alien';
assert_test(isset(validate($invalid, $rules)['genre']), 'Genre non autorisé rejeté');
$invalid['date_naissance'] = '2030-01-01';
assert_test(isset(validate($invalid, $rules)['date_naissance']), 'Date future rejetée');
$invalid['date_naissance'] = '2015-01-01';
assert_test(isset(validate($invalid, $rules)['date_naissance']), 'Âge < 13 rejeté');



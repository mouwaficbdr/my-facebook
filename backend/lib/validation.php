<?php
// backend/lib/validation.php

// TODO: Remplacer strlen() par mb_strlen() quand l'extension mbstring sera activée
function validate(array $data, array $rules): array {
    $errors = [];
    foreach ($rules as $field => $fieldRules) {
        $value = isset($data[$field]) ? trim($data[$field]) : null;
        foreach ($fieldRules as $rule) {
            $params = null;
            if (strpos($rule, ':') !== false) {
                [$rule, $params] = explode(':', $rule, 2);
            }
            $result = null;
            switch ($rule) {
                case 'required':
                    if ($value === null || $value === '') $result = 'Ce champ est requis.';
                    break;
                case 'min':
                    if (strlen($value) < (int)$params) $result = "Minimum $params caractères.";
                    break;
                case 'max':
                    if (strlen($value) > (int)$params) $result = "Maximum $params caractères.";
                    break;
                case 'email':
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) $result = "Format d'email invalide.";
                    break;
                case 'password':
                    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $value)) $result = "Le mot de passe doit contenir majuscule, minuscule et chiffre.";
                    break;
                case 'alphanum':
                    if (!preg_match('/^[a-zA-Z0-9_]+$/u', $value)) $result = "Caractères alphanumériques uniquement.";
                    break;
                case 'alpha_spaces':
                    if (!preg_match('/^[a-zA-ZÀ-ÿ\s\-]+$/u', $value)) $result = "Lettres et espaces uniquement.";
                    break;
                case 'in':
                    $allowed = explode(',', $params);
                    if (!in_array($value, $allowed)) $result = "Valeur non autorisée.";
                    break;
                case 'date':
                    if (!validate_date($value)) $result = "Date invalide.";
                    break;
                case 'before':
                    if ($params === 'today' && strtotime($value) >= strtotime('today')) $result = "La date doit être dans le passé.";
                    break;
                case 'age_min':
                    if (!validate_age_min($value, (int)$params)) $result = "Âge minimum requis : $params ans.";
                    break;
                // TODO: ajouter d'autres règles (regex, unique, etc.)
            }
            if ($result) {
                $errors[$field] = $result;
                break; // Stopper à la première erreur pour ce champ
            }
        }
    }
    return $errors;
}

function validate_date($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}

function validate_age_min($date, $min) {
    if (!validate_date($date)) return false;
    $birth = new DateTime($date);
    $today = new DateTime('today');
    $age = $today->diff($birth)->y;
    return $age >= $min;
}

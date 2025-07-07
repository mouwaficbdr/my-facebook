-- Schéma de la base de données MyFacebook
-- Ce fichier doit être mis à jour à chaque évolution de la structure

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    genre ENUM('Homme', 'Femme', 'Autre') NOT NULL,
    date_naissance DATE NOT NULL,
    email_confirm_token VARCHAR(64) DEFAULT NULL,
    email_confirmed TINYINT(1) NOT NULL DEFAULT 0,
    date_inscription DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Champs pour la gestion des accès et sécurité
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    -- Champs pour la réinitialisation de mot de passe
    reset_password_token VARCHAR(64) DEFAULT NULL,
    reset_token_expiry DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les stories utilisateur
CREATE TABLE IF NOT EXISTS stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    image VARCHAR(255) NOT NULL, -- chemin relatif du fichier image
    legend VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- À mettre à jour à chaque évolution du modèle ! 
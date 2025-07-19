<?php
// Script pour s'assurer que tous les dossiers d'upload existent
// À exécuter au déploiement ou au démarrage

$uploadDirs = [
    'uploads',
    'uploads/posts',
    'uploads/profile',
    'uploads/cover',
    'uploads/stories',
    'uploads/messages'
];

$baseDir = __DIR__ . '/../';

foreach ($uploadDirs as $dir) {
    $fullPath = $baseDir . $dir;
    
    if (!is_dir($fullPath)) {
        if (mkdir($fullPath, 0775, true)) {
            echo "✅ Dossier créé : $dir\n";
        } else {
            echo "❌ Erreur création dossier : $dir\n";
        }
    } else {
        echo "✅ Dossier existe déjà : $dir\n";
    }
    
    // S'assurer que les permissions sont correctes
    if (is_dir($fullPath)) {
        chmod($fullPath, 0775);
    }
}

echo "\n🎉 Configuration des dossiers d'upload terminée !\n"; 
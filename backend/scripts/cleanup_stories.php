<?php

/**
 * Script de nettoyage automatique des stories
 * 
 * Ce script supprime les stories de plus de 24 heures et leurs fichiers associés.
 * Il doit être exécuté périodiquement via un cron job, par exemple toutes les heures :
 * 0 * * * * php /chemin/vers/backend/scripts/cleanup_stories.php
 */

// Charger la configuration de la base de données
require_once __DIR__ . '/../config/db.php';

// Fonction de journalisation
function log_message($message)
{
  $date = date('Y-m-d H:i:s');
  echo "[$date] $message" . PHP_EOL;

  // Optionnel : écrire dans un fichier de log
  $logFile = __DIR__ . '/../logs/stories_cleanup.log';
  file_put_contents($logFile, "[$date] $message" . PHP_EOL, FILE_APPEND);
}

try {
  log_message("Début du nettoyage des stories expirées");

  // Connexion à la base de données
  $pdo = getPDO();

  // Récupérer les stories expirées (plus de 24 heures)
  $sql = "SELECT id, image FROM stories WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)";
  $stmt = $pdo->query($sql);
  $expiredStories = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $count = count($expiredStories);
  log_message("$count stories expirées trouvées");

  if ($count > 0) {
    foreach ($expiredStories as $story) {
      // Supprimer le fichier image
      $imagePath = __DIR__ . '/../' . $story['image'];
      if (file_exists($imagePath)) {
        if (unlink($imagePath)) {
          log_message("Image supprimée : $imagePath");
        } else {
          log_message("Erreur lors de la suppression de l'image : $imagePath");
        }
      } else {
        log_message("Image non trouvée : $imagePath");
      }

      // Supprimer l'entrée de la base de données
      // Les vues associées seront supprimées automatiquement grâce à la contrainte ON DELETE CASCADE
      $deleteSql = "DELETE FROM stories WHERE id = ?";
      $deleteStmt = $pdo->prepare($deleteSql);
      $deleteStmt->execute([$story['id']]);
      log_message("Story #" . $story['id'] . " supprimée de la base de données");
    }
  }

  log_message("Nettoyage des stories terminé avec succès");
  exit(0);
} catch (Exception $e) {
  log_message("ERREUR : " . $e->getMessage());
  log_message("Trace : " . $e->getTraceAsString());
  exit(1);
}

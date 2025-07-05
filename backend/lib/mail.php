<?php
// backend/lib/mail.php

function send_mail($to, $subject, $body) {
    $env = defined('APP_ENV') ? APP_ENV : (getenv('APP_ENV') ?: 'development');
    
    // En production, simuler l'envoi (pas de domaine configuré pour l'instant)
    if ($env === 'production') {
        return send_mail_simulation($to, $subject, $body);
    }
    
    // En développement, simuler aussi (pas de PHPMailer)
    return send_mail_simulation($to, $subject, $body);
}

/**
 * Simulation d'envoi d'email pour la production
 * (En attendant la configuration d'un vrai service d'email)
 */
function send_mail_simulation($to, $subject, $body) {
    // Log de simulation
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'to' => $to,
        'subject' => $subject,
        'body_preview' => substr(strip_tags($body), 0, 100) . '...',
        'simulation' => true
    ];
    
    // Log dans les fichiers
    if (function_exists('log_error')) {
        log_error('Email simulation', $logData);
    }
    
    // Log dans la console (pour Vercel)
    error_log('📧 EMAIL SIMULATION: ' . json_encode($logData));
    
    // Retourner true pour ne pas bloquer le flow
    return true;
}

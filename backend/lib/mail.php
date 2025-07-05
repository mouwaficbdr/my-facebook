<?php
// backend/lib/mail.php
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';
require_once __DIR__ . '/phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function send_mail($to, $subject, $body) {
    $env = defined('APP_ENV') ? APP_ENV : (getenv('APP_ENV') ?: 'development');
    
    // En production, simuler l'envoi (pas de domaine configuré pour l'instant)
    if ($env === 'production') {
        return send_mail_simulation($to, $subject, $body);
    }
    
    // En développement, utiliser PHPMailer avec Mailtrap
    $host = getenv('MAIL_HOST');
    $port = getenv('MAIL_PORT');
    $user = getenv('MAIL_USER');
    $pass = getenv('MAIL_PASS');
    $from = getenv('MAIL_FROM');
    $fromName = getenv('MAIL_FROM_NAME');

    $mail = new PHPMailer(true);
    try {
        // Config SMTP
        $mail->isSMTP();
        $mail->Host = $host;
        $mail->SMTPAuth = true;
        $mail->Username = $user;
        $mail->Password = $pass;
        $mail->Port = $port;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom($from, $fromName);
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $body;

        $mail->send();
        return true;
    } catch (Exception $e) {
        if (function_exists('log_error')) {
            log_error('Mail error (PHPMailer)', ['error' => $mail->ErrorInfo]);
        }
        return false;
    }
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

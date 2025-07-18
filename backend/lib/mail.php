<?php
// backend/lib/mail.php

// Configuration pour l'envoi d'emails

/**
 * Envoie un email en utilisant le service configuré
 * 
 * @param string $to Adresse email du destinataire
 * @param string $subject Sujet de l'email
 * @param string $body Corps de l'email (HTML)
 * @return bool Succès ou échec de l'envoi
 */
function send_mail($to, $subject, $body)
{
    $env = defined('APP_ENV') ? APP_ENV : (getenv('APP_ENV') ?: 'development');
    $driver = getenv('MAIL_DRIVER') ?: 'simulation';

    // Toujours utiliser SMTP en production ou si driver smtp
    if ($env === 'production' || $driver === 'smtp') {
        return send_mail_smtp($to, $subject, $body);
    }

    // En développement, selon la configuration
    switch ($driver) {
        case 'mailtrap':
            return send_mail_mailtrap($to, $subject, $body);
        case 'simulation':
        default:
            return send_mail_simulation($to, $subject, $body);
    }
}

/**
 * Envoi d'email via Mailtrap (pour le développement)
 * 
 * @param string $to Adresse email du destinataire
 * @param string $subject Sujet de l'email
 * @param string $body Corps de l'email (HTML)
 * @return bool Succès ou échec de l'envoi
 */
function send_mail_mailtrap($to, $subject, $body)
{
    $host = getenv('MAIL_HOST') ?: 'smtp-relay.brevo.com';
    $port = getenv('MAIL_PORT') ?: 587;
    $user = getenv('MAIL_USER');
    $pass = getenv('MAIL_PASS');
    $from = getenv('MAIL_FROM') ?: 'noreply@myfacebook.com';
    $fromName = getenv('MAIL_FROM_NAME') ?: 'MyFacebook';

    if (empty($user) || empty($pass)) {
        if (function_exists('log_error')) {
            log_error('SMTP credentials not configured');
        }
        error_log('ERROR: SMTP credentials not configured');
        return false;
    }

    // Simulation d'envoi SMTP (remplacer par PHPMailer pour la prod si besoin)
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'to' => $to,
        'subject' => $subject,
        'body_preview' => substr(strip_tags($body), 0, 100) . '...',
        'driver' => 'smtp',
        'host' => $host,
        'port' => $port,
        'user' => $user
    ];

    if (function_exists('log_error')) {
        log_error('SMTP email', $logData);
    }

    error_log('📧 SMTP EMAIL: ' . json_encode($logData));

    // Ici, tu pourrais intégrer PHPMailer pour un vrai envoi
    return true;
}

/**
 * Simulation d'envoi d'email (pour le développement)
 * 
 * @param string $to Adresse email du destinataire
 * @param string $subject Sujet de l'email
 * @param string $body Corps de l'email (HTML)
 * @return bool Succès ou échec de l'envoi
 */
function send_mail_simulation($to, $subject, $body)
{
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

/**
 * Envoi d'email via SMTP Brevo (pour la production)
 * 
 * @param string $to Adresse email du destinataire
 * @param string $subject Sujet de l'email
 * @param string $body Corps de l'email (HTML)
 * @return bool Succès ou échec de l'envoi
 */
function send_mail_smtp($to, $subject, $body)
{
    // Recherche dynamique du chemin d'autoload
    $autoloadPaths = [
        __DIR__ . '/../../../vendor/autoload.php', // depuis backend/lib/
        __DIR__ . '/../../vendor/autoload.php',  // depuis backend/
        __DIR__ . '/../../../../vendor/autoload.php', // cas rare
        getcwd() . '/vendor/autoload.php', // cwd
    ];
    $autoloadFound = false;
    foreach ($autoloadPaths as $autoload) {
        if (file_exists($autoload)) {
            require_once $autoload;
            $autoloadFound = true;
            break;
        }
    }
    if (!$autoloadFound) {
        error_log('PHPMailer autoload introuvable. Email non envoyé.');
        return false;
    }

    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        error_log('PHPMailer non installé. Email non envoyé.');
        return false;
    }

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = getenv('MAIL_HOST') ?: 'smtp-relay.brevo.com';
        $mail->SMTPAuth = true;
        $mail->Username = getenv('MAIL_USER');
        $mail->Password = getenv('MAIL_PASS');
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = getenv('MAIL_PORT') ?: 587;
        $mail->CharSet = 'UTF-8';
        $mail->setFrom(getenv('MAIL_FROM') ?: 'noreply@myfacebook.com', getenv('MAIL_FROM_NAME') ?: 'MyFacebook');
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->AltBody = strip_tags($body);
        $mail->send();
        return true;
    } catch (Exception $e) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'to' => $to,
            'subject' => $subject,
            'error' => $mail->ErrorInfo,
            'exception' => $e->getMessage(),
            'driver' => 'smtp',
            'host' => getenv('MAIL_HOST'),
            'port' => getenv('MAIL_PORT'),
            'user' => getenv('MAIL_USER')
        ];
        if (function_exists('log_error')) {
            log_error('SMTP email (PHPMailer error)', $logData);
        }
        error_log('❌ SMTP EMAIL (PHPMailer error): ' . json_encode($logData));
        return false;
    }
}

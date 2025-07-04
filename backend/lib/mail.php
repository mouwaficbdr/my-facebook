<?php
// backend/lib/mail.php
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';
require_once __DIR__ . '/phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function send_mail($to, $subject, $body) {
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

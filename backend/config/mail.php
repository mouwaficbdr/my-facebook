<?php
// backend/config/mail.php
// Configuration pour Mailtrap (dev) et SendGrid/Brevo (prod)

define('MAIL_HOST', getenv('MAIL_HOST') ?: 'smtp.mailtrap.io');
define('MAIL_PORT', getenv('MAIL_PORT') ?: 2525);
define('MAIL_USER', getenv('MAIL_USER') ?: '');
define('MAIL_PASS', getenv('MAIL_PASS') ?: '');
define('MAIL_FROM', getenv('MAIL_FROM') ?: 'no-reply@myfacebook.com');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'MyFacebook');



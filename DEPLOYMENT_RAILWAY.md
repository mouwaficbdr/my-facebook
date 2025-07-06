---

## Exemple/template de configuration Railway (100% fonctionnelle)

### Arborescence minimale
```
backend/
  api/
    signup.php
    login.php
    ...
  config/
    db.php
    env.php
    mail.php
    mail_production.php
  lib/
    log.php
    rate_limit.php
    validation.php
    jwt.php
    auth_middleware.php
    mail.php
  logs/                # (auto-créé, pas besoin de le committer)
  tests/
  Caddyfile
  composer.json
  php.ini
  start-container.sh
  db_schema.sql
```

### Exemple de Caddyfile (à placer dans backend/Caddyfile)
```caddyfile
:{$PORT}

root * .

log {
    output stderr
    format json
}

php_server
```

### Exemple de php.ini (à placer dans backend/php.ini)
```ini
display_errors = On
error_reporting = E_ALL
log_errors = On
error_log = /dev/stderr
```

### Exemple de start-container.sh (à placer dans backend/start-container.sh)
```bash
#!/bin/bash
set -x

export PHP_INI_SCAN_DIR=/app/backend/
export PHP_INI_DIR=/app/backend/
export PHP_ERROR_REPORTING=E_ALL
export PHP_DISPLAY_ERRORS=On
export PHP_LOG_ERRORS=On
export PHP_ERROR_LOG=/dev/stderr

frankenphp run --config Caddyfile
```

### Exemple de composer.json (à placer dans backend/composer.json)
```json
{
  "require": {
    "php": ">=8.2",
    "ext-pdo": "*",
    "ext-pdo_mysql": "*",
    "ext-mbstring": "*"
  }
}
```

### Variables d'environnement Railway (exemple)
À configurer dans l'interface Railway > Variables :
```
DB_HOST=xxx
DB_NAME=xxx
DB_USER=xxx
DB_PASS=xxx
DB_PORT=3306
DB_SSL=true
DB_SSL_CA_CONTENT=... (contenu du certificat CA Aiven)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=xxx
MAIL_PASS=xxx
MAIL_FROM=no-reply@myfacebook.com
MAIL_FROM_NAME=MyFacebook
JWT_SECRET=xxx
JWT_EXPIRATION=3600
APP_ENV=production
APP_URL=https://my-facebook-by-mouwafic.vercel.app
```

### Points clés à respecter
- **Ne jamais committer le dossier logs/** (il est créé dynamiquement)
- **Vérifier que tous les scripts PHP utilisent ob_start()/ob_end_clean() pour capturer les warnings**
- **Utiliser le helper ensure_logs_dir_exists() pour toute écriture dans logs/**
- **Vérifier la présence de tous les fichiers ci-dessus avant déploiement**

---

**Ce template est prêt à l'emploi pour tout projet PHP natif Railway/FrankenPHP.** 
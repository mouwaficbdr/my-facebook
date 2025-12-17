# Dockerfile pour Render (Nginx + PHP-FPM)
FROM php:8.3-fpm-alpine

# Installer Nginx et les dépendances système
RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev

# Installer les extensions PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        mbstring \
        zip \
        gd \
        exif

# Créer le répertoire de travail
WORKDIR /var/www/html

# Copier le code
COPY . /var/www/html

# Créer les dossiers nécessaires
RUN mkdir -p /var/www/html/logs \
             /var/www/html/uploads \
             /run/nginx \
             /var/log/supervisor

# Permissions
RUN chown -R www-data:www-data /var/www/html/logs /var/www/html/uploads
RUN chmod -R 775 /var/www/html/logs /var/www/html/uploads

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copier la configuration PHP-FPM
COPY php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

# Copier la configuration Supervisor
COPY supervisord.conf /etc/supervisord.conf

# Port par défaut
ENV PORT=10000

EXPOSE 10000

# Démarrer Supervisor (qui gère Nginx + PHP-FPM)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]

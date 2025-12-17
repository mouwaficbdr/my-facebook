# Dockerfile pour Render (FrankenPHP)
FROM dunglas/frankenphp:latest-php8.3

# Installer les extensions PHP nécessaires
RUN install-php-extensions pdo pdo_pgsql pgsql mbstring zip gd exif

# Copier le code backend
WORKDIR /app
COPY . /app

# Créer les dossiers nécessaires
RUN mkdir -p /app/logs /app/uploads

# Permissions
RUN chown -R www-data:www-data /app/logs /app/uploads
RUN chmod -R 775 /app/logs /app/uploads

# Variable d'environnement pour le port
ENV PORT=8080

# Copier le script de démarrage
COPY start-container.sh /start.sh
RUN chmod +x /start.sh

# Exposer le port
EXPOSE 8080

# Démarrer FrankenPHP
CMD ["/start.sh"]

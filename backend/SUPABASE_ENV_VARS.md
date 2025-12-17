# Variables d'Environnement pour Supabase (Postgres)

Ajouter ces variables sur Railway pour migrer vers Supabase :

```bash
# Driver de base de données
DB_DRIVER=pgsql

# Connexion Supabase (récupérer depuis Settings > Database)
DB_HOST=db.<votre-project-ref>.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=<votre-database-password>
DB_SSL=true

# Les autres variables restent identiques
JWT_SECRET=<votre-secret>
JWT_EXPIRATION=3600
APP_ENV=production
APP_URL=<url-frontend>

# Mail (Mailtrap ou Brevo)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=<user>
MAIL_PASS=<password>
MAIL_FROM=no-reply@myfacebook.com
MAIL_FROM_NAME=MyFacebook
```

## Notes
- Le `DB_HOST` Supabase se trouve dans : **Project Settings > Database > Connection String**
- Le mot de passe est celui défini lors de la création du projet Supabase
- Supabase utilise le port **5432** (Postgres standard)
- La base de données par défaut s'appelle `postgres`

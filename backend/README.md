# Backend MyFacebook — Documentation

## 📁 Structure des dossiers

- `api/` : Endpoints REST PHP natifs (signup, login, logout, etc.)
- `lib/` : Fonctions réutilisables (validation, JWT, mail, log, middleware, etc.)
- `config/` : Connexion DB, variables d’environnement, config mail
- `logs/` : Logs d’erreurs, rate limiting
- `tests/` : Tests unitaires maison
- `db_schema.sql` : Schéma de la base de données (à jour)

## 🧩 Choix d’architecture & sécurité

- **API REST PHP natif** (aucune logique HTML côté serveur)
- **Séparation stricte frontend/backend**
- **PDO + requêtes préparées** (prévention SQLi)
- **JWT pour l’authentification** (cookie httpOnly, Secure, SameSite)
- **Rate limiting IP** sur endpoints sensibles
- **Logging d’erreurs** centralisé
- **Validation centralisée des inputs**
- **Gestion des rôles** (user/admin) via middleware
- **Mot de passe oublié/reset sécurisé** (token unique, expiration, usage unique)

## ⚙️ Variables d’environnement (exemple dans `.env.local`)

```
APP_ENV=development
APP_URL=http://localhost:3000
DB_HOST=...
DB_NAME=...
DB_USER=...
DB_PASS=...
DB_PORT=...
DB_SSL=true
DB_SSL_CA_PATH=...
MAIL_HOST=...
MAIL_PORT=...
MAIL_USER=...
MAIL_PASS=...
MAIL_FROM=...
MAIL_FROM_NAME=...
JWT_SECRET=...
JWT_EXPIRATION=3600
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW=600
```

## 🚀 Commandes utiles

- **Lancer un test unitaire** :
  ```
  php backend/tests/test_runner.php
  ```
- **Vider le compteur de rate limiting** :
  ```
  echo '{}' > backend/logs/rate_limit.json
  ```
- **Vérifier les logs d’erreur** :
  ```
  tail -f backend/logs/error.log
  ```

## 📝 À tenir à jour

- `db_schema.sql` à chaque évolution du modèle
- `.env.local` pour chaque environnement

---

Pour toute évolution, suivre la structure et les conventions ci-dessus pour garantir la robustesse et la maintenabilité du projet.

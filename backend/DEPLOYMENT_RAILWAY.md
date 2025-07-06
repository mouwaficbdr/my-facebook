# Déploiement Backend PHP natif (FrankenPHP) sur Railway

## 1. Prérequis
- **Compte Railway** (https://railway.app)
- **Base de données MySQL** (Aiven ou Railway plugin)
- **Mailtrap** (pour l'envoi d'emails en dev)
- **Accès au repo backend**
- **Railway CLI** (optionnel, pour déploiement local)

## 2. Structure du backend attendue
```
backend/
  api/                # Endpoints REST PHP (signup.php, login.php, ...)
  config/             # Configs (db.php, env.php, mail.php...)
  lib/                # Librairies internes (validation, log, jwt, ...)
  logs/               # (auto-créé) Fichiers de logs applicatifs
  tests/              # Tests unitaires
  Caddyfile           # Config serveur (FrankenPHP/Caddy)
  composer.json       # Dépendances PHP
  php.ini             # Config PHP personnalisée
  start-container.sh  # Script de démarrage Railway/FrankenPHP
  db_schema.sql       # Schéma SQL à jour
```

## 3. Fichiers indispensables & rôle
- **Caddyfile** : Routage HTTP, configuration FrankenPHP (utiliser `php_server` !)
- **php.ini** : Affichage/gestion des erreurs, logs sur `/dev/stderr`
- **start-container.sh** : Exporte les bonnes variables, lance FrankenPHP avec le bon Caddyfile
- **composer.json** : Dépendances PHP (pdo, mbstring, etc.)
- **db.php/env.php** : Gestion dynamique des variables d'environnement (DB, mail, JWT...)
- **lib/log.php** : Logging robuste, création auto du dossier logs/
- **lib/rate_limit.php** : Rate limiting robuste, jamais bloquant

## 4. Variables d'environnement essentielles (Railway > Variables)
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_PORT`, `DB_SSL`, `DB_SSL_CA_CONTENT`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `MAIL_FROM_NAME`
- `JWT_SECRET`, `JWT_EXPIRATION`
- `APP_ENV` (`production` sur Railway)
- `APP_URL` (URL publique du frontend)

## 5. Étapes détaillées du déploiement Railway
1. **Créer un nouveau projet Railway**
2. **Ajouter le service backend** (import GitHub ou upload)
3. **Configurer les variables d'environnement** (voir ci-dessus)
4. **Vérifier la présence des fichiers clés** (`Caddyfile`, `php.ini`, `start-container.sh`)
5. **Déployer (Railway UI ou `railway up`)**
6. **Surveiller les logs Railway** (onglet Logs) pour détecter toute erreur PHP, DB, mail, etc.
7. **Tester les endpoints** (ex : `/api/signup.php`) avec curl ou Postman
8. **Corriger les éventuels problèmes (voir logs)**

## 6. Bonnes pratiques & points de vigilance
- **Toujours utiliser la directive `php_server` dans le Caddyfile** (pas de routage custom !)
- **Vérifier que tous les scripts PHP retournent toujours un JSON propre** (même en cas d'erreur)
- **Utiliser ob_start()/ob_end_clean() pour capturer les warnings PHP**
- **Le dossier logs/ doit être créé dynamiquement, jamais hardcodé**
- **Les logs critiques doivent aller sur error_log() (donc visibles dans Railway)**
- **Ne jamais exposer d'informations sensibles dans les messages d'erreur**
- **Tenir à jour le schéma SQL (`db_schema.sql`)**
- **Vérifier les droits d'écriture sur logs/ et les fichiers temporaires**

## 7. Vérification post-déploiement
- **Tester tous les endpoints critiques** (inscription, login, etc.)
- **Vérifier les logs Railway** (aucun warning/notice PHP ne doit apparaître côté client)
- **Vérifier la création automatique de logs/ et l'absence d'erreur d'écriture**
- **Tester l'envoi d'emails (Mailtrap en dev)**
- **Vérifier la connexion à la base de données**

## 8. FAQ / Astuces debug
- **Problème de routage ?** Vérifier que le Caddyfile utilise bien `php_server`.
- **Erreur d'écriture dans logs/** ? Vérifier les droits, et que le helper PHP crée bien le dossier.
- **Erreur DB ?** Vérifier les variables d'environnement et le SSL (Aiven nécessite souvent un CA).
- **Pas de logs dans Railway ?** Vérifier que `error_log = /dev/stderr` dans php.ini/start-container.sh.
- **Un warning PHP visible côté client ?** Ajouter ob_start()/ob_end_clean() autour du code critique.
- **Besoin de lire un log applicatif sur Railway ?** Ajouter temporairement un endpoint sécurisé pour le lire.

---

**En suivant ce guide, tu garantis un déploiement backend PHP natif robuste, sécurisé et 100% compatible Railway/FrankenPHP.** 
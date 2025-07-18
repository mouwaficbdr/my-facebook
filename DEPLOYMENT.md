# 🚀 Guide de déploiement Vercel - My Facebook

## 📋 Prérequis

### 1. **Compte Vercel**

- Créer un compte sur [vercel.com](https://vercel.com)
- Installer Vercel CLI : `npm i -g vercel`

### 2. **Base de données MySQL (Aiven)**

- Base de données déjà configurée et fonctionnelle
- Certificat SSL : `backend/ca.pem`

### 3. **Service d'email**

- **Développement** : Mailtrap (gratuit)
- **Production** : Brevo (anciennement Sendinblue)

Configuration requise pour Brevo :

1. Créer un compte sur [Brevo](https://www.brevo.com/)
2. Générer une clé API dans les paramètres du compte
3. Configurer la variable d'environnement `BREVO_API_KEY`
4. Définir `MAIL_DRIVER=brevo` dans les variables d'environnement

## 🔧 Configuration

### 1. **Variables d'environnement Vercel**

Dans le dashboard Vercel, ajouter ces variables :

```bash
# Configuration de l'application
APP_ENV=production
APP_URL=https://my-facebook-backend-production.up.railway.app

# Base de données MySQL (Aiven)
DB_HOST=mysql-2350bdd7-my-facebook.c.aivencloud.com
DB_PORT=22970
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=your-actual-db-password
DB_SSL=true
DB_SSL_CA=backend/ca.pem

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Email (Brevo en production)
MAIL_DRIVER=brevo
MAIL_FROM=noreply@myfacebook.com
MAIL_FROM_NAME=My Facebook
BREVO_API_KEY=your-brevo-api-key

# Mailtrap (pour développement uniquement)
# MAIL_DRIVER=mailtrap
# MAIL_HOST=smtp.mailtrap.io
# MAIL_PORT=2525
# MAIL_USER=your-mailtrap-user
# MAIL_PASS=your-mailtrap-pass

# Rate limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=300
```

### 2. **Fichiers requis**

Assurez-vous que ces fichiers sont présents :

- ✅ `backend/ca.pem` (certificat SSL MySQL)
- ✅ `api/*.php` (endpoints API)
- ✅ `frontend/` (code React)
- ✅ `vercel.json` (configuration)

## 🚀 Déploiement

### 1. **Déploiement initial**

```bash
# Dans le répertoire racine
vercel

# Suivre les instructions :
# - Connecter le compte GitHub
# - Choisir le projet
# - Confirmer les paramètres

# Note : Les emails seront simulés en production
# (pas besoin de configurer SendGrid pour l'instant)
```

### 2. **Déploiement automatique**

Après le premier déploiement, chaque push sur `main` déclenchera un déploiement automatique.

### 3. **Vérification du déploiement**

1. **Frontend** : `https://my-facebook-backend-production.up.railway.app`
2. **API** : `https://my-facebook-backend-production.up.railway.app/api/signup.php`
3. **Logs** : Dashboard Vercel → Functions → Logs

## 🔍 Tests post-déploiement

### 1. **Test d'inscription**

```bash
curl -X POST https://my-facebook-backend-production.up.railway.app/api/signup.php \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "Test",
    "email": "test@example.com",
    "password": "Test123456",
    "genre": "Homme",
    "date_naissance": "1990-01-01"
  }'
```

### 2. **Test de connexion**

```bash
curl -X POST https://my-facebook-backend-production.up.railway.app/api/login.php \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

## 🛠️ Dépannage

### **Erreurs courantes**

1. **500 Internal Server Error**

   - Vérifier les variables d'environnement
   - Consulter les logs Vercel

2. **Connexion base de données échoue**

   - Vérifier `DB_PASSWORD`
   - Vérifier que `backend/ca.pem` est présent

3. **Emails non envoyés**
   - En production : Vérifier la clé API Brevo et les logs d'erreur
   - En dev : Vérifier les credentials Mailtrap ou la clé API Brevo selon la configuration
   - Vérifier que les variables MAIL_FROM et MAIL_FROM_NAME sont correctement définies

### **Logs et monitoring**

- **Logs Vercel** : Dashboard → Functions → Logs
- **Logs PHP** : Les erreurs sont automatiquement loggées
- **Monitoring** : Dashboard → Analytics

## 📈 Optimisations

### **Performance**

- ✅ Build automatique optimisé
- ✅ Compression gzip activée
- ✅ Cache CDN Vercel

### **Sécurité**

- ✅ HTTPS automatique
- ✅ Headers de sécurité
- ✅ Rate limiting
- ✅ Validation des données

## 🔄 Mise à jour

Pour mettre à jour l'application :

1. **Développement local** : `npm run dev`
2. **Test** : `npm run build`
3. **Déploiement** : `git push origin main`
4. **Vérification** : Dashboard Vercel

---

## 📞 Support

En cas de problème :

1. Vérifier les logs Vercel
2. Tester en local avec `npm run dev`
3. Vérifier la configuration des variables d'environnement

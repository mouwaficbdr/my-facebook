# 📘 MyFacebook

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/mouwaficbdr/my-facebook)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![PHP](https://img.shields.io/badge/PHP-8.0+-purple)](https://php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)](https://mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.11-38B2AC)](https://tailwindcss.com/)

## 🎯 Description du Projet

**MyFacebook** est un réseau social moderne inspiré de Facebook. Le projet offre une expérience utilisateur complète avec toutes les fonctionnalités essentielles d'un réseau social.

### ✨ Fonctionnalités Principales

#### 👥 **Gestion des Utilisateurs**

- Inscription et connexion sécurisées avec JWT
- Confirmation d'email avec templates HTML
- Réinitialisation de mot de passe par email
- Profils personnalisables (photo, couverture, bio, localisation)
- Gestion des rôles (utilisateur, modérateur, administrateur)

#### 📱 **Flux Social**

- Création de posts texte et images
- Système de likes
- Commentaires et réponses avec likes
- Partage et sauvegarde de posts
- Stories avec images et légendes

#### 👫 **Gestion des Amis**

- Envoi et réception de demandes d'amis
- Acceptation/refus des demandes
- Suggestions d'amis intelligentes
- Anniversaires des amis
- Amis en commun

#### 💬 **Messagerie en Temps Réel**

- Chat privé entre amis
- Envoi de messages texte et images
- Recherche de conversations
- Interface responsive mobile/desktop

#### 🔔 **Notifications**

- Notifications temps réel pour likes, commentaires, demandes d'amis
- Système de badges non lus

#### 🛡️ **Back-Office Administratif**

- Dashboard avec statistiques détaillées
- Modération des posts et commentaires
- Gestion des utilisateurs (bannissement, changement de rôle)
- Logs de modération
- Interface séparée et sécurisée

## 🏗️ Architecture Technique

### **Frontend** (React + TypeScript + Tailwind CSS)

- **Framework** : React 19.1.0 avec TypeScript
- **Styling** : Tailwind CSS 4.1.11
- **Routing** : React Router DOM 7.6.3
- **Icons** : Lucide React
- **Emojis** : Emoji Mart
- **Build** : Vite 7.0.0
- **Déploiement** : Vercel

### **Backend** (PHP Natif + MySQL)

- **Language** : PHP 8.0+
- **Base de données** : MySQL 8.0 (Aiven Cloud)
- **Authentification** : JWT (JSON Web Tokens)
- **API** : RESTful avec JSON
- **Email** : Mailtrap (dev) / SendGrid (prod)
- **Déploiement** : Railway avec FrankenPHP

### **Base de Données**

- **Tables principales** : users, posts, comments, likes, friendships, messages, notifications, stories
- **Sécurité** : Contraintes de clés étrangères, index optimisés
- **Performance** : Requêtes optimisées avec PDO

## 🚀 Mode de Fonctionnement

### **Installation Locale**

1. **Cloner le projet**

   ```bash
   git clone https://github.com/your-username/my-facebook.git
   cd my-facebook
   ```

2. **Configuration Backend**

   ```bash
   cd backend
   composer install
   cp .env.example .env.local
   # Configurer les variables d'environnement
   ```

3. **Configuration Frontend**

   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Configurer VITE_API_BASE_URL
   ```

4. **Base de données**

   ```bash
   # Importer le schéma
   mysql -u username -p database_name < backend/db_schema.sql
   ```

5. **Lancer le développement**

   ```bash
   # Terminal 1 - Backend
   cd backend
   php -S localhost:8000

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### **Variables d'Environnement**

#### **Backend** (`.env.local`)

```env
# Base de données
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=your-database
DB_USER=your-username
DB_PASSWORD=your-password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email
MAIL_DRIVER=mailtrap
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your-mailtrap-user
MAIL_PASS=your-mailtrap-pass
```

#### **Frontend** (`.env.local`)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### **Déploiement Production**

#### **Frontend (Vercel)**

```bash
npm run build
vercel --prod
```

#### **Backend (Railway)**

```bash
cd backend
railway up
```

## 🔑 Identifiants de Test

### **Comptes de Test**

#### **Utilisateur Standard**

- **Email** : `testuser@onepiece.com`
- **Mot de passe** : `onepiece123`
- **Rôle** : Utilisateur

#### **Modérateur**

- **Email** : `testmod@onepiece.com`
- **Mot de passe** : `onepiece123`
- **Rôle** : Modérateur
- **Accès** : Modération des contenus

#### **Administrateur**

- **Email** : `testadmin@onepiece.com`
- **Mot de passe** : `onepiece123`
- **Rôle** : Administrateur
- **Accès** : Back-office complet

### **Accès Back-Office**

- **URL** : `/admin-login`
- **Interface séparée** avec authentification spécifique
- **Dashboard** avec statistiques en temps réel
- **Gestion des utilisateurs** et contenus

## 📁 Structure du Projet

```
my-facebook/
├── frontend/                 # Application React
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── context/        # Contextes React
│   │   ├── hooks/          # Hooks personnalisés
│   │   ├── api/            # Services API
│   │   └── utils/          # Utilitaires
│   ├── public/             # Assets statiques
│   └── package.json
├── backend/                 # API PHP
│   ├── api/                # Endpoints API
│   │   ├── admin/          # Back-office
│   │   ├── auth/           # Authentification
│   │   ├── posts/          # Gestion des posts
│   │   ├── users/          # Gestion des utilisateurs
│   │   ├── friends/        # Gestion des amis
│   │   ├── messages/       # Messagerie
│   │   └── notifications/  # Notifications
│   ├── config/             # Configuration
│   ├── lib/                # Bibliothèques
│   ├── uploads/            # Fichiers uploadés
│   └── tests/              # Tests unitaires
├── docs/                   # Documentation
└── README.md
```

## 🔧 Scripts Disponibles

### **Racine du projet**

```bash
npm run build    # Build complet (frontend + backend)
npm run dev      # Développement frontend
```

### **Frontend**

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run lint     # Vérification du code
npm run preview  # Prévisualisation du build
```

### **Backend**

```bash
composer install # Installation des dépendances
php -S localhost:8000 # Serveur de développement
```

## 🧪 Tests

### **Tests Backend**

```bash
cd backend/tests
php test_runner.php
```

### **Tests Frontend**

```bash
cd frontend
npm test
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request


---

**MyFacebook**

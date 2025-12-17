# Déploiement Backend MyFacebook sur Render

## Pourquoi Render ?
- ✅ Tier gratuit permanent (750h/mois)
- ✅ Support PHP natif avec Docker
- ✅ Déploiement automatique depuis GitHub
- ✅ SSL gratuit
- ⚠️ Les instances gratuites s'endorment après 15 min d'inactivité (~30s de réveil)

---

## Étape 1 : Préparation du Code

### 1.1 Pousser le code sur GitHub
```bash
cd /home/mouwaficbdr/Code/myfacebook/my-facebook
git add .
git commit -m "feat: Configuration Render + Supabase Postgres"
git push origin main
```

> [!IMPORTANT]
> Assure-toi que le repo GitHub est **public** ou que Render a accès à ton repo privé.

---

## Étape 2 : Créer le Projet Supabase

### 2.1 Création
1. Aller sur [supabase.com](https://supabase.com) → **New Project**
2. **Database Password** : Choisir un mot de passe fort (CONSERVE-LE !)
3. **Region** : Europe (Frankfurt) ou proche de toi
4. Attendre 2-3 minutes

### 2.2 Exécuter le schéma SQL
1. **SQL Editor** → **New query**
2. Copier-coller [`db_schema_postgres.sql`](file:///home/mouwaficbdr/Code/myfacebook/my-facebook/backend/db_schema_postgres.sql)
3. **Run**
4. Vérifier dans **Table Editor** que toutes les tables sont créées

### 2.3 Récupérer les identifiants
1. **Settings** → **Database**
2. Section **Connection string** → Onglet **URI**
3. Noter :
   - **Host** : `db.<project-ref>.supabase.co`
   - **Password** : Celui choisi à l'étape 2.1

---

## Étape 3 : Déployer sur Render

### 3.1 Création du service
1. Aller sur [render.com](https://render.com) → **New** → **Web Service**
2. Connecter ton repo GitHub `my-facebook`
3. Configuration :
   - **Name** : `myfacebook-backend`
   - **Region** : Frankfurt (ou proche)
   - **Branch** : `main`
   - **Root Directory** : `backend`
   - **Runtime** : **Docker**
   - **Plan** : **Free**

### 3.2 Variables d'environnement
Cliquer sur **Advanced** et ajouter :

```bash
# Database (Supabase)
DB_DRIVER=pgsql
DB_HOST=db.<ton-project-ref>.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=<ton-mot-de-passe-supabase>
DB_SSL=true

# JWT
JWT_SECRET=<genere-un-secret-fort>
JWT_EXPIRATION=3600

# App
APP_ENV=production
APP_URL=https://<ton-frontend>.vercel.app

# Mail (Mailtrap ou autre)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=<ton-user>
MAIL_PASS=<ton-pass>
MAIL_FROM=no-reply@myfacebook.com
MAIL_FROM_NAME=MyFacebook
```

> [!TIP]
> Pour générer `JWT_SECRET` : `openssl rand -base64 32`

### 3.3 Déployer
1. Cliquer sur **Create Web Service**
2. Attendre ~5-10 minutes (premier build)
3. Render assignera une URL : `https://myfacebook-backend.onrender.com`

---

## Étape 4 : Vérification

### 4.1 Vérifier les logs
1. Dans Render, onglet **Logs**
2. Chercher `Starting FrankenPHP on port 8080...`
3. Pas d'erreur de connexion DB

### 4.2 Tester l'API
```bash
# Test de santé (endpoint index)
curl https://myfacebook-backend.onrender.com/

# Test inscription
curl -X POST https://myfacebook-backend.onrender.com/api/signup.php \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "User",
    "email": "test@example.com",
    "password": "Password123!",
    "genre": "Homme",
    "date_naissance": "1990-01-01"
  }'
```

**Résultat attendu** : `{"success": true, ...}`

### 4.3 Vérifier dans Supabase
**Table Editor** → **users** → Vérifier que l'utilisateur apparaît

---

## Étape 5 : Connecter le Frontend (Vercel)

### 5.1 Mettre à jour l'URL backend
Dans ton frontend (local ou Vercel), mettre à jour la variable d'environnement :

```bash
VITE_API_URL=https://myfacebook-backend.onrender.com
```

Sur Vercel :
1. **Settings** → **Environment Variables**
2. Ajouter `VITE_API_URL`
3. **Redeploy**

### 5.2 Tester
1. Aller sur ton app Vercel
2. Créer un compte
3. Se connecter
4. Créer un post
5. Vérifier dans Supabase **Table Editor** → **posts**

---

## ⚠️ Limitations du Tier Gratuit Render

| Limite | Détail |
|--------|--------|
| **Heures** | 750h/mois (suffisant pour 1 instance) |
| **Bande passante** | 100 GB/mois |
| **Build time** | 500 min/mois |
| **Inactivité** | Sommeil après 15 min → Réveil ~30s |

> [!NOTE]
> Pour éviter le sommeil, tu peux utiliser un service de "ping" gratuit comme [UptimeRobot](https://uptimerobot.com) (toutes les 5 min).

---

## 🔄 Redéploiement Automatique

Render redéploie automatiquement à chaque `git push` sur la branche `main`. Tu peux désactiver cela dans **Settings** → **Auto-Deploy**.

---

## 📁 Fichiers Créés

- [`backend/Dockerfile`](file:///home/mouwaficbdr/Code/myfacebook/my-facebook/backend/Dockerfile) - Image Docker FrankenPHP
- [`render.yaml`](file:///home/mouwaficbdr/Code/myfacebook/my-facebook/render.yaml) - Config Render (optionnel)
- [`backend/start-container.sh`](file:///home/mouwaficbdr/Code/myfacebook/my-facebook/backend/start-container.sh) - Script de démarrage (modifié)

---

**✅ Migration complète : Render (Backend PHP) + Supabase (Postgres) + Vercel (Frontend React)**

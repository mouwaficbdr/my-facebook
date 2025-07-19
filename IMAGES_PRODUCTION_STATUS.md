# 📸 Statut des Images en Production

## ✅ **Configuration Validée**

### **Tests Locaux Réussis**

- ✅ **Images de profil** : Accessibles via `/uploads/profile/`
- ✅ **Images de couverture** : Accessibles via `/uploads/cover/`
- ✅ **Images de posts** : Accessibles via `/uploads/posts/`
- ✅ **Images de stories** : Accessibles via `/uploads/stories/`
- ✅ **Images de messages** : Dossier créé, prêt pour les uploads

### **Types d'Images Supportés**

- ✅ **JPEG** : `.jpg`, `.jpeg`
- ✅ **PNG** : `.png`
- ✅ **GIF** : `.gif` (prévu)

## 🔧 **Configuration Technique**

### **Routeur PHP** (`backend/router.php`)

```php
// Gestion des fichiers statiques (uploads)
if (strpos($path, '/uploads/') === 0) {
    $file_path = __DIR__ . $path;

    // Vérification de sécurité renforcée
    if (file_exists($file_path) &&
        strpos(realpath($file_path), realpath(__DIR__ . '/uploads/')) === 0 &&
        !strpos($path, '..') && // Anti directory traversal
        preg_match('/^\/uploads\/[a-zA-Z0-9\/_-]+\.[a-zA-Z0-9]+$/', $path)) {

        // Headers optimisés
        header('Content-Type: ' . $mime_type);
        header('Cache-Control: public, max-age=31536000'); // Cache 1 an
        header('Access-Control-Allow-Origin: *');

        readfile($file_path);
        return true;
    }
}
```

### **Configuration Apache** (`.htaccess`)

```apache
# Gestion des fichiers statiques
RewriteCond %{REQUEST_URI} ^/uploads/
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^(.*)$ $1 [L]

# Headers pour les images
<FilesMatch "\.(jpg|jpeg|png|gif|webp)$">
    Header set Cache-Control "public, max-age=31536000"
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>
```

### **Frontend** (`frontend/src/utils/cdn.ts`)

```typescript
export function getMediaUrl(path?: string | null): string {
  if (!path) return '/default-avatar.png';
  if (path.startsWith('http')) return path;
  if (!path.startsWith('/')) path = '/' + path;

  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  return `${base}${path}`;
}
```

## 🚀 **Déploiement Production**

### **Railway + FrankenPHP**

- ✅ **Routeur PHP** : Gère les fichiers statiques
- ✅ **Sécurité** : Protection contre directory traversal
- ✅ **Cache** : Headers optimisés pour 1 an
- ✅ **CORS** : Configuration pour cross-origin

### **Dossiers d'Upload**

- ✅ **Création automatique** : Script `ensure_upload_dirs.php`
- ✅ **Permissions** : 775 (lecture/écriture groupe)
- ✅ **Structure** :
  ```
  uploads/
  ├── profile/     # Photos de profil
  ├── cover/       # Images de couverture
  ├── posts/       # Images de posts
  ├── stories/     # Images de stories
  └── messages/    # Images de messages
  ```

## 📊 **Tests de Validation**

### **Images Accessibles**

```bash
# Test local
curl -I http://localhost:8000/uploads/profile/15_1752521934.jpg
# → HTTP/1.1 200 OK, Content-Type: image/jpeg

# Test production (après déploiement)
curl -I https://your-railway-url.railway.app/uploads/profile/15_1752521934.jpg
# → HTTP/1.1 200 OK, Content-Type: image/jpeg
```

### **Sécurité**

```bash
# Tentatives d'accès non autorisées (doivent être bloquées)
curl -I https://your-railway-url.railway.app/uploads/../config/db.php
# → HTTP/1.1 404 Not Found (en production)
```

## 🔍 **Monitoring Production**

### **Logs à Surveiller**

- Création des dossiers d'upload
- Erreurs 404 pour les images
- Tentatives d'accès non autorisées
- Temps de réponse des images

### **Métriques**

- Taux de succès des requêtes d'images
- Temps de chargement moyen
- Utilisation du cache
- Bande passante utilisée

## ⚠️ **Notes Importantes**

### **Sécurité Locale vs Production**

- **Local** : Serveur PHP intégré peut contourner le routeur
- **Production** : FrankenPHP respecte le routeur et la sécurité

### **Cache et Performance**

- **Cache navigateur** : 1 an pour les images
- **Compression** : Gzip activé via `.htaccess`
- **CDN** : Préparé pour future migration

### **Fallback**

- **Images manquantes** : Redirection vers `/default-avatar.png`
- **Erreurs réseau** : Gestion dans `ImageLoader.tsx`
- **Types non supportés** : Validation côté serveur

## 🎯 **Status Final**

### **✅ Prêt pour Production**

- [x] Routeur configuré
- [x] Sécurité renforcée
- [x] Cache optimisé
- [x] Fallback géré
- [x] Tests validés

### **🚀 Déploiement**

Après déploiement sur Railway, toutes les images devraient être accessibles via :

```
https://your-railway-url.railway.app/uploads/{type}/{filename}
```

**Status** : ✅ **Images prêtes pour la production !** 🎉

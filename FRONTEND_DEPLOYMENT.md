# Configuration Frontend Vercel

## Variables d'environnement requises

### VITE_API_BASE_URL
Cette variable doit pointer vers l'URL de votre backend Railway.

**Exemple :**
```
VITE_API_BASE_URL=https://my-facebook-backend.up.railway.app
```

## Configuration Vercel

1. Allez dans votre projet Vercel
2. Cliquez sur "Settings" > "Environment Variables"
3. Ajoutez la variable :
   - **Name :** `VITE_API_BASE_URL`
   - **Value :** `https://your-backend-railway-url.up.railway.app`
   - **Environment :** Production (et Preview si nécessaire)

## Vérification

Après avoir configuré la variable, redéployez votre application Vercel. Les appels API devraient maintenant pointer vers le bon backend.

## Dépannage

Si vous obtenez une erreur 405 (Method Not Allowed), cela signifie que :
1. La variable `VITE_API_BASE_URL` n'est pas configurée
2. L'URL du backend est incorrecte
3. Le backend Railway n'est pas accessible

Vérifiez que :
- La variable est bien configurée dans Vercel
- L'URL du backend Railway est correcte et accessible
- Le backend est bien déployé et fonctionnel 
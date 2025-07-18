# Configuration du système de mailing

Ce document explique comment configurer et tester le système d'envoi d'emails pour les fonctionnalités de vérification d'email et de réinitialisation de mot de passe.

## Fonctionnalités implémentées

- ✅ Vérification d'email lors de l'inscription
- ✅ Réinitialisation de mot de passe

## Configuration

### 1. Variables d'environnement

Les variables suivantes doivent être configurées dans votre fichier `.env.local` :

```bash
# Configuration email
MAIL_DRIVER=brevo
MAIL_FROM=noreply@myfacebook.com
MAIL_FROM_NAME=MyFacebook
BREVO_API_KEY=votre-clé-api-brevo
```

### 2. Options de configuration

Trois modes d'envoi d'emails sont disponibles :

- **brevo** : Utilise l'API Brevo pour envoyer des emails réels (recommandé pour la production)
- **mailtrap** : Utilise Mailtrap pour capturer les emails en environnement de développement
- **simulation** : Simule l'envoi d'emails (les emails sont uniquement enregistrés dans les logs)

## Test des fonctionnalités

### Test de l'envoi d'email

Un script de test est disponible pour vérifier la configuration :

```bash
cd backend
php tests/test_mail.php votre-email@example.com
```

### Test de la vérification d'email

1. Inscrivez-vous avec un nouvel utilisateur via l'API `/api/signup.php`
2. Vérifiez les logs ou votre boîte de réception pour le lien de confirmation
3. Utilisez le lien de confirmation ou appelez directement `/api/confirm_email.php?token=VOTRE_TOKEN`

### Test de la réinitialisation de mot de passe

1. Demandez une réinitialisation via l'API `/api/forgot_password.php` avec votre email
2. Vérifiez les logs ou votre boîte de réception pour le lien de réinitialisation
3. Utilisez le lien ou appelez directement `/api/reset_password.php` avec le token et le nouveau mot de passe

## Dépannage

### Emails non reçus

1. **Vérifiez les logs** : Les erreurs d'envoi sont enregistrées dans les logs PHP
2. **Vérifiez la configuration** : Assurez-vous que les variables d'environnement sont correctement définies
3. **Test avec simulation** : Définissez `MAIL_DRIVER=simulation` pour voir les emails dans les logs

### Erreurs d'API Brevo

1. Vérifiez que la clé API est valide et active
2. Assurez-vous que l'adresse d'expédition (MAIL_FROM) est autorisée dans votre compte Brevo
3. Consultez les logs pour les messages d'erreur détaillés

## Implémentation technique

Le système de mailing est implémenté dans les fichiers suivants :

- `backend/lib/mail.php` : Fonctions principales d'envoi d'emails
- `backend/config/mail_brevo.php` : Implémentation de l'API Brevo
- `backend/config/mail.php` : Configuration générale du mailing

## Migration vers la production

Pour migrer vers la production :

1. Créez un compte Brevo et générez une clé API
2. Configurez les variables d'environnement en production :
   ```
   MAIL_DRIVER=brevo
   MAIL_FROM=votre-adresse@votredomaine.com
   MAIL_FROM_NAME=Nom de votre application
   BREVO_API_KEY=votre-clé-api-brevo
   ```
3. Testez l'envoi d'emails en production avec le script de test

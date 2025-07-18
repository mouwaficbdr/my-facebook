# Système de mailing - Guide d'utilisation

Ce document explique comment utiliser et tester le système de mailing implémenté pour les fonctionnalités de vérification d'email et de réinitialisation de mot de passe.

## Architecture

Le système de mailing est composé des éléments suivants :

- **Configuration** : `backend/config/mail.php` et `backend/config/mail_brevo.php`
- **Bibliothèque** : `backend/lib/mail.php`
- **Endpoints API** :
  - `backend/api/signup.php` : Inscription avec envoi d'email de confirmation
  - `backend/api/confirm_email.php` : Confirmation d'email
  - `backend/api/forgot_password.php` : Demande de réinitialisation de mot de passe
  - `backend/api/reset_password.php` : Réinitialisation de mot de passe
- **Scripts de test** :
  - `backend/tests/test_mail.php` : Test d'envoi d'email
  - `backend/tests/test_auth_flows.php` : Test des flux d'authentification

## Configuration

### Variables d'environnement

```bash
# Configuration du driver d'email (brevo, mailtrap, simulation)
MAIL_DRIVER=brevo

# Configuration de l'expéditeur
MAIL_FROM=noreply@myfacebook.com
MAIL_FROM_NAME=MyFacebook

# Configuration Brevo (production)
BREVO_API_KEY=votre-clé-api-brevo

# Configuration Mailtrap (développement)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=votre-user-mailtrap
MAIL_PASS=votre-pass-mailtrap
```

## Tests

### Test d'envoi d'email

```bash
cd backend
php tests/test_mail.php votre-email@example.com
```

### Test des flux d'authentification

```bash
cd backend
php tests/test_auth_flows.php votre-email@example.com
```

## Flux utilisateur

### Inscription et vérification d'email

1. L'utilisateur s'inscrit via l'API `/api/signup.php`
2. Un email de confirmation est envoyé avec un token unique
3. L'utilisateur clique sur le lien de confirmation dans l'email
4. L'API `/api/confirm_email.php` valide le token et active le compte
5. L'utilisateur peut maintenant se connecter

### Réinitialisation de mot de passe

1. L'utilisateur demande une réinitialisation via l'API `/api/forgot_password.php`
2. Un email avec un lien de réinitialisation est envoyé
3. L'utilisateur clique sur le lien et entre un nouveau mot de passe
4. L'API `/api/reset_password.php` valide le token et met à jour le mot de passe
5. L'utilisateur peut se connecter avec le nouveau mot de passe

## Sécurité

- Les tokens sont générés avec `random_bytes(32)` pour une sécurité maximale
- Les tokens de réinitialisation de mot de passe expirent après 1 heure
- En production, les réponses API ne révèlent pas si un email existe dans la base de données
- Les erreurs d'envoi d'email sont enregistrées mais n'interrompent pas le flux utilisateur

## Dépannage

### Logs

Les erreurs d'envoi d'email sont enregistrées dans les logs PHP. Vérifiez :

- Les logs PHP standard
- Les logs d'erreur spécifiques via la fonction `log_error()`

### Problèmes courants

1. **Email non envoyé** : Vérifiez la configuration du driver et les credentials
2. **Token invalide** : Vérifiez que le token n'a pas expiré et qu'il est correctement formaté
3. **Erreur API Brevo** : Vérifiez la validité de la clé API et les limites d'envoi

## Personnalisation

### Templates d'email

Les templates d'email sont définis directement dans les fichiers API. Pour les personnaliser :

1. Modifiez le contenu HTML dans les fichiers `signup.php` et `forgot_password.php`
2. Assurez-vous que les liens contiennent toujours les tokens nécessaires

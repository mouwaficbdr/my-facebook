# Module Back Office - Guide d'installation

Ce document explique comment installer et configurer le module back office pour la gestion du réseau social.

## 1. Mise à jour de la base de données

Le module back office nécessite de nouvelles tables dans la base de données. Exécutez le script SQL suivant :

```sql
-- Exécuter le fichier db_update_admin.sql
source backend/db_update_admin.sql
```

Ou importez directement le fichier `backend/db_update_admin.sql` dans votre gestionnaire de base de données.

## 2. Configuration des droits d'accès

Pour accéder au back office, vous devez avoir un compte avec le rôle `admin` ou `moderator`. Vous pouvez modifier le rôle d'un utilisateur existant avec la requête SQL suivante :

```sql
-- Remplacez [EMAIL] par l'email de l'utilisateur à promouvoir
UPDATE users SET role = 'admin' WHERE email = '[EMAIL]';
```

## 3. Accès au back office

Une fois la configuration terminée :

1. Accédez à l'URL `/admin/login` pour vous connecter au back office
2. Utilisez les identifiants d'un compte avec le rôle `admin` ou `moderator`
3. Vous serez redirigé vers le dashboard administrateur

## 4. Fonctionnalités disponibles

### Pour les modérateurs et administrateurs

- **Dashboard** : Statistiques générales du réseau social
- **Utilisateurs** : Liste et recherche des utilisateurs
- **Posts** : Modération des publications

### Pour les administrateurs uniquement

- Gestion des rôles utilisateurs (promotion/rétrogradation)
- Accès aux paramètres avancés

## 5. Sécurité

Le module back office utilise :

- Une authentification distincte de l'interface utilisateur
- Des cookies JWT spécifiques pour l'administration
- Un système de logs pour auditer toutes les actions de modération

## 6. Dépannage

Si vous rencontrez des problèmes :

1. Vérifiez que les tables ont bien été créées dans la base de données
2. Assurez-vous que votre compte a le rôle `admin` ou `moderator`
3. Consultez les logs dans `backend/logs/info.log` et `backend/logs/error.log`

````markdown
# Configuration

FrankenPHP, Caddy ainsi que les modules Mercure et Vulcain peuvent être configurés en utilisant les formats pris en charge par Caddy.

Dans les images Docker, le Caddyfile est situé dans /etc/frankenphp/Caddyfile. Le binaire statique cherchera le Caddyfile dans le répertoire dans lequel il est démarré.

PHP lui-même peut être configuré en utilisant un fichier php.ini.

L’interpréteur PHP cherchera dans les emplacements suivants :

Docker :

    php.ini : /usr/local/etc/php/php.ini Aucun php.ini n’est fourni par défaut.
    fichiers de configuration supplémentaires : /usr/local/etc/php/conf.d/*.ini
    extensions php : /usr/local/lib/php/extensions/no-debug-zts-<YYYYMMDD>/
    Vous devriez copier un modèle officiel fourni par le projet PHP :

FROM dunglas/frankenphp

# Production :
RUN cp $PHP_INI_DIR/php.ini-production $PHP_INI_DIR/php.ini

# Ou développement :
RUN cp $PHP_INI_DIR/php.ini-development $PHP_INI_DIR/php.ini

Installation de FrankenPHP (.rpm ou .deb) :

    php.ini : /etc/frankenphp/php.ini Un fichier php.ini avec des préréglages de production est fourni par défaut.
    fichiers de configuration supplémentaires : /etc/frankenphp/php.d/*.ini
    extensions php : /usr/lib/frankenphp/modules/

Binaire statique :

    php.ini : Le répertoire dans lequel frankenphp run ou frankenphp php-server est exécuté, puis /etc/frankenphp/php.ini
    fichiers de configuration supplémentaires : /etc/frankenphp/php.d/*.ini
    extensions php : ne peuvent pas être chargées
    copiez l’un des fichiers php.ini-production ou php.ini-development fournis dans les sources de PHP.

# Configuration du Caddyfile

Les directives HTTP php_server ou php peuvent être utilisées dans les blocs de site pour servir votre application PHP.

Exemple minimal :

```caddyfile
localhost {
    # Activer la compression (optionnel)
    encode zstd br gzip
    # Exécuter les fichiers PHP dans le répertoire courant et servir les assets
    php_server
}
````

Vous pouvez également configurer explicitement FrankenPHP en utilisant l’option globale : L’option globale frankenphp peut être utilisée pour configurer FrankenPHP.

```caddyfile
{
    frankenphp {
        num_threads <num_threads> # Définit le nombre de threads PHP à démarrer. Par défaut : 2x le nombre de CPUs disponibles.
        max_threads <num_threads> # Limite le nombre de threads PHP supplémentaires qui peuvent être démarrés au moment de l'exécution. Valeur par défaut : num_threads. Peut être mis à 'auto'.
        max_wait_time <duration> # Définit le temps maximum pendant lequel une requête peut attendre un thread PHP libre avant d'être interrompue. Valeur par défaut : désactivé.
        php_ini <key> <value> Définit une directive php.ini. Peut être utilisé plusieurs fois pour définir plusieurs directives.
        worker {
            file <path> # Définit le chemin vers le script worker.
            num <num> # Définit le nombre de threads PHP à démarrer, par défaut 2x le nombre de CPUs disponibles.
            env <key> <value> # Définit une variable d'environnement supplémentaire avec la valeur donnée. Peut être spécifié plusieurs fois pour régler plusieurs variables d'environnement.
            watch <path> # Définit le chemin d'accès à surveiller pour les modifications de fichiers. Peut être spécifié plusieurs fois pour plusieurs chemins.
            name <name> # Définit le nom du worker, utilisé dans les journaux et les métriques. Défaut : chemin absolu du fichier du worker
        }
    }
}
```

# ...

Vous pouvez également utiliser la forme courte de l’option worker en une seule ligne :

```caddyfile
{
    frankenphp {
        worker <file> <num>
    }
}
```

# ...

Vous pouvez aussi définir plusieurs workers si vous servez plusieurs applications sur le même serveur :

```caddyfile
app.example.com {
    php_server {
        root /path/to/app/public
        worker index.php <num>
    }
}

other.example.com {
    php_server {
        root /path/to/other/public
        worker index.php <num>
    }
}
```

# ...

L’utilisation de la directive php\_server est généralement suffisante, mais si vous avez besoin d’un contrôle total, vous pouvez utiliser la directive php, qui permet un plus grand niveau de finesse dans la configuration. La directive php transmet toutes les entrées à PHP, au lieu de vérifier d’abord si c’est un fichier PHP ou pas. En savoir plus à ce sujet dans la page performances.

Utiliser la directive php\_server est équivalent à cette configuration :

```caddyfile
route {
    # Ajoute un slash final pour les requêtes de répertoire
    @canonicalPath {
        file {path}/index.php
        not path */
    }
    redir @canonicalPath {path}/ 308
    # Si le fichier demandé n'existe pas, essayer les fichiers index
    @indexFiles file {
        try_files {path} {path}/index.php index.php
        split_path .php
    }
    rewrite @indexFiles {http.matchers.file.relative}
    # FrankenPHP!
    @phpFiles path *.php
    php @phpFiles
    file_server
}
```

Les directives php\_server et php disposent des options suivantes :

```caddyfile
php_server [<matcher>] {
    root <directory> # Définit le dossier racine du le site. Par défaut : valeur de la directive `root` parente.
    split_path <delim...> # Définit les sous-chaînes pour diviser l'URI en deux parties. La première sous-chaîne correspondante sera utilisée pour séparer le "path info" du chemin. La première partie est suffixée avec la sous-chaîne correspondante et sera considérée comme le nom réel de la ressource (script CGI). La seconde partie sera définie comme PATH_INFO pour utilisation par le script. Par défaut : `.php`
    resolve_root_symlink false # Désactive la résolution du répertoire `root` vers sa valeur réelle en évaluant un lien symbolique, s'il existe (activé par défaut).
    env <key> <value> # Définit une variable d'environnement supplémentaire avec la valeur donnée. Peut être spécifié plusieurs fois pour plusieurs variables d'environnement.
    file_server off # Désactive la directive file_server intégrée.
    worker { # Crée un worker spécifique à ce serveur. Peut être spécifié plusieurs fois pour plusieurs workers.
        file <path> # Définit le chemin vers le script worker, peut être relatif à la racine du php_server
        num <num> # Définit le nombre de threads PHP à démarrer, par défaut 2x le nombre de CPUs disponibles
        name <name> # Définit le nom du worker, utilisé dans les journaux et les métriques. Défaut : chemin absolu du fichier du worker. Commence toujours par m# lorsqu'il est défini dans un bloc php_server.
        watch <path> # Définit le chemin d'accès à surveiller pour les modifications de fichiers. Peut être spécifié plusieurs fois pour plusieurs chemins.
        env <key> <value> # Définit une variable d'environnement supplémentaire avec la valeur donnée. Peut être spécifié plusieurs fois pour plusieurs variables d'environnement. Les variables d'environnement pour ce worker sont également héritées du parent php_server, mais peuvent être écrasées ici.
    }
    worker <other_file> <num> # Peut également utiliser la forme courte comme dans le bloc frankenphp global.
}
```

# Surveillance des modifications de fichier

Vu que les workers ne démarrent votre application qu’une seule fois et la gardent en mémoire, toute modification apportée à vos fichiers PHP ne sera pas répercutée immédiatement.

Les workers peuvent être redémarrés en cas de changement de fichier via la directive watch. Ceci est utile pour les environnements de développement.

```caddyfile
{
	frankenphp {
		worker {
			file  /path/to/app/public/worker.php
			watch
		}
	}
}
```

Si le répertoire watch n’est pas précisé, il se rabattra sur `./**/*.{php,yaml,yml,twig,env}`, qui surveille tous les fichiers .php, .yaml, .yml, .twig et .env dans le répertoire et les sous-répertoires où le processus FrankenPHP a été lancé. Vous pouvez également spécifier un ou plusieurs répertoires via une commande motif de nom de fichier shell :

```caddyfile
{
	frankenphp {
		worker {
			file  /path/to/app/public/worker.php
			watch /path/to/app # surveille tous les fichiers dans tous les sous-répertoires de /path/to/app
			watch /path/to/app/*.php # surveille les fichiers se terminant par .php dans /path/to/app
			watch /path/to/app/**/*.php # surveille les fichiers PHP dans /path/to/app et les sous-répertoires
			watch /path/to/app/**/*.{php,twig} # surveille les fichiers PHP et Twig dans /path/to/app et les sous-répertoires
		}
	}
}
```

* Le motif `**` signifie une surveillance récursive.
* Les répertoires peuvent également être relatifs (depuis l’endroit où le processus FrankenPHP est démarré).
* Si vous avez défini plusieurs workers, ils seront tous redémarrés lorsqu’un fichier est modifié.
* Méfiez-vous des fichiers créés au moment de l’exécution (comme les logs) car ils peuvent provoquer des redémarrages intempestifs du worker.

La surveillance des fichiers est basé sur `e-dant/watcher`.

# Full Duplex (HTTP/1)

Lors de l’utilisation de HTTP/1.x, il peut être souhaitable d’activer le mode full-duplex pour permettre l’écriture d’une réponse avant que le corps entier n’ait été lu. (par exemple : WebSocket, événements envoyés par le serveur, etc.)

Il s’agit d’une configuration optionnelle qui doit être ajoutée aux options globales dans le fichier Caddyfile :

```caddyfile
{
    servers {
        enable_full_duplex
    }
}
```

> ⚠️ **Caution**
> L’activation de cette option peut entraîner un blocage (deadlock) des anciens clients HTTP/1.x qui ne supportent pas le full-duplex. Cela peut aussi être configuré en utilisant la variable d’environnement `CADDY_GLOBAL_OPTIONS` :

```bash
CADDY_GLOBAL_OPTIONS="servers {
  enable_full_duplex
}"
```

Vous trouverez plus d’informations sur ce paramètre dans la documentation Caddy.

# Variables d’environnement

Les variables d’environnement suivantes peuvent être utilisées pour insérer des directives Caddy dans le Caddyfile sans le modifier :

* `SERVER_NAME` : change les adresses sur lesquelles écouter, les noms d’hôte fournis seront également utilisés pour le certificat TLS généré
* `CADDY_GLOBAL_OPTIONS` : injecte des options globales
* `FRANKENPHP_CONFIG` : insère la configuration sous la directive `frankenphp`

Comme pour les SAPI FPM et CLI, les variables d’environnement ne sont exposées par défaut dans la superglobale `$_SERVER`.

La valeur `S` de la directive `variables_order` de PHP est toujours équivalente à `ES`, que `E` soit défini ailleurs dans cette directive ou non.

# Configuration PHP

Pour charger des fichiers de configuration PHP supplémentaires, la variable d’environnement `PHP_INI_SCAN_DIR` peut être utilisée. Lorsqu’elle est définie, PHP chargera tous les fichiers avec l’extension `.ini` présents dans les répertoires donnés.

Vous pouvez également modifier la configuration de PHP en utilisant la directive `php_ini` dans le fichier Caddyfile :

```caddyfile
{
    frankenphp {
        php_ini memory_limit 256M

        # or

        php_ini {
            memory_limit 256M
            max_execution_time 15
        }
    }
}
```

# Activer le mode debug

Lors de l’utilisation de l’image Docker, définissez la variable d’environnement `CADDY_GLOBAL_OPTIONS` sur `debug` pour activer le mode debug :

```bash
docker run -v $PWD:/app/public \
    -e CADDY_GLOBAL_OPTIONS=debug \
    -p 80:80 -p 443:443 -p 443:443/udp \
    dunglas/frankenphp
```






````markdown
# Déploiement en Production

Dans ce tutoriel, nous apprendrons comment déployer une application PHP sur un serveur unique en utilisant Docker Compose.

Si vous utilisez Symfony, lisez plutôt la page de documentation “Déployer en production” du projet Symfony Docker (qui utilise FrankenPHP).

Si vous utilisez API Platform (qui utilise également FrankenPHP), référez-vous à la documentation de déploiement du framework.

## Préparer votre application

Tout d’abord, créez un `Dockerfile` dans le répertoire racine de votre projet PHP :

```dockerfile
FROM dunglas/frankenphp

# Assurez-vous de remplacer "your-domain-name.example.com" par votre nom de domaine
ENV SERVER_NAME=your-domain-name.example.com
# Si vous souhaitez désactiver HTTPS, utilisez cette valeur à la place :
#ENV SERVER_NAME=:80

# Activer les paramètres de production de PHP
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Copiez les fichiers PHP de votre projet dans le répertoire public
COPY . /app/public
# Si vous utilisez Symfony ou Laravel, vous devez copier l'intégralité du projet à la place :
#COPY . /app
````

Consultez “Construire une image Docker personnalisée” pour plus de détails et d’options, et pour apprendre à personnaliser la configuration, installer des extensions PHP et des modules Caddy.

Si votre projet utilise Composer, assurez-vous de l’inclure dans l’image Docker et d’installer vos dépendances.

Ensuite, ajoutez un fichier `compose.yaml` :

```yaml
services:
  php:
    image: dunglas/frankenphp
    restart: always
    ports:
      - "80:80" # HTTP
      - "443:443" # HTTPS
      - "443:443/udp" # HTTP/3
    volumes:
      - caddy_data:/data
      - caddy_config:/config

# Volumes nécessaires pour les certificats et la configuration de Caddy
volumes:
  caddy_data:
  caddy_config:
```

> **Note**
> Les exemples précédents sont destinés à une utilisation en production. En développement, vous pourriez vouloir utiliser un volume, une configuration PHP différente et une valeur différente pour la variable d’environnement `SERVER_NAME`.
>
> Jetez un œil au projet Symfony Docker (qui utilise FrankenPHP) pour un exemple plus avancé utilisant des images multi-étapes, Composer, des extensions PHP supplémentaires, etc.

Pour finir, si vous utilisez Git, commitez ces fichiers et poussez-les.

## Préparer un serveur

Pour déployer votre application en production, vous avez besoin d’un serveur. Dans ce tutoriel, nous utiliserons une machine virtuelle fournie par **DigitalOcean**, mais n’importe quel serveur Linux peut fonctionner. Si vous avez déjà un serveur Linux avec Docker installé, vous pouvez passer directement à la section suivante.

Sinon, utilisez ce lien affilié pour obtenir **200\$ de crédit gratuit**, créez un compte, puis cliquez sur “Créer un Droplet”. Ensuite, cliquez sur l’onglet “Marketplace” sous la section “Choisir une image” et recherchez l’application nommée **“Docker”**. Cela provisionnera un serveur Ubuntu avec les dernières versions de Docker et Docker Compose déjà installées !

Pour des fins de test, les plans les moins chers seront suffisants. Pour une utilisation en production réelle, vous voudrez probablement choisir un plan dans la section “General Usage” pour répondre à vos besoins.

### Déployer FrankenPHP sur DigitalOcean avec Docker

Vous pouvez conserver les paramètres par défaut pour les autres paramètres, ou les ajuster selon vos besoins. N’oubliez pas d’ajouter votre **clé SSH** ou de créer un mot de passe puis appuyez sur le bouton “Finalize and create”.

Ensuite, attendez quelques secondes pendant que votre Droplet est en cours de provisionnement. Lorsque votre Droplet est prêt, utilisez SSH pour vous connecter :

```bash
ssh root@<droplet-ip>
```

## Configurer un nom de domaine

Dans la plupart des cas, vous souhaiterez associer un nom de domaine à votre site. Si vous ne possédez pas encore de nom de domaine, vous devrez en acheter un via un registraire.

Ensuite, créez un enregistrement DNS de type A pour votre nom de domaine pointant vers l’adresse IP de votre serveur :

```
your-domain-name.example.com.  IN  A     207.154.233.113
```

Exemple avec le service **DigitalOcean Domains** (“Networking” > “Domains”) :

### Configurer les DNS sur DigitalOcean

> **Note**
> Let’s Encrypt, le service utilisé par défaut par FrankenPHP pour générer automatiquement un certificat TLS, ne prend pas en charge l’utilisation d’adresses IP nues.
> L’utilisation d’un **nom de domaine est obligatoire** pour utiliser Let’s Encrypt.

## Déploiement

Copiez votre projet sur le serveur en utilisant `git clone`, `scp`, ou tout autre outil qui pourrait répondre à votre besoin. Si vous utilisez GitHub, vous voudrez peut-être utiliser une **clef de déploiement**. Les clés de déploiement sont également prises en charge par GitLab.

Exemple avec Git :

```bash
git clone git@github.com:<username>/<project-name>.git
```

Accédez au répertoire contenant votre projet (`<project-name>`), et démarrez l’application en mode production :

```bash
docker compose up -d --wait
```

Votre serveur est opérationnel, et un certificat HTTPS a été automatiquement généré pour vous. Rendez-vous sur `https://your-domain-name.example.com` !

> ⚠️ **Caution**
> Docker peut avoir une couche de cache, assurez-vous d’avoir la bonne version de build pour chaque déploiement ou **reconstruisez votre projet avec l’option `--no-cache`** pour éviter les problèmes de cache.

## Déploiement sur Plusieurs Nœuds

Si vous souhaitez déployer votre application sur un **cluster de machines**, vous pouvez utiliser **Docker Swarm**, qui est compatible avec les fichiers Compose fournis.

Pour un déploiement sur **Kubernetes**, jetez un œil au **Helm chart** fourni avec **API Platform**, qui utilise FrankenPHP.


# PHP

Railpack can automatically build and deploy PHP applications with FrankenPHP, a modern and efficient PHP application server.
Detection

Your project will be detected as a PHP application if any of these conditions are met:

    An index.php file exists in the root directory
    A composer.json file exists in the root directory

Versions

The PHP version is determined in the following order:

    Read from the composer.json file
    Defaults to 8.4

Only PHP 8.2 and above are supported.
Configuration

Railpack will configure FrankenPHP for your application. For Laravel applications, the document root is set to the public directory.
Config Variables
Variable	Description	Example
RAILPACK_PHP_ROOT_DIR	Override the document root	/app/public
RAILPACK_PHP_EXTENSIONS	Additional PHP extensions to install	gd,imagick,redis
RAILPACK_SKIP_MIGRATIONS	Disable running Laravel migrations (default: false)	true
Custom Configuration

Railpack uses default Caddyfile and php.ini configuration files. You can override these by placing your own versions in your project root:

    /Caddyfile - Custom Caddy server configuration
    /php.ini - Custom PHP configuration

Startup Process

The application is started using a start-container.sh script that:

    For Laravel applications:
        Runs database migrations and seeding (enabled by default, can be disabled with RAILPACK_SKIP_MIGRATIONS)
        Creates storage symlinks
        Optimizes the application
    Starts the FrankenPHP server using the Caddyfile configuration

You can customize the startup process by placing your own start-container.sh in the project root.
PHP Extensions

PHP extensions are automatically installed based on:

    Requirements specified in composer.json (e.g., ext-redis)
    Extensions listed in the RAILPACK_PHP_EXTENSIONS environment variable

Example composer.json with required extensions:

{
  "require": {
    "php": ">=8.2",
    "ext-pgsql": "*",
    "ext-redis": "*"
  }
}

Laravel Support

Laravel applications are detected by the presence of an artisan file. When detected:

    The document root is set to the /app/public directory
    Storage directory permissions are set to be writable
    Composer dependencies are installed
    Artisan caches are optimized at build time:
        Configuration cache
        Event cache
        Route cache
        View cache

Node.js Integration

If a package.json file is detected in your PHP project:

    Node.js will be installed
    NPM dependencies will be installed
    Build scripts defined in package.json will be executed
    Development dependencies will be pruned in the final image

This is particularly useful for Laravel applications that use frontend frameworks like Vue.js or React.

You can see the node docs for information on how to configure node.


# Adding Steps

You can easily customize the install and build commands with environment variables. However, sometimes you can also add additional steps to your build. This is useful if you want to optimize cache hits or don’t want to affect the automatically generated provider commands.
Adding a Step

To add a step, you can use the steps field in your configuration file.

{
  "$schema": "https://schema.railpack.com",
  "steps": {
    "new-step": {
      "commands": ["echo 'Hello, world!'"]
    },
  }
}

The default inputs for a new step is:

"inputs": [
  { "step": "packages:mise" }
]

This means that the commands will run in the build image with access to Mise and build apt packages.

If you want to run after a specific provider-generated step, you can specify the inputs. For example, this will run the new-step after the build step.

{
  "$schema": "https://schema.railpack.com",
  "steps": {
    "new-step": {
      "inputs": [
        { "step": "build" }
      ],
      "commands": ["echo 'Hello, world!'"]
    },
  }
}

Including the step output in the final image

By default, the entire /app directory is included in the final image. You can customize this by specifying a deployOutputs field. For example, this will include the dist directory in the final image.

{
  "$schema": "https://schema.railpack.com",
  "steps": {
    "new-step": {
      "commands": ["echo 'Hello, world!'"],
      "deployOutputs": [
        "dist"
      ]
    },
  }
}

Note: deployOutputs is syntactic sugar for adding this layer to the deploy.inputs field. The above example is equivalent to.

{
  "$schema": "https://schema.railpack.com",
  "steps": {
    "new-step": {
      "commands": ["echo 'Hello, world!'"],
      "deployOutputs": []
    },
  },
  "deploy": {
    "inputs": [
      { "step": "new-step", "include": ["dist"] }
    ]
  }
}

Setting the deployOutputs to an empty array will mean that no files from the step are included in the final image and therefore no commands will be executed.
Running commands that affect the runtime image

This is possible, but not recommended at the moment. Is is instead recommended to use

    deploy.aptPackages to install packages that are needed at runtime
    Copy specific files from a step into the runtime image with deployOutputs



# Developing Locally

Once you’ve checked out the repo, you can follow this to start developing locally.
Getting Setup

We use Mise for managing language dependencies and tasks for building and testing Railpack. You don’t have to use Mise, but it’s recommended.

Install and use all versions of tools needed for Railpack
Terminal window

Assuming you are cd'd into the repo root
mise run setup

List all the commands available
Terminal window

mise run cli --help

Building directly with Buildkit

👋 Requirement: an instance of Buildkit must be running locally. Instructions in “Run BuildKit Locally” at the bottom of the readme.

Railpack will instantiate a BuildKit client and communicate to over GRPC in order to build the generated LLB.
Terminal window

mise run cli --verbose build examples/node-bun

You need to have a BuildKit instance running (see below).
Custom frontend

You can build with a custom BuildKit frontend, but this is a bit tedious for local iteration.

The frontend needs to be built into an image and accessible to the BuildKit instance. To see how you can build and push an image, see the build-and-push-frontend mise task in mise.toml.

Once you have an image, you can do:

Generate a build plan for an app:
Terminal window

mise run cli plan examples/node-bun --out test/railpack-plan.json

Build the app with Docker:
Terminal window

docker buildx \
  --build-arg BUILDKIT_SYNTAX="ghcr.io/railwayapp/railpack:railpack-frontend" \
  -f test/railpack-plan.json \
  examples/node-bun

or use BuildKit directly:
Terminal window

buildctl build \
  --local context=examples/node-bun \
  --local dockerfile=test \
  --frontend=gateway.v0 \
  --opt source=ghcr.io/railwayapp/railpack:railpack-frontend \
  --output type=docker,name=test | docker load

Note the docker load here to load the image into Docker. However, you can change the output or push to a registry instead.
Mise commands
Terminal window

## Lint and format
mise run check

## Run tests
mise run test

## Start the docs dev server
mise run docs-dev



# Running Railpack in Production

This guide will walk you through running Railpack in production as a platform (like Railway).
CLI vs Frontend

Railpack can build using the CLI or through a custom BuildKit frontend. It is highly recommended to use the frontend in production. To build, the CLI simply creates a BuildKit client and pipes the result into docker load and is not something designed or optimized to be used with high throughput. The CLI is still used to analyze the code and generate a build plan. The rest of this guide will assume you are using a custom frontend.
Prepare Command

The prepare command is the recommended way to prepare a directory for building. It will

    Output the build result to stdout (this shows users what will happen in the build)
    Save the build plan to a file (e.g. railpack.json)
    Save the build info to a railpack-info.json file

The build plan is used by the frontend to build the app. The build info can be used by the platform to gain insights into the app being built (e.g. the provider detected, versions installed, app metadata, etc.).
Terminal window

railpack prepare /dir/to/build --plan-out railpack-plan.json --info-out railpack-info.json

railpack prepare command
Building with BuildKit

Each version of Railpack includes a BuildKit frontend available as an image on ghcr. It is recommended to use the same version of the frontend that was used to generate the build plan.

You can build with Docker by specifying a custom syntax. BuildKit must be enabled. Pass the path to the build plan file with the -f flag (it does not need to be in the same directory as the app being built).
Terminal window

docker buildx build \
  --build-arg BUILDKIT_SYNTAX="ghcr.io/railwayapp/railpack-frontend" \
  -f /path/to/railpack-plan.json \
  /path/to/app/to/build

Alternatively, you can build with BuildKit directly.
Terminal window

buildctl build \
  --local context=/path/to/app/to/build \
  --local dockerfile=/path/to/dir/containing/railpack-plan.json \
  --frontend=gateway.v0 \
  --opt source=ghcr.io/railwayapp/railpack:railpack-frontend \
  --output type=docker,name=test

Building with the Docker or BuildKit command is useful because you can pass any additional flags you want to the build, without them having to be supported by the Railpack CLI.
Secrets

The secrets that are availabe to commands in the build must be specified in the build plan. You can pass secrets to the prepare command with the --env flag.
Terminal window

railpack prepare /dir/to/build --env STRIPE_LIVE_KEY=sk_live_asdf

These secrets can be used to configure the plan, but the names will also be included in the build plan itself (not the values). This is important so that the frontend knowns what secrets to mount as environment variables when generating the LLB.

To include the values of the secrets for the build, you can pass them as Docker build secrets.
Terminal window

STRIPE_LIVE_KEY=asdfasdf docker build \
  --build-arg BUILDKIT_SYNTAX="ghcr.io/railwayapp/railpack-frontend" \
  -f /path/to/railpack-plan.json \
  --secret id=STRIPE_LIVE_KEY,env=STRIPE_LIVE_KEY \
  /path/to/app/to/build

Note how the secret is availabe to docker build at the start and also passed through the --secret flag.
Layer invalidation

By default, layers will not be invalidated when a secret value changes. To get around this, Railpack uses a hash of the secret values and mounts this as a file in the layer. When using the railpack CLI to build, this happens automatically, but if you are using the frontend directly, calculate the hash yourself and pass it as a build arg.
Terminal window

--build-arg secrets-hash=<hash-of-secret-values>

Mount cache ID

By default, the cache ID is the directory that is being cached. If you are building in a multi-tenant environment, you will likely want to isolate the mount caches. You can do this by passing a cache-key as a build arg. The cache key will be prefixed to all mount cache IDs used.
Terminal window

--build-arg cache-key=<cache-key>

Full example

This is a small script that will build an app using the Railpack frontend.

#!/bin/bash

APP_DIR=my-app

## Prepare the app and generate the build plan
railpack prepare $APP_DIR --plan-out ./railpack-plan.json --info-out ./railpack-info.json

## Compute the hash of the secret values
secrets_hash=$(echo -n "STRIPE_LIVE_KEY=sk_live_asdf" | sha256sum | awk '{print $1}')

## Build with BuildKit and the Railpack frontend
docker buildx build \
  --build-arg BUILDKIT_SYNTAX="ghcr.io/railwayapp/railpack-frontend" \
  -f ./railpack-plan.json \
  --build-arg secrets-hash=$secrets_hash \
  --output type=docker,name=test \
  $APP_DIR




# Configuration File

Beta file format

The config file format is not yet finalized and subject to change.

Railpack will look for a railpack.json file in the root of the directory being built. You can override this by setting the RAILPACK_CONFIG_FILE environment variable to a path relative to the directory being built.

If found, that configuration will be used to change how the plan is built.

A config file looks something like this:

{
  "$schema": "https://schema.railpack.com",
  "steps": {
    "install": {
      "commands": ["npm install"]
    },
    "build": {
      "inputs": [{ "step": "install" }],
      "commands": ["...", "./my-custom-build.sh"]
    }
  },
  "deploy": {
    "startCommand": "node dist/index.js"
  }
}

Layers

Layers define where a step gets its filesystem from. They can be:

    Another step’s output
    A Docker image
    Local files

The first input layer for a step is the base file system and cannot include any filter.

Layers are used both for steps and for the deploy section. The deploy section explicitly has a base layer defined that is used as the base file system for the final image. For example, the layers of a Node build might look like this:

"deploy": {
  "base": {
    "image": "ghcr.io/railwayapp/railpack-runtime:latest"
  },
  "inputs": [
    {
      "step": "packages:mise",
      "include": [
        "/mise/shims",
        "/mise/installs",
        // ...
      ]
    },
    {
      "step": "build",
      "include": ["."]
    }
  ]
}

Step Layer

Use another step’s output as a layer:

{
  "step": "install",
  "include": ["."], // "." represents the working directory (/app)
  "exclude": ["node_modules"]
}

Image Layer

Use a Docker image as a layer:

{
  "image": "macabees/neofetch",
  "include": ["/usr/bin/neofetch"]
}

Local Layer

Use local files as a layer:

{
  "local": true,
  "include": ["."]
}

Layer Filters

All layer types support these options:
Field	Description
include	Files or directories to include
exclude	Files or directories to exclude
Array Extending

You can use the ... special syntax to extend arrays in the configuration. This is useful when you want to add items to an existing array rather than override it completely.

For example:

{
  "steps": {
    "build": {
      // Runs ./my-custom-build.sh after the auto-generated build commands
      "commands": ["...", "./my-custom-build.sh"]
    }
  },
  "deploy": {
    "inputs": [
      "...",

      // Copies the neofetch binary into the final image on top of the auto-generated image
      { "image": "macabees/neofetch", "include": ["/usr/bin/neofetch"] }
    ]
  }
}

Root Configuration

The root configuration can have these fields:
Field	Description
provider	The provider to use for deployment (optional, autodetected by default)
buildAptPackages	List of apt packages to install during the build step
packages	Map of package name to package version
caches	Map of cache name to cache definitions. The cache names are referenced in steps
secrets	List of secrets that should be made available to commands
steps	Map of step names to step definitions

For example:

{
  "provider": "node",
  "buildAptPackages": ["git", "curl"],
  "packages": {
    "node": "22",
    "python": "3.13"
  },
}

Caches

Caches are used to speed up builds by storing and reusing files between builds. Each cache has a type and a directory. Caches are not persisted in the final image.

The cache name is referenced in the caches field of a step. A cache has the following properties:
Field	Description
directory	The directory to cache
type	The type of cache (either “shared” or “locked”, defaults to “shared”)

For example:

{
  "caches": {
    "npm-install": {
      "directory": "/root/.npm",
      "type": "shared"
    },
    "apt": {
      "directory": "/var/cache/apt",
      "type": "locked"
    }
  }
}

Cache Types

    shared: Multiple builds can use this cache simultaneously (used for package manager caches)
    locked: Only one build can use this cache at a time (used for apt caches to prevent concurrent package installations)

Steps

Each step in the build process can have:
Field	Description
inputs	List of layers for this step (from other steps, images, or local files)
commands	List of commands to run in this step
secrets	List of secrets that this step uses
assets	Mapping of name to file contents referenced in file commands
variables	Mapping of name to variable values referenced in variable commands
caches	List of cache IDs available to all commands in this step
deployOutputs	List of filters that specify which parts of this step should be included in the final image
Commands

A list of commands to run in a step. For example:

{
  "commands": [
    // Copy the package.json file from the local context into the build
    { "src": "package.json", "dest": "package.json" },

    // Install dependencies
    {
      "cmd": "npm install",
      "customName": "Install dependencies"
    }

    // Make the node_modules/.bin directory available in the PATH
    { "path": "node_modules/.bin" }
  ]
}

Exec command

Executes a shell command during the build (e.g. ‘go build’ or ‘npm install’).
Field	Description
cmd	The shell command to execute
customName	Optional custom name to display for this command

If the command is a string, it is assumed to be an exec command in the format sh -c '<cmd>'.
Path command

Adds a directory to the global PATH environment variable. This path will be available to all subsequent commands in the build.
Field	Description
path	Directory path to add to the global PATH environment variable
Copy command

Copies files or directories during the build. Can copy from a source image or local context.
Field	Description
image	Optional source image to copy from (e.g. ‘node:18’)
src	Source path to copy from (file or directory)
dest	Destination path to copy to (will be created if needed)
File command

Creates or modifies a file during the build with optional Unix file permissions.
Field	Description
path	Directory path where the file should be created
name	Name of the file to create
mode	Optional Unix file permissions mode (e.g. 0644)
customName	Optional custom name to display for this file operation
String format

Commands can also be specified using a string format:

    npm install - Executes the command
    PATH:/usr/local/bin - Adds to PATH
    COPY:src dest - Copies files

Deploy

The deploy section configures how the container runs:
Field	Description
base	The base layer for the deploy step (typically a runtime image)
startCommand	The command to run when the container starts
variables	Environment variables available to the start command
paths	Paths to prepend to the $PATH environment variable
inputs	List of layers for the deploy step (from steps, images, or local files)
aptPackages	List of Apt packages to install in the final image
Schema

The schema for the config file is available at https://schema.railpack.com. Add it to your railpack.json to get autocomplete and validation in your editor.

{
  "$schema": "https://schema.railpack.com"
}



# Environment Variables

Some parts of the build can be configured with environment variables. These are often prefixed with RAILPACK_.
Build Configuration
Name	Description
RAILPACK_BUILD_CMD	Set the command to run for the build step. This overwrites any commands that come from providers
RAILPACK_INSTALL_CMD	Set the command to run for the install step. This overwrites any commands that come from providers. All files are copied to the root of the project before running the command.
RAILPACK_START_CMD	Set the command to run when the container starts
RAILPACK_PACKAGES	Install additional Mise packages. In the format pkg@version. The latest version is used if not provided.
RAILPACK_BUILD_APT_PACKAGES	Install additional Apt packages during build
RAILPACK_DEPLOY_APT_PACKAGES	Install additional Apt packages in the final image

To configure more parts of the build, it is recommended to use a config file.
Global Options

These environment variables affect the behavior of Railpack:
Name	Description
FORCE_COLOR	Force colored output even when not in a TTY



# Procfile

Railpack automatically detects and uses Procfile configuration files to determine how your application should start. This is compatible with Heroku-style Procfiles and provides a simple way to specify different process types for your application.

Note

Procfiles are deprecated and natively setting the start command with RAILPACK_START_CMD or in the railpack.json config file is the recommended
Detection

Railpack will automatically detect a Procfile in your project root directory. No additional configuration is required - if a Procfile exists, Railpack will use it to set the container start command.
Format

The Procfile uses a YAML-style format where each line defines a process type and its associated command:

web: gunicorn --bind 0.0.0.0:3333 main:app
worker: celery worker -A myapp.celery
scheduler: celery beat -A myapp.celery

Process Type Priority

Railpack prioritizes process types in the following order:

    web - Highest priority, typically used for HTTP servers
    worker - Second priority, typically used for background job processors
    Any other process type - If neither web nor worker are defined, Railpack will use the first available process type

This priority system ensures that web servers are preferred for containerized deployments, while still supporting applications that only define worker processes or custom process types like scheduler, urgentWorker, or api.
Examples
Web Application

web: node server.js

Background Worker

worker: python worker.py

Multiple Process Types

web: gunicorn app:application
worker: celery worker -A app.celery
scheduler: celery beat -A app.celery

In this example, Railpack will use the web command as the container start command.
Custom Process Types

api: ./bin/api-server
urgentWorker: python urgent_tasks.py

If no web or worker process types are defined, Railpack will use the first available process type (in this case, api).
Integration with Other Configuration

The Procfile start command can be overridden by:

    Setting RAILPACK_START_CMD environment variable
    Defining deploy.startCommand in your railpack.json config file

The priority order is:

    RAILPACK_START_CMD environment variable (highest priority)
    deploy.startCommand in railpack.json
    Procfile process types (web → worker → other)
    Provider-specific defaults (lowest priority)




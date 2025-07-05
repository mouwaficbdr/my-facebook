#!/bin/bash

echo "🔍 Vérification du déploiement Vercel..."

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de vérification
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 manquant${NC}"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 manquant${NC}"
        return 1
    fi
}

echo -e "\n📁 Vérification des fichiers requis :"
errors=0

# Fichiers de configuration
check_file "vercel.json" || ((errors++))
check_file ".env.example" || ((errors++))
check_file "package.json" || ((errors++))

# API endpoints
check_dir "api" || ((errors++))
check_file "api/signup.php" || ((errors++))
check_file "api/login.php" || ((errors++))
check_file "api/confirm_email.php" || ((errors++))
check_file "api/forgot_password.php" || ((errors++))
check_file "api/reset_password.php" || ((errors++))
check_file "api/logout.php" || ((errors++))
check_file "api/test_email.php" || ((errors++))

# Backend
check_dir "backend" || ((errors++))
check_file "backend/ca.pem" || ((errors++))
check_dir "backend/config" || ((errors++))
check_dir "backend/lib" || ((errors++))

# Frontend
check_dir "frontend" || ((errors++))
check_file "frontend/package.json" || ((errors++))

echo -e "\n🔧 Vérification du build :"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build réussi${NC}"
else
    echo -e "${RED}❌ Build échoué${NC}"
    ((errors++))
fi

echo -e "\n📊 Résumé :"
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}🎉 Tout est prêt pour le déploiement !${NC}"
    echo -e "\n📋 Prochaines étapes :"
echo "1. Configurer les variables d'environnement dans Vercel"
echo "2. Lancer : vercel"
echo "3. Tester les endpoints après déploiement"
echo "4. Les emails seront simulés en production (normal)"
else
    echo -e "${RED}❌ $errors erreur(s) détectée(s)${NC}"
    echo "Veuillez corriger les erreurs avant le déploiement."
fi

exit $errors 
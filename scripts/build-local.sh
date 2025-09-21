#!/bin/bash

echo "🏗️  Construction de Massflix en mode local..."

# Nettoyer les anciens builds
echo "🧹 Nettoyage..."
rm -rf dist/
rm -rf server/node_modules/

# Construire le frontend
echo "⚛️  Construction du frontend..."
npm run build

# Installer les dépendances du serveur
echo "🔧 Installation des dépendances du serveur..."
cd server
npm install --only=production
cd ..

# Construire l'image Docker
echo "🐳 Construction de l'image Docker..."
docker build -f Dockerfile.local -t massflix-local:latest .

# Construire l'image du scanner
echo "📡 Construction de l'image du scanner..."
docker build -f Dockerfile.scanner-local -t massflix-scanner-local:latest .

echo "✅ Construction terminée!"
echo ""
echo "Pour démarrer Massflix :"
echo "  docker-compose -f docker-compose.local.yml up -d"
echo ""
echo "Accès à l'application :"
echo "  http://localhost:3001"
echo ""
echo "Compte admin par défaut :"
echo "  Email: admin@massflix.local"
echo "  Mot de passe: admin123"
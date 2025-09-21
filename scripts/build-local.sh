#!/bin/bash

# Script de construction pour Massflix Local
echo "🏗️  Construction de Massflix en mode local..."

# Vérifications préliminaires
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé ou accessible"
    exit 1
fi

# Nettoyer les anciens builds
echo "🧹 Nettoyage..."
rm -rf dist/
rm -rf server/node_modules/

# Construire le frontend
echo "⚛️  Construction du frontend..."
npm run build || {
    echo "❌ Erreur lors du build frontend"
    exit 1
}

# Installer les dépendances du serveur
echo "🔧 Installation des dépendances du serveur..."
cd server
npm install --only=production || {
    echo "❌ Erreur lors de l'installation des dépendances serveur"
    exit 1
}
cd ..

# Rendre les scripts exécutables
echo "🔐 Configuration des permissions..."
chmod +x scripts/*.sh
chmod +x start-local.sh

# Construire l'image Docker principale
echo "🐳 Construction de l'image Docker principale..."
docker build -f Dockerfile.local -t massflix-local:latest . || {
    echo "❌ Erreur lors de la construction de l'image principale"
    exit 1
}

# Construire l'image du scanner
echo "📡 Construction de l'image du scanner..."
docker build -f Dockerfile.scanner-local -t massflix-scanner-local:latest . || {
    echo "❌ Erreur lors de la construction de l'image scanner"
    exit 1
}

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.local .env
fi

# Créer les répertoires de démonstration
echo "📁 Création des répertoires de démonstration..."
mkdir -p demo-data/{movies,series,posters,banners}
mkdir -p data logs

echo "✅ Construction terminée avec succès !"
echo ""
echo "🚀 Pour démarrer Massflix :"
echo "   ./start-local.sh prod"
echo ""
echo "🔧 Pour le développement :"
echo "   ./start-local.sh dev"
echo ""
echo "📚 Voir DEPLOY-TRUENAS.md pour le déploiement sur TrueNAS Scale"
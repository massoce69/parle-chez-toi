#!/bin/bash

# Script de démarrage rapide pour Massflix Local
# Usage: ./start-local.sh [dev|prod]

set -e

MODE=${1:-dev}
PROJECT_NAME="massflix-local"

echo "🎬 Démarrage de Massflix Local en mode $MODE"

# Vérifier que Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé ou accessible"
    exit 1
fi

# Vérifier que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé ou accessible"
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.local .env
    echo "✏️  Pensez à adapter les valeurs dans .env selon votre environnement"
fi

# Fonction de nettoyage
cleanup() {
    echo "🧹 Arrêt des conteneurs..."
    docker-compose -f docker-compose.local.yml down
}

# Piège pour nettoyer lors de l'arrêt
trap cleanup EXIT

case $MODE in
    "dev")
        echo "🔧 Mode développement"
        echo "📦 Construction des images..."
        
        # Build du frontend
        echo "⚛️  Build frontend..."
        npm run build || {
            echo "❌ Erreur lors du build frontend"
            exit 1
        }
        
        # Démarrage des services
        echo "🚀 Démarrage des services..."
        docker-compose -f docker-compose.local.yml up --build
        ;;
    
    "prod")
        echo "🏭 Mode production"
        
        # Vérifier que les images existent ou les construire
        if ! docker images | grep -q "$PROJECT_NAME"; then
            echo "📦 Construction des images de production..."
            ./scripts/build-local.sh || {
                echo "❌ Erreur lors de la construction"
                exit 1
            }
        fi
        
        # Démarrage en arrière-plan
        echo "🚀 Démarrage en mode daemon..."
        docker-compose -f docker-compose.local.yml up -d
        
        echo "✅ Massflix Local démarré !"
        echo ""
        echo "📱 Application accessible sur :"
        echo "   http://localhost:3001"
        echo ""
        echo "👤 Compte administrateur :"
        echo "   Email: admin@massflix.local"
        echo "   Mot de passe: admin123"
        echo ""
        echo "📊 Surveillance :"
        echo "   docker-compose -f docker-compose.local.yml logs -f"
        echo ""
        echo "⏹️  Arrêt :"
        echo "   docker-compose -f docker-compose.local.yml down"
        
        # Ne pas exécuter le cleanup automatiquement en mode prod
        trap - EXIT
        ;;
    
    *)
        echo "❌ Mode invalide: $MODE"
        echo "Usage: $0 [dev|prod]"
        echo ""
        echo "  dev  - Mode développement (logs en temps réel)"
        echo "  prod - Mode production (daemon en arrière-plan)"
        exit 1
        ;;
esac
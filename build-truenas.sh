#!/bin/bash

# 🎬 Script de construction Massflix pour TrueNAS Scale
# Optimisé pour sécurité, performance et simplicité

set -e

echo "🏗️ Construction Massflix TrueNAS Scale..."

# Vérifications préliminaires
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non trouvé. Installation requise."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose non trouvé. Installation requise."
    exit 1
fi

# Nettoyage
echo "🧹 Nettoyage des builds précédents..."
docker system prune -f
docker-compose -f docker-compose.truenas.yml down --volumes --remove-orphans 2>/dev/null || true

# Variables de sécurité
JWT_SECRET=${JWT_SECRET:-"massflix-truenas-$(openssl rand -hex 32)"}
SCAN_INTERVAL=${SCAN_INTERVAL:-3600}

echo "🔐 Génération clé JWT sécurisée..."
echo "JWT_SECRET=${JWT_SECRET}" > .env.production

# Construction des images optimisées
echo "🐳 Construction image principale..."
docker build -t massflix-truenas:latest \
  --build-arg NODE_ENV=production \
  --no-cache .

echo "📡 Construction scanner médias..."
docker build -f Dockerfile.scanner-local -t massflix-scanner-truenas:latest .

# Préparation structure TrueNAS
echo "📁 Préparation structure de données..."
mkdir -p {data,logs,backups}
mkdir -p demo-data/{movies,series,posters,banners}

# Permissions sécurisées
echo "🔒 Configuration permissions..."
chmod 755 data logs backups
chmod 644 docker-compose.truenas.yml
chmod +x scripts/*.sh

# Validation des images
echo "✅ Validation des images Docker..."
docker images | grep massflix-truenas
docker inspect massflix-truenas:latest > /dev/null
docker inspect massflix-scanner-truenas:latest > /dev/null

# Configuration finale
echo "⚙️ Configuration finale..."
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  massflix:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - SCAN_INTERVAL=${SCAN_INTERVAL}
EOF

echo ""
echo "🎉 Construction terminée avec succès !"
echo ""
echo "📋 Prochaines étapes pour TrueNAS Scale :"
echo ""
echo "1. Copier les fichiers sur TrueNAS :"
echo "   scp -r . root@[IP-TRUENAS]:/mnt/pool1/massflix/"
echo ""
echo "2. Sur TrueNAS, démarrer les services :"
echo "   cd /mnt/pool1/massflix/"
echo "   docker-compose -f docker-compose.truenas.yml up -d"
echo ""
echo "3. Accéder à l'application :"
echo "   http://[IP-TRUENAS]:3001"
echo "   Compte admin: admin@massflix.local / admin123"
echo ""
echo "🔐 JWT Secret généré :"
echo "   ${JWT_SECRET}"
echo ""
echo "📖 Documentation complète : INSTALL-TRUENAS.md"
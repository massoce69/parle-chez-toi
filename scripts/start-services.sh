#!/bin/sh

echo "🎬 Démarrage de Massflix Local..."

# Préparer les répertoires
mkdir -p /data /media/movies /media/series /media/posters /media/banners

# Permissions
chmod -R 755 /media /data

# Afficher la configuration
echo "📊 Configuration :"
echo "   - Mode: LOCAL AUTONOME (sans nginx/supabase)"
echo "   - Base de données: SQLite (/data/massflix.db)"
echo "   - Médias: /media/"
echo "   - Application: Node.js + React (port 3001)"
echo ""
echo "👤 Compte administrateur :"
echo "   - Email: admin@massflix.local"
echo "   - Mot de passe: admin123"
echo ""

# Démarrer le serveur Node.js (qui sert aussi le frontend)
echo "🚀 Démarrage de l'application..."
cd /app/server
node server.js &
NODE_PID=$!

# Fonction de nettoyage
cleanup() {
    echo "🛑 Arrêt de l'application..."
    kill $NODE_PID 2>/dev/null || true
    exit 0
}

# Piège pour nettoyer lors de l'arrêt
trap cleanup SIGTERM SIGINT

echo "✅ Massflix Local démarré avec succès !"
echo "🌍 Accessible sur http://localhost:3001"

# Surveiller le processus
wait $NODE_PID
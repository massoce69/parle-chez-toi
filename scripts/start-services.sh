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
echo "🔐 Configuration sécurisée des identifiants..."
if [ -z "$ADMIN_PASSWORD" ]; then
    export ADMIN_PASSWORD=$(openssl rand -hex 16)
    echo "✅ Mot de passe admin généré: $ADMIN_PASSWORD"
    echo "⚠️  CHANGEZ CE MOT DE PASSE lors de la première connexion!"
fi

if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET=$(openssl rand -hex 32)
    echo "✅ JWT Secret généré"
fi

if [ -z "$SCANNER_API_KEY" ]; then
    export SCANNER_API_KEY=$(echo -n "$JWT_SECRET" | sha256sum | cut -d' ' -f1)
    echo "✅ Clé API scanner générée"
fi

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
echo "📧 Admin: admin@massflix.local"
echo "🔐 Consultez les logs pour le mot de passe"

# Surveiller le processus
wait $NODE_PID
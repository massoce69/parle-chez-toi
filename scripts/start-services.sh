#!/bin/sh

echo "🎬 Démarrage des services Massflix Local..."

# Préparer les répertoires
mkdir -p /data /media/movies /media/series /media/posters /media/banners /var/log/nginx /var/run

# Permissions
chmod -R 755 /media /data
chown -R nginx:nginx /usr/share/nginx/html

# Afficher la configuration
echo "📊 Configuration :"
echo "   - Mode: LOCAL (sans Supabase)"
echo "   - Base de données: SQLite (/data/massflix.db)"
echo "   - Médias: /media/"
echo "   - Frontend: Nginx (port 80)"
echo "   - API: Node.js (port 3001)"
echo ""
echo "👤 Compte administrateur :"
echo "   - Email: admin@massflix.local"
echo "   - Mot de passe: admin123"
echo ""

# Démarrer le serveur Node.js en arrière-plan
echo "🚀 Démarrage de l'API Node.js..."
cd /app/server
node server.js &
NODE_PID=$!

# Attendre que l'API soit prête
echo "⏳ Attente de l'API..."
sleep 5
until curl -f http://localhost:3001/api/content >/dev/null 2>&1; do
    echo "   API en cours de démarrage..."
    sleep 2
done
echo "✅ API prête !"

# Démarrer Nginx
echo "🌐 Démarrage de Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Fonction de nettoyage
cleanup() {
    echo "🛑 Arrêt des services..."
    kill $NODE_PID 2>/dev/null || true
    kill $NGINX_PID 2>/dev/null || true
    exit 0
}

# Piège pour nettoyer lors de l'arrêt
trap cleanup SIGTERM SIGINT

echo "✅ Massflix Local démarré avec succès !"
echo "🌍 Accessible sur http://localhost"

# Surveiller les processus
wait
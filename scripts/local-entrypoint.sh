#!/bin/sh

echo "Démarrage de Massflix en mode local..."

# Vérifier que les répertoires de médias existent
echo "Vérification des répertoires de médias..."
for dir in "/media/movies" "/media/series" "/media/posters" "/media/banners"; do
    if [ ! -d "$dir" ]; then
        echo "Création du répertoire $dir"
        mkdir -p "$dir"
    else
        echo "✓ $dir trouvé"
    fi
done

# Créer le répertoire de données si nécessaire
mkdir -p /data
echo "Base de données SQLite: /data/massflix.db"

# Configurer les permissions
chmod -R 755 /media /data

# Afficher les informations de configuration
echo "Configuration:"
echo "- Mode: LOCAL (sans Supabase)"
echo "- Base de données: SQLite (/data/massflix.db)"
echo "- Médias: /media/"
echo "- Port: 3001"
echo ""
echo "Compte administrateur par défaut:"
echo "- Email: admin@massflix.local"
echo "- Mot de passe: admin123"
echo ""

# Démarrer le serveur Node.js
cd /app/server
echo "Démarrage du serveur Massflix..."
exec node server.js
#!/bin/sh

# Script de démarrage pour le container Massflix
echo "Démarrage de Massflix..."

# Vérifier que les répertoires de médias existent
echo "Vérification des répertoires de médias..."
for dir in "/media/movies" "/media/series" "/media/posters" "/media/banners"; do
    if [ ! -d "$dir" ]; then
        echo "Avertissement: Le répertoire $dir n'existe pas ou n'est pas monté"
        mkdir -p "$dir"
    else
        echo "✓ $dir trouvé"
    fi
done

# Configurer les permissions
chown -R nginx:nginx /usr/share/nginx/html
chmod -R 755 /media

# Afficher les informations de configuration
echo "Configuration:"
echo "- MEDIA_PATH: ${MEDIA_PATH:-/media}"
echo "- NODE_ENV: ${NODE_ENV:-production}"

# Démarrer Nginx
echo "Démarrage de Nginx..."
exec "$@"
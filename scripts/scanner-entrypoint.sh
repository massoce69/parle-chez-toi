#!/bin/sh

echo "Démarrage du scanner de médias..."

# Vérifier les variables d'environnement requises
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "Erreur: SUPABASE_URL et SUPABASE_SERVICE_KEY sont requis"
    exit 1
fi

# Attendre que l'application principale soit prête
echo "Attente de l'application principale..."
sleep 30

# Exécuter le scan initial
echo "Scan initial..."
node media-scanner.js

# Scanner périodiquement (toutes les heures)
echo "Démarrage du scan périodique..."
while true; do
    echo "$(date): Scan automatique..."
    node media-scanner.js
    echo "$(date): Scan terminé, attente 1 heure..."
    sleep 3600
done
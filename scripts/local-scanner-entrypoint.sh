#!/bin/sh

echo "Démarrage du scanner de médias local..."

# Vérifier les variables d'environnement requises
if [ -z "$MASSFLIX_API_URL" ]; then
    echo "Configuration par défaut de l'API URL"
    export MASSFLIX_API_URL="http://massflix-local:3001/api"
fi

# Attendre que l'application principale soit prête
echo "Attente de l'application principale..."
sleep 30

# Vérifier que l'API est accessible
echo "Vérification de l'API..."
while ! curl -f "$MASSFLIX_API_URL/content" >/dev/null 2>&1; do
    echo "API non accessible, attente..."
    sleep 10
done

echo "API accessible, démarrage du scan..."

# Exécuter le scan initial
echo "Scan initial..."
node scanner.js

# Scanner périodiquement (toutes les heures)
echo "Démarrage du scan périodique..."
while true; do
    echo "$(date): Scan automatique..."
    node scanner.js
    echo "$(date): Scan terminé, attente 1 heure..."
    sleep 3600
done
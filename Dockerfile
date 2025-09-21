# Dockerfile pour Massflix Local (sans nginx)
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY vite.config.ts vite.config.ts
COPY tsconfig*.json ./
COPY tailwind.config.ts ./
COPY index.html ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY src/ ./src/
COPY public/ ./public/

# Build du frontend
RUN npm run build

# Image de production
FROM node:18-alpine

WORKDIR /app

# Installer les outils système nécessaires
RUN apk add --no-cache curl

# Copier le serveur Node.js
COPY server/ ./server/
WORKDIR /app/server
RUN npm install --production

# Copier le build frontend
COPY --from=frontend-build /app/dist ./public

# Copier les scripts
COPY scripts/start-services.sh /app/start-services.sh
RUN chmod +x /app/start-services.sh

# Créer les répertoires nécessaires
RUN mkdir -p /data /media/movies /media/series /media/posters /media/banners

# Exposer le port
EXPOSE 3001

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

# Démarrer les services
CMD ["/app/start-services.sh"]
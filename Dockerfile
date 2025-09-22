# Dockerfile optimisé pour TrueNAS Scale
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.ts ./
COPY index.html ./

# Installer les dépendances avec cache
RUN npm ci --only=production --silent

# Copier le code source
COPY src/ ./src/
COPY public/ ./public/

# Build du frontend optimisé
RUN npm run build

# Image de production ultra-légère
FROM node:18-alpine

# Créer utilisateur non-root pour la sécurité
RUN addgroup -g 1000 -S massflix && \
    adduser -u 1000 -S massflix -G massflix

WORKDIR /app

# Installer outils système minimum + sécurité
RUN apk add --no-cache \
    curl \
    dumb-init \
    tini \
    && rm -rf /var/cache/apk/*

# Copier le serveur Node.js
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production --silent && npm cache clean --force

# Copier le code serveur
COPY server/ ./
WORKDIR /app

# Copier le build frontend
COPY --from=frontend-build /app/dist ./server/public

# Copier les scripts optimisés
COPY scripts/start-services.sh ./start-services.sh
RUN chmod +x ./start-services.sh

# Créer les répertoires avec bonnes permissions
RUN mkdir -p /data /media/movies /media/series /media/posters /media/banners && \
    chown -R massflix:massflix /app /data /media

# Variables d'environnement sécurisées
ENV NODE_ENV=production \
    PORT=3001 \
    JWT_SECRET=change-this-in-production \
    MEDIA_PATH=/media \
    DB_PATH=/data/massflix.db

# Passer à l'utilisateur non-root
USER massflix

# Exposer le port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/api/content || exit 1

# Point d'entrée avec init système
ENTRYPOINT ["tini", "--"]
CMD ["./start-services.sh"]
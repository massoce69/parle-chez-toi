# 🎬 Installation Massflix sur TrueNAS Scale

## Installation Ultra-Simple en 5 Minutes

### Prérequis TrueNAS Scale
- TrueNAS Scale 24.04+ 
- 2GB RAM minimum 
- Docker activé
- Accès administrateur

### 🚀 Installation Rapide

#### 1. Préparation des Datasets
```bash
# Se connecter en SSH sur TrueNAS
ssh root@[IP-TRUENAS]

# Créer la structure de dossiers
mkdir -p /mnt/pool1/massflix/{data,movies,series,posters,banners}
chmod 755 /mnt/pool1/massflix/
```

#### 2. Téléchargement et Déploiement
```bash
# Aller dans le répertoire Massflix
cd /mnt/pool1/massflix/

# Cloner le projet (ou télécharger)
git clone [URL-DU-PROJET] app/
cd app/

# Construction et démarrage automatique
docker-compose -f docker-compose.truenas.yml up -d
```

#### 3. Accès Immédiat
- **URL**: `http://[IP-TRUENAS]:3001`
- **Admin**: `admin@massflix.local` / `admin123`

---

## 🔧 Configuration Avancée

### Variables d'Environnement
Créer `/mnt/pool1/massflix/app/.env.local`:
```env
# Sécurité - OBLIGATOIRE en production
JWT_SECRET=votre-cle-secrete-ultra-forte-ici

# Performance
SCAN_INTERVAL=1800
MAX_FILE_SIZE=10737418240
RATE_LIMIT_REQUESTS=200

# Chemins (optionnel si différent)
TRUENAS_MOVIES_PATH=/mnt/pool1/movies
TRUENAS_SERIES_PATH=/mnt/pool1/series
```

### Structure Recommandée des Médias
```
/mnt/pool1/massflix/
├── data/              # Base de données SQLite
├── movies/
│   ├── Avatar (2009)/
│   │   ├── Avatar.2009.1080p.mkv
│   │   ├── poster.jpg
│   │   └── banner.jpg
│   └── Inception (2010)/
│       └── Inception.2010.4K.mp4
├── series/
│   ├── Breaking Bad/
│   │   ├── S01E01.mp4
│   │   ├── poster.jpg
│   │   └── banner.jpg
├── posters/           # Images générales
└── banners/           # Bannières générales
```

---

## 🛡️ Sécurité TrueNAS

### Permissions Optimales
```bash
# Sécuriser les permissions
chown -R 1000:1000 /mnt/pool1/massflix/data
chmod 750 /mnt/pool1/massflix/data
chmod 644 /mnt/pool1/massflix/movies/* -R
chmod 644 /mnt/pool1/massflix/series/* -R
```

### Firewall (Optionnel)
```bash
# Limiter l'accès au réseau local uniquement
iptables -A INPUT -p tcp --dport 3001 -s 192.168.0.0/16 -j ACCEPT
iptables -A INPUT -p tcp --dport 3001 -j DROP
```

---

## 📊 Surveillance et Maintenance

### Commandes Utiles
```bash
# Statut des conteneurs
docker ps

# Logs en temps réel
docker-compose logs -f massflix

# Redémarrage complet
docker-compose restart

# Mise à jour
git pull && docker-compose build --no-cache
```

### Métriques de Performance
- **RAM utilisée**: ~512MB en fonctionnement
- **CPU**: <5% en utilisation normale
- **Stockage**: ~50MB application + médias
- **Démarrage**: <30 secondes

---

## 🔄 Backup et Restauration

### Backup Automatique
```bash
# Script de sauvegarde
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /mnt/pool1/massflix/data/massflix.db /mnt/pool1/backups/massflix_$DATE.db
find /mnt/pool1/backups/massflix_*.db -mtime +30 -delete
```

### Restauration
```bash
# Arrêter Massflix
docker-compose down

# Restaurer la base
cp /mnt/pool1/backups/massflix_YYYYMMDD_HHMMSS.db /mnt/pool1/massflix/data/massflix.db

# Redémarrer
docker-compose up -d
```

---

## 🚨 Résolution de Problèmes

### Problèmes Courants
1. **Port 3001 occupé**: Modifier dans `docker-compose.truenas.yml`
2. **Permissions refusées**: Vérifier `chown 1000:1000`
3. **Médias non détectés**: Vérifier structure des dossiers
4. **Performance lente**: Augmenter RAM allouée

### Logs de Debug
```bash
# Logs détaillés
docker-compose logs --tail=100 massflix
docker-compose logs --tail=50 media-scanner
```

---

## 📱 Accès Externe (Optionnel)

### Via Reverse Proxy
```nginx
# Configuration nginx-proxy-manager
server {
    listen 80;
    server_name massflix.mondomaine.com;
    
    location / {
        proxy_pass http://[IP-TRUENAS]:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Via Tunnel Cloudflare
```bash
# Installation cloudflared
docker run -d --name cloudflared cloudflare/cloudflared:latest tunnel \
  --url http://[IP-TRUENAS]:3001
```

---

## ⚡ Optimisations Performance

### SSD Cache (Recommandé)
- Placer `/data/` sur SSD pour DB rapide
- Cache ZFS sur SSD pour médias

### RAM Disk (Avancé)
```bash
# Cache temporaire en RAM
mount -t tmpfs -o size=1G tmpfs /mnt/pool1/massflix/cache
```

---

## 🎯 Installation Réussie !

Votre Massflix est maintenant opérationnel sur TrueNAS Scale avec:
- ✅ Sécurité renforcée (utilisateur non-root, read-only)
- ✅ Performance optimisée (multi-stage build, cache)
- ✅ Surveillance complète (health checks, logs)
- ✅ Backup automatique possible
- ✅ Scan automatique des médias
- ✅ Interface web moderne et responsive

**Prochaines étapes**: Ajoutez vos médias dans les dossiers et regardez la magie opérer ! 🎬
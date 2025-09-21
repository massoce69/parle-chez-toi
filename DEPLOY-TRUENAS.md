# 🎬 Déploiement Massflix Local sur TrueNAS Scale

Guide complet pour déployer Massflix en version locale sur TrueNAS Scale sans dépendances externes.

## 📋 Prérequis

### Structure des datasets TrueNAS
Créez cette structure dans votre pool TrueNAS :

```
/mnt/pool/datasets/
├── movies/              # Films (.mp4, .mkv, .avi, etc.)
│   ├── Film1 (2024)/
│   │   ├── Film1.mkv
│   │   ├── poster.jpg   # Optionnel
│   │   └── banner.jpg   # Optionnel
│   └── Film2.mp4
├── series/              # Séries TV
│   ├── Série1/
│   │   ├── Season 1/
│   │   │   ├── episode1.mkv
│   │   │   └── episode2.mkv
│   │   └── poster.jpg
│   └── Série2/
├── posters/             # Affiches (optionnel)
└── banners/             # Bannières (optionnel)
```

### Formats supportés
- **Vidéo** : MP4, MKV, AVI, MOV, WMV, FLV, WebM, M4V
- **Images** : JPG, JPEG, PNG, WebP

## 🚀 Installation rapide

### 1. Téléchargement
```bash
# Sur votre TrueNAS ou machine de développement
git clone [votre-repo-massflix]
cd massflix
```

### 2. Configuration
```bash
# Copier et adapter le fichier de configuration
cp .env.local .env

# Éditer le fichier .env avec vos chemins TrueNAS
nano .env
```

**Exemple de configuration .env :**
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this
TRUENAS_MOVIES_PATH=/mnt/tank/datasets/movies
TRUENAS_SERIES_PATH=/mnt/tank/datasets/series
TRUENAS_POSTERS_PATH=/mnt/tank/datasets/posters
TRUENAS_BANNERS_PATH=/mnt/tank/datasets/banners
```

### 3. Démarrage
```bash
# Rendre le script exécutable
chmod +x start-local.sh

# Démarrage en mode production
./start-local.sh prod
```

## 📦 Méthodes de déploiement

### Option A : Script automatique (Recommandé)
```bash
./start-local.sh prod
```

### Option B : Docker Compose manuel
```bash
# Build du frontend
npm run build

# Démarrage des services
docker-compose -f docker-compose.local.yml up -d
```

### Option C : TrueNAS Scale Apps (Custom App)

1. **Aller dans Apps > Available Applications**
2. **Cliquer sur "Launch Docker Image"**
3. **Configuration :**

```yaml
Application Name: massflix-local
Container Repository: [votre-registry]/massflix-local
Container Tag: latest

Port Configuration:
- Container Port: 80
- Node Port: 30001 (ou port libre)

Storage:
- Host Path: /mnt/pool/datasets/movies
- Mount Path: /media/movies
- Read Only: true

- Host Path: /mnt/pool/datasets/series  
- Mount Path: /media/series
- Read Only: true

- Host Path: /mnt/pool/datasets/data
- Mount Path: /data
- Read Only: false

Environment Variables:
- JWT_SECRET: your-secret-key
- NODE_ENV: production
```

## 🔧 Configuration TrueNAS Scale

### Apps personnalisées
Si vous préférez une app TrueNAS native :

1. **Créer l'app :**
   - Applications > Available Applications
   - Launch Docker Image

2. **Configuration réseau :**
   - Port externe : 30001 (ou libre)
   - Port interne : 80

3. **Volumes :**
   ```
   /mnt/pool/datasets/movies → /media/movies (RO)
   /mnt/pool/datasets/series → /media/series (RO)
   /mnt/pool/datasets/data   → /data        (RW)
   ```

### Permissions et sécurité
```bash
# Sur TrueNAS, vérifier les permissions
chmod -R 755 /mnt/pool/datasets/movies
chmod -R 755 /mnt/pool/datasets/series
```

## 🌐 Accès à l'application

### URLs d'accès
- **Application principale :** `http://truenas-ip`
- **API directe :** `http://truenas-ip:3001/api`
- **Health check :** `http://truenas-ip/health`

### Compte administrateur par défaut
```
Email : admin@massflix.local
Mot de passe : admin123
```

**⚠️ Changez ces identifiants après la première connexion !**

## 📊 Surveillance et maintenance

### Logs
```bash
# Logs de l'application
docker-compose -f docker-compose.local.yml logs -f massflix-local

# Logs du scanner
docker-compose -f docker-compose.local.yml logs -f media-scanner-local

# Logs nginx (si configuré)
tail -f ./logs/access.log
tail -f ./logs/error.log
```

### Statistiques
```bash
# Utilisation des ressources
docker stats massflix-local

# Espace disque de la base de données
ls -lh ./data/massflix.db
```

### Scanner automatique
Le scanner détecte automatiquement les nouveaux médias :
- **Scan initial** : Au démarrage
- **Scan périodique** : Toutes les heures (configurable)
- **Détection** : Fichiers vidéo + métadonnées

## 🛠️ Dépannage

### Problèmes courants

**1. Médias non détectés :**
```bash
# Vérifier les montages
docker exec massflix-local ls -la /media/

# Relancer le scanner
docker restart massflix-scanner-local
```

**2. Base de données corrompue :**
```bash
# Sauvegarder et recréer
docker exec massflix-local cp /data/massflix.db /data/massflix.backup.db
docker exec massflix-local rm /data/massflix.db
docker restart massflix-local
```

**3. Performances lentes :**
```bash
# Vérifier l'utilisation disque
docker exec massflix-local df -h

# Nettoyer les logs
docker exec massflix-local truncate -s 0 /var/log/nginx/*.log
```

### Commandes utiles
```bash
# Arrêt complet
docker-compose -f docker-compose.local.yml down

# Reconstruction complète
docker-compose -f docker-compose.local.yml down -v
./start-local.sh prod

# Accès au conteneur
docker exec -it massflix-local sh

# Sauvegarde de la base
docker exec massflix-local cp /data/massflix.db /tmp/
docker cp massflix-local:/tmp/massflix.db ./backup-$(date +%Y%m%d).db
```

## 🔒 Sécurité et performance

### Sécurité
- ✅ Volumes en lecture seule pour les médias
- ✅ Base de données locale chiffrée
- ✅ Pas de dépendances externes
- ✅ JWT sécurisés
- ⚠️ Changez `JWT_SECRET` en production

### Performance
- ✅ Cache Nginx pour les médias
- ✅ Compression Gzip
- ✅ Streaming vidéo optimisé
- ✅ Base SQLite performante
- ✅ Build React optimisé

### Sauvegarde
```bash
# Script de sauvegarde automatique
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec massflix-local cp /data/massflix.db /tmp/backup_$DATE.db
docker cp massflix-local:/tmp/backup_$DATE.db ./backups/
```

## 📞 Support

### Ressources
- **Logs détaillés** : `docker-compose logs`
- **Monitoring** : Interface web + health checks
- **Documentation** : README-LOCAL.md

### Migration depuis Supabase
Si vous migrez depuis une version Supabase :

1. **Exporter les données** Supabase (si nécessaire)
2. **Arrêter** l'ancienne version
3. **Déployer** la version locale  
4. **Scanner** les médias existants

---

🎉 **Félicitations !** Votre Massflix local est maintenant opérationnel sur TrueNAS Scale !
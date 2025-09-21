# Déploiement Massflix sur TrueNAS Scale

## Prérequis

### Structure des datasets
Créez la structure suivante sur votre TrueNAS Scale :

```
/mnt/pool/datasets/
├── movies/          # Fichiers vidéo des films
├── series/          # Fichiers vidéo des séries
├── posters/         # Images des affiches (format: nom-du-film.jpg)
└── banners/         # Images des bannières (format: nom-du-film.jpg)
```

### Conventions de nommage
- **Films** : `Movie.Name.2023.1080p.BluRay.x264.mp4`
- **Séries** : `Series.Name.S01E01.Episode.Name.1080p.WEB-DL.x264.mp4`
- **Posters** : `Movie.Name.2023.jpg` (même nom que le fichier vidéo)
- **Bannières** : `Movie.Name.2023.jpg` (même nom que le fichier vidéo)

## Déploiement

### 1. Configuration des variables d'environnement

Créez un fichier `.env` dans le répertoire du projet :

```bash
# Configuration Supabase
VITE_SUPABASE_URL=https://hoowaqdxwvcfwwvanixo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvb3dhcWR4d3ZjZnd3dmFuaXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxODQ0OTEsImV4cCI6MjA3Mzc2MDQ5MX0.SiUTQJ7-jL7TvIey10JwIKL5bPIYpRKo8l3B5nQpWtc
VITE_SUPABASE_PROJECT_ID=hoowaqdxwvcfwwvanixo

# Clé de service pour le scanner (à obtenir depuis Supabase Dashboard)
SUPABASE_SERVICE_KEY=your_service_key_here
```

### 2. Adapter les chemins dans docker-compose.yml

Modifiez les chemins de montage selon votre configuration TrueNAS :

```yaml
volumes:
  - /mnt/your-pool/datasets/movies:/media/movies:ro
  - /mnt/your-pool/datasets/series:/media/series:ro
  - /mnt/your-pool/datasets/posters:/media/posters:ro
  - /mnt/your-pool/datasets/banners:/media/banners:ro
```

### 3. Déploiement via Docker Compose

```bash
# Cloner le projet
git clone <your-repo-url>
cd massflix

# Construire et démarrer les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

### 4. Configuration TrueNAS Scale Apps

Si vous utilisez l'interface TrueNAS Scale Apps :

1. **Créer une Custom App**
2. **Configuration Container** :
   - Image Repository : `massflix` (après build local)
   - Tag : `latest`
   - Pull Policy : `Never`

3. **Port Configuration** :
   - Container Port : `80`
   - Node Port : `30080` (ou votre choix)

4. **Volume Mounts** :
   - Host Path : `/mnt/pool/datasets/movies` → Container Path : `/media/movies`
   - Host Path : `/mnt/pool/datasets/series` → Container Path : `/media/series`
   - Host Path : `/mnt/pool/datasets/posters` → Container Path : `/media/posters`
   - Host Path : `/mnt/pool/datasets/banners` → Container Path : `/media/banners`

5. **Environment Variables** : Ajouter toutes les variables du fichier `.env`

## Scanner automatique de médias

Le service `media-scanner` analyse automatiquement vos répertoires de médias :

- **Scan initial** au démarrage
- **Scan périodique** toutes les heures
- **Extraction automatique** des métadonnées (durée, résolution, codec)
- **Association automatique** des posters et bannières

### Logs du scanner
```bash
docker-compose logs media-scanner
```

## Accès à l'application

Une fois déployée, l'application sera accessible via :
- **Local** : `http://truenas-ip:8080`
- **TrueNAS Apps** : `http://truenas-ip:30080` (si configuré via Apps)

## Dépannage

### Vérifier les montages de volumes
```bash
docker exec -it massflix ls -la /media/
```

### Vérifier les permissions
```bash
# Sur TrueNAS, s'assurer que les datasets sont lisibles
chmod -R 755 /mnt/pool/datasets/
```

### Logs détaillés
```bash
# Application principale
docker-compose logs massflix-app

# Scanner de médias
docker-compose logs media-scanner
```

### Base de données
Vérifiez que votre base de données Supabase est accessible et que les tables sont créées selon le schéma fourni.

## Sécurité

- Les volumes sont montés en **lecture seule** (`ro`) pour la sécurité
- Nginx sert directement les fichiers média avec cache approprié
- Support du streaming vidéo avec gestion des headers `Range`
- CORS configuré pour l'accès aux médias

## Performance

- **Cache Nginx** : 1 an pour les médias statiques
- **Streaming vidéo** : Support des requêtes de plage (Range requests)
- **Compression Gzip** : Activée pour les assets web
- **Build multi-stage** : Image Docker optimisée
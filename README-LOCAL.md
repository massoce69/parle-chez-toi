# Massflix - Version Locale (Sans Supabase)

Cette version de Massflix fonctionne entièrement en local avec SQLite, sans dépendance à Supabase.

## Fonctionnalités

- **Base de données locale** : SQLite pour toutes les données
- **Authentification locale** : Système JWT simple
- **Scanner automatique** : Détection automatique des médias dans vos dossiers
- **Interface complète** : Toutes les fonctionnalités de streaming
- **Conteneurisation** : Déployable avec Docker sur TrueNAS Scale

## Déploiement rapide

### 1. Configuration

Créez un fichier `.env.local` :

```env
JWT_SECRET=votre-cle-secrete-tres-longue-et-complexe
```

### 2. Build et démarrage

```bash
# Construire le frontend
npm run build

# Démarrer avec Docker Compose
docker-compose -f docker-compose.local.yml up -d
```

### 3. Accès à l'application

- **URL** : http://votre-truenas:3001
- **Admin par défaut** :
  - Email: `admin@massflix.local`
  - Mot de passe: `admin123`

## Configuration TrueNAS Scale

### Structure des datasets

```
/mnt/pool/datasets/
├── movies/           # Films (.mp4, .mkv, etc.)
├── series/           # Séries TV
├── posters/          # Affiches (optionnel)
└── banners/          # Bannières (optionnel)
```

### Docker Compose pour TrueNAS

Adaptez les chemins dans `docker-compose.local.yml` :

```yaml
volumes:
  # Adaptez ces chemins à votre configuration TrueNAS
  - /mnt/votre-pool/movies:/media/movies:ro
  - /mnt/votre-pool/series:/media/series:ro
  - /mnt/votre-pool/posters:/media/posters:ro
  - /mnt/votre-pool/banners:/media/banners:ro
```

## Fonctionnalités locales

### Base de données SQLite

- **Localisation** : `/data/massflix.db` dans le conteneur
- **Persistance** : Volume Docker `massflix_data`
- **Sauvegarde** : Copiez simplement le fichier SQLite

### Scanner automatique

Le scanner détecte automatiquement :

- **Films** : Fichiers vidéo dans `/media/movies/`
- **Séries** : Dossiers dans `/media/series/`
- **Métadonnées** : Extraction du titre et de l'année
- **Images** : Posters et bannières associés

### API REST locale

L'API fournit tous les endpoints nécessaires :

- `GET /api/content` - Liste du contenu
- `GET /api/content/trending` - Contenu populaire
- `GET /api/content/new` - Nouveautés
- `POST /api/auth/login` - Connexion
- `POST /api/favorites` - Gestion des favoris
- `POST /api/watch-history` - Historique de visionnage

## Avantages de la version locale

### ✅ Avantages

- **Aucune dépendance externe** (pas de Supabase)
- **Données 100% locales** sur votre NAS
- **Performance** : Pas de latence réseau
- **Coût zéro** : Pas d'abonnement cloud
- **Contrôle total** : Vos données restent chez vous
- **Simplicité** : Un seul conteneur Docker

### ⚠️ Limitations

- **Pas de synchronisation multi-appareils**
- **Sauvegarde manuelle** des données
- **Pas de notifications push**
- **Authentification simple** (pas OAuth)

## Surveillance et logs

```bash
# Voir les logs de l'application
docker logs massflix-local

# Voir les logs du scanner
docker logs massflix-scanner-local

# Surveiller l'utilisation
docker stats massflix-local
```

## Sauvegardes

Pour sauvegarder vos données :

```bash
# Sauvegarder la base de données
docker cp massflix-local:/data/massflix.db ./backup-$(date +%Y%m%d).db

# Restaurer une sauvegarde
docker cp ./backup-20240101.db massflix-local:/data/massflix.db
docker restart massflix-local
```

## Migration depuis Supabase

Si vous aviez une version Supabase et voulez migrer :

1. **Exportez vos données** depuis Supabase
2. **Arrêtez** l'ancienne version
3. **Déployez** cette version locale
4. **Importez** vos données dans SQLite (script à créer)

## Support

Cette version locale est autonome et ne nécessite aucune configuration externe. 
Tous les services sont conteneurisés et prêts à l'emploi.
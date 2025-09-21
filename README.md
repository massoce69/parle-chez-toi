# 🎬 Massflix Local

**Version locale autonome de Massflix - Sans dépendances externes**

Massflix Local est une version complètement autonome de la plateforme de streaming qui fonctionne entièrement sur votre serveur local sans avoir besoin de services externes comme Supabase.

## ✨ Fonctionnalités

- 🎥 **Streaming vidéo local** - Films et séries depuis vos dossiers
- 🔐 **Authentification locale** - Comptes utilisateurs avec JWT
- 📱 **Interface responsive** - Compatible mobile, tablette et desktop
- 🎨 **Design moderne** - Interface utilisateur élégante
- 👥 **Multi-utilisateurs** - Gestion des profils et rôles
- 📊 **Administration** - Panneau d'admin pour gérer le contenu
- 🔍 **Recherche avancée** - Trouvez vos contenus rapidement
- ❤️ **Favoris** - Marquez vos contenus préférés
- 📈 **Historique** - Suivez votre progression
- 🤖 **Scanner automatique** - Détection automatique des nouveaux médias

## 🚀 Démarrage rapide

### Prérequis

- Docker & Docker Compose
- Node.js 18+ (pour le développement)

### Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd massflix-local
```

2. **Démarrer en mode développement**
```bash
chmod +x start-local.sh
./start-local.sh dev
```

3. **Ou en mode production**
```bash
./start-local.sh prod
```

### Accès

- **Application** : http://localhost:3001
- **Compte admin** : admin@massflix.local / admin123

## 📁 Structure des médias

Organisez vos médias comme suit :

```
/media/
├── movies/
│   ├── Film 1 (2021)/
│   │   ├── film1.mp4
│   │   └── poster.jpg
│   └── Film 2 (2022)/
│       ├── film2.mkv
│       └── poster.jpg
├── series/
│   ├── Serie 1/
│   │   ├── Season 1/
│   │   │   ├── S01E01.mp4
│   │   │   └── S01E02.mp4
│   │   └── poster.jpg
│   └── Serie 2/
│       ├── Season 1/
│       │   ├── S01E01.mkv
│       │   └── S01E02.mkv
│       └── poster.jpg
├── posters/
└── banners/
```

## ⚙️ Configuration

Modifiez `.env.local` pour adapter à votre environnement :

```env
# Chemins vers vos médias TrueNAS
TRUENAS_MOVIES_PATH=/mnt/tank/media/movies
TRUENAS_SERIES_PATH=/mnt/tank/media/series
TRUENAS_POSTERS_PATH=/mnt/tank/media/posters
TRUENAS_BANNERS_PATH=/mnt/tank/media/banners

# Sécurité
JWT_SECRET=votre-secret-securise

# Scanner
SCAN_INTERVAL=3600  # Scan toutes les heures
```

## 🔧 Commandes utiles

```bash
# Voir les logs
docker-compose -f docker-compose.local.yml logs -f

# Arrêter les services
docker-compose -f docker-compose.local.yml down

# Reconstruire les images
docker-compose -f docker-compose.local.yml up --build

# Accès au conteneur
docker exec -it massflix-local sh
```

## 📋 Technologies utilisées

- **Frontend** : React 18, TypeScript, Tailwind CSS
- **Backend** : Node.js, Express
- **Base de données** : SQLite
- **Authentification** : JWT local
- **Containerisation** : Docker

## 🛡️ Sécurité

- Authentification JWT locale
- Hashage des mots de passe avec bcrypt
- Validation des données côté serveur
- Headers de sécurité configurés

## 📦 Production

Pour un déploiement en production :

1. Modifiez le `JWT_SECRET` dans `.env.local`
2. Configurez vos chemins de médias TrueNAS
3. Lancez avec `./start-local.sh prod`
4. Configurez la redirection sur votre routeur vers le port 3001

## 🤝 Support

Pour toute question ou problème, consultez les logs :
```bash
docker-compose -f docker-compose.local.yml logs -f massflix-local
```
# 🎬 Massflix sur TrueNAS Scale - Guide Complet Débutants

## 📋 Prérequis

### Matériel Minimum
- **CPU** : 4 cœurs minimum (Intel/AMD 64-bit)
- **RAM** : 8 GB minimum, 16 GB recommandé
- **Stockage** : 
  - 32 GB pour le système TrueNAS
  - Espace supplémentaire pour vos médias (films/séries)
- **Réseau** : Connexion Ethernet stable

### Logiciels
- TrueNAS Scale 24.04+ installé
- Accès administrateur à votre routeur
- Un ordinateur pour la configuration

## 🚀 Étape 1 : Préparation de TrueNAS Scale

### 1.1 Accès à l'interface web
1. Ouvrez votre navigateur
2. Allez à `http://IP-DE-VOTRE-TRUENAS` (ex: `http://192.168.1.100`)
3. Connectez-vous avec vos identifiants administrateur

### 1.2 Vérification du système
1. Allez dans **System** → **General** → **Update**
2. Vérifiez que vous avez la dernière version
3. Notez l'adresse IP de votre TrueNAS

## 📁 Étape 2 : Création des Datasets (Dossiers)

### 2.1 Accès au stockage
1. Dans le menu de gauche, cliquez sur **Storage**
2. Sélectionnez votre pool principal (souvent appelé "tank" ou le nom de votre disque)

### 2.2 Création des datasets pour Massflix
Créez les datasets suivants (un par un) :

1. **Dataset principal** : `massflix`
   - Clic droit sur votre pool → **Add Dataset**
   - Nom : `massflix`
   - Laissez les autres options par défaut
   - Cliquez **Save**

2. **Sous-datasets** dans `massflix` :
   - `massflix/movies` (pour vos films)
   - `massflix/series` (pour vos séries)
   - `massflix/posters` (pour les affiches)
   - `massflix/banners` (pour les bannières)
   - `massflix/data` (pour la base de données)

Pour chaque sous-dataset :
- Clic droit sur `massflix` → **Add Dataset**
- Entrez le nom (movies, series, etc.)
- **Save**

### 2.3 Configuration des permissions
Pour chaque dataset créé :
1. Cliquez sur le dataset
2. Onglet **Permissions**
3. **Owner** : `root`
4. **Group** : `root`
5. **Mode** : `755`
6. Cochez **Apply permissions recursively**
7. **Save**

## 🐳 Étape 3 : Installation de Docker

### 3.1 Activation du service Docker
1. Allez dans **System** → **Services**
2. Trouvez **Docker** dans la liste
3. Cliquez sur l'interrupteur pour l'activer
4. Cochez **Start Automatically** pour qu'il démarre au boot

### 3.2 Vérification
1. Le service Docker doit être **Running** (vert)
2. Si erreur, redémarrez TrueNAS et réessayez

## 📦 Étape 4 : Installation de Massflix

### 4.1 Accès aux conteneurs
1. Dans le menu de gauche, cliquez sur **Apps**
2. Puis **Discover Apps** ou **Available Applications**

### 4.2 Installation personnalisée
1. Cliquez sur **Launch Docker Image** ou **Custom App**
2. Remplissez les informations suivantes :

#### Configuration de base
- **Application Name** : `massflix`
- **Image repository** : `ghcr.io/votre-username/massflix-local`
- **Image tag** : `latest`

#### Configuration réseau
- **Port Forwarding** :
  - Container Port : `3001`
  - Node Port : `3001` (ou un autre port libre comme `8080`)
  - Protocol : `TCP`

#### Configuration des volumes (IMPORTANT)
Ajoutez ces montages de volumes :

1. **Base de données** :
   - Host Path : `/mnt/tank/massflix/data` (adaptez "tank" à votre pool)
   - Mount Path : `/data`
   - Type : **Host Path**

2. **Films** :
   - Host Path : `/mnt/tank/massflix/movies`
   - Mount Path : `/media/movies`
   - Type : **Host Path**
   - Read Only : ✓ (coché)

3. **Séries** :
   - Host Path : `/mnt/tank/massflix/series`
   - Mount Path : `/media/series`
   - Read Only : ✓

4. **Affiches** :
   - Host Path : `/mnt/tank/massflix/posters`
   - Mount Path : `/media/posters`
   - Read Only : ✓

5. **Bannières** :
   - Host Path : `/mnt/tank/massflix/banners`
   - Mount Path : `/media/banners`
   - Read Only : ✓

#### Variables d'environnement
Ajoutez ces variables :
- `NODE_ENV` = `production`
- `JWT_SECRET` = `votre-clé-secrète-très-longue-et-complexe`
- `PORT` = `3001`

### 4.3 Lancement
1. Vérifiez toutes vos configurations
2. Cliquez **Save** ou **Install**
3. Attendez le téléchargement et le démarrage (peut prendre 5-10 minutes)

## 🌐 Étape 5 : Configuration Réseau

### 5.1 Test local
1. Ouvrez votre navigateur
2. Allez à `http://IP-TRUENAS:3001` (ex: `http://192.168.1.100:3001`)
3. Vous devriez voir Massflix !

### 5.2 Accès depuis l'extérieur (Optionnel)

#### Configuration du routeur
1. Accédez à votre routeur (généralement `192.168.1.1` ou `192.168.0.1`)
2. Cherchez **Port Forwarding** ou **Redirection de ports**
3. Créez une règle :
   - **Service Name** : Massflix
   - **External Port** : 8080 (ou le port de votre choix)
   - **Internal IP** : IP de votre TrueNAS
   - **Internal Port** : 3001
   - **Protocol** : TCP

#### Test externe
- Trouvez votre IP publique sur [whatismyip.com](https://whatismyip.com)
- Testez : `http://VOTRE-IP-PUBLIQUE:8080`

## 📺 Étape 6 : Ajout de Médias

### 6.1 Structure recommandée

#### Pour les films :
```
/mnt/tank/massflix/movies/
├── Avatar (2009)/
│   └── Avatar.2009.1080p.mkv
├── Inception (2010)/
│   └── Inception.2010.1080p.mp4
└── ...
```

#### Pour les séries :
```
/mnt/tank/massflix/series/
├── Breaking Bad/
│   ├── Season 01/
│   │   ├── S01E01.mkv
│   │   └── S01E02.mkv
│   └── Season 02/
│       └── ...
└── ...
```

### 6.2 Ajout via TrueNAS
1. Allez dans **Storage** → **massflix** → **movies** (ou series)
2. Utilisez l'interface web pour uploader
3. Ou connectez-vous via SMB/FTP selon votre configuration

### 6.3 Scanner automatique
Le conteneur scanne automatiquement vos médias toutes les heures.

## 🔧 Étape 7 : Configuration de Massflix

### 7.1 Premier accès
1. Allez sur votre Massflix
2. Compte administrateur par défaut :
   - **Email** : `admin@massflix.local`
   - **Mot de passe** : `admin123`

### 7.2 Sécurisation
1. Connectez-vous en tant qu'admin
2. Changez immédiatement le mot de passe
3. Créez vos comptes utilisateurs

## 🛠️ Dépannage Courant

### Massflix ne démarre pas
1. **Vérifiez les logs** :
   - Apps → Massflix → **Logs**
   - Cherchez les erreurs en rouge

2. **Vérifiez les permissions** :
   - Les datasets doivent être accessibles en écriture pour `/data`
   - Les datasets médias en lecture seule sont OK

3. **Vérifiez les ports** :
   - Le port 3001 ne doit pas être utilisé par autre chose
   - Testez avec un autre port si nécessaire

### Médias non détectés
1. **Vérifiez les montages** :
   - Les chemins Host Path doivent correspondre exactement
   - Utilisez `/mnt/pool/dataset` format

2. **Structure des fichiers** :
   - Respectez la structure de dossiers recommandée
   - Noms de fichiers sans caractères spéciaux

3. **Scanner manuel** :
   - Redémarrez le conteneur pour forcer un scan

### Accès réseau impossible
1. **Firewall TrueNAS** :
   - System → General → **Network**
   - Vérifiez que le port n'est pas bloqué

2. **Configuration routeur** :
   - Vérifiez la redirection de ports
   - Testez d'abord en local

## 📱 Utilisation

### Interface utilisateur
- **Films** : Naviguez dans votre collection
- **Séries** : Parcourez par saisons/épisodes
- **Recherche** : Trouvez rapidement vos médias
- **Profils** : Chaque utilisateur a son historique

### Recommandations
- Utilisez des noms de fichiers clairs
- Organisez vos médias par dossiers
- Sauvegardez régulièrement votre configuration

## 🔄 Maintenance

### Mise à jour
1. Apps → Massflix → **Edit**
2. Changez le tag vers la nouvelle version
3. **Update** et redémarrez

### Sauvegarde
1. **Base de données** : `/mnt/tank/massflix/data/`
2. Copiez régulièrement ce dossier
3. Les médias sont déjà sur votre NAS

### Monitoring
- Vérifiez les logs régulièrement
- Surveillez l'usage disque
- Testez l'accès utilisateur

## 🎯 Conseils Avancés

### Performance
- Utilisez des SSD pour la base de données si possible
- Configurez un cache pour les métadonnées
- Limitez le nombre d'utilisateurs simultanés

### Sécurité
- Changez le JWT_SECRET régulièrement
- Utilisez un reverse proxy avec SSL pour l'accès externe
- Limitez l'accès par IP si possible

### Personnalisation
- Ajoutez vos propres affiches dans `/posters/`
- Customisez les bannières dans `/banners/`
- Configurez des comptes utilisateurs avec restrictions

---

## 🆘 Support

En cas de problème :
1. Consultez les logs de TrueNAS et du conteneur
2. Vérifiez la documentation officielle TrueNAS Scale
3. Testez d'abord en local avant l'accès externe

**Bon streaming ! 🍿**
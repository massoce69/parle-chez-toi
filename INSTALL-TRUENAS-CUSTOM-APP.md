# 🎬 Installation Massflix via Custom App TrueNAS Scale

## Installation Ultra-Simple via Interface Web TrueNAS

### Prérequis
- TrueNAS Scale 24.04+
- Applications activées dans TrueNAS
- 2GB RAM minimum
- Accès administrateur web

---

## 🚀 Méthode 1 : Custom App YAML (Recommandée)

### 1. Préparation des Datasets
Via l'interface web TrueNAS :

**Datasets** → **Create Dataset** :
```
/mnt/pool1/massflix/
├── data          # (Lecture/Écriture)
├── movies        # (Lecture seule recommandé)
├── series        # (Lecture seule recommandé) 
├── posters       # (Lecture seule recommandé)
└── banners       # (Lecture seule recommandé)
```

### 2. Construction des Images Docker
```bash
# Sur une machine avec Docker (peut être TrueNAS même)
git clone [URL-REPO] /tmp/massflix
cd /tmp/massflix

# Construction
docker build -t massflix-truenas:latest .
docker build -f Dockerfile.scanner-local -t massflix-scanner-truenas:latest .

# Sauvegarder les images
docker save massflix-truenas:latest | gzip > massflix-app.tar.gz
docker save massflix-scanner-truenas:latest | gzip > massflix-scanner.tar.gz

# Transférer vers TrueNAS
scp *.tar.gz root@[IP-TRUENAS]:/mnt/pool1/massflix/
```

### 3. Charger les Images sur TrueNAS
```bash
# SSH sur TrueNAS
ssh root@[IP-TRUENAS]

# Charger les images
cd /mnt/pool1/massflix/
docker load < massflix-app.tar.gz
docker load < massflix-scanner.tar.gz

# Vérifier
docker images | grep massflix
```

### 4. Déployer via Custom App

**Interface Web TrueNAS** :
1. **Apps** → **Custom App**
2. **Application Name** : `massflix`
3. **Version** : `1.0.0`
4. **Namespace** : `massflix`

**YAML Configuration** : Copier le contenu de `truenas-custom-app.yaml`

### 5. Configuration des Volumes
Dans l'interface Custom App :

**Host Path Volumes** :
- `/mnt/pool1/massflix/movies` → `/media/movies` (Read Only)
- `/mnt/pool1/massflix/series` → `/media/series` (Read Only)
- `/mnt/pool1/massflix/posters` → `/media/posters` (Read Only)
- `/mnt/pool1/massflix/banners` → `/media/banners` (Read Only)

**PVC Volume** :
- `massflix-data-pvc` → `/data` (Read/Write, 10Gi)

### 6. Variables d'Environnement
```yaml
JWT_SECRET: "votre-cle-secrete-ultra-forte"
NODE_ENV: "production"
PORT: "3001"
SCAN_INTERVAL: "3600"
```

---

## 🚀 Méthode 2 : Helm Chart (Avancée)

### 1. Créer le Chart Helm
```bash
# Structure du chart
mkdir -p massflix-helm/templates
cd massflix-helm/

# Chart.yaml
cat > Chart.yaml << EOF
apiVersion: v2
name: massflix
description: Media streaming server for TrueNAS Scale
version: 1.0.0
appVersion: "1.0.0"
EOF

# values.yaml
cat > values.yaml << EOF
image:
  repository: massflix-truenas
  tag: latest
  pullPolicy: Never

service:
  type: NodePort
  port: 3001
  nodePort: 30001

persistence:
  data:
    enabled: true
    size: 10Gi
    storageClass: "local-path"

volumes:
  movies: /mnt/pool1/massflix/movies
  series: /mnt/pool1/massflix/series
  posters: /mnt/pool1/massflix/posters
  banners: /mnt/pool1/massflix/banners

resources:
  limits:
    cpu: 500m
    memory: 1Gi
  requests:
    cpu: 100m
    memory: 256Mi

security:
  runAsUser: 1000
  runAsGroup: 1000
  readOnlyRootFilesystem: true
EOF
```

### 2. Déployer via Helm
```bash
# Installation
helm install massflix ./massflix-helm/ -n massflix --create-namespace

# Mise à jour
helm upgrade massflix ./massflix-helm/ -n massflix
```

---

## 🔧 Configuration Post-Installation

### Accès Application
- **URL** : `http://[IP-TRUENAS]:30001`
- **Admin** : `admin@massflix.local` / `admin123`

### Vérification Statut
```bash
# Via kubectl (sur TrueNAS)
kubectl get pods -n massflix
kubectl get services -n massflix
kubectl logs -n massflix deployment/massflix-app
```

### Monitoring via TrueNAS
1. **Apps** → **Installed Applications**
2. Cliquer sur **massflix**
3. Voir **Logs**, **Shell**, **Metrics**

---

## 🛡️ Sécurité et Optimisation

### Secrets Management
```bash
# Changer le JWT secret
kubectl create secret generic massflix-secrets \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  -n massflix --dry-run=client -o yaml | kubectl apply -f -
```

### Network Policies
Le YAML inclut des NetworkPolicies pour :
- Isolation du namespace
- Communication inter-pods seulement
- Accès externe contrôlé

### Resource Limits
Configuration optimale pour TrueNAS :
- **App principale** : 1GB RAM, 0.5 CPU
- **Scanner** : 256MB RAM, 0.2 CPU
- **Storage** : 10GB PVC + hostPath volumes

---

## 📊 Monitoring et Logs

### Logs en Temps Réel
```bash
# Application principale
kubectl logs -f deployment/massflix-app -n massflix

# Scanner médias
kubectl logs -f deployment/massflix-scanner -n massflix

# Tous les pods
kubectl logs -f -l app=massflix -n massflix
```

### Métriques Performance
```bash
# Utilisation ressources
kubectl top pods -n massflix
kubectl describe pod -n massflix

# Événements système
kubectl get events -n massflix --sort-by='.lastTimestamp'
```

---

## 🔄 Maintenance et Mise à Jour

### Mise à Jour Images
```bash
# Reconstruire et recharger images
docker build -t massflix-truenas:latest .
docker save massflix-truenas:latest | gzip > massflix-app-new.tar.gz

# Sur TrueNAS
docker load < massflix-app-new.tar.gz
kubectl rollout restart deployment/massflix-app -n massflix
```

### Backup Base de Données
```bash
# Backup
kubectl exec deployment/massflix-app -n massflix -- \
  sqlite3 /data/massflix.db ".backup /data/backup-$(date +%Y%m%d).db"

# Copier en local
kubectl cp massflix/massflix-app-xxx:/data/backup-$(date +%Y%m%d).db ./backup.db
```

### Scale Horizontal (si nécessaire)
```bash
# Augmenter replicas
kubectl scale deployment/massflix-app --replicas=2 -n massflix

# Auto-scaling
kubectl autoscale deployment massflix-app --min=1 --max=3 --cpu-percent=70 -n massflix
```

---

## 🚨 Résolution Problèmes

### Problèmes Courants

**1. Pod ne démarre pas**
```bash
kubectl describe pod -n massflix
kubectl logs -n massflix [pod-name]
```

**2. Volumes non montés**
```bash
kubectl get pv,pvc -n massflix
# Vérifier permissions datasets TrueNAS
```

**3. Images non trouvées**
```bash
docker images | grep massflix
# Recharger images si nécessaire
```

**4. Port non accessible**
```bash
kubectl get svc -n massflix
# Vérifier NodePort 30001 disponible
```

---

## ✅ Installation Réussie !

Votre Massflix est maintenant déployé comme Custom App sur TrueNAS Scale avec :

- ✅ **Interface Native TrueNAS** (monitoring, logs, shell)
- ✅ **Haute Disponibilité** (restart automatique, health checks)
- ✅ **Sécurité Kubernetes** (RBAC, NetworkPolicies, non-root)
- ✅ **Volumes Persistants** (données sauvegardées)
- ✅ **Scalabilité** (horizontal et vertical)
- ✅ **Monitoring Intégré** (métriques, alertes)

**Accès** : `http://[IP-TRUENAS]:30001`
**Gestion** : Interface Apps TrueNAS Scale

🎬 **Bon streaming !**
# 🚀 Déployment Massflix TrueNAS Scale - Guide Express

## Installation en 3 Étapes

### 1️⃣ Préparation TrueNAS (2 minutes)

**Créer les datasets** :
```bash
# Via SSH sur TrueNAS
mkdir -p /mnt/pool1/massflix/{data,movies,series,posters,banners}
chmod 755 /mnt/pool1/massflix/
```

### 2️⃣ Custom App Installation (3 minutes)

**Interface Web TrueNAS** → **Apps** → **Custom App** :

- **App Name** : `massflix`
- **Version** : `1.0.0`  
- **Namespace** : `massflix`

**Image Configuration** :
```yaml
image:
  repository: ghcr.io/massflix/massflix
  tag: latest
  pullPolicy: Always
```

**Port Configuration** :
```yaml
service:
  type: NodePort
  port: 3001
  nodePort: 30001
```

**Volume Mounts** :
```yaml
volumes:
  - name: data
    type: pvc
    size: 10Gi
    mountPath: /data
  - name: movies  
    type: hostPath
    hostPath: /mnt/pool1/massflix/movies
    mountPath: /media/movies
    readOnly: true
  - name: series
    type: hostPath
    hostPath: /mnt/pool1/massflix/series  
    mountPath: /media/series
    readOnly: true
  - name: posters
    type: hostPath
    hostPath: /mnt/pool1/massflix/posters
    mountPath: /media/posters
    readOnly: true
  - name: banners
    type: hostPath
    hostPath: /mnt/pool1/massflix/banners
    mountPath: /media/banners
    readOnly: true
```

**Environment Variables** :
```yaml
env:
  JWT_SECRET: "votre-cle-secrete-ultra-forte-changez-ca"
  NODE_ENV: "production"
  SCAN_INTERVAL: "3600"
```

### 3️⃣ Démarrage et Accès (1 minute)

- **Deploy** → Attendre 30-60 secondes
- **Accès** : `http://[IP-TRUENAS]:30001`
- **Admin** : `admin@massflix.local` / `admin123`

---

## ⚡ Configuration YAML Complete

Pour copier-coller direct dans TrueNAS Custom App :

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: massflix-config
data:
  NODE_ENV: "production"
  PORT: "3001"
  MEDIA_PATH: "/media"
  DB_PATH: "/data/massflix.db"
  SCAN_INTERVAL: "3600"

---
apiVersion: v1  
kind: Secret
metadata:
  name: massflix-secrets
type: Opaque
stringData:
  jwt-secret: "massflix-truenas-super-secret-key"

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: massflix-data
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 10Gi

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: massflix
spec:
  replicas: 1
  selector:
    matchLabels:
      app: massflix
  template:
    metadata:
      labels:
        app: massflix
    spec:
      securityContext:
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
      containers:
      - name: massflix
        image: ghcr.io/massflix/massflix:latest
        ports:
        - containerPort: 3001
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: massflix-secrets
              key: jwt-secret
        envFrom:
        - configMapRef:
            name: massflix-config
        volumeMounts:
        - name: data
          mountPath: /data
        - name: movies
          mountPath: /media/movies
          readOnly: true
        - name: series
          mountPath: /media/series
          readOnly: true
        - name: posters
          mountPath: /media/posters
          readOnly: true
        - name: banners
          mountPath: /media/banners
          readOnly: true
        resources:
          limits:
            memory: "1Gi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /api/content
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/content
            port: 3001
          initialDelaySeconds: 15
          periodSeconds: 10
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: massflix-data
      - name: movies
        hostPath:
          path: /mnt/pool1/massflix/movies
      - name: series
        hostPath:
          path: /mnt/pool1/massflix/series
      - name: posters
        hostPath:
          path: /mnt/pool1/massflix/posters
      - name: banners
        hostPath:
          path: /mnt/pool1/massflix/banners

---
apiVersion: v1
kind: Service
metadata:
  name: massflix-service
spec:
  type: NodePort
  ports:
  - port: 3001
    targetPort: 3001
    nodePort: 30001
  selector:
    app: massflix
```

---

## 🎯 C'est Tout !

Votre Massflix est maintenant opérationnel avec :
- ✅ **Interface Native TrueNAS** 
- ✅ **Sécurité renforcée** (non-root, read-only)
- ✅ **Auto-restart** et **health checks**
- ✅ **Volumes persistants** 
- ✅ **Scanner automatique** des médias

**Accès Direct** : `http://[IP-TRUENAS]:30001`

🎬 **Bon streaming !**
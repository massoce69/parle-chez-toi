const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
// Generate secure JWT secret if not provided
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Generate secure admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/media', express.static('/media'));

// Servir le frontend React statique
app.use(express.static(path.join(__dirname, 'public')));

// Base de données SQLite
const dbPath = '/data/massflix.db';
const db = new sqlite3.Database(dbPath);

// Initialisation de la base de données
db.serialize(() => {
  // Table des utilisateurs
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    subscription_plan TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table du contenu
  db.run(`CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    poster_url TEXT,
    banner_url TEXT,
    video_url TEXT,
    trailer_url TEXT,
    duration_minutes INTEGER,
    release_year INTEGER,
    genres TEXT,
    cast_members TEXT,
    director TEXT,
    imdb_rating REAL,
    average_rating REAL DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT 0,
    is_new BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table des favoris
  db.run(`CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (content_id) REFERENCES content (id)
  )`);

  // Table de l'historique
  db.run(`CREATE TABLE IF NOT EXISTS watch_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    progress_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (content_id) REFERENCES content (id)
  )`);

  // Table des avis
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (content_id) REFERENCES content (id)
  )`);

  // Créer un utilisateur admin par défaut avec mot de passe sécurisé
  const adminEmail = 'admin@massflix.local';
  const hashedAdminPassword = bcrypt.hashSync(ADMIN_PASSWORD, 12);
  
  db.get("SELECT id FROM users WHERE email = ?", [adminEmail], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO users (email, password, username, full_name, role) 
              VALUES (?, ?, ?, ?, ?)`, 
              [adminEmail, hashedAdminPassword, 'admin', 'Administrateur', 'admin'], function(err) {
        if (err) {
          console.error('Erreur création utilisateur admin:', err.message);
        } else {
          console.log('✅ Utilisateur admin créé');
          console.log('📧 Email: admin@massflix.local');
          console.log('🔐 Mot de passe:', ADMIN_PASSWORD);
          console.log('⚠️  CHANGEZ CE MOT DE PASSE lors de la première connexion!');
        }
      });
    }
  });
});

// Input validation middleware
function validateInput(req, res, next) {
  // Sanitize all string inputs
  for (const [key, value] of Object.entries(req.body)) {
    if (typeof value === 'string') {
      req.body[key] = validator.escape(value.trim());
    }
  }
  next();
}

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes d'authentification
app.post('/api/auth/register', validateInput, async (req, res) => {
  const { email, password, username, fullName } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    db.run(
      `INSERT INTO users (email, password, username, full_name) VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, username, fullName],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
          }
          console.error('User creation error:', err);
          return res.status(500).json({ error: 'Erreur lors de la création du compte' });
        }
        
        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: this.lastID, email, username, fullName } });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/login', validateInput, async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Format d\'email invalide' });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });
});

// Routes du contenu
app.get('/api/content', (req, res) => {
  const { type, genre, search, limit = 50 } = req.query;
  let query = "SELECT * FROM content WHERE status = 'published'";
  const params = [];

  // Validate and sanitize inputs
  if (type && validator.isAlphanumeric(type, 'en-US', { ignore: '_' })) {
    query += " AND content_type = ?";
    params.push(type);
  }

  if (genre && typeof genre === 'string' && genre.length <= 50) {
    query += " AND genres LIKE ?";
    params.push(`%${validator.escape(genre)}%`);
  }

  if (search && typeof search === 'string' && search.length <= 100) {
    const sanitizedSearch = validator.escape(search);
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${sanitizedSearch}%`, `%${sanitizedSearch}%`);
  }

  // Validate limit
  const validLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(validLimit);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Content query error:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    // Transformer les données pour correspondre au format attendu
    const content = rows.map(row => ({
      ...row,
      genres: row.genres ? row.genres.split(',') : [],
      cast_members: row.cast_members ? row.cast_members.split(',') : []
    }));
    
    res.json(content);
  });
});

app.get('/api/content/trending', (req, res) => {
  db.all(
    "SELECT * FROM content WHERE status = 'published' ORDER BY view_count DESC LIMIT 20",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const content = rows.map(row => ({
        ...row,
        genres: row.genres ? row.genres.split(',') : [],
        cast_members: row.cast_members ? row.cast_members.split(',') : []
      }));
      
      res.json(content);
    }
  );
});

app.get('/api/content/new', (req, res) => {
  db.all(
    "SELECT * FROM content WHERE status = 'published' AND is_new = 1 ORDER BY created_at DESC LIMIT 20",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const content = rows.map(row => ({
        ...row,
        genres: row.genres ? row.genres.split(',') : [],
        cast_members: row.cast_members ? row.cast_members.split(',') : []
      }));
      
      res.json(content);
    }
  );
});

app.get('/api/content/featured', (req, res) => {
  db.all(
    "SELECT * FROM content WHERE status = 'published' AND is_featured = 1 ORDER BY created_at DESC LIMIT 10",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const content = rows.map(row => ({
        ...row,
        genres: row.genres ? row.genres.split(',') : [],
        cast_members: row.cast_members ? row.cast_members.split(',') : []
      }));
      
      res.json(content);
    }
  );
});

app.get('/api/content/:id', (req, res) => {
  const { id } = req.params;
  
  db.get("SELECT * FROM content WHERE id = ? AND status = 'published'", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Contenu non trouvé' });
    }
    
    const content = {
      ...row,
      genres: row.genres ? row.genres.split(',') : [],
      cast_members: row.cast_members ? row.cast_members.split(',') : []
    };
    
    res.json(content);
  });
});

// Routes des favoris
app.get('/api/favorites', authenticateToken, (req, res) => {
  db.all(
    `SELECT uf.*, c.* FROM user_favorites uf 
     JOIN content c ON uf.content_id = c.id 
     WHERE uf.user_id = ? AND c.status = 'published'
     ORDER BY uf.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.post('/api/favorites', authenticateToken, (req, res) => {
  const { content_id } = req.body;
  
  db.run(
    "INSERT INTO user_favorites (user_id, content_id) VALUES (?, ?)",
    [req.user.id, content_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.delete('/api/favorites/:contentId', authenticateToken, (req, res) => {
  const { contentId } = req.params;
  
  db.run(
    "DELETE FROM user_favorites WHERE user_id = ? AND content_id = ?",
    [req.user.id, contentId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Routes de l'historique de visionnage
app.get('/api/watch-history', authenticateToken, (req, res) => {
  db.all(
    `SELECT wh.*, c.* FROM watch_history wh 
     JOIN content c ON wh.content_id = c.id 
     WHERE wh.user_id = ? AND c.status = 'published'
     ORDER BY wh.watched_at DESC LIMIT 50`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.post('/api/watch-history', authenticateToken, (req, res) => {
  const { content_id, progress_seconds = 0, completed = false } = req.body;
  
  db.run(
    `INSERT OR REPLACE INTO watch_history 
     (user_id, content_id, progress_seconds, completed, watched_at) 
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [req.user.id, content_id, progress_seconds, completed],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Scanner de médias - Route sécurisée pour le scanner interne
app.post('/api/scan-media', (req, res) => {
  // Vérifier l'authentification du scanner via API key
  const apiKey = req.headers['x-scanner-api-key'];
  const expectedApiKey = process.env.SCANNER_API_KEY || crypto.createHash('sha256').update(JWT_SECRET + 'scanner').digest('hex');
  
  if (!apiKey || apiKey !== expectedApiKey) {
    console.warn('Unauthorized scanner access attempt from:', req.ip);
    return res.status(403).json({ error: 'Clé API invalide' });
  }
  // Cette route sera appelée par le script de scan pour ajouter du contenu
  const content = req.body;
  
  db.run(
    `INSERT OR REPLACE INTO content 
     (title, description, content_type, poster_url, banner_url, video_url, 
      duration_minutes, release_year, genres, cast_members, director) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      content.title,
      content.description || '',
      content.content_type,
      content.poster_url || '',
      content.banner_url || '',
      content.video_url || '',
      content.duration_minutes || 0,
      content.release_year || new Date().getFullYear(),
      Array.isArray(content.genres) ? content.genres.join(',') : content.genres || '',
      Array.isArray(content.cast_members) ? content.cast_members.join(',') : content.cast_members || '',
      content.director || ''
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Route pour servir le frontend React (SPA routing)
app.get('*', (req, res) => {
  // Si c'est une route API, renvoyer 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route API non trouvée' });
  }
  
  // Sinon, servir index.html pour le routing côté client
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🎬 Massflix Local démarré sur le port ${PORT}`);
  console.log(`📊 Base de données: ${dbPath}`);
  console.log(`🌍 Application accessible sur http://localhost:${PORT}`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Base de données fermée.');
    process.exit(0);
  });
});
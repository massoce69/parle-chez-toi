const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'massflix-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/media', express.static('/media'));

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

  // Utilisateur admin par défaut
  const adminEmail = 'admin@massflix.local';
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  db.get("SELECT id FROM users WHERE email = ?", [adminEmail], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO users (email, password, username, full_name, role) 
              VALUES (?, ?, ?, ?, ?)`, 
              [adminEmail, adminPassword, 'admin', 'Administrateur', 'admin']);
    }
  });
});

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
app.post('/api/auth/register', async (req, res) => {
  const { email, password, username, fullName } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (email, password, username, full_name) VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, username, fullName],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email déjà utilisé' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
        res.json({ token, user: { id: this.lastID, email, username, fullName } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });
});

// Routes du contenu
app.get('/api/content', (req, res) => {
  const { type, genre, search, limit = 50 } = req.query;
  let query = "SELECT * FROM content WHERE status = 'published'";
  const params = [];

  if (type) {
    query += " AND content_type = ?";
    params.push(type);
  }

  if (genre) {
    query += " AND genres LIKE ?";
    params.push(`%${genre}%`);
  }

  if (search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(parseInt(limit));

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
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

// Scanner de médias
app.post('/api/scan-media', authenticateToken, (req, res) => {
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

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur Massflix démarré sur le port ${PORT}`);
  console.log(`Base de données: ${dbPath}`);
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
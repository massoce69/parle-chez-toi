const fs = require('fs-extra');
const path = require('path');

const API_URL = process.env.MASSFLIX_API_URL || 'http://localhost:3001/api';
const MEDIA_PATH = process.env.MEDIA_PATH || '/media';

// Extensions vidéo supportées
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];

// Extensions d'images supportées
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

async function scanMediaFiles() {
  console.log('Démarrage du scan des médias...');
  
  const mediaTypes = ['movies', 'series'];
  
  for (const mediaType of mediaTypes) {
    const mediaDir = path.join(MEDIA_PATH, mediaType);
    
    if (!await fs.pathExists(mediaDir)) {
      console.log(`Répertoire ${mediaDir} non trouvé, passage au suivant...`);
      continue;
    }
    
    console.log(`Scan du répertoire ${mediaDir}...`);
    await scanDirectory(mediaDir, mediaType);
  }
  
  console.log('Scan terminé.');
}

async function scanDirectory(dir, contentType) {
  try {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        // Traiter le dossier comme un film/série
        await processMediaFolder(itemPath, item, contentType);
      } else if (VIDEO_EXTENSIONS.includes(path.extname(item).toLowerCase())) {
        // Traiter le fichier vidéo directement
        await processMediaFile(itemPath, path.parse(item).name, contentType);
      }
    }
  } catch (error) {
    console.error(`Erreur lors du scan de ${dir}:`, error.message);
  }
}

async function processMediaFolder(folderPath, folderName, contentType) {
  try {
    const files = await fs.readdir(folderPath);
    
    // Chercher le fichier vidéo principal
    let mainVideo = null;
    let poster = null;
    let banner = null;
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const fileName = path.parse(file).name.toLowerCase();
      
      if (VIDEO_EXTENSIONS.includes(ext)) {
        // Prendre le premier fichier vidéo comme principal
        if (!mainVideo) {
          mainVideo = path.join(folderPath, file);
        }
      } else if (IMAGE_EXTENSIONS.includes(ext)) {
        if (fileName.includes('poster') || fileName.includes('cover')) {
          poster = `/media/${path.relative(MEDIA_PATH, path.join(folderPath, file))}`;
        } else if (fileName.includes('banner') || fileName.includes('backdrop')) {
          banner = `/media/${path.relative(MEDIA_PATH, path.join(folderPath, file))}`;
        }
      }
    }
    
    if (mainVideo) {
      const videoPath = `/media/${path.relative(MEDIA_PATH, mainVideo)}`;
      await addContentToDatabase(folderName, videoPath, contentType, poster, banner);
    }
  } catch (error) {
    console.error(`Erreur lors du traitement de ${folderPath}:`, error.message);
  }
}

async function processMediaFile(filePath, fileName, contentType) {
  try {
    const videoPath = `/media/${path.relative(MEDIA_PATH, filePath)}`;
    
    // Chercher des images associées dans le même répertoire
    const dir = path.dirname(filePath);
    const baseName = path.parse(fileName).name;
    
    let poster = null;
    let banner = null;
    
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const name = path.parse(file).name.toLowerCase();
        
        if (IMAGE_EXTENSIONS.includes(ext)) {
          if (name.includes(baseName.toLowerCase()) || name.includes('poster')) {
            poster = `/media/${path.relative(MEDIA_PATH, path.join(dir, file))}`;
          } else if (name.includes('banner') || name.includes('backdrop')) {
            banner = `/media/${path.relative(MEDIA_PATH, path.join(dir, file))}`;
          }
        }
      }
    } catch (err) {
      // Ignorer les erreurs de lecture du répertoire
    }
    
    await addContentToDatabase(fileName, videoPath, contentType, poster, banner);
  } catch (error) {
    console.error(`Erreur lors du traitement de ${filePath}:`, error.message);
  }
}

async function addContentToDatabase(title, videoUrl, contentType, posterUrl = null, bannerUrl = null) {
  try {
    // Nettoyer le titre (supprimer l'année entre parenthèses, etc.)
    const cleanTitle = title
      .replace(/\(.*?\)/g, '') // Supprimer tout ce qui est entre parenthèses
      .replace(/\[.*?\]/g, '') // Supprimer tout ce qui est entre crochets
      .replace(/\d{4}/, '') // Supprimer les années
      .replace(/[._-]/g, ' ') // Remplacer les caractères spéciaux par des espaces
      .trim();
    
    // Extraire l'année si possible
    const yearMatch = title.match(/\((\d{4})\)/) || title.match(/(\d{4})/);
    const releaseYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    
    const content = {
      title: cleanTitle,
      description: `${contentType === 'movie' ? 'Film' : 'Série'} ajouté automatiquement`,
      content_type: contentType,
      video_url: videoUrl,
      poster_url: posterUrl,
      banner_url: bannerUrl,
      release_year: releaseYear,
      genres: [], // TODO: Détecter automatiquement les genres
      cast_members: [],
      director: '',
      duration_minutes: contentType === 'movie' ? 120 : 45,
    };
    
    console.log(`Ajout du contenu: ${cleanTitle}`);
    
    // Envoyer à l'API locale
    const response = await fetch(`${API_URL}/scan-media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Erreur lors de l'ajout de ${title}:`, error);
    } else {
      console.log(`✓ ${cleanTitle} ajouté avec succès`);
    }
  } catch (error) {
    console.error(`Erreur lors de l'ajout de ${title}:`, error.message);
  }
}

// Démarrer le scan
scanMediaFiles().catch(console.error);
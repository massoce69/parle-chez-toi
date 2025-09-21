#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MEDIA_PATH = process.env.MEDIA_PATH || '/media';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Extensions vidéo supportées
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Fonction pour extraire les métadonnées avec ffprobe
function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]);

    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const metadata = JSON.parse(output);
          resolve(metadata);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`ffprobe exited with code ${code}`));
      }
    });
  });
}

// Fonction pour parser le nom du fichier et extraire les informations
function parseFileName(fileName, isMovie = true) {
  const nameWithoutExt = path.parse(fileName).name;
  
  if (isMovie) {
    // Format: Movie.Name.2023.1080p.BluRay.x264
    const movieMatch = nameWithoutExt.match(/^(.+?)\.(\d{4})/);
    if (movieMatch) {
      return {
        title: movieMatch[1].replace(/\./g, ' '),
        year: parseInt(movieMatch[2])
      };
    }
  } else {
    // Format: Series.Name.S01E01.Episode.Name
    const seriesMatch = nameWithoutExt.match(/^(.+?)\.S(\d+)E(\d+)/i);
    if (seriesMatch) {
      return {
        title: seriesMatch[1].replace(/\./g, ' '),
        season: parseInt(seriesMatch[2]),
        episode: parseInt(seriesMatch[3])
      };
    }
  }
  
  return { title: nameWithoutExt.replace(/\./g, ' ') };
}

// Fonction pour scanner un répertoire
async function scanDirectory(dirPath, contentType) {
  console.log(`Scan du répertoire: ${dirPath} (${contentType})`);
  
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        // Récursion pour les sous-dossiers
        await scanDirectory(fullPath, contentType);
      } else if (file.isFile()) {
        const ext = path.extname(file.name).toLowerCase();
        
        if (VIDEO_EXTENSIONS.includes(ext)) {
          await processVideoFile(fullPath, contentType);
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors du scan de ${dirPath}:`, error.message);
  }
}

// Fonction pour traiter un fichier vidéo
async function processVideoFile(filePath, contentType) {
  try {
    const fileName = path.basename(filePath);
    const relativePath = path.relative(MEDIA_PATH, filePath);
    
    // Vérifier si le contenu existe déjà
    const { data: existing } = await supabase
      .from('content')
      .select('id')
      .eq('file_path', relativePath)
      .single();
    
    if (existing) {
      console.log(`Fichier déjà en base: ${fileName}`);
      return;
    }
    
    console.log(`Traitement: ${fileName}`);
    
    // Parser le nom du fichier
    const parsed = parseFileName(fileName, contentType === 'movie');
    
    // Extraire les métadonnées vidéo
    let metadata = {};
    try {
      const videoMeta = await getVideoMetadata(filePath);
      const videoStream = videoMeta.streams.find(s => s.codec_type === 'video');
      
      if (videoStream) {
        metadata = {
          duration_minutes: Math.round(parseFloat(videoMeta.format.duration) / 60),
          resolution: `${videoStream.width}x${videoStream.height}`,
          codec: videoStream.codec_name
        };
      }
    } catch (error) {
      console.warn(`Impossible d'extraire les métadonnées pour ${fileName}:`, error.message);
    }
    
    // Chercher les images associées (poster, banner)
    const baseNameWithoutExt = path.parse(fileName).name;
    const dirPath = path.dirname(filePath);
    
    let posterUrl = null;
    let bannerUrl = null;
    
    // Chercher dans le répertoire posters
    const posterPath = path.join(MEDIA_PATH, 'posters', `${baseNameWithoutExt}.jpg`);
    if (fs.existsSync(posterPath)) {
      posterUrl = `/media/posters/${baseNameWithoutExt}.jpg`;
    }
    
    // Chercher dans le répertoire banners
    const bannerPath = path.join(MEDIA_PATH, 'banners', `${baseNameWithoutExt}.jpg`);
    if (fs.existsSync(bannerPath)) {
      bannerUrl = `/media/banners/${baseNameWithoutExt}.jpg`;
    }
    
    // Insérer en base de données
    const contentData = {
      title: parsed.title,
      content_type: contentType,
      file_path: relativePath,
      video_url: `/media/${contentType === 'movie' ? 'movies' : 'series'}/${relativePath}`,
      poster_url: posterUrl,
      banner_url: bannerUrl,
      release_year: parsed.year || null,
      season_number: parsed.season || null,
      episode_number: parsed.episode || null,
      duration_minutes: metadata.duration_minutes || null,
      metadata: {
        resolution: metadata.resolution,
        codec: metadata.codec,
        file_size: fs.statSync(filePath).size
      }
    };
    
    const { error } = await supabase
      .from('content')
      .insert([contentData]);
    
    if (error) {
      console.error(`Erreur lors de l'insertion de ${fileName}:`, error.message);
    } else {
      console.log(`✓ Ajouté: ${parsed.title}`);
    }
    
  } catch (error) {
    console.error(`Erreur lors du traitement de ${filePath}:`, error.message);
  }
}

// Fonction principale
async function main() {
  console.log('Démarrage du scanner de médias...');
  console.log(`Répertoire de médias: ${MEDIA_PATH}`);
  
  // Scanner les films
  const moviesPath = path.join(MEDIA_PATH, 'movies');
  if (fs.existsSync(moviesPath)) {
    await scanDirectory(moviesPath, 'movie');
  }
  
  // Scanner les séries
  const seriesPath = path.join(MEDIA_PATH, 'series');
  if (fs.existsSync(seriesPath)) {
    await scanDirectory(seriesPath, 'series');
  }
  
  console.log('Scan terminé.');
}

// Exécuter le scan
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, scanDirectory, processVideoFile };
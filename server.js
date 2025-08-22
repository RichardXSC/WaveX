import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Add CORS support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Add body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use absolute paths that work on Render
const PUBLIC_DIR = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'public') 
  : path.resolve('.');
const SONGS_DIR = path.join(PUBLIC_DIR, 'songs');

// Ensure directories exist with better error handling
try {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    console.log('Created public directory:', PUBLIC_DIR);
  }
  if (!fs.existsSync(SONGS_DIR)) {
    fs.mkdirSync(SONGS_DIR, { recursive: true });
    console.log('Created songs directory:', SONGS_DIR);
  }
} catch (error) {
  console.error('Failed to create directories:', error);
  // Fallback to current working directory
  const fallbackDir = process.cwd();
  console.log('Using fallback directory:', fallbackDir);
  const PUBLIC_DIR = fallbackDir;
  const SONGS_DIR = path.join(fallbackDir, 'songs');
}

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

// Serve uploaded songs and artwork files
app.use('/songs', express.static(SONGS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SONGS_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});
const upload = multer({ storage });

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'WaveX server is running!', timestamp: new Date().toISOString() });
});

// Debug endpoint to check file system status
app.get('/api/debug', (req, res) => {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
      publicDir: PUBLIC_DIR,
      songsDir: SONGS_DIR,
      dataDir: DATA_DIR,
      chartsFile: CHARTS_FILE,
      directories: {},
      files: {}
    };
    
    // Check directory existence
    [PUBLIC_DIR, SONGS_DIR, DATA_DIR].forEach(dir => {
      try {
        debugInfo.directories[dir] = {
          exists: fs.existsSync(dir),
          readable: fs.accessSync(dir, fs.constants.R_OK) ? 'Yes' : 'No',
          writable: fs.accessSync(dir, fs.constants.W_OK) ? 'Yes' : 'No'
        };
      } catch (e) {
        debugInfo.directories[dir] = { error: e.message };
      }
    });
    
    // Check file existence
    [CHARTS_FILE, path.join(DATA_DIR, 'charts.json')].forEach(file => {
      try {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          debugInfo.files[file] = {
            exists: true,
            size: stats.size,
            modified: stats.mtime
          };
        } else {
          debugInfo.files[file] = { exists: false };
        }
      } catch (e) {
        debugInfo.files[file] = { error: e.message };
      }
    });
    
    res.json(debugInfo);
  } catch (e) {
    res.status(500).json({ error: 'Debug failed: ' + e.message });
  }
});

// Upload endpoint: returns a public URL for the MP3 file
app.post('/api/upload', upload.single('mp3'), (req, res) => {
  console.log('MP3 upload request received:', req.method, req.url);
  console.log('File:', req.file);
  
  if (!req.file) return res.status(400).json({ error: 'No file' });
  
  // Ensure the file is properly saved
  const filePath = path.join(SONGS_DIR, req.file.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: 'File upload failed' });
  }
  
  const url = `/songs/${req.file.filename}`;
  console.log('Upload successful, URL:', url, 'File size:', req.file.size);
  res.json({ url, filename: req.file.filename, size: req.file.size });
});

// Upload artwork endpoint
app.post('/api/upload-artwork', upload.single('artwork'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  
  // Ensure the file is properly saved
  const filePath = path.join(SONGS_DIR, req.file.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: 'File upload failed' });
  }
  
  const url = `/songs/${req.file.filename}`;
  console.log('Artwork upload successful, URL:', url, 'File size:', req.file.size);
  res.json({ url, filename: req.file.filename, size: req.file.size });
});

// Helper function for creating safe filenames
const slug = (str) => {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Chart storage endpoints - use a more reliable path
const CHARTS_FILE = path.join(process.cwd(), 'charts.json');

// Ensure charts file exists with better error handling
try {
  if (!fs.existsSync(CHARTS_FILE)) {
    fs.writeFileSync(CHARTS_FILE, JSON.stringify([]));
    console.log('Created charts file:', CHARTS_FILE);
  } else {
    console.log('Using existing charts file:', CHARTS_FILE);
  }
} catch (error) {
  console.error('Failed to create charts file:', error);
  // Try alternative location
  const altChartsFile = path.join(process.cwd(), 'data', 'charts.json');
  try {
    if (!fs.existsSync(path.dirname(altChartsFile))) {
      fs.mkdirSync(path.dirname(altChartsFile), { recursive: true });
    }
    fs.writeFileSync(altChartsFile, JSON.stringify([]));
    console.log('Created charts file in alternative location:', altChartsFile);
    const CHARTS_FILE = altChartsFile;
  } catch (altError) {
    console.error('Failed to create alternative charts file:', altError);
  }
}

// Ensure songs directory exists
if (!fs.existsSync(SONGS_DIR)) {
  fs.mkdirSync(SONGS_DIR, { recursive: true });
}

// Create data directory for persistent storage
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('Created data directory:', DATA_DIR);
}

// Get all charts
app.get('/api/charts', (req, res) => {
  try {
    // Try multiple locations for charts
    const chartLocations = [
      CHARTS_FILE,
      path.join(DATA_DIR, 'charts.json'),
      path.join(process.cwd(), 'charts.json')
    ];
    
    let charts = [];
    let loadedFrom = '';
    
    for (const chartPath of chartLocations) {
      try {
        if (fs.existsSync(chartPath)) {
          const data = fs.readFileSync(chartPath, 'utf8');
          charts = JSON.parse(data);
          loadedFrom = chartPath;
          console.log('Loaded charts from:', chartPath, 'Count:', charts.length);
          break;
        }
      } catch (readError) {
        console.warn('Failed to read from:', chartPath, readError.message);
      }
    }
    
    if (charts.length === 0) {
      console.log('No charts found, returning empty array');
    }
    
    res.json(charts);
  } catch (e) {
    console.error('Error reading charts:', e);
    res.json([]);
  }
});

// Publish a new chart
app.post('/api/charts', express.json(), (req, res) => {
  try {
    const chart = req.body;
    console.log('Received chart data:', { title: chart.title, artist: chart.artist, notesCount: chart.notes?.length });
    
    if (!chart.title || !chart.artist || !chart.notes || !chart.notes.length) {
      return res.status(400).json({ error: 'Invalid chart data' });
    }
    
    // Try to read existing charts
    let charts = [];
    try {
      if (fs.existsSync(CHARTS_FILE)) {
        const data = fs.readFileSync(CHARTS_FILE, 'utf8');
        charts = JSON.parse(data);
        console.log('Loaded existing charts:', charts.length);
      }
    } catch (readError) {
      console.warn('Failed to read existing charts, starting fresh:', readError);
      charts = [];
    }
    
    chart.id = chart.id || `${slug(chart.title)}-${slug(chart.artist)}-${Date.now()}`;
    chart.createdAt = Date.now();
    chart.ratings = chart.ratings || [];
    
    // Check if chart already exists
    const existingIndex = charts.findIndex(c => c.id === chart.id);
    if (existingIndex >= 0) {
      charts[existingIndex] = chart;
      console.log('Updated existing chart:', chart.title);
    } else {
      charts.push(chart);
      console.log('Added new chart:', chart.title);
    }
    
    // Save to disk with multiple fallback locations
    let saved = false;
    const saveLocations = [
      CHARTS_FILE,
      path.join(DATA_DIR, 'charts.json'),
      path.join(process.cwd(), 'charts.json')
    ];
    
    for (const savePath of saveLocations) {
      try {
        // Ensure directory exists
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(savePath, JSON.stringify(charts, null, 2));
        console.log('Successfully saved charts to:', savePath);
        saved = true;
        break;
      } catch (writeError) {
        console.warn('Failed to save to:', savePath, writeError.message);
      }
    }
    
    if (saved) {
      // Create backup in data directory
      try {
        const backupFile = path.join(DATA_DIR, `charts_backup_${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(charts, null, 2));
        console.log('Backup created:', backupFile);
      } catch (backupError) {
        console.warn('Failed to create backup:', backupError.message);
      }
      
      res.json({ success: true, chart, savedTo: 'server' });
    } else {
      console.error('Failed to save chart to any location');
      res.status(500).json({ error: 'Failed to save chart to disk' });
    }
  } catch (e) {
    console.error('Error publishing chart:', e);
    res.status(500).json({ error: 'Failed to publish chart: ' + e.message });
  }
});

// Rate a chart
app.post('/api/charts/:id/rate', express.json(), (req, res) => {
  try {
    const { id } = req.params;
    const { rating, username } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }
    
    const charts = JSON.parse(fs.readFileSync(CHARTS_FILE, 'utf8'));
    const chartIndex = charts.findIndex(c => c.id === id);
    
    if (chartIndex === -1) {
      return res.status(404).json({ error: 'Chart not found' });
    }
    
    if (!charts[chartIndex].ratings) {
      charts[chartIndex].ratings = [];
    }
    
    charts[chartIndex].ratings.push({ rating, username, timestamp: Date.now() });
    fs.writeFileSync(CHARTS_FILE, JSON.stringify(charts, null, 2));
    
    res.json({ success: true });
  } catch (e) {
    console.error('Error rating chart:', e);
    res.status(500).json({ error: 'Failed to rate chart' });
  }
});

// Admin authentication
let ADMIN_PASSWORD_HASH = '$2b$10$YourHashedPasswordHere'; // We'll set this properly
const adminSessions = new Map();

// Hash the admin password from environment variable
const hashAdminPassword = async () => {
  const saltRounds = 12;
  const adminPassword = process.env.ADMIN_PASSWORD || '19921124'; // Default for development only
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('Admin password hash generated for production');
  } else {
    console.log('Admin password hash generated (development mode)');
  }
  
  return hashedPassword;
};

// Initialize admin password hash
let ADMIN_PASSWORD_HASH_INITIALIZED = false;
hashAdminPassword().then(hash => {
  ADMIN_PASSWORD_HASH = hash;
  ADMIN_PASSWORD_HASH_INITIALIZED = true;
});

// Admin login endpoint
app.post('/api/admin/login', express.json(), async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!ADMIN_PASSWORD_HASH_INITIALIZED) {
      return res.status(503).json({ error: 'Admin system initializing' });
    }
    
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Generate secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      authenticated: true,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    adminSessions.set(sessionToken, sessionData);
    
    res.json({ 
      success: true, 
      sessionToken,
      message: 'Admin access granted'
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin session validation middleware
const validateAdminSession = (req, res, next) => {
  const sessionToken = req.headers['x-admin-session'];
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'No session token' });
  }
  
  const session = adminSessions.get(sessionToken);
  
  if (!session || !session.authenticated) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(sessionToken);
    return res.status(401).json({ error: 'Session expired' });
  }
  
  next();
};

// Get all songs for admin panel
app.get('/api/admin/songs', validateAdminSession, (req, res) => {
  try {
    const songsDir = path.join(PUBLIC_DIR, 'songs');
    if (!fs.existsSync(songsDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(songsDir);
    const songs = files
      .filter(file => file.endsWith('.mp3') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
      .map(file => {
        const stats = fs.statSync(path.join(songsDir, file));
        return {
          filename: file,
          size: stats.size,
          uploadDate: stats.mtime,
          type: path.extname(file).substring(1)
        };
      })
      .sort((a, b) => b.uploadDate - a.uploadDate);
    
    res.json(songs);
  } catch (error) {
    console.error('Error getting songs:', error);
    res.status(500).json({ error: 'Failed to get songs' });
  }
});

// Delete song file
app.delete('/api/admin/songs/:filename', validateAdminSession, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(PUBLIC_DIR, 'songs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    fs.unlinkSync(filePath);
    console.log('Admin deleted file:', filename);
    
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});



app.listen(PORT, () => {
  console.log(`🎵 WaveX server running on port ${PORT}`);
  console.log(`📁 Public directory: ${PUBLIC_DIR}`);
  console.log(`🎶 Songs directory: ${SONGS_DIR}`);
  console.log(`📊 Charts file: ${CHARTS_FILE}`);
  console.log(`🔐 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`📡 API endpoints: http://localhost:${PORT}/api/*`);
  console.log(`🌐 Static files: http://localhost:${PORT}/`);
});

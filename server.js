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

const PUBLIC_DIR = path.resolve('.');
const SONGS_DIR = path.join(PUBLIC_DIR, 'songs');
fs.mkdirSync(SONGS_DIR, { recursive: true });

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

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

// Upload endpoint: returns a public URL for the MP3 file
app.post('/api/upload', upload.single('mp3'), (req, res) => {
  console.log('MP3 upload request received:', req.method, req.url);
  console.log('File:', req.file);
  
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/songs/${req.file.filename}`;
  console.log('Upload successful, URL:', url);
  res.json({ url });
});

// Upload artwork endpoint
app.post('/api/upload-artwork', upload.single('artwork'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/songs/${req.file.filename}`;
  res.json({ url });
});

// Chart storage endpoints
const CHARTS_FILE = path.join(PUBLIC_DIR, 'charts.json');

// Ensure charts file exists
if (!fs.existsSync(CHARTS_FILE)) {
  fs.writeFileSync(CHARTS_FILE, JSON.stringify([]));
}

// Get all charts
app.get('/api/charts', (req, res) => {
  try {
    const charts = JSON.parse(fs.readFileSync(CHARTS_FILE, 'utf8'));
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
    if (!chart.title || !chart.artist || !chart.notes || !chart.notes.length) {
      return res.status(400).json({ error: 'Invalid chart data' });
    }
    
    const charts = JSON.parse(fs.readFileSync(CHARTS_FILE, 'utf8'));
    chart.id = chart.id || `${slug(chart.title)}-${slug(chart.artist)}-${Date.now()}`;
    chart.createdAt = Date.now();
    chart.ratings = chart.ratings || [];
    
    // Check if chart already exists
    const existingIndex = charts.findIndex(c => c.id === chart.id);
    if (existingIndex >= 0) {
      charts[existingIndex] = chart;
    } else {
      charts.push(chart);
    }
    
    fs.writeFileSync(CHARTS_FILE, JSON.stringify(charts, null, 2));
    console.log('Chart published:', chart.title);
    res.json({ success: true, chart });
  } catch (e) {
    console.error('Error publishing chart:', e);
    res.status(500).json({ error: 'Failed to publish chart' });
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

// Helper function for slug generation
function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

app.listen(PORT, () => console.log(`WaveX running on http://localhost:${PORT}`));

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Helper function for slug generation
function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

app.listen(PORT, () => console.log(`WaveX running on http://localhost:${PORT}`));

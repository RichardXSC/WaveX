import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.resolve('WaveX');
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

// Upload endpoint: returns a public URL for the MP3 file
app.post('/api/upload', upload.single('mp3'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/songs/${req.file.filename}`;
  res.json({ url });
});

// Upload artwork endpoint
app.post('/api/upload-artwork', upload.single('artwork'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/songs/${req.file.filename}`;
  res.json({ url });
});

app.listen(PORT, () => console.log(`WaveX running on http://localhost:${PORT}`));

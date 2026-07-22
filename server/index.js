const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./db/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_DIR = path.join(__dirname, '..', 'admin');

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Admin panel - serve static files from /admin path
app.use('/admin', (req, res, next) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  let fullPath = path.join(ADMIN_DIR, filePath);
  
  // Security
  if (!fullPath.startsWith(ADMIN_DIR)) {
    return res.status(403).send('Forbidden');
  }
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).send('Not Found');
  }
  
  const ext = path.extname(fullPath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };
  
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  fs.createReadStream(fullPath).pipe(res);
});

// Redirect root to admin panel
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Initialize DB
initDatabase();

// API routes
app.use('/', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: '运行中', timestamp: new Date().toISOString() });
});

// Start with explicit IPv4 binding
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🚀 Backend running at http://127.0.0.1:${PORT}`);
  console.log(`   API:      http://127.0.0.1:${PORT}/api/...`);
  console.log(`   Admin UI: http://127.0.0.1:${PORT}/admin\n`);
});

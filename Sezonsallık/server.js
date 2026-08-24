// Simple static server for VitrA Dashboard (Railway deploy)
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all project files as static
app.use(express.static(__dirname, {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    // Allow JSX / binary assets
    if (filePath.endsWith('.jsx')) res.setHeader('Content-Type', 'text/babel; charset=utf-8');
    if (filePath.endsWith('.svg')) res.setHeader('Content-Type', 'image/svg+xml');
  }
}));

// Root → dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Vitra Dashboard.html'));
});

// Healthcheck for Railway
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[VitrA Dashboard] serving on port ${PORT}`);
});

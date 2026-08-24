#!/usr/bin/env node
/**
 * build-artifact.js — dashboard'u tek dosyalık, kendine yeten HTML'e paketler.
 * Artifact CSP'si dış kaynak isteğine izin vermediği için React, veri, stil ve
 * logolar dosyanın içine gömülür. Google Fonts tek istisnadır.
 */
const fs = require('fs');
const path = require('path');
const R = path.join(__dirname, '..');
const oku = p => fs.readFileSync(path.join(R, p), 'utf8');
const b64 = p => fs.readFileSync(path.join(R, p)).toString('base64');

const logoSvg  = 'data:image/svg+xml;base64,' + b64('assets/tvplus-logo.svg');
const inbound  = 'data:image/png;base64,'     + b64('assets/inbound-logo.png');
const inboundS = 'data:image/png;base64,'     + b64('assets/inbound-small-logo.png');

// brand.config: logo yolunu data URI'ye çevir
let brand = oku('brand.config.js').replace(/logo:\s*"[^"]*"/, `logo: ${JSON.stringify(logoSvg)}`);
// app.jsx: assets/ referanslarını data URI'ye çevir
let app = oku('app.jsx')
  .replace(/'assets\/inbound-logo\.png'/g, JSON.stringify(inbound))
  .replace(/'assets\/inbound-small-logo\.png'/g, JSON.stringify(inboundS));

const parcalar = [
  '<title>TV+ Spor Talep Haritası</title>',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">',
  '<style>\n' + oku('styles.css') + '\n</style>',
  '<div id="root"></div>',
  '<script>' + oku('.artifact/react.js') + '</script>',
  '<script>' + oku('.artifact/react-dom.js') + '</script>',
  '<script>' + brand + '</script>',
  '<script>' + oku('data/dashboard.js') + '</script>',
  '<script>' + oku('utils.js') + '</script>',
  '<script>' + oku('components.jsx') + '</script>',
  '<script>' + oku('tabs.jsx') + '</script>',
  '<script>' + app + '</script>',
];

// Artifact kökünde data-palette/data-theme stamp'i yok; JS ile uygulanıyor (app.jsx yapıyor).
const out = parcalar.join('\n');
const hedef = path.join(R, '.artifact', 'tvplus-spor-talep-haritasi.html');
fs.writeFileSync(hedef, out, 'utf8');
const mb = (Buffer.byteLength(out) / 1048576).toFixed(2);
console.log(`Çıktı: ${path.relative(R, hedef)}  (${mb} MB)`);
if (mb > 15.5) console.warn('UYARI: 16 MB artifact sınırına yaklaşıldı.');

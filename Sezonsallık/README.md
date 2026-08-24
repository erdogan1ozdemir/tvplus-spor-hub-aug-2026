# VitrA Dashboard — Sezonsallık & Keyword Intelligence

Türkiye banyo & seramik pazarında Google arama verisini analiz eden interaktif dashboard.
2.400+ keyword, 8 Kat1 / 64 Kat2 / 185 Kat3 kategori, 2024 ↔ 2025 karşılaştırması.

## Railway deploy (tek tıkla)

1. Railway hesabına giriş: https://railway.app
2. **New Project** → **Deploy from GitHub repo** (veya CLI: `railway up`)
3. Repo'yu bağla, otomatik algılar:
   - Nixpacks Node.js buildpack
   - `npm install` → `npm start`
4. Deploy tamamlanınca Railway size bir `*.up.railway.app` URL'si verir.
5. Custom domain eklenmek istenirse: Settings → Domains → + Custom Domain.

Healthcheck: `GET /health` → `{ ok: true }` (100 sn timeout).

## Lokal çalıştırma

```bash
npm install
npm start
# http://localhost:3000
```

## Proje yapısı

```
Vitra Dashboard.html   — ana HTML (SPA)
app.jsx                — React app kökü, layout + tab yönetimi
components.jsx         — chart bileşenleri (Line, Donut, Heatmap, vb.)
tabs.jsx               — tab içerikleri (Özet, Kategoriler, Keyword, Trendler, Fiyat)
utils.js               — veri toplama & formatlama yardımcıları
styles.css             — tüm stiller (CSS vars, tema, dark mode)
data/dashboard.js      — işlenmiş veri (2.420 keyword + kategori agregatları)
server.js              — Express static server
```

## Veri

Kaynak: `workbook.json` → `data/dashboard.js` (build time'da dönüştürülüyor).
YoY, QoQ, peak ay, çeyrek dağılımı, seasonality score gibi türetilmiş metrikler `utils.js` içinde hesaplanıyor.

## Çevre değişkenleri

`PORT` — Railway otomatik atar. Lokal için default 3000.

---

© Inbound SEO — VitrA Türkiye Banyo Pazarı Analizi

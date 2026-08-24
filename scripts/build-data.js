#!/usr/bin/env node
/**
 * build-data.js — data/raw/hacim_*.csv  ->  data/dashboard.js
 *
 * Faset modeli: her keyword satiri 20+ oznitelik kolonu tasir. Dashboard
 * herhangi bir faset kombinasyonuyla yeniden clusterlayabilir; sabit
 * Kat1/Kat2/Kat3 hiyerarsisi yoktur.
 *
 * Hacim kaynagi: DataForSEO (tek kaynak). Ahrefs degerleri bu dosyaya girmez.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RAW = path.join(ROOT, 'data', 'raw');
const OUT = path.join(ROOT, 'data', 'dashboard.js');

// ————————————————————————————————————————————— CSV
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map(h => h.trim());
  return rows.filter(r => r.length > 1).map(r => {
    const o = {};
    head.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
    return o;
  });
}

// ————————————————————————————————————————————— sezonsallik
function siniflandir(seri) {
  const nz = seri.filter(v => v > 0);
  if (!nz.length) return { sinif: 'Veri Yok', cv: null, pd: null };
  const ort = seri.reduce((a, b) => a + b, 0) / seri.length;
  if (!ort) return { sinif: 'Veri Yok', cv: null, pd: null };
  const varyans = seri.reduce((a, b) => a + (b - ort) ** 2, 0) / seri.length;
  const cv = Math.sqrt(varyans) / ort;
  const pd = Math.max(...seri) / Math.max(Math.min(...nz), 1);
  let sinif = 'Seasonal';
  if (cv < 0.35) sinif = 'Evergreen';
  else if (pd >= 20 || cv >= 1.0) sinif = 'Spike';
  return { sinif, cv: +cv.toFixed(3), pd: +pd.toFixed(1) };
}

// ————————————————————————————————————————————— YoY / donem modeli
// Veri penceresi 2024-01'den itibaren; takvim yili, YTD ve rolling 12 ay karsilastirmalari.
function donemler(aylar, seri) {
  const yil = {};
  aylar.forEach((ym, i) => {
    const y = ym.slice(0, 4);
    (yil[y] = yil[y] || { toplam: 0, ay: 0, seri: [] });
    yil[y].toplam += seri[i] || 0; yil[y].ay++; yil[y].seri.push(seri[i] || 0);
  });
  const yillar = Object.keys(yil).sort();
  const sonYil = yillar[yillar.length - 1];
  const oncekiYil = yillar[yillar.length - 2];

  // Takvim YoY: son TAM yil ile bir onceki tam yil
  const tamYillar = yillar.filter(y => yil[y].ay === 12);
  let yoyTakvim = null, takvimA = null, takvimB = null;
  if (tamYillar.length >= 2) {
    takvimB = tamYillar[tamYillar.length - 1]; takvimA = tamYillar[tamYillar.length - 2];
    const a = yil[takvimA].toplam, b = yil[takvimB].toplam;
    if (a > 0) yoyTakvim = (b - a) / a;
  }
  // YTD YoY: kismi son yilin ay sayisi kadar, onceki yilin ayni donemiyle
  let yoyYtd = null, ytdAy = null;
  if (oncekiYil && yil[sonYil].ay < 12) {
    ytdAy = yil[sonYil].ay;
    const buYil = yil[sonYil].toplam;
    const gecen = yil[oncekiYil].seri.slice(0, ytdAy).reduce((a, b) => a + b, 0);
    if (gecen > 0) yoyYtd = (buYil - gecen) / gecen;
  }
  // Rolling 12 ay vs onceki 12 ay
  let yoyRolling = null, r12 = null, p12 = null;
  if (seri.length >= 24) {
    r12 = seri.slice(-12).reduce((a, b) => a + b, 0);
    p12 = seri.slice(-24, -12).reduce((a, b) => a + b, 0);
    if (p12 > 0) yoyRolling = (r12 - p12) / p12;
  }
  return {
    yillar, yilToplam: Object.fromEntries(yillar.map(y => [y, yil[y].toplam])),
    yilSeri: Object.fromEntries(yillar.map(y => [y, yil[y].seri])),
    yoyTakvim, takvimA, takvimB, yoyYtd, ytdAy, yoyRolling, r12, p12
  };
}

function bant(sv) {
  if (!sv) return 'Veri yok';
  if (sv < 1000) return '< 1.000';
  if (sv < 5000) return '1.000-4.999';
  if (sv < 20000) return '5.000-19.999';
  if (sv < 100000) return '20.000-99.999';
  if (sv < 1000000) return '100.000-999.999';
  return '1M+';
}

// ————————————————————————————————————————————— facet haritasi
// CSV kolonu -> DATA icindeki kisa ad (dosya boyutu icin)
const FACET = {
  organizasyon: 'org', spor_dali: 'spor', musabaka_tipi: 'mus', lig_seviyesi: 'sev',
  prestij_katmani: 'pres', cinsiyet: 'cins', kulup_milli: 'km', takim_bireysel: 'tb',
  cografya: 'cog', yerlilik: 'yer', turk_baglantisi: 'turk', yayin_hakki: 'hak',
  periyodiklik: 'per', takvim_tipi: 'tak', sayfa_tipi: 'st', intent_katmani: 'it',
  entity_tipi: 'ent', marka_tipi: 'marka', dil: 'dil', sorgu_uzunlugu: 'uzn',
  varyant_kodu: 'vk', katman: 'ktm', kurum_sorgusu: 'kurum',
  kulup_dogrulama: 'dog', kulup: 'kulup'
};

// ————————————————————————————————————————————— yukle
const dosyalar = fs.readdirSync(RAW)
  .filter(f => f.startsWith('hacim_') && f.endsWith('.csv') && !f.endsWith('_elenen.csv'));
if (!dosyalar.length) { console.error('data/raw altinda hacim_*.csv bulunamadi.'); process.exit(1); }

let aylar = null;
const kwMap = new Map();     // normalize keyword -> satir (mukerrer engelle)
let elenenMukerrer = 0;

for (const f of dosyalar) {
  const rows = parseCSV(fs.readFileSync(path.join(RAW, f), 'utf8'));
  if (!rows.length) continue;
  const ayKol = Object.keys(rows[0]).filter(k => /^\d{4}-\d{2}$/.test(k)).sort();
  if (!aylar || ayKol.length > aylar.length) aylar = ayKol;

  for (const r of rows) {
    if (r.veri_var !== 'evet') continue;
    const kw = (r.keyword || '').trim().toLowerCase();
    if (!kw) continue;
    const sv = parseInt(r.search_volume || '0', 10) || 0;
    if (kwMap.has(kw)) { elenenMukerrer++; if (sv <= kwMap.get(kw).sv) continue; }

    const seri = ayKol.map(m => parseInt(r[m] || '0', 10) || 0);
    const { sinif, cv, pd } = siniflandir(seri);
    const maxI = seri.indexOf(Math.max(...seri));
    const nzMin = Math.min(...seri.filter(v => v > 0).concat([Infinity]));
    const minI = seri.findIndex(v => v === nzMin);

    const dn = donemler(ayKol, seri);
    const o = { kw, sv, seri, sinif, cv, pd, bant: bant(sv),
                peak: ayKol[maxI] || null, dip: (minI >= 0 ? ayKol[minI] : null),
                yoy: dn.yoyTakvim, yoyYtd: dn.yoyYtd, yoyR: dn.yoyRolling,
                r12: dn.r12, p12: dn.p12, yilT: dn.yilToplam,
                kaynak: f.replace('hacim_', '').replace('.csv', '') };
    for (const [csvKol, kisa] of Object.entries(FACET)) {
      if (r[csvKol] !== undefined && r[csvKol] !== '') o[kisa] = r[csvKol];
    }
    kwMap.set(kw, o);
  }
}

const keywords = [...kwMap.values()].sort((a, b) => b.sv - a.sv);

// ————————————————————————————————————————————— agregasyonlar
function grupla(alan, filtre = () => true) {
  const m = new Map();
  for (const k of keywords) {
    if (!filtre(k)) continue;
    const v = k[alan];
    if (v === undefined || v === '') continue;
    if (!m.has(v)) m.set(v, { ad: v, hacim: 0, kw: 0, seri: new Array(aylar.length).fill(0) });
    const g = m.get(v);
    g.hacim += k.sv; g.kw++;
    k.seri.forEach((s, i) => { g.seri[i] += s; });
  }
  return [...m.values()]
    .map(g => {
      const dn = donemler(aylar, g.seri);
      return { ...g, ...siniflandir(g.seri),
               peak: aylar[g.seri.indexOf(Math.max(...g.seri))] || null,
               yoy: dn.yoyTakvim, yoyYtd: dn.yoyYtd, yoyR: dn.yoyRolling,
               r12: dn.r12, p12: dn.p12, yilT: dn.yilToplam };
    })
    .sort((a, b) => b.hacim - a.hacim);
}

const jenerik = k => k.marka === 'Jenerik' || !k.marka;

const facetDegerleri = {};
for (const kisa of Object.values(FACET)) {
  const set = new Set();
  for (const k of keywords) if (k[kisa]) set.add(k[kisa]);
  if (set.size && set.size < 400) facetDegerleri[kisa] = [...set].sort();
}

const DATA = {
  meta: {
    olusturma: new Date().toISOString().slice(0, 10),
    kaynak: 'DataForSEO · Google Ads Search Volume · Türkiye/Türkçe',
    aylar,
    toplamKeyword: keywords.length,
    donem: (() => { const d = donemler(aylar, new Array(aylar.length).fill(0));
      return { yillar: d.yillar, takvimA: d.takvimA, takvimB: d.takvimB, ytdAy: d.ytdAy }; })(),
    toplamHacim: keywords.filter(jenerik).reduce((a, k) => a + k.sv, 0),
    markaliHacim: keywords.filter(k => !jenerik(k)).reduce((a, k) => a + k.sv, 0),
    dosyalar,
    elenenMukerrer
  },
  facetAdlari: FACET,
  facetDegerleri,
  keywords,
  ozet: {
    sporDali:    grupla('spor', jenerik),
    organizasyon: grupla('org', jenerik),
    sayfaTipi:   grupla('st', jenerik),
    intent:      grupla('it', jenerik),
    yayinHakki:  grupla('hak', jenerik),
    entityTipi:  grupla('ent', jenerik),
    cinsiyet:    grupla('cins', jenerik),
    musabakaTipi: grupla('mus', jenerik),
    sezonsallik: grupla('sinif', jenerik),
    katman:      grupla('ktm', jenerik),
    marka:       grupla('marka')
  }
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT,
  'window.DATA = ' + JSON.stringify(DATA) + ';\n' +
  'window.BRAND_ACCENT = (window.BRAND && window.BRAND.accent) || "#FFC900";\n', 'utf8');

const mb = (fs.statSync(OUT).size / 1048576).toFixed(2);
console.log(`Dosya      : ${dosyalar.join(', ')}`);
console.log(`Ay penceresi: ${aylar[0]} -> ${aylar[aylar.length - 1]} (${aylar.length} ay)`);
console.log(`Keyword    : ${keywords.length} (mukerrer elenen: ${elenenMukerrer})`);
console.log(`Jenerik hacim: ${DATA.meta.toplamHacim.toLocaleString('tr-TR')}`);
console.log(`Markali hacim: ${DATA.meta.markaliHacim.toLocaleString('tr-TR')}`);
console.log(`Cikti      : data/dashboard.js (${mb} MB)`);

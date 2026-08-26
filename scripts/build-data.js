#!/usr/bin/env node
/**
 * build-data.js — data/raw/hacim_*.csv → data/dashboard.js
 *
 * Şema, rolling 12 ay modeliyle uyumludur: her keyword satırı takvim yılı
 * dizileri (m24/m25/m26) ve rolling pencere toplamlarını (r12/p12/ryoy) taşır.
 * Gruplama sabit bir hiyerarşiye bağlı değildir; 26 faset kolonunun herhangi
 * biri çalışma zamanında kırılım ekseni olarak kullanılabilir.
 *
 * Hacim kaynağı: DataForSEO (tek kaynak). Ahrefs değerleri bu dosyaya girmez.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RAW  = path.join(ROOT, 'data', 'raw');
const OUT  = path.join(ROOT, 'data', 'dashboard.js');

const PALETTE = ['#4E79A7','#F28E2B','#E15759','#76B7B2','#59A14F',
                 '#EDC948','#B07AA1','#FF9DA7','#9C755F','#BAB0AC'];

// ——————————————————————————————————————————— CSV
function parseCSV(text){
  if(text.charCodeAt(0)===0xFEFF) text = text.slice(1);
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cell+='"';i++;} else q=false; } else cell+=c; }
    else if(c==='"') q=true;
    else if(c===',') { row.push(cell); cell=''; }
    else if(c==='\n'){ row.push(cell); rows.push(row); row=[]; cell=''; }
    else if(c!=='\r') cell+=c;
  }
  if(cell!=='' || row.length){ row.push(cell); rows.push(row); }
  const head = rows.shift().map(h=>h.trim());
  return rows.filter(r=>r.length>1).map(r=>{
    const o={}; head.forEach((h,i)=>{ o[h]=(r[i]??'').trim(); }); return o;
  });
}

// ——————————————————————————————————————————— yardımcılar
const serial = ym => {
  const [y,m] = ym.split('-').map(Number);
  return Math.round(Date.UTC(y, m-1, 1)/86400000) + 25569;
};
const toplam = a => a.reduce((x,y)=>x+(y||0),0);
const ort    = a => a.length ? toplam(a)/a.length : 0;
function oran(sonra, once){ return (once>0) ? (sonra-once)/once : null; }

function siniflandir(seri){
  const nz = seri.filter(v=>v>0);
  if(!nz.length) return {sinif:'Veri Yok', cv:null, pd:null};
  const m = ort(seri);
  if(!m) return {sinif:'Veri Yok', cv:null, pd:null};
  const cv = Math.sqrt(seri.reduce((a,b)=>a+(b-m)**2,0)/seri.length)/m;
  const pd = Math.max(...seri)/Math.max(Math.min(...nz),1);
  return { sinif: cv<0.35 ? 'Evergreen' : (pd>=20||cv>=1.0) ? 'Spike' : 'Seasonal',
           cv:+cv.toFixed(3), pd:+pd.toFixed(1) };
}
function bant(sv){
  if(!sv) return 'Veri yok';
  if(sv<1000) return '< 1.000';
  if(sv<5000) return '1.000 – 4.999';
  if(sv<20000) return '5.000 – 19.999';
  if(sv<100000) return '20.000 – 99.999';
  if(sv<1000000) return '100.000 – 999.999';
  return '1M+';
}
// Çeyrek peak bayrakları: hangi takvim çeyreği zirve yapıyor
function ceyrekBayrak(m12){
  const q=[0,0,0,0];
  m12.forEach((v,i)=>{ q[Math.floor(i/3)] += v||0; });
  const mx = Math.max(...q);
  return { pq: q.map(v => (mx>0 && v===mx) ? 1 : 0), qSum:q };
}

// ——— Takım kümesi anahtarı
// Takım aramaları ile o takımın oyuncu aramaları tek bir eksende toplanabilsin
// diye türetilir. Takım satırında keyword'ün ana adı, oyuncu satırında kulüp.
const KUYRUK = [' maçları',' maçı',' maçlari',' fikstürü',' fikstür',' puan durumu',
  ' kadrosu',' kadro',' canlı izle',' şifresiz',' transferleri',' transfer',
  ' oyuncuları',' ne zaman',' hangi kanalda',' saat kaçta',' maç sonucu',
  ' sonucu',' skoru',' skor',' haberleri',' son dakika',' istatistikleri',
  ' istatistik',' puanı',' sıralaması',' izle',' kimdir',' hangi takımda'];
const RESMI = [' spor kulübü',' f.c.',' a.ş.',' s.k.',' j.k.',' afc',' cf',' fc',' sk',' jk'];
function kulupAnahtar(kw){
  let t = kw, degisti = true;
  while(degisti){
    degisti = false;
    for(const suf of KUYRUK)
      if(t.endsWith(suf) && t.length > suf.length + 2){ t = t.slice(0, -suf.length); degisti = true; }
  }
  for(const suf of RESMI)
    if(t.endsWith(suf) && t.length > suf.length + 2){ t = t.slice(0, -suf.length); break; }
  return t.trim();
}

// CSV kolonu → DATA kısa adı
const FACET = {
  organizasyon:'org', spor_dali:'spor', musabaka_tipi:'mus', lig_seviyesi:'sev',
  cinsiyet:'cins', kulup_milli:'km', takim_bireysel:'tb',
  cografya:'cog', yerlilik:'yer', turk_baglantisi:'turk', yayin_hakki:'hak',
  periyodiklik:'per', takvim_tipi:'tak', sayfa_tipi:'st', intent_katmani:'it',
  entity_tipi:'ent', marka_tipi:'marka', dil:'dil', sorgu_uzunlugu:'uzn',
  varyant_kodu:'vk', katman:'ktm', kurum_sorgusu:'kurum',
  oyuncu_dogrulama:'odog', kulup:'kulup',
  oyuncu_ana_ad:'anaAd', mantik_denetim:'mden',
};

// ——————————————————————————————————————————— yükle
const dosyalar = fs.readdirSync(RAW)
  .filter(f=>f.startsWith('hacim_') && f.endsWith('.csv') && !f.endsWith('_elenen.csv'));
if(!dosyalar.length){ console.error('data/raw altında hacim_*.csv bulunamadı.'); process.exit(1); }

let AY = null;
const kwMap = new Map();
let mukerrer = 0;

for(const f of dosyalar){
  const rows = parseCSV(fs.readFileSync(path.join(RAW,f),'utf8'));
  if(!rows.length) continue;
  const ayKol = Object.keys(rows[0]).filter(k=>/^\d{4}-\d{2}$/.test(k)).sort();
  if(!AY || ayKol.length > AY.length) AY = ayKol;

  for(const r of rows){
    if(r.veri_var !== 'evet') continue;
    const kw = (r.keyword||'').trim().toLowerCase();
    if(!kw) continue;
    const sv = parseInt(r.search_volume||'0',10) || 0;
    if(kwMap.has(kw)){ mukerrer++; if(sv <= kwMap.get(kw).sv) continue; }

    const seri = ayKol.map(m => parseInt(r[m]||'0',10) || 0);
    const o = { kw, sv, _seri:seri, _ay:ayKol, kaynak:f.replace('hacim_','').replace('.csv','') };
    for(const [csvKol,kisa] of Object.entries(FACET))
      if(r[csvKol]!==undefined && r[csvKol]!=='') o[kisa] = r[csvKol];
    kwMap.set(kw,o);
  }
}

// Takvim yılı blokları
const yillar = [...new Set(AY.map(a=>a.slice(0,4)))].sort();
const months2024 = AY.filter(a=>a.startsWith(yillar[0]));
const months2025 = yillar[1] ? AY.filter(a=>a.startsWith(yillar[1])) : [];
const months2026 = yillar[2] ? AY.filter(a=>a.startsWith(yillar[2])) : [];
const monthsR12  = AY.slice(-12);
const monthsP12  = AY.length>=24 ? AY.slice(-24,-12) : [];

const keywords = [];
for(const o of kwMap.values()){
  const idx = ym => o._ay.indexOf(ym);
  const al  = liste => liste.map(ym => { const i=idx(ym); return i>=0 ? o._seri[i] : 0; });
  const m24 = al(months2024), m25 = al(months2025), m26 = al(months2026);
  const tum = [...m24, ...m25, ...m26];
  const r12arr = tum.slice(-12);
  const p12arr = tum.length>=24 ? tum.slice(-24,-12) : null;
  const r12 = toplam(r12arr), p12 = p12arr ? toplam(p12arr) : null;

  const a24 = m24.length ? Math.round(ort(m24)) : null;
  const a25 = m25.length ? Math.round(ort(m25)) : null;
  const a26 = m26.length ? Math.round(ort(m26)) : null;   // kısmi yıl: YTD ortalaması
  const yoy = oran(toplam(m25), toplam(m24));
  const ryoy = p12!=null ? oran(r12, p12) : null;
  // YTD: kısmi son yıl ile önceki yılın aynı ay sayısı
  const ytd = (m26.length && m25.length>=m26.length)
    ? oran(toplam(m26), toplam(m25.slice(0,m26.length))) : null;

  const {pq}  = ceyrekBayrak(m25.length?m25:m24);
  const rC    = ceyrekBayrak(r12arr);
  // Tümü sıfır olan seride indexOf(max) 0 döndürür; bu, hacmi olmayan
  // satırlara gerçekte var olmayan bir peak ayı atar.
  const peakI25 = (m25.length && Math.max(...m25) > 0) ? m25.indexOf(Math.max(...m25)) : -1;
  const peakIR  = (r12arr.length && Math.max(...r12arr) > 0) ? r12arr.indexOf(Math.max(...r12arr)) : -1;
  const sz = siniflandir(tum);
  const nz = tum.filter(v=>v>0);
  const dipI = nz.length ? tum.indexOf(Math.min(...nz)) : -1;

  const k = { kw:o.kw, sv:o.sv, m24, m25, m26,
    a24, a25, a26, yoy, r12, p12, ryoy, ytd,
    pq, rpq: rC.pq,
    peakSerial: peakI25>=0 ? serial(months2025[peakI25]) : null,
    rpeakSerial: peakIR>=0 ? serial(monthsR12[peakIR]) : null,
    peakYm: peakIR>=0 ? monthsR12[peakIR] : null,
    dipYm: dipI>=0 ? AY[dipI] : null,
    bucket: bant(r12 ? Math.round(r12/12) : o.sv),
    takim: null,   // aşağıda varlık tipine göre doldurulur

    sinif: sz.sinif, cv: sz.cv, pd: sz.pd,
    trend: ryoy==null ? 'Veri Yok' : ryoy>0.05 ? 'Yükselen' : ryoy<-0.05 ? 'Düşen' : 'Stabil',
    kaynak:o.kaynak };
  for(const kisa of Object.values(FACET)) if(o[kisa]!==undefined) k[kisa]=o[kisa];
  // Takım kümesi: takım satırında kendi adı, oyuncu satırında kulübü
  k.takim = k.ent==='Takım' ? kulupAnahtar(k.kw)
          : (k.ent==='Oyuncu' && k.kulup) ? k.kulup : null;
  if(!k.takim) delete k.takim;

  // "Türk Sporcu Var" yalnızca yabancı organizasyonlar için anlamlıdır:
  // amaç yabancı lig ve kulüplerdeki Türk sporcuları ayırt edebilmek.
  // Yerli organizasyonlarda etiket, takım sporunda "Türk Takımı Var"a,
  // bireysel sporda "Yok"a çekilir.
  if(k.turk==='Türk Sporcu Var' && (k.cog==='Türkiye' || k.yer==='Yerli')){
    k.turk = k.tb==='Takım Sporu' ? 'Türk Takımı Var' : 'Yok';
  }

  // Özdilek uyumluluk alanları
  k.brand   = (k.ent==='Takım'||k.ent==='Oyuncu') ? k.kw : null;
  k.catalog = k.hak==='TV+ Var' ? 'Var' : k.hak==='TV+ Yok' ? 'Yok' : '';
  keywords.push(k);
}
keywords.sort((a,b)=>(b.r12||0)-(a.r12||0));

// ——————————————————————————————————————————— faset envanteri
const facetDegerleri = {};
for(const kisa of Object.values(FACET)){
  const s = new Set();
  for(const k of keywords) if(k[kisa]) s.add(k[kisa]);
  if(s.size && s.size<600) facetDegerleri[kisa] = [...s].sort((a,b)=>String(a).localeCompare(String(b),'tr'));
}
facetDegerleri.sinif  = [...new Set(keywords.map(k=>k.sinif))].sort();
// Takım kümesi çok değerli bir eksen; filtre için tamamı taşınır
facetDegerleri.takim = [...new Set(keywords.map(k=>k.takim).filter(Boolean))]
  .sort((a,b)=>String(a).localeCompare(String(b),'tr'));
facetDegerleri.bucket = ['< 1.000','1.000 – 4.999','5.000 – 19.999','20.000 – 99.999','100.000 – 999.999','1M+']
  .filter(b=>keywords.some(k=>k.bucket===b));
facetDegerleri.trend  = ['Yükselen','Stabil','Düşen'];

// Spor dalı renk paleti (rolling hacme göre)
const sporSirali = [...new Set(keywords.map(k=>k.spor).filter(Boolean))]
  .map(s=>({s, v: keywords.filter(k=>k.spor===s).reduce((a,k)=>a+(k.r12||0),0)}))
  .sort((a,b)=>b.v-a.v).map(x=>x.s);
const SPOR_RENK = {};
sporSirali.forEach((s,i)=>{ SPOR_RENK[s] = PALETTE[i%PALETTE.length]; });

// Jenerik toplam: rakip markalı sorgular ve denetimde işaretlenen varyantlar hariç
// marka_tipi tüm satırlarda tek değerdi ve hiçbir satırı elemiyordu;
// varyant_denetim de öyle. Filtre yalnızca mantık denetimine dayanır.
const jenerik = keywords.filter(k => !k.mden || k.mden==='Geçerli');
const DATA = {
  meta: {
    olusturma: new Date().toISOString().slice(0,10),
    kaynak: 'DataForSEO · Google Ads Search Volume · Türkiye/Türkçe',
    aylar: AY, yillar, dosyalar, mukerrer,
    toplamKeyword: keywords.length,
    gecerliKeyword: jenerik.length,
    isaretliMantik: keywords.filter(k=>k.mden && k.mden!=='Geçerli').length,
    toplamR12: jenerik.reduce((a,k)=>a+(k.r12||0),0),
    toplamP12: jenerik.reduce((a,k)=>a+(k.p12||0),0),
  },
  months2024, months2025, months2026, monthsR12, monthsP12,
  facetAdlari: FACET, facetDegerleri,
  // Denetimde işaretli satırlar dashboard'a hiç gönderilmez; aksi halde
  // toplamlarda ve kırılımlarda sayılmaya devam ediyorlardı.
  keywords: jenerik,
};

// ——————————————————————————————————————————— dize sözlüğü
// Faset değerleri satır başına tekrar ettiği için dosya gereksiz büyüyor.
// Değerler sözlüğe alınıp indeksle saklanır, tarayıcıda yüklenirken geri açılır.
const SOZLUK_ALAN = Object.values(FACET).concat(['sinif','bucket','trend','kaynak','catalog','takim']);
const sozluk = {};
for(const alan of SOZLUK_ALAN){
  const set = new Set();
  for(const k of jenerik) if(typeof k[alan] === 'string') set.add(k[alan]);
  if(set.size === 0 || set.size > 4000) continue;
  const liste = [...set];
  const idx = new Map(liste.map((v,i)=>[v,i]));
  sozluk[alan] = liste;
  for(const k of jenerik) if(typeof k[alan] === 'string') k[alan] = idx.get(k[alan]);
}
DATA.sozluk = sozluk;

fs.mkdirSync(path.dirname(OUT), {recursive:true});
fs.writeFileSync(OUT,
  'window.DATA = ' + JSON.stringify(DATA) + ';\n' +
  // Sözlükten geri açma: downstream kod dizelerle çalışmaya devam eder.
  '(function(){var D=window.DATA,S=D.sozluk||{};' +
  'for(var a in S){var L=S[a];for(var i=0;i<D.keywords.length;i++){' +
  'var v=D.keywords[i][a];if(typeof v==="number")D.keywords[i][a]=L[v];}}' +
  'delete D.sozluk;})();\n' +
  'window.SPOR_RENK = ' + JSON.stringify(SPOR_RENK) + ';\n' +
  'window.BRAND_ACCENT = (window.BRAND && window.BRAND.accent) || "#FAD604";\n', 'utf8');

const mb = (fs.statSync(OUT).size/1048576).toFixed(2);
const ryoy = oran(DATA.meta.toplamR12, DATA.meta.toplamP12);
console.log(`Dosya       : ${dosyalar.join(', ')}`);
console.log(`Takvim      : ${yillar.join(' / ')}  (${AY.length} ay: ${AY[0]} → ${AY[AY.length-1]})`);
console.log(`Rolling     : Son 12 ${monthsR12[0]}→${monthsR12[11]} | Önceki 12 ${monthsP12[0]||'–'}→${monthsP12[11]||'–'}`);
console.log(`Keyword     : ${keywords.length} (mükerrer elenen: ${mukerrer})`);
console.log(`Son 12 Ay   : ${DATA.meta.toplamR12.toLocaleString('tr-TR')}`);
console.log(`Önceki 12 Ay: ${DATA.meta.toplamP12.toLocaleString('tr-TR')}  → YoY ${ryoy==null?'–':(ryoy*100).toFixed(1)+'%'}`);
console.log(`Çıktı       : data/dashboard.js (${mb} MB)`);

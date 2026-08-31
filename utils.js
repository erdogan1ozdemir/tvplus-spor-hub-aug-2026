// Utilities
window.U = (function(){
  const TR_MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const TR_MONTHS_LONG = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  // Üç anlamlı basamak: 1.500 → 1,5K · 2.340.000 → 2,34M · 336.300.000 → 336M.
  // Sabit ondalık yerine büyüklüğe göre basamak vermek küçük değerlerde
  // bilgiyi koruyor, büyük değerlerde tabloyu gereksiz uzatmıyor.
  function kisalt(n, birim, ek) {
    const v = n / birim;
    const a = Math.abs(v);
    const basamak = a < 10 ? 2 : a < 100 ? 1 : 0;
    let s = v.toFixed(basamak);
    if (basamak) s = s.replace(/\.?0+$/, '');   // 1,50 → 1,5 · 2,00 → 2
    return s.replace('.', ',') + ek;
  }
  function fmtNum(n) {
    if (n == null || isNaN(n)) return '–';
    n = Math.round(n);
    if (Math.abs(n) >= 1e9) return kisalt(n, 1e9, 'B');
    if (Math.abs(n) >= 1e6) return kisalt(n, 1e6, 'M');
    if (Math.abs(n) >= 1e3) return kisalt(n, 1e3, 'K');
    return n.toLocaleString('tr-TR');
  }
  function fmtFull(n) {
    if (n == null || isNaN(n)) return '–';
    return Math.round(n).toLocaleString('tr-TR');
  }
  function fmtPct(n, digits=1) {
    if (n == null || isNaN(n)) return '–';
    const v = (n*100);
    return (v>0?'+':'') + v.toFixed(digits).replace('.',',') + '%';
  }
  function serialToMonthIdx(serial) {
    // Excel serial -> calendar month index (0-11) of the serial's own year
    if (!serial || typeof serial !== 'number') return null;
    const d = new Date((serial - 25569) * 86400000);
    return d.getUTCMonth();
  }
  function serialToRollingLabel(serial) {
    // Excel serial -> "Tem 25" / "Oca 26" style year-suffixed month label
    if (!serial || typeof serial !== 'number') return '–';
    const d = new Date((serial - 25569) * 86400000);
    return TR_MONTHS[d.getUTCMonth()] + ' ' + String(d.getUTCFullYear()).slice(2);
  }
  function trendClass(yoy) { return yoy > 0 ? 'pos' : yoy < 0 ? 'neg' : 'neu'; }

  // ——— Rolling 12-month window helpers ———
  // Window boundaries come from DATA.monthsR12 / monthsP12 (data/dashboard.js
  // loads before utils.js). Labels carry the 2-digit year: "Tem 25" … "Haz 26".
  const _D = window.DATA || {};
  function ymLabel(ym) {
    if (!ym) return '';
    const [y, m] = String(ym).split('-');
    return TR_MONTHS[Number(m) - 1] + ' ' + String(y).slice(2);
  }
  const ROLLING_LABELS = (_D.monthsR12 || []).map(ymLabel);
  const P12_LABELS = (_D.monthsP12 || []).map(ymLabel);

  // Full monthly series of a keyword/brand row (m24 optional — brands lack it)
  function allMonthsOf(k) {
    return [...(k.m24 || []), ...(k.m25 || []), ...(k.m26 || [])].map(v => v || 0);
  }
  // Son 12 Ay series (works for keywords and brands: data always ends at the last available month)
  function rollingOf(k) { return allMonthsOf(k).slice(-12); }
  // Önceki 12 Ay series; null if the row has no data that far back (e.g. brands without m24)
  function prevRollingOf(k) {
    const a = allMonthsOf(k);
    if (a.length < 24) return null;
    return a.slice(-24, -12);
  }
  // ————————————————————————————————— Çeyrek tanımı (tek kaynak)
  // Çeyrek, seçili pencerenin çeyreğidir. Rolling görünümde pencere Ağustos'ta
  // başladığı için çeyrekler takvim çeyreğiyle örtüşmez; bu yüzden takvim
  // etiketi ("Q1 26") yerine pencerenin gerçek ayları yazılır ("Ağu-Eki 25").
  // Takvim görünümünde çeyrekler gerçek takvim çeyrekleridir.
  function _ayKisa(ym){
    const [y, m] = String(ym).split('-');
    return TR_MONTHS[Number(m) - 1] + ' ' + String(y).slice(2);
  }
  const ROLLING_Q_LABELS = (() => {
    const ay = _D.monthsR12 || [];
    if (ay.length < 12) return ['Ç1', 'Ç2', 'Ç3', 'Ç4'];
    return [0, 1, 2, 3].map(i => {
      const bas = _ayKisa(ay[i*3]), son = _ayKisa(ay[i*3 + 2]);
      const [b, by] = bas.split(' '), [sn, sy] = son.split(' ');
      return by === sy ? `${b}-${sn} ${sy}` : `${b} ${by}-${sn} ${sy}`;
    });
  })();
  const CALENDAR_Q_LABELS = (() => {
    const yil = String((_D.meta && _D.meta.yillar && _D.meta.yillar[1]) || '').slice(2);
    return ['Q1', 'Q2', 'Q3', 'Q4'].map(q => yil ? `${q} ${yil}` : q);
  })();
  const Q_MONTH_SPANS = ['Oca-Mar', 'Nis-Haz', 'Tem-Eyl', 'Eki-Ara'];
  // qIdx: pencere içindeki çeyrek sırası (0-3)
  function qLabel(qIdx, viewMode) {
    if (qIdx == null || qIdx < 0) return '–';
    return viewMode === 'calendar'
      ? (CALENDAR_Q_LABELS[qIdx] || ('Q' + (qIdx + 1)))
      : (ROLLING_Q_LABELS[qIdx] || ('Ç' + (qIdx + 1)));
  }
  function quarterOptions(viewMode) {
    return viewMode === 'calendar'
      ? CALENDAR_Q_LABELS.map((l, i) => `${l} (${Q_MONTH_SPANS[i]})`)
      : ROLLING_Q_LABELS.slice();
  }
  // Pencere dizisinin çeyrek toplamları — build-data.js'teki rpq ile aynı tanım
  function quarterSums(seri) {
    const q = [0, 0, 0, 0];
    for (let i = 0; i < 12; i++) q[Math.floor(i / 3)] += (seri && seri[i]) || 0;
    return q;
  }
  function peakQuarterIdx(seri) {
    const q = quarterSums(seri || []);
    const mx = Math.max(...q);
    return mx > 0 ? q.indexOf(mx) : -1;
  }

  // Build monthly totals aggregation for a set of keywords
  function aggregateMonthly(kws, field='m25') {
    const out = new Array(12).fill(0);
    for (const k of kws) {
      for (let i=0;i<12;i++) out[i] += (k[field]?.[i] || 0);
    }
    return out;
  }
  // Aggregate rolling ('last') or previous ('prev') 12-month totals
  function aggregateRolling(kws, which='last') {
    const out = new Array(12).fill(0);
    for (const k of kws) {
      const a = which === 'prev' ? prevRollingOf(k) : rollingOf(k);
      if (!a) continue;
      for (let i=0;i<12;i++) out[i] += a[i] || 0;
    }
    return out;
  }

  // Heatmap color scale — Google Sheets style: red (low) → yellow (mid) → green (high)
  // #e67c73 → #fbbc04 → #57bb8a
  function lerp(a, b, t) { return Math.round(a + (b-a)*t); }
  function hmColor(t, palette='coral') {
    t = Math.max(0, Math.min(1, t));
    // red e67c73 = (230,124,115), yellow fbbc04 = (251,188,4), green 57bb8a = (87,187,138)
    if (t < 0.5) {
      const k = t*2;
      const r = lerp(230, 251, k);
      const g = lerp(124, 188, k);
      const b = lerp(115, 4, k);
      return `rgb(${r},${g},${b})`;
    } else {
      const k = (t-0.5)*2;
      const r = lerp(251, 87, k);
      const g = lerp(188, 187, k);
      const b = lerp(4, 138, k);
      return `rgb(${r},${g},${b})`;
    }
  }
  function hmText(t) {
    // Red/green ends are dark enough for white; yellow midband needs dark text
    return (t > 0.75 || t < 0.25) ? 'white' : '#10332F';
  }

  // CSV export
  function toCSV(rows, headers) {
    const esc = v => {
      if (v == null) return '';
      const s = String(v);
      if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
      return s;
    };
    const lines = [headers.map(h=>h.label).join(',')];
    for (const r of rows) lines.push(headers.map(h => esc(typeof h.get==='function'?h.get(r):r[h.key])).join(','));
    return lines.join('\n');
  }
  // Artifact olarak yayınlandığında tarayıcının kendi indirme yolu kapalıdır;
  // dosya yalnızca downloads yetenegi uzerinden izleyiciye sunulabilir.
  // Yetenek yoksa (yerel sunucu, dosya acilisi) eski yola dusulur.
  let _kaydedici;
  function _kaydediciAl() {
    if (_kaydedici !== undefined) return _kaydedici;
    _kaydedici = (typeof window !== 'undefined' && window.claude && window.claude.use)
      ? window.claude.use('downloads').catch(()=>null)
      : null;
    return _kaydedici;
  }
  function _tarayiciyaIndir(name, csv) {
    const blob = new Blob(['\uFEFF' + csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
  }
  function _uyar(mesaj) {
    const el = document.createElement('div');
    el.className = 'indir-uyari';
    el.textContent = mesaj;
    document.body.appendChild(el);
    setTimeout(()=>{ el.classList.add('git'); setTimeout(()=>el.remove(), 400); }, 3600);
  }
  function downloadCSV(name, csv) {
    const s = _kaydediciAl();
    if (!s) { _tarayiciyaIndir(name, csv); return; }
    Promise.resolve(s).then(function(d) {
      if (!d) { _tarayiciyaIndir(name, csv); return; }
      return d.save({filename:name, data:'\uFEFF' + csv}).catch(function(e) {
        const kod = e && e.code;
        if (kod === 'declined' || kod === 'rate_limited') return;   // izleyici kararı
        if (kod === 'extension_not_enabled') {
          // CSV bu görünümde kapalı; aynı içerik düz metin olarak sunulur
          return d.save({filename:name.replace(/\.csv$/i,'') + '.txt', data:'\uFEFF' + csv})
                  .catch(function(){ _uyar('Dosya indirme bu görünümde kullanılamıyor.'); });
        }
        if (kod === 'too_large') { _uyar('Dosya 16 MB sınırını aşıyor, filtreyi daraltın.'); return; }
        _uyar('Dosya indirme bu görünümde kullanılamıyor.');
      });
    });
  }

  // Simple debounce
  function debounce(fn, ms=150) {
    let t; return (...a) => { clearTimeout(t); t=setTimeout(()=>fn(...a), ms); };
  }

  // Sparkline SVG path
  function sparkPath(values, w, h, pad=1) {
    if (!values || !values.length) return {line:'', area:'', min:0, max:0};
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const n = values.length;
    const xs = values.map((_,i) => pad + (i * (w - 2*pad)) / (n-1));
    const ys = values.map(v => pad + (h - 2*pad) - ((v - min) / range) * (h - 2*pad));
    let line = 'M' + xs.map((x,i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' L');
    let area = line + ` L${xs[n-1].toFixed(1)},${h-pad} L${xs[0].toFixed(1)},${h-pad} Z`;
    return {line, area, min, max};
  }

  // Quartile bucket
  function quarterName(i) { return 'Q' + (Math.floor(i/3)+1); }


  // ——— TV+ faset yardımcıları ———
  const FACET_ETIKET = {
    spor:'Spor Dalı', org:'Organizasyon', st:'Sayfa Tipi', it:'Intent', ent:'Varlık Tipi',
    hak:'Yayın Hakkı', mus:'Müsabaka Tipi', sev:'Lig Seviyesi',
    cins:'Cinsiyet', km:'Kulüp/Milli', tb:'Takım/Bireysel', cog:'Coğrafya', yer:'Yerlilik',
    turk:'Türk Bağlantısı', per:'Periyodiklik', tak:'Takvim Tipi',
    dil:'Dil', uzn:'Sorgu Uzunluğu', ktm:'Katman', kurum:'Kurum Sorgusu',
    sinif:'Mevsim Tipi', bucket:'Hacim Aralığı', trend:'Trend', kulup:'Takım',
    a24:'2024 Ort.', a25:'2025 Ort.', a26:'2026 YTD Ort.',
    takim:'Takım', milli:'Milli Takım', avrupa:'Avrupa Kupası', guncel:'Eşleşme Güncelliği', mden:'Mantık Denetimi', anaAd:'Oyuncu Ana Adı',
    odog:'Oyuncu Doğrulama',
  };
  // Kırılım hiyerarşisi: seviye 1 → 2 → 3 (Özdilek'teki Kat 1/2/3 karşılığı)
  const SEVIYELER = [
    {id:'spor', label:'Spor Dalı'},
    {id:'org',  label:'Organizasyon'},
    {id:'st',   label:'Sayfa Tipi'},
  ];

  // Faset filtresi: {alan:[değerler]} — boş dizi = filtre yok
  function applyFacets(rows, f, arama){
    let out = rows;
    for(const [alan, degerler] of Object.entries(f||{})){
      if(!degerler || !degerler.length) continue;
      const s = new Set(degerler);
      out = out.filter(r => s.has(r[alan]));
    }
    if(arama && arama.trim()){
      const q = arama.trim().toLowerCase();
      out = out.filter(r => r.kw.includes(q));
    }
    return out;
  }

  // Grupla: herhangi bir faset ekseninde, rolling + takvim metrikleriyle
  function groupBy(rows, alan, altAlan){
    const m = new Map();
    for(const k of rows){
      const v = k[alan]; if(v===undefined || v==='') continue;
      const key = altAlan ? v + ' ▸ ' + (k[altAlan]||'–') : v;
      if(!m.has(key)) m.set(key, {label:key, ust:v, alt: altAlan?k[altAlan]:null,
        alan, rows:[], r12:0, p12:0, tot24:0, tot25:0, kwCount:0});
      const g = m.get(key);
      g.rows.push(k); g.kwCount++;
      g.r12 += k.r12||0; g.p12 += k.p12||0;
      g.tot24 += (k.m24||[]).reduce((a,b)=>a+(b||0),0);
      g.tot25 += (k.m25||[]).reduce((a,b)=>a+(b||0),0);
    }
    const toplamR12 = rows.reduce((a,k)=>a+(k.r12||0),0) || 1;
    return [...m.values()].map(g => zenginlestir(g, toplamR12)).sort((a,b)=>b.r12-a.r12);
  }

  // Grup nesnesine türetilmiş metrikleri ekler. groupBy ve takım kümeleri aynı
  // işlevi kullanır; böylece iki kırılım da özdeş alanlara sahip olur ve
  // aynı bileşenlere sorunsuz verilebilir.
  function zenginlestir(g, toplamR12){
    const roll  = aggregateRolling(g.rows,'last');
    const prev  = aggregateRolling(g.rows,'prev');
    const cal25 = aggregateMonthly(g.rows,'m25');
    const cal24 = aggregateMonthly(g.rows,'m24');
    const cal26 = aggregateMonthly(g.rows,'m26');
    const tot24 = cal24.reduce((a,b)=>a+(b||0),0);
    const tot25 = cal25.reduce((a,b)=>a+(b||0),0);
    // Mevsim tipi, keyword seviyesindekiyle aynı temele oturmalı: sınıf
    // build-data.js'te tüm seri (2024-01 →) üzerinden hesaplanıyor.
    const tumSeri = [...cal24, ...cal25, ...cal26];
    const nz = tumSeri.filter(v=>v>0);
    const mean = tumSeri.reduce((a,b)=>a+b,0)/(tumSeri.length||1);
    const cv = mean ? Math.sqrt(tumSeri.reduce((a,b)=>a+(b-mean)**2,0)/tumSeri.length)/mean : 0;
    const pdr = nz.length ? Math.max(...tumSeri)/Math.max(Math.min(...nz),1) : 0;
    const pIdx = (roll.length && Math.max(...roll) > 0) ? roll.indexOf(Math.max(...roll)) : -1;
    return {...g, roll, prev, cal24, cal25, cal26, tot24, tot25,
      ryoy: g.p12>0 ? (g.r12-g.p12)/g.p12 : null,
      yoy:  tot24>0 ? (tot25-tot24)/tot24 : null,
      share: g.r12/(toplamR12||1),
      peakIdx: pIdx, peakLabel: ROLLING_LABELS[pIdx] || '–',
      // Takvim görünümü cal25 dizisini çizer; rolling indeksi oraya
      // uygulanınca peak işareti yanlış aya düşüyordu.
      peakIdxCal: (Math.max(...cal25) > 0) ? cal25.indexOf(Math.max(...cal25)) : null,
      peakQ: peakQuarterIdx(roll),
      peakQCal: peakQuarterIdx(cal25),
      sezType: !nz.length ? 'Veri Yok'
        : cv<0.35 ? 'Evergreen' : (pdr>=20||cv>=1.0) ? 'Spike' : 'Seasonal',
      cv:+cv.toFixed(3), pdRatio:+pdr.toFixed(1),
      rising:  g.rows.filter(k=>k.trend==='Yükselen').length,
      falling: g.rows.filter(k=>k.trend==='Düşen').length,
    };
  }

  // Görünüm moduna göre seri + etiketler
  function seriesFor(g, viewMode){
    if(viewMode==='calendar'){
      const out=[];
      if(g.cal24 && g.cal24.some(v=>v)) out.push({name:'2024', color:'#9C9C9C', values:g.cal24});
      if(g.cal25 && g.cal25.some(v=>v)) out.push({name:'2025', color:'#4E79A7', values:g.cal25});
      if(g.cal26 && g.cal26.some(v=>v)){
        // Kısmi yıl: veri olmayan aylar null bırakılır ki çizgi sıfıra düşmesin
        const kacAy = (window.DATA.months2026||[]).length;
        const v26 = g.cal26.slice(0, kacAy).concat(new Array(Math.max(0,12-kacAy)).fill(null));
        out.push({name:'2026', color:'#FAD604', values:v26});
      }
      return {series:out, labels:TR_MONTHS};
    }
    return {series:[
      {name:'Önceki 12 Ay', color:'#BAB0AC', values:g.prev, dashed:true},
      {name:'Son 12 Ay',    color:'var(--accent-deep)', values:g.roll},
    ], labels:ROLLING_LABELS};
  }

  // Görünüm moduna göre YoY: rolling = Son 12 Ay / Önceki 12 Ay, calendar = son iki tam takvim yılı
  function yoyFor(o, viewMode){
    if(!o) return null;
    return viewMode==='calendar' ? (o.yoy ?? null) : (o.ryoy ?? null);
  }
  function yoyEtiketFor(viewMode){
    const y = (window.DATA.meta.yillar)||[];
    return viewMode==='calendar'
      ? `Takvim YoY (${y[0]||''} → ${y[1]||''})`
      : `Rolling YoY (Son 12 Ay / Önceki 12 Ay)`;
  }
  function hacimFor(o, viewMode){
    if(!o) return 0;
    return viewMode==='calendar' ? (o.tot25 ?? o.r12 ?? 0) : (o.r12 ?? 0);
  }
  function oncekiHacimFor(o, viewMode){
    if(!o) return 0;
    return viewMode==='calendar' ? (o.tot24 ?? o.p12 ?? 0) : (o.p12 ?? 0);
  }

  const SEZ_RENK = {Evergreen:'#2E7D32', Seasonal:'#F5A623', Spike:'#D32F2F', 'Veri Yok':'#8A8A8A'};
  const HAK_RENK = {'TV+ Var':'#2E7D32','TV+ Yok':'#D32F2F','Doğrulanacak':'#F5A623','Kısmi':'#B07AA1'};


// ————————————————————————————————— Açıklama balonu sürücüsü
// data-tip taşıyan her eleman için tek bir balon kullanılır. Tarayıcının
// kendi title balonu geç açılıyor, uzun metni kırpıyor ve dokunmatikte
// hiç çalışmıyordu.
(function kurTipBalonu(){
  // Tarayıcı dışı bağlamlarda (derleme, test) kurulum atlanır.
  if (typeof document === 'undefined' || !document.addEventListener
      || typeof window === 'undefined' || !window.addEventListener
      || document.__tipKuruldu) return;
  document.__tipKuruldu = true;
  let kutu = null, hedef = null;

  function olustur(){
    if (kutu) return kutu;
    kutu = document.createElement('div');
    kutu.className = 'tipbox';
    document.body.appendChild(kutu);
    return kutu;
  }
  function konumla(e){
    if (!kutu) return;
    const bo = kutu.getBoundingClientRect();
    const pay = 14;
    let x = e.clientX + pay, y = e.clientY + pay;
    if (x + bo.width > window.innerWidth - 8)  x = e.clientX - bo.width - pay;
    if (y + bo.height > window.innerHeight - 8) y = e.clientY - bo.height - pay;
    kutu.style.left = Math.max(8, x) + 'px';
    kutu.style.top  = Math.max(8, y) + 'px';
  }
  function ac(el, e){
    const metin = el.getAttribute('data-tip');
    if (!metin || !metin.trim()) return;
    const k = olustur();
    // İlk satır başlık olarak biçimlenir
    const satirlar = metin.split('\n');
    k.textContent = '';
    if (satirlar.length > 1){
      const b = document.createElement('span');
      b.className = 'tip-bas'; b.textContent = satirlar[0];
      k.appendChild(b);
      k.appendChild(document.createTextNode(satirlar.slice(1).join('\n')));
    } else {
      k.textContent = metin;
    }
    k.classList.add('acik');
    hedef = el; konumla(e);
  }
  function kapat(){
    if (kutu) kutu.classList.remove('acik');
    hedef = null;
  }
  document.addEventListener('mouseover', e => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (el === hedef) return;
    if (el) ac(el, e); else kapat();
  }, true);
  document.addEventListener('mousemove', e => { if (hedef) konumla(e); }, true);
  document.addEventListener('mouseleave', kapat, true);
  window.addEventListener('scroll', kapat, true);
  window.addEventListener('blur', kapat);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') kapat(); });
})();

  return {
    TR_MONTHS, TR_MONTHS_LONG,
    FACET_ETIKET, SEVIYELER, applyFacets, groupBy, zenginlestir, seriesFor, SEZ_RENK, HAK_RENK,
    yoyFor, yoyEtiketFor, hacimFor, oncekiHacimFor,
    ROLLING_LABELS, P12_LABELS, ymLabel,
    ROLLING_Q_LABELS, CALENDAR_Q_LABELS, quarterOptions, qLabel,
    quarterSums, peakQuarterIdx,
    fmtNum, fmtFull, fmtPct, serialToMonthIdx, serialToRollingLabel, trendClass,
    aggregateMonthly, aggregateRolling, rollingOf, prevRollingOf,
    hmColor, hmText,
    toCSV, downloadCSV, debounce, sparkPath, quarterName,
  };
})();

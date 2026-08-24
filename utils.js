// Utilities — TV+ Spor Talep Haritası
window.U = (function(){
  const D = window.DATA || {};
  const META = D.meta || {};
  const AYLAR = META.aylar || [];
  const TR_MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const TR_MONTHS_LONG = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  // "2026-03" -> "Mar '26"
  function ymLabel(ym){
    if(!ym) return '–';
    const [y,m] = String(ym).split('-');
    return TR_MONTHS[Number(m)-1] + " '" + String(y).slice(2);
  }
  const AY_ETIKET = AYLAR.map(ymLabel);

  function fmtNum(n){
    if(n==null||isNaN(n)) return '–';
    n = Math.round(n);
    if(Math.abs(n)>=1e6) return (n/1e6).toFixed(Math.abs(n)%1e6===0?0:1).replace('.',',')+'M';
    if(Math.abs(n)>=1e3) return (n/1e3).toFixed(Math.abs(n)%1e3===0?0:1).replace('.',',')+'K';
    return n.toLocaleString('tr-TR');
  }
  function fmtFull(n){ return (n==null||isNaN(n)) ? '–' : Math.round(n).toLocaleString('tr-TR'); }
  function fmtPct(n, digits=1){
    if(n==null||isNaN(n)) return '–';
    return (n>0?'+':'') + (n*100).toFixed(digits).replace('.',',') + '%';
  }
  function trendClass(v){ return v>0 ? 'pos' : v<0 ? 'neg' : 'neu'; }
  function serialToMonthIdx(){ return null; }   // bu veri setinde Excel serial yok

  // ——— seri işlemleri ———
  const N = () => AYLAR.length;
  function aggregate(kws){
    const out = new Array(N()).fill(0);
    for(const k of kws){ const s=k.seri; if(!s) continue;
      for(let i=0;i<N();i++) out[i] += s[i]||0; }
    return out;
  }
  const sum = rows => rows.reduce((a,k)=>a+(k.sv||0),0);

  // Son yarı ile önceki yarı karşılaştırması (13 ay penceresinde YoY yerine kullanılır)
  function donemsel(seri){
    if(!seri || seri.length < 4) return null;
    const yari = Math.floor(seri.length/2);
    const son = seri.slice(-yari).reduce((a,b)=>a+b,0);
    const onceki = seri.slice(0, yari).reduce((a,b)=>a+b,0);
    if(!onceki) return null;
    return (son - onceki) / onceki;
  }

  function siniflandir(seri){
    const nz = (seri||[]).filter(v=>v>0);
    if(!nz.length) return {sinif:'Veri Yok', cv:null, pd:null};
    const ort = seri.reduce((a,b)=>a+b,0)/seri.length;
    if(!ort) return {sinif:'Veri Yok', cv:null, pd:null};
    const cv = Math.sqrt(seri.reduce((a,b)=>a+(b-ort)**2,0)/seri.length)/ort;
    const pd = Math.max(...seri)/Math.max(Math.min(...nz),1);
    return { sinif: cv<0.35 ? 'Evergreen' : (pd>=20||cv>=1.0) ? 'Spike' : 'Seasonal',
             cv:+cv.toFixed(3), pd:+pd.toFixed(1) };
  }
  const peakIdx = seri => (seri||[]).indexOf(Math.max(...(seri||[0])));

  // ——— faset filtresi ———
  function uygula(rows, f, arama){
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

  // ——— renk ———
  const lerp = (a,b,t) => Math.round(a+(b-a)*t);
  function hmColor(t){
    t = Math.max(0, Math.min(1, t));
    if(t<0.5){ const k=t*2; return `rgb(${lerp(230,251,k)},${lerp(124,188,k)},${lerp(115,4,k)})`; }
    const k=(t-0.5)*2; return `rgb(${lerp(251,87,k)},${lerp(188,187,k)},${lerp(4,138,k)})`;
  }
  const hmText = t => (t>0.75||t<0.25) ? 'white' : '#10332F';

  // Tableau 10 colorblind-safe — grup renk atamaları için
  const PALET = ['#4E79A7','#F28E2B','#E15759','#76B7B2','#59A14F',
                 '#EDC948','#B07AA1','#FF9DA7','#9C755F','#BAB0AC'];
  function renkAta(adlar){
    const m = {};
    adlar.forEach((a,i)=>{ m[a] = PALET[i % PALET.length]; });
    return m;
  }
  const SINIF_RENK = {Evergreen:'#2E7D32', Seasonal:'#F5A623', Spike:'#D32F2F', 'Veri Yok':'#8A8A8A'};
  const HAK_RENK   = {'TV+ Var':'#2E7D32', 'TV+ Yok':'#D32F2F', 'Doğrulanacak':'#F5A623', 'Kısmi':'#B07AA1'};

  // ——— sparkline path ———
  function sparkPath(values, w, h, pad=1){
    if(!values || !values.length) return {line:'',area:'',min:0,max:0};
    const min=Math.min(...values), max=Math.max(...values), range=max-min||1, n=values.length;
    const xs = values.map((_,i)=> pad + (i*(w-2*pad))/Math.max(n-1,1));
    const ys = values.map(v => pad + (h-2*pad) - ((v-min)/range)*(h-2*pad));
    const line = 'M'+xs.map((x,i)=>`${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' L');
    return { line, area: line+` L${xs[n-1].toFixed(1)},${h-pad} L${xs[0].toFixed(1)},${h-pad} Z`, min, max };
  }

  // ——— CSV ———
  function toCSV(rows, headers){
    const esc = v => { if(v==null) return ''; const s=String(v);
      return /[;"\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };
    return [headers.map(h=>esc(h.label)).join(';'),
      ...rows.map(r=>headers.map(h=>esc(typeof h.get==='function'?h.get(r):r[h.key])).join(';'))].join('\n');
  }
  function downloadCSV(name, csv){
    const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 500);
  }
  function debounce(fn, ms=150){ let t; return (...a)=>{clearTimeout(t); t=setTimeout(()=>fn(...a),ms);}; }
  const quarterName = i => 'Q'+(Math.floor(i/3)+1);

  // ——— gruplama (grup kartlarına tıklanınca detay için) ———
  function grupla(rows, alan){
    const m = new Map();
    for(const k of rows){
      const v = k[alan]; if(v===undefined || v==='') continue;
      if(!m.has(v)) m.set(v, {ad:v, alan, hacim:0, kw:0, satirlar:[], seri:new Array(N()).fill(0)});
      const g = m.get(v); g.hacim += k.sv||0; g.kw++; g.satirlar.push(k);
      for(let i=0;i<N();i++) g.seri[i] += (k.seri && k.seri[i])||0;
    }
    const toplam = rows.reduce((a,k)=>a+(k.sv||0),0) || 1;
    return [...m.values()].map(g=>{
      const s = siniflandir(g.seri);
      return {...g, ...s, pay:g.hacim/toplam, peakIdx:peakIdx(g.seri),
              peak:AYLAR[peakIdx(g.seri)]||null, trend:donemsel(g.seri)};
    }).sort((a,b)=>b.hacim-a.hacim);
  }

  return {
    D, META, AYLAR, AY_ETIKET, TR_MONTHS, TR_MONTHS_LONG, ymLabel,
    fmtNum, fmtFull, fmtPct, trendClass, serialToMonthIdx,
    aggregate, sum, donemsel, siniflandir, peakIdx, uygula, grupla,
    hmColor, hmText, PALET, renkAta, SINIF_RENK, HAK_RENK,
    sparkPath, toCSV, downloadCSV, debounce, quarterName,
    aggregateMonthly: aggregate,
  };
})();

window.U = (function () {
  const D = window.DATA || {};
  const AY = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

  function fmt(n){
    if(n==null||isNaN(n)) return '–';
    n=Math.round(n);
    if(Math.abs(n)>=1e6) return (n/1e6).toFixed(Math.abs(n)%1e6===0?0:1).replace('.',',')+'M';
    if(Math.abs(n)>=1e3) return (n/1e3).toFixed(Math.abs(n)%1e3===0?0:1).replace('.',',')+'K';
    return String(n);
  }
  const tam = n => (n==null||isNaN(n)) ? '–' : Math.round(n).toLocaleString('tr-TR');
  function pct(v,d=1){ if(v==null||isNaN(v)) return '–';
    return (v>0?'+':'')+ (v*100).toFixed(d).replace('.',',')+'%'; }
  function ayEtiket(ym){ if(!ym) return '–';
    const [y,m]=String(ym).split('-'); return AY[+m-1]+" '"+String(y).slice(2); }

  // Aylık seriyi toplayarak birleştir
  function topla(satirlar){
    const n=(D.meta&&D.meta.aylar||[]).length, out=new Array(n).fill(0);
    for(const k of satirlar) for(let i=0;i<n;i++) out[i]+=(k.seri&&k.seri[i])||0;
    return out;
  }
  const hacim = rows => rows.reduce((a,k)=>a+(k.sv||0),0);

  // Faset filtresi: {alan: [degerler]} — bos dizi = filtre yok
  function uygula(rows, f, arama){
    let out = rows;
    for(const [alan,degerler] of Object.entries(f||{})){
      if(!degerler || !degerler.length) continue;
      const s=new Set(degerler);
      out = out.filter(r => s.has(r[alan]));
    }
    if(arama && arama.trim()){
      const q=arama.trim().toLowerCase();
      out = out.filter(r => r.kw.includes(q));
    }
    return out;
  }

  const SINIF_RENK = { 'Evergreen':'#2E7D32', 'Seasonal':'#F5A623', 'Spike':'#D32F2F', 'Veri Yok':'#8A8A8A' };
  function heatRenk(t){
    t=Math.max(0,Math.min(1,t));
    const L=(a,b,k)=>Math.round(a+(b-a)*k);
    if(t<0.5){const k=t*2; return `rgb(${L(240,255,k)},${L(243,201,k)},${L(238,0,k)})`;}
    const k=(t-.5)*2; return `rgb(${L(255,232,k)},${L(201,95,k)},${L(0,54,k)})`;
  }

  function csvIndir(rows, kolonlar, adi){
    const esc = v => { v=(v==null?'':String(v)); return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
    const head = kolonlar.map(c=>esc(c.baslik)).join(';');
    const body = rows.map(r=>kolonlar.map(c=>esc(typeof c.al==='function'?c.al(r):r[c.al])).join(';'));
    const blob = new Blob(['﻿'+[head,...body].join('\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=adi; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);
  }
  return { fmt, tam, pct, ayEtiket, topla, hacim, uygula, SINIF_RENK, heatRenk, csvIndir, AY };
})();

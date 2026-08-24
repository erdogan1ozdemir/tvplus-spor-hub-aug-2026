// TV+ Spor Talep Haritası — sekmeler
window.TABS = (function(){
  const h = React.createElement;
  const C = window.C;
  const { fmtNum, fmtFull, fmtPct, AYLAR, AY_ETIKET, grupla, aggregate, sum,
          siniflandir, peakIdx, SINIF_RENK, HAK_RENK, renkAta, toCSV, downloadCSV } = U;
  const D = () => window.DATA;
  const META = () => window.DATA.meta;

  // ——— yıl serileri: 2024 / 2025 / 2026 ayrı çizgiler ———
  const YIL_RENK = { '2024':'#9C9C9C', '2025':'#4E79A7', '2026':'#FAD604' };
  function yilSerileri(seri){
    const aylar = AYLAR, out = {};
    aylar.forEach((ym,i) => {
      const y = ym.slice(0,4), m = Number(ym.slice(5,7))-1;
      (out[y] = out[y] || new Array(12).fill(null))[m] = seri[i]||0;
    });
    return Object.keys(out).sort().map(y => ({
      name: y, color: YIL_RENK[y] || 'var(--accent)', values: out[y],
      peakIdx: out[y].indexOf(Math.max(...out[y].filter(v=>v!=null)))
    }));
  }
  // Ay bazlı toplam (yıllar üstü) — donut / polar için
  function ayToplam(seri){
    const out = new Array(12).fill(0);
    AYLAR.forEach((ym,i)=>{ out[Number(ym.slice(5,7))-1] += seri[i]||0; });
    return out;
  }
  function ceyrekToplam(seri){
    const a = ayToplam(seri), q=[0,0,0,0];
    a.forEach((v,i)=>{ q[Math.floor(i/3)] += v; });
    return q;
  }

  const YoY = ({v, tip}) => h(C.YoYPill, {yoy:v, type:'YoY', tip});

  function Kaynak({ek}){
    return h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:10}},
      'Kaynak: ' + META().kaynak + ' · Pencere: ' + AY_ETIKET[0] + ' – ' + AY_ETIKET[AY_ETIKET.length-1] +
      (ek ? ' · ' + ek : ''));
  }

  // ——— ortak: gruplanabilir eksen seçenekleri ———
  const EKSENLER = [
    ['spor','Spor Dalı'], ['org','Organizasyon'], ['st','Sayfa Tipi'], ['it','Intent'],
    ['ent','Varlık Tipi'], ['hak','Yayın Hakkı'], ['mus','Müsabaka Tipi'], ['sev','Lig Seviyesi'],
    ['cins','Cinsiyet'], ['cog','Coğrafya'], ['per','Periyodiklik'], ['tak','Takvim Tipi'],
    ['turk','Türk Bağlantısı'], ['pres','Prestij Katmanı'], ['sinif','Sezonsallık'],
    ['bant','Hacim Bandı'], ['ktm','Katman'], ['uzn','Sorgu Uzunluğu'], ['dil','Dil'],
  ];

  // ═══════════════════════════════════ ÖZET
  function OzetTab({rows, setKeywordModal, onNavigateGrup, onNavigateKw, viewMode}){
    const toplam = sum(rows);
    const seri = aggregate(rows);
    const sporG = grupla(rows,'spor'), stG = grupla(rows,'st'), hakG = grupla(rows,'hak');
    const sinifG = grupla(rows,'sinif'), orgG = grupla(rows,'org');
    const dn = siniflandir(seri);
    const izleme = rows.filter(r=>r.it==='İzleme');
    const veri = rows.filter(r=>r.st==='Puan Durumu'||r.st==='Fikstür');
    const M = META();
    // toplam YoY
    const yilT = {}; AYLAR.forEach((ym,i)=>{ const y=ym.slice(0,4); yilT[y]=(yilT[y]||0)+seri[i]; });
    const yillar = Object.keys(yilT).sort();
    const tamY = yillar.filter(y=>AYLAR.filter(a=>a.startsWith(y)).length===12);
    let toplamYoY=null, ytdYoY=null;
    if(tamY.length>=2){ const a=yilT[tamY[tamY.length-2]], b=yilT[tamY[tamY.length-1]];
      if(a) toplamYoY=(b-a)/a; }
    const sonY = yillar[yillar.length-1], oncY = yillar[yillar.length-2];
    const sonAy = AYLAR.filter(a=>a.startsWith(sonY)).length;
    if(oncY && sonAy<12){
      const bu = seri.filter((_,i)=>AYLAR[i].startsWith(sonY)).reduce((a,b)=>a+b,0);
      const gecen = seri.filter((_,i)=>AYLAR[i].startsWith(oncY)).slice(0,sonAy).reduce((a,b)=>a+b,0);
      if(gecen) ytdYoY=(bu-gecen)/gecen;
    }
    const sporRenk = renkAta(sporG.map(g=>g.ad));
    const ayT = ayToplam(seri);

    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Bu pano neyi gösteriyor?', sub:'veri kaynağı, dönem ve okuma notu',
        emoji:'📡', defaultOpen:false},
        h('p',null,'Türkiye spor arama talebi ', h('strong',null, M.toplamKeyword.toLocaleString('tr-TR')),
          ' keyword üzerinden, ', h('strong',null, AYLAR.length + ' aylık'),
          ' pencerede (', AY_ETIKET[0], ' – ', AY_ETIKET[AY_ETIKET.length-1],
          ') haritalanmıştır. Hacimler yalnızca DataForSEO kaynaklıdır.'),
        h('p',null,'Her keyword satırı 26 faset özniteliği taşır; üstteki filtrelerle herhangi bir ' +
          'kombinasyonda yeniden gruplanabilir. Rakip markalı sorgular (beIN, Mackolik, Sofascore ve ' +
          'benzeri) jenerik toplamdan çıkarılmıştır; TFF ve TJK gibi resmi kurumlar jenerik sayılır.'),
        h('p',null, h('strong',null,'Okuma notu: '),
          'Puan durumu ve fikstür sorgularının cevabı Google\'ın kendi spor bileşeni tarafından ' +
          'verilmektedir; bu ailede organik tıklama oranı düşük kalmaktadır. İzleme intent\'i ise ' +
          'bileşen tarafından bastırılmamaktadır.')),

      // KPI şeridi
      h('div',{className:'grid grid-kpi'},
        h(C.Kpi,{label:'Toplam Aylık Talep', value:fmtNum(toplam),
          sub: M.toplamKeyword.toLocaleString('tr-TR')+' keyword', accent:true}),
        h(C.Kpi,{label:'Takvim YoY', value: toplamYoY==null?'–':fmtPct(toplamYoY,1),
          sub: tamY.length>=2 ? tamY[tamY.length-2]+' → '+tamY[tamY.length-1] : 'yeterli tam yıl yok',
          chip: toplamYoY==null?null:(toplamYoY>0?'artış':'daralma'),
          chipClass: toplamYoY==null?'neu':(toplamYoY>0?'pos':'neg')}),
        h(C.Kpi,{label:'YTD YoY', value: ytdYoY==null?'–':fmtPct(ytdYoY,1),
          sub: ytdYoY==null?'–':`${sonY} ilk ${sonAy} ay vs ${oncY}`,
          chip: ytdYoY==null?null:(ytdYoY>0?'artış':'daralma'),
          chipClass: ytdYoY==null?'neu':(ytdYoY>0?'pos':'neg')}),
        h(C.Kpi,{label:'İzleme Intent\'i', value:fmtNum(sum(izleme)),
          sub:'TV+\'ın doğal alanı · '+izleme.length+' keyword'}),
        h(C.Kpi,{label:'Veri Sayfası Talebi', value:fmtNum(sum(veri)),
          sub:'Google bileşeni cevabı veriyor'}),
        h(C.Kpi,{label:'Talep Şekli', value:dn.sinif,
          sub: dn.cv!=null ? `CV ${dn.cv} · peak/dip ${dn.pd}` : null})
      ),

      // Yıl bazlı çizgi
      h(C.SectionHeader,{icon:'📈', title:'Yıl bazlı talep seyri',
        desc:'2024, 2025 ve 2026 aynı takvim ekseninde; sezon başlangıcı ve zirve noktaları karşılaştırılabilir'}),
      h('div',{className:'card'},
        h(C.LineChart,{series: yilSerileri(seri), height:250, labels:U.TR_MONTHS,
          yFormat:fmtNum, legend:true}),
        h(Kaynak,{})),

      // Ay dağılımı: donut + polar
      h(C.SectionHeader,{icon:'🗓', title:'Ay ve çeyrek dağılımı',
        desc:'talebin yıl içinde nasıl dağıldığı · dilime gelin, pay ve hacim görünür'}),
      h('div',{className:'grid grid-2'},
        h('div',{className:'card'},
          h('h3',{style:{fontSize:14,marginBottom:2}},'Çeyrek payı'),
          h('div',{className:'txt-3',style:{fontSize:11,marginBottom:12}},'tüm yılların toplamı'),
          h('div',{style:{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}},
            h(C.Donut,{size:190, data: ceyrekToplam(seri).map((v,i)=>({
              label:['Q1 (Oca-Mar)','Q2 (Nis-Haz)','Q3 (Tem-Eyl)','Q4 (Eki-Ara)'][i],
              value:v, color:['#4E79A7','#59A14F','#EDC948','#E15759'][i]}))}),
            h('div',{style:{flex:1,minWidth:150}},
              h(C.ShareBars,{rows: ceyrekToplam(seri).map((v,i)=>({
                label:['Q1','Q2','Q3','Q4'][i], value:v, share:v/(toplam||1),
                color:['#4E79A7','#59A14F','#EDC948','#E15759'][i]}))})))),
        h('div',{className:'card'},
          h('h3',{style:{fontSize:14,marginBottom:2}},'Aylık zirve haritası'),
          h('div',{className:'txt-3',style:{fontSize:11,marginBottom:12}},'dilim uzunluğu aylık hacmi gösterir'),
          h('div',{style:{display:'grid',placeItems:'center'}},
            h(C.PolarPeak,{values: ayT, size:270, color:'var(--accent)',
              monthsLabels:U.TR_MONTHS})))),

      // Spor dalı — tıklanabilir
      h(C.SectionHeader,{icon:'🏆', title:'Spor dalı dağılımı',
        desc:'karta tıklayın, o spor dalının detay sayfası açılır',
        actions: h(C.ChartActions,{csv:()=>toCSV(sporG,[{label:'Spor Dalı',key:'ad'},
          {label:'Aylık Hacim',key:'hacim'},{label:'Keyword',key:'kw'},
          {label:'YoY',get:r=>r.yoy==null?'':fmtPct(r.yoy,1)}]),
          onCsv:c=>downloadCSV('tvplus-spor-dali.csv',c)})}),
      h('div',{className:'card'},
        h(C.SmallMultiples,{items: sporG.slice(0,12).map(g=>({
          label:g.ad, color:sporRenk[g.ad], values:ayToplam(g.seri), yoy:g.yoy})),
          monthsLabels:U.TR_MONTHS,
          onClick: it => onNavigateGrup('spor', it.label)})),

      // Sayfa tipi + yayın hakkı
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',{className:'card'},
          h('h3',{style:{fontSize:14,marginBottom:2}},'Sayfa tipi'),
          h('div',{className:'txt-3',style:{fontSize:11,marginBottom:12}},'satıra tıklayın, detaya gider'),
          h('div',null, stG.slice(0,10).map(g => h('div',{key:g.ad,
            className:'share-row clickable', style:{cursor:'pointer',padding:'6px 4px',borderRadius:6},
            onClick:()=>onNavigateGrup('st', g.ad)},
            h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}},
              h('span',{style:{fontWeight:600}}, g.ad),
              h('span',null, h('span',{className:'num',style:{fontWeight:600}}, fmtFull(g.hacim)),
                g.yoy!=null && h('span',{style:{marginLeft:8}}, h(YoY,{v:g.yoy})))),
            h('div',{className:'tree-bar'},
              h('div',{className:'fill',style:{width:(100*g.hacim/(stG[0]?.hacim||1))+'%'}})))))),
        h('div',{className:'card'},
          h('h3',{style:{fontSize:14,marginBottom:2}},'Yayın hakkı kırılımı'),
          h('div',{className:'txt-3',style:{fontSize:11,marginBottom:12}},'TV+ portföyü karşısında talep'),
          h(C.ShareBars,{rows: hakG.map(g=>({label:g.ad, value:g.hacim, share:g.pay,
            yoy:g.yoy, color:HAK_RENK[g.ad]||'var(--accent)'}))}))),

      // Organizasyon tablosu
      h(C.SectionHeader,{icon:'📋', title:'En yüksek talepli organizasyonlar',
        desc:'satıra tıklayın, o organizasyonun detayı açılır'}),
      h(GrupTablo,{gruplar:orgG.slice(0,20), alan:'org', onNavigateGrup, baslik:'Organizasyon'}),
      h(Kaynak,{})
    );
  }

  // ═══════════════════════════════════ ortak grup tablosu
  function GrupTablo({gruplar, alan, onNavigateGrup, baslik='Grup', limit=200}){
    const [sira,setSira] = React.useState({k:'hacim',y:-1});
    const veri = React.useMemo(()=>{
      const s=[...gruplar];
      s.sort((a,b)=>{ const x=a[sira.k], y=b[sira.k];
        if(typeof x==='number'&&typeof y==='number') return (x-y)*sira.y;
        return String(x??'').localeCompare(String(y??''),'tr')*sira.y; });
      return s;
    },[gruplar,sira]);
    const th = (id,lab,num) => h('th',{key:id, className:num?'num':'', style:{cursor:'pointer'},
      onClick:()=>setSira(s=>({k:id, y:s.k===id?-s.y:-1}))},
      lab, sira.k===id ? (sira.y===-1?' ↓':' ↑') : '');
    return h('div',{className:'tbl-wrap'},
      h('table',null,
        h('thead',null,h('tr',null,
          th('ad',baslik), th('hacim','Aylık Hacim',true), th('kw','Keyword',true),
          th('pay','Pay',true), th('yoy','YoY',true), th('sinif','Talep Şekli'),
          th('peak','Peak Ay'), h('th',{key:'sp'},'Aylık Seyir'))),
        h('tbody',null, veri.slice(0,limit).map(g=>h('tr',{key:g.ad,
          className:'clickable', style:{cursor:'pointer'},
          onClick:()=>onNavigateGrup && onNavigateGrup(alan, g.ad)},
          h('td',null,h('span',{style:{fontWeight:600}},g.ad)),
          h('td',{className:'num'},h('strong',null,fmtFull(g.hacim))),
          h('td',{className:'num'},g.kw.toLocaleString('tr-TR')),
          h('td',{className:'num'},(g.pay*100).toFixed(1).replace('.',',')+'%'),
          h('td',{className:'num'},h(YoY,{v:g.yoy})),
          h('td',null,h('span',{style:{color:SINIF_RENK[g.sinif],fontWeight:600}},g.sinif)),
          h('td',null, g.peak ? U.ymLabel(g.peak) : '–'),
          h('td',null,h(C.Sparkline,{values:g.seri, w:110, h:26,
            color:SINIF_RENK[g.sinif]||'var(--accent)'}))))))
    );
  }

  // ═══════════════════════════════════ GRUPLAR (kırılım ekseni seçilebilir)
  function GruplarTab({rows, onNavigateGrup, onNavigateKw, drill, setDrill}){
    const [eksen,setEksen] = React.useState('org');
    const g = grupla(rows, eksen);
    const renk = renkAta(g.map(x=>x.ad));
    const secili = drill && drill.alan===eksen ? g.find(x=>x.ad===drill.deger) : null;

    return h('div',{className:'tab-content-anim'},
      h('div',{className:'filter-panel', style:{marginBottom:16}},
        h('div',{className:'filter-panel-label'},h('strong',null,'Kırılım ekseni')),
        h(C.MultiSelect,{label:'Eksen', options:EKSENLER.map(e=>e[1]),
          selected:[EKSENLER.find(e=>e[0]===eksen)[1]],
          onChange:(sel)=>{ const e=EKSENLER.find(x=>x[1]===sel[sel.length-1]);
            if(e){ setEksen(e[0]); setDrill(null); } }, width:210}),
        h('div',{style:{marginLeft:'auto'}},
          h(C.ChartActions,{csv:()=>toCSV(g,[{label:'Grup',key:'ad'},{label:'Aylık Hacim',key:'hacim'},
            {label:'Keyword',key:'kw'},{label:'Pay',get:r=>(r.pay*100).toFixed(2)},
            {label:'YoY',get:r=>r.yoy==null?'':(r.yoy*100).toFixed(1)},
            {label:'Talep Şekli',key:'sinif'},{label:'Peak Ay',get:r=>U.ymLabel(r.peak)}]),
            onCsv:c=>downloadCSV(`tvplus-${eksen}.csv`,c)}))),

      secili && h('div',{className:'card', style:{marginBottom:18, borderColor:'var(--accent)'}},
        h('div',{style:{display:'flex',alignItems:'center',gap:12,marginBottom:10}},
          h('h3',{style:{fontSize:17,flex:1}}, secili.ad),
          h(YoY,{v:secili.yoy}),
          h('button',{className:'chip-btn', onClick:()=>setDrill(null)},'× Kapat')),
        h('div',{className:'grid grid-kpi', style:{marginBottom:14}},
          h(C.Kpi,{label:'Aylık Hacim', value:fmtNum(secili.hacim), sub:secili.kw+' keyword', accent:true}),
          h(C.Kpi,{label:'Toplam Pay', value:(secili.pay*100).toFixed(1).replace('.',',')+'%'}),
          h(C.Kpi,{label:'Talep Şekli', value:secili.sinif,
            sub:`CV ${secili.cv} · peak/dip ${secili.pd}`}),
          h(C.Kpi,{label:'Peak Ay', value:U.ymLabel(secili.peak)})),
        h(C.LineChart,{series:yilSerileri(secili.seri), height:210, labels:U.TR_MONTHS,
          yFormat:fmtNum, legend:true}),
        h('div',{style:{marginTop:14}},
          h('div',{className:'txt-3',style:{fontSize:11,marginBottom:8}},'En yüksek 10 keyword'),
          h(KeywordTablo,{rows:secili.satirlar.slice(0,10), limit:10,
            setKeywordModal:()=>{}, kompakt:true})),
        h('button',{className:'chip-btn', style:{marginTop:12},
          onClick:()=>onNavigateKw({alan:eksen, deger:secili.ad})},
          'Bu grubun tüm keyword\'lerini gör →')),

      h(C.SectionHeader,{icon:'🔥', title:'Isı matrisi',
        desc:'satır = grup, sütun = ay · hücreye gelin, yıl ve YoY değerleri görünür'}),
      h('div',{className:'card'},
        h(C.Heatmap,{rows: g.slice(0,16).map(x=>({
          label:x.ad, sub:fmtNum(x.hacim), values:ayToplam(x.seri),
          peakIdx: ayToplam(x.seri).indexOf(Math.max(...ayToplam(x.seri)))})),
          monthsLabels:U.TR_MONTHS, showValues:true,
          onClickCell:(row)=>onNavigateGrup(eksen,row.label)})),

      h(C.SectionHeader,{icon:'📊', title:'Tam liste', desc:'satıra tıklayın, grubun detayı açılır'}),
      h(GrupTablo,{gruplar:g, alan:eksen, onNavigateGrup,
        baslik:EKSENLER.find(e=>e[0]===eksen)[1]}),
      h(Kaynak,{})
    );
  }

  // ═══════════════════════════════════ keyword tablosu (paylaşılan)
  function KeywordTablo({rows, limit=200, setKeywordModal, kompakt}){
    const [sira,setSira] = React.useState({k:'sv',y:-1});
    const veri = React.useMemo(()=>{
      const s=[...rows];
      s.sort((a,b)=>{ const x=a[sira.k], y=b[sira.k];
        if(typeof x==='number'&&typeof y==='number') return ((x||0)-(y||0))*sira.y;
        return String(x??'').localeCompare(String(y??''),'tr')*sira.y; });
      return s;
    },[rows,sira]);
    const th=(id,lab,num)=>h('th',{key:id,className:num?'num':'',style:{cursor:'pointer'},
      onClick:()=>setSira(s=>({k:id,y:s.k===id?-s.y:-1}))},lab,sira.k===id?(sira.y===-1?' ↓':' ↑'):'');
    if(!rows.length) return h(C.EmptyState,{icon:'🔍', title:'Kayıt bulunamadı',
      desc:'Seçili filtrelerle eşleşen keyword yok. Filtreleri gevşetebilirsiniz.'});
    return h('div',{className:'tbl-wrap'},
      h('table',null,
        h('thead',null,h('tr',null,
          th('kw','Keyword'), th('sv','Aylık Hacim',true), th('yoy','YoY',true),
          !kompakt && th('org','Organizasyon'), !kompakt && th('st','Sayfa Tipi'),
          !kompakt && th('hak','Yayın Hakkı'), th('sinif','Talep Şekli'),
          th('peak','Peak Ay'), h('th',{key:'sp'},'Aylık Seyir'))),
        h('tbody',null, veri.slice(0,limit).map(r=>h('tr',{key:r.kw},
          h('td',null,h('button',{className:'kw-link',
            onClick:()=>setKeywordModal(r)}, r.kw)),
          h('td',{className:'num'},h('strong',null,fmtFull(r.sv))),
          h('td',{className:'num'},h(YoY,{v:r.yoy})),
          !kompakt && h('td',null,r.org||'–'),
          !kompakt && h('td',null,r.st||'–'),
          !kompakt && h('td',null, r.hak ? h('span',{className:'pill '+
            (r.hak==='TV+ Var'?'pos':r.hak==='TV+ Yok'?'neg':'neu')}, r.hak) : '–'),
          h('td',null,h('span',{style:{color:SINIF_RENK[r.sinif],fontWeight:600}},r.sinif)),
          h('td',null,r.peak?U.ymLabel(r.peak):'–'),
          h('td',null,h(C.Sparkline,{values:r.seri,w:110,h:26,
            color:SINIF_RENK[r.sinif]||'var(--accent)'}))))),
      ),
      veri.length>limit && h('div',{className:'txt-3',style:{padding:'12px',textAlign:'center',fontSize:12}},
        (veri.length-limit).toLocaleString('tr-TR')+' kayıt daha var · filtreleri daraltabilirsiniz')
    );
  }

  // ═══════════════════════════════════ KEYWORD
  function KeywordTab({rows, setKeywordModal, initialFilter, clearInitialFilter}){
    React.useEffect(()=>{ if(initialFilter) clearInitialFilter && clearInitialFilter(); },[]);
    return h('div',{className:'tab-content-anim'},
      h(C.SectionHeader,{icon:'🔑', title:'Keyword listesi',
        desc: rows.length.toLocaleString('tr-TR')+' keyword · '+fmtNum(sum(rows))+' aylık talep · keyword\'e tıklayın, detay açılır',
        actions: h(C.ChartActions,{csv:()=>toCSV(rows,[
          {label:'Keyword',key:'kw'},{label:'Aylık Hacim',key:'sv'},
          {label:'YoY',get:r=>r.yoy==null?'':(r.yoy*100).toFixed(1)},
          {label:'Organizasyon',key:'org'},{label:'Spor Dalı',key:'spor'},
          {label:'Sayfa Tipi',key:'st'},{label:'Intent',key:'it'},{label:'Varlık',key:'ent'},
          {label:'Yayın Hakkı',key:'hak'},{label:'Talep Şekli',key:'sinif'},
          {label:'Peak Ay',get:r=>U.ymLabel(r.peak)}]),
          onCsv:c=>downloadCSV('tvplus-keyword.csv',c)})}),
      h(KeywordTablo,{rows, limit:200, setKeywordModal}),
      h(Kaynak,{}));
  }

  // ═══════════════════════════════════ TRENDLER (YoY temelli)
  function TrendlerTab({rows, setKeywordModal, onNavigateGrup}){
    const yoyVar = rows.filter(r=>r.yoy!=null && r.sv>=1000);
    const yukselen = [...yoyVar].sort((a,b)=>b.yoy-a.yoy).slice(0,25);
    const dusen    = [...yoyVar].sort((a,b)=>a.yoy-b.yoy).slice(0,25);
    const sinifG   = grupla(rows,'sinif');
    const sporG    = grupla(rows,'spor').filter(g=>g.yoy!=null);
    const seri     = aggregate(rows);
    const peakDag  = (()=>{ const m={}; rows.forEach(r=>{ if(!r.peak) return;
      const ay=Number(r.peak.slice(5,7))-1; m[ay]=(m[ay]||0)+r.sv; });
      return U.TR_MONTHS.map((l,i)=>({label:l, value:m[i]||0})); })();

    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Sezonsallık nasıl sınıflandırılıyor?', emoji:'🌡',
        sub:'CV ve peak/dip oranı eşikleri'},
        h('p',null,'Değişkenlik katsayısı (CV) 0.35 altındaki seriler ',
          h('strong',null,'Evergreen'),', peak/dip oranı 20 ve üzeri veya CV 1.0 ve üzeri olanlar ',
          h('strong',null,'Spike'),', kalanlar ', h('strong',null,'Seasonal'),' olarak etiketlenir.'),
        h('p',null,'YoY karşılaştırması son iki tam takvim yılı üzerinden hesaplanır. ' +
          'Kısmi yıl için ayrıca YTD karşılaştırması üretilir.')),

      h('div',{className:'grid grid-kpi'},
        sinifG.map(s=>h(C.Kpi,{key:s.ad, label:s.ad, value:fmtNum(s.hacim),
          sub:`${s.kw.toLocaleString('tr-TR')} keyword · %${(s.pay*100).toFixed(1)}`,
          chip: s.yoy==null?null:fmtPct(s.yoy,0),
          chipClass: s.yoy==null?'neu':(s.yoy>0?'pos':'neg')}))),

      h(C.SectionHeader,{icon:'📅', title:'Peak ay dağılımı',
        desc:'talebin hangi ayda zirve yaptığı · çubuğa gelin, hacim görünür'}),
      h('div',{className:'card'},
        h(C.BarChart,{data:peakDag, height:220, yFormat:fmtNum, colorBy:'flat'})),

      h(C.SectionHeader,{icon:'⚖️', title:'Spor dalı bazında YoY',
        desc:'çubuğa tıklayın, o spor dalının detayına gidersiniz'}),
      h('div',{className:'card'},
        h(C.BarChart,{data: sporG.slice(0,12).map(g=>({label:g.ad, value:g.yoy})),
          height:230, yFormat:v=>fmtPct(v,0), colorBy:'yoy',
          onBarClick: d => onNavigateGrup('spor', d.label)})),

      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',null,
          h(C.SectionHeader,{icon:'🚀', title:'Yükselen keyword\'ler',
            desc:'YoY artışı en yüksek · aylık 1.000+ hacim'}),
          h(KeywordTablo,{rows:yukselen, limit:25, setKeywordModal, kompakt:true})),
        h('div',null,
          h(C.SectionHeader,{icon:'📉', title:'Gerileyen keyword\'ler',
            desc:'YoY daralması en yüksek · aylık 1.000+ hacim'}),
          h(KeywordTablo,{rows:dusen, limit:25, setKeywordModal, kompakt:true}))),
      h(Kaynak,{}));
  }

  // ═══════════════════════════════════ SAYFA TİPİ & INTENT
  function SayfaTipiTab({rows, setKeywordModal, onNavigateGrup}){
    const stG = grupla(rows,'st'), itG = grupla(rows,'it'), entG = grupla(rows,'ent');
    const izleme = rows.filter(r=>r.it==='İzleme');
    const veri = rows.filter(r=>['Puan Durumu','Fikstür','Maç/Skor'].includes(r.st));
    const stRenk = renkAta(stG.map(g=>g.ad));
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Sayfa tipi neden kritik?', emoji:'🧭',
        sub:'Google spor bileşeninin CTR üzerindeki etkisi'},
        h('p',null,'Puan durumu ve fikstür sorgularında Google, tam cevabı kendi spor bileşeninde ' +
          'verir. Bu ailede organik tıklama oranı, pozisyondan bağımsız olarak düşük kalmaktadır.'),
        h('p',null,'İzleme intent\'inde ("canlı izle", "nerede izlenir", "hangi kanalda") ise bileşen ' +
          'devreye girmez ve SERP doğrudan web sonuçlarıyla başlar. Yayın hakkı sahibi bir platform ' +
          'için bu aile doğal üstünlük alanıdır.')),
      h('div',{className:'grid grid-kpi'},
        h(C.Kpi,{label:'İzleme Intent\'i', value:fmtNum(sum(izleme)), accent:true,
          sub:izleme.length+' keyword · bileşen bastırmıyor'}),
        h(C.Kpi,{label:'Veri Sayfası Talebi', value:fmtNum(sum(veri)),
          sub:'bileşen cevabı veriyor'}),
        h(C.Kpi,{label:'Bilgi Intent\'i', value:fmtNum(sum(rows.filter(r=>r.it==='Bilgi')))}),
        h(C.Kpi,{label:'Ticari Intent', value:fmtNum(sum(rows.filter(r=>r.it==='Ticari')))})),
      h(C.SectionHeader,{icon:'🗂', title:'Sayfa tipi kırılımı', desc:'karta tıklayın, detay açılır'}),
      h('div',{className:'card'},
        h(C.SmallMultiples,{items: stG.slice(0,12).map(g=>({label:g.ad, color:stRenk[g.ad],
          values:ayToplam(g.seri), yoy:g.yoy})), monthsLabels:U.TR_MONTHS,
          onClick: it => onNavigateGrup('st', it.label)})),
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',{className:'card'},
          h('h3',{style:{fontSize:14,marginBottom:12}},'Intent katmanı'),
          h(C.ShareBars,{rows:itG.map(g=>({label:g.ad, value:g.hacim, share:g.pay, yoy:g.yoy}))})),
        h('div',{className:'card'},
          h('h3',{style:{fontSize:14,marginBottom:12}},'Varlık tipi'),
          h(C.ShareBars,{rows:entG.map(g=>({label:g.ad, value:g.hacim, share:g.pay, yoy:g.yoy}))}))),
      h(C.SectionHeader,{icon:'▶️', title:'İzleme intent\'i · en yüksek talep',
        desc:'TV+ için öncelikli sayfa alanı'}),
      h(KeywordTablo,{rows:[...izleme].sort((a,b)=>b.sv-a.sv).slice(0,40), limit:40, setKeywordModal}),
      h(Kaynak,{}));
  }

  // ═══════════════════════════════════ TAKIM & OYUNCU
  function EntityTab({rows, setKeywordModal, onNavigateGrup, onNavigateKw}){
    const tipler = [...new Set(rows.map(r=>r.ent).filter(Boolean))];
    const [tip,setTip] = React.useState(tipler.includes('Takım')?'Takım':tipler[0]);
    const veri = rows.filter(r=>r.ent===tip);
    const ktmG = grupla(veri,'ktm');
    const orgG = grupla(veri,'org');
    return h('div',{className:'tab-content-anim'},
      h('div',{className:'filter-panel', style:{marginBottom:16}},
        h('div',{className:'filter-panel-label'},h('strong',null,'Varlık tipi')),
        h(C.MultiSelect,{label:'Tip', options:tipler, selected:[tip],
          onChange:sel=>sel.length&&setTip(sel[sel.length-1]), width:190}),
        h('div',{style:{marginLeft:16,fontSize:12.5,color:'var(--ink-2)'}},
          h('strong',null, veri.length.toLocaleString('tr-TR')), ' keyword · ',
          h('strong',null, fmtNum(sum(veri))), ' aylık')),
      ktmG.length>1 && h(React.Fragment,null,
        h(C.SectionHeader,{icon:'🎚', title:'Katman dağılımı',
          desc:'çekirdek evren ile uzun kuyruk karşılaştırması'}),
        h('div',{className:'card'},
          h(C.ShareBars,{rows:ktmG.map(g=>({label:g.ad, value:g.hacim, share:g.pay, yoy:g.yoy}))}))),
      h(C.SectionHeader,{icon:'🏟', title:tip+' · organizasyon kırılımı',
        desc:'satıra tıklayın, organizasyon detayı açılır'}),
      h(GrupTablo,{gruplar:orgG.slice(0,20), alan:'org', onNavigateGrup, baslik:'Organizasyon'}),
      h(C.SectionHeader,{icon:'📇', title:tip+' talebi', desc:'en yüksek 80'}),
      h(KeywordTablo,{rows:[...veri].sort((a,b)=>b.sv-a.sv).slice(0,80), limit:80, setKeywordModal}),
      h(Kaynak,{}));
  }

  // ═══════════════════════════════════ YAYIN HAKKI DIŞI
  function HakDisiTab({rows, setKeywordModal, onNavigateGrup}){
    const disi = rows.filter(r=>r.hak==='TV+ Yok');
    const orgG = grupla(disi,'org');
    const toplam = sum(rows)||1;
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Bu havuz neden önemli?', emoji:'🔓',
        sub:'veri sayfaları yayın hakkı gerektirmez'},
        h('p',null,'Puan durumu ve fikstür gibi veri sayfaları yayın hakkı gerektirmemektedir. ' +
          'Bu havuz, hakkı bulunmayan organizasyonlarda dahi veri sayfası üzerinden trafik çekip ' +
          'yayın hakkı olan içeriğe köprü kurma fırsatı olarak değerlendirilebilir.'),
        h('p',null,'Öte yandan bu sorguların büyük bölümü Google\'ın spor bileşeni tarafından ' +
          'karşılandığından, tıklama beklentisi ölçülü tutulmalıdır.')),
      h('div',{className:'grid grid-kpi'},
        h(C.Kpi,{label:'Yayın Hakkı Dışı Talep', value:fmtNum(sum(disi)), accent:true,
          sub:`toplam talebin %${(100*sum(disi)/toplam).toFixed(1)}'i`}),
        h(C.Kpi,{label:'Kapsanan Organizasyon', value:orgG.length}),
        h(C.Kpi,{label:'Keyword', value:disi.length.toLocaleString('tr-TR')}),
        h(C.Kpi,{label:'İzleme Talebi', value:fmtNum(sum(disi.filter(r=>r.it==='İzleme')))})),
      h(C.SectionHeader,{icon:'📡', title:'Hakkı olmayan organizasyonlar',
        desc:'talep büyüklüğüne göre · satıra tıklayın'}),
      h(GrupTablo,{gruplar:orgG, alan:'org', onNavigateGrup, baslik:'Organizasyon'}),
      h(C.SectionHeader,{icon:'🔑', title:'En yüksek talepli keyword\'ler'}),
      h(KeywordTablo,{rows:[...disi].sort((a,b)=>b.sv-a.sv).slice(0,50), limit:50, setKeywordModal}),
      h(Kaynak,{}));
  }

  // ═══════════════════════════════════ KARAR AĞACI
  function kararVer(o){
    if(o.hak==='TV+ Yok')
      return o.hacim>=500000
        ? {karar:'Veri Sayfası', tone:'neu', gerekce:'Yayın hakkı bulunmuyor ancak talep çok yüksek. Puan durumu ve fikstür sayfaları hak gerektirmediğinden köprü kurgusu değerlendirilebilir.'}
        : {karar:'Şimdilik Değil', tone:'neu', gerekce:'Yayın hakkı bulunmuyor ve talep büyüklüğü ayrı sayfa yatırımını gerektirecek seviyede değil.'};
    if(o.hacim<20000)
      return {karar:'Şimdilik Değil', tone:'neu', gerekce:'Talep hacmi ayrı sayfa seti için sınırlı kalmaktadır. Takip listesinde tutulabilir.'};
    if(o.sinif==='Spike' && o.altPay<0.12)
      return {karar:'Etkinlik Ölçekli', tone:'neu', gerekce:'Talep tek bir pencereye yığılıyor ve alt sayfa derinliği düşük. Aktif dönemde derinleşen, sezon dışında sadeleşen yapı uygundur.'};
    if(o.altPay>=0.12 && o.hacim>=100000)
      return {karar:'Hub', tone:'pos', gerekce:'Hem yüksek talep hem alt sayfa derinliği mevcut. Puan durumu, fikstür, takım ve oyuncu katmanı birlikte kurulabilir.'};
    return {karar:'Landing', tone:'pos', gerekce:'Talep anlamlı ancak alt sayfa derinliği sınırlı. Tek güçlü sayfa üzerinde izleme intent\'ine odaklanılabilir.'};
  }

  function KararTab({rows, onNavigateGrup}){
    const orgRows = React.useMemo(()=>{
      const g = grupla(rows,'org');
      return g.map(x=>{
        const alt = sum(x.satirlar.filter(k=>['Puan Durumu','Fikstür','Kadro','İstatistik'].includes(k.st)));
        const izl = sum(x.satirlar.filter(k=>k.it==='İzleme'));
        const hak = (x.satirlar.find(k=>k.hak)||{}).hak || 'Doğrulanacak';
        const o = {...x, altPay: x.hacim ? alt/x.hacim : 0, izleme:izl, hak};
        return {...o, ...kararVer(o)};
      });
    },[rows]);
    const kovalar=['Hub','Landing','Etkinlik Ölçekli','Veri Sayfası','Şimdilik Değil'];
    const KOVA_RENK={'Hub':'#2E7D32','Landing':'#4E79A7','Etkinlik Ölçekli':'#F5A623',
                     'Veri Sayfası':'#B07AA1','Şimdilik Değil':'#9C9C9C'};
    const dagilim = kovalar.map(k=>({label:k, value:orgRows.filter(o=>o.karar===k)
      .reduce((a,o)=>a+o.hacim,0), color:KOVA_RENK[k]}));

    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Karar çerçevesi nasıl işliyor?', emoji:'🧩',
        sub:'dört eksende puanlama ve beş kova', defaultOpen:true},
        h('p',null,'Her organizasyon dört eksende değerlendirilir: ',
          h('strong',null,'aylık talep büyüklüğü'),', ', h('strong',null,'talep şekli'),
          ' (Evergreen / Seasonal / Spike), ', h('strong',null,'alt sayfa derinliği'),
          ' (puan durumu, fikstür, kadro ve istatistik sorgularının organizasyon talebi içindeki payı) ve ',
          h('strong',null,'yayın hakkı durumu'),'.'),
        h('p',null,'Eşikler veriye göre kalibre edilmiştir ve marka tarafının stratejik ' +
          'önceliklerine göre güncellenebilir.')),

      h('div',{className:'grid grid-kpi'},
        kovalar.map(k=>{ const s=orgRows.filter(o=>o.karar===k);
          return h(C.Kpi,{key:k, label:k, value:s.length,
            sub:fmtNum(s.reduce((a,o)=>a+o.hacim,0))+' aylık talep'}); })),

      h(C.SectionHeader,{icon:'🥧', title:'Karar dağılımı',
        desc:'talep büyüklüğüne göre kovaların payı'}),
      h('div',{className:'card'},
        h('div',{style:{display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}},
          h(C.Donut,{size:200, data:dagilim}),
          h('div',{style:{flex:1,minWidth:220}},
            h(C.ShareBars,{rows:dagilim.map(d=>({label:d.label, value:d.value, color:d.color}))})))),

      h(C.SectionHeader,{icon:'📌', title:'Organizasyon bazlı karar tablosu',
        desc:'satıra tıklayın, organizasyon detayı açılır',
        actions: h(C.ChartActions,{csv:()=>toCSV(orgRows,[{label:'Organizasyon',key:'ad'},
          {label:'Öneri',key:'karar'},{label:'Aylık Hacim',key:'hacim'},
          {label:'YoY',get:r=>r.yoy==null?'':(r.yoy*100).toFixed(1)},
          {label:'Talep Şekli',key:'sinif'},
          {label:'Alt Sayfa Payı',get:r=>(r.altPay*100).toFixed(1)},
          {label:'İzleme Talebi',key:'izleme'},{label:'Yayın Hakkı',key:'hak'},
          {label:'Peak Ay',get:r=>U.ymLabel(r.peak)},{label:'Gerekçe',key:'gerekce'}]),
          onCsv:c=>downloadCSV('tvplus-karar.csv',c)})}),
      h('div',{className:'tbl-wrap'},
        h('table',null,
          h('thead',null,h('tr',null,
            h('th',null,'Organizasyon'), h('th',null,'Öneri'),
            h('th',{className:'num'},'Aylık Hacim'), h('th',{className:'num'},'YoY'),
            h('th',null,'Talep Şekli'), h('th',{className:'num'},'Alt Sayfa Payı'),
            h('th',{className:'num'},'İzleme'), h('th',null,'Yayın Hakkı'),
            h('th',null,'Peak Ay'), h('th',null,'Aylık Seyir'))),
          h('tbody',null, orgRows.map(o=>h('tr',{key:o.ad, className:'clickable',
            style:{cursor:'pointer'}, onClick:()=>onNavigateGrup('org',o.ad)},
            h('td',null,h('span',{style:{fontWeight:600}},o.ad)),
            h('td',null,h('span',{className:'pill '+o.tone,
              style:{background:`color-mix(in srgb, ${KOVA_RENK[o.karar]} 16%, transparent)`,
                     color:KOVA_RENK[o.karar], fontWeight:600}}, o.karar)),
            h('td',{className:'num'},h('strong',null,fmtFull(o.hacim))),
            h('td',{className:'num'},h(YoY,{v:o.yoy})),
            h('td',null,h('span',{style:{color:SINIF_RENK[o.sinif],fontWeight:600}},o.sinif)),
            h('td',{className:'num'},'%'+(o.altPay*100).toFixed(1)),
            h('td',{className:'num'},fmtNum(o.izleme)),
            h('td',null,h('span',{className:'pill '+(o.hak==='TV+ Var'?'pos':o.hak==='TV+ Yok'?'neg':'neu')},o.hak)),
            h('td',null,o.peak?U.ymLabel(o.peak):'–'),
            h('td',null,h(C.Sparkline,{values:o.seri,w:110,h:26,
              color:KOVA_RENK[o.karar]}))))))),

      h(C.SectionHeader,{icon:'💬', title:'Gerekçeler', desc:'talep büyüklüğüne göre ilk 12'}),
      h('div',{className:'grid grid-2'},
        orgRows.slice(0,12).map(o=>h('div',{className:'card', key:o.ad,
          style:{cursor:'pointer'}, onClick:()=>onNavigateGrup('org',o.ad)},
          h('div',{style:{display:'flex',gap:8,alignItems:'center',marginBottom:6}},
            h('h3',{style:{flex:1,fontSize:15}},o.ad),
            h('span',{className:'pill', style:{background:`color-mix(in srgb, ${KOVA_RENK[o.karar]} 16%, transparent)`,
              color:KOVA_RENK[o.karar], fontWeight:600}}, o.karar)),
          h('div',{className:'txt-3',style:{fontSize:11,marginBottom:8}},
            fmtFull(o.hacim)+' aylık · '+o.sinif+' · alt sayfa payı %'+(o.altPay*100).toFixed(1)),
          h('div',{style:{fontSize:12.5,color:'var(--ink-2)',lineHeight:1.5}},o.gerekce)))),
      h(Kaynak,{}));
  }

  // ═══════════════════════════════════ MASTER LİSTE
  function MasterTab({rows}){
    const M = META();
    const KOLONLAR = [
      {label:'Keyword',key:'kw'},{label:'Aylık Ortalama Hacim',key:'sv'},{label:'Hacim Bandı',key:'bant'},
      {label:'YoY (takvim)',get:r=>r.yoy==null?'':(r.yoy*100).toFixed(1)},
      {label:'YoY (YTD)',get:r=>r.yoyYtd==null?'':(r.yoyYtd*100).toFixed(1)},
      {label:'YoY (rolling 12 ay)',get:r=>r.yoyR==null?'':(r.yoyR*100).toFixed(1)},
      {label:'Son 12 Ay',key:'r12'},{label:'Önceki 12 Ay',key:'p12'},
      {label:'Organizasyon',key:'org'},{label:'Spor Dalı',key:'spor'},{label:'Müsabaka Tipi',key:'mus'},
      {label:'Lig Seviyesi',key:'sev'},{label:'Prestij Katmanı',key:'pres'},{label:'Cinsiyet',key:'cins'},
      {label:'Kulüp/Milli',key:'km'},{label:'Takım/Bireysel',key:'tb'},{label:'Coğrafya',key:'cog'},
      {label:'Yerlilik',key:'yer'},{label:'Türk Bağlantısı',key:'turk'},{label:'Yayın Hakkı',key:'hak'},
      {label:'Periyodiklik',key:'per'},{label:'Takvim Tipi',key:'tak'},{label:'Sayfa Tipi',key:'st'},
      {label:'Intent',key:'it'},{label:'Varlık Tipi',key:'ent'},{label:'Marka Tipi',key:'marka'},
      {label:'Kurum Sorgusu',key:'kurum'},{label:'Dil',key:'dil'},{label:'Sorgu Uzunluğu',key:'uzn'},
      {label:'Katman',key:'ktm'},{label:'Kulüp Doğrulama',key:'dog'},{label:'Oyuncu Doğrulama',key:'oyuncu_dogrulama'},
      {label:'Talep Şekli',key:'sinif'},{label:'CV',key:'cv'},{label:'Peak/Dip',key:'pd'},
      {label:'Peak Ay',get:r=>U.ymLabel(r.peak)},{label:'Dip Ay',get:r=>U.ymLabel(r.dip)},
      ...AYLAR.map((m,i)=>({label:m, get:r=>r.seri[i]}))
    ];
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Master liste', emoji:'📦', defaultOpen:true,
        sub:`${rows.length.toLocaleString('tr-TR')} satır · ${KOLONLAR.length} kolon`},
        h('p',null,'Filtrelenmiş liste, tüm faset öznitelikleri, YoY hesaplamaları ve ',
          h('strong',null, AYLAR.length+' aylık'),' ham seriyle birlikte indirilebilir.'),
        h('p',null,'Kaynak: ', M.kaynak, ' · Pencere: ', AY_ETIKET[0], ' – ',
          AY_ETIKET[AY_ETIKET.length-1], '.')),
      h('div',{className:'filter-panel', style:{marginBottom:16}},
        h('div',{style:{fontSize:12.5}},
          h('strong',null, rows.length.toLocaleString('tr-TR')), ' satır · ',
          h('strong',null, KOLONLAR.length), ' kolon · ',
          h('strong',null, AYLAR.length), ' aylık veri noktası'),
        h('button',{className:'chip-btn active', style:{marginLeft:'auto'},
          onClick:()=>downloadCSV(`tvplus-spor-master-${M.olusturma}.csv`, toCSV(rows,KOLONLAR))},
          '⬇ Master listeyi CSV indir')),
      h(C.SectionHeader,{icon:'👁', title:'Önizleme', desc:'ilk 60 satır'}),
      h(KeywordTablo,{rows, limit:60, setKeywordModal:()=>{}}),
      h(Kaynak,{}));
  }

  // ═══════════════════════════════════ KEYWORD MODAL
  function KeywordModal({kw, onClose}){
    const M = META();
    const FAS = [['org','Organizasyon'],['spor','Spor Dalı'],['mus','Müsabaka Tipi'],
      ['sev','Lig Seviyesi'],['pres','Prestij'],['cins','Cinsiyet'],['km','Kulüp/Milli'],
      ['tb','Takım/Bireysel'],['cog','Coğrafya'],['yer','Yerlilik'],['turk','Türk Bağlantısı'],
      ['hak','Yayın Hakkı'],['per','Periyodiklik'],['tak','Takvim Tipi'],['st','Sayfa Tipi'],
      ['it','Intent'],['ent','Varlık Tipi'],['marka','Marka Tipi'],['kurum','Kurum Sorgusu'],
      ['dil','Dil'],['uzn','Sorgu Uzunluğu'],['ktm','Katman'],['dog','Kulüp Doğrulama'],
      ['oyuncu_dogrulama','Oyuncu Doğrulama'],['kulup','Kulüp']];
    const ayT = ayToplam(kw.seri);
    return h(C.Modal,{onClose},
      h('h2',{style:{fontSize:20,marginBottom:4}}, kw.kw),
      h('div',{className:'txt-3', style:{fontSize:11.5, marginBottom:16}},
        'Pencere: '+AY_ETIKET[0]+' – '+AY_ETIKET[AY_ETIKET.length-1]+' · Kaynak: '+M.kaynak),
      h('div',{className:'grid grid-kpi', style:{marginBottom:16}},
        h(C.Kpi,{label:'Aylık Ortalama', value:fmtFull(kw.sv), sub:kw.bant, accent:true}),
        h(C.Kpi,{label:'Takvim YoY', value: kw.yoy==null?'–':fmtPct(kw.yoy,1),
          chip: kw.yoy==null?null:(kw.yoy>0?'artış':'daralma'),
          chipClass: kw.yoy==null?'neu':(kw.yoy>0?'pos':'neg')}),
        h(C.Kpi,{label:'YTD YoY', value: kw.yoyYtd==null?'–':fmtPct(kw.yoyYtd,1)}),
        h(C.Kpi,{label:'Talep Şekli', value:kw.sinif,
          sub: kw.cv!=null ? `CV ${kw.cv} · peak/dip ${kw.pd}` : null})),
      h('h4',{style:{fontSize:13,margin:'4px 0 8px'}},'Yıl bazlı seyir'),
      h('div',{className:'card', style:{padding:12, marginBottom:14}},
        h(C.LineChart,{series:yilSerileri(kw.seri), height:200, labels:U.TR_MONTHS,
          yFormat:fmtNum, legend:true})),
      h('h4',{style:{fontSize:13,margin:'4px 0 8px'}},'Ay bazlı ısı haritası'),
      h(C.Heatmap,{rows:[{label:'Toplam', values:ayT}], monthsLabels:U.TR_MONTHS, showValues:true}),
      h('h4',{style:{fontSize:13,margin:'18px 0 8px'}},'Faset öznitelikleri'),
      h('div',{style:{display:'flex',flexWrap:'wrap',gap:6}},
        FAS.map(([k,l]) => kw[k] ? h('span',{key:k, className:'chip neu',
          style:{fontSize:11}}, h('strong',null,l+': '), kw[k]) : null)),
      kw.r12!=null && h('div',{style:{marginTop:16,fontSize:12,color:'var(--ink-2)'}},
        'Son 12 ay: ', h('strong',null,fmtFull(kw.r12)),
        ' · Önceki 12 ay: ', h('strong',null,fmtFull(kw.p12)),
        kw.yoyR!=null && h(React.Fragment,null,' · Rolling YoY: ',
          h('strong',{style:{color:kw.yoyR>0?'var(--green)':'var(--red)'}}, fmtPct(kw.yoyR,1))))
    );
  }

  return { OzetTab, GruplarTab, KeywordTab, TrendlerTab, SayfaTipiTab, EntityTab,
           HakDisiTab, KararTab, MasterTab, KeywordModal, EKSENLER, KeywordTablo, GrupTablo };
})();

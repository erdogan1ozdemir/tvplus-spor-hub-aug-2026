// TV+ Spor Talep Haritası — kök uygulama
(function(){
  const h = React.createElement;
  const C = window.C, T = window.TABS;
  const B = window.BRAND || {};
  const SLUG = (B.slug||'dash').replace(/[^a-z0-9-]/gi,'').toLowerCase();
  const K = n => SLUG+'.'+n;
  const { fmtNum, FACET_ETIKET, applyFacets, TR_MONTHS, ROLLING_LABELS, qLabel } = U;

  const SEKMELER = [
    {id:'ozet',    label:'Özet',                Comp:T.OzetTab},
    {id:'gruplar', label:'Gruplar',             Comp:T.GruplarTab},
    {id:'entity',  label:'Takım & Oyuncu',      Comp:T.EntityTab,
      rozet:r=>fmtNum(r.filter(k=>k.ent==='Takım'||k.ent==='Oyuncu').length)},
    {id:'keyword', label:'Keyword',             Comp:T.KeywordTab, rozet:r=>fmtNum(r.length)},
    {id:'kirilim', label:'Kırılım',             Comp:T.KirilimTab},
    {id:'karar',   label:'Karar Ağacı',         Comp:T.KararTab},
    {id:'sayfa',   label:'Sayfa Tipi & Intent', Comp:T.SayfaTipiTab},
    {id:'trendler',label:'Trendler',            Comp:T.TrendlerTab},
    {id:'hakdisi', label:'Yayın Hakkı Dışı',    Comp:T.HakDisiTab,
      rozet:r=>fmtNum(r.filter(k=>k.hak==='TV+ Yok').length)},
    {id:'master',  label:'Master Liste',        Comp:T.MasterTab},
  ];

  // Birincil kırılım fasetleri (kademeli)
  const BIRINCIL = [['spor','Spor Dalı',175],['org','Organizasyon',200],['takim','Takım',175],
                    ['st','Sayfa Tipi',170],['ent','Varlık Tipi',150]];
  // Ek analitik fasetler
  const EK = [['it','Intent',150],['hak','Yayın Hakkı',165],['mus','Müsabaka Tipi',175],
              ['guncel','Eşleşme Güncelliği',185],
              ['cins','Cinsiyet',140],['sev','Lig Seviyesi',160],['cog','Coğrafya',150],
              ['ktm','Katman',145],['turk','Türk Bağlantısı',175]];

  function App(){
    const D = window.DATA, M = D.meta;
    const [tab, setTab] = React.useState(() =>
      (location.hash.replace('#','').split('/')[0]) || localStorage.getItem(K('tab')) || 'ozet');
    const [filtre, setFiltre] = React.useState(()=>{
      try{ return JSON.parse(localStorage.getItem(K('filtre')))||{}; }catch{ return {}; }});
    const [arama, setArama] = React.useState('');
    const [peakAy, setPeakAy] = React.useState([]);
    const [peakCeyrek, setPeakCeyrek] = React.useState([]);
    const [mevsim, setMevsim] = React.useState([]);
    const [bucket, setBucket] = React.useState([]);
    const [trend, setTrend] = React.useState('');           // '' | Yükselen | Stabil | Düşen
    const [viewMode, setViewMode] = React.useState(()=>
      localStorage.getItem(K('viewMode'))==='calendar' ? 'calendar' : 'rolling');
    const [ekAcik, setEkAcik] = React.useState(false);
    const [secili, setSecili] = React.useState(null);
    // Sekmeler arası akan görünüm state'i: bir sekmede seçilen kırılım ve
    // varlık daralması diğer sekmelerde de geçerli olur.
    const [seviye, setSeviye] = React.useState('org');
    // Varlık tipi tek yerde tutulur: global filtre. Daha önce matristeki
    // seçici yerel bir duruma yazıyordu; çip üretmiyor, yalnızca o tabloyu
    // daraltıyor ve satır tıklamasından farklı davranıyordu.
    const entFiltre = (filtre.ent && filtre.ent.length === 1) ? filtre.ent[0] : '';
    const setEntFiltre = React.useCallback(
      v => setFiltre(f => ({...f, ent: v ? [v] : []})), []);
    const [peakGizli, setPeakGizli] = React.useState(false);
    const [keywordModal, setKeywordModal] = React.useState(null);
    const [scrolled, setScrolled] = React.useState(false);
    // Kırılım yolu: Özet'te hangi kapsamda olunduğunu tutar.
    // Adres çubuğunda "#ozet/Futbol|Süper Lig" biçiminde saklanır ki
    // görünüm paylaşılabilsin ve yenilemede korunsun.
    const [yol, setYol] = React.useState(()=>{
      const p = (location.hash.replace('#','').split('/')[1]||'');
      if(!p) return [];
      return decodeURIComponent(p).split('|').filter(Boolean)
        .map((deger,i)=>({eksen:['spor','org','takim','st'][i]||'st', deger}));
    });

    // Rapor nötr palette açılır; yalnızca açık/koyu tema seçilebilir.
    const [tema, setTema] = React.useState(()=>
      localStorage.getItem(K('tema'))==='dark' ? 'dark' : 'light');

    React.useEffect(()=>{ localStorage.setItem(K('tab'), tab);
      const iz = yol.length ? '/'+encodeURIComponent(yol.map(a=>a.deger).join('|')) : '';
      const hedef = tab + iz;
      if(location.hash.replace('#','')!==hedef)
        history.replaceState(null,'',location.pathname+location.search+'#'+hedef); },[tab, yol]);
    React.useEffect(()=>{ localStorage.setItem(K('filtre'), JSON.stringify(filtre)); },[filtre]);
    React.useEffect(()=>{ localStorage.setItem(K('viewMode'), viewMode); },[viewMode]);
    React.useEffect(()=>{
      document.documentElement.dataset.theme = tema;
      document.documentElement.dataset.palette = 'neutral';
      localStorage.setItem(K('tema'), tema); },[tema]);
    React.useEffect(()=>{
      if(window.BRAND_ACCENT) document.documentElement.style.setProperty('--brand-accent', window.BRAND_ACCENT);
      const onS=()=>setScrolled(window.scrollY>150);
      const onH=()=>{
        const [t,p] = location.hash.replace('#','').split('/');
        setTab(t||'ozet');
        setYol(!p ? [] : decodeURIComponent(p).split('|').filter(Boolean)
          .map((deger,i)=>({eksen:['spor','org','takim','st'][i]||'st', deger})));
      };
      window.addEventListener('scroll',onS,{passive:true});
      window.addEventListener('hashchange',onH);
      return ()=>{window.removeEventListener('scroll',onS); window.removeEventListener('hashchange',onH);};
    },[]);

    // Kademeli seçenekler
    const secenekler = React.useMemo(()=>{
      const out={};
      for(const [alan] of [...BIRINCIL, ...EK]){
        const diger={...filtre}; delete diger[alan];
        const alt=applyFacets(D.keywords, diger, null);
        out[alan]=[...new Set(alt.map(k=>k[alan]).filter(Boolean))]
          .sort((a,b)=>String(a).localeCompare(String(b),'tr'));
      }
      return out;
    },[filtre]);

    const rows = React.useMemo(()=>{
      let r = applyFacets(D.keywords, filtre, arama);
      if(peakAy.length){
        const s=new Set(peakAy);
        r = r.filter(k=>{ const seri=U.rollingOf(k);
          // Tümü sıfır olan seride peak ayı yoktur; indexOf(max) 0 döndürüp
          // hacimsiz satırları ilk ayın kovasına doldururdu.
          const i = (seri.length && Math.max(...seri) > 0) ? seri.indexOf(Math.max(...seri)) : -1;
          return i>=0 && s.has(ROLLING_LABELS[i]); });
      }
      if(peakCeyrek.length){
        const s=new Set(peakCeyrek);
        // Rolling görünümde pencere çeyreği (rpq), takvim görünümünde
        // takvim çeyreği (pq) esas alınır.
        r = r.filter(k=>{ const dizi = viewMode==='calendar' ? k.pq : k.rpq;
          return s.has(qLabel((dizi||[]).indexOf(1), viewMode)); });
      }
      if(mevsim.length){ const s=new Set(mevsim); r=r.filter(k=>s.has(k.sinif)); }
      if(bucket.length){ const s=new Set(bucket); r=r.filter(k=>s.has(k.bucket)); }
      if(trend) r = r.filter(k=>k.trend===trend);
      return r;
    },[filtre, arama, peakAy, peakCeyrek, mevsim, bucket, trend]);

    // Kırılım kapsamı ve aktif eksen burada hesaplanır; hem görünüm satırındaki
    // iz şeridi hem Özet aynı değerleri kullanır.
    const kapsamRows = React.useMemo(()=>T.yoluUygula(rows, yol), [rows, yol]);
    const aktifEksen = React.useMemo(()=>T.aktifEksen(kapsamRows, yol), [kapsamRows, yol]);
    const kapsamR12  = React.useMemo(
      ()=>kapsamRows.reduce((a,k)=>a+(k.r12||0),0), [kapsamRows]);

    const aktif = Object.values(filtre).reduce((a,v)=>a+(v?v.length:0),0)
      + peakAy.length + peakCeyrek.length + mevsim.length + bucket.length
      + (trend?1:0) + (arama?1:0);
    const temizle = ()=>{ setFiltre({}); setArama(''); setPeakAy([]); setPeakCeyrek([]);
      setMevsim([]); setBucket([]); setTrend(''); setSecili(null); setYol([]); };

    // Çubukta rozet olarak gösterilecek seçili filtreler.
    // Her rozet kendi alanını temizler; "Temizle" hepsini birden alır.
    const aktifCipler = React.useMemo(function(){
      const out = [];
      for(const [alan, lab] of [...BIRINCIL, ...EK]){
        const sel = filtre[alan] || [];
        if(sel.length) out.push({id:alan, lab, sel,
          sil:()=>setFiltre(f=>({...f, [alan]:[]}))});
      }
      const ozel = [['peakAy','Peak Ay',peakAy,setPeakAy],
                    ['peakCeyrek','Peak Çeyrek',peakCeyrek,setPeakCeyrek],
                    ['mevsim','Mevsim Tipi',mevsim,setMevsim],
                    ['bucket','Hacim Aralığı',bucket,setBucket]];
      for(const [id, lab, deger, setter] of ozel){
        if(deger && deger.length) out.push({id, lab, sel:deger, sil:()=>setter([])});
      }
      return out;
    }, [filtre, peakAy, peakCeyrek, mevsim, bucket]);

    const onSelectGroup = (alan, deger) => {
      setSecili({alan, deger});
      setSeviye(alan);
      setFiltre(f=>({...f,[alan]:[deger]}));
      setTab('gruplar'); window.scrollTo({top:0, behavior:'smooth'});
    };
    const onNavigateKw = ctx => {
      if(ctx&&ctx.alan) setFiltre(f=>({...f,[ctx.alan]:[ctx.deger]}));
      setTab('keyword'); window.scrollTo({top:0, behavior:'smooth'});
    };
    // Kırılım yolu zaten tüm sekmelerin kapsamı olduğu için sekme
    // değiştirmek yeni bir filtre kurmayı gerektirmez, kapsam taşınır.
    const gitSekme = id => { setTab(id); window.scrollTo({top:0, behavior:'smooth'}); };

    const S = SEKMELER.find(s=>s.id===tab) || SEKMELER[0];
    // Kırılım yolu tüm sekmelerin kapsamıdır: Özet'te "Dövüş Sporları ›
    // Taekwondo" seçiliyse Keyword ve Takım & Oyuncu da o kapsamı gösterir.
    // İz şeridinden bir adım geri alınarak her yerde birlikte kaldırılır.
    const ortak = { rows: kapsamRows, tumRows: rows, viewMode, setKeywordModal,
      onSelectGroup, onNavigateKw, gitSekme, secili, setSecili, seviye, setSeviye,
      entFiltre, setEntFiltre, peakGizli, setPeakGizli, yol, setYol };

    return h('div',{className:'app'},
      h('div',{className:'topbar'},
        h('div',{className:'logo'},
          B.logo && h('img',{src:B.logo, alt:B.name, className:'brand-logo'}),
          h('div',{className:'title-block'},
            B.subtitle && h('div',{className:'subtitle'}, B.subtitle),
            h('div',{className:'title'}, B.title))),
        h('div',{className:'spacer'}),
        h('div',{className:'inbound-brand'},
          h('div',{className:'inbound-ctrls'},
            h('button',{className:'ctrl inbound-ctrl',
              onClick:()=>setTema(t=>t==='dark'?'light':'dark')},
              tema==='dark'?'Açık tema':'Koyu tema')),
          h('div',{className:'inbound-logo-wrap'},
            h('img',{src:'assets/inbound-logo.png', alt:'Inbound', style:{height:20, display:'block'}}),
            h('div',{style:{fontSize:8, letterSpacing:'.18em', textTransform:'uppercase',
              color:'rgba(255,255,255,.75)', marginTop:3, textAlign:'center', fontWeight:700}},
              'Inbound SEO')))),

      h('div',{className:'tabs'},
        SEKMELER.map(s=>h('button',{key:s.id, className:'tab'+(tab===s.id?' active':''),
          onClick:()=>setTab(s.id)}, s.label,
          s.rozet && h('span',{className:'badge'}, s.rozet(kapsamRows))))),

      h('div',{className:'global-filter-wrap'+(scrolled?' scrolled':'')},
        // Varyant C: tüm faset seçicileri tek "Filtrele" düğmesinin altına iner.
        // Çubukta yalnızca arama, düğme ve seçili filtrelerin rozeti kalır.
        h('div',{className:'filter-panel filtre-serit'},
          h('div',{className:'ara-sarmal'},
            h('span',{className:'ara-ikon'}, h(C.Ikon,{ad:'ara', size:13})),
            h('input',{type:'text', className:'search-input', placeholder:'Keyword ara…',
              value:arama, onChange:e=>setArama(e.target.value)}),
            arama && h('button',{className:'ara-temizle', onClick:()=>setArama(''),
              'aria-label':'Aramayı temizle'}, '×')),

          h('button',{className:'chip-btn'+(ekAcik?' active':''),
            onClick:()=>setEkAcik(o=>!o),
            'aria-expanded': ekAcik ? 'true' : 'false',
            'data-tip': ekAcik ? 'Filtre panelini kapat' : 'Tüm filtreleri aç'},
            h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'filtre', size:13})),
            'Filtrele',
            aktifCipler.length>0 && h('span',{className:'btn-sayac'}, aktifCipler.length),
            h('span',{className:'filtre-ok'}, ekAcik?'▴':'▾')),

          // Seçili filtreler rozet olarak çubukta kalır, tek tek kaldırılabilir
          aktifCipler.length>0 && h('div',{className:'filtre-cipler'},
            aktifCipler.map(c=>h('button',{key:c.id, className:'filtre-cip',
              onClick:c.sil, 'data-tip': c.sel.join(' · ')+' · kaldırmak için tıklayın'},
              h('span',{className:'cip-alan'}, c.lab),
              h('span',{className:'cip-deger'},
                c.sel.length===1 ? c.sel[0] : c.sel.length+' seçili'),
              h('span',{className:'cip-sil'},'×')))),

          aktif>0 && h('button',{className:'chip-btn sessiz filtre-temizle', onClick:temizle},
            h('span',{className:'btn-ikon'}, h(C.Ikon,{ad:'kapat', size:12})),
            'Temizle', h('span',{className:'btn-sayac'}, aktif))),

        ekAcik && h('div',{className:'filter-panel filtre-kutu', style:{marginTop:8}},
          h('div',{className:'filtre-grup'},
            h('div',{className:'filtre-grup-bas'},'Birincil kırılım'),
            h('div',{className:'filtre-grup-alan'},
              BIRINCIL.map(([alan,lab,w])=>(secenekler[alan]||[]).length>1 &&
                h(C.MultiSelect,{key:alan, label:lab, options:secenekler[alan], width:w,
                  selected:filtre[alan]||[], colorMap: alan==='spor'?window.SPOR_RENK:null,
                  onChange:sel=>setFiltre(f=>({...f,[alan]:sel}))})))),
          h('div',{className:'filtre-grup'},
            h('div',{className:'filtre-grup-bas'},'Sezonsallık ve hacim'),
            h('div',{className:'filtre-grup-alan'},
              h(C.MultiSelect,{label:'Peak Ay', options:ROLLING_LABELS, selected:peakAy,
                onChange:setPeakAy, width:155}),
              h(C.MultiSelect,{label:'Peak Çeyrek', options:U.quarterOptions(viewMode), selected:peakCeyrek,
                onChange:setPeakCeyrek, width:150}),
              h(C.MultiSelect,{label:'Mevsim Tipi', options:D.facetDegerleri.sinif||[], selected:mevsim,
                onChange:setMevsim, width:160}),
              h(C.MultiSelect,{label:'Hacim Aralığı', options:D.facetDegerleri.bucket||[], selected:bucket,
                onChange:setBucket, width:175}))),
          h('div',{className:'filtre-grup'},
            h('div',{className:'filtre-grup-bas'},'Ek analitik'),
            h('div',{className:'filtre-grup-alan'},
              EK.map(([alan,lab,w])=>(secenekler[alan]||[]).length>1 &&
                h(C.MultiSelect,{key:alan, label:lab, options:secenekler[alan], width:w,
                  selected:filtre[alan]||[], onChange:sel=>setFiltre(f=>({...f,[alan]:sel}))}))))),

        h('div',{className:'filter-panel', style:{marginTop:8}},
          h('div',{className:'filter-panel-label'}, h('span',{className:'txt-3'},'GÖRÜNÜM')),
          h('div',{className:'segmented', title:'Trend filtresi'},
            [['','Tüm Trend'],['Yükselen','↑ Yükselen'],['Stabil','→ Stabil'],['Düşen','↓ Düşen']]
              .map(([v,l])=>h('button',{key:v||'all', className: trend===v?'active':'',
                onClick:()=>setTrend(v)}, l))),
          h('div',{className:'segmented',
            title:`Rolling = Son 12 Ay (${ROLLING_LABELS[0]} – ${ROLLING_LABELS[11]}) vs Önceki 12 Ay · Takvim = ${M.yillar.join(' / ')} yıl çizgileri. Özet KPI ve YoY değerleri seçili görünüme göre hesaplanır; Yükselen ve Düşen sayıları her zaman rolling karşılaştırmadan gelir.`},
            h('button',{className: viewMode==='rolling'?'active':'',
              onClick:()=>setViewMode('rolling')},'Rolling 12 Ay'),
            h('button',{className: viewMode==='calendar'?'active':'',
              onClick:()=>setViewMode('calendar')},'Takvim Yılı')),
          // Kırılım şeridi görünüm satırının sağında durur: hangi kapsamdayız
          // sorusu görünüm ayarlarıyla aynı yerde cevaplanır.
          h('div',{className:'gorunum-sag'},
            h('span',{className:'txt-3', style:{fontSize:10.5}},
              'Son 12 Ay: ', ROLLING_LABELS[0], ' – ', ROLLING_LABELS[11]),
            h(T.IzSeridi,{yol, setYol,
              eksen: tab==='ozet' ? aktifEksen : null,
              kapsamHacim: kapsamR12}))),

        aktif>0 && h('div',{className:'filter-chips'},
          h('span',{className:'lbl'},'Seçili:'),
          Object.entries(filtre).flatMap(([alan,ds])=>(ds||[]).map(d=>
            h('button',{key:alan+d, className:'filter-chip',
              onClick:()=>setFiltre(f=>({...f,[alan]:f[alan].filter(x=>x!==d)}))},
              (FACET_ETIKET[alan]||alan)+': '+d, h('span',{className:'x'},'×')))),
          peakAy.map(p=>h('button',{key:'pa'+p, className:'filter-chip',
            onClick:()=>setPeakAy(a=>a.filter(x=>x!==p))},'Peak: '+p, h('span',{className:'x'},'×'))),
          peakCeyrek.map(p=>h('button',{key:'pc'+p, className:'filter-chip',
            onClick:()=>setPeakCeyrek(a=>a.filter(x=>x!==p))},'Çeyrek: '+p, h('span',{className:'x'},'×'))),
          mevsim.map(p=>h('button',{key:'mv'+p, className:'filter-chip',
            onClick:()=>setMevsim(a=>a.filter(x=>x!==p))}, p, h('span',{className:'x'},'×'))),
          bucket.map(p=>h('button',{key:'bk'+p, className:'filter-chip',
            onClick:()=>setBucket(a=>a.filter(x=>x!==p))}, p, h('span',{className:'x'},'×'))),
          trend && h('button',{className:'filter-chip', onClick:()=>setTrend('')},
            trend, h('span',{className:'x'},'×')),
          arama && h('button',{className:'filter-chip', onClick:()=>setArama('')},
            '"'+arama+'"', h('span',{className:'x'},'×')))),

      h('div',{className:'content'},
        rows.length===0
          ? h(C.EmptyState,{icon:'', title:'Sonuç bulunamadı',
              desc:'Seçili filtrelerle eşleşen keyword yok.', cta:'Filtreleri temizle', onCta:temizle})
          : h(S.Comp, ortak)),

      h('button',{className:'footer-logo-left', title:'Özet\'e dön',
        onClick:()=>{setTab('ozet'); window.scrollTo({top:0,behavior:'smooth'});}},
        h('img',{src:'assets/inbound-small-logo.png', alt:'Inbound',
          style:{height:18, display:'block', opacity:.85}})),
      h('div',{className:'page-footer'},
        h('button',{className:'scroll-top-btn', title:'En üste çık',
          onClick:()=>window.scrollTo({top:0,behavior:'smooth'})},'↑')),

      keywordModal && h(T.KeywordModal,{kw:keywordModal, viewMode, onClose:()=>setKeywordModal(null)})
    );
  }
  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();

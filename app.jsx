// TV+ Spor Talep Haritası — kök uygulama
(function(){
  const h = React.createElement;
  const C = window.C;
  const T = window.TABS;
  const B = window.BRAND || {};
  const SLUG = (B.slug || 'dash').replace(/[^a-z0-9-]/gi,'').toLowerCase();
  const K_TAB = SLUG+'.tab', K_TWEAK = SLUG+'.tweaks', K_FILTRE = SLUG+'.filtre';

  const TWEAK_DEFAULTS = {"theme":"light","palette":"tvplus","density":"comfortable"};

  const SEKMELER = [
    {id:'ozet',    label:'Özet',                   Comp:T.OzetTab},
    {id:'gruplar', label:'Gruplar',                Comp:T.GruplarTab},
    {id:'keyword', label:'Keyword',                Comp:T.KeywordTab},
    {id:'trendler',label:'Trendler & Sezonsallık', Comp:T.TrendlerTab},
    {id:'sayfa',   label:'Sayfa Tipi & Intent',    Comp:T.SayfaTipiTab},
    {id:'entity',  label:'Takım & Oyuncu',         Comp:T.EntityTab},
    {id:'hakdisi', label:'Yayın Hakkı Dışı',       Comp:T.HakDisiTab},
    {id:'karar',   label:'Karar Ağacı',            Comp:T.KararTab},
    {id:'master',  label:'Master Liste',           Comp:T.MasterTab},
  ];

  // Global filtrede gösterilecek birincil fasetler (kademeli)
  const BIRINCIL = [['spor','Spor Dalı',190], ['org','Organizasyon',220], ['st','Sayfa Tipi',180]];
  // İkincil analitik fasetler
  const IKINCIL  = [['ent','Varlık Tipi',160], ['it','Intent',150], ['hak','Yayın Hakkı',170],
                    ['sinif','Talep Şekli',160], ['bant','Hacim Bandı',170], ['cins','Cinsiyet',140],
                    ['mus','Müsabaka Tipi',180], ['ktm','Katman',150]];

  function App(){
    const D = window.DATA, M = D.meta;
    const [tab, setTab] = React.useState(() =>
      (location.hash.replace('#','').split('/')[0]) || localStorage.getItem(K_TAB) || 'ozet');
    const [filtre, setFiltre] = React.useState(() => {
      try { return JSON.parse(localStorage.getItem(K_FILTRE)) || {}; } catch { return {}; }
    });
    const [arama, setArama] = React.useState('');
    const [peakAy, setPeakAy] = React.useState([]);
    const [keywordModal, setKeywordModal] = React.useState(null);
    const [drill, setDrill] = React.useState(null);
    const [ikincilAcik, setIkincilAcik] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);
    const [tweaksOpen, setTweaksOpen] = React.useState(false);
    const [tweaks, setTweaks] = React.useState(() => {
      try { return {...TWEAK_DEFAULTS, ...JSON.parse(localStorage.getItem(K_TWEAK)||'{}')}; }
      catch { return TWEAK_DEFAULTS; }
    });

    React.useEffect(()=>{ localStorage.setItem(K_TAB, tab);
      if(location.hash.replace('#','') !== tab)
        history.replaceState(null,'', location.pathname+location.search+'#'+tab);
    },[tab]);
    React.useEffect(()=>{ localStorage.setItem(K_FILTRE, JSON.stringify(filtre)); },[filtre]);
    React.useEffect(()=>{
      document.documentElement.dataset.theme = tweaks.theme;
      document.documentElement.dataset.palette = tweaks.palette;
      localStorage.setItem(K_TWEAK, JSON.stringify(tweaks));
    },[tweaks]);
    React.useEffect(()=>{
      if(B.accent) document.documentElement.style.setProperty('--brand-accent', B.accent);
      const onS = () => setScrolled(window.scrollY > 150);
      const onH = () => setTab((location.hash.replace('#','').split('/')[0]) || 'ozet');
      window.addEventListener('scroll', onS, {passive:true});
      window.addEventListener('hashchange', onH);
      return ()=>{ window.removeEventListener('scroll',onS); window.removeEventListener('hashchange',onH); };
    },[]);

    // Kademeli seçenekler: üst faset seçiliyse alt fasetin seçenekleri daralır
    const secenekler = React.useMemo(()=>{
      const out = {};
      const tumFaset = [...BIRINCIL, ...IKINCIL].map(f=>f[0]);
      for(const alan of tumFaset){
        const digerFiltre = {...filtre}; delete digerFiltre[alan];
        const alt = U.uygula(D.keywords, digerFiltre, null);
        out[alan] = [...new Set(alt.map(k=>k[alan]).filter(Boolean))]
          .sort((a,b)=>String(a).localeCompare(String(b),'tr'));
      }
      return out;
    },[filtre]);

    const rows = React.useMemo(()=>{
      let r = U.uygula(D.keywords, filtre, arama);
      if(peakAy.length){
        const s = new Set(peakAy.map(l => U.TR_MONTHS.indexOf(l)));
        r = r.filter(k => k.peak && s.has(Number(k.peak.slice(5,7))-1));
      }
      return r;
    },[filtre, arama, peakAy]);

    const aktifSayi = Object.values(filtre).filter(v=>v&&v.length).reduce((a,v)=>a+v.length,0)
                    + peakAy.length + (arama?1:0);

    function tweakUygula(patch){ setTweaks(t=>({...t, ...patch})); }

    const onNavigateGrup = (alan, deger) => {
      setDrill({alan, deger});
      setFiltre(f => ({...f, [alan]: [deger]}));
      setTab('gruplar');
      window.scrollTo({top:0, behavior:'smooth'});
    };
    const onNavigateKw = (ctx) => {
      if(ctx && ctx.alan) setFiltre(f => ({...f, [ctx.alan]:[ctx.deger]}));
      setTab('keyword');
      window.scrollTo({top:0, behavior:'smooth'});
    };

    const Aktif = (SEKMELER.find(s=>s.id===tab) || SEKMELER[0]).Comp;
    const ortak = { rows, setKeywordModal, onNavigateGrup, onNavigateKw, drill, setDrill };

    return h('div',{className:'app'},
      // ——— Topbar ———
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
              onClick:()=>tweakUygula({theme: tweaks.theme==='dark'?'light':'dark'})},
              tweaks.theme==='dark' ? '☀ Light' : '☾ Dark'),
            h('button',{className:'ctrl inbound-ctrl'+(tweaksOpen?' active':''),
              onClick:()=>setTweaksOpen(o=>!o)}, '⚙ Tweaks')),
          h('div',{className:'inbound-logo-wrap'},
            h('img',{src:'assets/inbound-logo.png', alt:'Inbound', style:{height:20, display:'block'}}),
            h('div',{style:{fontSize:8, letterSpacing:'0.18em', textTransform:'uppercase',
              color:'rgba(255,255,255,0.75)', marginTop:3, textAlign:'center', fontWeight:700}},
              'Inbound SEO')))),

      // ——— Sekmeler ———
      h('div',{className:'tabs'},
        SEKMELER.map(s=>h('button',{key:s.id, className:'tab'+(tab===s.id?' active':''),
          onClick:()=>{ setTab(s.id); }},
          s.label,
          s.id==='keyword' && h('span',{className:'badge'}, rows.length.toLocaleString('tr-TR'))))),

      // ——— Global filtre ———
      h('div',{className:'global-filter-wrap'+(scrolled?' scrolled':'')},
        h('div',{className:'filter-panel'},
          h('div',{className:'filter-panel-label'},
            h('span',null,'🎯 '), h('strong',null,'Faset Filtresi'),
            aktifSayi>0 && h('span',{className:'txt-3',style:{fontSize:11,marginLeft:8}},
              'Tüm sekmeler bu filtreye göre güncellenir')),
          h('input',{type:'search', className:'search-input', placeholder:'Keyword ara…',
            value:arama, onChange:e=>setArama(e.target.value),
            style:{minWidth:180, padding:'7px 10px', borderRadius:8,
              border:'1px solid var(--line)', background:'var(--bg-card)', color:'var(--ink)'}}),
          BIRINCIL.map(([alan,etiket,w]) => (secenekler[alan]||[]).length>1 &&
            h(C.MultiSelect,{key:alan, label:etiket, options:secenekler[alan],
              selected:filtre[alan]||[], width:w,
              onChange:sel=>setFiltre(f=>({...f,[alan]:sel}))})),
          h('button',{className:'chip-btn'+(ikincilAcik?' active':''),
            onClick:()=>setIkincilAcik(o=>!o)}, ikincilAcik?'− Daha az filtre':'+ Daha fazla filtre'),
          aktifSayi>0 && h('button',{className:'chip-btn',
            onClick:()=>{setFiltre({}); setArama(''); setPeakAy([]); setDrill(null);}},
            '× Temizle ('+aktifSayi+')')),

        ikincilAcik && h('div',{className:'filter-panel', style:{marginTop:8}},
          h('div',{className:'filter-panel-label'},h('strong',null,'İkincil fasetler')),
          IKINCIL.map(([alan,etiket,w]) => (secenekler[alan]||[]).length>1 &&
            h(C.MultiSelect,{key:alan, label:etiket, options:secenekler[alan],
              selected:filtre[alan]||[], width:w,
              onChange:sel=>setFiltre(f=>({...f,[alan]:sel}))})),
          h(C.MultiSelect,{label:'Peak Ay', options:U.TR_MONTHS, selected:peakAy,
            onChange:setPeakAy, width:160})),

        aktifSayi>0 && h('div',{className:'filter-chips'},
          h('span',{className:'lbl'},'Seçili:'),
          Object.entries(filtre).flatMap(([alan,degerler])=>(degerler||[]).map(d=>
            h('button',{key:alan+d, className:'filter-chip',
              onClick:()=>setFiltre(f=>({...f,[alan]:f[alan].filter(x=>x!==d)}))},
              d, h('span',{className:'x'},'×')))),
          peakAy.map(p=>h('button',{key:'pk'+p, className:'filter-chip',
            onClick:()=>setPeakAy(a=>a.filter(x=>x!==p))}, 'Peak: '+p, h('span',{className:'x'},'×'))),
          arama && h('button',{className:'filter-chip', onClick:()=>setArama('')},
            'Arama: '+arama, h('span',{className:'x'},'×')))),

      // ——— İçerik ———
      h('div',{className:'content'},
        rows.length===0
          ? h(C.EmptyState,{icon:'🔍', title:'Sonuç bulunamadı',
              desc:'Seçili filtrelerle eşleşen keyword yok.',
              cta:'Filtreleri temizle', onCta:()=>{setFiltre({});setArama('');setPeakAy([]);}})
          : h(Aktif, ortak)),

      // ——— Tweaks ———
      tweaksOpen && h('div',{className:'tweaks-panel'},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}},
          h('h3',{style:{margin:0}},'Tweaks'),
          h('button',{className:'modal-close', style:{width:24,height:24,fontSize:16},
            onClick:()=>setTweaksOpen(false)},'×')),
        h('div',{className:'tweaks-row'}, h('label',null,'Tema'),
          h('div',{className:'chips'}, [['light','Light'],['dark','Dark']].map(([v,l])=>
            h('button',{key:v, className:'chip-btn'+(tweaks.theme===v?' active':''),
              onClick:()=>tweakUygula({theme:v})}, l)))),
        h('div',{className:'tweaks-row'}, h('label',null,'Renk paleti'),
          h('div',{className:'chips'}, [['tvplus','TV+ Sarı'],['coral','Coral'],['neutral','Nötr']].map(([v,l])=>
            h('button',{key:v, className:'chip-btn'+(tweaks.palette===v?' active':''),
              onClick:()=>tweakUygula({palette:v})}, l)))),
        h('div',{style:{fontSize:10,color:'var(--ink-3)',marginTop:10,lineHeight:1.4}},
          'Tema açık/koyu görünümü, palet aksan rengini değiştirir.')),

      // ——— Alt bar ———
      h('button',{className:'footer-logo-left', title:'Özet\'e dön',
        onClick:()=>{ setTab('ozet'); window.scrollTo({top:0,behavior:'smooth'}); }},
        h('img',{src:'assets/inbound-small-logo.png', alt:'Inbound',
          style:{height:18, display:'block', opacity:.85}})),
      h('div',{className:'page-footer'},
        h('button',{className:'scroll-top-btn', title:'En üste çık',
          onClick:()=>window.scrollTo({top:0,behavior:'smooth'})},'↑')),

      keywordModal && h(T.KeywordModal,{kw:keywordModal, onClose:()=>setKeywordModal(null)})
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();

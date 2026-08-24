const TABLAR = [
  ['ozet','Özet',OzetTab],
  ['organizasyon','Organizasyonlar',OrganizasyonTab],
  ['keyword','Keyword',KeywordTab],
  ['trend','Trendler & Sezonsallık',TrendTab],
  ['sayfa','Sayfa Tipi & Intent',SayfaTipiTab],
  ['entity','Takım & Oyuncu',EntityTab],
  ['hakdisi','Yayın Hakkı Dışı',HakDisiTab],
  ['karar','Karar Ağacı',KararTab],
  ['master','Master Liste',MasterTab],
];

// Global filtrede kullanılacak fasetler
const FILTRE_ALANLARI = [
  ['spor','Spor Dalı'], ['org','Organizasyon'], ['st','Sayfa Tipi'], ['it','Intent'],
  ['ent','Varlık Tipi'], ['hak','Yayın Hakkı'], ['mus','Müsabaka Tipi'],
  ['cins','Cinsiyet'], ['sev','Lig Seviyesi'], ['sinif','Sezonsallık'],
  ['cog','Coğrafya'], ['ktm','Katman'], ['marka','Marka Tipi'],
];

function KeywordModal({ kw, kapat }) {
  if (!kw) return null;
  const M = window.DATA.meta, aylar = M.aylar || [];
  const FAS = [['org','Organizasyon'],['spor','Spor Dalı'],['mus','Müsabaka Tipi'],
    ['sev','Lig Seviyesi'],['pres','Prestij'],['cins','Cinsiyet'],['km','Kulüp/Milli'],
    ['tb','Takım/Bireysel'],['cog','Coğrafya'],['yer','Yerlilik'],['turk','Türk Bağlantısı'],
    ['hak','Yayın Hakkı'],['per','Periyodiklik'],['tak','Takvim Tipi'],['st','Sayfa Tipi'],
    ['it','Intent'],['ent','Varlık Tipi'],['marka','Marka Tipi'],['kurum','Kurum Sorgusu'],
    ['dil','Dil'],['uzn','Sorgu Uzunluğu'],['ktm','Katman'],['dog','Kulüp Doğrulama'],['kulup','Kulüp']];
  return <Modal acik={!!kw} kapat={kapat} baslik={kw.kw}>
    <div className="grid g3" style={{marginBottom:16}}>
      <Kpi lab="Aylık Ortalama" val={U.tam(kw.sv)} note={kw.bant} />
      <Kpi lab="Sezonsallık" val={kw.sinif} tone={U.SINIF_RENK[kw.sinif]}
        note={kw.cv!=null?`CV ${kw.cv} · peak/dip ${kw.pd}`:null} />
      <Kpi lab="Peak Ay" val={U.ayEtiket(kw.peak)} note={`dip: ${U.ayEtiket(kw.dip)}`} />
    </div>
    <h4 style={{fontSize:13,marginBottom:6}}>Aylık seyir</h4>
    <div className="card" style={{padding:12,marginBottom:8}}>
      <LineChart seri={kw.seri} aylar={aylar} h={170} />
    </div>
    <Heat seri={kw.seri} aylar={aylar} />
    <h4 style={{fontSize:13,margin:'18px 0 8px'}}>Faset öznitelikleri</h4>
    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
      {FAS.map(([k,l]) => kw[k] ? <Chip key={k}><b style={{fontWeight:600}}>{l}:</b> {kw[k]}</Chip> : null)}
    </div>
    <div style={{marginTop:16,fontSize:11.5,color:'var(--ink-3)'}}>
      Kaynak: {M.kaynak} · Pencere: {U.ayEtiket(aylar[0])} – {U.ayEtiket(aylar[aylar.length-1])}
    </div>
  </Modal>;
}

function App() {
  const D = window.DATA, M = D.meta, B = window.BRAND || {};
  const [tab, setTab] = useState(() => (location.hash.replace('#','').split('/')[0]) || 'ozet');
  const [filtre, setFiltre] = useState(() => {
    try { return JSON.parse(localStorage.getItem(B.slug+':filtre')) || {}; } catch { return {}; }
  });
  const [arama, setArama] = useState('');
  const [modalKw, setModalKw] = useState(null);
  const [tema, setTema] = useState(() => localStorage.getItem(B.slug+':tema') || 'light');

  useEffect(() => { location.hash = tab; }, [tab]);
  useEffect(() => { localStorage.setItem(B.slug+':filtre', JSON.stringify(filtre)); }, [filtre]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem(B.slug+':tema', tema);
  }, [tema]);
  useEffect(() => {
    const h = () => setTab((location.hash.replace('#','').split('/')[0]) || 'ozet');
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  const rows = useMemo(() => U.uygula(D.keywords, filtre, arama), [filtre, arama]);
  const aktifFiltre = Object.values(filtre).filter(v => v && v.length).length;
  const Aktif = (TABLAR.find(t => t[0] === tab) || TABLAR[0])[2];

  return <>
    <div className="topbar"><div className="topbar-in">
      <div className="logo-band">
        <div className="logo-mark">TV+</div>
        <div className="logo-txt"><strong>{B.name}</strong><span>{B.subtitle}</span></div>
      </div>
      <div className="topbar-sep" />
      <div style={{fontSize:12,color:'var(--ink-3)'}}>
        {U.tam(M.toplamKeyword)} keyword · {U.ayEtiket(M.aylar[0])} – {U.ayEtiket(M.aylar[M.aylar.length-1])}
      </div>
      <div className="agency">
        <button className="btn" onClick={()=>setTema(t=>t==='light'?'dark':'light')}
          title="Tema değiştir">{tema==='light'?'◐':'◑'}</button>
        {B.agency && B.agency.show && <><span>Hazırlayan</span><b>{B.agency.label}</b></>}
      </div>
    </div></div>

    <div className="wrap">
      <div className="hero">
        <h1>{B.title}</h1>
        <p>Türkiye spor arama talebinin organizasyon, sayfa tipi, varlık ve sezonsallık
          eksenlerinde haritalanması; TV+ spor sayfa mimarisi için karar çerçevesi.</p>
        <div className="meta">
          <Chip tone="acc">{U.fmt(M.toplamHacim)} aylık jenerik talep</Chip>
          <Chip>{U.tam(M.toplamKeyword)} keyword</Chip>
          <Chip>{M.aylar.length} aylık veri</Chip>
          <Chip>Kaynak: DataForSEO</Chip>
        </div>
      </div>

      <div className="filters">
        <input type="search" placeholder="Keyword ara…" value={arama}
          onChange={e=>setArama(e.target.value)} />
        {FILTRE_ALANLARI.map(([alan,etiket]) => (D.facetDegerleri[alan] || []).length > 1 &&
          <MultiSelect key={alan} etiket={etiket} secenekler={D.facetDegerleri[alan]}
            secili={filtre[alan] || []}
            degistir={v => setFiltre(f => ({ ...f, [alan]: v }))} />)}
        {(aktifFiltre > 0 || arama) && <button className="btn" style={{alignSelf:'flex-end'}}
          onClick={()=>{setFiltre({});setArama('');}}>Filtreleri temizle ({aktifFiltre + (arama?1:0)})</button>}
      </div>

      <div className="tabs" role="tablist">
        {TABLAR.map(([id,ad]) => <button key={id} className="tab" role="tab"
          aria-selected={tab===id} onClick={()=>setTab(id)}>{ad}</button>)}
      </div>

      {rows.length === 0
        ? <div className="empty">Seçilen filtrelerle eşleşen keyword bulunamadı.</div>
        : <Aktif rows={rows} ac={setModalKw} />}

      <KeywordModal kw={modalKw} kapat={()=>setModalKw(null)} />

      <div className="foot">
        <span>Kaynak: {M.kaynak} · Veri {M.olusturma} tarihinde derlenmiştir.</span>
        <span>{B.agency && B.agency.name}</span>
      </div>
    </div>
  </>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

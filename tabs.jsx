/* ——— ortak yardımcılar ——— */
const A = () => (window.DATA.meta.aylar || []);

function grupla(rows, alan) {
  const m = new Map(), n = A().length;
  for (const k of rows) {
    const v = k[alan]; if (v === undefined || v === '') continue;
    if (!m.has(v)) m.set(v, { ad: v, hacim: 0, kw: 0, seri: new Array(n).fill(0) });
    const g = m.get(v); g.hacim += k.sv; g.kw++;
    for (let i = 0; i < n; i++) g.seri[i] += (k.seri[i] || 0);
  }
  return [...m.values()].map(g => {
    const mx = Math.max(...g.seri);
    return { ...g, peak: A()[g.seri.indexOf(mx)] || null };
  }).sort((a, b) => b.hacim - a.hacim);
}

const KOL = {
  kw:    { id:'kw', baslik:'Keyword', al:'kw', render:r=><span className="kw">{r.kw}</span> },
  sv:    { id:'sv', baslik:'Aylık Hacim', al:'sv', num:true, render:r=><b>{U.tam(r.sv)}</b> },
  org:   { id:'org', baslik:'Organizasyon', al:'org' },
  spor:  { id:'spor', baslik:'Spor Dalı', al:'spor' },
  st:    { id:'st', baslik:'Sayfa Tipi', al:'st' },
  it:    { id:'it', baslik:'Intent', al:'it' },
  hak:   { id:'hak', baslik:'Yayın Hakkı', al:'hak',
           render:r=><Chip tone={r.hak==='TV+ Var'?'pos':r.hak==='TV+ Yok'?'neg':'warn'}>{r.hak}</Chip> },
  sinif: { id:'sinif', baslik:'Sezonsallık', al:'sinif',
           render:r=><span style={{color:U.SINIF_RENK[r.sinif],fontWeight:600}}>{r.sinif}</span> },
  peak:  { id:'peak', baslik:'Peak Ay', al:'peak', render:r=>U.ayEtiket(r.peak) },
  seri:  { id:'seri', baslik:'Aylık Seyir', al:'seri', render:r=><Spark seri={r.seri} w={110} h={26}/> },
};

/* ═══════════════════════ ÖZET ═══════════════════════ */
function OzetTab({ rows, ac }) {
  const M = window.DATA.meta;
  const spor = grupla(rows, 'spor'), st = grupla(rows, 'st'), hak = grupla(rows, 'hak');
  const sinif = grupla(rows, 'sinif');
  const toplam = U.hacim(rows);
  const izleme = rows.filter(r => r.it === 'İzleme');
  const veriSayfa = rows.filter(r => r.st === 'Puan Durumu' || r.st === 'Fikstür');
  const spike = sinif.find(s => s.ad === 'Spike');

  return <div className="tab-content-anim">
    <div className="grid g4">
      <Kpi lab="Toplam Aylık Talep" val={U.fmt(toplam)} note={`${U.tam(rows.length)} keyword`} />
      <Kpi lab="Yayın Hakkı Olan" val={U.fmt(U.hacim(rows.filter(r=>r.hak==='TV+ Var')))}
        note={`toplam talebin %${(100*U.hacim(rows.filter(r=>r.hak==='TV+ Var'))/(toplam||1)).toFixed(1)}'i`} />
      <Kpi lab="İzleme Intent'i" val={U.fmt(U.hacim(izleme))}
        note={`${izleme.length} keyword · TV+'ın doğal alanı`} tone="var(--green)" />
      <Kpi lab="Spike Profilli Talep" val={spike ? `%${(100*spike.hacim/(toplam||1)).toFixed(0)}` : '–'}
        note="sezon dışında sönen talep" tone="var(--red)" />
    </div>

    <div className="note-box">
      <b>Okuma notu.</b> Puan durumu ve fikstür sorguları ({U.fmt(U.hacim(veriSayfa))} aylık) Google'ın
      kendi spor bileşeni tarafından karşılanıyor; bu ailede organik tıklama oranı düşük kalmaktadır.
      İzleme intent'i ({U.fmt(U.hacim(izleme))} aylık) ise bileşen tarafından bastırılmamaktadır.
    </div>

    <SectionHeader title="Spor Dalı Dağılımı" sub="jenerik talep, markalı sorgular hariç" />
    <div className="grid g2">
      <div className="card"><h3>Hacim payı</h3><div className="sub">aylık arama</div>
        <Bars rows={spor} limit={10} /></div>
      <div className="card"><h3>Aylık seyir</h3>
        <div className="sub">{U.ayEtiket(A()[0])} – {U.ayEtiket(A()[A().length-1])}</div>
        <LineChart seri={U.topla(rows)} aylar={A()} /></div>
    </div>

    <SectionHeader title="Sayfa Tipi ve Yayın Hakkı" />
    <div className="grid g2">
      <div className="card"><h3>Sayfa tipi</h3><div className="sub">talebin hangi sayfa türüne düştüğü</div>
        <Bars rows={st} limit={10} /></div>
      <div className="card"><h3>Yayın hakkı kırılımı</h3><div className="sub">TV+ portföyü karşısında talep</div>
        <Bars rows={hak} limit={6}
          renk={r=>r.ad==='TV+ Var'?'var(--green)':r.ad==='TV+ Yok'?'var(--red)':'var(--gold)'} /></div>
    </div>

    <SectionHeader title="En Yüksek Talepli Organizasyonlar" sub="ilk 15" />
    <Tablo limit={15} rows={grupla(rows,'org').slice(0,15).map(g=>({...g,kw:g.ad}))} kolonlar={[
      {id:'ad',baslik:'Organizasyon',al:'ad',render:r=><span className="kw">{r.ad}</span>},
      {id:'hacim',baslik:'Aylık Hacim',al:'hacim',num:true,render:r=><b>{U.tam(r.hacim)}</b>},
      {id:'kwc',baslik:'Keyword',al:'kw',num:true,render:r=>U.tam(r.kw)},
      {id:'peak',baslik:'Peak Ay',al:'peak',render:r=>U.ayEtiket(r.peak)},
      {id:'seri',baslik:'Aylık Seyir',al:'seri',render:r=><Spark seri={r.seri} w={120} h={26}/>},
    ]} />
  </div>;
}

/* ═══════════════════════ ORGANİZASYONLAR ═══════════════════════ */
function OrganizasyonTab({ rows, ac }) {
  const [kir, setKir] = useState('org');
  const g = grupla(rows, kir);
  const SEC = [['org','Organizasyon'],['spor','Spor Dalı'],['mus','Müsabaka Tipi'],
    ['sev','Lig Seviyesi'],['cins','Cinsiyet'],['cog','Coğrafya'],['per','Periyodiklik'],
    ['tak','Takvim Tipi'],['turk','Türk Bağlantısı'],['pres','Prestij Katmanı']];
  return <div className="tab-content-anim">
    <div className="filters">
      <div><label>Kırılım ekseni</label><br/>
        <select value={kir} onChange={e=>setKir(e.target.value)} style={{marginTop:4}}>
          {SEC.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select></div>
      <button className="btn" style={{marginLeft:'auto'}} onClick={()=>U.csvIndir(g,
        [{baslik:'Grup',al:'ad'},{baslik:'Aylık Hacim',al:'hacim'},{baslik:'Keyword',al:'kw'},
         {baslik:'Peak Ay',al:r=>U.ayEtiket(r.peak)}],`tvplus-${kir}.csv`)}>CSV indir</button>
    </div>
    <SectionHeader title="Isı matrisi" sub="satır = grup, sütun = ay, renk satır içi maksimuma göre" />
    <HeatMatrix gruplar={g} aylar={A()} limit={16} />
    <SectionHeader title="Tam liste" />
    <Tablo limit={120} rows={g} kolonlar={[
      {id:'ad',baslik:'Grup',al:'ad',render:r=><span className="kw">{r.ad}</span>},
      {id:'hacim',baslik:'Aylık Hacim',al:'hacim',num:true,render:r=><b>{U.tam(r.hacim)}</b>},
      {id:'kwc',baslik:'Keyword',al:'kw',num:true,render:r=>U.tam(r.kw)},
      {id:'peak',baslik:'Peak Ay',al:'peak',render:r=>U.ayEtiket(r.peak)},
      {id:'seri',baslik:'Aylık Seyir',al:'seri',render:r=><Spark seri={r.seri} w={120} h={26}/>},
    ]} />
  </div>;
}

/* ═══════════════════════ KEYWORD ═══════════════════════ */
function KeywordTab({ rows, ac }) {
  return <div className="tab-content-anim">
    <div className="filters">
      <span style={{fontSize:12.5,color:'var(--ink-2)'}}>
        <b>{U.tam(rows.length)}</b> keyword · <b>{U.fmt(U.hacim(rows))}</b> aylık talep
      </span>
      <button className="btn" style={{marginLeft:'auto'}} onClick={()=>U.csvIndir(rows,
        [{baslik:'Keyword',al:'kw'},{baslik:'Aylık Hacim',al:'sv'},{baslik:'Organizasyon',al:'org'},
         {baslik:'Spor Dalı',al:'spor'},{baslik:'Sayfa Tipi',al:'st'},{baslik:'Intent',al:'it'},
         {baslik:'Entity',al:'ent'},{baslik:'Yayın Hakkı',al:'hak'},{baslik:'Sezonsallık',al:'sinif'},
         {baslik:'Peak Ay',al:r=>U.ayEtiket(r.peak)}],'tvplus-keyword.csv')}>CSV indir</button>
    </div>
    <Tablo limit={200} rows={rows} kolonlar={[
      {...KOL.kw, render:r=><a href="#" className="kw" style={{textDecoration:'none',
        borderBottom:'1px dotted var(--ink-3)'}} onClick={e=>{e.preventDefault();ac(r);}}>{r.kw}</a>},
      KOL.sv, KOL.org, KOL.st, KOL.it, KOL.hak, KOL.sinif, KOL.peak, KOL.seri,
    ]} />
  </div>;
}

/* ═══════════════════════ TRENDLER & SEZONSALLIK ═══════════════════════ */
function TrendTab({ rows }) {
  const sinif = grupla(rows, 'sinif');
  const peakG = grupla(rows.filter(r=>r.peak), 'peak');
  const spike = rows.filter(r=>r.sinif==='Spike').slice(0,25);
  const ever  = rows.filter(r=>r.sinif==='Evergreen').slice(0,25);
  return <div className="tab-content-anim">
    <div className="grid g3">
      {sinif.map(s=><div className="kpi" key={s.ad}>
        <div className="lab">{s.ad}</div>
        <div className="val" style={{color:U.SINIF_RENK[s.ad]}}>{U.fmt(s.hacim)}</div>
        <div className="note">{U.tam(s.kw)} keyword · %{(100*s.hacim/(U.hacim(rows)||1)).toFixed(1)}</div>
      </div>)}
    </div>
    <div className="note-box">
      <b>Sınıflama yöntemi.</b> Değişkenlik katsayısı (CV) 0.35 altındaki seriler Evergreen,
      peak/dip oranı 20 ve üzeri veya CV 1.0 ve üzeri olanlar Spike, kalanlar Seasonal olarak
      etiketlenmiştir. Pencere: {U.ayEtiket(A()[0])} – {U.ayEtiket(A()[A().length-1])}.
    </div>
    <SectionHeader title="Peak ay dağılımı" sub="talebin hangi ayda zirve yaptığı" />
    <div className="card"><Bars rows={peakG.map(p=>({...p,ad:U.ayEtiket(p.ad)}))} limit={13} /></div>
    <div className="grid g2" style={{marginTop:18}}>
      <div><SectionHeader title="En yüksek Spike'lar" sub="sezon dışında sönen talep" />
        <Tablo limit={25} rows={spike} kolonlar={[KOL.kw,KOL.sv,KOL.peak,KOL.seri]} /></div>
      <div><SectionHeader title="Evergreen talep" sub="yıl boyu istikrarlı" />
        <Tablo limit={25} rows={ever} kolonlar={[KOL.kw,KOL.sv,KOL.peak,KOL.seri]} /></div>
    </div>
  </div>;
}

/* ═══════════════════════ SAYFA TİPİ & INTENT ═══════════════════════ */
function SayfaTipiTab({ rows }) {
  const st = grupla(rows,'st'), it = grupla(rows,'it'), ent = grupla(rows,'ent');
  const izleme = rows.filter(r=>r.it==='İzleme');
  const veri = rows.filter(r=>['Puan Durumu','Fikstür','Maç/Skor'].includes(r.st));
  return <div className="tab-content-anim">
    <div className="grid g3">
      <Kpi lab="İzleme Intent'i" val={U.fmt(U.hacim(izleme))} tone="var(--green)"
        note="Google bileşeni tarafından bastırılmıyor" />
      <Kpi lab="Veri Sayfası Talebi" val={U.fmt(U.hacim(veri))} tone="var(--red)"
        note="Google spor bileşeni cevabı veriyor" />
      <Kpi lab="Bilgi Intent'i" val={U.fmt(U.hacim(rows.filter(r=>r.it==='Bilgi')))} />
    </div>
    <SectionHeader title="Sayfa tipi ve intent kırılımı" />
    <div className="grid g3">
      <div className="card"><h3>Sayfa tipi</h3><div className="sub">aylık hacim</div><Bars rows={st} limit={14}/></div>
      <div className="card"><h3>Intent katmanı</h3><div className="sub">aylık hacim</div><Bars rows={it} limit={6}/></div>
      <div className="card"><h3>Varlık tipi</h3><div className="sub">aylık hacim</div><Bars rows={ent} limit={8}/></div>
    </div>
    <SectionHeader title="İzleme intent'i · en yüksek talep" sub="TV+ için öncelikli sayfa alanı" />
    <Tablo limit={40} rows={izleme.slice(0,40)} kolonlar={[KOL.kw,KOL.sv,KOL.org,KOL.st,KOL.hak,KOL.seri]} />
  </div>;
}

/* ═══════════════════════ TAKIM & OYUNCU ═══════════════════════ */
function EntityTab({ rows, ac }) {
  const [tip, setTip] = useState('Takım');
  const veri = rows.filter(r => r.ent === tip);
  const tipler = [...new Set(rows.map(r=>r.ent).filter(Boolean))];
  const katman = grupla(veri,'ktm');
  return <div className="tab-content-anim">
    <div className="filters">
      <div><label>Varlık tipi</label><br/>
        <select value={tip} onChange={e=>setTip(e.target.value)} style={{marginTop:4}}>
          {tipler.map(t=><option key={t} value={t}>{t}</option>)}
        </select></div>
      <span style={{fontSize:12.5,color:'var(--ink-2)',marginLeft:12}}>
        <b>{U.tam(veri.length)}</b> keyword · <b>{U.fmt(U.hacim(veri))}</b> aylık</span>
    </div>
    {katman.length>1 && <><SectionHeader title="Katman dağılımı" sub="çekirdek evren ile uzun kuyruk karşılaştırması"/>
      <div className="card"><Bars rows={katman} limit={6}/></div></>}
    <SectionHeader title={tip+' talebi'} sub="en yüksek 60" />
    <Tablo limit={60} rows={veri.slice(0,60)} kolonlar={[
      {...KOL.kw, render:r=><a href="#" className="kw" style={{textDecoration:'none',
        borderBottom:'1px dotted var(--ink-3)'}} onClick={e=>{e.preventDefault();ac(r);}}>{r.kw}</a>},
      KOL.sv, KOL.org, KOL.st, KOL.hak, KOL.sinif, KOL.seri]} />
  </div>;
}

/* ═══════════════════════ YAYIN HAKKI DIŞI ═══════════════════════ */
function HakDisiTab({ rows }) {
  const disi = rows.filter(r => r.hak === 'TV+ Yok');
  const org = grupla(disi,'org');
  const toplam = U.hacim(rows) || 1;
  return <div className="tab-content-anim">
    <div className="grid g3">
      <Kpi lab="Yayın Hakkı Dışı Talep" val={U.fmt(U.hacim(disi))}
        note={`toplam talebin %${(100*U.hacim(disi)/toplam).toFixed(1)}'i`} tone="var(--red)" />
      <Kpi lab="Kapsanan Organizasyon" val={U.tam(org.length)} />
      <Kpi lab="Keyword" val={U.tam(disi.length)} />
    </div>
    <div className="note-box">
      <b>Değerlendirme notu.</b> Puan durumu ve fikstür gibi veri sayfaları yayın hakkı
      gerektirmemektedir. Bu havuz, hakkı bulunmayan organizasyonlarda dahi veri sayfası
      üzerinden trafik çekip yayın hakkı olan içeriğe köprü kurma fırsatı olarak
      değerlendirilebilir.
    </div>
    <SectionHeader title="Hakkı olmayan organizasyonlar" sub="talep büyüklüğüne göre" />
    <Tablo limit={40} rows={org} kolonlar={[
      {id:'ad',baslik:'Organizasyon',al:'ad',render:r=><span className="kw">{r.ad}</span>},
      {id:'hacim',baslik:'Aylık Hacim',al:'hacim',num:true,render:r=><b>{U.tam(r.hacim)}</b>},
      {id:'kwc',baslik:'Keyword',al:'kw',num:true,render:r=>U.tam(r.kw)},
      {id:'peak',baslik:'Peak Ay',al:'peak',render:r=>U.ayEtiket(r.peak)},
      {id:'seri',baslik:'Aylık Seyir',al:'seri',render:r=><Spark seri={r.seri} w={120} h={26}/>}]} />
  </div>;
}

/* ═══════════════════════ KARAR AĞACI ═══════════════════════ */
function kararVer(o) {
  // o: { ad, hacim, sinif, hak, altSayfa, izleme, entity }
  if (o.hak === 'TV+ Yok') {
    return o.hacim >= 500000
      ? { karar:'Veri Sayfası', tone:'warn', gerekce:'Yayın hakkı yok ancak talep çok yüksek. Veri sayfası hak gerektirmez; köprü kurgusu değerlendirilebilir.' }
      : { karar:'Şimdilik Değil', tone:'', gerekce:'Yayın hakkı bulunmuyor ve talep büyüklüğü ayrı sayfa yatırımını gerektirecek seviyede değil.' };
  }
  if (o.hacim < 20000)
    return { karar:'Şimdilik Değil', tone:'', gerekce:'Talep hacmi ayrı sayfa seti için sınırlı kalmaktadır. Takip listesinde tutulabilir.' };
  if (o.sinif === 'Spike' && o.altSayfa < 0.12)
    return { karar:'Etkinlik Ölçekli', tone:'warn', gerekce:'Talep tek bir pencereye yığılıyor ve alt sayfa derinliği düşük. Aktif dönemde derinleşen, sezon dışında sadeleşen yapı uygundur.' };
  if (o.altSayfa >= 0.12 && o.hacim >= 100000)
    return { karar:'Hub', tone:'pos', gerekce:'Hem yüksek talep hem alt sayfa derinliği mevcut. Puan durumu, fikstür, takım ve oyuncu katmanı birlikte kurulabilir.' };
  return { karar:'Landing', tone:'acc', gerekce:'Talep anlamlı ancak alt sayfa derinliği sınırlı. Tek güçlü sayfa üzerinde izleme intent\'ine odaklanılabilir.' };
}

function KararTab({ rows }) {
  const orgRows = useMemo(() => {
    const m = new Map();
    for (const k of rows) {
      if (!k.org) continue;
      if (!m.has(k.org)) m.set(k.org, []);
      m.get(k.org).push(k);
    }
    return [...m.entries()].map(([ad, ks]) => {
      const hacim = U.hacim(ks);
      const alt = U.hacim(ks.filter(k => ['Puan Durumu','Fikstür','Kadro','İstatistik'].includes(k.st)));
      const izl = U.hacim(ks.filter(k => k.it === 'İzleme'));
      const seri = U.topla(ks);
      const nz = seri.filter(v=>v>0);
      const ort = seri.reduce((a,b)=>a+b,0)/(seri.length||1);
      const cv = ort ? Math.sqrt(seri.reduce((a,b)=>a+(b-ort)**2,0)/seri.length)/ort : 0;
      const pd = nz.length ? Math.max(...seri)/Math.max(Math.min(...nz),1) : 0;
      const sinif = cv<0.35 ? 'Evergreen' : (pd>=20||cv>=1.0) ? 'Spike' : 'Seasonal';
      const hak = (ks.find(k=>k.hak)||{}).hak || 'Doğrulanacak';
      const o = { ad, hacim, sinif, hak, seri, kw: ks.length,
                  altSayfa: hacim ? alt/hacim : 0, izleme: izl,
                  peak: A()[seri.indexOf(Math.max(...seri))] || null };
      return { ...o, ...kararVer(o) };
    }).sort((a,b)=>b.hacim-a.hacim);
  }, [rows]);

  const kovalar = ['Hub','Landing','Etkinlik Ölçekli','Veri Sayfası','Şimdilik Değil'];
  const sayim = Object.fromEntries(kovalar.map(k=>[k, orgRows.filter(o=>o.karar===k)]));

  return <div className="tab-content-anim">
    <div className="note-box">
      <b>Karar çerçevesi.</b> Her organizasyon dört eksende değerlendirilmektedir: aylık talep
      büyüklüğü, talep şekli (Evergreen / Seasonal / Spike), alt sayfa derinliği (puan durumu,
      fikstür, kadro ve istatistik sorgularının organizasyon talebi içindeki payı) ve yayın hakkı
      durumu. Eşikler veriye göre kalibre edilmiştir ve marka tarafının stratejik önceliklerine
      göre güncellenebilir.
    </div>
    <div className="grid g3" style={{marginBottom:8}}>
      {kovalar.map(k=><div className="kpi" key={k}>
        <div className="lab">{k}</div>
        <div className="val">{sayim[k].length}</div>
        <div className="note">{U.fmt(U.hacim ? sayim[k].reduce((a,o)=>a+o.hacim,0) : 0)} aylık talep</div>
      </div>)}
    </div>
    <SectionHeader title="Organizasyon bazlı karar tablosu" sub="talep büyüklüğüne göre sıralı" />
    <Tablo limit={200} rows={orgRows} kolonlar={[
      {id:'ad',baslik:'Organizasyon',al:'ad',render:r=><span className="kw">{r.ad}</span>},
      {id:'karar',baslik:'Öneri',al:'karar',render:r=><Chip tone={r.tone}>{r.karar}</Chip>},
      {id:'hacim',baslik:'Aylık Hacim',al:'hacim',num:true,render:r=><b>{U.tam(r.hacim)}</b>},
      {id:'sinif',baslik:'Talep Şekli',al:'sinif',
        render:r=><span style={{color:U.SINIF_RENK[r.sinif],fontWeight:600}}>{r.sinif}</span>},
      {id:'alt',baslik:'Alt Sayfa Payı',al:'altSayfa',num:true,
        render:r=>'%'+(100*r.altSayfa).toFixed(1)},
      {id:'izl',baslik:'İzleme Talebi',al:'izleme',num:true,render:r=>U.fmt(r.izleme)},
      {id:'hak',baslik:'Yayın Hakkı',al:'hak',
        render:r=><Chip tone={r.hak==='TV+ Var'?'pos':r.hak==='TV+ Yok'?'neg':'warn'}>{r.hak}</Chip>},
      {id:'peak',baslik:'Peak Ay',al:'peak',render:r=>U.ayEtiket(r.peak)},
      {id:'seri',baslik:'Aylık Seyir',al:'seri',render:r=><Spark seri={r.seri} w={110} h={26}/>},
    ]} />
    <SectionHeader title="Gerekçeler" sub="ilk 12 organizasyon" />
    <div className="grid g2">
      {orgRows.slice(0,12).map(o=><div className="card" key={o.ad}>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
          <h3 style={{flex:1}}>{o.ad}</h3><Chip tone={o.tone}>{o.karar}</Chip></div>
        <div className="sub" style={{marginBottom:8}}>{U.tam(o.hacim)} aylık · {o.sinif} · alt sayfa payı %{(100*o.altSayfa).toFixed(1)}</div>
        <div style={{fontSize:12.5,color:'var(--ink-2)'}}>{o.gerekce}</div>
      </div>)}
    </div>
  </div>;
}

/* ═══════════════════════ MASTER LİSTE ═══════════════════════ */
function MasterTab({ rows }) {
  const M = window.DATA.meta;
  const KOLONLAR = [
    {baslik:'Keyword',al:'kw'},{baslik:'Aylık Hacim',al:'sv'},{baslik:'Hacim Bandı',al:'bant'},
    {baslik:'Organizasyon',al:'org'},{baslik:'Spor Dalı',al:'spor'},{baslik:'Müsabaka Tipi',al:'mus'},
    {baslik:'Lig Seviyesi',al:'sev'},{baslik:'Prestij Katmanı',al:'pres'},{baslik:'Cinsiyet',al:'cins'},
    {baslik:'Kulüp/Milli',al:'km'},{baslik:'Takım/Bireysel',al:'tb'},{baslik:'Coğrafya',al:'cog'},
    {baslik:'Yerlilik',al:'yer'},{baslik:'Türk Bağlantısı',al:'turk'},{baslik:'Yayın Hakkı',al:'hak'},
    {baslik:'Periyodiklik',al:'per'},{baslik:'Takvim Tipi',al:'tak'},{baslik:'Sayfa Tipi',al:'st'},
    {baslik:'Intent',al:'it'},{baslik:'Varlık Tipi',al:'ent'},{baslik:'Marka Tipi',al:'marka'},
    {baslik:'Kurum Sorgusu',al:'kurum'},{baslik:'Dil',al:'dil'},{baslik:'Sorgu Uzunluğu',al:'uzn'},
    {baslik:'Katman',al:'ktm'},{baslik:'Kulüp Doğrulama',al:'dog'},
    {baslik:'Sezonsallık',al:'sinif'},{baslik:'CV',al:'cv'},{baslik:'Peak/Dip',al:'pd'},
    {baslik:'Peak Ay',al:r=>U.ayEtiket(r.peak)},{baslik:'Dip Ay',al:r=>U.ayEtiket(r.dip)},
    ...(M.aylar||[]).map((m,i)=>({baslik:m,al:r=>r.seri[i]}))
  ];
  return <div className="tab-content-anim">
    <div className="note-box">
      <b>Master liste.</b> Filtrelenmiş {U.tam(rows.length)} keyword, {KOLONLAR.length} kolonla
      birlikte indirilebilir. Her satır tüm faset özniteliklerini ve aylık ham serisini taşır.
      Kaynak: {M.kaynak}.
    </div>
    <div className="filters">
      <span style={{fontSize:12.5}}><b>{U.tam(rows.length)}</b> satır · <b>{KOLONLAR.length}</b> kolon
        · <b>{(M.aylar||[]).length}</b> aylık veri noktası</span>
      <button className="btn pri" style={{marginLeft:'auto'}}
        onClick={()=>U.csvIndir(rows,KOLONLAR,`tvplus-spor-master-${M.olusturma}.csv`)}>
        Master listeyi CSV indir</button>
    </div>
    <SectionHeader title="Önizleme" sub="ilk 50 satır" />
    <Tablo limit={50} rows={rows} kolonlar={[KOL.kw,KOL.sv,KOL.org,KOL.spor,KOL.st,KOL.it,
      {id:'ent',baslik:'Varlık',al:'ent'},KOL.hak,KOL.sinif,KOL.peak]} />
  </div>;
}

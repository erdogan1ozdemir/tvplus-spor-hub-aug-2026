// TV+ Spor Talep Haritası — sekmeler
window.TABS = (function(){
  const h = React.createElement;
  const C = window.C;
  const { fmtNum, fmtFull, fmtPct, TR_MONTHS, ROLLING_LABELS, qLabel,
          groupBy, seriesFor, applyFacets, SEVIYELER, FACET_ETIKET,
          SEZ_RENK, HAK_RENK, aggregateRolling, aggregateMonthly,
          yoyFor, yoyEtiketFor, hacimFor, oncekiHacimFor,
          toCSV, downloadCSV, serialToRollingLabel } = U;
  const D = () => window.DATA;
  const SPOR_RENK = () => window.SPOR_RENK || {};

  const YoY = ({v, tip}) => h(C.YoYPill, {yoy:v, type:'YoY', tip});
  const topR12 = rows => rows.reduce((a,k)=>a+(k.r12||0),0);
  const topP12 = rows => rows.reduce((a,k)=>a+(k.p12||0),0);


  // Bir grubun üst kırılımdaki karşılığı: "Süper Lig" -> "Futbol / Süper Lig"
  const UST_EKSEN = { org:'spor', st:'spor', ent:'spor', it:'st', mus:'spor',
                      sev:'spor', kulup:'org', cins:'spor', ktm:'ent' };
  function ustDeger(g){
    const ust = UST_EKSEN[g.alan];
    if(!ust || !g.rows || !g.rows.length) return null;
    const say = {};
    for(const k of g.rows){ const v=k[ust]; if(v) say[v]=(say[v]||0)+(k.r12||0); }
    const sirali = Object.entries(say).sort((a,b)=>b[1]-a[1]);
    return sirali.length ? sirali[0][0] : null;
  }
  function tamYol(g){
    const u = ustDeger(g);
    return u && u !== g.label ? u + ' / ' + g.label : g.label;
  }
  // Grup başlığına gelince ne içerdiğini anlatan metin
  function grupAciklama(g){
    if(!g.rows || !g.rows.length) return g.label;
    const altEksen = g.alan==='spor' ? 'org' : g.alan==='org' ? 'st' : 'org';
    const say = {};
    for(const k of g.rows){ const v=k[altEksen]; if(v) say[v]=(say[v]||0)+(k.r12||0); }
    const ilk = Object.entries(say).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
    const toplamAlt = Object.keys(say).length;
    const ust = ustDeger(g);
    return [
      (ust ? ust + ' / ' : '') + g.label,
      `Son 12 Ay: ${fmtFull(g.r12)} · Önceki 12 Ay: ${fmtFull(g.p12)}` +
        (g.ryoy!=null ? ` · YoY ${fmtPct(g.ryoy,1)}` : ''),
      `${g.kwCount.toLocaleString('tr-TR')} keyword · toplam talebin %${(g.share*100).toFixed(1).replace('.',',')}'i`,
      `Peak: ${g.peakLabel} · ${qLabel(g.peakQ)} · ${g.sezType}`,
      ilk.length ? `İçerik (${FACET_ETIKET[altEksen]}, ${toplamAlt} adet): ` + ilk.join(', ') +
        (toplamAlt>ilk.length ? ' …' : '') : ''
    ].filter(Boolean).join('\n');
  }

  function Kaynak({not}){
    const M = D().meta;
    return h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:10, lineHeight:1.5}},
      'Kaynak: ', M.kaynak, ' · Takvim: ', M.aylar[0], ' – ', M.aylar[M.aylar.length-1],
      ' · Son 12 Ay: ', ROLLING_LABELS[0], ' – ', ROLLING_LABELS[11],
      not ? ' · '+not : '');
  }

  // ══════════════════════════════════════════ SEZONSALLIK MATRİSİ
  // Özdilek'teki "Kat 1 Sezon Takvimi" karşılığı: seviye seçimi, sıralama,
  // hücre içi YoY rozeti, kopyala + CSV.
  function SezonTakvimi({rows, viewMode, onSelectGroup, baslik, aciklama, seviye:dSeviye, setSeviye:dSet}){
    const [iSeviye, iSet] = React.useState('spor');
    const [entFiltre, setEntFiltre] = React.useState('');
    const seviye = dSeviye || iSeviye;
    const setSeviye = dSet || iSet;
    const rowsF = entFiltre ? rows.filter(r=>r.ent===entFiltre) : rows;
    const [sirala, setSirala] = React.useState('hacim');
    const gruplar = React.useMemo(()=>{
      let g = groupBy(rowsF, seviye);
      if(sirala==='yoyUp')   g = [...g].sort((a,b)=>(b.ryoy??-9)-(a.ryoy??-9));
      else if(sirala==='yoyDown') g = [...g].sort((a,b)=>(a.ryoy??9)-(b.ryoy??9));
      else if(sirala==='az') g = [...g].sort((a,b)=>a.label.localeCompare(b.label,'tr'));
      return g;
    },[rowsF, seviye, sirala]);

    const takvim = viewMode==='calendar';
    const etiketler = takvim ? TR_MONTHS : ROLLING_LABELS;
    const hmRows = gruplar.map(g=>({
      label: g.label,
      sub: (()=>{ const u=ustDeger(g);
        return (u && u!==g.label ? u+' · ' : '') + fmtNum(takvim ? g.tot25 : g.r12); })(),
      title: grupAciklama(g),
      values: takvim ? g.cal25 : g.roll,
      prevValues: takvim ? g.cal24 : g.prev,
      peakIdx: g.peakIdx,
      _g: g,
    }));

    const csv = () => toCSV(gruplar, [
      {label:FACET_ETIKET[seviye]||seviye, key:'label'},
      {label:'Önceki 12 Ay', key:'p12'}, {label:'Son 12 Ay', key:'r12'},
      {label:'YoY %', get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
      {label:'Keyword', key:'kwCount'}, {label:'Pay %', get:r=>(r.share*100).toFixed(2)},
      {label:'Peak Ay', key:'peakLabel'}, {label:'Peak Çeyrek', get:r=>qLabel(r.peakQ)},
      {label:'Mevsim Tipi', key:'sezType'},
      ...etiketler.map((m,i)=>({label:m, get:r=>(takvim?r.cal25:r.roll)[i]}))
    ]);
    const kopyaMetin = () => [
      [FACET_ETIKET[seviye]||seviye, ...etiketler, 'Son 12 Ay', 'YoY%'].join('\t'),
      ...gruplar.map(g=>[g.label,
        ...(takvim?g.cal25:g.roll).map(v=>v||0), g.r12,
        g.ryoy==null?'':(g.ryoy*100).toFixed(1)].join('\t'))
    ].join('\n');

    return h('div',{className:'card'},
      h('div',{className:'card-title-row'},
        h('div',{style:{minWidth:0}},
          h('div',{className:'txt-3', style:{fontSize:11.5}},
            aciklama || (takvim
              ? `Takvim yılı görünümü · ${D().meta.yillar[1]} ayları, ${D().meta.yillar[0]} ile karşılaştırmalı`
              : `Rolling görünüm · Son 12 Ay (${ROLLING_LABELS[0]} – ${ROLLING_LABELS[11]}), Önceki 12 Ay ile karşılaştırmalı`))),
        h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginLeft:'auto'}},
          h('div',{className:'segmented'},
            SEVIYELER.map(function(sv){
              return h('button',{key:sv.id, className: seviye===sv.id?'active':'',
                onClick:()=>setSeviye(sv.id)}, sv.label,
                h('span',{className:'badge', style:{marginLeft:5}},
                  new Set(rows.map(r=>r[sv.id]).filter(Boolean)).size));
            })),
          h('div',{className:'segmented', title:'Varlık tipine göre daralt'},
            [['','Tümü'],['Takım','Takım'],['Oyuncu','Oyuncu'],['Maç','Maç'],
             ['Lig/Organizasyon','Lig']].map(function(e){
              return h('button',{key:e[0]||'all', className: entFiltre===e[0]?'active':'',
                onClick:()=>setEntFiltre(e[0])}, e[1]);
            })),
          h('div',{className:'segmented'},
            [['hacim','Hacim ↓'],['yoyUp','YoY ↑'],['yoyDown','YoY ↓'],['az','A–Z']].map(([v,l])=>
              h('button',{key:v, className: sirala===v?'active':'', onClick:()=>setSirala(v)}, l))),
          h(C.CopyButton, {getData:kopyaMetin, title:'Tabloyu kopyala'}),
          h('button',{className:'chip-btn', onClick:()=>downloadCSV(`tvplus-sezonsallik-${seviye}.csv`, csv())},
            '↓ CSV'))),
      h('div',{className:'matrix-scroll'},
        h(C.Heatmap,{rows:hmRows, monthsLabels:etiketler, showValues:true, showYoY:true,
          showPeakDot:true,
          onClickCell:(row)=>onSelectGroup && onSelectGroup(seviye, row._g.ust)})),
      gruplar.length>12 && h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:6}},
        gruplar.length.toLocaleString('tr-TR')+' satır · tablo kendi içinde kaydırılabilir'),
      h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:10, lineHeight:1.5}},
        'Her hücrede üst: ilgili ayın arama hacmi, alt rozet: ',
        takvim ? 'önceki takvim yılının aynı ayına' : 'önceki 12 aylık dönemin aynı ayına',
        ' kıyasla YoY değişim. Renk: ',
        h('span',{style:{color:'var(--red)'}},'kırmızı (dip)'), ' · ',
        h('span',{style:{color:'var(--gold)'}},'sarı (orta)'), ' · ',
        h('span',{style:{color:'var(--green)'}},'yeşil (peak)'), '.'),
    );
  }

  // ══════════════════════════════════════════ GRUP DETAY TABLOSU
  function GrupTablosu({gruplar, seviye, onSelectGroup, viewMode, limit=400}){
    const [sira, setSira] = React.useState({k:'r12', y:-1});
    const veri = React.useMemo(()=>{
      const s=[...gruplar];
      s.sort((a,b)=>{ const x=a[sira.k], y=b[sira.k];
        if(x==null) return 1; if(y==null) return -1;
        if(typeof x==='number'&&typeof y==='number') return (x-y)*sira.y;
        return String(x).localeCompare(String(y),'tr')*sira.y; });
      return s;
    },[gruplar, sira]);
    const th=(id,lab,cls)=>h('th',{key:id, className:cls||'', style:{cursor:'pointer'},
      onClick:()=>setSira(s=>({k:id, y:s.k===id?-s.y:-1}))},
      lab, sira.k===id?(sira.y===-1?' ↓':' ↑'):'');
    return h('div',{className:'tbl-wrap'},
      h('table',{className:'tbl tbl-kat-detay'},
        h('thead',null,h('tr',null,
          th('label', FACET_ETIKET[seviye]||'Grup'),
          th(viewMode==='calendar'?'tot24':'p12',
             viewMode==='calendar' ? (D().meta.yillar[0]||'Önceki Yıl') : 'Önceki 12 Ay','num col-hide-sm'),
          th(viewMode==='calendar'?'tot25':'r12',
             viewMode==='calendar' ? (D().meta.yillar[1]||'Son Yıl') : 'Son 12 Ay','num'),
          th(viewMode==='calendar'?'yoy':'ryoy','YoY','num'),
          h('th',{key:'tr', className:'col-hide-sm'},'12 Ay Trend'),
          th('kwCount','Keyword','num col-hide-sm'),
          th('share','Pay','num col-hide-sm'),
          th('peakQ','Peak Ç.','col-hide-sm'),
          th('peakLabel','En yüksek ay','col-hide-sm'),
          th('sezType','Mevsim Tipi','col-hide-sm'))),
        h('tbody',null, veri.slice(0,limit).map((g,i)=>{
          const ust = ustDeger(g);
          return h('tr',{key:g.label, className:'clickable', title:grupAciklama(g),
            onClick:()=>onSelectGroup && onSelectGroup(seviye, g.ust)},
            h('td',null,
              h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                h('div',{style:{width:10,height:10,borderRadius:2,flexShrink:0,
                  background: (window.SPOR_RENK||{})[ust||g.ust] || 'var(--accent)'}}),
                h('div',{style:{minWidth:0}},
                  h('div',{className:'kw-cell'}, g.label),
                  ust && ust!==g.label && h('div',{className:'cat-cell'}, ust),
                  h('div',{className:'kw-mobile-meta'},
                    h('span',null, fmtNum(g.r12), ' · ', g.peakLabel),
                    h('span',{className:'pill q'+(g.peakQ+1), style:{fontSize:10,padding:'1px 5px',marginLeft:6}},
                      qLabel(g.peakQ)))))),
            h('td',{className:'num col-hide-sm'}, fmtFull(oncekiHacimFor(g, viewMode))),
            h('td',{className:'num'}, h('strong',null, fmtFull(hacimFor(g, viewMode)))),
            h('td',{className:'num'}, h(YoY,{v:yoyFor(g, viewMode), tip:yoyEtiketFor(viewMode)})),
            h('td',{className:'col-hide-sm', style:{width:110}},
              h(C.Sparkline,{values: viewMode==='calendar'?g.cal25:g.roll, w:100, h:28,
                color: SEZ_RENK[g.sezType]||'var(--accent)'})),
            h('td',{className:'num col-hide-sm'}, g.kwCount.toLocaleString('tr-TR')),
            h('td',{className:'num col-hide-sm'}, (g.share*100).toFixed(1).replace('.',',')+'%'),
            h('td',{className:'col-hide-sm'},
              h('span',{className:'pill q'+(g.peakQ+1), title:'Son 12 ayın en yüksek hacimli çeyreği'},
                qLabel(g.peakQ))),
            h('td',{className:'col-hide-sm', style:{fontSize:13,color:'var(--ink-2)'}},
              g.peakLabel + ' · ' + fmtNum(Math.max(...g.roll))),
            h('td',{className:'col-hide-sm'},
              h('span',{style:{color:SEZ_RENK[g.sezType], fontWeight:600}}, g.sezType)));
        }))));
  }

  // ══════════════════════════════════════════ ÖZET (Pazar Özeti)
  function OzetTab({rows, viewMode, setKeywordModal, onSelectGroup, onNavigateKw}){
    const M = D().meta;
    const takvim = viewMode==='calendar';
    const yilAd = D().meta.yillar;
    const r12 = takvim ? aggregateMonthly(rows,'m25').reduce((a,b)=>a+b,0) : topR12(rows);
    const p12 = takvim ? aggregateMonthly(rows,'m24').reduce((a,b)=>a+b,0) : topP12(rows);
    const ryoy = p12>0 ? (r12-p12)/p12 : null;
    const roll = aggregateRolling(rows,'last'), prev = aggregateRolling(rows,'prev');
    const pIdx = roll.indexOf(Math.max(...roll));
    const yukselen = rows.filter(k=>k.trend==='Yükselen');
    const dusen    = rows.filter(k=>k.trend==='Düşen');
    const izleme   = rows.filter(k=>k.it==='İzleme');
    const veriSayfa= rows.filter(k=>k.st==='Puan Durumu'||k.st==='Fikstür');
    const sporG    = groupBy(rows,'spor');
    const {series, labels} = seriesFor({roll, prev, cal24:aggregateMonthly(rows,'m24'),
      cal25:aggregateMonthly(rows,'m25'), cal26:aggregateMonthly(rows,'m26')}, viewMode);

    // Çeyreklik peak dağılımı (stacked)
    const ceyrekDag = sporG.slice(0,8).map(g=>{
      const q=U.quarterSums(g.roll), t=q.reduce((a,b)=>a+b,0)||1;
      return {label:g.label, q:q.map(v=>v/t)};
    });
    // Top listeler
    const enBuyuk = [...rows].sort((a,b)=>(b.r12||0)-(a.r12||0)).slice(0,10);
    const enArtan = rows.filter(k=>k.ryoy!=null && k.r12>=12000)
      .sort((a,b)=>b.ryoy-a.ryoy).slice(0,10);
    const enDusen = rows.filter(k=>k.ryoy!=null && k.r12>=12000)
      .sort((a,b)=>a.ryoy-b.ryoy).slice(0,10);

    const MiniListe = ({baslik, veri, sag, tone}) => h('div',{className:'card'},
      h('div',{className:'card-title-row'},
        h('h3',{style:{fontSize:14}}, baslik),
        sag && h('span',{className:'chip '+(tone||'neu'), style:{fontSize:10}}, sag)),
      h('div',{style:{display:'flex',flexDirection:'column'}},
        veri.map((k,i)=>h('button',{key:k.kw, className:'mini-row',
          onClick:()=>setKeywordModal(k),
          style:{display:'grid', gridTemplateColumns:'20px 1fr auto auto', gap:8,
            alignItems:'center', padding:'7px 4px', border:0, background:'none',
            borderTop: i?'1px solid var(--line-soft)':'none', cursor:'pointer',
            textAlign:'left', font:'inherit', color:'var(--ink)'}},
          h('span',{className:'txt-3', style:{fontSize:11}}, i+1),
          h('span',null, h('div',{style:{fontWeight:500, fontSize:12.5}}, k.kw),
            h('div',{className:'txt-3', style:{fontSize:10.5}}, (k.spor||'')+' · '+(k.org||''))),
          h('span',{className:'num', style:{fontSize:12, fontWeight:600}}, fmtNum(k.r12)),
          h(YoY,{v:k.ryoy})))));

    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Bu rapor ne anlatıyor?',
        sub:'veri kaynağı, dönem tanımı ve okuma notu', icon:'sinyal'},
        h('p',null,'Türkiye spor arama talebi ', h('strong',null, M.toplamKeyword.toLocaleString('tr-TR')),
          ' keyword üzerinden ', h('strong',null, M.aylar.length+' aylık'), ' pencerede (',
          M.aylar[0],' – ',M.aylar[M.aylar.length-1],') haritalanmıştır.'),
        h('p',null, h('strong',null,'Son 12 Ay'),' = ',ROLLING_LABELS[0],' – ',ROLLING_LABELS[11],
          '. ', h('strong',null,'Önceki 12 Ay'),' = ', U.ymLabel(D().monthsP12[0]),' – ',
          U.ymLabel(D().monthsP12[11]),'. Tüm YoY karşılaştırmaları bu iki pencere arasındadır; ',
          'üstteki görünüm düğmesiyle takvim yılı karşılaştırmasına geçilebilir.'),
        h('p',null,'Rakip markalı sorgular (beIN, Mackolik, Sofascore ve benzeri) jenerik ' +
          'toplamdan çıkarılmıştır. TFF ve TJK gibi resmi kurumlar bilginin birinci çıkış ' +
          'noktası olduğundan jenerik kabul edilir.'),
        h('p',null, h('strong',null,'Okuma notu: '),
          'Puan durumu ve fikstür sorgularının cevabı Google\'ın kendi spor bileşeni tarafından ' +
          'verilmektedir; bu ailede organik tıklama oranı düşük kalmaktadır. İzleme intent\'i ' +
          '("canlı izle", "nerede izlenir", "hangi kanalda") bileşen tarafından bastırılmamaktadır.')),

      // ——— Pazar Özeti hero ———
      h(C.SectionHeader,{icon:'ozet', title:'Pazar Özeti', accent:'coral',
        desc:'TV+ spor portföyünün Son 12 Ay görünümü, Önceki 12 Ay ile karşılaştırmalı'}),
      h('div',{className:'hero-kpi'},
        h('div',{className:'hero-left'},
          h('div',{className:'hero-label'}, takvim ? ('Toplam Arama · '+yilAd[1]) : 'Toplam Arama · Son 12 Ay'),
          h('div',{className:'hero-value'}, fmtNum(r12)),
          h('div',{className:'hero-sub'},
            h(YoY,{v:ryoy, tip:yoyEtiketFor(viewMode)}),
            h('span',{className:'txt-3', style:{marginLeft:8, fontSize:11.5}},
              takvim ? ('vs. '+yilAd[0]+' ') : 'vs. Önceki 12 Ay ', fmtNum(p12)))),
        h('div',{className:'hero-chart'},
          h(C.LineChart,{series, height:150, labels, yFormat:fmtNum, legend:true})),
        h('div',{className:'hero-right'},
          h('div',{className:'hero-label'},'Peak Ay'),
          h('div',{className:'hero-peak'}, takvim ? U.TR_MONTHS[aggregateMonthly(rows,'m25')
            .indexOf(Math.max(...aggregateMonthly(rows,'m25')))]+' '+yilAd[1] : ROLLING_LABELS[pIdx]),
          h('div',{className:'txt-3', style:{fontSize:11}}, fmtFull(roll[pIdx]), ' arama'))),

      h('div',{className:'grid grid-kpi kpi-5', style:{marginTop:14}},
        h(C.Kpi,{label:'Keyword', value:rows.length.toLocaleString('tr-TR'),
          sub:M.toplamKeyword.toLocaleString('tr-TR')+' toplam içinden'}),
        h(C.Kpi,{label:'Yükselen', value:yukselen.length.toLocaleString('tr-TR'),
          sub:'YoY +%5 üzeri', chip:'↑', chipClass:'pos'}),
        h(C.Kpi,{label:'Düşen', value:dusen.length.toLocaleString('tr-TR'),
          sub:'YoY −%5 altı', chip:'↓', chipClass:'neg'}),
        h(C.Kpi,{label:'İzleme Intent\'i', value:fmtNum(topR12(izleme)),
          sub:izleme.length.toLocaleString('tr-TR')+' keyword · TV+\'ın doğal alanı', accent:true}),
        h(C.Kpi,{label:'Veri Sayfası Talebi', value:fmtNum(topR12(veriSayfa)),
          sub:'Google bileşeni cevabı veriyor'})),

      h('div',{className:'insight-bar'},
        h('span',{className:'insight-arrow'},''),
        h('span',null,'Son 12 ayda toplam arama hacmi ', h('strong',null, fmtNum(r12)),
          ' seviyesinde; önceki 12 aya kıyasla ',
          h('strong',{style:{color: ryoy>0?'var(--green)':'var(--red)'}}, fmtPct(ryoy,1)),
          ' değişim göstermiştir. ', h('strong',null, yukselen.length.toLocaleString('tr-TR')),
          ' keyword yükseliş eğiliminde; içerik yenileme fırsatı olarak değerlendirilebilir. ',
          'Peak dönem: ', h('strong',null, ROLLING_LABELS[pIdx]), '.')),

      // ——— Aylık ritim + pazar payı ———
      h(C.SectionHeader,{icon:'saat', title:'Aylık Ritim & Spor Dalı Dağılımı',
        desc:'12 aylık arama trendi ve pazar payının dağılımı'}),
      h('div',{className:'grid grid-main'},
        h('div',{className:'card'},
          h('div',{className:'card-title-row'},
            h('h3',{style:{fontSize:14}},
              takvim ? 'Takvim Yılı Karşılaştırması' : '12 Aylık Toplam Arama Hacmi'),
            h('div',{className:'meta-sag'},
              h('div',null, takvim ? (yilAd[1]+' toplam: ') : 'Toplam Son 12 Ay: ',
                h('strong',{style:{color:'var(--ink)'}}, fmtNum(r12))),
              h('div',null, 'YoY: ',
                h('strong',{style:{color: ryoy>0?'var(--green)':'var(--red)'}}, fmtPct(ryoy,0)),
                ' · Peak: ', h('strong',{style:{color:'var(--ink)'}},
                  takvim ? U.TR_MONTHS[aggregateMonthly(rows,'m25')
                    .indexOf(Math.max(...aggregateMonthly(rows,'m25')))] : ROLLING_LABELS[pIdx])))),
          h('div',{className:'chart-orta'},
            h(C.LineChart,{series, height:250, labels, yFormat:fmtNum, legend:true}))),
        h('div',{className:'card'},
          h('div',{className:'card-title-row'},
            h('h3',{style:{fontSize:14}},'Spor Dalı Pazar Payı'),
            h('div',{className:'meta-sag'}, takvim ? (yilAd[1]+' toplamı') : 'Son 12 Ay toplamı')),
          h('div',{className:'chart-orta', style:{marginBottom:12}},
            h(C.Donut,{size:190, data: sporG.slice(0,9).map(g=>({
              label:g.label, value:hacimFor(g,viewMode), color:SPOR_RENK()[g.ust]||'#BAB0AC'})),
              onSliceClick: d => onSelectGroup('spor', d.label)})),
          h('div',{className:'pay-scroll'},
            h(C.ShareBars,{rows: sporG.map(g=>({
              label:g.label, value:hacimFor(g,viewMode), share:g.share, yoy:yoyFor(g,viewMode),
              title:grupAciklama(g), color:SPOR_RENK()[g.ust]||'#BAB0AC'}))})),
          h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:8}},
            sporG.length+' spor dalı · liste kendi içinde kaydırılabilir'))),

      // ——— Sezonsallık matrisi ———
      h(C.SectionHeader,{icon:'takvim', title:'Sezon Takvimi & Mevsimsel Ritim',
        desc:'grupların aylık arama ritmi ve karşılaştırmalı peak dağılımı',
        actions: h(C.InfoIcon,{title:'Sezonsallık matrisi nasıl okunur?'},
          h('p',null,'Her hücrede üstte ilgili ayın arama hacmi, altında önceki dönemin aynı ayına ' +
            'kıyasla YoY değişimi yer alır.'),
          h('p',null,'Renk skalası satır içindedir: kırmızı dip, sarı orta, yeşil peak. ' +
            'Nokta işareti satırın zirve ayını gösterir.'),
          h('p',null,'Seviye düğmeleriyle kırılım ekseni, sıralama düğmeleriyle satır sırası ' +
            'değiştirilebilir; varlık tipi düğmeleri matrisi takım, oyuncu, maç veya lig ' +
            'satırlarıyla sınırlar. Satıra tıklandığında o grubun detayı açılır.'))}),
      h(SezonTakvimi,{rows, viewMode, onSelectGroup, baslik:'Sezonsallık'}),

      // ——— Karne (bağımsız ölçek) ———
      h(C.SectionHeader,{icon:'karne', title:'Spor Dalı Karnesi',
        desc:'her spor dalı kendi ölçeğinde · karta tıklayın, detayı açılır'}),
      h('div',{className:'card'},
        h(C.SmallMultiples,{yScale:'independent',
          toplamEtiket: takvim ? yilAd[1] : 'Son 12 Ay',
          monthsLabels: takvim ? U.TR_MONTHS : ROLLING_LABELS,
          items: sporG.slice(0,14).map(g=>({label:g.label, color:SPOR_RENK()[g.ust]||'#BAB0AC',
            values: takvim?g.cal25:g.roll, prevValues: takvim?g.cal24:g.prev,
            yoy: yoyFor(g,viewMode), title:grupAciklama(g)})),
          onClick: it => onSelectGroup('spor', it.label)}),
        h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:10, lineHeight:1.6}},
          'Kart başlığındaki yüzde rozeti ', h('strong',null,'YoY değişimdir'),
          ' (Son 12 Ay / Önceki 12 Ay). Sağ alttaki değer ', h('strong',null,'Son 12 Ay toplam arama hacmidir'),
          '. Çubukların üzerine gelindiğinde ilgili ayın hacmi ve önceki dönemin aynı ayına ',
          'kıyasla YoY değişimi görünür. Her kart kendi maksimumuna göre ölçeklenir; ',
          'bu nedenle kartlar arası çubuk yükseklikleri değil, hacim değerleri karşılaştırılabilir.')),

      // ——— YoY kazanan / kaybeden ———
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',{className:'card'},
          h('div',{className:'card-title-row'},
            h('h3',{style:{fontSize:14}},'Spor Dalı YoY · Kazanan & Kaybeden'),
            h('span',{className:'txt-3',style:{fontSize:10.5}},'Son 12 Ay / Önceki 12 Ay')),
          h(C.BarChart,{height:250, colorBy:'yoy', yFormat:v=>fmtPct(v,0),
            data: sporG.filter(g=>yoyFor(g,viewMode)!=null).slice(0,12)
              .map(g=>({label:g.label, value:yoyFor(g,viewMode)})),
            onBarClick: d => onSelectGroup('spor', d.label)})),
        h('div',{className:'card'},
          h('div',{className:'card-title-row'},
            h('h3',{style:{fontSize:14}},'Çeyreklik Peak Dağılımı'),
            h('span',{className:'txt-3',style:{fontSize:10.5}},'Son 12 Ay payları')),
          h('div',{style:{display:'flex',flexDirection:'column',gap:10, marginTop:6}},
            ceyrekDag.map(c=>h('div',{key:c.label},
              h('div',{style:{fontSize:12, fontWeight:600, marginBottom:4}}, c.label),
              h(C.QStack,{q1:c.q[0], q2:c.q[1], q3:c.q[2], q4:c.q[3]}))),
            h('div',{className:'legend', style:{marginTop:6}},
              ['Q1','Q2','Q3','Q4'].map((q,i)=>h('div',{key:q, className:'li'},
                h('div',{className:'swatch', style:{background:['#3B82F6','#EF4444','#F59E0B','#10B981'][i]}}),
                h('span',null,q))))))),

      // ——— Top listeler ———
      h(C.SectionHeader,{icon:'kupa', title:'Öne Çıkan Keyword\'ler',
        desc:'satıra tıklayın, keyword detayı açılır'}),
      h('div',{className:'grid grid-3'},
        h(MiniListe,{baslik:'Top 10 Hacim Lideri', veri:enBuyuk}),
        h(MiniListe,{baslik:'En Çok Büyüyen', veri:enArtan, sag:'↑ Kazanan', tone:'pos'}),
        h(MiniListe,{baslik:'En Çok Daralan', veri:enDusen, sag:'↓ Kaybeden', tone:'neg'})),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ KEYWORD TABLOSU (Özdilek deseni)
  function KeywordTablosu({rows, setKeywordModal, viewMode='rolling', sayfaBoyu=50, kompakt}){
    const [sayfa, setSayfa] = React.useState(0);
    const [sira, setSira] = React.useState({k:'r12', d:-1});
    React.useEffect(()=>setSayfa(0), [rows]);
    const takvim = viewMode==='calendar';
    const veri = React.useMemo(()=>{
      const a=[...rows];
      a.sort((x,y)=>{ const xv=x[sira.k], yv=y[sira.k];
        if(xv==null) return 1; if(yv==null) return -1;
        return (xv>yv?1:xv<yv?-1:0)*sira.d; });
      return a;
    },[rows, sira]);
    const sayfaSayisi = Math.max(1, Math.ceil(veri.length/sayfaBoyu));
    const dilim = veri.slice(sayfa*sayfaBoyu, (sayfa+1)*sayfaBoyu);
    const th=(lab,k,num)=>h('th',{key:k, className:num?'num':'',
      style:{cursor:'pointer', userSelect:'none'},
      onClick:()=>setSira(x=>({k, d: x.k===k ? -x.d : -1}))},
      lab, sira.k===k ? (sira.d>0?' ↑':' ↓') : '');
    const kolSayisi = kompakt ? 8 : 12;

    return h('div',{className:'card flush'},
      h('div',{className:'tbl-wrap'},
        h('table',{className:'tbl'},
          h('thead',null,h('tr',null,
            th('Keyword','kw'),
            !kompakt && th('Spor Dalı','spor'),
            !kompakt && th('Organizasyon','org'),
            !kompakt && th('Sayfa Tipi','st'),
            !kompakt && th('Varlık','ent'),
            th(takvim ? (D().meta.yillar[0]||'Önceki Yıl') : 'Önceki 12 Ay', takvim?'_p':'p12', true),
            th(takvim ? (D().meta.yillar[1]||'Son Yıl') : 'Son 12 Ay', takvim?'_r':'r12', true),
            th('YoY', takvim?'yoy':'ryoy', true),
            h('th',{key:'trend'},'12 Ay Trend'),
            h('th',{key:'pa'},'Peak Ay'),
            h('th',{key:'pq'},'Peak Ç.'),
            !kompakt && h('th',{key:'bk'},'Bucket'))),
          h('tbody',null,
            dilim.length===0 && h('tr',null,h('td',{colSpan:kolSayisi, className:'empty'},'Sonuç bulunamadı')),
            dilim.map((r,i)=>{
              const seri = takvim ? (r.m25||[]) : U.rollingOf(r);
              const pi = seri.indexOf(Math.max(...seri));
              const pq = U.peakQuarterIdx(U.rollingOf(r)) + 1;
              const onceki = takvim ? (r.m24||[]).reduce((a,b)=>a+(b||0),0) : r.p12;
              const son    = takvim ? (r.m25||[]).reduce((a,b)=>a+(b||0),0) : r.r12;
              return h('tr',{key:r.kw, className:'clickable', onClick:()=>setKeywordModal(r)},
                h('td',{className:'kw-cell', style:{maxWidth:230}}, r.kw),
                !kompakt && h('td',{style:{fontSize:12}},
                  h('div',{style:{display:'flex',alignItems:'center',gap:5}},
                    h('div',{style:{width:7,height:7,borderRadius:2,flexShrink:0,
                      background:(window.SPOR_RENK||{})[r.spor]||'#BAB0AC'}}),
                    h('span',null, r.spor||'–'))),
                !kompakt && h('td',{style:{fontSize:12,color:'var(--ink-2)'}}, r.org||'–'),
                !kompakt && h('td',{style:{fontSize:12,color:'var(--ink-3)'}}, r.st||'–'),
                !kompakt && h('td',null, r.ent ? h('span',{className:'cat-pill'}, r.ent) : '–'),
                h('td',{className:'num'}, fmtFull(onceki)),
                h('td',{className:'num'}, fmtFull(son)),
                h('td',{className:'num'}, h(YoY,{v: yoyFor(r, viewMode), tip: yoyEtiketFor(viewMode)})),
                h('td',{style:{width:110}}, h(C.Sparkline,{values:seri, w:100, h:26,
                  color: SEZ_RENK[r.sinif]||'var(--accent)'})),
                h('td',null, h('span',{className:'pill neu'},
                  takvim ? (U.TR_MONTHS[pi]||'–') : (ROLLING_LABELS[pi]||'–'))),
                h('td',null, h('span',{className:'pill q'+pq,
                  title:'Son 12 ayın en yüksek hacimli çeyreği'}, qLabel(pq-1))),
                !kompakt && h('td',null, h('span',{className:'cat-pill'}, r.bucket)));
            }))))
      ,
      sayfaSayisi>1 && h('div',{style:{display:'flex',justifyContent:'center',gap:8,padding:14,
        borderTop:'1px solid var(--line)'}},
        h('button',{className:'chip-btn', style:{padding:'6px 12px',borderRadius:999},
          disabled:sayfa===0, onClick:()=>setSayfa(p=>Math.max(0,p-1))},'← Önceki'),
        h('span',{style:{padding:'6px 12px',fontSize:13,color:'var(--ink-2)'}},
          `Sayfa ${sayfa+1}/${sayfaSayisi} · ${veri.length.toLocaleString('tr-TR')} kayıt`),
        h('button',{className:'chip-btn', style:{padding:'6px 12px',borderRadius:999},
          disabled:sayfa>=sayfaSayisi-1, onClick:()=>setSayfa(p=>Math.min(sayfaSayisi-1,p+1))},'Sonraki →')));
  }

  const KW_CSV = [
    {label:'Keyword',key:'kw'},{label:'Spor Dalı',key:'spor'},{label:'Organizasyon',key:'org'},
    {label:'Sayfa Tipi',key:'st'},{label:'Intent',key:'it'},{label:'Varlık Tipi',key:'ent'},
    {label:'Yayın Hakkı',key:'hak'},{label:'Önceki 12 Ay',key:'p12'},{label:'Son 12 Ay',key:'r12'},
    {label:'YoY %',get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
    {label:'Takvim YoY %',get:r=>r.yoy==null?'':(r.yoy*100).toFixed(1)},
    {label:'Mevsim Tipi',key:'sinif'},{label:'Bucket',key:'bucket'},{label:'Trend',key:'trend'},
    {label:'Peak Ay',get:r=>r.rpeakSerial?serialToRollingLabel(r.rpeakSerial):''},
  ];

  // ══════════════════════════════════════════ GRUPLAR
  function GruplarTab({rows, viewMode, secili, setSecili, setKeywordModal, onSelectGroup, onNavigateKw}){
    const [seviye, setSeviye] = React.useState('org');
    const [altSeviye, setAltSeviye] = React.useState('');
    const gruplar = React.useMemo(()=>groupBy(rows, seviye, altSeviye||null), [rows,seviye,altSeviye]);
    const g = secili ? gruplar.find(x=>x.ust===secili.deger) : null;

    return h('div',{className:'tab-content-anim'},
      h('div',{className:'filter-panel', style:{marginBottom:14}},
        h('div',{className:'filter-panel-label'}, h('strong',null,'Kırılım')),
        h('div',{className:'segmented'},
          Object.entries(FACET_ETIKET).filter(([id])=>
            ['spor','org','st','it','ent','hak','mus','sev','cins','cog','ktm','sinif','bucket'].includes(id)
          ).map(([id,lab])=>h('button',{key:id, className: seviye===id?'active':'',
            onClick:()=>{setSeviye(id); setSecili(null);}}, lab))),
        h('div',{style:{marginLeft:'auto', display:'flex', gap:6, alignItems:'center'}},
          h('span',{className:'txt-3', style:{fontSize:11}},'Alt kırılım'),
          h('select',{value:altSeviye, onChange:e=>setAltSeviye(e.target.value),
            style:{fontSize:12, padding:'5px 8px', borderRadius:8,
              border:'1px solid var(--line)', background:'var(--bg-card)', color:'var(--ink)'}},
            h('option',{value:''},'Yok'),
            Object.entries(FACET_ETIKET).filter(([id])=>id!==seviye &&
              ['spor','org','st','it','ent','hak','mus','cins','ktm'].includes(id))
              .map(([id,lab])=>h('option',{key:id, value:id}, lab))),
          h('button',{className:'chip-btn',
            onClick:()=>downloadCSV(`tvplus-${seviye}.csv`, toCSV(gruplar,[
              {label:FACET_ETIKET[seviye],key:'label'},{label:'Önceki 12 Ay',key:'p12'},
              {label:'Son 12 Ay',key:'r12'},{label:'YoY %',get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
              {label:'Keyword',key:'kwCount'},{label:'Pay %',get:r=>(r.share*100).toFixed(2)},
              {label:'Peak Ay',key:'peakLabel'},{label:'Peak Çeyrek',get:r=>qLabel(r.peakQ)},
              {label:'Mevsim Tipi',key:'sezType'}]))}, '↓ CSV'))),

      g && h('div',{className:'card drill-card', style:{marginBottom:16}},
        h('div',{className:'card-title-row'},
          h('div',null,
            (()=>{ const u=ustDeger(g); return u && u!==g.label
              ? h('div',{className:'txt-3', style:{fontSize:11.5, fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'.06em'}}, u) : null; })(),
            h('h3',{style:{fontSize:18}}, g.label)),
          h(YoY,{v:yoyFor(g,viewMode), tip:yoyEtiketFor(viewMode)}),
          h('button',{className:'chip-btn', style:{marginLeft:'auto'},
            onClick:()=>setSecili(null)},'× Kapat')),
        h('div',{className:'grid grid-kpi kpi-5', style:{margin:'12px 0'}},
          h(C.Kpi,{label: viewMode==='calendar' ? (D().meta.yillar[1]+' Toplam') : 'Son 12 Ay',
            value:fmtNum(hacimFor(g,viewMode)), sub:g.kwCount+' keyword', accent:true}),
          h(C.Kpi,{label: viewMode==='calendar' ? (D().meta.yillar[0]+' Toplam') : 'Önceki 12 Ay',
            value:fmtNum(oncekiHacimFor(g,viewMode)),
            chip: yoyFor(g,viewMode)==null?null:fmtPct(yoyFor(g,viewMode),1),
            chipClass: (yoyFor(g,viewMode)||0)>0?'pos':'neg'}),
          h(C.Kpi,{label:'Pay', value:(g.share*100).toFixed(1).replace('.',',')+'%'}),
          h(C.Kpi,{label:'Peak', value:g.peakLabel, sub:qLabel(g.peakQ)}),
          h(C.Kpi,{label:'Mevsim Tipi', value:g.sezType, sub:`CV ${g.cv} · peak/dip ${g.pdRatio}`})),
        h(C.LineChart,{...(()=>{const s=seriesFor(g,viewMode); return {series:s.series, labels:s.labels};})(),
          height:220, yFormat:fmtNum, legend:true}),
        h('div',{style:{marginTop:14}},
          h('div',{className:'txt-3', style:{fontSize:11, marginBottom:6}},'En yüksek 10 keyword'),
          h(KeywordTablosu,{rows:g.rows.slice(0,10), setKeywordModal, viewMode, sayfaBoyu:10, kompakt:true})),
        h('button',{className:'chip-btn', style:{marginTop:12},
          onClick:()=>onNavigateKw({alan:seviye, deger:g.ust})},
          'Bu grubun tüm keyword\'lerini gör →')),

      h(SezonTakvimi,{rows, viewMode, onSelectGroup, baslik:'Sezonsallık',
        seviye, setSeviye:(v)=>{setSeviye(v); setSecili(null);},
        aciklama:`${FACET_ETIKET[seviye]} kırılımı · alttaki tablo ve grafikler aynı eksene bağlıdır`}),
      h(C.SectionHeader,{icon:'liste', title:'Grup Detayları',
        desc:`${FACET_ETIKET[seviye]} ekseninde ${gruplar.length.toLocaleString('tr-TR')} grup · satıra tıklayın, detay kartı açılır`}),
      h(GrupTablosu,{gruplar, seviye, onSelectGroup, viewMode}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ KEYWORD
  function KeywordTab({rows, viewMode, setKeywordModal}){
    const [q, setQ] = React.useState('');
    const veri = React.useMemo(()=>{
      const qq=q.trim().toLowerCase();
      return qq ? rows.filter(r=>r.kw.includes(qq)) : rows;
    },[rows,q]);
    const takvim = viewMode==='calendar';
    const son = veri.reduce((a,k)=>a+(takvim?(k.m25||[]).reduce((x,y)=>x+(y||0),0):(k.r12||0)),0);
    const onc = veri.reduce((a,k)=>a+(takvim?(k.m24||[]).reduce((x,y)=>x+(y||0),0):(k.p12||0)),0);
    const yoy = onc>0 ? (son-onc)/onc : null;
    const yuk = veri.filter(k=>(yoyFor(k,viewMode)||0)>0.05).length;
    const dus = veri.filter(k=>(yoyFor(k,viewMode)||0)<-0.05).length;
    return h('div',{className:'tab-content-anim'},
      h('div',{className:'toolbar'},
        h('input',{className:'input input-search', placeholder:'Keyword ara…', value:q,
          onChange:e=>setQ(e.target.value), style:{flex:1, minWidth:200}}),
        h('span',{className:'txt-3', style:{fontSize:13}}, fmtNum(veri.length)+' keyword'),
        h(C.CopyButton,{getData:()=>({
          headers:['Keyword','Spor Dalı','Organizasyon','Sayfa Tipi','Önceki 12 Ay','Son 12 Ay','YoY %','Bucket','Peak Ay'],
          rows: veri.map(r=>{ const roll=U.rollingOf(r);
            return [r.kw, r.spor||'', r.org||'', r.st||'', r.p12, r.r12,
              ((r.ryoy||0)*100).toFixed(2)+'%', r.bucket||'', ROLLING_LABELS[roll.indexOf(Math.max(...roll))]||'']; })
        })}),
        h('button',{className:'chip-btn', style:{padding:'6px 12px',borderRadius:999},
          onClick:()=>downloadCSV('tvplus-keyword.csv', toCSV(veri, KW_CSV))},'↓ CSV')),
      h('div',{className:'grid grid-kpi kpi-4', style:{marginBottom:14}},
        h(C.Kpi,{label:'Filtrelenen KW', value:fmtNum(veri.length), accent:true,
          sub:`${D().meta.toplamKeyword.toLocaleString('tr-TR')} toplam içinden`}),
        h(C.Kpi,{label:'Toplam Hacim', value:fmtNum(son),
          chip: yoy==null?null:fmtPct(yoy,1), chipClass: (yoy||0)>0?'pos':'neg',
          sub: takvim ? (D().meta.yillar[1]+' toplam') : 'Son 12 Ay toplam'}),
        h(C.Kpi,{label:'Yükselen', value:fmtNum(yuk), chip:'↑', chipClass:'pos', sub:'görünen içinde'}),
        h(C.Kpi,{label:'Düşen', value:fmtNum(dus), chip:'↓', chipClass:'neg', sub:'görünen içinde'})),
      h(KeywordTablosu,{rows:veri, setKeywordModal, viewMode, sayfaBoyu:50}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ TRENDLER & SEZONSALLIK
  function TrendlerTab({rows, viewMode, setKeywordModal, onSelectGroup}){
    const sezG = groupBy(rows,'sinif');
    const sporG = groupBy(rows,'spor');
    const peakDag = ROLLING_LABELS.map((l,i)=>({label:l,
      value: rows.reduce((a,k)=>a + (U.rollingOf(k)[i]||0), 0)}));
    const yuk = rows.filter(k=>k.ryoy!=null && k.r12>=12000).sort((a,b)=>b.ryoy-a.ryoy).slice(0,25);
    const dus = rows.filter(k=>k.ryoy!=null && k.r12>=12000).sort((a,b)=>a.ryoy-b.ryoy).slice(0,25);
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Sezonsallık ve trend nasıl hesaplanıyor?', icon:'isi'},
        h('p',null,'Mevsim tipi, Son 12 Ay serisinin değişkenlik katsayısı (CV) ve peak/dip ' +
          'oranıyla belirlenir: CV 0.35 altı ', h('strong',null,'Evergreen'), ', peak/dip ≥ 20 ' +
          'veya CV ≥ 1.0 ', h('strong',null,'Spike'), ', kalanlar ', h('strong',null,'Seasonal'),'.'),
        h('p',null,'Trend etiketi Son 12 Ay / Önceki 12 Ay karşılaştırmasından gelir: ' +
          '+%5 üzeri Yükselen, −%5 altı Düşen, arası Stabil.')),
      h('div',{className:'grid grid-kpi kpi-4'},
        sezG.map(s=>h(C.Kpi,{key:s.label, label:s.label, value:fmtNum(s.r12),
          sub:`${s.kwCount.toLocaleString('tr-TR')} keyword · %${(s.share*100).toFixed(1)}`,
          chip: s.ryoy==null?null:fmtPct(s.ryoy,0),
          chipClass: s.ryoy==null?'neu':(s.ryoy>0?'pos':'neg')}))),
      h(C.SectionHeader,{icon:'takvim', title:'Aylık talep ritmi',
        desc:'Son 12 Ay · çubuğa gelin, ayın toplam hacmi görünür'}),
      h('div',{className:'card'}, h(C.BarChart,{data:peakDag, height:230, yFormat:fmtNum, colorBy:'flat'})),
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',{className:'card'},
          h('div',{className:'card-title-row'}, h('h3',{style:{fontSize:14}},'Spor Dalı YoY')),
          h(C.BarChart,{height:250, colorBy:'yoy', yFormat:v=>fmtPct(v,0),
            data: sporG.filter(g=>g.ryoy!=null).slice(0,12).map(g=>({label:g.label, value:g.ryoy})),
            onBarClick: d=>onSelectGroup('spor', d.label)})),
        h('div',{className:'card'},
          h('div',{className:'card-title-row'}, h('h3',{style:{fontSize:14}},'Mevsim tipi dağılımı')),
          h('div',{style:{display:'grid', placeItems:'center'}},
            h(C.Donut,{size:190, data: sezG.map(s=>({label:s.label, value:s.r12,
              color:SEZ_RENK[s.label]||'#BAB0AC'}))})))),
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',null, h(C.SectionHeader,{icon:'trend', title:'Yükselen keyword\'ler',
          desc:'YoY artışı en yüksek · Son 12 Ay 12.000+'}),
          h(KeywordTablosu,{rows:yuk, setKeywordModal, viewMode, sayfaBoyu:25, kompakt:true})),
        h('div',null, h(C.SectionHeader,{icon:'trend', title:'Gerileyen keyword\'ler',
          desc:'YoY daralması en yüksek · Son 12 Ay 12.000+'}),
          h(KeywordTablosu,{rows:dus, setKeywordModal, viewMode, sayfaBoyu:25, kompakt:true}))),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ SAYFA TİPİ & INTENT
  function SayfaTipiTab({rows, viewMode, setKeywordModal, onSelectGroup}){
    const stG = groupBy(rows,'st'), itG = groupBy(rows,'it'), entG = groupBy(rows,'ent');
    const izleme = rows.filter(k=>k.it==='İzleme');
    const veri = rows.filter(k=>['Puan Durumu','Fikstür','Maç/Skor'].includes(k.st));
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Sayfa tipi neden belirleyici?', icon:'hedef', defaultOpen:true},
        h('p',null,'Puan durumu ve fikstür sorgularında Google tam cevabı kendi spor bileşeninde ' +
          'verir; bu ailede organik tıklama oranı pozisyondan bağımsız olarak düşük kalmaktadır.'),
        h('p',null,'İzleme intent\'inde ("canlı izle", "nerede izlenir", "hangi kanalda") bileşen ' +
          'devreye girmez, SERP doğrudan web sonuçlarıyla başlar. Yayın hakkı sahibi bir platform ' +
          'için bu aile doğal üstünlük alanıdır.')),
      h('div',{className:'grid grid-kpi kpi-4'},
        h(C.Kpi,{label:'İzleme Intent\'i', value:fmtNum(topR12(izleme)), accent:true,
          sub:izleme.length.toLocaleString('tr-TR')+' keyword · bileşen bastırmıyor'}),
        h(C.Kpi,{label:'Veri Sayfası Talebi', value:fmtNum(topR12(veri)), sub:'bileşen cevabı veriyor'}),
        h(C.Kpi,{label:'Bilgi Intent\'i', value:fmtNum(topR12(rows.filter(k=>k.it==='Bilgi')))}),
        h(C.Kpi,{label:'Ticari Intent', value:fmtNum(topR12(rows.filter(k=>k.it==='Ticari')))})),
      h(SezonTakvimi,{rows, viewMode, onSelectGroup, baslik:'Sayfa tipi sezonsallığı'}),
      h(C.SectionHeader,{icon:'karne', title:'Sayfa tipi karnesi',
        desc:'her sayfa tipi kendi ölçeğinde · Son 12 Ay'}),
      h('div',{className:'card'},
        h(C.SmallMultiples,{yScale:'independent', monthsLabels:ROLLING_LABELS,
          toplamEtiket:'Son 12 Ay',
          items: stG.slice(0,14).map(g=>({label:g.label, values:g.roll, prevValues:g.prev,
            yoy:g.ryoy, title:grupAciklama(g)})),
          onClick: it=>onSelectGroup('st', it.label)}),
        h('div',{className:'txt-3', style:{fontSize:10.5, marginTop:10}},
          'Sağ alttaki değer Son 12 Ay toplam arama hacmidir.')),
      h('div',{className:'grid grid-2', style:{marginTop:18}},
        h('div',{className:'card'}, h('h3',{style:{fontSize:14, marginBottom:12}},'Intent katmanı'),
          h(C.ShareBars,{rows:itG.map(g=>({label:g.label, value:g.r12, share:g.share, yoy:g.ryoy, title:grupAciklama(g)}))})),
        h('div',{className:'card'}, h('h3',{style:{fontSize:14, marginBottom:12}},'Varlık tipi'),
          h(C.ShareBars,{rows:entG.map(g=>({label:g.label, value:g.r12, share:g.share, yoy:g.ryoy, title:grupAciklama(g)}))}))),
      h(C.SectionHeader,{icon:'izle', title:'İzleme intent\'i · en yüksek talep',
        actions: h('button',{className:'chip-btn',
          onClick:()=>downloadCSV('tvplus-izleme-intent.csv', toCSV(izleme, KW_CSV))},'↓ CSV')}),
      h(KeywordTablosu,{rows:izleme, setKeywordModal, viewMode, sayfaBoyu:25}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ TAKIM & OYUNCU
  function EntityTab({rows, viewMode, setKeywordModal, onSelectGroup, onNavigateKw}){
    const tipler = [...new Set(rows.map(k=>k.ent).filter(Boolean))];
    const [tip, setTip] = React.useState(tipler.includes('Takım')?'Takım':tipler[0]);
    const veri = rows.filter(k=>k.ent===tip);
    const ktmG = groupBy(veri,'ktm'), orgG = groupBy(veri,'org');
    return h('div',{className:'tab-content-anim'},
      h('div',{className:'filter-panel', style:{marginBottom:14}},
        h('div',{className:'filter-panel-label'}, h('strong',null,'Varlık tipi')),
        h('div',{className:'segmented'}, tipler.map(t=>h('button',{key:t,
          className: tip===t?'active':'', onClick:()=>setTip(t)}, t,
          h('span',{className:'badge', style:{marginLeft:5}},
            fmtNum(rows.filter(k=>k.ent===t).length))))),
        h('div',{style:{marginLeft:'auto', fontSize:12.5}},
          h('strong',null, fmtNum(topR12(veri))), ' Son 12 Ay')),
      ktmG.length>1 && h('div',{className:'card', style:{marginBottom:16}},
        h('h3',{style:{fontSize:14, marginBottom:10}},'Katman dağılımı'),
        h(C.ShareBars,{rows:ktmG.map(g=>({label:g.label, value:g.r12, share:g.share, yoy:g.ryoy, title:grupAciklama(g)}))})),
      h(SezonTakvimi,{rows:veri, viewMode, onSelectGroup, baslik:tip+' sezonsallığı'}),
      h(C.SectionHeader,{icon:'saha', title:tip+' · organizasyon kırılımı'}),
      h(GrupTablosu,{gruplar:orgG, seviye:'org', onSelectGroup, viewMode}),
      h(C.SectionHeader,{icon:'karne', title:tip+' talebi',
        actions: h('button',{className:'chip-btn',
          onClick:()=>downloadCSV(`tvplus-${tip.toLowerCase()}.csv`, toCSV(veri, KW_CSV))},'↓ CSV')}),
      h(KeywordTablosu,{rows:veri, setKeywordModal, viewMode, sayfaBoyu:25}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ YAYIN HAKKI DIŞI
  function HakDisiTab({rows, viewMode, setKeywordModal, onSelectGroup}){
    const disi = rows.filter(k=>k.hak==='TV+ Yok');
    const orgG = groupBy(disi,'org');
    const toplam = topR12(rows)||1;
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Bu havuz neden önemli?', icon:'kilit', defaultOpen:true},
        h('p',null,'Puan durumu ve fikstür gibi veri sayfaları yayın hakkı gerektirmemektedir. ' +
          'Bu havuz, hakkı bulunmayan organizasyonlarda dahi veri sayfası üzerinden trafik çekip ' +
          'yayın hakkı olan içeriğe köprü kurma fırsatı olarak değerlendirilebilir.'),
        h('p',null,'Öte yandan bu sorguların büyük bölümü Google\'ın spor bileşeni tarafından ' +
          'karşılandığından tıklama beklentisi ölçülü tutulmalıdır.')),
      h('div',{className:'grid grid-kpi kpi-4'},
        h(C.Kpi,{label:'Yayın Hakkı Dışı Talep', value:fmtNum(topR12(disi)), accent:true,
          sub:`toplam talebin %${(100*topR12(disi)/toplam).toFixed(1)}'i`}),
        h(C.Kpi,{label:'Organizasyon', value:orgG.length}),
        h(C.Kpi,{label:'Keyword', value:fmtNum(disi.length)}),
        h(C.Kpi,{label:'İzleme Talebi', value:fmtNum(topR12(disi.filter(k=>k.it==='İzleme')))})),
      h(SezonTakvimi,{rows:disi, viewMode, onSelectGroup, baslik:'Hak dışı talep sezonsallığı'}),
      h(C.SectionHeader,{icon:'sinyal', title:'Hakkı olmayan organizasyonlar'}),
      h(GrupTablosu,{gruplar:orgG, seviye:'org', onSelectGroup, viewMode}),
      h(C.SectionHeader,{icon:'anahtar', title:'En yüksek talepli keyword\'ler',
        actions: h('button',{className:'chip-btn',
          onClick:()=>downloadCSV('tvplus-hak-disi.csv', toCSV(disi, KW_CSV))},'↓ CSV')}),
      h(KeywordTablosu,{rows:disi, setKeywordModal, viewMode, sayfaBoyu:25}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ KARAR AĞACI
  function kararVer(o){
    if(o.hak==='TV+ Yok')
      return o.r12>=6000000
        ? {karar:'Veri Sayfası', renk:'#B07AA1', gerekce:'Yayın hakkı bulunmuyor ancak talep çok yüksek. Puan durumu ve fikstür sayfaları hak gerektirmediğinden köprü kurgusu değerlendirilebilir.'}
        : {karar:'Şimdilik Değil', renk:'#9C9C9C', gerekce:'Yayın hakkı bulunmuyor ve talep büyüklüğü ayrı sayfa yatırımını gerektirecek seviyede değil.'};
    if(o.r12<240000)
      return {karar:'Şimdilik Değil', renk:'#9C9C9C', gerekce:'Talep hacmi ayrı sayfa seti için sınırlı kalmaktadır. Takip listesinde tutulabilir.'};
    if(o.sezType==='Spike' && o.altPay<0.12)
      return {karar:'Etkinlik Ölçekli', renk:'#F5A623', gerekce:'Talep tek bir pencereye yığılıyor ve alt sayfa derinliği düşük. Aktif dönemde derinleşen, sezon dışında sadeleşen yapı uygundur.'};
    if(o.altPay>=0.12 && o.r12>=1200000)
      return {karar:'Hub', renk:'#2E7D32', gerekce:'Hem yüksek talep hem alt sayfa derinliği mevcut. Puan durumu, fikstür, takım ve oyuncu katmanı birlikte kurulabilir.'};
    return {karar:'Landing', renk:'#4E79A7', gerekce:'Talep anlamlı ancak alt sayfa derinliği sınırlı. Tek güçlü sayfa üzerinde izleme intent\'ine odaklanılabilir.'};
  }

  const KOVA_TANIM = {
    'Hub': 'Çok sayfalı yapı. Organizasyonun hub sayfası altında puan durumu, fikstür, takım ve oyuncu sayfaları birlikte kurulur. Hem yüksek talep hem alt sayfa derinliği bulunan organizasyonlar için uygundur; iç bağlantı ağı lig, takım, oyuncu ve maç sayfaları arasında kapalı devre oluşturur.',
    'Landing': 'Tek güçlü sayfa. Talep anlamlı ancak alt sayfa derinliği sınırlı olduğunda tercih edilir. Sayfa izleme intent\'ine ("canlı izle", "nerede izlenir", "hangi kanalda") odaklanır; veri tabloları sayfa içinde modül olarak durur, ayrı URL açılmaz.',
    'Etkinlik Ölçekli': 'Aktif dönemde derinleşen, sezon dışında sadeleşen yapı. Talebin tek bir pencereye yığıldığı ve alt sayfa derinliğinin düşük olduğu organizasyonlar için uygundur. Etkinlik döneminde fikstür, sonuç ve yayın sayfaları açılır; dönem bitince yapı tek bir özet sayfaya iner.',
    'Veri Sayfası': 'Yayın hakkı bulunmayan ancak talebi çok yüksek organizasyonlar. Puan durumu ve fikstür sayfaları yayın hakkı gerektirmediğinden açılabilir; buradan yayın hakkı olan içeriğe köprü kurulur. Tıklama beklentisi ölçülü tutulmalıdır, çünkü bu sorguların cevabı Google\'ın kendi spor bileşeninde verilmektedir.',
    'Şimdilik Değil': 'Talep büyüklüğü ayrı sayfa yatırımını gerektirecek seviyede değil veya yayın hakkı bulunmuyor. Takip listesinde tutulur; talep eşiği aşıldığında yeniden değerlendirilebilir.',
  };
  const kovaTanim = k => KOVA_TANIM[k] || '';

  function KararTab({rows, viewMode, onSelectGroup, setKeywordModal}){
    const [acikKova, setAcikKova] = React.useState(null);
    const orgRows = React.useMemo(()=>groupBy(rows,'org').map(g=>{
      const alt = topR12(g.rows.filter(k=>['Puan Durumu','Fikstür','Kadro','İstatistik'].includes(k.st)));
      const izl = topR12(g.rows.filter(k=>k.it==='İzleme'));
      const hak = (g.rows.find(k=>k.hak)||{}).hak || 'Doğrulanacak';
      const o = {...g, altPay: g.r12 ? alt/g.r12 : 0, izleme:izl, hak};
      return {...o, ...kararVer(o)};
    }),[rows]);
    const kovalar=['Hub','Landing','Etkinlik Ölçekli','Veri Sayfası','Şimdilik Değil'];
    const RENK={'Hub':'#2E7D32','Landing':'#4E79A7','Etkinlik Ölçekli':'#F5A623',
                'Veri Sayfası':'#B07AA1','Şimdilik Değil':'#9C9C9C'};
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Karar çerçevesi nasıl işliyor?', icon:'karar', defaultOpen:true},
        h('p',null,'Her organizasyon dört eksende değerlendirilir: ', h('strong',null,'Son 12 Ay talep büyüklüğü'),
          ', ', h('strong',null,'talep şekli'),' (Evergreen / Seasonal / Spike), ',
          h('strong',null,'alt sayfa derinliği'),' (puan durumu, fikstür, kadro ve istatistik ' +
          'sorgularının organizasyon talebi içindeki payı) ve ', h('strong',null,'yayın hakkı durumu'),'.'),
        h('p',null,'Eşikler veriye göre kalibre edilmiştir ve marka tarafının stratejik ' +
          'önceliklerine göre güncellenebilir.')),
      h('div',{className:'grid grid-kpi kpi-5'},
        kovalar.map(k=>{
          const sec = orgRows.filter(o=>o.karar===k);
          return h('button',{key:k, className:'kpi kova-kpi'+(acikKova===k?' acik':''),
            title: kovaTanim(k),
            style:{textAlign:'left', cursor:'pointer', font:'inherit', color:'var(--ink)',
              borderColor: acikKova===k ? RENK[k] : undefined},
            onClick:()=>setAcikKova(acikKova===k?null:k)},
            h('div',{className:'bar', style:{background:RENK[k]}}),
            h('div',{className:'label'}, k, ' ', h('span',{className:'kova-i'},'\u24D8')),
            h('div',{className:'value'}, sec.length),
            h('div',{className:'sub'}, fmtNum(sec.reduce((a,o)=>a+o.r12,0))+' Son 12 Ay'));
        })),
      acikKova ? (function(){
        const sec = orgRows.filter(o=>o.karar===acikKova);
        return h('div',{className:'card drill-card', style:{marginTop:14}},
          h('div',{className:'card-title-row'},
            h('div',null,
              h('div',{className:'txt-3', style:{fontSize:11.5, fontWeight:600,
                textTransform:'uppercase', letterSpacing:'.06em'}}, 'Karar kovası'),
              h('h3',{style:{fontSize:18}}, acikKova, ' ',
                h('span',{className:'chip neu', style:{fontSize:11}}, sec.length+' organizasyon'))),
            h('button',{className:'chip-btn', style:{marginLeft:'auto'},
              onClick:()=>setAcikKova(null)},'× Kapat')),
          h('p',{style:{fontSize:13, color:'var(--ink-2)', lineHeight:1.6, margin:'8px 0 14px'}},
            kovaTanim(acikKova)),
          h(GrupTablosu,{gruplar:sec, seviye:'org', onSelectGroup, viewMode}));
      })() : null,
      h('div',{className:'grid grid-2', style:{marginTop:16}},
        h('div',{className:'card'},
          h('h3',{style:{fontSize:14, marginBottom:12}},'Karar dağılımı'),
          h('div',{style:{display:'grid', placeItems:'center'}},
            h(C.Donut,{size:200, data:kovalar.map(k=>({label:k, color:RENK[k],
              value:orgRows.filter(o=>o.karar===k).reduce((a,o)=>a+o.r12,0)}))}))),
        h('div',{className:'card'},
          h('h3',{style:{fontSize:14, marginBottom:12}},'Kovalara göre pay'),
          h(C.ShareBars,{rows:kovalar.map(k=>({label:k, color:RENK[k],
            value:orgRows.filter(o=>o.karar===k).reduce((a,o)=>a+o.r12,0)}))}))),
      h(C.SectionHeader,{icon:'hedef', title:'Organizasyon bazlı karar tablosu',
        desc:'satıra tıklayın, organizasyon detayı açılır',
        actions: h('button',{className:'chip-btn', onClick:()=>downloadCSV('tvplus-karar.csv',
          toCSV(orgRows,[{label:'Organizasyon',key:'label'},{label:'Öneri',key:'karar'},
            {label:'Önceki 12 Ay',key:'p12'},{label:'Son 12 Ay',key:'r12'},
            {label:'YoY %',get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
            {label:'Mevsim Tipi',key:'sezType'},
            {label:'Alt Sayfa Payı %',get:r=>(r.altPay*100).toFixed(1)},
            {label:'İzleme Talebi',key:'izleme'},{label:'Yayın Hakkı',key:'hak'},
            {label:'Peak Ay',key:'peakLabel'},{label:'Gerekçe',key:'gerekce'}]))},'↓ CSV')}),
      h('div',{className:'tbl-wrap'},
        h('table',null,
          h('thead',null,h('tr',null,
            h('th',null,'Organizasyon'), h('th',null,'Öneri'),
            h('th',{className:'num'},'Önceki 12 Ay'), h('th',{className:'num'},'Son 12 Ay'),
            h('th',{className:'num'},'YoY'), h('th',null,'12 Ay Trend'),
            h('th',null,'Mevsim Tipi'), h('th',{className:'num'},'Alt Sayfa Payı'),
            h('th',{className:'num'},'İzleme'), h('th',null,'Yayın Hakkı'), h('th',null,'Peak Ay'))),
          h('tbody',null, orgRows.map(o=>h('tr',{key:o.label, className:'clickable',
            style:{cursor:'pointer'}, onClick:()=>onSelectGroup('org', o.ust)},
            h('td',null, h('span',{style:{fontWeight:600}}, o.label)),
            h('td',null, h('span',{className:'pill', style:{
              background:`color-mix(in srgb, ${RENK[o.karar]} 16%, transparent)`,
              color:RENK[o.karar], fontWeight:600}}, o.karar)),
            h('td',{className:'num'}, fmtFull(o.p12)),
            h('td',{className:'num'}, h('strong',null, fmtFull(o.r12))),
            h('td',{className:'num'}, h(YoY,{v:o.ryoy})),
            h('td',null, h(C.Sparkline,{values:o.roll, w:100, h:26, color:RENK[o.karar]})),
            h('td',null, h('span',{style:{color:SEZ_RENK[o.sezType], fontWeight:600}}, o.sezType)),
            h('td',{className:'num'}, '%'+(o.altPay*100).toFixed(1)),
            h('td',{className:'num'}, fmtNum(o.izleme)),
            h('td',null, h('span',{className:'pill '+(o.hak==='TV+ Var'?'pos':o.hak==='TV+ Yok'?'neg':'neu')}, o.hak)),
            h('td',null, o.peakLabel)))))),
      h(C.SectionHeader,{icon:'bilgi', title:'Gerekçeler', desc:'talep büyüklüğüne göre ilk 12'}),
      h('div',{className:'grid grid-2'},
        orgRows.slice(0,12).map(o=>h('div',{className:'card', key:o.label,
          style:{cursor:'pointer'}, onClick:()=>onSelectGroup('org', o.ust)},
          h('div',{className:'card-title-row'},
            h('h3',{style:{fontSize:15}}, o.label),
            h('span',{className:'pill', style:{
              background:`color-mix(in srgb, ${RENK[o.karar]} 16%, transparent)`,
              color:RENK[o.karar], fontWeight:600}}, o.karar)),
          h('div',{className:'txt-3', style:{fontSize:11, margin:'4px 0 8px'}},
            fmtFull(o.r12)+' Son 12 Ay · '+o.sezType+' · alt sayfa payı %'+(o.altPay*100).toFixed(1)),
          h('div',{style:{fontSize:12.5, color:'var(--ink-2)', lineHeight:1.5}}, o.gerekce)))),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ MASTER LİSTE
  function MasterTab({rows, setKeywordModal}){
    const M = D().meta;
    const KOL = [
      {label:'Keyword',key:'kw'},{label:'Son 12 Ay',key:'r12'},{label:'Önceki 12 Ay',key:'p12'},
      {label:'YoY % (rolling)',get:r=>r.ryoy==null?'':(r.ryoy*100).toFixed(1)},
      {label:'YoY % (takvim)',get:r=>r.yoy==null?'':(r.yoy*100).toFixed(1)},
      {label:'YTD YoY %',get:r=>r.ytd==null?'':(r.ytd*100).toFixed(1)},
      {label:'Aylık Ortalama',key:'sv'},{label:'Bucket',key:'bucket'},{label:'Trend',key:'trend'},
      {label:'Mevsim Tipi',key:'sinif'},{label:'CV',key:'cv'},{label:'Peak/Dip',key:'pd'},
      {label:'Peak Ay',get:r=>r.rpeakSerial?serialToRollingLabel(r.rpeakSerial):''},
      {label:'Peak Çeyrek',get:r=>qLabel((r.rpq||[]).indexOf(1))},
      ...Object.entries(FACET_ETIKET).filter(([id])=>
        ['spor','org','st','it','ent','hak','mus','sev','pres','cins','km','tb','cog','yer',
         'turk','per','tak','marka','kurum','dil','uzn','ktm','kulup'].includes(id))
        .map(([id,lab])=>({label:lab, key:id})),
      {label:'Kulüp Doğrulama',key:'dog'},{label:'Oyuncu Doğrulama',key:'odog'},
      ...D().months2024.map((m,i)=>({label:m, get:r=>r.m24[i]})),
      ...D().months2025.map((m,i)=>({label:m, get:r=>r.m25[i]})),
      ...D().months2026.map((m,i)=>({label:m, get:r=>r.m26[i]})),
    ];
    return h('div',{className:'tab-content-anim'},
      h(C.Explainer,{title:'Master liste', icon:'kutu', defaultOpen:true,
        sub:`${rows.length.toLocaleString('tr-TR')} satır · ${KOL.length} kolon`},
        h('p',null,'Filtrelenmiş liste; tüm faset öznitelikleri, üç ayrı YoY hesabı ' +
          '(rolling, takvim, YTD) ve ', h('strong',null, M.aylar.length+' aylık'),
          ' ham seriyle birlikte indirilebilir.'),
        h('p',null,'Kaynak: ', M.kaynak, '.')),
      h('div',{className:'filter-panel', style:{marginBottom:16}},
        h('div',{style:{fontSize:12.5}},
          h('strong',null, rows.length.toLocaleString('tr-TR')),' satır · ',
          h('strong',null, KOL.length),' kolon · ',
          h('strong',null, M.aylar.length),' aylık veri noktası'),
        h('button',{className:'chip-btn active', style:{marginLeft:'auto'},
          onClick:()=>downloadCSV(`tvplus-spor-master-${M.olusturma}.csv`, toCSV(rows, KOL))},
          '⬇ Master listeyi CSV indir')),
      h(C.SectionHeader,{icon:'liste', title:'Önizleme'}),
      h(KeywordTablosu,{rows, setKeywordModal, viewMode, sayfaBoyu:25}),
      h(Kaynak,{}));
  }

  // ══════════════════════════════════════════ KEYWORD MODAL
  const MODAL_FASET_GRUP = [
    ['Sınıflandırma',            ['spor','org','st','it','ent']],
    ['Organizasyon Özellikleri', ['mus','sev','pres','per','tak']],
    ['Kapsam',                   ['cins','km','tb','cog','yer','turk']],
    ['TV+ & Kaynak',             ['hak','marka','kurum','ktm','kulup']],
    ['Sorgu Özellikleri',        ['dil','uzn','bucket','sinif','trend']],
  ];

  function KeywordModal({kw, viewMode, onClose}){
    const M = D().meta;
    const takvim = viewMode==='calendar';
    const g = {roll:U.rollingOf(kw), prev:U.prevRollingOf(kw)||new Array(12).fill(0),
      cal24:kw.m24, cal25:kw.m25, cal26:kw.m26};
    const sr = seriesFor(g, viewMode);
    const t25 = (kw.m25||[]).reduce((a,b)=>a+(b||0),0);
    const t24 = (kw.m24||[]).reduce((a,b)=>a+(b||0),0);
    const yv = yoyFor(kw, viewMode);
    const mini = (lab, deger, alt, tone) => h('div',{className:'kpi-mini', key:lab},
      h('div',{className:'kpi-mini-label'}, lab),
      h('div',{className:'kpi-mini-value', style: tone?{color:tone}:null}, deger),
      alt ? h('div',{className:'kpi-mini-sub'}, alt) : null);

    return h(C.Modal,{onClose},
      h('div',{style:{marginBottom:12}},
        h('div',{className:'txt-3', style:{fontSize:10.5, textTransform:'uppercase',
          letterSpacing:'.07em', fontWeight:700}},
          [kw.spor, kw.org].filter(Boolean).join('  /  ')),
        h('h2',{style:{fontSize:20, margin:'3px 0 4px', lineHeight:1.2}}, kw.kw),
        h('div',{className:'txt-3', style:{fontSize:10.5}},
          takvim ? ('Takvim yılı görünümü · '+M.yillar.join(' / '))
                 : ('Son 12 Ay: '+ROLLING_LABELS[0]+' – '+ROLLING_LABELS[11]),
          ' · Kaynak: ', M.kaynak)),

      h('div',{className:'kpi-mini-row'},
        mini(takvim ? M.yillar[1] : 'Son 12 Ay', fmtFull(takvim ? t25 : kw.r12), kw.bucket),
        mini(takvim ? M.yillar[0] : 'Önceki 12 Ay', fmtFull(takvim ? t24 : kw.p12)),
        mini('YoY', yv==null?'–':fmtPct(yv,1), yoyEtiketFor(viewMode),
          yv==null?null:(yv>0?'var(--green)':'var(--red)')),
        mini('Aylık Ort.', fmtFull(kw.sv)),
        mini('Mevsim Tipi', kw.sinif, kw.cv!=null?('CV '+kw.cv+' · p/d '+kw.pd):null, SEZ_RENK[kw.sinif]),
        mini('Peak', kw.rpeakSerial ? serialToRollingLabel(kw.rpeakSerial) : '–',
          qLabel((kw.rpq||[]).indexOf(1)))),

      h('div',{className:'card', style:{padding:10, margin:'14px 0 10px'}},
        h(C.LineChart,{series:sr.series, labels:sr.labels, height:180, yFormat:fmtNum, legend:true})),
      h(C.Heatmap,{rows:[{label: takvim?M.yillar[1]:'Son 12 Ay',
        values: takvim?(kw.m25||[]):g.roll, prevValues: takvim?(kw.m24||[]):g.prev}],
        monthsLabels: takvim?U.TR_MONTHS:ROLLING_LABELS, showValues:true, showYoY:true}),

      h('h4',{style:{fontSize:13, margin:'20px 0 10px'}},'Öznitelikler'),
      h('div',{className:'faset-tablo'},
        MODAL_FASET_GRUP.map(function(gr){
          const baslik = gr[0], alanlar = gr[1];
          return h('div',{key:baslik, className:'faset-grup'},
            h('div',{className:'faset-grup-baslik'}, baslik),
            h('dl',{className:'faset-liste'},
              alanlar.map(function(a){
                const v = kw[a];
                const bos = (v==null || v==='');
                return h(React.Fragment,{key:a},
                  h('dt',null, FACET_ETIKET[a]||a),
                  h('dd',{className: bos?'bos':''}, bos?'–':String(v)));
              })));
        })));
  }

  return { OzetTab, GruplarTab, KeywordTab, TrendlerTab, SayfaTipiTab, EntityTab,
           HakDisiTab, KararTab, MasterTab, KeywordModal,
           SezonTakvimi, GrupTablosu, KeywordTablosu };
})();

const { useState, useMemo, useEffect } = React;

function Kpi({ lab, val, note, tone }) {
  return <div className="kpi">
    <div className="lab">{lab}</div>
    <div className="val" style={tone?{color:tone}:null}>{val}</div>
    {note && <div className="note">{note}</div>}
  </div>;
}

function Chip({ children, tone }) {
  return <span className={'chip' + (tone ? ' ' + tone : '')}>{children}</span>;
}

function SectionHeader({ title, sub }) {
  return <div className="section-h"><h2>{title}</h2>{sub && <span>{sub}</span>}</div>;
}

/* Yatay bar listesi — pay gösterimi */
function Bars({ rows, max, limit = 12, renk }) {
  const üst = max || Math.max(...rows.map(r => r.hacim), 1);
  return <div>
    {rows.slice(0, limit).map(r => (
      <div className="bar-row" key={r.ad}>
        <div className="bar-lab" title={r.ad}>{r.ad}</div>
        <div className="bar-val">{U.fmt(r.hacim)}</div>
        <div className="bar-track">
          <div className="bar-fill" style={{
            width: (100 * r.hacim / üst).toFixed(1) + '%',
            background: renk ? renk(r) : null
          }} />
        </div>
      </div>
    ))}
  </div>;
}

/* Aylık seri sparkline */
function Spark({ seri, w = 150, h = 34, renk = 'var(--accent-deep)' }) {
  if (!seri || !seri.length) return null;
  const mx = Math.max(...seri, 1);
  const step = w / Math.max(seri.length - 1, 1);
  const d = seri.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (v / mx) * (h - 3) - 1.5).toFixed(1)}`).join(' ');
  return <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
    <path d={d} fill="none" stroke={renk} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
  </svg>;
}

/* Aylık ısı şeridi */
function Heat({ seri, aylar }) {
  if (!seri || !seri.length) return null;
  const mx = Math.max(...seri, 1);
  return <div className="heat" style={{ gridTemplateColumns: `repeat(${seri.length},1fr)` }}>
    {seri.map((v, i) => <i key={i} title={`${U.ayEtiket(aylar[i])}: ${U.tam(v)}`}
      style={{ background: U.heatRenk(v / mx) }} />)}
  </div>;
}

/* Sıralanabilir tablo */
function Tablo({ kolonlar, rows, limit = 60, bosMesaj = 'Kayıt bulunamadı.' }) {
  const [sira, setSira] = useState({ k: null, yon: -1 });
  const veri = useMemo(() => {
    if (!sira.k) return rows;
    const kol = kolonlar.find(c => c.id === sira.k);
    if (!kol) return rows;
    return [...rows].sort((a, b) => {
      const x = kol.deger ? kol.deger(a) : a[kol.al], y = kol.deger ? kol.deger(b) : b[kol.al];
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sira.yon;
      return String(x ?? '').localeCompare(String(y ?? ''), 'tr') * sira.yon;
    });
  }, [rows, sira, kolonlar]);
  if (!rows.length) return <div className="empty">{bosMesaj}</div>;
  return <div className="tbl-wrap">
    <table>
      <thead><tr>{kolonlar.map(c => (
        <th key={c.id} className={c.num ? 'num' : ''} style={{ cursor: 'pointer' }}
          onClick={() => setSira(s => ({ k: c.id, yon: s.k === c.id ? -s.yon : -1 }))}>
          {c.baslik}{sira.k === c.id ? (sira.yon === -1 ? ' ↓' : ' ↑') : ''}
        </th>))}</tr></thead>
      <tbody>{veri.slice(0, limit).map((r, i) => (
        <tr key={r.kw || r.ad || i}>{kolonlar.map(c => (
          <td key={c.id} className={c.num ? 'num' : ''}>{c.render ? c.render(r) : r[c.al]}</td>
        ))}</tr>))}</tbody>
    </table>
    {veri.length > limit && <div className="empty">{U.tam(veri.length - limit)} kayıt daha var. Filtreleri daraltabilirsiniz.</div>}
  </div>;
}

/* Çoklu seçim faset filtresi */
function FasetSecim({ etiket, alan, degerler, secili, degistir }) {
  if (!degerler || !degerler.length) return null;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label>{etiket}</label>
    <select value={(secili[alan] && secili[alan][0]) || ''}
      onChange={e => degistir(alan, e.target.value ? [e.target.value] : [])}>
      <option value="">Tümü</option>
      {degerler.map(d => <option key={d} value={d}>{d}</option>)}
    </select>
  </div>;
}

/* ——— MultiSelect: referans repodaki çoklu seçim davranışı ——— */
function MultiSelect({ etiket, secenekler, secili, degistir, genislik = 190 }) {
  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => {
    if (!acik) return;
    const kapat = e => { if (!e.target.closest('.ms-root')) setAcik(false); };
    document.addEventListener('mousedown', kapat);
    return () => document.removeEventListener('mousedown', kapat);
  }, [acik]);
  const görünen = useMemo(() =>
    q ? secenekler.filter(o => String(o).toLowerCase().includes(q.toLowerCase())) : secenekler,
    [secenekler, q]);
  const özet = !secili.length ? 'Tümü'
    : secili.length === 1 ? secili[0]
    : secili.length + ' seçili';
  return <div className="ms-root" style={{ position: 'relative', width: genislik }}>
    <label>{etiket}</label>
    <button className="btn" style={{ width: '100%', textAlign: 'left', marginTop: 4, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        borderColor: secili.length ? 'var(--accent)' : null }}
      onClick={() => setAcik(a => !a)} aria-expanded={acik}>
      {özet} <span style={{ float: 'right', color: 'var(--ink-3)' }}>▾</span>
    </button>
    {acik && <div style={{ position: 'absolute', zIndex: 90, top: '100%', left: 0, minWidth: '100%',
      maxWidth: 320, background: 'var(--bg-card)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-pop)', marginTop: 4, padding: 8 }}>
      {secenekler.length > 8 && <input type="search" placeholder="Ara…" value={q}
        onChange={e => setQ(e.target.value)} style={{ width: '100%', marginBottom: 6 }} />}
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {görünen.map(o => (
          <label key={o} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 6px',
            fontSize: 12.5, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, color: 'var(--ink)' }}>
            <input type="checkbox" checked={secili.includes(o)}
              onChange={() => degistir(secili.includes(o) ? secili.filter(x => x !== o) : [...secili, o])} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o}</span>
          </label>))}
      </div>
      {secili.length > 0 && <button className="btn" style={{ width: '100%', marginTop: 6 }}
        onClick={() => degistir([])}>Temizle</button>}
    </div>}
  </div>;
}

/* ——— Modal ——— */
function Modal({ acik, kapat, baslik, children }) {
  useEffect(() => {
    if (!acik) return;
    const esc = e => e.key === 'Escape' && kapat();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [acik, kapat]);
  if (!acik) return null;
  return <div onClick={kapat} style={{ position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(16,51,47,.42)', backdropFilter: 'blur(3px)', display: 'grid',
    placeItems: 'center', padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)',
      border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)',
      maxWidth: 720, width: '100%', maxHeight: '86vh', overflowY: 'auto', padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <h3 style={{ fontSize: 18, flex: 1 }}>{baslik}</h3>
        <button className="btn" onClick={kapat} aria-label="Kapat">✕</button>
      </div>
      {children}
    </div>
  </div>;
}

/* ——— Aylık çizgi grafik ——— */
function LineChart({ seri, aylar, h = 190, renk = 'var(--accent-deep)' }) {
  if (!seri || !seri.length) return null;
  const w = 720, pl = 46, pb = 26, pt = 10;
  const mx = Math.max(...seri, 1);
  const iw = w - pl - 10, ih = h - pb - pt;
  const step = iw / Math.max(seri.length - 1, 1);
  const X = i => pl + i * step, Y = v => pt + ih - (v / mx) * ih;
  const d = seri.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const alan = `${d} L${X(seri.length - 1).toFixed(1)},${pt + ih} L${pl},${pt + ih} Z`;
  const tik = [0, .25, .5, .75, 1].map(t => mx * t);
  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
    {tik.map((t, i) => <g key={i}>
      <line x1={pl} x2={w - 10} y1={Y(t)} y2={Y(t)} stroke="var(--line-soft)" strokeWidth="1" />
      <text x={pl - 6} y={Y(t) + 3.5} textAnchor="end" fontSize="9.5" fill="var(--ink-3)">{U.fmt(t)}</text>
    </g>)}
    <path d={alan} fill={renk} opacity=".10" />
    <path d={d} fill="none" stroke={renk} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
    {seri.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="2.6" fill={renk}>
      <title>{U.ayEtiket(aylar[i])}: {U.tam(v)}</title></circle>)}
    {aylar.map((m, i) => (i % 2 === 0 || aylar.length < 8) &&
      <text key={i} x={X(i)} y={h - 8} textAnchor="middle" fontSize="9.5" fill="var(--ink-3)">
        {U.ayEtiket(m)}</text>)}
  </svg>;
}

/* ——— Isı matrisi: satır = grup, sütun = ay ——— */
function HeatMatrix({ gruplar, aylar, limit = 14 }) {
  const rows = gruplar.slice(0, limit);
  if (!rows.length) return <div className="empty">Veri yok.</div>;
  return <div className="tbl-wrap">
    <table>
      <thead><tr><th>Grup</th>{aylar.map(m => <th key={m} className="num"
        style={{ fontSize: 10 }}>{U.ayEtiket(m)}</th>)}<th className="num">Toplam</th></tr></thead>
      <tbody>{rows.map(g => {
        const mx = Math.max(...g.seri, 1);
        return <tr key={g.ad}>
          <td className="kw" style={{ whiteSpace: 'nowrap', maxWidth: 210, overflow: 'hidden',
            textOverflow: 'ellipsis' }} title={g.ad}>{g.ad}</td>
          {g.seri.map((v, i) => <td key={i} className="num" style={{ background: U.heatRenk(v / mx),
            color: v / mx > .55 ? '#10332F' : 'var(--ink-2)', fontSize: 10.5, padding: '6px 7px' }}
            title={`${U.ayEtiket(aylar[i])}: ${U.tam(v)}`}>{U.fmt(v)}</td>)}
          <td className="num" style={{ fontWeight: 600 }}>{U.fmt(g.hacim)}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

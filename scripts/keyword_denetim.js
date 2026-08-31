/* Tüm keyword'leri kural bazlı denetler. Örnekleme yapmaz: her satır her
 * kuraldan geçer, sonunda kapsanan satır sayısı doğrulanır.
 *
 *   node scripts/keyword_denetim.js            özet
 *   node scripts/keyword_denetim.js <kural>    o kuralın tüm bulguları
 */
const fs = require('fs');
global.window = {};
eval(fs.readFileSync(__dirname + '/../data/dashboard.js', 'utf8'));
const kw = window.DATA.keywords;
const f = n => n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);

// Anahtar kelimede geçen spor dalı sözcükleri
const SPOR_SOZ = [
  [/\bvoleybol|filenin sultanlar|efeler lig|sultanlar lig/i, 'Voleybol'],
  [/basketbol|(^|[^a-zçğıöşü])basket([^a-zçğıöşü]|$)|(^|[^a-zçğıöşü])nba([^a-zçğıöşü]|$)|euroleague|potada/i, 'Basketbol'],
  [/\bhentbol\b/i,                                            'Hentbol'],
  [/(^|[^a-zçğıöşü])(tenis|atp|wta)([^a-zçğıöşü]|$)|(^|[^a-zçğıöşü])wimbledon([^a-zçğıöşü]|$)|roland garros/i, 'Tenis'],
  [/\bformula ?1|f1\b|motogp|nascar/i,                        'Motor Sporları'],
  [/(^|[^a-zçğıöşü])(ufc|boks|mma)([^a-zçğıöşü]|$)|güreş/i,   'Dövüş Sporları'],
  [/\bat yarış|tjk\b|hipodrom/i,                              'At Yarışı'],
];
// Anahtar kelimede geçen organizasyon adları
const ORG_SOZ = [
  [/süper lig|super lig/i,        'Süper Lig'],
  [/\b1\.? ?lig\b|tff 1/i,        'TFF 1. Lig'],
  [/premier lig|premier league/i, 'Premier Lig'],
  [/la liga/i,                    'La Liga'],
  [/serie a\b/i,                  'Serie A'],
  [/bundesliga/i,                 'Bundesliga'],
  [/ligue ?1/i,                   'Ligue 1'],
  [/şampiyonlar lig|sampiyonlar lig/i, 'UEFA Şampiyonlar Ligi'],
  [/avrupa lig/i,                 'UEFA Avrupa Ligi'],
  [/konferans lig/i,              'UEFA Konferans Ligi'],
  [/euroleague|euro lig/i,        'EuroLeague'],
  [/\bnba\b/i,                    'NBA'],
];
const SAYFA_SOZ = [
  [/puan durumu/i,      'Puan Durumu'],
  [/fikstür|fikstur/i,  'Fikstür'],
  [/kadro(su)?\b/i,     'Kadro'],
  [/bilet/i,            'Bilet'],
  [/transfer/i,         'Transfer'],
];

const KURAL = {
  'A-spor':    { ad:'Keyword spor dalı sözcüğü taşıyor ama faset başka spor diyor',
    test:k=>{ // AFC Wimbledon bir futbol kulübüdür, tenis turnuvasıyla karışmaz
      if(/afc wimbledon/i.test(k.kw)) return;
      for(const [re,s] of SPOR_SOZ) if(re.test(k.kw) && k.spor!==s) return `"${s}" bekleniyordu, "${k.spor}"`; } },
  'B-org':     { ad:'Keyword lig adı taşıyor ama faset başka organizasyon diyor',
    test:k=>{ for(const [re,o] of ORG_SOZ){
        if(!re.test(k.kw) || k.org===o) continue;
        // Daha özel bir lig adı zaten atanmışsa doğru kabul edilir:
        // "basketbol süper ligi" → Basketbol Süper Ligi, "2. bundesliga" → 2. Bundesliga
        if(k.org && (k.org.toLowerCase().includes(o.toLowerCase())
                     || k.kw.toLowerCase().includes(String(k.org).toLowerCase()))) continue;
        return `"${o}" bekleniyordu, "${k.org}"`;
      } } },
  'C-takim':   { ad:'Takım satırında takım adı keyword içinde geçmiyor',
    test:k=>{ if(k.ent!=='Takım'||!k.takim) return;
      const t=k.takim.replace(/ \((Futbol|Basketbol|Voleybol)\)$/,'').toLowerCase();
      // Kanonik anahtar birleştirmeden gelmiş olabilir (leipzig → rb leipzig);
      // parçalardan herhangi biri keyword'de geçiyorsa eşleşme sayılır.
      const parca=t.split(' ').filter(x=>x.length>2);
      if(parca.length && !parca.some(x=>k.kw.toLowerCase().includes(x)))
        return `takım "${k.takim}", keyword'de yok`; } },
  'D-sayfa':   { ad:'Keyword sayfa tipi sözcüğü taşıyor ama faset başka tip diyor',
    test:k=>{ for(const [re,s] of SAYFA_SOZ) if(re.test(k.kw) && k.st!==s) return `"${s}" bekleniyordu, "${k.st}"`; } },
  'E-izleme':  { ad:'İzleme sorgusu ama intent İzleme değil',
    test:k=>{ if(/canlı izle|hangi kanalda|nerede izlen|şifresiz/i.test(k.kw) && k.it!=='İzleme')
      return `intent "${k.it}"`; } },
  'F-cinsiyet':{ ad:'Keyword kadın sporu diyor ama cinsiyet faseti farklı',
    test:k=>{ if(/\bkadın|kadinlar|bayan/i.test(k.kw) && k.cins!=='Kadın') return `cinsiyet "${k.cins}"`; } },
  'G-turk':    { ad:'Türk kulübü keyword\'ü ama Türk bağlantısı Yok',
    test:k=>{ if(/galatasaray|fenerbahçe|beşiktaş|trabzonspor|türkiye|milli tak/i.test(k.kw)
      && k.turk==='Yok') return `türk bağlantısı "${k.turk}"`; } },
  'H-bos':     { ad:'Zorunlu faset boş',
    test:k=>{ for(const a of ['spor','org','st','it','ent','hak']) if(!k[a]) return `${a} boş`; } },
  'I-oyuncu':  { ad:'Oyuncu satırı ama sayfa tipi takım/lig sayfası',
    test:k=>{ if(k.ent==='Oyuncu' && /^(Takım|Lig|Puan|Fikstür)/.test(k.st||'')) return `sayfa tipi "${k.st}"`; } },
  'J-mac':     { ad:'Maç satırı ama sayfa tipi oyuncu/kadro sayfası',
    test:k=>{ if(k.ent==='Maç' && /^(Oyuncu|Kadro)/.test(k.st||'')) return `sayfa tipi "${k.st}"`; } },
};

const arg = process.argv[2];
const bulgu = {}; Object.keys(KURAL).forEach(k=>bulgu[k]=[]);
let gecen = 0;
for(const k of kw){
  gecen++;
  for(const [ad, kural] of Object.entries(KURAL)){
    const r = kural.test(k);
    if(r) bulgu[ad].push({kw:k.kw, r12:k.r12||0, not:r, org:k.org, spor:k.spor, st:k.st, ent:k.ent});
  }
}
console.log(`KEYWORD DENETİMİ · ${gecen.toLocaleString('tr-TR')} satırın tamamı ${Object.keys(KURAL).length} kuraldan geçirildi\n`);
if(gecen !== kw.length){ console.log('UYARI: kapsam eksik!'); process.exit(1); }

for(const [ad, kural] of Object.entries(KURAL)){
  const b = bulgu[ad].sort((a,c)=>c.r12-a.r12);
  const hac = b.reduce((a,c)=>a+c.r12,0);
  console.log(`${ad.padEnd(11)} ${String(b.length).padStart(5)} satır · ${f(hac).padStart(8)} · ${kural.ad}`);
  if(arg === ad) b.forEach(x=>console.log(`    ${x.kw.padEnd(38)} ${f(x.r12).padStart(8)}  ${x.not}`));
  else b.slice(0,3).forEach(x=>console.log(`    ${x.kw.padEnd(38)} ${f(x.r12).padStart(8)}  ${x.not}`));
}
const toplam = new Set(Object.values(bulgu).flat().map(x=>x.kw)).size;
console.log(`\nEn az bir kurala takılan benzersiz keyword: ${toplam.toLocaleString('tr-TR')} (${(100*toplam/kw.length).toFixed(1)}%)`);

# TV+ Spor Talep Haritası & Sayfa Mimarisi

Türkiye spor arama talebinin organizasyon, sayfa tipi, varlık ve sezonsallık eksenlerinde
haritalanması ve TV+ spor sayfa mimarisi için karar çerçevesi.

## Ne içerir

- **4.059 keyword**, 13 aylık arama hacmi serisiyle
- **26 faset kolonu** — her keyword satırı spor dalı, organizasyon, müsabaka tipi, lig seviyesi,
  cinsiyet, coğrafya, yayın hakkı, sayfa tipi, intent, varlık tipi, marka tipi gibi öznitelikleri
  taşır. Sabit hiyerarşi yoktur; herhangi bir faset kombinasyonuyla yeniden clusterlanabilir.
- **9 sekme**: Özet · Organizasyonlar · Keyword · Trendler & Sezonsallık · Sayfa Tipi & Intent ·
  Takım & Oyuncu · Yayın Hakkı Dışı · Karar Ağacı · Master Liste

## Veri kaynağı

Arama hacimleri **yalnızca DataForSEO**'dan (Google Ads Search Volume, Türkiye/Türkçe) alınır.
Ahrefs yalnızca inceleme amaçlı kullanılmıştır (rakip trafiği, top-pages, SERP analizi);
Ahrefs değerleri bu veri setine girmez.

Rakip markalı sorgular (beIN, Mackolik, Sofascore, Flashscore, Transfermarkt, korsan yayın
siteleri) jenerik talep toplamlarından çıkarılır ve ayrı segment olarak işaretlenir.
TFF, TJK, UEFA, FIFA gibi resmi kurumlar rakip sayılmaz; jenerik kabul edilip yalnızca
`kurum_sorgusu` bayrağıyla izlenir.

## Mimari

```
data/raw/hacim_*.csv          faset kolonlu ham veri (DataForSEO çıktısı)
        │
        ▼  scripts/build-data.js
data/dashboard.js             window.DATA
        │
        ▼
index.html ─▶ utils.js ─▶ components.jsx ─▶ tabs.jsx ─▶ app.jsx
```

## Script'ler

| Dosya | Görev |
|---|---|
| `scripts/build_seed.py` | Organizasyon evreni ve faset şeması |
| `scripts/build_seed2.py` | Rakip eşleşmesi, takım maç sorguları, alt ligler, sezonsal organizasyonlar |
| `scripts/build_seed3.py` | İzleme intent'i, yayın/kanal hub sorguları |
| `scripts/build_takimlar.py` | Takım evreni (çekirdek + Wikipedia uzun kuyruk) |
| `scripts/build_oyuncular.py` | Kadro çıkarımı ve oyuncu evreni |
| `scripts/dfs_volume.py` | DataForSEO toplu hacim çekimi (tekil/çoğul normalizasyonu dahil) |
| `scripts/marka_siniflandir.py` | Rakip / kurum / jenerik ayrımı |
| `scripts/build-data.js` | CSV → dashboard.js |

## Çalıştırma

```bash
npm run build    # data/raw/*.csv -> data/dashboard.js
npm start        # http://localhost:3000
```

Vercel'e statik, Railway'e Node olarak deploy edilebilir.

## Bulgu dokümanları

`data/bulgular/` altında:
- `serp_ozellikleri_ve_strateji.md` — Google spor bileşeninin CTR üzerindeki etkisi
- `hub_sayfa_tipleri.md` — rakip hub envanteri ve TV+'ta eksik sayfa tipleri
- `spor_bazli_sayfa_modelleri.md` — spor dalına göre kazanan sayfa modelleri
- `rakip_sayfa_tipleri.md` — sayfa tipi karşılaştırma matrisi ve iç bağlantı modelleri
- `tvplus_mevcut_durum.md` — GSC ve envanter denetimi

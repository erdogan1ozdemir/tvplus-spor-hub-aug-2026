# TV+ Spor Talep Haritası & Sayfa Mimarisi

Türkiye spor arama talebinin organizasyon, takım, oyuncu, sayfa tipi ve sezonsallık
eksenlerinde haritalanması; "hangi varlık kaç sayfa hak ediyor" sorusuna karar çerçevesi.

## Ne içerir

- **17.880 keyword** kapsamda (19.296 okunan satırdan; 1.127 mükerrer, 1.416 mantık
  denetimiyle kapsam dışı), **31 aylık** arama hacmi serisiyle (2024-01 → 2026-07)
- Son 12 Ay **3,64B** arama · YoY %+5,5
- **26 faset kolonu** — her satır spor dalı, organizasyon, müsabaka tipi, lig seviyesi,
  cinsiyet, coğrafya, yayın hakkı, sayfa tipi, intent, varlık tipi, marka tipi gibi
  öznitelikleri taşır. Sabit hiyerarşi yoktur; herhangi bir faset kombinasyonuyla
  yeniden clusterlanabilir.
- **10 sekme**: Özet · Gruplar · Takım & Oyuncu · Keyword · Kırılım · Karar Ağacı ·
  Sayfa Tipi & Intent · Trendler · Yayın Hakkı Dışı · Master Liste

## Kırılım yolu

Tüm sekmeler ortak bir kırılım yolunu (`yol`) paylaşır: bir spor dalına tıklamak
organizasyonlara, oradan takımlara iner. Faset seçicileri bu yolun türetilmiş
görünümüdür; seçenek listeleri kapsama göre daralır.

## Karar çerçevesi

Organizasyon başına altı kova: Hub · Landing · Etkinlik Ölçekli · Sürekli Açık ·
Etkinlik Ölçekli · Veri Sayfası · Şimdilik Değil.

Hub üç koşul ister: talep (≥1,2M), alt sayfa derinliği (≥%12) ve omurga
(organizasyonun kendi sayfasına ait talep ≥240K). Derinlik ölçütü takım ve oyuncu
katmanını da sayar. Yayın hakkı yokluğu bu kontrolü atlamaz: lig sayfası, fikstür,
puan durumu ve takım sayfaları hak gerektirmeyen bilgi katmanıdır, yalnızca izleme
katmanı yapının dışında kalır.

**Lig bütünlüğü:** bir ligde takım sayfası açılıyorsa ligin tamamı kapsanır; fikstür
ve puan durumu sayfaları her takıma bağlantı verdiğinden açılmayan takım o bağlantının
ucunu boş bırakır. Kural, en az üç takımı kendi talebiyle eşiği geçen liglerde işler.

## Veri kaynağı

Arama hacimleri **yalnızca DataForSEO**'dan (Google Ads Search Volume, Türkiye/Türkçe)
alınır. Ahrefs yalnızca inceleme amaçlı kullanılmıştır; değerleri veri setine girmez.

Rakip markalı sorgular (beIN, Mackolik, Sofascore, Flashscore, Transfermarkt, korsan
yayın siteleri) jenerik toplamlardan çıkarılır. TFF, TJK, UEFA, FIFA gibi resmi kurumlar
rakip sayılmaz; jenerik kabul edilip `kurum_sorgusu` bayrağıyla izlenir.

## Mimari

```
data/raw/hacim_*.csv          faset kolonlu ham veri (DataForSEO çıktısı)
        │                     düzeltmeler data/denetim/*.json üzerinden uygulanır
        ▼  scripts/build-data.js
data/dashboard.js             window.DATA
        │
        ▼
index.html ─▶ utils.js ─▶ components.jsx ─▶ tabs.jsx ─▶ app.jsx
```

Derleme adımı yoktur: `.jsx` dosyaları tarayıcıda Babel ile çevrilir, JSX sözdizimi
kullanılmaz (`React.createElement`). Global sözleşme: `window.U` (yardımcılar),
`window.C` (bileşenler), `window.TABS` (sekmeler), `window.DATA` (veri).

## Script'ler

### Evren kurma ve çekim
| Dosya | Görev |
|---|---|
| `build_seed.py` · `build_seed2.py` · `build_seed3.py` | Organizasyon evreni, rakip eşleşmesi, izleme intent'i |
| `build_takimlar.py` · `build_oyuncular.py` | Takım ve oyuncu evreni |
| `sporcu_seed.py` · `ufc_seed.py` · `seed_yeni_oyuncular.py` | Branş sporcuları, UFC, ek oyuncu turu |
| `kadro_transfermarkt.py` · `kadro_wiki_basket.py` | Kadro çıkarımı |
| `dfs_volume.py` | DataForSEO toplu hacim çekimi |

### Denetim ve düzeltme (yıkıcı değil, gerekçe `faset_notu`'na yazılır)
| Dosya | Görev |
|---|---|
| `keyword_mantik_denetimi.py` · `mekanik_denetim.py` · `faset_denetim.py` | Denetim, `mantik_denetim` kolonunu işaretler |
| `oyuncu_duzeltme_uygula.py` · `mac_duzeltme_uygula.py` | `data/denetim/*.json` düzeltmelerini uygular |
| `org_duzelt_2_uygula.py` | Milli takım taksonomisi ve lig taşıma |
| `intent_yeniden_siniflandir.py` | Intent katmanı kural tabanlı sınıflandırma |
| `marka_siniflandir.py` | Rakip / kurum / jenerik ayrımı |
| `oyuncu_varyant_denetim.py` · `soyad_tekillestir.py` | Ad varyantı ve soyad çakışması |

### Çıktı
| Dosya | Görev |
|---|---|
| `build-data.js` | CSV → `data/dashboard.js` |
| `build-artifact.js` | Tek dosyalık HTML çıktısı |
| `excel_export.py` | Excel çıktısı |

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
- `keyword_denetimi_2026-08.md` — keyword mantık denetimi bulguları

## Notlar

- `Sezonsallık/` klasörü desenin kaynağı olan VitrA dashboard'unu referans olarak taşır;
  bu uygulamanın çalışması için gerekli değildir.
- `data/raw/_tm_cache/` ve `_wiki_kadro_cache/` kadro çıkarımının scrape önbelleğidir,
  git'te izlenmez.

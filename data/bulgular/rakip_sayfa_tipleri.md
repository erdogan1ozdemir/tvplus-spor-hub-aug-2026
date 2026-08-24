# Rakip Sayfa Tipi ve İç Bağlantı Envanteri

Kaynak: Ahrefs top-pages (TR, 2026-08-01) + sayfa üzerinden link deseni çıkarımı.
Trafik değerleri Ahrefs tahmini aylık organik trafiktir.

## Sayfa tipi karşılaştırma matrisi

| Sayfa tipi | URL deseni (örnek) | beIN | Mackolik | Sofascore | Transfermarkt | Flashscore | **TV+** |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Lig hub | `/lig/super-lig` | ✓ | ✓ | ✓ | ✓ | ✓ | **✓** |
| Puan durumu | `/lig/<lig>/puan-durumu` | ✓ | ✓ | ✓ | ✓ | ✓ | **✓ (5 futbol ligi)** |
| Fikstür | `/lig/<lig>/fikstur` | ✓ | ✓ | ✓ | ✓ | ✓ | **✓ (5 futbol ligi)** |
| Lig istatistikleri | `/lig/<lig>/istatistikler` | ✓ | ✓ | ✓ | ✓ | - | **Yok** |
| Takım sayfası | `/takim/<takim>` | ✓ | ✓ | ✓ | ✓ | ✓ | **Yok** |
| Takım fikstür | `/takim/<takim>/fikstur` | ✓ | ✓ | ✓ | ✓ | ✓ | **Yok** |
| Takım puan durumu | `/takim/<takim>/puan-durumu` | - | ✓ | - | ✓ (gömülü) | - | **Yok** |
| Takım kadro | `/takim/<takim>/kadro` | ✓ | ✓ | ✓ | ✓ | ✓ | **Yok** |
| Takım transfer | `/takim/<takim>/transferler` | ✓ | ✓ | - | ✓ | - | **Yok** |
| Oyuncu sayfası | `/oyuncular/<oyuncu>` | - | ✓ | ✓ | ✓ | ✓ | **✓ (32 sayfa)** |
| Maç sayfası | `/mac/<t1>-<t2>` | ✓ | ✓ | ✓ | ✓ | ✓ | **✓** |
| **H2H / Tüm karşılaşmalar** | `/vergleich/vereineBegegnungen/...` | - | - | - | **✓** | - | **Yok** |
| Maç özeti / goller | `/mac-ozetleri-goller/...` | **✓** | - | - | - | - | **Yok** |
| İlk 11 / pozisyonlar | `.../ilk-11ler-<id>` | **✓** | - | - | - | - | **Yok** |
| Canlı skor | `/canli-skor` | ✓ | ✓ | ✓ | - | ✓ | **Yok** |
| Canlı yayın | `/canli-yayin` | ✓ | - | - | - | - | **Kısmi** |
| Haber | `/haber/<slug>` | ✓ | ✓ | - | ✓ | - | **Yok** |
| Tüm zamanlar tablosu | `/ewigeTabelle/...` | - | - | - | **✓** | - | **Yok** |
| Transfer söylentileri | `/geruechte/verein/<id>` | - | - | - | **✓** | - | **Yok** |

## Kanıt: gap sayfalarının ürettiği trafik

| Sayfa | Trafik | Sıralandığı ana keyword | Hacim |
|---|---:|---|---:|
| transfermarkt `/vergleich/.../3375_3300` (İspanya-Portekiz H2H) | 159K | portekiz - ispanya | 738K |
| beIN `/takim/fenerbahce` | 139K | fenerbahçe transfer | 497K |
| beIN `/canli-skor` | 162K | canlı skor | 1.18M |
| beIN `/mac-ozetleri-goller/super-lig` | 96K | bein sport özet | 30K |
| beIN `/canli-yayin` | 70K | canlı maç izle | 507K |
| beIN `/takim/galatasaray/fikstur` | 27K | galatasaray maçı | 852K |
| beIN `/lig/super-lig/istatistikler` | 32K | süper lig istatistikleri | 268K |
| transfermarkt `/super-lig/ewigeTabelle/` | 161K | süper lig puan durumları | 4.49M |
| transfermarkt `/besiktas-jk/geruechte/` | 156K | beşiktaş transfer | 333K |
| beIN `.../ilk-11ler-39880` (tek maç ilk 11) | 36K | antalyaspor - kocaelispor | 99K |
| mackolik `/takim/galatasaray/maclar/` | 251K | galatasaray maçları | 1.61M |

## İç bağlantı modelleri (sayfa üzerinden doğrulandı)

### Transfermarkt H2H sayfası (`/vergleich/vereineBegegnungen/statistik/<id1>_<id2>`)
- Başlık: "Tüm karşılaşmalar: İspanya / Portekiz", H2: "Toplam bilanço"
- 127 link → her iki takımın fikstür sayfasına
- 42 link → geçmiş maçların tek tek maç raporlarına (`/spielbericht/index/spielbericht/<id>`)
- Yapı: geçmiş karşılaşma bilançosu + her maça ayrı link + iki takım sayfasına link

### Transfermarkt kulüp sayfası (`/<kulup>/startseite/verein/<id>`) modül sırası
1. Kadro · 2. Flaş transferler · 3. Flaş ayrılıklar · 4. En çok gol atanlar
5. En çok asist yapanlar · 6. **Puan Durumu (lig tablosu sayfa içinde gömülü)**
7. Transfer bilançosu · 8. Forum konuları · 9. Genel bilgiler
- Link dağılımı: lig sayfasına 4×, kadro sayfasına 4×, her oyuncu profiline 3-5×,
  bir sonraki rakibin kulüp sayfasına 3-4×, altyapı (U19) takımına 4×

### beIN Sports granülerlik hiyerarşisi
`/lig/<lig>` → `/mac-ozetleri-goller/<lig>` → `.../<sezon>/<hafta>/<mac>/` →
tek tek gol sayfaları (`/goller/.../<oyuncu>-<id>`) ve ilk 11 sayfaları (`/pozisyonlar/.../ilk-11ler-<id>`)
- Bu granüler sayfalar tek başına 14K-39K trafik üretiyor.

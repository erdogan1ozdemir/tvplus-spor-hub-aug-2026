# Hub Sayfa Tipi Envanteri (rakip taraması)

Kaynak: rakip sitelerin navigasyon ve URL taksonomisi + Ahrefs SERP ve trafik verisi.

## En büyük keşif: "hangi maç hangi kanalda" hub'ı

"bugün hangi maçlar var" SERP'i (TR, 2026-08-01) ve sayfaların Ahrefs tahmini aylık trafiği:

| # | Sayfa | Trafik | DR |
|---:|---|---:|---:|
| 1 | sporx.com/tvdebugun/ | **394.9K** | 62 |
| 3 | fotomac.com.tr/hangi-mac-hangi-kanalda | **325.3K** | 70 |
| 5 | sporekrani.com | **232.8K** | **29** |
| 8 | tff.org haftanın programı | 206.0K | 76 |
| 4 | hurriyet.com.tr/sporarena/gunun-maclari/ | 78.5K | 85 |
| 10 | milliyet.com.tr/skorer/fikstur/ | 47.7K | 84 |
| 7 | **tvplus.com.tr/canli-tv/yayin-akisi/bugun-hangi-spor-icerikleri-var** | **46.7K** | 58 |
| 9 | fanatik.com.tr/bugun-hangi-mac-var-gunun-maclari/ | 26.3K | 71 |

İki tespit:
1. **DR 29 olan sporekrani.com 232.8K trafik alıyor.** Bu sayfa tipinde giriş engeli otorite değil.
2. **TV+ bu ailede zaten 7. sırada ve 46.7K trafik alıyor**, ancak sayfa `/canli-tv/yayin-akisi/`
   altında duruyor, `/spor/` altında değil. Yayın akışı bilgisi bir yayıncının doğal alanıdır;
   bu sayfa spor mimarisine bağlanabilir ve güçlendirilebilir.

Ayrıca haber siteleri (GZT, Fotomaç, Mynet, Yeni Şafak, Habertürk) bu sorgu için **günlük
tarihli içerik** üretiyor: "Bugün hangi maçlar var? 27 Temmuz 2026 maç programı".

---

## Rakip taksonomileri

### NTV Spor - en temiz hiyerarşi
```
/futbol/lig/<lig>          süper-lig, ingiltere-premier-ligi, ispanya-la-liga,
                           italya-serie-a, almanya-bundesliga, fransa-ligue-1,
                           uefa-avrupa-ligi, uefa-konferans-ligi, dunya-kupasi,
                           ziraat-turkiye-kupasi, kadin-futbol-super-ligi
/futbol/takim/<takim>      besiktas, fenerbahce, galatasaray
/basketbol/lig/<lig>       euroleague, turkiye-basketbol-super-ligi,
                           fiba-sampiyonlar-ligi, avrupa-basketbol-sampiyonasi,
                           turkiye-federasyon-kupasi, turkiye-kadinlar-basketbol-ligi
```
Spor dalı > varlık tipi > varlık şeklinde üç katmanlı. TV+'ta karşılığı yok.

### Fanatik - hub çeşitliliği en yüksek
```
/futbol · /basketbol · /voleybol · /diger-sporlar · /atletizm · /satranc · /ampute
/lig/<lig>              lig sayfası
/takim/<takim>          takım sayfası
/takimlar/futbol        TAKIM DİZİNİ (spor dalı bazlı)
/canli-skor             canlı skor
/transfer               transfer merkezi
/bugun-hangi-mac-var-gunun-maclari    günün maçları hub'ı
/futbol/uefa-ulke-puani-siralamasi    UEFA ülke puanı sıralaması
```

### TRT Spor
```
/haber/<spor-dalı>      futbol, basketbol, voleybol, tenis, diger-sporlar
/haber/futbol/transfer-gundemi
/videolar/mac-ozetleri
/foto-galeri/<spor>/<slug>
/canli-skor
/mac-merkezi
/canli-yayin-izle/<kanal>     "voleybol milli takım maçı" SERP'inde 108K trafik
```

### A Spor
```
/<takim>                besiktas, fenerbahce, galatasaray, trabzonspor, alanyaspor
/turkiye-kupasi/kupatv  organizasyon + kanal
/webtv/canli-yayin · /webtv/<takim> · /webtv/futbol · /webtv/program
```

### UFC.com
```
/events                 etkinlik hub'ı
/event/<etkinlik-slug>  ufc-fight-night-august-29-2026, cryptocom-ufc-331
/rankings · /athletes · /watch
```
Etkinlik slug'ında tarih tutuluyor.

### Sky Sports
```
/<spor>                 football, f1, golf, tennis, cricket, darts, boxing,
                        rugby-league, more-sports
/<spor>/news · /<spor>/video · /<spor>/live-blog
/watch
```

---

## TV+'ta bulunmayan, trafik üretebilecek hub tipleri

| Hub tipi | Kimde var | Kanıt trafik | TV+ için gerekçe |
|---|---|---:|---|
| **Hangi maç hangi kanalda / günün maçları** | Sporx, Fotomaç, Spor Ekranı, Fanatik | 26K-395K | Yayıncının doğal alanı. TV+ zaten 7. sırada, 46.7K |
| **Spor dalı hub'ı** (`/spor/futbol`) | NTV, Fanatik, Sky | - | Üst katman yok; lig sayfaları doğrudan `/spor` altında |
| **Takım dizini** (`/spor/takimlar`) | Fanatik | - | Takım sayfalarına giriş noktası |
| **Takım sayfası** | NTV, Fanatik, A Spor, beIN, Mackolik | beIN 139K | Hiç yok |
| **Canlı skor** | Fanatik, TRT, beIN, Mackolik | beIN 162K | Hiç yok |
| **Maç merkezi** | TRT, beIN | beIN 28K | Hiç yok |
| **Transfer merkezi** | Fanatik, TRT, Transfermarkt | TM 156K | Hiç yok |
| **Canlı yayın hub'ı** | A Spor, TRT, beIN | TRT 108K | Kısmi (`/canli-tv`), spora bağlı değil |
| **UEFA ülke puanı sıralaması** | Fanatik | - | Niş ama Türkiye'de gerçek talep |

**Not:** Maç özeti/video hub'ı rakiplerde güçlü (beIN 96K, TRT, A Spor) ancak TV+ maç
özeti videosu servis edemiyor. Bu sayfa tipi video yerine maç bilgisi (ilk 11, olay akışı,
istatistik, kadro) üzerine kurulabilir.

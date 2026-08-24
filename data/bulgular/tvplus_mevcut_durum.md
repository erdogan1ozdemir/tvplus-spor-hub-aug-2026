# TV+ Mevcut Durum Denetimi

Kaynak: Google Search Console (tvplus.com.tr, 24 May - 20 Ağu 2026), spor_sitemap.xml,
sayfa durum kontrolleri.

## Bulgu 1: TV+ izleme intent'inde güçlü, veri sorgularında dönüştüremiyor

Aynı dönemde, aynı site, iki farklı sorgu ailesi:

| Sorgu | Impression | CTR | Pozisyon |
|---|---:|---:|---:|
| ufc canlı izle | 38.9K | **%21.71** | 2.7 |
| fb maçı canlı izle | 10.5K | **%14.68** | 5.4 |
| gornik zabrze fenerbahçe canlı izle | 10.7K | **%14.31** | 5.1 |
| ufc izle | 26.0K | **%12.60** | 2.1 |
| fenerbahçe maçı canlı izle | 42.7K | **%12.16** | 5.9 |
| — | | | |
| fenerbahçe maçı | 225.9K | %0.42 | 10.1 |
| górnik zabrze - fenerbahçe | 651.8K | %0.22 | 13.3 |
| dünya kupası puan durumları | 2.13M | %0.05 | 7.5 |
| dunya kupasi maclari | 2.67M | %0.04 | 8.3 |
| dünya kupası maçları | **24.86M** | **%0.03** | 8.4 |

İzleme intent'inde CTR %12-22 bandında, veri sorgularında %0.03-0.42 bandında.
Aradaki fark 100-500 kat.

**Gözlem:** "dünya kupası maçları" 8.4 ortalama pozisyonda %0.03 CTR üretiyor. Bu oran,
o pozisyon için beklenen bandın belirgin şekilde altındadır. Puan durumu ve fikstür
sorgularında Google'ın kendi spor bileşeninin tıklamaları büyük ölçüde absorbe ettiği
değerlendirilebilir. Bu varsayımın SERP üzerinden ayrıca doğrulanması önerilir.

## Bulgu 2: "nerede izlenir" yakalanmamış bir sorgu formu

GSC'de belirgin hacim üreten ancak keyword evrenine girmemiş bir kalıp:

| Sorgu | Impression | CTR | Pozisyon |
|---|---:|---:|---:|
| górnik zabrze - fenerbahçe nerede izlenir | 174.0K | %1.72 | 7.6 |
| ispanya millî futbol takımı - arjantin millî futbol takımı nerede izlenir | 130.0K | %1.99 | 7.5 |
| sturm graz - fenerbahçe nerede izlenir | 103.6K | %2.02 | 6.5 |
| portekiz millî futbol takımı - ispanya millî futbol takımı nerede izlenir | 95.9K | %2.24 | 7.0 |
| beşiktaş - kauno žalgiris nerede izlenir | 78.3K | %1.66 | 6.5 |
| fransa millî futbol takımı - ispanya millî futbol takımı nerede izlenir | 52.1K | %2.97 | 6.7 |

Sorgular takımların resmi tam adlarıyla ("... millî futbol takımı") oluşuyor.
TV+ bu kalıpta 6.5-7.6 pozisyonda ve CTR %1.7-3.0 bandında; yayın hakkı sahibi olarak
bu sorgu ailesinde daha üst sıralar hedeflenebilir.

## Bulgu 3: Sitemap ile gerçek sayfa envanteri örtüşmüyor

`spor_sitemap.xml` 66 URL içeriyor. Ancak GSC'de en yüksek tık üreten sayfa ailesi
sitemap'te yer almıyor:

| Sayfa | Clicks | Impressions | Sitemap'te |
|---|---:|---:|:-:|
| /spor/fenerbahce-gornik-zabrze-canli-izle | 54.5K | 1.71M | Hayır |
| /spor/besiktas-kauno-zalgiris-canli-izle | 11.1K | 202K | Hayır |
| /spor/sturm-graz-fenerbahce-canli-izle | 10.0K | 196K | Hayır |
| /spor/fenerbahce-sturm-graz-canli-izle | 9.0K | 125K | Hayır |

Ayrıca `/spor/dunya-kupasi/*` sayfa ailesi (fikstür, puan durumu, istatistikler, maç
sayfaları) GSC'de en yüksek impression üreten yapı olmasına rağmen sitemap'te yok.

## Bulgu 4: İki paralel maç URL şeması

Aynı işlevi gören iki ayrı kalıp bir arada kullanılıyor:
- `/spor/<lig>/mac/<takim1>-<takim2>--<id>` (sitemap'te var)
- `/spor/<takim1>-<takim2>-canli-izle` (sitemap'te yok, tık üretimi belirgin şekilde daha yüksek)

İki şemanın hangi durumda üretildiği ve aralarında kannibalizasyon olup olmadığı
incelenmelidir.

## Bulgu 5: Alt sayfa kapsamı eksik
- Fikstür ve puan durumu yalnızca 5 futbol liginde mevcut.
  UFC, NBA, EuroLeague, FA Cup hub'larında alt sayfa yok (`/spor/ufc/fikstur` 404 dönüyor).
- `/spor/avrupa-ligi` ve `/spor/konferans-ligi` hub'ları 200 dönüyor ancak sitemap'te yok.
- Takım sayfası hiç yok. Oyuncu sayfası 32 adet, lig'den bağımsız düz yapıda
  (`/spor/oyuncular/<ad>--<id>`).
- MotoGP, tenis ve voleybol için sayfa bulunmuyor.

## Bulgu 6: Bilinmeyen slug'lar 404 yerine içerik dönüyor
`/spor/super-lig`, `/spor/takimlar` gibi var olmayan adresler HTTP 200 ile `/spor` hub
içeriğini döndürüyor; canonical `/spor`'a işaret ediyor. `/spor/motogp` ise anasayfa
içeriğini döndürüyor. Soft 404 örüntüsü olarak değerlendirilmeli ve doğrulanmalıdır.

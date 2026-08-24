# TV+ Spor Saha Araştırması - Proje Gidişat Kaydı

## Proje Künyesi
- **Proje/Klasör:** TV+ (Turkcell TV+ - tvplus.com.tr)
- **Ne için açıldı:** TV+ spor bölümü için saha araştırması. Mevcut açık sayfalar ve yeni açılacak sayfalar kapsamda.
- **Hedef:** (1) Türkiye'deki spor arama talebini lig / sayfa tipi / takım / oyuncu kırılımında haritalamak, (2) yayın hakkı olan organizasyonlar için "hub mı, organizasyon bazlı landing mi" kararını veriye bağlamak, (3) çıktıyı ozdilek-sezonsallik / vitra-sezon-tr formatında interaktif dashboard olarak servis etmek.
- **Referans repo formatı:** github.com/erdogan1ozdemir/ozdilek-sezonsallik, github.com/erdogan1ozdemir/vitra-sezon-tr (React SPA + brand.config.js + data/source.xlsx -> build-data.js -> data/dashboard.js)
- **Mevcut aşama:** Metodoloji planı sunuldu, onay bekleniyor.

---

## 2026-08-24

### Talep
- TV+ spor sayfaları için saha araştırması. Mevcut 5 futbol hub'ı (Şampiyonlar Ligi, Avrupa Ligi, Konferans Ligi, Serie A, La Liga) var; oyuncu/takım sayfaları açılacak.
- Yayını olan diğer organizasyonlar (UFC, Euroleague, NBA, MotoGP, Tenis, Kadın/Erkek Voleybol Milli Takım, FA Cup) için hub mı landing mi kararı istendi.
- En çok aranan ligler, arama şekilleri, cluster'lar ve hacimler (DFS); lig -> takım -> oyuncu kaskadı; rakip ve info sitesi taraması.
- Çıktı formatı: ozdilek-sezonsallik / vitra-sezon-tr repolarındaki dashboard yapısı.

### Yapılan iş (keşif / ön envanter)
- Referans repoların mimarisi incelendi (ARCHITECTURE.md + dosya ağacı). Kanonik akış: Excel -> scripts/build-data.js -> data/dashboard.js -> app.jsx/tabs.jsx/components.jsx. Kat 1/2/3 hiyerarşisi + rolling 12 ay modeli + sezonsallık sınıflaması (Evergreen/Seasonal/Spike) mevcut.
- tvplus.com.tr robots.txt ve sitemap yapısı çekildi. spor_sitemap.xml'de 66 URL tespit edildi.
- Mevcut URL şeması çıkarıldı:
  - `/spor/<lig>` (sampiyonlar-ligi, la-liga, ufc, serie-a, euroleague, nba, fa-cup)
  - `/spor/<lig>/fikstur`, `/spor/<lig>/puan-durumu`
  - `/spor/<lig>/mac/<takim1>-<takim2>--<id>`
  - `/spor/oyuncular/<oyuncu>--<id>` (32 oyuncu, lig'den bağımsız düz yapı)
- Sitemap dışı tespitler: `/spor/avrupa-ligi` ve `/spor/konferans-ligi` hub'ları 200 dönüyor ancak sitemap'te yok. UFC/NBA/Euroleague/FA Cup hub'ları var, fikstür/puan durumu alt sayfaları yok (404). Takım sayfası hiç yok. MotoGP/Tenis/Voleybol sayfası yok.
- Bilinmeyen slug'lar (`/spor/super-lig`, `/spor/takimlar`) 200 + `/spor` içeriği + `/spor` canonical dönüyor; soft 404 örüntüsü olarak not edildi, araştırma fazında doğrulanacak.
- GSC erişimi doğrulandı (`https://tvplus.com.tr/` siteFullUser). Son 3 ay `/spor/` verisi çekildi. Kritik bulgu: sitemap'te olmayan `/spor/<takim1>-<takim2>-canli-izle` sayfa ailesi en yüksek tık üreten yapı (tek sayfada 54.5K click / 1.7M impression). Dünya Kupası sayfaları 30.6M'e varan impression üretmiş, CTR %0.07-0.21 bandında kalmış.
- DataForSEO erişimi test edildi (`keywords_data/google_ads/search_volume/live` ve `dataforseo_labs/google/historical_search_volume/live` çalışıyor, 12 aylık monthly_searches dönüyor). Fiyatlama istek başına (1000 keyword'e kadar aynı ücret), maliyet ihmal edilebilir seviyede.
- Ahrefs erişimi doğrulandı (Advanced plan, ~502K unit kalan, reset 2026-09-03).

### Sıradaki adım
- Metodoloji planı kullanıcıya sunuldu; 3 açık karar (yayın hakkı olmayan liglerin kapsamı, oyuncu/takım evreni tavanı, teslim şekli) onay bekliyor.

### Faset (cluster) modeli kuruldu
- Kullanıcı talebi: clusterlama tek hiyerarşi olmasın; spor tipi, spor katmanı, kadın/erkek, müsabaka tipi gibi eksenlerde ayrı ayrı filtrelenebilsin, ham veride hep tutulsun.
- Karar: Kat1/Kat2/Kat3 hiyerarşisi yerine **faset tablosu**. Her keyword satırı 21 öznitelik kolonu taşıyor: organizasyon, spor_dali, musabaka_tipi, lig_seviyesi, prestij_katmani, cinsiyet, kulup_milli, takim_bireysel, cografya, yerlilik, turk_baglantisi, yayin_hakki, periyodiklik, takvim_tipi, sayfa_tipi, intent_katmani, entity_tipi, marka_tipi, dil, sorgu_uzunlugu, varyant_kodu.
- Facet'ler organizasyon seviyesinde bir kez tanımlanıp keyword varyantlarına miras geçiyor (`scripts/build_seed.py`).

### Araç altyapısı
- `scripts/dfs_volume.py` yazıldı. Sebep: DFS MCP yanıtı 10 satırda kesiliyor, binlerce keyword için kullanılamaz. Script 700'lük batch'lerle doğrudan API'ye gidiyor.
- Python SSL zinciri kurumsal proxy nedeniyle doğrulanamadığı için istekler curl üzerinden yapılıyor.
- Kimlik bilgileri `~/.claude/settings.json` içinden runtime'da okunuyor, kodda tutulmuyor.
- Ham API `monthly_searches` alanını liste döndürüyor (MCP dict'e normalize ediyor); parser ikisini de destekliyor.

### Türkiye geneli spor talep taraması (1. tur)
- 114 organizasyon, 633 keyword tarandı. DFS maliyeti $0.09. 541 keyword veri döndü.
- **Doğruluk düzeltmesi:** Google Ads benzer kelimelere birleşik hacim döndürüyor ("premier lig" ve "premier league" ikisi de 1.50M). Alias toplamı çift sayım üretiyor; agregasyon (organizasyon x sayfa_tipi) bazında maksimum alacak şekilde düzeltildi. Toplam 59.7M'den 54.2M'ye indi.
- Spor dalı dağılımı: Futbol %77.5, At Yarışı %14.0, Basketbol %4.1, Motor Sporları %1.1, Dövüş %0.9, Voleybol %0.7.
- Yayın hakkı kırılımı: TV+ Yok %56.7, TV+ Var %26.5, Doğrulanacak %16.8.
- Sezonsallık: hacmin %77.7'si Spike profilinde.
- Sayfa tipi: Jenerik %70.3, Puan Durumu %27.0, Fikstür %1.0.
- Puan durumu / fikstür oranı organizasyona göre çok değişken: Serie A 510x, La Liga 237x, Premier Lig 185x, Süper Lig 37x, Şampiyonlar Ligi 17x, NBA 6x, Dünya Kupası 6x, EuroLeague 3.3x.

### Doğrulanması gereken satırlar (2. turda SERP kontrolü)
- "tjk" 7.48M: Türkiye Jokey Kulübü navigasyonel sorgusu olabilir, TV içerik talebi olmayabilir.
- "golf" 110K: büyük olasılıkla Volkswagen Golf kontaminasyonu.

### 2. tur: rakip eşleşmesi, takım maç sorguları, alt ligler, sezonsal organizasyonlar
- Kullanıcı talebi: fikstüre ek olarak "favori takım maç aramaları" segmenti (ör. "milan juventus"); rakip sitelerden alt lig / spor / karşılaşma sporu / sezonsal organizasyon keşfi.
- Rakip madenciliği (Ahrefs top-pages, mackolik.com ve flashscore.com.tr, TR): üç büyük segment keşfedildi.
  - Rakip eşleşmesi: "portekiz - ispanya" 738K, "ümraniyespor - galatasaray" 382K, "fransa fas" 389K. Mackolik'te tek maç sayfası 81K trafik.
  - Takım maç sorgusu: "galatasaray maçları" 1.61M, "galatasaray maçı" 852K, "fenerbahçe maçı" 778K. Mackolik Galatasaray maçlar sayfası 251K trafik.
  - Yeni sayfa tipleri: transfer (fenerbahçe transfer 497K), kadro (galatasaray oyuncuları 186K), lig istatistikleri (süper lig istatistikleri 268K), takım puan durumu, canlı skor 1.18M.
- 2. tur seed: 2.444 keyword, 2.038 veri döndü, maliyet $0.36. Faset şemasına yeni sayfa_tipi değerleri eklendi: Rakip Eşleşmesi, Takım Maç Sorgusu, Takım Jenerik, Transfer, Haber.
- Çift sayım düzeltmesi sonrası 2. tur toplamı 178.4M (ham 201.9M).
- Sayfa tipi payları: Takım Jenerik %57.9, Takım Maç Sorgusu %12.2, Rakip Eşleşmesi %10.4, Puan Durumu %9.2.
- En yüksek rakip eşleşmeleri: galatasaray fenerbahçe 1.83M, fenerbahçe beşiktaş 1.83M, galatasaray beşiktaş 1.22M, türkiye ispanya 1.00M.
- Ek/alt ligler: Championship 274K, Ukrayna 66K, 2. Bundesliga 49K; diğer yabancı alt ligler ihmal edilebilir. Türkiye 1./2./3. Lig 1. turda 1.5M ile anlamlı çıkmıştı.
- Sezonsal organizasyonlar ortalamada düşük, peak'te yüksek: Dünya Kupası Elemeleri ort 488K / peak 1.50M (Mar 2026), Kış Olimpiyatları ort 21K / peak 201K (Şub 2026), Kadınlar Voleybol Uluslar Ligi ort 27K / peak 90K (Tem 2026).
- Jenerik izleme intent'i: canlı skor 5.00M, canlı maç izle 1.50M, puan durumu 1.00M, maç sonuçları 550K.

### Metodolojik bulgu (kesin çekim öncesi düzeltilecek)
- Google Ads benzer keyword'leri gruplayıp birleşik hacim döndürüyor. Aynı batch'te "galatasaray maçı" ve "galatasaray maçları" varsa hacim birine yazılıyor, diğerine 0 dönebiliyor. "süper lig puan durumu" 1. turda 9.14M, 2. turda 0 döndü.
- Düzeltme: benzer varyantlar aynı istekte gönderilmeyecek; batch'ler sayfa_tipi/varyant bazında ayrılacak.
- İkinci bulgu: sorgu formu hacmi belirliyor. "kadınlar uluslar ligi" 70, "vnl 2026" 15K. Şablonla keyword üretmek yerine gerçek sorgu formları Ahrefs matching-terms ve GSC'den çıkarılacak.

### Rakip sayfa tipi ve iç bağlantı analizi
- Kullanıcı talebi: rakip eşleşmesi sayfalarına geçmiş maç bilgisi ve hangi organizasyonda oynandığı bilgisi eklenmesi; puan durumu/fikstür ile takım sayfaları, takım ile oyuncu sayfaları arasında bağlantı kurulması. Rakiplerin uyguladığı iyi bağlantı tipleri ve gözden kaçan sayfa tipleri incelendi.
- Ahrefs top-pages ile beinsports.com.tr, mackolik.com, flashscore.com.tr, sofascore.com, transfermarkt.com.tr tarandı.
- Transfermarkt'ta kullanıcının tarif ettiği sayfa tipi birebir mevcut: `/vergleich/vereineBegegnungen/statistik/<id1>_<id2>` "Tüm karşılaşmalar" sayfası, 159K trafik. Sayfa geçmiş bilanço + 42 maç raporu linki + iki takımın fikstür sayfasına 127 link içeriyor.
- beIN Sports (TV+'ın en yakın muadili) granüler mimari kullanıyor: lig > maç özetleri > sezon/hafta/maç > tek tek gol ve ilk 11 sayfaları. Bu granüler sayfalar 14K-39K trafik üretiyor.
- TV+'ta bulunmayan sayfa tipleri: takım sayfası ve alt sayfaları (fikstür/kadro/transfer/puan durumu), lig istatistikleri, canlı skor, maç özeti/goller, ilk 11, H2H tüm karşılaşmalar, tüm zamanlar tablosu, transfer söylentileri, haber.
- Bulgular `data/bulgular/rakip_sayfa_tipleri.md` dosyasına işlendi.

### Marka sınıflandırması düzeltildi (kullanıcı yönlendirmesi)
- Kullanıcı ayrımı netleştirdi: TFF ve TJK bilginin birinci çıkış noktası olan resmi kurumlar, rakip değil. beIN Sports gibi özel kuruluşlar rakip.
- `scripts/marka_siniflandir.py` yeniden yazıldı:
  - **Rakip** (jenerik toplamdan çıkarılır): Rakip Yayıncı (beIN, tabii, Exxen, S Sport, TOD, TRT Spor, A Spor...), Rakip Veri Sitesi (Mackolik, Sporx, Flashscore, Sofascore, Transfermarkt, Misli, Nesine...), Korsan Yayın.
  - **Kurum** (rakip değil, jenerik sayılır, yalnızca `kurum_sorgusu` bayrağıyla izlenir): TFF, TJK, UEFA, FIFA, FIBA, FIVB, TBF, TVF.
  - Kurum adı turnuva adının parçasıysa kurum sorgusu sayılmaz: "uefa avrupa ligi" düz jenerik, "uefa" tek başına kurum sorgusu.
  - NBA ve EuroLeague lig adı olduğu için kurum listesinden çıkarıldı.
- Sonuç: At Yarışı jenerik talebi 7.6M olarak kalıyor (tjk dahil), ancak `kurum_sorgusu=evet` bayrağıyla bileşimi izlenebilir.

### Tekil/çoğul normalizasyonu
- Kullanıcı tespiti: Google Ads tekil ve çoğul varyantlara aynı hacmi veriyor, ikisini birden almak toplamda hata üretiyor.
- `scripts/dfs_volume.py` içine çekim öncesi normalizer eklendi. Türkçe çoğul eki (-lar/-ler), iyelik eki ve ünsüz yumuşaması (ç/c, ğ/k, b/p, d/t) normalize edilerek varyantlar tek anahtara indirgeniyor; elenen varyantlar ayrı CSV'ye yazılıyor.
- Doğrulandı: "galatasaray maçı"="galatasaray maçları", "maç sonucu"="maç sonuçları", "süper lig puan durumu"="süper lig puan durumları". Farklı kavramlar ayrık kalıyor.

### Takım evreni kuruldu
- `scripts/build_takimlar.py`: çekirdek 185 takım tam varyantla (jenerik, maçları, fikstür, puan durumu, kadrosu, canlı izle, transfer), uzun kuyruk 675 kulüp yalnızca jenerik sorguyla.
- Uzun kuyruk Wikipedia'dan çekildi: FA Cup alt ligler 265, Konferans Ligi elemeleri 147, Şampiyonlar Ligi elemeleri 139, Avrupa Ligi elemeleri 124.
- Toplam 1.970 keyword hazır, normalizasyon sonrası 1.892.

### BLOKAJ: DataForSEO kredisi bitti
- Hesap bakiyesi -$0.017 (toplam yükleme $151). Bu oturumdaki harcama $0.45; hesap zaten sıfıra yakınmış.
- Takım taraması çekilemedi, seed hazır bekliyor.
- Ahrefs alternatifi test edildi ve çalışıyor: volume + KD + CPC + traffic potential + parent topic + intent döndürüyor. Kalan 498K unit, keyword başına 53 unit, yani ~9.300 keyword kapasitesi. Reset 2026-09-03.
- **Kaynak tutarlılığı uyarısı:** iki kaynak sistematik olarak farklı değer veriyor ("galatasaray maçları" Ahrefs 2.11M, DFS 9.14M; "chesham united" Ahrefs 10, DFS 210). Tek çıktıda karıştırılmamalı, tek kaynak seçilmeli.
- Ahrefs yerel API anahtarı yok, OAuth connector üzerinden çalışıyor; script ile toplu CSV'ye yazılamıyor, her satır context'ten geçiyor. DFS ise doğrudan API ile scriptlenebiliyor.

### Araç kullanım kuralı (kullanıcı kararı)
- **Hacim verisi her zaman DataForSEO'dan çekilir.** Final çıktıdaki tüm arama hacmi tek kaynak olarak DFS'e dayanır.
- Ahrefs yalnızca inceleme amaçlı kullanılır: rakip trafiğini anlamlandırma, top-pages ve sayfa tipi keşfi, SERP ve rakip analizi. Ahrefs hacimleri final tabloya girmez.
- Kullanıcı DFS hesabına kredi yükleyecek; takım seed'i (1.892 keyword) çekime hazır bekliyor.

### Spor bazlı sayfa modelleri (SERP + rakip sayfa incelemesi)
- Google, uygulama içi tarayıcıyı bot kontrolüne düşürdü; CAPTCHA çözülmedi. SERP verisi Ahrefs serp-overview üzerinden alındı, rakip sayfaları tarayıcıda doğrudan incelendi.
- Dört ayrı sayfa modeli tespit edildi, tek tip hub şablonu her organizasyona uymuyor:
  1. **Sürekli lig** (futbol ligleri, NBA): puan durumu/fikstür veri sayfaları kazanıyor. "nba puan durumu" 1. sıradaki sitenin DR'ı 42, giriş engeli otorite değil veri tazeliği.
  2. **Milli takım/turnuva** (voleybol): puan durumu sayfası kazanmıyor. 1. sıra TVF haber içeriği (10.3K trafik), 8. sıra TRT Spor canlı yayın sayfası (108K trafik). Talep "ne zaman / saat kaçta / hangi kanalda" etrafında.
  3. **Dövüş sporları** (UFC): etkinlik takvimi + dövüş kartı + sıklet sıralaması + sporcu sayfaları. Sofascore modülleri sayfa üzerinden doğrulandı. TV+ "ufc" sorgusunda 8. sırada, 4.892 trafik.
  4. **Yarış takvimi** (MotoGP, F1): yıl bazlı puan durumu + yarış başına sonuç sayfası. motorsport.com'da 2015'e kadar arşiv, PİLOTLAR/TAKIMLAR/KURUCULAR sekmeleri. DR 4 ve DR 8 siteler ilk 5'te, rekabet düşük. Türkiye kancası Toprak Razgatlıoğlu.
- URL deseninde yıl kullanımı yarış/turnuva dikeylerinde standart: `/standings/2026/`, `/results/2026/almanya-gp-664296/`.
- Bulgular `data/bulgular/spor_bazli_sayfa_modelleri.md` dosyasında.

### TV+ mevcut durum denetimi (GSC, 24 May - 20 Ağu 2026)
- **En kritik bulgu:** TV+ izleme intent'inde güçlü, veri sorgularında dönüştüremiyor.
  - "ufc canlı izle" CTR %21.71 (poz 2.7), "fb maçı canlı izle" %14.68, "fenerbahçe maçı canlı izle" %12.16
  - "dünya kupası maçları" 24.86M impression, CTR %0.03 (poz 8.4); "dünya kupası puan durumları" 2.13M impression, CTR %0.05
  - Aradaki fark 100-500 kat. Veri sorgularında Google'ın kendi spor bileşeninin tıklamaları absorbe ettiği değerlendirilebilir, SERP üzerinden doğrulanmalı.
- **Yakalanmamış sorgu formu: "nerede izlenir".** "górnik zabrze - fenerbahçe nerede izlenir" 174K impression, "ispanya millî futbol takımı - arjantin millî futbol takımı nerede izlenir" 130K. TV+ 6.5-7.6 pozisyonda, CTR %1.7-3.0. Sorgular takımların resmi tam adlarıyla oluşuyor.
- Sitemap ile gerçek envanter örtüşmüyor: en yüksek tık üreten `/spor/<t1>-<t2>-canli-izle` ailesi ve tüm `/spor/dunya-kupasi/*` sayfaları sitemap'te yok.
- İki paralel maç URL şeması bir arada: `/spor/<lig>/mac/<t1>-<t2>--<id>` ve `/spor/<t1>-<t2>-canli-izle`. Kannibalizasyon incelenmeli.
- Bulgular `data/bulgular/tvplus_mevcut_durum.md` dosyasında.

### Oyuncu evreni
- `scripts/build_oyuncular.py`: 185 çekirdek kulübün kadroları Wikipedia'dan çekiliyor (arama > Kadro bölümü > oyuncu wikilink'leri), önbellekli ve paralel. Çalışma sürüyor.
- Oyuncu varyantları: jenerik, "kimdir", "hangi takımda", "istatistik".

### Takım evreni çekildi (DFS kredisi yüklendi, bakiye $99.98)
- 1.892 keyword, 1.724 veri döndü, maliyet $0.27.
- Bir hata düzeltildi: virgül içeren keyword ("split, croatia") tüm batch'i düşürüyordu. `dfs_volume.py` içine Google Ads'in kabul etmediği sembolleri temizleyen ön filtre eklendi.
- **Çekirdek** (185 takım, 1.295 kw): 145.91M. Sayfa tipi payları: Takım Jenerik %73.5, Takım Maç Sorgusu %14.3, Puan Durumu %10.5, Transfer %1.0, Fikstür %0.4, Kadro %0.2, Canlı İzle %0.03.
- En yüksek takımlar: Galatasaray 44.43M, Fenerbahçe 37.27M, Beşiktaş 14.47M, Trabzonspor 7.78M, Real Madrid 3.83M, Samsunspor 3.26M.
- **Uzun kuyruk** (597 kw): 5.61M ham. Wikipedia çıkarımından gürültü sızmış ("sabah" 1.50M, "istanbul" 1.00M, oyuncu adları). `kulup_dogrulama` kolonu eklendi: Kulüp 237, Şüpheli (kişi adı) 187, Doğrulanacak 168, Şüpheli (yer/genel) 5.

### 2. aşama eşiği için veri (kullanıcı kararı bekliyor)
Doğrulanmış 237 uzun kuyruk kulübünün hacim dağılımı:

| Bant | Kulüp | Toplam hacim |
|---|---:|---:|
| < 1.000 | 186 | 22K |
| 1.000-4.999 | 22 | 56K |
| 5.000-19.999 | 11 | 114K |
| 20.000+ | 18 | 1.19M |

**5.000 üstündeki 29 kulüp, kuyruk hacminin %94'ünü taşıyor.** Alt 186 kulüp toplamda 22K üretiyor.
Önerilen eşik: **aylık 5.000 arama**.

**Kritik nüans:** eşiği geçen kulüpler Türk takımlarının Avrupa kupası rakipleri (Górnik Zabrze 74K, Sturm Graz 40K, Midtjylland 60K, Benfica 201K, Ajax 90K, Celtic 74K, Olympiacos 74K, Qarabağ 60K). Bunlar TV+'ın GSC'de en yüksek tık üreten sayfalarıyla birebir örtüşüyor. Yani kuyruk statik bir liste değil, **kura çekimiyle belirlenen dinamik bir küme**. Öneri: rakip sayfaları önceden 743 kulüp için üretilmez, kura sonrası üretilir.

### 3. tur: izleme intent'i ve yayın hub'ı (747 kw, $0.18)
- Toplam 5.03M / 425 keyword veri döndü.
- **Takım seviyesi izleme sorguları güçlü:** "galatasaray maçı ne zaman" 550K, "galatasaray maçı hangi kanalda" 450K, "fenerbahçe maçı hangi kanalda" 450K, "fenerbahçe maçı ne zaman" 301K, "beşiktaş maçı hangi kanalda" 246K, "galatasaray maçı saat kaçta" 74K.
- **Yayın hub'ı ailesi ~1.3M:** "bugün kimin maçı var" 368K, "bugünkü maçlar" 368K, "bugün hangi maçlar var" 201K, "günün maçları" 135K, "bugün maç var mı" 90K, "tv'de bugün" 90K, "maç hangi kanalda" 74K.
- **"nerede izlenir" ailesi doğrulandı:** "galatasaray beşiktaş nerede izlenir" 74K, "galatasaray fenerbahçe nerede izlenir" 50K, "fenerbahçe górnik zabrze nerede izlenir" 27K, "beşiktaş midtjylland nerede izlenir" 18K.
- **Organizasyon seviyesi izleme zayıf:** "şampiyonlar ligi nerede izlenir" 390, "nba nerede izlenir" 320, "ufc nerede izlenir" 20.
- **Mimari sonuç:** izleme intent'i lig/organizasyon seviyesinde değil, **takım ve maç seviyesinde** yoğunlaşıyor. İzleme modülleri lig hub'ına değil takım ve maç sayfalarına konumlanmalı.

### Google SERP bileşeni doğrulaması (tarayıcı, kullanıcı reCAPTCHA'yı geçti)
- "süper lig puan durumu" (9.14M): Google tam puan durumu tablosunu kendi gösteriyor, sezon seçici ve Avrupa kupası bölge etiketleriyle.
- "dünya kupası maçları": Maçlar bileşeni > Puan Durumu bileşeni > Oyuncular karuseli > Takımlar karuseli, web sonuçları en altta. GSC'de CTR %0.03.
- "ufc canlı izle": Google bileşeni yok, SERP web sonuçlarıyla başlıyor, **1. sırada TV+**. GSC'de CTR %21.71.
- "galatasaray fenerbahçe": bileşen maçları organizasyon etiketiyle gösteriyor ancak cevabı tüketmiyor; 1. sırada Transfermarkt "Tüm karşılaşmalar" (bilanço: 173 maç, 61 FB, 54 B, 58 GS). PAA'da "GS maçı saat kaçta hangi kanalda?" var.
- Bulgular `data/bulgular/serp_ozellikleri_ve_strateji.md` dosyasında.

### Oyuncu evreni tamamlandı
- Kadro çıkarımı düzeltildi: kadrolar ayrı şablon sayfasından transclude edildiği için wikitext yerine render edilmiş HTML (`prop=text`) kullanıldı. Bölüm adı önceliklendirildi ("Kadro" > "Oyuncular"), çünkü "Oyuncular" bölümü çoğu kulüpte tarihi futbolcuları içeriyor.
- 178/185 kulüp, 5.254 tekil oyuncu, 21.016 keyword. DFS maliyeti $2.79.
- 6.390 keyword veri döndü, 24.14M ham hacim.
- Oyuncu listesine kadro şablonlarından kulüp adları sızmış; `oyuncu_dogrulama` kolonu eklendi. Kulüp adı 128 kayıt (5.07M), doğrulanmış oyuncu 6.246 kayıt (18.99M).
- **Doğrulanmış oyuncu bant dağılımı:** < 1.000 → 3.872 oyuncu (563K) · 1.000-4.999 → 670 (1.49M) · 5.000-19.999 → 300 (2.90M) · 20.000-99.999 → 127 (5.35M) · 100.000+ → 39 (8.41M).
- **5.000 üstü 466 oyuncu, oyuncu talebinin %89'unu taşıyor.** Takım tarafındaki eşikle aynı kırılma noktası.
- En yüksek: Arda Güler 1.00M, Kerem Aktürkoğlu 550K, Victor Osimhen 450K, Barış Alper Yılmaz 450K, Kenan Yıldız 450K, Uğurcan Çakır 301K, Lamine Yamal 246K, Alperen Şengün 246K.
- İnformasyonel katman ince: "kimdir + hangi takımda + istatistik" toplamı jenerik talebin %1-8'i. En yüksek Arda Güler 35K, Kenan Yıldız 28K, Kerem Aktürkoğlu 27K.

### Dashboard kuruldu ve repoya push edildi
- Repo: https://github.com/erdogan1ozdemir/tvplus-spor-hub-aug-2026
- Yapı referans repolarla aynı: `brand.config.js` > `data/raw/*.csv` > `scripts/build-data.js` > `data/dashboard.js` > `index.html` + `utils.js` + `components.jsx` + `tabs.jsx` + `app.jsx`.
- Bileşenler: `Kpi`, `Chip`, `SectionHeader`, `Bars`, `Spark`, `Heat`, `Tablo` (sıralanabilir), `MultiSelect` (çoklu seçim + arama), `Modal`, `LineChart`, `HeatMatrix`.
- Dinamikler: global faset filtresi (13 eksen), keyword arama, keyword detay modalı (aylık grafik + ısı şeridi + 24 faset rozeti), URL hash sync, localStorage kalıcılık, tema değiştirme, her sekmede CSV export.
- 9 sekme: Özet · Organizasyonlar (kırılım ekseni seçilebilir + ısı matrisi) · Keyword · Trendler & Sezonsallık · Sayfa Tipi & Intent · Takım & Oyuncu · Yayın Hakkı Dışı · Karar Ağacı · Master Liste.
- Karar Ağacı, organizasyonu dört eksende puanlayıp beş kovadan birine atıyor: Hub 8, Landing 23, Etkinlik Ölçekli 17, Veri Sayfası 8, Şimdilik Değil.
- Toplam veri: 10.396 tekil keyword, 296.5M jenerik aylık talep, 13 aylık seri.
- Bu oturumda toplam DFS maliyeti: $3.69.

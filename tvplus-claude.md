# TV+ Spor Saha Araştırması - Proje Gidişat Kaydı

## Proje Künyesi
- **Proje/Klasör:** TV+ (Turkcell TV+ - tvplus.com.tr)
- **Ne için açıldı:** TV+ spor bölümü için saha araştırması. Mevcut açık sayfalar ve yeni açılacak sayfalar kapsamda.
- **Hedef:** (1) Türkiye'deki spor arama talebini lig / sayfa tipi / takım / oyuncu kırılımında haritalamak, (2) yayın hakkı olan organizasyonlar için "hub mı, organizasyon bazlı landing mi" kararını veriye bağlamak, (3) çıktıyı ozdilek-sezonsallik / vitra-sezon-tr formatında interaktif dashboard olarak servis etmek.
- **Referans repo formatı:** github.com/erdogan1ozdemir/ozdilek-sezonsallik, github.com/erdogan1ozdemir/vitra-sezon-tr (React SPA + brand.config.js + data/source.xlsx -> build-data.js -> data/dashboard.js)
- **Mevcut aşama:** Metodoloji planı sunuldu, onay bekleniyor.

---

## 2026-08-27

### Takım faseti eklendi
- `build-data.js` her satıra `takim` alanı üretiyor: takım satırında kendi kulüp anahtarı, oyuncu satırında kulübü. 15.863 satır dolu, 995 küme.
- Filtre çubuğuna **Takım** seçicisi eklendi. Bir takım seçilince takım keywordleri ile o takımın oyuncu keywordleri birlikte geliyor: galatasaray 183 keyword (14 takım + 169 oyuncu), 679,0M.
- `Organizasyon: undefined` hatası giderildi. Küme etiketi spor eki taşıdığı (`galatasaray  ·  Futbol`) için eşleşme tutmuyordu.
- Küme anahtarı mantığının `tabs.jsx`'teki ikinci kopyası silindi, tek kaynak `build-data.js` oldu.

### Keyword tablosunda Takım sütunu boş görünüyordu
- Sütun `kulup` alanına bağlıydı, o alan yalnızca oyuncu satırlarında doluydu. Bu yüzden `galatasaray` gibi takım keywordlerinde boş, altındaki `osimhen` satırında dolu görünüyordu.
- Sütun `takim` alanına bağlandı. 2.456 takım satırının tamamı, 13.420 oyuncu satırının 13.407'si dolu (kalan 13'ü kulüpsüz sporcu).

### Türk Sporcu Var kapsamı daraltıldı
- Etiketin amacı yabancı lig ve kulüplerdeki Türk sporcuları ayırt etmek olduğu için yerli organizasyonlar kapsam dışına alındı: takım sporunda "Türk Takımı Var", bireysel sporda "Yok". Süper Lig, Yağlı Güreş, İstanbul Maratonu ve Cumhurbaşkanlığı Bisiklet Turu'ndaki 12 satır düzeltildi. Etiket artık yalnızca 55 yabancı/global organizasyonda, 364 keyword.

### Kırılım sekmesi eklendi
- Spor Dalı → Organizasyon → Takım zincirinde hızlı bakış sekmesi. Trend, sezonsallık ve YoY gösterilmiyor; yalnızca hacim ve sayım.
- İki gösterim: **Karo Şeridi** (yatay kaydırılan kart şeritleri) ve **Sütun Kırılımı** (yan yana üç sütun). Yol ve kontroller ikisinde ortak, gösterim değişince yer korunuyor; tercih localStorage'da.
- Kapsam daraltıcı Tümü / Yalnız Takım / Yalnız Oyuncu; tüm sayılar seçime göre yeniden hesaplanıyor. Süper Lig'de yalnız oyuncu seçilince 41 takımdan 21'i kalıyor ve sıralama fenerbahçe'ye dönüyor (49,5M / 46,2M).
- Sıralama hacim / keyword / alt kırılım / A-Z, ayrıca arama ve minimum hacim eşiği.
- Karar öncesi dört gösterim varyantı ayrı bir HTML'de gerçek veriyle kuruldu (`.taslak/kirilim-varyantlari.html`); A ve B seçildi, tablo ve pay haritası dışarıda kaldı.

### Filtre çubuğu tek düğmeye indi (Varyant C)
- On altı faset seçicisi **Filtrele** panelinin içine taşındı, panel üç gruba ayrıldı: Birincil kırılım · Sezonsallık ve hacim · Ek analitik.
- Çubukta arama, düğme, seçili filtre rozetleri ve Temizle kaldı. Filtre satırı ikiden bire indi.
- Her rozet kendi alanını temizliyor; rozet metni tek seçimde değeri, çoklu seçimde "N seçili" gösteriyor.

### 2. tur denetim: mekanik düzeltmeler
- 42 jenerik kelime işaretlendi. Dördü (`garland`, `payton`, `hauser`, `thompson`) Google TR SERP doğrulamasıyla: ilk 10'da sporcu çıkmıyor, sırasıyla süsleme ürünü, fayton/Python, çellist ve makineli tüfek anlamı baskın.
- 7 kulüp doğru varlık tipine taşındı: frosinone calcio, kk partizan, ratiopharm ulm, swindon town, ec bahia, gremio fbpa, cultural y deportiva leonesa.
- 5 mükerrer yazım işaretlendi (mcgrady/tracy mcgrady, calathes/nick calathes gibi).
- 4 sporcuda spor dalı **ve organizasyon birlikte** düzeltildi: basketbolcular voleybol liginde duruyordu (tilbe şenyürek, alperi onar, kayla mcbride, emma meesseman). İlk denemede yalnızca spor dalı değiştirilmiş, organizasyon Sultanlar Ligi'nde kalmıştı; uygulayıcı ikisini birlikte taşıyacak hale getirildi.
- Güncel veri: 17.561 keyword, Son 12 Ay 3,637B.

### Karar bekleyenler
- **DataForSEO çekimi:** `hacim_takimlar.csv` 2026-07 onarımı, 1.892 keyword, 3 istek, ~$0,27.
- **Sayfa tipi yeniden yapılandırması:** Kanal/Yayın + Canlı İzle birleşmesi (52,1M), yeni Lig/Turnuva Jenerik tipi (310,6M), yeni Spor Dalı/Branş tipi (103,6M).
- **BEKLEYEN_EMEKLI:** 39 emekli/antrenör/yönetici kaydı. Listeden çıkarılsın mı, pasif etiketiyle tutulsun mu?
- **SUPHELI:** 33 keyword, karar ağacı hazırlanacak.

### Denetim kapatıldı: emekliler, soyad kuralı, şüpheliler
- **Emekliler çıkarıldı** (kullanıcı kararı): 141 emekli, antrenör, yönetici ve vefat etmiş isim listeden düştü. Aralarında `kevin garnett`, `pau gasol`, `dwight howard` (Mart 2026'da resmen emekli), `achille polonara` (Mayıs 2026), `chris paul` (Şubat 2026), `steve kerr`, `gregg popovich`, `zeljko obradovic`, `sarunas jasikevicius` var. `ted turner` hiç basketbolcu olmamış, CNN kurucusu ve eski Hawks sahibi.
- **Soyad kuralı** (81 keyword): tam adı listede duran soyadlar çıktı, tam adlar kaldı. `kahveci` çıktı / `irfan can kahveci` 2,05M duruyor · `kafkas` çıktı / `nazlı eda kafkas` duruyor · `bayındır` çıktı / `altay bayındır` 972K duruyor.
- **49 şüpheli araştırılarak karara bağlandı.** Yöntem: her keyword'ün hacmi kendi liginde doğrulanmış tam adlı oyuncuların dağılımıyla karşılaştırıldı. Kalibrasyon: TFF 1. Lig medyan 110, p90 1.000, lig rekoru 18.100; Süper Lig medyan 140, p90 8.100. Lig bandının belirgin üstünde kalan ve yaygın ad taşıyan satırlarda hacmin oyuncuya ait olmadığı kabul edildi; ayırt edici adlar kaynaktan doğrulandı.
  - **Kalan 17:** `samuel ballet` (Antalyaspor golcüsü), `erkan yılmaz` (Anadolu Efes, sözleşme 2027'ye uzatıldı), `naz aydemir akyol` (bırakma haberlerine rağmen oynamayı sürdürüyor), `braxton key` (Temmuz 2026'da Fenerbahçe), `onuralp çakıroğlu` (Mayıs 2026'da Trabzonspor'da debut).
  - **Çıkan 33:** `davinchi` (hacim DaVinci Resolve'dan), `maestro` (gerçek Alanyaspor oyuncusu ama 671K hacim Mastercard Maestro'dan), `ahmet özer` (Esenyurt eski belediye başkanı), `sinan özen` ve `oğuz yılmaz` (müzisyen), `haydar karataş` (romancı), `bernardo`/`kevin`/`rayan`/`emerson` (tek başına ilk isim), `tacko fall`/`jeff green`/`radamel falcao` (aktif kulüp kaydı yok).

### Tipoloji yeniden yapılandırıldı
- **Milli takımlar Takım'a alındı** (63 satır). Dosya bu ayrımı kendi içinde tutarsız uyguluyordu.
- **Kanal/Yayın ile Canlı İzle birleşti** (545 satır, 58M). İkisi de aynı izleme sayfasına iniyordu.
- **Jenerik kovası ayrıştırıldı:** 529M tek kovada duruyordu, üçe bölündü. Lig Jenerik **317M**, Spor Dalı Jenerik **104M**, Etkinlik Jenerik **57M**, kalan jenerik 6M. Lig hub'ının kendi sayfa tipi yoktu.

### Ölü eşleşmeler silinmedi, işaretlendi
- Bu satırlar gerçek geçmiş talebi taşıyor; portföyden çıkarmak ölçülmüş hacmi yok saymak olurdu. `guncellik` faseti eklendi: **Arşiv** 16 kw / 1,2M (Erzurumspor Süper Lig'e yükseldi, rakipleri TFF 1. Lig'de kaldı), **Kura Bekliyor** 142 kw / 2,8M (2026-27 Avrupa kupası kurası 27 Ağustos'ta çekildi), **Güncel** 773 kw / 265,8M.

### Kadro ayrıştırıcısı: kaynaktaki sızıntı
- Beş denetim parçasında da aynı örüntü çıktı: kadro sayfalarından oyuncu adı yerine ortak kelime alınıyordu (`features`, `forward`, `battle`, `eagles`, `parlak`, `sağlam`).
- `kadro_transfermarkt.py` yedek deseninde tam ad şartı arandı. **Ana desende blanket eleme yapılmadı**: Brezilyalı oyuncuların büyük bölümü tek adla oynuyor (`ederson` 5,35M, `talisca` 2,27M, `fabinho`). İlk denemede düz boşluk şartı koymuştum, onları da elediği için geri alındı.
- `build_oyuncular.py` tek kelimelik adları elemez, `mantik_denetim` ile "doğrulanmalı" işaretler; karar denetim aşamasına bırakıldı.

### Güncel durum
- Portföy **16.939 keyword**, Son 12 Ay **3,616 milyar**. Şüpheli kova boş, emekli kova boş.

## 2026-08-25

**Talep:** Takım kümesi dağılımı chartlarının filtreye duyarlı çalışması, takımlara spor dalı etiketi, artifact yorumlarının tamamlanması, "sabah" gibi takım olmayan kayıtların bulunması ve tüm keyword listesinin mantık çerçevesinde denetlenmesi. Bu oturumda DFS çekimi öncesi her zaman onay istenmesi.

**Yapılan işler**

- `scripts/keyword_mantik_denetimi.py` yazıldı. Her satır varlık tipine göre kural setinden geçiriliyor, sonuç `mantik_denetim` kolonuna işleniyor. Denetim yıkıcı değil: işaretli satır veri setinde kalıyor, yalnızca jenerik toplamdan düşüyor. 14 satır işaretlendi:
  - Genel kelime çakışması: "sabah", "viking"
  - Şehir/ülke adı: "istanbul", "zagreb"
  - Oyuncu adı kulüp sayılmış: "orkun kökçü", "mason greenwood", "rafa silva" ve 5 satır daha
  - Doğrulanması gereken tek kelime: "talisca"
- Çapraz faset denetimi yapıldı, `scripts/faset_duzelt.py` ile dört tutarsızlık giderildi:
  - 515 kulüp satırı "Oyuncu Jenerik / Oyuncu Bilgi" sayfa tipinden alınıp takım sayfa tipine taşındı
  - 24 basketbol ve voleybol kulübü sorgusu (fenerbahçe beko, beşiktaş basketbol, vakıfbank) Futbol'dan doğru spor dalına aktarıldı
  - 21 lig geneli maç sorgusu ("championship maçları") takım sorgusu olmaktan çıkarıldı
  - `katman` faseti 35.960 satırda boştu, kaynağa göre dolduruldu (Ana Liste / Genişletme / Uzun Kuyruk). "Çekirdek" etiketi İçerik Dili Rehberi'ndeki yasak kelime listesinde olduğu için "Ana Liste" ile değiştirildi
- Takım kümesi dağılımı kapsam seçicisine bağlandı, kartlara spor dalı etiketi ve alt metrik şeridi eklendi
- Artifact yorumlarındaki Inbound logosu talebi tamamlandı: sarı zeminde wordmark siyaha çevrildi, koyu kutu kaldırıldı
- `mantik_denetim` faset olarak dashboard'a bağlandı, Veri Denetimi grubunda filtrelenebiliyor
- Takım & Oyuncu sekmesindeki KPI kartları kapsam seçimine duyarlı hale getirildi

**Dikkat edilmesi gereken**

- `faset_duzelt.py` ilk çalıştırmada `hacim_organizasyon.csv` dosyasını boşalttı: `open(d,"w")` dosyayı kesiyor, sonraki `writerows` hata verince yalnızca başlık satırı kalıyordu. Dosya git geçmişinden geri alındı (633 satır, 541'i veri içeriyor). Her iki denetim betiği atomik yazıma çevrildi: geçici dosyaya yazılıp yalnızca hatasız tamamlanınca yerine taşınıyor.
- Artifact görüntüleyicisi sayfanın kendi başlattığı indirmeleri engelliyor; CSV export butonları artifact üzerinde çalışmıyor, Vercel ve yerel sürümde çalışıyor.

### Basketbol ve voleybol kadroları (aynı gün, ikinci oturum)

- **Mackolik kullanılmadı.** Sitenin robots.txt dosyası `anthropic-ai` için `Disallow: /` tanımlıyor; NBA.com da `anthropic-ai` ve `ClaudeBot` için aynı kısıtı taşıyor. Her ikisinden de çekim yapılmadı. İzin veren kaynaklar kullanıldı: Wikipedia makale yolu (`/wiki/`), TVF, Basketball-Reference, EuroLeague, TBF.
- Kulüp listesi denetlendi, 41 hatalı kayıt ayrıldı: 9 NCAA üniversite takımı, 11 EuroLeague kulübü NBA altında etiketlenmiş, 9 varyant üretiminden bozulmuş ad ("los lakers", "san spurs"), 5 Unrivaled basketbol takımı voleybol altında, 3 feshedilmiş kulüp, 2 milli takım, 1 sorgu ("indiana pacers draft tarihi"), 1 futbol kulübü voleybol altında ("beşiktaş jk"). Bu satırlar `Ana Liste` katmanında olduğu için önceki mantık denetimi bunları kapsamamıştı.
- Takma adlar kanonik kulüplere eşlendi (82 keyword → 62 kulüp), `scripts/kadro_wiki_basket.py` yazıldı.
- **Sonuç: 61/62 kulüp, 971 oyuncu.** Yalnızca İstanbul Büyükşehir Belediyespor'un Wikipedia sayfasında güncel kadro tablosu bulunmuyor.
- Transfermarkt futbol kadrolarıyla birleştirildi: `data/raw/_kadro_birlesik.json` · 185 kulüp · 4.580 kadro kaydı · 4.564 tekil oyuncu.
- Veri setinde bulunmayan **3.120 yeni oyuncu** tespit edildi (`_yeni_oyuncular.json`). Hacim çekimi yaklaşık 12.480 keyword, 13 DataForSEO isteği anlamına geliyor. **Kullanıcı onayı beklemede.**

**Ayrıştırıcıda çözülen sorunlar:** başlık satırından sütun indeksi okuma, "Ad-Soyad / Soyadı - Adı / SOYADI - İSMİ" başlık türevleri, "Soyad, Ad" ve soyad-önce sıra çevirimi, veri satırlarında `<th>` hücrelerinin sayılmaması (sütun kayması), hücredeki ilk bağlantının bayrak ikonu olması, başlıksız kadro tabloları için yedek yol.

### Code review ve düzeltilen kritik hatalar

Paralelde bağımsız bir code review çalıştırıldı. Doğrulanan ve düzeltilen bulgular:

- **Master Liste sekmesi tüm dashboard'ı düşürüyordu.** `tabs.jsx` içinde `MasterTab` tanımsız `viewMode` değişkenini okuyor, React kökü çöküyordu. Sekme adresi localStorage'a yazıldığı için son ziyareti bu sekme olan kullanıcı boş sayfayla açılıyordu. Destructure'a eklendi.
- **`dfs_volume.py` dolu CSV'leri boşaltabiliyordu.** DataForSEO kota, kimlik ve hız sınırı hatalarını HTTP 200 ile döndürüyor; yalnızca HTTP kodu denetlendiği için `results` boş kalıyor ve 11,7 MB'lık dosya `veri_var=hayir` satırlarıyla üzerine yazılıyordu. Gövde `status_code` denetimi, boş sonuç kontrolü, önceki dosyaya göre %60 kapsam eşiği ve atomik yazım eklendi. `refetch_all.sh` dosyasına `pipefail` eklendi.
- **Denetimde işaretli satırlar dashboard'da sayılmaya devam ediyordu.** `jenerik` filtresi yalnızca derleme meta verisinde kullanılıyordu, `app.jsx` ise filtresiz `D.keywords` besliyordu. Artık dashboard'a yalnızca geçerli satırlar gönderiliyor.
- **12 aylık toplam "aylık" diye etiketleniyordu.** Takım & Oyuncu bölümündeki cümle 12 kat yüksek rakam gösteriyordu; ayrı `aylik` alanı eklendi.
- **Hacmi sıfır olan satırlara uydurma peak ayı yazılıyordu.** `indexOf(Math.max(...))` tümü sıfır seride 0 döndürüyor, 163 satır Ağustos 25 kovasına düşüyordu. Hem `build-data.js` hem `app.jsx` tarafında sıfır kontrolü eklendi.
- **Kişi adı tespit edilen satırlar artık silinmiyor, oyuncuya taşınıyor.** "rafa silva", "talisca", "orkun kökçü" gibi 10 satır Oyuncu Jenerik olarak yeniden sınıflandırıldı; yalnızca gerçek kirlilik (sabah, viking, istanbul, zagreb) işaretli kalıp toplamdan düşüyor.

**Açık kalan bulgular (tasarım kararı gerektiriyor):** peak çeyrek iki farklı yöntemle hesaplanıyor (satırların %90'ında sonuç farklı), sezonsallık sınıfı 31 ay üzerinden hesaplanıp 12 ay olarak anlatılıyor, takvim görünümünde ısı haritası peak noktası yanlış sütuna düşüyor, takım kümeleme tek sonek kırpıyor (248 küme parçalanmış), altı Python betiği hâlâ atomik yazmıyor.

### Oyuncu hacim çekimi (onaylı)

- Onay alınarak 11.559 keyword çekildi: 3.521'i veri döndü, maliyet $1,53, pencere 2024-01 → 2026-07 (31 ay). Veri seti 14.292 → 17.823 keyword, Son 12 Ay 3,63B → 3,71B.
- Oyuncu hacmi spor dalına göre: Futbol 384,8M · Basketbol 59,0M · Voleybol 8,5M. Önceki durumda basketbol ve voleybol oyuncu hacmi sıfıra yakındı.
- **Transfermarkt eşleme hatası bulundu ve düzeltildi.** Panathinaikos, Olympiakos, Maccabi Tel Aviv, Žalgiris, Partizan, Baskonia, Hapoel Tel Aviv ve Tokat Belediye Plevne kulüpleri için Transfermarkt futbol kadrosunu döndürmüş, oyuncular basketbol ve voleybol olarak etiketlenmişti. 914 satır futbola taşındı ve `faset_notu` ile işaretlendi. Bu kulüplerin gerçek basketbol kadroları Wikipedia'dan alındı (7 kulüp, 111 oyuncu); hacim çekimi için 428 keyword bekliyor.
- `kadro_wiki_basket.py` tek kulüple çalıştırıldığında çıktı dosyasının tamamını o kulüple değiştiriyordu. Betik birleştirmeli ve atomik yazıma çevrildi.

### Açık kalan review bulguları kapatıldı

- **Peak çeyrek tek yönteme indirildi.** Konumsal çeyrek (`rpq`) takvim etiketiyle basıldığı için filtre ile tablo satırların %90'ında çelişiyordu. Çeyrek artık seçili pencerenin çeyreğidir ve gerçek aylarıyla etiketlenir: rolling görünümde "Ağu-Eki 25 · Kas 25-Oca 26 · Şub-Nis 26 · May-Tem 26", takvim görünümünde "Q1 25 (Oca-Mar)" biçiminde. İki yıla yayılan kova sorunu da böylece ortadan kalktı. `quarterSums` ve `peakQuarterIdx` aynı tanıma bağlandı, grup seviyesine `peakQCal` eklendi.
- **Sezonsallık penceresi eşitlendi.** Keyword sınıfı tüm seri (2024-01 →) üzerinden hesaplanırken grup sınıfı 12 ay kullanıyordu; keywordlerin %30'u iki temelde farklı sınıfa düşüyordu. Grup hesabı tüm seriye çekildi, açıklama metni de gerçeği anlatacak şekilde düzeltildi.
- **Isı haritası peak işareti düzeltildi.** Takvim görünümü `cal25` dizisini çiziyor ama rolling indeksi kullanılıyordu; 20 spor grubunun 19'unda işaret yanlış sütundaydı. `peakIdxCal` eklendi.
- **Takım kümeleme çok katmanlı ek kırpıyor.** Tek geçişte tek sonek indiği için "galatasaray maçı ne zaman" ayrı küme oluyordu. Kuyruk listesi genişletildi, döngüye alındı, resmî ad ekleri ("real madrid cf") de indiriliyor. **268 hayalet küme birleşti** (1.175 → 907).

Tüm sekmeler iki görünüm kipinde de duman testinden geçti (18/18).

### Arayüz revizyonları ve Excel çıktısı

- **Soru işareti imleci düzeltildi.** 495 elemanda `cursor: help` tanımlıydı, birçoğunun `title` değeri boştu: imleç soru işaretine dönüyor, hiçbir açıklama çıkmıyordu. Çıkanlar da tarayıcının geç açılan, biçimlendirilemeyen, uzun metni kırpan balonlarıydı. Yardım imleci artık yalnızca açıklaması olan elemanlarda görünüyor ve içerik `data-tip` ile özel balonda gösteriliyor (ilk satır başlık olarak biçimleniyor, imleci takip ediyor, ekran kenarında konum düzeltiyor, Escape ile kapanıyor).
- **Pazar Özeti'ndeki coral şerit kaldırıldı** (`.hero-kpi::before`), chart gradient dolguya çevrildi. `LineChart` bileşenine `gradient` seçeneği eklendi: seri rengi %34 opaklıktan şeffafa inen dikey gradient, karşılaştırma serisinde daha soluk.
- **Keyword detayında "Aylık Ort." neyin ortalaması olduğu yazılıyor.** Ayrıca DataForSEO'nun kendi ortalaması yerine ekrandaki seriden türetiliyor; yanındaki Son 12 Ay değeriyle tutarsız kalmıyordu.
- **Keyword detayına kendi görünüm seçicisi eklendi.** Rolling 12 Ay ile Takvim Yılı arasında modal içinden geçiş yapılabiliyor, ana filtreyi değiştirmek gerekmiyor. Takvim kipinde chart üç yılı birden çiziyor, altındaki sezonsallık tablosu da 2024 / 2025 / 2026 satırlarını alt alta veriyor (her yıl bir önceki yılla karşılaştırmalı).
- Görünüm seçicisinin yanıltıcı ipucu metni düzeltildi: Özet KPI'ları takvim kipinde takvim yılını kullanıyor, "her zaman rolling" ifadesi doğru değildi.

**Excel çıktısı:** `data/tvplus-spor-keyword-veri-seti.xlsx` (6,5 MB, 12 sayfa)

Özet · Yöntem · Spor Dalı · Organizasyon · Sayfa Tipi · Intent · Varlık Tipi · Yayın Hakkı · Katman · Denetim · Keyword Listesi (17.819 satır × 44 sütun) · Aylık Seri (31 ay)

Özet sayfaları Python sabitleriyle değil SUMIF ve COUNTIF formülleriyle kuruldu; detay sayfasında filtre uygulandığında tutarlı kalıyor. Biçim Inbound Design System'in Excel katmanına uyuyor: başlık satırı `#434343` beyaz kalın, gövde Calibri + ink teal, değişim sütunlarında yalnızca yazı rengi (dolgu yok), durum sütununda dörtlü rozet paleti, not sayfasında kalın coral etiket + ince coral sol kenarlık. Denetim sayfasında öneri yalnızca ilk veri satırına yazıldı.

### Özet'te kırılım yolu (drill-down)

Özet'te bir gruba tıklandığında tablolar bir alt eksene iniyor, sayfadan çıkılmıyor. Önceki davranışta tıklama Gruplar sekmesine atlıyor ve kırılım ekseni aynı kaldığı için tablo tek satıra düşüyordu.

**Zincir veriyle seçildi.** Aday eksenler her seviyede kaç grup ürettiğine ve hacmin ne kadarının boş kovaya düştüğüne bakılarak ölçüldü. `kulup` faseti elendi: Süper Lig içinde 22 grup veriyor ama hacmin %92'si "–" kovasına düşüyor, çünkü bu alan yalnızca oyuncu satırlarında dolu. Yerine takım kümesi fonksiyonu kullanıldı (takım aramalarını kendi oyuncularının aramalarıyla birleştiriyor): Süper Lig 47 küme %80,5 kapsam, Premier Lig 34 küme %72,6, EuroLeague 42 küme %60,5.

Zincir: **Spor Dalı → Organizasyon → Takım → Sayfa Tipi**, iki atlama kuralıyla: bir seviye tek grup üretiyorsa atlanır, boş kova payı %60'ı geçiyorsa atlanır. At Yarışı'nda organizasyon ve takım seviyeleri otomatik atlanıp doğrudan Sayfa Tipi'ne iniliyor.

**Başlıklar kapsam ve ekseni birlikte söylüyor:** "Süper Lig · Takım Ritmi", "galatasaray · Sayfa Tipi Karnesi", "Organizasyon Pazar Payı".

**Diğer değişiklikler**
- Özet'in tamamı (hero, chart, donut, pay listesi, sezon takvimi, karne, öne çıkan keywordler) aynı kapsamı gösteriyor
- Üstte tıklanabilir iz şeridi: `Tüm portföy › Futbol › Süper Lig`, sağında kapsam hacmi ve bir üst kırılıma dönüş düğmesi
- Satıra tıklama yerinde iner; satır sonundaki ok düğmesi mevcut davranışı korur ve grubu Gruplar sekmesinde filtreli açar
- Kırılım yolu adres çubuğuna yazılıyor (`#ozet/Futbol|Süper Lig`), yenilemede ve paylaşımda korunuyor, tarayıcı geri tuşu çalışıyor
- `groupBy` içindeki türetilmiş metrik hesabı `zenginlestir` olarak ayrıldı; takım kümeleri de aynı işlevi kullanıyor, böylece iki kırılım özdeş alanlara sahip
- Isı haritası satır etiketi tıklanabilir hale getirildi, `rowAction` desteği eklendi
- Yerel sunucuda `no-store` önbellek başlığı: geliştirme sırasında tarayıcı eski dosyayı gösteriyordu

Doğrulama: Tüm portföy 3,71B → Futbol 3,29B (69 organizasyon) → Süper Lig 2,30B (47 takım) → galatasaray 676,5M (12 sayfa tipi) → iz şeridiyle geri dönüş. Tüm sekmeler iki görünüm kipinde duman testinden geçti (20/20).

### Kontrol sistemi: düğmeler ve alanlar

`.chip-btn` için temel stil hiç tanımlı değildi; yalnızca iki bağlamsal override vardı, bu yüzden tarayıcının varsayılan düğmesi görünüyordu. Ortak bir kontrol sistemi yazıldı:

- **Eylem düğmesi** (`.chip-btn`): 30 px yükseklik, hap biçimi, ince kenarlık, Outfit 12,5 px 600, yumuşak gölge; üzerine gelince bir piksel yükselip kenarlığı koyulaşıyor, klavye odağında halka çıkıyor
- **Üç varyant**: `birincil` (koyu zemin, tek ana eylem için · "Bu grubun tüm keyword'lerini gör"), `sessiz` (kenarlıksız, geri alıcı eylemler · Temizle, Kapat), `active` (accent dolgu)
- **Sayaç rozeti** (`.btn-sayac`): "Temizle 3" gibi düğme içi sayılar
- **Arama alanı**: sol tarafta büyüteç ikonu, hap biçimi, odakta accent halkası, dolu olduğunda sağda temizleme düğmesi
- **Segment seçici**: yükseklik ve tipografi eylem düğmesiyle hizalandı, aktif segment rozeti accent rengine dönüyor
- **12 yeni SVG ikon**: kopya, indir, ara, filtre, göz, gözKapalı, okSağ, kapat, artı, eksi
- `CopyButton` içindeki satır içi stiller kaldırılıp ortak sisteme bağlandı

Ham metin etiketleri ("↓ CSV", "× Kapat", "× Temizle", "+ Ek filtre") ikon + metin yapısına çevrildi; tabs.jsx ve app.jsx'te ham etiket kalmadı.

### Keyword denetimi · altı paralel ajan (devam ediyor)

Salt-okunur, dosya değiştirmeyen, DFS çağırmayan altı ajan başlatıldı: varlık/spor tutarlılığı, sayfa tipi ve intent, oyuncu güncelliği, hacim eksikleri, kapsam boşlukları, faset bütünlüğü. Üçü tamamlandı.

**Bu oturumda düzeltilen iki kritik hata**

- **`dfs_volume.py` içinde tanımsız değişken.** Bu oturumda eklediğim görev-hatası sayacının (`hatali_gorev`) başlatma satırı tutmamış; herhangi bir DataForSEO görevi 20000 dışında bir kod döndürse betik `NameError` ile çökerdi. Çöküş, batch'ler gönderildikten yani maliyet oluştuktan sonra, dosya yazılmadan gerçekleşirdi. Tanımlandı.
- **Türkçe "İ" harfi çekim sırasında bozuluyordu.** Python'da `"İ".lower()` tek karakter değil `i` + U+0307 (birleşen nokta) üretiyor; sanitizer bu kod noktasını izinli aralıkta bulamayıp boşluğa çeviriyordu. Sonuç: `İlkay Gündoğan` API'ye `i lkay gündoğan` olarak gitmiş. **341 satır, 74 varlık, hepsi %0 veri dönüşü.** İçinde İlkay Gündoğan, İrfan Can Kahveci, İsmail Yüksek, Emirhan İlkhan ve dört Avrupa ligi (İskoçya Premiership, İsviçre Süper Lig, İsveç Allsvenskan, İsrail Ligi) var; bu varlıklar bugün veri setinde "talep yok" görünüyor. Türkçe büyük harfler küçültmeden önce doğru karşılıklarına indiriliyor, ardından NFC normalizasyonu uygulanıyor.

**Ajan bulgularından doğrulananlar**

- Ham CSV'lerde 609 mükerrer keyword var (441M vs 314M aylık). Ancak **dashboard'da sıfır mükerrer**: 17.819 satır, 17.819 tekil keyword. Derleme keyword bazında tekilleştirdiği için çift sayım ekrana ve Excel'e yansımıyor. Ajanın "hub kararı iki katına çıkmış görünür" çıkarımı dashboard için geçerli değil.
- `marka_tipi` faseti tüm satırlarda `Jenerik`: filtre çalışır görünüyor ama hiçbir şeyi daraltamıyor. `marka_siniflandir.py`'nin rakip sözlüğü veri setinde hiç eşleşmemiş, yani rakip marka hacmi ölçülmüyor.
- `kulup_dogrulama` kolonu hiçbir CSV'de yok ama faset haritasında tanımlı.
- `hacim_takimlar.csv` üçüncü batch'i 31 ay yerine 30 ay dönmüş; 484 satırda 2026-07 boş.
- Oyuncu `kulup` alanı sistematik olarak bir transfer geride: 2026 yaz penceresinden önce kurulmuş. Kadro kazıması ise güncel.

**Bekleyen çekim listesi** (onay gerekiyor, henüz çekilmedi): Türkçe "İ" onarımı ~261 keyword · bekleyen oyuncu seed'i 428 · güncel kadro seed boşluğu 1.243 · takimlar 2026-07 onarımı. Tekilleştirilmiş toplam yaklaşık 3.600 keyword, 6 istek, ~$0,54.

### Filtre ve kırılım varyantları

Canlıda değişiklik yapılmadı. Dört varyant ayrı bir HTML'de tıklanabilir mockup olarak hazırlandı: varlık seçicisinin global filtreye bağlanması, eksen yazıcısının tekilleştirilmesi, filtre çubuğunun tek düğmeye inmesi, kırılım satırının menüye inmesi. Ölçüm: Gruplar sayfasında bugün 52 görünür kontrol var, dördü birlikte uygulanırsa 16'ya iniyor.

### Denetim sonuçları · 5/6 ajan tamamlandı

Tüm bulgular `data/bulgular/keyword_denetimi_2026-08.md` dosyasında toplandı. Ajan rakamları ham CSV satırları üzerindendi; hepsi dashboard üzerinde yeniden doğrulandı ve farklı çıkanlar düzeltildi (ör. NBA ajanda 17.516 keyword görünüyordu, dashboard'da 4.721).

**Öncelik 1 bulgular:** Süper Lig küme düşmeleri uygulanmamış (Antalyaspor, Kayserispor, Karagümrük hâlâ Süper Lig, 41 keyword / 24,2M) · yurt dışındaki Türk sporcularda `turk_baglantisi` işareti hiç yok (Arda Güler 11,6M dahil) · `musabaka_tipi=Lig` + `lig_seviyesi=Kıta Üstü` imkânsız kombinasyonu 412 keyword / 45,9M · Avrupa eleme kovalarında şehir, hakem, stadyum ve oyuncu adları takım sayılıyor · kaynak dağılımı ters: İngiliz amatör futboluna 255 keyword, 15 kat fazla hacim taşıyan TFF 2./3. Lig'e 6 keyword.

**Ölü fasetler:** `marka_tipi` tüm satırlarda `Jenerik` (rakip marka hacmi hiç ölçülmemiş), `kulup_dogrulama` kolonu hiçbir dosyada yok, `varyant_denetim` tek değerli. Üçü de arayüzde çalışır görünüp hiçbir şeyi daraltamıyor.

**Kapsam boşlukları:** ilk 11, sakatlık, hakem, stadyum, gol kralı, teknik direktör, kaç kaç, tekrar izle, abonelik/paket aileleri sıfır keyword. Toprak Razgatlıoğlu, Zeynep Sönmez, Mete Gazoz hiç yok; bireysel sporcu katmanı kurulmamış. Basketbol Süper Ligi'nin 16 kulübünün 13'ü evrende yok. İzleme intent'i evrenin yalnızca %1,8'i, oysa TV+'ın tık aldığı tek katman o.

**Bekleyen çekim:** dört kalem, tekilleştirilmiş ~3.600 keyword, 6 istek, ~$0,54. Sanitizer düzeltildiği için artık güvenli. Onay bekliyor.

### Oyuncu denetimi ve kadro düzeltmeleri (altıncı ajan tamamlandı)

Denetim, bu oturumda ürettiğim kadro verisinde üç yapısal hata buldu; üçü de doğrulandı ve düzeltildi:

- **Beş voleybol kulübünde kadro yerine teknik ekip vardı** (Fenerbahçe'de Abbondanza, Eczacıbaşı'nda Bregoli, Halkbank'ta Kolakovic baş antrenör olarak "oyuncu" kaydedilmişti)
- **Boston Celtics kadrosu emekli forma numaraları listesiydi**: Cousy, Sharman, Heinsohn, Maravich
- Wikipedia dipnotları ve kaptan rozetleri adda kalıyordu (`Arina Fedorovtseva[a]`, `Simge Aköz (K)`)

Kök neden: yedek ayrıştırıcı forma numarası sütunu taşıyan her tabloyu kadro sanıyordu. Bölüm başlığı denetimi eklendi; başlık "teknik", "emekli", "retired", "onur", "yönetim" gibi bir sözcük taşıyorsa tablo kadro sayılmıyor. Altı kulüp yeniden çekildi, hepsi düzgün geldi. Düzeltme sonrası Fenerbahçe voleybol kadrosu Gizem Örge, Hande Baladın, Alessia Orro, Arina Fedorovtseva ile geliyor — denetimin "eksik" saydığı isimlerin çoğu zaten bu hatanın sonucuymuş.

**Şüphem yanlış çıktı:** `mohamed salah` / `trabzonspor` kaydı doğru. Salah 6 Ağustos 2026'da Trabzonspor'a imzaladı. Oradaki gerçek sorun mükerrer yazım: `mohamed salah` ve `muhammed salah` ayrı kayıtlar.

**Düzeltilmeyi bekleyenler:** tek kelimelik varyantlar (3.432 keyword, 145,1M · "washington" 1,47M, "erdoğan" 1,40M) · 240 oyuncu olmayan kayıt (kulüp adları, NCAA takımları, medya markaları) · beş NBA kulübünde tüm zamanlar kadrosu · 41 doğrulanmış kulüp transfer düzeltmesi · 6 mükerrer yazım çifti · kadrosu olmayan 628 kulüp.

### Varyant A+B uygulandı ve denetim düzeltmeleri yapıldı

**Varyant A · varlık seçicisi global filtreye bağlandı.** Matristeki Tümü/Takım/Oyuncu/Maç/Lig artık yerel duruma değil `filtre.ent`'e yazıyor. "Lig"e tıklandığında çip çıkıyor ve sayfa daralıyor (165 → 130 grup); çip kaldırılınca düğme "Tümü"ye dönüyor. Sorulan tutarsızlık kapandı.

**Varyant B · eksen yazıcısı tekilleştirildi.** Sezon takvimindeki eksik seçenekli 3'lü seçici kaldırıldı, yerine salt-okunur rozet geldi ("Organizasyon kırılımı · 165"). Başlık ile seçici bir daha çelişemez.

**Denetim düzeltmeleri** (`scripts/denetim_duzelt.py`, yıkıcı değil, atomik yazım):

| Düzeltme | Adet |
|---|---|
| NCAA üniversite takımı işaretlendi | 530 |
| İmkânsız kombinasyon düzeltildi (Lig + Kıta Üstü → Kıta Turnuvası) | 472 |
| Aktif oyuncu değil (emekli/teknik adam) işaretlendi | 188 |
| Türk sporcu işareti eklendi | 153 |
| Medya ve kurum markası işaretlendi | 60 |
| 2026-27 küme düşmesi uygulandı | 51 |
| 2026-27 yükselme uygulandı | 48 |
| Şehir/ülke adı, stadyum, hakem, çöp kayıt işaretlendi | 57 |
| Tek kelime varyantı kirliliği işaretlendi | 25 |
| Mükerrer yazım eşleştirildi | 6 |

Doğrulama: Antalyaspor ve Kayserispor artık TFF 1. Lig · `Lig + Kıta Üstü` kombinasyonu 0 · Türk sporcu işaretli 125 oyuncu, 61,7M · washington, sports, pictures, sergen yalçın, arda turan, utc+00 00 toplamlardan düştü.

**Ölü fasetler kaldırıldı.** `marka_tipi` (tüm satırlarda tek değer), `kulup_dogrulama` (kolon hiçbir dosyada yok), `varyant_denetim` (tek değerli) ve `prestij_katmani` (prestij değil kaynak dosya ölçüyordu) hem veri setinden hem arayüzden çıkarıldı. Jenerik filtresi artık yalnızca mantık denetimine dayanıyor.

**Güncel durum:** 17.502 keyword (321 satır denetimle toplamdan düşüyor) · Son 12 Ay 3,65B · dashboard.js 11,88 MB · artifact 12,28 MB · Excel 6,4 MB. Tüm sekmeler iki görünüm kipinde duman testinden geçti (20/20).

### Onaylı DFS çekimi yapıldı

**3.560 keyword gönderildi, 1.011'i veri döndü, maliyet tam $0,54** (6 istek, tahmin edilenle birebir).

Çekim listesi üç kalemden kuruldu: Türkçe "İ" onarımı 341 · bekleyen oyuncu seed'i 428 · güncel kadro seed boşluğu 3.279. Federasyon ve üniversite adlarından oluşan 456 kirlilik kaydı çekim öncesi ayıklandı.

**Bozulmanın kaynağı çekim değil seed üretimiymiş.** Seed dosyalarında hiç `İ` yok; üreteçler de Python'un `.lower()` metodunu kullandığı için bozulma orada oluşmuş. Onarım kuralı: `İ` ayrılınca "ada i bik" oluyor, doğrusu "ada ibik".

Onarım sonucu, daha önce "talep yok" görünen varlıklar:

| Varlık | Son 12 Ay |
|---|---|
| İstanbul Başakşehir F.K. | 3.885.700 |
| İlkay Gündoğan | 2.272.500 |
| İrfan Can Kahveci | 2.052.000 |
| İsmail Kartal | 1.902.500 |
| İsmail Yüksek | 1.400.000 |

**Aksan mükerreri yakalandı ve önlendi.** Çekimden dönen 1.017 satırın 474'ü aksanlı form mükerreriydi (atlético madrid / atletico madrid ikisi de 673.000). Google Ads aynı sorguyu iki formda döndürüyor; birleştirilmeseydi 2,14M hacim çift sayılacaktı. Satırlar projenin aksansız kuralına indirildi, derlemedeki "yüksek hacim kazanır" kuralı gerisini hallediyor: `leroy sane` 49.500'den 1.469.600'e çıktı.

**Çekilmeyen kalem:** `hacim_takimlar.csv` 2026-07 onarımı (1.892 keyword, 3 istek). Oyuncu seed boşluğu tahmin edilenden büyük çıktığı için (1.243 yerine 3.279) onaylanan 6 isteklik zarf ilk üç kalemle doldu. Bu kalem ayrı onay bekliyor.

### Kırılım şeridi görünüm satırına taşındı

Şerit kendi kartında ayrı bir satır kaplıyordu; GÖRÜNÜM satırının sağına alındı. Kart yerine hap biçimli, satır içi bir öğe oldu; tarih aralığı metni solunda kaldı. Sayfa dikeyde bir satır kazandı.

Bunun için kırılım kapsamı ve aktif eksen hesabı `app.jsx`'e taşındı (`yoluUygula` ve `aktifEksen` zaten dışarı açıktı); böylece hem şerit hem Özet aynı değerleri kullanıyor, ikisi birbirinden sapamaz. Şerit yalnızca Özet sekmesinde görünüyor, çünkü kırılım yolu orada çalışıyor. Dar ekranda kendi satırına iniyor.

Doğrulama: Tüm portföy 3,68B → Futbol 3,28B → Süper Lig 2,27B, şeritten geri dönüş çalışıyor.

### Dokuz ajanla tam keyword taraması

Kullanıcının işaret ettiği `atletico madrid` ve `leipzig` hataları doğrulandı ve kök nedeni bulundu: `kulup` alanı sistematik olarak kaymış, kulüp adı bir sonraki kulübün oyuncusu gibi kaydedilmiş.

**Neden önceki denetimler kaçırdı:** `atletico madrid`'in takım satırı derlemede eleniyor. Aynı keyword hem takım hem oyuncu dosyasında var; dedup yüksek hacimli olanı tutuyor ve oyuncu sürümü kazanıyor, yanlış fasetleriyle birlikte. Dashboard üzerinden yapılan çapraz kontrol bu yüzden yalnızca 5 eşleşme buluyordu; ham dosyalara inince 34 kesin vaka çıktı.

**Tarama:** 8 ajan oyuncu listesinde (hacmin %95'ini kapsayan 1.600 keyword, parça başına 200), 1 ajan takım (812) ve organizasyon (632) listelerinde. Her keyword tek tek sınıflandırıldı, örnekleme yapılmadı.

**Sonuç: 1.600 oyuncu keywordünün 351'i hatalı (%22).** Parça bazında hata oranı %15,5 ile %34 arasında değişti.

| Kategori | Kayıt | Uygulanan |
|---|---|---|
| Kulüp adı oyuncu sanılmış | 79 | 312 satır takıma taşındı |
| Oyuncu olmayan kişi (teknik direktör, emekli, yönetici, vefat etmiş) | 79 | 293 satır işaretlendi |
| Jenerik kelime, marka, yer adı | 157 | 189 satır işaretlendi |
| Mükerrer yazım | 13 | 46 satır işaretlendi |
| Organizasyon adı | 2 | 8 satır taşındı |
| Şüpheli (karar bekliyor) | 32 | dokunulmadı |

**Takım ve organizasyon listesi:** 812 takım satırının 200'ü, 632 organizasyon satırının 99'u sorunlu. Uygulanan düzeltmeler: 48 lig düzeltmesi (hull city 7,29M La Liga'dan Premier Lig'e, benfica 6,43M Serie A'dan Portekiz Ligi'ne, istanbul başakşehir 3,89M Konferans Ligi Elemeleri'nden Süper Lig'e), 17 NBA ↔ EuroLeague karışması, 4 Unrivaled kadın basketbol takımı voleyboldan alındı, 3 Beşiktaş satırı futbola alındı, 65 satırda `Çoklu/Jenerik` spor değeri organizasyondan türetildi.

**Ajanların bulduğu kök neden:** kaynak kazıma Wikipedia sayfa menüsü metnini de toplamış. `universe`, `comics`, `features`, `machine`, `battle`, `shoulder` gibi düz İngilizce sözcüklerin NBA kulüplerine bağlanması bundan. `rosario central` satırı Elche kadro tablosunun "kiralık gönderilenler" bölümünden sızmış.

**Doğrulanıp reddedilen bir ajan iddiası:** `wimbledon` ve `roland garros` ikisi de tam 712.800, `eredivisie` ve `suudi arabistan ligi` ikisi de 311.200 olduğu için hacim çekiminde kopyalama şüphesi bildirildi. Kontrol edildi: bunlar Google Ads'in sabit hacim kovaları (60.500 ve 27.100 standart kova değerleri). İlgisiz iki terimin aynı kovaya düşmesi olağan, anomali değil.

### Mekanik bütünlük denetimi

İkinci tur ajan taraması API oturum limitine takıldı (18:30'a kadar yeni ajan çalıştırılamıyor). Bu sırada ajan gerektirmeyen, veri setinin kendi içinden kanıtlanabilen kural bazlı denetim yapıldı (`scripts/mekanik_denetim.py`).

**Soyadı kuralı uygulandı.** İki formu da oyuncuya çıkan soyadlar korunuyor (`osimhen` 5,80M + `victor osimhen` 5,17M). Başka anlamı da olanlarda tam ad korunup soyadı eleniyor: `bayındır` → `altay bayındır`, `buongiorno` → `alessandro buongiorno`, `yüksek` → `ismail yüksek`. Veri setinde 2.285 soyad/tam ad çifti var ve tam %50-50 bölünüyor, bu yüzden toplu silme uygulanmadı; yalnızca belirsiz 26 soyadı elendi.

**Bulunan ve düzeltilen çelişkiler**

| Bulgu | Önce | Sonra |
|---|---|---|
| Sayfa tipi keyword metniyle çelişiyor | 78 | 0 |
| Aynı keyword birden çok varlık tipinde | 40 | 0 |
| Yazım varyantı mükerreri | 135 | 0 |
| Kulüp adı hâlâ oyuncu etiketli | 9 | 0 |
| Kulüp alanı keywordün kendisi | 1 | 0 |
| Organizasyon birden çok spor dalında | 3 | 1 |

Uygulanan: 229 sayfa tipi düzeltmesi (keyword metninden türetildi), 135 yazım varyantı işaretlendi, 34 varlık tipi tekilleştirildi, 19 kişi adı oyuncuya geri alındı, 16 kulüp adı takıma taşındı, 12 `Çoklu/Jenerik` spor değeri organizasyondan türetildi.

**Kişi adı takım listesine düşmüş olanlar geri alındı:** `milan skriniar`, `milan vukotic`, `rafa silva`, `talisca`, `orkun kökçü`, `mason greenwood`, `anderson talisca` ve 12 kişi daha. Bunlar bir önceki turda ajan raporlarında takım listesinde tespit edilmişti.

**Güncel veri:** 17.616 keyword · Son 12 Ay 3,64B · YoY +%5,5 · dashboard.js 11,93 MB · artifact 12,33 MB

**Güncel veri:** 17.616 keyword · Son 12 Ay 3,64B · YoY +%5,5 · dashboard.js 11,93 MB · artifact 12,33 MB

**Güncel veri:** 17.616 keyword · Son 12 Ay 3,64B · YoY +%5,5 · dashboard.js 11,93 MB · artifact 12,33 MB

**Güncel veri:** 17.616 keyword · Son 12 Ay 3,64B · YoY +%5,5 · dashboard.js 11,93 MB · artifact 12,33 MB

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

### Dashboard referans tasarım sistemine geçirildi
- Kullanıcı talebi: tüm tasarım yapısı, görselleştirme, chart'lar, tablo detayları, gruba tıklayınca ilgili grup sayfasına gitme, chart hover metrikleri Özdilek/VitrA repolarındaki gibi olsun. Ay dağılımı pie chart. Yerel `Sezonsallık/` klasörü baz alınsın, Özdilek'teki ek özelleştirmeler de eklensin.
- `components.jsx` ve `styles.css` referans repodan alınıp marka bağımsızlaştırıldı. 21 bileşen: Kpi, YoYPill, Sparkline, Heatmap, ShareBars, QStack, Modal, LineChart, BarChart, Donut, InfoIcon, Explainer, MultiSelect, SectionHeader, SmallMultiples, PolarPeak, EmptyState, Skeleton, ChartActions, BumpChart, StreamGraph.
- `utils.js` referans API'siyle uyumlu yeniden yazıldı (fmtNum, fmtFull, fmtPct, hmColor, hmText, sparkPath, toCSV, downloadCSV) ve TV+ modeline özgü fonksiyonlar eklendi (grupla, uygula, siniflandir, donemsel, renkAta).
- `tabs.jsx` ve `app.jsx` `window.TABS` / React.createElement yapısıyla yeniden yazıldı.
- **Gruba tıklama:** tablo satırı, ısı matrisi hücresi, small multiples kartı ve YoY çubuğu tıklanabilir; `onNavigateGrup(alan, deger)` global filtreyi uygulayıp Gruplar sekmesinde drill-down kartı açıyor.
- **Hover metrikleri:** LineChart crosshair tooltip'i, Heatmap hücre tooltip'i (yıl / önceki yıl / YoY), Donut merkez etiketi ve dilim tooltip'i, BarChart ve PolarPeak hover değerleri.
- Ay dağılımı Donut (çeyrek payı) ve PolarPeak (aylık zirve haritası) olarak eklendi.
- Özdilek'ten alınan ek özelleştirmeler: brand.config.js ile marka bağımsızlık, URL hash sync, ikincil analitik filtre paneli (Varlık Tipi, Intent, Yayın Hakkı, Talep Şekli, Hacim Bandı, Cinsiyet, Müsabaka Tipi, Katman, Peak Ay), kademeli faset seçenekleri, filtre chip'leri, Tweaks paneli (tema + palet), footer logo ve scroll-top.

### Arama hacmi 2024'ten itibaren çekildi, YoY modeli kuruldu
- Kullanıcı talebi: 13 ay yerine 2024'ten itibaren veri, sezonsallığa YoY ile bakılması.
- **Tespit:** DFS MCP yanıtı `monthly_searches` alanını 12 aya kesiyordu; doğrudan API `date_from` ile **31 ay** (2024-01 → 2026-07) döndürüyor. `dfs_volume.py` varsayılanı `date_from=2024-01-01` yapıldı.
- Tüm seed'ler yeniden çekildi (`scripts/refetch_all.sh`). Toplam 10.379 tekil keyword, 295.5M jenerik aylık talep, 31 aylık seri.
- `build-data.js` içine dönem modeli eklendi: takvim yılı toplamları, **takvim YoY** (son iki tam yıl), **YTD YoY** (kısmi yılın ayı kadar önceki yılla), **rolling 12 ay** (r12 / p12 / yoyR).
- Ölçülen sonuç: Takvim YoY +%12.3 (2024 → 2025), YTD YoY +%7.3 (2026 ilk 7 ay vs 2025).
- Tüm chart'lar yıl bazlı seriye geçirildi: LineChart 2024/2025/2026 ayrı çizgi, tablolarda YoY pill'i, Trendler sekmesi YoY temelli yükselen/gerileyen listeleri ve spor dalı YoY çubuk grafiği.

### Marka görselleri
- TV+ logosu markanın kendi asset'inden alındı (`assets/tvplus-logo.svg`, marka rengi #FAD604), Inbound logoları eklendi.
- Header gradient'i TV+ kimliğine yaklaştırıldı: sarı → koyu (#FAD604 → #12100C). `data-palette="tvplus"` paleti eklendi ve varsayılan yapıldı.

### Dashboard Özdilek yetenek setine geçirildi
Kullanıcı geri bildirimi: görselleştirme, dinamizm ve YoY açısından eksikler vardı; Özdilek reposundaki tablo ve chart davranışları alınmalıydı.

**Yapılan:**
- Özdilek reposunun `components.jsx` (1.228 satır, 23 bileşen: + Zoomable, CopyButton) ve `styles.css` (1.514 satır) dosyaları alındı, marka bağımsızlaştırıldı.
- `utils.js` Özdilek'in rolling 12 ay modeliyle geldi; üzerine TV+ faset yardımcıları eklendi (applyFacets, groupBy, seriesFor, FACET_ETIKET, SEVIYELER). `fmtNum`'a milyar (B) kademesi eklendi.
- `scripts/build-data.js` yeniden yazıldı: her keyword satırı artık takvim yılı dizileri (m24/m25/m26), rolling toplamları (r12/p12/ryoy), takvim YoY, YTD YoY, peak çeyrek bayrakları (pq/rpq), Excel serial peak (peakSerial/rpeakSerial), bucket ve trend etiketi taşıyor.
- Kat 1/2/3 yerine **faset seviyeleri**: Spor Dalı (20) / Organizasyon (164) / Sayfa Tipi (17) — chart üzerinden değiştirilebiliyor.

**Karşılanan talepler:**
- "Isı matrisi" → **Sezonsallık** olarak yeniden adlandırıldı.
- Ay etiketleri artık yıllı: **Ağu 25 … Tem 26** (rolling görünüm). Takvim görünümünde Oca–Ara + legend'da 2024/2025/2026.
- **Rolling 12 Ay / Takvim Yılı** segmented toggle; tüm chart ve tablolar bu moda göre yeniden çiziliyor.
- Sezonsallık matrisinde: seviye seçimi (chart üzerinden), sıralama (Hacim ↓ / YoY ↑ / YoY ↓ / A–Z), **her hücrede YoY rozeti**, satır tıklaması ile grup detayı, Kopyala + CSV.
- Spor dalı karnesinde her kart **kendi ölçeğinde** (yScale independent); alttaki değerin "Son 12 Ay toplam arama hacmi" olduğu açıkça yazıldı.
- Tüm chart'larda hover metrikleri: LineChart crosshair, Heatmap hücre tooltip'i (dönem / önceki dönem / YoY / peak), Donut merkez etiketi + dilim tooltip'i, BarChart, PolarPeak, QStack, SmallMultiples.
- **Pazar Özeti** hero bloğu: Son 12 Ay büyük rakam + YoY pill + Önceki 12 Ay karşılaştırmalı çizgi + Peak Ay kartı.
- KPI şeridi: Keyword / Yükselen / Düşen / İzleme Intent'i / Veri Sayfası Talebi. Altında insight satırı.
- **Ek filtre şeridi**: Peak Ay, Peak Çeyrek, Mevsim Tipi, Hacim Aralığı + Intent, Yayın Hakkı, Müsabaka Tipi, Cinsiyet, Lig Seviyesi, Coğrafya, Katman, Türk Bağlantısı. Trend segmented (Tüm / Yükselen / Stabil / Düşen).
- Tablolar Özdilek düzenine geçirildi: ÖNCEKİ 12 AY / SON 12 AY / YOY / 12 AY TREND / PEAK AY / PEAK Ç. / BUCKET kolonları, sıralanabilir başlıklar, sayfalama.
- Top listeler: Top 10 Hacim Lideri / En Çok Büyüyen / En Çok Daralan.
- Çeyreklik peak dağılımı (QStack) ve spor dalı YoY kazanan/kaybeden çubuk grafiği.

**Ölçülen sonuç:** Son 12 Ay 3,50B · Önceki 12 Ay 3,34B · YoY +%5 · Peak ay Nis 26 (404,8M) · 10.379 keyword · 4.298 yükselen, 4.639 düşen.

### Geri bildirim turu: tablo kaydırma, etiketleme, kırılım senkronu
- **Kaydırılabilir matris:** "+12 satır daha" düğmesi kaldırıldı. Sezonsallık matrisi artık tüm satırları render edip `.matrix-scroll` içinde kendi kendine kaydırılıyor; ay başlıkları ve satır etiketleri sticky.
- **Spor Dalı Karnesi etiketlendi:** kart altındaki değerin yanına "Son 12 Ay" yazıldı (tooltip: "Son 12 Ay toplam arama hacmi"), başlıktaki yüzde rozetine "YoY değişim: … · Son 12 Ay / önceki dönem" tooltip'i eklendi. Kart altına açıklama metni kondu.
- **Karne hover'ı:** çubuk üzerine gelince ilgili ayın hacmi ve **önceki dönemin aynı ayına kıyasla YoY** rozeti görünüyor (ör. "Nis 26: 283.572.540 +33%"). `SmallMultiples` bileşenine `prevValues`, `toplamEtiket` ve `yoyEtiket` prop'ları eklendi.
- **Kırılım senkronu düzeltildi:** `SezonTakvimi` kendi iç seviye state'ini tutuyordu, Gruplar sekmesindeki kırılım seçicisiyle bağlantısı yoktu. Bileşen kontrollü hale getirildi; artık kırılım seçimi hem matrisi hem grup tablosunu hem bölüm açıklamasını birlikte güncelliyor.
- **Grup başlığı tooltip'leri:** Futbol, Çoklu/Jenerik, At Yarışı gibi başlıkların üzerine gelince grubun ne içerdiği görünüyor: üst kırılım, Son 12 Ay / Önceki 12 Ay / YoY, keyword sayısı ve pay, peak ay + çeyrek + mevsim tipi, ve alt kırılımdaki ilk 6 kalem ("İçerik (Organizasyon, 68 adet): Süper Lig, Premier Lig, …"). Tooltip matris satırlarında, karne kartlarında, ShareBars etiketlerinde ve tablo satırlarında aktif.
- **Drill başlığı üst kırılımlı:** organizasyon detayı açıldığında başlık artık "Futbol" eyebrow'u üstünde "Süper Lig" olarak gösteriliyor.
- **Grup Detayları tablosu Özdilek düzenine geçirildi:** `tbl tbl-kat-detay` sınıfı, renk noktası + `.kw-cell` (grup adı) + `.cat-cell` (üst kırılım), `.pill q1-q4` çeyrek rozetleri, `.col-hide-sm` responsive kolonlar, satır ayraçları ve renklendirme referansla aynı.
- Yüzde ondalık ayırıcıları Türkçe virgüle çevrildi.

### İkinci geri bildirim turu
- **Vercel 404 çözüldü:** `vercel.json` içinde `framework: null`, `buildCommand: null`, `outputDirectory: "."` eksikti. Vercel `package.json`'daki build script'i nedeniyle framework algılamaya çalışıp çıktı dizini bulamıyordu. Özdilek'in yapılandırması alındı.
- **Matris satır etiketi üst kırılımlı:** "Süper Lig" başlığının altında artık "Futbol · 2,23B" yazıyor.
- **Satır ayraçları belirginleştirildi:** tablo satırlarına 1px kenarlık, çift satırlara zebra arka plan, hover vurgusu; ısı matrisi satırlarına ayraç.
- **Rolling / Takvim YoY ayrıştırıldı:** `yoyFor(obj, viewMode)` eklendi. Görünüm değiştiğinde YoY, hacim, önceki dönem, sparkline, tablo başlıkları, KPI etiketleri ve bar grafikleri hepsi ilgili moda geçiyor. Ölçülen fark: Futbol rolling +%5,7, takvim +%14,7.
- **Keyword listesi Özdilek desenine geçirildi:** toolbar (arama + sayaç + Kopyala + CSV), 4'lü KPI şeridi (Filtrelenen KW / Toplam Hacim / Yükselen / Düşen), `card flush` + `table.tbl`, kolonlar Keyword · Spor Dalı (renk noktalı) · Organizasyon · Sayfa Tipi · Önceki 12 Ay · Son 12 Ay · YoY · 12 Ay Trend · Peak Ay (pill) · Peak Ç. (pill q1-q4) · Bucket (cat-pill), sayfa başına 50 kayıt.
- **Keyword modalı yeniden düzenlendi:** üstteki büyük KPI kartları kompakt `kpi-mini` şeridine indirildi (6 metrik). Öznitelikler 5 gruplu hizalı tabloya alındı (Sınıflandırma / Organizasyon Özellikleri / Kapsam / TV+ & Kaynak / Sorgu Özellikleri); her keyword'de aynı satır seti görünür, boş alanlar "–" ile işaretlenir. Modal başlığında üst kırılım ("Futbol / Süper Lig") yer alıyor.
- **Karar Ağacı kovaları tanımlandı ve tıklanabilir yapıldı:** Hub, Landing, Etkinlik Ölçekli, Veri Sayfası ve Şimdilik Değil kartlarının üzerine gelince ne anlama geldikleri görünüyor; tıklanınca tanım metni ve o kovaya düşen organizasyonların tam tablosu açılıyor.
- **Spor dalı pazar payı listesi kaydırılabilir** yapıldı, ilk 9 yerine 20 spor dalının tamamı listeleniyor.
- **Takvim yılı grafiğinde 2026 çizgisi** veri olmayan aylarda sıfıra düşmek yerine kesiliyor (null).

### Premium revizyon turu
- **Emojiler tamamen kaldırıldı.** Yerine 18 parçalık ince çizgili SVG ikon seti (`Ikon` bileşeni) eklendi; SectionHeader ve Explainer bu setle çalışıyor. Sayfada sıfır emoji.
- **"Faset Filtresi" etiketi ve emojisi kaldırıldı**, filtre şeridi doğrudan arama kutusu ve seçicilerle başlıyor.
- **Sekme seçimi alt çizgiden hap görünümüne geçirildi**: seçili sekme kart zeminiyle birleşiyor, alt çizgi yok.
- **Topbar gradienti yatay olarak ters çevrildi** (siyah sol → sarı sağ). Sarı zeminde okunabilirlik için Inbound bloğu koyu kutuya alındı, wordmark beyaz kaldı.
- **Tweaks paneli kaldırıldı**, rapor nötr palette açılıyor; yalnızca açık/koyu tema düğmesi bırakıldı.
- **Insight şeridindeki sarı sol çizgi kaldırıldı**, yerine yumuşak gradient zemin ve ince kenarlık kondu.
- **Aylık ritim kartı yeniden düzenlendi**: başlık üste alındı, yıl alt başlığı kaldırıldı, "Toplam Son 12 Ay / YoY / Peak ay" özeti kartın sağ üstüne taşındı, grafik karta ortalandı. "Son 12 Ay toplamı" ibaresi Spor Dalı Pazar Payı başlığının sağına alındı.
- **Sezonsallık kartındaki iç başlık kaldırıldı**, bilgi ikonu "Sezon Takvimi & Mevsimsel Ritim" bölüm başlığının yanına taşındı ve başlık ölçeğine büyütüldü; filtreler yukarı yaklaştı.
- **Small multiples kartlarında başlıklara sol boşluk** verildi.
- **Sezonsallık matrisine varlık tipi filtresi eklendi**: Tümü / Takım / Oyuncu / Maç / Lig.
- **Keyword tablosuna "Varlık" kolonu eklendi**, oyuncu ve takım satırları listede ayırt edilebiliyor.

### Faset denetimi ve düzeltme
- `scripts/faset_denetim.py` yazıldı. Yeniden çekim sırasında `oyuncu_dogrulama` kolonu kaybolmuştu; yeniden üretildi.
- **492 varlık tipi düzeltmesi:** kadro şablonlarından oyuncu listesine sızan kulüp adları (Atlético Madrid, Hull City, Real Madrid CF gibi) Oyuncu'dan Takım'a taşındı.
- **13 organizasyon düzeltmesi:** organizasyon adı spor dalıyla aynı olan dikeyler gerçek organizatöre bağlandı: At Yarışı → TJK · At Yarışı, Golf → Golf Turnuvaları, Hentbol → Hentbol Ligleri.
- Denetim sonrası kalan tutarsızlık yok (organizasyon = spor dalı, boş varlık tipi, boş spor dalı kontrolleri temiz).

### Veri kapsamı teyidi
- Oyuncu ve takım keyword'leri veri setinde mevcut: Takım 2.259 keyword / 2,09B, Oyuncu 6.390 keyword / 282M, Maç 937, Lig-Organizasyon 622, Etkinlik 137, Jenerik 34.
- Tüm hacimler Türkiye ve Türkçe için: DataForSEO `location_code 2792`, `language_code tr`.

### Karar mantığı derinleştirildi
- **Paylaşımlı takım & oyuncu katmanı.** Kullanıcı tespiti: futbolda takım ve oyuncu sayfaları bir kez kurulduğunda Şampiyonlar Ligi, Avrupa Ligi, Konferans Ligi, Süper Lig, La Liga, Serie A, Premier Lig gibi birçok organizasyona aynı anda hizmet ediyor. Karar sekmesine "Paylaşımlı Takım & Oyuncu Katmanı" bölümü eklendi: her spor dalı için takım ve oyuncu keyword sayısı, talebi ve kaç organizasyona hizmet ettiği tabloda gösteriliyor. Ölçülen: **Futbol dikeyinde 1.910 takım + 3.025 oyuncu keyword'ü, 2,30B aylık talep, 68 organizasyona paylaşımlı hizmet.** Hub gerekçesine bu ortak yatırım notu eklendi.
- **Sezon dışı taban metriği eklendi.** Etkinlik ölçekli organizasyonlarda oran değil mutlak hacim belirleyici: rolling penceredeki en sakin altı ayın toplamı hesaplanıyor. 500K üzerindeki organizasyonlarda karar **"Etkinlik Ölçekli · Sürekli Açık"** oluyor; sayfa yıl boyu açık kalıp etkinlik döneminde derinleşiyor, dönem dışında kadro ve geçmiş karşılaşma katmanına iniyor.
- Ölçülen örnekler: Milli Takım Karşılaşmaları sezon dışı 1,3M → Sürekli Açık · UEFA Şampiyonlar Ligi 11,5M → Hub · UEFA Avrupa Ligi 3,2M → Hub · UFC 1,3M ve Evergreen → Landing · Kadın Voleybol Milli Takımı 64,9K → Etkinlik Ölçekli.
- Milli takım nüansı: sezon dışı taban zayıf olsa bile milli takım kalıcı bir varlık olduğundan sayfanın tamamen kapatılmak yerine ince katmanda açık tutulabileceği gerekçeye eklendi.
- Karar tablosuna **Sezon Dışı** kolonu eklendi; eşiği geçen değerler yeşil vurgulanıyor.
- **Karar tablosu keyword tablosu yapısına geçirildi:** `card flush` + `table.tbl`, renk noktalı `kw-cell` + `cat-cell` (spor dalı), `pill` ve `pill q1-q4` rozetleri, sparkline trend kolonu, aynı başlık ve hücre dili.

### Hata: varlık filtresi grup tablosuna yansımıyordu
- Kullanıcı tespiti: sezonsallık matrisindeki Takım/Oyuncu/Maç/Lig filtresi altındaki tabloyu güncellemiyordu.
- Sebep: `entFiltre` state'i `SezonTakvimi` bileşeninin içinde kapalıydı, yalnızca matrisi daraltıyordu. Kırılım seçicisinde daha önce yapılan düzeltmenin aynısı uygulandı: state `GruplarTab`'a taşındı, bileşen kontrollü prop alacak şekilde güncellendi.
- Doğrulandı: Oyuncu seçildiğinde matris 164 → 11 satır, grup tablosu da 164 → 11 satır; bölüm açıklaması "yalnızca Oyuncu satırları" ibaresini gösteriyor.

### Keyword listesinde oyuncu/takım keşfedilebilirliği
- Veri en baştan eksiksizdi; sorun keşfedilebilirlikti. Varsayılan sıralama hacme göre olduğu için ligler ve büyük kulüpler listenin tepesini dolduruyor, oyuncu satırları çok aşağıda kalıyordu.
- Keyword sekmesi toolbar'ına sayaçlı hızlı varlık seçici eklendi: Tümü 10,4K · Takım 2,4K · Oyuncu 6,3K · Maç 937 · Lig 622.
- Doğrulandı: Oyuncu seçildiğinde 6,3K keyword / 223,3M talep; liste Arda Güler 12,1M, Kerem Aktürkoğlu 6,9M, Kenan Yıldız 4,5M ile açılıyor. Arama kutusundan "arda güler" arandığında dört satır (jenerik, istatistik, hangi takımda, kimdir) hacimleriyle geliyor.

### Oyuncu evreni temizlendi ve arama formlarıyla genişletildi
- **Tespit 1:** Wikipedia kadro tablolarından pozisyon adları ve federasyon isimleri sızmıştı (goalkeeper, defender, forward, "Iraq Football Association", "birleşik arap emirlikleri"). `scripts/oyuncu_temizle_genislet.py` ile 136 girdi ayıklandı; 5.113 temiz oyuncu kaldı.
- **Tespit 2 (asıl sorun):** Oyuncu adları Wikipedia'nın aksanlı kanonik yazımıyla geliyordu ("vinícius júnior" = 18.640), oysa arama aksansız ve kısaltmalı yapılıyor ("vinicius jr"). Her oyuncu için aksansız tam ad, soyad ve "jr" kısaltması varyantları üretildi. Keyword sayısı 21.016 → 35.996.
- `kulup` alanı zaten tüm oyuncu satırlarında doluydu; keyword tablosuna **Takım** kolonu olarak eklendi.

### Sekme sırası ve sekmeler arası akan state
- Yeni sıra: Özet · Gruplar · Takım & Oyuncu · Keyword · Karar Ağacı · Sayfa Tipi & Intent · Trendler · Yayın Hakkı Dışı · Master Liste.
- Kırılım seviyesi, varlık filtresi ve peak sütun tercihi `App` state'ine taşındı; bir sekmede yapılan seçim diğer sekmelerde de geçerli. Grup detayına gidildiğinde kırılım ekseni de o alana ayarlanıyor.

### Takım & Oyuncu sekmesi yeniden kuruldu
- **Takım kümesi** kavramı eklendi: bir takımın kendi aramaları ile o takımın oyuncularının aramaları tek çatı altında toplanıyor (`kulup` alanı üzerinden). Sayfa açma kararı bu toplama bakabiliyor.
- Kapsam seçici: Takım + Oyuncu / Yalnız Takım / Yalnız Oyuncu.
- Görünüm seçici: Takım Kümesi (small multiples + sezonsallık matrisi + tablo) / Keyword Listesi.
- Küme tablosu kolonları: Takım · Organizasyon · Takım Araması · Oyuncu Araması · Toplam · Oyuncu Payı · YoY · Trend · Peak Ay.
- Ölçülen: 1.100+ takım kümesi, takım araması 2,15B, oyuncu araması 223,3M, oyuncu payı %9,4. Galatasaray kümesi 619M takım + 33M oyuncu = 652M.

### Keyword tablosu yeniden düzenlendi
- Toplam hacim yerine **aylık ortalama** kolonları: 2024 Ort. · 2025 Ort. · **24–25 YoY** · 2026 YTD Ort. · YTD YoY.
- **Peak sütunları gizlenebilir** hale getirildi; tercih sekmeler arasında korunuyor.
- Takım ve Varlık kolonları eklendi.

### Sezonsallık satır etiketleri
- Hücre içinde ortalandı, sola dayalı görünüm giderildi.

### Oyuncu varyant denetimi ve dize sözlüğü
- Aksansız/kısaltmalı varyantlar gerçek hacmi ortaya çıkardı: **Vinicius 18.640 → 165.800**, Mbappe 2,52M, Osimhen 5,80M, Haaland 1,70M, Trossard 1,69M. Oyuncu toplamı 282M → **468,7M**, kümedeki oyuncu payı %9,4 → **%17,8**.
- Soyad-tek varyantları marka ve genel kelimelerle çakışabiliyor. `scripts/oyuncu_varyant_denetim.py` yazıldı; **yıkıcı değil**, satırları `varyant_denetim` kolonuyla işaretliyor ve dashboard yalnızca "Geçerli" olanları jenerik toplama katıyor. Böylece eşikler yeniden çekim gerektirmeden değiştirilebiliyor.
- İlk denemede eşik fazla dardı ve Trossard, Bailey gibi gerçek oyuncular eleniyordu; oran eşiği 4x'ten 20x'e çekildi, blokaj listesi yalnızca marka/ünlü çakışmalarıyla sınırlandı. Son durumda 15.087 satırın yalnızca **17'si** işaretli (cumhuriyeti, watson, karaca, mcdonald, network, stanley, kartal, özdilek, vikings, yeşil burun adaları gibi).
- **Dize sözlüğü:** faset değerleri satır başına tekrar ettiği için `data/dashboard.js` gereksiz büyüyordu. Değerler sözlüğe alınıp indeksle saklanıyor, tarayıcıda yüklenirken geri açılıyor. Dosya 14,01 MB → **10,27 MB**, artifact 14,38 MB → **10,64 MB**.
- Güncel veri: 15.087 keyword, Son 12 Ay 3,69B, YoY +%4,8, 31 aylık seri. Takım araması 2,17B, oyuncu araması 468,7M.

## 2026-08-31

### UFC dövüşçü katmanı çekildi
- Talep: "UFC tarafında dövüşçüleri de daha detaylı araştır, atladığımız bir şey var mı" → ardından "çekimi yap, emekliler dahil edilmesin".
- Ahrefs, web ve SERP araştırması ile aktif kadro çıkarıldı; `data/denetim/ufc_katman.json` oluşturuldu: 134 aktif dövüşçü (sıklet bazında), 8 Türk dövüşçü, 12 kısaltma, 21 küme, 19 etkinlik. 17 emekli/beklemede isim **kapsam dışı** bırakıldı.
- `scripts/ufc_seed.py` yazıldı. Belirsiz adlarda çıplak biçim üretilmiyor (`ddp`, `jdm`, `mvp`, `dc`, `gsp` yalnızca `X ufc` biçiminde); aksi halde varlığa ait olmayan hacim portföye giriyordu.
- 602 keyword çekildi (1 istek, 0,09 USD), 216'sı veri döndürdü → `data/raw/hacim_ufc.csv`.
- Sonuç: UFC **51 kw / 8,59M / 19 dövüşçü → 267 kw / 13,19M / 157 dövüşçü**.
- Türk dövüşçüler portföye girdi: ibo aslan 275,6K · islam dulatov 61,2K · yakhyaev 23,2K · gökhan sarıçam 22,1K · abdul rakhman yakhyaev 13,3K.
- Portföy toplamı: 17.880 keyword, Son 12 Ay 3,645B.

### Sayfa Tipi ve Yayın Hakkı Dışı sekmelerinde iniş düzeltildi
- Artifact yorumundaki açık madde: "Spor dalı, organizasyon vb. seçildiğinde bu kısımdaki tablo bir alt kırılıma güncellenmeli."
- Bu iki sekmede matris satırına tıklamak sekme değiştiriyordu; artık aynı sekmede yol uzuyor ve matris bir alt eksene geçiyor.
- Ortak `inisKur()` yardımcısı eklendi. Eksen sabit yazılmıyor, matrisin o anki kırılım ekseninden geliyor; sabit eksen yazıldığında kapsam sıfıra düşüyordu (Futbol sayfa tipi sanılıyordu).
- Doğrulandı: Futbol → 74 organizasyon → Süper Lig → 24 takım; iz şeridi hacimleri doğru, sekme değişmiyor.
- Yorumun ikinci maddesi ("Grup detay için de aynısı geçerli") için üç nokta daha bağlandı: Sayfa tipi karne kartları, Hak Dışı organizasyon tablosu ve her iki sekmenin matrisi. `inAlt` sekme gövdesine taşındı, dördü aynı işleyiciyi paylaşıyor.

### Milli takım taksonomisi birleştirildi, Erzurumspor ligi düzeltildi
- `data/denetim/org_duzelt_2.json` + `scripts/org_duzelt_2_uygula.py` yazıldı (yıkıcı değil, gerekçe `faset_notu`'na yazılıyor, atomik yazma).
- Öneri uygulanırken düzeltildi: "Milli Takım Karşılaşmaları" 251 satırın 210'u Türkiye'yi hiç içermiyordu ("ispanya arjantin" 5,1M, "fransa ingiltere" 3,4M). Hepsini A Milli'ye katmak yanlış olurdu; desene göre ikiye ayrıldı.
- A Milli Futbol Takımı 64 satır / 51,3M → **105 satır / 70,3M**. Kadın Voleybol Milli Takımı 149 / 4,9M → **189 / 6,4M**. Yeni organizasyon: Yabancı Milli Takım Karşılaşmaları 210 satır / 25,9M.
- Erzurumspor 35 satır Süper Lig'den TFF 1. Lig'e çekildi; artık 28 keyword'ün tamamı tek ligde.

### Intent katmanı yeniden sınıflandırıldı
- Önceki durumda 17.880 satırın 16.908'i "Bilgi" etiketindeydi (%98); faset hiçbir kırılımda ayrım üretmiyordu.
- `data/denetim/intent_kurallari.json` + `scripts/intent_yeniden_siniflandir.py`: sıralı kural seti, ilk eşleşen kazanır, hiçbiri eşleşmezse Navigasyonel. Orijinal değer `intent_kaynak` kolonunda saklanıyor, kural değişirse yeniden çekim gerekmiyor.
- Yeni dağılım: Navigasyonel 11.791 / 2,46B (%67,5) · Maç & Takvim 1.025 / 605,0M (%16,6) · Skor & Sonuç 320 / 387,0M (%10,6) · İzleme 955 / 113,6M (%3,1) · Bilgi 3.784 / 82,5M (%2,3) · Ticari 5.
- "X maçı / X maçları" kalıbı (438 kw, 559,2M) Bilgi'ye değil Maç & Takvim'e bağlandı: bu sorguları tatmin eden sayfa fikstür sayfasıdır. Sayfa mimarisi sorusuna doğru cevap veren ayrım budur.
- Sayfa Tipi sekmesindeki iki KPI kartı (Bilgi / Ticari) yeni dağılıma göre Navigasyonel ve Maç & Takvim ile değiştirildi.

### Karar Ağacı'na lig bütünlüğü kuralı eklendi
- Talep: bir ligde takım sayfası açılıyorsa ligin tamamı açılmalı; fikstür ve puan durumu sayfaları her takıma bağlantı verdiğinden açılmayan takım bağlantının ucunu boş bırakıyor.
- Yeni bölüm: "Lig bütünlüğü · takım sayfası kapsamı". 12 ligde 355 takım sayfası, 236'sı bütünlük gereği.
- Eşik (`TAKIM_KENDI_ESIK` 1M) sayfanın açılıp açılmayacağını değil gerekçesini ayırıyor. Tetikleyici koşul (`LIG_TETIK` 3): en az üç takımı kendi talebiyle eşiği geçen ligler kapsama girer. Bu olmadan FA Cup Alt Ligler 255 takım / 0'ı kendi talebiyle diye listeye giriyordu.
- Kapsam dışı 9 lig / 617 takım ayrıca not olarak veriliyor.
- Bulgu: Süper Lig (2,25B) Hub değil Veri Sayfası kovasında, çünkü yayın hakkı yok. Alt sayfa derinliği ölçütü de takım katmanını saymıyor; Süper Lig'in talebinin %80'i takım katmanında ama altPay %13,3 çıkıyor.

### Alt sayfa derinliği takım katmanını da sayıyor, sayı biçimi kısaltıldı
- **Derinlik ölçütü:** `altPay` artık Takım Jenerik, Takım Bilgi, Oyuncu Jenerik ve Oyuncu Bilgi'yi de sayıyor. Süper Lig %13,3 → **%63,2**. Hub kovası 6 → 15 organizasyon.
- **Omurga koşulu:** Hub için organizasyonun kendi sayfasına ait asgari talep (Lig/Etkinlik/Spor Dalı Jenerik ≥ 240K) arandı. Bu olmadan eleme turları (Şampiyonlar Ligi Elemeleri, Konferans Ligi Elemeleri) %100 derinlikle Hub çıkıyordu; oysa kendi lig sorguları sıfır, açılacak hub sayfaları yok.
- **Yayın hakkı artık derinlik kontrolünü atlamıyor.** Talep üzerine: Süper Lig'de hak olmasa da lig sayfası, fikstür, puan durumu ve takım sayfaları açılabilir; bunlar hak gerektirmeyen bilgi katmanı. Hak dışı organizasyon hub koşullarını karşılıyorsa Hub kovasına giriyor, gerekçesine izleme katmanının dışarıda kaldığı ve iç bağlantı ağının hak sahibi organizasyonlara köprü kurduğu notu ekleniyor. Süper Lig · Premier Lig · TFF 1. Lig artık Veri Sayfası değil Hub.
- **Mevsimsellik dalı onarıldı:** `Spike` kontrolündeki `altPay<0.12` kısıtı, genişletilmiş derinlik ölçütüyle hiç sağlanmaz olmuş ve "Etkinlik Ölçekli · Sürekli Açık" kovasını boşaltmıştı. Kısıt kaldırıldı; mevsimsellik derinlikten önce geliyor.
- **Sayı biçimi:** `fmtNum` üç anlamlı basamağa geçti (1.500 → 1,5K · 2.340.000 → 2,34M · 336.300.000 → 336M). Karar Ağacı, Gruplar, Yayın Hakkı Dışı ve Takım & Oyuncu tablolarındaki tam sayılar kısaltıldı; tam değer hücre tooltip'inde duruyor. Keyword tablosu değiştirilmedi.
- Dokuz sekme 375px ve 1440px'te taşma/sıkışma denetiminden temiz geçti.

### Repo denetimi
Talep üzerine tüm repo tarandı. Bulunanlar ve yapılanlar:

**Düzeltildi**
- `.gitignore`'da dizin adı yanlıştı (`_wiki_cache/` yazılmış, gerçek adlar `_wiki_kadro_cache/` ve `_tm_cache/`). 405 scrape HTML dosyası (91 MB) git'te izleniyordu; takipten çıkarıldı, diskte duruyor. `.git` 145 MB.
- `package.json` var olmayan `scripts/build-data.test.js` dosyasına işaret ediyordu; `test` script'i kaldırıldı.
- Build çıktısı "Keyword: 19296" yazıyordu ama dashboard 17.880 gösteriyordu. Artık ikisini birden yazıyor: kapsamda / okunan / mükerrer / mantık denetimiyle kapsam dışı.
- Ölü fonksiyonlar silindi: `tamYol` (tabs.jsx), `useTooltip` (components.jsx).
- README tamamen eskiydi (4.059 keyword, 13 ay, 9 sekme, "Organizasyonlar" sekmesi). Gerçek duruma göre yeniden yazıldı; kırılım yolu, karar çerçevesi ve düzeltme script'leri eklendi.
- **Erzurumspor düzeltmesi eksik kalmış:** kural yalnızca keyword metnine bakıyordu, oyuncu satırlarında takım adı `kulup` kolonunda duruyor. 72 satır Süper Lig'de kalmıştı. Kural `kulup` kolonunu da eşleştirecek şekilde genişletildi, 304 satır taşındı. Küme artık tek ligde: TFF 1. Lig 7,6M.

**Karar bekleyen bulgular**
- Aynı kulüp iki ligde: antalyaspor (TFF 1. Lig 11,8M / Süper Lig 908K), kayserispor, pendikspor, fatih karagümrük. Erzurumspor'la aynı sınıf; hangi ligde olacakları karar gerektiriyor.
- Aynı kulüp iki takım anahtarında: celta vigo / rc celta de vigo / rc vigo · hull city / hull afc / hull city afc. La Liga ve Premier Lig takım sayıları bu yüzden şişkin.
- Wikipedia kaynaklı 14 İngilizce takım anahtarı (4,6M) Türkçe adlarına eşlenmemiş: `vakıfbank s.k. (women's volleyball)`, `beşiktaş j.k. (basketball)`, `fenerbahçe basketball` gibi.
- Küçük çapraz sızıntı: 43 takım birden çok organizasyonda (fenerbahçe Ligue 1'de 50,7K, trabzonspor Premier Lig'de 105,1K).
- Portföyün yarısı (8.610 satır) 1.000 altında hacim taşıyor; 172 satır sıfır.

### Etiket denetimi: güncel lig üyelikleri, ad çakışmaları, Avrupa kupası katmanı
Talep üzerine tüm takım ve organizasyon etiketleri güncel kaynaklardan doğrulanarak elden geçirildi. Düzeltmeler `data/denetim/etiket_duzelt.json` üzerinden build sırasında uygulanıyor; ham CSV'ler değişmiyor.

**Erzurumspor düzeltmesi geri alındı.** Araştırma, takımın düşmediğini **yükseldiğini** gösterdi: 2025-26 TFF 1. Lig şampiyonu olarak Süper Lig'e çıkmış. Önceki oturumda TFF 1. Lig'e taşımıştım, Süper Lig'e geri alındı.

**2026-27 lig üyelikleri (araştırmayla doğrulandı):**
- Süper Lig'e yükselen: Erzurumspor, Amedspor, Çorum FK
- TFF 1. Lig'e düşen: Antalyaspor, Kayserispor, Fatih Karagümrük
- Premier Lig'e yükselen: Hull City, Coventry, Ipswich · düşen: West Ham, Burnley, Wolverhampton
- Serie B'ye düşen: Cremonese, Pisa, Hellas Verona · Segunda'ya düşen: Girona, Mallorca, Oviedo

**Ad çakışması ayrımı (yeni kural).** Bir takım anahtarı birden çok spor dalına yayılıyorsa tek kulüp değil, adı çakışan iki kulüptür. 11 anahtar ayrıldı (235 satır): `fenerbahçe opet` hem kadın voleybol hem kadın basketbol satırlarını topluyordu, `olympiakos` / `panathinaikos` / `partizan` / `maccabi` / `zalgiris` / `baskonia` / `hapoel` futbol ve basketbol kulüplerini, `tokat belediye plevne` futbol ve voleybol kulübünü.

**Anahtar birleştirme.** Aynı kulübün farklı yazımları tek anahtarda toplandı (31 eşleme): `as roma`→`roma`, `ssc napoli`→`napoli`, `rc celta de vigo`→`celta vigo`, `hull`→`hull city`. Hull City kümesi 3 parçadan tek kümeye indi: 21,9M.

**Tek takım tek organizasyon.** 14 takım baskın organizasyonuna çekildi (65 satır). Kalan 5 çoklu takım gerçek çift üyelik (EuroLeague + Basketbol Süper Ligi).

**Avrupa kupası ikincil üyeliği (yeni faset).** 2026-27 lig aşaması kadroları, kuralar 27-28 Ağustos 2026'da çekildi. 75 kulüp: Şampiyonlar Ligi 25 (1,60B) · Avrupa Ligi 26 (258,2M) · Konferans Ligi 24 (130,4M). Türk kulüpleri: Galatasaray ve Fenerbahçe UCL, Beşiktaş UEL, Trabzonspor UECL. Kulüp kendi liginde kalır, satır çoğaltılmaz; `milli` alanıyla aynı desen.

**Sonuç:** 167 organizasyon, 930 takım kümesi, çok organizasyonlu takım 5 (hepsi meşru), çok sporlu organizasyon 2 (ikisi de "Diğer" kovası). Referans dashboard (`Sezonsallık/`, 8,1 MB) repodan çıkarıldı; kopyası skill'de duruyor.

### Hatalı oyuncu eşleşmeleri, eleme birleştirmesi ve organizasyona takım ekleme
**Talisca sınıfı düzeltildi.** Çekim sırasında bazı oyuncular kulüplerine değil kulüplerinin katıldığı kupaya bağlanmıştı: Talisca 2,4M "Şampiyonlar Ligi Elemeleri"nde kulüpsüz duruyordu. 7 oyuncunun kulübü güncel kaynaklardan doğrulanıp düzeltildi (Talisca ve Anderson Talisca → Fenerbahçe, Rafa Silva ve Vangelis Pavlidis → Benfica, Miha Zajc → Dinamo Zagreb, Danylo Sikan → Anderlecht, Dor Peretz → Maccabi Tel Aviv). Kalan 6 satır toplam 30K, dokunulmadı.

**Eleme turları ana yarışmayla birleştirildi.** Şampiyonlar/Avrupa/Konferans Ligi Elemeleri ayrı organizasyon değil, aynı yarışmanın bir aşaması. UEFA Şampiyonlar Ligi 13 kw / 43,5M → 95 kw / 50,5M, 76 takım.

**Aynı ad, iki branş.** Kulübün basketbol ve voleybol takımı aynı adı taşıyorsa anahtar bölünmüyor, kulüp her iki kümede de sayılıyor (`SPOR_AYIRMA_HARIC`). Bölme yalnızca gerçekten farklı kulüpler için kalıyor: tokat belediye plevne (futbol/voleybol), bologna (futbol/basketbol).

**Toplam hacim → aylık ortalama.** Keyword sekmesindeki KPI 12 aylık toplam yerine aylık ortalama gösteriyor; toplam alt satırda duruyor.

**Boş sonuç sekmeyi kaplamıyor.** Eskiden tüm ekran "Sonuç bulunamadı" olup kullanıcıyı tüm filtreleri temizlemeye itiyordu. Artık üstte ince bir şerit çıkıyor, sekme ve filtre çipleri yerinde kalıyor; hangi filtrenin daralttığı görülüp tek tek kaldırılabiliyor.

**Yeni: "Organizasyona takımları ekle" düğmesi.** Bir yarışma seçiliyken o yarışmada oynayan kulüplerin kendi takım ve oyuncu aramaları da kapsama giriyor. Kulüp satırları kendi ülke liginde kalmaya devam ediyor (Real Madrid La Liga'da), ikincil `avrupa` alanı üzerinden eşleşiyor. Karar Ağacı'nda etki büyük: UEFA Şampiyonlar Ligi **50,5M → 1,66B** (Etkinlik Ölçekli → Hub), Avrupa Ligi 14,8M → 276M, Konferans Ligi 14,1M → 142M. Süper Lig değişmiyor, takımları zaten kendi ligindeydi. Görünüm bilinçli olarak iki yerde birden sayıyor; Karar Ağacı'nda bunu söyleyen bir şerit var.

### Takım katmanı tüm sekmelerde, tüm metrikler aylık ortalamaya çevrildi
**Takım katmanı dahil bayrağı artık her sekmede işliyor.** Karar Ağacı'na özel çözüm kaldırıldı; genişletme `groupBy`'ın içine, organizasyon ekseninde çalışacak şekilde taşındı (`U.takimDahil` + `U.orgGenislet`). Kırılım kendi ağacını kurduğu için oraya da ayrıca bağlandı. Gruplar sekmesinde UEFA Şampiyonlar Ligi 4,21M → **138M**, Kırılım'da aynı.

**Tüm hacim gösterimleri aylık ortalama.** `fmtOrt(n) = fmtNum(n/12)` yardımcısı eklendi ve ~50 gösterim noktası çevrildi: Özet hero ve pazar özeti kartları, Gruplar tabloları, Takım Kümesi tablosu ve sezonsallığı, Grup Detayları, Kırılım karo ve sütun görünümleri, Karar Ağacı kova kartları ve tabloları, Paylaşımlı Katman tablosu, Sayfa Tipi, Yayın Hakkı Dışı, ShareBars ve karo metrikleri. Etiketler de güncellendi ("Toplam Arama · Son 12 Ay" → "Aylık Ort. Arama · Son 12 Ay").
- Toplam yalnızca etiketinde açıkça "Toplam" yazan yerlerde kalıyor: Keyword KPI alt satırı, Master liste CSV kolonları, hücre tooltip'leri ("… arama · dönem toplamı").
- Sezon dışı taban 6 aylık toplamdı, `sezonDisiOrt` ile aylık ortalamaya çevrildi (12'ye değil 6'ya bölünüyor).
- Karo metrik şeridinde "Toplam" satırı yerine önceki dönemin ortalaması geldi: "Önceki 12 Ay Ort." + "Son 12 Ay Ort.".
- Karar Ağacı Paylaşımlı Katman tablosunda tam sayılar kısaltıldı: Futbol takım talebi 179M.
- Kısaltılmamış sayı taraması yapıldı, sayfada kalan uzun sayı yok (yalnızca keyword sayıları binlik ayraçla, ki doğrusu bu).

Dokuz sekme 375px ve 1440px'te temiz.

### Takım katmanı bayrağı gerçekten çalışır hale getirildi
Bir önceki turda bayrağı `groupBy` içine koymak yetmemişti: sonuçlar `React.useMemo` ile önbellekleniyor ve bağımlılık listesinde bayrak yoktu, bu yüzden bayrak değişince önbellekteki gruplar dönüyordu. Ekranda hiçbir şey değişmiyordu.

Düzeltme: `takimDahil` prop olarak SezonTakvimi'ne, OzetTab'a, GruplarTab'a, SayfaTipiTab'a ve HakDisiTab'a geçirildi ve ilgili üç memo bağımlılık listesine eklendi (SezonTakvimi grupları, GruplarTab grupları, OzetTab kırılımı).

Doğrulanan etki (UEFA Şampiyonlar Ligi, aylık ort.):
- Özet · pazar payı ve donut: 4,21M / %1,6 → **138M / %31,6**
- Gruplar · sezonsallık matrisi ve grup tablosu: 4,21M → **138M**
- Kırılım · karo ve sütun görünümü: 4,21M → **138M**
- Karar Ağacı · kova kartları ve karar tablosu: Etkinlik Ölçekli 4,21M → **Hub 138M**
- Yayın Hakkı Dışı · organizasyon tablosu: UCL listede yokken **120M** ile giriyor
- Sayfa Tipi & Intent · organizasyon eksenine inildiğinde aynı şekilde

Etkilenmeyenler (tasarım gereği): Keyword ve Master liste satır listeleridir, orada satır çoğaltmak yanlış olur; Takım & Oyuncu küme tablosu takım bazlıdır, organizasyon toplamı taşımaz.

### Filtre sızıntısı ve Avrupa etiketi çakışmaları giderildi
**Filtre sızıntısı.** Organizasyon filtresi seçiliyken bayrak açıldığında kulüplerin kendi ligleri de listede kalıyordu (UCL seçiliyken Süper Lig, La Liga, Premier Lig satırları). Sebebi: `applyFacets` satırı yalnızca eşleştirip bırakıyordu, satır kendi `org` değerini koruyordu. Artık `avrupa` üzerinden kapsama giren satır o yarışmaya **taşınıyor**; aynı düzeltme `yoluUygula`'ya da uygulandı. UCL filtresiyle Gruplar tek satır, Kırılım tek spor dalı gösteriyor.

**Kırılım'daki basketbol sızıntısı.** `bayern münih` anahtarı futbol ve basketbol kulübünü birlikte taşıyordu ve Şampiyonlar Ligi etiketi basketbol oyuncusuna (andreas obst, 33,3K) da yazılıyordu. Futbol/basketbol ad çakışmaları ayrı kulüptür, spor ayrımı listesinden çıkarıldı.

**Kapsam kuralı netleşti.** `SPOR_AYIRMA_HARIC` yalnızca aynı kulübün basketbol-voleybol takımları için geçerli (talebiniz buydu). Futbol/basketbol çakışmaları (olympiakos, panathinaikos, partizan, maccabi, hapoel, zalgiris, baskonia, bayern münih) bölünüyor; birleştirildiğinde 204 futbolcu satırı basketbol ligine yazılıyordu.

**Kupa çelişkisi kuralı.** Eleme birleştirmesi bir kulübü yanlış kupanın altına koyabiliyordu: Union Saint-Gilloise Şampiyonlar Ligi elemesinde oynayıp Avrupa Ligi lig aşamasına düştü. Güncel üyelik `avrupa` alanındadır, `org` ondan alınıyor. 16 satır düzeldi.

**Etiket çakışma taraması (son durum):** oyuncu-kulüp organizasyon uyuşmazlığı 0 · Avrupa etiketi futbol dışı satırda 0 · kupa çelişkisi 0 · çoklu sporlu takım 1 (fenerbahçe opet, kasıtlı) · çoklu organizasyonlu takım 5 (hepsi gerçek çift üyelik).

### Genel denetim: 17.880 keyword ve arayüz çaprazlaması
**Keyword etiket denetimi (`scripts/keyword_denetim.js`).** Örnekleme yok: 17.880 satırın tamamı 10 kuraldan geçiyor, betik kapsamı sonda doğruluyor. Kurallar: spor dalı sözcüğü × faset, lig adı × organizasyon, takım adı × keyword, sayfa tipi sözcüğü × faset, izleme sorgusu × intent, cinsiyet sözcüğü × faset, Türk kulübü × Türk bağlantısı, boş zorunlu faset, oyuncu/maç satırı × sayfa tipi.

İlk turda 84 satır işaretlendi; çoğu regex yanlış pozitifiydi (JS `\b` sınırı Türkçe harfleri sözcük karakteri saymıyor: "altunbaş" içinde `nba\b`, "donnarumma" içinde `mma\b` eşleşiyordu). Sınırlar Türkçe harfleri kapsayacak biçimde yeniden yazıldı, daha özel lig adı zaten atanmışsa bulgu sayılmaması eklendi.

Gerçek bulgular ve düzeltmeleri:
- **Türk bağlantısı (220 satır / 29,6M):** Fenerbahçe Beko, Beşiktaş Basketbol, Trabzonspor BK, Anadolu Efes gibi Türk kulüpleri "Avrupa / Yabancı / Türk bağlantısı yok" etiketliydi. Sebep: milliyet yarışmanın coğrafyasından türetilmiş, EuroLeague'de oynadıkları için yabancı sayılmışlar. Yeni kural: kulüp bir Türk liginde yer alıyorsa Türk bağlantısı ondan okunur. 79 kulüp.
- **Cinsiyet (2 satır):** "ufc kadın dövüşçüler" ve "kadın ufc dövüşçüleri" Erkek etiketliydi.
- **Ad varyantı (2 anahtar):** `fenerbahçe basketball` → `fenerbahçe beko`, `beşiktaş j.k.` → `beşiktaş basketbol`.

Son durum: **1 satır** işaretli ("wimbledon kimdir", 130 hacim — AFC Wimbledon kulübü mü tenis turnuvası mı belirsiz, ihmal edilebilir).

**Arayüz çaprazlama testi.** 14 senaryo × 10 sekme = 140 render. Senaryolar: tekli ve çoklu faset, takım katmanı bayrağı açık/kapalı, Rolling ve Takvim Yılı modu, kırılım yolu, çelişkili filtre (boş sonuç). Sonuç: boş sekme yok, konsol hatası yok, çelişkili senaryoda boş şerit doğru çıkıyor ve sekmeler yerinde kalıyor. Kırılım yolu ile filtre çipi senkron ("Tüm portföy › Süper Lig 188M" ↔ "Organizasyon: Süper Lig ×").

Responsive: on sekme 375px ve 1440px'te temiz.

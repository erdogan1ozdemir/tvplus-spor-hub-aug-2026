# Keyword Veri Seti Denetimi · Ağustos 2026

Altı paralel ajanla yürütülen salt-okunur denetimin sonuçları. Ajanlar hiçbir dosyayı
değiştirmedi, hiçbir DataForSEO çağrısı yapmadı.

**Rakam okuma notu.** Ajanlar ham CSV satırları üzerinden çalıştı; ham dosyalarda 609
mükerrer keyword var. Derleme (`build-data.js`) keyword bazında tekilleştirdiği için
dashboard'da mükerrer yok: 17.819 satır, 17.819 tekil keyword. Aşağıdaki rakamlar
**dashboard üzerinde yeniden doğrulanmış** değerlerdir; ajan raporlarındaki ham satır
toplamlarından farklı olabilirler. Hacimler Son 12 Ay (r12) toplamıdır.

---

## Bu oturumda düzeltilenler

| Bulgu | Durum |
|---|---|
| `dfs_volume.py` içinde tanımsız `hatali_gorev` değişkeni | Düzeltildi |
| Türkçe "İ" harfinin çekimde bozulması | Düzeltildi |
| `kadro_wiki_basket.py` tek kulüp çalıştırmasında dosyayı eziyordu | Düzeltildi |

### Türkçe "İ" bozulması

Python'da `"İ".lower()` tek karakter değil, `i` + U+0307 (birleşen nokta) üretir.
`dfs_volume.py` içindeki karakter sanitizeri U+0307'yi izinli aralıkta bulamayıp
boşluğa çeviriyordu. Sonuç: `İlkay Gündoğan` DataForSEO'ya `i lkay gündoğan` olarak
gitmiş. **341 satır, 74 varlık, %0 veri dönüşü.**

Etkilenen varlıklar arasında İlkay Gündoğan, İrfan Can Kahveci, İsmail Yüksek,
Emirhan İlkhan, İllya Zabarni ve dört Avrupa ligi (İskoçya Premiership, İsviçre
Süper Lig, İsveç Allsvenskan, İsrail Ligi) var. Bu varlıklar bugün veri setinde
"talep yok" görünüyor. Düzeltme sonrası yeniden çekim gerekiyor.

---

## Öncelik 1 · Karar mekaniğini doğrudan etkileyenler

### 1.1 Süper Lig küme düşmeleri uygulanmamış · 41 keyword · 24,2M

2026-27 sezonunda Antalyaspor, Kayserispor ve Fatih Karagümrük TFF 1. Lig'e düştü;
Erzurumspor, Amedspor ve Çorum FK yükseldi. Veri seti yükselmeleri kısmen uygulamış,
düşmeleri hiç uygulamamış.

| Kulüp | Keyword | Hacim | Mevcut organizasyon |
|---|---|---|---|
| antalyaspor | 12 | 11.796.520 | Süper Lig (düşmüş olmalı) |
| kayserispor | 12 | 10.029.980 | Süper Lig (düşmüş olmalı) |
| karagümrük | 17 | 2.422.940 | Süper Lig (düşmüş olmalı) |
| erzurumspor | 28 | 7.971.790 | 7 Süper Lig + 21 TFF 1. Lig (bölünmüş) |
| çorum | 12 | 11.159.780 | 7 Süper Lig + 5 TFF 1. Lig (bölünmüş) |

Süper Lig ve TFF 1. Lig toplamları bu haliyle yanlış; lig bazlı hub kararı bundan
etkilenir.

### 1.2 Yurt dışındaki Türk sporcularda `turk_baglantisi` işareti yok

`Türk Sporcu Var` değeri hiçbir oyuncu satırında kullanılmamış. En yüksek hacimli
örnekler:

| Oyuncu | Hacim | Kulüp | `turk_baglantisi` |
|---|---|---|---|
| arda güler | 11.635.000 | real madrid | Yok |
| kenan yıldız | 5.688.000 | juventus | Yok |
| alperen şengün | 3.276.500 | houston rockets | Yok |
| hakan çalhanoğlu | 3.206.000 | inter | Yok |
| can uzun | 2.169.100 | eintracht frankfurt | Yok |

"Türk Bağlantısı" filtresi yurt dışındaki Türk sporcuları bulamıyor. TV+ için bu
katman doğrudan içerik önceliği demek.

Ters yön: NBA'de `Türk Sporcu Var` işareti Türk oyuncusu olmayan popüler takımlara
dağıtılmış (Lakers, Warriors, Celtics), Alperen Şengün'ün Houston Rockets'ı ve
Adem Bona'nın Philadelphia 76ers'ı ise işaretsiz.

### 1.3 İmkânsız faset kombinasyonu · 412 keyword · 45,9M

`musabaka_tipi = Lig` ile `lig_seviyesi = Kıta Üstü` birlikte olamaz. Dağılım:
Konferans Ligi Elemeleri 138, Şampiyonlar Ligi Elemeleri 111, EuroLeague 92,
Avrupa Ligi Elemeleri 71. Eleme turları da "Lig" sayılmış; bir kupanın eleme turu
lig değildir.

### 1.4 Avrupa eleme kovalarında kulüp olmayan varlıklar

Wikipedia eleme turu sayfalarından çıkarılan liste kulüp dışı kayıtlar içeriyor:
şehir adları (istanbul, zagreb, riga, sofia, tbilisi), jenerik kelimeler (sabah,
viking, nelson, europa), oyuncular (rafa silva, talisca, orkun kökçü), hakem adları
(michael oliver, szymon marciniak), stadyum adları (estádio da luz, red bull arena)
ve saat dilimi artıkları (`utc+00 00`).

Bunların 14'ü `mantik_denetim` ile işaretlenip toplamdan düşürülmüş durumda; kalan
kısım hâlâ takım olarak sayılıyor.

### 1.5 Kaynak dağılımı Türkiye talebiyle ters orantılı

| Küme | Keyword | Hacim |
|---|---|---|
| FA Cup Alt Ligler (İngiliz amatör kulüpleri) | 255 | 354.270 |
| TFF 2. ve 3. Lig | 6 | 5.372.920 |
| NBA | 4.721 | 65.375.670 |
| Basketbol Süper Ligi | 16 | 882.020 |

İngiliz amatör futboluna 255 keyword ayrılmışken, 15 kat daha fazla hacim taşıyan
TFF alt liglerine 6 keyword düşmüş. Aday listesi kurulurken erişilebilir kaynağın
(Wikipedia kadro sayfaları) talep büyüklüğünün önüne geçtiği görülüyor.

---

## Öncelik 2 · Kırılım güvenilirliği

### 2.1 Çalışır görünen ama hiçbir şeyi daraltamayan fasetler

| Faset | Durum | Sonuç |
|---|---|---|
| `marka_tipi` | Tüm satırlarda tek değer: `Jenerik` | Filtre seçilebiliyor, hiçbir satır elenmiyor. Rakip marka hacmi hiç ölçülmemiş |
| `kulup_dogrulama` | Kolon hiçbir CSV'de yok, faset haritasında tanımlı | Filtre boş açılıyor |
| `varyant_denetim` | Tek değer: `Geçerli` | Dışlama koşulu hiç tetiklenemiyor |
| `kurum_sorgusu` | 3 satır `evet`, kalanı `hayır` | Ayırt ediciliği yok |

`marka_siniflandir.py` içindeki rakip sözlüğü (beIN, Mackolik, Sofascore, Exxen,
tabii) veri setinde hiç eşleşmemiş; çünkü bu keyword'ler evrende hiç yok. Rakip
marka segmenti boş.

### 2.2 `prestij_katmani` prestij değil kaynak dosya ölçüyor

Değerler provenans temelli dağılmış: `hacim_oyuncular.csv` tamamen `Çekirdek`,
`hacim_yeni_oyuncular.csv` tamamen `Ana Liste`, `hacim_tur3.csv` tamamen
`Global Elit`. Aynı organizasyon üç farklı prestij değeri taşıyor (Süper Lig:
Çekirdek 1.533 satır, Global Elit 348, Ana Liste 541). Bu eksende alınan her
kırılım prestij değil dosya kompozisyonunu çiziyor.

### 2.3 `dil` faseti dili değil karakter setini ölçüyor

Üretim kuralı beş betikte aynı: keyword'de ç/ğ/ı/ö/ş/ü yoksa "İngilizce".
Sonuç: `galatasaray puan durumu` İngilizce etiketli. Ters yönde `atletico madrid`,
`mbappe` Türkçe etiketli. Bu faset hiçbir kırılımda güvenilir değil.

### 2.4 `varyant_kodu` üç ayrı sözlük kullanıyor

Aynı kavram dosyaya göre farklı etikette: `Takım Jenerik` / `jen` / `tk_jen`,
`Puan Durumu` / `pd` / `tk_pd`, `Fikstür` / `fik` / `tk_fikstur`. Varyant kırılımı
sessizce parçalanıyor.

### 2.5 `cografya` fasetinde kavram karışımı

33 değer içinde ülke (Türkiye, İspanya), kıta (Avrupa, Asya) ve meta etiket
(Global, Yurt Dışı) aynı eksende. Hiyerarşik toplanamıyor; "Avrupa" barı ile
"İspanya + İtalya" barları örtüşen kümeleri temsil ediyor.

### 2.6 `kulup` fasetinde büyük/küçük harf kayması

33 NBA kulübü iki farklı yazımla kayıtlı (`boston celtics` / `Boston Celtics`).
Takım kümesi görünümünde her biri iki satır olarak listeleniyor, hacimleri
bölünüyor.

---

## Öncelik 3 · Sayfa tipi ve intent

### 3.1 `Lig Jenerik` sayfa tipi hiç kullanılmamış

Bütün organizasyon ana sayfası talebi tek bir `Jenerik` kovasına düşmüş:
`süper lig`, `tjk`, `dünya kupası`, `şampiyonlar ligi`, `premier lig`, `euroleague`.
Lig ana sayfası talebi ile jenerik spor talebi ayrıştırılamıyor.

### 3.2 Tek maç talebi beş sayfa tipine dağılmış

`galatasaray fenerbahçe` (Rakip Eşleşmesi), `... istatistikleri` (İstatistik),
`... nerede izlenir` (Kanal/Yayın), `... maçı ne zaman` (Takvim/Saat),
`... canlı izle` (Canlı İzle). Beşi de aynı URL'nin talebi.

### 3.3 İzleme intent'i evrenin %1,8'i

| Intent | Hacim | Pay |
|---|---|---|
| Bilgi | 3.638.222.260 | %98,20 |
| İzleme | 66.818.960 | %1,80 |
| Ticari | 20.760 | %0,00 |

TV+'ın gerçekten tıklama aldığı katman izleme intent'i (CTR %12-22, veri
sorgularında %0,03-0,42). Evrenin ağırlığı yanlış tarafta duruyor.

Ayrıca izleme kararının hemen öncesindeki aile Bilgi'de kalmış: `canlı skor`,
`bugünkü maçlar`, `maçı ne zaman`, `saat kaçta`. Bu aile İzleme'ye alındığında
izleme hacmi iki katından fazlasına çıkıyor.

---

## Kapsam boşlukları

### Hiç bulunmayan sorgu aileleri

Aşağıdakiler veri setinde **sıfır keyword**:

ilk 11 / muhtemel 11 · sakatlık · cezalı oyuncular · hakem / VAR · stadyum ·
gol kralı / asist kralı · teknik direktör · kaç kaç / maç sonucu · tekrar izle /
özet · küme düşme / şampiyonluk yarışı · play-off / tur eşleşmesi · maaş /
sözleşme / piyasa değeri · abonelik / paket / fiyat · yayıncı marka adları
(bein, tabii, s sport) · spor dalı hub'ı (`futbol`, `basketbol` tek başına) ·
nedir / kuralları / nasıl oynanır

### Tek keyword'e sıkışmış aileler

| Aile | Keyword | Hacim |
|---|---|---|
| canlı skor | 1 | 54.780.000 |
| maç özeti | 1 | 3.328.300 |
| şifresiz izle | 5 | 46.400 |

### Hiç bulunmayan sporcular

Toprak Razgatlıoğlu (2026'da MotoGP'ye geçen ilk Türk pilot), Zeynep Sönmez
(tarihin en yüksek WTA sıralamalı Türk tenisçisi), Mete Gazoz (olimpiyat
şampiyonu okçu) — üçü de sıfır keyword. Bireysel sporcu katmanı hiç kurulmamış:
F1 ve MotoGP pilotu, UFC dövüşçüsü, tenisçi, atlet, güreşçi.

### Diğer yapısal boşluklar

- **Basketbol Süper Ligi kulüp katmanı**: ligin 16 kulübünün 13'ü evrende yok
  (Türk Telekom, Bahçeşehir Koleji, Pınar Karşıyaka, Tofaş, Merkezefendi…)
- **Genişletilmiş izleme şablonu** 169 organizasyonun yalnızca 13'üne uygulanmış;
  Süper Lig, Dünya Kupası, A Milli Takım, Türkiye Kupası, Süper Kupa dışarıda
- **H2H matrisi** yalnızca Süper Lig ilk 8 takım arasında; Konyaspor, Antalyaspor,
  Kayserispor ve diğerleriyle hiçbir çift yok. Avrupa klasikleri (real madrid
  manchester city, barcelona psg) hiç yok
- **Uzun form H2H**: tire ayraçlı (` - `) tek bir keyword yok, "milli futbol
  takımı" uzun formu hiç yok. GSC'de bu form 130-174K impression üretiyor
- **Milli takım varlık katmanı**: milli takımlar yalnızca H2H içinde geçiyor,
  `Takım Jenerik` sayfa tipinde tek bir milli takım yok
- **Yaz turnuvası derinliği**: Dünya Kupası 7 keyword taşıyor; 2026 Haziran'ında
  `dünya kupası` tek başına 24,9M arama aldı

---

## Bekleyen çekim listesi

Hiçbiri çekilmedi. Öncelik 0 (sanitizer düzeltmesi) tamamlandı, artık çekim
güvenli.

| # | Ne | Keyword | İstek | Neden |
|---|---|---|---|---|
| 1 | Türkçe "İ" onarımı | ~261 | 1 | Bugün %0 dönen tek sistematik hata sınıfı |
| 2 | Bekleyen oyuncu seed'i | 428 | 1 | Düzeltilen basketbol kadroları hiç ölçülmedi |
| 3 | Güncel kadro seed boşluğu | 1.243 | 2 | Güncel seed hiç çekilmedi, hacim dosyası eski setten |
| 4 | `hacim_takimlar.csv` 2026-07 onarımı | 1.892 | 3 | 3. batch 30 ay dönmüş, 484 satırda son ay boş |

Tekilleştirilmiş toplam yaklaşık 3.600 keyword, 6 istek, ~$0,54.

Kapsam boşluklarının kapatılması ayrı bir çalışma: Öncelik 1 kalemleri yaklaşık
1.720 keyword, tamamı 5.500-6.000 keyword.

---

## Temiz çıkan alanlar

Yeniden denetlenmesine gerek yok:

- `cografya=Türkiye` ↔ `yerlilik=Yerli` çift yönlü tam eşleşme, 0 sapma
- Organizasyon ↔ coğrafya eşlemesi 25 ligde doğru (NBA istisnası hariç)
- Kadın organizasyonlarının tamamı `cinsiyet=Kadın`; Efeler Ligi'nin tamamı `Erkek`
- `entity_tipi` ↔ `sayfa_tipi` matrisinde yapısal uyumsuzluk yok
- `intent_katmani=Ticari` satırlarının tamamı `sayfa_tipi=Bilet`
- İzleme token'ı taşıyan satırların tamamı `intent_katmani=İzleme` (sızıntı yok)
- `sorgu_uzunlugu` kelime sayısıyla birebir örtüşüyor
- Altı dosyanın tamamında aynı 31 ay kolonu, aynı sıra
- `veri_var` ↔ `search_volume` tutarlılığı tam
- Ana yazım kaymaları yok: organizasyon, spor_dali, sayfa_tipi, entity_tipi ve
  12 faset daha normalize çakışma içermiyor

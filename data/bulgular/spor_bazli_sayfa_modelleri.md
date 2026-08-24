# Spor Bazlı Sayfa Modelleri

SERP incelemesi (Ahrefs serp-overview, TR, 2026-08-01) ve rakip sayfalarının doğrudan
incelenmesiyle çıkarıldı. Her spor dalı farklı bir sayfa modeliyle kazanıyor; tek tip
"hub + fikstür + puan durumu" şablonu her organizasyona uymuyor.

---

## Model 1 · Sürekli lig (futbol ligleri, NBA)
**Kazanan sayfa tipi:** `/puan-durumu` ve `/fikstur` veri sayfaları
**SERP karakteri:** Veri sitesi yoğunluğu. "nba puan durumu" ilk 10: Flashscore (DR 42),
NTV Spor (66), Mackolik (64), Eurosport (30), Misli (67), Sofascore (80), 365scores (76),
Eurohoops (68), Sporx (62), Fanatik (71).
**Not:** 1. sıradaki sitenin DR'ı 42; giriş engeli otorite değil, veri tazeliği ve sayfa yapısı.
**Gerekli modüller:** güncel tablo, hafta seçici, takım linkleri, istatistik sekmesi.

## Model 2 · Milli takım / turnuva (voleybol milli takım)
**Kazanan sayfa tipi:** Haber-duyuru + federasyon takım sayfası + canlı yayın sayfası.
**Puan durumu sayfası kazanmıyor.**
**SERP karakteri:** "voleybol milli takım maçı" ilk 10:
1. TVF haber içeriği "Filenin Sultanları'nın 2026 VNL Maç Programı Belli Oldu" (10.3K trafik)
2. PAA kutuları: "Filenin Sultanları maç saat kaçta?", "Voleybol milli takımı maçı ne zaman?",
   "Filenin Sultanları final kiminle?"
3. Instagram TVF · 4. Flashscore takım sayfası · 5. YouTube maç tamamı
6. Nesine canlı skor · 7. TVF kadın milli takımlar sayfası
8. **TRT Spor canlı yayın izle sayfası (108K trafik)** · 9. Wikipedia
**Çıkarım:** Bu modelde talep "ne zaman / saat kaçta / hangi kanalda" etrafında toplanıyor.
TV+ için doğru yapı program duyurusu + canlı yayın sayfası, tablo değil.

## Model 3 · Dövüş sporları / etkinlik takvimi (UFC)
**Kazanan sayfa tipi:** Etkinlik takvimi + dövüş kartı (fight card) + sıralama + sporcu sayfaları.
**SERP karakteri:** "ufc" ilk 10: UFC.com resmi site sitelink'lerle (Events, Rankings,
Athletes, History), Wikipedia, Sofascore MMA organizasyon sayfası, UFC Fight Pass,
ESPN schedule, Instagram, **TV+ 8. sırada 4.892 trafik**, S Sport Plus "UFC nedir".
**Sofascore UFC sayfası modülleri (sayfa üzerinden doğrulandı):**
- Etkinlikler: Yaklaşan / Bitti sekmeleri
- Her etkinlik kartı: etkinlik adı (UFC Fight Night: X vs. Y), salon, şehir/ülke,
  iki dövüşçü, tarih-saat, "Ana Kart" linki
- "Hakkımızda" uzun açıklama bloğu: kuruluş bilgisi, 12 sıklet listesi ve kilo aralıkları
**Çıkarım:** Fikstür/puan durumu yerine etkinlik takvimi + kart + sıklet sıralaması.

## Model 4 · Yarış takvimi (MotoGP, Formula 1)
**Kazanan sayfa tipi:** Yıl bazlı puan durumu + yarış başına sonuç sayfası.
**SERP karakteri:** "motogp puan durumu" ilk 10: motorsport.com (DR 79), beIN haber,
**trf1.net (DR 4)**, Red Bull (89), **motoetkinlik.com (DR 8)**, Flashscore (42),
race-result (5), motorsport yarış sonucu sayfası, Eurosport (30), ellturco (0).
**Not:** DR 4 ve DR 8 siteler ilk 5'te. Bu dikeyde rekabet belirgin şekilde düşük.
**motorsport.com sayfa yapısı (doğrulandı):**
- Yıl seçici: 2026'dan 2015'e kadar arşiv
- Üç sekme: PİLOTLAR / TAKIMLAR / KURUCULAR
- Tablo: sıra, pilot, takım, toplam puan, yarış başına puan kolonları
- Ayrı yarış sonucu sayfaları: `/motogp/results/2026/almanya-gp-664296/`
**Türkiye kancası:** PAA'lar Toprak Razgatlıoğlu üzerinden geliyor
("MotoGP toprak kaçıncı oldu?", "Toprak Razgatlıoğlu kaç puan durumu?").
Türkiye'deki MotoGP ilgisi büyük ölçüde Türk pilot etrafında şekilleniyor.

---

## URL deseni notu
Yarış ve turnuva dikeylerinde **yıl URL'de tutuluyor**: `/standings/2026/`,
`/2026-motogp-puan-durumu/`, `/results/2026/almanya-gp-664296/`.
Sürekli liglerde ise sezon çoğunlukla URL dışında veya opsiyonel segment olarak duruyor
(`/puan-durumu/türkiye-trendyol-süper-lig/2026-2027/...`).

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2. tur seed: rakip eslesmesi (H2H), takim mac sorgulari, alt/ek ligler,
milli takimlar, sezonsal-periyodik organizasyonlar.
Faset semasi 1. turla ayni; yeni sayfa_tipi degerleri eklenir.
"""
import csv, os, re, itertools

OUT = "data/raw/seed_tur2.csv"
F = ["organizasyon","spor_dali","musabaka_tipi","lig_seviyesi","prestij_katmani",
     "cinsiyet","kulup_milli","takim_bireysel","cografya","yerlilik","turk_baglantisi",
     "yayin_hakki","periyodiklik","takvim_tipi","sayfa_tipi","intent_katmani",
     "entity_tipi","marka_tipi","dil","sorgu_uzunlugu","varyant_kodu"]
rows, seen = [], set()

def add(kw, base, sayfa_tipi, intent, entity, varyant):
    kw = re.sub(r"\s+"," ",kw).strip().lower()
    if not kw or kw in seen or len(kw) > 78: return
    seen.add(kw)
    wc = len(kw.split())
    rows.append({**base, "keyword":kw, "sayfa_tipi":sayfa_tipi, "intent_katmani":intent,
                 "entity_tipi":entity, "marka_tipi":"Jenerik",
                 "dil":"İngilizce" if re.fullmatch(r"[a-z0-9 .\-']+",kw) else "Türkçe",
                 "sorgu_uzunlugu":"Head" if wc<=2 else ("Body" if wc<=4 else "Long-tail"),
                 "varyant_kodu":varyant})

def B(org,spor,mus,sev,pres,cins,km,tb,cog,yer,turk,hak,per,tak):
    return dict(zip(F[:14],(org,spor,mus,sev,pres,cins,km,tb,cog,yer,turk,hak,per,tak)))

# =============================================================== A. TAKIM EVRENI
# (lig, takimlar, base faset)
LIGLER = [
 ("Süper Lig", B("Süper Lig","Futbol","Lig","1. Seviye","Global Elit","Erkek","Kulüp",
   "Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Sürekli Lig"),
  ["galatasaray","fenerbahçe","beşiktaş","trabzonspor","başakşehir","samsunspor",
   "kocaelispor","göztepe","alanyaspor","konyaspor","antalyaspor","kasımpaşa",
   "rizespor","gaziantep fk","eyüpspor","karagümrük","gençlerbirliği","kayserispor"]),
 ("TFF 1. Lig", B("TFF 1. Lig","Futbol","Lig","2. Seviye","Orta","Erkek","Kulüp",
   "Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Sürekli Lig"),
  ["bandırmaspor","erzurumspor","sakaryaspor","boluspor","manisa fk","keçiörengücü",
   "adana demirspor","ümraniyespor","amed sportif","vanspor","iğdır fk","pendikspor",
   "esenler erokspor","serikspor","hatayspor","sivasspor","istanbulspor","çorum fk"]),
 ("La Liga", B("La Liga","Futbol","Lig","1. Seviye","Global Elit","Erkek","Kulüp",
   "Takım Sporu","İspanya","Yabancı","Yok","TV+ Var","Yıllık","Sürekli Lig"),
  ["real madrid","barcelona","atletico madrid","sevilla","real sociedad","villarreal",
   "athletic bilbao","valencia","real betis","girona"]),
 ("Serie A", B("Serie A","Futbol","Lig","1. Seviye","Global Elit","Erkek","Kulüp",
   "Takım Sporu","İtalya","Yabancı","Yok","TV+ Var","Yıllık","Sürekli Lig"),
  ["juventus","inter","milan","napoli","roma","lazio","atalanta","fiorentina","bologna","torino"]),
 ("Premier Lig", B("Premier Lig","Futbol","Lig","1. Seviye","Global Elit","Erkek","Kulüp",
   "Takım Sporu","İngiltere","Yabancı","Yok","TV+ Yok","Yıllık","Sürekli Lig"),
  ["manchester united","manchester city","liverpool","arsenal","chelsea","tottenham",
   "newcastle","aston villa","everton","west ham"]),
 ("Bundesliga", B("Bundesliga","Futbol","Lig","1. Seviye","Üst","Erkek","Kulüp",
   "Takım Sporu","Almanya","Yabancı","Yok","TV+ Yok","Yıllık","Sürekli Lig"),
  ["bayern münih","borussia dortmund","bayer leverkusen","rb leipzig","eintracht frankfurt"]),
 ("EuroLeague", B("EuroLeague","Basketbol","Kıta Turnuvası","Kıta Üstü","Global Elit","Erkek",
   "Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","TV+ Var","Yıllık","Sürekli Lig"),
  ["fenerbahçe beko","anadolu efes","beşiktaş basketbol","real madrid basketbol",
   "barcelona basketbol","panathinaikos","olympiakos","maccabi tel aviv","zalgiris","partizan"]),
 ("NBA", B("NBA","Basketbol","Lig","1. Seviye","Global Elit","Erkek","Kulüp","Takım Sporu",
   "ABD","Yabancı","Türk Sporcu Var","TV+ Var","Yıllık","Sürekli Lig"),
  ["los angeles lakers","golden state warriors","boston celtics","chicago bulls",
   "miami heat","denver nuggets","oklahoma city thunder","new york knicks"]),
 ("Sultanlar Ligi", B("Sultanlar Ligi","Voleybol","Lig","1. Seviye","Üst","Kadın","Kulüp",
   "Takım Sporu","Türkiye","Yerli","Türk Takımı Var","Doğrulanacak","Yıllık","Sürekli Lig"),
  ["vakıfbank","fenerbahçe opet","eczacıbaşı","galatasaray daikin","türk hava yolları voleybol"]),
]

TAKIM_VARYANT = [
    ("{} maçı",           "Takım Maç Sorgusu","Bilgi","tk_mac"),
    ("{} maçları",        "Takım Maç Sorgusu","Bilgi","tk_maclar"),
    ("{} maçı ne zaman",  "Takvim/Saat",      "Bilgi","tk_nezaman"),
    ("{} maçı hangi kanalda","Kanal/Yayın",   "İzleme","tk_kanal"),
    ("{} canlı izle",     "Canlı İzle",       "İzleme","tk_izle"),
    ("{} fikstür",        "Fikstür",          "Bilgi","tk_fikstur"),
    ("{} puan durumu",    "Puan Durumu",      "Bilgi","tk_pd"),
    ("{} kadro",          "Kadro",            "Bilgi","tk_kadro"),
    ("{} oyuncuları",     "Kadro",            "Bilgi","tk_oyuncu"),
    ("{} transfer",       "Transfer",         "Bilgi","tk_transfer"),
    ("{}",                "Takım Jenerik",    "Bilgi","tk_jen"),
]
for lig, base, takimlar in LIGLER:
    for t in takimlar:
        for tmpl, st_, it_, vk in TAKIM_VARYANT:
            add(tmpl.format(t), base, st_, it_, "Takım", vk)

# =============================================================== B. RAKIP ESLESMESI (H2H)
H2H_VARYANT = [
    ("{} {}",                "Rakip Eşleşmesi","Bilgi","h2h"),
    ("{} {} maçı",           "Rakip Eşleşmesi","Bilgi","h2h_mac"),
    ("{} {} canlı izle",     "Canlı İzle",     "İzleme","h2h_izle"),
    ("{} {} hangi kanalda",  "Kanal/Yayın",    "İzleme","h2h_kanal"),
    ("{} {} saat kaçta",     "Takvim/Saat",    "Bilgi","h2h_saat"),
    ("{} {} istatistikleri", "İstatistik",     "Bilgi","h2h_ist"),
]
# lig ici ilk N takim tum ikili kombinasyonlar
H2H_TOP = {"Süper Lig":8,"La Liga":5,"Serie A":6,"Premier Lig":6,"Bundesliga":4,
           "EuroLeague":6,"NBA":5,"TFF 1. Lig":5,"Sultanlar Ligi":4}
for lig, base, takimlar in LIGLER:
    n = H2H_TOP.get(lig, 4)
    for a, b in itertools.combinations(takimlar[:n], 2):
        for tmpl, st_, it_, vk in H2H_VARYANT:
            add(tmpl.format(a, b), base, st_, it_, "Maç", vk)

# milli takim H2H (Dunya Kupasi / eleme / hazirlik)
MB = B("Milli Takım Karşılaşmaları","Futbol","Milli","Milli","Global Elit","Erkek","Milli Takım",
       "Takım Sporu","Global","Uluslararası","Türk Takımı Var","TV+ Var","Sürekli","Turnuva")
MILLI = ["türkiye","ispanya","portekiz","fransa","arjantin","brezilya","almanya","ingiltere",
         "italya","hollanda","fas","norveç","belçika","hırvatistan","abd"]
for a, b in itertools.combinations(MILLI[:10], 2):
    for tmpl, st_, it_, vk in H2H_VARYANT[:4]:
        add(tmpl.format(a, b), MB, st_, it_, "Maç", vk)
for m in MILLI:
    for tmpl, st_, it_, vk in TAKIM_VARYANT[:6]:
        add(tmpl.format(m + " milli takım" if m=="türkiye" else m), MB, st_, it_, "Takım", vk)

# voleybol milli H2H (kullanicinin ozellikle istedigi segment)
VB = B("Voleybol Milli Karşılaşmaları","Voleybol","Milli","Milli","Global Elit","Kadın","Milli Takım",
       "Takım Sporu","Global","Uluslararası","Türk Takımı Var","TV+ Var","Sürekli","Turnuva")
for rak in ["brezilya","italya","abd","sırbistan","polonya","çin","japonya","hollanda"]:
    for tmpl in ["türkiye {} voleybol","türkiye {} voleybol maçı","türkiye {} voleybol maçı ne zaman",
                 "türkiye {} voleybol canlı izle","türkiye {} voleybol hangi kanalda"]:
        st_ = "Kanal/Yayın" if "kanal" in tmpl else ("Canlı İzle" if "izle" in tmpl else
              ("Takvim/Saat" if "ne zaman" in tmpl else "Rakip Eşleşmesi"))
        add(tmpl.format(rak), VB, st_, "İzleme" if st_ in ("Kanal/Yayın","Canlı İzle") else "Bilgi",
            "Maç","h2h_vol")

# =============================================================== C. EK / ALT LIGLER
EK_LIG = [
 ("Polonya Ekstraklasa","Polonya","Orta"),("Belçika Pro Lig","Belçika","Niş"),
 ("İskoçya Premiership","İskoçya","Niş"),("Avusturya Bundesliga","Avusturya","Niş"),
 ("İsviçre Süper Lig","İsviçre","Niş"),("Danimarka Süper Lig","Danimarka","Niş"),
 ("İsveç Allsvenskan","İsveç","Niş"),("Norveç Eliteserien","Norveç","Niş"),
 ("Çek Ligi","Çekya","Niş"),("Hırvatistan Ligi","Hırvatistan","Niş"),
 ("Sırbistan Süper Ligi","Sırbistan","Niş"),("Ukrayna Premier Ligi","Ukrayna","Niş"),
 ("Romanya Ligi","Romanya","Niş"),("Bulgaristan Ligi","Bulgaristan","Niş"),
 ("İsrail Ligi","İsrail","Niş"),("Mısır Ligi","Mısır","Niş"),
 ("Azerbaycan Premyer Liqası","Azerbaycan","Niş"),("Championship","İngiltere","Niş"),
 ("Serie B","İtalya","Niş"),("La Liga 2","İspanya","Niş"),("2. Bundesliga","Almanya","Niş"),
]
for ad, cog, pres in EK_LIG:
    b = B(ad,"Futbol","Lig","2. Seviye" if pres=="Niş" and ad in
          ("Championship","Serie B","La Liga 2","2. Bundesliga") else "1. Seviye",
          pres,"Erkek","Kulüp","Takım Sporu",cog,"Yabancı","Yok","TV+ Yok","Yıllık","Sürekli Lig")
    for tmpl, st_, it_, vk in [("{}","Jenerik","Bilgi","jen"),("{} puan durumu","Puan Durumu","Bilgi","pd"),
                                ("{} fikstür","Fikstür","Bilgi","fik"),("{} maçları","Takım Maç Sorgusu","Bilgi","maclar")]:
        add(tmpl.format(ad.lower()), b, st_, it_, "Lig/Organizasyon", vk)

# =============================================================== D. SEZONSAL / PERIYODIK
SEZONSAL = [
 # (ad, spor_dali, periyodiklik, cinsiyet, alias listesi)
 ("Yaz Olimpiyatları","Diğer","4 Yılda Bir","Karma",["olimpiyat","olimpiyat oyunları","yaz olimpiyatları","olimpiyat madalya sıralaması"]),
 ("Kış Olimpiyatları","Kış Sporları","4 Yılda Bir","Karma",["kış olimpiyatları","kış olimpiyat oyunları"]),
 ("Paralimpik Oyunlar","Diğer","4 Yılda Bir","Karma",["paralimpik oyunları"]),
 ("Avrupa Oyunları","Diğer","4 Yılda Bir","Karma",["avrupa oyunları"]),
 ("Akdeniz Oyunları","Diğer","4 Yılda Bir","Karma",["akdeniz oyunları"]),
 ("Kayak Dünya Kupası","Kış Sporları","Yıllık","Karma",["kayak dünya kupası","alp disiplini"]),
 ("Buz Pateni","Kış Sporları","Yıllık","Karma",["artistik buz pateni","buz pateni şampiyonası"]),
 ("Biatlon","Kış Sporları","Yıllık","Karma",["biatlon"]),
 ("Dünya Atletizm Şampiyonası","Atletizm","2 Yılda Bir","Karma",["dünya atletizm şampiyonası","atletizm şampiyonası"]),
 ("Dünya Yüzme Şampiyonası","Su Sporları","2 Yılda Bir","Karma",["dünya yüzme şampiyonası"]),
 ("Dünya Güreş Şampiyonası","Dövüş Sporları","Yıllık","Karma",["dünya güreş şampiyonası","güreş şampiyonası"]),
 ("Dünya Halter Şampiyonası","Diğer","Yıllık","Karma",["halter şampiyonası"]),
 ("Dünya Okçuluk Şampiyonası","Diğer","Yıllık","Karma",["okçuluk şampiyonası"]),
 ("Dünya Jimnastik Şampiyonası","Diğer","Yıllık","Karma",["jimnastik şampiyonası"]),
 ("Dünya Taekwondo Şampiyonası","Dövüş Sporları","2 Yılda Bir","Karma",["taekwondo şampiyonası"]),
 ("Dünya Judo Şampiyonası","Dövüş Sporları","Yıllık","Karma",["judo şampiyonası"]),
 ("Dünya Hentbol Şampiyonası","Hentbol","2 Yılda Bir","Karma",["hentbol dünya şampiyonası"]),
 ("Dünya Masa Tenisi Şampiyonası","Diğer","2 Yılda Bir","Karma",["masa tenisi şampiyonası"]),
 ("Dünya Buz Hokeyi Şampiyonası","Buz Hokeyi","Yıllık","Erkek",["buz hokeyi şampiyonası"]),
 ("Dünya Basketbol Kupası","Basketbol","4 Yılda Bir","Erkek",["basketbol dünya kupası"]),
 ("Kadınlar EuroBasket","Basketbol","2 Yılda Bir","Kadın",["kadınlar eurobasket","kadın basketbol avrupa şampiyonası"]),
 ("Kadınlar Voleybol Uluslar Ligi","Voleybol","Yıllık","Kadın",["kadınlar uluslar ligi","vnl kadınlar","fivb kadınlar uluslar ligi","vnl 2026"]),
 ("Erkekler Voleybol Uluslar Ligi","Voleybol","Yıllık","Erkek",["erkekler uluslar ligi","vnl erkekler"]),
 ("Kadınlar Voleybol Dünya Şampiyonası","Voleybol","4 Yılda Bir","Kadın",["kadınlar voleybol dünya şampiyonası"]),
 ("Kadınlar Voleybol Avrupa Şampiyonası","Voleybol","2 Yılda Bir","Kadın",["kadınlar voleybol avrupa şampiyonası"]),
 ("Dünya Kupası Elemeleri","Futbol","4 Yılda Bir","Erkek",["dünya kupası elemeleri","dünya kupası eleme grupları"]),
 ("EURO Elemeleri","Futbol","4 Yılda Bir","Erkek",["euro elemeleri","avrupa şampiyonası elemeleri"]),
 ("Kadınlar Dünya Kupası","Futbol","4 Yılda Bir","Kadın",["kadınlar dünya kupası"]),
 ("Kadınlar EURO","Futbol","4 Yılda Bir","Kadın",["kadınlar avrupa şampiyonası"]),
]
SEZ_VARYANT = [("{}","Jenerik","Bilgi","jen"),("{} ne zaman","Takvim/Saat","Bilgi","nezaman"),
               ("{} takvim","Takvim/Saat","Bilgi","takvim"),("{} canlı izle","Canlı İzle","İzleme","izle"),
               ("{} hangi kanalda","Kanal/Yayın","İzleme","kanal"),("{} puan durumu","Puan Durumu","Bilgi","pd"),
               ("{} fikstür","Fikstür","Bilgi","fik")]
for ad, spor, per, cins, aliases in SEZONSAL:
    b = B(ad,spor,"Dünya Turnuvası","Milli","Orta",cins,"Milli Takım",
          "Takım Sporu" if spor in ("Voleybol","Basketbol","Futbol","Hentbol","Buz Hokeyi") else "Bireysel Spor",
          "Global","Uluslararası","Türk Sporcu Var","Doğrulanacak",per,"Turnuva")
    for al in aliases:
        for tmpl, st_, it_, vk in SEZ_VARYANT:
            add(tmpl.format(al), b, st_, it_, "Etkinlik", vk)

# =============================================================== E. JENERIK / IZLEME
JB = B("Jenerik Spor","Çoklu/Jenerik","Jenerik","Yok","Global Elit","Karma","Jenerik",
       "Jenerik","Türkiye","Yerli","Yok","TV+ Var","Sürekli","Sürekli Lig")
for kw, st_, it_ in [
    ("canlı skor","Maç/Skor","Bilgi"),("canlı sonuçlar","Maç/Skor","Bilgi"),
    ("maç sonuçları","Maç/Skor","Bilgi"),("bugünkü maçlar","Takvim/Saat","Bilgi"),
    ("bugün hangi maçlar var","Takvim/Saat","Bilgi"),("maç programı","Takvim/Saat","Bilgi"),
    ("canlı maç izle","Canlı İzle","İzleme"),("şifresiz maç izle","Canlı İzle","İzleme"),
    ("maç izle","Canlı İzle","İzleme"),("maç hangi kanalda","Kanal/Yayın","İzleme"),
    ("maç saat kaçta","Takvim/Saat","Bilgi"),("spor haberleri","Haber","Bilgi"),
    ("maç özetleri","Maç/Skor","Bilgi"),("puan durumu","Puan Durumu","Bilgi"),
    ("fikstür","Fikstür","Bilgi"),("spor kanalları","Kanal/Yayın","İzleme"),
    ("iddaa programı","Takvim/Saat","Bilgi"),("transfer haberleri","Transfer","Bilgi")]:
    add(kw, JB, st_, it_, "Jenerik", "jenerik")

os.makedirs("data/raw", exist_ok=True)
with open(OUT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f, fieldnames=["keyword"]+F); w.writeheader()
    for r in rows: w.writerow({k:r.get(k,"") for k in ["keyword"]+F})

from collections import Counter
print(f"Keyword: {len(rows)}")
print("\nSayfa tipi dagilimi:")
for k,v in Counter(r["sayfa_tipi"] for r in rows).most_common():
    print(f"  {k:<22}{v}")
print(f"\nCikti: {OUT}")

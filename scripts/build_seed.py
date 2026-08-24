#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TV+ spor talep arastirmasi - organizasyon evreni ve faset semasi.
Her organizasyon bir kez faset'leriyle tanimlanir; keyword varyantlari
bu faset'leri miras alir ve kendi intent faset'lerini ekler.
Cikti: data/raw/seed_organizasyon.csv
"""
import csv, os, re

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "seed_organizasyon.csv")

# ---------------------------------------------------------------- varyant sozlugu
# kod: (sablon, sayfa_tipi, intent_katmani)
V = {
    "jen":  ("{}",                    "Jenerik",        "Bilgi"),
    "pd":   ("{} puan durumu",        "Puan Durumu",    "Bilgi"),
    "fik":  ("{} fikstür",            "Fikstür",        "Bilgi"),
    "mac":  ("{} maç sonuçları",      "Maç/Skor",       "Bilgi"),
    "izle": ("{} canlı izle",         "Canlı İzle",     "İzleme"),
    "kan":  ("{} hangi kanalda",      "Kanal/Yayın",    "İzleme"),
    "tak":  ("{} takvim",             "Takvim/Saat",    "Bilgi"),
    "sir":  ("{} sıralama",           "İstatistik",     "Bilgi"),
    "kad":  ("{} kadro",              "Kadro",          "Bilgi"),
    "bil":  ("{} bilet",              "Bilet",          "Ticari"),
}

# faset sirasi: spor_dali, musabaka_tipi, lig_seviyesi, prestij, cinsiyet,
#               kulup_milli, takim_bireysel, cografya, yerlilik, turk_baglantisi,
#               yayin_hakki, periyodiklik, takvim_tipi, varyantlar
O = []
def org(ad, *f, alias=None, varyant="jen,pd,fik,mac,izle,kan"):
    O.append(dict(zip(
        ["organizasyon","spor_dali","musabaka_tipi","lig_seviyesi","prestij_katmani",
         "cinsiyet","kulup_milli","takim_bireysel","cografya","yerlilik",
         "turk_baglantisi","yayin_hakki","periyodiklik","takvim_tipi"],
        (ad,)+f)) | {"alias": alias or [ad.lower()], "varyant": varyant})

# ============================================================ FUTBOL / TURKIYE
org("Süper Lig","Futbol","Lig","1. Seviye","Global Elit","Erkek","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Sürekli Lig",
    alias=["süper lig","trendyol süper lig"])
org("TFF 1. Lig","Futbol","Lig","2. Seviye","Orta","Erkek","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Sürekli Lig",
    alias=["1. lig","trendyol 1. lig"])
org("TFF 2. Lig","Futbol","Lig","Alt Seviye","Niş","Erkek","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Sürekli Lig",
    alias=["2. lig"], varyant="jen,pd,fik")
org("TFF 3. Lig","Futbol","Lig","Alt Seviye","Niş","Erkek","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Sürekli Lig",
    alias=["3. lig"], varyant="jen,pd,fik")
org("Ziraat Türkiye Kupası","Futbol","Kupa","1. Seviye","Üst","Erkek","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Turnuva",
    alias=["türkiye kupası","ziraat türkiye kupası"])
org("Turkcell Süper Kupa","Futbol","Süper Kupa","1. Seviye","Orta","Erkek","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Tek Etkinlik",
    alias=["süper kupa"], varyant="jen,izle,kan")
org("A Milli Futbol Takımı","Futbol","Milli","Milli","Global Elit","Erkek","Milli Takım","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Sürekli","Turnuva",
    alias=["a milli takım","milli maç","türkiye maçı","milli takım maçı"], varyant="jen,fik,izle,kan,kad")
org("A Milli Kadın Futbol Takımı","Futbol","Milli","Milli","Niş","Kadın","Milli Takım","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Sürekli","Turnuva",
    alias=["kadın milli takım futbol"], varyant="jen,fik,izle")
org("Kadın Futbol Süper Ligi","Futbol","Lig","1. Seviye","Niş","Kadın","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Sürekli Lig",
    alias=["kadın futbol ligi"], varyant="jen,pd,fik")

# ============================================================ FUTBOL / UEFA KULUP
org("UEFA Şampiyonlar Ligi","Futbol","Kıta Turnuvası","Kıta Üstü","Global Elit","Erkek","Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","TV+ Var","Yıllık","Turnuva",
    alias=["şampiyonlar ligi"], varyant="jen,pd,fik,mac,izle,kan,kad")
org("UEFA Avrupa Ligi","Futbol","Kıta Turnuvası","Kıta Üstü","Üst","Erkek","Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","TV+ Var","Yıllık","Turnuva",
    alias=["avrupa ligi","uefa avrupa ligi"])
org("UEFA Konferans Ligi","Futbol","Kıta Turnuvası","Kıta Üstü","Orta","Erkek","Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","TV+ Var","Yıllık","Turnuva",
    alias=["konferans ligi"])
org("UEFA Süper Kupa","Futbol","Süper Kupa","Kıta Üstü","Orta","Erkek","Kulüp","Takım Sporu","Avrupa","Uluslararası","Yok","TV+ Var","Yıllık","Tek Etkinlik",
    alias=["uefa süper kupa"], varyant="jen,izle,kan")
org("Kadınlar Şampiyonlar Ligi","Futbol","Kıta Turnuvası","Kıta Üstü","Niş","Kadın","Kulüp","Takım Sporu","Avrupa","Uluslararası","Yok","Doğrulanacak","Yıllık","Turnuva",
    alias=["kadınlar şampiyonlar ligi"], varyant="jen,fik,izle")

# ============================================================ FUTBOL / YABANCI LIG
for ad, al, cog, sev, pres in [
    ("Premier Lig",["premier lig","premier league"],"İngiltere","1. Seviye","Global Elit"),
    ("Championship",["championship ligi"],"İngiltere","2. Seviye","Niş"),
    ("La Liga",["la liga"],"İspanya","1. Seviye","Global Elit"),
    ("Serie A",["serie a"],"İtalya","1. Seviye","Global Elit"),
    ("Bundesliga",["bundesliga"],"Almanya","1. Seviye","Üst"),
    ("Ligue 1",["ligue 1"],"Fransa","1. Seviye","Üst"),
    ("Eredivisie",["eredivisie"],"Hollanda","1. Seviye","Orta"),
    ("Portekiz Ligi",["portekiz ligi"],"Portekiz","1. Seviye","Orta"),
    ("Yunanistan Süper Lig",["yunanistan ligi"],"Yunanistan","1. Seviye","Niş"),
    ("Rusya Premier Ligi",["rusya premier ligi"],"Rusya","1. Seviye","Niş"),
    ("Suudi Pro Lig",["suudi arabistan ligi","suudi pro lig"],"Suudi Arabistan","1. Seviye","Orta"),
    ("MLS",["mls"],"ABD","1. Seviye","Orta"),
    ("Brezilya Serie A",["brezilya ligi"],"Brezilya","1. Seviye","Niş"),
    ("Arjantin Ligi",["arjantin ligi"],"Arjantin","1. Seviye","Niş"),
]:
    hak = "TV+ Var" if ad in ("La Liga","Serie A") else "TV+ Yok"
    org(ad,"Futbol","Lig",sev,pres,"Erkek","Kulüp","Takım Sporu",cog,"Yabancı","Yok",hak,"Yıllık","Sürekli Lig",
        alias=al, varyant="jen,pd,fik,mac,izle,kan")

# ============================================================ FUTBOL / YABANCI KUPA
for ad, al, cog, hak in [
    ("FA Cup",["fa cup"],"İngiltere","TV+ Var"),
    ("Carabao Cup",["carabao cup","efl cup"],"İngiltere","TV+ Yok"),
    ("Community Shield",["community shield"],"İngiltere","TV+ Yok"),
    ("Copa del Rey",["kral kupası","copa del rey"],"İspanya","TV+ Yok"),
    ("Supercopa de España",["ispanya süper kupa"],"İspanya","TV+ Yok"),
    ("Coppa Italia",["coppa italia","italya kupası"],"İtalya","TV+ Yok"),
    ("DFB Pokal",["dfb pokal","almanya kupası"],"Almanya","TV+ Yok"),
]:
    org(ad,"Futbol","Kupa","Kıta Üstü","Orta","Erkek","Kulüp","Takım Sporu",cog,"Yabancı","Yok",hak,"Yıllık","Turnuva",
        alias=al, varyant="jen,fik,mac,izle,kan")

# ============================================================ FUTBOL / MILLI TURNUVA
org("FIFA Dünya Kupası","Futbol","Dünya Turnuvası","Milli","Global Elit","Erkek","Milli Takım","Takım Sporu","Global","Uluslararası","Türk Takımı Var","TV+ Var","4 Yılda Bir","Turnuva",
    alias=["dünya kupası"], varyant="jen,pd,fik,mac,izle,kan,bil")
org("UEFA EURO","Futbol","Kıta Turnuvası","Milli","Global Elit","Erkek","Milli Takım","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","Doğrulanacak","4 Yılda Bir","Turnuva",
    alias=["avrupa şampiyonası futbol","euro 2028"], varyant="jen,pd,fik,izle")
org("UEFA Uluslar Ligi","Futbol","Kıta Turnuvası","Milli","Üst","Erkek","Milli Takım","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","Doğrulanacak","2 Yılda Bir","Turnuva",
    alias=["uluslar ligi","uefa uluslar ligi"], varyant="jen,pd,fik,izle")
org("Copa America","Futbol","Kıta Turnuvası","Milli","Üst","Erkek","Milli Takım","Takım Sporu","Güney Amerika","Uluslararası","Yok","Doğrulanacak","4 Yılda Bir","Turnuva",
    alias=["kupa amerika","copa america"], varyant="jen,fik,izle")
org("Afrika Uluslar Kupası","Futbol","Kıta Turnuvası","Milli","Orta","Erkek","Milli Takım","Takım Sporu","Afrika","Uluslararası","Yok","Doğrulanacak","2 Yılda Bir","Turnuva",
    alias=["afrika uluslar kupası"], varyant="jen,fik,izle")
org("FIFA Kulüpler Dünya Kupası","Futbol","Dünya Turnuvası","Kıta Üstü","Üst","Erkek","Kulüp","Takım Sporu","Global","Uluslararası","Yok","Doğrulanacak","4 Yılda Bir","Turnuva",
    alias=["kulüpler dünya kupası"], varyant="jen,fik,izle,kan")
org("Copa Libertadores","Futbol","Kıta Turnuvası","Kıta Üstü","Orta","Erkek","Kulüp","Takım Sporu","Güney Amerika","Uluslararası","Yok","TV+ Yok","Yıllık","Turnuva",
    alias=["libertadores"], varyant="jen,fik,izle")

# ============================================================ BASKETBOL
org("NBA","Basketbol","Lig","1. Seviye","Global Elit","Erkek","Kulüp","Takım Sporu","ABD","Yabancı","Türk Sporcu Var","TV+ Var","Yıllık","Sürekli Lig",
    alias=["nba"], varyant="jen,pd,fik,mac,izle,kan,sir")
org("EuroLeague","Basketbol","Kıta Turnuvası","Kıta Üstü","Global Elit","Erkek","Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","TV+ Var","Yıllık","Sürekli Lig",
    alias=["euroleague","euroliga"], varyant="jen,pd,fik,mac,izle,kan,kad")
org("EuroCup","Basketbol","Kıta Turnuvası","Kıta Üstü","Orta","Erkek","Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","Doğrulanacak","Yıllık","Sürekli Lig",
    alias=["eurocup"], varyant="jen,pd,fik,izle")
org("Basketbol Süper Ligi","Basketbol","Lig","1. Seviye","Üst","Erkek","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","Doğrulanacak","Yıllık","Sürekli Lig",
    alias=["basketbol süper ligi","türkiye sigorta basketbol süper ligi"], varyant="jen,pd,fik,izle")
org("FIBA Şampiyonlar Ligi","Basketbol","Kıta Turnuvası","Kıta Üstü","Niş","Erkek","Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","Doğrulanacak","Yıllık","Turnuva",
    alias=["fiba şampiyonlar ligi"], varyant="jen,pd,fik")
org("EuroBasket","Basketbol","Kıta Turnuvası","Milli","Üst","Erkek","Milli Takım","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","Doğrulanacak","4 Yılda Bir","Turnuva",
    alias=["eurobasket","basketbol avrupa şampiyonası"], varyant="jen,pd,fik,izle")
org("FIBA Dünya Kupası","Basketbol","Dünya Turnuvası","Milli","Üst","Erkek","Milli Takım","Takım Sporu","Global","Uluslararası","Türk Takımı Var","Doğrulanacak","4 Yılda Bir","Turnuva",
    alias=["fiba dünya kupası"], varyant="jen,fik,izle")
org("Basketbol A Milli Takımı","Basketbol","Milli","Milli","Üst","Erkek","Milli Takım","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","Doğrulanacak","Sürekli","Turnuva",
    alias=["12 dev adam","basketbol milli takım"], varyant="jen,fik,izle,kad")
org("WNBA","Basketbol","Lig","1. Seviye","Niş","Kadın","Kulüp","Takım Sporu","ABD","Yabancı","Türk Sporcu Var","Doğrulanacak","Yıllık","Sürekli Lig",
    alias=["wnba"], varyant="jen,pd,fik")
org("Kadınlar EuroLeague","Basketbol","Kıta Turnuvası","Kıta Üstü","Niş","Kadın","Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","Doğrulanacak","Yıllık","Sürekli Lig",
    alias=["kadınlar euroleague"], varyant="jen,pd,fik")
org("Kadınlar Basketbol Süper Ligi","Basketbol","Lig","1. Seviye","Niş","Kadın","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","Doğrulanacak","Yıllık","Sürekli Lig",
    alias=["kadınlar basketbol ligi"], varyant="jen,pd,fik")
org("NCAA Basketbol","Basketbol","Kupa","Alt Seviye","Niş","Erkek","Kulüp","Takım Sporu","ABD","Yabancı","Yok","TV+ Yok","Yıllık","Turnuva",
    alias=["ncaa","march madness"], varyant="jen,fik,izle")

# ============================================================ VOLEYBOL
org("Sultanlar Ligi","Voleybol","Lig","1. Seviye","Üst","Kadın","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","Doğrulanacak","Yıllık","Sürekli Lig",
    alias=["sultanlar ligi"], varyant="jen,pd,fik,mac,izle,kan")
org("Efeler Ligi","Voleybol","Lig","1. Seviye","Orta","Erkek","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","Doğrulanacak","Yıllık","Sürekli Lig",
    alias=["efeler ligi"], varyant="jen,pd,fik,izle,kan")
org("Kadın Voleybol Milli Takımı","Voleybol","Milli","Milli","Global Elit","Kadın","Milli Takım","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Var","Sürekli","Turnuva",
    alias=["filenin sultanları","kadın voleybol milli takım"], varyant="jen,fik,mac,izle,kan,kad")
org("Erkek Voleybol Milli Takımı","Voleybol","Milli","Milli","Üst","Erkek","Milli Takım","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Var","Sürekli","Turnuva",
    alias=["filenin efeleri","erkek voleybol milli takım"], varyant="jen,fik,izle,kan,kad")
org("CEV Şampiyonlar Ligi","Voleybol","Kıta Turnuvası","Kıta Üstü","Orta","Karma","Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","Doğrulanacak","Yıllık","Turnuva",
    alias=["cev şampiyonlar ligi"], varyant="jen,fik,izle")
org("FIVB Milletler Ligi","Voleybol","Dünya Turnuvası","Milli","Üst","Karma","Milli Takım","Takım Sporu","Global","Uluslararası","Türk Takımı Var","Doğrulanacak","Yıllık","Turnuva",
    alias=["voleybol milletler ligi","vnl"], varyant="jen,pd,fik,izle")
org("Voleybol Dünya Şampiyonası","Voleybol","Dünya Turnuvası","Milli","Üst","Karma","Milli Takım","Takım Sporu","Global","Uluslararası","Türk Takımı Var","Doğrulanacak","4 Yılda Bir","Turnuva",
    alias=["voleybol dünya şampiyonası"], varyant="jen,fik,izle")
org("Voleybol Avrupa Şampiyonası","Voleybol","Kıta Turnuvası","Milli","Orta","Karma","Milli Takım","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","Doğrulanacak","2 Yılda Bir","Turnuva",
    alias=["voleybol avrupa şampiyonası"], varyant="jen,fik,izle")

# ============================================================ DOVUS
org("UFC","Dövüş Sporları","Bireysel Sıralama Serisi","Kıta Üstü","Global Elit","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","TV+ Var","Sürekli","Tek Etkinlik",
    alias=["ufc"], varyant="jen,fik,izle,kan,tak,sir")
org("Boks","Dövüş Sporları","Bireysel Sıralama Serisi","Kıta Üstü","Üst","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Sürekli","Tek Etkinlik",
    alias=["boks","boks maçı"], varyant="jen,izle,kan,tak")
org("WWE","Dövüş Sporları","Bireysel Sıralama Serisi","Kıta Üstü","Üst","Karma","Bireysel","Bireysel Spor","ABD","Yabancı","Yok","TV+ Yok","Sürekli","Tek Etkinlik",
    alias=["wwe"], varyant="jen,izle,kan,tak")
org("PFL","Dövüş Sporları","Bireysel Sıralama Serisi","Kıta Üstü","Niş","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Tek Etkinlik",
    alias=["pfl"], varyant="jen,izle,tak")
org("ONE Championship","Dövüş Sporları","Bireysel Sıralama Serisi","Kıta Üstü","Niş","Karma","Bireysel","Bireysel Spor","Asya","Yabancı","Yok","Doğrulanacak","Sürekli","Tek Etkinlik",
    alias=["one championship"], varyant="jen,izle")
org("Bellator","Dövüş Sporları","Bireysel Sıralama Serisi","Kıta Üstü","Niş","Karma","Bireysel","Bireysel Spor","ABD","Yabancı","Yok","TV+ Yok","Sürekli","Tek Etkinlik",
    alias=["bellator"], varyant="jen,izle")
org("Yağlı Güreş","Dövüş Sporları","Kupa","Milli","Orta","Erkek","Bireysel","Bireysel Spor","Türkiye","Yerli","Türk Sporcu Var","Doğrulanacak","Yıllık","Tek Etkinlik",
    alias=["kırkpınar","yağlı güreş"], varyant="jen,izle,tak")
org("Güreş","Dövüş Sporları","Bireysel Sıralama Serisi","Milli","Orta","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Sürekli","Turnuva",
    alias=["güreş"], varyant="jen,izle")
org("Kickboks","Dövüş Sporları","Bireysel Sıralama Serisi","Kıta Üstü","Niş","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Sürekli","Tek Etkinlik",
    alias=["kickboks"], varyant="jen,izle")
org("Judo","Dövüş Sporları","Bireysel Sıralama Serisi","Milli","Niş","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Sürekli","Turnuva",
    alias=["judo"], varyant="jen")
org("Taekwondo","Dövüş Sporları","Bireysel Sıralama Serisi","Milli","Niş","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Sürekli","Turnuva",
    alias=["taekwondo"], varyant="jen")

# ============================================================ MOTOR
org("Formula 1","Motor Sporları","Bireysel Sıralama Serisi","1. Seviye","Global Elit","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","TV+ Yok","Yıllık","Yarış Takvimi",
    alias=["formula 1","f1"], varyant="jen,pd,izle,kan,tak,sir,bil")
org("MotoGP","Motor Sporları","Bireysel Sıralama Serisi","1. Seviye","Üst","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","TV+ Var","Yıllık","Yarış Takvimi",
    alias=["motogp"], varyant="jen,pd,izle,kan,tak,sir")
org("Moto2","Motor Sporları","Bireysel Sıralama Serisi","2. Seviye","Niş","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Yıllık","Yarış Takvimi",
    alias=["moto2"], varyant="jen,pd,tak")
org("Moto3","Motor Sporları","Bireysel Sıralama Serisi","Alt Seviye","Niş","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Yıllık","Yarış Takvimi",
    alias=["moto3"], varyant="jen,pd,tak")
org("WRC Ralli","Motor Sporları","Bireysel Sıralama Serisi","1. Seviye","Niş","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Yarış Takvimi",
    alias=["wrc","ralli"], varyant="jen,tak,izle")
org("Formula E","Motor Sporları","Bireysel Sıralama Serisi","1. Seviye","Niş","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Yarış Takvimi",
    alias=["formula e"], varyant="jen,tak")
org("Superbike","Motor Sporları","Bireysel Sıralama Serisi","1. Seviye","Niş","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Yıllık","Yarış Takvimi",
    alias=["superbike","wsbk"], varyant="jen,pd,tak")
org("NASCAR","Motor Sporları","Bireysel Sıralama Serisi","1. Seviye","Niş","Erkek","Bireysel","Bireysel Spor","ABD","Yabancı","Yok","TV+ Yok","Yıllık","Yarış Takvimi",
    alias=["nascar"], varyant="jen,tak")
org("Le Mans / WEC","Motor Sporları","Bireysel Sıralama Serisi","1. Seviye","Niş","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Tek Etkinlik",
    alias=["le mans","wec"], varyant="jen,izle")

# ============================================================ TENIS
for ad, al, per in [("Wimbledon",["wimbledon"],"Yıllık"),("Roland Garros",["roland garros","fransa açık"],"Yıllık"),
                    ("US Open",["us open tenis"],"Yıllık"),("Avustralya Açık",["avustralya açık"],"Yıllık")]:
    org(ad,"Tenis","Dünya Turnuvası","Kıta Üstü","Üst","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","TV+ Var",per,"Turnuva",
        alias=al, varyant="jen,fik,izle,kan,tak,bil")
org("ATP Tour","Tenis","Bireysel Sıralama Serisi","1. Seviye","Üst","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","TV+ Var","Yıllık","Yarış Takvimi",
    alias=["atp"], varyant="jen,sir,tak,izle")
org("WTA Tour","Tenis","Bireysel Sıralama Serisi","1. Seviye","Orta","Kadın","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","TV+ Var","Yıllık","Yarış Takvimi",
    alias=["wta"], varyant="jen,sir,tak,izle")
org("ATP Finals","Tenis","Dünya Turnuvası","Kıta Üstü","Orta","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Tek Etkinlik",
    alias=["atp finals"], varyant="jen,izle")
org("Davis Cup","Tenis","Dünya Turnuvası","Milli","Niş","Erkek","Milli Takım","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Yıllık","Turnuva",
    alias=["davis cup"], varyant="jen,izle")

# ============================================================ DIGER SPORLAR
org("Yaz Olimpiyatları","Diğer","Dünya Turnuvası","Milli","Global Elit","Karma","Milli Takım","Takım Sporu","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","4 Yılda Bir","Turnuva",
    alias=["olimpiyat","olimpiyat oyunları"], varyant="jen,pd,tak,izle")
org("Kış Olimpiyatları","Kış Sporları","Dünya Turnuvası","Milli","Üst","Karma","Milli Takım","Takım Sporu","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","4 Yılda Bir","Turnuva",
    alias=["kış olimpiyatları"], varyant="jen,tak,izle")
org("Paralimpik Oyunlar","Diğer","Dünya Turnuvası","Milli","Niş","Karma","Milli Takım","Takım Sporu","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","4 Yılda Bir","Turnuva",
    alias=["paralimpik"], varyant="jen,izle")
org("NFL","Amerikan Futbolu","Lig","1. Seviye","Üst","Erkek","Kulüp","Takım Sporu","ABD","Yabancı","Yok","TV+ Yok","Yıllık","Sürekli Lig",
    alias=["nfl","super bowl"], varyant="jen,pd,fik,izle,kan")
org("MLB","Beyzbol","Lig","1. Seviye","Niş","Erkek","Kulüp","Takım Sporu","ABD","Yabancı","Yok","TV+ Yok","Yıllık","Sürekli Lig",
    alias=["mlb"], varyant="jen,pd,izle")
org("NHL","Buz Hokeyi","Lig","1. Seviye","Niş","Erkek","Kulüp","Takım Sporu","ABD","Yabancı","Yok","TV+ Yok","Yıllık","Sürekli Lig",
    alias=["nhl","buz hokeyi"], varyant="jen,pd,izle")
org("Tour de France","Bisiklet","Bireysel Sıralama Serisi","1. Seviye","Orta","Erkek","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Yarış Takvimi",
    alias=["tour de france"], varyant="jen,pd,izle,tak")
org("Cumhurbaşkanlığı Bisiklet Turu","Bisiklet","Bireysel Sıralama Serisi","1. Seviye","Niş","Erkek","Bireysel","Bireysel Spor","Türkiye","Yerli","Türk Sporcu Var","Doğrulanacak","Yıllık","Yarış Takvimi",
    alias=["cumhurbaşkanlığı bisiklet turu"], varyant="jen,tak")
org("Dünya Atletizm Şampiyonası","Atletizm","Dünya Turnuvası","Milli","Orta","Karma","Milli Takım","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","2 Yılda Bir","Turnuva",
    alias=["atletizm","dünya atletizm şampiyonası"], varyant="jen,izle")
org("Yüzme","Su Sporları","Bireysel Sıralama Serisi","Milli","Niş","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Sürekli","Turnuva",
    alias=["yüzme"], varyant="jen")
org("Jimnastik","Diğer","Bireysel Sıralama Serisi","Milli","Niş","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Sürekli","Turnuva",
    alias=["jimnastik"], varyant="jen")
org("Hentbol","Hentbol","Lig","1. Seviye","Niş","Karma","Kulüp","Takım Sporu","Global","Uluslararası","Türk Takımı Var","Doğrulanacak","Yıllık","Sürekli Lig",
    alias=["hentbol"], varyant="jen,pd,fik")
org("Golf","Golf","Bireysel Sıralama Serisi","1. Seviye","Niş","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","TV+ Yok","Yıllık","Yarış Takvimi",
    alias=["golf"], varyant="jen,izle")
org("Snooker","Diğer","Bireysel Sıralama Serisi","1. Seviye","Niş","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Turnuva",
    alias=["snooker"], varyant="jen,izle")
org("Dart","Diğer","Bireysel Sıralama Serisi","1. Seviye","Niş","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Turnuva",
    alias=["dart","pdc dart"], varyant="jen,izle")
org("Satranç","Zihin Sporları","Bireysel Sıralama Serisi","1. Seviye","Orta","Karma","Bireysel","Bireysel Spor","Global","Uluslararası","Türk Sporcu Var","Doğrulanacak","Sürekli","Turnuva",
    alias=["satranç"], varyant="jen,sir,izle")
org("At Yarışı","At Yarışı","Bireysel Sıralama Serisi","1. Seviye","Orta","Karma","Bireysel","Bireysel Spor","Türkiye","Yerli","Yok","Doğrulanacak","Sürekli","Yarış Takvimi",
    alias=["at yarışı","tjk"], varyant="jen,tak,izle,sir")
org("İstanbul Maratonu","Atletizm","Tek Etkinlik","Milli","Niş","Karma","Bireysel","Bireysel Spor","Türkiye","Yerli","Türk Sporcu Var","Doğrulanacak","Yıllık","Tek Etkinlik",
    alias=["istanbul maratonu"], varyant="jen,tak")

# ============================================================ E-SPOR
org("LoL Worlds","E-Spor","Dünya Turnuvası","Kıta Üstü","Üst","Karma","Kulüp","Takım Sporu","Global","Uluslararası","Türk Takımı Var","Doğrulanacak","Yıllık","Turnuva",
    alias=["lol worlds","worlds 2026"], varyant="jen,fik,izle")
org("TCL","E-Spor","Lig","1. Seviye","Niş","Karma","Kulüp","Takım Sporu","Türkiye","Yerli","Türk Takımı Var","Doğrulanacak","Yıllık","Sürekli Lig",
    alias=["tcl","türkiye şampiyonluk ligi"], varyant="jen,pd,fik,izle")
org("Valorant Champions","E-Spor","Dünya Turnuvası","Kıta Üstü","Orta","Karma","Kulüp","Takım Sporu","Global","Uluslararası","Türk Takımı Var","Doğrulanacak","Yıllık","Turnuva",
    alias=["valorant champions","vct"], varyant="jen,izle")
org("CS2 Major","E-Spor","Dünya Turnuvası","Kıta Üstü","Orta","Karma","Kulüp","Takım Sporu","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Turnuva",
    alias=["cs2 major","counter strike major"], varyant="jen,izle")
org("Dota 2 The International","E-Spor","Dünya Turnuvası","Kıta Üstü","Niş","Karma","Kulüp","Takım Sporu","Global","Uluslararası","Yok","Doğrulanacak","Yıllık","Turnuva",
    alias=["the international dota"], varyant="jen,izle")
org("E-Spor Jenerik","E-Spor","Lig","1. Seviye","Orta","Karma","Kulüp","Takım Sporu","Global","Uluslararası","Türk Takımı Var","Doğrulanacak","Sürekli","Sürekli Lig",
    alias=["espor","e-spor"], varyant="jen,izle")

# ---------------------------------------------------------------- yazim
rows, seen = [], set()
for o in O:
    for al in o["alias"]:
        for code in o["varyant"].split(","):
            tmpl, sayfa_tipi, intent = V[code]
            kw = tmpl.format(al).strip().lower()
            if kw in seen:
                continue
            seen.add(kw)
            wc = len(kw.split())
            rows.append({
                "keyword": kw,
                "organizasyon": o["organizasyon"],
                "spor_dali": o["spor_dali"],
                "musabaka_tipi": o["musabaka_tipi"],
                "lig_seviyesi": o["lig_seviyesi"],
                "prestij_katmani": o["prestij_katmani"],
                "cinsiyet": o["cinsiyet"],
                "kulup_milli": o["kulup_milli"],
                "takim_bireysel": o["takim_bireysel"],
                "cografya": o["cografya"],
                "yerlilik": o["yerlilik"],
                "turk_baglantisi": o["turk_baglantisi"],
                "yayin_hakki": o["yayin_hakki"],
                "periyodiklik": o["periyodiklik"],
                "takvim_tipi": o["takvim_tipi"],
                "sayfa_tipi": sayfa_tipi,
                "intent_katmani": intent,
                "entity_tipi": "Lig/Organizasyon",
                "marka_tipi": "Jenerik",
                "dil": "İngilizce" if re.fullmatch(r"[a-z0-9 .\-]+", kw) else "Türkçe",
                "sorgu_uzunlugu": "Head" if wc <= 2 else ("Body" if wc <= 4 else "Long-tail"),
                "varyant_kodu": code,
            })

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)

print(f"Organizasyon: {len(O)}")
print(f"Keyword: {len(rows)}")
print(f"Faset kolonu: {len(rows[0])-1}")
print(f"Cikti: {os.path.relpath(OUT)}")

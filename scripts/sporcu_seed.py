#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Yeni sporcu ve milli takım oyuncusu keyword listesini hazırlar.

Kaynak dosyalar data/denetim altındaki araştırma çıktılarıdır. Portföyde
zaten bulunan adlar atlanır. Adı ortak kelimeyle çakışan sporcularda çıplak
biçim üretilmez; yalnızca niteleyicili varyantlar çekilir, böylece hacim
sporcuya ait olmayan aramalarla şişmez.

Çıktı: /tmp/sporcu_yeni.csv  (dfs_volume.py girdisi)
"""
import csv, json, os, re, subprocess, sys

DEN = "data/denetim"

# Araştırma organizasyon adı → portföydeki (organizasyon, spor dalı)
ORG = {
 "At Yarışı":("TJK · At Yarışı","At Yarışı"),
 "Motor Sporları":("Formula 1","Motor Sporları"),
 "Dövüş Sporları":("UFC","Dövüş Sporları"),
 "Zihin Sporları":("Satranç","Zihin Sporları"),
 "E-Spor":("E-Spor Ligleri","E-Spor"),
 "Voleybol Kulüp":("Diğer Ligler","Voleybol"),
 "Tenis":("ATP Tour","Tenis"),
 "Golf":("Golf Turnuvaları","Golf"),
 "Amerikan Futbolu":("NFL","Amerikan Futbolu"),
 "Kış Sporları":("Kış Olimpiyatları","Kış Sporları"),
 "Atletizm":("Dünya Atletizm Şampiyonası","Atletizm"),
 "Halter":("Dünya Halter Şampiyonası","Diğer"),
 "Okçuluk":("Dünya Okçuluk Şampiyonası","Diğer"),
 "Jimnastik":("Dünya Jimnastik Şampiyonası","Diğer"),
 "Yüzme":("Dünya Yüzme Şampiyonası","Su Sporları"),
 "Paralimpik":("Paralimpik Oyunlar","Diğer"),
 "Olimpiyatlar":("Yaz Olimpiyatları","Diğer"),
 "Hentbol":("Hentbol Ligleri","Hentbol"),
 "WWE":("WWE","Dövüş Sporları"),
 "Kickboks":("Kickboks","Dövüş Sporları"),
 "Buz Hokeyi":("Dünya Buz Hokeyi Şampiyonası","Buz Hokeyi"),
 "Bisiklet":("Cumhurbaşkanlığı Bisiklet Turu","Bisiklet"),
}
MILLI_SPOR = {
 "A Milli Futbol Takımı":"Futbol", "A Milli Kadın Futbol Takımı":"Futbol",
 "Basketbol A Milli Takımı":"Basketbol", "Kadın Basketbol Milli Takımı":"Basketbol",
 "Erkek Voleybol Milli Takımı":"Voleybol", "Kadın Voleybol Milli Takımı":"Voleybol",
}
# Çıplak ad + üç niteleyicili varyant. Belirsiz adlarda ilk satır atlanır.
VAR = [("{}","Oyuncu Jenerik","Bilgi"), ("{} kimdir","Oyuncu Bilgi","Bilgi"),
       ("{} hangi takımda","Oyuncu Bilgi","Bilgi"), ("{} istatistik","İstatistik","Bilgi")]

def oku(ad):
    y = os.path.join(DEN, ad)
    return json.load(open(y, encoding="utf-8")) if os.path.exists(y) else {}

def portfoy_adlari():
    out = subprocess.run(["node","-e",
        "global.window={};require('./data/dashboard.js');"
        "console.log(JSON.stringify(window.DATA.keywords.map(k=>k.kw)))"],
        capture_output=True, text=True, check=True)
    return set(json.loads(out.stdout))

def main():
    var_olan = portfoy_adlari()
    kayit, gorulen, atlanan = [], set(), 0

    def ekle(ad, org, spor, milli=None, belirsiz=False, kadin=False):
        nonlocal atlanan
        a = ad.strip().lower()
        if not a or a in gorulen: return
        gorulen.add(a)
        if a in var_olan: atlanan += 1; return
        for i,(kalip, st, it) in enumerate(VAR):
            if i == 0 and belirsiz: continue   # çıplak biçim ortak kelimeyle çakışıyor
            kayit.append({"keyword":kalip.format(a), "organizasyon":org, "spor_dali":spor,
                "musabaka_tipi":"Lig", "lig_seviyesi":"1. Seviye",
                "cinsiyet":"Kadın" if kadin else "Erkek", "kulup_milli":"Milli" if milli else "Kulüp",
                "takim_bireysel":"Bireysel Spor" if not milli else "Takım Sporu",
                "cografya":"Global", "yerlilik":"Uluslararası", "turk_baglantisi":"Yok",
                "yayin_hakki":"Doğrulanacak", "periyodiklik":"Yıllık", "takvim_tipi":"Sürekli Lig",
                "sayfa_tipi":st, "intent_katmani":it, "entity_tipi":"Oyuncu",
                "marka_tipi":"Jenerik", "dil":"Türkçe",
                "sorgu_uzunlugu":"Head" if len(kalip.format(a).split())<=2 else "Body",
                "varyant_kodu":st, "kulup":"", "oyuncu_ana_ad":a,
                "milli_kaynak":milli or ""})

    for dosya in ("brans_sporcular.json","brans_sporcular_tur2.json","brans_sporcular_tur3.json",
                  "brans_sporcular_tur4.json"):
        for grup, liste in oku(dosya).items():
            org, spor = ORG.get(grup, (grup, "Diğer"))
            for x in liste:
                ekle(x["ad"], org, spor, belirsiz=x.get("belirsiz", False))

    for takim, oyuncular in oku("milli_kadro.json").items():
        spor = MILLI_SPOR.get(takim, "Diğer")
        kadin = "Kadın" in takim
        for o in oyuncular:
            ekle(o, takim, spor, milli=takim, kadin=kadin)
    for takim, oyuncular in oku("milli_kadro_ek.json").items():
        spor = MILLI_SPOR.get(takim, "Diğer")
        for o in oyuncular:
            ekle(o, takim, spor, milli=takim, kadin="Kadın" in takim)

    # Kadro dışı kalma sorguları: oyuncu adının kendisi değil, yokluğu aranıyor.
    # Ebrar Karakurt ve Eda Erdem örneklerinde bu aile tekil addan ayrı hacim taşıyor.
    KD_VAR = ["{} neden yok", "{} sakat mı", "{} milli takımda mı"]
    for ad, takim in oku("kadro_disi.json").items():
        a = ad.strip().lower()
        for kalip in KD_VAR:
            kw = kalip.format(a)
            if kw in var_olan: continue
            kayit.append({"keyword":kw, "organizasyon":takim, "spor_dali":"Voleybol",
                "musabaka_tipi":"Milli", "lig_seviyesi":"Milli", "cinsiyet":"Kadın",
                "kulup_milli":"Milli", "takim_bireysel":"Takım Sporu",
                "cografya":"Türkiye", "yerlilik":"Yerli", "turk_baglantisi":"Türk Takımı Var",
                "yayin_hakki":"Doğrulanacak", "periyodiklik":"Yıllık", "takvim_tipi":"Sürekli Lig",
                "sayfa_tipi":"Oyuncu Bilgi", "intent_katmani":"Bilgi", "entity_tipi":"Oyuncu",
                "marka_tipi":"Jenerik", "dil":"Türkçe", "sorgu_uzunlugu":"Long-tail",
                "varyant_kodu":"Oyuncu Bilgi", "kulup":"", "oyuncu_ana_ad":a,
                "milli_kaynak":takim})

    if not kayit:
        print("Üretilecek kayıt yok."); return
    g = "/tmp/sporcu_yeni.csv.tmp"
    with open(g, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(kayit[0].keys())); w.writeheader(); w.writerows(kayit)
    os.replace(g, "/tmp/sporcu_yeni.csv")
    isim = len({k["oyuncu_ana_ad"] for k in kayit})
    print(f"Yeni isim   : {isim}")
    print(f"Portföyde var: {atlanan} (atlandı)")
    print(f"Keyword     : {len(kayit)}")
    print(f"İstek       : {(len(kayit)+699)//700}  ·  ~${((len(kayit)+699)//700)*0.09:.2f}")
    print("Çıktı       : /tmp/sporcu_yeni.csv")

if __name__ == "__main__":
    main()

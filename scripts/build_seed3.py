#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""3. tur: GSC'den kesfedilen 'nerede izlenir' ailesi, yayin/kanal hub sorgulari,
Turk takimlarinin Avrupa rakipleri ve saat/takvim varyantlari."""
import csv, re, itertools, os
F=["organizasyon","spor_dali","musabaka_tipi","lig_seviyesi","prestij_katmani","cinsiyet",
   "kulup_milli","takim_bireysel","cografya","yerlilik","turk_baglantisi","yayin_hakki",
   "periyodiklik","takvim_tipi","sayfa_tipi","intent_katmani","entity_tipi","marka_tipi",
   "dil","sorgu_uzunlugu","varyant_kodu","katman"]
rows,seen=[],set()
def B(org,spor,mus,sev,pres,cins,km,tb,cog,yer,turk,hak,per,tak):
    return dict(zip(F[:14],(org,spor,mus,sev,pres,cins,km,tb,cog,yer,turk,hak,per,tak)))
def add(kw,b,st_,it_,ent,vk,katman="Çekirdek"):
    kw=" ".join((kw or "").split()).strip().lower()
    if not kw or kw in seen or len(kw)>78 or len(kw.split())>10: return
    seen.add(kw); wc=len(kw.split())
    rows.append({**b,"keyword":kw,"sayfa_tipi":st_,"intent_katmani":it_,"entity_tipi":ent,
        "marka_tipi":"Jenerik","dil":"İngilizce" if re.fullmatch(r"[a-z0-9 .\-']+",kw) else "Türkçe",
        "sorgu_uzunlugu":"Head" if wc<=2 else ("Body" if wc<=4 else "Long-tail"),
        "varyant_kodu":vk,"katman":katman})

# ---------------------------------------------- A. YAYIN / KANAL HUB SORGULARI
HB=B("Yayın Rehberi","Çoklu/Jenerik","Jenerik","Yok","Global Elit","Karma","Jenerik","Jenerik",
     "Türkiye","Yerli","Yok","TV+ Var","Sürekli","Sürekli Lig")
for kw in ["hangi maç hangi kanalda","maç hangi kanalda","bugün hangi maçlar var",
           "bugün maç var mı","bugün kimin maçı var","günün maçları","bugünkü maçlar",
           "maç programı bugün","tv'de bugün","tvde bugün maçlar","spor yayın akışı",
           "bugün hangi maçlar var saat kaçta","hafta sonu maç programı","haftanın maçları",
           "bu akşam hangi maçlar var","bu akşam maç var mı","yarın hangi maçlar var",
           "canlı maç yayın akışı","spor programı bugün","maç takvimi bugün"]:
    st_="Kanal/Yayın" if "kanal" in kw else "Takvim/Saat"
    add(kw,HB,st_,"İzleme","Jenerik","yayin_hub")

# ---------------------------------------------- B. 'NEREDE IZLENIR' AILESI (GSC kesfi)
TR_BUYUK=["galatasaray","fenerbahçe","beşiktaş","trabzonspor","samsunspor","başakşehir"]
# Turk takimlarinin Avrupa rakipleri (uzun kuyruk taramasindan esigi gecenler)
AVRUPA_RAKIP=["górnik zabrze","sturm graz","midtjylland","benfica","ajax","celtic","olympiacos",
              "qarabağ","rangers","brann","paok","dinamo zagreb","viktoria plzeň","salzburg",
              "fcsb","kairat","inter turku","union saint-gilloise","lyon","freiburg"]
MB=B("Avrupa Kupası Eşleşmeleri","Futbol","Kıta Turnuvası","Kıta Üstü","Global Elit","Erkek",
     "Kulüp","Takım Sporu","Avrupa","Uluslararası","Türk Takımı Var","TV+ Var","Yıllık","Turnuva")
IZLE_VAR=[("{} {} nerede izlenir","Kanal/Yayın","İzleme","nerede_izlenir"),
          ("{} {} canlı izle","Canlı İzle","İzleme","h2h_izle"),
          ("{} {} hangi kanalda","Kanal/Yayın","İzleme","h2h_kanal"),
          ("{} {} saat kaçta","Takvim/Saat","Bilgi","h2h_saat"),
          ("{} {} maçı ne zaman","Takvim/Saat","Bilgi","h2h_nezaman")]
for tr in TR_BUYUK[:4]:
    for rak in AVRUPA_RAKIP:
        for tmpl,st_,it_,vk in IZLE_VAR:
            add(tmpl.format(tr,rak),MB,st_,it_,"Maç",vk)

# Turk takimlari kendi aralarinda + milli takim
SL=B("Süper Lig","Futbol","Lig","1. Seviye","Global Elit","Erkek","Kulüp","Takım Sporu",
     "Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Yıllık","Sürekli Lig")
for a,b in itertools.combinations(TR_BUYUK,2):
    for tmpl,st_,it_,vk in IZLE_VAR:
        add(tmpl.format(a,b),SL,st_,it_,"Maç",vk)

MT=B("A Milli Futbol Takımı","Futbol","Milli","Milli","Global Elit","Erkek","Milli Takım",
     "Takım Sporu","Türkiye","Yerli","Türk Takımı Var","TV+ Yok","Sürekli","Turnuva")
for rak in ["ispanya","portekiz","fransa","arjantin","almanya","ingiltere","italya","hollanda",
            "gürcistan","bulgaristan","macaristan","romanya"]:
    for tmpl,st_,it_,vk in IZLE_VAR:
        add(tmpl.format("türkiye",rak),MT,st_,it_,"Maç",vk)

# ---------------------------------------------- C. TAKIM BAZLI IZLEME VARYANTLARI
TAKIM_IZLE=[("{} maçı nerede izlenir","Kanal/Yayın","İzleme","tk_nerede"),
            ("{} maçı hangi kanalda","Kanal/Yayın","İzleme","tk_kanal"),
            ("{} maçı saat kaçta","Takvim/Saat","Bilgi","tk_saat"),
            ("{} maçı ne zaman","Takvim/Saat","Bilgi","tk_nezaman"),
            ("{} canlı izle","Canlı İzle","İzleme","tk_izle"),
            ("{} maçı canlı izle","Canlı İzle","İzleme","tk_macizle")]
for t in TR_BUYUK+["real madrid","barcelona","juventus","milan","inter","arsenal",
                   "manchester united","liverpool","fenerbahçe beko","anadolu efes",
                   "beşiktaş basketbol","vakıfbank","filenin sultanları"]:
    for tmpl,st_,it_,vk in TAKIM_IZLE:
        add(tmpl.format(t),SL,st_,it_,"Takım",vk)

# ---------------------------------------------- D. ORGANIZASYON IZLEME VARYANTLARI
ORG=[("UEFA Şampiyonlar Ligi","şampiyonlar ligi"),("UEFA Avrupa Ligi","avrupa ligi"),
     ("UEFA Konferans Ligi","konferans ligi"),("La Liga","la liga"),("Serie A","serie a"),
     ("EuroLeague","euroleague"),("NBA","nba"),("UFC","ufc"),("MotoGP","motogp"),
     ("FA Cup","fa cup"),("Kadın Voleybol Milli Takımı","filenin sultanları"),
     ("Erkek Voleybol Milli Takımı","filenin efeleri"),("Wimbledon","wimbledon")]
OB=B("Organizasyon İzleme","Çoklu/Jenerik","Jenerik","Kıta Üstü","Global Elit","Karma",
     "Kulüp","Takım Sporu","Global","Uluslararası","Yok","TV+ Var","Yıllık","Turnuva")
for org,al in ORG:
    b=dict(OB); b["organizasyon"]=org
    for tmpl,st_,it_,vk in [("{} nerede izlenir","Kanal/Yayın","İzleme","org_nerede"),
                            ("{} hangi kanalda izlenir","Kanal/Yayın","İzleme","org_kanal2"),
                            ("{} şifresiz izle","Canlı İzle","İzleme","org_sifresiz"),
                            ("{} maçları saat kaçta","Takvim/Saat","Bilgi","org_saat"),
                            ("{} bugün maç var mı","Takvim/Saat","Bilgi","org_bugun"),
                            ("{} yayın akışı","Kanal/Yayın","İzleme","org_akis")]:
        add(tmpl.format(al),b,st_,it_,"Lig/Organizasyon",vk)

os.makedirs("data/raw",exist_ok=True)
with open("data/raw/seed_tur3.csv","w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=["keyword"]+F); w.writeheader()
    for r in rows: w.writerow({k:r.get(k,"") for k in ["keyword"]+F})
from collections import Counter
print(f"Keyword: {len(rows)}")
for k,v in Counter(r["sayfa_tipi"] for r in rows).most_common(): print(f"  {k:<18}{v}")

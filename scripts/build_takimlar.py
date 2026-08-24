#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Takim evrenini kurar. Cekirdek ligler tam varyant, uzun kuyruk yalnizca jenerik."""
import json, subprocess, urllib.parse, re, csv, os
from collections import Counter

def wt(title, lang="en"):
    url=(f"https://{lang}.wikipedia.org/w/api.php?action=parse&page="
         f"{urllib.parse.quote(title)}&prop=wikitext&format=json&formatversion=2")
    r=subprocess.run(["curl","-sS","--max-time","60","-A","research-bot/1.0",url],
                     capture_output=True,text=True)
    try: return json.loads(r.stdout).get("parse",{}).get("wikitext","")
    except Exception: return ""

STOP = ["fa cup","round","football","list of","league","wikipedia","category","season",
        "uefa","qualifying","stadium","cup","championship","202","group","play-off",
        "association","country","city","town hall","county"]

def kulupler(title, lang="en", minrep=2):
    w = wt(title, lang)
    c = Counter(re.findall(r"\[\[([^\]\|#]+)(?:\|[^\]]*)?\]\]", w))
    out=[]
    for k,v in c.items():
        if v < minrep or re.match(r"^\d", k): continue
        kl=k.lower()
        if any(x in kl for x in STOP): continue
        out.append(k)
    return out

def temizle(ad):
    """Wikipedia baslik -> arama formu"""
    ad = re.sub(r"\s*\([^)]*\)", "", ad)                      # (futbol takımı)
    ad = re.sub(r"\s+(F\.?C\.?|A\.?F\.?C\.?|S\.?K\.?|FK|CF|SC|BC)$", "", ad, flags=re.I)
    return " ".join(ad.split()).strip()

# ------------------------------------------------------- CEKIRDEK (tam varyant)
CEKIRDEK = {
 "Süper Lig": ("Futbol","Türkiye","TV+ Yok","1. Seviye",
   ["galatasaray","fenerbahçe","beşiktaş","trabzonspor","başakşehir","samsunspor",
    "kocaelispor","göztepe","alanyaspor","konyaspor","antalyaspor","kasımpaşa",
    "çaykur rizespor","gaziantep fk","eyüpspor","fatih karagümrük","gençlerbirliği",
    "kayserispor","amed sportif","çorum fk","erzurumspor"]),
 "TFF 1. Lig": ("Futbol","Türkiye","TV+ Yok","2. Seviye",
   ["bandırmaspor","sakaryaspor","boluspor","manisa fk","keçiörengücü","adana demirspor",
    "ümraniyespor","vanspor","iğdır fk","pendikspor","esenler erokspor","serikspor",
    "hatayspor","sivasspor","istanbulspor","bodrum fk","şanlıurfaspor","adanaspor"]),
 "La Liga": ("Futbol","İspanya","TV+ Var","1. Seviye",
   ["real madrid","barcelona","atletico madrid","sevilla","real sociedad","villarreal",
    "athletic bilbao","valencia","real betis","girona","celta vigo","osasuna","getafe",
    "rayo vallecano","mallorca","alaves","espanyol","elche","levante","oviedo"]),
 "Serie A": ("Futbol","İtalya","TV+ Var","1. Seviye",
   ["juventus","inter","milan","napoli","roma","lazio","atalanta","fiorentina","bologna",
    "torino","udinese","genoa","cagliari","hellas verona","lecce","parma","como","sassuolo","pisa","cremonese"]),
 "Premier Lig": ("Futbol","İngiltere","TV+ Yok","1. Seviye",
   ["manchester united","manchester city","liverpool","arsenal","chelsea","tottenham",
    "newcastle","aston villa","everton","west ham","brighton","crystal palace","fulham",
    "brentford","nottingham forest","wolverhampton","bournemouth","leeds united","burnley","sunderland"]),
 "Bundesliga": ("Futbol","Almanya","TV+ Yok","1. Seviye",
   ["bayern münih","borussia dortmund","bayer leverkusen","rb leipzig","eintracht frankfurt",
    "vfb stuttgart","werder bremen","borussia mönchengladbach","hoffenheim","freiburg"]),
 "Ligue 1": ("Futbol","Fransa","TV+ Yok","1. Seviye",
   ["paris saint germain","marsilya","lyon","monaco","lille","nice","rennes","lens"]),
 "EuroLeague": ("Basketbol","Avrupa","TV+ Var","Kıta Üstü",
   ["fenerbahçe beko","anadolu efes","beşiktaş basketbol","real madrid basketbol",
    "barcelona basketbol","panathinaikos","olympiakos","maccabi tel aviv","zalgiris",
    "partizan","crvena zvezda","virtus bologna","olimpia milano","asvel","baskonia",
    "bayern münih basketbol","paris basketball","hapoel tel aviv","valencia basket","dubai basketball"]),
 "NBA": ("Basketbol","ABD","TV+ Var","1. Seviye",
   ["los angeles lakers","golden state warriors","boston celtics","chicago bulls","miami heat",
    "denver nuggets","oklahoma city thunder","new york knicks","dallas mavericks","phoenix suns",
    "milwaukee bucks","philadelphia 76ers","cleveland cavaliers","houston rockets","san antonio spurs",
    "brooklyn nets","toronto raptors","atlanta hawks","memphis grizzlies","minnesota timberwolves",
    "orlando magic","indiana pacers","sacramento kings","new orleans pelicans","detroit pistons",
    "portland trail blazers","utah jazz","charlotte hornets","washington wizards","los angeles clippers"]),
 "Sultanlar Ligi": ("Voleybol","Türkiye","Doğrulanacak","1. Seviye",
   ["vakıfbank","fenerbahçe opet","eczacıbaşı","galatasaray daikin","türk hava yolları voleybol",
    "beşiktaş voleybol","kuzeyboru","zeren spor","nilüfer belediyespor","aydın büyükşehir"]),
 "Efeler Ligi": ("Voleybol","Türkiye","Doğrulanacak","1. Seviye",
   ["ziraat bankkart","halkbank voleybol","fenerbahçe voleybol","galatasaray voleybol",
    "arkas spor","tokat belediye plevne","cizre belediyespor","istanbul büyükşehir belediyespor"]),
}

CEK_VARYANT = [
    ("{}",                 "Takım Jenerik",     "Bilgi"),
    ("{} maçları",         "Takım Maç Sorgusu", "Bilgi"),
    ("{} fikstür",         "Fikstür",           "Bilgi"),
    ("{} puan durumu",     "Puan Durumu",       "Bilgi"),
    ("{} kadrosu",         "Kadro",             "Bilgi"),
    ("{} canlı izle",      "Canlı İzle",        "İzleme"),
    ("{} transfer",        "Transfer",          "Bilgi"),
]

rows=[]
def add(kw, org, spor, cog, hak, sev, katman, sayfa_tipi, intent):
    kw=" ".join(kw.split()).strip().lower()
    if not kw or len(kw)>78: return
    wc=len(kw.split())
    rows.append({"keyword":kw,"organizasyon":org,"spor_dali":spor,
        "musabaka_tipi":"Lig","lig_seviyesi":sev,"prestij_katmani":katman,
        "cinsiyet":"Kadın" if org=="Sultanlar Ligi" else "Erkek","kulup_milli":"Kulüp",
        "takim_bireysel":"Takım Sporu","cografya":cog,
        "yerlilik":"Yerli" if cog=="Türkiye" else "Yabancı",
        "turk_baglantisi":"Türk Takımı Var" if cog=="Türkiye" else "Yok",
        "yayin_hakki":hak,"periyodiklik":"Yıllık","takvim_tipi":"Sürekli Lig",
        "sayfa_tipi":sayfa_tipi,"intent_katmani":intent,"entity_tipi":"Takım",
        "marka_tipi":"Jenerik",
        "dil":"İngilizce" if re.fullmatch(r"[a-z0-9 .\-']+",kw) else "Türkçe",
        "sorgu_uzunlugu":"Head" if wc<=2 else ("Body" if wc<=4 else "Long-tail"),
        "varyant_kodu":sayfa_tipi,"katman":katman})

for lig,(spor,cog,hak,sev,takimlar) in CEKIRDEK.items():
    for t in takimlar:
        for tmpl,st_,it_ in CEK_VARYANT:
            add(tmpl.format(t), lig, spor, cog, hak, sev, "Çekirdek", st_, it_)

# ------------------------------------------------------- UZUN KUYRUK (yalniz jenerik)
KUYRUK = [
    ("FA Cup Alt Ligler","2026–27 FA Cup qualifying rounds","en","İngiltere","TV+ Var","Alt Seviye"),
    ("Konferans Ligi Elemeleri","2026–27 UEFA Conference League qualifying","en","Avrupa","TV+ Var","Kıta Üstü"),
    ("Şampiyonlar Ligi Elemeleri","2026–27 UEFA Champions League qualifying","en","Avrupa","TV+ Var","Kıta Üstü"),
    ("Avrupa Ligi Elemeleri","2026–27 UEFA Europa League qualifying","en","Avrupa","TV+ Var","Kıta Üstü"),
]
kuyruk_sayim={}
for org, sayfa, lang, cog, hak, sev in KUYRUK:
    ks = kulupler(sayfa, lang)
    adlar = sorted({temizle(k) for k in ks})
    adlar = [a for a in adlar if 2 < len(a) < 40]
    kuyruk_sayim[org]=len(adlar)
    for a in adlar:
        add(a, org, "Futbol", cog, hak, sev, "Uzun Kuyruk", "Takım Jenerik", "Bilgi")

os.makedirs("data/raw",exist_ok=True)
cols=list(rows[0].keys())
with open("data/raw/seed_takimlar.csv","w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader(); w.writerows(rows)

cek=sum(1 for r in rows if r["katman"]=="Çekirdek")
kuy=sum(1 for r in rows if r["katman"]=="Uzun Kuyruk")
print(f"Cekirdek takim: {sum(len(v[4]) for v in CEKIRDEK.values())} takim -> {cek} keyword")
print(f"Uzun kuyruk: {kuy} kulup (yalniz jenerik sorgu)")
for k,v in kuyruk_sayim.items(): print(f"   {k:<32}{v}")
print(f"TOPLAM: {len(rows)} keyword -> data/raw/seed_takimlar.csv")

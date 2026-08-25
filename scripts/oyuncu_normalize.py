#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Oyuncu keyword'lerini normalize eder, tekilleştirir ve teknik kadroyu ayıklar.

Üç işlem:
1. Aksanlı yazımlar aksansıza indirgenir ("mbappé" -> "mbappe"). Google Ads
   ikisine de aynı hacmi döndürdüğü için çift kayıt oluşuyordu.
2. Aynı normalize adı taşıyan satırlar tekilleştirilir; en yüksek hacimli kayıt tutulur.
3. Kulüplerin teknik kadro ve yönetim bölümlerindeki isimler oyuncu listesinden
   çıkarılır (teknik direktör, menajer, antrenör). Kadro bölümüyle karışan
   isimler bu yolla ayıklanır.
"""
import csv, json, re, subprocess, unicodedata, urllib.parse, os, sys
from concurrent.futures import ThreadPoolExecutor

DOSYA = "data/raw/hacim_oyuncular.csv"
CACHE = "data/raw/_wiki_cache"
os.makedirs(CACHE, exist_ok=True)

def aksansiz(s):
    """Latin aksanlarını düşürür, Türkçe karakterleri korur."""
    tr = set("ıİşŞğĞüÜöÖçÇ")
    out = []
    for ch in s:
        if ch in tr: out.append(ch); continue
        d = unicodedata.normalize("NFD", ch)
        b = "".join(c for c in d if unicodedata.category(c) != "Mn")
        out.append(b or ch)
    return "".join(out)

# ——— Teknik kadro / yönetim isimlerini Wikipedia'dan topla
def api(params, lang="tr"):
    key = os.path.join(CACHE, re.sub(r"[^a-z0-9]+","_",(lang+json.dumps(params,sort_keys=True)).lower())[:150]+".json")
    if os.path.exists(key):
        try: return json.load(open(key, encoding="utf-8"))
        except Exception: pass
    q = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k,v in params.items())
    url = f"https://{lang}.wikipedia.org/w/api.php?{q}&format=json&formatversion=2"
    r = subprocess.run(["curl","-sS","--max-time","40","-A","TVplus-research/1.0", url],
                       capture_output=True, text=True)
    try:
        d = json.loads(r.stdout); json.dump(d, open(key,"w",encoding="utf-8")); return d
    except Exception: return {}

TEKNIK_BOLUM = ("yönetim ve teknik kadro","teknik kadro","teknik ekip","yönetim",
                "teknik heyet","coaching staff","management","technical staff")
def teknik_isimler(kulup):
    d = api({"action":"query","list":"search","srsearch":f"{kulup} futbol takımı","srlimit":2})
    isim = set()
    for h in (d.get("query",{}).get("search") or [])[:2]:
        t = h["title"]
        ds = api({"action":"parse","page":t,"prop":"sections","redirects":1})
        for sec in ds.get("parse",{}).get("sections",[]):
            if sec["line"].strip().lower() in TEKNIK_BOLUM:
                dt = api({"action":"parse","page":t,"prop":"text","section":sec["index"],"redirects":1})
                html = dt.get("parse",{}).get("text","")
                for l in re.findall(r'<a[^>]+href="/wiki/([^"#:]+)"', html):
                    ad = urllib.parse.unquote(l).replace("_"," ")
                    ad = re.sub(r"\s*\([^)]*\)","",ad).strip().lower()
                    if 1 < len(ad.split()) < 5: isim.add(ad)
    return isim

with open(DOSYA, encoding="utf-8-sig") as f:
    rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)

kulupler = sorted({(r.get("kulup") or "").strip() for r in rows if r.get("kulup")})
print(f"{len(kulupler)} kulüp için teknik kadro taranıyor...", file=sys.stderr)
teknik = set()
with ThreadPoolExecutor(max_workers=4) as ex:
    for s in ex.map(lambda k: teknik_isimler(k), kulupler):
        teknik |= s
teknik = {aksansiz(t) for t in teknik}
print(f"Teknik kadro / yönetim ismi: {len(teknik)}")

# ——— Normalizasyon + tekilleştirme + ayıklama
def sv(r): return int(r.get("search_volume") or 0) if r.get("veri_var")=="evet" else 0

tut, elenen = {}, {"işaretli":0, "teknik":0, "mükerrer":0}
digerler = []
for r in rows:
    if r.get("sayfa_tipi") not in ("Oyuncu Jenerik","Oyuncu Bilgi","İstatistik"):
        digerler.append(r); continue
    # 1) denetimde işaretlenenler tamamen çıkarılır
    vd = r.get("varyant_denetim","")
    if vd and vd != "Geçerli":
        elenen["işaretli"] += 1; continue
    # 2) aksansıza indir
    yeni_kw = aksansiz(r["keyword"]).strip().lower()
    ana = aksansiz((r.get("oyuncu_ana_ad") or "").strip().lower())
    # 3) teknik kadro isimleri çıkarılır
    if ana and ana in teknik:
        elenen["teknik"] += 1; continue
    r["keyword"] = yeni_kw
    if ana: r["oyuncu_ana_ad"] = ana
    # 4) tekilleştir: aynı keyword'ün en yüksek hacimlisi tutulur
    onceki = tut.get(yeni_kw)
    if onceki is None or sv(r) > sv(onceki):
        if onceki is not None: elenen["mükerrer"] += 1
        tut[yeni_kw] = r
    else:
        elenen["mükerrer"] += 1

sonuc = digerler + list(tut.values())
with open(DOSYA, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(sonuc)

print(f"Elenen: işaretli {elenen['işaretli']}, teknik kadro {elenen['teknik']}, "
      f"mükerrer {elenen['mükerrer']}")
print(f"Satır: {len(rows)} -> {len(sonuc)}")

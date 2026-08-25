#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kulüp bilgi kutusundaki teknik direktör ve yönetici isimlerini oyuncu
listesinden ayıklar. Kadro çıkarımı sırasında teknik ekip isimleri de
listeye karışabiliyor (örn. Konyaspor kadrosunda Sergen Yalçın)."""
import csv, json, re, subprocess, unicodedata, urllib.parse, os, sys
from concurrent.futures import ThreadPoolExecutor

DOSYA = "data/raw/hacim_oyuncular.csv"
CACHE = "data/raw/_wiki_cache"
os.makedirs(CACHE, exist_ok=True)

def aksansiz(s):
    tr = set("ıİşŞğĞüÜöÖçÇ"); out=[]
    for ch in s:
        if ch in tr: out.append(ch); continue
        d = unicodedata.normalize("NFD", ch)
        out.append("".join(c for c in d if unicodedata.category(c)!="Mn") or ch)
    return "".join(out)

def api(params, lang="tr"):
    key = os.path.join(CACHE, re.sub(r"[^a-z0-9]+","_",(lang+json.dumps(params,sort_keys=True)).lower())[:150]+".json")
    if os.path.exists(key):
        try: return json.load(open(key,encoding="utf-8"))
        except Exception: pass
    q = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k,v in params.items())
    url = f"https://{lang}.wikipedia.org/w/api.php?{q}&format=json&formatversion=2"
    r = subprocess.run(["curl","-sS","--max-time","40","-A","TVplus-research/1.0",url],
                       capture_output=True, text=True)
    try:
        d = json.loads(r.stdout); json.dump(d, open(key,"w",encoding="utf-8")); return d
    except Exception: return {}

# Bilgi kutusu alanları: değer içindeki [[wikilink]] gerçek kişi adıdır
ALANLAR = ["teknikdirektör","teknik direktör","menajer","antrenör","yardımcıantrenör",
           "başkan","manager","headcoach","coach","chairman","president"]
def teknik(kulup):
    d = api({"action":"query","list":"search","srsearch":kulup,"srlimit":3})
    isim = set()
    for hit in (d.get("query",{}).get("search") or [])[:2]:
        w = api({"action":"parse","page":hit["title"],"prop":"wikitext","redirects":1}) \
            .get("parse",{}).get("wikitext","")
        if not w: continue
        bas = w
        # Teknik/yönetim bölümlerindeki tablo isimleri
        for bm in re.finditer(r"==+\s*([^=\n]*(?:[Tt]eknik|[Yy]önetim|[Kk]adrosu Dışı)[^=\n]*)==+", w):
            blok = w[bm.end(): bm.end()+4000]
            for l in re.findall(r"\[\[([^\]\|#]+)", blok):
                ad = re.sub(r"\s*\([^)]*\)","",l).strip().lower()
                if 1 < len(ad.split()) < 5 and not re.search(
                   r"(kulüb|takım|lig|stad|futbol|spor|kupa|şampiyon)", ad):
                    isim.add(aksansiz(ad))
        for alan in ALANLAR:
            for m in re.finditer(r"\|\s*"+re.escape(alan)+r"\s*=\s*([^\n]*)", bas, re.I):
                for l in re.findall(r"\[\[([^\]\|#]+)", m.group(1)):
                    ad = re.sub(r"\s*\([^)]*\)","",l).strip().lower()
                    if 1 < len(ad.split()) < 5: isim.add(aksansiz(ad))
    return isim

with open(DOSYA, encoding="utf-8-sig") as f:
    rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
kulupler = sorted({(r.get("kulup") or "").strip() for r in rows if r.get("kulup")})
print(f"{len(kulupler)} kulüp taranıyor…", file=sys.stderr)

teknikSet = set()
with ThreadPoolExecutor(max_workers=5) as ex:
    for s in ex.map(teknik, kulupler): teknikSet |= s
print(f"Bilgi kutusundan gelen teknik/yönetim ismi: {len(teknikSet)}")

if "teknik_kadro" not in cols: cols.append("teknik_kadro")
elenen, kalan = [], []
for r in rows:
    ana = aksansiz((r.get("oyuncu_ana_ad") or r.get("keyword") or "").strip().lower())
    if r.get("ent") != "Oyuncu" and r.get("entity_tipi") != "Oyuncu":
        kalan.append(r); continue
    if ana in teknikSet:
        r["teknik_kadro"] = "evet"
        elenen.append((r["keyword"], int(r.get("search_volume") or 0), r.get("kulup","")))
        continue
    kalan.append(r)

with open(DOSYA, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(kalan)
print(f"Ayıklanan teknik kadro satırı: {len(elenen)}")
for kw, v, kul in sorted(elenen, key=lambda x:-x[1])[:12]:
    print(f"   - {kw:<24} {v:>12,}".replace(",", ".") + f"   ({kul})")
print(f"Satır: {len(rows)} -> {len(kalan)}")

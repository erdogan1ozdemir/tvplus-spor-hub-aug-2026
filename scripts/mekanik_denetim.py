#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ajan gerektirmeyen kural bazlı bütünlük denetimi.

Web doğrulaması isteyen yargı kararları ajanlara bırakılır; burada yalnızca
veri setinin kendi içinden kanıtlanabilen çelişkiler aranır.
"""
import csv, glob, json, re, unicodedata
from collections import defaultdict, Counter

HACIM = [d for d in sorted(glob.glob("data/raw/hacim_*.csv")) if not d.endswith("_elenen.csv")]
rows = []
for d in HACIM:
    for r in csv.DictReader(open(d, encoding="utf-8-sig")):
        r["_dosya"] = d.split("hacim_")[1][:-4]; rows.append(r)
def sv(r): return int(r.get("search_volume") or 0) if r.get("veri_var") == "evet" else 0
def gecerli(r): return (r.get("mantik_denetim") or "Geçerli") == "Geçerli"

def norm(s):
    s = (s or "").strip().lower()
    s = re.sub(r"\b(fc|cf|sc|sk|afc|f\.c\.|s\.k\.|b\.c\.|bc|jk|a\.ş\.)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()

bulgu = defaultdict(list)

# ——— 1) Aynı keyword iki farklı varlık tipinde
tip = defaultdict(set)
for r in rows:
    if gecerli(r): tip[(r.get("keyword") or "").strip().lower()].add(r.get("entity_tipi",""))
for kw, t in tip.items():
    if len(t) > 1: bulgu["Aynı keyword birden çok varlık tipinde"].append((kw, sorted(t)))

# ——— 2) Kulüp adı oyuncu listesinde (ham veri, dedup öncesi)
takim = {norm(r["keyword"]): r for r in rows
         if r.get("entity_tipi")=="Takım" and r.get("sayfa_tipi")=="Takım Jenerik"}
for r in rows:
    if r.get("entity_tipi")=="Oyuncu" and gecerli(r):
        n = norm(r["keyword"])
        if n in takim:
            bulgu["Kulüp adı hâlâ oyuncu etiketli"].append(
                (r["keyword"], sv(r), takim[n].get("organizasyon","")))

# ——— 3) Sayfa tipi ile keyword metni çelişkisi
KURAL = [
 (r"canlı izle|şifresiz|nerede izlen", "Canlı İzle|Kanal/Yayın"),
 (r"hangi kanalda", "Kanal/Yayın"),
 (r"puan durumu", "Puan Durumu"),
 (r"fikstür", "Fikstür"),
 (r"kadro(su)?$", "Kadro"),
 (r"transfer", "Transfer"),
 (r"ne zaman|saat kaçta", "Takvim/Saat"),
 (r"kimdir|hangi takımda", "Oyuncu Bilgi|Takım Bilgi"),
 (r"istatistik", "İstatistik"),
 (r"bilet", "Bilet"),
]
for r in rows:
    if not gecerli(r): continue
    kw, st = (r.get("keyword") or "").lower(), r.get("sayfa_tipi","")
    for desen, bekle in KURAL:
        if re.search(desen, kw) and st not in bekle.split("|"):
            bulgu["Sayfa tipi keyword metniyle çelişiyor"].append((r["keyword"], sv(r), st, bekle))
            break

# ——— 4) İzleme intent'i kaçağı
IZLE = re.compile(r"canlı izle|şifresiz|nerede izlen|hangi kanalda|canlı yayın|yayın akışı")
for r in rows:
    if gecerli(r) and IZLE.search((r.get("keyword") or "").lower()) \
       and r.get("intent_katmani") != "İzleme":
        bulgu["İzleme sorgusu Bilgi intent'inde"].append((r["keyword"], sv(r), r.get("intent_katmani","")))

# ——— 5) Aksan ve noktalama mükerreri
def sade(s):
    s = (s or "").strip().lower()
    tr = set("ıİşŞğĞüÜöÖçÇ"); out=[]
    for ch in s:
        if ch in tr: out.append(ch); continue
        d = unicodedata.normalize("NFD", ch)
        out.append("".join(c for c in d if unicodedata.category(c)!="Mn") or ch)
    return re.sub(r"[.'’\-]", "", "".join(out)).strip()
sadeMap = defaultdict(set)
for r in rows:
    if gecerli(r): sadeMap[sade(r["keyword"])].add((r["keyword"] or "").strip().lower())
for s, v in sadeMap.items():
    if len(v) > 1: bulgu["Yazım varyantı mükerreri"].append(sorted(v))

# ——— 6) Aynı organizasyon birden çok spor dalında
orgSpor = defaultdict(set)
for r in rows:
    if gecerli(r) and r.get("organizasyon"): orgSpor[r["organizasyon"]].add(r.get("spor_dali",""))
for o, s in orgSpor.items():
    if len(s) > 1: bulgu["Organizasyon birden çok spor dalında"].append((o, sorted(s)))

# ——— 7) Kulüp alanı kendi keywordünü gösteriyor
for r in rows:
    if gecerli(r) and r.get("kulup") and norm(r["kulup"]) == norm(r.get("keyword","")):
        bulgu["Kulüp alanı keywordün kendisi"].append((r["keyword"], sv(r)))

print("MEKANİK BÜTÜNLÜK DENETİMİ")
print("=" * 68)
for k, v in sorted(bulgu.items(), key=lambda x: -len(x[1])):
    print(f"\n{k}  ·  {len(v)} bulgu")
    for x in v[:6]: print("   ", x)
json.dump({k: v[:400] for k, v in bulgu.items()},
          open("/tmp/mekanik_bulgu.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

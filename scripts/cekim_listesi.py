#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Onaylı çekim için tek bir seed dosyası kurar.

Üç kalem birleştirilir ve tekilleştirilir:
  1. Türkçe "İ" bozulmasının onarımı  (mevcut satırlardan doğru form türetilir)
  2. Bekleyen oyuncu seed'i            (seed_yeni_oyuncular.csv)
  3. Güncel kadro seed boşluğu         (seed_oyuncular.csv içinde çekilmemişler)
"""
import csv, glob, re, os
from collections import OrderedDict

# "İ" küçültülürken i + U+0307 üretiliyor, sanitizer noktayı boşluğa çeviriyordu.
# "ada i bik" -> "ada ibik", "i lkay gündoğan" -> "ilkay gündoğan"
BOZUK = re.compile(r"(?:^|(?<= ))i (?=[a-zçğıöşü])")
def onar(kw): return BOZUK.sub("i", kw)

mevcut, satirlar = set(), OrderedDict()
HACIM = [d for d in sorted(glob.glob("data/raw/hacim_*.csv")) if not d.endswith("_elenen.csv")]
for d in HACIM:
    for r in csv.DictReader(open(d, encoding="utf-8-sig")):
        mevcut.add((r.get("keyword") or "").strip().lower())

# ——— 1) Onarım listesi: bozuk satırın fasetleri korunur, keyword düzeltilir
onarim = 0
for d in HACIM:
    for r in csv.DictReader(open(d, encoding="utf-8-sig")):
        kw = (r.get("keyword") or "").strip()
        yeni = onar(kw)
        if yeni == kw or yeni.lower() in mevcut: continue
        r = dict(r); r["keyword"] = yeni
        satirlar.setdefault(yeni.lower(), r); onarim += 1

# ——— 2) ve 3) Seed dosyalarındaki çekilmemiş satırlar
seedler = {"yeni_oyuncular": "data/raw/seed_yeni_oyuncular.csv",
           "oyuncular":      "data/raw/seed_oyuncular.csv"}
sayac = {}
for ad, yol in seedler.items():
    if not os.path.exists(yol): continue
    n = 0
    for r in csv.DictReader(open(yol, encoding="utf-8-sig")):
        kw = (r.get("keyword") or "").strip()
        # Seed de bozuk üretilmiş olabilir; aynı onarım uygulanır
        kw = onar(kw)
        if not kw or kw.lower() in mevcut or kw.lower() in satirlar: continue
        r = dict(r); r["keyword"] = kw
        satirlar[kw.lower()] = r; n += 1
    sayac[ad] = n

# ——— Kirlilik ayıklama: federasyon, üniversite, çöp kayıtlar çekilmez
ELE = re.compile(r"(football association|university|universit[ae]|college|"
                 r"men's basketball|women's basketball|^utc[+\-]|wikipedia)", re.I)
elenen = [k for k in satirlar if ELE.search(k)]
for k in elenen: del satirlar[k]

# ——— Ortak kolon seti
kolonlar = []
for r in satirlar.values():
    for c in r:
        if c not in kolonlar and not re.match(r"^\d{4}-\d{2}$", c): kolonlar.append(c)
ATLA = {"search_volume","competition","competition_index","cpc","low_bid","high_bid",
        "veri_var","faset_notu","mantik_denetim"}
kolonlar = ["keyword"] + [c for c in kolonlar if c != "keyword" and c not in ATLA]

cikti = "data/raw/seed_cekim.csv"
with open(cikti, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=kolonlar, extrasaction="ignore")
    w.writeheader()
    for r in satirlar.values(): w.writerow(r)

print("ÇEKİM LİSTESİ")
print("=" * 46)
print(f"  1. Türkçe İ onarımı        {onarim:>6}")
for ad, n in sayac.items(): print(f"  2/3. {ad:<22}{n:>6}")
print(f"  kirlilik ayıklandı         {len(elenen):>6}")
print(f"  {'-'*44}")
print(f"  toplam tekil               {len(satirlar):>6}")
print(f"  DataForSEO isteği (700/lık){-(-len(satirlar)//700):>6}")
print(f"\nÇıktı: {cikti}")

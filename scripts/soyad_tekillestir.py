#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Belirsiz soyadı varyantlarını eler.

Kural: bir soyadı hem tek başına hem de tam ad içinde kayıtlıysa ve soyadı
gündelik bir sözcük, yer adı veya markayla çakışıyorsa, tek başına biçim
gerçek talebi temsil etmiyor demektir. Tam ad korunur, soyadı işaretlenir.
Tam adı listede olmayanlar yalnızca işaretlenir; doğru tam ad notta durur.
"""
import csv, glob, json, os
from collections import Counter

KARAR = json.load(open("/tmp/supheli_karar.json", encoding="utf-8"))
SUP   = json.load(open("data/denetim/oyuncu_duzeltme.json", encoding="utf-8"))["SUPHELI"]
CIKAR = set(KARAR["cikar"])          # tam adı listede → soyadı elenir
EKLE  = set(KARAR["ekle"])           # tam adı listede yok → jenerik işaretlenir

# Tam adı listede olmayanlar için doğru ad notu
DOGRU_AD = {
 "santander":"Federico Santander", "davinchi":"Davinchi (Getafe)",
 "ahmet özer":"Ahmet Özer (Diyarbekirspor)", "sinan özen":"Sinan Özen (Hatayspor)",
 "oğuz yılmaz":"Oğuz Yılmaz (Fethiyespor)", "sinan kaya":"Muhammed Sinan Kaya (Sivasspor)",
}

sayac = Counter()
for d in [x for x in sorted(glob.glob("data/raw/hacim_*.csv")) if not x.endswith("_elenen.csv")]:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    for c in ("mantik_denetim", "faset_notu"):
        if c not in cols: cols.append(c)

    for r in rows:
        if r.get("entity_tipi") != "Oyuncu": continue
        kw  = (r.get("keyword") or "").strip().lower()
        ana = (r.get("oyuncu_ana_ad") or "").strip().lower()
        hedef = kw if kw in CIKAR or kw in EKLE else (ana if ana in CIKAR or ana in EKLE else None)
        if not hedef: continue

        if hedef in CIKAR:
            r["mantik_denetim"] = "Belirsiz soyadı varyantı, tam ad listede mevcut"
            r["faset_notu"] = SUP.get(hedef, "")
            sayac["soyadı varyantı elendi"] += 1
        else:
            r["mantik_denetim"] = "Hacim oyuncuya ait değil (" + SUP.get(hedef, "") + ")"
            r["faset_notu"] = "Doğru tam ad: " + DOGRU_AD.get(hedef, "—")
            sayac["jenerik işaretlendi, tam ad notta"] += 1

    g = d + ".tmp"
    with open(g, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(g, d)

print("BELİRSİZ SOYADI TEKİLLEŞTİRME")
print("=" * 52)
for k, n in sayac.most_common(): print(f"  {k:<42}{n:>6}")
print(f"\n  Tam adı eklenmesi gereken {len(EKLE)} oyuncu:")
for k in sorted(EKLE): print(f"    {k:<16}→ {DOGRU_AD.get(k,'—')}")

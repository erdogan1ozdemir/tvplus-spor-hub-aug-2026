#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Yazım varyantı mükerrerlerini tekilleştirir.

Aksan, kesme işareti, tire ve nokta farkı dışında aynı olan keywordler aynı
sorguyu temsil eder. Yüksek hacimli biçim korunur, diğeri işaretlenir.
"""
import csv, glob, os, re, unicodedata
from collections import defaultdict, Counter

def sade(s):
    s = (s or "").strip().lower()
    tr = set("ıİşŞğĞüÜöÖçÇ"); out = []
    for ch in s:
        if ch in tr: out.append(ch); continue
        d = unicodedata.normalize("NFD", ch)
        out.append("".join(c for c in d if unicodedata.category(c) != "Mn") or ch)
    return re.sub(r"[.'’\-]", "", "".join(out)).strip()

HACIM = [d for d in sorted(glob.glob("data/raw/hacim_*.csv")) if not d.endswith("_elenen.csv")]
grup = defaultdict(dict)
for d in HACIM:
    for r in csv.DictReader(open(d, encoding="utf-8-sig")):
        if (r.get("mantik_denetim") or "Geçerli") != "Geçerli": continue
        kw = (r.get("keyword") or "").strip().lower()
        s = int(r.get("search_volume") or 0) if r.get("veri_var") == "evet" else 0
        grup[sade(kw)][kw] = max(grup[sade(kw)].get(kw, 0), s)

# Her grupta kazanan: en yüksek hacim, eşitlikte aksanlı/tam biçim
KAZANAN = {}
for s, v in grup.items():
    if len(v) < 2: continue
    kazanan = sorted(v.items(), key=lambda x: (-x[1], -len(x[0])))[0][0]
    for kw in v:
        if kw != kazanan: KAZANAN[kw] = kazanan

sayac = Counter()
for d in HACIM:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    for r in rows:
        kw = (r.get("keyword") or "").strip().lower()
        if kw in KAZANAN and (r.get("mantik_denetim") or "Geçerli") == "Geçerli":
            r["mantik_denetim"] = "Yazım varyantı (" + KAZANAN[kw] + " korunuyor)"
            sayac["yazım varyantı işaretlendi"] += 1
    g = d + ".tmp"
    with open(g, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(g, d)

print("YAZIM VARYANTI TEKİLLEŞTİRME")
print("=" * 52)
for k, n in sayac.most_common(): print(f"  {k:<40}{n:>6}")
print(f"  varyant grubu: {len({v for v in KAZANAN.values()})}")
ornek = sorted(KAZANAN.items())[:6]
for a, b in ornek: print(f"    {a!r:<30} → {b!r}")

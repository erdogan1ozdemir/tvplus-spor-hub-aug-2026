#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Milli takım taksonomisini ve Erzurumspor lig etiketini düzeltir.

Üç kural uygulanır:
  ORG_TASI        organizasyonu bütünüyle başka bir organizasyona taşır
  ORG_BOL         bir organizasyonu keyword desenine göre ikiye ayırır
  ORG_TAKIM_TASI  bir takımın satırlarını eski ligden yeni lige çeker

Yıkıcı değildir: her değişiklik faset_notu kolonuna gerekçesiyle yazılır.
Yazma atomiktir.
"""
import csv, glob, json, os, re
from collections import Counter

D = json.load(open("data/denetim/org_duzelt_2.json", encoding="utf-8"))
TASI, BOL, TAKIM = D["ORG_TASI"], D["ORG_BOL"], D["ORG_TAKIM_TASI"]
BOL_RE = {k: re.compile(v["desen"], re.I) for k, v in BOL.items()}
sayac = Counter()

dosyalar = [x for x in sorted(glob.glob("data/raw/hacim_*.csv"))
            if not x.endswith("_elenen.csv")]

for d in dosyalar:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    if "faset_notu" not in cols:
        cols.append("faset_notu")
    degisti = False

    for r in rows:
        kw = (r.get("keyword") or "").strip().lower()
        org = (r.get("organizasyon") or "").strip()

        if org in TASI:
            yeni = TASI[org]
            r["faset_notu"] = f"Milli taksonomi: {org} yerine {yeni}"
            r["organizasyon"] = yeni
            sayac[f"{org} -> {yeni}"] += 1; degisti = True

        elif org in BOL:
            k = BOL[org]
            yeni = k["eslesen"] if BOL_RE[org].search(kw) else k["eslesmeyen"]
            if yeni != org:
                r["faset_notu"] = f"Milli taksonomi: {org} yerine {yeni}"
                r["organizasyon"] = yeni
                sayac[f"{org} -> {yeni}"] += 1; degisti = True

        # Eşleşme hem keyword metnine hem kulüp kolonuna bakar: oyuncu
        # satırlarında takım adı keyword'de geçmez, yalnızca kulup alanında
        # durur. Sadece keyword'e bakmak bu satırları geride bırakıyordu.
        kulup = (r.get("kulup") or "").strip().lower()
        for ad, k in TAKIM.items():
            if (ad in kw or ad == kulup) and org == k["eski"]:
                r["faset_notu"] = f"Lig düzeltmesi: {k['eski']} yerine {k['yeni']} · {k['gerekce']}"
                r["organizasyon"] = k["yeni"]
                sayac[f"{ad}: {k['eski']} -> {k['yeni']}"] += 1; degisti = True

    if not degisti:
        continue
    gecici = d + ".tmp"
    with open(gecici, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader(); w.writerows(rows)
    os.replace(gecici, d)
    print(f"  yazildi: {d.split('/')[-1]}")

print("\nDEGISIKLIK OZETI")
for k, v in sayac.most_common():
    print(f"  {k:52} {v:>4}")
print(f"  {'TOPLAM':52} {sum(sayac.values()):>4}")

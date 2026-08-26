#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Maç ve etkinlik keyword denetiminin mekanik bulgularını uygular.

Yalnızca dosya içi tutarsızlıkları düzeltir: aynı kulübün diğer satırları
zaten doğru organizasyonu taşırken geride kalmış satırlar. Sayfa tipi
birleştirmeleri, milli takım varlık tipi ve ölü eşleşmeler karar
beklediği için buraya dahil değildir. Yazma atomiktir.
"""
import csv, glob, json, os
from collections import Counter

D = json.load(open("data/denetim/mac_duzeltme.json", encoding="utf-8"))
ORG, ORG_SPOR, VARLIK = D["ORGANIZASYON"], D["ORG_SPOR"], D["VARLIK_TAKIM"]
sayac = Counter()

for d in [x for x in sorted(glob.glob("data/raw/hacim_*.csv")) if not x.endswith("_elenen.csv")]:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    for c in ("mantik_denetim", "faset_notu"):
        if c not in cols: cols.append(c)

    for r in rows:
        kw = (r.get("keyword") or "").strip().lower()

        if kw in ORG and r.get("organizasyon") != ORG[kw]:
            r["faset_notu"] = ("Maç denetimi: organizasyon " + (r.get("organizasyon") or "-")
                               + " yerine " + ORG[kw])
            r["organizasyon"] = ORG[kw]
            sayac["organizasyon düzeltildi"] += 1

        elif kw in ORG_SPOR:
            v = ORG_SPOR[kw]
            if r.get("organizasyon") != v["org"] or r.get("spor_dali") != v["spor"]:
                r["faset_notu"] = ("Maç denetimi: " + (r.get("spor_dali") or "-") + " / "
                                   + (r.get("organizasyon") or "-") + " yerine "
                                   + v["spor"] + " / " + v["org"])
                r["organizasyon"], r["spor_dali"] = v["org"], v["spor"]
                sayac["organizasyon ve spor dalı düzeltildi"] += 1

        if kw in VARLIK and r.get("entity_tipi") != "Takım":
            r["faset_notu"] = "Maç denetimi: tek kulüp adı, eşleşme değil"
            r["entity_tipi"] = "Takım"
            r["sayfa_tipi"] = VARLIK[kw]
            sayac["takıma taşındı"] += 1

    g = d + ".tmp"
    with open(g, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(g, d)

print("MAÇ DENETİMİ DÜZELTMELERİ UYGULANDI")
print("=" * 50)
for k, n in sayac.most_common(): print(f"  {k:<40}{n:>6}")

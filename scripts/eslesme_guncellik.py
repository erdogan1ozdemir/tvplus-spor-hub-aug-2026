#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Eşleşme satırlarının güncellik durumunu işaretler.

Silmez. Bu satırlar gerçek geçmiş talebi taşıyor; portföyden çıkarmak
ölçülmüş hacmi yok saymak olurdu. Bunun yerine `guncellik` kolonuyla
işaretlenirler, böylece hub boyutlandırmasında ayrı değerlendirilebilir.

İki grup:
  Arşiv        Takımlar artık aynı ligde değil, eşleşme tekrar oynanamaz.
  Kura Bekliyor Avrupa kupası eşleşmesi, rakip yeni kuraya göre değişecek.
"""
import csv, glob, os
from collections import Counter

# 2026-27'de Erzurumspor Süper Lig'e yükseldi; bu rakipler TFF 1. Lig'de kaldı
ARSIV_TAKIM = {"erzurumspor"}
ARSIV_RAKIP = {"boluspor", "manisa fk", "sakaryaspor", "bandırmaspor"}

sayac = Counter(); hacim = Counter()

for d in [x for x in sorted(glob.glob("data/raw/hacim_*.csv")) if not x.endswith("_elenen.csv")]:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    if "guncellik" not in cols: cols.append("guncellik")

    for r in rows:
        kw = (r.get("keyword") or "").strip().lower()
        if r.get("entity_tipi") != "Maç":
            r.setdefault("guncellik", "")
            continue
        sv = int(r.get("search_volume") or 0)

        if any(t in kw for t in ARSIV_TAKIM) and any(x in kw for x in ARSIV_RAKIP):
            r["guncellik"] = "Arşiv"
            sayac["arşiv (takımlar artık aynı ligde değil)"] += 1; hacim["arşiv"] += sv
        elif r.get("organizasyon") == "Avrupa Kupası Eşleşmeleri":
            r["guncellik"] = "Kura Bekliyor"
            sayac["kura bekliyor (Avrupa kupası)"] += 1; hacim["kura"] += sv
        else:
            r["guncellik"] = "Güncel"
            sayac["güncel"] += 1

    g = d + ".tmp"
    with open(g, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(g, d)

print("EŞLEŞME GÜNCELLİK İŞARETLERİ")
print("=" * 50)
for k, n in sayac.most_common(): print(f"  {k:<44}{n:>6}")
print(f"\n  Arşiv hacmi        : {hacim['arşiv']:>10,}")
print(f"  Kura bekleyen hacim: {hacim['kura']:>10,}")

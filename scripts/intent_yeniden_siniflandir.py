#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Intent katmanını kural tabanlı yeniden sınıflandırır.

Önceki durumda portföyün %98'i tek değerde ("Bilgi") toplanıyordu, yani
faset hiçbir kırılımda ayrım üretmiyordu. Kurallar sıralıdır: ilk eşleşen
kazanır, hiçbiri eşleşmezse Navigasyonel.

Yıkıcı değildir: orijinal değer intent_kaynak kolonuna taşınır, böylece
kural değişirse yeniden çekim gerekmez. Yazma atomiktir.
"""
import csv, glob, json, os, re
from collections import Counter

D = json.load(open("data/denetim/intent_kurallari.json", encoding="utf-8"))
KURAL = [(ad, re.compile(desen, re.I)) for ad, desen in D["KURALLAR"]]
VARSAYILAN = D["VARSAYILAN"]
sayac, gecis = Counter(), Counter()


def siniflandir(kw):
    for ad, rx in KURAL:
        if rx.search(kw):
            return ad
    return VARSAYILAN


dosyalar = [x for x in sorted(glob.glob("data/raw/hacim_*.csv"))
            if not x.endswith("_elenen.csv")]

for d in dosyalar:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    if "intent_kaynak" not in cols:
        cols.insert(cols.index("intent_katmani") + 1, "intent_kaynak")

    for r in rows:
        kw = (r.get("keyword") or "").strip()
        eski = (r.get("intent_katmani") or "").strip()
        yeni = siniflandir(kw)
        if not r.get("intent_kaynak"):
            r["intent_kaynak"] = eski          # orijinal bir kez saklanır
        r["intent_katmani"] = yeni
        sayac[yeni] += 1
        if eski != yeni:
            gecis[f"{eski or '-'} -> {yeni}"] += 1

    gecici = d + ".tmp"
    with open(gecici, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader(); w.writerows(rows)
    os.replace(gecici, d)

print("YENI DAGILIM (ham satir)")
for k, v in sayac.most_common():
    print(f"  {k:16}{v:>7}")
print(f"\nEN COK GECIS")
for k, v in gecis.most_common(6):
    print(f"  {k:36}{v:>7}")
print(f"\n  degisen satir: {sum(gecis.values()):,}".replace(",", "."))

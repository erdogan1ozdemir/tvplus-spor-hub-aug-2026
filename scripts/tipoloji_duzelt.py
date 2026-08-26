#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sayfa tipi ve varlık tipi yeniden yapılandırması.

Denetimde çıkan üç yapısal bulguyu uygular:

1. Milli takımlar Lig/Organizasyon değil Takım'dır. Dosya bu ayrımı kendi
   içinde tutarsız uyguluyordu: bazı milli takım satırları zaten Takım'dı.
2. Kanal/Yayın ile Canlı İzle aynı izleme sayfasına iner, tek tipte birleşir.
3. Jenerik kovası üç farklı sayfa hedefini bir arada tutuyordu: lig hub'ı,
   spor dalı hub'ı ve tekil etkinlik. Üçü ayrıştırılır.

Yıkıcı değildir, yalnızca faset değerlerini değiştirir. Yazma atomiktir.
"""
import csv, glob, os, re
from collections import Counter

# 1 · Milli takım kalıpları
MILLI = re.compile(r"\b(milli tak[ıi]m|milli ma[çc]|t[üu]rkiye ma[çc]|a milli|"
                   r"filenin sultanlar[ıi]|filenin efeleri|12 dev adam|"
                   r"basketbol milli|kad[ıi]n voleybol milli|erkek voleybol milli)")

# 3a · Spor dalı hub'ı: ne lig ne takım, branşın kendisi
BRANS = {"tjk","at yarışı","at yarisi","ufc","satranç","golf","boks","güreş","judo",
         "snooker","dart","hentbol","jimnastik","taekwondo","kickboks","wwe","espor",
         "e-spor","yüzme","atletizm","tenis","voleybol","basketbol","buz hokeyi",
         "artistik buz pateni","buz pateni","biatlon","alp disiplini","okçuluk",
         "halter","masa tenisi","bisiklet","kayak","binicilik","eskrim","yelken",
         "yağlı güreş","motosiklet","karate","muay thai","triatlon"}

# 3b · Tekil etkinlik: sezonluk lig değil, yılda bir kez oynanan organizasyon
ETKINLIK = {"dünya kupası","olimpiyat","olimpiyat oyunları","yaz olimpiyatları",
            "kış olimpiyatları","super bowl","kırkpınar","all-star","nba all star",
            "nba finalleri","wimbledon","roland garros","us open","avustralya açık",
            "fransa açık","eurobasket","afrika uluslar kupası","akdeniz oyunları",
            "avrupa oyunları","paralimpik oyunlar","dünya basketbol kupası"}

sayac = Counter()

for d in [x for x in sorted(glob.glob("data/raw/hacim_*.csv")) if not x.endswith("_elenen.csv")]:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    if "faset_notu" not in cols: cols.append("faset_notu")

    for r in rows:
        kw = (r.get("keyword") or "").strip().lower()
        ent, st = r.get("entity_tipi"), r.get("sayfa_tipi")

        # 1 · Milli takım → Takım
        if ent == "Lig/Organizasyon" and MILLI.search(kw):
            r["entity_tipi"] = "Takım"
            if st == "Jenerik": r["sayfa_tipi"] = "Takım Jenerik"
            r["faset_notu"] = "Tipoloji: milli takım bir takımdır, organizasyon değil"
            sayac["milli takım → Takım"] += 1

        # 2 · Kanal/Yayın → Canlı İzle (tek izleme yüzeyi)
        if r.get("sayfa_tipi") == "Kanal/Yayın":
            r["sayfa_tipi"] = "Canlı İzle"
            r["faset_notu"] = "Tipoloji: Kanal/Yayın ile Canlı İzle aynı izleme sayfasına iner"
            sayac["Kanal/Yayın → Canlı İzle"] += 1

        # 3 · Jenerik kovasının ayrıştırılması
        if r.get("sayfa_tipi") == "Jenerik":
            if kw in BRANS:
                r["sayfa_tipi"] = "Spor Dalı Jenerik"; r["entity_tipi"] = "Jenerik"
                r["faset_notu"] = "Tipoloji: branş hub'ı, lig ya da takım değil"
                sayac["→ Spor Dalı Jenerik"] += 1
            elif kw in ETKINLIK:
                r["sayfa_tipi"] = "Etkinlik Jenerik"; r["entity_tipi"] = "Etkinlik"
                r["faset_notu"] = "Tipoloji: tekil etkinlik, sürekli lig değil"
                sayac["→ Etkinlik Jenerik"] += 1
            elif r.get("entity_tipi") == "Lig/Organizasyon":
                r["sayfa_tipi"] = "Lig Jenerik"
                r["faset_notu"] = "Tipoloji: lig hub'ı kendi sayfa tipine ayrıldı"
                sayac["→ Lig Jenerik"] += 1

    g = d + ".tmp"
    with open(g, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(g, d)

print("TİPOLOJİ DÜZELTMELERİ UYGULANDI")
print("=" * 50)
for k, n in sayac.most_common(): print(f"  {k:<40}{n:>6}")

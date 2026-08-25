#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Çapraz faset denetiminde tespit edilen tutarsızlıkları düzeltir.

1. Kulüp adı taşıyan satırların sayfa tipi Oyuncu'dan Takım'a alınır
2. Basketbol / voleybol kulüp sorguları doğru spor dalına taşınır
3. Lig geneli maç sorguları takım sorgusu olmaktan çıkarılır
4. Boş `katman` alanı kaynağa göre doldurulur, "Çekirdek" etiketi yenilenir
"""
import csv, glob, os, re
from collections import Counter

BASKET = re.compile(r"\b(beko|basketbol|basket|anadolu efes|efes)\b", re.I)
VOLEY  = re.compile(r"\b(voleybol|vakıfbank|vakifbank|eczacıbaşı|eczacibasi)\b", re.I)
KULUP_SON = re.compile(
    r"\b(fc|cf|sc|sk|ac|as|afc|fk|kf|nk|bk|if|ik|cd|ud|sd|rc|bc|us|ss|united|city|"
    r"town|rovers|athletic|atletico|atlético|real|olympique|sporting|club|calcio|"
    r"spor|kulübü|kulubu|madrid|barcelona|milan|inter|juventus|napoli|roma|lazio)\b", re.I)

# Kaynak dosya → katman (provenans temelli)
KATMAN_KAYNAK = {"oyuncular":"Genişletme", "tur2":"Genişletme",
                 "tur3":"Genişletme", "organizasyon":"Ana Liste"}

sayac = Counter()
for d in [x for x in sorted(glob.glob("data/raw/hacim_*.csv")) if not x.endswith("_elenen.csv")]:
    kaynak = d.split("hacim_")[1][:-4]
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    for eksik in ("katman","sayfa_tipi","spor_dali","entity_tipi","organizasyon"):
        if eksik not in cols: cols.append(eksik)
    for r in rows:
        kw = (r.get("keyword") or "").strip()
        ent, st, spor = r.get("entity_tipi",""), r.get("sayfa_tipi",""), r.get("spor_dali","")

        # 1) Kulüp adı taşıyan satır oyuncu sayfa tipinde duruyorsa düzelt
        if ent == "Takım" and st in ("Oyuncu Jenerik", "Oyuncu Bilgi"):
            r["sayfa_tipi"] = "Takım Jenerik" if st == "Oyuncu Jenerik" else "Takım Bilgi"
            sayac["kulüp satırı oyuncu sayfa tipinden alındı"] += 1

        # 2) Spor dalı düzeltmesi
        if spor == "Futbol" and BASKET.search(kw):
            r["spor_dali"] = "Basketbol"
            if r.get("organizasyon") in ("Süper Lig","Futbol"): r["organizasyon"] = "Basketbol Süper Ligi"
            sayac["basketbol kulübü futboldan alındı"] += 1
        elif spor == "Futbol" and VOLEY.search(kw):
            r["spor_dali"] = "Voleybol"
            if r.get("organizasyon") in ("Süper Lig","Futbol"): r["organizasyon"] = "Sultanlar Ligi"
            sayac["voleybol kulübü futboldan alındı"] += 1

        # 3) Lig geneli maç sorgusu takım sorgusu sayılmasın
        if ent == "Lig/Organizasyon" and st == "Takım Maç Sorgusu":
            r["sayfa_tipi"] = "Maç/Skor"
            sayac["lig maç sorgusu takım sorgusundan alındı"] += 1

        # 4) katman
        mevcut = (r.get("katman") or "").strip()
        if mevcut == "Çekirdek":
            r["katman"] = "Ana Liste"; sayac["katman etiketi yenilendi"] += 1
        elif not mevcut:
            r["katman"] = KATMAN_KAYNAK.get(kaynak, "Ana Liste")
            sayac["boş katman dolduruldu"] += 1

    # Atomik yazım: geçici dosyaya yazılır, yalnızca hatasız tamamlanırsa
    # asıl dosyanın yerine geçer. Yazım sırasında oluşan hata veriyi silmez.
    gecici = d + ".tmp"
    with open(gecici, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(gecici, d)

print("FASET DÜZELTME")
print("=" * 52)
for k, n in sayac.most_common(): print(f"  {k:<44}{n:>6}")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mekanik denetimden çıkan kural bazlı düzeltmeler."""
import csv, glob, os, re
from collections import Counter, defaultdict

HACIM = [d for d in sorted(glob.glob("data/raw/hacim_*.csv")) if not d.endswith("_elenen.csv")]

# ——— Kişi adı olduğu halde takım listesine düşmüş olanlar (ajan raporlarından)
KISI_AMA_TAKIM = {"milan skriniar","milan vukotic","rafa silva","talisca","orkun kökçü",
 "anderson talisca","miha zajc","vangelis pavlidis","danylo sikan","mason greenwood",
 "allahyar sayyadmanesh","giannis konstantelias","dion drena beljo","dor peretz",
 "renaldo cephas","ole didrik blomberg","brighton labeau","haris tabaković",
 "svit sešlar","veljko simić"}

# ——— Sayfa tipi keyword metninden türetilir
def sayfa_tipi(kw, ent):
    k = kw.lower()
    if re.search(r"canlı izle|şifresiz|nerede izlen", k): return "Canlı İzle"
    if "hangi kanalda" in k:      return "Kanal/Yayın"
    if "puan durumu" in k:        return "Puan Durumu"
    if "fikstür" in k:            return "Fikstür"
    if re.search(r"\bkadro(su)?$", k): return "Kadro"
    if "transfer" in k:           return "Transfer"
    if re.search(r"ne zaman|saat kaçta", k): return "Takvim/Saat"
    if "istatistik" in k:         return "İstatistik"
    if "bilet" in k:              return "Bilet"
    if re.search(r"kimdir|hangi takımda", k):
        return "Takım Bilgi" if ent == "Takım" else "Oyuncu Bilgi"
    return None

# ——— Varlık tipi çelişkisi: aynı keyword için tek tip
tipHacim = defaultdict(lambda: defaultdict(int))
for d in HACIM:
    for r in csv.DictReader(open(d, encoding="utf-8-sig")):
        kw = (r.get("keyword") or "").strip().lower()
        s = int(r.get("search_volume") or 0) if r.get("veri_var")=="evet" else 0
        tipHacim[kw][r.get("entity_tipi","")] += s
# Kişi adı listesindekiler her zaman Oyuncu; diğerlerinde Takım kazanır
KAZANAN = {}
for kw, t in tipHacim.items():
    if len(t) < 2: continue
    kok = kw.split(" kimdir")[0].split(" hangi takımda")[0].split(" istatistik")[0]
    KAZANAN[kw] = "Oyuncu" if kok in KISI_AMA_TAKIM else (
        "Takım" if "Takım" in t else max(t, key=t.get))

sayac = Counter()
for d in HACIM:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    for r in rows:
        kw  = (r.get("keyword") or "").strip().lower()
        ent = r.get("entity_tipi","")
        kok = kw.split(" kimdir")[0].split(" hangi takımda")[0].split(" istatistik")[0]

        # 1) Kişi adı takım etiketliyse oyuncuya geri al
        if kok in KISI_AMA_TAKIM and ent == "Takım":
            r["entity_tipi"] = "Oyuncu"
            r["sayfa_tipi"] = "Oyuncu Jenerik" if kw == kok else "Oyuncu Bilgi"
            r["faset_notu"] = "Kişi adı, kulüp değil"; sayac["kişi adı oyuncuya alındı"] += 1
            ent = "Oyuncu"

        # 2) Varlık tipi çelişkisi tekilleştirilir
        elif kw in KAZANAN and ent != KAZANAN[kw]:
            r["entity_tipi"] = KAZANAN[kw]; sayac["varlık tipi tekilleştirildi"] += 1
            ent = KAZANAN[kw]

        # 3) Sayfa tipi keyword metninden türetilir
        st = sayfa_tipi(kw, ent)
        if st and r.get("sayfa_tipi") != st:
            r["sayfa_tipi"] = st; sayac["sayfa tipi düzeltildi"] += 1

        # 4) Kulüp alanı keywordün kendisiyse temizlenir
        if r.get("kulup") and r["kulup"].strip().lower() == kw:
            r["kulup"] = ""; sayac["kendine işaret eden kulüp alanı temizlendi"] += 1

        # 5) İzleme intent kaçağı
        if re.search(r"canlı izle|şifresiz|nerede izlen|hangi kanalda|canlı yayın|yayın akışı", kw) \
           and r.get("intent_katmani") != "İzleme":
            r["intent_katmani"] = "İzleme"; sayac["izleme intent'i düzeltildi"] += 1

    g = d + ".tmp"
    with open(g, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(g, d)

print("MEKANİK DÜZELTMELER")
print("=" * 54)
for k, n in sayac.most_common(): print(f"  {k:<44}{n:>6}")

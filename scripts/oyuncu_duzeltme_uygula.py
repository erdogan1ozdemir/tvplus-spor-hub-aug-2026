#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ajan taramasından çıkan oyuncu listesi düzeltmelerini uygular.

Yıkıcı değildir. Kulüp ve organizasyon olarak tespit edilenler doğru varlık
tipine taşınır; jenerik kelimeler ve oyuncu olmayan kişiler `mantik_denetim`
ile işaretlenip toplamlardan düşer; mükerrer yazımlar ikincil kayıt olarak
işaretlenir. Şüpheliler dokunulmadan bırakılır, ayrı karar gerektirir.
"""
import csv, glob, json, os
from collections import Counter

D = json.load(open("data/denetim/oyuncu_duzeltme.json", encoding="utf-8"))
KULUP, ORG = D["KULUP"], D["ORGANIZASYON"]
JEN, KISI, MUK = D["JENERIK"], D["KISI_OYUNCU_DEGIL"], D["MUKERRER"]
sayac = Counter()

for d in [x for x in sorted(glob.glob("data/raw/hacim_*.csv")) if not x.endswith("_elenen.csv")]:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    for c in ("mantik_denetim", "faset_notu"):
        if c not in cols: cols.append(c)

    for r in rows:
        kw  = (r.get("keyword") or "").strip().lower()
        ana = (r.get("oyuncu_ana_ad") or "").strip().lower()
        if r.get("entity_tipi") != "Oyuncu": continue
        anahtar = kw if kw in KULUP or kw in ORG or kw in JEN or kw in KISI or kw in MUK else ana

        if anahtar in KULUP:
            v = KULUP[anahtar]
            r["entity_tipi"] = "Takım"
            r["sayfa_tipi"]  = "Takım Jenerik" if r.get("sayfa_tipi")=="Oyuncu Jenerik" else "Takım Bilgi"
            r["organizasyon"], r["spor_dali"] = v["org"], v["spor"]
            r["kulup"] = ""; r["oyuncu_ana_ad"] = ""
            r["faset_notu"] = "Ajan taraması: kulüp adı, oyuncu değil"
            sayac["kulübe taşındı"] += 1

        elif anahtar in ORG:
            v = ORG[anahtar]
            r["entity_tipi"] = "Lig/Organizasyon"; r["sayfa_tipi"] = "Jenerik"
            r["organizasyon"], r["spor_dali"] = v["org"], v["spor"]
            r["kulup"] = ""; r["oyuncu_ana_ad"] = ""
            r["faset_notu"] = "Ajan taraması: organizasyon adı"
            sayac["organizasyona taşındı"] += 1

        elif anahtar in JEN:
            r["mantik_denetim"] = "Jenerik kelime, oyuncu değil (" + JEN[anahtar] + ")"
            sayac["jenerik işaretlendi"] += 1

        elif anahtar in KISI:
            r["mantik_denetim"] = "Aktif oyuncu değil (" + KISI[anahtar] + ")"
            sayac["oyuncu olmayan kişi işaretlendi"] += 1

        elif anahtar in MUK:
            r["mantik_denetim"] = "Mükerrer yazım (" + MUK[anahtar] + " ile aynı)"
            sayac["mükerrer işaretlendi"] += 1

    g = d + ".tmp"
    with open(g, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(g, d)

print("AJAN DÜZELTMELERİ UYGULANDI")
print("=" * 50)
for k, n in sayac.most_common(): print(f"  {k:<40}{n:>6}")
print(f"\n  Şüpheli (dokunulmadı): {len(D['SUPHELI'])} keyword")

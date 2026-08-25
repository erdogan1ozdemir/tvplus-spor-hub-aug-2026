#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Oyuncu evrenini temizler ve arama formu varyantlarıyla genişletir.

İki sorun giderilir:
1. Wikipedia kadro tablolarından sızan ülke, kulüp ve kurum adları listeden çıkarılır.
2. Oyuncu adları Wikipedia'nın aksanlı kanonik yazımıyla geliyor ("vinícius júnior"),
   oysa arama aksansız ve kısaltmalı yapılıyor ("vinicius jr"). Her oyuncu için
   aksansız tam ad, soyad ve kısaltma varyantları üretilir.
"""
import csv, re, unicodedata, os, sys

# ——— Oyuncu olmayan girdiler
ULKE = {"birleşik krallık","birleşik arap emirlikleri","amerika birleşik devletleri",
    "türkiye","almanya","fransa","ispanya","italya","hollanda","belçika","portekiz",
    "brezilya","arjantin","kanada","avustralya","yunanistan","sırbistan","hırvatistan",
    "polonya","çekya","slovenya","litvanya","letonya","israil","mısır","fas","cezayir",
    "nijerya","senegal","kamerun","gana","japonya","çin","güney kore","iran","rusya",
    "ukrayna","macaristan","romanya","bulgaristan","avusturya","isviçre","isveç",
    "norveç","danimarka","finlandiya","izlanda","irlanda","galler","iskoçya","abd"}
KURUM = re.compile(r"(academy|association|federation|university|college|institute|"
    r"\bcb\b|\bfc\b|\bcd\b|\bsd\b|\bud\b|\bca\b|estudiantes|olavarr|cornell|"
    r"military|school|club de|sporting club)", re.I)

def aksansiz(s):
    """Türkçe karakterleri koruyup Latin aksanlarını düşürür: vinícius -> vinicius"""
    tr = {"ı":"ı","İ":"İ","ş":"ş","ğ":"ğ","ü":"ü","ö":"ö","ç":"ç"}
    out = []
    for ch in s:
        if ch in tr: out.append(ch); continue
        d = unicodedata.normalize("NFD", ch)
        b = "".join(c for c in d if unicodedata.category(c) != "Mn")
        out.append(b or ch)
    return "".join(out)

def varyantlar(ad):
    """Bir oyuncu adı için gerçekçi arama formları üretir."""
    ad = " ".join(ad.split()).strip().lower()
    v = {ad}
    duz = aksansiz(ad)
    if duz != ad: v.add(duz)
    for taban in (ad, duz):
        p = taban.split()
        if len(p) >= 2:
            # "júnior" / "junior" sonlu adlar: jr kısaltması
            if p[-1] in ("júnior","junior","jr","jr."):
                kok = " ".join(p[:-1])
                v.add(kok); v.add(kok + " jr")
            else:
                # soyad tek başına (ayırt edici uzunluktaysa)
                if len(p[-1]) >= 6: v.add(p[-1])
                # ilk + son ad (ara adlar atılır)
                if len(p) >= 3: v.add(p[0] + " " + p[-1])
    return {x for x in v if 3 < len(x) < 60}

# ——— Mevcut oyuncu seed'ini oku
kaynak = "data/raw/seed_oyuncular.csv"
with open(kaynak, encoding="utf-8") as f:
    rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)

jenerik = [r for r in rows if r.get("sayfa_tipi") == "Oyuncu Jenerik"]
print(f"Mevcut oyuncu (jenerik satır): {len(jenerik)}")

# ——— Temizlik
temiz, atilan = [], []
for r in jenerik:
    ad = (r["keyword"] or "").strip().lower()
    if ad in ULKE or KURUM.search(ad) or len(ad.split()) < 2:
        atilan.append((ad, r.get("kulup","")))
        continue
    temiz.append(r)
print(f"Atılan (ülke/kurum/tek kelime): {len(atilan)}")
for a in atilan[:10]: print(f"   - {a[0]}  ({a[1]})")

# ——— Varyant üretimi
VARYANT_SABLON = [
    ("{}",                 "Oyuncu Jenerik", "Bilgi"),
    ("{} kimdir",          "Oyuncu Bilgi",   "Bilgi"),
    ("{} hangi takımda",   "Oyuncu Bilgi",   "Bilgi"),
    ("{} istatistik",      "İstatistik",     "Bilgi"),
]
yeni, gorulen = [], set()
for r in temiz:
    ana = (r["keyword"] or "").strip().lower()
    for v in sorted(varyantlar(ana)):
        for tmpl, st, it in VARYANT_SABLON:
            kw = tmpl.format(v)
            if kw in gorulen: continue
            gorulen.add(kw)
            o = dict(r)
            o["keyword"] = kw
            o["sayfa_tipi"] = st
            o["intent_katmani"] = it
            o["varyant_kodu"] = st
            o["oyuncu_ana_ad"] = ana          # varyantları ana ada bağlar
            wc = len(kw.split())
            o["sorgu_uzunlugu"] = "Head" if wc <= 2 else ("Body" if wc <= 4 else "Long-tail")
            yeni.append(o)

if "oyuncu_ana_ad" not in cols: cols.append("oyuncu_ana_ad")
hedef = "data/raw/seed_oyuncular.csv"
with open(hedef, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
    w.writeheader(); w.writerows(yeni)

tekil_oyuncu = len({r["oyuncu_ana_ad"] for r in yeni})
print(f"\nTemiz oyuncu: {tekil_oyuncu}")
print(f"Üretilen keyword: {len(yeni)} (önceki: {len(rows)})")
print(f"Çıktı: {hedef}")

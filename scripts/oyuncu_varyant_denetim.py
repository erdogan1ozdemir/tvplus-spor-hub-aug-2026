#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Soyad-tek oyuncu varyantlarında yanlış eşleşme denetimi.

Aksansız ve kısaltmalı varyantlar gerçek arama hacmini ortaya çıkardı
("vinícius júnior" 18.640 → "vinicius" 165.800). Ancak soyad tek başına
arandığında marka, ünlü veya genel kelimeyle çakışabiliyor.

Denetim YIKICI DEĞİLDİR: satırlar silinmez, `varyant_denetim` kolonuyla
işaretlenir. Dashboard yalnızca "Geçerli" satırları jenerik toplama katar.
Bu sayede eşikler yeniden çekim gerektirmeden değiştirilebilir.
"""
import csv, re
from collections import defaultdict

DOSYA = "data/raw/hacim_oyuncular.csv"
# Soyad tek başına tam addan bu kadar yüksekse çakışma sayılır.
# Futbolda soyadın tek başına aranması normaldir (osimhen > victor osimhen),
# bu yüzden eşik yüksek tutulur; yalnızca uç sapmalar yakalanır.
ORAN_ESIK, MUTLAK_ESIK = 20.0, 150000

# Ad parçası olmayan, ayrıştırmadan sızan kelimeler
PARCA = {"cumhuriyeti","cumhuriyet","adaları","krallık","krallığı","devletleri",
         "federasyonu","futbol","basketbol","voleybol","milli","takım","takim",
         "kulübü","kulubu","spor","united","city","academy","junior","júnior",
         "senior","vikings","state","college","university","network"}
# Marka / ünlü / genel kelimeyle güçlü çakışan tek kelimeler
CAKISAN = {"stanley","watson","karaca","mcdonald","jordan","kartal","özdilek",
           "network","smith","james","apple","orange","tiger","phoenix","hunter"}
ULKE_SON = re.compile(r"(cumhuriyeti|krallığı|krallık|devletleri|federasyonu|"
                      r"adaları|prensliği)$", re.I)

with open(DOSYA, encoding="utf-8-sig") as f:
    rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
if "varyant_denetim" not in cols: cols.append("varyant_denetim")

grup = defaultdict(list)
for r in rows:
    if r.get("sayfa_tipi") != "Oyuncu Jenerik": continue
    grup[(r.get("oyuncu_ana_ad") or r["keyword"]).strip().lower()].append(r)

sv = lambda r: int(r.get("search_volume") or 0) if r.get("veri_var") == "evet" else 0
sayac = defaultdict(int); ornek = []

for ana, satirlar in grup.items():
    tam = max((r for r in satirlar if len(r["keyword"].split()) >= 2), key=sv, default=None)
    tamVol = sv(tam) if tam else 0
    for r in satirlar:
        kw = r["keyword"].strip().lower()
        v = sv(r)
        if ULKE_SON.search(kw):
            r["varyant_denetim"] = "Ülke/kurum adı"; sayac["ülke"] += 1; ornek.append((kw,v,"ülke")); continue
        if len(kw.split()) == 1:
            if kw in PARCA:
                r["varyant_denetim"] = "Ad parçası değil"; sayac["parça"] += 1; ornek.append((kw,v,"parça")); continue
            if kw in CAKISAN:
                r["varyant_denetim"] = "Marka/genel kelime çakışması"; sayac["çakışan"] += 1; ornek.append((kw,v,"çakışan")); continue
            if v >= MUTLAK_ESIK and tamVol > 0 and v > tamVol * ORAN_ESIK:
                r["varyant_denetim"] = f"Aşırı sapma (tam ad {tamVol:,})".replace(",", ".")
                sayac["sapma"] += 1; ornek.append((kw,v,"sapma")); continue
        r["varyant_denetim"] = "Geçerli"

for r in rows:
    r.setdefault("varyant_denetim", "Geçerli")
    if not r.get("varyant_denetim"): r["varyant_denetim"] = "Geçerli"

with open(DOSYA, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)

toplam = sum(sayac.values())
print(f"İşaretlenen satır: {toplam}  " + ", ".join(f"{k} {v}" for k, v in sayac.items()))
for kw, v, tip in sorted(ornek, key=lambda x: -x[1])[:10]:
    print(f"   {tip:<9} {kw:<24} {v:>12,}".replace(",", "."))
print(f"Toplam satır korundu: {len(rows)} (hiçbiri silinmedi)")

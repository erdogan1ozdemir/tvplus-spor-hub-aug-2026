#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Keyword'lerdeki marka terimlerini siniflandirir.

Ayrim mantigi:
  RAKIP  = TV+ ile ayni sayfa tiplerini servis eden OZEL kuruluslar (beIN, Mackolik,
           Sofascore, tabii, Exxen...). Jenerik talep toplamindan cikarilir.
  KURUM  = TFF, TJK, UEFA, FIFA gibi bilginin birinci cikis noktasi olan resmi
           federasyon/organizatorler. RAKIP DEGILDIR, jenerik talep sayilir; yalnizca
           `kurum_sorgusu` bayragiyla isaretlenir ki bilesim izlenebilsin.
  Kurum adi bir turnuva adinin parcasiysa (ornegin "uefa avrupa ligi") kurum sorgusu
  sayilmaz, duz jenerik turnuva sorgusudur.
"""
import re

RAKIP = {
    "Rakip Yayıncı": ["bein", "beinsport", "bein sport", "bein sports", "beinsports",
                      "tabii", "exxen", "s sport", "ssport", "s-sport", "tod tv", "todtv",
                      "digiturk", "d-smart", "dsmart", "blutv", "blu tv", "gain tv",
                      "trt spor", "a spor", "aspor", "ntv spor", "ntvspor", "eurosport",
                      "tivibu", "lig tv", "ligtv", "smart spor"],
    "Rakip Veri Sitesi": ["mackolik", "maçkolik", "sporx", "flashscore", "flash score",
                          "sofascore", "sofa score", "transfermarkt", "sahadan", "goal com",
                          "fotmob", "livescore", "live score", "fanatik", "fotomac", "fotomaç",
                          "misli", "nesine", "bilyoner", "sporarena", "beyazgazete"],
    "Korsan Yayın": ["taraftarium", "taraftarium24", "selçuksports", "selcuksports",
                     "justin tv", "justintv", "jestyayin", "jest yayın", "golvar",
                     "inat tv", "inattv", "netspor", "matbet", "trgoals"],
    "TV+": ["tv+", "tvplus", "tv plus", "turkcell tv"],
}
# Rakip DEGIL: bilginin birinci cikis noktasi olan resmi kurumlar
# Yalnizca federasyon / organizator kurumlar. Lig adlari (NBA, EuroLeague) buraya girmez.
KURUMLAR = ["tff", "tjk", "uefa", "fifa", "tbf", "tvf", "fiba", "fivb", "ioc",
            "türkiye futbol federasyonu", "türkiye jokey kulübü", "gsb"]
# Kurum adindan sonra gelirse hala kurum sorgusu sayilan jenerik ekler
KURUM_EKI = {"", "canlı izle", "izle", "takvim", "program", "giriş", "resmi site",
             "sonuçları", "sonuçlar", "puan durumu", "bülteni", "tv", "canlı"}

RAKIP_SINIFLAR = {"Rakip Yayıncı", "Rakip Veri Sitesi", "Korsan Yayın"}

def _sinir(t):
    return re.compile(r"(?<![a-zçğıöşü0-9])" + re.escape(t) + r"(?![a-zçğıöşü0-9])")
_RP = {k: [_sinir(t) for t in v] for k, v in RAKIP.items()}
_KP = [(t, _sinir(t)) for t in KURUMLAR]

def marka_tipi(kw):
    """Rakip/TV+ markasi tespiti. Kurumlar burada 'Jenerik' doner."""
    k = " " + (kw or "").strip().lower() + " "
    for tip, pats in _RP.items():
        if any(p.search(k) for p in pats):
            return tip
    return "Jenerik"

def kurum_sorgusu(kw):
    """Sorgu bir resmi kuruma dogrudan yonelik mi? Turnuva adinin parcasiysa hayir."""
    k = " ".join((kw or "").strip().lower().split())
    for t, p in _KP:
        if not p.search(" " + k + " "):
            continue
        if k == t:
            return "evet"
        if k.startswith(t + " ") and k[len(t):].strip() in KURUM_EKI:
            return "evet"
    return "hayır"

if __name__ == "__main__":
    import csv, glob
    from collections import defaultdict
    toplam = defaultdict(lambda: [0, 0]); ornek = defaultdict(list); kurum = []
    for src in sorted(glob.glob("data/raw/hacim_*.csv")):
        if src.endswith("_elenen.csv"): continue
        with open(src, encoding="utf-8-sig") as f:
            rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
        if "kurum_sorgusu" not in cols: cols.append("kurum_sorgusu")
        for r in rows:
            r["marka_tipi"] = marka_tipi(r["keyword"])
            r["kurum_sorgusu"] = kurum_sorgusu(r["keyword"])
            if r.get("veri_var") == "evet":
                sv = int(r["search_volume"] or 0)
                toplam[r["marka_tipi"]][0] += sv; toplam[r["marka_tipi"]][1] += 1
                if r["marka_tipi"] in RAKIP_SINIFLAR: ornek[r["marka_tipi"]].append((r["keyword"], sv))
                if r["kurum_sorgusu"] == "evet": kurum.append((r["keyword"], sv))
        with open(src, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
        print(f"  guncellendi: {src}")

    def fmt(n): return f"{n/1_000_000:.2f}M" if n>=1_000_000 else (f"{n/1_000:.0f}K" if n>=1000 else str(n))
    gtot = sum(v[0] for v in toplam.values())
    print("\n" + "="*62); print("MARKA TIPI (kurumlar Jenerik sayilir)"); print("="*62)
    for k,(v,c) in sorted(toplam.items(), key=lambda x:-x[1][0]):
        etiket = " <- rakip, toplamdan cikar" if k in RAKIP_SINIFLAR else ""
        print(f"  {k:<20}{fmt(v):>9}  %{100*v/gtot:>5.1f}  ({c} kw){etiket}")
    print(f"\nRAKIP MARKALI TOPLAM: {fmt(sum(v for k,(v,c) in toplam.items() if k in RAKIP_SINIFLAR))}")
    print("\nKURUM SORGUSU olarak isaretlenenler (jenerige dahil, izlenebilir):")
    for kw, sv in sorted(kurum, key=lambda x:-x[1])[:12]:
        print(f"   {kw:<34}{fmt(sv):>9}")

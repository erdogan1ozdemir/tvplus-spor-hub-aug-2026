#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Birleşik kadro kaynağındaki yeni oyuncular için keyword seed'i üretir.

Şablonlar ve faset yapısı `build_oyuncular.py` ile aynıdır; böylece yeni
satırlar mevcut veri setiyle birebir uyumlu olur. Kulübün coğrafya ve yayın
hakkı bilgisi mevcut takım satırlarından okunur.
"""
import csv, glob, json, re, unicodedata

def aksansiz(s):
    """Latin aksanlarını siler, Türkçe karakterleri korur."""
    tr = set("ıİşŞğĞüÜöÖçÇ"); out = []
    for ch in s:
        if ch in tr: out.append(ch); continue
        d = unicodedata.normalize("NFD", ch)
        out.append("".join(c for c in d if unicodedata.category(c) != "Mn") or ch)
    return "".join(out)

# Kulüp bazlı coğrafya / yayın hakkı bilgisi mevcut takım satırlarından alınır
kulupBilgi, mevcutKw = {}, set()
for d in [x for x in sorted(glob.glob("data/raw/hacim_*.csv")) if not x.endswith("_elenen.csv")]:
    for r in csv.DictReader(open(d, encoding="utf-8-sig")):
        mevcutKw.add((r.get("keyword") or "").strip().lower())
        if r.get("entity_tipi") == "Takım" and r.get("sayfa_tipi") == "Takım Jenerik":
            kulupBilgi.setdefault((r.get("keyword") or "").strip().lower(),
                                  (r.get("cografya") or "", r.get("yayin_hakki") or ""))

VAR = [("{}", "Oyuncu Jenerik", "Bilgi"), ("{} kimdir", "Oyuncu Bilgi", "Bilgi"),
       ("{} hangi takımda", "Oyuncu Bilgi", "Bilgi"), ("{} istatistik", "İstatistik", "Bilgi")]
TR_KULUP = re.compile(r"(galatasaray|fenerbah|beşiktaş|trabzon|başakşehir|efes|arkas|"
                      r"vakıfbank|eczacıbaşı|kuzeyboru|zeren|halkbank|ziraat|belediyespor|"
                      r"türk hava|nilüfer|aydın|cizre|bursa|istanbul)", re.I)

kadro = json.load(open("data/raw/_kadro_birlesik.json", encoding="utf-8"))
rows, gorulen = [], set()
for kulup, v in kadro.items():
    org, spor = v.get("org") or "", v.get("spor") or "Futbol"
    cog, hak = kulupBilgi.get(kulup.lower(), ("", ""))
    if not cog: cog = "Türkiye" if TR_KULUP.search(kulup) else "Yurt Dışı"
    if not hak: hak = "Doğrulanacak"
    for oyuncu in v["kadro"]:
        pl = aksansiz(oyuncu.strip().lower())
        if len(pl) < 4 or pl in gorulen: continue
        gorulen.add(pl)
        for tmpl, st_, it_ in VAR:
            kw = tmpl.format(pl)
            if kw in mevcutKw: continue
            wc = len(kw.split())
            rows.append({"keyword": kw, "organizasyon": org, "spor_dali": spor,
                "musabaka_tipi": "Lig", "lig_seviyesi": "1. Seviye",
                "prestij_katmani": "Ana Liste",
                "cinsiyet": "Kadın" if org in ("Sultanlar Ligi",) else "Erkek",
                "kulup_milli": "Kulüp", "takim_bireysel": "Takım Sporu", "cografya": cog,
                "yerlilik": "Yerli" if cog == "Türkiye" else "Yabancı",
                "turk_baglantisi": "Türk Takımı Var" if cog == "Türkiye" else "Yok",
                "yayin_hakki": hak, "periyodiklik": "Yıllık", "takvim_tipi": "Sürekli Lig",
                "sayfa_tipi": st_, "intent_katmani": it_, "entity_tipi": "Oyuncu",
                "marka_tipi": "Jenerik",
                "dil": "İngilizce" if re.fullmatch(r"[a-z0-9 .\-']+", kw) else "Türkçe",
                "sorgu_uzunlugu": "Head" if wc <= 2 else ("Body" if wc <= 4 else "Long-tail"),
                "varyant_kodu": st_, "kulup": kulup, "katman": "Genişletme",
                "oyuncu_ana_ad": pl})

if not rows: raise SystemExit("Yeni satir yok.")
with open("data/raw/seed_yeni_oyuncular.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print(f"tekil yeni oyuncu : {len(gorulen)}")
print(f"uretilen keyword  : {len(rows)}")
print(f"DataForSEO istegi : ~{-(-len(rows)//700)}")
print("cikti: data/raw/seed_yeni_oyuncular.csv")

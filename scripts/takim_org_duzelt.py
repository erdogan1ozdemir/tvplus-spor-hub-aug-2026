#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Takım ve organizasyon listelerindeki lig, spor ve varlık tipi hataları."""
import csv, glob, os
from collections import Counter

# Kulüp → doğru lig (2026-27 sezonu, Wikipedia sezon sayfalarıyla doğrulandı)
LIG = {
 "hull city":"Premier Lig","hull afc":"Premier Lig","hull city afc":"Premier Lig",
 "benfica":"Portekiz Ligi","sl benfica":"Portekiz Ligi","s.l. benfica":"Portekiz Ligi",
 "istanbul başakşehir f.k.":"Süper Lig","afc ajax":"Eredivisie","as roma":"Serie A",
 "west ham":"Diğer Avrupa Ligleri","rangers":"Diğer Avrupa Ligleri","lille osc":"Ligue 1",
 "sc freiburg":"Bundesliga","girona":"Diğer Avrupa Ligleri","mallorca":"Diğer Avrupa Ligleri",
 "sc braga":"Portekiz Ligi","rc strasbourg alsace":"Ligue 1","hellas verona":"Diğer Avrupa Ligleri",
 "wolverhampton":"Diğer Avrupa Ligleri","burnley":"Diğer Avrupa Ligleri","pisa":"Diğer Avrupa Ligleri",
 "birmingham city":"Diğer Avrupa Ligleri","as monaco":"Ligue 1","cordoba cf":"Diğer Avrupa Ligleri",
 "swansea afc":"Diğer Avrupa Ligleri","granada cf":"Diğer Avrupa Ligleri",
 "as saint-etienne":"Diğer Avrupa Ligleri","sc bastia":"Diğer Avrupa Ligleri",
 "new york red bulls":"Diğer Ligler","oviedo":"Diğer Avrupa Ligleri","inter miami cf":"Diğer Ligler",
 "swansea city afc":"Diğer Avrupa Ligleri","as nancy":"Diğer Avrupa Ligleri",
 "queen's park rangers":"Diğer Avrupa Ligleri","debreceni vsc":"Diğer Avrupa Ligleri",
 "afc wimbledon":"Diğer Avrupa Ligleri","cf pachuca":"Diğer Ligler",
 "sporting kansas city":"Diğer Ligler","sc farense":"Portekiz Ligi",
 "brighton hove albion":"Premier Lig","lommel united":"Diğer Avrupa Ligleri",
 "ac pisa 1909":"Diğer Avrupa Ligleri","as omonia":"Diğer Avrupa Ligleri",
 "ac arles-avignon":"Diğer Avrupa Ligleri",
}
# NBA ↔ EuroLeague çift yönlü karışma
NBA = {"nuggets","denver nuggets","clippers","los angeles clippers","miami heat",
       "wizards","washington wizards"}
EURO = {"fenerbahçe basketball","real madrid baloncesto","bc zalgiris","bc rytas",
        "bc khimki","bc zenit saint petersburg","hapoel jerusalem bc","bc kyiv",
        "virtus roma","pallacanestro virtus roma"}
DIGER_BASKET = {"stockton kings":"NBA G League","montana grizzlies basketball":"NCAA",
                "elizabeth city state vikings":"NCAA","butler grizzlies":"NCAA",
                "new jersey nets":"NBA"}
# Kadın basketbol takımları voleybol sanılmış
UNRIVALED = {"mist bc","breeze bc","lunar owls bc","hive bc"}
# Beşiktaş ana kulüp satırları
BESIKTAS = {"beşiktaş j.k.","beşiktaş jk"}

sayac = Counter()
for d in [x for x in sorted(glob.glob("data/raw/hacim_*.csv")) if not x.endswith("_elenen.csv")]:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    if "faset_notu" not in cols: cols.append("faset_notu")

    for r in rows:
        kw = (r.get("keyword") or "").strip().lower()
        ent = r.get("entity_tipi","")

        if kw in LIG and r.get("organizasyon") != LIG[kw]:
            r["organizasyon"] = LIG[kw]
            r["faset_notu"] = "Ajan taraması: lig düzeltmesi"; sayac["lig düzeltildi"] += 1
        if kw in NBA and r.get("organizasyon") != "NBA":
            r["organizasyon"], r["spor_dali"] = "NBA", "Basketbol"; sayac["NBA'e taşındı"] += 1
        if kw in EURO and r.get("organizasyon") != "EuroLeague":
            r["organizasyon"], r["spor_dali"] = "EuroLeague", "Basketbol"; sayac["EuroLeague'e taşındı"] += 1
        if kw in DIGER_BASKET:
            r["organizasyon"], r["spor_dali"] = DIGER_BASKET[kw], "Basketbol"; sayac["diğer basketbol ligi"] += 1
        if kw in UNRIVALED:
            r["organizasyon"], r["spor_dali"], r["cinsiyet"] = "Unrivaled", "Basketbol", "Kadın"
            sayac["Unrivaled'a taşındı"] += 1
        if kw in BESIKTAS:
            r["organizasyon"], r["spor_dali"], r["cinsiyet"] = "Süper Lig", "Futbol", "Erkek"
            sayac["Beşiktaş futbola alındı"] += 1

        # spor=Çoklu/Jenerik olan organizasyon satırları org'dan türetilir
        if ent == "Lig/Organizasyon" and r.get("spor_dali") == "Çoklu/Jenerik":
            org = r.get("organizasyon","")
            esle = {"Şampiyonlar Ligi":"Futbol","Avrupa Ligi":"Futbol","Konferans Ligi":"Futbol",
                    "La Liga":"Futbol","Süper Lig":"Futbol","NBA":"Basketbol",
                    "EuroLeague":"Basketbol","MotoGP":"Motor Sporları","UFC":"Dövüş Sporları",
                    "Wimbledon":"Tenis","Voleybol":"Voleybol"}
            for anahtar, spor in esle.items():
                if anahtar.lower() in org.lower():
                    r["spor_dali"] = spor; sayac["Çoklu/Jenerik spor türetildi"] += 1; break

    g = d + ".tmp"
    with open(g, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(g, d)

print("TAKIM VE ORGANİZASYON DÜZELTMELERİ")
print("=" * 50)
for k, n in sayac.most_common(): print(f"  {k:<40}{n:>6}")

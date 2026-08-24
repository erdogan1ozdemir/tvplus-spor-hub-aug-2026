#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Faset tutarlılık denetimi ve düzeltmesi.
Yeniden çekim sonrası kaybolan doğrulama kolonlarını yeniden üretir,
varlık tipi ve organizasyon atamalarındaki tutarsızlıkları giderir."""
import csv, glob, re, sys
from collections import defaultdict

# Kulüp adı örüntüsü: oyuncu listesine sızan takım adlarını yakalar
KULUP = re.compile(r"\b(fc|cf|sc|sk|ac|as|afc|fk|f\.c\.|s\.l\.|sl|cd|ud|rc|bc|"
    r"united|city|rovers|athletic|atlético|atletico|madrid|barcelona|milan|inter|juventus|"
    r"napoli|roma|lazio|benfica|porto|ajax|celtic|rangers|rockets|lakers|warriors|celtics|"
    r"bulls|heat|nuggets|thunder|knicks|mavericks|suns|bucks|76ers|cavaliers|spurs|nets|"
    r"raptors|hawks|grizzlies|timberwolves|magic|pacers|kings|pelicans|pistons|"
    r"blazers|jazz|hornets|wizards|clippers|bankkart|halkbank|vakıfbank|eczacıbaşı|"
    r"efes|beko|daikin|galatasaray|fenerbahçe|beşiktaş|trabzonspor)\b", re.I)
KULUP_SON = re.compile(r"(spor|sk|fk|fc|afc|cf|sc)$", re.I)

# Organizasyonu spor dalıyla aynı olan dikeyler: gerçek organizatör adı atanır
ORG_DUZELT = {
    "At Yarışı": "TJK · At Yarışı",
    "Golf": "Golf Turnuvaları",
    "Hentbol": "Hentbol Ligleri",
}

def duzelt(dosya):
    with open(dosya, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    if not rows: return 0, 0
    for k in ("oyuncu_dogrulama", "faset_notu"):
        if k not in cols: cols.append(k)
    n_ent, n_org = 0, 0
    for r in rows:
        notlar = []
        kw = (r.get("keyword") or "").strip()
        ent = r.get("entity_tipi", "")

        # 1) Oyuncu listesine sızan kulüp adları
        if ent == "Oyuncu":
            ad = kw
            for suf in (" kimdir", " hangi takımda", " istatistik"):
                if ad.endswith(suf): ad = ad[:-len(suf)]
            son = ad.split()[-1] if ad.split() else ""
            if KULUP.search(ad) or KULUP_SON.search(son):
                r["entity_tipi"] = "Takım"
                r["oyuncu_dogrulama"] = "Kulüp adı (Takım'a taşındı)"
                notlar.append("varlık tipi Oyuncu→Takım")
                n_ent += 1
            elif len(ad.split()) < 2:
                r["oyuncu_dogrulama"] = "Tek kelime (doğrulanacak)"
            else:
                r["oyuncu_dogrulama"] = "Oyuncu"

        # 2) Organizasyon adı spor dalıyla aynıysa gerçek organizatöre çevir
        org, spor = r.get("organizasyon", ""), r.get("spor_dali", "")
        if org and org == spor and org in ORG_DUZELT:
            r["organizasyon"] = ORG_DUZELT[org]
            notlar.append(f"organizasyon '{org}' → '{ORG_DUZELT[org]}'")
            n_org += 1

        if notlar: r["faset_notu"] = "; ".join(notlar)
    with open(dosya, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    return n_ent, n_org

top_e = top_o = 0
for d in sorted(glob.glob("data/raw/hacim_*.csv")):
    if d.endswith("_elenen.csv"): continue
    e, o = duzelt(d)
    if e or o: print(f"  {d}: varlık tipi {e}, organizasyon {o} düzeltildi")
    top_e += e; top_o += o
print(f"\nTOPLAM: {top_e} varlık tipi, {top_o} organizasyon düzeltmesi")

# Denetim raporu
sorun = defaultdict(list)
for d in sorted(glob.glob("data/raw/hacim_*.csv")):
    if d.endswith("_elenen.csv"): continue
    with open(d, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            if r.get("veri_var") != "evet": continue
            org, spor = r.get("organizasyon",""), r.get("spor_dali","")
            if org and spor and org == spor: sorun["organizasyon = spor dalı"].append(org)
            if not r.get("entity_tipi"): sorun["varlık tipi boş"].append(r["keyword"])
            if not spor: sorun["spor dalı boş"].append(r["keyword"])
print("\nKALAN TUTARSIZLIKLAR:")
if not sorun: print("  yok")
for k, v in sorun.items():
    print(f"  {k}: {len(v)} kayıt · örnek: {sorted(set(v))[:5]}")

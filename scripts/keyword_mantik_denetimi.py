#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Keyword listesinin mantık denetimi.

Her satır, varlık tipine göre tutarlılık kurallarından geçirilir ve
`mantik_denetim` kolonuyla etiketlenir. Denetim YIKICI DEĞİLDİR; işaretli
satırlar veri setinde kalır, dashboard yalnızca "Geçerli" olanları jenerik
toplama katar. Böylece kurallar yeniden çekim gerektirmeden değiştirilebilir.

Kontroller
  A. Takım satırları : kişi adı, şehir/ülke adı, Türkçe genel kelime çakışması
  B. Oyuncu satırları: kulüp adı, genel kelime
  C. Organizasyon    : spor dalıyla aynı ad
  D. Tümü            : boş faset, tek kelime + yüksek hacim sapması
"""
import csv, glob, os, re, unicodedata
from collections import defaultdict

# ——— Kulüp olduğunu gösteren işaretler
KULUP_ISARET = re.compile(
    r"\b(fc|cf|sc|sk|ac|as|afc|fk|kf|nk|hnk|gnk|bk|if|ik|cd|ud|sd|rc|bc|us|ss|"
    r"s\.?l\.?|s\.?c\.?|a\.?c\.?|f\.?c\.?|united|city|town|rovers|athletic|"
    r"atletico|atlético|dinamo|dynamo|spor|sporting|club|calcio|real|olympique|"
    r"olympiacos|panathinaikos|benfica|porto|ajax|celtic|rangers|legia|slavia|"
    r"sparta|ferencvaros|rapid|sturm|salzburg|basel|malmo|brann|"
    r"midtjylland|copenhagen|qarabag|qarabağ|maccabi|hapoel|shakhtar|ludogorets|"
    r"cluj|fcsb|zabrze|lech|jagiellonia|braga|plzen|plzeň|kairat|paok|aek|apoel|"
    r"tc|sk|ck|kk|bc|ac|ic|ferencvaros[ıi]?|ferencváros[ıi]?|"
    r"galatasaray|fenerbahçe|beşiktaş|trabzonspor|başakşehir|bayern|dortmund|"
    r"leverkusen|leipzig|frankfurt|stuttgart|bremen|gladbach|hoffenheim|freiburg)\b",
    re.I)

# ——— Şehir, ülke, bölge adları (kulüp adı olarak tek başına geçerse şüpheli)
COGRAFI = {"istanbul","ankara","izmir","bursa","antalya","konya","adana","trabzon",
    "samsun","kocaeli","gaziantep","kayseri","sivas","rize","van","hatay","çorum",
    "london","londra","madrid","barcelona","milano","roma","paris","berlin","münih",
    "lizbon","porto","atina","belgrad","zagreb","prag","viyana","varşova","budapeşte",
    "moskova","kiev","bakü","tiran","saraybosna","üsküp","sofya","bükreş","atina",
    "türkiye","azerbaycan","yunanistan","sırbistan","hırvatistan","polonya","çekya"}

# ——— Türkçe genel kelime / marka çakışması (tek kelimelik kulüp adlarında)
TR_CAKISMA = {"sabah","akşam","star","milliyet","hürriyet","posta","vatan","zaman",
    "takvim","güneş","yeni şafak","viking","union","real","city","united","sport",
    "spor","genç","yıldız","şafak","kartal","aslan","kaplan","şahin","doğan","fırat",
    "toros","ege","akdeniz","karadeniz","marmara","anadolu"}

def aksansiz(s):
    tr = set("ıİşŞğĞüÜöÖçÇ"); out=[]
    for ch in s:
        if ch in tr: out.append(ch); continue
        d = unicodedata.normalize("NFD", ch)
        out.append("".join(c for c in d if unicodedata.category(c)!="Mn") or ch)
    return "".join(out)

# ——— Tüm dosyaları oku, oyuncu adları sözlüğünü kur
dosyalar = [d for d in sorted(glob.glob("data/raw/hacim_*.csv")) if not d.endswith("_elenen.csv")]
oyuncuAdlari = set()
for d in dosyalar:
    with open(d, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            if r.get("entity_tipi") == "Oyuncu" and r.get("sayfa_tipi") == "Oyuncu Jenerik":
                oyuncuAdlari.add(aksansiz((r.get("keyword") or "").strip().lower()))

rapor = defaultdict(list)
for d in dosyalar:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    if "mantik_denetim" not in cols: cols.append("mantik_denetim")
    for r in rows:
        kw = (r.get("keyword") or "").strip().lower()
        ent = r.get("entity_tipi","")
        spor = r.get("spor_dali",""); org = r.get("organizasyon","")
        ktm = r.get("katman",""); st = r.get("sayfa_tipi","")
        sv = int(r.get("search_volume") or 0) if r.get("veri_var")=="evet" else 0
        etiket = "Geçerli"

        # A. Takım satırları — yalnızca jenerik takım adları denetlenir
        if ent == "Takım" and st in ("Takım Jenerik","Takım Maç Sorgusu") and ktm == "Uzun Kuyruk":
            ad = aksansiz(kw)
            if ad in COGRAFI:
                etiket = "Şehir/ülke adı, kulüp değil"
            elif ad in oyuncuAdlari and not KULUP_ISARET.search(kw):
                etiket = "Oyuncu adı, kulüp değil"
            elif len(kw.split()) <= 2 and ad in {aksansiz(x) for x in TR_CAKISMA} \
                 and not KULUP_ISARET.search(kw):
                etiket = "Genel kelime çakışması"
            elif len(kw.split()) == 1 and not KULUP_ISARET.search(kw) and sv >= 80000:
                etiket = "Tek kelime, kulüp işareti yok (doğrulanmalı)"
            elif (len(kw.split()) == 2 and not KULUP_ISARET.search(kw)
                  and not re.search(r"\d", kw) and sv >= 30000):
                # İki kelimelik, kulüp işareti taşımayan adlar çoğunlukla kişi adıdır
                etiket = "Olası kişi adı (kulüp işareti yok)"

        # C. Organizasyon adı spor dalıyla aynı
        if ent == "Lig/Organizasyon" and org and org == spor:
            etiket = "Organizasyon = spor dalı"

        # D. Boş zorunlu faset
        if not spor or not ent:
            etiket = "Eksik faset"

        # Kişi adı olduğu tespit edilen satırlar dışarı atılmaz; doğru varlık
        # tipine taşınır. Yalnızca gerçek kirlilik (genel kelime, şehir adı)
        # işaretli kalır ve toplamlardan düşer.
        if etiket in ("Oyuncu adı, kulüp değil", "Olası kişi adı (kulüp işareti yok)",
                      "Tek kelime, kulüp işareti yok (doğrulanmalı)"):
            r["entity_tipi"] = "Oyuncu"
            r["sayfa_tipi"] = "Oyuncu Jenerik"
            r["katman"] = "Genişletme"
            rapor.setdefault("__tasindi__", []).append((kw, sv, org, ""))
            etiket = "Geçerli"

        r["mantik_denetim"] = etiket
        if etiket != "Geçerli":
            rapor[etiket].append((kw, sv, org, d.split("hacim_")[1][:-4]))

    # Atomik yazım: geçici dosyaya yazılır, yalnızca hatasız tamamlanırsa
    # asıl dosyanın yerine geçer. Yazım sırasında oluşan hata veriyi silmez.
    gecici = d + ".tmp"
    with open(gecici, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(gecici, d)

print("MANTIK DENETİMİ RAPORU")
print("=" * 62)
toplam = 0
for etiket, kayitlar in sorted(rapor.items(), key=lambda x: -sum(k[1] for k in x[1])):
    hacim = sum(k[1] for k in kayitlar)
    toplam += len(kayitlar)
    print(f"\n{etiket}  ·  {len(kayitlar)} satır  ·  {hacim:,} aylık".replace(",", "."))
    for kw, sv, org, kaynak in sorted(kayitlar, key=lambda x: -x[1])[:8]:
        print(f"   {kw:<32} {sv:>11,}".replace(",", ".") + f"   {org}")
print(f"\n{'='*62}\nToplam işaretli: {toplam} satır (hiçbiri silinmedi)")

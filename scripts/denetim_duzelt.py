#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Denetim bulgularının veri tarafındaki düzeltmeleri.

Yıkıcı değildir: hiçbir satır silinmez. Kirlilik `mantik_denetim` kolonuyla
işaretlenir ve derleme sırasında toplamlardan düşer; faset hataları yerinde
düzeltilir. Atomik yazım kullanılır.
"""
import csv, glob, os, re, unicodedata
from collections import Counter, defaultdict

DOSYALAR = [d for d in sorted(glob.glob("data/raw/hacim_*.csv"))
            if not d.endswith("_elenen.csv")]
sayac = Counter()

# ——————————————————————————————— 1) Süper Lig 2026-27 sezon güncellemesi
DUSEN   = {"antalyaspor", "kayserispor", "fatih karagümrük", "karagümrük"}
CIKAN   = {"erzurumspor", "erzurumspor fk", "amed sportif", "amedspor", "çorum fk", "çorum"}

# ——————————————————————————————— 2) Yurt dışındaki Türk sporcular
TURK_SPORCU = {
    "arda güler","kenan yıldız","hakan çalhanoğlu","alperen şengün","can uzun",
    "ferdi kadıoğlu","altay bayındır","deniz undav","berke özer","adem bona",
    "zeki çelik","ozan kabak","enes ünal","yusuf yazıcı","atakan karazor",
    "suat serdar","emre can","cengiz ünder","orkun kökçü","merih demiral",
    "kaan ayhan","çağlar söyüncü","ömer yurtseven","cedi osman","furkan korkmaz",
    "sehmus hazer","salih özcan","ahmed kutucu","bertuğ yıldırım","kerem aktürkoğlu",
    "irfan can kahveci","ilkay gündoğan","yunus akgün","barış alper yılmaz",
}

# ——————————————————————————————— 3) Kulüp olmayan varlıklar
COGRAFI = {"istanbul","madrid","dublin","zagreb","riga","bratislava","budapest",
    "sofia","tbilisi","baku","salzburg","gibraltar","craiova","reykjavík","porto riko",
    "berlin","milano","frankfurt","dortmund","washington","kuzey makedonya","makedonya",
    "kuzey kaliforniya","bosnia and herzegovina","the bahamas","united states"}
MEDYA = re.compile(r"(nbc sports|sky sports|sky news|universal pictures|pacific data|"
    r"illumination|nba tv|usa network|style network|wayback machine|liga acb|"
    r"menora mivtachim|philips arena|draft tarihi)", re.I)
NCAA  = re.compile(r"(men's basketball|women's basketball|wolves|bulldogs|falcons|"
    r"wildcats|bruins|orange|tigers|thunderwolves|rainbow warriors)", re.I)
HAKEM = {"michael oliver","szymon marciniak","serdar gözübüyük","joão pinheiro",
         "davide massa","clement turpin","daniele orsato","felix zwayer"}
STADYUM = re.compile(r"(stadion|stadyum|arena|estádio|estadio|park$|pole$)", re.I)
COP    = re.compile(r"^utc[+\-]", re.I)

# ——————————————————————————————— 4) Emekli oyuncular ve teknik adamlar
OYUNCU_DEGIL = {
    "sergen yalçın","arda turan","nihat kahveci","rıdvan dilmen","gökhan keskin",
    "metin tekin","metin diyadin","hedo türkoğlu","mehmet okur","enes kanter freedom",
    "sarunas jasikevicius","nando de colo","michael jordan","kermit washington",
    "frank ramsey","kelvin ransey","thomas hamilton","jack nichols","alex english",
    "cozell mcqueen","tom hoover","goo kennedy","sherman douglas","gilbert arenas",
    "allan houston","tina charles","ergin ataman","okan buruk","fatih tekke",
}

# ——————————————————————————————— 5) Mükerrer yazımlar (ikincil → birincil)
MUKERRER = {
    "muhammed salah":"mohamed salah", "arseni batagov":"arseniy batagov",
    "saud abdulhamid":"suud abdülhamid", "ruslan malinovski":"ruslan malinovskyi",
    "darius carutasu":"darius karutasu", "chris woods":"chris wood",
}

def tr_kucult(x):
    return (x or "").translate(str.maketrans({"İ":"i","I":"ı","Ş":"ş","Ğ":"ğ",
                                              "Ü":"ü","Ö":"ö","Ç":"ç"})).lower()

# ——— Tek kelime varyantı kirliliği: ana ada göre hacim oranı
anaHacim, tekKelime = {}, []
for d in DOSYALAR:
    for r in csv.DictReader(open(d, encoding="utf-8-sig")):
        if r.get("veri_var") != "evet": continue
        kw = tr_kucult((r.get("keyword") or "").strip())
        sv = int(r.get("search_volume") or 0)
        if r.get("sayfa_tipi") == "Oyuncu Jenerik":
            anaHacim[kw] = max(anaHacim.get(kw, 0), sv)

MONONIM = {"ederson","rodri","rodrygo","pedri","gavi","raphinha","endrick","antony",
    "richarlison","alisson","marquinhos","vitinha","talisca","casemiro","fabinho",
    "willian","fred","hulk","neymar","vinicius","militao","eder","danilo","bruno"}

for d in DOSYALAR:
    with open(d, encoding="utf-8-sig") as f:
        rd = csv.DictReader(f); rows = list(rd); cols = list(rd.fieldnames)
    for c in ("mantik_denetim", "faset_notu"):
        if c not in cols: cols.append(c)

    for r in rows:
        kw   = tr_kucult((r.get("keyword") or "").strip())
        ana  = tr_kucult((r.get("oyuncu_ana_ad") or "").strip())
        ent  = r.get("entity_tipi", "")
        org  = r.get("organizasyon", "")
        sv   = int(r.get("search_volume") or 0) if r.get("veri_var") == "evet" else 0
        not_ = []

        # 1) Sezon güncellemesi
        kulupAdi = ana or kw.split(" maç")[0].split(" puan")[0].split(" fikstür")[0]
        if org == "Süper Lig" and any(kulupAdi.startswith(x) for x in DUSEN):
            r["organizasyon"] = "TFF 1. Lig"; r["lig_seviyesi"] = "2. Seviye"
            not_.append("2026-27 küme düşmesi"); sayac["küme düşmesi uygulandı"] += 1
        elif org == "TFF 1. Lig" and any(kulupAdi.startswith(x) for x in CIKAN):
            r["organizasyon"] = "Süper Lig"; r["lig_seviyesi"] = "1. Seviye"
            not_.append("2026-27 yükselme"); sayac["yükselme uygulandı"] += 1

        # 2) Türk sporcu işareti
        if ent == "Oyuncu" and (ana in TURK_SPORCU or kw in TURK_SPORCU):
            if r.get("turk_baglantisi") != "Türk Sporcu Var":
                r["turk_baglantisi"] = "Türk Sporcu Var"; sayac["Türk sporcu işaretlendi"] += 1

        # 3) İmkânsız kombinasyon: bir ligin seviyesi kıta üstü olamaz
        if r.get("musabaka_tipi") == "Lig" and r.get("lig_seviyesi") == "Kıta Üstü":
            r["musabaka_tipi"] = "Kıta Turnuvası"
            not_.append("lig → kıta turnuvası"); sayac["imkânsız kombinasyon düzeltildi"] += 1

        # 4) Kulüp/oyuncu olmayan varlıklar
        etiket = None
        if ent in ("Takım", "Oyuncu"):
            if COP.match(kw):                      etiket = "Çöp kayıt (saat dilimi)"
            elif kw in COGRAFI:                    etiket = "Şehir/ülke adı, varlık değil"
            elif MEDYA.search(kw):                 etiket = "Medya veya kurum markası"
            elif NCAA.search(kw):                  etiket = "NCAA üniversite takımı"
            elif kw in HAKEM:                      etiket = "Hakem adı, oyuncu değil"
            elif STADYUM.search(kw) and len(kw.split()) >= 2: etiket = "Stadyum adı"
        if ent == "Oyuncu" and (kw in OYUNCU_DEGIL or ana in OYUNCU_DEGIL):
            etiket = "Aktif oyuncu değil (emekli veya teknik adam)"
        if kw in MUKERRER:
            etiket = f"Mükerrer yazım ({MUKERRER[kw]} ile aynı kişi)"

        # 5) Tek kelime varyantı: ana adın hacminden aşırı sapıyorsa kirlilik
        if (not etiket and ent == "Oyuncu" and ana and ana != kw
                and " " not in kw and kw not in MONONIM):
            temel = anaHacim.get(ana, 0)
            if sv >= 50000 and (temel == 0 or sv > temel * 5):
                etiket = "Tek kelime varyantı, ana addan sapıyor"

        if etiket:
            r["mantik_denetim"] = etiket
            sayac[etiket] += 1
        elif not (r.get("mantik_denetim") or "").strip():
            r["mantik_denetim"] = "Geçerli"

        # 6) Kulüp adı yazımı tekilleştirilir
        if r.get("kulup"): r["kulup"] = tr_kucult(r["kulup"]).strip()

        if not_: r["faset_notu"] = " · ".join(not_)

    gecici = d + ".tmp"
    with open(gecici, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)
    os.replace(gecici, d)

print("DENETİM DÜZELTMELERİ")
print("=" * 58)
for k, n in sayac.most_common():
    print(f"  {k:<48}{n:>6}")

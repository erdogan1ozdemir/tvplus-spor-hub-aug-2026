#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Güncel kadroları Transfermarkt'tan çeker.

Wikipedia bazı kulüplerde güncel kadro tablosu taşımıyor ve çıkarım tarihî
listelere düşüyordu (Konyaspor'da 1990'ların futbolcuları gibi). Transfermarkt
her kulüp için güncel kadro sayfası yayınladığından birincil kaynak olarak alınır.

Akış: kulüp adı -> hızlı arama -> verein id -> /kader/verein/<id> -> oyuncu adları.
İstekler önbelleğe alınır ve aralarına bekleme konur.
"""
import csv, json, os, re, html, subprocess, sys, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor

CACHE = "data/raw/_tm_cache"
os.makedirs(CACHE, exist_ok=True)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
BEKLE = 1.2

def getir(url, anahtar):
    yol = os.path.join(CACHE, re.sub(r"[^a-z0-9]+", "_", anahtar.lower())[:120] + ".html")
    if os.path.exists(yol):
        return open(yol, encoding="utf-8", errors="replace").read()
    time.sleep(BEKLE)
    r = subprocess.run(["curl", "-sL", "--max-time", "35", "-A", UA,
                        "-H", "Accept-Language: tr-TR,tr;q=0.9", url], capture_output=True)
    s = r.stdout.decode("utf-8", errors="replace")
    if len(s) > 5000:
        open(yol, "w", encoding="utf-8").write(s)
    return s

# Arama sonuçları lig adıyla birlikte döner; doğru kulübü seçmek için lig ipucu kullanılır
LIG_IPUCU = {
    "Süper Lig":"süper lig", "TFF 1. Lig":"1. lig", "La Liga":"laliga",
    "Serie A":"serie a", "Premier Lig":"premier league", "Bundesliga":"bundesliga",
    "Ligue 1":"ligue 1",
}
# Kısa adı birden çok kulüple çakışan takımlar için tam arama terimi
ALIAS = {
    # Yalnızca kısa adı başka kulüple çakışanlar
    "milan":"AC Milan", "inter":"Inter Mailand", "roma":"AS Roma",
    "lazio":"Lazio Rom", "napoli":"SSC Neapel", "juventus":"Juventus Turin",
}
def kulup_id(ad, lig=None):
    arama = ALIAS.get(ad.lower(), ad)
    s = getir("https://www.transfermarkt.com.tr/schnellsuche/ergebnis/schnellsuche?query="
              + urllib.parse.quote(arama), "ara_" + arama)
    ipucu = LIG_IPUCU.get(lig or "", "")
    adaylar = []
    # Her satırda kulüp linki ve devamında lig adı yer alır
    for m in re.finditer(r'href="(/[^"]*)/startseite/verein/(\d+)"[^>]*>([^<]{2,50})<', s):
        slug, vid, txt = m.group(1), m.group(2), html.unescape(m.group(3)).strip()
        t = txt.lower()
        if re.search(r"(u\d{2}|altyapı|youth|\bii\b|b takım|futuro|academy|kadın)", t): continue
        civar = s[m.end(): m.end()+700].lower()
        skor = 0
        if ipucu and ipucu in civar: skor += 10
        if t == arama.lower(): skor += 8
        if t == ad.lower(): skor += 5
        if ad.lower() in t or arama.lower() in t: skor += 2
        adaylar.append((skor, slug.strip("/"), vid, txt))
    if not adaylar: return None, None
    adaylar.sort(key=lambda x: -x[0])
    return adaylar[0][1], adaylar[0][2]

def kadro(ad, lig=None):
    slug, vid = kulup_id(ad, lig)
    if not vid: return []
    s = getir(f"https://www.transfermarkt.com.tr/{slug}/kader/verein/{vid}", f"kadro_{ad}")
    oy = []
    # Oyuncu adı portre görselinin title özniteliğinde yer alır
    for m in re.finditer(r'<img[^>]+class="bilderrahmen-fixed[^"]*"[^>]*title="([^"]+)"', s):
        t = html.unescape(m.group(1)).strip()
        if t and t not in oy: oy.append(t)
    if len(oy) < 5:   # yedek desen: profil linkinin metni
        # Bu desen Transfermarkt'in kisa ad gosterimini de yakaliyor ve tek
        # kelimelik soyadlar uretebiliyordu. Tek kelimelik kayitlar denetimde
        # surekli jenerik cikti (ortak kelime, yer adi, marka), bu yuzden
        # burada da tam ad sarti aranir.
        for m in re.finditer(r'href="/[^"]+/profil/spieler/\d+"[^>]*>\s*([^<]{2,40})', s):
            t = html.unescape(m.group(1)).strip()
            if t and " " in t and t not in oy: oy.append(t)
    return oy

if __name__ == "__main__":
    # Çekirdek kulüpler seed_takimlar.csv'den alınır
    kulupler = []
    with open("data/raw/seed_takimlar.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["katman"] == "Çekirdek" and r["sayfa_tipi"] == "Takım Jenerik":
                kulupler.append((r["keyword"], r["organizasyon"], r["spor_dali"],
                                 r["cografya"], r["yayin_hakki"]))
    print(f"{len(kulupler)} kulüp Transfermarkt'tan çekilecek…", file=sys.stderr)

    sonuc = {}
    def isle(t):
        ad = t[0]
        try: return ad, t, kadro(ad, t[1])
        except Exception: return ad, t, []
    with ThreadPoolExecutor(max_workers=3) as ex:
        for i, (ad, t, oy) in enumerate(ex.map(isle, kulupler), 1):
            sonuc[ad] = (t, oy)
            if i % 20 == 0: print(f"   {i}/{len(kulupler)}", file=sys.stderr)

    bulunan = {k: v for k, v in sonuc.items() if len(v[1]) >= 8}
    print(f"\nKadro bulunan kulüp: {len(bulunan)}/{len(kulupler)}")
    toplam = sum(len(v[1]) for v in bulunan.values())
    print(f"Toplam oyuncu kaydı: {toplam}")
    eksik = [k for k, v in sonuc.items() if len(v[1]) < 8]
    if eksik: print(f"Kadro bulunamayan ({len(eksik)}): {eksik[:15]}")

    with open("data/raw/_kadro_tm.json", "w", encoding="utf-8") as f:
        json.dump({k: {"meta": list(v[0]), "oyuncular": v[1]} for k, v in bulunan.items()},
                  f, ensure_ascii=False, indent=1)
    print("Çıktı: data/raw/_kadro_tm.json")

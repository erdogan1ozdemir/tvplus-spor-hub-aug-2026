#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Basketbol ve voleybol kulüplerinin güncel kadroları.

Kaynak: Wikipedia makale sayfaları (/wiki/ yolu; robots.txt yalnızca /w/ ve
/api/ yollarını kapatır). Transfermarkt futbol dışını kapsamadığı için bu iki
spor dalı buradan alınır. Kadro tablosu, forma numarası sütunu taşıyan tablo
olarak tespit edilir; böylece "eski oyuncular" ve "efsaneler" bölümleri dışarıda
kalır.
"""
import json, re, html, subprocess, sys, time, os
from concurrent.futures import ThreadPoolExecutor

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
CACHE = "data/raw/_wiki_kadro_cache"
os.makedirs(CACHE, exist_ok=True)

# Oyuncu olmayan bağlantılar
ELE = re.compile(r"^(#|/wiki/(File|Dosya|Category|Kategori|Help|Special|Template|"
                 r"Wikipedia|Portal|List_of|Liste)|https?://)", re.I)
POZ = re.compile(r"^(PG|SG|SF|PF|C|G|F|G/F|F/C|Guard|Forward|Center|Pasör|Libero|"
                 r"Orta|Smaçör|Pasör Çaprazı|Köşe)$", re.I)
ULKE = re.compile(r"^(Türkiye|United States|Amerika|Sırbistan|Serbia|Fransa|France|"
                  r"İspanya|Spain|Almanya|Germany|İtalya|Italy|Yunanistan|Greece)$", re.I)

def cek(baslik):
    yol = os.path.join(CACHE, re.sub(r"[^\w.-]", "_", baslik)[:120] + ".html")
    if os.path.exists(yol):
        return open(yol, encoding="utf-8", errors="replace").read()
    for alan in ("en", "tr"):
        url = f"https://{alan}.wikipedia.org/wiki/" + baslik.replace(" ", "_")
        r = subprocess.run(["curl", "-sL", "-A", UA, "-m", "35", url],
                           capture_output=True, text=True)
        if r.returncode == 0 and len(r.stdout) > 8000 and "Wikipedia does not have" not in r.stdout:
            open(yol, "w", encoding="utf-8").write(r.stdout)
            time.sleep(0.4)
            return r.stdout
        time.sleep(0.4)
    return ""

BASLIK_OYUNCU = re.compile(
    r"^\s*(Player|Oyuncu|Name|İsim|Sporcu|Futbolcu|"
    r"Ad[ıi]?[\s.-]*Soyad[ıi]?|Soyad[ıi]?[\s.-]*(Ad[ıi]?|İsm[ıi]))\s*$", re.I)
# Başlıkta soyad öne yazılmışsa iki parçalı adlar ters çevrilir
SOYAD_ONCE = re.compile(r"^\s*Soyad", re.I)
# Kadro dışı kişi tabloları (kaptanlar, antrenörler) bu başlıklarla ayıklanır
BASLIK_DISI = re.compile(r"(Kaptan|Antren[öo]r|Ba[şs]kan|Y[öo]netici|Tarih|Sezon)", re.I)
LINK = re.compile(r'<a[^>]+href="[^"]*/wiki/([^"#]+)"[^>]*>(.*?)</a>', re.S)
SAYI = re.compile(r"^\s*(?:<[^>]+>\s*)*\d{1,2}\s*(?:<|$)")

def _temiz(x):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", x)).strip()

# Tablonun hemen üstündeki bölüm başlığı. Teknik ekip, emekli forma numarası
# ve onur listesi tabloları da forma numarası sütunu taşıdığı için yalnızca
# tablo yapısına bakmak yetmiyordu; bölüm başlığıyla eleniyorlar.
BOLUM_DISI = re.compile(
    r"(teknik|antren[öo]r|staff|coach|y[öo]netim|ba[şs]kan|emekli|retired|"
    r"onur|honou?r|efsane|legend|hall of fame|ba[şs]ar|honours|kadro d[ıi][şs]i)", re.I)

def _bolum_basligi(h, konum):
    """Verilen konumdan geriye doğru en yakın başlığı döndürür."""
    onceki = h[max(0, konum - 4000):konum]
    basliklar = re.findall(r"<h[2-4][^>]*>(.*?)</h[2-4]>", onceki, re.S)
    return _temiz(basliklar[-1]) if basliklar else ""

def kadro(baslik):
    """Kadro tablosunu başlık satırındaki oyuncu sütunundan okur."""
    h = cek(baslik)
    if not h: return []
    for m_tab in re.finditer(r"<table[^>]*>.*?</table>", h, re.S):
        tablo = m_tab.group(0)
        if BOLUM_DISI.search(_bolum_basligi(h, m_tab.start())): continue
        satirlar = re.findall(r"<tr[^>]*>(.*?)</tr>", tablo, re.S)
        if len(satirlar) < 5: continue

        # Oyuncu sütununun indeksi başlık satırından alınır
        idx = basSatir = None; soyadOnce = False
        for i, s in enumerate(satirlar[:3]):
            hucre = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", s, re.S)
            for j, c in enumerate(hucre):
                bas = _temiz(c)
                if BASLIK_OYUNCU.match(bas):
                    idx, basSatir, soyadOnce = j, i, bool(SOYAD_ONCE.match(bas)); break
            if idx is not None: break
        if idx is None: continue

        # Kaptan / antrenör listeleri kadro sayılmaz
        if any(BASLIK_DISI.search(_temiz(c))
               for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", satirlar[basSatir], re.S)): continue

        # Forma numarası olan tablolar doğrulanır; numarasız kadro tabloları da
        # (Oyuncu / Doğum yılı / Pozisyon düzeni) kabul edilir
        numarali = [s for s in satirlar
                    if any(SAYI.match(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", s, re.S))]
        veriSatir = numarali if len(numarali) >= 4 else satirlar[basSatir+1:]
        if len(veriSatir) < 4: continue

        oyuncular, gorulen = [], set()
        for s in veriSatir:
            hucre = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", s, re.S)
            if idx >= len(hucre): continue
            # Hücrenin ilk bağlantısı çoğu zaman bayrak ikonudur; metni olan
            # ilk bağlantı oyuncu adını taşır.
            ad = ""
            for m in LINK.finditer(hucre[idx]):
                aday = _temiz(m.group(2))
                if aday and not re.match(r"(File|Dosya|Image):", m.group(1), re.I):
                    ad = aday; break
            if not ad: ad = _temiz(re.sub(r"<a[^>]*>\s*<img[^>]*>\s*</a>", "", hucre[idx]))
            ad = re.sub(r"\s*\((basketball|footballer|volleyball|born[^)]*)\)$", "", ad, flags=re.I)
            ad = re.sub(r"\[[a-z0-9]{1,3}\]", "", ad)      # Wikipedia dipnotu
            ad = re.sub(r"\s*\((K|C|c)\)\s*$", "", ad)      # kaptan rozeti
            ad = re.sub(r"[*†‡§#]+$", "", ad).strip()
            # Türkçe sayfalar sıralanabilir "Soyad, Ad" biçimi kullanır
            if "," in ad:
                soy, _, on = ad.partition(",")
                if on.strip(): ad = f"{on.strip()} {soy.strip()}"
            elif soyadOnce:
                p = ad.split()
                if len(p) >= 2: ad = " ".join(p[1:] + p[:1])
            # Tümü büyük harfli kaynaklar başlık düzenine çevrilir
            if ad.isupper(): ad = ad.title()
            if len(ad) < 4 or len(ad) > 42 or not re.search(r"\s", ad): continue
            if ad.lower() in gorulen: continue
            gorulen.add(ad.lower()); oyuncular.append(ad)
        if len(oyuncular) >= 4: return oyuncular

    # Yedek yol: başlık satırı olmayan kadro tabloları. Satır "forma numarası +
    # kişi adı" düzenindeyse ikinci hücre oyuncu adı kabul edilir.
    for m_tab in re.finditer(r"<table[^>]*>.*?</table>", h, re.S):
        tablo = m_tab.group(0)
        if BOLUM_DISI.search(_bolum_basligi(h, m_tab.start())): continue
        satirlar = re.findall(r"<tr[^>]*>(.*?)</tr>", tablo, re.S)
        if len(satirlar) < 6: continue
        oyuncular, gorulen = [], set()
        for s in satirlar:
            hucre = [_temiz(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", s, re.S)]
            if len(hucre) < 3 or not re.fullmatch(r"\d{1,2}", hucre[0]): continue
            ad = re.sub(r"[*†‡§#]+$", "", hucre[1]).strip()
            if ad.isupper(): ad = ad.title()
            if len(ad) < 4 or len(ad) > 42 or not re.search(r"\s", ad): continue
            if re.search(r"\d", ad) or ad.lower() in gorulen: continue
            gorulen.add(ad.lower()); oyuncular.append(ad)
        if len(oyuncular) >= 6: return oyuncular
    return []

if __name__ == "__main__":
    kanon = json.load(open("data/raw/_kadro_kanon.json", encoding="utf-8"))
    hedefler = sys.argv[1:] or list(kanon)
    print(f"{len(hedefler)} kulüp taranıyor…", file=sys.stderr)
    sonuc = {}
    def isle(ad):
        try:
            for aday in kanon[ad].get("adaylar") or [kanon[ad]["wiki"]]:
                oy = kadro(aday)
                if oy: return ad, oy
            return ad, []
        except Exception as e: return ad, []
    with ThreadPoolExecutor(max_workers=3) as ex:
        for i, (ad, oy) in enumerate(ex.map(isle, hedefler), 1):
            sonuc[ad] = oy
            if i % 10 == 0: print(f"   {i}/{len(hedefler)}", file=sys.stderr)
    bulunan = {k: v for k, v in sonuc.items() if v}
    print(f"\nKadro bulunan: {len(bulunan)}/{len(hedefler)}  ·  toplam oyuncu {sum(len(v) for v in bulunan.values())}")
    for k, v in list(bulunan.items())[:4]:
        print(f"  {k:<30} {len(v):>3} → {', '.join(v[:5])}")
    bos = [k for k, v in sonuc.items() if not v]
    if bos: print(f"\nKadro bulunamayan ({len(bos)}): {', '.join(bos[:14])}")
    # Tek kulüple çalıştırıldığında dosyanın tamamı o kulüple değişmemeli;
    # önceki sonuçlar korunur ve yalnızca taranan kulüpler güncellenir.
    cikti = "data/raw/_kadro_bv.json"
    onceki = {}
    if os.path.exists(cikti):
        try: onceki = json.load(open(cikti, encoding="utf-8"))
        except Exception: onceki = {}
    onceki.update({k: {"kadro": v, **kanon[k]} for k, v in sonuc.items() if v})
    gecici = cikti + ".tmp"
    with open(gecici, "w", encoding="utf-8") as f:
        json.dump(onceki, f, ensure_ascii=False, indent=1)
    os.replace(gecici, cikti)
    print(f"dosyadaki toplam kulup: {len(onceki)}")

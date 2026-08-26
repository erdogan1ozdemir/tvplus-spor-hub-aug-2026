#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cekirdek kuluplerin kadrolarini Wikipedia'dan cikarir, oyuncu keyword evrenini kurar.
Akis: kulup adi -> Wikipedia arama -> 'Kadro' bolumu -> oyuncu wikilink'leri."""
import json, subprocess, urllib.parse, re, csv, os, sys, time
from concurrent.futures import ThreadPoolExecutor

CACHE = "data/raw/_wiki_cache"
os.makedirs(CACHE, exist_ok=True)

def api(params, lang="tr"):
    key = os.path.join(CACHE, re.sub(r"[^a-z0-9]+", "_", (lang+json.dumps(params,sort_keys=True)).lower())[:150]+".json")
    if os.path.exists(key):
        try: return json.load(open(key, encoding="utf-8"))
        except Exception: pass
    q = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items())
    url = f"https://{lang}.wikipedia.org/w/api.php?{q}&format=json&formatversion=2"
    for deneme in range(4):
        r = subprocess.run(["curl","-sS","--max-time","45","-A",
                            "TVplus-research/1.0 (contact: erdogan.ozdemir@inbound.com.tr)", url],
                           capture_output=True, text=True)
        try:
            d = json.loads(r.stdout)
            if d.get("error") or (not d.get("parse") and not d.get("query")):
                raise ValueError("bos yanit")
            json.dump(d, open(key,"w",encoding="utf-8")); return d
        except Exception:
            time.sleep(2 + 3*deneme)
    return {}

POZ = {"kaleci","defans","stoper","bek","orta saha","forvet","kanat","teknik direktör",
       "santrafor","libero","pasör","smaçör","oyun kurucu","guard","forvet oyuncusu","pivot"}
STOP_RE = re.compile(
    r"(futbol|basketbol|voleybol|takım|kulüb|club|ligi|league|sezon|season|stadyum|stadium|"
    r"kategori|şablon|template|liste|list of|milli|national|federasyon|federation|transfer|"
    r"kadro|squad|antrenör|teknik|kural|rule|şampiyona|championship|kupa|cup|\bF\.?K\b|"
    r"\bS\.?K\b|\bFC\b|\bA\.?Ş\b|derbi|puan|sıralama)", re.I)

POZISYON = {"kaleci","defans","stoper","bek","orta saha","forvet","kanat","santrafor",
    "libero","pasör","smaçör","oyun kurucu","guard","pivot","teknik direktör","menajer",
    "antrenör","kaptan","goalkeeper","defender","midfielder","forward","captain",
    "sağ bek","sol bek","ön libero","orta saha oyuncusu"}

def _oyuncular_html(html_):
    """Guncel kadro satirlarindan oyuncu adlarini cikarir.

    Kritik sart: satirda forma numarasi bulunmalidir. Tarihi kadro listelerinde
    numara sutunu yoktur; bu sart eski oyuncularin listeye sizmasini engeller.
    """
    oy = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", html_, re.S):
        if not re.search(r">\s*\d{1,2}\s*<", tr):   # forma numarasi yoksa atla
            continue
        for l in re.findall(r'<a[^>]+href="/wiki/([^"#:]+)"', tr):
            ad = urllib.parse.unquote(l).replace("_", " ")
            ad = re.sub(r"\s*\([^)]*\)", "", ad).strip()
            dl = ad.lower()
            if dl in POZISYON or STOP_RE.search(ad): continue
            if not (1 < len(ad.split()) < 5): continue
            if not (4 < len(ad) < 40): continue
            oy.append(ad)
    return list(dict.fromkeys(oy))

def kadro(kulup, lang="tr", ek="futbol takımı kadro"):
    d = api({"action":"query","list":"search","srsearch":f"{kulup} {ek}","srlimit":3}, lang)
    hits = d.get("query",{}).get("search", [])
    if not hits: return []
    hedefler = ["kadro","güncel kadro","a takım kadrosu","squad","current squad",
                "first-team squad","first team squad","roster","current roster"]
    for h in hits[:2]:
        t = h["title"]
        ds = api({"action":"parse","page":t,"prop":"sections","redirects":1}, lang)
        mevcut = {x["line"].strip().lower(): x for x in ds.get("parse",{}).get("sections",[])}
        for hh in hedefler:
            x = mevcut.get(hh)
            if not x: continue
            dt = api({"action":"parse","page":t,"prop":"text","section":x["index"],"redirects":1}, lang)
            oy = _oyuncular_html(dt.get("parse",{}).get("text",""))
            if len(oy) >= 10:      # guncel kadro esigi
                return oy
    return []

# cekirdek kulupler (seed_takimlar.csv'den, yalniz Takim Jenerik satirlari)
kulupler = []
with open("data/raw/seed_takimlar.csv", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        if r["katman"]=="Çekirdek" and r["sayfa_tipi"]=="Takım Jenerik":
            kulupler.append((r["keyword"], r["organizasyon"], r["spor_dali"],
                             r["cografya"], r["yayin_hakki"]))
print(f"{len(kulupler)} kulup icin kadro cekilecek...", file=sys.stderr)

sonuc = {}
def isle(item):
    ad, org, spor, cog, hak = item
    lang = "tr"
    ek = {"Futbol":"futbol takımı kadro","Basketbol":"basketbol takımı kadro",
          "Voleybol":"voleybol takımı kadro"}.get(spor,"kadro")
    oy = kadro(ad, lang, ek)
    if not oy:
        oy = kadro(ad, "en", "squad" if spor=="Futbol" else "roster")
    return ad, org, spor, cog, hak, oy

with ThreadPoolExecutor(max_workers=3) as ex:
    for i,(ad,org,spor,cog,hak,oy) in enumerate(ex.map(isle, kulupler), 1):
        sonuc[ad]=(org,spor,cog,hak,oy)
        if i % 20 == 0: print(f"   {i}/{len(kulupler)}", file=sys.stderr)

VAR = [("{}","Oyuncu Jenerik","Bilgi"), ("{} kimdir","Oyuncu Bilgi","Bilgi"),
       ("{} hangi takımda","Oyuncu Bilgi","Bilgi"), ("{} istatistik","İstatistik","Bilgi")]
rows, seen, elenen = [], set(), []
for ad,(org,spor,cog,hak,oy) in sonuc.items():
    for p in oy:
        pl = p.strip().lower()
        if len(pl) < 4 or pl in seen: continue
        # Tek kelimelik kayitlar denetimlerde agirlikla jenerik cikti: kadro
        # sayfasindan oyuncu adi yerine ortak kelime, yer adi ya da pozisyon
        # adi aliniyordu (features, forward, battle, eagles, parlak, saglam).
        # Ancak hepsi cop degil: Brezilyali oyuncularin buyuk bolumu tek adla
        # oynuyor (ederson, talisca, fabinho). Bu yuzden elenmez, denetime
        # yonlendirilir; karar mantik denetimi asamasinda verilir.
        tek_kelime = len(pl.split()) < 2
        if tek_kelime: elenen.append((ad, pl))
        seen.add(pl)
        for tmpl, st_, it_ in VAR:
            kw = tmpl.format(pl)
            wc = len(kw.split())
            rows.append({"keyword":kw,"organizasyon":org,"spor_dali":spor,"musabaka_tipi":"Lig",
                "lig_seviyesi":"1. Seviye","prestij_katmani":"Çekirdek",
                "cinsiyet":"Kadın" if org=="Sultanlar Ligi" else "Erkek","kulup_milli":"Kulüp",
                "takim_bireysel":"Takım Sporu","cografya":cog,
                "yerlilik":"Yerli" if cog=="Türkiye" else "Yabancı",
                "turk_baglantisi":"Türk Takımı Var" if cog=="Türkiye" else "Yok",
                "yayin_hakki":hak,"periyodiklik":"Yıllık","takvim_tipi":"Sürekli Lig",
                "sayfa_tipi":st_,"intent_katmani":it_,"entity_tipi":"Oyuncu","marka_tipi":"Jenerik",
                "dil":"İngilizce" if re.fullmatch(r"[a-z0-9 .\-']+",kw) else "Türkçe",
                "sorgu_uzunlugu":"Head" if wc<=2 else ("Body" if wc<=4 else "Long-tail"),
                "varyant_kodu":st_,"kulup":ad,
                "mantik_denetim":"Tek kelimelik ad, doğrulanmalı" if tek_kelime else "Geçerli"})

with open("data/raw/seed_oyuncular.csv","w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
bos=[a for a,(o,s,c,h,oy) in sonuc.items() if not oy]
print(f"\nKadro bulunan kulup: {len(sonuc)-len(bos)}/{len(sonuc)}")
print(f"Tekil oyuncu: {len(seen)} | Keyword: {len(rows)}")
if elenen:
    print(f"Tek kelimelik kayit denetime işaretlendi: {len(elenen)}")
    for k, v in elenen[:15]: print(f"    {v:<24} ({k})")
    if len(elenen) > 15: print(f"    ... ve {len(elenen)-15} tane daha")
if bos: print(f"Kadro bulunamayan ({len(bos)}): {bos[:15]}")
print("Cikti: data/raw/seed_oyuncular.csv")

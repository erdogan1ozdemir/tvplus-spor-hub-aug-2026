#!/usr/bin/env python3
"""
DataForSEO toplu arama hacmi cekici.
MCP yaniti 10 satirda kesildigi icin dogrudan API'ye gidilir.
Kimlik bilgileri ~/.claude/settings.json icinden okunur, kodda tutulmaz.

Kullanim:
  python3 dfs_volume.py <girdi.csv> <cikti.csv> [--date-from YYYY-MM-DD]

Girdi CSV: 'keyword' kolonu zorunlu, diger tum kolonlar (facet'ler) ciktiya aynen tasinir.
"""
import sys, json, csv, base64, time, os, re, subprocess, tempfile
import unicodedata

API = "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live"
LOCATION_TR, LANG_TR = 2792, "tr"
BATCH = 700          # istek basina keyword (limit 1000)
RATE_SLEEP = 6.0     # Google Ads live: dakikada 12 istek


TR_PLURAL = re.compile(r"l[ae]r(?=[ıiuü]?(?:\s|$))")
TR_POSS   = re.compile(r"([bcçdgğkpt]?)([ıiuü])(?=\s|$)")
# unsuz yumusamasi: ayni koke ait varyantlar tek harfe indirgenir
YUMUSAMA  = {"c":"ç", "ğ":"k", "b":"p", "d":"t"}

# Google Ads bazi sembolleri kabul etmiyor; kabul edilmeyen karakter tum batch'i dusuruyor
GECERSIZ = re.compile(r"[^0-9a-zçğıöşü\u00c0-\u024f' .\-+]", re.I)

# Python'da "İ".lower() tek karakter degil, "i" + U+0307 (birlesen nokta) uretir.
# U+0307 izinli araligin disinda kaldigi icin sanitiser onu bosluga cevirip
# "Ilkay Gundogan" -> "i lkay gundogan" gibi anlamsiz bir sorgu gonderiyordu.
# Turkce buyuk harfler kucultmeden once dogru karsiliklarina indirilir.
TR_BUYUK = str.maketrans({"İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ",
                          "Ü": "ü", "Ö": "ö", "Ç": "ç"})

def tr_kucult(s):
    return (s or "").translate(TR_BUYUK).lower()

def temizle_kw(kw):
    k = unicodedata.normalize("NFC", tr_kucult((kw or "").strip()))
    k = GECERSIZ.sub(" ", k)
    return " ".join(k.split())

def norm_key(kw):
    """Tekil/cogul ve iyelik varyantlarini tek anahtara indirger.
    Google Ads bu varyantlara ayni birlesik hacmi donduruyor; ayni istekte
    ikisi birden gonderilirse hacim birine yazilip digerine 0 donebiliyor."""
    k = " ".join(tr_kucult((kw or "").strip()).split())
    out = []
    for w in k.split(" "):
        w = TR_PLURAL.sub("", w)                       # maclari -> maci, durumlari -> durumi
        m = TR_POSS.search(w)
        if m and len(w) > 2:                           # iyelik ekini tek isarete indir
            c = m.group(1)
            w = w[:m.start()] + YUMUSAMA.get(c, c) + "@"
        out.append(w)
    return " ".join(out)

def creds():
    for p in (os.path.expanduser("~/.claude/settings.json"), os.path.expanduser("~/.claude.json")):
        try:
            d = json.load(open(p))
        except Exception:
            continue
        stack = [d]
        while stack:
            o = stack.pop()
            if isinstance(o, dict):
                if "DATAFORSEO_USERNAME" in o and "DATAFORSEO_PASSWORD" in o:
                    return o["DATAFORSEO_USERNAME"], o["DATAFORSEO_PASSWORD"]
                stack.extend(o.values())
            elif isinstance(o, list):
                stack.extend(o)
    sys.exit("DataForSEO kimlik bilgisi bulunamadi.")

def post(payload, auth):
    """curl uzerinden istek. Python'un SSL zinciri kurumsal proxy'de dogrulanamadigi
    icin macOS anahtar zincirini kullanan curl tercih edilir."""
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
        json.dump(payload, tf, ensure_ascii=False)
        body = tf.name
    try:
        for attempt in range(4):
            r = subprocess.run(
                ["curl", "-sS", "--max-time", "300", "-X", "POST", API,
                 "-H", "Authorization: Basic " + auth,
                 "-H", "Content-Type: application/json",
                 "--data-binary", "@" + body,
                 "-w", "\n%{http_code}"],
                capture_output=True, text=True)
            out = r.stdout.rsplit("\n", 1)
            code = out[-1].strip() if len(out) > 1 else "000"
            if code == "200":
                try:
                    veri = json.loads(out[0])
                except json.JSONDecodeError:
                    veri = None
                if veri is not None:
                    # HTTP 200 tek başına yeterli değil: kota bitmesi, kimlik
                    # veya hız sınırı hataları da 200 ile döner ve tasks alanı
                    # boş gelir. Bu durum sonuçsuz yazıma yol açıyordu.
                    gd = veri.get("status_code")
                    if gd not in (20000, None):
                        sys.exit(f"DataForSEO govde hatasi {gd}: "
                                 f"{veri.get('status_message')}")
                    return veri
            if attempt < 3:
                time.sleep(15 * (attempt + 1)); continue
            sys.exit(f"HTTP {code}: {(out[0] or r.stderr)[:400]}")
    finally:
        os.unlink(body)

def main():
    src, dst = sys.argv[1], sys.argv[2]
    date_from = "2024-01-01"          # varsayilan: 2024 basindan itibaren tam gecmis
    if "--date-from" in sys.argv:
        date_from = sys.argv[sys.argv.index("--date-from") + 1]

    with open(src, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows or "keyword" not in rows[0]:
        sys.exit("Girdi CSV'sinde 'keyword' kolonu yok.")

    facet_cols = [c for c in rows[0].keys() if c != "keyword"]
    # ayni keyword birden fazla kez gecerse ilk facet setini koru
    facets, order, canon, kirpilan = {}, [], {}, []
    for r in rows:
        k = temizle_kw(r["keyword"])
        if not k or len(k) > 78 or len(k.split()) > 10:
            continue
        nk = norm_key(k)
        if nk in canon:                      # tekil/cogul esdegeri zaten var
            kirpilan.append((k, canon[nk]))
            continue
        canon[nk] = k
        facets[k] = {c: (r.get(c) or "").strip() for c in facet_cols}
        order.append(k)
    if kirpilan:
        print(f"  normalizasyon: {len(kirpilan)} tekil/cogul varyant elendi "
              f"(or. {kirpilan[0][0]!r} -> {kirpilan[0][1]!r})", file=sys.stderr)
        with open(dst.replace(".csv", "_elenen.csv"), "w", newline="", encoding="utf-8-sig") as f:
            cw = csv.writer(f); cw.writerow(["elenen_keyword", "korunan_keyword"]); cw.writerows(kirpilan)

    auth = base64.b64encode(":".join(creds()).encode()).decode()
    results, total_cost = {}, 0.0
    hatali_gorev = []

    for i in range(0, len(order), BATCH):
        chunk = order[i:i + BATCH]
        task = {"location_code": LOCATION_TR, "language_code": LANG_TR,
                "keywords": chunk, "search_partners": False}
        if date_from:
            task["date_from"] = date_from
        resp = post([task], auth)
        total_cost += resp.get("cost", 0) or 0
        gorevler = resp.get("tasks") or []
        if not gorevler:
            sys.exit("DataForSEO bos tasks dondurdu; dosya korundu, cikiliyor.")
        for t in gorevler:
            if t.get("status_code") != 20000:
                hatali_gorev.append(t.get("status_message"))
                print(f"  ! task hatasi: {t.get('status_message')}", file=sys.stderr)
            for item in (t.get("result") or []):
                kw = tr_kucult((item.get("keyword") or "").strip())
                results[kw] = item
        print(f"  batch {i//BATCH+1}: {len(chunk)} kw gonderildi, toplam {len(results)} sonuc",
              file=sys.stderr)
        if i + BATCH < len(order):
            time.sleep(RATE_SLEEP)

    def msmap(it):
        """monthly_searches -> {"YYYY-MM": hacim}. Ham API liste, MCP dict dondurur."""
        raw = (it or {}).get("monthly_searches") or []
        if isinstance(raw, dict):
            return {k: v for k, v in raw.items()}
        return {f'{m.get("year"):04d}-{m.get("month"):02d}': m.get("search_volume")
                for m in raw if m.get("year") and m.get("month")}

    months = sorted({m for it in results.values() for m in msmap(it)}, reverse=True)

    # ——— Yazım öncesi güvenlik denetimi
    # Sonuçsuz veya kapsamı çöken bir çekim, dolu bir CSV'yi boşaltabiliyordu.
    if not results:
        sys.exit(f"Hicbir sonuc donmedi ({len(hatali_gorev)} hatali gorev); "
                 f"{dst} korundu, cikiliyor.")
    if os.path.exists(dst):
        try:
            with open(dst, encoding="utf-8-sig") as f:
                onceki = sum(1 for r in csv.DictReader(f) if r.get("veri_var") == "evet")
        except Exception:
            onceki = 0
        if onceki and len(results) < onceki * 0.6:
            sys.exit(f"Kapsam dustu: onceki {onceki}, simdi {len(results)} "
                     f"(%{100*len(results)/onceki:.0f}). {dst} korundu, cikiliyor.")

    gecici = dst + ".tmp"
    with open(gecici, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["keyword"] + facet_cols +
                   ["search_volume", "competition", "competition_index", "cpc",
                    "low_bid", "high_bid", "veri_var"] + months)
        for k in order:
            it = results.get(k)
            ms = msmap(it)
            w.writerow([k] + [facets[k].get(c, "") for c in facet_cols] +
                       [(it or {}).get("search_volume", ""),
                        (it or {}).get("competition", ""),
                        (it or {}).get("competition_index", ""),
                        (it or {}).get("cpc", ""),
                        (it or {}).get("low_top_of_page_bid", ""),
                        (it or {}).get("high_top_of_page_bid", ""),
                        "evet" if it and it.get("search_volume") is not None else "hayir"] +
                       [ms.get(m, "") for m in months])
    os.replace(gecici, dst)

    got = sum(1 for k in order if results.get(k, {}).get("search_volume") is not None)
    print(f"\nGonderilen: {len(order)} | Veri donen: {got} | Veri donmeyen: {len(order)-got}")
    print(f"Ay penceresi: {months[-1]} -> {months[0]} ({len(months)} ay)")
    print(f"DFS maliyeti: ${total_cost:.4f}")
    print(f"Cikti: {dst}")

if __name__ == "__main__":
    main()

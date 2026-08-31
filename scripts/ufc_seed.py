#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""UFC katmani icin cekim listesi uretir. Emekliler dahil edilmez."""
import csv, json, os, subprocess

D = json.load(open("data/denetim/ufc_katman.json", encoding="utf-8"))
VAR = [("{}", "Oyuncu Jenerik"), ("{} kimdir", "Oyuncu Bilgi"),
       ("{} maçı", "Oyuncu Bilgi"), ("{} istatistik", "İstatistik")]

def portfoy():
    o = subprocess.run(["node","-e","global.window={};require('./data/dashboard.js');"
        "console.log(JSON.stringify(window.DATA.keywords.map(k=>k.kw)))"],
        capture_output=True, text=True, check=True)
    return set(json.loads(o.stdout))

def satir(kw, st, ent, cins="Erkek", uzn="Head"):
    return {"keyword":kw, "organizasyon":"UFC", "spor_dali":"Dövüş Sporları",
        "musabaka_tipi":"Bireysel Sıralama Serisi", "lig_seviyesi":"1. Seviye",
        "cinsiyet":cins, "kulup_milli":"Bireysel", "takim_bireysel":"Bireysel Spor",
        "cografya":"Global", "yerlilik":"Uluslararası", "turk_baglantisi":"Yok",
        "yayin_hakki":"Doğrulanacak", "periyodiklik":"Sürekli", "takvim_tipi":"Tek Etkinlik",
        "sayfa_tipi":st, "intent_katmani":"Bilgi", "entity_tipi":ent,
        "marka_tipi":"Jenerik", "dil":"Türkçe", "sorgu_uzunlugu":uzn,
        "varyant_kodu":st, "kulup":"", "oyuncu_ana_ad":"" if ent!="Oyuncu" else kw.split(" kimdir")[0].split(" maçı")[0].split(" istatistik")[0]}

def main():
    var_olan, kayit, gor, atlanan = portfoy(), [], set(), 0

    def dovusçu(ad, belirsiz, kadin=False):
        nonlocal atlanan
        a = ad.strip().lower()
        if a in gor: return
        gor.add(a)
        if a in var_olan: atlanan += 1; return
        for i,(kalip, st) in enumerate(VAR):
            if i == 0 and belirsiz: continue   # ciplak bicim ortak kelimeyle cakisiyor
            kw = kalip.format(a)
            kayit.append(satir(kw, st, "Oyuncu", "Kadın" if kadin else "Erkek",
                               "Head" if len(kw.split())<=2 else "Body"))

    for siklet, liste in D["AKTIF"].items():
        for x in liste: dovusçu(x["ad"], x["belirsiz"], "Kadınlar" in siklet)
    for x in D["TURK"]: dovusçu(x["ad"], x["belirsiz"])

    # Kisaltma ve lakaplar: yalnizca nitelenmis bicim, hepsi tekil sorgu
    for kw in D["KISALTMA"]:
        if kw not in var_olan and kw not in gor:
            gor.add(kw); kayit.append(satir(kw, "Oyuncu Jenerik", "Oyuncu", uzn="Body"))
    # Kadro ve sayfa tipi sorgulari: varlik degil, organizasyon katmani
    for kw in D["KUME"]:
        if kw not in var_olan and kw not in gor:
            gor.add(kw); kayit.append(satir(kw, "Jenerik", "Lig/Organizasyon", uzn="Body"))
    # Etkinlikler
    for kw in D["ETKINLIK"]:
        if kw not in var_olan and kw not in gor:
            gor.add(kw); kayit.append(satir(kw, "Fikstür", "Etkinlik", uzn="Body"))

    g = "/tmp/ufc_yeni.csv.tmp"
    with open(g, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(kayit[0].keys())); w.writeheader(); w.writerows(kayit)
    os.replace(g, "/tmp/ufc_yeni.csv")
    print(f"Portföyde var : {atlanan} (atlandı)")
    print(f"Keyword       : {len(kayit)}")
    print(f"İstek         : {(len(kayit)+699)//700}  ·  ~${((len(kayit)+699)//700)*0.09:.2f}")

if __name__ == "__main__": main()

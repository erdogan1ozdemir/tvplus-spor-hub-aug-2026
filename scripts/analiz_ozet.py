#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv, statistics as st, sys

rows=[]
with open("data/raw/hacim_organizasyon.csv", encoding="utf-8-sig") as f:
    rd=csv.DictReader(f)
    months=[c for c in rd.fieldnames if len(c)==7 and c[4]=="-"]
    months.sort()
    for r in rd:
        if r["veri_var"]!="evet": continue
        r["sv"]=int(r["search_volume"] or 0)
        r["seri"]=[int(r[m]) if r[m] else 0 for m in months]
        rows.append(r)

def sinif(seri):
    nz=[v for v in seri if v>0]
    if not nz or max(seri)==0: return "Veri Yok"
    mean=sum(seri)/len(seri)
    cv=(st.pstdev(seri)/mean) if mean else 0
    pd_=max(seri)/max(min(nz),1)
    if cv<0.35: return "Evergreen"
    if pd_>=20 or cv>=1.0: return "Spike"
    return "Seasonal"

for r in rows: r["sinif"]=sinif(r["seri"])

def grup(key, top=None, minsv=0):
    d={}
    for r in rows:
        d.setdefault(r[key],{"sv":0,"kw":0})
        d[r[key]]["sv"]+=r["sv"]; d[r[key]]["kw"]+=1
    out=sorted(d.items(), key=lambda x:-x[1]["sv"])
    return out[:top] if top else out

def fmt(n):
    if n>=1_000_000: return f"{n/1_000_000:.1f}M"
    if n>=1_000: return f"{n/1_000:.0f}K"
    return str(n)

print("="*72); print("SPOR DALI - toplam aylik arama hacmi"); print("="*72)
for k,v in grup("spor_dali"):
    print(f"{k:<22} {fmt(v['sv']):>8}   ({v['kw']} kw)")

print("\n"+"="*72); print("ORGANIZASYON - ilk 40"); print("="*72)
print(f"{'Organizasyon':<34}{'Hacim':>9}  {'Hak':<14}{'Sinif':<11}Spor")
for k,v in grup("organizasyon", 40):
    ex=[r for r in rows if r["organizasyon"]==k]
    jen=[r for r in ex if r["varyant_kodu"]=="jen"]
    s=jen[0]["sinif"] if jen else ex[0]["sinif"]
    print(f"{k:<34}{fmt(v['sv']):>9}  {ex[0]['yayin_hakki']:<14}{s:<11}{ex[0]['spor_dali']}")

print("\n"+"="*72); print("YAYIN HAKKI KIRILIMI"); print("="*72)
tot=sum(r["sv"] for r in rows)
for k,v in grup("yayin_hakki"):
    print(f"{k:<18} {fmt(v['sv']):>9}  %{100*v['sv']/tot:.1f}   ({v['kw']} kw)")

print("\n"+"="*72); print("SAYFA TIPI / INTENT"); print("="*72)
for k,v in grup("sayfa_tipi"):
    print(f"{k:<18} {fmt(v['sv']):>9}  %{100*v['sv']/tot:.1f}   ({v['kw']} kw)")

print("\n"+"="*72); print("SEZONSALLIK SINIFI"); print("="*72)
d={}
for r in rows: d[r["sinif"]]=d.get(r["sinif"],0)+r["sv"]
for k,v in sorted(d.items(), key=lambda x:-x[1]):
    print(f"{k:<14} {fmt(v):>9}  %{100*v/tot:.1f}")

print("\n"+"="*72); print("CINSIYET"); print("="*72)
for k,v in grup("cinsiyet"):
    print(f"{k:<12} {fmt(v['sv']):>9}  %{100*v['sv']/tot:.1f}")

print("\n"+"="*72)
print("TV+ YAYIN HAKKI YOK ve HACIM YUKSEK - ilk 20 (firsat havuzu)")
print("="*72)
yok={}
for r in rows:
    if r["yayin_hakki"]=="TV+ Yok":
        yok.setdefault(r["organizasyon"],0); yok[r["organizasyon"]]+=r["sv"]
for k,v in sorted(yok.items(), key=lambda x:-x[1])[:20]:
    ex=[r for r in rows if r["organizasyon"]==k][0]
    print(f"{k:<34}{fmt(v):>9}   {ex['spor_dali']}")

print("\n"+"="*72); print(f"TOPLAM: {fmt(tot)} aylik arama / {len(rows)} keyword"); print("="*72)

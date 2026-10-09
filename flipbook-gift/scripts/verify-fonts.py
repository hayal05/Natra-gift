#!/usr/bin/env python3
"""Developer check (Phase 11.1d): every public/fonts/*.woff2 loads through FontFace in headless
Chromium and draws; glyph coverage of the template text per font; size table.
Needs: pip install playwright fonttools. Run from the project root after compress-fonts.py."""
import json, os, re, sys, base64
from fontTools.ttLib import TTFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fonts")
man = json.load(open(os.path.join(OUT, "manifest.json"), encoding="utf-8"))

# Template text: every string literal in templates.ts (title, kicker, body, sign, byline ...)
src = open(os.path.join(ROOT, "src", "templates", "templates.ts"), encoding="utf-8").read()
lits = re.findall(r'(?:title|kicker|body|byline|sign|caption|label|note)\s*:\s*"((?:[^"\\]|\\.)*)"', src)
tpl_text = "".join(l.replace("\\n", "\n") for l in lits)
SAMPLE = "0123456789àéîõüñç€‘’“”–—…•"
need = {c for c in tpl_text if c not in "\n{} "}
tpl_need = need
print(f"template text: {len(lits)} strings, {len(need)} distinct characters")

rows = []
for m in man:
    cmap = TTFont(os.path.join(OUT, m["file"])).getBestCmap()
    lat_need = {c for c in tpl_need if ord(c) < 0x250 or c in "‘’“”–—…•€"}
    miss = sorted(c for c in lat_need if ord(c) not in cmap)
    extra = sorted(c for c in set(SAMPLE) - set(" ") if ord(c) not in cmap and c not in miss)
    rows.append((m, miss, extra))

from playwright.sync_api import sync_playwright
failed = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.set_content("<canvas id=c width=300 height=60></canvas>")
    for m, miss, extra in rows:
        for key in ("file", "nameFile"):
            if not m[key]: continue
            data = base64.b64encode(open(os.path.join(OUT, m[key]), "rb").read()).decode()
            r = pg.evaluate("""async ([id,data,txt]) => {
              try {
                const f = new FontFace('t-'+id, 'url(data:font/woff2;base64,'+data+')');
                await f.load(); document.fonts.add(f);
                const c = document.getElementById('c').getContext('2d'); c.clearRect(0,0,300,60);
                c.font = '32px "t-'+id+'", monospace'; c.fillStyle='#000'; c.fillText(txt, 4, 40);
                const px = c.getImageData(0,0,300,60).data; let ink=0; for (let i=3;i<px.length;i+=4) if (px[i]>0) ink++;
                return {ok:true, status:f.status, ink};
              } catch (e) { return {ok:false, err:String(e)} } }""",
                [m["id"] + key, data, m["label"] if key == "nameFile" else "Hamburg 0123 Aé አብ"])
            if not r["ok"] or r["ink"] == 0:
                failed.append((m["id"], key, r))
    b.close()

print(f"\n{'font':16s} {'before':>7s} {'after':>6s} {'name':>6s} {'Lat':>4s} {'Eth':>4s}  licence  template chars missing (Latin) | other missing (accents, quotes, euro) | label")
for m, miss, extra in rows:
    print(f"{m['id']:16s} {m['bytesBefore']//1024:5d}KB {m['bytes']//1024:4d}KB {m['nameBytes']:5d}B {m['latin']:4d} {m['ethiopic']:4d}  {m['licence']:7s}  "
          f"{''.join(miss) or '-'} | {''.join(extra) or '-'} | {'label cannot be drawn' if not m['nameFile'] else ('label partly: '+m['labelMissing'] if m['labelMissing'] else 'ok')}")
tb = sum(m["bytesBefore"] for m in man); ta = sum(m["bytes"] for m in man)
print(f"\ntotal {tb//1024} KB -> {ta//1024} KB; over 150 KB: {[m['id'] for m in man if m['bytes']>150*1024] or 'none'}")
print("FontFace load/draw failures:", failed or "none")
sys.exit(1 if failed else 0)

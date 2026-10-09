#!/usr/bin/env python3
"""Developer tool (Phase 11.1c). NOT part of `npm run build`, NOT in package.json.

Turns the owner's TTF/OTF files in fonts-src/ into small WOFF2 files in public/fonts/:
  <slug>.woff2        the font, subset to Latin + Latin-1 + Ethiopic (see UNICODES)
  <slug>-name.woff2   a tiny subset with only the letters of the font's own label (dropdown rows)
  manifest.json       one record per font (id, label, weight, sizes, licence status)

Needs fonttools and brotli on the developer machine:  pip install fonttools brotli
Run from the project root:  python3 scripts/compress-fonts.py
Only the finished .woff2 files and manifest.json are committed; fonts-src/ is git-ignored.
Existing output names are versioned: bump VERSION when a font file changes (immutable caching).
"""
import json, os, sys
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "fonts-src")
OUT = os.path.join(ROOT, "public", "fonts")
VERSION = "v1"

# Decisions 11.1b (owner, 2026-10-09): Latin + Latin-1 + Ethiopic.
UNICODES = (
    "U+0020-007E,U+00A0-00FF,"                    # Basic Latin, Latin-1
    "U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+20AC,"  # dashes, quotes, bullet, ellipsis, euro
    "U+1200-139F,U+2D80-2DDF,U+AB00-AB2F"         # Ethiopic, supplement, extended, extended-A
)

# file, slug, label (shown in the dropdown, in the font's own face), weight, licence
# weight = the one real weight of the file (every file here has a single weight; the renderer must not fake others).
# licence: ok = clearly open | no = embedding forbidden by fsType or EULA | ask = owner must show permission
FONTS = [
  ("Agbalumo_Regular_c34065f469.ttf", "agbalumo", "Agbalumo", 400, "ok"),
  ("Nokia (ኖኪያ).ttf", "nokia-light", "Nokia Light ኖኪያ", 200, "ask"),
  ("NokiaPureHeadline (ኖኪያ).ttf", "nokia-bold", "Nokia Bold ኖኪያ", 700, "ask"),
  ("Goffersl (ጎፈር).ttf", "goffer", "Goffer ጎፈር", 400, "ask"),
  ("Zemenay_Regular_Abel_Yeshewalem_c74cc019f5.ttf", "zemenay", "Zemenay", 400, "ask"),
  ("Kiros (ኪሮስ).ttf", "kiros", "Kiros ኪሮስ", 400, "no"),
  ("SurGraphics ExtraBold.ttf", "surgraphics", "SurGraphics", 900, "no"),
  ("Loga_Regular_c3c47e8261.ttf", "loga", "Loga", 400, "ask"),
  ("Loga_Medium_b653014fd3.ttf", "loga-medium", "Loga Medium", 500, "ask"),
  ("Loga_Light_3d6912db68.ttf", "loga-light", "Loga Light", 300, "ask"),
  ("Loga_Thin_f4e69e37d6.ttf", "loga-thin", "Loga Thin", 100, "ask"),
  ("Dire Dawa (ድሬዳዋ).ttf", "dire-dawa", "Dire Dawa ድሬዳዋ", 400, "ask"),
  ("Chiret-Regular (ጭረት).ttf", "chiret", "Chiret ጭረት", 400, "no"),
  ("Shiromeda-Regular (ሽሮሜዳ).ttf", "shiromeda", "Shiromeda ሽሮሜዳ", 400, "no"),
  ("Shiromeda-Bold (ሽሮሜዳ).ttf", "shiromeda-bold", "Shiromeda Bold ሽሮሜዳ", 700, "no"),
  ("Benaiah.ttf", "benaiah", "Benaiah", 700, "ask"),
  ("Yebse (የብስ).ttf", "yebse", "Yebse የብስ", 400, "ask"),
  ("Wahsrab (ዋሽራብ).ttf", "wahsrab", "Wahsrab ዋሽራብ", 700, "ask"),
  ("Abinet (አብነት).ttf", "abinet", "Abinet አብነት", 700, "no"),
  ("Addis (አዲስ).ttf", "addis", "Addis አዲስ", 400, "ask"),
  ("Meaza (መዓዛ).ttf", "meaza", "Meaza መዓዛ", 400, "no"),
  ("AdwaSansSerif-Regular (አድዋ).ttf", "adwa-sans", "Adwa Sans አድዋ", 400, "no"),
  ("AdwaSansSerif-Bold (አድዋ).ttf", "adwa-sans-bold", "Adwa Sans Bold አድዋ", 700, "no"),
  ("Adwa-Regular (አድዋ).ttf", "adwa", "Adwa አድዋ", 400, "no"),
  ("Adwa-Bold (አድዋ).ttf", "adwa-bold", "Adwa Bold አድዋ", 700, "no"),
  ("Astra-6RGXq.otf", "astra", "ASTRA", 400, "ask"),
]
# Left out on purpose (duplicates): "Goffer (ጎፈር).ttf" (2006, same family as Goffersl) and "Adwa (አድዋ).ttf" (2018 version).


def subset_font(src, dst, text=None):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.hinting = False
    opts.desubroutinize = True
    opts.name_IDs = ["*"]          # keep copyright / licence text inside the file
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(src, opts)
    sub = subset.Subsetter(opts)
    if text is None:
        sub.populate(unicodes=subset.parse_unicodes(UNICODES))
    else:
        sub.populate(text=text)
    sub.subset(font)
    subset.save_font(font, dst, opts)
    font.close()


def main():
    os.makedirs(OUT, exist_ok=True)
    for old in os.listdir(OUT):          # start clean so removed fonts do not linger
        if old.endswith(".woff2") or old == "manifest.json":
            os.remove(os.path.join(OUT, old))
    manifest, missing = [], []
    for fname, slug, label, weight, lic in FONTS:
        src = os.path.join(SRC, fname)
        if not os.path.exists(src):
            missing.append(fname); continue
        main_out = f"{slug}.{VERSION}.woff2"
        name_out = f"{slug}-name.{VERSION}.woff2"
        subset_font(src, os.path.join(OUT, main_out))
        cmap = TTFont(os.path.join(OUT, main_out)).getBestCmap()
        letters = {ch for ch in label if ch != " "}
        drawable = {ch for ch in letters if ord(ch) in cmap}
        if drawable:
            subset_font(src, os.path.join(OUT, name_out), text=label)
        else:   # the font cannot draw any letter of its label (no Latin): the dropdown uses its normal face for this row
            name_out = None
        manifest.append({
            "id": slug, "label": label, "file": main_out, "nameFile": name_out, "weight": weight, "licence": lic,
            "bytesBefore": os.path.getsize(src), "bytes": os.path.getsize(os.path.join(OUT, main_out)),
            "nameBytes": os.path.getsize(os.path.join(OUT, name_out)) if name_out else 0,
            "latin": sum(1 for c in cmap if 0x20 <= c <= 0x7E), "ethiopic": sum(1 for c in cmap if 0x1200 <= c <= 0x139F),
            "labelMissing": "".join(sorted({ch for ch in label if ord(ch) not in cmap and ch != " "})),
        })
        print(f"{slug:16s} {manifest[-1]['bytesBefore']//1024:5d} KB -> {manifest[-1]['bytes']//1024:4d} KB  (+name {manifest[-1]['nameBytes']} B){'' if name_out else '  NO NAME SUBSET (no glyphs for its label)'}")
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    if missing:
        print("NOT FOUND in fonts-src/:", *missing, sep="\n  ", file=sys.stderr)
    b = sum(m["bytesBefore"] for m in manifest); a = sum(m["bytes"] for m in manifest)
    print(f"total {b//1024} KB -> {a//1024} KB")


if __name__ == "__main__":
    main()

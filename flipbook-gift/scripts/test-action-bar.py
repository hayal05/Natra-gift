# 10.8c check: select every component on every template cover and test the on-page action bar covers no other component.
# Needs `NEXT_PUBLIC_UPLOADS=1 npx next dev -p 3100` running and `npx tsx scripts/dump-cover-boxes.ts > scripts/covers.json` first (paths below).
import json, sys
from playwright.sync_api import sync_playwright
data = json.load(open('scripts/covers.json'))
bad = checks = 0
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"]); ctx = b.new_context(viewport={"width":390,"height":844}); pg = ctx.new_page()
    pg.on("pageerror", lambda e: print("PAGEERR", e))
    for d in data:
        pg.goto(f"http://localhost:3100/create?t={d['t']}", wait_until="networkidle", timeout=120000); pg.wait_for_timeout(1200)
        btn = pg.get_by_role("button", name="Continue to the pages")
        if btn.count():
            for i, v in zip(pg.query_selector_all("input[type=text], input:not([type])")[:2], ["Natra", "Sam"]): i.fill(v)
            btn.click(); pg.wait_for_timeout(1200)
        cv = pg.locator("canvas[role=img]").first.bounding_box(); sc = cv["width"] / 360
        pg.mouse.move(0, 0)
        for it in d["items"]:
            if not it["pt"]: continue
            pg.mouse.click(cv["x"] + it["pt"][0]*sc, cv["y"] + it["pt"][1]*sc); pg.wait_for_timeout(350)
            tb = pg.locator("[role=toolbar]")
            if not tb.count(): print("no bar for", d["t"], it["id"]); continue
            bb = tb.first.bounding_box()
            for o in d["items"]:
                if o["id"] == it["id"]: continue
                r = o["r"]; rx, ry, rw, rh = cv["x"]+r["x"]*sc, cv["y"]+r["y"]*sc, r["w"]*sc, r["h"]*sc
                hit = bb["x"] < rx+rw and rx < bb["x"]+bb["width"] and bb["y"] < ry+rh and ry < bb["y"]+bb["height"]
                checks += 1
                if hit: bad += 1; print("COVERS", d["t"], "selected", it["id"], "bar over", o["id"])
        if d["t"] == "birthday": pg.screenshot(path="/tmp/bar_birthday.png")
    print("checks", checks, "covering", bad); b.close()

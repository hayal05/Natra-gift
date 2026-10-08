// Task 10.2c browser check, part 2: opens /tmp/off/gift.html in headless Chromium (touch phone, network OFF) and checks the play button shows on page 3 only. Needs playwright (node).
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, offline: true });
  const pg = await ctx.newPage();
  const errs = []; pg.on("pageerror", (e) => errs.push("PAGEERR " + e.message)); pg.on("console", (m) => m.type() === "error" && errs.push("CONSOLE " + m.text()));
  const reqs = []; pg.on("request", (r) => { if (!r.url().startsWith("file:") && !r.url().startsWith("blob:") && !r.url().startsWith("data:")) reqs.push(r.url()); });
  await pg.goto("file:///tmp/off/gift.html"); await pg.waitForTimeout(800);
  await pg.getByRole("button", { name: /open your gift/i }).click({ force: true }); await pg.waitForTimeout(1500);
  await pg.getByRole("button", { name: /see your gift/i }).click({ force: true }); await pg.waitForTimeout(2500);
  const play = async () => { const l = pg.locator(".fba-btn"); return (await l.count()) && (await l.first().isVisible()) ? 1 : 0; };
  const res = {};
  res.page1 = await play();
  for (let i = 2; i <= 4; i++) { await pg.keyboard.press("ArrowRight"); await pg.waitForTimeout(1200); res["page" + i] = await play(); }
  // on page 3: tap play and check the audio element really plays from a blob: URL
  await pg.keyboard.press("ArrowLeft"); await pg.waitForTimeout(1200);
  res.backOn3 = await play();
  const btn = pg.locator(".fba-btn").first();
  console.log("label:", await btn.getAttribute("aria-label"));
  await btn.click(); await pg.waitForTimeout(700);
  res.btnAfter = await btn.getAttribute("aria-label"); res.btnText = await btn.textContent(); res.err = await pg.locator(".fba-err").first().innerText().catch(() => "");
  res.time = await pg.locator(".fba-time").first().innerText().catch(() => "");
  res.blobPlay = await pg.evaluate(async () => { const m = /"src":"(data:[^"]{0,40})/.exec(document.getElementById("gift").textContent); return m ? m[1] : "no data uri in json"; });
  console.log(JSON.stringify(res), "requests:", reqs, "errors:", errs);
  await b.close();
})();

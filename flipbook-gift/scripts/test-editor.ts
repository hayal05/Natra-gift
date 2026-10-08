// Manual check for the editor helpers. Run: npx tsx scripts/test-editor.ts
import type { PageData, TextSlotDef } from "../src/lib/pages/types.ts";
import { countEmptyPhotos } from "../src/lib/publish.ts";
import { LAYOUT_LIST, LAYOUTS, TEMPLATE_LIST, fillPages } from "../src/templates/index.ts";
import { MAX_EXTRAS, actionBarSpot, otherBoxes, addSlot, deleteSlot, duplicateSlot, pageEditable, GROUP_NAMES, MAX_PAGES, MIN_PAGES, addPage, canAddPage, canDeletePage, canMovePage, deletePage, duplicatePage, movePage, setPageBg, contrast, bgProblem, pageBgOptions, bgHidden, PAGE_BG_CHOICES, editableAt, editableSlots, isEditable, isAdjusted, panBy, photoBox, photoFileProblem, replacePhoto, resetPhoto, photoOverflow, setPhoto, setSlotText, setTextStyle, slotName, slotSummary, swapLayout, textLimit } from "../src/lib/editor.ts";

let fails = 0;
const ok = (name: string, cond: boolean) => { if (!cond) { console.log("FAIL " + name); fails++; } };

for (const l of LAYOUT_LIST) {
  const ed = editableSlots(l);
  ok(`${l.id}: has an editable photo`, ed.some((s) => s.kind === "photo"));
  ok(`${l.id}: folio and fixed text are not editable`, l.slots.every((s) => !(s.kind === "text" && (s.auto || s.text !== undefined)) || !isEditable(s)));
  ok(`${l.id}: shapes are not editable`, l.slots.every((s) => s.kind !== "shape" || !isEditable(s)));
  ok(`${l.id}: names are unique among slots`, new Set(ed.map((s) => slotName(l, s))).size === ed.length);
  // The centre of every editable slot selects a slot that contains that point (a later slot may sit on top).
  for (const s of ed) {
    const hit = editableAt(l, { layout: l.id, slots: {} }, 300, 400, (s.x + s.w / 2) * 300, (s.y + s.h / 2) * 400);
    ok(`${l.id}.${s.id}: centre tap selects something`, hit !== null);
  }
  ok(`${l.id}: tap outside the page selects nothing`, editableAt(l, { layout: l.id, slots: {} }, 300, 400, -5, -5) === null);
}

// Text boxes are flexible: swapping layouts never cuts a creator's text, and it stays under the server ceiling
{
  const tiny = LAYOUT_LIST.find((l) => editableSlots(l).some((s) => s.kind === "text"))!;
  const ts = editableSlots(tiny).filter((s) => s.kind === "text") as TextSlotDef[];
  const longText = "x".repeat(2000);
  const from = LAYOUTS.letter ?? LAYOUT_LIST.find((l) => l.id !== tiny.id)!;
  const pgs = { layout: from.id, slots: Object.fromEntries(ts.map((s) => [s.id, longText])) } as PageData;
  const out = swapLayout(pgs, tiny);
  ok("swapLayout: long text is kept whole", ts.every((s) => (out.slots[s.id] as string).length === longText.length));
  ok("swapLayout: kept text stays under the server limit", ts.every((s) => (out.slots[s.id] as string).length <= textLimit(s)));
  ok("swapLayout: short text is not touched", (() => { const q = swapLayout({ layout: from.id, slots: Object.fromEntries(ts.map((s) => [s.id, "Hi"])) } as PageData, tiny); return ts.every((s) => q.slots[s.id] === "Hi"); })());
}
// 10.8e: empty added photos are counted for the Send popup
{
  const lp2 = { layout: "birthday-letter", slots: { p1: { src: "sample:1" } } } as PageData;
  const a = addSlot(lp2, LAYOUTS["birthday-letter"], "photo").page, b = addSlot(a, LAYOUTS["birthday-letter"], "photo").page;
  ok("countEmptyPhotos: two empty added photos", countEmptyPhotos([b]) === 2);
  ok("countEmptyPhotos: a filled one is not counted", countEmptyPhotos([{ ...b, slots: { ...b.slots, x1: { src: "sample:2" } } }]) === 1);
  ok("countEmptyPhotos: layout photos and added texts are not counted", countEmptyPhotos([lp2, addSlot(lp2, LAYOUTS["birthday-letter"], "text").page]) === 0);
}

// 10.8d: the birthday-letter title box ends before the photo starts, so a long title wraps instead of running under the photo
{
  const l = LAYOUTS["birthday-letter"], title = l.slots.find((x) => x.id === "title")!, photo = l.slots.find((x) => x.kind === "photo")!;
  ok("birthday-letter: title box does not reach the photo", title.x + title.w <= photo.x);
}

// Every template page: summaries never throw and are short.
for (const t of TEMPLATE_LIST) for (const p of t.pages) {
  const l = LAYOUTS[p.layout];
  for (const s of editableSlots(l)) ok(`${t.id}/${p.layout}.${s.id}: summary`, slotSummary(s, p).length <= 60);
}
const quote = LAYOUTS["quote-big"] ?? LAYOUT_LIST.find((l) => l.group === "quote")!;
ok("empty text shows the hint", slotSummary(editableSlots(quote).find((s) => s.kind === "text")!, { layout: quote.id, slots: {} }) !== "Empty");
const photo = editableSlots(LAYOUT_LIST[0]).find((s) => s.kind === "photo")!;
ok("sample photo label", slotSummary(photo, { layout: "x", slots: { p1: { src: "sample:1" } } }) === "Sample photo");
ok("real photo label", slotSummary(photo, { layout: "x", slots: { p1: { src: "https://x/y.jpg" } } }) === "Your photo");
ok("empty photo label", slotSummary(photo, { layout: "x", slots: {} }) === "No photo yet");

// Layout swap (task 3.3).
const byId = (id: string) => LAYOUTS[id];
const base: import("../src/lib/pages/types.ts").PageData = { layout: "letter", bg: "soft", slots: { kicker: "Hi", title: "Dear {to},", body: "Long text", sign: "{from}", p1: { src: "https://x/y.jpg", zoom: 2 } }, styles: { title: { size: "L" } } };
const sw = swapLayout(base, byId("cover-full"));
ok("swap sets the layout", sw.layout === "cover-full");
ok("swap carries text by id", sw.slots.title === "Dear {to}," && sw.slots.kicker === "Hi" && sw.slots.body === "Long text");
ok("swap carries the photo with its settings", JSON.stringify(sw.slots.p1) === JSON.stringify(base.slots.p1));
ok("swap keeps background and styles", sw.bg === "soft" && sw.styles?.title?.size === "L");
ok("swap does not change the input", base.layout === "letter" && Object.keys(base.slots).length === 5);
ok("swap to the same layout returns the same page", swapLayout(base, byId("letter")) === base);
const two = swapLayout(base, byId("polaroid-two"), 2);
ok("missing photo slots get a sample photo", [two.slots.p1, two.slots.p2].every((v) => typeof v === "object" && v.src !== "") && (two.slots.p2 as { src: string }).src.startsWith("sample:"));
ok("swapping back restores everything", JSON.stringify(swapLayout(two, byId("letter")).slots) === JSON.stringify({ ...base.slots, p2: two.slots.p2 }));
ok("unmatched text is kept, not deleted", swapLayout(sw, byId("photo-full")).slots.body === "Long text");
for (const t of TEMPLATE_LIST) for (const l of LAYOUT_LIST) for (const p of t.pages.slice(0, 3)) {
  const r = swapLayout(p, l);
  ok(`${t.id}: ${p.layout} -> ${l.id}: every photo slot has a photo`, l.slots.every((s) => s.kind !== "photo" || (typeof r.slots[s.id] === "object" && !!(r.slots[s.id] as { src: string }).src)));
}
ok("every layout group has a picker name", LAYOUT_LIST.every((l) => GROUP_NAMES.some(([g]) => g === l.group)));

// Text controls (task 3.4).
const tx = (l: string, id: string) => LAYOUTS[l].slots.find((s) => s.id === id) as import("../src/lib/pages/types.ts").TextSlotDef;
ok("letter body allows a long letter (at least 1,500 characters)", textLimit(tx("letter", "body")) >= 1500);
ok("every text slot allows at least 24 characters", LAYOUT_LIST.every((l) => editableSlots(l).every((s) => s.kind !== "text" || textLimit(s) >= 24)));
for (const t of TEMPLATE_LIST) for (const p of fillPages(t.pages, { to: "Alexandria", from: "Bartholomew" })) for (const s of editableSlots(LAYOUTS[p.layout])) {
  const v = p.slots[s.id];
  if (s.kind === "text" && typeof v === "string") ok(`${t.id}/${p.layout}.${s.id}: sample text fits its limit (${v.length}/${textLimit(s)})`, v.length <= textLimit(s));
}
const lt = setSlotText(base, tx("letter", "body"), "x".repeat(5000));
ok("set text keeps what was typed (no per-box cut)", (lt.slots.body as string).length === 5000);
ok("set text does not change the input", base.slots.body === "Long text" && lt !== base);
ok("set text keeps other slots", lt.slots.title === "Dear {to}," && lt.layout === "letter");
const s1 = setTextStyle(base, "body", { size: "S", align: "center" });
ok("style is added", s1.styles?.body?.size === "S" && s1.styles?.body?.align === "center" && s1.styles?.title?.size === "L");
const s2 = setTextStyle(s1, "body", { size: undefined, align: undefined });
ok("clearing every key removes the entry", s2.styles?.body === undefined && s2.styles?.title?.size === "L");
ok("clearing the last style removes styles", setTextStyle({ layout: "x", slots: {} }, "a", { color: "accent" }).styles?.a?.color === "accent"
  && setTextStyle(setTextStyle({ layout: "x", slots: {} }, "a", { color: "accent" }), "a", { color: undefined }).styles === undefined);
ok("style leaves the input alone", base.styles?.body === undefined);

// Photo controls (task 3.5a).
const ph: import("../src/lib/pages/types.ts").PageData = { layout: "x", slots: { p1: { src: "https://x/y.jpg", zoom: 2, panX: 0.5, filter: "warm" }, title: "Hi" } };
const get = (pg: typeof ph, id = "p1") => pg.slots[id] as import("../src/lib/pages/types.ts").PhotoContent;
const a1 = setPhoto(ph, "p1", { fit: "fit", frame: "rounded" });
ok("photo patch keeps what was there", get(a1).src === "https://x/y.jpg" && get(a1).zoom === 2 && get(a1).panX === 0.5 && get(a1).filter === "warm");
ok("photo patch adds new keys", get(a1).fit === "fit" && get(a1).frame === "rounded");
ok("photo patch leaves the input and other slots alone", get(ph).fit === undefined && a1.slots.title === "Hi" && a1.layout === "x");
ok("zoom is clamped to 1..3", get(setPhoto(ph, "p1", { zoom: 9 })).zoom === 3 && get(setPhoto(ph, "p1", { zoom: 0.2 })).zoom === undefined);
ok("pan is clamped to -1..1", get(setPhoto(ph, "p1", { panX: -4, panY: 7 })).panX === -1 && get(setPhoto(ph, "p1", { panX: -4, panY: 7 })).panY === 1);
ok("NaN and Infinity are dropped", get(setPhoto(ph, "p1", { zoom: NaN, panX: Infinity })).zoom === undefined && get(setPhoto(ph, "p1", { panX: Infinity })).panX === undefined);
const a2 = setPhoto(ph, "p1", { zoom: 1, panX: 0, panY: 0, fit: "fill", filter: "none" });
ok("default values are dropped, photo is just src", JSON.stringify(a2.slots.p1) === JSON.stringify({ src: "https://x/y.jpg" }));
ok("undefined resets a key", get(setPhoto(ph, "p1", { filter: undefined, zoom: undefined })).filter === undefined && get(setPhoto(ph, "p1", { zoom: undefined })).zoom === undefined);
ok("frame none is kept as a real choice", get(setPhoto(ph, "p1", { frame: "none" })).frame === "none");
ok("frame undefined returns to the layout's frame", get(setPhoto(setPhoto(ph, "p1", { frame: "border" }), "p1", { frame: undefined })).frame === undefined);
ok("a slot with no photo starts from an empty src", JSON.stringify(setPhoto({ layout: "x", slots: {} }, "p2", { zoom: 2 }).slots.p2) === JSON.stringify({ src: "", zoom: 2 }));
ok("a new src replaces the old one", get(setPhoto(ph, "p1", { src: "data:image/png;base64,AAA" })).src === "data:image/png;base64,AAA");
ok("a bad frame or filter value is ignored", get(setPhoto(ph, "p1", { frame: "wavy" as never, filter: "neon" as never })).frame === undefined && get(setPhoto(ph, "p1", { filter: "neon" as never })).filter === undefined);

// Drag-to-pan maths (task 3.5e).
const near = (a: number, b: number) => Math.abs(a - b) < 0.002;
const box = { w: 300, h: 400 }, wide = { w: 400, h: 300 }; // a 4:3 landscape photo in a 3:4 portrait box
const of1 = photoOverflow(box, wide, {});
ok("fill: landscape photo overflows sideways only", near(of1.x, 233.3333) && of1.y === 0);
ok("fit at zoom 1: nothing overflows", photoOverflow(box, wide, { fit: "fit" }).x === 0 && photoOverflow(box, wide, { fit: "fit" }).y === 0);
const of2 = photoOverflow(box, wide, { fit: "fit", zoom: 2 });
ok("fit at zoom 2 overflows both ways", near(of2.x, 300) && near(of2.y, 50));
const of3 = photoOverflow(box, null, { zoom: 2 });
ok("sample photo overflows by the zoom only", of3.x === 300 && of3.y === 400 && photoOverflow(box, null, {}).x === 0);
ok("bad sizes give no overflow", photoOverflow({ w: 0, h: 400 }, wide, {}).x === 0 && photoOverflow(box, { w: 0, h: 0 }, { zoom: 2 }).x === 300);
const d1 = panBy({}, 58.333, 0, box, wide);
ok("dragging right a quarter of the overflow pans to -0.5", near(d1.panX, -0.5) && d1.panY === 0);
ok("dragging left pans the other way", near(panBy({}, -58.333, 0, box, wide).panX, 0.5));
ok("pan builds on the current pan", near(panBy({ panX: -0.5 }, -58.333, 0, box, wide).panX, 0));
ok("pan stops at the edges", panBy({}, 5000, 0, box, wide).panX === -1 && panBy({}, -5000, 0, box, wide).panX === 1);
ok("no movement on an axis with no overflow", panBy({ panY: 0.3 }, 0, 80, box, wide).panY === 0.3);
ok("no movement when the photo fits", JSON.stringify(panBy({ fit: "fit" }, 50, 50, box, wide)) === JSON.stringify({ panX: 0, panY: 0 }));
const d2 = panBy({ zoom: 2, fit: "fit" }, 75, 12.5, box, wide);
ok("both axes move together", near(d2.panX, -0.5) && near(d2.panY, -0.5));
ok("sample photos pan too", near(panBy({ zoom: 2 }, 75, 100, box, null).panX, -0.5) && near(panBy({ zoom: 2 }, 75, 100, box, null).panY, -0.5));
ok("NaN drag changes nothing", panBy({ panX: 0.2 }, NaN, NaN, box, wide).panX === 0.2);
// Round trip with setPhoto: drag, then store.
const dragged = setPhoto({ layout: "x", slots: { p1: { src: "https://x/y.jpg" } } }, "p1", panBy({}, 58.333, 0, box, wide));
ok("a drag stores pan and leaves defaults out", near((dragged.slots.p1 as { panX: number }).panX, -0.5) && (dragged.slots.p1 as { panY?: number }).panY === undefined);

// Picture area inside a photo slot (task 3.5f).
const pol = LAYOUTS["polaroid"] ?? LAYOUT_LIST.find((l) => l.slots.some((s) => s.kind === "photo" && s.matBottom))!;
const polSlot = pol.slots.find((s) => s.kind === "photo" && s.matBottom) as import("../src/lib/pages/types.ts").PhotoSlotDef;
const pr = { w: polSlot.w * 360, h: polSlot.h * 480 };
const pb = photoBox(polSlot, undefined, 360, 480);
ok("border frame: picture is smaller than the slot, mat at the bottom", pb.w < pr.w && pb.h < pr.h - polSlot.matBottom! * pr.h + 0.001 && pb.w > 0 && pb.h > 0);
const pn = photoBox(polSlot, "none", 360, 480);
ok("no frame: picture fills the slot", near(pn.w, pr.w) && near(pn.h, pr.h));
ok("rounded frame: picture fills the slot", near(photoBox(polSlot, "rounded", 360, 480).w, pr.w));

// Replace and reset a photo (task 3.5g).
ok("jpg, png, webp and gif are accepted", ["image/jpeg", "image/png", "image/webp", "image/gif"].every((type) => photoFileProblem({ type, size: 1000 }) === null));
ok("other types are refused with a plain message", /JPG, PNG/.test(photoFileProblem({ type: "application/pdf", size: 1000 }) ?? "") && photoFileProblem({ type: "image/svg+xml", size: 10 }) !== null && photoFileProblem({ type: "", size: 10 }) !== null);
ok("an empty file is refused", photoFileProblem({ type: "image/png", size: 0 }) !== null);
ok("a too-large file is refused and says the size", /too large \(15\.1 MB\)/.test(photoFileProblem({ type: "image/jpeg", size: 15.1 * 1048576 }) ?? ""));
ok("a file at the limit is accepted", photoFileProblem({ type: "image/jpeg", size: 15 * 1048576 }) === null);
const adj: import("../src/lib/pages/types.ts").PageData = { layout: "x", slots: { p1: { src: "sample:1", zoom: 2, panX: 0.4, panY: -0.2, fit: "fit", filter: "bw", frame: "rounded" }, title: "Hi" } };
const rp = replacePhoto(adj, "p1", "data:image/png;base64,AAA");
const rpv = rp.slots.p1 as import("../src/lib/pages/types.ts").PhotoContent;
ok("replace sets the new picture and resets pan and zoom", rpv.src === "data:image/png;base64,AAA" && rpv.zoom === undefined && rpv.panX === undefined && rpv.panY === undefined);
ok("replace keeps fit, filter and frame", rpv.fit === "fit" && rpv.filter === "bw" && rpv.frame === "rounded");
ok("replace leaves the input and other slots alone", (adj.slots.p1 as { src: string }).src === "sample:1" && rp.slots.title === "Hi");
const rs = resetPhoto(adj, "p1");
ok("reset keeps only the picture", JSON.stringify(rs.slots.p1) === JSON.stringify({ src: "sample:1" }));
ok("isAdjusted tells adjusted from plain", isAdjusted(adj.slots.p1 as import("../src/lib/pages/types.ts").PhotoContent) && !isAdjusted(rs.slots.p1 as import("../src/lib/pages/types.ts").PhotoContent) && isAdjusted({ src: "x", frame: "none" }));

// Page controls (task 3.6a).
type PD = import("../src/lib/pages/types.ts").PageData;
const mk = (n: number): PD[] => Array.from({ length: n }, (_, i) => ({ layout: "letter", slots: { title: `P${i}` } }));
const names = (ps: PD[]) => ps.map((p) => p.slots.title).join(",");
ok("limits are 4 and 16", MIN_PAGES === 4 && MAX_PAGES === 16);
const ap = addPage(mk(5), 1, LAYOUTS["photo-framed"], 3);
ok("add inserts after the current page", ap.length === 6 && ap[2].layout === "photo-framed" && ap[1].slots.title === "P1" && ap[3].slots.title === "P2");
ok("added page has a sample photo and empty text", typeof ap[2].slots.p1 === "object" && (ap[2].slots.p1 as { src: string }).src.startsWith("sample:") && ap[2].slots.title === undefined);
ok("add never goes before the cover", addPage(mk(5), -3, LAYOUTS["photo-framed"])[0].slots.title === "P0");
ok("add at the last page appends", addPage(mk(5), 4, LAYOUTS["photo-framed"])[5].layout === "photo-framed");
ok("add refuses at 16 pages and returns the same array", addPage(mk(16), 2, LAYOUTS["photo-framed"]).length === 16 && canAddPage(15) && !canAddPage(16));
const src5 = mk(5);
ok("add does not change the input", addPage(src5, 1, LAYOUTS["photo-framed"]).length === 6 && src5.length === 5);
const dp0: PD[] = [{ layout: "photo-framed", slots: { p1: { src: "sample:2", zoom: 2 }, caption: "Hi" }, styles: { caption: { size: "L" } } }, ...mk(4)];
const dp = duplicatePage(dp0, 0);
ok("duplicate puts a copy right after", dp.length === 6 && JSON.stringify(dp[1]) === JSON.stringify(dp[0]) && dp[2].slots.title === "P0");
(dp[1].slots.p1 as { zoom: number }).zoom = 3; dp[1].styles!.caption.size = "S";
ok("a copy shares nothing with the original", (dp[0].slots.p1 as { zoom: number }).zoom === 2 && dp[0].styles!.caption.size === "L");
ok("duplicate refuses at 16 pages and for a bad index", duplicatePage(mk(16), 1).length === 16 && duplicatePage(mk(5), 9).length === 5 && duplicatePage(mk(5), -1).length === 5);
ok("delete removes the page", names(deletePage(mk(6), 2)) === "P0,P1,P3,P4,P5");
ok("delete refuses at 4 pages, on the cover and for a bad index", deletePage(mk(4), 2).length === 4 && deletePage(mk(6), 0).length === 6 && deletePage(mk(6), 7).length === 6);
ok("canDeletePage matches", canDeletePage(5, 1) && !canDeletePage(4, 1) && !canDeletePage(5, 0));
ok("move later swaps with the next page", names(movePage(mk(5), 1, 1)) === "P0,P2,P1,P3,P4");
ok("move earlier swaps with the previous page", names(movePage(mk(5), 3, -1)) === "P0,P1,P3,P2,P4");
ok("nothing moves above the cover", names(movePage(mk(5), 1, -1)) === "P0,P1,P2,P3,P4" && names(movePage(mk(5), 0, 1)) === "P0,P1,P2,P3,P4");
ok("the last page cannot move later", names(movePage(mk(5), 4, 1)) === "P0,P1,P2,P3,P4" && !canMovePage(5, 4, 1) && canMovePage(5, 4, -1) && canMovePage(5, 1, 1) && !canMovePage(5, 1, -1));
const m5 = mk(5);
ok("move does not change the input", movePage(m5, 2, 1) !== m5 && names(m5) === "P0,P1,P2,P3,P4");
ok("refused actions return the same array", movePage(m5, 1, -1) === m5 && deletePage(mk(4), 1).length === 4);
const bgp = setPageBg({ layout: "x", bg: "soft", slots: {} }, "dark");
ok("page background is set", bgp.bg === "dark" && setPageBg({ layout: "x", slots: {} }, "accent").bg === "accent");
ok("page background undefined goes back to the layout's own", !("bg" in setPageBg({ layout: "x", bg: "soft", slots: { a: "b" } }, undefined)) && setPageBg({ layout: "x", bg: "soft", slots: { a: "b" } }, undefined).slots.a === "b");

// ---- 3.6e: page background readability ----
type PageData = import("../src/lib/pages/types.ts").PageData;
ok("contrast: black on white is 21, same colour is 1", Math.round(contrast("#000", "#fff")) === 21 && contrast("#abc", "#aabbcc") === 1);
ok("contrast: unreadable colours count as fine", contrast("rgba(0,0,0,.5)", "#fff") === 21);
{
  const pal = TEMPLATE_LIST[0].palette, lay = LAYOUT_LIST.find((l) => l.id === "letter")!;
  const pg0: PageData = { layout: "letter", slots: { title: "Dear you", body: "Hello" } };
  ok("letter: the layout's own colour is fine", bgProblem(pg0, lay, pal, undefined) === null);
  ok("letter: dark background with dark ink is refused", bgProblem(pg0, lay, pal, "dark") !== null);
  ok("letter: pageBgOptions drops dark and keeps paper", !pageBgOptions(pg0, lay, pal).some(([k]) => k === "dark") && pageBgOptions(pg0, lay, pal).some(([k]) => k === "paper"));
  ok("the current choice is never removed", pageBgOptions({ ...pg0, bg: "dark" }, lay, pal).some(([k]) => k === "dark"));
  ok("empty text is not checked, but the page number always is", bgProblem({ layout: "letter", slots: {} }, lay, pal, "dark") === "the page number");
  ok("a text colour the creator picked is respected", bgProblem({ ...pg0, styles: { title: { color: "paper" }, body: { color: "paper" }, folio: { color: "paper" } } }, lay, pal, "dark") === null);
}
ok("only the palette keys are offered as backgrounds", PAGE_BG_CHOICES.map(([k]) => k).join() === "paper,soft,dark,accent,accent2");
ok("a full-page photo hides the background colour", bgHidden(LAYOUT_LIST.find((l) => l.id === "photo-full")!) && !bgHidden(LAYOUT_LIST.find((l) => l.id === "letter")!));
{
  // Every offered chip, on every layout and template, leaves the page readable (the property the chips promise).
  let bad = 0, offered = 0, none = 0;
  for (const tpl of TEMPLATE_LIST) for (const lay of LAYOUT_LIST) {
    const page: PageData = { layout: lay.id, slots: Object.fromEntries(editableSlots(lay).filter((s) => s.kind === "text").map((s) => [s.id, "Sample text"])) };
    const opts = pageBgOptions(page, lay, tpl.palette);
    offered += opts.length; if (!opts.length) none++;
    for (const [k] of opts) if (bgProblem(page, lay, tpl.palette, k) !== null) bad++;
  }
  ok(`every offered chip is readable (${offered} offered, ${none} layout/template pairs with no chip)`, bad === 0);
  console.log("  layouts with no readable chip per template:", none, "of", TEMPLATE_LIST.length * LAYOUT_LIST.length);
}


// ---- 10.4a: add, duplicate and delete components ----
import { pageSlots, slotAt } from "../src/lib/pages/render.ts";
{
  const L = (id: string) => LAYOUTS[id];
  const mk = (layout: string, slots: PageData["slots"] = {}, more: Partial<PageData> = {}): PageData => ({ layout, slots, ...more });
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const letter = L("letter"), cover = L("cover-full"), two = L("collage-2");
  const lp = mk("letter", { title: "Dear {to}", body: "Hello", p1: { src: "https://x/a.jpg", zoom: 2 } }, { styles: { title: { size: "L", x: 0.1 } } });

  // pageSlots
  ok("pageSlots: nothing hidden or added gives the layout's own list", pageSlots(letter, lp) === letter.slots);
  ok("pageSlots: hidden are left out, extras come last", (() => { const r = pageSlots(letter, { hidden: ["title"], extras: [{ id: "x1", kind: "photo", x: 0, y: 0, w: 1, h: 1 }] }); return !r.some((s) => s.id === "title") && r.at(-1)!.id === "x1" && r.length === letter.slots.length; })());

  // add
  const before = JSON.stringify(lp);
  const t = addSlot(lp, letter, "text");
  ok("add text: one extra x1 with 'New text', page not mutated", t.id === "x1" && t.page.extras!.length === 1 && t.page.slots.x1 === "New text" && JSON.stringify(lp) === before && !t.reason);
  const td = t.page.extras![0];
  ok("add text: centred, a text kind, readable on the light page", td.kind === "text" && Math.abs(td.x + td.w / 2 - 0.5) < 1e-9 && Math.abs(td.y + td.h / 2 - 0.5) < 1e-9 && td.color === "ink");
  ok("add text: new text fits its own limit", td.kind === "text" && textLimit(td) >= "New text".length);
  ok("add text on a dark page uses light text", (() => { const d = addSlot(mk("cover-full"), cover, "text").page.extras![0]; return d.kind === "text" && d.color === "paper"; })());
  const ph = addSlot(lp, letter, "photo");
  const pd = ph.page.extras![0];
  ok("add photo: empty placeholder, centred", pd.kind === "photo" && same(ph.page.slots.x1, { src: "" }) && Math.abs(pd.x + pd.w / 2 - 0.5) < 1e-9 && Math.abs(pd.y + pd.h / 2 - 0.5) < 1e-9);
  ok("added items are editable and drawn last", same(pageEditable(letter, t.page).at(-1)?.id, "x1") && pageSlots(letter, t.page).at(-1)!.id === "x1");
  let full = lp; const ids: string[] = [];
  for (let i = 0; i < MAX_EXTRAS; i++) { const r = addSlot(full, letter, i % 2 ? "photo" : "text"); full = r.page; ids.push(r.id!); }
  ok("add: 8 items with unique ids x1..x8", new Set(ids).size === MAX_EXTRAS && ids[0] === "x1" && ids[7] === "x8");
  const over = addSlot(full, letter, "text");
  ok("add: the 9th is refused with a reason and nothing changes", over.page === full && !!over.reason && over.id === undefined);

  // 10.8b: added boxes never share a position and always stay on the page
  for (const kind of ["text", "photo"] as const) {
    let pg = lp; const seen = new Set<string>(); let inside = true;
    for (let i = 0; i < MAX_EXTRAS; i++) {
      const d = addSlot(pg, letter, kind); pg = d.page;
      const e = pg.extras!.at(-1)!;
      seen.add(`${e.x},${e.y}`);
      inside = inside && e.x >= 0 && e.y >= 0 && e.x + e.w <= 1 + 1e-9 && e.y + e.h <= 1 + 1e-9;
    }
    ok(`add ${kind} x${MAX_EXTRAS}: every box has its own position`, seen.size === MAX_EXTRAS);
    ok(`add ${kind} x${MAX_EXTRAS}: every box stays inside the page`, inside);
  }
  ok("add: the second text is not on the first", (() => { const a = addSlot(lp, letter, "text"), b = addSlot(a.page, letter, "text"); const [e1, e2] = b.page.extras!; return e1.x !== e2.x || e1.y !== e2.y; })());
  ok("add: text then photo (mixed kinds) never share a position", (() => { const a = addSlot(addSlot(lp, letter, "text").page, letter, "photo").page.extras!; return a[0].x !== a[1].x || a[0].y !== a[1].y; })());
  ok("add after a delete does not land on a box still there", (() => {
    let pg = lp; for (let i = 0; i < 3; i++) pg = addSlot(pg, letter, "text").page;
    pg = deleteSlot(pg, letter, "x1").page; pg = addSlot(pg, letter, "text").page;
    return new Set(pg.extras!.map((e) => `${e.x},${e.y}`)).size === pg.extras!.length;
  })());

  // 10.8c: the action bar covers no other component, on every layout, for every editable component
  {
    const W = 300, H = 400, bw = 104, bh = 52;
    const hits = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    let bad = 0, total = 0;
    for (const l of LAYOUT_LIST) {
      const pg = { layout: l.id, slots: {} } as PageData;
      for (const s of editableSlots(l)) {
        const sel = { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H }, others = otherBoxes(l, pg, W, H, s.id);
        const spot = actionBarSpot(sel, others, W, H, bw, bh);
        total++;
        if (others.some((o) => hits(spot, o)) && spot.y + bh <= H + 6 && spot.y < H) bad++; // a spot under the page (y >= H) covers nothing by definition
        if (spot.x < 0 || spot.x + bw > W + 1e-9) bad++;
      }
    }
    ok(`action bar: covers no other component and stays inside the page width (${total} components)`, bad === 0);
    ok("action bar: room above, it goes above", (() => { const r = actionBarSpot({ x: 100, y: 200, w: 100, h: 50 }, [], W, H, bw, bh); return r.y + bh < 200; })());
    ok("action bar: no room above, it goes below", (() => { const r = actionBarSpot({ x: 100, y: 10, w: 100, h: 50 }, [], W, H, bw, bh); return r.y >= 60; })());
    ok("action bar: blocked above and below by other components, it goes inside", (() => { const sel = { x: 50, y: 150, w: 200, h: 100 }; const r = actionBarSpot(sel, [{ x: 0, y: 0, w: W, h: 150 }, { x: 0, y: 250, w: W, h: 150 }], W, H, bw, bh); return r.y >= 150 && r.y + bh <= 250; })());
    ok("action bar: nowhere free on the page, it goes just under the page", (() => { const r = actionBarSpot({ x: 0, y: 0, w: W, h: H }, [{ x: 0, y: 0, w: W, h: H }], W, H, bw, bh); return r.y >= H; })());
    ok("action bar: never leaves the page sideways", (() => { const l = actionBarSpot({ x: 280, y: 200, w: 20, h: 20 }, [], W, H, bw, bh), r = actionBarSpot({ x: 0, y: 200, w: 20, h: 20 }, [], W, H, bw, bh); return l.x + bw <= W && r.x >= 0; })());
  }

  // duplicate
  const dt = duplicateSlot(lp, letter, "title");
  ok("duplicate a layout text: new extra with the same content and style, original untouched", dt.id === "x1" && dt.page.slots.x1 === "Dear {to}" && same(dt.page.styles!.x1, lp.styles!.title) && dt.page.slots.title === "Dear {to}" && !dt.page.hidden);
  const ot = letter.slots.find((x) => x.id === "title")!, ct = dt.page.extras![0];
  ok("duplicate: offset about 4% and same size, kind and font", Math.abs(ct.x - ot.x - 0.04) < 1e-9 && Math.abs(ct.y - ot.y - 0.04) < 1e-9 && ct.w === ot.w && ct.h === ot.h && ct.kind === "text" && ct.font === (ot as any).font);
  ok("duplicate: the copy's content and style are independent", (() => { const c = structuredClone(dt.page); c.styles!.x1.size = "S"; return dt.page.styles!.x1.size === "L" && lp.styles!.title.size === "L"; })());
  const dp = duplicateSlot(lp, letter, "p1");
  ok("duplicate a photo keeps picture and zoom, a second photo exists", dp.id === "x1" && same(dp.page.slots.x1, lp.slots.p1) && dp.page.slots.x1 !== lp.slots.p1 && pageSlots(letter, dp.page).filter((x) => x.kind === "photo").length === 2);
  ok("duplicate a moved photo moves its own box too", (() => { const m = mk("letter", { p1: { src: "a", x: 0.2, y: 0.3, w: 0.3, h: 0.3 } }); const r = duplicateSlot(m, letter, "p1").page.slots.x1 as any; return Math.abs(r.x - 0.24) < 1e-9 && Math.abs(r.y - 0.34) < 1e-9; })());
  ok("duplicate an extra gives x2", duplicateSlot(dt.page, letter, "x1").id === "x2");
  ok("duplicate near the right or bottom edge moves back, staying on the page", (() => { const e = { id: "x1", kind: "photo" as const, x: 0.6, y: 0.7, w: 0.4, h: 0.3 }; const r = duplicateSlot(mk("letter", { x1: { src: "" } }, { extras: [e] }), letter, "x1").page.extras![1]; return Math.abs(r.x - 0.56) < 1e-9 && Math.abs(r.y - 0.66) < 1e-9 && r.x + r.w <= 1 && r.y + r.h <= 1; })());
  ok("duplicate a rotated component moves its pivot with it", (() => { const pol = L("polaroid-one"); const rotated = pol.slots.find((x) => x.kind === "photo" && x.rot)!; if (!rotated.rot) return true; const r = duplicateSlot(mk("polaroid-one", { p1: { src: "a" } }), pol, rotated.id).page.extras![0]; return Math.abs(r.rot!.cx - rotated.rot.cx - (r.x - rotated.x)) < 1e-9; })());
  const dFolio = duplicateSlot(lp, letter, "folio"), dNone = duplicateSlot(lp, letter, "nope");
  ok("duplicate: folio, shapes and unknown ids are refused", dFolio.page === lp && !!dFolio.reason && dNone.page === lp && !!dNone.reason);
  ok("duplicate: refused at the limit", duplicateSlot(full, letter, "title").page === full && !!duplicateSlot(full, letter, "title").reason);

  // delete
  const dl = deleteSlot(lp, letter, "title");
  ok("delete a layout text: goes into hidden, content kept, nothing drawn", same(dl.page.hidden, ["title"]) && dl.page.slots.title === "Dear {to}" && !pageSlots(letter, dl.page).some((x) => x.id === "title") && !pageEditable(letter, dl.page).some((x) => x.id === "title"));
  ok("delete the same component twice is refused", (() => { const r = deleteSlot(dl.page, letter, "title"); return r.page === dl.page && !!r.reason; })());
  const de = deleteSlot(dt.page, letter, "x1");
  ok("delete an extra: removed with its content and style, hidden untouched", !de.page.extras && !("x1" in de.page.slots) && !de.page.styles?.x1 && same(de.page.styles, lp.styles) && !de.page.hidden);
  ok("delete: folio and unknown ids are refused", deleteSlot(lp, letter, "folio").page === lp && deleteSlot(lp, letter, "zzz").page === lp);
  const lastPhoto = deleteSlot(lp, letter, "p1");
  ok("the last photo cannot be deleted (reason given, page unchanged)", lastPhoto.page === lp && /photo/i.test(lastPhoto.reason ?? ""));
  ok("with an added photo the layout photo can go, then the added one is the last", (() => { const a = addSlot(lp, letter, "photo").page; const r = deleteSlot(a, letter, "p1"); const r2 = deleteSlot(r.page, letter, "x1"); return !r.reason && same(r.page.hidden, ["p1"]) && r2.page === r.page && !!r2.reason; })());
  ok("collage-2: one photo can go, the other is then the last", (() => { const c = mk("collage-2", { p1: { src: "a" }, p2: { src: "b" } }); const r = deleteSlot(c, two, "p1"); return !r.reason && deleteSlot(r.page, two, "p2").page === r.page; })());


  // 10.4b: taps and names follow what is drawn
  {
    const W = 300, H = 400, pt = (d: { x: number; y: number; w: number; h: number }) => [(d.x + d.w / 2) * W, (d.y + d.h / 2) * H] as const;
    const withPhoto = addSlot(lp, letter, "photo").page, xp = withPhoto.extras![0];
    ok("tap on an added photo selects it (editableAt and slotAt)", editableAt(letter, withPhoto, W, H, ...pt(xp))?.id === "x1" && slotAt(letter, W, H, ...pt(xp), withPhoto)?.id === "x1");
    ok("without the page, slotAt still sees the layout only", slotAt(letter, W, H, ...pt(xp))?.id !== "x1");
    const gone = deleteSlot(lp, letter, "title").page, tt = letter.slots.find((x) => x.id === "title")!;
    ok("tap where a deleted component was no longer selects it", editableAt(letter, gone, W, H, ...pt(tt))?.id !== "title" && slotAt(letter, W, H, ...pt(tt), gone)?.id !== "title");
    ok("tap there before deleting does select it", editableAt(letter, lp, W, H, ...pt(tt))?.id === "title");
    ok("added items are named so they cannot be mistaken for the layout's", slotName(letter, xp) === "Added photo 1" && slotName(letter, addSlot(lp, letter, "text").page.extras![0]) === "Added text 1" && new Set(pageEditable(letter, full).map((x) => slotName(letter, x))).size === pageEditable(letter, full).length);
  }

  // layout swap and page copy
  const withBoth = { ...deleteSlot(addSlot(lp, letter, "text").page, letter, "title").page };
  const swapped = swapLayout(withBoth, L("closing"));
  ok("swap layout clears hidden and keeps extras and their content", swapped.hidden === undefined && !("hidden" in swapped) && swapped.extras!.length === 1 && swapped.slots.x1 === "New text");
  ok("swap to the same layout changes nothing", swapLayout(withBoth, letter) === withBoth);
  ok("page copy shares nothing with the original (extras and hidden)", (() => { const pages = duplicatePage([mk("cover-full", { p1: { src: "a" } }), withBoth], 1); pages[2].extras![0].x = 0.9; pages[2].hidden!.push("zz"); return pages[1].extras![0].x !== 0.9 && pages[1].hidden!.length === 1; })());

  // Whatever the creator does, a page keeps at least one photo (property check over every layout, deterministic).
  let seed = 7; const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
  let bad = 0, ops = 0;
  for (const lay of LAYOUT_LIST) {
    let pg: PageData = swapLayout({ layout: "", slots: {} }, lay);
    for (let i = 0; i < 60; i++) {
      const list = pageEditable(lay, pg), pick = list[rnd(list.length)], op = rnd(4);
      const r = op === 0 ? addSlot(pg, lay, rnd(2) ? "text" : "photo") : op === 1 && pick ? duplicateSlot(pg, lay, pick.id) : pick ? deleteSlot(pg, lay, pick.id) : { page: pg };
      pg = r.page; ops++;
      if (pageSlots(lay, pg).filter((x) => x.kind === "photo").length < 1) bad++;
      if ((pg.extras?.length ?? 0) > MAX_EXTRAS) bad++;
      const idsNow = pageSlots(lay, pg).map((x) => x.id); if (new Set(idsNow).size !== idsNow.length) bad++;
    }
  }
  ok(`random add/copy/delete on every layout (${ops} steps): always a photo, at most 8 extras, ids unique`, bad === 0);
}

// ---- 3.8: resize maths ----
import { fitWithin } from "../src/lib/photo.ts";
ok("fitWithin shrinks the long side and keeps the shape", JSON.stringify(fitWithin(4000, 3000, 1600)) === '{"w":1600,"h":1200}' && JSON.stringify(fitWithin(3000, 4000, 1600)) === '{"w":1200,"h":1600}');
ok("fitWithin never enlarges", JSON.stringify(fitWithin(800, 600, 1600)) === '{"w":800,"h":600}');
ok("fitWithin never returns 0", fitWithin(10000, 1, 1600).h === 1);

console.log(fails ? `${fails} failed` : "editor helpers: all checks passed");
process.exit(fails ? 1 : 0);

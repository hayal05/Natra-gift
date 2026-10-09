// Run: npx tsx scripts/test-gifts.ts   (logic only, in-memory store; the Neon store and routes need a database)
import assert from "node:assert/strict";
import { checkDraft, createGift, hashToken, loadForEdit, loadForRecipient, memoryStore, newToken, updateGift } from "../src/server/gifts";
import { newDraft } from "../src/lib/draft";
import { MAX_EXTRAS, addSlot, setSlotText, deletePage, deleteSlot, duplicatePage, duplicateSlot, editableSlots, movePage, setPageBg, setPhoto, setTextStyle, swapLayout } from "../src/lib/editor";
import { LAYOUTS, TEMPLATE_LIST } from "../src/templates";

const site = "https://gift.test";
const draft = () => ({ ...newDraft("love-story", { to: "Maya", from: "Daniel" })! });
let n = 0; const ok = (m: string) => console.log("PASS " + m, ++n && "");

async function main() {
const store = memoryStore();
const made = await createGift(store, draft(), site);
assert(made.ok); const edit = made.value.editUrl.split("edit=")[1], priv = made.value.giftUrl.split("/g/")[1];
assert.match(made.value.giftUrl, /^https:\/\/gift\.test\/g\/[\w-]{32}$/); assert.notEqual(edit, priv); ok("create returns separate gift and edit links");

assert.equal((await store.byEditHash(hashToken(edit)))!.editTokenHash, hashToken(edit)); assert.notEqual((await store.byEditHash(hashToken(edit)))!.editTokenHash, edit);
assert.equal(JSON.stringify(await store.byPrivateToken(edit)), "null"); ok("only a hash of the edit token is stored; the edit token is not a gift link");

assert.equal((await loadForEdit(store, edit))!.to, "Maya"); assert.equal(await loadForEdit(store, priv), null);
assert.equal(await loadForEdit(store, "x"), null); assert.equal(await loadForEdit(store, null), null); assert.equal(await loadForEdit(store, newToken()), null); ok("edit read needs the edit token (recipient, wrong, missing tokens refused)");

const changed = draft(); changed.to = "  Maya R.  ";
assert.equal((await updateGift(store, priv, changed) as any).status, 403); assert.equal((await updateGift(store, undefined, changed) as any).status, 403); assert.equal((await updateGift(store, newToken(), changed) as any).status, 403);
assert.equal((await loadForEdit(store, edit))!.to, "Maya"); ok("recipient, missing and wrong tokens cannot write");
assert((await updateGift(store, edit, changed)).ok); assert.equal((await loadForRecipient(store, priv))!.to, "Maya R."); assert.equal((await store.byEditHash(hashToken(edit)))!.recipientName, "Maya R."); ok("edit token updates; recipient sees the change; names trimmed");
assert.equal(await loadForRecipient(store, edit), null); assert.equal(await loadForRecipient(store, "short"), null); ok("recipient read needs the private token");

const bad = (f: (d: any) => void) => { const d: any = draft(); f(d); return checkDraft(d).ok; };
assert(!bad((d) => d.templateId = "nope")); assert(!bad((d) => d.to = "  ")); assert(!bad((d) => d.from = "x".repeat(41))); assert(!bad((d) => d.invitation = "x".repeat(201)));
assert(!bad((d) => d.fontPair = 2)); assert(!bad((d) => d.paletteId = "nope")); assert(!bad((d) => d.pages = d.pages.slice(0, 3))); assert(!bad((d) => d.pages = Array(17).fill(d.pages[0])));
assert(!bad((d) => d.pages[1].layout = "nope")); assert(!bad((d) => d.pages[1].slots = null)); assert(!bad((d) => d.pages[1].slots.p1 = { src: "javascript:alert(1)" }));
assert(!bad((d) => d.pages[1].slots.p1 = { src: "http://insecure.test/a.jpg" })); assert(!bad((d) => d.pages[1].slots.title = "x".repeat(1001))); assert(!bad((d) => d.v = 2));
assert(bad((d) => d.pages[1].slots.p1 = { src: "https://res.cloudinary.com/x/a.jpg" })); assert(bad((d) => d.pages[1].slots.p1 = { src: "data:image/jpeg;base64,AAAA" })); assert(bad((d) => d.paletteId = "wedding"));
assert(!checkDraft(null).ok && !checkDraft("x").ok && !checkDraft([]).ok); ok("bad drafts are refused, good photo sources accepted");

// ---- 4.3: deeper checks ----
const opt = { cloud: "mycloud" };
const chk = (f: (d: any) => void, o: any = opt) => { const d: any = draft(); f(d); return checkDraft(d, o); };
for (const t of TEMPLATE_LIST) { const d = newDraft(t.id, { to: "Maya", from: "Daniel" })!; const r = checkDraft(d, opt); assert(r.ok, t.id + " sample draft"); assert.deepEqual(r.draft.pages, d.pages, t.id + " pages unchanged by cleaning"); }
ok("all 10 template drafts pass unchanged");
const d2: any = draft(); const lay = LAYOUTS["letter"]; let pg = swapLayout(d2.pages[2], lay, 1);
pg = setTextStyle(pg, "body", { size: "L", align: "right", color: "accent", font: "display" }); pg = setPhoto(swapLayout(pg, LAYOUTS["photo-full"] ?? lay, 0), "p1", { zoom: 2, panX: 0.5, fit: "fit", filter: "bw", frame: "rounded" }); pg = setPageBg(pg, "soft"); pg = { ...pg, slots: { ...pg.slots, leftover: "old text" } }; d2.pages[2] = pg;
const e = checkDraft(d2, opt); assert(e.ok, JSON.stringify(e)); ok("an edited draft (swapped layouts, styles, photo settings, page colour) passes");
assert(Object.keys(pg.slots).some((id) => !LAYOUTS[pg.layout].slots.some((s) => s.id === id)), "test setup: stale slots exist");
assert(Object.keys(e.draft.pages[2].slots).every((id) => LAYOUTS[e.draft.pages[2].layout].slots.some((s) => s.id === id))); ok("slots the layout does not define are dropped");
assert(!chk((d) => d.pages[1].slots.p1 = { src: "https://evil.test/a.jpg" }).ok); assert(chk((d) => d.pages[1].slots.p1 = { src: "https://res.cloudinary.com/mycloud/image/upload/a.jpg" }).ok);
assert(!chk((d) => d.pages[1].slots.p1 = { src: "https://res.cloudinary.com/other/image/upload/a.jpg" }).ok); assert(chk((d) => d.pages[1].slots.p1 = { src: "https://anything.test/a.jpg" }, {}).ok); ok("https photos must come from our Cloudinary account when it is set");
const pid = (d: any): string => LAYOUTS[d.pages[1].layout].slots.find((s: any) => s.kind === "photo")!.id; const tid = (d: any) => LAYOUTS[d.pages[1].layout].slots.find((s: any) => s.kind === "text" && !s.auto && s.text === undefined)!.id as string;
for (const b2 of [{ zoom: 4 }, { zoom: 0.5 }, { zoom: NaN }, { panX: 2 }, { panY: "0" }, { fit: "stretch" }, { filter: "x" }, { frame: "x" }]) assert(!chk((d) => d.pages[1].slots[pid(d)] = { src: "sample:1", ...b2 }).ok, JSON.stringify(b2));
ok("photo settings out of range refused");
assert(!chk((d) => d.pages[1].slots[tid(d)] = 5).ok); assert(!chk((d) => d.pages[1].slots[tid(d)] = "x".repeat(900)).ok); assert(!chk((d) => d.pages[1].slots[pid(d)] = "text").ok); ok("wrong kind or oversized text refused");
assert(!chk((d) => d.pages[1].bg = "#ff0000").ok); assert(!chk((d) => d.pages[1].bg = "url(x)").ok); assert(chk((d) => d.pages[1].bg = "dark").ok);
assert(!chk((d) => d.pages[1].styles = { [tid(d)]: { color: "red" } }).ok); assert(!chk((d) => d.pages[1].styles = { [tid(d)]: { size: "XL" } }).ok); assert(!chk((d) => d.pages[1].styles = [1]).ok); assert(chk((d) => d.pages[1].styles = { [tid(d)]: { size: "S", color: "ink" } }).ok); ok("page colour and text styles must be presets");
const x: any = draft(); x.extra = "<script>"; x.pages[1].extra = 1; x.to = "Ma\u0000ya\u0007"; x.invitation = "Hi\u001b there\nline 2";
const cx = checkDraft(x, opt); assert(cx.ok); assert(!("extra" in cx.draft) && !("extra" in cx.draft.pages[1]) && cx.draft.to === "Maya" && cx.draft.invitation === "Hi there\nline 2"); ok("unknown fields dropped, control characters stripped, newline kept");
const same: any = draft(); same.paletteId = same.templateId; assert(!("paletteId" in (checkDraft(same, opt) as any).draft)); ok("template's own palette id is not stored");
const r = await createGift(store, { v: 1 }, site); assert(!r.ok && r.status === 400); ok("invalid create returns 400");

// ---- 8.5: audio notes ----
const aud = (src: string, duration: unknown = 30) => ({ src, duration });
const good = "https://res.cloudinary.com/mycloud/video/upload/v1/flipbook-audio/note.mp3";
const withAudio = (a: unknown, o: any = opt) => chk((d) => { d.pages[2].audio = a; }, o);
{ const r = withAudio(aud(good, 29.6)); assert(r.ok); assert.deepEqual((r as any).draft.pages[2].audio, { src: good, duration: 30 }); assert(!("audio" in (r as any).draft.pages[1])); }
ok("a valid audio note is kept on its page (duration rounded), other pages have none");
assert(withAudio(aud(good), {}).ok); assert(!withAudio(aud("https://res.cloudinary.com/other/video/upload/a.mp3")).ok); assert(withAudio(aud("https://res.cloudinary.com/other/video/upload/a.mp3"), {}).ok); ok("audio must come from our cloud when it is set");
for (const s of ["https://evil.test/video/upload/a.mp3", "https://res.cloudinary.com.evil.test/mycloud/video/upload/a.mp3", "http://res.cloudinary.com/mycloud/video/upload/a.mp3", "javascript:alert(1)", "data:audio/mpeg;base64,AAAA", "sample:1", "", "https://res.cloudinary.com/mycloud/image/upload/a.jpg", "https://res.cloudinary.com/mycloud/raw/upload/a.mp3", "https://res.cloudinary.com/mycloud/video/upload/a b.mp3", "https://res.cloudinary.com/mycloud/video/upload/" + "x".repeat(501)]) assert(!withAudio(aud(s), {}).ok, s);
assert(!withAudio({ duration: 30 }).ok); assert(!withAudio({ src: 5, duration: 30 }).ok); assert(!withAudio("x").ok); assert(!withAudio([good]).ok); assert(!withAudio(null).ok); ok("non-Cloudinary, http, data, wrong resource type and malformed notes refused");
for (const t of [0, 0.4, -1, 181, 1e9, NaN, Infinity, "30", null, undefined]) assert(!withAudio({ src: good, duration: t }).ok, String(t)); for (const t of [1, 180, 90.4]) assert(withAudio(aud(good, t)).ok, String(t)); ok("duration must be 1 to 180 seconds");
{ const dd: any = draft(); dd.pages[2].audio = { src: good, duration: 20, extra: "<x>" }; const c = checkDraft(dd, opt); assert(c.ok && JSON.stringify((c as any).draft.pages[2].audio) === JSON.stringify({ src: good, duration: 20 })); } ok("unknown fields inside a note are dropped");
{ const dd: any = draft(); dd.pages[2].audio = aud(good, 25);
  const sw = swapLayout(dd.pages[2], LAYOUTS["letter"], 1); assert.deepEqual(sw.audio, dd.pages[2].audio, "layout swap");
  const st = setTextStyle(setPageBg(dd.pages[2], "soft"), "body", { size: "L" }); assert.deepEqual(st.audio, dd.pages[2].audio, "style and bg");
  const dup = duplicatePage(dd.pages, 2); assert.deepEqual(dup[3].audio, dd.pages[2].audio, "duplicate copies the note"); assert.deepEqual(dup[2].audio, dd.pages[2].audio);
  const mv = movePage(dd.pages, 2, 1); assert.deepEqual(mv[3].audio, dd.pages[2].audio, "move keeps the note on its page"); assert(!mv[2].audio);
  const del = deletePage(dd.pages, 1); assert.deepEqual(del[1].audio, dd.pages[2].audio, "delete keeps the other notes");
  dd.pages = mv; assert(checkDraft(dd, opt).ok); dd.pages = dup; assert(checkDraft(dd, opt).ok); } ok("a note survives layout swap, styling, duplicate, move and delete of another page");
{ const dd: any = draft(); dd.pages[2].audio = aud(good); const m2 = await createGift(store, dd, site); assert(m2.ok); const p2 = m2.value.giftUrl.split("/g/")[1];
  assert.equal((await loadForRecipient(store, p2))!.pages[2].audio!.src, good); } ok("a published gift hands the note to the recipient");

// ---- 10.4c: added and deleted components, photo boxes, size cap ----
const asJson = <T,>(v: T): T => JSON.parse(JSON.stringify(v)); // what actually travels to the server
const withPage = (f: (pg: any, d: any) => void, o: any = opt) => chk((d) => { f(d.pages[1], d); }, o);
const L1 = (d: any) => LAYOUTS[d.pages[1].layout];
{ // photo's own box is kept (it used to be dropped, so a moved photo reverted on the gift link)
  const r = withPage((pg, d) => { pg.slots[pid(d)] = { src: "sample:1", x: 0.1, y: 0.2, w: 0.5, h: 0.4 }; });
  assert(r.ok); const ph: any = (r as any).draft.pages[1].slots[pid((r as any).draft)]; assert.deepEqual([ph.x, ph.y, ph.w, ph.h], [0.1, 0.2, 0.5, 0.4]);
  for (const b2 of [{ x: -0.1 }, { x: 0.91 }, { y: 1 }, { w: 0.05 }, { w: 1.1 }, { h: 0 }, { x: "0" }, { y: NaN }]) assert(!withPage((pg, d) => { pg.slots[pid(d)] = { src: "sample:1", ...b2 }; }).ok, JSON.stringify(b2));
  assert(withPage((pg, d) => { pg.slots[pid(d)] = { src: "sample:1", x: 0.9, y: 0.9, w: 0.1, h: 0.1 }; }).ok); } ok("a photo keeps its own box (x, y 0 to 0.9; w, h 0.1 to 1); out of range refused");

{ // the real editor helpers, on every layout: what the editor makes, the server keeps unchanged
  let checked = 0;
  for (const layout of Object.values(LAYOUTS)) {
    const d: any = draft(); let pg: any = swapLayout(d.pages[1], layout, 0);
    const first = editableSlots(layout);
    for (const e of first) if (e.kind === "text" && typeof pg.slots[e.id] === "string") pg = setSlotText(pg, e, pg.slots[e.id]); // a plain layout swap can carry more text than a slot allows (existing behaviour); typing cuts it
    const t = addSlot(pg, layout, "text"); pg = t.page; pg = addSlot(pg, layout, "photo").page;
    pg = setPhoto(pg, "x2", { src: "sample:2", x: 0.3, y: 0.3, w: 0.4, h: 0.3, zoom: 1.5 });
    for (const s of first.slice(0, 3)) { const c = duplicateSlot(pg, layout, s.id); if (!c.reason) pg = c.page; }
    const gone = first.find((s) => s.kind === "text"); if (gone) { const r = deleteSlot(pg, layout, gone.id); pg = r.page; }
    const lastExtra = (pg.extras ?? []).slice(-1)[0]; if (lastExtra) pg = deleteSlot(pg, layout, lastExtra.id).page;
    pg = asJson(pg); d.pages[1] = pg;
    const known = new Set([...editableSlots(layout).map((e) => e.id), ...(pg.extras ?? []).map((e: any) => e.id)]); // content left over from the previous layout is dropped, as it always was
    const expected = { ...pg, slots: Object.fromEntries(Object.entries(pg.slots).filter(([k]) => known.has(k))) };
    if (pg.styles) { const st = Object.fromEntries(Object.entries(pg.styles).filter(([k]) => known.has(k))); if (Object.keys(st).length) expected.styles = st; else delete expected.styles; }
    const r = checkDraft(d, opt); assert(r.ok, layout.id + ": " + JSON.stringify(r));
    assert.deepEqual(asJson((r as any).draft.pages[1]), expected, layout.id + ": page changed by the server check"); checked++;
  }
  assert(checked >= 60); } ok("add, copy and delete results of every layout pass the server check unchanged");

{ const d: any = draft(); const lay = LAYOUTS[d.pages[1].layout]; let pg: any = addSlot(swapLayout(d.pages[1], lay, 0), lay, "text").page;
  const tx = addSlot(pg, lay, "text"); pg = tx.page; const id = tx.id!; pg.slots[id] = "Hello \u0007there"; pg = setTextStyle(pg, id, { size: "L", color: "accent" }); pg = asJson(pg); d.pages[1] = pg;
  const r = checkDraft(d, opt) as any; assert(r.ok, JSON.stringify(r)); assert.equal(r.draft.pages[1].slots[id], "Hello there"); assert.deepEqual(r.draft.pages[1].styles[id], { size: "L", color: "accent" });
  assert.equal(r.draft.pages[1].extras.length, 2); assert(r.draft.pages[1].extras.every((e: any) => /^x\d+$/.test(e.id))); } ok("an added text keeps its content and style (control characters stripped)");

{ const bx = (e: any) => ({ id: "x1", kind: "text", x: 0.2, y: 0.4, w: 0.6, h: 0.1, font: "body", size: 0.04, color: "ink", ...e });
  const ext = (list: any[]) => withPage((pg) => { pg.extras = list; });
  assert(ext([bx({})]).ok && ext([]).ok); assert(!("extras" in (ext([]) as any).draft.pages[1])); ok("a valid added text is accepted; an empty list is dropped");
  const refused: [string, any[]][] = [
    ["id not x plus digits", [bx({ id: "y1" })]], ["id with script", [bx({ id: "x1<script>" })]], ["id is a layout slot", [bx({ id: "title" })]], ["duplicate ids", [bx({}), bx({})]],
    ["kind shape", [bx({ kind: "shape" })]], ["no kind", [bx({ kind: undefined })]], ["x below 0", [bx({ x: -0.1 })]], ["x above 1", [bx({ x: 1.01 })]], ["w 0", [bx({ w: 0 })]], ["h NaN", [bx({ h: NaN })]], ["string geometry", [bx({ y: "0.4" })]],
    ["bad font", [bx({ font: "comic" })]], ["size 0", [bx({ size: 0 })]], ["size huge", [bx({ size: 3 })]], ["bad colour", [bx({ color: "url(x)" })]], ["colour with script", [bx({ color: "#fff;x" })]], ["bad align", [bx({ align: "justify" })]], ["hint too long", [bx({ hint: "x".repeat(61) })]], ["rot out of range", [bx({ rot: { deg: 90, cx: 0.5, cy: 0.5 } })]], ["rot pivot outside", [bx({ rot: { deg: 3, cx: 2, cy: 0.5 } })]], ["not an array", "x" as any], ["an item that is not an object", [5]],
    ["too many (9)", Array.from({ length: MAX_EXTRAS + 1 }, (_, i) => bx({ id: "x" + (i + 1) }))],
    ["photo with bad frame", [{ id: "x1", kind: "photo", x: 0.2, y: 0.2, w: 0.5, h: 0.4, frame: "glow" }]], ["photo matBottom too big", [{ id: "x1", kind: "photo", x: 0.2, y: 0.2, w: 0.5, h: 0.4, matBottom: 1 }]],
  ];
  for (const [why, list] of refused) assert(!ext(list as any).ok, why);
  assert(ext(Array.from({ length: MAX_EXTRAS }, (_, i) => bx({ id: "x" + (i + 1) }))).ok); assert(ext([bx({ color: "#fff" })]).ok); assert(ext([bx({ rot: { deg: -5, cx: 0.5, cy: 0.5 } })]).ok); ok("added items: bad ids, kinds, geometry, presets, rotation and more than 8 refused"); }

{ // task 11.2f: a font family is accepted only as a registry id, for styles and for added text
  const bx = (e: any) => ({ id: "x1", kind: "text", x: 0.2, y: 0.4, w: 0.6, h: 0.1, font: "body", size: 0.04, color: "ink", ...e });
  const ext = (e: any) => withPage((pg) => { pg.extras = [bx(e)]; pg.slots.x1 = "hi"; });
  assert(ext({ family: "lora" }).ok && ext({}).ok); assert((ext({ family: "lora" }) as any).draft.pages[1].extras[0].family === "lora");
  for (const v of ["comic-sans", "Lora", "", 5, null, "lora;x", "<script>"]) assert(!ext({ family: v }).ok, "extra family " + String(v));
  const sty = (family: unknown) => withPage((pg, d) => { const id = Object.keys(pg.slots).find((k) => typeof pg.slots[k] === "string")!; pg.styles = { [id]: { family } }; });
  assert(sty("playfair-display").ok); assert((sty("playfair-display") as any).draft.pages[1].styles); 
  for (const v of ["nope", "Lora", 3, null, ""]) assert(!sty(v).ok, "style family " + String(v));
  ok("font family: registry ids accepted for styles and added text; unknown, wrong-case and non-string values refused"); }

{ const r = withPage((pg) => { pg.extras = [{ id: "x1", kind: "text", x: 0.2, y: 0.4, w: 0.6, h: 0.1, font: "body", size: 0.04, color: "ink", auto: "folio", text: "fixed", evil: "<x>", onclick: "a()" }]; pg.slots.x1 = "hi"; });
  assert(r.ok); const e: any = (r as any).draft.pages[1].extras[0]; assert(!("auto" in e) && !("text" in e) && !("evil" in e) && !("onclick" in e)); ok("an added text cannot carry `auto`, fixed text or unknown fields"); }

{ // content of added items follows the same rules as the layout's own
  const px = { id: "x1", kind: "photo", x: 0.25, y: 0.3, w: 0.5, h: 0.4 }, tx = { id: "x2", kind: "text", x: 0.2, y: 0.4, w: 0.6, h: 0.1, font: "body", size: 0.04, color: "ink" };
  const put = (c1: any, c2: any = "t", o: any = opt) => withPage((pg) => { pg.extras = [px, tx]; pg.slots.x1 = c1; pg.slots.x2 = c2; }, o);
  assert(put({ src: "sample:1" }).ok); assert(put({ src: "" }).ok); assert(put({ src: "https://res.cloudinary.com/mycloud/image/upload/a.jpg" }).ok);
  assert(!put({ src: "https://evil.test/a.jpg" }).ok); assert(!put({ src: "https://res.cloudinary.com/other/image/upload/a.jpg" }).ok); assert(!put({ src: "javascript:alert(1)" }).ok); assert(!put({ src: "http://x.test/a.jpg" }).ok);
  assert(!put({ src: "sample:1", zoom: 9 }).ok); assert(!put("text").ok); assert(!put({ src: "sample:1" }, 5).ok); assert(!put({ src: "sample:1" }, "x".repeat(900)).ok);
  // an empty photo is allowed only for an ADDED photo, never for the layout's own
  assert(!withPage((pg, d) => { pg.slots[pid(d)] = { src: "" }; }).ok);
  // content of an id nobody defined is dropped, not stored
  const o = withPage((pg) => { pg.slots.x7 = "orphan"; pg.styles = { x7: { size: "S" } }; }); assert(o.ok && !("x7" in (o as any).draft.pages[1].slots) && !(o as any).draft.pages[1].styles); } ok("added items: photo source, cloud, ranges and text rules match the layout's own; orphan content dropped");

{ const ids = (d: any) => editableSlots(L1(d)).map((s) => s.id), texts = (d: any) => editableSlots(L1(d)).filter((s) => s.kind === "text").map((s) => s.id);
  const h = (f: (d: any) => any, o: any = opt) => chk((d) => { d.pages[1].hidden = f(d); }, o);
  const r: any = h((d) => [texts(d)[0]]); assert(r.ok); assert.deepEqual(r.draft.pages[1].hidden, [texts(draft())[0]]);
  assert(h(() => []).ok && !("hidden" in (h(() => []) as any).draft.pages[1]));
  assert(!h(() => "title").ok); assert(!h(() => [5]).ok); assert(!h(() => ["nope"]).ok); assert(!h(() => ["x1"]).ok); assert(!h((d) => [texts(d)[0], texts(d)[0]]).ok); assert(!h(() => Array(33).fill("title")).ok); assert(!h(() => null).ok);
  assert(!h((d) => ids(d).filter((i) => (L1(d).slots.find((s) => s.id === i) as any).kind === "photo")).ok, "hiding every photo is refused"); // a page keeps at least one photo
  const withExtraPhoto = chk((d) => { const l = L1(d); d.pages[1].extras = [{ id: "x1", kind: "photo", x: 0.2, y: 0.2, w: 0.5, h: 0.4 }]; d.pages[1].slots.x1 = { src: "sample:1" }; d.pages[1].hidden = ids(d).filter((i) => (l.slots.find((s) => s.id === i) as any).kind === "photo"); }); assert(withExtraPhoto.ok, "an added photo keeps the page valid");
  const s2: any = draft(); const lay2 = LAYOUTS[s2.pages[1].layout]; const del = deleteSlot(swapLayout(s2.pages[1], lay2, 0), lay2, texts(s2)[0]); assert(del.page.hidden); s2.pages[1] = asJson(del.page); const c2 = checkDraft(s2, opt) as any; assert(c2.ok); assert.equal(c2.draft.pages[1].slots[texts(s2)[0]] !== undefined, true, "hidden content is kept"); } ok("hidden: only the layout's own components, no repeats, never every photo of the page");

{ // a page with 8 added photos stays under the size cap; a huge gift is refused with a plain message
  const small = chk((d) => { const l = L1(d); let pg: any = d.pages[1]; for (let i = 0; i < MAX_EXTRAS; i++) pg = addSlot(pg, l, i % 2 ? "photo" : "text").page; d.pages[1] = asJson(pg); }); assert(small.ok); assert(JSON.stringify((small as any).draft).length < 100_000);
  const big = "data:image/jpeg;base64," + "A".repeat(1_500_000); // 3 of these are over the 4 MB cap, 2 are not
  const tooBig = chk((d) => { for (const i of [1, 2, 3]) { const l = LAYOUTS[d.pages[i].layout]; const id = l.slots.find((s: any) => s.kind === "photo")!.id; d.pages[i].slots[id] = { src: big }; } });
  assert(!tooBig.ok && /too big/i.test((tooBig as any).message), "a 4.5 MB gift must be refused as too big: " + String((tooBig as any).message).slice(0, 80));
  const justFits = chk((d) => { for (const i of [1, 2]) { const l = LAYOUTS[d.pages[i].layout]; const id = l.slots.find((s: any) => s.kind === "photo")!.id; d.pages[i].slots[id] = { src: big }; } }); assert(justFits.ok, "a 3 MB gift must pass: " + String((justFits as any).message).slice(0, 80)); } ok("8 added items stay small; a gift over the 4 MB cap is refused with a plain message");

{ const dd: any = draft(); const l = LAYOUTS[dd.pages[2].layout]; let pg: any = addSlot(swapLayout(dd.pages[2], l, 0), l, "photo").page; dd.pages[2] = asJson(pg);
  const m2 = await createGift(store, dd, site); assert(m2.ok); const p2 = m2.value.giftUrl.split("/g/")[1]; const got = (await loadForRecipient(store, p2))!;
  assert.equal(got.pages[2].extras!.length, 1); assert(got.pages[2].slots.x1 !== undefined);
  const e2: any = m2.value.editUrl.split("edit=")[1]; dd.pages[2] = asJson(deleteSlot(pg, l, "x1").page); assert((await updateGift(store, e2, dd)).ok); assert(!(await loadForRecipient(store, p2))!.pages[2].extras); } ok("a published gift keeps added items for the recipient, and an edit removes them");
console.log("gift logic: all checks passed");
}
main().catch((e) => { console.error(e); process.exit(1); });

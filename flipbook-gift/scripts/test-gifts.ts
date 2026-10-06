// Run: npx tsx scripts/test-gifts.ts   (logic only, in-memory store; the Neon store and routes need a database)
import assert from "node:assert/strict";
import { checkDraft, createGift, hashToken, loadForEdit, loadForRecipient, memoryStore, newToken, updateGift } from "../src/server/gifts";
import { newDraft } from "../src/lib/draft";
import { setPageBg, setPhoto, setTextStyle, swapLayout } from "../src/lib/editor";
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
console.log("gift logic: all checks passed");
}
main().catch((e) => { console.error(e); process.exit(1); });

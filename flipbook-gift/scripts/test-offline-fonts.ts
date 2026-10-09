// Run: npx tsx scripts/test-offline-fonts.ts   (task 11.2g: which font families the offline file carries)
import assert from "node:assert/strict";
import { offlineFontFamilies } from "../src/lib/offline";
import { newDraft } from "../src/lib/draft";
import { FONT_LIST } from "../src/lib/pages/fontlist";

const mk = () => newDraft("love-story", { to: "Maya", from: "Daniel" })! as any;
const base = offlineFontFamilies(mk());
assert.equal(base.length, 2, "a book with no picked fonts carries just its pair"); assert.equal(new Set(base).size, 2);

{ const d = mk(); const id = Object.keys(d.pages[1].slots).find((k) => typeof d.pages[1].slots[k] === "string")!;
  d.pages[1].styles = { [id]: { family: "lora" } };
  const f = offlineFontFamilies(d); assert(f.includes("Lora") && f.slice(0, 2).join() === base.join(), "pair first, then the picked family"); }

{ const d = mk(); d.pages[1].styles = { a: { family: "lora" }, b: { family: "lora" } }; d.pages[2].extras = [{ id: "x1", kind: "text", family: "lora" }, { id: "x2", kind: "text", family: "jost" }];
  const f = offlineFontFamilies(d); assert.equal(f.filter((x) => x === "Lora").length, 1, "no family twice"); assert(f.includes("Jost")); }

{ const d = mk(); d.pages[1].styles = { a: { family: "nope" } }; d.pages[1].extras = [{ id: "x1", kind: "text", family: "Lora" }];
  assert.deepEqual(offlineFontFamilies(d), base, "unknown ids add nothing"); }

{ const d = mk(); d.pages[1].styles = { a: { family: FONT_LIST[0].id } }; const f = offlineFontFamilies(d);
  assert(f.includes(FONT_LIST[0].family)); }

{ const d = mk(); d.templateId = "nope"; assert.deepEqual(offlineFontFamilies(d), []); }
console.log("offline font families: all checks passed");

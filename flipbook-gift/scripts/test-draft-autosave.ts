// Run: npx tsx scripts/test-draft-autosave.ts
import assert from "node:assert/strict";
import { loadDraft, loadDraftStep, loadLastTemplateId, newDraft, saveDraft, saveDraftStep } from "../src/lib/draft";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)); },
    removeItem: (key: string) => { memory.delete(key); },
  },
});
const a = newDraft("love-story")!;
a.to = "Saved name";
a.pages[0] = { ...a.pages[0], celebration: "hearts" };
assert.equal(saveDraft(a), true);
saveDraftStep(a.templateId, "pages");
const b = newDraft("birthday")!;
b.to = "Another name";
assert.equal(saveDraft(b), true);
saveDraftStep(b.templateId, "names");

assert.equal(loadDraft("love-story")?.to, "Saved name", "first template edits preserved");
assert.equal(loadDraft("love-story")?.pages[0].celebration, "hearts");
assert.equal(loadDraftStep("love-story"), "pages", "editor step restored");
assert.equal(loadDraftStep("birthday"), "names");
assert.equal(loadDraft("birthday")?.to, "Another name", "other template saved separately");
assert.equal(loadDraft()?.templateId, "birthday", "default resumes latest template");
assert.equal(loadLastTemplateId(), "birthday");

memory.clear();
memory.set("flipbook:draft", JSON.stringify(a));
assert.equal(loadDraft("love-story")?.to, "Saved name", "legacy saved edits remain readable");
assert.equal(saveDraft(a), true);
assert.equal(memory.has("flipbook:draft"), false, "legacy copy removed on migration");
assert.equal(loadDraft("love-story")?.to, "Saved name");
console.log("PASS: per-template autosave, step recovery and legacy migration");

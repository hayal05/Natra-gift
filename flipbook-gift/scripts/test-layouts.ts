// Manual check for the layout library. Run: node --experimental-strip-types scripts/test-layouts.ts
import { LAYOUT_LIST } from "../src/templates/layouts.ts";

let fails = 0;
const ok = (name: string, cond: boolean) => { if (!cond) { console.log("FAIL " + name); fails++; } };
const ids = new Set<string>();
const eps = 1e-9;
for (const l of LAYOUT_LIST) {
  ok(`${l.id}: unique layout id`, !ids.has(l.id)); ids.add(l.id);
  const photos = l.slots.filter((s) => s.kind === "photo");
  ok(`${l.id}: has a photo slot (rule 9)`, photos.length >= 1);
  const slotIds = new Set<string>();
  for (const s of l.slots) {
    ok(`${l.id}.${s.id}: unique slot id`, !slotIds.has(s.id)); slotIds.add(s.id);
    ok(`${l.id}.${s.id}: inside the page`, s.x >= -eps && s.y >= -eps && s.x + s.w <= 1 + eps && s.y + s.h <= 1 + eps && s.w > 0 && s.h > 0);
    if (s.kind === "photo") ok(`${l.id}.${s.id}: photo ids are p1..p3`, /^p[1-3]$/.test(s.id));
  }
  // Text boxes must not overlap each other (rotated ones are skipped; decorative fixed text is exempt).
  const texts = l.slots.filter((s) => s.kind === "text" && !s.rot && !s.text);
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j];
    ok(`${l.id}: text ${a.id} and ${b.id} overlap`, a.x + a.w <= b.x + eps || b.x + b.w <= a.x + eps || a.y + a.h <= b.y + eps || b.y + b.h <= a.y + eps);
  }
  // Photo ids must be contiguous from p1 so "swap layout" maps photos predictably.
  ok(`${l.id}: photos are p1..pN`, photos.every((p, i) => p.id === `p${i + 1}`) || photos.map((p) => p.id).sort().every((id, i) => id === `p${i + 1}`));
}
const byGroup: Record<string, number> = {};
LAYOUT_LIST.forEach((l) => (byGroup[l.group] = (byGroup[l.group] ?? 0) + 1));
console.log(LAYOUT_LIST.length + " layouts", JSON.stringify(byGroup));
ok("covers: 4", byGroup.cover === 4);
console.log(fails ? `${fails} FAILED` : "all layout checks passed");
process.exit(fails ? 1 : 0);

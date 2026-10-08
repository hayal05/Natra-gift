// Manual check for the templates. Run: node --experimental-strip-types scripts/test-templates.ts
import { readFileSync } from "node:fs";
import { TEMPLATE_LIST } from "../src/templates/templates.ts";
import { LAYOUTS } from "../src/templates/layouts.ts";
import { instantiate } from "../src/templates/build.ts";

let fails = 0, warns = 0;
const ok = (name: string, cond: boolean) => { if (!cond) { console.log("FAIL " + name); fails++; } };
const warn = (name: string, cond: boolean) => { if (!cond) { console.log("warn " + name); warns++; } };

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

ok("10 templates", TEMPLATE_LIST.length === 10);
const seen = { id: new Set<string>(), mast: new Set<string>(), display: new Set<string>(), accent: new Set<string>() };
for (const t of TEMPLATE_LIST) {
  const id = t.id;
  ok(`${id}: unique id`, !seen.id.has(id)); seen.id.add(id);
  ok(`${id}: unique masthead`, !seen.mast.has(t.masthead)); seen.mast.add(t.masthead);
  ok(`${id}: unique display font`, !seen.display.has(t.fontPairs[0].display)); seen.display.add(t.fontPairs[0].display);
  ok(`${id}: unique accent colour`, !seen.accent.has(t.palette.accent)); seen.accent.add(t.palette.accent);
  ok(`${id}: 6 to 8 pages (${t.pages.length})`, t.pages.length >= 6 && t.pages.length <= 8);
  ok(`${id}: first page is a cover`, LAYOUTS[t.pages[0].layout]?.group === "cover");
  ok(`${id}: only the first page is a cover`, t.pages.slice(1).every((p) => LAYOUTS[p.layout]?.group !== "cover"));
  ok(`${id}: last page is a closing`, LAYOUTS[t.pages.at(-1)!.layout]?.group === "closing");
  ok(`${id}: two different font pairs`, t.fontPairs[0].display !== t.fontPairs[1].display);

  const P = t.palette;
  ok(`${id}: ink on paper >= 7 (${contrast(P.ink, P.paper).toFixed(1)})`, contrast(P.ink, P.paper) >= 7);
  ok(`${id}: accent on paper >= 4.5 for small labels (${contrast(P.accent, P.paper).toFixed(1)})`, contrast(P.accent, P.paper) >= 4.5);
  ok(`${id}: white on accent >= 3 for large text (${contrast("#ffffff", P.accent).toFixed(1)})`, contrast("#ffffff", P.accent) >= 3);
  ok(`${id}: white on dark >= 7`, contrast("#ffffff", P.dark) >= 7);
  ok(`${id}: accent2 on dark >= 4.5 (${contrast(P.accent2, P.dark).toFixed(1)})`, contrast(P.accent2, P.dark) >= 4.5);
  ok(`${id}: accent on soft >= 4.5 (${contrast(P.accent, P.soft).toFixed(1)})`, contrast(P.accent, P.soft) >= 4.5);

  const text = JSON.stringify(t.pages) + t.invitation;
  ok(`${id}: uses {to} and {from}`, text.includes("{to}") && text.includes("{from}"));
  ok(`${id}: no unknown {tokens}`, [...text.matchAll(/\{(\w+)\}/g)].every((m) => m[1] === "to" || m[1] === "from"));

  t.pages.forEach((p, i) => {
    const L = LAYOUTS[p.layout];
    ok(`${id} p${i + 1}: layout "${p.layout}" exists`, !!L);
    if (!L) return;
    for (const [k, v] of Object.entries(p.slots)) {
      const s = L.slots.find((x) => x.id === k);
      ok(`${id} p${i + 1}: slot "${k}" exists in ${p.layout}`, !!s);
      if (s?.kind === "photo") ok(`${id} p${i + 1}: ${k} is photo content`, typeof v === "object");
      if (s?.kind === "text") ok(`${id} p${i + 1}: ${k} is text`, typeof v === "string");
    }
    for (const s of L.slots) {
      if (s.kind === "photo") ok(`${id} p${i + 1}: photo ${s.id} filled`, typeof p.slots[s.id] === "object");
      // Templates arrive finished: every editable text slot should have copy (folio/decor excluded).
      if (s.kind === "text" && !s.auto && !s.text) warn(`${id} p${i + 1} (${p.layout}): text slot "${s.id}" is empty`, !!(p.slots[s.id] as string)?.trim());
    }
  });

  const inst = instantiate(t, { to: "Maya", from: "Daniel" });
  const out = JSON.stringify(inst);
  ok(`${id}: instantiate leaves no tokens`, !/\{(to|from)\}/.test(out));
  ok(`${id}: instantiate does not mutate the template`, JSON.stringify(t.pages).includes("{to}"));
  const alt = instantiate(t, { to: "A", from: "B" }, 1);
  ok(`${id}: font pair 1 applies`, alt.book.fonts.display === t.fontPairs[1].display);
}
// Task 10.1: every template opens as its own book, and the landing page never links to a bare /create (that resumes the last draft).
const covers = new Set(TEMPLATE_LIST.map((t) => t.pages[0].layout));
ok(`10 different cover layouts (${covers.size})`, covers.size === TEMPLATE_LIST.length);
const seqs = new Set(TEMPLATE_LIST.map((t) => t.pages.map((p) => p.layout).join(",")));
ok(`10 different page sequences (${seqs.size})`, seqs.size === TEMPLATE_LIST.length);
const landing = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
ok("landing page has no link to a bare /create", !/href=["']\/create["']/.test(landing));
ok("landing page links carry the template id", (landing.match(/create\?t=\$\{active\.id\}/g) ?? []).length >= 3);
console.log(`${TEMPLATE_LIST.length} templates, ${TEMPLATE_LIST.reduce((n, t) => n + t.pages.length, 0)} pages`);
console.log(fails ? `${fails} FAILED` : "all template checks passed", warns ? `(${warns} warnings)` : "");
process.exit(fails ? 1 : 0);

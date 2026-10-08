import { LAYOUTS, TEMPLATE_LIST, fillPages } from "../src/templates/index.ts";
import { pageEditable, editableAt } from "../src/lib/editor.ts";
import { photoSlotRect, textSlotRect } from "../src/lib/pages/render.ts";
const W = 360, H = 480, out: any[] = [];
for (const t of TEMPLATE_LIST) {
  const pg = fillPages(t.pages, { to: "Natra", from: "Sam" })[0];
  const l = LAYOUTS[pg.layout];
  const items = pageEditable(l, pg).map((s) => { const raw = pg.slots[s.id]; const r = s.kind === "text" ? textSlotRect(s, pg.styles?.[s.id], W, H) : photoSlotRect(s, typeof raw === "object" && raw ? raw : undefined, W, H);
    // a point where this component is the topmost one
    let pt: number[] | null = null;
    for (let y = r.y + 4; y < r.y + r.h && !pt; y += 6) for (let x = r.x + 4; x < r.x + r.w && !pt; x += 6) if (editableAt(l, pg, W, H, x, y, pg.styles)?.id === s.id) pt = [x, y];
    return { id: s.id, kind: s.kind, r, pt }; });
  out.push({ t: t.id, layout: pg.layout, items });
}
console.log(JSON.stringify(out));

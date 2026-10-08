// Task 10.3 check: every icon renders valid SVG with currentColor strokes, is hidden from screen readers unless titled, and has a path.
import { renderToStaticMarkup } from "react-dom/server";
import { Icon, ICON_NAMES } from "../src/components/icons";
let bad = 0; const ok = (c: boolean, m: string) => { if (!c) { bad++; console.log("FAILED:", m); } };
ok(ICON_NAMES.length === 13, `13 icons expected, got ${ICON_NAMES.length}`);
for (const n of ICON_NAMES) {
  const a = renderToStaticMarkup(<Icon name={n} />), b = renderToStaticMarkup(<Icon name={n} title="Label" size={32} />);
  ok(a.includes('aria-hidden="true"') && !a.includes("<title>"), `${n}: decorative by default`);
  ok(a.includes('width="20"') && a.includes('height="20"') && a.includes('viewBox="0 0 24 24"'), `${n}: 20 px default`);
  ok(/<(path|rect|circle)/.test(a), `${n}: has shapes`);
  ok(a.includes('stroke="currentColor"') && !/#[0-9a-f]{3,6}\b/i.test(a), `${n}: uses currentColor only`);
  ok(b.includes("<title>Label</title>") && b.includes('role="img"') && !b.includes("aria-hidden") && b.includes('width="32"'), `${n}: titled and sized`);
}
console.log(bad ? `${bad} FAILED` : `icons: all ${ICON_NAMES.length} checks passed`);
process.exit(bad ? 1 : 0);

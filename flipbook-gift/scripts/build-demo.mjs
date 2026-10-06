// Builds public/engine-demo.html: one self-contained file (engine + demo app inlined, no network).
// Run: node --experimental-strip-types scripts/build-demo.mjs   (Node 22.13+)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { bundleEngine } from "./bundle.mjs";

const engine = bundleEngine();
const app = readFileSync("scripts/demo-app.js", "utf8");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Flipbook engine demo</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
:root{--bg:#f3eee8;--fg:#241719;--mut:#7d716d;--bar:#fff;box-sizing:border-box}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#171214;--fg:#f4ecea;--mut:#a99d99;--bar:#261f22}}
:root[data-theme=dark]{--bg:#171214;--fg:#f4ecea;--mut:#a99d99;--bar:#261f22}
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column;
padding-top:env(safe-area-inset-top,0px);overscroll-behavior:none}
#stage{flex:1 1 auto;min-height:0;padding:12px 12px 4px}
#stage>div{filter:drop-shadow(0 14px 30px #0005)}
#bar{flex:none;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:center;padding:6px 12px calc(10px + env(safe-area-inset-bottom,0px));color:var(--mut);font-size:12px}
#bar b{color:var(--fg);font-weight:600}
select{font:inherit;color:var(--fg);background:var(--bar);border:1px solid #8886;border-radius:8px;padding:4px 6px}
</style></head><body>
<div id="stage"></div>
<div id="bar"><b id="pn">loading</b><span>Drag a page corner · tap the arrows · or use ← →</span>
<label>Release threshold <select id="thr"><option value=".25">25%</option><option value=".38" selected>38% (default)</option><option value=".5">50%</option></select></label></div>
<script>
${engine}
${app}
</script></body></html>`;

mkdirSync("public", { recursive: true });
writeFileSync("public/engine-demo.html", html);
console.log(`public/engine-demo.html  ${(html.length / 1024).toFixed(1)} KB`);

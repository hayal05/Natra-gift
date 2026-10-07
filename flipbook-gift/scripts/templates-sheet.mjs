// Dev-only: contact sheet of one template (?t=<id>, &alt=1 for the second font pair) -> /tmp/tpl-sheet.html.
// Fonts come from a local npm install of the @fontsource packages in FONT_DIR (testing only).
// Serve /tmp over http (python3 -m http.server 8765 --directory /tmp), then open http://localhost:8765/tpl-sheet.html?t=love-story
import { writeFileSync, readdirSync, existsSync } from "node:fs";
import { bundleRenderer, bundleTemplates } from "./bundle.mjs";

const FONT_DIR = "/tmp/fonts/node_modules/@fontsource";
const FAMILIES = ["Playfair Display","Lato","Cormorant Garamond","Montserrat","Italiana","Jost","Archivo Black","DM Sans","Fredoka","Nunito","Lora","Source Sans 3","DM Serif Display","Work Sans","Libre Baskerville","Open Sans","Space Grotesk","Inter","Abril Fatface","Poppins"];
let css = "";
for (const fam of FAMILIES) {
  const dir = `${FONT_DIR}/${fam.toLowerCase().replaceAll(" ", "-")}/files`;
  if (!existsSync(dir)) { console.log("missing font", fam); continue; }
  for (const f of readdirSync(dir)) {
    const m = f.match(/-latin-(\d+)-(normal|italic)\.woff2$/);
    if (m) css += `@font-face{font-family:'${fam}';font-weight:${m[1]};font-style:${m[2]};src:url(/fonts/node_modules/@fontsource/${fam.toLowerCase().replaceAll(" ", "-")}/files/${f})}\n`;
  }
}
const html = `<!doctype html><meta charset=utf-8><style>${css}body{margin:0;background:#bbb;font:12px system-ui}#row{display:grid;grid-template-columns:repeat(4,300px);gap:10px;padding:10px;width:1260px}</style>
<body><div id=row></div><script>${bundleRenderer()}\n${bundleTemplates()}
const q=new URLSearchParams(location.search);const t=TEMPLATE_LIST.find(x=>x.id===q.get("t"));
const {book,pages}=instantiate(t,{to:"Maya",from:"Daniel"},q.get("alt")?1:0);
const images=new Map(); // empty: sample:N photos are drawn by the renderer
window.__ellipsis=[];const ft=CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText=function(s,...a){if(s.endsWith("\\u2026")&&s.length>1)window.__ellipsis.push(s);return ft.call(this,s,...a)};
(async()=>{await Promise.all([...document.fonts].map(f=>f.load().catch(()=>0)));
 const row=document.getElementById("row");
 pages.forEach((p,i)=>{const w=300,h=400,d=2;const cv=document.createElement("canvas");cv.width=w*d;cv.height=h*d;cv.style.cssText="width:300px;height:400px";
  const c=cv.getContext("2d");c.scale(d,d);renderPage(c,w,h,p,LAYOUTS[p.layout],book,images,i);row.appendChild(cv);});
 window.__done=true;})();
</script>`;
writeFileSync("/tmp/tpl-sheet.html", html);
console.log("wrote /tmp/tpl-sheet.html");

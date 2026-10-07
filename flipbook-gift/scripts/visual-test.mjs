// Dev-only. Builds /tmp/engine-test.html from src/engine (types stripped with Node 22.13+), then open it
// in a browser or screenshot it with Playwright. Run: node --experimental-strip-types scripts/visual-test.mjs
// Add ?bare to the URL to skip the default book and create your own with window.create(...).
import { writeFileSync } from "node:fs";
import { bundleEngine } from "./bundle.mjs";

const code = bundleEngine();

const html = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1">
<body style="margin:0;background:#ddd"><div id=bk style="width:300px;margin:20px"></div><div style="height:1500px"></div>
<script>${code}
window.create=create;
const colors=[["#f6b6a8","#d6336c"],["#bcd7f0","#2c5d8f"],["#cfe8c4","#3d7a35"],["#f1e6d0","#a8834a"]];
window.mkPages=()=>colors.map(([bg,fg],i)=>(c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.fillRect(20,20,w-40,h*.5);
c.font="bold "+w*.2+"px Georgia";c.fillText("Page "+(i+1),24,h*.75);c.font="italic "+w*.06+"px Georgia";c.fillText("shadows and curl test",24,h*.85)});
if(!location.search.includes("bare"))window.fb=create(document.getElementById("bk"),{pages:mkPages()});
</script>`;
writeFileSync("/tmp/engine-test.html", html);

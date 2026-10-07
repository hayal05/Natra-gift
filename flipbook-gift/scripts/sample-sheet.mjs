// Dev-only gallery of the sample photos -> /tmp/sample-sheet.html (all 6 scenes x 10 themes, other aspect ratios, zoom/pan).
// Run: node --experimental-strip-types scripts/sample-sheet.mjs, then open the html (no fonts needed).
import { writeFileSync } from "node:fs";
import { bundleRenderer, bundleTemplates } from "./bundle.mjs";

const html = `<!doctype html><meta charset=utf-8><body style="margin:0;background:#999;font:11px system-ui;color:#fff">
<div id=a style="display:grid;grid-template-columns:repeat(6,150px);gap:6px;padding:8px;width:960px"></div>
<div id=b style="display:flex;gap:6px;padding:8px;align-items:flex-end;flex-wrap:wrap;width:960px"></div>
<script>${bundleRenderer()}\n${bundleTemplates()}
const cv=(w,h)=>{const e=document.createElement("canvas");e.width=w*2;e.height=h*2;e.style.cssText="width:"+w+"px;height:"+h+"px";const c=e.getContext("2d");c.scale(2,2);return [e,c];};
const A=document.getElementById("a"),B=document.getElementById("b");
TEMPLATE_LIST.forEach(t=>{for(let n=1;n<=6;n++){const [e,c]=cv(150,200);drawSample(c,t.palette,n,0,0,150,200);A.appendChild(e);}});
const pal=TEMPLATE_LIST[0].palette;
// other aspect ratios (landscape, square, wide strip) for theme 1, then zoom/pan
for(let n=1;n<=6;n++){const [e,c]=cv(150,105);drawSample(c,pal,n,0,0,150,105);B.appendChild(e);}
for(let n=1;n<=6;n++){const [e,c]=cv(110,110);drawSample(c,pal,n,0,0,110,110);B.appendChild(e);}
for(let n=1;n<=6;n++){const [e,c]=cv(300,60);drawSample(c,pal,n,0,0,300,60);B.appendChild(e);}
[[1,0,0],[2,.8,0],[2,-.8,.5],[3,1,1]].forEach(([z,px,py],i)=>{const [e,c]=cv(110,147);drawSample(c,pal,[1,1,1,4][i],0,0,110,147,z===1?1:z+1,px,py);B.appendChild(e);});
// determinism: same call twice gives identical pixels
const [d1,c1]=cv(120,160),[d2,c2]=cv(120,160);drawSample(c1,pal,4,0,0,120,160);drawSample(c2,pal,4,0,0,120,160);
window.__same=d1.toDataURL()===d2.toDataURL();
// wraps past 6 and ignores bad src
const [d3,c3]=cv(120,160),[d4,c4]=cv(120,160);drawSample(c3,pal,2,0,0,120,160);drawSample(c4,pal,8,0,0,120,160);window.__wrap=d3.toDataURL()===d4.toDataURL();
window.__isSample=[isSample("sample:1"),isSample("sample:12"),isSample("sample:0"),isSample("sample:x"),isSample("https://x/sample:1"),isSample(""),isSample(undefined)];
// timing: the worst case per call at full-page size on a 2x canvas
const [e,c]=cv(300,400);const t0=performance.now();for(let i=0;i<60;i++)drawSample(c,pal,(i%6)+1,0,0,300,400);window.__ms=(performance.now()-t0)/60;
window.__done=true;
</script>`;
writeFileSync("/tmp/sample-sheet.html", html);
console.log("wrote /tmp/sample-sheet.html");

// Dev-only contact sheet of all layouts with sample copy -> /tmp/layouts-sheet.html.
// Add ?stress to the URL for long text and no photos. Run: node --experimental-strip-types scripts/layouts-sheet.mjs
import { writeFileSync } from "node:fs";
import { bundleRenderer, bundleLayouts } from "./bundle.mjs";

const html = `<!doctype html><meta charset=utf-8><body style="margin:0;background:#bbb;font:12px system-ui"><div id=row style="display:flex;gap:10px;padding:10px;flex-wrap:wrap;width:1290px"></div>
<script>${bundleRenderer()}\n${bundleLayouts()}
const book={palette:{paper:"#fffaf6",ink:"#241719",accent:"#d6336c",accent2:"#f3869f",soft:"#f6d9d3",dark:"#2a1620"},fonts:{display:"Georgia,serif",body:"system-ui,sans-serif"},masthead:"OUR STORY"};
const mk=(c1,c2,w,h,k)=>{const e=document.createElement("canvas");e.width=w;e.height=h;const g=e.getContext("2d");const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.fillStyle="#fff9";g.beginPath();g.arc(w*.7,h*.28,Math.min(w,h)*.1,0,7);g.fill();for(let L=0;L<3;L++){g.fillStyle="rgba(30,15,25,"+(.18+.17*L)+")";g.beginPath();g.moveTo(0,h);for(let i=0;i<=20;i++)g.lineTo(w*i/20,h*(.6+.1*L+.05*Math.sin(i*.6+k+L*2)));g.lineTo(w,h);g.fill();}return e;};
const images=new Map([["a",mk("#f6b6a8","#8e5a9b",900,700,1)],["b",mk("#bcd7f0","#d6336c",700,900,2)],["c",mk("#f3c67a","#3d7a35",800,800,3)]]);
const stress=location.search.includes("stress");
const SAMPLE={kicker:"The Love Issue",title:"Our Story",body:"I never planned for you. Then you laughed at my worst joke, and my whole year rearranged itself around that sound.\\n\\nThank you for every ordinary Tuesday that felt like a holiday.",body2:"Ten reasons, in no particular order. The way you hum while cooking. The way you remember every birthday.",caption:"The afternoon we stopped pretending it was just coffee.",caption2:"Rainy Sunday",caption3:"Home",byline:"For Maya",sign:"Daniel",quote:"Home is wherever you are laughing."};
const LONG="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(6);
const row=document.getElementById("row");
LAYOUT_LIST.forEach((l,i)=>{let ph=0;const slots={};
 l.slots.forEach(s=>{if(s.kind==="photo")slots[s.id]=stress?{src:""}:{src:["a","b","c"][ph++%3]};else if(s.kind==="text"&&s.id in SAMPLE)slots[s.id]=stress?LONG:(l.group==="cover"&&s.id==="body"?"10 REASONS I LOVE YOU\\nTHE DAY EVERYTHING CHANGED":SAMPLE[s.id]);});
 const w=300,h=400,d=2;const cv=document.createElement("canvas");cv.width=w*d;cv.height=h*d;cv.style.cssText="width:"+w+"px;height:"+h+"px";
 const c=cv.getContext("2d");c.scale(d,d);renderPage(c,w,h,{layout:l.id,slots},l,book,images,i+1);
 const f=document.createElement("div");f.style.cssText="width:300px";f.append(cv,Object.assign(document.createElement("div"),{textContent:l.id}));row.appendChild(f);});
window.__done=true;
</script>`;
writeFileSync("/tmp/layouts-sheet.html", html);

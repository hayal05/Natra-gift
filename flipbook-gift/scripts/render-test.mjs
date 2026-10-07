// Dev-only visual check for the slot renderer (task 2.1). Builds /tmp/render-test.html with a few
// test layouts that exercise every slot feature. Run: node --experimental-strip-types scripts/render-test.mjs
import { writeFileSync } from "node:fs";
import { bundleRenderer } from "./bundle.mjs";

const code = bundleRenderer();
const html = `<!doctype html><meta charset=utf-8><body style="margin:0;background:#ccc"><div id=row style="display:flex;gap:12px;padding:12px;flex-wrap:wrap"></div>
<script>${code}
const SERIF='Georgia,serif', SANS='system-ui,sans-serif';
const book={palette:{paper:"#fffaf6",ink:"#241719",accent:"#d6336c",accent2:"#f3869f",soft:"#f6d9d3",dark:"#2a1620"},fonts:{display:SERIF,body:SANS},masthead:"OUR STORY"};
const T=(o)=>({kind:"text",font:"body",size:.04,color:"ink",...o});
const layouts={
 cover:{id:"cover",name:"Cover",bg:"dark",slots:[
  {kind:"photo",id:"p",x:0,y:0,w:1,h:1},
  {kind:"shape",id:"s1",shape:"scrim-down",fill:"#000",alpha:.5,x:0,y:0,w:1,h:.4},
  {kind:"shape",id:"s2",shape:"scrim-up",fill:"#000",alpha:.65,x:0,y:.6,w:1,h:.4},
  T({id:"t",kind:"text",font:"display",size:.15,weight:800,color:"#fff",align:"center",x:.05,y:.05,w:.9,h:.2,valign:"middle"}),
  T({id:"sub",size:.032,weight:600,tracking:.1,upper:true,color:"#fff",align:"center",x:.1,y:.25,w:.8,h:.05}),
  T({id:"to",font:"display",italic:true,size:.06,color:"#fff",x:.07,y:.86,w:.86,h:.08,valign:"bottom"})]},
 letter:{id:"letter",name:"Letter",bg:"paper",slots:[
  {kind:"photo",id:"p",x:0,y:0,w:1,h:.26},
  T({id:"k",size:.03,weight:600,tracking:.12,upper:true,color:"accent",x:.08,y:.3,w:.84,h:.04}),
  T({id:"h",font:"display",size:.065,weight:800,x:.08,y:.35,w:.84,h:.08}),
  T({id:"b",size:.04,lh:1.55,x:.08,y:.45,w:.84,h:.4}),
  T({id:"f",auto:"folio",size:.028,weight:600,x:.08,y:.93,w:.84,h:.04})]},
 polaroid:{id:"polaroid",name:"Polaroid",bg:"soft",slots:[
  {kind:"photo",id:"p1",frame:"border",matBottom:.16,x:.12,y:.08,w:.62,h:.44,rot:{deg:-5,cx:.43,cy:.3}},
  T({id:"c1",font:"display",italic:true,size:.045,align:"center",x:.15,y:.44,w:.56,h:.06,rot:{deg:-5,cx:.43,cy:.3}}),
  {kind:"photo",id:"p2",frame:"border",matBottom:.16,x:.28,y:.5,w:.62,h:.44,rot:{deg:4,cx:.59,cy:.72}},
  T({id:"c2",font:"display",italic:true,size:.045,align:"center",x:.31,y:.86,w:.56,h:.06,rot:{deg:4,cx:.59,cy:.72}})]},
 frames:{id:"frames",name:"Frames",bg:"paper",slots:[
  {kind:"photo",id:"a",x:.08,y:.05,w:.38,h:.26},{kind:"photo",id:"b",x:.54,y:.05,w:.38,h:.26},
  {kind:"photo",id:"c",x:.08,y:.37,w:.38,h:.26},{kind:"photo",id:"d",x:.54,y:.37,w:.38,h:.26},
  {kind:"shape",id:"e",shape:"ellipse",fill:"accent",alpha:.8,x:.4,y:.68,w:.2,h:.12,shadow:true},
  {kind:"shape",id:"l",shape:"line",fill:"ink",x:.08,y:.84,w:.84,h:.004},
  T({id:"t",size:.05,x:.08,y:.86,w:.84,h:.06})]}
};
const src=(c1,c2,w,h)=>{const k=document.createElement("canvas");k.width=w;k.height=h;const g=k.getContext("2d");const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle="#fff8";g.fillRect(w*.1,h*.1,w*.2,h*.2);g.fillStyle="#0006";g.fillRect(w*.7,h*.6,w*.25,h*.3);return k;};
const images=new Map([["wide",src("#3a7bd5","#f6b6a8",900,400)],["tall",src("#8e5a9b","#f3c67a",400,900)]]);
const long="I never planned for you. Then you laughed at my worst joke, and my whole year rearranged itself around that sound. This little magazine is my way of saying thank you for every ordinary Tuesday that felt like a holiday. ".repeat(3);
const pages=[
 {layout:"cover",slots:{p:{src:"wide"},t:"OUR STORY",sub:"Issue No. 1 · The Love Issue",to:"For Maya"}},
 {layout:"letter",slots:{p:{src:"tall",panY:.5},k:"Editor's letter",h:"Dear Maya,",b:long,f:""}},
 {layout:"letter",bg:"soft",slots:{p:{src:"",},k:"Short",h:"A very long headline that has to shrink to fit its box nicely",b:"Hi\\nSecond paragraph\\n\\nThird",f:""},styles:{b:{size:"L",align:"center",color:"accent",font:"display"}}},
 {layout:"polaroid",slots:{p1:{src:"wide"},c1:"The first coffee",p2:{src:"tall",zoom:1.6,panY:-.4},c2:"Zoomed + panned"}},
 {layout:"frames",slots:{a:{src:"wide",filter:"bw"},b:{src:"wide",filter:"warm"},c:{src:"tall",frame:"rounded",fit:"fit"},d:{src:"wide",frame:"border"},t:"Four frames, bw / warm / rounded fit / border"}},
 {layout:"nope",slots:{}}
];
const row=document.getElementById("row");
pages.forEach((p,i)=>{const w=300,h=400,d=2;const cv=document.createElement("canvas");cv.width=w*d;cv.height=h*d;cv.style.cssText="width:"+w+"px;height:"+h+"px";
 const c=cv.getContext("2d");c.scale(d,d);pageDrawFn(p,layouts,book,images)(c,w,h,i);row.appendChild(cv);});
window.__slotAt=(layoutId,x,y)=>{const s=slotAt(layouts[layoutId],300,400,x,y);return s&&s.id;};
window.__done=true;
</script>`;
writeFileSync("/tmp/render-test.html", html);
console.log("wrote /tmp/render-test.html");

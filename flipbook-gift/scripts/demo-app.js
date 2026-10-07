// Demo app for the engine (task 1.6). Inlined after the engine bundle by scripts/build-demo.mjs.
const $ = (s) => document.querySelector(s);
const SERIF = 'Georgia,"Times New Roman",serif';
const SANS = 'system-ui,-apple-system,"Segoe UI",sans-serif';
const PAL = ["#f6b6a8", "#f3869f", "#8e5a9b"];
const PAPER = "#fffaf6", INK = "#241719", ACC = "#d6336c";

function wrap(c, text, x, y, maxW, lh) {
  let line = "";
  for (const word of text.split(" ")) {
    const test = line + word + " ";
    if (c.measureText(test).width > maxW && line) { c.fillText(line, x, y); y += lh; line = word + " "; }
    else line = test;
  }
  c.fillText(line, x, y);
  return y + lh;
}
function text(c, s, x, y, font, color, align) { c.font = font; c.fillStyle = color; c.textAlign = align || "left"; c.fillText(s, x, y); }
// Generated placeholder "photo": gradient sky, sun, layered hills.
function scene(c, x, y, w, h, k) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, PAL[k % 3]); g.addColorStop(1, PAL[(k + 1) % 3]);
  c.fillStyle = g; c.fillRect(x, y, w, h);
  c.fillStyle = "rgba(255,255,255,.8)"; c.beginPath(); c.arc(x + w * (0.3 + 0.2 * (k % 2)), y + h * 0.3, Math.min(w, h) * 0.11, 0, 7); c.fill();
  for (let L = 0; L < 3; L++) {
    c.fillStyle = `rgba(30,15,25,${0.18 + 0.17 * L})`; c.beginPath(); c.moveTo(x, y + h);
    for (let i = 0; i <= 20; i++) c.lineTo(x + (w * i) / 20, y + h * (0.58 + 0.1 * L + 0.06 * Math.sin(i * 0.55 + k * 2 + L * 2)));
    c.lineTo(x + w, y + h); c.fill();
  }
  c.restore();
}
const folio = (c, w, h, i) => text(c, String(i + 1).padStart(2, "0") + "  ·  OUR STORY", 24, h - 20, "600 10px " + SANS, INK);

const pages = [
  (c, w, h) => { // cover
    scene(c, 0, 0, w, h, 0);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(0,0,0,.35)"); g.addColorStop(0.4, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.6)");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    text(c, "OUR STORY", w / 2, w * 0.17 + 26, `800 ${w * 0.15}px ${SERIF}`, "#fff", "center");
    text(c, "ISSUE NO. 1 · THE LOVE ISSUE", w / 2, w * 0.17 + 50, "600 10px " + SANS, "#fff", "center");
    text(c, "10 REASONS I LOVE YOU", 24, h - 90, "600 13px " + SANS, "#fff");
    text(c, "THE DAY EVERYTHING CHANGED", 24, h - 66, "600 13px " + SANS, "#fff");
    text(c, "For Maya", 24, h - 28, `italic 500 20px ${SERIF}`, "#fff");
  },
  (c, w, h, i) => { // letter
    c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
    const o = h * 0.26, fs = Math.max(12, Math.min(15, w * 0.036));
    scene(c, 0, 0, w, o, 2);
    text(c, "EDITOR'S LETTER", 32, o + 34, "600 11px " + SANS, ACC);
    text(c, "Dear Maya,", 32, o + 70, `800 ${fs * 1.8}px ${SERIF}`, INK);
    c.fillStyle = INK; c.font = `400 ${fs}px ${SANS}`; c.textAlign = "left";
    wrap(c, "I never planned for you. Then you laughed at my worst joke, and my whole year rearranged itself around that sound. This little magazine is my way of saying thank you for every ordinary Tuesday that felt like a holiday.", 32, o + 102, w - 64, fs * 1.55);
    text(c, "— Daniel", 32, h - 52, `italic 500 22px ${SERIF}`, ACC);
    folio(c, w, h, i);
  },
  (c, w, h, i) => { // full photo + caption
    c.fillStyle = PAPER; c.fillRect(0, 0, w, h); scene(c, 0, 0, w, h * 0.74, 1);
    text(c, "MOMENT", 28, h * 0.74 + 34, "600 11px " + SANS, ACC);
    c.fillStyle = INK; c.font = `italic 500 20px ${SERIF}`; c.textAlign = "left";
    wrap(c, "The afternoon we stopped pretending it was just coffee.", 28, h * 0.74 + 64, w - 56, 26);
    folio(c, w, h, i);
  },
  (c, w, h, i) => { // quote over colour + photo
    c.fillStyle = ACC; c.fillRect(0, 0, w, h);
    text(c, "“", 32, h * 0.24, `800 ${w * 0.26}px ${SERIF}`, "rgba(255,255,255,.4)");
    c.fillStyle = "#fff"; c.font = `700 ${w * 0.075}px ${SERIF}`; c.textAlign = "left";
    wrap(c, "Home is wherever you are laughing.", 32, h * 0.34, w - 64, w * 0.1);
    c.save(); c.shadowColor = "#0005"; c.shadowBlur = 16; c.fillStyle = "#fff"; c.fillRect(28, h * 0.6 - 4, w - 56, h * 0.25 + 8); c.restore();
    scene(c, 32, h * 0.6, w - 64, h * 0.25, 0);
    text(c, "— Daniel to Maya", 32, h - 52, "600 12px " + SANS, "#fff");
    folio(c, w, h, i);
  },
  (c, w, h, i) => { // two polaroids
    c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
    [[0.3, 0.28, -0.05, 0], [0.62, 0.62, 0.04, 2]].forEach(([a, b, r, k]) => {
      c.save(); c.translate(w * (0.5 + (a - 0.4) * 0.9), h * b * 0.9 + 30); c.rotate(r);
      c.shadowColor = "#0004"; c.shadowBlur = 14; c.fillStyle = "#fff"; c.fillRect(-w * 0.3, -h * 0.17, w * 0.6, h * 0.34);
      c.shadowColor = "transparent"; scene(c, -w * 0.27, -h * 0.15, w * 0.54, h * 0.26, k + 1); c.restore();
    });
    text(c, "Evidence that we were, in fact, the problem.", w / 2, h - 60, `italic 500 15px ${SERIF}`, INK, "center");
    folio(c, w, h, i);
  },
  (c, w, h, i) => { // list with photo header
    c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
    const o = h * 0.2, sp = Math.min(64, (h - o - 150) / 4);
    scene(c, 0, 0, w, o, 1);
    text(c, "TOP 4", 32, o + 34, "600 11px " + SANS, ACC);
    c.fillStyle = INK; c.font = `800 24px ${SERIF}`; c.textAlign = "left"; wrap(c, "Why it is you", 32, o + 66, w - 64, 28);
    ["You make quiet feel safe.", "You remember the small things.", "You show up, every time.", "You are my favorite hello."].forEach((t, k) => {
      const y = o + 130 + k * sp;
      text(c, String(k + 1), 32, y + sp * 0.3, `800 ${sp * 0.6}px ${SERIF}`, ACC);
      c.fillStyle = INK; c.font = "400 15px " + SANS; wrap(c, t, 86, y + sp * 0.2, w - 120, 20);
    });
    folio(c, w, h, i);
  },
  (c, w, h, i) => { // photo + caption, second
    c.fillStyle = PAPER; c.fillRect(0, 0, w, h); scene(c, 24, 24, w - 48, h * 0.6, 2);
    text(c, "SOMEDAY", 28, h * 0.6 + 66, "600 11px " + SANS, ACC);
    c.fillStyle = INK; c.font = `italic 500 20px ${SERIF}`; c.textAlign = "left";
    wrap(c, "Porch light on, you on the couch, nowhere to be.", 28, h * 0.6 + 96, w - 56, 26);
    folio(c, w, h, i);
  },
  (c, w, h) => { // closing
    c.fillStyle = INK; c.fillRect(0, 0, w, h);
    const r = Math.min(w, h) * 0.2, cy = h * 0.27;
    c.save(); c.beginPath(); c.arc(w / 2, cy, r, 0, 7); c.clip(); scene(c, w / 2 - r, cy - r, 2 * r, 2 * r, 2); c.restore();
    c.strokeStyle = PAL[0]; c.lineWidth = 2; c.beginPath(); c.arc(w / 2, cy, r + 6, 0, 7); c.stroke();
    const y = h * 0.58;
    text(c, "THE END", w / 2, y, `${w * 0.14}px ${SERIF}`, PAPER, "center");
    text(c, "To be continued, always.", w / 2, y + 40, `italic 500 18px ${SERIF}`, PAL[0], "center");
    text(c, "With love, Daniel ❤", w / 2, y + 90, "600 13px " + SANS, "#fff", "center");
  },
];

const fb = create($("#stage"), { pages, fit: "contain", backColor: "#f4efe6", onPageChange: update });
function update() {
  $("#pn").textContent = fb.state === "ready" ? `Page ${fb.index + 1} of ${fb.pageCount}` : fb.state;
}
fb.ready.then(update);
const sel = $("#thr");
sel.onchange = () => { fb.tuning.completeFraction = parseFloat(sel.value); };
window.fb = fb;

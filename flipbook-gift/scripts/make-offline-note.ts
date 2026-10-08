// Task 10.2c browser check, part 1: builds /tmp/off/gift.html with a voice note on page 3 through the real buildOfflineHtml (network mocked).
// Run from the project root: mkdir -p /tmp/off && npx tsx scripts/make-offline-note.ts && node scripts/check-offline-note.cjs
import { writeFileSync, readFileSync } from "node:fs";
import { build } from "esbuild";
import { buildOfflineHtml } from "../src/lib/offline.ts";
import { newDraft } from "../src/lib/draft.ts";

// 16 kHz mono WAV, 2 s sine, large-ish like a real note
const rate = 16000, n = rate * 2, b = Buffer.alloc(44 + n * 2);
b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(8000 * Math.sin(2 * Math.PI * 440 * i / rate)), 44 + i * 2);

(globalThis as any).FileReader = class { result: any; onload: any; onerror: any;
  readAsDataURL(b: Blob) { b.arrayBuffer().then((buf) => { this.result = `data:${b.type};base64,${Buffer.from(buf).toString("base64")}`; this.onload(); }, (e) => this.onerror(e)); } };
async function main() {
  await build({ entryPoints: ["src/offline/runtime.ts"], bundle: true, minify: true, format: "iife", target: "es2020", outfile: "/tmp/off/runtime.js", legalComments: "none", define: { "process.env.NEXT_PUBLIC_UPLOADS": '"0"', "process.env.NODE_ENV": '"production"' } });
  const runtime = readFileSync("/tmp/off/runtime.js", "utf8");
  // the note is served from "Cloudinary" with a generic type, as feared in 10.2a
  (globalThis as any).fetch = async (url: string) => {
    if (url.endsWith("runtime.js")) return { ok: true, status: 200, text: async () => runtime };
    if (url.endsWith("manifest.json")) return { ok: true, status: 200, json: async () => ({}) };
    if (url.includes("cloudinary")) return { ok: true, status: 200, blob: async () => new Blob([b], { type: "application/octet-stream" }) };
    return { ok: false, status: 404 };
  };
  const d = newDraft("love-story", { to: "Sam", from: "Natra" })!;
  d.pages[2].audio = { src: "https://res.cloudinary.com/demo/video/upload/v1/notes/hello.wav", duration: 2 };
  const html = await buildOfflineHtml(d);
  writeFileSync("/tmp/off/gift.html", html);
  console.log("bytes", html.length, "http refs:", (html.match(/https?:\/\//g) || []).length);
}
main();

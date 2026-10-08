// Task 10.2c: voice notes in the offline file. Run: npx tsx scripts/test-offline-audio.ts
import { inlineAudio, noteMime, OfflineError } from "../src/lib/offline.ts";
import type { PageData } from "../src/lib/pages/types.ts";

let failed = 0;
const check = (name: string, ok: boolean, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " " + extra : ""}`); if (!ok) failed++; };

const U = (ext: string) => `https://res.cloudinary.com/demo/video/upload/v1/notes/n.${ext}`;
// Types Cloudinary or a server may send, and what each must become
const cases: [string, string, string | null][] = [
  ["audio/wav", "wav", "audio/wav"], ["audio/x-wav", "wav", "audio/wav"], ["audio/mpeg", "mp3", "audio/mpeg"],
  ["audio/mp4", "m4a", "audio/mp4"], ["video/mp4", "m4a", "audio/mp4"], ["video/x-m4a", "m4a", "audio/mp4"],
  ["video/quicktime", "m4a", "audio/mp4"], ["application/octet-stream", "mp3", "audio/mpeg"], ["", "wav", "audio/wav"],
  ["audio/wav; charset=x", "wav", "audio/wav"], ["application/octet-stream", "png", null], ["text/html", "mp3", null], ["video/webm", "mp3", null],
];
for (const [type, ext, want] of cases) check(`noteMime(${JSON.stringify(type)}, .${ext})`, noteMime(type, U(ext)) === want, `got ${noteMime(type, U(ext))}`);
check("noteMime ignores a query string", noteMime("", U("wav") + "?x=1") === "audio/wav");

// inlineAudio with a mocked network
(globalThis as any).FileReader = class { result: any; onload: any; onerror: any;
  readAsDataURL(b: Blob) { b.arrayBuffer().then((buf) => { this.result = `data:${b.type};base64,${Buffer.from(buf).toString("base64")}`; this.onload(); }, (e) => this.onerror(e)); } };
async function main() {
const bytes = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);
let served = "audio/x-m4a", fetches = 0;
(globalThis as any).fetch = async (url: string) => { fetches++; return { ok: !url.includes("missing"), status: url.includes("missing") ? 404 : 200, blob: async () => new Blob([bytes], { type: served }) }; };
const page = (audio?: { src: string; duration: number }): PageData => ({ layout: "x", slots: {}, ...(audio ? { audio } : {}) } as PageData);
const pages = [page(), page(), page({ src: U("m4a"), duration: 5 }), page({ src: "data:audio/wav;base64,AAAA", duration: 2 })];
const out = await inlineAudio(pages);
check("note on page 3 becomes a data URI", /^data:audio\/mp4;base64,/.test(out[2].audio?.src ?? ""), out[2].audio?.src.slice(0, 30));
check("pages 1 and 2 still have no note", !out[0].audio && !out[1].audio);
check("an existing data URI is left alone", out[3].audio?.src === "data:audio/wav;base64,AAAA");
check("no http reference left", out.every((p) => !p.audio || !/^https?:/i.test(p.audio.src)));
check("original pages not mutated", pages[2].audio!.src.startsWith("https:"));
const n = fetches; await inlineAudio([page({ src: U("wav"), duration: 1 }), page({ src: U("wav"), duration: 1 })]);
check("same note fetched once", fetches - n === 1);
served = "text/html";
let msg = ""; try { await inlineAudio([page({ src: U("mp3"), duration: 1 })]); } catch (e) { msg = e instanceof OfflineError ? e.message : "wrong error"; }
check("a non-audio answer stops the download with a message", /not an audio file/.test(msg), msg);
msg = ""; try { await inlineAudio([page({ src: "https://x/missing.mp3", duration: 1 })]); } catch (e) { msg = e instanceof OfflineError ? e.message : "wrong error"; }
check("a 404 stops the download with a message", /voice note could not be loaded \(404\)/i.test(msg), msg);
}
main().then(() => {
console.log(failed ? `\n${failed} FAILED` : "\nall passed"); process.exit(failed ? 1 : 0); }, (e) => { console.error(e); process.exit(1); });

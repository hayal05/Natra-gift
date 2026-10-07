// Tests for the recorder module (src/audio/recorder.ts) with a fake microphone and fake Web Audio. Run: npx tsx scripts/test-recorder.ts
// The real microphone, AudioWorklet and iPhone behaviour are checked in task 9.6 (headless Chromium) and on real phones.
import { classifyMicError, createRecorder } from "../src/audio/recorder.ts";

let failed = 0;
function check(name: string, ok: boolean, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " " + extra : ""}`);
  if (!ok) failed++;
}
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));

// ---- fakes ----
let tracksStopped = 0;
let ctxClosed = 0;
let lastProcessor: { onaudioprocess: ((ev: unknown) => void) | null } | null = null;
let micError: { name: string } | null = null;
let micDelay = 0;
let lastTrack: { onended: (() => void) | null } | null = null;
const RATE = 8000;

class FakeCtx {
  state = "running";
  sampleRate = RATE;
  destination = {};
  audioWorklet = undefined; // forces the ScriptProcessor path
  resume() { return Promise.resolve(); }
  close() { this.state = "closed"; ctxClosed++; return Promise.resolve(); }
  createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
  createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
  createScriptProcessor() {
    const p = { onaudioprocess: null as ((ev: unknown) => void) | null, connect() {}, disconnect() {} };
    lastProcessor = p;
    return p;
  }
}
const g = globalThis as Record<string, unknown>;
g.window = { isSecureContext: true, AudioContext: FakeCtx };
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    mediaDevices: {
      async getUserMedia() {
        if (micDelay) await wait(micDelay);
        if (micError) throw micError;
        const track = { stop() { tracksStopped++; }, onended: null as (() => void) | null };
        lastTrack = track;
        return { getTracks: () => [track], getAudioTracks: () => [track] };
      },
    },
  },
});

/** Feed `seconds` of a quiet tone through the fake processor, in 4096-sample blocks. */
function feed(seconds: number) {
  const total = Math.round(seconds * RATE);
  for (let at = 0; at < total; at += 4096) {
    const n = Math.min(4096, total - at);
    const block = new Float32Array(n);
    for (let i = 0; i < n; i++) block[i] = 0.3 * Math.sin((2 * Math.PI * 440 * (at + i)) / RATE);
    lastProcessor?.onaudioprocess?.({ inputBuffer: { getChannelData: () => block } });
  }
}
function reset() { tracksStopped = 0; ctxClosed = 0; micError = null; micDelay = 0; lastProcessor = null; lastTrack = null; }

async function main() {
// ---- error mapping ----
check("error mapping", classifyMicError({ name: "NotAllowedError" }) === "denied" && classifyMicError({ name: "SecurityError" }) === "denied"
  && classifyMicError({ name: "NotFoundError" }) === "no-mic" && classifyMicError({ name: "NotReadableError" }) === "busy"
  && classifyMicError({ name: "Weird" }) === "failed" && classifyMicError(null) === "failed" && classifyMicError("x") === "failed");

// ---- normal record and stop ----
{
  reset();
  const ticks: number[] = []; let result: any = null; let errors = 0;
  const r = createRecorder({ onTick: (s) => ticks.push(s), onStop: (x) => (result = x), onError: () => errors++ });
  check("starts idle", r.state === "idle");
  await r.start();
  check("recording after start", r.state === "recording");
  feed(3.5);
  check("one tick per whole second", ticks.join() === "1,2,3");
  r.stop();
  check("stop delivers a WAV once", !!result && result.blob.type === "audio/wav" && !result.autoStopped && errors === 0);
  const bytes = new Uint8Array(await result.blob.arrayBuffer());
  const text = (a: number) => String.fromCharCode(bytes[a], bytes[a + 1], bytes[a + 2], bytes[a + 3]);
  check("WAV is 16 kHz mono 16-bit", text(0) === "RIFF" && text(8) === "WAVE" && new DataView(bytes.buffer).getUint32(24, true) === 16000);
  check("length matches 3.5 s at 16 kHz", bytes.length === 44 + 3.5 * 16000 * 2, `(${bytes.length})`);
  check("seconds rounded", result.seconds === 4 || result.seconds === 3);
  check("microphone released on stop", tracksStopped === 1 && ctxClosed === 1);
  check("idle again", r.state === "idle");
  feed(1);
  check("late audio after stop is ignored", ticks.length === 3);
}

// ---- auto-stop ----
{
  reset();
  let result: any = null; let n = 0;
  const r = createRecorder({ onStop: (x) => { result = x; n++; } }, { maxSeconds: 2 });
  await r.start();
  feed(5);
  check("auto-stops at the limit, once", n === 1 && result.autoStopped === true);
  const len = (await result.blob.arrayBuffer()).byteLength;
  check("auto-stopped file is exactly the limit", len === 44 + 2 * 16000 * 2, `(${len})`);
  check("microphone released on auto-stop", tracksStopped === 1 && ctxClosed === 1 && r.state === "idle");
}

// ---- cancel ----
{
  reset();
  let stops = 0; let errors = 0;
  const r = createRecorder({ onStop: () => stops++, onError: () => errors++ });
  await r.start(); feed(1); r.cancel();
  check("cancel: no result, no error, mic released", stops === 0 && errors === 0 && tracksStopped === 1 && ctxClosed === 1 && r.state === "idle");
  r.cancel(); r.stop();
  check("cancel and stop again are harmless", stops === 0 && tracksStopped === 1);
  await r.start(); feed(1.2); r.stop();
  check("can record again after cancel", stops === 1);
}

// ---- cancel while the permission prompt is open ----
{
  reset(); micDelay = 20;
  let stops = 0; let errors = 0;
  const r = createRecorder({ onStop: () => stops++, onError: () => errors++ });
  const p = r.start();
  check("state is starting during the prompt", r.state === "starting");
  r.cancel();
  await p;
  check("late permission after cancel: stream released, nothing recorded", tracksStopped === 1 && stops === 0 && errors === 0 && r.state === "idle" && lastProcessor === null);
}

// ---- error paths ----
for (const [name, kind] of [["NotAllowedError", "denied"], ["NotFoundError", "no-mic"], ["NotReadableError", "busy"], ["SomethingElse", "failed"]] as const) {
  reset(); micError = { name };
  let got = ""; const r = createRecorder({ onError: (e) => (got = e.kind + "|" + e.message) });
  await r.start();
  check(`${name} gives "${kind}" with a plain message`, got.startsWith(kind + "|") && got.length > kind.length + 10 && r.state === "idle");
}
{
  reset();
  const saved = g.window;
  g.window = { isSecureContext: false, AudioContext: FakeCtx };
  let got = ""; const r = createRecorder({ onError: (e) => (got = e.kind) });
  await r.start();
  check("insecure page gives \"unsupported\" and never asks for the mic", got === "unsupported" && tracksStopped === 0);
  g.window = saved;
}
{
  reset();
  let got = ""; const r = createRecorder({ onError: (e) => (got = e.kind) });
  await r.start(); r.stop(); // nothing fed
  check("a recording with no sound is a \"failed\" error, mic released", got === "failed" && tracksStopped === 1 && ctxClosed === 1);
}

// ---- microphone lost while recording ----
{
  reset();
  let result: any = null;
  const r = createRecorder({ onStop: (x) => (result = x) });
  await r.start(); feed(2); lastTrack?.onended?.();
  check("mic lost mid-recording keeps what was recorded", !!result && r.state === "idle" && ctxClosed === 1);
}

// ---- double start and a throwing tick callback ----
{
  reset();
  let stops = 0;
  const r = createRecorder({ onTick: () => { throw new Error("bad callback"); }, onStop: () => stops++ });
  await r.start(); await r.start();
  check("second start is ignored (one microphone grab)", tracksStopped === 0 && r.state === "recording");
  feed(2.2); r.stop();
  check("a throwing onTick does not break the recording", stops === 1);
}

console.log(failed ? `\n${failed} FAILED` : "\nAll recorder checks passed");
process.exit(failed ? 1 : 0);
}
main();

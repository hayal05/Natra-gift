// Tests for the WAV encoder (src/audio/wav.ts) and the recording constants. Run: npx tsx scripts/test-audio.ts
import { concatChunks, encodeRecording, encodeWav, floatToPcm16, mixToMono, resampleMono } from "../src/audio/wav.ts";
import { AUDIO_MAX_BYTES, AUDIO_MAX_SECONDS, RECORD_BYTES_PER_SECOND, RECORD_MAX_BYTES, RECORD_MAX_SECONDS, RECORD_SAMPLE_RATE } from "../src/lib/audio.ts";

let failed = 0;
function check(name: string, ok: boolean, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " " + extra : ""}`);
  if (!ok) failed++;
}

function header(b: Uint8Array) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const s = (at: number) => String.fromCharCode(b[at], b[at + 1], b[at + 2], b[at + 3]);
  return {
    riff: s(0), size: v.getUint32(4, true), wave: s(8), fmt: s(12), fmtSize: v.getUint32(16, true),
    format: v.getUint16(20, true), channels: v.getUint16(22, true), rate: v.getUint32(24, true),
    byteRate: v.getUint32(28, true), align: v.getUint16(32, true), bits: v.getUint16(34, true),
    data: s(36), dataSize: v.getUint32(40, true),
  };
}
function decode(b: Uint8Array): Float32Array {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const out = new Float32Array((b.length - 44) / 2);
  for (let i = 0; i < out.length; i++) out[i] = v.getInt16(44 + i * 2, true) / 0x8000;
  return out;
}
function sine(freq: number, rate: number, seconds: number, amp = 0.5): Float32Array {
  const n = Math.round(rate * seconds);
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = amp * Math.sin((2 * Math.PI * freq * i) / rate);
  return a;
}
function rms(a: Float32Array) {
  let s = 0;
  for (const x of a) s += x * x;
  return Math.sqrt(s / a.length);
}
function crossings(a: Float32Array) {
  let c = 0;
  for (let i = 1; i < a.length; i++) if (a[i - 1] < 0 && a[i] >= 0) c++;
  return c;
}

// Constants
check("recording constants agree with the upload limits", RECORD_MAX_BYTES < AUDIO_MAX_BYTES && RECORD_MAX_SECONDS <= AUDIO_MAX_SECONDS && RECORD_BYTES_PER_SECOND === RECORD_SAMPLE_RATE * 2);

// Header
{
  const pcm = new Int16Array([0, 1000, -1000, 32767, -32768]);
  const w = encodeWav(pcm, 16000);
  const h = header(w);
  check("header: RIFF, WAVE, fmt, data tags", h.riff === "RIFF" && h.wave === "WAVE" && h.fmt === "fmt " && h.data === "data");
  check("header: PCM, mono, 16-bit, 16 kHz", h.format === 1 && h.channels === 1 && h.bits === 16 && h.rate === 16000 && h.fmtSize === 16);
  check("header: byte rate, block align and sizes", h.byteRate === 32000 && h.align === 2 && h.dataSize === 10 && h.size === 36 + 10 && w.length === 44 + 10);
  const back = new DataView(w.buffer).getInt16(44 + 6, true);
  check("samples are little-endian 16-bit", back === 32767 && new DataView(w.buffer).getInt16(44 + 8, true) === -32768);
}

// Float to PCM
{
  const p = floatToPcm16(new Float32Array([0, 1, -1, 2, -2, NaN, 0.5, -0.5]));
  check("clipping and NaN", p[0] === 0 && p[1] === 32767 && p[2] === -32768 && p[3] === 32767 && p[4] === -32768 && p[5] === 0);
  check("half scale", p[6] === Math.round(0.5 * 32767) && p[7] === -16384);
}

// Silence
{
  const w = encodeRecording([new Float32Array(48000)], 48000);
  const d = decode(w);
  check("silence stays silence", d.length === 16000 && d.every((x) => x === 0));
}

// Rates
for (const rate of [48000, 44100, 32000, 22050, 16000, 8000]) {
  const w = encodeRecording([sine(440, rate, 1)], rate);
  const d = decode(w);
  const h = header(w);
  check(`${rate} Hz in: one second, 16 kHz header, 440 Hz tone kept`, h.rate === 16000 && d.length === 16000 && Math.abs(crossings(d) - 440) <= 2 && Math.abs(rms(d) - 0.3536) < 0.02, `(len ${d.length}, crossings ${crossings(d)}, rms ${rms(d).toFixed(3)})`);
}

// Up-sampling length
check("8 kHz in doubles the sample count", resampleMono(new Float32Array(8000), 8000, 16000).length === 16000);
check("same rate returns the input unchanged", (() => { const a = new Float32Array([1, 2, 3]); return resampleMono(a, 16000, 16000) === a; })());
check("bad rate is refused", (() => { try { resampleMono(new Float32Array(4), 0, 16000); return false; } catch { return true; } })());

// Average of a constant is that constant (no edge drift)
{
  const r = resampleMono(new Float32Array(44100).fill(0.25), 44100, 16000);
  check("a constant signal stays constant when down-sampled", r.length === 16000 && r.every((x) => Math.abs(x - 0.25) < 1e-6));
}

// Equal rate round trip
{
  const ramp = new Float32Array(1000);
  for (let i = 0; i < ramp.length; i++) ramp[i] = (i / 1000) * 1.8 - 0.9;
  const back = decode(encodeRecording([ramp], 16000));
  let worst = 0;
  for (let i = 0; i < ramp.length; i++) worst = Math.max(worst, Math.abs(back[i] - ramp[i]));
  check("16 kHz round trip is accurate to 16-bit precision", back.length === 1000 && worst < 1 / 16000, `(worst ${worst.toExponential(2)})`);
}

// Chunks
{
  const full = sine(300, 48000, 2);
  const cuts = [full.slice(0, 1234), full.slice(1234, 40000), full.slice(40000, 40001), new Float32Array(0), full.slice(40001)];
  const a = encodeRecording(cuts, 48000);
  const b = encodeRecording([full], 48000);
  check("chunk boundaries do not change the result", a.length === b.length && a.every((x, i) => x === b[i]));
  check("concatChunks keeps order and length", concatChunks(cuts).length === full.length);
}

// Mono mix
{
  const m = mixToMono([new Float32Array([1, 0, -1]), new Float32Array([0, 1, -1, 5])]);
  check("stereo is averaged and cut to the shorter channel", m.length === 3 && m[0] === 0.5 && m[1] === 0.5 && m[2] === -1);
  check("one channel is passed through, none is empty", mixToMono([new Float32Array([2])]).length === 1 && mixToMono([]).length === 0);
}

// Empty
{
  const w = encodeRecording([], 48000);
  const h = header(w);
  check("no audio gives a valid, silent, header-only file", w.length === 44 && h.dataSize === 0 && h.size === 36);
}

// The longest recording fits the 5 MB limit exactly as planned
{
  const long = new Float32Array(RECORD_MAX_SECONDS * 48000).fill(0.1);
  const w = encodeRecording([long], 48000);
  check("a 150 s recording at 48 kHz is exactly RECORD_MAX_BYTES and under 5 MB", w.length === RECORD_MAX_BYTES && w.length < AUDIO_MAX_BYTES, `(${w.length} bytes)`);
  const w2 = encodeRecording([new Float32Array(RECORD_MAX_SECONDS * 44100).fill(0.1)], 44100);
  check("a 150 s recording at 44.1 kHz is the same size", w2.length === RECORD_MAX_BYTES);
}

console.log(failed ? `\n${failed} check(s) failed` : "\naudio encoder: all checks passed");
if (failed) process.exit(1);

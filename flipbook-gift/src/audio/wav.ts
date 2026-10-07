// WAV encoder for voice recordings (Phase 9, task 9.2).
// Plain TypeScript, no DOM and no imports, so the recorder, the tests and the offline file can all use it.
// A recording becomes 16-bit PCM, mono WAV (44-byte header), which follows the audio format policy.

/** Average several channels into one (a phone microphone normally gives one already). */
export function mixToMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 0) return new Float32Array(0);
  if (channels.length === 1) return channels[0];
  const n = Math.min(...channels.map((c) => c.length));
  const out = new Float32Array(n);
  for (const c of channels) for (let i = 0; i < n; i++) out[i] += c[i];
  for (let i = 0; i < n; i++) out[i] /= channels.length;
  return out;
}

/** Join recorded chunks into one array. */
export function concatChunks(chunks: Float32Array[]): Float32Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Float32Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/**
 * Change the sample rate. Going down, every output sample is the average of the input it covers
 * (a box filter, which also softens frequencies the lower rate cannot hold). Going up or staying
 * the same, it interpolates in a straight line. Output length is floor(n * toRate / fromRate).
 */
export function resampleMono(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (!(fromRate > 0) || !(toRate > 0)) throw new Error("rate");
  if (fromRate === toRate) return input;
  const n = input.length;
  const outLen = Math.floor((n * toRate) / fromRate);
  const out = new Float32Array(outLen);
  if (outLen === 0) return out;
  const ratio = fromRate / toRate;
  if (ratio > 1) {
    for (let i = 0; i < outLen; i++) {
      const start = i * ratio;
      const end = Math.min((i + 1) * ratio, n);
      const first = Math.floor(start);
      const last = Math.min(Math.ceil(end), n);
      let sum = 0;
      let weight = 0;
      for (let j = first; j < last; j++) {
        const w = Math.min(j + 1, end) - Math.max(j, start);
        if (w > 0) {
          sum += input[j] * w;
          weight += w;
        }
      }
      out[i] = weight > 0 ? sum / weight : 0;
    }
  } else {
    for (let i = 0; i < outLen; i++) {
      const pos = i * ratio;
      const j = Math.floor(pos);
      const frac = pos - j;
      const a = input[j];
      const b = j + 1 < n ? input[j + 1] : a;
      out[i] = a + (b - a) * frac;
    }
  }
  return out;
}

/** Float samples (-1 to 1) to 16-bit integers. Out-of-range values are clamped, NaN becomes silence. */
export function floatToPcm16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i];
    if (!(s === s)) s = 0;
    if (s > 1) s = 1;
    else if (s < -1) s = -1;
    out[i] = Math.round(s < 0 ? s * 0x8000 : s * 0x7fff);
  }
  return out;
}

/** Wrap 16-bit mono PCM in a 44-byte WAV header. */
export function encodeWav(pcm: Int16Array, sampleRate: number): Uint8Array {
  const dataBytes = pcm.length * 2;
  const bytes = new Uint8Array(44 + dataBytes);
  const view = new DataView(bytes.buffer);
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i);
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true); // size of the fmt block
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per sample frame
  view.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  view.setUint32(40, dataBytes, true);
  for (let i = 0; i < pcm.length; i++) view.setInt16(44 + i * 2, pcm[i], true);
  return bytes;
}

/**
 * The whole job: recorded chunks (mono, at the microphone's own rate) to a WAV file at `targetRate`
 * (16 kHz by default, the same as RECORD_SAMPLE_RATE in src/lib/audio.ts, which the tests compare).
 * No chunks, or only empty ones, give a valid WAV with no sound; the caller decides whether that is usable.
 */
export function encodeRecording(chunks: Float32Array[], inputRate: number, targetRate = 16_000): Uint8Array {
  const mono = concatChunks(chunks);
  return encodeWav(floatToPcm16(resampleMono(mono, inputRate, targetRate)), targetRate);
}

// Microphone recorder (Phase 9, task 9.3). Plain TypeScript, no React. It records from the microphone, counts seconds,
// stops by itself at the limit, and hands back a finished 16 kHz mono WAV (src/audio/wav.ts).
// Rules: the microphone is ALWAYS released (tracks stopped, audio context closed) on stop, cancel, error and auto-stop;
// every failure is one of five typed errors; nothing here uploads or touches the page.
// Capture: AudioWorklet where available (the processing code is a small inline Blob module), ScriptProcessor as the fallback for old Safari.

import { RECORD_MAX_SECONDS, RECORD_SAMPLE_RATE, recordingSupported } from "../lib/audio";
import { encodeRecording } from "./wav";

export type RecorderErrorKind = "denied" | "no-mic" | "unsupported" | "busy" | "failed";

export interface RecorderError {
  kind: RecorderErrorKind;
  message: string;
}

export interface RecordingResult {
  /** The finished WAV file (type "audio/wav"). */
  blob: Blob;
  /** Length in whole seconds, at least 1 (the server accepts 1 to 180). */
  seconds: number;
  /** True when the recorder stopped by itself at the time limit. */
  autoStopped: boolean;
}

export interface RecorderHandlers {
  /** Called once a second while recording, with the whole seconds recorded so far (1, 2, 3, ...). */
  onTick?: (seconds: number) => void;
  /** Called once with the finished recording after stop() or the automatic stop. Not called after cancel() or an error. */
  onStop?: (result: RecordingResult) => void;
  /** Called once when starting or recording fails. The microphone is already released. */
  onError?: (error: RecorderError) => void;
}

export interface RecorderOptions {
  /** Time limit in seconds. Default RECORD_MAX_SECONDS (150). A shorter value is for tests. */
  maxSeconds?: number;
}

export type RecorderState = "idle" | "starting" | "recording";

export interface Recorder {
  /** Asks for the microphone and starts. Resolves when recording has begun or has failed (the error goes to onError). Ignored if already started. */
  start(): Promise<void>;
  /** Ends the recording and delivers it to onStop. Ignored unless recording. */
  stop(): void;
  /** Throws the recording away and releases the microphone. Safe in any state, also while the permission prompt is open. */
  cancel(): void;
  readonly state: RecorderState;
}

const MESSAGES: Record<RecorderErrorKind, string> = {
  denied: "The microphone is blocked. Allow microphone access for this site in your browser settings, then try again.",
  "no-mic": "No microphone was found on this device.",
  unsupported: "Recording is not available in this browser. You can choose an audio file instead.",
  busy: "The microphone is being used by another app. Close it and try again.",
  failed: "Recording did not work. Please try again.",
};

export function recorderError(kind: RecorderErrorKind): RecorderError {
  return { kind, message: MESSAGES[kind] };
}

/** Turns whatever getUserMedia threw into one of the typed errors. */
export function classifyMicError(e: unknown): RecorderErrorKind {
  const name = e && typeof e === "object" && "name" in e ? String((e as { name: unknown }).name) : "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "no-mic";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "busy";
  return "failed";
}

// Worklet code. It gathers the 128-sample blocks the browser gives it into about 4096 samples before posting,
// so the page is not woken hundreds of times a second. Only the first channel is used (a phone microphone is mono).
const WORKLET_SOURCE = `
class FbaCapture extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Float32Array(4096); this.n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this.buf[this.n++] = ch[i];
        if (this.n === this.buf.length) { this.port.postMessage(this.buf); this.buf = new Float32Array(4096); this.n = 0; }
      }
    }
    return true;
  }
}
registerProcessor("fba-capture", FbaCapture);
`;

type Ctx = AudioContext;

export function createRecorder(handlers: RecorderHandlers = {}, options: RecorderOptions = {}): Recorder {
  const maxSeconds = options.maxSeconds && options.maxSeconds > 0 ? options.maxSeconds : RECORD_MAX_SECONDS;

  let state: RecorderState = "idle";
  let session = 0; // bumped by every start and every cancel, so a late answer from an old attempt is ignored
  let stream: MediaStream | null = null;
  let ctx: Ctx | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let node: AudioNode | null = null;
  let sink: GainNode | null = null;
  let chunks: Float32Array[] = [];
  let samples = 0;
  let rate = 48_000;
  let lastTick = 0;

  /** Stops everything that touches the microphone. Safe to call twice. */
  function release() {
    try { if (node && "port" in node) (node as AudioWorkletNode).port.onmessage = null; } catch { /* ignore */ }
    try { if (node && "onaudioprocess" in node) (node as ScriptProcessorNode).onaudioprocess = null; } catch { /* ignore */ }
    for (const n of [node, source, sink]) { try { n?.disconnect(); } catch { /* ignore */ } }
    node = source = sink = null;
    try { stream?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    stream = null;
    const c = ctx;
    ctx = null;
    if (c && c.state !== "closed") { try { void c.close().catch(() => {}); } catch { /* ignore */ } }
  }

  function reset() {
    chunks = [];
    samples = 0;
    lastTick = 0;
    state = "idle";
  }

  function fail(kind: RecorderErrorKind) {
    release();
    reset();
    handlers.onError?.(recorderError(kind));
  }

  function finish(autoStopped: boolean) {
    const taken = chunks;
    const count = samples;
    const inputRate = rate;
    release();
    reset();
    session++;
    if (count === 0) { handlers.onError?.(recorderError("failed")); return; }
    try {
      const bytes = encodeRecording(taken, inputRate, RECORD_SAMPLE_RATE);
      const seconds = Math.max(1, Math.round(count / inputRate));
      handlers.onStop?.({ blob: new Blob([bytes.buffer as ArrayBuffer], { type: "audio/wav" }), seconds, autoStopped });
    } catch {
      handlers.onError?.(recorderError("failed"));
    }
  }

  /** Called for every block of samples from the microphone. */
  function take(block: Float32Array, mine: number) {
    if (mine !== session || state !== "recording") return;
    let b = block;
    const room = Math.floor(maxSeconds * rate) - samples;
    const hitLimit = b.length >= room;
    if (hitLimit) b = b.subarray(0, Math.max(0, room));
    if (b.length) { chunks.push(b.slice()); samples += b.length; }
    const whole = Math.floor(samples / rate);
    while (lastTick < whole) { lastTick++; try { handlers.onTick?.(lastTick); } catch { /* a bad callback must not stop the recording */ } }
    if (hitLimit && mine === session && state === "recording") finish(true);
  }

  async function start(): Promise<void> {
    if (state !== "idle") return;
    if (!recordingSupported()) { handlers.onError?.(recorderError("unsupported")); return; }
    state = "starting";
    const mine = ++session;
    let gotStream: MediaStream;
    try {
      gotStream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (e) {
      if (mine === session) fail(classifyMicError(e));
      return;
    }
    if (mine !== session) { gotStream.getTracks().forEach((t) => t.stop()); return; } // cancelled while the prompt was open
    stream = gotStream;
    try {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const Ctor = (w.AudioContext || w.webkitAudioContext) as typeof AudioContext;
      ctx = new Ctor();
      if (ctx.state === "suspended") await ctx.resume();
      if (mine !== session) { release(); return; }
      rate = ctx.sampleRate;
      source = ctx.createMediaStreamSource(stream);
      sink = ctx.createGain(); // silent output: the graph must reach the speakers to run, but we must not hear ourselves
      sink.gain.value = 0;
      sink.connect(ctx.destination);

      let usedWorklet = false;
      if (ctx.audioWorklet && typeof AudioWorkletNode === "function") {
        try {
          const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "text/javascript" }));
          try { await ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
          if (mine !== session) { release(); return; }
          const wn = new AudioWorkletNode(ctx, "fba-capture", { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
          wn.port.onmessage = (ev: MessageEvent) => take(ev.data as Float32Array, mine);
          source.connect(wn);
          wn.connect(sink);
          node = wn;
          usedWorklet = true;
        } catch {
          usedWorklet = false; // blocked or unsupported: fall back below
        }
      }
      if (!usedWorklet) {
        const sp = ctx.createScriptProcessor(4096, 1, 1);
        sp.onaudioprocess = (ev: AudioProcessingEvent) => take(ev.inputBuffer.getChannelData(0), mine);
        source.connect(sp);
        sp.connect(sink);
        node = sp;
      }
    } catch {
      if (mine === session) fail("failed");
      else release();
      return;
    }
    // The microphone can be taken away while recording (a call comes in, the device is unplugged).
    for (const t of stream.getAudioTracks()) {
      t.onended = () => { if (mine === session && state === "recording") { if (samples > 0) finish(false); else fail("failed"); } };
    }
    state = "recording";
  }

  return {
    start,
    stop() { if (state === "recording") finish(false); },
    cancel() { session++; release(); reset(); },
    get state() { return state; },
  };
}

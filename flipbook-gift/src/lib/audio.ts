"use client";

export const AUDIO_MAX_BYTES = 5_000_000;
export const AUDIO_MAX_SECONDS = 180;
// Only formats that play on every phone (iPhone Safari included): MP3, M4A, AAC, WAV.
export const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav"] as const;

/** Audio can only be added when uploads are set up (same switch as photos: NEXT_PUBLIC_UPLOADS=1). */
export const AUDIO_ENABLED = process.env.NEXT_PUBLIC_UPLOADS === "1";
export const AUDIO_OFF_REASON = "Audio notes need uploads to be set up on this site, so they are switched off for now.";

// Voice recording in the browser (Phase 9). Recordings are encoded as 16 kHz mono 16-bit WAV
// (32,000 bytes per second), so they follow the format policy above and need no server change.
// 150 s is about 4.8 MB, which stays under AUDIO_MAX_BYTES (5 MB reaches its limit at about 156 s).
export const RECORD_SAMPLE_RATE = 16_000;
export const RECORD_MAX_SECONDS = 150;
export const RECORD_BYTES_PER_SECOND = RECORD_SAMPLE_RATE * 2;
export const RECORD_WAV_HEADER_BYTES = 44;
export const RECORD_MAX_BYTES = RECORD_MAX_SECONDS * RECORD_BYTES_PER_SECOND + RECORD_WAV_HEADER_BYTES;

/**
 * True when this browser can record from the microphone: a secure context (HTTPS or localhost),
 * getUserMedia and the Web Audio API. A function, not a constant, because it must run in the browser
 * (it is false during server rendering).
 */
export function recordingSupported(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (typeof navigator.mediaDevices?.getUserMedia !== "function") return false;
  const w = window as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown };
  return typeof w.AudioContext === "function" || typeof w.webkitAudioContext === "function";
}

export interface AudioUploadTicket {
  uploadUrl: string;
  fields: Record<string, string>;
}

const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".aac", ".wav"] as const;

export function audioFileProblem(file: { type: string; size: number; name?: string }): string | null {
  const ext = file.name ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  if (!AUDIO_TYPES.includes(file.type as (typeof AUDIO_TYPES)[number]) && !AUDIO_EXTENSIONS.includes(ext as (typeof AUDIO_EXTENSIONS)[number])) return "Please choose a supported audio file (MP3, M4A, AAC or WAV).";
  if (file.size <= 0) return "That audio file is empty.";
  if (file.size > AUDIO_MAX_BYTES) return "That audio file is too large. The limit is 5 MB.";
  return null;
}

export function readAudioDuration(file: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      URL.revokeObjectURL(url);
      if (!Number.isFinite(duration) || duration <= 0) reject(new Error("duration"));
      else if (duration > AUDIO_MAX_SECONDS) reject(new Error("too-long"));
      else resolve(Math.round(duration));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("audio"));
    };
    audio.src = url;
  });
}

export function uploadAudio(blob: Blob, onProgress: (fraction: number) => void, fileName = "voice-note"): Promise<string> {
  return new Promise((ok, bad) => {
    fetch("/api/upload-sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "audio", type: blob.type, size: blob.size, name: fileName }),
    })
      .then((r) => { if (r.status === 503) throw new Error("not-set-up"); if (!r.ok) throw new Error("sign"); return r.json() as Promise<AudioUploadTicket>; })
      .then((t) => {
        if (!t || typeof t.uploadUrl !== "string" || typeof t.fields !== "object") throw new Error("sign");
        const form = new FormData();
        for (const [k, v] of Object.entries(t.fields)) form.append(k, v);
        form.append("file", blob, fileName);
        const x = new XMLHttpRequest();
        x.open("POST", t.uploadUrl);
        x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
        x.onerror = () => bad(new Error("network"));
        x.onload = () => {
          try {
            const url = JSON.parse(x.responseText)?.secure_url;
            if (x.status >= 200 && x.status < 300 && typeof url === "string" && url.startsWith("https://")) {
              onProgress(1);
              ok(url);
            } else bad(new Error("upload"));
          } catch { bad(new Error("upload")); }
        };
        x.send(form);
      })
      .catch(bad);
  });
}

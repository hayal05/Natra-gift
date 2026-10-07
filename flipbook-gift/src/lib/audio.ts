"use client";

import { UPLOADS_ENABLED } from "./photo";

export const AUDIO_MAX_BYTES = 5_000_000;
export const AUDIO_MAX_SECONDS = 180;
export const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/aac", "audio/flac"] as const;

export interface AudioUploadTicket {
  uploadUrl: string;
  fields: Record<string, string>;
}

const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".wav", ".ogg", ".webm", ".aac", ".flac"] as const;

export function audioFileProblem(file: { type: string; size: number; name?: string }): string | null {
  const ext = file.name ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  if (!AUDIO_TYPES.includes(file.type as (typeof AUDIO_TYPES)[number]) && !AUDIO_EXTENSIONS.includes(ext as (typeof AUDIO_EXTENSIONS)[number])) return "Please choose a supported audio file (MP3, M4A, WAV, OGG, AAC or FLAC).";
  if (file.size <= 0) return "That audio file is empty.";
  if (file.size > AUDIO_MAX_BYTES) return "That audio file is too large. The limit is 5 MB.";
  if (!UPLOADS_ENABLED) return "Audio uploads are not enabled yet.";
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
      .then((r) => { if (!r.ok) throw new Error("sign"); return r.json() as Promise<AudioUploadTicket>; })
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

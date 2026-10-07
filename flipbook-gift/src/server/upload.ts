// Cloudinary signed uploads (task 4.2). The browser asks us for a ticket, then posts the file straight to Cloudinary.
// The signature covers the folder, the allowed format and the timestamp, so a ticket cannot be reused for other settings and expires on Cloudinary's side.
import { createHash } from "node:crypto";

export const UPLOAD_LIMITS = {
  photo: { maxBytes: 5_000_000, types: ["image/jpeg"] as string[], folder: "flipbook", formats: "jpg", resourceType: "image" },
  audio: { maxBytes: 5_000_000, types: ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav"] as string[], folder: "flipbook-audio", formats: "mp3,m4a,aac,wav", resourceType: "video" },
};

/** Cloudinary's rule: sort the parameters by name, join as name=value with &, append the API secret, SHA-1 as hex. */
export const sign = (params: Record<string, string | number>, secret: string): string =>
  createHash("sha1").update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + secret).digest("hex");

export interface Ticket { uploadUrl: string; fields: Record<string, string> }
export type Env = { CLOUDINARY_CLOUD_NAME?: string; CLOUDINARY_API_KEY?: string; CLOUDINARY_API_SECRET?: string };

/** The browser shrinks every photo to a JPEG, so only JPEG up to 5 MB is signed. The size is what the browser says it is;
 *  Cloudinary's own account limit is the hard stop (set the account's max file size to match). */
export function makeTicket(input: unknown, env: Env, nowSeconds = Math.floor(Date.now() / 1000)): { ok: true; ticket: Ticket } | { ok: false; status: number; message: string } {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = env;
  if (!cloud || !key || !secret) return { ok: false, status: 503, message: "Uploads are not set up." };

  const i = input as { kind?: unknown; type?: unknown; size?: unknown; name?: unknown } | null;
  const kind = i?.kind === "audio" ? "audio" : i?.kind === "photo" ? "photo" : "photo";
  const rules = UPLOAD_LIMITS[kind];
  const name = typeof i?.name === "string" ? i.name.toLowerCase() : "";
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const audioExts = [".mp3", ".m4a", ".aac", ".wav"];
  const typeOk = typeof i?.type === "string" && rules.types.includes(i.type);
  const extOk = kind === "audio" && audioExts.includes(ext);

  if (!i || (!typeOk && !extOk)) {
    return { ok: false, status: 400, message: kind === "audio" ? "That audio format is not supported. Use MP3, M4A, AAC or WAV." : "Only JPEG photos can be uploaded." };
  }
  if (typeof i.size !== "number" || !Number.isFinite(i.size) || i.size <= 0 || i.size > rules.maxBytes) {
    return { ok: false, status: 400, message: kind === "audio" ? "That audio file is too large." : "That photo is too large." };
  }

  const signed = { allowed_formats: rules.formats, folder: rules.folder, timestamp: nowSeconds };
  return {
    ok: true,
    ticket: {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloud}/${rules.resourceType}/upload`,
      fields: {
        ...Object.fromEntries(Object.entries(signed).map(([k, v]) => [k, String(v)])),
        api_key: key,
        signature: sign(signed, secret),
      },
    },
  };
}

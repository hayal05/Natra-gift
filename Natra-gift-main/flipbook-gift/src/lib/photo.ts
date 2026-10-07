// Browser-side photo handling (task 3.8): shrink a picked photo before it is stored or uploaded, and send it to
// Cloudinary with progress. No React here. Resizing is always on; uploading is off until the signing route from
// task 4.2 exists (set NEXT_PUBLIC_UPLOADS=1 then), so nothing pretends to upload.

/** Longest side after shrinking, in pixels, and JPEG quality. About 150 to 400 KB for a typical phone photo. */
export const PHOTO_MAX_SIDE = 1600;
export const PHOTO_QUALITY = 0.82;

export const UPLOADS_ENABLED = process.env.NEXT_PUBLIC_UPLOADS === "1";

/** Size that fits inside max x max and keeps the shape. Never enlarges. */
export function fitWithin(w: number, h: number, max: number): { w: number; h: number } {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/** Decodes a picked file, turned upright by its camera orientation where the browser supports that. */
async function decode(file: Blob): Promise<{ img: CanvasImageSource; w: number; h: number; done: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const b = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { img: b, w: b.width, h: b.height, done: () => b.close() };
    } catch { /* fall through to the <img> route */ }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(new Error("decode")); img.src = url; });
  return { img, w: img.naturalWidth, h: img.naturalHeight, done: () => URL.revokeObjectURL(url) };
}

/** Shrinks a photo to JPEG with its longest side at most `maxSide`. Rejects when the file cannot be decoded as a picture. */
export async function resizePhoto(file: Blob, maxSide = PHOTO_MAX_SIDE, quality = PHOTO_QUALITY): Promise<{ blob: Blob; width: number; height: number }> {
  const d = await decode(file);
  try {
    const { w, h } = fitWithin(d.w, d.h, maxSide);
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const c = cv.getContext("2d");
    if (!c) throw new Error("canvas");
    c.fillStyle = "#fff"; // transparent PNGs become white, as JPEG has no transparency
    c.fillRect(0, 0, w, h);
    c.imageSmoothingQuality = "high";
    c.drawImage(d.img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((ok) => cv.toBlob(ok, "image/jpeg", quality));
    if (!blob) throw new Error("encode");
    return { blob, width: w, height: h };
  } finally { d.done(); }
}

export const blobToDataUri = (b: Blob): Promise<string> => new Promise((ok, bad) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result));
  r.onerror = () => bad(new Error("read"));
  r.readAsDataURL(b);
});

/** What POST /api/upload-sign (task 4.2) must return: where to send the file and the signed form fields to send with it. */
export interface UploadTicket { uploadUrl: string; fields: Record<string, string> }

/** Uploads a photo to Cloudinary with a signed ticket from our own server and returns its https URL. `onProgress` gets 0 to 1. */
export function uploadPhoto(blob: Blob, onProgress: (fraction: number) => void): Promise<string> {
  return new Promise((ok, bad) => {
    fetch("/api/upload-sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: blob.type, size: blob.size }) })
      .then((r) => { if (!r.ok) throw new Error("sign"); return r.json() as Promise<UploadTicket>; })
      .then((t) => {
        if (!t || typeof t.uploadUrl !== "string" || typeof t.fields !== "object") throw new Error("sign");
        const form = new FormData();
        for (const [k, v] of Object.entries(t.fields)) form.append(k, v);
        form.append("file", blob, "photo.jpg"); // Cloudinary wants the file last
        const x = new XMLHttpRequest();
        x.open("POST", t.uploadUrl);
        x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
        x.onerror = () => bad(new Error("network"));
        x.onload = () => {
          try {
            const url = JSON.parse(x.responseText)?.secure_url;
            if (x.status >= 200 && x.status < 300 && typeof url === "string" && url.startsWith("https://")) { onProgress(1); ok(url); } else bad(new Error("upload"));
          } catch { bad(new Error("upload")); }
        };
        x.send(form);
      })
      .catch(bad);
  });
}

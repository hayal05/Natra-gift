"use client";
// Crop locally before a photo is uploaded or inserted. The frame matches the target page photo box.
import { useEffect, useRef, useState } from "react";

type Props = {
  file: File;
  aspect: number;
  onCancel: () => void;
  onConfirm: (cropped: Blob) => void;
};
const clamp = (value: number) => Math.max(-1, Math.min(1, value));

export default function PhotoCropDialog({ file, aspect, onCancel, onConfirm }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const ratio = Math.max(0.2, Math.min(5, aspect));
  const previewW = 600, previewH = Math.round(previewW / ratio);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    image.current = null;
    setReady(false);
    setError(false);
    img.onload = () => { image.current = img; setReady(true); };
    img.onerror = () => setError(true);
    img.src = url;
    return () => { img.onload = null; img.onerror = null; image.current = null; URL.revokeObjectURL(url); };
  }, [file]);

  // The same cover/zoom/pan calculation is used for preview, drag limits and the final JPEG.
  const geometry = (w: number, h: number, z: number) => {
    const img = image.current;
    if (!img) return { dw: w, dh: h, overflowX: 0, overflowY: 0 };
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * z;
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    return { dw, dh, overflowX: Math.max(0, dw - w), overflowY: Math.max(0, dh - h) };
  };

  useEffect(() => {
    const cv = canvas.current, img = image.current;
    if (!cv || !img || !ready) return;
    const context = cv.getContext("2d");
    if (!context) return;
    const { dw, dh, overflowX, overflowY } = geometry(cv.width, cv.height, zoom);
    context.clearRect(0, 0, cv.width, cv.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(img, (cv.width - dw) / 2 - pan.x * overflowX / 2, (cv.height - dh) / 2 - pan.y * overflowY / 2, dw, dh);
  }, [ready, zoom, pan, previewH]);

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    e.preventDefault();
    pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const origin = pointer.current, cv = canvas.current;
    if (!origin || !cv || origin.id !== e.pointerId) return;
    e.preventDefault();
    const rect = cv.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const over = geometry(previewW, previewH, zoom);
    const dx = (e.clientX - origin.x) * previewW / rect.width;
    const dy = (e.clientY - origin.y) * previewH / rect.height;
    setPan({
      x: over.overflowX ? clamp(origin.panX - dx * 2 / over.overflowX) : 0,
      y: over.overflowY ? clamp(origin.panY - dy * 2 / over.overflowY) : 0,
    });
  };
  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointer.current?.id === e.pointerId) pointer.current = null;
  };

  const confirm = async () => {
    const img = image.current;
    if (!img || saving) return;
    setSaving(true);
    try {
      // Downsample to a manageable, shareable photo; no bytes leave the device until confirmation.
      const outputScale = Math.min(1, 1600 / Math.max(previewW, previewH));
      const w = Math.max(1, Math.round(previewW * outputScale));
      const h = Math.max(1, Math.round(previewH * outputScale));
      // Preview is at 600px across; retain full available crop resolution up to 1600px.
      const factor = Math.min(1600 / previewW, 1600 / previewH);
      const outW = Math.max(w, Math.round(previewW * factor));
      const outH = Math.max(h, Math.round(previewH * factor));
      const cv = document.createElement("canvas");
      cv.width = outW; cv.height = outH;
      const ctx = cv.getContext("2d");
      if (!ctx) throw new Error("canvas");
      const { dw, dh, overflowX, overflowY } = geometry(outW, outH, zoom);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, outW, outH);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (outW - dw) / 2 - pan.x * overflowX / 2, (outH - dh) / 2 - pan.y * overflowY / 2, dw, dh);
      const blob = await new Promise<Blob | null>((resolve) => cv.toBlob(resolve, "image/jpeg", 0.88));
      if (!blob) throw new Error("encode");
      onConfirm(blob);
    } catch { setError(true); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3" role="dialog" aria-modal="true" aria-label="Crop photo before adding">
      <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl bg-white p-4 shadow-2xl">
        <div className="w-full">
          <h2 className="text-base font-bold text-stone-900">Crop & frame photo</h2>
          <p className="text-xs text-stone-600">Drag to choose what's included. Zoom to crop more closely.</p>
        </div>
        <canvas ref={canvas} width={previewW} height={previewH} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
          className="block max-w-full touch-none rounded-lg border-2 border-rose-600 bg-stone-100 shadow-sm"
          style={{ width: `min(82vw, 340px, ${Math.round(48 * ratio)}dvh)`, aspectRatio: String(ratio), cursor: ready ? "grab" : "default" }}
          aria-label="Crop preview. Drag to reposition the photo" />
        {!ready && !error && <p role="status" className="text-xs text-stone-600">Opening photo…</p>}
        {error && <p role="alert" className="text-xs text-red-700">Couldn't prepare the crop. Please choose another photo.</p>}
        <div className="flex w-full items-center gap-3">
          <label htmlFor="pre-photo-zoom" className="text-xs font-bold text-stone-700">Zoom</label>
          <input id="pre-photo-zoom" type="range" min={1} max={3} step={0.05} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))} disabled={!ready || saving} className="min-w-0 flex-1 accent-rose-700" />
          <span className="w-10 text-xs tabular-nums">{zoom.toFixed(2)}×</span>
          <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} disabled={saving} className="text-xs font-semibold text-rose-700">Reset</button>
        </div>
        <div className="flex w-full gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className="min-h-11 flex-1 rounded-lg border border-stone-300 text-sm font-bold text-stone-700 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={() => void confirm()} disabled={!ready || saving || error}
            className="min-h-11 flex-1 rounded-lg bg-rose-700 text-sm font-bold text-white disabled:opacity-50">{saving ? "Preparing…" : "Use this crop"}</button>
        </div>
      </div>
    </div>
  );
}

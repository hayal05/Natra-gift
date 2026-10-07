// Fullscreen API helpers shared by the recipient page (5.3) and the offline file (6.1). Nothing here throws:
// iPhone Safari has no element fullscreen, and a browser may refuse; the fixed full-viewport layout is then all there is.
type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void; webkitFullscreenEnabled?: boolean };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

export const fsElement = (): Element | null => (document as FsDoc).fullscreenElement ?? (document as FsDoc).webkitFullscreenElement ?? null;
export const fsSupported = (): boolean => !!(document.fullscreenEnabled || (document as FsDoc).webkitFullscreenEnabled);

export async function enterFullscreen(el: HTMLElement): Promise<void> {
  try {
    if (fsElement()) return;
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
    else await (el as FsEl).webkitRequestFullscreen?.();
  } catch { /* stay in the fixed layout */ }
}

export async function leaveFullscreen(): Promise<void> {
  try {
    if (!fsElement()) return;
    if (document.exitFullscreen) await document.exitFullscreen();
    else await (document as FsDoc).webkitExitFullscreen?.();
  } catch { /* nothing to do */ }
}

/** Calls `fn` whenever fullscreen starts or ends (standard and webkit events). Returns the unsubscribe function. */
export function onFullscreenChange(fn: () => void): () => void {
  document.addEventListener("fullscreenchange", fn);
  document.addEventListener("webkitfullscreenchange", fn);
  return () => { document.removeEventListener("fullscreenchange", fn); document.removeEventListener("webkitfullscreenchange", fn); };
}

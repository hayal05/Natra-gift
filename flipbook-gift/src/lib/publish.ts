// Publish client: POST the finished draft to the server and return the server's
// safe validation/error message when publishing fails.
import type { Draft } from "./draft";
import { isSample, type PageData } from "./pages";

export const PUBLISH_ENABLED = process.env.NEXT_PUBLIC_PUBLISH === "1";

export type PublishResult = { ok: true; giftUrl: string; editUrl: string } | { ok: false; message: string };
export type Publisher = (draft: Draft) => Promise<PublishResult>;

export const countSamples = (pages: PageData[]): number =>
  pages.reduce((n, p) => n + Object.values(p.slots).filter((v) => typeof v !== "string" && isSample(v.src)).length, 0);

/** Added photos (10.8e) that still have no picture: the recipient would see only an empty frame. */
export const countEmptyPhotos = (pages: PageData[]): number =>
  pages.reduce((n, p) => n + (p.extras ?? []).filter((e) => { const v = e.kind === "photo" ? p.slots[e.id] : undefined; return typeof v === "object" && !v.src; }).length, 0);

export const publishGift: Publisher = async (draft) => {
  if (!PUBLISH_ENABLED) return { ok: false, message: "Publishing is not available yet." };
  try {
    const res = await fetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => null);

    if (res.ok && typeof data?.giftUrl === "string" && typeof data?.editUrl === "string") {
      return { ok: true, giftUrl: data.giftUrl, editUrl: data.editUrl };
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return { ok: false, message: data.message };
    }

    return {
      ok: false,
      message: res.status >= 500
        ? "The server could not publish your gift. Please check the deployment logs."
        : "We could not publish your gift. Please try again.",
    };
  } catch {
    return { ok: false, message: "We could not reach the server. Check your connection and try again." };
  }
};

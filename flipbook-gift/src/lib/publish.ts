// Publish client (task 3.9). The server (tasks 4.1 and 4.2) does not exist yet, so publishing is OFF unless NEXT_PUBLIC_PUBLISH=1.
// Provisional contract for 4.1: POST /api/gifts with the draft as JSON, answer { giftUrl, editUrl } (both absolute https URLs).
import type { Draft } from "./draft";
import { isSample, type PageData } from "./pages";

export const PUBLISH_ENABLED = process.env.NEXT_PUBLIC_PUBLISH === "1";

export type PublishResult = { ok: true; giftUrl: string; editUrl: string } | { ok: false; message: string };
export type Publisher = (draft: Draft) => Promise<PublishResult>;

/** How many photo slots still show a built-in sample picture (the publish step warns about them). */
export const countSamples = (pages: PageData[]): number =>
  pages.reduce((n, p) => n + Object.values(p.slots).filter((v) => typeof v !== "string" && isSample(v.src)).length, 0);

export const publishGift: Publisher = async (draft) => {
  if (!PUBLISH_ENABLED) return { ok: false, message: "Publishing is not available yet." };
  try {
    const res = await fetch("/api/gifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await res.json().catch(() => null);
    if (!res.ok || typeof data?.giftUrl !== "string" || typeof data?.editUrl !== "string") return { ok: false, message: "We could not publish your gift. Please try again." };
    return { ok: true, giftUrl: data.giftUrl, editUrl: data.editUrl };
  } catch { return { ok: false, message: "We could not reach the server. Check your connection and try again." }; }
};
